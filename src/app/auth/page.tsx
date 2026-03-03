'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';

const HUB = {
  bg: '#0A0812',
  gold: '#C8952E', goldLight: '#E8B84B', goldFaint: 'rgba(200,149,46,0.12)',
  text: 'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.3)',
  green: '#2EAE6D', red: '#D64545',
  surface: 'rgba(26,15,46,0.6)',
  border: 'rgba(255,255,255,0.08)',
};

export default function AuthPage() {
  const { isAuthenticated, loading: authLoading, signIn, signUp, resetPassword, error: authError } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => { setTimeout(() => setEntered(true), 80); }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) router.push('/demo');
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async () => {
    if (!email.trim()) { setMessage({ type: 'error', text: 'Email requis' }); return; }
    setLoading(true);
    setMessage(null);

    if (mode === 'reset') {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) { setMessage({ type: 'error', text: error }); return; }
      setMessage({ type: 'success', text: 'Email de réinitialisation envoyé. Vérifiez votre boîte mail.' });
      return;
    }

    if (!password || password.length < 6) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Mot de passe : 6 caractères minimum' });
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) { setLoading(false); setMessage({ type: 'error', text: 'Nom complet requis' }); return; }
      const { error } = await signUp(email, password, fullName);
      setLoading(false);
      if (error) { setMessage({ type: 'error', text: error }); return; }
      setMessage({ type: 'success', text: 'Compte créé ! Vérifiez votre email pour confirmer.' });
    } else {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        const msg = error.includes('Invalid') ? 'Email ou mot de passe incorrect' : error;
        setMessage({ type: 'error', text: msg });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleSubmit();
  };

  if (authLoading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: HUB.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '0.15em', fontFamily: "'Playfair Display', Georgia, serif", background: 'linear-gradient(135deg, #C8952E, #E8B84B, #F5DCA0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>JABR</div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: `1.5px solid ${HUB.border}`, background: 'rgba(255,255,255,0.03)',
    color: HUB.text, fontSize: 15, outline: 'none',
    fontFamily: "'Inter', -apple-system, sans-serif",
    transition: 'border-color 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'rgba(200,149,46,0.7)',
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `radial-gradient(ellipse at 30% 20%, rgba(45,27,78,0.35) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200,149,46,0.05) 0%, transparent 40%), ${HUB.bg}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmerGold { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        input:focus { border-color: rgba(200,149,46,0.5) !important; }
      `}</style>

      <div style={{
        width: '100%', maxWidth: 420, padding: '40px 36px',
        borderRadius: 24,
        background: 'linear-gradient(145deg, rgba(26,15,46,0.8), rgba(13,8,18,0.95))',
        border: `1px solid ${HUB.border}`,
        boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
        opacity: entered ? 1 : 0,
        animation: entered ? 'fadeUp 0.6s ease both' : 'none',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 36, fontWeight: 800, letterSpacing: '0.14em',
            fontFamily: "'Playfair Display', Georgia, serif",
            background: 'linear-gradient(135deg, #C8952E, #E8B84B, #F5DCA0, #E8B84B, #C8952E)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'shimmerGold 5s linear infinite',
            marginBottom: 8,
          }}>JABR</div>
          <div style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: HUB.textMuted }}>
            Pipeline éditorial
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: 3, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setMessage(null); }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                background: mode === m || (mode === 'reset' && m === 'login') ? HUB.goldFaint : 'transparent',
                color: mode === m || (mode === 'reset' && m === 'login') ? HUB.gold : HUB.textMuted,
                letterSpacing: '0.04em',
              }}>
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", color: HUB.text, marginBottom: 4 }}>
            {mode === 'login' ? 'Bienvenue' : mode === 'signup' ? 'Créer un compte' : 'Réinitialiser'}
          </h2>
          <p style={{ fontSize: 12, color: HUB.textSecondary }}>
            {mode === 'login' ? 'Connectez-vous à votre espace éditorial' : mode === 'signup' ? 'Commencez à gérer vos publications' : 'Entrez votre email pour recevoir un lien'}
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onKeyDown={handleKeyDown}>
          {mode === 'signup' && (
            <div>
              <label style={labelStyle}>Nom complet</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Marie Dupont" style={inputStyle} autoFocus />
            </div>
          )}
          <div>
            <label style={labelStyle}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@editeur.com" type="email" style={inputStyle} autoFocus={mode !== 'signup'} />
          </div>
          {mode !== 'reset' && (
            <div>
              <label style={labelStyle}>Mot de passe</label>
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type="password" style={inputStyle} />
            </div>
          )}
        </div>

        {/* Error / Success */}
        {(message || authError) && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10, fontSize: 12,
            background: (message?.type === 'success') ? 'rgba(46,174,109,0.1)' : 'rgba(214,69,69,0.1)',
            color: (message?.type === 'success') ? HUB.green : HUB.red,
            border: `1px solid ${(message?.type === 'success') ? 'rgba(46,174,109,0.2)' : 'rgba(214,69,69,0.2)'}`,
          }}>
            {message?.text || authError}
          </div>
        )}

        {/* Submit button */}
        <button onClick={handleSubmit} disabled={loading}
          style={{
            width: '100%', marginTop: 20, padding: '14px 0',
            borderRadius: 12, fontSize: 14, fontWeight: 700, letterSpacing: '0.04em',
            border: 'none', cursor: loading ? 'wait' : 'pointer',
            background: loading ? 'rgba(200,149,46,0.3)' : 'linear-gradient(135deg, #C8952E, #E8B84B)',
            color: loading ? HUB.textMuted : '#0D0A14',
            transition: 'all 0.3s ease',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(200,149,46,0.2)',
          }}>
          {loading ? '...' : mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Créer mon compte' : 'Envoyer le lien'}
        </button>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          {mode === 'login' && (
            <button onClick={() => { setMode('reset'); setMessage(null); }}
              style={{ background: 'none', border: 'none', color: HUB.textMuted, fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
              Mot de passe oublié ?
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => { setMode('login'); setMessage(null); }}
              style={{ background: 'none', border: 'none', color: HUB.gold, fontSize: 11, cursor: 'pointer' }}>
              ← Retour à la connexion
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: HUB.textMuted }}>
          JABR v3 · Jabrilia Éditions
        </div>
      </div>
    </div>
  );
}
