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
  marketing: sv(<><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>),
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
  <div className="bg-white rounded-xl border p-5 flex-1 min-w-[120px] transition-colors hover:border-[#C8952E]" style={{ borderColor: c.gc }}>
    <div style={{ fontSize: 28, fontWeight: 700, color: accent || c.mv, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{value}</div>
    <div className="mt-2 uppercase tracking-wider" style={{ fontSize: 10, color: c.gr, fontWeight: 600 }}>{label}</div>
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
  ['marketing', 'Kit Marketing', 'marketing'],
  ['presse', 'Dossier Presse', 'presse'],
  ['audiobooks', 'Audiobooks', 'audiobooks'],
  ['distribution', 'Distribution', 'distribution'],
  ['analytics', 'Analytics', 'analytics'],
  null, // separator
  ['isbn', 'ISBN', 'isbn'],
  ['collections', 'Collections', 'collections'],
  ['settings', 'Paramètres', 'settings'],
];

const Sidebar = ({ active, onNav, projects, persisted }: { active: string; onNav: (id: string) => void; projects: Project[]; persisted: boolean }) => {
  const corrCount = projects.reduce((s, p) => s + p.corrections.length, 0);
  const draftCount = projects.filter(p => p.status === 'draft').length;
  const audioCount = projects.filter(p => p.editions.some(e => e.format === 'audiobook')).length;
  const withManuscript = projects.filter(p => p.manuscriptStatus && p.manuscriptStatus !== 'none').length;
  const badges: Record<string, number> = { couvertures: corrCount, projets: projects.length, isbn: countISBN(projects), audiobooks: audioCount, manuscrits: withManuscript };

  return (
  <div className="w-[220px] min-h-screen flex flex-col py-5 shrink-0" style={{ background: `linear-gradient(180deg, ${c.mv}, #1A0F2E)` }}>
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
          <button key={id} onClick={() => onNav(id)}
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
  );
};

// ═══════════════════════════════════
// VIEWS
// ═══════════════════════════════════

// --- DASHBOARD ---
const DashboardView = ({ onProject, onNew, projects, allProjects }: { onProject: (p: Project) => void; onNew: () => void; projects: Project[]; allProjects: Project[] }) => {
  const pub = allProjects.filter(p => p.status === 'published').length;
  const prog = allProjects.filter(p => p.status === 'in-progress').length;
  const corr = allProjects.reduce((s, p) => s + p.corrections.length, 0);
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

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <h2 className="text-2xl" style={{ color: c.mv }}>Dashboard</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Jabrilia Éditions — Mars 2026</p>
        </div>
        <Btn onClick={onNew}>{icons.plus} Nouveau projet</Btn>
      </div>

      <div className="flex gap-3.5 mb-7 flex-wrap">
        <StatCard value={allProjects.length} label="Projets" accent={c.mv} />
        <StatCard value={prog} label="En cours" accent={c.og} />
        <StatCard value={pub} label="Publiés" accent={c.ok} />
        <StatCard value={`${countISBN(allProjects)}/100`} label="ISBN attribués" accent={c.or} />
        <StatCard value={corr} label="Corrections" accent={c.er} />
      </div>

      {/* Quick actions */}
      {corr > 0 && (
        <div className="rounded-xl p-4 mb-5 flex items-center gap-3" style={{ background: '#FFF8F0', border: '1px solid #F4A55A' }}>
          <span style={{ color: c.og }}>{icons.warn}</span>
          <div className="flex-1">
            <span className="text-[13px] font-semibold" style={{ color: c.og }}>{corr} correction{corr > 1 ? 's' : ''} bloquante{corr > 1 ? 's' : ''}</span>
            <span className="text-[12px] ml-2" style={{ color: c.gr }}>sur {allProjects.filter(p => p.corrections.length > 0).length} couverture{allProjects.filter(p => p.corrections.length > 0).length > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

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
      onUpdate({ ...p, title: editTitle.trim(), pages: parseInt(editPages) || p.pages });
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
          {!editing && <Btn variant="secondary" onClick={() => { setEditTitle(p.title); setEditPages(String(p.pages)); setEditing(true); }}>{icons.edit} Modifier</Btn>}
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
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: c.gr }}>Titre</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[#C8952E]" style={{ borderColor: c.gc }} />
            </div>
            <div className="w-24">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: c.gr }}>Pages</label>
              <input type="number" value={editPages} onChange={e => setEditPages(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[#C8952E]" style={{ borderColor: c.gc }} />
            </div>
            <Btn onClick={saveEdit}>Enregistrer</Btn>
            <Btn variant="secondary" onClick={() => setEditing(false)}>Annuler</Btn>
          </div>
        </Card>
      )}

      <div className="flex gap-6 mb-7">
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
        <div className="grid grid-cols-4 gap-2.5 mb-4">
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

      {/* 4e de couverture */}
      {p.backCover && (
        <Card hover={false} className="p-6 mt-5">
          <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Texte 4e de couverture</div>
          <div className="rounded-lg p-4" style={{ background: c.ft, border: `1px solid ${c.gc}` }}>
            <div className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: c.nr }}>{p.backCover}</div>
          </div>
        </Card>
      )}

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
      </Card>
    </div>
  );
};

// --- COUVERTURES ---
const CouverturesView = ({ onProject, projects }: { onProject: (p: Project) => void; projects: Project[] }) => {
  const bad = projects.filter(p => p.corrections.length > 0);
  const good = projects.filter(p => p.corrections.length === 0);
  return (
    <div>
      <h2 className="text-2xl mb-1" style={{ color: c.mv }}>Couvertures</h2>
      <p className="mb-5" style={{ color: c.gr, fontSize: 13 }}>Audit qualité des 10 couvertures du catalogue</p>
      <div className="flex gap-3.5 mb-6"><StatCard value={good.length} label="Conformes" accent={c.ok} /><StatCard value={bad.length} label="À corriger" accent={c.er} /><StatCard value={projects.reduce((s, p) => s + p.corrections.length, 0)} label="Corrections" accent={c.og} /></div>
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
      {good.map(p => (
        <Card key={p.id} className="cursor-pointer mb-2 p-3 px-4" onClick={() => onProject(p)}>
          <div className="flex items-center gap-3">
            <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
            <span className="flex-1 text-[13px] font-semibold">{p.title}</span>
            <span className="text-xs font-semibold" style={{ color: c.ok }}>✓ 7/7</span>
          </div>
        </Card>
      ))}
    </div>
  );
};

// --- ISBN ---
const ISBNView = ({ projects }: { projects: Project[] }) => {
  const totalISBN = countISBN(projects);
  const exportCSV = () => {
    const rows = [['ISBN', 'Titre', 'Format', 'Prix', 'Statut édition', 'Statut projet', 'Genre'].join(';')];
    projects.forEach(p => p.editions.forEach(ed => {
      rows.push([ed.isbn, `"${p.title}"`, FORMAT_LABELS[ed.format]?.label, ed.price || '', EDITION_STATUS_LABELS[ed.status]?.label, p.status, p.genre].join(';'));
    }));
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `jabr-isbn-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };
  return (
  <div>
    <div className="flex justify-between items-end mb-5">
      <div><h2 className="text-2xl" style={{ color: c.mv }}>Registre ISBN</h2><p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Préfixe éditeur : 978-2-488647 · Stock : 100 · 1 ISBN par format</p></div>
      <div className="flex gap-2">
        <Btn variant="secondary" onClick={exportCSV}>{icons.download} Export CSV</Btn>
        <Btn>{icons.plus} Attribuer ISBN</Btn>
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
  return (
    <div>
      <h2 className="text-2xl mb-1" style={{ color: c.mv }}>Analytics</h2>
      <p className="mb-5" style={{ color: c.gr, fontSize: 13 }}>Vue d&apos;ensemble du catalogue</p>
      <div className="flex gap-3.5 mb-7 flex-wrap">
        <StatCard value={projects.length} label="Titres" accent={c.mv} />
        <StatCard value={totalEditions} label="Éditions (ISBN)" accent={c.or} />
        <StatCard value={`${avg}/7`} label="Score moyen" accent={c.ok} />
        <StatCard value={totalPages.toLocaleString()} label="Pages totales" accent={c.vm} />
      </div>
      <div className="grid grid-cols-3 gap-5">
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
const DistributionView = ({ projects }: { projects: Project[] }) => {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

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
    'Amazon KDP': { trimSize: '15,2 × 22,9 cm (6" × 9")', paper: 'Blanc 75g ou Crème 80g', bleed: '3,2 mm (0.125")', spine: 'Auto-calculé · texte ≥ 79 pages', barcode: '50,8 × 30,5 mm — zone réservée dos', cover: 'PDF aplati 300 dpi, CMJN ou RVB', file: 'PDF intérieur + PDF couverture séparé', margin: '60% impression · 40% auteur sur prix HT', notes: 'Validation 24-72h. Distribution mondiale. Impression N&B ou couleur.' },
    'Pollen / Kiosque': { trimSize: '15,2 × 22,9 cm', paper: 'Offset 80g', bleed: '2,5 mm fonds perdus', spine: 'Calculé : pages × 0,07 mm', barcode: 'EAN-13 + prix TTC obligatoire', cover: 'PDF 300 dpi CMJN, pelliculage mat ou brillant', file: 'PDF/X-1a intérieur + couverture complète', margin: 'Remise libraire 30-35% · Remise diffuseur 5-8%', notes: 'Accord Dilisco en principe. Délai mise en place 4-6 semaines.' },
    'IngramSpark': { trimSize: '15,2 × 22,9 cm ou format US', paper: 'Blanc 70lb / Crème 70lb', bleed: '3,2 mm (0.125")', spine: 'Auto-calculé depuis gabarit en ligne', barcode: 'EAN-13 fourni par IngramSpark ou éditeur', cover: 'PDF aplati 300 dpi CMJN, ICC : GRACoL', file: 'PDF intérieur + PDF couverture', margin: '45% impression · 55% auteur — frais annuels par titre', notes: 'Réseau international : 40 000+ librairies et bibliothèques.' },
    'Apple Books': { trimSize: 'ePub reflowable', paper: 'N/A', bleed: 'N/A', spine: 'N/A', barcode: 'ISBN ePub distinct requis', cover: 'JPEG ou PNG 1400×1873 px min, RVB', file: '.epub validé via EpubCheck', margin: '70% auteur sur prix HT', notes: 'Via Apple Books for Authors. DRM FairPlay optionnel.' },
    'Kobo / Fnac': { trimSize: 'ePub reflowable', paper: 'N/A', bleed: 'N/A', spine: 'N/A', barcode: 'ISBN ePub requis', cover: 'JPEG 1600×2560 px recommandé', file: '.epub validé EpubCheck', margin: '70% auteur sur prix HT', notes: 'Kobo Writing Life. Diffusion France, Belgique, Suisse, Canada.' },
    'Spotify / Audible': { trimSize: 'MP3 192kbps mono ou stéréo', paper: 'N/A', bleed: 'N/A', spine: 'N/A', barcode: 'ISBN audiobook distinct', cover: 'JPEG 2400×2400 px carré', file: 'MP3 par chapitre + fichier ouverture/fermeture', margin: 'ACX : 40% (exclusif) ou 25% (non-exclusif)', notes: 'Durée min. 60 min. Programme ACX ou distribution directe.' },
  };

  type SubmissionStep = { label: string; done: (p: Project) => boolean };
  const channelChecklist: Record<string, SubmissionStep[]> = {
    'Amazon KDP': [
      { label: 'ISBN broché attribué', done: p => p.editions.some(e => e.format === 'broché' && e.isbn) },
      { label: 'PDF intérieur prêt', done: p => p.manuscriptStatus === 'isbn-injected' || p.manuscriptStatus === 'validated' },
      { label: 'Couverture complète', done: p => p.diag.dos && p.diag.typo },
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

  // KDP margin calculator
  const kdpMargin = (pages: number, price: string | undefined) => {
    if (!price) return null;
    const priceParsed = parseFloat(price.replace(',', '.').replace('€', '').trim());
    if (isNaN(priceParsed) || priceParsed <= 0) return null;
    const printCost = 1.72 + (pages * 0.012); // Estimation N&B blanc EUR
    const royalty = (priceParsed * 0.6) - printCost; // 60% royalty rate
    return { price: priceParsed, printCost: Math.round(printCost * 100) / 100, royalty: Math.round(royalty * 100) / 100 };
  };

  const selected = DISTRIBUTION_CHANNELS.find(ch => ch.name === selectedChannel);
  const selectedSpec = selectedChannel ? channelSpecs[selectedChannel] : null;
  const selectedChecklist = selectedChannel ? channelChecklist[selectedChannel] || [] : [];
  const selectedFormats = selectedChannel ? channelFormats[selectedChannel] || [] : [];
  const eligibleProjects = selectedChannel ? projects.filter(p => p.editions.some(e => selectedFormats.includes(e.format))) : [];

  return (
    <div>
      <h2 className="text-2xl mb-1" style={{ color: c.mv }}>Distribution</h2>
      <p className="mb-5" style={{ color: c.gr, fontSize: 13 }}>Canaux de distribution — cliquez un canal pour voir les specs et la checklist</p>
      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={DISTRIBUTION_CHANNELS.filter(ch => ch.color === '#2EAE6D').length} label="Canaux prêts" accent={c.ok} />
        <StatCard value={countISBN(projects)} label="ISBN total" accent={c.or} />
        <StatCard value={projects.filter(p => p.editions.some(e => e.format === 'epub')).length} label="ePub prévus" accent={c.vm} />
      </div>

      {/* Channel cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {DISTRIBUTION_CHANNELS.map(ch => {
          const compat = channelFormats[ch.name] || [];
          const eligibleEditions = projects.reduce((s, p) => s + p.editions.filter(e => compat.includes(e.format)).length, 0);
          const isActive = selectedChannel === ch.name;
          return (
            <Card key={ch.name} className="p-5 cursor-pointer" onClick={() => setSelectedChannel(isActive ? null : ch.name)}>
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
                  {isActive && <span style={{ color: c.or, marginLeft: 8 }}>▾ Détail ci-dessous</span>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Channel detail panel */}
      {selected && selectedSpec && (
        <Card hover={false} className="mb-6 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
            <div>
              <span className="text-lg font-semibold" style={{ color: c.mv }}>{selected.name}</span>
              <span className="text-[12px] ml-3" style={{ color: c.gr }}>{selected.desc}</span>
            </div>
            <Badge bg={selected.color === c.ok ? '#D4F0E0' : '#FDE8D0'} color={selected.color}>{selected.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-0">
            {/* Specs */}
            <div className="p-6" style={{ borderRight: `1px solid ${c.ft}` }}>
              <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 11, color: c.gr }}>Spécifications techniques</div>
              {[
                ['Format', selectedSpec.trimSize],
                ['Papier', selectedSpec.paper],
                ['Fonds perdus', selectedSpec.bleed],
                ['Dos', selectedSpec.spine],
                ['Code-barres', selectedSpec.barcode],
                ['Couverture', selectedSpec.cover],
                ['Fichiers requis', selectedSpec.file],
                ['Marge auteur', selectedSpec.margin],
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

            {/* Checklist + titles */}
            <div className="p-6">
              <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 11, color: c.gr }}>Checklist de soumission</div>
              {selectedChecklist.length > 0 && (
                <div className="mb-5">
                  {selectedChecklist.map((step, i) => {
                    const doneCount = eligibleProjects.filter(p => step.done(p)).length;
                    const total = eligibleProjects.length || 1;
                    const allDone = doneCount === eligibleProjects.length && eligibleProjects.length > 0;
                    return (
                      <div key={i} className="flex items-center gap-2 py-1.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
                        <span className="text-[13px]">{allDone ? '✅' : '⬜'}</span>
                        <span className="text-[11px] flex-1" style={{ color: allDone ? c.ok : c.nr }}>{step.label}</span>
                        <span className="text-[10px] font-semibold" style={{ color: c.gr }}>{doneCount}/{total}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="uppercase tracking-wider font-semibold mb-3" style={{ fontSize: 11, color: c.gr }}>
                Titres éligibles ({eligibleProjects.length})
              </div>
              {eligibleProjects.map(p => {
                const matchEd = p.editions.find(e => selectedFormats.includes(e.format));
                const margin = selectedChannel === 'Amazon KDP' ? kdpMargin(p.pages, matchEd?.price) : null;
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${c.ft}` }}>
                    <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold truncate" style={{ color: c.nr }}>{p.title}</div>
                      <div className="text-[10px]" style={{ color: c.gr }}>
                        {p.pages} p. · {matchEd ? `${FORMAT_LABELS[matchEd.format]?.label} — ${matchEd.isbn}` : ''}
                        {matchEd?.price && ` · ${matchEd.price}`}
                      </div>
                    </div>
                    {margin && (
                      <div className="text-right">
                        <div className="text-[10px]" style={{ color: c.gr }}>Marge</div>
                        <div className="text-[13px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: margin.royalty > 0 ? c.ok : c.er }}>
                          {margin.royalty > 0 ? '+' : ''}{margin.royalty.toFixed(2)}€
                        </div>
                        <div className="text-[9px]" style={{ color: c.gr }}>coût: {margin.printCost}€</div>
                      </div>
                    )}
                    {matchEd && (
                      <Badge bg={EDITION_STATUS_LABELS[matchEd.status]?.bg || c.gc} color={EDITION_STATUS_LABELS[matchEd.status]?.color || c.gr}>
                        {EDITION_STATUS_LABELS[matchEd.status]?.label}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Matrix view */}
      <Card hover={false}>
        <div className="px-5 py-3.5" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Matrice titre × canal</span>
        </div>
        <div className="overflow-x-auto">
          <div className="grid px-5 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: '180px repeat(6, 1fr)', background: c.ft, color: c.gr }}>
            <div>Titre</div>
            {DISTRIBUTION_CHANNELS.map(ch => <div key={ch.name} className="text-center">{ch.name.split(' / ')[0]}</div>)}
          </div>
          {projects.map(p => {
            const fmts = p.editions.map(e => e.format);
            return (
              <div key={p.id} className="grid px-5 py-2.5 items-center" style={{ gridTemplateColumns: '180px repeat(6, 1fr)', borderBottom: `1px solid ${c.ft}` }}>
                <div className="text-[12px] font-medium truncate">{p.title}</div>
                {DISTRIBUTION_CHANNELS.map(ch => {
                  const compat = channelFormats[ch.name] || [];
                  const has = compat.some(f => fmts.includes(f));
                  return (
                    <div key={ch.name} className="text-center cursor-pointer" onClick={() => setSelectedChannel(ch.name)}>
                      {has ? <span style={{ color: c.ok }}>●</span> : <span style={{ color: c.gc }}>○</span>}
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
      <div className="grid grid-cols-3 gap-3.5 mb-6">
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
        <Btn>{icons.upload} Importer un manuscrit</Btn>
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
const AnalyseView = ({ projects, onProject }: { projects: Project[]; onProject: (p: Project) => void }) => {
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
        <Btn>{icons.analyse} Lancer une analyse</Btn>
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
// KIT MARKETING VIEW
// ═══════════════════════════════════
const SOCIAL_FORMATS = [
  { id: 'ig-post', name: 'Instagram Post', w: 1080, h: 1080, icon: '📷', ratio: '1:1' },
  { id: 'ig-story', name: 'Instagram Story', w: 1080, h: 1920, icon: '📱', ratio: '9:16' },
  { id: 'fb-cover', name: 'Facebook Cover', w: 1200, h: 630, icon: '🌐', ratio: '1.9:1' },
  { id: 'x-post', name: 'X / Twitter', w: 1200, h: 675, icon: '🐦', ratio: '16:9' },
  { id: 'linkedin', name: 'LinkedIn Post', w: 1200, h: 627, icon: '💼', ratio: '1.91:1' },
  { id: 'teaser', name: 'Teaser Vidéo 10s', w: 1080, h: 1920, icon: '🎬', ratio: '9:16' },
];

const MarketingView = ({ projects, onProject }: { projects: Project[]; onProject: (p: Project) => void }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedFormat, setSelectedFormat] = useState(SOCIAL_FORMATS[0]);

  const previewProject = selectedProject || projects[0];

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <h2 className="text-2xl" style={{ color: c.mv }}>Kit Marketing</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Visuels réseaux sociaux, teasers vidéo, fiches produit</p>
        </div>
        <Btn>{icons.download} Exporter le kit</Btn>
      </div>

      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={projects.length} label="Titres disponibles" accent={c.or} />
        <StatCard value={SOCIAL_FORMATS.length} label="Formats gabarit" accent={c.vm} />
        <StatCard value={projects.length * SOCIAL_FORMATS.length} label="Visuels générables" accent={c.ok} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left — Sélection projet */}
        <Card hover={false} className="p-0 col-span-1">
          <div className="px-4 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
            <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 11, color: c.gr }}>Sélectionner un titre</span>
          </div>
          <div className="max-h-[460px] overflow-y-auto">
            {projects.map(p => (
              <div key={p.id} onClick={() => setSelectedProject(p)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                style={{ background: previewProject.id === p.id ? 'rgba(200,149,46,0.06)' : 'transparent', borderLeft: previewProject.id === p.id ? `3px solid ${c.or}` : '3px solid transparent', borderBottom: `1px solid ${c.ft}` }}>
                <CoverThumb emoji={p.cover} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate" style={{ color: c.nr }}>{p.title}</div>
                  <div className="text-[10px]" style={{ color: c.gr }}>{p.genre} · {p.pages}p</div>
                </div>
                <GenreBadge genre={p.genre} />
              </div>
            ))}
          </div>
        </Card>

        {/* Center — Preview */}
        <Card hover={false} className="p-5 col-span-1 flex flex-col">
          <div className="uppercase tracking-wider font-semibold mb-3" style={{ fontSize: 11, color: c.gr }}>
            Aperçu · {selectedFormat.name}
          </div>
          {/* Preview mockup */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative rounded-lg overflow-hidden" style={{
              width: selectedFormat.id.includes('story') || selectedFormat.id === 'teaser' ? 160 : 240,
              height: selectedFormat.id.includes('story') || selectedFormat.id === 'teaser' ? 284 : selectedFormat.id === 'ig-post' ? 240 : 126,
              background: `linear-gradient(135deg, ${c.mv}, #1A0F2E)`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}>
              {/* Decorative glow */}
              <div className="absolute top-4 right-4 w-20 h-20 rounded-full opacity-20" style={{ background: c.or, filter: 'blur(20px)' }} />
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <div className="text-3xl mb-2">{previewProject.cover}</div>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: c.or }}>Jabrilia Éditions</div>
                <div className="text-[13px] font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {previewProject.title}
                </div>
                <div className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{previewProject.author}</div>
                {previewProject.genre && (
                  <div className="mt-2 px-2 py-0.5 rounded-full text-[8px] font-semibold" style={{ background: 'rgba(200,149,46,0.2)', color: c.or }}>
                    {previewProject.genre}
                  </div>
                )}
              </div>
              {/* Format badge */}
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[7px] font-bold" style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.6)' }}>
                {selectedFormat.w}×{selectedFormat.h}
              </div>
              {/* Teaser play button */}
              {selectedFormat.id === 'teaser' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(200,149,46,0.8)' }}>
                    <span className="text-white text-lg ml-0.5">▶</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 text-center">
            <div className="text-[10px]" style={{ color: c.gr }}>{selectedFormat.w}×{selectedFormat.h}px · Ratio {selectedFormat.ratio}</div>
            <Btn className="mt-2">{selectedFormat.id === 'teaser' ? icons.share : icons.download} Générer</Btn>
          </div>
        </Card>

        {/* Right — Formats */}
        <Card hover={false} className="p-0 col-span-1">
          <div className="px-4 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
            <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 11, color: c.gr }}>Formats disponibles</span>
          </div>
          {SOCIAL_FORMATS.map(fmt => (
            <div key={fmt.id} onClick={() => setSelectedFormat(fmt)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
              style={{ background: selectedFormat.id === fmt.id ? 'rgba(200,149,46,0.06)' : 'transparent', borderLeft: selectedFormat.id === fmt.id ? `3px solid ${c.or}` : '3px solid transparent', borderBottom: `1px solid ${c.ft}` }}>
              <span className="text-xl">{fmt.icon}</span>
              <div className="flex-1">
                <div className="text-[12px] font-semibold" style={{ color: c.nr }}>{fmt.name}</div>
                <div className="text-[10px]" style={{ color: c.gr }}>{fmt.w}×{fmt.h} · {fmt.ratio}</div>
              </div>
              {selectedFormat.id === fmt.id && <span style={{ color: c.or }}>{icons.check}</span>}
            </div>
          ))}
          <div className="p-4" style={{ borderTop: `1px solid ${c.ft}` }}>
            <div className="text-[11px] font-semibold mb-2" style={{ color: c.mv }}>Éléments inclus</div>
            {['Couverture du livre', 'Titre & auteur', 'Logo Jabrilia', 'Genre & accroche', 'Code couleur charte'].map(el => (
              <div key={el} className="flex items-center gap-2 py-1 text-[11px]" style={{ color: c.gr }}>
                <span style={{ color: c.ok }}>{icons.check}</span> {el}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick batch export */}
      <Card hover={false} className="p-5 mt-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-[14px]" style={{ color: c.mv }}>Export par lot</div>
            <div className="text-[12px] mt-0.5" style={{ color: c.gr }}>
              Générer tous les visuels pour un titre en un clic — {SOCIAL_FORMATS.length} formats × {projects.length} titres = {SOCIAL_FORMATS.length * projects.length} fichiers
            </div>
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary">{icons.image} Visuels seuls</Btn>
            <Btn>{icons.download} Kit complet ZIP</Btn>
          </div>
        </div>
      </Card>

      {/* Fiches produit */}
      <Card hover={false} className="p-5 mt-5">
        <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Fiches produit par canal</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { canal: 'Amazon KDP', fields: 'Titre, sous-titre, description, mots-clés, catégories BISAC', icon: '📦' },
            { canal: 'Pollen / Kiosque', fields: 'Fiche Dilicom, argumentaire libraire, texte 4e', icon: '📚' },
            { canal: 'Apple Books / Kobo', fields: 'Description ePub, synopsis, extraits, métadonnées ONIX', icon: '📱' },
          ].map(ch => (
            <div key={ch.canal} className="p-4 rounded-xl" style={{ background: c.ft }}>
              <span className="text-xl">{ch.icon}</span>
              <div className="font-semibold text-[13px] mt-2" style={{ color: c.mv }}>{ch.canal}</div>
              <div className="text-[11px] mt-1 leading-relaxed" style={{ color: c.gr }}>{ch.fields}</div>
              <div className="mt-3">
                <Btn variant="secondary">{icons.edit} Générer</Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════
// DOSSIER DE PRESSE VIEW
// ═══════════════════════════════════
const PresseView = ({ projects, onProject }: { projects: Project[]; onProject: (p: Project) => void }) => {
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
          <Btn>{icons.download} Exporter PDF</Btn>
        </div>
      </div>

      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={projects.length} label="Titres au catalogue" accent={c.or} />
        <StatCard value={sections.length} label="Sections du dossier" accent={c.vm} />
        <StatCard value={4} label="Distinctions auteur" accent={c.ok} />
      </div>

      <div className="grid grid-cols-3 gap-5">
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
                <Btn>{icons.download} Télécharger PDF</Btn>
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
const SettingsView = () => {
  const [editeur, setEditeur] = useState('Jabrilia Éditions');
  const [auteur, setAuteur] = useState('Steve Moradel');
  const [prefixe, setPrefixe] = useState('978-2-488647');
  const [format, setFormat] = useState('15,2 × 22,9 cm');
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div><h2 className="text-2xl" style={{ color: c.mv }}>Paramètres</h2><p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Configuration de Jabrilia Éditions</p></div>
        <Btn onClick={handleSave}>{saved ? icons.check : icons.edit} {saved ? 'Enregistré ✓' : 'Enregistrer'}</Btn>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Card hover={false} className="p-6">
          <h3 className="text-lg mb-4" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Maison d&apos;édition</h3>
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: c.gr }}>Nom</label>
            <input value={editeur} onChange={e => setEditeur(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:border-[#C8952E]" style={{ borderColor: c.gc }} />
          </div>
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: c.gr }}>Auteur principal</label>
            <input value={auteur} onChange={e => setAuteur(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:border-[#C8952E]" style={{ borderColor: c.gc }} />
          </div>
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: c.gr }}>Préfixe ISBN</label>
            <input value={prefixe} onChange={e => setPrefixe(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:border-[#C8952E]" style={{ borderColor: c.gc, fontFamily: "'JetBrains Mono', monospace" }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: c.gr }}>Format standard</label>
            <input value={format} onChange={e => setFormat(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:border-[#C8952E]" style={{ borderColor: c.gc }} />
          </div>
        </Card>
        <Card hover={false} className="p-6">
          <h3 className="text-lg mb-4" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Charte graphique</h3>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[{ n: 'Or', c: '#C8952E' }, { n: 'Mauve', c: '#2D1B4E' }, { n: 'Orange', c: '#E07A2F' }, { n: 'Blanc cassé', c: '#FAF7F2' }].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 rounded-lg mx-auto mb-1.5" style={{ background: s.c, border: s.c === '#FAF7F2' ? `1px solid ${c.gc}` : 'none' }} />
                <div style={{ fontSize: 10, color: c.gr }}>{s.n}</div>
                <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: c.gr }}>{s.c}</div>
              </div>
            ))}
          </div>
          <h3 className="text-lg mb-4 mt-6" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Typographie</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${c.ft}` }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: c.mv }}>Playfair Display</span>
              <span style={{ fontSize: 11, color: c.gr }}>Titres · H1 · H2</span>
            </div>
            <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${c.ft}` }}>
              <span style={{ fontSize: 16, color: c.mv }}>Inter</span>
              <span style={{ fontSize: 11, color: c.gr }}>Corps · UI · Boutons</span>
            </div>
            <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${c.ft}` }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: c.mv }}>JetBrains Mono</span>
              <span style={{ fontSize: 11, color: c.gr }}>ISBN · Code · Données</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- AUDIOBOOKS VIEW ---
const AudiobooksView = ({ projects }: { projects: Project[] }) => {
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
        <Btn>{icons.plus} Lancer une production</Btn>
      </div>
      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={withAudio.length} label="Avec audiobook" accent={c.ok} />
        <StatCard value={withoutAudio.length} label="Éligibles" accent={c.og} />
        <StatCard value={`~${totalMinutes} min`} label="Durée totale est." accent={c.vm} />
        <StatCard value={`~${estimatedCost}€`} label="Coût estimé TTS" accent={c.or} />
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-6 gap-2.5 mb-6">
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
  const [toast, setToast] = useState<string | null>(null);
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

  const filtered = search
    ? projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.genre.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase()))
    : projects;

  const notifCount = projects.filter(p => p.corrections.length > 0).reduce((s, p) => s + p.corrections.length, 0);

  const renderContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-4" style={{ borderColor: c.or, borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: c.gr }}>Chargement du catalogue…</p>
      </div>
    );
    if (project) return <DetailView project={project} onBack={() => navigate('dashboard')} onUpdate={handleUpdate} onToast={showToast} onDelete={handleDelete} />;
    if (search && filtered.length === 0) return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-xl mb-2" style={{ color: c.mv }}>Aucun résultat pour « {search} »</h3>
        <p className="text-sm mb-4" style={{ color: c.gr }}>Essayez un autre titre, genre ou auteur</p>
        <Btn variant="secondary" onClick={() => setSearch('')}>Effacer la recherche</Btn>
      </div>
    );
    switch (page) {
      case 'projets': return <DashboardView onProject={openProject} onNew={() => setModalOpen(true)} projects={filtered} allProjects={projects} />;
      case 'couvertures': return <CouverturesView onProject={openProject} projects={filtered} />;
      case 'isbn': return <ISBNView projects={filtered} />;
      case 'collections': return <CollectionsView onProject={openProject} projects={projects} />;
      case 'analytics': return <AnalyticsView projects={projects} />;
      case 'distribution': return <DistributionView projects={projects} />;
      case 'calibrage': return <CalibrageView projects={projects} />;
      case 'manuscrits': return <ManuscritsView projects={projects} onProject={openProject} onToast={showToast} />;
      case 'analyse': return <AnalyseView projects={projects} onProject={openProject} />;
      case 'audiobooks': return <AudiobooksView projects={projects} />;
      case 'marketing': return <MarketingView projects={projects} onProject={openProject} />;
      case 'presse': return <PresseView projects={projects} onProject={openProject} />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView onProject={openProject} onNew={() => setModalOpen(true)} projects={filtered} allProjects={projects} />;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: c.bc }}>
      <Sidebar active={project ? 'projets' : page} onNav={navigate} projects={projects} persisted={persisted} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <div className="flex justify-between items-center px-8 py-2.5 bg-white" style={{ borderBottom: `1px solid ${c.gc}` }}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 max-w-sm" style={{ background: c.ft }}>
            <span style={{ color: c.gr }}>{icons.search}</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un titre, un genre, un auteur…"
              className="bg-transparent outline-none text-sm flex-1" style={{ color: c.nr }} />
            {search && <button onClick={() => setSearch('')} className="cursor-pointer bg-transparent border-none" style={{ color: c.gr }}>{icons.close}</button>}
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
        <div className="flex-1 p-7 overflow-y-auto" onClick={() => notifOpen && setNotifOpen(false)}>{renderContent()}</div>
      </div>
      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
