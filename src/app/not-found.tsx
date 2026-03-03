import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 30% 20%, rgba(45,27,78,0.35) 0%, transparent 50%), #0A0812',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 80, fontWeight: 800, letterSpacing: '0.1em',
          fontFamily: "'Playfair Display', Georgia, serif",
          background: 'linear-gradient(135deg, rgba(200,149,46,0.3), rgba(232,184,75,0.3))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>404</div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
          Cette page n&apos;existe pas
        </p>
        <Link href="/demo" style={{
          display: 'inline-block', padding: '12px 28px', borderRadius: 12,
          fontSize: 13, fontWeight: 600, textDecoration: 'none',
          background: 'linear-gradient(135deg, #C8952E, #E8B84B)',
          color: '#0D0A14', boxShadow: '0 4px 20px rgba(200,149,46,0.2)',
        }}>
          Retour au pipeline
        </Link>
        <div style={{ marginTop: 32, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
          JABR v3 · Jabrilia Éditions
        </div>
      </div>
    </div>
  );
}
