import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // If Stripe secret key is configured, create real Stripe Checkout session
    if (process.env.STRIPE_SECRET_KEY) {
      // Lazy import to avoid crash if not installed
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-06-20' as any,
      });

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'FundTracker Lifetime Supporter',
                description: 'Support independent, privacy-focused open source software with zero ads.',
              },
              unit_amount: 1499, // $14.99 one-time supporter badge
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${appUrl}/settings?supporter=success`,
        cancel_url: `${appUrl}/settings?supporter=cancelled`,
        metadata: {
          userId: auth.userId,
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // In local development without Stripe keys, return test mock checkout link
    return NextResponse.json({
      url: `${appUrl}/settings?supporter=test_mode_success`,
      is_test_mode: true,
      message: 'Running in test simulation mode. Configure STRIPE_SECRET_KEY in .env.local to activate real Checkout.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Checkout Error' }, { status: 500 });
  }
}
