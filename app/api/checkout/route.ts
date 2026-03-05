import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import PocketBase from 'pocketbase';
import { APP_SESSION_COOKIE, PB_TOKEN_COOKIE, verifySessionToken } from '@/lib/session';
import { canAccessBilling } from '@/lib/access';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pb.afrigini.com';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(APP_SESSION_COOKIE)?.value;
    const sessionData = sessionCookie ? await verifySessionToken(sessionCookie) : null;
    const cookiePbToken = request.cookies.get(PB_TOKEN_COOKIE)?.value;
    const authHeader = request.headers.get('authorization') || '';
    const bearerPbToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const pbToken = cookiePbToken || bearerPbToken;

    if (!pbToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const pb = new PocketBase(PB_URL);
    pb.authStore.save(pbToken, null);
    let authenticatedUserId = sessionData?.userId ?? '';
    let authenticatedEmail = sessionData?.email ?? '';

    if (!authenticatedUserId) {
      try {
        const authData = await pb.collection('users').authRefresh({ requestKey: null });
        authenticatedUserId = authData?.record?.id || '';
        authenticatedEmail = authData?.record?.email || authenticatedEmail;
      } catch {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orgId, priceId } = body;

    if (!orgId || !priceId) {
      return NextResponse.json(
        { error: 'Missing orgId or priceId' },
        { status: 400 }
      );
    }

    let membership;
    try {
      membership = await pb.collection('org_members').getFirstListItem(
        `user = "${authenticatedUserId}" && organization = "${orgId}"`,
        { requestKey: null }
      );
    } catch {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (!canAccessBilling(membership.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    let org;
    try {
      org = await pb.collection('organizations').getOne(orgId);
    } catch (err) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    let customerId = org.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: authenticatedEmail || undefined,
        name: org.name || undefined,
        metadata: {
          orgId: orgId,
        },
      });

      customerId = customer.id;

      await pb.collection('organizations').update(orgId, {
        stripe_customer_id: customerId,
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      client_reference_id: orgId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        orgId: orgId,
        price_id: priceId,
      },
      payment_intent_data: {
        metadata: {
          orgId: orgId,
          price_id: priceId,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/org/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/org/billing?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });

  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
