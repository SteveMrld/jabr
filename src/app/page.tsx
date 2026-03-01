import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #1A0F2E 100%)' }}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
            <defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E8B84B" /><stop offset="100%" stopColor="#A07424" /></linearGradient></defs>
            <path d="M65 15c8 0 14 5 14 12s-6 13-14 13h-5c-3 0-5 2-6 4l-8 22c-3 8-10 14-18 14-10 0-16-7-14-16l2-8c1-4 5-7 9-7h6c4 0 7-3 8-6l6-16c3-7 10-12 18-12z" fill="url(#g1)" />
            <circle cx="72" cy="72" r="4" fill="url(#g1)" />
            <path d="M35 10c2-2 5-3 8-3" stroke="url(#g1)" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 48, fontWeight: 700, color: '#C8952E', letterSpacing: 6 }}>JABR</h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, marginBottom: 40 }}>
          De l&apos;idée au livre, sans friction.
        </p>
        <Link href="/demo"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-base transition-all hover:scale-105"
          style={{ background: '#C8952E' }}>
          Accéder au Dashboard →
        </Link>
        <p className="mt-6" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Jabrilia Éditions — Pipeline éditorial v1.0</p>
      </div>
    </div>
  );
}
