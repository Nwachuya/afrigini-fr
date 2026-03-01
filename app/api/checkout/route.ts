import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import PocketBase from 'pocketbase';
import { APP_SESSION_COOKIE, PB_TOKEN_COOKIE, verifySessionToken } from '@/lib/session';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pb.afrigini.com';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(APP_SESSION_COOKIE)?.value;
    const pbToken = request.cookies.get(PB_TOKEN_COOKIE)?.value;
    const authenticatedSession = sessionCookie ? await verifySessionToken(sessionCookie) : null;

    if (!authenticatedSession || !pbToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const pb = new PocketBase(PB_URL);
    pb.authStore.save(pbToken, null);

    const body = await request.json();
    const { orgId, priceId } = body;

    if (!orgId || !priceId) {
      return NextResponse.json(
        { error: 'Missing orgId or priceId' },
        { status: 400 }
      );
    }

    try {
      await pb.collection('org_members').getFirstListItem(
        `user = "${authenticatedSession.userId}" && organization = "${orgId}"`,
        { requestKey: null }
      );
    } catch {
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
        email: authenticatedSession.email || undefined,
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
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
