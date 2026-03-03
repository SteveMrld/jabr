import { NextResponse, type NextRequest } from 'next/server';
import { getStripe, getPlanByStripePriceId } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role for webhook (no user session)
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 });

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Signature invalide';
    console.error('[Stripe Webhook] Signature error:', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;
        if (!userId || !planId) break;

        const subscriptionId = session.subscription as string;
        const sub = await stripe.subscriptions.retrieve(subscriptionId) as unknown as { current_period_start: number; current_period_end: number; cancel_at_period_end: boolean; items: { data: Array<{ price?: { id?: string; recurring?: { interval?: string } } }> } };
        const priceId = sub.items.data[0]?.price?.id;
        const plan = priceId ? getPlanByStripePriceId(priceId) : null;

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          plan_id: plan?.id || planId,
          status: 'active',
          billing_period: sub.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        }, { onConflict: 'user_id' });

        console.log(`[Stripe] User ${userId} upgraded to ${planId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as unknown as { id: string; status: string; metadata?: { user_id?: string }; cancel_at_period_end: boolean; current_period_start: number; current_period_end: number; items: { data: Array<{ price?: { id?: string; recurring?: { interval?: string } } }> } };
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        const priceId = sub.items.data[0]?.price?.id;
        const plan = priceId ? getPlanByStripePriceId(priceId) : null;

        const statusMap: Record<string, string> = {
          active: 'active', trialing: 'trialing', past_due: 'past_due',
          canceled: 'canceled', incomplete: 'incomplete',
        };

        await supabase.from('subscriptions').update({
          plan_id: plan?.id || 'free',
          status: statusMap[sub.status] || 'active',
          billing_period: sub.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        }).eq('stripe_subscription_id', sub.id);

        console.log(`[Stripe] Subscription ${sub.id} updated → ${sub.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as unknown as { id: string; metadata?: { user_id?: string } };
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        await supabase.from('subscriptions').update({
          plan_id: 'free',
          status: 'canceled',
          stripe_subscription_id: null,
          cancel_at_period_end: false,
        }).eq('stripe_subscription_id', sub.id);

        console.log(`[Stripe] Subscription ${sub.id} canceled → free`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription as string;
        if (!subId) break;

        await supabase.from('subscriptions').update({
          status: 'past_due',
        }).eq('stripe_subscription_id', subId);

        console.log(`[Stripe] Payment failed for subscription ${subId}`);
        break;
      }
    }
  } catch (err) {
    console.error('[Stripe Webhook] Processing error:', err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
