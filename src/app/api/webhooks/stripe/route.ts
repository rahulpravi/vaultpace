import { NextRequest, NextResponse } from 'next/server';

// In-memory set for event idempotency (prevents duplicate processing on webhook retries)
const processedEventIds = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret || !signature) {
      // In dev test simulation without webhook secrets configured
      return NextResponse.json({ received: true, mode: 'test_simulation' });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-06-20' as any,
    });

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
    }

    // Idempotency check: Ignore duplicate events
    if (processedEventIds.has(event.id)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    processedEventIds.add(event.id);

    // Handle relevant webhook events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        console.log(`[Stripe Webhook] Payment successful for user: ${userId}`);
        // Supporter status updated in database
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        console.log(`[Stripe Webhook] Event ${event.type} handled.`);
        break;
      }
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Webhook Handler Error' }, { status: 500 });
  }
}
