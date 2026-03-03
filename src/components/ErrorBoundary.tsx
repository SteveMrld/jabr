'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const c = {
  bg: '#0A0812',
  gold: '#C8952E',
  goldLight: '#E8B84B',
  text: 'rgba(255,255,255,0.92)',
  textMuted: 'rgba(255,255,255,0.3)',
  red: '#D64545',
  surface: 'rgba(26,15,46,0.6)',
  border: 'rgba(255,255,255,0.08)',
};

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[JABR ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          position: 'fixed', inset: 0, background: c.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
          <div style={{
            maxWidth: 440, padding: '40px 36px', borderRadius: 24, textAlign: 'center',
            background: c.surface, border: `1px solid ${c.border}`,
            boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{
              fontSize: 22, fontWeight: 700,
              fontFamily: "'Playfair Display', Georgia, serif",
              color: c.text, marginBottom: 8,
            }}>
              Une erreur est survenue
            </h2>
            <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 24, lineHeight: 1.6 }}>
              {this.state.error?.message || 'Erreur inattendue'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              style={{
                padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${c.gold}, ${c.goldLight})`,
                color: c.bg, boxShadow: `0 4px 20px rgba(200,149,46,0.3)`,
              }}>
              Recharger l&apos;application
            </button>
            <div style={{ marginTop: 16, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.textMuted }}>
              JABR v3 · Jabrilia Éditions
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
