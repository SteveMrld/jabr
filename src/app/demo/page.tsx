'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuthors, getAuthorInitials, getAuthorGradient, type Author } from '@/lib/authors';
import { PROJECTS, type Project } from '@/lib/data';
import JabrApp from '@/components/jabr/JabrApp';

const HUB = {
  bg: '#0A0812',
  surface: 'rgba(26,15,46,0.6)',
  surfaceHover: 'rgba(45,27,78,0.5)',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(200,149,46,0.4)',
  gold: '#C8952E', goldLight: '#E8B84B', goldFaint: 'rgba(200,149,46,0.12)',
  text: 'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.3)',
  green: '#2EAE6D', orange: '#E07A2F', violet: '#5B3E8A',
};

function HubCentral({ authors, projects, onSelectAuthor, onCreateNew }: {
  authors: Author[]; projects: Project[];
  onSelectAuthor: (author: Author) => void; onCreateNew: () => void;
}) {
  const [entered, setEntered] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

  useEffect(() => { const t = setTimeout(() => setEntered(true), 80); return () => clearTimeout(t); }, []);

  const stats = useMemo(() => {
    const totalTitles = projects.length;
    const published = projects.filter(p => p.status === 'published').length;
    const inProgress = projects.filter(p => p.status === 'in-progress').length;
    const totalISBN = projects.reduce((s, p) => s + (p.editions?.length || 0), 0);
    const totalPages = projects.reduce((s, p) => s + (p.pages || 0), 0);
    const genres = [...new Set(projects.map(p => p.genre))];
    const collections = [...new Set(projects.map(p => p.collection).filter(Boolean))];
    return { totalTitles, published, inProgress, totalISBN, totalPages, genres, collections };
  }, [projects]);

  const authorStats = useMemo(() => {
    return authors.map(author => {
      const ap = projects.filter(p => p.author === author.displayName || p.author.includes(author.lastName));
      const published = ap.filter(p => p.status === 'published').length;
      const totalEditions = ap.reduce((s, p) => s + (p.editions?.length || 0), 0);
      const readiness = ap.length > 0 ? Math.round(ap.reduce((s, p) => s + (p.maxScore ? (p.score / p.maxScore) * 100 : 0), 0) / ap.length) : 0;
      return { author, projects: ap, published, totalEditions, readiness };
    });
  }, [authors, projects]);

  const globalKPIs = [
    { value: stats.totalTitles, label: 'Titres', color: HUB.gold, icon: '📚' },
    { value: stats.published, label: 'Publiés', color: HUB.green, icon: '✦' },
    { value: stats.inProgress, label: 'En cours', color: HUB.orange, icon: '⚡' },
    { value: stats.totalISBN, label: 'ISBN', color: HUB.violet, icon: '⬡' },
    { value: authors.length, label: 'Auteurs', color: '#4ECDC4', icon: '✍' },
    { value: stats.totalPages.toLocaleString(), label: 'Pages', color: '#E8B84B', icon: '◈' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: `radial-gradient(ellipse at 20% 0%, rgba(45,27,78,0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(200,149,46,0.06) 0%, transparent 40%), ${HUB.bg}`,
      fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'auto',
    }}>
      <style>{`
        @keyframes hubFadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes hubScale { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmerGold { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 rgba(200,149,46,0.25); } 70% { box-shadow: 0 0 0 10px rgba(200,149,46,0); } 100% { box-shadow: 0 0 0 0 rgba(200,149,46,0); } }
        @keyframes countUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {[...Array(4)].map((_, i) => (
        <div key={i} style={{
          position: 'fixed', width: 4 + i * 2, height: 4 + i * 2, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(200,149,46,${0.15 + i * 0.04}), transparent)`,
          left: `${10 + i * 22}%`, top: `${15 + (i % 3) * 30}%`,
          animation: `float ${5 + i}s ease-in-out infinite`, animationDelay: `${i * 0.7}s`, pointerEvents: 'none' as const,
        }} />
      ))}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 28px 60px' }}>
        {/* HEADER */}
        <div style={{
          textAlign: 'center' as const, marginBottom: 48,
          opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              fontSize: 38, fontWeight: 800, letterSpacing: '0.14em',
              fontFamily: "'Playfair Display', Georgia, serif",
              background: 'linear-gradient(135deg, #C8952E, #E8B84B, #F5DCA0, #E8B84B, #C8952E)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmerGold 5s linear infinite',
            }}>JABR</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: 6, background: HUB.goldFaint, color: HUB.gold }}>v3</div>
          </div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: HUB.textMuted, fontWeight: 500 }}>
            Hub éditorial · Jabrilia Éditions
          </div>
        </div>

        {/* GLOBAL KPIs */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 40,
          opacity: entered ? 1 : 0, animation: entered ? 'hubFadeUp 0.6s ease 0.15s both' : 'none',
        }}>
          {globalKPIs.map((kpi, i) => (
            <div key={i} onMouseEnter={() => setHoveredStat(i)} onMouseLeave={() => setHoveredStat(null)}
              style={{
                padding: '18px 16px 14px', borderRadius: 14, textAlign: 'center' as const,
                background: hoveredStat === i ? HUB.surfaceHover : HUB.surface,
                border: `1px solid ${hoveredStat === i ? `${kpi.color}30` : HUB.border}`,
                transition: 'all 0.3s ease', cursor: 'default',
              }}>
              <div style={{ fontSize: 14, marginBottom: 6, opacity: 0.7 }}>{kpi.icon}</div>
              <div style={{
                fontSize: 26, fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif", color: kpi.color,
                animation: entered ? `countUp 0.5s ease ${0.2 + i * 0.08}s both` : 'none',
              }}>{kpi.value}</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: HUB.textSecondary, marginTop: 4 }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* GENRES */}
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap' as const, justifyContent: 'center', marginBottom: 40,
          opacity: entered ? 1 : 0, animation: entered ? 'hubFadeUp 0.6s ease 0.25s both' : 'none',
        }}>
          {stats.genres.map((g, i) => (
            <span key={i} style={{ fontSize: 10, padding: '4px 12px', borderRadius: 20, background: HUB.goldFaint, color: HUB.gold, fontWeight: 600 }}>{g}</span>
          ))}
          {stats.collections.map((col, i) => (
            <span key={`c-${i}`} style={{ fontSize: 10, padding: '4px 12px', borderRadius: 20, background: 'rgba(91,62,138,0.12)', color: HUB.violet, fontWeight: 600 }}>{col}</span>
          ))}
        </div>

        {/* ESPACES AUTEURS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, opacity: entered ? 1 : 0, animation: entered ? 'hubFadeUp 0.6s ease 0.3s both' : 'none' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,149,46,0.2), transparent)' }} />
          <div style={{ fontSize: 13, fontWeight: 300, letterSpacing: '0.08em', color: HUB.textSecondary, fontFamily: "'Playfair Display', Georgia, serif" }}>Espaces auteurs</div>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,149,46,0.2), transparent)' }} />
        </div>

        {/* AUTHOR CARDS */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20,
          opacity: entered ? 1 : 0, animation: entered ? 'hubFadeUp 0.6s ease 0.35s both' : 'none',
        }}>
          {authorStats.map((as, idx) => {
            const [g1, g2] = getAuthorGradient(idx);
            const isH = hovered === as.author.id;
            return (
              <div key={as.author.id}
                onMouseEnter={() => setHovered(as.author.id)} onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectAuthor(as.author)}
                style={{
                  borderRadius: 18, padding: 24, cursor: 'pointer',
                  background: isH ? 'linear-gradient(145deg, rgba(45,27,78,0.7), rgba(26,15,46,0.85))' : 'linear-gradient(145deg, rgba(26,15,46,0.5), rgba(13,8,18,0.8))',
                  border: `1.5px solid ${isH ? HUB.borderHover : HUB.border}`,
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isH ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: isH ? '0 16px 48px rgba(200,149,46,0.1)' : '0 4px 20px rgba(0,0,0,0.2)',
                  animation: entered ? `hubScale 0.5s ease ${0.35 + idx * 0.1}s both` : 'none',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${g1}, ${g2})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: 'white', fontFamily: "'Playfair Display', Georgia, serif",
                    boxShadow: isH ? `0 6px 20px ${g2}30` : '0 3px 12px rgba(0,0,0,0.25)',
                    animation: isH ? 'pulseRing 2s ease infinite' : 'none',
                  }}>{getAuthorInitials(as.author)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", color: HUB.text }}>{as.author.displayName}</div>
                    <div style={{ fontSize: 10, color: HUB.textMuted, marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                      {(as.author.defaultGenres || []).map((g, i) => <span key={i} style={{ opacity: 0.8 }}>{g}</span>)}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: isH ? HUB.gold : HUB.textMuted, transition: 'color 0.3s', whiteSpace: 'nowrap' as const }}>
                    {isH ? '→ Entrer' : '···'}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: HUB.textSecondary, lineHeight: 1.5, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                  {as.author.bio || 'Aucune biographie renseignée.'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { v: as.projects.length, l: 'Titres', clr: HUB.gold },
                    { v: as.published, l: 'Publiés', clr: HUB.green },
                    { v: as.totalEditions, l: 'Éditions', clr: HUB.violet },
                    { v: `${as.readiness}%`, l: 'Readiness', clr: HUB.orange },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center' as const, padding: '8px 4px', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif", color: s.clr }}>{s.v}</div>
                      <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: HUB.textMuted, marginTop: 2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                {as.author.distinctions && as.author.distinctions.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, marginTop: 12 }}>
                    {as.author.distinctions.slice(0, 2).map((d, i) => (
                      <span key={i} style={{ fontSize: 8, padding: '2px 8px', borderRadius: 8, background: HUB.goldFaint, color: HUB.gold, fontWeight: 600 }}>{d}</span>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 14, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${as.readiness}%`, background: `linear-gradient(90deg, ${g1}, ${g2})`, transition: 'width 1s ease' }} />
                </div>
              </div>
            );
          })}

          {/* NEW AUTHOR CARD */}
          <div onMouseEnter={() => setHovered('__new__')} onMouseLeave={() => setHovered(null)} onClick={onCreateNew}
            style={{
              borderRadius: 18, minHeight: 200,
              border: `2px dashed ${hovered === '__new__' ? HUB.borderHover : 'rgba(255,255,255,0.06)'}`,
              padding: 24, cursor: 'pointer',
              display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.35s ease',
              transform: hovered === '__new__' ? 'translateY(-4px)' : 'translateY(0)',
              background: hovered === '__new__' ? 'rgba(200,149,46,0.03)' : 'transparent',
              animation: entered ? `hubScale 0.5s ease ${0.35 + authors.length * 0.1}s both` : 'none',
            }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: `2px dashed ${hovered === '__new__' ? HUB.gold : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: hovered === '__new__' ? HUB.gold : HUB.textMuted,
              transition: 'all 0.3s ease', marginBottom: 12,
            }}>+</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: hovered === '__new__' ? HUB.gold : HUB.textMuted, transition: 'color 0.3s' }}>Nouvel auteur</div>
            <div style={{ fontSize: 10, color: HUB.textMuted, marginTop: 4 }}>Ajouter un espace éditorial</div>
          </div>
        </div>

        {/* CATALOGUE OVERVIEW */}
        <div style={{ marginTop: 48, opacity: entered ? 1 : 0, animation: entered ? 'hubFadeUp 0.6s ease 0.5s both' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,149,46,0.15), transparent)' }} />
            <div style={{ fontSize: 13, fontWeight: 300, letterSpacing: '0.08em', color: HUB.textSecondary, fontFamily: "'Playfair Display', Georgia, serif" }}>Catalogue</div>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,149,46,0.15), transparent)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {projects.slice(0, 8).map((p, i) => {
              const stC: Record<string, string> = { published: HUB.green, 'in-progress': HUB.orange, draft: HUB.textMuted };
              const stL: Record<string, string> = { published: 'Publié', 'in-progress': 'En cours', draft: 'Brouillon' };
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
                  background: HUB.surface, border: `1px solid ${HUB.border}`,
                  animation: entered ? `hubFadeUp 0.4s ease ${0.5 + i * 0.04}s both` : 'none',
                }}>
                  <div style={{ width: 32, height: 42, borderRadius: 4, background: 'linear-gradient(135deg, rgba(45,27,78,0.6), rgba(200,149,46,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{p.cover || '📖'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: HUB.text, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                    <div style={{ fontSize: 9, color: HUB.textMuted }}>{p.author} · {p.genre} · {p.pages}p</div>
                  </div>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '2px 8px', borderRadius: 10, background: `${stC[p.status]}18`, color: stC[p.status], whiteSpace: 'nowrap' as const }}>{stL[p.status]}</div>
                </div>
              );
            })}
          </div>
          {projects.length > 8 && <div style={{ textAlign: 'center' as const, marginTop: 12, fontSize: 10, color: HUB.textMuted }}>+ {projects.length - 8} autres titres</div>}
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: 'center' as const, marginTop: 56, opacity: entered ? 1 : 0, animation: entered ? 'hubFadeUp 0.6s ease 0.6s both' : 'none' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: HUB.textMuted }}>JABR v3 · Jabrilia Éditions · {new Date().getFullYear()}</div>
          <div style={{ fontSize: 10, color: 'rgba(200,149,46,0.3)', marginTop: 6, fontStyle: 'italic', fontFamily: "'Playfair Display', Georgia, serif" }}>De l&apos;idée au livre, sans friction.</div>
        </div>
      </div>
    </div>
  );
}

function CreateAuthorModal({ onSave, onClose }: { onSave: (author: Author) => void; onClose: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const AVAILABLE_GENRES = ['Roman', 'Fantasy', 'Essai', 'BD', 'Jeunesse', 'Poésie', 'Thriller', 'Romance', 'SF', 'Historique', 'Policier', 'Nouvelle'];
  const canSave = firstName.trim().length > 0 && lastName.trim().length > 0;
  const handleSave = () => {
    if (!canSave) return;
    const id = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    onSave({ id, firstName: firstName.trim(), lastName: lastName.trim(), displayName: `${firstName.trim()} ${lastName.trim()}`, bio: bio.trim(), email: email.trim() || undefined, defaultGenres: genres.length > 0 ? genres : undefined, createdAt: new Date().toISOString(), color: '#C8952E' });
  };
  const iS: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.9)', fontSize: 14, outline: 'none', fontFamily: "'Inter', sans-serif" };
  const lS: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'rgba(200,149,46,0.8)', letterSpacing: '0.05em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block' };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10001, width: '90vw', maxWidth: 480, background: `linear-gradient(145deg, #1A0F2E, ${HUB.bg})`, borderRadius: 20, padding: 32, border: '1px solid rgba(200,149,46,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", color: 'rgba(255,255,255,0.95)', marginBottom: 24 }}>Nouvel auteur</h2>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={lS}>Prénom *</label><input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénom" style={iS} autoFocus /></div>
            <div style={{ flex: 1 }}><label style={lS}>Nom *</label><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nom" style={iS} /></div>
          </div>
          <div><label style={lS}>Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Courte biographie…" style={{ ...iS, resize: 'vertical' as const, minHeight: 70 }} /></div>
          <div><label style={lS}>Email</label><input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" type="email" style={iS} /></div>
          <div>
            <label style={lS}>Genres</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {AVAILABLE_GENRES.map(g => {
                const a = genres.includes(g);
                return <button key={g} onClick={() => setGenres(prev => a ? prev.filter(x => x !== g) : [...prev, g])} style={{ padding: '5px 12px', borderRadius: 16, fontSize: 11, fontWeight: 500, border: `1px solid ${a ? 'rgba(200,149,46,0.5)' : 'rgba(255,255,255,0.1)'}`, background: a ? 'rgba(200,149,46,0.15)' : 'transparent', color: a ? 'rgba(200,149,46,0.9)' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.2s ease' }}>{g}</button>;
              })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSave} disabled={!canSave} style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', background: canSave ? 'linear-gradient(135deg, #C8952E, #E8B84B)' : 'rgba(255,255,255,0.05)', color: canSave ? '#0D0A14' : 'rgba(255,255,255,0.2)', cursor: canSave ? 'pointer' : 'not-allowed', transition: 'all 0.3s ease' }}>Créer l&apos;auteur</button>
        </div>
      </div>
    </>
  );
}

export default function DemoPage() {
  const { authors, activeAuthor, loaded, selectAuthor, clearSelection, addAuthor } = useAuthors();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const handleSelect = useCallback((author: Author) => { selectAuthor(author.id); }, [selectAuthor]);
  const handleCreateNew = useCallback(() => { setShowCreateModal(true); }, []);
  const handleSaveAuthor = useCallback((author: Author) => { addAuthor(author); setShowCreateModal(false); selectAuthor(author.id); }, [addAuthor, selectAuthor]);

  if (!loaded) return (
    <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(ellipse at 50% 30%, rgba(45,27,78,0.3) 0%, transparent 50%), ${HUB.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '0.15em', fontFamily: "'Playfair Display', Georgia, serif", background: 'linear-gradient(135deg, #C8952E, #E8B84B, #F5DCA0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>JABR</div>
    </div>
  );

  if (activeAuthor) return <JabrApp author={activeAuthor} onSwitchAuthor={clearSelection} />;

  return (
    <>
      <HubCentral authors={authors} projects={PROJECTS} onSelectAuthor={handleSelect} onCreateNew={handleCreateNew} />
      {showCreateModal && <CreateAuthorModal onSave={handleSaveAuthor} onClose={() => setShowCreateModal(false)} />}
    </>
  );
}
