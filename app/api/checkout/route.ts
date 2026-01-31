import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import PocketBase from 'pocketbase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const pb = new PocketBase('https://pb.afrigini.com');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, priceId, userEmail, orgName } = body;

    if (!orgId || !priceId) {
      return NextResponse.json(
        { error: 'Missing orgId or priceId' },
        { status: 400 }
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
        email: userEmail || undefined,
        name: orgName || org.name || undefined,
        metadata: {
          orgId: orgId,
        },
      });

      customerId = customer.id;

      await pb.collection('organizations').update(orgId, {
        stripe_customer_id: customerId,
      });
    }

    const session = await stripe.checkout.sessions.create({
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

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}