'use client';

import { useState } from 'react';
import { PROJECTS, PIPELINE_STEPS, COLLECTIONS, DIAG_LABELS, DISTRIBUTION_CHANNELS, type Project } from '@/lib/data';

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

const Card = ({ children, className = '', hover = true, onClick }: { children: React.ReactNode; className?: string; hover?: boolean; onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-white rounded-xl border overflow-hidden transition-colors ${hover ? 'hover:border-[#C8952E]' : ''} ${className}`} style={{ borderColor: c.gc }}>
    {children}
  </div>
);

const CoverThumb = ({ emoji, size = 'md' }: { emoji: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = { sm: 'w-9 h-12', md: 'w-10 h-14', lg: 'w-[100px] h-[140px]' };
  const fontSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-5xl' };
  return (
    <div className={`${sizes[size]} rounded-lg flex items-center justify-center shrink-0 ${fontSizes[size]}`}
      style={{ background: `linear-gradient(135deg, ${c.mv}, ${c.vi})`, boxShadow: size === 'lg' ? '0 8px 24px rgba(45,27,78,0.3)' : undefined }}>
      {emoji}
    </div>
  );
};

const Btn = ({ children, variant = 'primary', onClick }: { children: React.ReactNode; variant?: 'primary' | 'secondary'; onClick?: () => void }) => (
  <button onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-semibold text-[13px] transition-colors cursor-pointer ${variant === 'primary' ? 'text-white hover:bg-[#E8B84B]' : 'border hover:bg-gray-50'}`}
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
  ['calibrage', 'Calibrage', 'calibrage'],
  ['couvertures', 'Couvertures', 'couvertures'],
  ['audiobooks', 'Audiobooks', 'audiobooks'],
  ['distribution', 'Distribution', 'distribution'],
  ['analytics', 'Analytics', 'analytics'],
  null, // separator
  ['isbn', 'ISBN', 'isbn'],
  ['collections', 'Collections', 'collections'],
  ['settings', 'Paramètres', 'settings'],
];

const Sidebar = ({ active, onNav }: { active: string; onNav: (id: string) => void }) => (
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
        return (
          <button key={id} onClick={() => onNav(id)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg cursor-pointer transition-all relative text-left"
            style={{ background: isActive ? c.vi : 'transparent', color: isActive ? 'white' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: isActive ? 600 : 400, border: 'none' }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(62,39,104,0.5)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}>
            {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r" style={{ background: c.or }} />}
            <span className="flex" style={{ color: isActive ? c.or : 'inherit' }}>{icons[iconKey]}</span>
            {label}
          </button>
        );
      })}
    </div>

    <div className="flex items-center gap-3 px-5 pt-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: `linear-gradient(135deg, ${c.or}, ${c.oc})` }}>SM</div>
      <div>
        <div className="text-white text-[13px] font-medium">Steve M.</div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Plan Studio</div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════
// VIEWS
// ═══════════════════════════════════

// --- DASHBOARD ---
const DashboardView = ({ onProject, onNew, projects, allProjects }: { onProject: (p: Project) => void; onNew: () => void; projects: Project[]; allProjects: Project[] }) => {
  const pub = allProjects.filter(p => p.status === 'published').length;
  const prog = allProjects.filter(p => p.status === 'in-progress').length;
  const corr = allProjects.reduce((s, p) => s + p.corrections.length, 0);

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
        <StatCard value={`${allProjects.length + 27}/100`} label="ISBN attribués" accent={c.or} />
        <StatCard value={corr} label="Corrections" accent={c.er} />
      </div>

      <Card hover={false}>
        <div className="flex justify-between items-center px-5 py-3.5" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Catalogue</span>
          <span style={{ fontSize: 11, color: c.gr }}>{projects.length} titre{projects.length > 1 ? 's' : ''}</span>
        </div>
        {projects.map(p => (
          <div key={p.id} onClick={() => onProject(p)}
            className="flex items-center gap-3.5 px-5 py-3 cursor-pointer transition-colors hover:bg-[#FAF7F2]"
            style={{ borderBottom: `1px solid ${c.ft}` }}>
            <CoverThumb emoji={p.cover} />
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

// --- PROJECT DETAIL ---
const DetailView = ({ project: p, onBack }: { project: Project; onBack: () => void }) => {
  const [activeStep, setActiveStep] = useState(0);
  const stepStatuses = PIPELINE_STEPS.map((_, i) => {
    if (p.status === 'published') return 'done';
    if (p.status === 'in-progress') return i <= 1 ? 'done' : i === 2 ? 'active' : 'todo';
    return i === 0 ? 'active' : 'todo';
  });

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 mb-5 text-[13px] cursor-pointer bg-transparent border-none" style={{ color: c.gr }}>
        {icons.chevL} Projets
      </button>

      <div className="flex gap-6 mb-7">
        <CoverThumb emoji={p.cover} size="lg" />
        <div className="flex-1">
          <h2 className="text-2xl" style={{ color: c.mv }}>{p.title}</h2>
          {p.subtitle && <div className="text-[13px] italic mt-0.5" style={{ color: c.vm }}>{p.subtitle}</div>}
          <div className="text-[13px] mt-1.5" style={{ color: c.gr }}>{p.author}{p.illustrator && ` · Illustré par ${p.illustrator}`}</div>
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            <GenreBadge genre={p.genre} />
            {p.collection && <CollBadge collection={p.collection} />}
            <StatusBadge status={p.status} />
          </div>
          <div className="mt-3.5 text-[13px]">
            <span style={{ color: c.gr }}>ISBN </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: c.mv, fontSize: 12 }}>{p.isbn}</span>
            <span className="ml-4" style={{ color: c.gr }}>Pages </span><span>{p.pages}</span>
            {p.price && <><span className="ml-4" style={{ color: c.gr }}>Prix </span><span className="font-semibold">{p.price}</span></>}
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
              <CoverThumb emoji={p.cover} />
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
            <span className="text-lg">{p.cover}</span>
            <span className="flex-1 text-[13px] font-semibold">{p.title}</span>
            <span className="text-xs font-semibold" style={{ color: c.ok }}>✓ 7/7</span>
          </div>
        </Card>
      ))}
    </div>
  );
};

// --- ISBN ---
const ISBNView = ({ projects }: { projects: Project[] }) => (
  <div>
    <div className="flex justify-between items-end mb-5">
      <div><h2 className="text-2xl" style={{ color: c.mv }}>Registre ISBN</h2><p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Préfixe éditeur : 978-2-488647 · Stock : 100</p></div>
      <Btn>{icons.plus} Attribuer ISBN</Btn>
    </div>
    <div className="flex gap-3.5 mb-6"><StatCard value="37" label="Attribués" accent={c.or} /><StatCard value="63" label="Disponibles" accent={c.ok} /><StatCard value="#34" label="Prochain libre" accent={c.vm} /></div>
    <Card hover={false}>
      <div className="grid grid-cols-[190px_1fr_90px_90px] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ background: c.ft, color: c.mv, borderBottom: `2px solid ${c.or}` }}>
        <div>ISBN</div><div>Titre</div><div>Genre</div><div>Statut</div>
      </div>
      {projects.map((p, i) => (
        <div key={p.id} className="grid grid-cols-[190px_1fr_90px_90px] px-5 py-2.5 text-[13px] cursor-pointer transition-colors hover:bg-[rgba(200,149,46,0.04)]" style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8', borderBottom: `1px solid ${c.ft}` }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: c.mv }}>{p.isbn}</div>
          <div className="font-medium truncate">{p.title}</div>
          <div><GenreBadge genre={p.genre} /></div>
          <div><StatusBadge status={p.status} /></div>
        </div>
      ))}
    </Card>
  </div>
);

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
                <span>{p.cover}</span>
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
  const avg = (projects.reduce((s, p) => s + p.score, 0) / projects.length).toFixed(1);
  const totalPages = projects.reduce((s, p) => s + p.pages, 0);
  const byGenre: Record<string, number> = {};
  projects.forEach(p => { byGenre[p.genre] = (byGenre[p.genre] || 0) + 1; });
  return (
    <div>
      <h2 className="text-2xl mb-1" style={{ color: c.mv }}>Analytics</h2>
      <p className="mb-5" style={{ color: c.gr, fontSize: 13 }}>Vue d&apos;ensemble du catalogue</p>
      <div className="flex gap-3.5 mb-7 flex-wrap"><StatCard value={projects.length} label="Titres" accent={c.mv} /><StatCard value={`${avg}/7`} label="Score moyen" accent={c.or} /><StatCard value={totalPages.toLocaleString()} label="Pages totales" accent={c.vm} /></div>
      <div className="grid grid-cols-2 gap-5">
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
      </div>
    </div>
  );
};

// --- DISTRIBUTION ---
const DistributionView = () => (
  <div>
    <h2 className="text-2xl mb-1" style={{ color: c.mv }}>Distribution</h2>
    <p className="mb-5" style={{ color: c.gr, fontSize: 13 }}>Canaux de distribution et exports</p>
    <div className="grid grid-cols-2 gap-4">
      {DISTRIBUTION_CHANNELS.map(ch => (
        <Card key={ch.name} className="p-5">
          <div className="flex justify-between items-start">
            <div><div className="font-semibold text-[15px]" style={{ color: c.mv }}>{ch.name}</div><div className="text-xs mt-0.5" style={{ color: c.gr }}>{ch.desc}</div></div>
            <Badge bg={ch.color === c.ok ? '#D4F0E0' : ch.color === c.og ? '#FDE8D0' : '#E8E0F0'} color={ch.color}>{ch.status}</Badge>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// --- PLACEHOLDER ---
const PlaceholderView = ({ icon, title, desc, btn }: { icon: string; title: string; desc: string; btn?: string }) => (
  <div>
    <h2 className="text-2xl mb-5" style={{ color: c.mv }}>{title}</h2>
    <Card hover={false} className="p-8 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl mb-2" style={{ color: c.mv }}>{title}</h3>
      <p className="text-sm max-w-md mx-auto mb-5" style={{ color: c.gr }}>{desc}</p>
      {btn && <Btn>{icons.plus} {btn}</Btn>}
    </Card>
  </div>
);

// --- NEW PROJECT MODAL ---
const NewProjectModal = ({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (p: Project) => void }) => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Roman');
  const [collection, setCollection] = useState('');
  const [pages, setPages] = useState('');
  const nextIsbn = '978-2-488647-34-2';

  const handleCreate = () => {
    if (!title.trim()) return;
    const newProject: Project = {
      id: Date.now(),
      title: title.trim(),
      author: 'Steve Moradel',
      genre,
      collection: collection || undefined,
      isbn: nextIsbn,
      score: 0,
      maxScore: 7,
      status: 'draft',
      pages: parseInt(pages) || 0,
      cover: genre === 'BD' ? '🎨' : genre === 'Essai' ? '📝' : genre === 'Jeunesse' ? '🌈' : '📖',
      diag: { ean: false, prix: false, isbn_txt: false, texte4e: false, typo: false, dos: false, logo: false },
      corrections: ['Ajouter EAN-13', 'Ajouter prix TTC', 'Ajouter ISBN texte', 'Fournir texte 4e', 'Fournir couverture', 'Ajouter dos', 'Ajouter logo'],
    };
    onAdd(newProject);
    setTitle(''); setGenre('Roman'); setCollection(''); setPages('');
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

          <div className="rounded-lg p-3.5 mb-5" style={{ background: c.ft }}>
            <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: c.gr }}>ISBN auto-attribué</div>
            <div className="font-semibold text-[15px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.mv }}>{nextIsbn}</div>
            <div className="text-[11px] mt-0.5" style={{ color: c.gr }}>Prochain ISBN disponible dans le stock (38/100)</div>
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
  const specs = [
    { label: 'Format standard', value: '15,2 × 22,9 cm', detail: '6 × 9 pouces (Amazon KDP & IngramSpark)' },
    { label: 'Marges intérieures', value: '20 mm', detail: 'Petit fond : 15 mm · Grand fond : 20 mm' },
    { label: 'Police corps', value: 'Garamond 11pt', detail: 'Interligne 1.4 · Justifié, césure auto' },
    { label: 'Titres chapitres', value: 'Playfair Display 18pt', detail: 'Saut de page avant chaque chapitre' },
    { label: 'En-tête/pied', value: 'Inter 8pt', detail: 'Numéro de page centré · Titre courant' },
    { label: 'Reliure', value: 'Dos carré collé', detail: 'Épaisseur dos = pages × 0.05 mm' },
  ];
  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div><h2 className="text-2xl" style={{ color: c.mv }}>Calibrage</h2><p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Spécifications typographiques Jabrilia Éditions</p></div>
        <Btn>{icons.plus} Importer un manuscrit</Btn>
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
      <Card hover={false}>
        <div className="px-5 py-3.5" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Calibrage par titre</span>
        </div>
        {projects.map(p => {
          const thickness = (p.pages * 0.05).toFixed(1);
          return (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: `1px solid ${c.ft}` }}>
              <span className="text-lg">{p.cover}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{p.title}</div>
              </div>
              <div className="text-right" style={{ minWidth: 80 }}>
                <div className="text-[13px] font-semibold" style={{ color: c.mv }}>{p.pages} p.</div>
                <div style={{ fontSize: 10, color: c.gr }}>Dos : {thickness} mm</div>
              </div>
              <div className="text-right" style={{ minWidth: 100 }}>
                <div style={{ fontSize: 11, color: c.gr }}>15,2 × 22,9 cm</div>
                <div style={{ fontSize: 10, color: c.gr }}>Garamond 11pt</div>
              </div>
              <StatusBadge status={p.status} />
            </div>
          );
        })}
      </Card>
    </div>
  );
};

// --- SETTINGS VIEW ---
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
  const pipeline = [
    { icon: '📝', title: 'Import texte', desc: 'Chapitres découpés' },
    { icon: '🎙️', title: 'Voix IA', desc: 'ElevenLabs TTS' },
    { icon: '🎛️', title: 'Mastering', desc: 'EQ + compression' },
    { icon: '📦', title: 'Distribution', desc: 'Multi-plateforme' },
  ];
  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div><h2 className="text-2xl" style={{ color: c.mv }}>Audiobooks</h2><p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Production vocale IA — ElevenLabs TTS</p></div>
        <Btn>{icons.plus} Lancer une production</Btn>
      </div>
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {pipeline.map(s => (
          <Card key={s.title} hover={false} className="p-5 text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="font-semibold text-[14px]" style={{ color: c.mv }}>{s.title}</div>
            <div className="text-[11px] mt-1" style={{ color: c.gr }}>{s.desc}</div>
          </Card>
        ))}
      </div>
      <Card hover={false}>
        <div className="px-5 py-3.5" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Titres éligibles audiobook</span>
        </div>
        {projects.filter(p => p.genre !== 'BD').map(p => (
          <div key={p.id} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: `1px solid ${c.ft}` }}>
            <span className="text-lg">{p.cover}</span>
            <div className="flex-1"><div className="text-[13px] font-semibold">{p.title}</div><div style={{ fontSize: 11, color: c.gr }}>{p.pages} pages · ~{Math.round(p.pages * 1.5)} min</div></div>
            <GenreBadge genre={p.genre} />
            <Badge bg={c.gc} color={c.gr}>Non démarré</Badge>
          </div>
        ))}
      </Card>
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
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [search, setSearch] = useState('');

  const navigate = (id: string) => { setPage(id); setProject(null); };
  const openProject = (p: Project) => { setProject(p); setPage('detail'); };
  const addProject = (p: Project) => setProjects(prev => [...prev, p]);

  const filtered = search
    ? projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.genre.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase()))
    : projects;

  const renderContent = () => {
    if (project) return <DetailView project={project} onBack={() => navigate('dashboard')} />;
    switch (page) {
      case 'projets': return <DashboardView onProject={openProject} onNew={() => setModalOpen(true)} projects={filtered} allProjects={projects} />;
      case 'couvertures': return <CouverturesView onProject={openProject} projects={filtered} />;
      case 'isbn': return <ISBNView projects={filtered} />;
      case 'collections': return <CollectionsView onProject={openProject} projects={projects} />;
      case 'analytics': return <AnalyticsView projects={projects} />;
      case 'distribution': return <DistributionView />;
      case 'calibrage': return <CalibrageView projects={projects} />;
      case 'audiobooks': return <AudiobooksView projects={projects} />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView onProject={openProject} onNew={() => setModalOpen(true)} projects={filtered} allProjects={projects} />;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: c.bc }}>
      <Sidebar active={project ? 'projets' : page} onNav={navigate} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <div className="flex justify-between items-center px-8 py-2.5 bg-white" style={{ borderBottom: `1px solid ${c.gc}` }}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 max-w-sm" style={{ background: c.ft }}>
            <span style={{ color: c.gr }}>{icons.search}</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un titre, un genre, un auteur…"
              className="bg-transparent outline-none text-sm flex-1" style={{ color: c.nr }} />
            {search && <button onClick={() => setSearch('')} className="cursor-pointer bg-transparent border-none" style={{ color: c.gr }}>{icons.close}</button>}
          </div>
          <div className="relative cursor-pointer" style={{ color: c.gr }}
            onMouseEnter={e => (e.currentTarget.style.color = c.or)}
            onMouseLeave={e => (e.currentTarget.style.color = c.gr)}>
            {icons.bell}
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white" style={{ background: c.og }} />
          </div>
        </div>
        <div className="flex-1 p-7 overflow-y-auto">{renderContent()}</div>
      </div>
      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={addProject} />
    </div>
  );
}
