import Stripe from 'stripe';

// ═══════════════════════════════════
// STRIPE CONFIG — Server-side only
// ═══════════════════════════════════

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!stripeSecretKey) return null;
  if (!_stripe) {
    _stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion });
  }
  return _stripe;
}

export const isStripeConfigured = () => !!stripeSecretKey;

// ═══════════════════════════════════
// PLANS
// ═══════════════════════════════════

export interface PricingPlan {
  id: string;
  name: string;
  price: number; // €/month
  priceAnnual: number; // €/year
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
  features: string[];
  limits: {
    projects: number; // -1 = unlimited
    authors: number;
    mediaPlans: number;
    aiAnalyses: number; // per month
    storage: number; // MB
  };
  popular?: boolean;
}

export const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Découverte',
    price: 0,
    priceAnnual: 0,
    stripePriceIdMonthly: '',
    stripePriceIdAnnual: '',
    features: [
      '3 projets',
      '1 auteur',
      '1 plan média / mois',
      'Scanner manuscrit',
      'Calibrage couverture',
      'Export catalogue CSV',
    ],
    limits: { projects: 3, authors: 1, mediaPlans: 1, aiAnalyses: 3, storage: 50 },
  },
  {
    id: 'solo',
    name: 'Solo',
    price: 19,
    priceAnnual: 190,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_SOLO_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_SOLO_ANNUAL || '',
    features: [
      '15 projets',
      '3 auteurs',
      'Plans média illimités',
      'Analyse IA avancée',
      'ONIX 3.0 export',
      'Pitch deck IA',
      'Support email',
    ],
    limits: { projects: 15, authors: 3, mediaPlans: -1, aiAnalyses: 20, storage: 500 },
    popular: true,
  },
  {
    id: 'editeur',
    name: 'Éditeur',
    price: 49,
    priceAnnual: 490,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_EDITEUR_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_EDITEUR_ANNUAL || '',
    features: [
      'Projets illimités',
      'Auteurs illimités',
      'Plans média illimités',
      'Analyse IA illimitée',
      'ONIX 3.0 + Distribution',
      'Pitch deck + Presse IA',
      'API accès',
      'Support prioritaire',
    ],
    limits: { projects: -1, authors: -1, mediaPlans: -1, aiAnalyses: -1, storage: 5000 },
  },
];

export function getPlanById(id: string): PricingPlan | undefined {
  return PLANS.find(p => p.id === id);
}

export function getPlanByStripePriceId(priceId: string): PricingPlan | undefined {
  return PLANS.find(p => p.stripePriceIdMonthly === priceId || p.stripePriceIdAnnual === priceId);
}
