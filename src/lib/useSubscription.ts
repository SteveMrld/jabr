'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { PLANS, type PricingPlan } from './stripe';

// ═══════════════════════════════════
// SUBSCRIPTION STATE
// ═══════════════════════════════════

export interface Subscription {
  planId: string;
  plan: PricingPlan;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  billingPeriod: 'monthly' | 'annual';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

const FREE_PLAN = PLANS[0]; // Découverte

const DEFAULT_SUB: Subscription = {
  planId: 'free',
  plan: FREE_PLAN,
  status: 'active',
  billingPeriod: 'monthly',
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  stripeCustomerId: null,
};

export function useSubscription(userId: string | null) {
  const [subscription, setSubscription] = useState<Subscription>(DEFAULT_SUB);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId || !isSupabaseConfigured()) {
      // No auth = unlimited (dev/demo mode)
      const unlimitedPlan: PricingPlan = {
        ...PLANS[2], // Éditeur plan
        id: 'demo',
        name: 'Démo',
        price: 0,
        priceAnnual: 0,
        stripePriceIdMonthly: '',
        stripePriceIdAnnual: '',
      };
      setSubscription({ ...DEFAULT_SUB, plan: unlimitedPlan, planId: 'demo' });
      setLoading(false);
      return;
    }

    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }

    try {
      const { data, error } = await sb
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        const plan = PLANS.find(p => p.id === data.plan_id) || FREE_PLAN;
        setSubscription({
          planId: data.plan_id,
          plan,
          status: data.status,
          billingPeriod: data.billing_period || 'monthly',
          currentPeriodEnd: data.current_period_end,
          cancelAtPeriodEnd: data.cancel_at_period_end || false,
          stripeCustomerId: data.stripe_customer_id,
        });
      }
    } catch (err) {
      console.warn('Subscription load error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Limit checks
  const canCreateProject = useCallback((currentCount: number) => {
    const limit = subscription.plan.limits.projects;
    return limit === -1 || currentCount < limit;
  }, [subscription]);

  const canCreateAuthor = useCallback((currentCount: number) => {
    const limit = subscription.plan.limits.authors;
    return limit === -1 || currentCount < limit;
  }, [subscription]);

  const canUseAI = useCallback((monthlyCount: number) => {
    const limit = subscription.plan.limits.aiAnalyses;
    return limit === -1 || monthlyCount < limit;
  }, [subscription]);

  const canGenerateMediaPlan = useCallback((monthlyCount: number) => {
    const limit = subscription.plan.limits.mediaPlans;
    return limit === -1 || monthlyCount < limit;
  }, [subscription]);

  const isPaid = subscription.planId !== 'free' && subscription.planId !== 'demo';
  const isFree = subscription.planId === 'free';

  // Checkout redirect
  const checkout = useCallback(async (planId: string, billing: 'monthly' | 'annual' = 'monthly') => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billing }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      return { error: data.error || null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erreur checkout' };
    }
  }, []);

  // Portal redirect
  const openPortal = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      return { error: data.error || null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erreur portail' };
    }
  }, []);

  return {
    subscription, loading,
    isPaid, isFree,
    canCreateProject, canCreateAuthor, canUseAI, canGenerateMediaPlan,
    checkout, openPortal, reload: load,
  };
}
