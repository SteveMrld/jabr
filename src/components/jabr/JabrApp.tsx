'use client';

import { useState } from 'react';
import { PROJECTS, PIPELINE_STEPS, COLLECTIONS, DIAG_LABELS, DISTRIBUTION_CHANNELS, FORMAT_LABELS, EDITION_STATUS_LABELS, MANUSCRIPT_STATUS_LABELS, countISBN, primaryISBN, primaryPrice, KDP_TRIM_SIZES, KDP_PAPER_TYPES, KDP_CONSTANTS, FR_PRINT_CONSTANTS, FR_TRIM_SIZES, calcKDPCover, calcFRCover, type Project, type Edition, type EditionFormat, type ManuscriptStatus, type AnalysisResult, type TrimSizeKey, type PaperType, type FrTrimKey, type CoverSpecs } from '@/lib/data';
import { useProjects } from '@/lib/useProjects';

// ═══════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════
const c = {
  or: '#C8952E', oc: '#E8B84B', od: '#F5DCA0',
  mv: '#2D1B4E', vi: '#3E2768', vm: '#5B3E8A',
  bc: '#FAF7F2', gr: '#9E9689', gc: '#E8E4DF', ft: '#F5F3EF',
  og: '#E07A2F', ok: '#2EAE6D', er: '#D94452', nr: '#2D2A26',
};

// ═══════════════════════════════════
// ICONS
// ═══════════════════════════════════
const sv = (d: React.ReactNode, s = 20) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const icons: Record<string, React.ReactNode> = {
  dashboard: sv(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="4" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="11" width="7" height="10" rx="1" /></>),
  projets: sv(<><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></>),
  calibrage: sv(<><rect x="4" y="6" width="10" height="12" rx="2" /><line x1="14" y1="6" x2="20" y2="6" /><line x1="14" y1="10" x2="20" y2="10" /><line x1="14" y1="14" x2="20" y2="14" /></>),
  couvertures: sv(<><rect x="6" y="3" width="12" height="18" rx="2" /><line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="15" y2="11" /></>),
  audiobooks: sv(<><rect x="5" y="6" width="8" height="12" rx="2" /><path d="M15 9c1.5 1.5 1.5 4.5 0 6" /><path d="M17 7c3 3 3 7 0 10" /></>),
  distribution: sv(<><circle cx="12" cy="12" r="2" /><path d="M12 4v4M12 16v4M4 12h4M16 12h4" /></>),
  marketing: sv(<><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></>),
  analytics: sv(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>),
  isbn: sv(<><rect x="5" y="5" width="14" height="14" rx="2" /><line x1="8" y1="8" x2="8" y2="16" /><line x1="11" y1="8" x2="11" y2="16" /><line x1="14" y1="8" x2="14" y2="16" /></>),
  collections: sv(<><rect x="4" y="6" width="5" height="12" rx="1" /><rect x="10" y="6" width="5" height="12" rx="1" /><rect x="16" y="6" width="4" height="12" rx="1" /></>),
  settings: sv(<><circle cx="12" cy="12" r="3" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></>),
  bell: sv(<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>),
  plus: sv(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>, 18),
  chevR: sv(<polyline points="9 18 15 12 9 6" />, 16),
  chevL: sv(<polyline points="15 18 9 12 15 6" />, 16),
  close: sv(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>, 18),
  warn: sv(<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>, 16),
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l2 5 5 .5-4 3.5 1.2 5L12 15.5 7.8 18l1.2-5-4-3.5L10 9z" /></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="7" /><path d="M12 8v4l2 2" /></svg>,
  search: sv(<><circle cx="11" cy="11" r="6" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>),
  edit: sv(<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>, 16),
  trash: sv(<><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></>),
  download: sv(<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>),
  manuscrits: sv(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>),
  analyse: sv(<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>),
  upload: sv(<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>),
  presse: sv(<><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8z" /></>),
  image: sv(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>),
  share: sv(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>),
};

// ═══════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════
const Badge = ({ children, bg, color: cl }: { children: React.ReactNode; bg: string; color: string }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: bg, color: cl }}>{children}</span>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, [string, string, string, React.ReactNode | null]> = {
    published: ['Publié', '#D4F0E0', '#1A6B42', icons.star],
    'in-progress': ['En cours', '#FDE8D0', '#B05A1A', icons.clock],
    draft: ['Brouillon', c.gc, '#6B6560', null],
  };
  const [label, bg, cl, icon] = map[status] || map.draft;
  return <Badge bg={bg} color={cl}>{icon && <span className="flex">{icon}</span>}{label}</Badge>;
};

const GenreBadge = ({ genre }: { genre: string }) => <Badge bg="#E8E0F0" color="#3E2768">{genre}</Badge>;
const CollBadge = ({ collection }: { collection: string }) => <Badge bg={c.od} color="#6B5320">{collection}</Badge>;

const ScoreBar = ({ score, max, large }: { score: number; max: number; large?: boolean }) => {
  const pct = (score / max) * 100;
  const color = pct === 100 ? c.ok : pct >= 50 ? c.or : c.er;
  return (
    <div className="flex items-center gap-2" style={{ minWidth: large ? 150 : 100 }}>
      <div className="flex-1 overflow-hidden rounded" style={{ height: large ? 8 : 6, background: c.gc }}>
        <div className="h-full rounded transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-semibold text-right" style={{ fontSize: large ? 13 : 11, color, minWidth: 28 }}>{score}/{max}</span>
    </div>
  );
};

const ScoreCircle = ({ score, max }: { score: number; max: number }) => {
  const pct = score / max;
  const color = pct === 1 ? c.ok : c.or;
  return (
    <div className="flex items-center justify-center rounded-full" style={{ width: 80, height: 80, background: `conic-gradient(${color} ${pct * 360}deg, ${c.gc} 0deg)` }}>
      <div className="flex items-center justify-center rounded-full bg-white" style={{ width: 62, height: 62, fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: c.mv }}>
        {score}<span style={{ fontSize: 12, color: c.gr }}>/{max}</span>
      </div>
    </div>
  );
};

const StatCard = ({ value, label, accent }: { value: string | number; label: string; accent?: string }) => (
  <div className="bg-white rounded-xl border p-4 text-center transition-colors hover:border-[#C8952E]" style={{ borderColor: c.gc }}>
    <div style={{ fontSize: 24, fontWeight: 700, color: accent || c.mv, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{value}</div>
    <div className="mt-1.5 uppercase tracking-wider" style={{ fontSize: 9, color: c.gr, fontWeight: 600 }}>{label}</div>
  </div>
);

const Card = ({ children, className = '', hover = true, onClick, style }: { children: React.ReactNode; className?: string; hover?: boolean; onClick?: () => void; style?: React.CSSProperties }) => (
  <div onClick={onClick} className={`bg-white rounded-xl border overflow-hidden transition-colors ${hover ? 'hover:border-[#C8952E]' : ''} ${className}`} style={{ borderColor: c.gc, ...style }}>
    {children}
  </div>
);

const CoverThumb = ({ emoji, coverImage, size = 'md' }: { emoji: string; coverImage?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = { sm: 'w-9 h-12', md: 'w-10 h-14', lg: 'w-[100px] h-[140px]' };
  const fontSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-5xl' };
  if (coverImage) {
    return (
      <div className={`${sizes[size]} rounded-lg overflow-hidden shrink-0`}
        style={{ boxShadow: size === 'lg' ? '0 8px 24px rgba(45,27,78,0.3)' : '0 2px 8px rgba(0,0,0,0.12)' }}>
        <img src={coverImage} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${sizes[size]} rounded-lg flex items-center justify-center shrink-0 ${fontSizes[size]}`}
      style={{ background: `linear-gradient(135deg, ${c.mv}, ${c.vi})`, boxShadow: size === 'lg' ? '0 8px 24px rgba(45,27,78,0.3)' : undefined }}>
      {emoji}
    </div>
  );
};

const Btn = ({ children, variant = 'primary', onClick, className = '' }: { children: React.ReactNode; variant?: 'primary' | 'secondary'; onClick?: () => void; className?: string }) => (
  <button onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-semibold text-[13px] transition-colors cursor-pointer ${variant === 'primary' ? 'text-white hover:bg-[#E8B84B]' : 'border hover:bg-gray-50'} ${className}`}
    style={variant === 'primary' ? { background: c.or } : { borderColor: c.vm, color: c.vm }}>
    {children}
  </button>
);

// ═══════════════════════════════════
// LOGO
// ═══════════════════════════════════
const JabrLogo = () => (
  <div className="flex items-center gap-2.5">
    <svg width="30" height="30" viewBox="0 0 100 100" fill="none">
      <defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E8B84B" /><stop offset="100%" stopColor="#A07424" /></linearGradient></defs>
      <path d="M65 15c8 0 14 5 14 12s-6 13-14 13h-5c-3 0-5 2-6 4l-8 22c-3 8-10 14-18 14-10 0-16-7-14-16l2-8c1-4 5-7 9-7h6c4 0 7-3 8-6l6-16c3-7 10-12 18-12z" fill="url(#g1)" />
      <circle cx="72" cy="72" r="4" fill="url(#g1)" />
      <path d="M35 10c2-2 5-3 8-3" stroke="url(#g1)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: c.or, letterSpacing: 3 }}>JABR</span>
  </div>
);

// ═══════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════
const NAV_ITEMS: (readonly [string, string, string] | null)[] = [
  ['dashboard', 'Dashboard', 'dashboard'],
  ['projets', 'Projets', 'projets'],
  ['manuscrits', 'Manuscrits', 'manuscrits'],
  ['analyse', 'Analyse', 'analyse'],
  ['calibrage', 'Calibrage', 'calibrage'],
  ['couvertures', 'Couvertures', 'couvertures'],
  ['audiobooks', 'Audiobooks', 'audiobooks'],
  ['distribution', 'Distribution', 'distribution'],
  ['marketing', 'Marketing', 'marketing'],
  ['presse', 'Dossier Presse', 'presse'],
  ['analytics', 'Analytics', 'analytics'],
  null, // separator
  ['isbn', 'ISBN', 'isbn'],
  ['collections', 'Collections', 'collections'],
  ['settings', 'Paramètres', 'settings'],
];

const Sidebar = ({ active, onNav, projects, persisted, open, onToggle }: { active: string; onNav: (id: string) => void; projects: Project[]; persisted: boolean; open: boolean; onToggle: () => void }) => {
  const corrCount = projects.reduce((s, p) => s + p.corrections.length, 0);
  const draftCount = projects.filter(p => p.status === 'draft').length;
  const audioCount = projects.filter(p => p.editions.some(e => e.format === 'audiobook')).length;
  const withManuscript = projects.filter(p => p.manuscriptStatus && p.manuscriptStatus !== 'none').length;
  const badges: Record<string, number> = { couvertures: corrCount, projets: projects.length, isbn: countISBN(projects), audiobooks: audioCount, manuscrits: withManuscript };

  return (
  <>
  {/* Overlay for mobile */}
  {open && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onToggle} />}
  <div className={`fixed lg:relative z-50 lg:z-auto w-[220px] min-h-screen flex flex-col py-5 shrink-0 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} style={{ background: `linear-gradient(180deg, ${c.mv}, #1A0F2E)` }}>
    <div className="px-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <JabrLogo />
      <div className="mt-1 uppercase" style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px' }}>Pipeline éditorial</div>
    </div>

    <div className="flex-1 px-2.5 py-3 flex flex-col gap-0.5">
      {NAV_ITEMS.map((item, i) => {
        if (!item) return <div key={i} className="mx-2.5 my-2" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />;
        const [id, label, iconKey] = item;
        const isActive = active === id;
        const badge = badges[id];
        return (
          <button key={id} onClick={() => { onNav(id); if (window.innerWidth < 1024) onToggle(); }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg cursor-pointer transition-all relative text-left"
            style={{ background: isActive ? c.vi : 'transparent', color: isActive ? 'white' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: isActive ? 600 : 400, border: 'none' }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(62,39,104,0.5)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}>
            {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r" style={{ background: c.or }} />}
            <span className="flex" style={{ color: isActive ? c.or : 'inherit' }}>{icons[iconKey]}</span>
            <span className="flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="min-w-[20px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold px-1"
                style={{ background: id === 'couvertures' && corrCount > 0 ? 'rgba(217,68,82,0.8)' : 'rgba(255,255,255,0.12)', color: id === 'couvertures' && corrCount > 0 ? 'white' : 'rgba(255,255,255,0.5)' }}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>

    <div className="flex items-center gap-3 px-5 pt-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: `linear-gradient(135deg, ${c.or}, ${c.oc})` }}>SM</div>
      <div>
        <div className="text-white text-[13px] font-medium">Steve M.</div>
        <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: persisted ? '#2EAE6D' : '#E07A2F' }} />
          {persisted ? 'Sync Supabase' : 'Mode local'}
        </div>
      </div>
    </div>
  </div>
  </>
  );
};

// ═══════════════════════════════════
// VIEWS
// ═══════════════════════════════════

// --- DASHBOARD ---
const DashboardView = ({ onProject, onNew, projects, allProjects, onNav }: { onProject: (p: Project) => void; onNew: () => void; projects: Project[]; allProjects: Project[]; onNav?: (id: string) => void }) => {
  const pub = allProjects.filter(p => p.status === 'published').length;
  const prog = allProjects.filter(p => p.status === 'in-progress').length;
  const corr = allProjects.reduce((s, p) => s + p.corrections.length, 0);
  const analyzed = allProjects.filter(p => p.analysis);
  const avgIa = analyzed.length > 0 ? Math.round(analyzed.reduce((s, p) => s + (p.analysis?.iaScore || 0), 0) / analyzed.length) : null;
  const withBackCover = allProjects.filter(p => p.backCover && p.backCover.length > 50).length;
  const withCoverArt = allProjects.filter(p => p.coverImage).length;
  const withAudio = allProjects.filter(p => p.editions.some(e => e.format === 'audiobook')).length;
  const totalPages = allProjects.reduce((s, p) => s + p.pages, 0);

  const [sort, setSort] = useState<'title' | 'score' | 'status' | 'editions'>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: typeof sort) => {
    if (sort === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(key); setSortDir('asc'); }
  };

  const sorted = [...projects].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sort === 'title') return a.title.localeCompare(b.title) * dir;
    if (sort === 'score') return (a.score - b.score) * dir;
    if (sort === 'editions') return (a.editions.length - b.editions.length) * dir;
    const order = { published: 3, 'in-progress': 2, draft: 1 };
    return (order[a.status] - order[b.status]) * dir;
  });

  const SortBtn = ({ label, k }: { label: string; k: typeof sort }) => (
    <button onClick={() => toggleSort(k)} className="cursor-pointer bg-transparent border-none text-[10px] uppercase tracking-wider font-semibold flex items-center gap-0.5 hover:opacity-70"
      style={{ color: sort === k ? c.or : c.gr }}>
      {label} {sort === k && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );

  // Readiness quick checks
  const readinessChecks = (p: typeof allProjects[0]) => {
    const ch = [
      p.manuscriptStatus === 'validated' || p.manuscriptStatus === 'isbn-injected',
      p.editions.length > 0,
      p.corrections.length === 0,
      !!p.coverImage,
      !!(p.backCover && p.backCover.length > 50),
      !!p.analysis,
      p.status === 'published',
    ];
    return ch.filter(Boolean).length;
  };

  // Revenue estimate
  const estimateRevenue = (p: typeof allProjects[0]) => {
    let rev = 0;
    p.editions.forEach(ed => {
      const price = parseFloat((ed.price || '0').replace('€', '').replace(',', '.'));
      if (ed.format === 'broché') rev += price * 0.4 * 200;
      else if (ed.format === 'epub') rev += price * 0.7 * 150;
      else if (ed.format === 'audiobook') rev += price * 0.4 * 80;
      else if (ed.format === 'poche') rev += price * 0.35 * 300;
    });
    return Math.round(rev);
  };
  const totalRev = allProjects.reduce((s, p) => s + estimateRevenue(p), 0);

  // Next priorities
  const priorities: { label: string; count: number; color: string; nav: string }[] = [];
  const noCover = allProjects.filter(p => !p.coverImage).length;
  const noBack = allProjects.filter(p => !p.backCover || p.backCover.length < 50).length;
  const noAnalysis = allProjects.filter(p => !p.analysis).length;
  if (corr > 0) priorities.push({ label: `${corr} corrections couverture`, count: corr, color: c.er, nav: 'couvertures' });
  if (noAnalysis > 0) priorities.push({ label: `${noAnalysis} manuscrits non analysés`, count: noAnalysis, color: c.og, nav: 'analyse' });
  if (noBack > 0) priorities.push({ label: `${noBack} titres sans 4e de couverture`, count: noBack, color: c.og, nav: 'projets' });
  if (noCover > 0) priorities.push({ label: `${noCover} titres sans artwork`, count: noCover, color: c.og, nav: 'couvertures' });

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <h2 className="text-2xl" style={{ color: c.mv }}>Dashboard</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Jabrilia Éditions — Cockpit éditorial</p>
        </div>
        <Btn onClick={onNew}>{icons.plus} Nouveau projet</Btn>
      </div>

      {/* KPIs row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
        <StatCard value={allProjects.length} label="Titres" accent={c.mv} />
        <StatCard value={pub} label="Publiés" accent={c.ok} />
        <StatCard value={prog} label="En cours" accent={c.og} />
        <StatCard value={`${countISBN(allProjects)}/100`} label="ISBN" accent={c.or} />
        <StatCard value={totalPages.toLocaleString()} label="Pages" accent={c.vm} />
        <StatCard value={`~${totalRev.toLocaleString()}€`} label="Rev. estimés/an" accent={c.or} />
      </div>

      {/* KPIs row 2 — production */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard value={`${withCoverArt}/${allProjects.length}`} label="Artwork" accent={withCoverArt === allProjects.length ? c.ok : c.og} />
        <StatCard value={`${withBackCover}/${allProjects.length}`} label="4e couverture" accent={withBackCover === allProjects.length ? c.ok : c.og} />
        <StatCard value={`${analyzed.length}/${allProjects.length}`} label="Analysés" accent={analyzed.length === allProjects.length ? c.ok : c.og} />
        <StatCard value={withAudio} label="Audiobooks" accent={c.vm} />
        <StatCard value={avgIa !== null ? `${avgIa}%` : '—'} label="Score IA moy." accent={avgIa !== null && avgIa > 25 ? c.er : c.ok} />
        <StatCard value={corr} label="Corrections" accent={corr > 0 ? c.er : c.ok} />
      </div>

      {/* Priorities */}
      {priorities.length > 0 && (
        <div className="rounded-xl p-4 mb-5" style={{ background: '#FFF8F0', border: '1px solid #F4A55A' }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: c.og }}>{icons.warn}</span>
            <span className="text-[13px] font-semibold" style={{ color: c.og }}>Actions prioritaires</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {priorities.map((pr, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer hover:bg-white/50 transition-colors"
                onClick={() => onNav?.(pr.nav)}>
                <div className="w-2 h-2 rounded-full" style={{ background: pr.color }} />
                <span className="text-[12px]" style={{ color: c.nr }}>{pr.label}</span>
                <span className="text-[10px] ml-auto" style={{ color: c.gr }}>→ {pr.nav}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick readiness per title */}
      <Card hover={false} className="mb-5">
        <div className="flex justify-between items-center px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Readiness</span>
          <span className="text-[10px]" style={{ color: c.gr }}>Manuscrit · ISBN · Couverture · Artwork · 4e · Analyse · Publié</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0">
          {allProjects.map(p => {
            const done = readinessChecks(p);
            const pct = Math.round((done / 7) * 100);
            return (
              <div key={p.id} className="flex flex-col items-center p-3 cursor-pointer hover:bg-[#FAF7F2] transition-colors"
                onClick={() => onProject(p)}
                style={{ borderBottom: `1px solid ${c.ft}`, borderRight: `1px solid ${c.ft}` }}>
                <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                <div className="text-[9px] font-semibold mt-1.5 text-center truncate w-full" style={{ color: c.nr }}>{p.title.length > 18 ? p.title.slice(0, 16) + '…' : p.title}</div>
                <div className="w-full h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: c.ft }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? c.ok : pct >= 70 ? c.og : c.er }} />
                </div>
                <div className="text-[9px] font-bold mt-0.5" style={{ color: pct === 100 ? c.ok : pct >= 70 ? c.og : c.er }}>{done}/7</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Catalogue */}
      <Card hover={false}>
        <div className="flex justify-between items-center px-5 py-3.5" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Catalogue</span>
          <div className="flex items-center gap-4">
            <SortBtn label="Titre" k="title" />
            <SortBtn label="Score" k="score" />
            <SortBtn label="Statut" k="status" />
            <SortBtn label="Éditions" k="editions" />
            <span className="ml-2" style={{ fontSize: 11, color: c.gr }}>{projects.length} titre{projects.length > 1 ? 's' : ''}</span>
          </div>
        </div>
        {sorted.map(p => (
          <div key={p.id} onClick={() => onProject(p)}
            className="flex items-center gap-3.5 px-5 py-3 cursor-pointer transition-colors hover:bg-[#FAF7F2]"
            style={{ borderBottom: `1px solid ${c.ft}` }}>
            <CoverThumb emoji={p.cover} coverImage={p.coverImage} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate" style={{ color: c.nr }}>
                {p.title}
                {p.subtitle && <span className="font-normal ml-1.5" style={{ color: c.gr, fontSize: 11 }}>— {p.subtitle}</span>}
              </div>
              <div className="flex gap-1.5 mt-1">
                <GenreBadge genre={p.genre} />
                {p.collection && <CollBadge collection={p.collection} />}
              </div>
            </div>
            <Badge bg={c.ft} color={c.vm}>{p.editions.length} éd.</Badge>
            <div className="w-[110px]"><ScoreBar score={p.score} max={p.maxScore} /></div>
            <StatusBadge status={p.status} />
            {p.corrections.length > 0 && <Badge bg="#FDE0E3" color="#A0303D">{p.corrections.length}</Badge>}
            {p.analysis && (
              <span className="text-[9px] font-bold" style={{ color: p.analysis.iaScore > 30 ? c.er : p.analysis.iaScore > 15 ? c.og : c.ok }}>
                IA:{p.analysis.iaScore}%
              </span>
            )}
            <div style={{ color: c.gr }}>{icons.chevR}</div>
          </div>
        ))}
      </Card>
    </div>
  );
};

// --- COVER SPEC PANEL ---
const CoverSpecPanel = ({ pages, genre, title }: { pages: number; genre: string; title: string }) => {
  const [channel, setChannel] = useState<'kdp' | 'fr'>('kdp');
  const [kdpTrim, setKdpTrim] = useState<TrimSizeKey>(genre === 'BD' || genre === 'Jeunesse' ? '8.5x11' : '6x9');
  const [kdpPaper, setKdpPaper] = useState<PaperType>(genre === 'BD' || genre === 'Jeunesse' ? 'color' : 'cream');
  const [frTrim, setFrTrim] = useState<FrTrimKey>(genre === 'BD' ? 'BD' : genre === 'Jeunesse' ? 'A4' : 'A5+');
  const [frGsm, setFrGsm] = useState(80);

  const specs = channel === 'kdp'
    ? calcKDPCover(kdpTrim, pages, kdpPaper)
    : calcFRCover(frTrim, pages, frGsm);

  const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
    <div className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
      <span className="text-[12px]" style={{ color: c.gr }}>{label}</span>
      <span className="text-[12px] font-semibold" style={{ color: c.mv, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined }}>{value}</span>
    </div>
  );

  return (
    <Card hover={false} className="p-6 mt-5">
      <div className="flex justify-between items-center mb-4">
        <div className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Gabarit Couverture</div>
        <div className="flex gap-1">
          {(['kdp', 'fr'] as const).map(ch => (
            <button key={ch} onClick={() => setChannel(ch)}
              className="px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors border-none"
              style={{ background: channel === ch ? c.mv : c.ft, color: channel === ch ? 'white' : c.gr }}>
              {ch === 'kdp' ? 'Amazon KDP' : 'Imprimeur FR'}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {channel === 'kdp' ? (
          <>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: c.gr }}>Format (Trim size)</label>
              <select value={kdpTrim} onChange={e => setKdpTrim(e.target.value as TrimSizeKey)}
                className="w-full px-2 py-1.5 rounded-lg border text-[12px] outline-none" style={{ borderColor: c.gc }}>
                {KDP_TRIM_SIZES.map(t => (
                  <option key={t.key} value={t.key}>{t.label} ({t.widthMm}×{t.heightMm} mm){t.recommended ? ` — ${t.recommended.join(', ')}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: c.gr }}>Papier</label>
              <select value={kdpPaper} onChange={e => setKdpPaper(e.target.value as PaperType)}
                className="w-full px-2 py-1.5 rounded-lg border text-[12px] outline-none" style={{ borderColor: c.gc }}>
                {KDP_PAPER_TYPES.map(p => (
                  <option key={p.type} value={p.type}>{p.label} ({p.gsm}g)</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: c.gr }}>Format</label>
              <select value={frTrim} onChange={e => setFrTrim(e.target.value as FrTrimKey)}
                className="w-full px-2 py-1.5 rounded-lg border text-[12px] outline-none" style={{ borderColor: c.gc }}>
                {Object.entries(FR_TRIM_SIZES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: c.gr }}>Grammage papier</label>
              <select value={frGsm} onChange={e => setFrGsm(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded-lg border text-[12px] outline-none" style={{ borderColor: c.gc }}>
                {[70, 80, 90, 100, 115].map(g => (
                  <option key={g} value={g}>{g}g offset</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Specs output */}
      <div className="rounded-lg p-4" style={{ background: c.ft }}>
        <div className="text-[11px] font-semibold mb-3" style={{ color: c.mv }}>
          Dimensions calculées — {title} ({pages} pages)
        </div>
        <div className="grid grid-cols-2 gap-x-6">
          <div>
            <Row label="Couverture totale" value={`${specs.totalWidthMm.toFixed(1)} × ${specs.totalHeightMm.toFixed(1)} mm`} mono />
            <Row label="En pouces" value={`${specs.totalWidthIn.toFixed(4)}" × ${specs.totalHeightIn.toFixed(4)}"`} mono />
            <Row label="Résolution (300 DPI)" value={`${specs.pixelWidth} × ${specs.pixelHeight} px`} mono />
            <Row label="1re de couverture" value={`${specs.frontCoverMm.w} × ${specs.frontCoverMm.h} mm`} mono />
          </div>
          <div>
            <Row label="Dos (tranche)" value={`${specs.spineWidthMm.toFixed(2)} mm`} mono />
            <Row label="Texte sur dos" value={specs.canHaveSpineText ? '✓ Autorisé' : '✗ Interdit (< 79p)'} />
            <Row label="Fond perdu" value={channel === 'kdp' ? `${KDP_CONSTANTS.bleedMm} mm` : `${FR_PRINT_CONSTANTS.bleedMm} mm`} />
            <Row label="Marge sécurité" value={channel === 'kdp' ? `${KDP_CONSTANTS.safeMarginMm} mm` : `${FR_PRINT_CONSTANTS.safeMarginMm} mm`} />
          </div>
        </div>

        {/* Visual spine diagram */}
        <div className="mt-4 flex items-center justify-center gap-0" style={{ height: 60 }}>
          <div className="flex items-center justify-center rounded-l-lg text-[9px] font-semibold text-white"
            style={{ width: 80, height: 50, background: c.vm }}>
            4e couv
          </div>
          <div className="flex items-center justify-center text-[8px] font-bold text-white"
            style={{ width: Math.max(20, Math.min(60, specs.spineWidthMm * 3)), height: 50, background: c.or }}>
            {specs.spineWidthMm.toFixed(1)}
          </div>
          <div className="flex items-center justify-center rounded-r-lg text-[9px] font-semibold text-white"
            style={{ width: 80, height: 50, background: c.mv }}>
            1re couv
          </div>
        </div>

        {/* Channel-specific notes */}
        <div className="mt-3 text-[10px]" style={{ color: c.gr }}>
          {channel === 'kdp' ? (
            <>Format: PDF unique (4e + dos + 1re). Finition: brillant ou mat. Max: 650 Mo. Couleurs: sRGB ou CMJN.<br />
            <a href="https://kdp.amazon.com/cover-calculator" target="_blank" rel="noopener" className="underline" style={{ color: c.vm }}>→ KDP Cover Calculator officiel</a></>
          ) : (
            <>Format: PDF (4e + dos + 1re à plat). CMJN obligatoire. 300 DPI min. Pelliculage: brillant, mat ou soft touch.<br />
            Couverture 300g dos carré collé. Prévoir zone code-barres 30×20 mm en bas à droite de la 4e.</>
          )}
        </div>
      </div>
    </Card>
  );
};

// --- PROJECT DETAIL ---
const STEP_DETAILS: Record<string, { desc: string; action: string; tools: string }> = {
  'Calibrage': { desc: 'Calcul du nombre de pages, format, police, marges et épaisseur du dos.', action: 'Lancer le calibrage', tools: 'Format 15,2×22,9 · Garamond 11pt' },
  'Couverture': { desc: 'Création et validation de la couverture : 1re, 4e, dos, rabats.', action: 'Uploader la couverture', tools: 'EAN-13 · ISBN · Prix TTC · Logo' },
  'Diagnostic': { desc: 'Vérification automatique des 7 critères de conformité.', action: 'Lancer le diagnostic', tools: 'Score qualité · Corrections auto' },
  'BAT': { desc: 'Bon à Tirer — validation finale avant impression.', action: 'Générer le BAT', tools: 'PDF haute résolution · CMJN' },
  'ePub': { desc: 'Conversion au format ePub pour distribution numérique.', action: 'Générer l\'ePub', tools: 'ePub 3.0 · Validation W3C' },
  'Audio': { desc: 'Production audiobook : TTS, clonage voix, mastering.', action: 'Lancer la production', tools: 'ElevenLabs · MP3 320kbps' },
  'Marketing': { desc: 'Fiche produit, visuels réseaux sociaux, communiqué de presse.', action: 'Créer les assets', tools: 'Fiche · Visuels · CP' },
  'Distribution': { desc: 'Export vers les canaux de distribution configurés.', action: 'Lancer la distribution', tools: 'KDP · IngramSpark · Pollen' },
};

const DetailView = ({ project: p, onBack, onUpdate, onToast, onDelete }: { project: Project; onBack: () => void; onUpdate: (p: Project) => void; onToast: (msg: string) => void; onDelete: (id: number) => void }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(p.title);
  const [editPages, setEditPages] = useState(String(p.pages));
  const [editSubtitle, setEditSubtitle] = useState(p.subtitle || '');
  const [editBackCover, setEditBackCover] = useState(p.backCover || '');
  const [editNotes, setEditNotes] = useState(p.notes || '');
  const stepStatuses = PIPELINE_STEPS.map((_, i) => {
    if (p.status === 'published') return 'done';
    if (p.status === 'in-progress') return i <= 1 ? 'done' : i === 2 ? 'active' : 'todo';
    return i === 0 ? 'active' : 'todo';
  });
  const detail = STEP_DETAILS[PIPELINE_STEPS[activeStep]];

  // Keyboard: Escape to go back
  useState(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (showDeleteConfirm) setShowDeleteConfirm(false); else if (editing) setEditing(false); else onBack(); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  const changeStatus = (newStatus: 'published' | 'in-progress' | 'draft') => {
    onUpdate({ ...p, status: newStatus });
    setShowStatusMenu(false);
    const labels = { published: 'Publié', 'in-progress': 'En cours', draft: 'Brouillon' };
    onToast(`${p.title} → ${labels[newStatus]}`);
  };

  const saveEdit = () => {
    if (editTitle.trim()) {
      onUpdate({ ...p, title: editTitle.trim(), pages: parseInt(editPages) || p.pages, subtitle: editSubtitle.trim() || undefined, backCover: editBackCover.trim() || undefined, notes: editNotes.trim() || undefined });
      setEditing(false);
      onToast('Modifications enregistrées');
    }
  };

  const handleDelete = () => {
    onDelete(p.id);
    onToast(`${p.title} supprimé`);
    onBack();
  };

  // ── Scanner manuscrit ──
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScan = async (file: File) => {
    setScanning(true);
    setScanError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', p.title);
      const res = await fetch('/api/analyze', { method: 'POST', body: form });
      const data = await res.json();
      if (data.error) { setScanError(data.error); onToast(`Erreur: ${data.error}`); return; }
      // Update project with analysis result
      onUpdate({
        ...p,
        manuscriptStatus: 'analyzed',
        manuscriptFile: p.manuscriptFile || file.name,
        analysis: {
          iaScore: data.iaScore,
          redundancies: data.redundancies,
          avgSentenceLength: data.avgSentenceLength,
          wordCount: data.wordCount,
          timestamp: data.timestamp,
          flaggedPatterns: data.flaggedPatterns,
        },
      });
      onToast(`Analyse terminée — Score IA : ${data.iaScore}/100`);
    } catch {
      setScanError('Erreur réseau');
      onToast('Erreur lors de l\'analyse');
    } finally {
      setScanning(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith('.docx')) { onToast('Format non supporté — .docx uniquement'); return; }
    onUpdate({ ...p, manuscriptStatus: 'uploaded', manuscriptFile: file.name });
    onToast(`${file.name} associé à ${p.title}`);
    // Auto-scan after upload
    await handleScan(file);
  };

  const fileInputRef = { current: null as HTMLInputElement | null };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="flex items-center gap-1 text-[13px] cursor-pointer bg-transparent border-none" style={{ color: c.gr }}>
          {icons.chevL} Projets
        </button>
        <div className="flex gap-2">
          {!editing && <Btn variant="secondary" onClick={() => { setEditTitle(p.title); setEditPages(String(p.pages)); setEditSubtitle(p.subtitle || ''); setEditBackCover(p.backCover || ''); setEditNotes(p.notes || ''); setEditing(true); }}>{icons.edit} Modifier</Btn>}
          <button onClick={() => setShowDeleteConfirm(true)} className="px-3 py-2 rounded-lg cursor-pointer border transition-colors hover:bg-red-50"
            style={{ borderColor: '#E8C0C0', color: c.er, background: 'white', fontSize: 13 }}>
            {icons.trash}
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="rounded-xl p-4 mb-5 flex items-center gap-3" style={{ background: '#FFF0F0', border: '1px solid #E8A0A0' }}>
          <span style={{ color: c.er }}>{icons.warn}</span>
          <div className="flex-1">
            <span className="text-[13px] font-semibold" style={{ color: c.er }}>Supprimer « {p.title} » ?</span>
            <span className="text-[12px] ml-2" style={{ color: c.gr }}>Cette action est irréversible. {p.editions.length} ISBN seront libérés.</span>
          </div>
          <Btn variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</Btn>
          <button onClick={handleDelete} className="px-4 py-2 rounded-lg cursor-pointer border-none text-white text-[13px] font-semibold" style={{ background: c.er }}>Supprimer</button>
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <Card hover={false} className="p-5 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px] gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: c.gr }}>Titre</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none focus:border-[#C8952E]" style={{ borderColor: c.gc }} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: c.gr }}>Sous-titre</label>
              <input value={editSubtitle} onChange={e => setEditSubtitle(e.target.value)} placeholder="Optionnel"
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none focus:border-[#C8952E]" style={{ borderColor: c.gc }} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: c.gr }}>Pages</label>
              <input type="number" value={editPages} onChange={e => setEditPages(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none focus:border-[#C8952E]" style={{ borderColor: c.gc }} />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: c.gr }}>4e de couverture</label>
            <textarea value={editBackCover} onChange={e => setEditBackCover(e.target.value)} rows={4} placeholder="Texte de 4e de couverture..."
              className="w-full px-3 py-2 rounded-lg border text-[12px] outline-none focus:border-[#C8952E] resize-y leading-relaxed" style={{ borderColor: c.gc }} />
          </div>
          <div className="mb-3">
            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: c.gr }}>Notes éditoriales</label>
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} placeholder="Notes internes, rappels, idées..."
              className="w-full px-3 py-2 rounded-lg border text-[12px] outline-none focus:border-[#C8952E] resize-y leading-relaxed" style={{ borderColor: c.gc }} />
          </div>
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setEditing(false)}>Annuler</Btn>
            <Btn onClick={saveEdit}>Enregistrer</Btn>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-7">
        <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="lg" />
        <div className="flex-1">
          <h2 className="text-2xl" style={{ color: c.mv }}>{p.title}</h2>
          {p.subtitle && <div className="text-[13px] italic mt-0.5" style={{ color: c.vm }}>{p.subtitle}</div>}
          <div className="text-[13px] mt-1.5" style={{ color: c.gr }}>{p.author}{p.illustrator && ` · Illustré par ${p.illustrator}`}</div>
          <div className="flex gap-1.5 mt-2.5 flex-wrap items-center">
            <GenreBadge genre={p.genre} />
            {p.collection && <CollBadge collection={p.collection} />}
            {/* Editable status */}
            <div className="relative">
              <button onClick={() => setShowStatusMenu(!showStatusMenu)} className="cursor-pointer bg-transparent border-none flex items-center gap-1 hover:opacity-80">
                <StatusBadge status={p.status} />
                <span style={{ color: c.gr, fontSize: 10 }}>▼</span>
              </button>
              {showStatusMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border py-1 z-20" style={{ borderColor: c.gc, minWidth: 150 }}>
                  {(['draft', 'in-progress', 'published'] as const).map(s => (
                    <button key={s} onClick={() => changeStatus(s)}
                      className="w-full text-left px-3 py-2 text-[12px] cursor-pointer bg-transparent border-none transition-colors hover:bg-[#FAF7F2] flex items-center gap-2"
                      style={{ color: p.status === s ? c.or : c.nr, fontWeight: p.status === s ? 600 : 400 }}>
                      <StatusBadge status={s} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3.5 text-[13px]">
            <span style={{ color: c.gr }}>ISBN </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: c.mv, fontSize: 12 }}>{primaryISBN(p)}</span>
            <span className="ml-4" style={{ color: c.gr }}>Pages </span><span>{p.pages}</span>
            {primaryPrice(p) && <><span className="ml-4" style={{ color: c.gr }}>Prix </span><span className="font-semibold">{primaryPrice(p)}</span></>}
            <span className="ml-4" style={{ color: c.gr }}>Éditions </span><span className="font-semibold">{p.editions.length}</span>
          </div>
        </div>
        <div className="text-center">
          <div className="uppercase tracking-wider mb-2" style={{ fontSize: 11, color: c.gr }}>Qualité</div>
          <ScoreCircle score={p.score} max={p.maxScore} />
        </div>
      </div>

      {/* Pipeline */}
      <Card hover={false} className="p-6 mb-5">
        <div className="uppercase tracking-wider font-semibold mb-5" style={{ fontSize: 12, color: c.gr }}>Pipeline éditorial</div>
        <div className="flex">
          {PIPELINE_STEPS.map((label, i) => {
            const st = stepStatuses[i];
            const isActive = i === activeStep;
            return (
              <div key={i} className="flex-1 flex flex-col items-center cursor-pointer relative" onClick={() => setActiveStep(i)}>
                {i > 0 && <div className="absolute top-3.5 right-1/2 w-full h-0.5" style={{ background: st === 'done' ? c.ok : c.gc, zIndex: 0 }} />}
                <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center z-10 transition-all"
                  style={{
                    background: st === 'done' ? c.ok : st === 'active' ? c.or : 'white',
                    border: st === 'todo' ? `2px solid ${c.gc}` : 'none',
                    color: st === 'todo' ? c.gr : 'white',
                    boxShadow: isActive ? '0 0 0 3px rgba(200,149,46,0.25)' : 'none',
                  }}>
                  {st === 'done' ? icons.check : <span className="text-[10px] font-bold">{i + 1}</span>}
                </div>
                <span className="text-[9px] mt-1.5 text-center" style={{ fontWeight: isActive ? 700 : 500, color: st === 'done' ? c.ok : st === 'active' ? c.or : c.gr }}>{label}</span>
              </div>
            );
          })}
        </div>
        {/* Step detail panel */}
        {detail && (
          <div className="mt-5 pt-5 flex items-start gap-4" style={{ borderTop: `1px solid ${c.gc}` }}>
            <div className="flex-1">
              <div className="font-semibold text-[14px] mb-1" style={{ color: c.mv }}>{PIPELINE_STEPS[activeStep]}</div>
              <div className="text-[12px] mb-2" style={{ color: c.gr }}>{detail.desc}</div>
              <div className="text-[11px]" style={{ color: c.vm }}>{detail.tools}</div>
            </div>
            <Btn onClick={() => onToast(`${detail.action} — ${p.title}`)}>{detail.action}</Btn>
          </div>
        )}
      </Card>

      {/* Diagnostic */}
      <Card hover={false} className="p-6">
        <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Diagnostic couverture</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {Object.entries(DIAG_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.diag[key] ? c.ok : c.er }} />
              <span className="font-medium" style={{ color: p.diag[key] ? c.ok : c.er }}>{label}</span>
            </div>
          ))}
        </div>
        {p.corrections.length > 0 ? (
          <div className="rounded-lg p-3.5" style={{ background: '#FFF8F0', border: '1px solid #F4A55A' }}>
            <div className="flex items-center gap-1.5 font-semibold text-xs mb-2" style={{ color: c.og }}>
              {icons.warn} {p.corrections.length} correction{p.corrections.length > 1 ? 's' : ''} requise{p.corrections.length > 1 ? 's' : ''}
            </div>
            {p.corrections.map((fix, i) => (
              <div key={i} className="text-xs pl-4 py-0.5 relative" style={{ color: c.nr }}>
                <span className="absolute left-1 top-2 w-1.5 h-1.5 rounded-full" style={{ background: c.er }} />
                {fix}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center font-semibold text-[13px] py-2" style={{ color: c.ok }}>✓ Couverture conforme — prête pour production</div>
        )}
      </Card>

      {/* 4e de couverture — éditable */}
      <Card hover={false} className="p-6 mt-5">
        <div className="flex justify-between items-center mb-3">
          <div className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Texte 4e de couverture</div>
          {!editing && (
            <button className="text-[11px] px-3 py-1 rounded-lg cursor-pointer border-none transition-colors font-semibold"
              style={{ background: c.ft, color: c.vm }}
              onClick={() => { setEditBackCover(p.backCover || ''); setEditing(true); }}>
              {icons.edit} Modifier
            </button>
          )}
        </div>
        {p.backCover ? (
          <div className="rounded-lg p-4" style={{ background: c.ft, border: `1px solid ${c.gc}` }}>
            <div className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: c.nr }}>{p.backCover}</div>
          </div>
        ) : (
          <div className="rounded-lg p-4 text-center cursor-pointer hover:bg-[#FAF7F2] transition-colors"
            style={{ background: c.ft, border: `1px dashed ${c.gc}` }}
            onClick={() => { setEditBackCover(''); setEditing(true); }}>
            <div className="text-[12px]" style={{ color: c.gr }}>Aucun texte de 4e renseigné</div>
            <div className="text-[11px] mt-1" style={{ color: c.vm }}>Cliquer pour ajouter</div>
          </div>
        )}
        {p.backCover && (
          <div className="mt-2 flex gap-4 text-[10px]" style={{ color: c.gr }}>
            <span>{p.backCover.length} caractères</span>
            <span>{p.backCover.split(/\s+/).length} mots</span>
            <span>{p.backCover.length > 800 ? '⚠️ Long — idéal < 800 car.' : '✓ Longueur OK'}</span>
          </div>
        )}
      </Card>

      {/* Notes éditoriales */}
      <Card hover={false} className="p-6 mt-5">
        <div className="flex justify-between items-center mb-3">
          <div className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Notes éditoriales</div>
          {!editing && (
            <button className="text-[11px] px-3 py-1 rounded-lg cursor-pointer border-none transition-colors font-semibold"
              style={{ background: c.ft, color: c.vm }}
              onClick={() => { setEditNotes(p.notes || ''); setEditing(true); }}>
              {icons.edit} Modifier
            </button>
          )}
        </div>
        {p.notes ? (
          <div className="rounded-lg p-4" style={{ background: '#FDFCFA', border: `1px solid ${c.ft}` }}>
            <div className="text-[12px] leading-relaxed whitespace-pre-line" style={{ color: c.nr }}>{p.notes}</div>
          </div>
        ) : (
          <div className="rounded-lg p-4 text-center cursor-pointer hover:bg-[#FAF7F2] transition-colors"
            style={{ background: c.ft, border: `1px dashed ${c.gc}` }}
            onClick={() => { setEditNotes(''); setEditing(true); }}>
            <div className="text-[12px]" style={{ color: c.gr }}>Aucune note</div>
            <div className="text-[11px] mt-1" style={{ color: c.vm }}>Cliquer pour ajouter</div>
          </div>
        )}
      </Card>

      {/* Gabarit Couverture */}
      <CoverSpecPanel pages={p.pages} genre={p.genre} title={p.title} />

      {/* Éditions / ISBN */}
      <Card hover={false} className="p-6 mt-5">
        <div className="flex justify-between items-center mb-4">
          <div className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Éditions &amp; ISBN</div>
          <span className="text-[12px] font-semibold" style={{ color: c.vm }}>{p.editions.length} format{p.editions.length > 1 ? 's' : ''} · {p.editions.length} ISBN</span>
        </div>
        <div className="space-y-2">
          {p.editions.map((ed, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: c.ft }}>
              <span className="text-xl">{FORMAT_LABELS[ed.format]?.icon}</span>
              <div className="flex-1">
                <div className="text-[13px] font-semibold" style={{ color: c.mv }}>{FORMAT_LABELS[ed.format]?.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: c.gr }}>{ed.isbn}</div>
              </div>
              {ed.price && <span className="text-[13px] font-semibold" style={{ color: c.mv }}>{ed.price}</span>}
              <Badge bg={EDITION_STATUS_LABELS[ed.status]?.bg || c.gc} color={EDITION_STATUS_LABELS[ed.status]?.color || c.gr}>
                {EDITION_STATUS_LABELS[ed.status]?.label}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Manuscrit */}
      <Card hover={false} className="p-6 mt-5">
        <div className="flex justify-between items-center mb-4">
          <div className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Manuscrit</div>
          <Badge bg={MANUSCRIPT_STATUS_LABELS[p.manuscriptStatus || 'none'].bg} color={MANUSCRIPT_STATUS_LABELS[p.manuscriptStatus || 'none'].color}>
            {MANUSCRIPT_STATUS_LABELS[p.manuscriptStatus || 'none'].icon} {MANUSCRIPT_STATUS_LABELS[p.manuscriptStatus || 'none'].label}
          </Badge>
        </div>
        <input ref={el => { fileInputRef.current = el; }} type="file" accept=".docx" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
        {p.manuscriptFile ? (
          <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: c.ft }}>
            <span className="text-2xl">📄</span>
            <div className="flex-1">
              <div className="text-[13px] font-semibold" style={{ color: c.mv }}>{p.manuscriptFile}</div>
              <div className="text-[11px]" style={{ color: c.gr }}>
                {p.analysis ? `${p.analysis.wordCount.toLocaleString()} mots · ${p.analysis.avgSentenceLength} mots/phrase` : `${p.pages} pages · ${(p.pages * 240).toLocaleString()} mots estimés`}
              </div>
            </div>
            {p.analysis && (
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Score IA</div>
                <div className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: p.analysis.iaScore > 30 ? c.er : p.analysis.iaScore > 15 ? c.og : c.ok }}>
                  {p.analysis.iaScore}%
                </div>
              </div>
            )}
            {!p.analysis && !scanning && (
              <Btn variant="secondary" onClick={() => fileInputRef.current?.click()}>{icons.analyse} Analyser</Btn>
            )}
            {scanning && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold" style={{ color: c.or }}>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Analyse…
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center rounded-lg border-2 border-dashed cursor-pointer transition-colors hover:bg-[rgba(200,149,46,0.02)]"
            style={{ borderColor: 'rgba(200,149,46,0.15)' }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={e => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f); }}>
            <div className="text-2xl mb-2 opacity-40">📄</div>
            <div className="text-[12px] font-semibold" style={{ color: c.mv }}>
              {scanning ? 'Analyse en cours…' : 'Importer le manuscrit (.docx)'}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: c.gr }}>Glissez ou cliquez pour associer un fichier à ce projet</div>
          </div>
        )}
        {scanError && (
          <div className="mt-2 p-2 rounded text-[11px] font-semibold" style={{ background: '#FFF0F0', color: c.er }}>
            {scanError}
          </div>
        )}
        {p.analysis && p.analysis.flaggedPatterns.length > 0 && (
          <div className="mt-3 p-3 rounded-lg" style={{ background: '#FFF8F0' }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.og }}>
              {p.analysis.flaggedPatterns.length} pattern{p.analysis.flaggedPatterns.length > 1 ? 's' : ''} détecté{p.analysis.flaggedPatterns.length > 1 ? 's' : ''}
            </div>
            {p.analysis.flaggedPatterns.slice(0, 3).map((fp, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] py-0.5">
                <span style={{ color: fp.severity === 'critical' ? c.er : fp.severity === 'moderate' ? c.og : c.gr }}>
                  {fp.severity === 'critical' ? '●' : fp.severity === 'moderate' ? '◐' : '○'}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: c.mv }}>{fp.pattern}</span>
                <span className="ml-auto font-semibold" style={{ color: c.gr }}>×{fp.count}</span>
              </div>
            ))}
            {p.analysis.flaggedPatterns.length > 3 && (
              <div className="text-[10px] mt-1" style={{ color: c.gr }}>+ {p.analysis.flaggedPatterns.length - 3} autres patterns</div>
            )}
          </div>
        )}

        {/* Scanner 6D Results */}
        {p.analysis && (() => {
          const dims = [
            { key: 'ia', label: 'Score IA', value: p.analysis!.iaScore, max: 100, unit: '%', invert: true, desc: 'Probabilité contenu généré' },
            { key: 'red', label: 'Redondances', value: p.analysis!.redundancies, max: 50, unit: '', invert: true, desc: 'Passages répétitifs détectés' },
            { key: 'sent', label: 'Longueur phrases', value: p.analysis!.avgSentenceLength, max: 40, unit: ' mots', invert: false, desc: 'Moyenne mots par phrase' },
            { key: 'words', label: 'Volume', value: p.analysis!.wordCount, max: Math.max(p.analysis!.wordCount, p.pages * 300), unit: ' mots', invert: false, desc: 'Nombre total de mots' },
            { key: 'patterns', label: 'Patterns IA', value: p.analysis!.flaggedPatterns.length, max: 20, unit: '', invert: true, desc: 'Expressions typiques IA' },
            { key: 'density', label: 'Densité', value: Math.round(p.analysis!.wordCount / Math.max(p.pages, 1)), max: 400, unit: ' m/p', invert: false, desc: 'Mots par page estimés' },
          ];

          const getColor = (d: typeof dims[0]) => {
            const pct = d.value / d.max;
            if (d.invert) return pct > 0.5 ? c.er : pct > 0.2 ? c.og : c.ok;
            return pct > 0.8 ? c.ok : pct > 0.4 ? c.og : c.er;
          };

          const globalScore = Math.round(
            dims.reduce((s, d) => {
              const pct = Math.min(d.value / d.max, 1);
              return s + (d.invert ? (1 - pct) : pct);
            }, 0) / dims.length * 100
          );

          return (
            <div className="mt-4 p-4 rounded-xl" style={{ background: c.ft, border: `1px solid ${c.gc}` }}>
              <div className="flex justify-between items-center mb-4">
                <div className="uppercase tracking-wider font-semibold" style={{ fontSize: 11, color: c.gr }}>
                  Scanner 6D — Résultats détaillés
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: c.gr }}>Score global</span>
                  <span className="text-[16px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: globalScore > 70 ? c.ok : globalScore > 40 ? c.og : c.er }}>
                    {globalScore}/100
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dims.map(d => {
                  const pct = Math.min((d.value / d.max) * 100, 100);
                  const color = getColor(d);
                  return (
                    <div key={d.key} className="p-3 rounded-lg bg-white">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.gr }}>{d.label}</div>
                        <div className="text-[13px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color }}>
                          {d.value.toLocaleString()}{d.unit}
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden mb-1" style={{ background: c.ft }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <div className="text-[9px]" style={{ color: c.gr }}>{d.desc}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-[10px] text-center" style={{ color: c.gr }}>
                Analysé le {new Date(p.analysis!.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })()}
      </Card>
    </div>
  );
};

// --- COUVERTURES ---
const CouverturesView = ({ onProject, projects }: { onProject: (p: Project) => void; projects: Project[] }) => {
  const bad = projects.filter(p => p.corrections.length > 0);
  const good = projects.filter(p => p.corrections.length === 0);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const previewProject = previewId ? projects.find(p => p.id === previewId) : null;

  return (
    <div>
      <h2 className="text-2xl mb-1" style={{ color: c.mv }}>Couvertures</h2>
      <p className="mb-5" style={{ color: c.gr, fontSize: 13 }}>Audit qualité + preview gabarit complet (1re + dos + 4e)</p>
      <div className="flex gap-3.5 mb-6">
        <StatCard value={good.length} label="Conformes" accent={c.ok} />
        <StatCard value={bad.length} label="À corriger" accent={c.er} />
        <StatCard value={projects.reduce((s, p) => s + p.corrections.length, 0)} label="Corrections" accent={c.og} />
        <StatCard value={projects.filter(p => p.coverImage).length} label="Artwork intégré" accent={c.vm} />
      </div>

      {/* À corriger */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
        {bad.map(p => (
          <Card key={p.id} className="cursor-pointer" onClick={() => onProject(p)}>
            <div className="flex gap-3 p-4">
              <CoverThumb emoji={p.cover} coverImage={p.coverImage} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{p.title}</div>
                <ScoreBar score={p.score} max={p.maxScore} />
                <div className="mt-1.5">{p.corrections.slice(0, 2).map((fix, i) => <div key={i} className="text-[10px]" style={{ color: c.er }}>• {fix}</div>)}{p.corrections.length > 2 && <div className="text-[10px]" style={{ color: c.gr }}>+{p.corrections.length - 2} autres</div>}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Conformes avec bouton preview */}
      <Card hover={false} className="mb-6">
        <div className="px-5 py-3" style={{ borderBottom: `2px solid ${c.ok}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Couvertures conformes</span>
        </div>
        {good.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAF7F2]" style={{ borderBottom: `1px solid ${c.ft}` }}>
            <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
            <span className="flex-1 text-[13px] font-semibold cursor-pointer" onClick={() => onProject(p)}>{p.title}</span>
            <span className="text-xs font-semibold" style={{ color: c.ok }}>✓ 7/7</span>
            <button className="text-[11px] px-3 py-1 rounded-lg font-semibold transition-colors"
              style={{ background: previewId === p.id ? c.or : c.ft, color: previewId === p.id ? 'white' : c.mv }}
              onClick={() => setPreviewId(previewId === p.id ? null : p.id)}>
              {previewId === p.id ? 'Fermer' : 'Preview gabarit'}
            </button>
          </div>
        ))}
        {bad.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAF7F2]" style={{ borderBottom: `1px solid ${c.ft}` }}>
            <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
            <span className="flex-1 text-[13px] font-semibold cursor-pointer" onClick={() => onProject(p)}>{p.title}</span>
            <span className="text-xs font-semibold" style={{ color: c.er }}>{p.score}/{p.maxScore}</span>
            <button className="text-[11px] px-3 py-1 rounded-lg font-semibold transition-colors"
              style={{ background: previewId === p.id ? c.or : c.ft, color: previewId === p.id ? 'white' : c.mv }}
              onClick={() => setPreviewId(previewId === p.id ? null : p.id)}>
              {previewId === p.id ? 'Fermer' : 'Preview gabarit'}
            </button>
          </div>
        ))}
      </Card>

      {/* Cover assembly preview */}
      {previewProject && (() => {
        const p = previewProject;
        const thickness = (p.pages * 0.05).toFixed(1);
        const thicknessMm = parseFloat(thickness);
        const spineWidth = Math.max(20, Math.round(thicknessMm * 2.5));
        const canSpineText = p.pages >= 79;
        const coverW = 135; // mm
        const coverH = 210; // mm
        const bleed = 2.5;
        const totalWmm = bleed + coverW + thicknessMm + coverW + bleed;
        const totalHmm = bleed + coverH + bleed;
        // Scale for display: 1mm ≈ 1.4px
        const scale = 1.4;
        const totalWpx = Math.round(totalWmm * scale);
        const totalHpx = Math.round(totalHmm * scale);
        const coverWpx = Math.round(coverW * scale);
        const bleedPx = Math.round(bleed * scale);

        return (
          <Card hover={false} className="overflow-hidden mb-6">
            <div className="px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
              <span className="text-[13px] font-semibold" style={{ color: c.mv }}>📐 Gabarit couverture complète — {p.title}</span>
            </div>

            {/* Specs row */}
            <div className="px-5 py-3 flex gap-6 flex-wrap" style={{ background: c.ft }}>
              {[
                ['Format couverture', `${coverW} × ${coverH} mm`],
                ['Dos', `${thickness} mm (${p.pages} pages)`],
                ['Total déplié', `${totalWmm.toFixed(1)} × ${totalHmm.toFixed(1)} mm`],
                ['Bleed', `${bleed} mm`],
                ['Résolution', `${Math.ceil((totalWmm / 25.4) * 300)} × ${Math.ceil((totalHmm / 25.4) * 300)} px @300dpi`],
                ['Texte dos', canSpineText ? '✓ Possible' : '✗ Trop fin'],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>{k}</div>
                  <div className="text-[12px] font-semibold" style={{ color: c.mv }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Visual preview */}
            <div className="p-6 flex justify-center" style={{ background: '#E8E4DE' }}>
              <div className="relative" style={{ width: totalWpx, height: totalHpx }}>
                {/* Bleed zone */}
                <div className="absolute inset-0 rounded-sm" style={{ background: '#D4CFC6', border: '1px dashed #B0A898' }} />

                {/* 4e de couverture (left) */}
                <div className="absolute flex flex-col justify-between p-4" style={{
                  left: bleedPx, top: bleedPx, width: coverWpx, height: totalHpx - bleedPx * 2,
                  background: 'white', borderRight: `1px solid ${c.gc}`
                }}>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.gr }}>4e de couverture</div>
                    <div className="text-[8px] leading-relaxed" style={{ color: c.nr }}>
                      {p.backCover ? p.backCover.slice(0, 280) + (p.backCover.length > 280 ? '…' : '') : 'Texte de 4e non renseigné'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[7px] tracking-wider" style={{ color: c.gr }}>ISBN</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: c.mv }}>
                      {p.editions[0]?.isbn || '978-2-488647-XX-X'}
                    </div>
                    <div className="mt-1 mx-auto" style={{ width: 60, height: 20, background: c.ft, border: `1px solid ${c.gc}` }}>
                      <div className="text-[6px] text-center pt-1" style={{ color: c.gr }}>Code-barres EAN</div>
                    </div>
                  </div>
                </div>

                {/* Dos (center) */}
                <div className="absolute flex items-center justify-center" style={{
                  left: bleedPx + coverWpx, top: bleedPx, width: spineWidth, height: totalHpx - bleedPx * 2,
                  background: '#F5F0E8', borderLeft: `1px solid ${c.gc}`, borderRight: `1px solid ${c.gc}`
                }}>
                  {canSpineText ? (
                    <div className="font-semibold" style={{
                      writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)',
                      fontSize: Math.min(9, spineWidth * 0.35), color: c.mv, letterSpacing: 1,
                      overflow: 'hidden', maxHeight: totalHpx - bleedPx * 2 - 20,
                    }}>
                      {p.title.length > 30 ? p.title.slice(0, 28) + '…' : p.title} — Steve Moradel
                    </div>
                  ) : (
                    <div className="text-[6px] text-center" style={{ color: c.gr, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>DOS</div>
                  )}
                </div>

                {/* 1re de couverture (right) */}
                <div className="absolute flex flex-col items-center justify-center" style={{
                  left: bleedPx + coverWpx + spineWidth, top: bleedPx, width: coverWpx, height: totalHpx - bleedPx * 2,
                  background: p.coverImage ? undefined : '#FDFAF5', borderLeft: `1px solid ${c.gc}`,
                  backgroundImage: p.coverImage ? `url(${p.coverImage})` : undefined,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }}>
                  {!p.coverImage && (
                    <>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: c.gr }}>Steve Moradel</div>
                      <div className="text-[14px] font-bold text-center px-4" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>{p.title}</div>
                      <div className="text-[8px] mt-2 italic" style={{ color: c.gr }}>{p.genre.toLowerCase()}</div>
                      <div className="absolute bottom-3 text-[7px] tracking-widest uppercase" style={{ color: c.gr }}>Jabrilia Éditions</div>
                    </>
                  )}
                  {p.coverImage && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 text-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <div className="text-[8px] font-semibold text-white truncate">{p.title}</div>
                    </div>
                  )}
                </div>

                {/* Labels */}
                <div className="absolute text-[7px] font-bold" style={{ left: bleedPx + coverWpx / 2, top: -14, transform: 'translateX(-50%)', color: c.gr }}>← 4e ({coverW}mm) →</div>
                <div className="absolute text-[7px] font-bold" style={{ left: bleedPx + coverWpx + spineWidth / 2, top: -14, transform: 'translateX(-50%)', color: c.or }}>Dos</div>
                <div className="absolute text-[7px] font-bold" style={{ left: bleedPx + coverWpx + spineWidth + coverWpx / 2, top: -14, transform: 'translateX(-50%)', color: c.gr }}>← 1re ({coverW}mm) →</div>
              </div>
            </div>

            {/* Export specs */}
            <div className="px-5 py-3 grid grid-cols-3 gap-4" style={{ borderTop: `1px solid ${c.ft}` }}>
              <div className="p-3 rounded-lg" style={{ background: c.ft }}>
                <div className="text-[10px] font-semibold" style={{ color: c.vm }}>KDP</div>
                <div className="text-[9px] mt-1" style={{ color: c.gr }}>
                  PDF couverture unique · Fond perdu 3,2 mm · Pas de traits de coupe · sRGB ou CMJN
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: c.ft }}>
                <div className="text-[10px] font-semibold" style={{ color: c.vm }}>Pollen / Imprimeur FR</div>
                <div className="text-[9px] mt-1" style={{ color: c.gr }}>
                  PDF/X-1a · CMJN obligatoire · Fond perdu 2,5 mm + traits de coupe · Profil Fogra39
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: c.ft }}>
                <div className="text-[10px] font-semibold" style={{ color: c.vm }}>IngramSpark</div>
                <div className="text-[9px] mt-1" style={{ color: c.gr }}>
                  PDF single page · Fond perdu 3,2 mm · sRGB ou CMJN · Cover calculator requis
                </div>
              </div>
            </div>
          </Card>
        );
      })()}
    </div>
  );
};

// --- ISBN ---
const ISBNView = ({ projects, onToast }: { projects: Project[]; onToast: (msg: string) => void }) => {
  const totalISBN = countISBN(projects);
  const exportCSV = () => {
    const rows = [['ISBN', 'Titre', 'Format', 'Prix', 'Statut édition', 'Statut projet', 'Genre'].join(';')];
    projects.forEach(p => p.editions.forEach(ed => {
      rows.push([ed.isbn, `"${p.title}"`, FORMAT_LABELS[ed.format]?.label, ed.price || '', EDITION_STATUS_LABELS[ed.status]?.label, p.status, p.genre].join(';'));
    }));
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `jabr-isbn-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    onToast('ISBN exportés en CSV');
  };
  const exportONIX = () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<ONIXMessage release="3.0" xmlns="http://ns.editeur.org/onix/3.0/reference">\n  <Header>\n    <Sender><SenderName>Jabrilia Éditions</SenderName></Sender>\n    <SentDateTime>${new Date().toISOString().slice(0, 10).replace(/-/g, '')}</SentDateTime>\n  </Header>\n${projects.map(p => p.editions.map(ed => `  <Product>\n    <RecordReference>${ed.isbn.replace(/-/g, '')}</RecordReference>\n    <NotificationType>03</NotificationType>\n    <ProductIdentifier><ProductIDType>15</ProductIDType><IDValue>${ed.isbn.replace(/-/g, '')}</IDValue></ProductIdentifier>\n    <DescriptiveDetail>\n      <TitleDetail><TitleType>01</TitleType><TitleElement><TitleElementLevel>01</TitleElementLevel><TitleText>${p.title}</TitleText></TitleElement></TitleDetail>\n      <Contributor><ContributorRole>A01</ContributorRole><PersonName>Steve Moradel</PersonName></Contributor>\n      <Language><LanguageRole>01</LanguageRole><LanguageCode>fre</LanguageCode></Language>\n      <Extent><ExtentType>00</ExtentType><ExtentValue>${p.pages}</ExtentValue><ExtentUnit>03</ExtentUnit></Extent>\n    </DescriptiveDetail>\n    <PublishingDetail>\n      <Imprint><ImprintName>Jabrilia Éditions</ImprintName></Imprint>\n      <PublishingStatus>04</PublishingStatus>\n    </PublishingDetail>\n    ${ed.price ? `<ProductSupply><SupplyDetail><Price><PriceType>02</PriceType><PriceAmount>${ed.price.replace('€', '').trim()}</PriceAmount><CurrencyCode>EUR</CurrencyCode></Price></SupplyDetail></ProductSupply>` : ''}\n  </Product>`).join('\n')).join('\n')}\n</ONIXMessage>`;
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `jabr-onix-${new Date().toISOString().slice(0, 10)}.xml`; a.click();
    onToast(`ONIX 3.0 exporté — ${totalISBN} produits`);
  };
  return (
  <div>
    <div className="flex justify-between items-end mb-5">
      <div><h2 className="text-2xl" style={{ color: c.mv }}>Registre ISBN</h2><p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Préfixe éditeur : 978-2-488647 · Stock : 100 · 1 ISBN par format</p></div>
      <div className="flex gap-2">
        <Btn variant="secondary" onClick={exportCSV}>{icons.download} Export CSV</Btn>
        <Btn variant="secondary" onClick={exportONIX}>{icons.download} Export ONIX</Btn>
        <Btn onClick={() => onToast('Attribution ISBN : ouvrir la fiche projet → ajouter une édition')}>{icons.plus} Attribuer ISBN</Btn>
      </div>
    </div>
    <div className="flex gap-3.5 mb-6"><StatCard value={totalISBN} label="Attribués" accent={c.or} /><StatCard value={100 - totalISBN} label="Disponibles" accent={c.ok} /><StatCard value={projects.length} label="Titres" accent={c.mv} /></div>
    <Card hover={false}>
      <div className="grid grid-cols-[200px_1fr_90px_90px_90px] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ background: c.ft, color: c.mv, borderBottom: `2px solid ${c.or}` }}>
        <div>ISBN</div><div>Titre</div><div>Format</div><div>Prix</div><div>Statut</div>
      </div>
      {projects.map(p => (
        p.editions.map((ed, ei) => (
          <div key={`${p.id}-${ei}`} className="grid grid-cols-[200px_1fr_90px_90px_90px] px-5 py-2.5 text-[13px] transition-colors hover:bg-[rgba(200,149,46,0.04)]"
            style={{ background: ei === 0 ? 'white' : '#FAFAF8', borderBottom: ei === p.editions.length - 1 ? `2px solid ${c.gc}` : `1px solid ${c.ft}` }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: c.mv }}>{ed.isbn}</div>
            <div className="truncate">
              {ei === 0 ? <span className="font-medium">{p.title}</span> : <span style={{ color: c.gr, fontSize: 12, paddingLeft: 12 }}>↳ {p.title}</span>}
            </div>
            <div><Badge bg={ei === 0 ? '#E8E0F0' : c.ft} color={ei === 0 ? '#3E2768' : c.gr}>{FORMAT_LABELS[ed.format]?.icon} {FORMAT_LABELS[ed.format]?.label}</Badge></div>
            <div className="text-[12px]" style={{ color: ed.price ? c.nr : c.gr }}>{ed.price || '—'}</div>
            <div><Badge bg={EDITION_STATUS_LABELS[ed.status]?.bg || c.gc} color={EDITION_STATUS_LABELS[ed.status]?.color || c.gr}>{EDITION_STATUS_LABELS[ed.status]?.label}</Badge></div>
          </div>
        ))
      ))}
    </Card>
  </div>
  );
};

// --- COLLECTIONS ---
const CollectionsView = ({ onProject, projects }: { onProject: (p: Project) => void; projects: Project[] }) => (
  <div>
    <h2 className="text-2xl mb-1" style={{ color: c.mv }}>Collections</h2>
    <p className="mb-5" style={{ color: c.gr, fontSize: 13 }}>Organisation du catalogue par collections</p>
    <div className="flex flex-col gap-5">
      {COLLECTIONS.map(col => (
        <Card key={col.name} hover={false}>
          <div className="flex justify-between items-center px-6 py-4" style={{ borderBottom: `2px solid ${col.color}` }}>
            <div>
              <h3 className="text-xl" style={{ color: c.mv }}>{col.name}</h3>
              <p className="text-xs mt-0.5" style={{ color: c.gr }}>{col.desc}</p>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: col.color, fontFamily: "'Playfair Display', serif" }}>{col.bookIds.length}</div>
          </div>
          {col.bookIds.map(id => {
            const p = projects.find(x => x.id === id);
            if (!p) return null;
            return (
              <div key={id} onClick={() => onProject(p)} className="flex items-center gap-3 px-6 py-2.5 cursor-pointer transition-colors hover:bg-[#FAF7F2]" style={{ borderBottom: `1px solid ${c.ft}` }}>
                <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                <span className="flex-1 text-[13px] font-medium">{p.title}</span>
                <ScoreBar score={p.score} max={p.maxScore} />
                <StatusBadge status={p.status} />
              </div>
            );
          })}
        </Card>
      ))}
    </div>
  </div>
);

// --- ANALYTICS ---
const AnalyticsView = ({ projects }: { projects: Project[] }) => {
  const avg = projects.length > 0 ? (projects.reduce((s, p) => s + p.score, 0) / projects.length).toFixed(1) : '0';
  const totalPages = projects.reduce((s, p) => s + p.pages, 0);
  const totalEditions = countISBN(projects);
  const byGenre: Record<string, number> = {};
  projects.forEach(p => { byGenre[p.genre] = (byGenre[p.genre] || 0) + 1; });
  const byFormat: Record<string, number> = {};
  projects.forEach(p => p.editions.forEach(e => { byFormat[e.format] = (byFormat[e.format] || 0) + 1; }));

  // Production readiness checks
  const checks = (p: typeof projects[0]) => ({
    'Manuscrit validé': p.manuscriptStatus === 'validated' || p.manuscriptStatus === 'isbn-injected',
    'ISBN attribué': p.editions.length > 0,
    'Couverture OK': p.corrections.length === 0,
    'Artwork intégré': !!p.coverImage,
    '4e de couverture': !!(p.backCover && p.backCover.length > 50),
    'Analyse IA': !!p.analysis,
    'Statut publié': p.status === 'published',
  });

  // Revenue estimator
  const estimateRevenue = (p: typeof projects[0]) => {
    let rev = 0;
    p.editions.forEach(ed => {
      const price = parseFloat((ed.price || '0').replace('€', '').replace(',', '.'));
      if (ed.format === 'broché') rev += price * 0.4 * 200; // 40% margin, 200 copies estimate
      else if (ed.format === 'epub') rev += price * 0.7 * 150; // 70% margin, 150 sales
      else if (ed.format === 'audiobook') rev += price * 0.4 * 80;
      else if (ed.format === 'poche') rev += price * 0.35 * 300;
    });
    return Math.round(rev);
  };

  const totalEstRev = projects.reduce((s, p) => s + estimateRevenue(p), 0);
  const analyzed = projects.filter(p => p.analysis);
  const avgIa = analyzed.length > 0 ? Math.round(analyzed.reduce((s, p) => s + (p.analysis?.iaScore || 0), 0) / analyzed.length) : null;

  return (
    <div>
      <h2 className="text-2xl mb-1" style={{ color: c.mv }}>Analytics</h2>
      <p className="mb-5" style={{ color: c.gr, fontSize: 13 }}>Vue d&apos;ensemble du catalogue · Production · Revenus estimés</p>
      <div className="flex gap-3.5 mb-7 flex-wrap">
        <StatCard value={projects.length} label="Titres" accent={c.mv} />
        <StatCard value={totalEditions} label="Éditions (ISBN)" accent={c.or} />
        <StatCard value={`${avg}/7`} label="Score moyen" accent={c.ok} />
        <StatCard value={totalPages.toLocaleString()} label="Pages totales" accent={c.vm} />
        {avgIa !== null && <StatCard value={`${avgIa}%`} label="Score IA moyen" accent={avgIa > 25 ? c.er : c.ok} />}
        <StatCard value={`~${totalEstRev.toLocaleString()}€`} label="Revenus estimés/an" accent={c.or} />
      </div>

      {/* Production readiness matrix */}
      <Card hover={false} className="mb-6 overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Readiness par titre</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ background: c.ft }}>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: c.gr }}>Titre</th>
                {Object.keys(checks(projects[0])).map(k => (
                  <th key={k} className="px-2 py-2.5 font-semibold text-center" style={{ color: c.gr, fontSize: 9 }}>{k}</th>
                ))}
                <th className="px-3 py-2.5 font-semibold text-center" style={{ color: c.gr }}>Rev. est.</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const ch = checks(p);
                const doneCount = Object.values(ch).filter(Boolean).length;
                const total = Object.keys(ch).length;
                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${c.ft}` }}>
                    <td className="px-4 py-2 font-semibold" style={{ color: c.nr, maxWidth: 160 }}>
                      <div className="truncate">{p.title}</div>
                      <div className="text-[9px]" style={{ color: doneCount === total ? c.ok : c.og }}>{doneCount}/{total}</div>
                    </td>
                    {Object.values(ch).map((ok, i) => (
                      <td key={i} className="text-center px-2 py-2">
                        <span className="text-[13px]">{ok ? '✅' : '⬜'}</span>
                      </td>
                    ))}
                    <td className="text-center px-3 py-2 font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: c.or }}>
                      ~{estimateRevenue(p).toLocaleString()}€
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card hover={false} className="p-5">
          <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Score par titre</div>
          {projects.map((p, i) => (
            <div key={i} className="flex items-center gap-2.5 mb-2">
              <span className="text-[11px] w-[120px] truncate shrink-0">{p.title}</span>
              <ScoreBar score={p.score} max={p.maxScore} large />
            </div>
          ))}
        </Card>
        <div className="flex flex-col gap-5">
          <Card hover={false} className="p-5">
            <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Par genre</div>
            {Object.entries(byGenre).map(([g, count]) => (
              <div key={g} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
                <GenreBadge genre={g} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: c.mv }}>{count}</span>
              </div>
            ))}
          </Card>
          <Card hover={false} className="p-5">
            <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Par statut</div>
            {(['published', 'in-progress', 'draft'] as const).map(s => (
              <div key={s} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
                <StatusBadge status={s} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: c.mv }}>{projects.filter(p => p.status === s).length}</span>
              </div>
            ))}
          </Card>
        </div>
        <Card hover={false} className="p-5">
          <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Par format d&apos;édition</div>
          {Object.entries(byFormat).sort((a, b) => b[1] - a[1]).map(([f, count]) => (
            <div key={f} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${c.ft}` }}>
              <div className="flex items-center gap-2">
                <span>{FORMAT_LABELS[f as EditionFormat]?.icon}</span>
                <span className="text-[12px] font-medium" style={{ color: c.mv }}>{FORMAT_LABELS[f as EditionFormat]?.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 rounded-full" style={{ width: `${(count / totalEditions) * 80}px`, background: c.or }} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: c.mv }}>{count}</span>
              </div>
            </div>
          ))}
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${c.gc}` }}>
            <div className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.gr }}>Ratio éditions/titre</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: c.or }}>
              {projects.length > 0 ? (totalEditions / projects.length).toFixed(1) : '0'}
            </div>
            <div className="text-[11px]" style={{ color: c.gr }}>formats par titre en moyenne</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- DISTRIBUTION ---
const DistributionView = ({ projects, onToast }: { projects: Project[]; onToast: (msg: string) => void }) => {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({});
  const [expandedTitle, setExpandedTitle] = useState<number | null>(null);

  const toggleCheck = (key: string) => setManualChecks(prev => ({ ...prev, [key]: !prev[key] }));
  const checkKey = (channel: string, projectId: number, stepIdx: number) => `${channel}:${projectId}:${stepIdx}`;
  const isChecked = (channel: string, projectId: number, stepIdx: number, autoFn: (p: Project) => boolean, project: Project) => {
    const key = checkKey(channel, projectId, stepIdx);
    return manualChecks[key] !== undefined ? manualChecks[key] : autoFn(project);
  };

  const channelFormats: Record<string, EditionFormat[]> = {
    'Pollen / Kiosque': ['broché', 'poche', 'relié'],
    'Amazon KDP': ['broché', 'poche', 'epub', 'relié'],
    'IngramSpark': ['broché', 'poche', 'relié'],
    'Apple Books': ['epub', 'audiobook'],
    'Kobo / Fnac': ['epub'],
    'Spotify / Audible': ['audiobook'],
  };

  type ChannelSpec = { trimSize: string; paper: string; bleed: string; spine: string; barcode: string; cover: string; file: string; margin: string; notes: string };
  const channelSpecs: Record<string, ChannelSpec> = {
    'Amazon KDP': { trimSize: '15,2 × 22,9 cm (6" × 9")', paper: 'Blanc 75g ou Crème 80g', bleed: '3,2 mm (0.125")', spine: 'Auto-calculé · texte ≥ 79 pages', barcode: '50,8 × 30,5 mm — zone réservée dos', cover: 'PDF aplati 300 dpi, CMJN ou RVB', file: 'PDF intérieur + PDF couverture séparé', margin: '60% impression · 40% auteur sur prix HT', notes: 'Validation 24-72h. Distribution mondiale.' },
    'Pollen / Kiosque': { trimSize: '15,2 × 22,9 cm', paper: 'Offset 80g', bleed: '2,5 mm fonds perdus', spine: 'Calculé : pages × 0,07 mm', barcode: 'EAN-13 + prix TTC obligatoire', cover: 'PDF 300 dpi CMJN, pelliculage mat ou brillant', file: 'PDF/X-1a intérieur + couverture complète', margin: 'Remise libraire 30-35% · Remise diffuseur 5-8%', notes: 'Accord Dilisco. Délai 4-6 semaines.' },
    'IngramSpark': { trimSize: '15,2 × 22,9 cm ou format US', paper: 'Blanc 70lb / Crème 70lb', bleed: '3,2 mm (0.125")', spine: 'Auto-calculé depuis gabarit en ligne', barcode: 'EAN-13 fourni par IngramSpark ou éditeur', cover: 'PDF aplati 300 dpi CMJN, ICC : GRACoL', file: 'PDF intérieur + PDF couverture', margin: '45% impression · 55% auteur — frais annuels', notes: 'Réseau international : 40 000+ librairies.' },
    'Apple Books': { trimSize: 'ePub reflowable', paper: 'N/A', bleed: 'N/A', spine: 'N/A', barcode: 'ISBN ePub distinct requis', cover: 'JPEG ou PNG 1400×1873 px min, RVB', file: '.epub validé via EpubCheck', margin: '70% auteur sur prix HT', notes: 'Via Apple Books for Authors.' },
    'Kobo / Fnac': { trimSize: 'ePub reflowable', paper: 'N/A', bleed: 'N/A', spine: 'N/A', barcode: 'ISBN ePub requis', cover: 'JPEG 1600×2560 px recommandé', file: '.epub validé EpubCheck', margin: '70% auteur sur prix HT', notes: 'Kobo Writing Life. Diffusion FR/BE/CH/CA.' },
    'Spotify / Audible': { trimSize: 'MP3 192kbps mono', paper: 'N/A', bleed: 'N/A', spine: 'N/A', barcode: 'ISBN audiobook distinct', cover: 'JPEG 2400×2400 px carré', file: 'MP3 par chapitre + ouverture/fermeture', margin: 'ACX : 40% (exclusif) ou 25% (non-exclusif)', notes: 'Durée min. 60 min. Programme ACX.' },
  };

  type SubmissionStep = { label: string; done: (p: Project) => boolean };
  const channelChecklist: Record<string, SubmissionStep[]> = {
    'Amazon KDP': [
      { label: 'ISBN broché attribué', done: p => p.editions.some(e => e.format === 'broché' && e.isbn) },
      { label: 'PDF intérieur prêt', done: p => p.manuscriptStatus === 'isbn-injected' || p.manuscriptStatus === 'validated' },
      { label: 'Couverture complète (dos + typo)', done: p => p.diag.dos && p.diag.typo },
      { label: 'EAN-13 sur 4e de couverture', done: p => p.diag.ean },
      { label: 'Prix fixé', done: p => p.editions.some(e => e.price) },
      { label: 'Métadonnées renseignées', done: () => true },
    ],
    'Pollen / Kiosque': [
      { label: 'Accord Dilisco/Pollen', done: () => false },
      { label: 'ISBN + EAN-13', done: p => p.diag.ean && p.diag.isbn_txt },
      { label: 'PDF/X-1a intérieur', done: () => false },
      { label: 'Couverture CMJN complète', done: p => p.diag.dos && p.diag.typo },
      { label: 'Prix TTC sur couverture', done: p => p.diag.prix },
      { label: 'Fiche ONIX transmise', done: () => false },
    ],
    'IngramSpark': [
      { label: 'Compte IngramSpark créé', done: () => false },
      { label: 'ISBN attribué', done: p => p.editions.some(e => e.isbn) },
      { label: 'PDF intérieur + couverture', done: p => p.diag.dos },
      { label: 'Métadonnées ONIX', done: () => false },
      { label: 'Territoires sélectionnés', done: () => false },
    ],
    'Apple Books': [
      { label: 'ISBN ePub attribué', done: p => p.editions.some(e => e.format === 'epub' && e.isbn) },
      { label: 'Fichier ePub validé', done: () => false },
      { label: 'Couverture 1400×1873 px', done: () => false },
      { label: 'Compte Apple Books for Authors', done: () => false },
    ],
    'Kobo / Fnac': [
      { label: 'ISBN ePub attribué', done: p => p.editions.some(e => e.format === 'epub' && e.isbn) },
      { label: 'Fichier ePub validé', done: () => false },
      { label: 'Couverture 1600×2560 px', done: () => false },
      { label: 'Compte Kobo Writing Life', done: () => false },
    ],
    'Spotify / Audible': [
      { label: 'ISBN audiobook attribué', done: p => p.editions.some(e => e.format === 'audiobook' && e.isbn) },
      { label: 'Fichiers MP3 par chapitre', done: () => false },
      { label: 'Couverture 2400×2400 px carrée', done: () => false },
      { label: 'Inscription ACX/Findaway', done: () => false },
    ],
  };

  const kdpMargin = (pages: number, price: string | undefined) => {
    if (!price) return null;
    const priceParsed = parseFloat(price.replace(',', '.').replace('€', '').trim());
    if (isNaN(priceParsed) || priceParsed <= 0) return null;
    const printCost = 1.72 + (pages * 0.012);
    const royalty = (priceParsed * 0.6) - printCost;
    return { price: priceParsed, printCost: Math.round(printCost * 100) / 100, royalty: Math.round(royalty * 100) / 100 };
  };

  const selected = DISTRIBUTION_CHANNELS.find(ch => ch.name === selectedChannel);
  const selectedSpec = selectedChannel ? channelSpecs[selectedChannel] : null;
  const selectedChecklist = selectedChannel ? channelChecklist[selectedChannel] || [] : [];
  const selectedFormats = selectedChannel ? channelFormats[selectedChannel] || [] : [];
  const eligibleProjects = selectedChannel ? projects.filter(p => p.editions.some(e => selectedFormats.includes(e.format))) : [];

  const exportChecklist = () => {
    if (!selectedChannel) return;
    const lines = [`CHECKLIST DISTRIBUTION — ${selectedChannel}`, `Date: ${new Date().toLocaleDateString('fr-FR')}`, ''];
    eligibleProjects.forEach(p => {
      const checks = selectedChecklist.map((step, i) => {
        const done = isChecked(selectedChannel, p.id, i, step.done, p);
        return `  ${done ? '☑' : '☐'} ${step.label}`;
      });
      const doneCount = selectedChecklist.filter((step, i) => isChecked(selectedChannel, p.id, i, step.done, p)).length;
      lines.push(`${p.title} — ${doneCount}/${selectedChecklist.length}`, ...checks, '');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `checklist-${selectedChannel.toLowerCase().replace(/[\s/]+/g, '-')}.txt`; a.click();
    onToast(`Checklist ${selectedChannel} exportée`);
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <h2 className="text-2xl" style={{ color: c.mv }}>Distribution</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Canaux de distribution — cliquez un canal puis un titre pour la checklist interactive</p>
        </div>
        {selectedChannel && <Btn variant="secondary" onClick={exportChecklist}>{icons.download} Exporter checklist</Btn>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard value={DISTRIBUTION_CHANNELS.filter(ch => ch.color === '#2EAE6D').length} label="Canaux prêts" accent={c.ok} />
        <StatCard value={countISBN(projects)} label="ISBN total" accent={c.or} />
        <StatCard value={projects.filter(p => p.editions.some(e => e.format === 'epub')).length} label="ePub prévus" accent={c.vm} />
      </div>

      {/* Channel cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {DISTRIBUTION_CHANNELS.map(ch => {
          const compat = channelFormats[ch.name] || [];
          const eligibleEditions = projects.reduce((s, p) => s + p.editions.filter(e => compat.includes(e.format)).length, 0);
          const isActive = selectedChannel === ch.name;
          return (
            <Card key={ch.name} className="p-5 cursor-pointer" onClick={() => { setSelectedChannel(isActive ? null : ch.name); setExpandedTitle(null); }}>
              <div style={isActive ? { outline: `2px solid ${c.or}`, outlineOffset: -2, borderRadius: 12, margin: -20, padding: 20 } : {}}>
                <div className="flex justify-between items-start mb-3">
                  <div><div className="font-semibold text-[15px]" style={{ color: c.mv }}>{ch.name}</div><div className="text-xs mt-0.5" style={{ color: c.gr }}>{ch.desc}</div></div>
                  <Badge bg={ch.color === c.ok ? '#D4F0E0' : ch.color === c.og ? '#FDE8D0' : ch.color === '#5B3E8A' ? '#E8E0F0' : '#F0EDE8'} color={ch.color}>{ch.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {compat.map(f => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded" style={{ background: c.ft, color: c.vm }}>{FORMAT_LABELS[f]?.icon} {FORMAT_LABELS[f]?.label}</span>
                  ))}
                </div>
                <div className="text-[11px] pt-2" style={{ borderTop: `1px solid ${c.ft}`, color: c.gr }}>
                  {eligibleEditions} édition{eligibleEditions > 1 ? 's' : ''} éligible{eligibleEditions > 1 ? 's' : ''}
                  {isActive && <span style={{ color: c.or, marginLeft: 8 }}>▾ Détail</span>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Channel detail panel */}
      {selected && selectedSpec && selectedChannel && (
        <Card hover={false} className="mb-6 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
            <div>
              <span className="text-lg font-semibold" style={{ color: c.mv }}>{selected.name}</span>
              <span className="text-[12px] ml-3" style={{ color: c.gr }}>{selected.desc}</span>
            </div>
            <Badge bg={selected.color === c.ok ? '#D4F0E0' : '#FDE8D0'} color={selected.color}>{selected.status}</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Specs */}
            <div className="p-6" style={{ borderRight: `1px solid ${c.ft}` }}>
              <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 11, color: c.gr }}>Spécifications techniques</div>
              {[
                ['Format', selectedSpec.trimSize], ['Papier', selectedSpec.paper], ['Fonds perdus', selectedSpec.bleed],
                ['Dos', selectedSpec.spine], ['Code-barres', selectedSpec.barcode], ['Couverture', selectedSpec.cover],
                ['Fichiers requis', selectedSpec.file], ['Marge auteur', selectedSpec.margin],
              ].map(([label, value]) => (
                <div key={label} className="flex py-1.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
                  <span className="text-[11px] font-semibold w-[110px] shrink-0" style={{ color: c.vm }}>{label}</span>
                  <span className="text-[11px]" style={{ color: c.nr }}>{value}</span>
                </div>
              ))}
              <div className="mt-3 p-3 rounded-lg text-[11px] leading-relaxed" style={{ background: '#FFFBF5', color: c.gr }}>
                {selectedSpec.notes}
              </div>
            </div>

            {/* Interactive checklist per title */}
            <div className="p-6">
              <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 11, color: c.gr }}>
                Checklist par titre ({eligibleProjects.length})
              </div>

              {eligibleProjects.length === 0 ? (
                <div className="text-center py-6 text-[12px]" style={{ color: c.gr }}>Aucun titre éligible pour ce canal</div>
              ) : (
                <div className="space-y-0">
                  {eligibleProjects.map(p => {
                    const matchEd = p.editions.find(e => selectedFormats.includes(e.format));
                    const margin = selectedChannel === 'Amazon KDP' ? kdpMargin(p.pages, matchEd?.price) : null;
                    const doneCount = selectedChecklist.filter((step, i) => isChecked(selectedChannel, p.id, i, step.done, p)).length;
                    const total = selectedChecklist.length;
                    const pct = Math.round((doneCount / total) * 100);
                    const isExpanded = expandedTitle === p.id;

                    return (
                      <div key={p.id} style={{ borderBottom: `1px solid ${c.ft}` }}>
                        {/* Title row */}
                        <div className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-[#FAF7F2] px-2 rounded-lg transition-colors"
                          onClick={() => setExpandedTitle(isExpanded ? null : p.id)}>
                          <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold truncate" style={{ color: c.nr }}>{p.title}</div>
                            <div className="text-[10px]" style={{ color: c.gr }}>
                              {matchEd ? FORMAT_LABELS[matchEd.format]?.label : ''} · {p.pages}p
                              {matchEd?.price && ` · ${matchEd.price}`}
                            </div>
                          </div>
                          <div className="w-20">
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: c.ft }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? c.ok : pct >= 60 ? c.og : c.er }} />
                            </div>
                            <div className="text-[9px] text-center mt-0.5 font-bold" style={{ color: pct === 100 ? c.ok : pct >= 60 ? c.og : c.er }}>
                              {doneCount}/{total}
                            </div>
                          </div>
                          {margin && (
                            <div className="text-right w-16">
                              <div className="text-[12px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: margin.royalty > 0 ? c.ok : c.er }}>
                                {margin.royalty > 0 ? '+' : ''}{margin.royalty.toFixed(2)}€
                              </div>
                            </div>
                          )}
                          <span className="text-[10px]" style={{ color: c.gr }}>{isExpanded ? '▴' : '▾'}</span>
                        </div>

                        {/* Expanded checklist — clickable checkboxes */}
                        {isExpanded && (
                          <div className="pl-12 pr-2 pb-3 space-y-0">
                            {selectedChecklist.map((step, i) => {
                              const done = isChecked(selectedChannel, p.id, i, step.done, p);
                              const key = checkKey(selectedChannel, p.id, i);
                              const isManual = manualChecks[key] !== undefined;
                              return (
                                <div key={i} className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:bg-[#FAF7F2] px-2 rounded transition-colors"
                                  onClick={() => toggleCheck(key)}>
                                  <div className="w-[18px] h-[18px] rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                                    style={{ borderColor: done ? c.ok : c.gc, background: done ? c.ok : 'white' }}>
                                    {done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                  </div>
                                  <span className="text-[11px] flex-1" style={{ color: done ? c.ok : c.nr, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.7 : 1 }}>
                                    {step.label}
                                  </span>
                                  {isManual && <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: c.ft, color: c.gr }}>manuel</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Matrix view — enriched with progress */}
      <Card hover={false}>
        <div className="px-5 py-3.5" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Matrice titre × canal</span>
        </div>
        <div className="overflow-x-auto">
          <div className="grid px-5 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: '150px repeat(6, minmax(60px, 1fr))', minWidth: 600, background: c.ft, color: c.gr }}>
            <div>Titre</div>
            {DISTRIBUTION_CHANNELS.map(ch => <div key={ch.name} className="text-center">{ch.name.split(' / ')[0]}</div>)}
          </div>
          {projects.map(p => {
            const fmts = p.editions.map(e => e.format);
            return (
              <div key={p.id} className="grid px-5 py-2.5 items-center" style={{ gridTemplateColumns: '150px repeat(6, minmax(60px, 1fr))', minWidth: 600, borderBottom: `1px solid ${c.ft}` }}>
                <div className="text-[12px] font-medium truncate">{p.title}</div>
                {DISTRIBUTION_CHANNELS.map(ch => {
                  const compat = channelFormats[ch.name] || [];
                  const has = compat.some(f => fmts.includes(f));
                  const checklist = channelChecklist[ch.name] || [];
                  const doneCount = has ? checklist.filter((step, i) => isChecked(ch.name, p.id, i, step.done, p)).length : 0;
                  const total = checklist.length;
                  return (
                    <div key={ch.name} className="text-center cursor-pointer" onClick={() => { setSelectedChannel(ch.name); setExpandedTitle(p.id); }}>
                      {has ? (
                        <span className="text-[11px] font-bold" style={{ color: doneCount === total ? c.ok : doneCount > 0 ? c.og : c.er }}>
                          {doneCount === total ? '✓' : `${doneCount}/${total}`}
                        </span>
                      ) : (
                        <span style={{ color: c.gc }}>○</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// --- NEW PROJECT MODAL ---
const NewProjectModal = ({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (p: Project) => void }) => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Roman');
  const [collection, setCollection] = useState('');
  const [pages, setPages] = useState('');
  const [formats, setFormats] = useState<EditionFormat[]>(['broché']);
  const allFormats: EditionFormat[] = ['broché', 'poche', 'epub', 'audiobook', 'pdf', 'relié'];

  const toggleFormat = (f: EditionFormat) => {
    setFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleCreate = () => {
    if (!title.trim() || formats.length === 0) return;
    const baseNum = 34 + Math.floor(Math.random() * 50);
    const editions: Edition[] = formats.map((f, i) => ({
      format: f,
      isbn: `978-2-488647-${String(baseNum + i).padStart(2, '0')}-${Math.floor(Math.random() * 10)}`,
      status: 'planned' as const,
    }));
    const newProject: Project = {
      id: Date.now(),
      title: title.trim(),
      author: 'Steve Moradel',
      genre,
      collection: collection || undefined,
      editions,
      score: 0,
      maxScore: 7,
      status: 'draft',
      pages: parseInt(pages) || 0,
      cover: genre === 'BD' ? '🎨' : genre === 'Essai' ? '📝' : genre === 'Jeunesse' ? '🌈' : '📖',
      diag: { ean: false, prix: false, isbn_txt: false, texte4e: false, typo: false, dos: false, logo: false },
      corrections: ['Ajouter EAN-13', 'Ajouter prix TTC', 'Ajouter ISBN texte', 'Fournir texte 4e', 'Fournir couverture', 'Ajouter dos', 'Ajouter logo'],
    };
    onAdd(newProject);
    setTitle(''); setGenre('Roman'); setCollection(''); setPages(''); setFormats(['broché']);
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(45,27,78,0.5)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()} className="relative bg-white rounded-2xl w-[520px] shadow-2xl">
        <div className="flex justify-between items-center px-6 py-5" style={{ borderBottom: `1px solid ${c.gc}` }}>
          <h3 className="text-xl" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Nouveau projet</h3>
          <button onClick={onClose} className="cursor-pointer bg-transparent border-none" style={{ color: c.gr }}>{icons.close}</button>
        </div>
        <div className="p-6">
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: c.gr }}>Titre</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Le titre de votre livre"
            className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none mb-4 focus:border-[#C8952E]" style={{ borderColor: c.gc }} />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: c.gr }}>Genre</label>
              <select value={genre} onChange={e => setGenre(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none bg-white cursor-pointer" style={{ borderColor: c.gc }}>
                <option value="Roman">Roman</option><option value="Essai">Essai</option><option value="BD">BD</option>
                <option value="Jeunesse">Jeunesse</option><option value="Roman historique">Roman historique</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: c.gr }}>Collection</label>
              <select value={collection} onChange={e => setCollection(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none bg-white cursor-pointer" style={{ borderColor: c.gc }}>
                <option value="">Aucune</option><option value="Étincelles">Étincelles</option>
              </select>
            </div>
          </div>

          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: c.gr }}>Nombre de pages (estimé)</label>
          <input type="number" value={pages} onChange={e => setPages(e.target.value)} placeholder="Ex: 280"
            className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none mb-4 focus:border-[#C8952E]" style={{ borderColor: c.gc }} />

          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: c.gr }}>Formats (1 ISBN par format)</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {allFormats.map(f => {
              const sel = formats.includes(f);
              return (
                <button key={f} onClick={() => toggleFormat(f)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] cursor-pointer transition-colors border"
                  style={{ background: sel ? '#E8E0F0' : 'white', borderColor: sel ? c.vm : c.gc, color: sel ? c.vm : c.gr, fontWeight: sel ? 600 : 400 }}>
                  {FORMAT_LABELS[f]?.icon} {FORMAT_LABELS[f]?.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-lg p-3.5 mb-5" style={{ background: c.ft }}>
            <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: c.gr }}>ISBN auto-attribués</div>
            <div className="font-semibold text-[15px]" style={{ color: c.mv }}>{formats.length} ISBN × {formats.length} format{formats.length > 1 ? 's' : ''}</div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {formats.map(f => (
                <span key={f} className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#E8E0F0', color: c.vm }}>{FORMAT_LABELS[f]?.icon} {FORMAT_LABELS[f]?.label}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
            <Btn onClick={handleCreate}>{icons.plus} Créer le projet</Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CALIBRAGE VIEW ---
const CalibrageView = ({ projects }: { projects: Project[] }) => {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const specs = [
    { label: 'Format', value: '13,5 × 21 cm', detail: 'Standard Jabrilia — proche du 5,25" × 8,25"' },
    { label: 'Marges', value: 'Miroir', detail: 'Int. 2,30 cm · Ext. 1,90 cm · Haut 1,80 cm · Bas 2,70 cm' },
    { label: 'Police corps', value: 'Garamond 11,5pt', detail: 'Interligne 15pt · Justifié · Alinéa 4,5 mm' },
    { label: 'Titres chapitres', value: 'Garamond 15pt', detail: 'Romain (pas gras, pas italique) · Numéro en petites capitales 12,5pt' },
    { label: 'Séparateurs', value: '∗ ∗ ∗', detail: 'Centrés · ~0,6 cm avant/après' },
    { label: 'Reliure', value: 'Dos carré collé', detail: 'Chapitres en page impaire · Espace 6-8 lignes avant titre' },
  ];

  const liminaires = [
    { page: 'Faux-titre', desc: 'Titre en petites capitales, centré' },
    { page: 'Page de titre', desc: 'Auteur / Titre / « roman » / Jabrilia Éditions' },
    { page: 'Copyright', desc: '© Jabrilia Éditions · ISBN · Dépôt légal · Mention CPI · Fiction' },
    { page: 'Dédicace', desc: 'Page impaire, italique, centré vertical' },
  ];

  const sel = selectedProject ? projects.find(p => p.id === selectedProject) : null;

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <h2 className="text-2xl" style={{ color: c.mv }}>Calibrage</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Cahier de mise en page Jabrilia Éditions</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
        {specs.map(s => (
          <Card key={s.label} hover={false} className="p-5">
            <div className="uppercase tracking-wider mb-1.5" style={{ fontSize: 10, color: c.gr, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: c.mv, fontWeight: 600 }}>{s.value}</div>
            <div className="mt-1.5" style={{ fontSize: 11, color: c.gr }}>{s.detail}</div>
          </Card>
        ))}
      </div>

      {/* Pages liminaires */}
      <Card hover={false} className="mb-6 p-5">
        <div className="uppercase tracking-wider font-semibold mb-3" style={{ fontSize: 11, color: c.gr }}>Pages liminaires obligatoires</div>
        <div className="grid grid-cols-4 gap-3">
          {liminaires.map(l => (
            <div key={l.page} className="p-3 rounded-lg" style={{ background: c.ft }}>
              <div className="text-[12px] font-semibold" style={{ color: c.mv }}>{l.page}</div>
              <div className="text-[10px] mt-1" style={{ color: c.gr }}>{l.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Calibrage par titre */}
      <Card hover={false}>
        <div className="px-5 py-3.5" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Calibrage par titre</span>
        </div>
        {projects.map(p => {
          const thickness = (p.pages * 0.05).toFixed(1);
          const canSpineText = p.pages >= 79;
          const isSelected = selectedProject === p.id;
          return (
            <div key={p.id}>
              <div className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-[#FAF7F2]"
                onClick={() => setSelectedProject(isSelected ? null : p.id)}
                style={{ borderBottom: `1px solid ${c.ft}` }}>
                <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{p.title}</div>
                  <div className="text-[10px]" style={{ color: c.gr }}>{p.genre} · {p.collection || 'Hors collection'}</div>
                </div>
                <div className="text-right" style={{ minWidth: 80 }}>
                  <div className="text-[13px] font-semibold" style={{ color: c.mv }}>{p.pages} p.</div>
                  <div style={{ fontSize: 10, color: c.gr }}>Dos : {thickness} mm</div>
                </div>
                <div className="text-right" style={{ minWidth: 110 }}>
                  <div style={{ fontSize: 11, color: c.gr }}>13,5 × 21 cm</div>
                  <div style={{ fontSize: 10, color: canSpineText ? c.ok : c.og }}>{canSpineText ? '✓ Texte dos possible' : '✗ Dos trop fin pour texte'}</div>
                </div>
                <span style={{ color: c.gr, fontSize: 12, transition: 'transform 0.2s', transform: isSelected ? 'rotate(180deg)' : '' }}>▾</span>
              </div>
              {isSelected && (
                <div className="px-5 py-4 grid grid-cols-3 gap-4" style={{ background: '#FDFCFA', borderBottom: `1px solid ${c.ft}` }}>
                  <div className="p-3 rounded-lg" style={{ background: 'white', border: `1px solid ${c.ft}` }}>
                    <div className="text-[11px] font-semibold mb-2" style={{ color: c.vm }}>Specs KDP</div>
                    <div className="text-[10px] space-y-1" style={{ color: c.gr }}>
                      <div>Format : 5,25" × 8" (133 × 203 mm)</div>
                      <div>Dos : {(p.pages * 0.002252 + 0.06).toFixed(3)}" ({((p.pages * 0.002252 + 0.06) * 25.4).toFixed(1)} mm)</div>
                      <div>Couverture : {Math.ceil((0.125 + 5.25 + (p.pages * 0.002252 + 0.06) + 5.25 + 0.125) * 300)} × {Math.ceil((0.125 + 8 + 0.125) * 300)} px</div>
                      <div>Bleed : 3,2 mm · DPI : 300</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'white', border: `1px solid ${c.ft}` }}>
                    <div className="text-[11px] font-semibold mb-2" style={{ color: c.vm }}>Specs Pollen/FR</div>
                    <div className="text-[10px] space-y-1" style={{ color: c.gr }}>
                      <div>Format : 13,5 × 21 cm</div>
                      <div>Dos : {thickness} mm (pages × 0,05)</div>
                      <div>Couverture : {Math.ceil(((2.5 + 135 + parseFloat(thickness) + 135 + 2.5) / 25.4) * 300)} × {Math.ceil(((2.5 + 210 + 2.5) / 25.4) * 300)} px</div>
                      <div>Bleed : 2,5 mm · CMJN · 300 DPI</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'white', border: `1px solid ${c.ft}` }}>
                    <div className="text-[11px] font-semibold mb-2" style={{ color: c.vm }}>Intérieur</div>
                    <div className="text-[10px] space-y-1" style={{ color: c.gr }}>
                      <div>Garamond 11,5pt · Interligne 15pt</div>
                      <div>Marge int. 23 mm · ext. 19 mm</div>
                      <div>Haut 18 mm · Bas 27 mm</div>
                      <div>Alinéa 4,5 mm · Justifié</div>
                      <div>Tirets dialogue : cadratin (—)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
};

// --- SETTINGS VIEW ---
// ═══════════════════════════════════
// MANUSCRITS VIEW
// ═══════════════════════════════════
const ManuscritsView = ({ projects, onProject, onToast }: { projects: Project[]; onProject: (p: Project) => void; onToast: (msg: string) => void }) => {
  const withMs = projects.filter(p => p.manuscriptStatus && p.manuscriptStatus !== 'none');
  const withoutMs = projects.filter(p => !p.manuscriptStatus || p.manuscriptStatus === 'none');
  const analyzed = projects.filter(p => p.analysis);
  const injected = projects.filter(p => p.manuscriptStatus === 'isbn-injected');

  const statusSteps: { key: ManuscriptStatus; label: string; icon: string }[] = [
    { key: 'uploaded', label: 'Upload', icon: '↑' },
    { key: 'analyzed', label: 'Analyse', icon: '◉' },
    { key: 'validated', label: 'Validé', icon: '✓' },
    { key: 'isbn-injected', label: 'ISBN injecté', icon: '★' },
  ];
  const statusOrder: ManuscriptStatus[] = ['none', 'uploaded', 'analyzed', 'validated', 'isbn-injected'];

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <h2 className="text-2xl" style={{ color: c.mv }}>Manuscrits</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Import, analyse et injection ISBN dans vos fichiers .docx</p>
        </div>
        <Btn onClick={() => onToast('Importer un manuscrit : ouvrir la fiche projet → glisser un fichier .docx')}>{icons.upload} Importer un manuscrit</Btn>
      </div>

      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={withMs.length} label="Manuscrits fournis" accent={c.ok} />
        <StatCard value={analyzed.length} label="Analysés" accent={c.vm} />
        <StatCard value={injected.length} label="ISBN injectés" accent={c.or} />
        <StatCard value={withoutMs.length} label="En attente" accent={c.er} />
      </div>

      {/* Pipeline manuscrit */}
      <Card hover={false} className="p-6 mb-6">
        <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Pipeline manuscrit</div>
        <div className="flex items-center gap-2 justify-between max-w-2xl">
          {statusSteps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: 'rgba(200,149,46,0.1)', color: c.or }}>{s.icon}</div>
                <div className="text-[11px] mt-1.5 font-semibold text-center" style={{ color: c.mv }}>{s.label}</div>
                <div className="text-[10px]" style={{ color: c.gr }}>{projects.filter(p => p.manuscriptStatus === s.key).length} titres</div>
              </div>
              {i < statusSteps.length - 1 && <div className="w-8 h-px mt-[-16px]" style={{ background: c.gc }} />}
            </div>
          ))}
        </div>
      </Card>

      {/* Upload zone */}
      <Card hover={false} className="mb-6">
        <div className="p-8 text-center rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:bg-[rgba(200,149,46,0.02)]"
          style={{ borderColor: 'rgba(200,149,46,0.2)' }}>
          <div className="text-4xl mb-3 opacity-40">📄</div>
          <div className="text-sm font-semibold mb-1" style={{ color: c.mv }}>Glissez un fichier .docx ici</div>
          <div className="text-[12px]" style={{ color: c.gr }}>ou cliquez pour parcourir — Le manuscrit sera associé au projet correspondant</div>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Badge bg={c.ft} color={c.gr}>.docx</Badge>
            <Badge bg={c.ft} color={c.gr}>.doc</Badge>
            <Badge bg={c.ft} color={c.gr}>.odt</Badge>
          </div>
        </div>
      </Card>

      {/* Table par projet */}
      <Card hover={false}>
        <div className="px-5 py-3.5" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>État des manuscrits par titre</span>
        </div>
        {projects.map(p => {
          const ms = p.manuscriptStatus || 'none';
          const msLabel = MANUSCRIPT_STATUS_LABELS[ms];
          const stepIdx = statusOrder.indexOf(ms);
          return (
            <div key={p.id} onClick={() => onProject(p)}
              className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors hover:bg-[#FAF7F2]"
              style={{ borderBottom: `1px solid ${c.ft}` }}>
              <CoverThumb emoji={p.cover} coverImage={p.coverImage} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate" style={{ color: c.nr }}>{p.title}</div>
                <div className="text-[11px] mt-0.5" style={{ color: c.gr }}>
                  {p.manuscriptFile ? p.manuscriptFile : 'Aucun fichier'}
                  {p.analysis && <span className="ml-2" style={{ color: c.vm }}>· Score IA : {p.analysis.iaScore}%</span>}
                </div>
              </div>
              {/* Mini progress */}
              <div className="flex gap-1">
                {statusSteps.map((s, i) => (
                  <div key={s.key} className="w-5 h-1.5 rounded-full" style={{ background: i < stepIdx ? c.ok : i === stepIdx && ms !== 'none' ? c.or : c.gc }} />
                ))}
              </div>
              <Badge bg={msLabel.bg} color={msLabel.color}>{msLabel.icon} {msLabel.label}</Badge>
              <div style={{ color: c.gr }}>{icons.chevR}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

// ═══════════════════════════════════
// ANALYSE VIEW (Scanner IA + Qualité)
// ═══════════════════════════════════
const AnalyseView = ({ projects, onProject, onToast }: { projects: Project[]; onProject: (p: Project) => void; onToast: (msg: string) => void }) => {
  const analyzed = projects.filter(p => p.analysis);
  const avgIa = analyzed.length > 0 ? Math.round(analyzed.reduce((s, p) => s + (p.analysis?.iaScore || 0), 0) / analyzed.length) : 0;
  const totalFlags = analyzed.reduce((s, p) => s + (p.analysis?.flaggedPatterns.length || 0), 0);
  const criticals = analyzed.reduce((s, p) => s + (p.analysis?.flaggedPatterns.filter(f => f.severity === 'critical').length || 0), 0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const sevColors = { critical: c.er, moderate: c.og, minor: c.gr };
  const sevLabels = { critical: 'Critique', moderate: 'Modéré', minor: 'Mineur' };

  const dimLabels: Record<string, { label: string; icon: string; desc: string }> = {
    rythme: { label: 'Rythme', icon: '🎵', desc: 'Alternance longue/courte, souffle littéraire, monotonie' },
    images: { label: 'Images', icon: '🖼️', desc: 'Métaphores, comparaisons, densité figurative' },
    tension: { label: 'Tension', icon: '⚡', desc: 'Conflit, résistance du personnage, mouvement dramatique' },
    voix: { label: 'Voix', icon: '🎤', desc: 'Authenticité — absence de patterns IA' },
    architecture: { label: 'Architecture', icon: '🏗️', desc: 'Variété des ouvertures/fermetures, attaques' },
    sensorialite: { label: 'Sensorialité', icon: '👁️', desc: '5 sens mobilisés, ancrage corporel et spatial' },
  };

  const dimScoreColor = (score: number) => score >= 8 ? c.ok : score >= 6 ? c.og : score >= 4 ? '#E07A2F' : c.er;

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <h2 className="text-2xl" style={{ color: c.mv }}>Analyse</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Diagnostic 6 dimensions Moradel — Scanner intégré</p>
        </div>
        <Btn onClick={() => onToast('Lancer une analyse : ouvrir la fiche projet → cliquer Analyser')}>{icons.analyse} Lancer une analyse</Btn>
      </div>

      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={analyzed.length} label="Manuscrits analysés" accent={c.vm} />
        <StatCard value={`${avgIa}%`} label="Score IA moyen" accent={avgIa > 25 ? c.er : c.ok} />
        <StatCard value={totalFlags} label="Patterns détectés" accent={c.og} />
        <StatCard value={criticals} label="Critiques" accent={c.er} />
      </div>

      {/* 6 Dimensions explanation */}
      <Card hover={false} className="p-6 mb-6">
        <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Les 6 dimensions Moradel</div>
        <div className="grid grid-cols-6 gap-3">
          {Object.entries(dimLabels).map(([key, d]) => (
            <div key={key} className="p-3 rounded-xl text-center" style={{ background: c.ft }}>
              <span className="text-xl">{d.icon}</span>
              <div className="font-semibold text-[12px] mt-1.5" style={{ color: c.mv }}>{d.label}</div>
              <div className="text-[10px] mt-1 leading-relaxed" style={{ color: c.gr }}>{d.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Results per manuscript */}
      {analyzed.length === 0 ? (
        <Card hover={false} className="p-8 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: c.mv }}>Aucune analyse disponible</h3>
          <p className="text-sm" style={{ color: c.gr }}>Importez un manuscrit puis lancez le scanner pour détecter les patterns IA et évaluer les 6 dimensions.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {analyzed.map(p => {
            const a = p.analysis!;
            const iaColor = a.iaScore > 30 ? c.er : a.iaScore > 15 ? c.og : c.ok;
            const isExpanded = expandedId === p.id;
            const dims = (a as unknown as Record<string, unknown>).dimensions as Record<string, { score: number; label: string; findings: string[]; metrics: Record<string, number | string> }> | undefined;
            const globalScore = dims ? (dims as unknown as Record<string, unknown>).global as number : null;

            return (
              <Card key={p.id} hover={false} className="p-0 overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#FAF7F2]"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  style={{ borderBottom: `1px solid ${c.ft}` }}>
                  <CoverThumb emoji={p.cover} coverImage={p.coverImage} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold" style={{ color: c.nr }}>{p.title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: c.gr }}>
                      {a.wordCount.toLocaleString()} mots · {Math.round(a.avgSentenceLength)} mots/phrase · Analysé le {a.timestamp}
                    </div>
                  </div>
                  {globalScore !== null && globalScore !== undefined && (
                    <div className="text-right mr-3">
                      <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Global</div>
                      <div className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: dimScoreColor(globalScore) }}>{globalScore}/10</div>
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Score IA</div>
                    <div className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: iaColor }}>{a.iaScore}%</div>
                  </div>
                  <span style={{ color: c.gr, fontSize: 12, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : '' }}>▾</span>
                </div>

                {/* 6D dimension bars — always shown if available */}
                {dims && (
                  <div className="px-5 py-3" style={{ borderBottom: `1px solid ${c.ft}` }}>
                    <div className="grid grid-cols-6 gap-3">
                      {Object.entries(dimLabels).map(([key, meta]) => {
                        const dim = dims[key];
                        if (!dim) return null;
                        return (
                          <div key={key} className="text-center">
                            <div className="text-[10px] font-semibold mb-1" style={{ color: c.gr }}>{meta.icon} {meta.label}</div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: c.ft }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${dim.score * 10}%`, background: dimScoreColor(dim.score) }} />
                            </div>
                            <div className="text-[11px] font-bold mt-1" style={{ color: dimScoreColor(dim.score) }}>{dim.score}/10</div>
                            <div className="text-[9px]" style={{ color: c.gr }}>{dim.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Expanded: detailed findings per dimension */}
                {isExpanded && dims && (
                  <div className="px-5 py-4" style={{ background: '#FDFCFA', borderBottom: `1px solid ${c.ft}` }}>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(dimLabels).map(([key, meta]) => {
                        const dim = dims[key];
                        if (!dim) return null;
                        return (
                          <div key={key} className="p-3 rounded-lg" style={{ background: 'white', border: `1px solid ${c.ft}` }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[12px] font-semibold" style={{ color: c.mv }}>{meta.icon} {meta.label}</span>
                              <span className="text-[12px] font-bold" style={{ color: dimScoreColor(dim.score) }}>{dim.score}/10 — {dim.label}</span>
                            </div>
                            {dim.findings.map((f: string, i: number) => (
                              <div key={i} className="text-[11px] py-0.5" style={{ color: c.nr }}>→ {f}</div>
                            ))}
                            {Object.entries(dim.metrics).length > 0 && (
                              <div className="mt-2 pt-2 flex flex-wrap gap-x-4 gap-y-1" style={{ borderTop: `1px solid ${c.ft}` }}>
                                {Object.entries(dim.metrics).map(([mk, mv]) => (
                                  <span key={mk} className="text-[10px]" style={{ color: c.gr }}>
                                    <span className="font-semibold">{mk}</span>: {mv}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Expanded: patterns */}
                {isExpanded && a.flaggedPatterns.length > 0 && (
                  <div className="px-5 py-3" style={{ background: c.ft }}>
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.gr }}>Patterns IA détectés</div>
                    <div className="space-y-1.5">
                      {a.flaggedPatterns.map((fp, i) => (
                        <div key={i} className="flex items-center gap-2 text-[12px]">
                          <Badge bg={fp.severity === 'critical' ? '#FDE0E3' : fp.severity === 'moderate' ? '#FDE8D0' : c.gc}
                            color={sevColors[fp.severity]}>
                            {sevLabels[fp.severity]}
                          </Badge>
                          <span style={{ color: c.mv, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{fp.pattern}</span>
                          <span className="ml-auto font-semibold" style={{ color: sevColors[fp.severity] }}>×{fp.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clean manuscript badge */}
                {a.flaggedPatterns.length === 0 && !isExpanded && (
                  <div className="px-5 py-2.5 text-center text-[12px] font-semibold" style={{ background: '#D4F0E0', color: c.ok }}>
                    ✓ Aucun pattern IA détecté — manuscrit authentique
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};


// ═══════════════════════════════════
// DOSSIER DE PRESSE VIEW
// ═══════════════════════════════════
const PresseView = ({ projects, onProject, onToast }: { projects: Project[]; onProject: (p: Project) => void; onToast: (msg: string) => void }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const sections = [
    { id: 'editeur', title: 'Présentation éditeur', desc: 'Jabrilia Éditions, ligne éditoriale, vision, chiffres clés', icon: '🏠', always: true },
    { id: 'auteur', title: 'Biographie auteur', desc: 'Parcours, distinctions, publications, LinkedIn Top Voice 2020', icon: '✍️', always: true },
    { id: 'synopsis', title: 'Synopsis & argumentaire', desc: 'Résumé long, points forts, public cible, angles presse', icon: '📝', always: false },
    { id: 'extrait', title: 'Extrait de lecture', desc: 'Extrait choisi pour la presse (1-2 pages), incipit ou passage clé', icon: '📖', always: false },
    { id: 'technique', title: 'Fiche technique', desc: 'ISBN, format, pages, prix, date parution, distributeur, impression', icon: '📐', always: false },
    { id: 'visuels', title: 'Visuels HD', desc: 'Couverture, portrait auteur, logo Jabrilia, couverture à plat', icon: '🖼️', always: false },
    { id: 'revues', title: 'Revue de presse', desc: 'Citations presse, critiques, podcasts, interviews passées', icon: '📰', always: true },
    { id: 'contact', title: 'Contact presse', desc: 'Coordonnées, disponibilités interviews, liens sociaux', icon: '📧', always: true },
  ];

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <h2 className="text-2xl" style={{ color: c.mv }}>Dossier de Presse</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Génération de dossiers de presse par titre ou global</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary">{icons.presse} Dossier global</Btn>
          <Btn onClick={() => {
            const text = `DOSSIER DE PRESSE\nJabrilia Éditions\n${'='.repeat(40)}\n\n${projects.map(p => `${p.title}\nGenre: ${p.genre} · ${p.pages} pages\n${p.backCover || ''}\n`).join('\n---\n\n')}`;
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `jabrilia-dossier-presse-${new Date().toISOString().slice(0, 10)}.txt`; a.click();
            onToast('Dossier de presse exporté');
          }}>{icons.download} Exporter PDF</Btn>
        </div>
      </div>

      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={projects.length} label="Titres au catalogue" accent={c.or} />
        <StatCard value={sections.length} label="Sections du dossier" accent={c.vm} />
        <StatCard value={4} label="Distinctions auteur" accent={c.ok} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Left — Sélection */}
        <div className="col-span-1 space-y-4">
          {/* Dossier global */}
          <Card hover={false} className="p-4 cursor-pointer transition-all" 
            onClick={() => setSelectedProject(null)}
            style={{ borderLeft: !selectedProject ? `3px solid ${c.or}` : '3px solid transparent' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${c.or}, ${c.oc})` }}>
                <span className="text-white text-lg">J</span>
              </div>
              <div>
                <div className="text-[13px] font-bold" style={{ color: c.mv }}>Dossier global</div>
                <div className="text-[10px]" style={{ color: c.gr }}>Jabrilia Éditions · Tout le catalogue</div>
              </div>
            </div>
          </Card>

          {/* Par titre */}
          <Card hover={false} className="p-0">
            <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
              <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 10, color: c.gr }}>Par titre</span>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {projects.map(p => (
                <div key={p.id} onClick={() => setSelectedProject(p)}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-[#FAF7F2]"
                  style={{ background: selectedProject?.id === p.id ? 'rgba(200,149,46,0.06)' : 'transparent', borderLeft: selectedProject?.id === p.id ? `3px solid ${c.or}` : '3px solid transparent', borderBottom: `1px solid ${c.ft}` }}>
                  <CoverThumb emoji={p.cover} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate" style={{ color: c.nr }}>{p.title}</div>
                    <div className="text-[10px]" style={{ color: c.gr }}>{p.editions.length} éd. · {primaryISBN(p)}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center + Right — Contenu du dossier */}
        <div className="col-span-2 space-y-4">
          {/* Header */}
          <Card hover={false} className="p-6">
            <div className="flex items-center gap-4">
              {selectedProject ? (
                <>
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl" style={{ background: c.ft }}>{selectedProject.cover}</div>
                  <div>
                    <div className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>{selectedProject.title}</div>
                    <div className="text-[13px] mt-0.5" style={{ color: c.gr }}>{selectedProject.author} · {selectedProject.genre} · {selectedProject.pages} pages</div>
                    <div className="flex gap-2 mt-2">
                      {selectedProject.editions.slice(0, 4).map(ed => (
                        <Badge key={ed.format} bg={c.ft} color={c.gr}>{FORMAT_LABELS[ed.format]?.icon} {ed.format}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${c.or}, ${c.oc})` }}>
                    <span className="text-white text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>J</span>
                  </div>
                  <div>
                    <div className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Jabrilia Éditions</div>
                    <div className="text-[13px] mt-0.5" style={{ color: c.gr }}>Maison d&apos;édition indépendante · {projects.length} titres · {countISBN(projects)} ISBN</div>
                    <div className="flex gap-2 mt-2">
                      <Badge bg="#D4F0E0" color="#1A6B42">Chevalier Ordre National du Mérite</Badge>
                      <Badge bg="#E8E0F0" color="#3E2768">Prix de l&apos;Africanité 2024</Badge>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Sections */}
          <div className="grid grid-cols-2 gap-3">
            {sections
              .filter(s => s.always || selectedProject)
              .map(s => (
                <Card key={s.id} hover={false} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{s.icon}</span>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold" style={{ color: c.mv }}>{s.title}</div>
                      <div className="text-[11px] mt-0.5 leading-relaxed" style={{ color: c.gr }}>{s.desc}</div>
                      <div className="flex gap-2 mt-2.5">
                        <Btn variant="secondary">{icons.edit} Éditer</Btn>
                        <Btn variant="secondary">{icons.check} Valider</Btn>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>

          {/* Informations auteur */}
          <Card hover={false} className="p-5">
            <div className="uppercase tracking-wider font-semibold mb-3" style={{ fontSize: 11, color: c.gr }}>Informations auteur · Steve Moradel</div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Distinctions', items: ['Chevalier de l\'Ordre National du Mérite (2022)', 'Prix de l\'Africanité (2024)', 'LinkedIn Top Voice (2020)', 'Personnalité de l\'Année Outre Mer Network (2018)'] },
                { label: 'Enseignement', items: ['ESSEC Business School', 'INSEEC', 'Audencia'] },
                { label: 'Expertise', items: ['Stratégie & Management', 'Sciences Humaines & Sociales', 'Géopolitique & Souveraineté maritime', 'Consultant exécutifs internationaux'] },
                { label: 'Médias', items: ['Newsletter Les Pages de Jade (12 000 abonnés)', '100+ articles publiés (revues internationales)', 'Fondateur NGO Acting For Water (reconnu ONU)'] },
              ].map(cat => (
                <div key={cat.label}>
                  <div className="text-[12px] font-semibold mb-1.5" style={{ color: c.mv }}>{cat.label}</div>
                  {cat.items.map(item => (
                    <div key={item} className="text-[11px] py-0.5 flex items-start gap-1.5" style={{ color: c.gr }}>
                      <span style={{ color: c.or, marginTop: 2 }}>•</span> {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          {/* Export options */}
          <Card hover={false} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-[14px]" style={{ color: c.mv }}>
                  Exporter le dossier {selectedProject ? `« ${selectedProject.title} »` : 'global Jabrilia'}
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: c.gr }}>
                  {sections.filter(s => s.always || selectedProject).length} sections · PDF professionnel prêt à envoyer
                </div>
              </div>
              <div className="flex gap-2">
                <Btn variant="secondary">{icons.share} Lien partageable</Btn>
                <Btn onClick={() => {
                  const sp = selectedProject;
                  const text = sp
                    ? `DOSSIER DE PRESSE\n${sp.title} — Steve Moradel\n${'='.repeat(40)}\n\nGenre: ${sp.genre}\nPages: ${sp.pages}\nISBN: ${sp.editions.map(e => e.isbn).join(', ')}\n\n${sp.backCover || 'Résumé non renseigné'}\n\nÀ PROPOS DE L'AUTEUR\nSteve Moradel est écrivain, stratège et enseignant.\nChevalier de l'Ordre National du Mérite.\nPrix de l'Africanité 2024.\n\nCONTACT\nJabrilia Éditions — contact@jabrilia.com`
                    : `DOSSIER DE PRESSE\nJabrilia Éditions\n${'='.repeat(40)}\n\n${projects.length} titres au catalogue\n\n${projects.map(p => `• ${p.title} (${p.genre}, ${p.pages}p)`).join('\n')}`;
                  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `presse-${sp ? sp.title.toLowerCase().replace(/\s+/g, '-') : 'jabrilia'}.txt`; a.click();
                  onToast(`Dossier exporté${sp ? ` — ${sp.title}` : ''}`);
                }}>{icons.download} Télécharger PDF</Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// SETTINGS
// ═══════════════════════════════════
const SettingsView = ({ onToast }: { onToast: (msg: string) => void }) => {
  const loadSettings = () => {
    try { const s = localStorage.getItem('jabr-settings'); return s ? JSON.parse(s) : null; } catch { return null; }
  };
  const defaults: Record<string, string> = { editeur: 'Jabrilia Éditions', auteur: 'Steve Moradel', prefixe: '978-2-488647', format: '13,5 × 21 cm', email: 'contact@jabrilia.com', site: 'jabrilia.com', policeCorps: 'Garamond 11,5pt', interligne: '15pt', margesInt: '2,30', margesExt: '1,90', margesHaut: '1,80', margesBas: '2,70', alinea: '4,5 mm', separateur: '∗ ∗ ∗', ttsVoice: 'adam-fr', ttsCost: '0.30', distributor: 'KDP + Pollen' };
  const init = loadSettings() || defaults;
  const [s, setS] = useState<Record<string, string>>(init);
  const [saved, setSaved] = useState(false);

  const update = (key: string, val: string) => setS(prev => ({ ...prev, [key]: val }));
  const handleSave = () => {
    try { localStorage.setItem('jabr-settings', JSON.stringify(s)); } catch { /* silent */ }
    setSaved(true); onToast('Paramètres enregistrés'); setTimeout(() => setSaved(false), 2000);
  };
  const handleReset = () => { setS(defaults); onToast('Valeurs par défaut restaurées'); };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'jabr-settings.json'; a.click();
    onToast('Configuration exportée');
  };

  const Field = ({ label, k, mono }: { label: string; k: string; mono?: boolean }) => (
    <div className="mb-3.5">
      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: c.gr }}>{label}</label>
      <input value={s[k] || ''} onChange={e => update(k, e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none focus:border-[#C8952E] transition-colors"
        style={{ borderColor: c.gc, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined }} />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div><h2 className="text-2xl" style={{ color: c.mv }}>Paramètres</h2><p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Configuration Jabrilia · Persistée localement</p></div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={handleExport}>{icons.download} Exporter</Btn>
          <Btn variant="secondary" onClick={handleReset}>Réinitialiser</Btn>
          <Btn onClick={handleSave}>{saved ? icons.check : icons.edit} {saved ? 'Enregistré ✓' : 'Enregistrer'}</Btn>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card hover={false} className="p-5">
          <h3 className="text-base mb-4" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Maison d&apos;édition</h3>
          <Field label="Nom" k="editeur" />
          <Field label="Auteur principal" k="auteur" />
          <Field label="Préfixe ISBN" k="prefixe" mono />
          <Field label="Email" k="email" />
          <Field label="Site web" k="site" />
          <Field label="Distributeur principal" k="distributor" />
        </Card>
        <Card hover={false} className="p-5">
          <h3 className="text-base mb-4" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Spécifications intérieur</h3>
          <Field label="Format (L × H)" k="format" />
          <Field label="Police corps" k="policeCorps" />
          <Field label="Interligne" k="interligne" />
          <Field label="Marge intérieure (cm)" k="margesInt" mono />
          <Field label="Marge extérieure (cm)" k="margesExt" mono />
          <Field label="Marge haut (cm)" k="margesHaut" mono />
          <Field label="Marge bas (cm)" k="margesBas" mono />
          <Field label="Alinéa" k="alinea" mono />
          <Field label="Séparateur sections" k="separateur" />
        </Card>
        <div className="flex flex-col gap-5">
          <Card hover={false} className="p-5">
            <h3 className="text-base mb-4" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Charte graphique</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              {[{ n: 'Or', c: '#C8952E' }, { n: 'Mauve', c: '#2D1B4E' }, { n: 'Orange', c: '#E07A2F' }, { n: 'Blanc cassé', c: '#FAF7F2' }].map(col => (
                <div key={col.n} className="text-center">
                  <div className="w-10 h-10 rounded-lg mx-auto mb-1" style={{ background: col.c, border: col.c === '#FAF7F2' ? `1px solid ${c.gc}` : 'none' }} />
                  <div style={{ fontSize: 9, color: c.gr }}>{col.n}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {[{ font: "'Playfair Display', serif", name: 'Playfair', usage: 'Titres' }, { font: "'Inter', sans-serif", name: 'Inter', usage: 'Corps' }, { font: "'JetBrains Mono', monospace", name: 'JetBrains', usage: 'Code' }].map(f => (
                <div key={f.name} className="flex justify-between items-center py-1" style={{ borderBottom: `1px solid ${c.ft}` }}>
                  <span style={{ fontFamily: f.font, fontSize: 13, color: c.mv }}>{f.name}</span>
                  <span style={{ fontSize: 9, color: c.gr }}>{f.usage}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card hover={false} className="p-5">
            <h3 className="text-base mb-4" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Production audio</h3>
            <Field label="Voix TTS par défaut" k="ttsVoice" />
            <Field label="Coût estimé €/min" k="ttsCost" mono />
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- AUDIOBOOKS VIEW ---
const AudiobooksView = ({ projects, onToast }: { projects: Project[]; onToast: (msg: string) => void }) => {
  const withAudio = projects.filter(p => p.editions.some(e => e.format === 'audiobook'));
  const withoutAudio = projects.filter(p => p.genre !== 'BD' && !p.editions.some(e => e.format === 'audiobook'));
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const pipeline = [
    { icon: '📝', title: '1. Import', desc: 'Upload .docx · Découpe chapitres auto', status: 'ready' },
    { icon: '🎙️', title: '2. Voix IA', desc: 'ElevenLabs TTS · Choix voix / clonage', status: 'ready' },
    { icon: '🎛️', title: '3. Mastering', desc: 'Normalisation -14 LUFS · EQ · Compression', status: 'ready' },
    { icon: '✅', title: '4. Validation', desc: 'Écoute chapitres · Corrections ponctuelles', status: 'manual' },
    { icon: '📦', title: '5. Export', desc: 'MP3 320kbps par chapitre + fichier complet', status: 'ready' },
    { icon: '🌐', title: '6. Distribution', desc: 'ACX/Audible · Spotify · Apple Books', status: 'phase2' },
  ];

  const voices = [
    { name: 'Narrateur FR — Masculin', id: 'adam-fr', desc: 'Voix grave, posée, littéraire', cost: '~0,30€/min' },
    { name: 'Narratrice FR — Féminin', id: 'bella-fr', desc: 'Voix claire, chaleureuse, expressive', cost: '~0,30€/min' },
    { name: 'Clonage voix auteur', id: 'clone', desc: '3 min d\'échantillon requis · Voix personnalisée', cost: '~0,50€/min' },
  ];

  const acxSpecs = [
    { label: 'Format audio', value: 'MP3 192kbps CBR mono / 44.1kHz' },
    { label: 'Couverture', value: 'JPEG 2400 × 2400 px carré' },
    { label: 'Durée minimum', value: '60 minutes' },
    { label: 'Fichiers', value: '1 MP3 par chapitre + Opening + Closing Credits' },
    { label: 'Niveaux', value: '-23dB RMS · -3dB peak · -60dB noise floor' },
    { label: 'Silence', value: '0,5–1s entre sections · 1–5s entre chapitres' },
  ];

  const totalMinutes = projects.filter(p => p.genre !== 'BD').reduce((s, p) => s + Math.round(p.pages * 1.5), 0);
  const estimatedCost = Math.round(totalMinutes * 0.3);

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div><h2 className="text-2xl" style={{ color: c.mv }}>Audiobooks</h2><p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Production vocale IA — ElevenLabs TTS · Pipeline automatisé</p></div>
        <Btn onClick={() => onToast('Production audiobook : sélectionner un titre avec manuscrit validé')}>{icons.plus} Lancer une production</Btn>
      </div>
      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={withAudio.length} label="Avec audiobook" accent={c.ok} />
        <StatCard value={withoutAudio.length} label="Éligibles" accent={c.og} />
        <StatCard value={`~${totalMinutes} min`} label="Durée totale est." accent={c.vm} />
        <StatCard value={`~${estimatedCost}€`} label="Coût estimé TTS" accent={c.or} />
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-6">
        {pipeline.map((s, i) => (
          <Card key={s.title} hover={false} className="p-4 text-center relative">
            <div className="text-2xl mb-1.5">{s.icon}</div>
            <div className="font-semibold text-[12px]" style={{ color: c.mv }}>{s.title}</div>
            <div className="text-[10px] mt-1 leading-relaxed" style={{ color: c.gr }}>{s.desc}</div>
            <div className="mt-2">
              <Badge bg={s.status === 'ready' ? '#D4F0E0' : s.status === 'manual' ? '#FDE8D0' : '#E8E0F0'}
                color={s.status === 'ready' ? c.ok : s.status === 'manual' ? c.og : c.vm}>
                {s.status === 'ready' ? 'Auto' : s.status === 'manual' ? 'Manuel' : 'Phase 2'}
              </Badge>
            </div>
            {i < pipeline.length - 1 && (
              <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 text-[14px]" style={{ color: c.gc }}>→</div>
            )}
          </Card>
        ))}
      </div>

      {/* Voice selection + ACX specs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card hover={false} className="p-5">
          <div className="uppercase tracking-wider font-semibold mb-3" style={{ fontSize: 11, color: c.gr }}>Voix disponibles</div>
          {voices.map(v => (
            <div key={v.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[14px]"
                style={{ background: v.id === 'clone' ? '#E8E0F0' : c.ft }}>
                {v.id === 'clone' ? '🧬' : v.id.includes('adam') ? '🗣️' : '🎤'}
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-semibold" style={{ color: c.mv }}>{v.name}</div>
                <div className="text-[10px]" style={{ color: c.gr }}>{v.desc}</div>
              </div>
              <span className="text-[10px] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.or }}>{v.cost}</span>
            </div>
          ))}
        </Card>
        <Card hover={false} className="p-5">
          <div className="uppercase tracking-wider font-semibold mb-3" style={{ fontSize: 11, color: c.gr }}>Specs ACX / Audible</div>
          {acxSpecs.map(s => (
            <div key={s.label} className="flex py-1.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
              <span className="text-[11px] font-semibold w-[110px] shrink-0" style={{ color: c.vm }}>{s.label}</span>
              <span className="text-[11px]" style={{ color: c.nr }}>{s.value}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Titles with audio */}
      {withAudio.length > 0 && (
        <Card hover={false} className="mb-5">
          <div className="px-5 py-3.5" style={{ borderBottom: `2px solid ${c.ok}` }}>
            <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Éditions audiobook planifiées</span>
          </div>
          {withAudio.map(p => {
            const audioEd = p.editions.find(e => e.format === 'audiobook')!;
            const duration = Math.round(p.pages * 1.5);
            const chapters = Math.round(p.pages / 20);
            const cost = Math.round(duration * 0.3);
            const isExpanded = expandedId === p.id;
            return (
              <div key={p.id}>
                <div className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-[#FAF7F2]"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  style={{ borderBottom: `1px solid ${c.ft}` }}>
                  <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{p.title}</div>
                    <div style={{ fontSize: 11, color: c.gr }}>{p.pages} pages · ~{duration} min · ~{chapters} chapitres</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.or }}>~{cost}€</div>
                    <div style={{ fontSize: 9, color: c.gr }}>coût TTS estimé</div>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: c.gr }}>{audioEd.isbn}</div>
                  <Badge bg={EDITION_STATUS_LABELS[audioEd.status]?.bg || c.gc} color={EDITION_STATUS_LABELS[audioEd.status]?.color || c.gr}>
                    {EDITION_STATUS_LABELS[audioEd.status]?.label}
                  </Badge>
                  <span style={{ color: c.gr, fontSize: 12, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : '' }}>▾</span>
                </div>
                {isExpanded && (
                  <div className="px-5 py-4 grid grid-cols-3 gap-4" style={{ background: '#FDFCFA', borderBottom: `1px solid ${c.ft}` }}>
                    <div className="p-3 rounded-lg" style={{ background: 'white', border: `1px solid ${c.ft}` }}>
                      <div className="text-[11px] font-semibold mb-2" style={{ color: c.vm }}>Production</div>
                      <div className="text-[10px] space-y-1" style={{ color: c.gr }}>
                        <div>Chapitres estimés : ~{chapters}</div>
                        <div>Durée totale : ~{duration} min ({Math.floor(duration / 60)}h{duration % 60 > 0 ? `${duration % 60}min` : ''})</div>
                        <div>Voix : à sélectionner</div>
                        <div>Statut : en attente de lancement</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: 'white', border: `1px solid ${c.ft}` }}>
                      <div className="text-[11px] font-semibold mb-2" style={{ color: c.vm }}>Export</div>
                      <div className="text-[10px] space-y-1" style={{ color: c.gr }}>
                        <div>Format : MP3 192kbps CBR mono</div>
                        <div>Fichiers : {chapters} chapitres + Opening + Closing</div>
                        <div>Couverture : 2400 × 2400 px</div>
                        <div>Métadonnées ID3 : titre, auteur, chapitre</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: 'white', border: `1px solid ${c.ft}` }}>
                      <div className="text-[11px] font-semibold mb-2" style={{ color: c.vm }}>Coût estimé</div>
                      <div className="text-[10px] space-y-1" style={{ color: c.gr }}>
                        <div>TTS ElevenLabs : ~{cost}€</div>
                        <div>Mastering auto : inclus</div>
                        <div>Distribution ACX : 0€ (commission sur ventes)</div>
                        <div className="pt-1 font-semibold" style={{ color: c.or }}>Total : ~{cost}€</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {withoutAudio.length > 0 && (
        <Card hover={false}>
          <div className="px-5 py-3.5" style={{ borderBottom: `2px solid ${c.og}` }}>
            <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Titres éligibles sans édition audiobook</span>
          </div>
          {withoutAudio.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: `1px solid ${c.ft}` }}>
              <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
              <div className="flex-1"><div className="text-[13px] font-semibold">{p.title}</div><div style={{ fontSize: 11, color: c.gr }}>{p.pages} pages · ~{Math.round(p.pages * 1.5)} min</div></div>
              <GenreBadge genre={p.genre} />
              <Badge bg={c.gc} color={c.gr}>Pas d&apos;ISBN audio</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

// --- MARKETING VIEW ---
const MarketingView = ({ projects }: { projects: Project[] }) => {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [generatedKit, setGeneratedKit] = useState<Record<number, { brief: { tone: string; ambiance: string; targetAudience: string; themes: string[]; palette: { primary: string; secondary: string; accent: string }; oneLinePitch: string; backCoverHook: string; hashTags: string[]; marketingAngle: string; comparisons: string[]; visualKeywords: string[] }; marketing: { instagramCaption: string; linkedinPost: string; newsletterBlurb: string; pressRelease: string }; trailer: { duration: number; musicMood: string; scenes: { timestamp: number; visual: string; voiceOver: string; text: string }[] }; cover: { style: string; composition: string; typography: { titleFont: string; authorFont: string; placement: string }; genreConventions: string; thumbnailTest: string; promptMidjourney: string; promptDalle: string } }>>({});

  // Lazy import engine
  const generateKit = async (projectId: number) => {
    const { runFullPipeline } = await import('@/lib/engine');
    const p = projects.find(pr => pr.id === projectId);
    if (!p) return;
    const result = runFullPipeline({ title: p.title, genre: p.genre, pages: p.pages, backCover: p.backCover, collection: p.collection });
    setGeneratedKit(prev => ({ ...prev, [projectId]: result }));
    setSelectedProject(projectId);
  };

  const sel = selectedProject ? projects.find(p => p.id === selectedProject) : null;
  const kit = selectedProject ? generatedKit[selectedProject] : null;

  const engines = [
    { icon: '📋', name: 'Brief créatif', desc: 'Analyse du contenu → ton, thèmes, palette, audience', auto: true },
    { icon: '📱', name: 'Kit Marketing', desc: 'Instagram, LinkedIn, newsletter, communiqué de presse', auto: true },
    { icon: '🎬', name: 'Script Trailer', desc: 'Scénario 45s : voix off + visuels + musique', auto: true },
    { icon: '🎨', name: 'Brief Couverture', desc: 'Direction artistique + prompts Midjourney/DALL-E', auto: true },
    { icon: '🎧', name: 'Plan Audiobook', desc: 'Découpe chapitres, voix, mastering, export', auto: true },
  ];

  const withBackCover = projects.filter(p => p.backCover && p.backCover.length > 50);

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <h2 className="text-2xl" style={{ color: c.mv }}>Marketing</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Moteur IA orchestré — génération de kits promo par titre</p>
        </div>
      </div>

      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={withBackCover.length} label="Titres avec 4e" accent={c.ok} />
        <StatCard value={projects.length - withBackCover.length} label="Sans 4e (limité)" accent={c.og} />
        <StatCard value="5" label="Engines" accent={c.vm} />
      </div>

      {/* Pipeline engines */}
      <div className="grid grid-cols-5 gap-2.5 mb-6">
        {engines.map((e, i) => (
          <Card key={e.name} hover={false} className="p-4 text-center relative">
            <div className="text-2xl mb-1.5">{e.icon}</div>
            <div className="font-semibold text-[11px]" style={{ color: c.mv }}>{e.name}</div>
            <div className="text-[9px] mt-1 leading-relaxed" style={{ color: c.gr }}>{e.desc}</div>
            {i < engines.length - 1 && (
              <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 text-[14px]" style={{ color: c.gc }}>→</div>
            )}
          </Card>
        ))}
      </div>

      {/* Project selector */}
      <Card hover={false} className="mb-6">
        <div className="px-5 py-3.5" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>
            Sélectionner un titre pour générer le kit
          </span>
        </div>
        {projects.map(p => {
          const hasBack = p.backCover && p.backCover.length > 50;
          const isSelected = selectedProject === p.id;
          const hasKit = generatedKit[p.id];
          return (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-[#FAF7F2]"
              style={{ borderBottom: `1px solid ${c.ft}`, background: isSelected ? '#FAF7F2' : undefined }}
              onClick={() => generateKit(p.id)}>
              <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold" style={{ color: c.nr }}>{p.title}</div>
                <div className="text-[10px]" style={{ color: c.gr }}>{p.genre} · {p.pages} p. · {hasBack ? '4e renseignée' : '4e manquante'}</div>
              </div>
              {hasKit && <Badge bg="#D4F0E0" color={c.ok}>Kit généré</Badge>}
              {!hasKit && <Badge bg={hasBack ? '#FDE8D0' : c.gc} color={hasBack ? c.og : c.gr}>{hasBack ? 'Prêt' : 'Limité'}</Badge>}
            </div>
          );
        })}
      </Card>

      {/* Generated kit display */}
      {sel && kit && (
        <div className="space-y-4">
          {/* Brief */}
          <Card hover={false} className="overflow-hidden">
            <div className="px-5 py-3" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
              <span className="text-[13px] font-semibold" style={{ color: c.mv }}>📋 Brief créatif — {sel.title}</span>
            </div>
            <div className="p-5 grid grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.gr }}>Ton & Ambiance</div>
                <div className="text-[12px] font-semibold" style={{ color: c.mv }}>{kit.brief.tone}</div>
                <div className="text-[11px]" style={{ color: c.gr }}>Ambiance : {kit.brief.ambiance}</div>
                <div className="text-[11px]" style={{ color: c.gr }}>Audience : {kit.brief.targetAudience}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.gr }}>Thèmes détectés</div>
                <div className="flex flex-wrap gap-1.5">
                  {kit.brief.themes.map((t: string) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded" style={{ background: c.ft, color: c.vm }}>{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.gr }}>Palette</div>
                <div className="flex gap-2">
                  {[kit.brief.palette.primary, kit.brief.palette.secondary, kit.brief.palette.accent].map((col, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded" style={{ background: col, border: `1px solid ${c.gc}` }} />
                      <span className="text-[9px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.gr }}>{col}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Marketing Kit */}
          <Card hover={false} className="overflow-hidden">
            <div className="px-5 py-3" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
              <span className="text-[13px] font-semibold" style={{ color: c.mv }}>📱 Kit Marketing</span>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              {[
                { label: 'Instagram', content: kit.marketing.instagramCaption },
                { label: 'LinkedIn', content: kit.marketing.linkedinPost },
                { label: 'Newsletter', content: kit.marketing.newsletterBlurb },
                { label: 'Communiqué de presse', content: kit.marketing.pressRelease },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg" style={{ background: '#FDFCFA', border: `1px solid ${c.ft}` }}>
                  <div className="text-[11px] font-semibold mb-2" style={{ color: c.vm }}>{item.label}</div>
                  <pre className="text-[10px] whitespace-pre-wrap leading-relaxed" style={{ color: c.nr, fontFamily: 'Inter, sans-serif' }}>{item.content}</pre>
                </div>
              ))}
            </div>
          </Card>

          {/* Cover Brief */}
          <Card hover={false} className="overflow-hidden">
            <div className="px-5 py-3" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
              <span className="text-[13px] font-semibold" style={{ color: c.mv }}>🎨 Brief Couverture</span>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.gr }}>Direction artistique</div>
                {[
                  ['Style', kit.cover.style],
                  ['Composition', kit.cover.composition],
                  ['Typo titre', kit.cover.typography.titleFont],
                  ['Placement', kit.cover.typography.placement],
                  ['Conventions', kit.cover.genreConventions],
                  ['Test miniature', kit.cover.thumbnailTest],
                ].map(([k, v]) => (
                  <div key={k} className="flex py-1" style={{ borderBottom: `1px solid ${c.ft}` }}>
                    <span className="text-[10px] font-semibold w-[90px] shrink-0" style={{ color: c.vm }}>{k}</span>
                    <span className="text-[10px]" style={{ color: c.nr }}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.gr }}>Prompts IA</div>
                <div className="p-3 rounded-lg mb-3" style={{ background: '#FDFCFA', border: `1px solid ${c.ft}` }}>
                  <div className="text-[10px] font-semibold mb-1" style={{ color: c.vm }}>Midjourney</div>
                  <pre className="text-[9px] whitespace-pre-wrap" style={{ color: c.nr, fontFamily: "'JetBrains Mono', monospace" }}>{kit.cover.promptMidjourney}</pre>
                </div>
                <div className="p-3 rounded-lg" style={{ background: '#FDFCFA', border: `1px solid ${c.ft}` }}>
                  <div className="text-[10px] font-semibold mb-1" style={{ color: c.vm }}>DALL-E</div>
                  <pre className="text-[9px] whitespace-pre-wrap" style={{ color: c.nr, fontFamily: "'JetBrains Mono', monospace" }}>{kit.cover.promptDalle}</pre>
                </div>
              </div>
            </div>
          </Card>

          {/* Trailer Script */}
          <Card hover={false} className="overflow-hidden">
            <div className="px-5 py-3" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
              <span className="text-[13px] font-semibold" style={{ color: c.mv }}>🎬 Script Trailer — {kit.trailer.duration}s</span>
            </div>
            <div className="p-5">
              <div className="text-[10px] mb-3" style={{ color: c.gr }}>Musique : {kit.trailer.musicMood}</div>
              <div className="space-y-2">
                {kit.trailer.scenes.map((scene: { timestamp: number; visual: string; voiceOver: string; text: string }, i: number) => (
                  <div key={i} className="flex gap-3 p-2.5 rounded-lg" style={{ background: i % 2 === 0 ? '#FDFCFA' : 'white', border: `1px solid ${c.ft}` }}>
                    <div className="text-[10px] font-bold shrink-0 w-[30px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.or }}>{scene.timestamp}s</div>
                    <div className="flex-1">
                      <div className="text-[10px]" style={{ color: c.vm }}>🎥 {scene.visual}</div>
                      {scene.voiceOver && <div className="text-[10px] mt-0.5" style={{ color: c.nr }}>🎤 « {scene.voiceOver} »</div>}
                      {scene.text && <div className="text-[10px] mt-0.5 font-semibold" style={{ color: c.mv }}>📝 {scene.text}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════
// TOAST
// ═══════════════════════════════════
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  const [visible, setVisible] = useState(false);
  useState(() => { setTimeout(() => setVisible(true), 10); setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, 3000); });
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg transition-all duration-300"
      style={{ background: c.mv, color: 'white', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)' }}>
      <span className="flex" style={{ color: c.oc }}>{icons.check}</span>
      <span className="text-[13px]">{message}</span>
    </div>
  );
};

// ═══════════════════════════════════
// NOTIFICATION PANEL
// ═══════════════════════════════════
const NotifPanel = ({ open, onClose, projects }: { open: boolean; onClose: () => void; projects: Project[] }) => {
  if (!open) return null;
  const corr = projects.filter(p => p.corrections.length > 0);
  const drafts = projects.filter(p => p.status === 'draft');
  return (
    <div className="absolute top-full right-0 mt-2 w-[340px] bg-white rounded-xl shadow-xl border z-50" style={{ borderColor: c.gc }}>
      <div className="flex justify-between items-center px-4 py-3" style={{ borderBottom: `1px solid ${c.gc}` }}>
        <span className="font-semibold text-[13px]" style={{ color: c.mv }}>Notifications</span>
        <button onClick={onClose} className="cursor-pointer bg-transparent border-none" style={{ color: c.gr }}>{icons.close}</button>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {corr.length > 0 && (
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.ft}` }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: c.er }} />
              <span className="text-[12px] font-semibold" style={{ color: c.er }}>{corr.reduce((s, p) => s + p.corrections.length, 0)} corrections bloquantes</span>
            </div>
            <div className="text-[11px]" style={{ color: c.gr }}>{corr.length} couverture{corr.length > 1 ? 's' : ''} à corriger</div>
          </div>
        )}
        {drafts.length > 0 && (
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.ft}` }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: c.og }} />
              <span className="text-[12px] font-semibold" style={{ color: c.og }}>{drafts.length} brouillon{drafts.length > 1 ? 's' : ''} en attente</span>
            </div>
            <div className="text-[11px]" style={{ color: c.gr }}>Manuscrits à faire avancer dans le pipeline</div>
          </div>
        )}
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.ft}` }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: c.ok }} />
            <span className="text-[12px] font-semibold" style={{ color: c.ok }}>ISBN : {countISBN(projects)}/100 attribués</span>
          </div>
          <div className="text-[11px]" style={{ color: c.gr }}>{100 - countISBN(projects)} ISBN disponibles · {projects.length} titres</div>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: c.vm }} />
            <span className="text-[12px] font-semibold" style={{ color: c.vm }}>Distribution</span>
          </div>
          <div className="text-[11px]" style={{ color: c.gr }}>Amazon KDP prêt · 2 canaux en attente</div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// MAIN APP
// ═══════════════════════════════════
export default function JabrApp() {
  const [page, setPage] = useState('dashboard');
  const [project, setProject] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { projects, loading, persisted, addProject, updateProject, deleteProject } = useProjects();
  const [search, setSearch] = useState('');
  const [filterGenre, setFilterGenre] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCollection, setFilterCollection] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'title' | 'pages' | 'score' | 'editions'>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const navigate = (id: string) => { setPage(id); setProject(null); };
  const openProject = (p: Project) => { setProject(p); setPage('detail'); };
  const handleAdd = (p: Project) => { addProject(p); showToast(`Projet créé : ${p.title}`); };
  const showToast = (msg: string) => setToast(msg);
  const handleUpdate = (updated: Project) => {
    updateProject(updated);
    setProject(updated);
  };
  const handleDelete = (id: number) => {
    deleteProject(id);
    setProject(null);
    setPage('dashboard');
  };

  const genres = [...new Set(projects.map(p => p.genre))];
  const collections = [...new Set(projects.map(p => p.collection).filter(Boolean))] as string[];
  const statuses = ['draft', 'in-progress', 'published'] as const;
  const statusLabels: Record<string, string> = { draft: 'Brouillon', 'in-progress': 'En cours', published: 'Publié' };

  const filtered = projects.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.genre.toLowerCase().includes(search.toLowerCase()) && !p.author.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterGenre && p.genre !== filterGenre) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterCollection && p.collection !== filterCollection) return false;
    return true;
  }).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'title') return a.title.localeCompare(b.title) * dir;
    if (sortBy === 'pages') return (a.pages - b.pages) * dir;
    if (sortBy === 'score') return (a.score - b.score) * dir;
    if (sortBy === 'editions') return (a.editions.length - b.editions.length) * dir;
    return 0;
  });

  const hasFilters = !!filterGenre || !!filterStatus || !!filterCollection;
  const clearFilters = () => { setFilterGenre(null); setFilterStatus(null); setFilterCollection(null); setSearch(''); };

  const notifCount = projects.filter(p => p.corrections.length > 0).reduce((s, p) => s + p.corrections.length, 0);

  const renderContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-4" style={{ borderColor: c.or, borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: c.gr }}>Chargement du catalogue…</p>
      </div>
    );
    if (project) return <DetailView project={project} onBack={() => navigate('dashboard')} onUpdate={handleUpdate} onToast={showToast} onDelete={handleDelete} />;
    if ((search || hasFilters) && filtered.length === 0) return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-xl mb-2" style={{ color: c.mv }}>Aucun résultat{search ? ` pour « ${search} »` : ''}</h3>
        <p className="text-sm mb-4" style={{ color: c.gr }}>
          {hasFilters ? 'Essayez de modifier vos filtres' : 'Essayez un autre titre, genre ou auteur'}
        </p>
        <Btn variant="secondary" onClick={clearFilters}>Effacer les filtres</Btn>
      </div>
    );
    switch (page) {
      case 'projets': return <DashboardView onProject={openProject} onNew={() => setModalOpen(true)} projects={filtered} allProjects={projects} onNav={navigate} />;
      case 'couvertures': return <CouverturesView onProject={openProject} projects={filtered} />;
      case 'isbn': return <ISBNView projects={filtered} onToast={showToast} />;
      case 'collections': return <CollectionsView onProject={openProject} projects={projects} />;
      case 'marketing': return <MarketingView projects={projects} />;
      case 'analytics': return <AnalyticsView projects={projects} />;
      case 'distribution': return <DistributionView projects={projects} onToast={showToast} />;
      case 'calibrage': return <CalibrageView projects={projects} />;
      case 'manuscrits': return <ManuscritsView projects={projects} onProject={openProject} onToast={showToast} />;
      case 'analyse': return <AnalyseView projects={projects} onProject={openProject} onToast={showToast} />;
      case 'audiobooks': return <AudiobooksView projects={projects} onToast={showToast} />;
      case 'presse': return <PresseView projects={projects} onProject={openProject} onToast={showToast} />;
      case 'settings': return <SettingsView onToast={showToast} />;
      default: return <DashboardView onProject={openProject} onNew={() => setModalOpen(true)} projects={filtered} allProjects={projects} onNav={navigate} />;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: c.bc }}>
      <Sidebar active={project ? 'projets' : page} onNav={navigate} projects={projects} persisted={persisted} open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* TOP BAR */}
        <div className="flex flex-wrap gap-2 justify-between items-center px-4 lg:px-8 py-2.5 bg-white" style={{ borderBottom: `1px solid ${c.gc}` }}>
          {/* Hamburger for mobile */}
          <button className="lg:hidden mr-3 cursor-pointer bg-transparent border-none p-1" style={{ color: c.mv }} onClick={() => setSidebarOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 max-w-sm" style={{ background: c.ft }}>
            <span style={{ color: c.gr }}>{icons.search}</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un titre, un genre, un auteur…"
              className="bg-transparent outline-none text-sm flex-1" style={{ color: c.nr }} />
            {(search || hasFilters) && <button onClick={clearFilters} className="cursor-pointer bg-transparent border-none" style={{ color: c.gr }}>{icons.close}</button>}
          </div>

          {/* Filters */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            <select value={filterGenre || ''} onChange={e => setFilterGenre(e.target.value || null)}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border-none outline-none cursor-pointer font-medium"
              style={{ background: filterGenre ? 'rgba(200,149,46,0.1)' : c.ft, color: filterGenre ? c.or : c.gr }}>
              <option value="">Genre</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={filterStatus || ''} onChange={e => setFilterStatus(e.target.value || null)}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border-none outline-none cursor-pointer font-medium"
              style={{ background: filterStatus ? 'rgba(200,149,46,0.1)' : c.ft, color: filterStatus ? c.or : c.gr }}>
              <option value="">Statut</option>
              {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
            </select>
            {collections.length > 0 && (
              <select value={filterCollection || ''} onChange={e => setFilterCollection(e.target.value || null)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg border-none outline-none cursor-pointer font-medium"
                style={{ background: filterCollection ? 'rgba(200,149,46,0.1)' : c.ft, color: filterCollection ? c.or : c.gr }}>
                <option value="">Collection</option>
                {collections.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            )}
            <select value={`${sortBy}-${sortDir}`} onChange={e => { const [k, d] = e.target.value.split('-'); setSortBy(k as typeof sortBy); setSortDir(d as 'asc' | 'desc'); }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border-none outline-none cursor-pointer font-medium"
              style={{ background: c.ft, color: c.gr }}>
              <option value="title-asc">A → Z</option>
              <option value="title-desc">Z → A</option>
              <option value="pages-desc">Pages ↓</option>
              <option value="pages-asc">Pages ↑</option>
              <option value="score-desc">Score ↓</option>
              <option value="editions-desc">Éditions ↓</option>
            </select>
            {hasFilters && (
              <button onClick={clearFilters} className="text-[10px] px-2 py-1 rounded cursor-pointer border-none font-semibold"
                style={{ background: 'rgba(200,149,46,0.1)', color: c.or }}>
                Effacer filtres
              </button>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative cursor-pointer bg-transparent border-none" style={{ color: c.gr }}
              onMouseEnter={e => (e.currentTarget.style.color = c.or)}
              onMouseLeave={e => { if (!notifOpen) e.currentTarget.style.color = c.gr; }}>
              {icons.bell}
              {notifCount > 0 && (
                <div className="absolute -top-1 -right-2 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1" style={{ background: c.og }}>
                  {notifCount}
                </div>
              )}
            </button>
            <NotifPanel open={notifOpen} onClose={() => setNotifOpen(false)} projects={projects} />
          </div>
        </div>
        <div className="flex-1 p-4 lg:p-7 overflow-y-auto" onClick={() => notifOpen && setNotifOpen(false)}>{renderContent()}</div>
      </div>
      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
