import { NextResponse, type NextRequest } from 'next/server';
import { getStripe } from '@/lib/stripe';
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

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
  const supabaseService = createServerClient(supabaseUrl, serviceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

  const { data: sub } = await supabaseService.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).single();

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: 'Aucun abonnement Stripe trouvé' }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${request.nextUrl.origin}/demo`,
  });

  return NextResponse.json({ url: session.url });
}
