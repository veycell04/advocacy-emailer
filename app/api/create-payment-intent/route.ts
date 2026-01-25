import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16', // Use stable version or your current one
});

// Pricing breakdown (in cents)
// Matches Frontend: Letter ($2.00), Fax ($1.00), Both ($3.00)
const PRICES = {
    letter: 200, 
    fax: 100,     
    both: 300     
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { actionType, senatorCount } = body; 

    // --- CRITICAL FIX: Ensure 'both' is allowed ---
    if (!actionType || !['letter', 'fax', 'both'].includes(actionType) || !senatorCount || senatorCount < 1) {
        return NextResponse.json({ error: 'Invalid payment request data.' }, { status: 400 });
    }

    // Calculate total price in cents
    const unitPrice = PRICES[actionType as keyof typeof PRICES];
    const totalAmount = unitPrice * senatorCount;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      metadata: {
        actionType: actionType,
        senatorCount: senatorCount.toString()
      },
      automatic_payment_methods: {
        enabled: true, 
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, totalAmount: totalAmount });

  } catch (error: any) {
    console.error('Stripe Payment Intent Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}