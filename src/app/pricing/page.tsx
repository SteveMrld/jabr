'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useSubscription } from '@/lib/useSubscription';
import { PLANS } from '@/lib/stripe';
import Link from 'next/link';

const H = {
  bg: '#0A0812',
  gold: '#C8952E', goldLight: '#E8B84B', goldFaint: 'rgba(200,149,46,0.12)',
  text: 'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.3)',
  green: '#2EAE6D', violet: '#5B3E8A',
  surface: 'rgba(26,15,46,0.6)',
  border: 'rgba(255,255,255,0.08)',
};

export default function PricingPage() {
  const { user } = useAuth();
  const { subscription, checkout, loading: subLoading } = useSubscription(user?.id || null);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => { setTimeout(() => setEntered(true), 80); }, []);

  const handleCheckout = async (planId: string) => {
    if (!user) { window.location.href = '/auth'; return; }
    setLoadingPlan(planId);
    await checkout(planId, billing);
    setLoadingPlan(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 30% 10%, rgba(45,27,78,0.35) 0%, transparent 50%), radial-gradient(ellipse at 70% 90%, rgba(200,149,46,0.05) 0%, transparent 40%), ${H.bg}`,
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '60px 20px 80px',
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmerGold { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
      `}</style>

      {/* Header */}
      <div style={{
        textAlign: 'center', maxWidth: 600, margin: '0 auto 48px',
        opacity: entered ? 1 : 0,
        animation: entered ? 'fadeUp 0.6s ease both' : 'none',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{
            fontSize: 28, fontWeight: 800, letterSpacing: '0.14em',
            fontFamily: "'Playfair Display', Georgia, serif",
            background: 'linear-gradient(135deg, #C8952E, #E8B84B, #F5DCA0, #E8B84B, #C8952E)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'shimmerGold 5s linear infinite',
            marginBottom: 16,
          }}>JABR</div>
        </Link>
        <h1 style={{
          fontSize: 36, fontWeight: 700,
          fontFamily: "'Playfair Display', Georgia, serif",
          color: H.text, marginBottom: 12, lineHeight: 1.2,
        }}>
          Le bon plan pour votre maison d&apos;édition
        </h1>
        <p style={{ fontSize: 15, color: H.textSecondary, lineHeight: 1.6 }}>
          Commencez gratuitement. Évoluez quand vous êtes prêt.
        </p>

        {/* Billing toggle */}
        <div style={{
          display: 'inline-flex', gap: 4, marginTop: 24, padding: 4,
          borderRadius: 14, background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${H.border}`,
        }}>
          {(['monthly', 'annual'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
              background: billing === b ? H.goldFaint : 'transparent',
              color: billing === b ? H.gold : H.textMuted,
            }}>
              {b === 'monthly' ? 'Mensuel' : 'Annuel'}
              {b === 'annual' && <span style={{ fontSize: 10, marginLeft: 6, color: H.green, fontWeight: 700 }}>-17%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20, maxWidth: 960, margin: '0 auto',
      }}>
        {PLANS.map((plan, i) => {
          const price = billing === 'annual' ? Math.round(plan.priceAnnual / 12) : plan.price;
          const isCurrentPlan = subscription.planId === plan.id;
          const isPopular = plan.popular;

          return (
            <div key={plan.id} style={{
              position: 'relative',
              padding: '32px 28px',
              borderRadius: 20,
              background: isPopular
                ? 'linear-gradient(145deg, rgba(45,27,78,0.8), rgba(26,15,46,0.95))'
                : H.surface,
              border: `1.5px solid ${isPopular ? 'rgba(200,149,46,0.4)' : H.border}`,
              boxShadow: isPopular ? '0 20px 60px rgba(200,149,46,0.08)' : 'none',
              opacity: entered ? 1 : 0,
              animation: entered ? `fadeUp 0.6s ease ${0.1 + i * 0.12}s both` : 'none',
            }}>
              {isPopular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  padding: '5px 16px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #C8952E, #E8B84B)',
                  color: '#0D0A14',
                }}>
                  Populaire
                </div>
              )}

              <h3 style={{
                fontSize: 18, fontWeight: 700,
                fontFamily: "'Playfair Display', Georgia, serif",
                color: H.text, marginBottom: 4,
              }}>{plan.name}</h3>

              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: H.text }}>
                  {price === 0 ? 'Gratuit' : `${price}€`}
                </span>
                {price > 0 && (
                  <span style={{ fontSize: 13, color: H.textMuted, marginLeft: 4 }}>/mois</span>
                )}
                {billing === 'annual' && plan.priceAnnual > 0 && (
                  <div style={{ fontSize: 11, color: H.textMuted, marginTop: 4 }}>
                    Facturé {plan.priceAnnual}€/an
                  </div>
                )}
              </div>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: H.green, fontSize: 14, lineHeight: '20px', flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: H.textSecondary, lineHeight: '20px' }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {isCurrentPlan ? (
                <div style={{
                  width: '100%', padding: '12px 0', textAlign: 'center',
                  borderRadius: 12, fontSize: 13, fontWeight: 600,
                  background: 'rgba(46,174,109,0.1)', color: H.green,
                  border: `1px solid rgba(46,174,109,0.2)`,
                }}>
                  ✓ Plan actuel
                </div>
              ) : (
                <button
                  onClick={() => plan.id !== 'free' && handleCheckout(plan.id)}
                  disabled={plan.id === 'free' || loadingPlan === plan.id || subLoading}
                  style={{
                    width: '100%', padding: '13px 0',
                    borderRadius: 12, fontSize: 13, fontWeight: 700,
                    border: 'none',
                    cursor: plan.id === 'free' ? 'default' : loadingPlan ? 'wait' : 'pointer',
                    background: plan.id === 'free'
                      ? 'rgba(255,255,255,0.04)'
                      : isPopular
                        ? 'linear-gradient(135deg, #C8952E, #E8B84B)'
                        : `rgba(200,149,46,0.15)`,
                    color: plan.id === 'free'
                      ? H.textMuted
                      : isPopular ? '#0D0A14' : H.gold,
                    transition: 'all 0.3s ease',
                    boxShadow: isPopular && plan.id !== 'free' ? '0 4px 20px rgba(200,149,46,0.2)' : 'none',
                  }}
                >
                  {loadingPlan === plan.id ? '...'
                    : plan.id === 'free' ? 'Inclus'
                    : user ? 'Passer à ce plan' : 'Commencer'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <p style={{ fontSize: 12, color: H.textMuted }}>
          Paiement sécurisé via Stripe · Annulable à tout moment · Satisfait ou remboursé 14 jours
        </p>
        <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link href="/" style={{ fontSize: 12, color: H.textMuted, textDecoration: 'none' }}>Accueil</Link>
          <Link href="/demo" style={{ fontSize: 12, color: H.gold, textDecoration: 'none' }}>Dashboard</Link>
        </div>
        <div style={{ marginTop: 24, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: H.textMuted }}>
          JABR v3 · Jabrilia Éditions
        </div>
      </div>
    </div>
  );
}
