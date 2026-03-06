'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, BarChart3, Shield, Send, FileText, Palette,
  Ruler, Hash, Truck, Megaphone, ChevronRight, Check,
  X, Menu, ArrowRight, Sparkles, Layers, Eye,
  Calendar, Users, Globe, Zap, Star, PenTool
} from 'lucide-react';

const t = {
  bg: '#FAFAF8', text: '#2D2A26', text2: '#6B645B',
  border: '#E8E4DF', card: '#FFFFFF',
  cta: '#C8952E', ctaH: '#B88322', ctaFaint: 'rgba(200,149,46,0.08)',
  data: '#1E40AF', dataFaint: 'rgba(30,64,175,0.06)',
  ok: '#059669', okFaint: 'rgba(5,150,105,0.06)',
  dark: '#0F0A1A', violet: '#2D1B4E',
};

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const FadeIn = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const { ref, visible } = useFadeIn();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
    }}>
      {children}
    </div>
  );
};

const Logo = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <defs><linearGradient id="jlg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#E8B84B" /><stop offset="100%" stopColor="#A07424" />
    </linearGradient></defs>
    <path d="M65 15c8 0 14 5 14 12s-6 13-14 13h-5c-3 0-5 2-6 4l-8 22c-3 8-10 14-18 14-10 0-16-7-14-16l2-8c1-4 5-7 9-7h6c4 0 7-3 8-6l6-16c3-7 10-12 18-12z" fill="url(#jlg)" />
    <circle cx="72" cy="72" r="4" fill="url(#jlg)" />
    <path d="M35 10c2-2 5-3 8-3" stroke="url(#jlg)" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

const DashboardPreview = () => {
  const titles = [
    { name: 'Le Lion D\u00e9chu', genre: 'Fantasy', status: 'En cours', readiness: 72, color: '#C8952E' },
    { name: 'Mon petit livre anti-stress', genre: 'Jeunesse', status: 'BAT', readiness: 88, color: '#059669' },
    { name: 'Les M\u00e9moires Reli\u00e9es', genre: 'Roman', status: 'Corrections', readiness: 45, color: '#1E40AF' },
    { name: 'Le Dernier Rivage', genre: 'Roman', status: 'Brouillon', readiness: 31, color: '#6B645B' },
  ];
  return (
    <div style={{ background: t.dark, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(200,149,46,0.15)', boxShadow: '0 32px 64px rgba(0,0,0,0.25)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'rgba(15,10,26,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F' }} />
        <div style={{ flex: 1, margin: '0 12px', padding: '4px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
          jabr-eta.vercel.app
        </div>
      </div>
      <div style={{ display: 'flex', minHeight: 300 }}>
        <div style={{ width: 160, padding: '14px 10px', background: 'linear-gradient(180deg, #2D1B4E, #1A0F2E)', flexShrink: 0 }} className="hide-mobile-preview">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Logo size={16} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 700, color: t.cta, letterSpacing: 2 }}>JABR</span>
          </div>
          {['Dashboard', 'Projets', 'Manuscrits', 'Analyse', 'Couvertures', 'ISBN', 'Distribution'].map((item, i) => (
            <div key={item} style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 10, marginBottom: 2,
              background: i === 0 ? 'rgba(200,149,46,0.15)' : 'transparent',
              color: i === 0 ? t.cta : 'rgba(255,255,255,0.3)',
              fontWeight: i === 0 ? 600 : 400,
            }}>{item}</div>
          ))}
        </div>
        <div style={{ flex: 1, padding: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>Dashboard</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Jabrilia \u00c9ditions</div>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 600, color: 'white', background: t.cta }}>+ Nouveau projet</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
            {[['10', 'Titres'], ['4', 'En cours'], ['28', 'ISBN enreg.'], ['72%', 'Readiness']].map(([v, l]) => (
              <div key={l} style={{ padding: '8px 6px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: t.cta }}>{v}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          {titles.map((title, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, marginBottom: 3,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ width: 24, height: 32, borderRadius: 4, background: 'linear-gradient(135deg, #2D1B4E, rgba(200,149,46,0.3))', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title.name}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{title.genre}</div>
              </div>
              <div style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: title.color + '20', color: title.color, fontWeight: 600 }}>{title.status}</div>
              <div style={{ width: 50, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <div style={{ height: '100%', borderRadius: 2, background: title.color, width: title.readiness + '%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PIPELINE = [
  { icon: PenTool, title: 'Cadrage', desc: 'Projet, collection, intention.' },
  { icon: FileText, title: 'Manuscrit', desc: 'Upload, versions, analyse.' },
  { icon: Eye, title: 'Intelligence IA', desc: 'Scoring, audience, comparables.' },
  { icon: Shield, title: 'Production', desc: 'Corrections, calibrage, BAT.' },
  { icon: Palette, title: 'Cover Studio', desc: 'Assemblage couverture complet.' },
  { icon: Ruler, title: 'Audiobook', desc: 'TTS ElevenLabs, chapitrage.' },
  { icon: Hash, title: 'ISBN & Export', desc: 'Registre, ONIX 3.0, PDF.' },
  { icon: Send, title: 'Lancement', desc: 'Marketing, droits, distribution.' },
];

const MODULES = [
  { icon: Layers, title: 'Catalogue & collections', desc: 'Vision globale, genres, collections, statuts de chaque titre.' },
  { icon: BarChart3, title: 'Analyse \u00e9ditoriale', desc: 'Scoring, diagnostics, checklists, score IA.' },
  { icon: Palette, title: '◆ Cover Studio', desc: 'Assemblage couverture, pack marketing, visuels sociaux, bande-annonce.' },
  { icon: Hash, title: 'Registre ISBN', desc: 'Gestion de vos ISBN, suivi, export CSV et ONIX 3.0.' },
  { icon: Truck, title: 'Distribution', desc: 'Matrice titre \u00d7 canal, specs Pollen / KDP / IngramSpark.' },
  { icon: Megaphone, title: 'Marketing & Audiobooks', desc: 'Plan m\u00e9dia IA, production audiobook ElevenLabs, calendrier.' },
];

const NAV_ITEMS = [
  { href: '#fonctionnalites', label: 'Fonctionnalit\u00e9s' },
  { href: '#pipeline', label: 'Pipeline' },
  { href: '#modules', label: 'Modules' },
  { href: '#tarifs', label: 'Tarifs' },
];

// ── Interactive demo walkthrough ──
const DEMO_SCREENS = [
  {
    tab: 'Dashboard',
    title: 'Cockpit \u00e9ditorial \u2014 28 modules',
    desc: '10 moteurs IA, KPIs temps r\u00e9el, catalogue, readiness, revenus estim\u00e9s.',
    content: () => (
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 12 }}>Dashboard &mdash; Jabrilia &Eacute;ditions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[['10', 'Titres'], ['29', 'ISBN'], ['~4 800\u20ac', 'Rev. est./an']].map(([v, l]) => (
            <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#C8952E' }}>{v}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>10 MOTEURS INT&Eacute;GR&Eacute;S</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['Scanner 6D', 'Cover Studio', 'Intelligence', 'Trailer Gen', 'Media Engine', 'ONIX 3.0', 'Audiobooks', 'Orchestration', 'Economie', 'Predicteur'].map(e => (
            <span key={e} style={{ fontSize: 8, padding: '3px 8px', borderRadius: 4, background: 'rgba(200,149,46,0.1)', color: '#C8952E', fontWeight: 600 }}>{e}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    tab: 'Cover Studio',
    title: 'De la couverture vierge au pack complet',
    desc: '6 \u00e9tapes : s\u00e9lection, audit, assemblage, marketing, bande-annonce, export.',
    content: () => (
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 12 }}>Cover Studio &mdash; 6 &eacute;tapes</div>
        {[
          { num: '1', label: 'S\u00e9lection', desc: 'Titre + distributeur + g\u00e9n\u00e9ration IA (DALL-E / Midjourney)', color: '#C8952E' },
          { num: '2', label: 'Audit', desc: 'Titre, auteur, ISBN, EAN-13, prix, 4e de couverture', color: '#5B3E8A' },
          { num: '3', label: 'Assemblage', desc: 'Preview livre r\u00e9aliste + planche technique C4+Dos+C1', color: '#E07A2F' },
          { num: '4', label: 'Marketing Pack', desc: '12 formats sociaux + textes Instagram, LinkedIn, newsletter', color: '#1E40AF' },
          { num: '5', label: 'Bande-annonce', desc: 'Storyboard par sc\u00e8ne pour Runway Gen-3 Alpha', color: '#D94452' },
          { num: '6', label: 'Export', desc: 'PNG @300dpi + PDF traits de coupe + visuels sociaux', color: '#059669' },
        ].map(s => (
          <div key={s.num} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6, padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>{s.num}</div>
            <div><div style={{ fontSize: 11, fontWeight: 600, color: 'white' }}>{s.label}</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{s.desc}</div></div>
          </div>
        ))}
      </div>
    ),
  },
  {
    tab: 'Intelligence',
    title: 'Directeur \u00e9ditorial augment\u00e9',
    desc: 'Analyse IA, scoring 7D, comparables, audience, recommandations.',
    content: () => (
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 12 }}>Editorial Intelligence &mdash; Le Lion D&eacute;chu</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
          {[['72', 'Qualit\u00e9', '#2D1B4E'], ['68', 'Originalit\u00e9', '#5B3E8A'], ['75', 'Market Fit', '#C8952E']].map(([v, l, cl]) => (
            <div key={l} style={{ textAlign: 'center', padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: cl as string }}>{v}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: 10, borderRadius: 8, background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.15)', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>Publier &mdash; Accompagnement &eacute;ditorial</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Confiance : 72% &middot; Mieux que 74% des manuscrits</div>
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>4 MODULES INTELLIGENCE</div>
        {['Pr\u00e9dicteur de succ\u00e8s (radar 7 dimensions)', 'Marketing multi-variant (8 formats x multi-audience)', 'Triage soumissions (scoring + shortlist)', 'Droits & Adaptation (film, s\u00e9rie, animation)'].map(r => (
          <div key={r} style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{r}</div>
        ))}
      </div>
    ),
  },
  {
    tab: 'Audiobooks',
    title: 'Production vocale IA int\u00e9gr\u00e9e',
    desc: 'ElevenLabs TTS, chapitrage auto, export MP3, distribution ACX.',
    content: () => (
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 12 }}>Audiobook &mdash; Pipeline int&eacute;gr&eacute;</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
          {[['~630', 'min'], ['21', 'chapitres'], ['~189\u20ac', 'co\u00fbt TTS']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center', padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#C8952E' }}>{v}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{l}</div>
            </div>
          ))}
        </div>
        {['Import .docx avec d\u00e9coupe chapitres auto', 'Voix ElevenLabs (4 voix FR/EN + clonage)', 'Mastering -14 LUFS + normalisation', 'Lecteur audio int\u00e9gr\u00e9 par chapitre', 'Export MP3 320kbps + m\u00e9tadonn\u00e9es', 'Distribution ACX / Audible / Spotify'].map((s, i) => (
          <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{s}</div>
        ))}
      </div>
    ),
  },
  {
    tab: '\u00c9conomie',
    title: 'Simulateur P&L par titre',
    desc: 'Point mort, marge, 3 sc\u00e9narios (prudent / r\u00e9aliste / optimiste).',
    content: () => (
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 12 }}>&Eacute;conomie &mdash; Simulation</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
          {[['214', 'Point mort (ex.)'], ['42%', 'du tirage'], ['4 832\u20ac', 'CA brut'], ['+1 205\u20ac', 'R\u00e9sultat net']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center', padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: v.toString().startsWith('+') ? '#059669' : '#C8952E' }}>{v}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{l}</div>
            </div>
          ))}
        </div>
        {[
          { name: 'Prudent (40%)', result: '-380\u20ac', color: '#D94452', verdict: 'Perte' },
          { name: 'R\u00e9aliste (65%)', result: '+1 205\u20ac', color: '#059669', verdict: 'Profit' },
          { name: 'Optimiste (90%)', result: '+2 890\u20ac', color: '#059669', verdict: 'Rentable' },
        ].map(sc => (
          <div key={sc.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 6, marginBottom: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: 10, color: 'white' }}>{sc.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: sc.color }}>{sc.result}</span>
            <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: sc.color + '20', color: sc.color }}>{sc.verdict}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    tab: 'Droits',
    title: 'Rights & Adaptation Engine',
    desc: 'Scores film/s\u00e9rie/animation, 18 territoires, one-pager export.',
    content: () => (
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 12 }}>Adaptation &mdash; Le Tr&ocirc;ne de Cendre</div>
        {[
          { label: 'Film', score: 72 },
          { label: 'S\u00e9rie TV', score: 85 },
          { label: 'Animation', score: 48 },
          { label: 'Audio dramatis\u00e9', score: 65 },
          { label: 'Th\u00e9\u00e2tre', score: 32 },
          { label: 'Jeu vid\u00e9o', score: 68 },
        ].map(a => (
          <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: 'white', width: 80 }}>{a.label}</span>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ height: '100%', borderRadius: 3, background: a.score >= 70 ? '#059669' : a.score >= 50 ? '#C8952E' : '#6B645B', width: `${a.score}%` }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: a.score >= 70 ? '#059669' : a.score >= 50 ? '#C8952E' : 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace", width: 28, textAlign: 'right' }}>{a.score}</span>
          </div>
        ))}
        <div style={{ marginTop: 10, padding: 8, borderRadius: 6, background: 'rgba(200,149,46,0.08)', border: '1px solid rgba(200,149,46,0.15)' }}>
          <div style={{ fontSize: 9, color: '#C8952E', fontWeight: 600 }}>18 territoires &middot; 15 disponibles &middot; One-pager export</div>
        </div>
      </div>
    ),
  },
];

const DemoWalkthrough = () => {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActive(a => (a + 1) % DEMO_SCREENS.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const select = (i: number) => {
    setActive(i);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive(a => (a + 1) % DEMO_SCREENS.length);
    }, 5000);
  };

  const screen = DEMO_SCREENS[active];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
        {DEMO_SCREENS.map((s, i) => (
          <button key={s.tab} onClick={() => select(i)} style={{
            padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500,
            border: 'none', cursor: 'pointer', transition: 'all 0.3s',
            background: i === active ? '#C8952E' : 'rgba(255,255,255,0.06)',
            color: i === active ? 'white' : 'rgba(255,255,255,0.4)',
          }}>
            {s.tab}
          </button>
        ))}
      </div>

      {/* Screen */}
      <div style={{ borderRadius: 16, overflow: 'hidden', background: '#0F0A1A', border: '1px solid rgba(200,149,46,0.15)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        {/* Browser bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'rgba(15,10,26,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F' }} />
          <div style={{ flex: 1, margin: '0 12px', padding: '4px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
            jabr-eta.vercel.app
          </div>
        </div>
        {/* Content */}
        <div style={{ minHeight: 320 }}>
          {screen.content()}
        </div>
      </div>

      {/* Caption */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{screen.title}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{screen.desc}</div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
        {DEMO_SCREENS.map((_, i) => (
          <div key={i} onClick={() => select(i)} style={{
            width: i === active ? 24 : 8, height: 8, borderRadius: 4, cursor: 'pointer',
            background: i === active ? '#C8952E' : 'rgba(255,255,255,0.15)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif", color: t.text, background: t.bg }}>

      {/* HEADER */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(250,250,248,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(180%) blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid #E8E4DF' : '1px solid transparent',
        transition: 'all 0.4s ease',
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Logo size={28} />
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: t.cta, letterSpacing: 3 }}>JABR</span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="hide-mobile">
            {NAV_ITEMS.map(n => (
              <a key={n.href} href={n.href} style={{ color: t.text2, fontSize: 14, textDecoration: 'none' }}>{n.label}</a>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/auth" style={{ color: t.text2, fontSize: 14, textDecoration: 'none', fontWeight: 500 }} className="hide-mobile">Se connecter</Link>
            <Link href="/auth" style={{
              display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 18px',
              borderRadius: 999, background: t.cta, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>Commencer</Link>
            <button onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu"
              className="show-mobile" style={{
                display: 'none', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: 10, border: '1px solid #E8E4DF',
                background: 'white', cursor: 'pointer',
              }}>
              <Menu size={18} color={t.text} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 280,
            background: 'white', padding: 24, display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: t.cta, letterSpacing: 3 }}>JABR</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #E8E4DF', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color={t.text} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {NAV_ITEMS.map(n => (
                <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)}
                  style={{ padding: '12px 14px', borderRadius: 10, color: t.text, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
                  {n.label}
                </a>
              ))}
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/auth" onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 999, border: '1px solid #E8E4DF', color: t.text, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Se connecter
              </Link>
              <Link href="/auth" onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 999, background: t.cta, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Commencer un projet
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section style={{ paddingTop: 100, paddingBottom: 60 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 40, alignItems: 'center' }} className="hero-grid">
          <div>
            <FadeIn>
              <div style={{ color: t.text2, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
                Cockpit \u00e9ditorial
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(32px, 4.5vw, 54px)', lineHeight: 1.08, fontWeight: 700,
                color: t.text, margin: '14px 0 16px',
              }}>
                Le cockpit {'\u00e9'}ditorial intelligent. Du manuscrit au livre publi{'\u00e9'}, en passant par la couverture, l&apos;audiobook et le marketing.
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p style={{ color: t.text2, fontSize: 18, lineHeight: 1.65, maxWidth: '56ch', margin: 0 }}>
                JABR structure chaque {'\u00e9'}tape : analyse {'\u00e9'}ditoriale IA, assemblage couverture, production audiobook, plan m{'\u00e9'}dia, simulation {'\u00e9'}conomique, gestion des droits. 28 modules. Un seul espace.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
                <Link href="/auth" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px',
                  borderRadius: 999, background: t.cta, color: '#fff', fontSize: 15, fontWeight: 600,
                  textDecoration: 'none', boxShadow: '0 4px 16px rgba(200,149,46,0.25)',
                }}>
                  Commencer un projet <ArrowRight size={16} />
                </Link>
                <a href="#demo" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px',
                  borderRadius: 999, border: '1px solid #E8E4DF', background: 'white',
                  color: t.text, fontSize: 15, fontWeight: 500, textDecoration: 'none',
                }}>
                  Voir la d{'\u00e9'}mo
                </a>
              </div>
            </FadeIn>
            <FadeIn delay={0.4}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
                {['Pipeline \u00e9ditorial complet', 'Catalogue & collections', 'Analytics de production'].map(badge => (
                  <span key={badge} style={{
                    fontSize: 12, color: t.text2, border: '1px solid #E8E4DF',
                    padding: '6px 12px', borderRadius: 999, background: 'white',
                  }}>{badge}</span>
                ))}
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={0.3} className="hero-preview">
            <DashboardPreview />
          </FadeIn>
        </div>
      </section>

      {/* PROBLEME / VALEUR */}
      <section id="fonctionnalites" style={{ padding: '72px 0', borderTop: '1px solid #E8E4DF' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px' }}>
          <FadeIn>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 2.8vw, 38px)', lineHeight: 1.15, fontWeight: 700, color: t.text, margin: 0 }}>
              Publier un livre, c&apos;est un art.<br />L&apos;organisation doit {'\u00ea'}tre pr{'\u00e9'}cise.
            </h2>
            <p style={{ color: t.text2, fontSize: 17, lineHeight: 1.65, maxWidth: '62ch', margin: '12px 0 0' }}>
              JABR remplace les fichiers, tableurs et emails par une architecture {'\u00e9'}ditoriale int{'\u00e9'}gr{'\u00e9'}e : 28 modules, 10 moteurs IA, de l&apos;analyse du manuscrit au plan marketing.
            </p>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 32 }} className="grid-responsive">
            {[
              { icon: Eye, kicker: 'Intelligence', title: 'Directeur \u00e9ditorial IA', desc: 'Analyse, scoring pr\u00e9dictif, comparables, audience cible, recommandations.' },
              { icon: Zap, kicker: 'Production', title: 'Couverture + Audiobook', desc: 'Cover Studio 6 \u00e9tapes, PDF print-ready, TTS ElevenLabs, bande-annonce Runway.' },
              { icon: Sparkles, kicker: 'Commerce', title: 'Marketing + \u00c9conomie', desc: 'Textes multi-audience, simulation P&L, droits & adaptation, 12 formats sociaux.' },
            ].map((card, i) => (
              <FadeIn key={card.title} delay={i * 0.1}>
                <div style={{
                  background: 'white', border: '1px solid #E8E4DF', borderRadius: 16,
                  padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', cursor: 'default',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: t.ctaFaint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <card.icon size={20} color={t.cta} />
                  </div>
                  <div style={{ fontSize: 12, color: t.text2, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 6 }}>{card.kicker}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>{card.title}</div>
                  <div style={{ fontSize: 14, color: t.text2, lineHeight: 1.55 }}>{card.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section style={{ padding: '72px 0', background: 'white', borderTop: '1px solid #E8E4DF', borderBottom: '1px solid #E8E4DF' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px' }}>
          <FadeIn>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 2.8vw, 38px)', lineHeight: 1.15, fontWeight: 700, color: t.text, margin: '0 0 32px' }}>
              De l&apos;id{'\u00e9'}e au livre, sans perdre le fil.
            </h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid-responsive">
            {[
              { num: '01', title: 'Analyser', desc: 'Intelligence \u00e9ditoriale IA, scoring pr\u00e9dictif, comparables, audience.', icon: Eye },
              { num: '02', title: 'Produire', desc: 'Cover Studio, audiobook TTS, calibrage, PDF print-ready.', icon: Shield },
              { num: '03', title: 'Commercialiser', desc: 'Marketing multi-variant, plan m\u00e9dia, simulation \u00e9conomique, droits.', icon: Send },
            ].map((s, i) => (
              <FadeIn key={s.num} delay={i * 0.12}>
                <div style={{ padding: 24, border: '1px solid #E8E4DF', borderRadius: 16, background: t.bg }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: t.data, marginBottom: 12 }}>{s.num}</div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: t.dataFaint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <s.icon size={20} color={t.data} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: t.text2, lineHeight: 1.55 }}>{s.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO INTERACTIVE */}
      <section id="demo" style={{ padding: '72px 0', background: `linear-gradient(160deg, ${t.dark}, ${t.violet})`, borderTop: '1px solid #E8E4DF' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(200,149,46,0.8)', marginBottom: 8 }}>
                D{'\u00e9'}mo
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 2.8vw, 38px)', lineHeight: 1.15, fontWeight: 700, color: 'white', margin: '0 0 10px' }}>
                D{'\u00e9'}couvrez JABR en action
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, lineHeight: 1.6, maxWidth: '50ch', margin: '0 auto' }}>
                28 modules, 10 moteurs IA, de la couverture au plan m{'\u00e9'}dia.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <DemoWalkthrough />
          </FadeIn>
        </div>
      </section>

      {/* PIPELINE */}
      <section id="pipeline" style={{ padding: '72px 0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px' }}>
          <FadeIn>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 2.8vw, 38px)', lineHeight: 1.15, fontWeight: 700, color: t.text, margin: 0 }}>
              Un pipeline {'\u00e9'}ditorial complet {'\u2014'} visible d&apos;un coup d&apos;{'\u0153'}il
            </h2>
            <p style={{ color: t.text2, fontSize: 16, lineHeight: 1.6, margin: '10px 0 24px' }}>
              8 {'\u00e9'}tapes, du manuscrit {'\u00e0'} la librairie.
            </p>
          </FadeIn>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, scrollSnapType: 'x mandatory' }}>
            {PIPELINE.map((step, i) => (
              <FadeIn key={step.title} delay={i * 0.06}>
                <div style={{
                  minWidth: 220, scrollSnapAlign: 'start', flexShrink: 0,
                  border: '1px solid #E8E4DF', borderRadius: 16,
                  background: 'white', padding: 18,
                }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: t.data, marginBottom: 10 }}>
                    {'\u00c9'}TAPE {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: t.ctaFaint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <step.icon size={18} color={t.cta} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: t.text2, lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" style={{ padding: '72px 0', background: 'white', borderTop: '1px solid #E8E4DF' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px' }}>
          <FadeIn>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 2.8vw, 38px)', lineHeight: 1.15, fontWeight: 700, color: t.text, margin: '0 0 32px' }}>
              L&apos;atelier {'\u00e9'}ditorial, module par module
            </h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid-responsive">
            {MODULES.map((m, i) => (
              <FadeIn key={m.title} delay={i * 0.08}>
                <div style={{ border: '1px solid #E8E4DF', borderRadius: 16, padding: 24, background: t.bg }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: t.ctaFaint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <m.icon size={22} color={t.cta} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>{m.title}</div>
                  <div style={{ fontSize: 14, color: t.text2, lineHeight: 1.55 }}>{m.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <div style={{ marginTop: 24 }}>
              <a href="#demo" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, height: 44, padding: '0 20px',
                borderRadius: 999, border: '1px solid #E8E4DF', background: 'white',
                color: t.text, fontSize: 14, fontWeight: 500, textDecoration: 'none',
              }}>
                Voir les 22 modules <ChevronRight size={14} />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* COCKPIT PREUVES */}
      <section style={{ padding: '72px 0', borderTop: '1px solid #E8E4DF' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px' }}>
          <FadeIn>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 2.8vw, 38px)', lineHeight: 1.15, fontWeight: 700, color: t.text, margin: '0 0 32px' }}>
              Pilotez votre catalogue comme un syst{'\u00e8'}me {'\u00e9'}ditorial.
            </h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid-responsive">
            {[
              { icon: BarChart3, title: 'Pipeline', desc: 'O\u00f9 en est chaque titre \u2014 sans interpr\u00e9tation.', color: t.cta, bg: t.ctaFaint },
              { icon: Check, title: 'Readiness', desc: 'Ce qui manque avant publication, clairement.', color: t.data, bg: t.dataFaint },
              { icon: Star, title: '\u00c9volution', desc: 'Progression dans le temps : titres, sorties, compl\u00e9tude.', color: t.ok, bg: t.okFaint },
            ].map((p, i) => (
              <FadeIn key={p.title} delay={i * 0.1}>
                <div style={{ background: 'white', border: '1px solid #E8E4DF', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <p.icon size={22} color={p.color} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>{p.title}</div>
                  <div style={{ fontSize: 14, color: t.text2, lineHeight: 1.55 }}>{p.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" style={{ padding: '72px 0', background: 'white', borderTop: '1px solid #E8E4DF' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 2.8vw, 38px)', lineHeight: 1.15, fontWeight: 700, color: t.text, margin: 0 }}>
                Des plans simples. Sans engagement.
              </h2>
              <p style={{ color: t.text2, fontSize: 16, marginTop: 10 }}>Commencez gratuitement. Sans carte bancaire.</p>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid-responsive">
            {[
              {
                name: 'D\u00e9couverte', price: '0\u20ac', period: '/mois',
                desc: 'Pour tester la logique du cockpit.',
                features: ['3 titres', 'Diagnostic couverture', 'Export CSV', 'Dashboard', 'Registre ISBN (vos ISBN)'],
                cta: 'Commencer gratuitement', primary: false, badge: '',
              },
              {
                name: 'Studio', price: '29\u20ac', period: '/mois',
                desc: 'Pour piloter plusieurs projets en production.',
                features: ['Titres illimit\u00e9s', 'Tous les 22 modules', 'Cover Studio (assemblage couverture)', 'ONIX 3.0', 'Plan m\u00e9dia IA', 'G\u00e9n\u00e9ration visuels r\u00e9seaux sociaux', 'Bande-annonce (brief Runway)'],
                cta: 'Essai gratuit 14 jours', primary: true, badge: 'POPULAIRE',
              },
              {
                name: 'Maison', price: '79\u20ac', period: '/mois',
                desc: 'Pour un catalogue et une \u00e9quipe.',
                features: ['Tout du plan Studio', 'Multi-utilisateurs (5)', 'Production audiobook (ElevenLabs)', 'API & webhooks', 'Connexion Dilicom', 'Support prioritaire'],
                cta: 'Contacter', primary: false, badge: '',
              },
            ].map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.1}>
                <div style={{
                  border: plan.primary ? '2px solid #C8952E' : '1px solid #E8E4DF',
                  borderRadius: 16, padding: 28, background: plan.primary ? t.ctaFaint : t.bg,
                  position: 'relative', display: 'flex', flexDirection: 'column', height: '100%',
                }}>
                  {plan.badge && (
                    <div style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      padding: '4px 14px', borderRadius: 999, background: t.cta, color: 'white',
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                    }}>{plan.badge}</div>
                  )}
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: plan.primary ? t.cta : t.text2, marginBottom: 8 }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 700, color: t.text }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: t.text2 }}>{plan.period}</span>
                  </div>
                  <div style={{ fontSize: 14, color: t.text2, lineHeight: 1.5, margin: '10px 0 20px' }}>{plan.desc}</div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: t.text }}>
                        <Check size={14} color={t.cta} strokeWidth={2.5} />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Link href={plan.name === 'Maison' ? 'mailto:contact@jabrilia.com' : '/auth'} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 999,
                    background: plan.primary ? t.cta : 'white',
                    color: plan.primary ? 'white' : t.text,
                    border: plan.primary ? 'none' : '1px solid #E8E4DF',
                    fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    boxShadow: plan.primary ? '0 4px 16px rgba(200,149,46,0.25)' : 'none',
                  }}>
                    {plan.cta}
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '72px 0', borderTop: '1px solid #E8E4DF' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
          <FadeIn>
            <div style={{
              background: 'white', border: '1px solid #E8E4DF', borderRadius: 20,
              padding: '48px 40px', textAlign: 'center',
              boxShadow: '0 8px 40px rgba(0,0,0,0.05)',
            }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 2.6vw, 34px)', lineHeight: 1.15, fontWeight: 700, color: t.text, margin: '0 0 10px' }}>
                Structurons votre catalogue.
              </h2>
              <p style={{ color: t.text2, fontSize: 16, lineHeight: 1.6, margin: '0 0 24px' }}>
                Cr{'\u00e9'}ez un premier projet en 2 minutes.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/auth" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, padding: '0 28px',
                  borderRadius: 999, background: t.cta, color: '#fff', fontSize: 15, fontWeight: 600,
                  textDecoration: 'none', boxShadow: '0 4px 16px rgba(200,149,46,0.25)',
                }}>
                  Cr{'\u00e9'}er mon espace <ArrowRight size={16} />
                </Link>
                <a href="mailto:contact@jabrilia.com" style={{
                  display: 'inline-flex', alignItems: 'center', height: 48, padding: '0 24px',
                  borderRadius: 999, border: '1px solid #E8E4DF', background: 'white',
                  color: t.text, fontSize: 15, fontWeight: 500, textDecoration: 'none',
                }}>
                  Contact
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #E8E4DF', padding: '40px 0 32px', color: t.text2 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32 }} className="grid-footer">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Logo size={22} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: t.cta, letterSpacing: 2 }}>JABR</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, maxWidth: '36ch' }}>
                Cockpit {'\u00e9'}ditorial pour publier mieux, plus clairement.
              </div>
              <div style={{ fontSize: 13, marginTop: 12 }}>
                Un produit <a href="https://jabrilia.com" target="_blank" rel="noopener" style={{ color: t.cta, textDecoration: 'none', fontWeight: 500 }}>Jabrilia {'\u00c9'}ditions</a>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: t.text, fontSize: 13, marginBottom: 12 }}>Produit</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="#pipeline" style={{ fontSize: 14, color: t.text2, textDecoration: 'none' }}>Pipeline</a>
                <a href="#modules" style={{ fontSize: 14, color: t.text2, textDecoration: 'none' }}>Modules</a>
                <a href="#tarifs" style={{ fontSize: 14, color: t.text2, textDecoration: 'none' }}>Tarifs</a>
                <a href="#demo" style={{ fontSize: 14, color: t.text2, textDecoration: 'none' }}>D{'\u00e9'}mo</a>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: t.text, fontSize: 13, marginBottom: 12 }}>Communaut{'\u00e9'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="https://www.facebook.com/LesPageDeJade" target="_blank" rel="noopener" style={{ fontSize: 14, color: t.text2, textDecoration: 'none' }}>Les Pages de Jade</a>
                <a href="https://www.linkedin.com/in/steve-moradel/" target="_blank" rel="noopener" style={{ fontSize: 14, color: t.text2, textDecoration: 'none' }}>LinkedIn</a>
                <a href="mailto:contact@jabrilia.com" style={{ fontSize: 14, color: t.text2, textDecoration: 'none' }}>Contact</a>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: t.text, fontSize: 13, marginBottom: 12 }}>L{'\u00e9'}gal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="/mentions-legales" style={{ fontSize: 14, color: t.text2, textDecoration: 'none' }}>Mentions l{'\u00e9'}gales</a>
                <a href="/confidentialite" style={{ fontSize: 14, color: t.text2, textDecoration: 'none' }}>Confidentialit{'\u00e9'}</a>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #E8E4DF', fontSize: 13, color: t.text2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>{'\u00a9'} 2026 Jabrilia {'\u00c9'}ditions. Tous droits r{'\u00e9'}serv{'\u00e9'}s.</span>
            <span>Fait avec soin en Guadeloupe &amp; Paris.</span>
          </div>
        </div>
      </footer>

      {/* RESPONSIVE CSS */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-preview { margin-top: 20px; }
          .grid-responsive { grid-template-columns: 1fr !important; }
          .grid-footer { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
        }
        @media (max-width: 600px) {
          .grid-footer { grid-template-columns: 1fr !important; }
          .hide-mobile-preview { display: none !important; }
        }
        @media (max-width: 820px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: inline-flex !important; }
        }
        @media (min-width: 821px) {
          .show-mobile { display: none !important; }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
