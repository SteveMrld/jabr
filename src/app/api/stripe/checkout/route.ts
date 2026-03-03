import { NextResponse, type NextRequest } from 'next/server';
import { getStripe, getPlanById } from '@/lib/stripe';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll().map(c => ({ name: c.name, value: c.value })),
      setAll: () => {},
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json();
  const { planId, billing = 'monthly' } = body as { planId: string; billing?: 'monthly' | 'annual' };

  const plan = getPlanById(planId);
  if (!plan || plan.id === 'free') return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });

  const priceId = billing === 'annual' ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly;
  if (!priceId) return NextResponse.json({ error: 'Prix Stripe non configuré' }, { status: 400 });

  // Get or create Stripe customer
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
  const supabaseService = createServerClient(supabaseUrl, serviceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

  const { data: sub } = await supabaseService.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).single();

  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await supabaseService.from('subscriptions').update({ stripe_customer_id: customerId }).eq('user_id', user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${request.nextUrl.origin}/demo?upgraded=true`,
    cancel_url: `${request.nextUrl.origin}/pricing`,
    metadata: { user_id: user.id, plan_id: planId },
    subscription_data: { metadata: { user_id: user.id, plan_id: planId } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
