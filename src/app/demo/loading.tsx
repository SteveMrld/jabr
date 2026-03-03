export default function DemoLoading() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 30%, rgba(45,27,78,0.3) 0%, transparent 50%), #0A0812',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <style>{`
        @keyframes shimmerGold { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>
      <div style={{
        fontSize: 36, fontWeight: 800, letterSpacing: '0.14em',
        fontFamily: "'Playfair Display', Georgia, serif",
        background: 'linear-gradient(135deg, #C8952E, #E8B84B, #F5DCA0, #E8B84B, #C8952E)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        animation: 'shimmerGold 3s linear infinite',
      }}>JABR</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#C8952E',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
        Chargement du pipeline
      </div>
    </div>
  );
}
