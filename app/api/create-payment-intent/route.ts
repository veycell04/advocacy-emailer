import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);


// Pricing breakdown (in cents)
const PRICES = {
    letter: 110, // $1.10 per letter (covers Lob cost + tiny buffer for Stripe fees)
    fax: 25,     // $0.25 per fax (covers Twilio cost + tiny buffer)
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { actionType, senatorCount } = body; // 'letter' or 'fax', and number of senators (usually 2)

    if (!actionType || !['letter', 'fax'].includes(actionType) || !senatorCount || senatorCount < 1) {
        return NextResponse.json({ error: 'Invalid payment request data.' }, { status: 400 });
    }

    // Calculate total price in cents
    const unitPrice = PRICES[actionType as keyof typeof PRICES];
    const totalAmount = unitPrice * senatorCount;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      // In the metadata, we store what the user is buying so we know what to do after they pay.
      metadata: {
        actionType: actionType,
        senatorCount: senatorCount.toString()
      },
      automatic_payment_methods: {
        enabled: true, // This enables Apple Pay / Google Pay automatically
      },
    });

    // Send the "client secret" to the frontend. This is the key the frontend needs to show the payment form.
    return NextResponse.json({ clientSecret: paymentIntent.client_secret, totalAmount: totalAmount });

  } catch (error: any) {
    console.error('Stripe Payment Intent Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}