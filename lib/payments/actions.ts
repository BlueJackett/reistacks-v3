// lib/payments/actions.ts
'use server';

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function checkoutAction(formData: FormData) {
  const priceId = formData.get('priceId') as string;

  if (!priceId) {
    return { error: 'Price ID is required' };
  }

  try {
    console.log('Creating checkout session with priceId:', priceId);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
    });

    console.log('Checkout session created:', session.id);

    // Return the session URL for redirection
    if (session.url) {
      return { url: session.url };
    } else {
      return { error: 'Failed to create checkout session URL' };
    }
  } catch (error) {
    console.error('Stripe API Error:', error);
    return { error: 'Failed to create checkout session' };
  }
}