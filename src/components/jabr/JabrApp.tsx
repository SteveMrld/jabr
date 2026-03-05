'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { PROJECTS, PIPELINE_STEPS, COLLECTIONS, DIAG_LABELS, DISTRIBUTION_CHANNELS, FORMAT_LABELS, EDITION_STATUS_LABELS, MANUSCRIPT_STATUS_LABELS, countISBN, primaryISBN, primaryPrice, KDP_TRIM_SIZES, KDP_PAPER_TYPES, KDP_CONSTANTS, FR_PRINT_CONSTANTS, FR_TRIM_SIZES, calcKDPCover, calcFRCover, type Project, type Edition, type EditionFormat, type ManuscriptStatus, type AnalysisResult, type TrimSizeKey, type PaperType, type FrTrimKey, type CoverSpecs } from '@/lib/data';
import { useProjects, useDistributionChecks, useCalendarResults } from '@/lib/useProjects';
import { orchestrateTitle, orchestrateCatalogue, type TitleOrchestration, type CatalogueInsight } from '@/lib/orchestrationEngine';
import { t, type Lang } from '@/lib/i18n';
import { type Author } from '@/lib/authors';
import { generateBudgetPlan, generateObjectivePlan, compareAB, type MediaPlan, type MediaPlanInput } from '@/lib/mediaEngine';
import { DISTRIBUTORS, TRIM_SIZES, calculateCoverDimensions, calculateSpineWidth, auditCover, generateCoverSpec, compareDistributorSpecs, type Distributor, type ProjectCoverData, type CoverSpec, type CoverDimensions, type CoverAudit } from '@/lib/coverSpecs';
import { JABRILIA_CHARTER, getCoverTypoRecommendation, auditCoverAgainstCharter, type PublisherCharter, type CollectionSpec } from '@/lib/publisherCharter';
import { SOCIAL_FORMATS, generateCoverLayout, generateCoverImagePrompt, generateTrailerBrief, generateMarketingTexts, type CoverProject, type CoverStudioStep, type SocialAsset, type TrailerBrief, type APIConfig } from '@/lib/coverStudio';
import { assembleCover, exportCoverAsPNG, downloadBlob, generateSocialVisual, generateImageWithDALLE, generateVideoWithRunway, checkRunwayStatus, type CoverAssemblyConfig, type SocialVisualConfig } from '@/lib/coverAssembly';
import { splitIntoChapters, generateFullAudiobook, fetchVoices, downloadChapterAudio, downloadAllChapters, estimateCost, validateACXSpecs, type AudioChapter, type AudiobookProject, type ElevenLabsVoice } from '@/lib/audiobookEngine';

// ═══════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════
const lightColors = {
  or: '#C8952E', oc: '#E8B84B', od: '#F5DCA0',
  mv: '#2D1B4E', vi: '#3E2768', vm: '#5B3E8A',
  bc: '#FAF7F2', gr: '#9E9689', gc: '#E8E4DF', ft: '#F5F3EF',
  og: '#E07A2F', ok: '#2EAE6D', er: '#D94452', nr: '#2D2A26',
};

const darkColors = {
  or: '#E8B84B', oc: '#C8952E', od: '#A07424',
  mv: '#E8E0F0', vi: '#5B3E8A', vm: '#9B8ABF',
  bc: '#111016', gr: '#8A8580', gc: '#2A2830', ft: '#1C1A22',
  og: '#E07A2F', ok: '#3CC87F', er: '#E8616D', nr: '#E8E4DF',
};

// Mutable theme reference — updated by useTheme before each render
let c = lightColors;

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
  droits: sv(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>),
  benchmark: sv(<><path d="M18 20V10M12 20V4M6 20v-6" /></>),
  lecteurs: sv(<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>),
  traductions: sv(<><path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" /></>),
  multiauteurs: sv(<><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></>),
  editeur: sv(<><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" /></>),
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
  calendrier: sv(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></>),
  'cover-studio': sv(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /><circle cx="15" cy="15" r="2" /><path d="M15 11v2" /></>),
  image: sv(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>),
  share: sv(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>),
};

// ═══════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════
// Skeleton loader
const Skeleton = ({ w = '100%', h = 16, r = 8 }: { w?: string | number; h?: number; r?: number }) => (
  <div className="animate-pulse" style={{ width: w, height: h, borderRadius: r, background: `linear-gradient(90deg, ${c.ft} 25%, ${c.gc} 50%, ${c.ft} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
);
const SkeletonCard = () => (
  <div className="rounded-2xl p-5 space-y-3" style={{ background: 'white', border: `1px solid ${c.gc}` }}>
    <Skeleton w="60%" h={14} /><Skeleton h={10} /><Skeleton w="80%" h={10} />
    <div className="flex gap-2 mt-3"><Skeleton w={60} h={24} r={12} /><Skeleton w={50} h={24} r={12} /></div>
  </div>
);

// Page transition wrapper
const PageTransition = ({ children, key: k }: { children: React.ReactNode; key?: string }) => (
  <div key={k} style={{ animation: 'pageIn 0.3s ease-out' }}>{children}</div>
);

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
  <div className="bg-white rounded-xl border p-3 md:p-4 text-center transition-all duration-200 hover:border-[#C8952E] hover:shadow-md hover:-translate-y-0.5 min-w-0 overflow-hidden" style={{ borderColor: c.gc }}>
    <div className="truncate" style={{ fontSize: 20, fontWeight: 700, color: accent || c.mv, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{value}</div>
    <div className="mt-1 uppercase tracking-wider truncate" style={{ fontSize: 8, color: c.gr, fontWeight: 600 }}>{label}</div>
  </div>
);

const Card = ({ children, className = '', hover = true, onClick, style }: { children: React.ReactNode; className?: string; hover?: boolean; onClick?: () => void; style?: React.CSSProperties }) => (
  <div onClick={onClick} className={`bg-white rounded-xl border transition-all duration-200 ${hover ? 'hover:border-[#C8952E] hover:shadow-md' : ''} ${className}`} style={{ borderColor: c.gc, maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box', ...style }}>
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
    className={`inline-flex items-center gap-1 px-3 md:px-5 py-2 md:py-2.5 rounded-lg font-semibold text-[12px] md:text-[13px] transition-colors cursor-pointer btn-press whitespace-nowrap ${variant === 'primary' ? 'text-white hover:bg-[#E8B84B]' : 'border hover:bg-gray-50'} ${className}`}
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
    <div className="flex flex-col">
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: c.or, letterSpacing: 3 }}>JABR</span>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginTop: -2 }}>v3.5 · Cover Studio</span>
    </div>
  </div>
);

// ═══════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════
const NAV_ITEMS: (readonly [string, string, string] | null)[] = [
  ['dashboard', 'Dashboard', 'dashboard'],
  ['orchestration', 'Orchestration', 'orchestration'],
  ['projets', 'Projets', 'projets'],
  ['manuscrits', 'Manuscrits', 'manuscrits'],
  ['analyse', 'Analyse', 'analyse'],
  ['calibrage', 'Calibrage', 'calibrage'],
  ['couvertures', 'Couvertures', 'couvertures'],
  ['cover-studio', '◆ Cover Studio', 'cover-studio'],
  ['audiobooks', 'Audiobooks', 'audiobooks'],
  ['distribution', 'Distribution', 'distribution'],
  ['marketing', 'Marketing', 'marketing'],
  ['presse', 'Dossier Presse', 'presse'],
  ['calendrier', 'Calendrier', 'calendrier'],
  ['analytics', 'Analytics', 'analytics'],
  null, // separator
  ['isbn', 'ISBN', 'isbn'],
  ['collections', 'Collections', 'collections'],
  ['droits', 'Droits', 'droits'],
  ['benchmark', 'Benchmark', 'benchmark'],
  ['lecteurs', 'Lecteurs', 'lecteurs'],
  ['traductions', 'Traductions', 'traductions'],
  ['multiauteurs', 'Multi-auteurs', 'multiauteurs'],
  ['editeur', 'Éditeur', 'editeur'],
  ['settings', 'Paramètres', 'settings'],
];

const Sidebar = ({ active, onNav, projects, persisted, open, onToggle, lang, onToggleLang, author, onSwitchAuthor }: { active: string; onNav: (id: string) => void; projects: Project[]; persisted: boolean; open: boolean; onToggle: () => void; lang: Lang; onToggleLang: () => void; author?: Author; onSwitchAuthor?: () => void }) => {
  const corrCount = projects.reduce((s, p) => s + p.corrections.length, 0);
  const draftCount = projects.filter(p => p.status === 'draft').length;
  const audioCount = projects.filter(p => p.editions.some(e => e.format === 'audiobook')).length;
  const withManuscript = projects.filter(p => p.manuscriptStatus && p.manuscriptStatus !== 'none').length;
  const badges: Record<string, number> = { couvertures: corrCount, projets: projects.length, isbn: countISBN(projects), audiobooks: audioCount, manuscrits: withManuscript };

  return (
  <>
  {/* Overlay for mobile */}
  {open && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onToggle} />}
  <div className={`fixed md:relative z-50 md:z-auto w-[220px] min-h-screen flex flex-col py-5 shrink-0 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`} style={{ background: `linear-gradient(180deg, ${c.mv}, #1A0F2E)` }}>
    <div className="px-3 md:px-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <JabrLogo />
      <div className="mt-1 uppercase" style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px' }}>Pipeline éditorial</div>
      {author && (
        <div className="mt-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg, #2D1B4E, ${author.color || '#C8952E'})` }}>
            {author.firstName[0]}{author.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-white truncate" style={{ opacity: 0.85 }}>{author.displayName}</div>
          </div>
          {onSwitchAuthor && (
            <button onClick={onSwitchAuthor} title="Changer d'auteur"
              className="shrink-0 rounded-md p-1 transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,149,46,0.15)'; e.currentTarget.style.color = 'rgba(200,149,46,0.8)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
            </button>
          )}
        </div>
      )}
    </div>

    <div className="flex-1 px-2.5 py-3 flex flex-col gap-0.5">
      {NAV_ITEMS.map((item, i) => {
        if (!item) return <div key={i} className="mx-2.5 my-2" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />;
        const [id, label, iconKey] = item;
        const isActive = active === id;
        const badge = badges[id];
        return (
          <button key={id} onClick={() => { onNav(id); if (window.innerWidth < 768) onToggle(); }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg cursor-pointer transition-all relative text-left"
            style={{ background: isActive ? c.vi : 'transparent', color: isActive ? 'white' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: isActive ? 600 : 400, border: 'none' }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(62,39,104,0.5)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}>
            {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r" style={{ background: c.or }} />}
            <span className="flex" style={{ color: isActive ? c.or : id === 'cover-studio' ? c.or : 'inherit' }}>{icons[iconKey]}</span>
            <span className="flex-1" style={id === 'cover-studio' && !isActive ? { color: c.or, fontWeight: 600 } : undefined}>{label}</span>
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
      <button onClick={onToggleLang} className="ml-auto cursor-pointer bg-transparent border-none px-2 py-1 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.08)]"
        title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}>
        <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
        </span>
      </button>
    </div>
  </div>
  </>
  );
};

// ═══════════════════════════════════
// VIEWS
// ═══════════════════════════════════

// --- ANIMATED NUMBER ---
const AnimatedNumber = ({ value, duration = 800 }: { value: number; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const steps = 30;
    const inc = value / steps;
    const timer = setInterval(() => {
      start += inc;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display}</>;
};

// --- MINI DONUT SVG ---
const MiniDonut = ({ segments, size = 80 }: { segments: { value: number; color: string; label: string }[]; size?: number }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  const r = 30;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 80 80">
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = circ * pct;
          const o = offset;
          offset += dash;
          return (
            <circle key={i} cx="40" cy="40" r={r} fill="none" stroke={seg.color} strokeWidth="10"
              strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-o}
              transform="rotate(-90 40 40)" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
          );
        })}
        <text x="40" y="43" textAnchor="middle" fill={c.mv} fontSize="14" fontWeight="700" fontFamily="'Playfair Display', serif">{total}</text>
      </svg>
      <div className="space-y-1">
        {segments.filter(s => s.value > 0).map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
            <span className="text-[10px]" style={{ color: c.gr }}>{seg.label} ({seg.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- DASHBOARD ---

// ORCHESTRATION VIEW
const OrchestrationView = ({ projects, onProject, onNav }: { projects: Project[]; onProject: (p: Project) => void; onNav: (id: string) => void }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<"overview" | "detail" | "flowmap">("overview");
  const catalogue = useMemo(() => orchestrateCatalogue(projects), [projects]);
  const titleResults = useMemo(() => projects.map(p => orchestrateTitle(p)), [projects]);
  const sorted = useMemo(() => [...titleResults].sort((a, b) => b.globalScore - a.globalScore), [titleResults]);
  const selected = selectedId !== null ? titleResults.find(t => t.projectId === selectedId) : null;
  const gradeColor = (g: string) => g === "A" ? "#16a34a" : g === "B" ? "#2563eb" : g === "C" ? c.or : g === "D" ? "#ea580c" : "#dc2626";
  const impactColor = (i: string) => i === "critical" ? "#dc2626" : i === "high" ? "#ea580c" : i === "medium" ? c.or : "#6b7280";
  const effortLabel = (e: string) => e === "quick-win" ? "Quick win" : e === "moderate" ? "Effort moyen" : "Chantier lourd";
  const dims = ["editorial", "production", "distribution", "marketing", "international"] as const;
  const dimLabels: Record<string, string> = { editorial: "Editorial", production: "Production", distribution: "Distribution", marketing: "Marketing", international: "International" };
  const dimColors: Record<string, string> = { editorial: "#6C4DFF", production: c.or, distribution: "#2563eb", marketing: "#ea580c", international: "#16a34a" };
  const flowSteps = [
    { id: "manuscrit", label: "Manuscrit", module: "manuscrits", check: (p: Project) => p.manuscriptStatus === "validated" || p.manuscriptStatus === "isbn-injected" },
    { id: "analyse", label: "Analyse IA", module: "analyse", check: (p: Project) => !!p.analysis },
    { id: "corrections", label: "Corrections", module: "analyse", check: (p: Project) => p.corrections.length > 0 },
    { id: "calibrage", label: "Calibrage", module: "calibrage", check: (p: Project) => Object.values(p.diag).filter(Boolean).length >= Object.keys(p.diag).length * 0.7 },
    { id: "couverture", label: "Couverture", module: "couvertures", check: (p: Project) => Object.values(p.diag).filter(Boolean).length === Object.keys(p.diag).length },
    { id: "isbn", label: "ISBN", module: "isbn", check: (p: Project) => p.editions.every(e => e.isbn && e.isbn.length > 5) },
    { id: "distribution", label: "Distribution", module: "distribution", check: (p: Project) => p.editions.some(e => e.status === "ready" || e.status === "published") },
    { id: "marketing", label: "Marketing", module: "marketing", check: (p: Project) => !!p.backCover && p.backCover.length > 50 },
    { id: "traduction", label: "Traduction", module: "traductions", check: (p: Project) => p.status === "published" },
  ];
  const radarPoints = (scores: number[], radius: number) => {
    const n = scores.length;
    return scores.map((s, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = (s / 100) * radius;
      return [150 + r * Math.cos(angle), 150 + r * Math.sin(angle)];
    });
  };
  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🧠</span>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: c.mv, margin: 0 }}>Editorial Orchestration Engine</h2>
        </div>
        <p style={{ color: c.gr, fontSize: 13, margin: 0 }}>Copilote strategique pour chaque titre du catalogue.</p>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([["overview", "Vue catalogue"], ["detail", "Analyse titre"], ["flowmap", "Flow Map"]] as [string, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: tab === id ? c.or : c.ft, color: tab === id ? "white" : c.nr }}>
            {label}
          </button>
        ))}
      </div>
      {tab === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            <StatCard value={catalogue.avgGlobalScore + "/100"} label="Score moyen" accent={c.or} />
            <StatCard value={String(catalogue.readyToPublish)} label="Prets (A/B)" accent="#16a34a" />
            <StatCard value={String(catalogue.criticalBottlenecks.length)} label="Blocages critiques" accent="#dc2626" />
            <StatCard value={String(catalogue.totalTitles)} label="Titres" accent={c.mv} />
          </div>
          {catalogue.weeklyFocus.length > 0 && (
            <div style={{ background: "linear-gradient(135deg, #FFF7ED, #FEF3C7)", borderRadius: 12, padding: 16, marginBottom: 20, border: "1px solid #FDE68A" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.or, marginBottom: 8 }}>Focus de la semaine</div>
              {catalogue.weeklyFocus.map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: c.nr, padding: "4px 0" }}><strong style={{ color: c.or }}>{i + 1}.</strong> {f}</div>
              ))}
            </div>)}
          {catalogue.portfolioBalance.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.mv, marginBottom: 8 }}>Equilibre du portefeuille</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {catalogue.portfolioBalance.map(g => (
                  <div key={g.genre} style={{ background: "white", border: "1px solid " + c.ft, borderRadius: 10, padding: "10px 16px", minWidth: 120 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.nr }}>{g.genre}</div>
                    <div style={{ fontSize: 11, color: c.gr }}>{g.count} titre{g.count > 1 ? "s" : ""} - {g.avgScore}/100</div>
                    <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: c.ft }}><div style={{ height: 4, borderRadius: 2, width: g.avgScore + "%", background: g.avgScore >= 65 ? "#16a34a" : g.avgScore >= 45 ? c.or : "#dc2626" }} /></div>
                  </div>))}
              </div></div>)}
          <div style={{ fontSize: 13, fontWeight: 700, color: c.mv, marginBottom: 8 }}>Classement des titres</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sorted.map((t, i) => {
              const proj = projects.find(p => p.id === t.projectId);
              return (
                <div key={t.projectId} onClick={() => { setSelectedId(t.projectId); setTab("detail"); }} style={{ display: "grid", gridTemplateColumns: "40px 1fr 60px 80px 200px 80px", alignItems: "center", gap: 8, background: "white", border: "1px solid " + c.ft, borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>
                  <span style={{ fontSize: 11, color: c.gr, fontWeight: 600 }}>#{i + 1}</span>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: c.nr }}>{proj?.cover} {t.title}</div><div style={{ fontSize: 11, color: c.gr }}>{t.genre}</div></div>
                  <div style={{ textAlign: "center" }}><span style={{ fontSize: 18, fontWeight: 800, color: gradeColor(t.globalGrade) }}>{t.globalGrade}</span></div>
                  <div style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: c.nr }}>{t.globalScore}/100</div>
                  <div style={{ fontSize: 11, color: c.gr, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.nextAction}</div>
                  <div style={{ textAlign: "right", fontSize: 11, color: c.gr }}>{t.estimatedWeeksToReady > 0 ? "~" + t.estimatedWeeksToReady + " sem." : "Pret"}</div>
                </div>);
            })}
          </div>
        </div>
      )}      {tab === "detail" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <select value={selectedId ?? ""} onChange={e => setSelectedId(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid " + c.ft, fontSize: 13, background: "white", color: c.nr, minWidth: 300 }}>
              <option value="">Choisir un titre...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.cover} {p.title}</option>)}
            </select>
          </div>
          {selected && (
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
              <div style={{ background: "white", borderRadius: 12, border: "1px solid " + c.ft, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.mv, marginBottom: 12, textAlign: "center" }}>Radar 5D</div>
                <svg viewBox="0 0 300 300" style={{ width: "100%" }}>
                  {[25, 50, 75, 100].map(pct => (<circle key={pct} cx={150} cy={150} r={pct * 1.2} fill="none" stroke={c.ft} strokeWidth={1} />))}
                  {dims.map((_, i) => { const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2; return <line key={i} x1={150} y1={150} x2={150 + 120 * Math.cos(angle)} y2={150 + 120 * Math.sin(angle)} stroke={c.ft} strokeWidth={1} />; })}
                  {(() => { const scores = dims.map(d => (selected as any)[d].score as number); const pts = radarPoints(scores, 120); return <polygon points={pts.map(pp => pp.join(",")).join(" ")} fill={c.or + "30"} stroke={c.or} strokeWidth={2} />; })()}
                  {dims.map((d, i) => { const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2; const x = 150 + 140 * Math.cos(angle); const y = 150 + 140 * Math.sin(angle); return <text key={d} x={x} y={y} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 10, fill: dimColors[d], fontWeight: 600 }}>{dimLabels[d]} {(selected as any)[d].score}</text>; })}
                </svg>
                <div style={{ textAlign: "center", marginTop: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: gradeColor(selected.globalGrade) }}>{selected.globalGrade}</span>
                  <span style={{ fontSize: 14, color: c.gr, marginLeft: 8 }}>{selected.globalScore}/100</span>
                </div>
              </div>
              <div>
                <div style={{ marginBottom: 20 }}>
                  {dims.map(d => {
                    const dim = (selected as any)[d] as { score: number; label: string; bottleneck: string | null };
                    return (
                      <div key={d} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: dimColors[d] }}>{dimLabels[d]}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: c.nr }}>{dim.score}/100</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: c.ft }}><div style={{ height: 6, borderRadius: 3, width: dim.score + "%", background: dimColors[d], transition: "width 0.5s" }} /></div>
                        {dim.bottleneck && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2 }}>! {dim.bottleneck}</div>}
                      </div>);
                  })}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.mv, marginBottom: 8 }}>Priorites strategiques</div>
                {selected.priorities.map(pr => (
                  <div key={pr.rank} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "white", border: "1px solid " + c.ft, borderRadius: 10, padding: "10px 14px", marginBottom: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: impactColor(pr.impact), minWidth: 24 }}>#{pr.rank}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: c.nr }}>{pr.action}</div>
                      <div style={{ fontSize: 10, color: c.gr, marginTop: 2 }}>{pr.rationale}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge bg={impactColor(pr.impact) + "20"} color={impactColor(pr.impact)}>{pr.impact}</Badge>
                      <div style={{ fontSize: 9, color: c.gr, marginTop: 2 }}>{effortLabel(pr.effort)}</div>
                    </div>
                  </div>))}
                <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: selected.estimatedWeeksToReady === 0 ? "#D4F0E0" : "#FFF7ED", textAlign: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: selected.estimatedWeeksToReady === 0 ? "#16a34a" : c.or }}>
                    {selected.estimatedWeeksToReady === 0 ? "Titre pret" : "~" + selected.estimatedWeeksToReady + " semaines"}
                  </div>
                </div>
              </div>
            </div>)}
          {!selected && <div style={{ textAlign: "center", padding: 40, color: c.gr, fontSize: 13 }}>Selectionnez un titre.</div>}
        </div>)}
      {tab === "flowmap" && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.mv, marginBottom: 12 }}>Flux editorial</div>
          <div style={{ overflowX: "auto" }}>
            <div style={{overflowX:"auto",maxWidth:"100%"}}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr>
                <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "2px solid " + c.ft, color: c.gr, fontWeight: 600 }}>Titre</th>
                {flowSteps.map(s => (<th key={s.id} style={{ textAlign: "center", padding: "8px 6px", borderBottom: "2px solid " + c.ft, color: c.gr, fontWeight: 600, cursor: "pointer" }} onClick={() => onNav(s.module)}>{s.label}</th>))}
              </tr></thead>
              <tbody>
                {projects.map(p => {
                  const checks = flowSteps.map(s => s.check(p));
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid " + c.ft, cursor: "pointer" }} onClick={() => { setSelectedId(p.id); setTab("detail"); }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600, color: c.nr }}>{p.cover} {p.title}</td>
                      {flowSteps.map((s, i) => {
                        const ok = checks[i];
                        const isCurrent = !ok && (i === 0 || checks[i - 1]);
                        const bg = ok ? "#D4F0E0" : isCurrent ? "#FDE8D0" : "#F5F3F0";
                        const clr = ok ? "#16a34a" : isCurrent ? c.or : "#ccc";
                        return (<td key={s.id} style={{ textAlign: "center", padding: "8px 6px" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: bg, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: clr, border: isCurrent ? "2px solid " + c.or : "none" }}>{ok ? "\u2713" : isCurrent ? "\u2192" : "\u00B7"}</div></td>);
                      })}
                    </tr>);
                })}
              </tbody>
            </table></div>
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.mv, marginBottom: 8 }}>Goulots</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {flowSteps.map(s => {
                const blocked = projects.filter(p => !s.check(p)).length;
                const pct = projects.length > 0 ? Math.round((blocked / projects.length) * 100) : 0;
                return (<div key={s.id} onClick={() => onNav(s.module)} style={{ background: "white", border: "1px solid " + c.ft, borderRadius: 10, padding: "10px 14px", minWidth: 100, cursor: "pointer" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c.nr }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: pct > 70 ? "#dc2626" : pct > 40 ? c.or : "#16a34a" }}>{pct}%</div>
                  <div style={{ fontSize: 10, color: c.gr }}>{blocked}/{projects.length} bloques</div>
                </div>);
              })}
            </div>
          </div>
        </div>)}
    </div>
  );
};
const DashboardView = ({ onProject, onNew, projects, allProjects, onNav, onUpdateProject }: { onProject: (p: Project) => void; onNew: () => void; projects: Project[]; allProjects: Project[]; onNav?: (id: string) => void; onUpdateProject?: (p: Project) => void }) => {
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
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'timeline'>('list');
  const [dragId, setDragId] = useState<number | null>(null);

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
  const noMarketing = allProjects.filter(p => p.status !== 'draft' && (!p.backCover || p.backCover.length < 50 || !p.coverImage)).length;
  if (noMarketing > 0) priorities.push({ label: `${noMarketing} titres prêts pour Cover Studio`, count: noMarketing, color: c.vm, nav: 'cover-studio' });

  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div className="min-w-0">
          <h2 className="text-xl md:text-xl md:text-2xl" style={{ color: c.mv }}>Dashboard</h2>
          <p className="mt-0.5" style={{ color: c.gr, fontSize: 12 }}>Jabrilia Éditions — Cockpit éditorial</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Btn variant="secondary" onClick={async () => {
            try {
              const res = await fetch('/api/export-catalogue', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projects: allProjects }),
              });
              const html = await res.text();
              const w = window.open('', '_blank');
              if (w) { w.document.write(html); w.document.close(); }
            } catch {}
          }}>{icons.download} Catalogue PDF</Btn>
          <Btn variant="secondary" onClick={async () => {
            try {
              const res = await fetch('/api/pitch-deck', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projects: allProjects }),
              });
              const html = await res.text();
              const w = window.open('', '_blank');
              if (w) { w.document.write(html); w.document.close(); }
            } catch {}
          }}>🎬 Pitch Deck</Btn>
          <Btn onClick={onNew}>{icons.plus} Nouveau projet</Btn>
        </div>
      </div>

      {/* KPIs row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 mb-3">
        <StatCard value={allProjects.length} label="Titres" accent={c.mv} />
        <StatCard value={pub} label="Publiés" accent={c.ok} />
        <StatCard value={prog} label="En cours" accent={c.og} />
        <StatCard value={countISBN(allProjects)} label="ISBN" accent={c.or} />
        <StatCard value={totalPages.toLocaleString()} label="Pages" accent={c.vm} />
        <StatCard value={`~${totalRev.toLocaleString()}€`} label="Rev. estimés/an" accent={c.or} />
      </div>

      {/* JABR Engines — what the platform does */}
      <div className="mb-3 p-2 md:p-3 rounded-xl overflow-x-auto" style={{ background: 'linear-gradient(135deg, #2D1B4E08, #C8952E08)', border: `1px solid ${c.gc}` }}>
        <div className="flex items-center gap-3 md:gap-4 flex-wrap md:flex-wrap" style={{ minWidth: 0 }}>
          {[
            { icon: '🔍', label: 'Scanner 6D', desc: 'Analyse IA manuscrit' },
            { icon: '📐', label: 'Cover Specs', desc: '3 distributeurs' },
            { icon: '🎨', label: 'Cover Studio', desc: 'Couverture → Export' },
            { icon: '📊', label: 'Media Engine', desc: 'Plan média IA' },
            { icon: '🎬', label: 'Trailer Gen', desc: 'Brief Runway' },
            { icon: '📦', label: 'ONIX 3.0', desc: 'Export distribution' },
            { icon: '🎵', label: 'Audiobooks', desc: 'Pipeline TTS' },
            { icon: '⚡', label: 'Orchestration', desc: 'Scoring 5 axes' },
          ].map(e => (
            <div key={e.label} className="flex items-center gap-1.5">
              <span className="text-[13px]">{e.icon}</span>
              <div>
                <div className="text-[10px] font-bold leading-tight" style={{ color: c.mv }}>{e.label}</div>
                <div className="text-[8px]" style={{ color: c.gr }}>{e.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs row 2 — production */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 mb-4">
        <StatCard value={`${withCoverArt}/${allProjects.length}`} label="Artwork" accent={withCoverArt === allProjects.length ? c.ok : c.og} />
        <StatCard value={`${withBackCover}/${allProjects.length}`} label="4e couverture" accent={withBackCover === allProjects.length ? c.ok : c.og} />
        <StatCard value={`${analyzed.length}/${allProjects.length}`} label="Analysés" accent={analyzed.length === allProjects.length ? c.ok : c.og} />
        <StatCard value={withAudio} label="Audiobooks" accent={c.vm} />
        <StatCard value={avgIa !== null ? `${avgIa}%` : '—'} label="Score IA moy." accent={avgIa !== null && avgIa > 25 ? c.er : c.ok} />
        <StatCard value={corr} label="Corrections" accent={corr > 0 ? c.er : c.ok} />
      </div>

      {/* Real-time dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        {/* Status donut */}
        <Card hover={false} className="p-3 md:p-5">
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: c.gr }}>Répartition statut</div>
          <MiniDonut segments={[
            { value: pub, color: c.ok, label: 'Publiés' },
            { value: prog, color: c.og, label: 'En cours' },
            { value: allProjects.filter(p => p.status === 'draft').length, color: c.gr, label: 'Brouillons' },
          ]} />
        </Card>

        {/* Pipeline progress */}
        <Card hover={false} className="p-3 md:p-5">
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: c.gr }}>Pipeline production</div>
          <div className="space-y-2.5">
            {[
              { label: 'ISBN enregistrés', current: countISBN(allProjects), max: allProjects.reduce((s, p) => s + p.editions.length, 0) || 1, color: c.or },
              { label: 'Artwork prêt', current: withCoverArt, max: allProjects.length, color: c.vm },
              { label: '4e couverture', current: withBackCover, max: allProjects.length, color: c.og },
              { label: 'Analysés IA', current: analyzed.length, max: allProjects.length, color: c.ok },
            ].map((bar, i) => {
              const pct = bar.max > 0 ? Math.round((bar.current / bar.max) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span style={{ color: c.vm }}>{bar.label}</span>
                    <span style={{ color: bar.color, fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.gc }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: bar.color, transition: 'width 1s ease-out' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Revenue gauge */}
        <Card hover={false} className="p-3 md:p-5">
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: c.gr }}>Revenus estimés/an</div>
          <div className="flex items-center justify-center">
            <svg width="120" height="80" viewBox="0 0 120 80">
              {/* Background arc */}
              <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke={c.gc} strokeWidth="8" strokeLinecap="round" />
              {/* Value arc */}
              {(() => {
                const maxRev = 10000;
                const pct = Math.min(1, totalRev / maxRev);
                const angle = pct * Math.PI;
                const x = 60 - 50 * Math.cos(angle);
                const y = 70 - 50 * Math.sin(angle);
                const large = pct > 0.5 ? 1 : 0;
                return <path d={`M 10 70 A 50 50 0 ${large} 1 ${x} ${y}`} fill="none" stroke={c.or} strokeWidth="8" strokeLinecap="round" style={{ transition: 'all 1s ease-out' }} />;
              })()}
              <text x="60" y="65" textAnchor="middle" fill={c.mv} fontSize="16" fontWeight="700" fontFamily="'Playfair Display', serif">
                {totalRev.toLocaleString()}€
              </text>
              <text x="60" y="78" textAnchor="middle" fill={c.gr} fontSize="8">/ 10 000€ objectif</text>
            </svg>
          </div>
        </Card>
      </div>

      {/* Priorities */}
      {priorities.length > 0 && (
        <div className="rounded-xl p-4 mb-5" style={{ background: '#FFF8F0', border: '1px solid #F4A55A' }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: c.og }}>{icons.warn}</span>
            <span className="text-[13px] font-semibold" style={{ color: c.og }}>Actions prioritaires</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
        <div className="flex flex-wrap justify-between items-center gap-1 px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Readiness</span>
          <span className="text-[9px] hidden sm:inline" style={{ color: c.gr }}>Manuscrit · ISBN · Couverture · Artwork · 4e · Analyse · Publié</span>
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
        <div className="flex flex-wrap justify-between items-center gap-2 px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Catalogue</span>
            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${c.gc}` }}>
              <button onClick={() => setViewMode('list')} className="px-2.5 py-1 cursor-pointer border-none text-[10px] font-semibold"
                style={{ background: viewMode === 'list' ? c.or : 'white', color: viewMode === 'list' ? 'white' : c.gr }}>
                ☰ Liste
              </button>
              <button onClick={() => setViewMode('kanban')} className="px-2.5 py-1 cursor-pointer border-none text-[10px] font-semibold"
                style={{ background: viewMode === 'kanban' ? c.or : 'white', color: viewMode === 'kanban' ? 'white' : c.gr, borderLeft: `1px solid ${c.gc}` }}>
                ▣ Kanban
              </button>
              <button onClick={() => setViewMode('timeline')} className="px-2.5 py-1 cursor-pointer border-none text-[10px] font-semibold"
                style={{ background: viewMode === 'timeline' ? c.or : 'white', color: viewMode === 'timeline' ? 'white' : c.gr, borderLeft: `1px solid ${c.gc}` }}>
                ━ Timeline
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            {viewMode === 'list' && <><SortBtn label="Titre" k="title" /><SortBtn label="Score" k="score" /><SortBtn label="Statut" k="status" /><SortBtn label="Éditions" k="editions" /></>}
            <span style={{ fontSize: 11, color: c.gr }}>{projects.length} titre{projects.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* LIST VIEW */}
        {viewMode === 'list' && sorted.map(p => (
          <div key={p.id} onClick={() => onProject(p)}
            className="flex items-center gap-2.5 md:gap-3.5 px-3 md:px-5 py-3 cursor-pointer transition-colors hover:bg-[#FAF7F2]"
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
            <div className="hidden sm:block w-[110px]"><ScoreBar score={p.score} max={p.maxScore} /></div>
            <StatusBadge status={p.status} />
            {p.corrections.length > 0 && <Badge bg="#FDE0E3" color="#A0303D">{p.corrections.length}</Badge>}
            {p.analysis && (
              <span className="hidden sm:inline text-[9px] font-bold" style={{ color: p.analysis.iaScore > 30 ? c.er : p.analysis.iaScore > 15 ? c.og : c.ok }}>
                IA:{p.analysis.iaScore}%
              </span>
            )}
            <div className="hidden sm:block" style={{ color: c.gr }}>{icons.chevR}</div>
          </div>
        ))}

        {/* KANBAN VIEW */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 p-4" style={{ minHeight: 300 }}>
            {([
              { status: 'draft' as const, label: 'Brouillon', color: c.gr, bg: '#F5F3EF' },
              { status: 'in-progress' as const, label: 'En cours', color: c.og, bg: '#FFF8F0' },
              { status: 'published' as const, label: 'Publié', color: c.ok, bg: '#F0FFF5' },
            ]).map(col => {
              const colProjects = projects.filter(p => p.status === col.status);
              return (
                <div key={col.status} className="px-2"
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.outline = `2px dashed ${col.color}`; e.currentTarget.style.outlineOffset = '-2px'; }}
                  onDragLeave={e => { e.currentTarget.style.outline = 'none'; }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.style.outline = 'none';
                    if (dragId && onUpdateProject) {
                      const proj = allProjects.find(p => p.id === dragId);
                      if (proj && proj.status !== col.status) {
                        onUpdateProject({ ...proj, status: col.status });
                      }
                    }
                    setDragId(null);
                  }}>
                  <div className="flex items-center justify-between mb-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: col.color }}>{col.label}</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: col.bg, color: col.color }}>
                      {colProjects.length}
                    </span>
                  </div>
                  <div className="space-y-2 min-h-[200px] p-2 rounded-xl transition-colors" style={{ background: col.bg }}>
                    {colProjects.map(p => (
                      <div key={p.id} draggable
                        onDragStart={() => setDragId(p.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => onProject(p)}
                        className="bg-white p-3 rounded-xl cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
                        style={{ border: `1px solid ${c.gc}`, opacity: dragId === p.id ? 0.5 : 1 }}>
                        <div className="flex items-center gap-2.5">
                          <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold truncate" style={{ color: c.mv }}>{p.title}</div>
                            <div className="text-[10px]" style={{ color: c.gr }}>{p.genre} · {p.pages}p</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${c.ft}` }}>
                          <div className="flex gap-1">
                            {p.editions.slice(0, 3).map((e, i) => (
                              <span key={i} className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: c.ft, color: c.vm }}>{FORMAT_LABELS[e.format]?.icon}</span>
                            ))}
                            {p.editions.length > 3 && <span className="text-[8px] px-1 py-0.5" style={{ color: c.gr }}>+{p.editions.length - 3}</span>}
                          </div>
                          <ScoreBar score={p.score} max={p.maxScore} />
                        </div>
                        {p.corrections.length > 0 && (
                          <div className="mt-1.5 text-[9px] font-semibold" style={{ color: c.er }}>
                            {p.corrections.length} correction{p.corrections.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                    {colProjects.length === 0 && (
                      <div className="text-center py-8 text-[11px]" style={{ color: c.gr }}>
                        Glissez un titre ici
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TIMELINE VIEW */}
        {viewMode === 'timeline' && (() => {
          const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
          const statusColor = (s: string) => s === 'published' ? c.ok : s === 'in-progress' ? c.og : c.gr;
          const statusStart = (s: string) => s === 'published' ? 0 : s === 'in-progress' ? 3 : 6;
          const statusEnd = (s: string) => s === 'published' ? 8 : s === 'in-progress' ? 9 : 10;

          return (
            <div className="p-4 overflow-x-auto">
              {/* Month headers */}
              <div className="flex" style={{ minWidth: 800 }}>
                <div className="w-[180px] shrink-0" />
                <div className="flex-1 grid grid-cols-12 gap-0">
                  {months.map((m, i) => (
                    <div key={i} className="text-center text-[9px] font-bold py-2" style={{ color: c.gr, borderBottom: `1px solid ${c.gc}` }}>{m}</div>
                  ))}
                </div>
              </div>

              {/* Project rows */}
              {sorted.map(p => {
                const start = statusStart(p.status);
                const end = statusEnd(p.status);
                const barLeft = `${(start / 12) * 100}%`;
                const barWidth = `${((end - start) / 12) * 100}%`;
                const score = p.maxScore > 0 ? Math.round((p.score / p.maxScore) * 100) : 0;

                return (
                  <div key={p.id} className="flex items-center cursor-pointer transition-colors hover:bg-[rgba(200,149,46,0.02)]"
                    onClick={() => onProject(p)} style={{ minWidth: 800, borderBottom: `1px solid ${c.ft}` }}>
                    {/* Project info */}
                    <div className="w-[180px] shrink-0 flex items-center gap-2 py-2.5 px-2">
                      <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold truncate" style={{ color: c.mv }}>{p.title}</div>
                        <div className="text-[9px]" style={{ color: c.gr }}>{p.genre} · {p.pages}p</div>
                      </div>
                    </div>

                    {/* Gantt bar */}
                    <div className="flex-1 relative h-10 grid grid-cols-12 gap-0">
                      {months.map((_, i) => (
                        <div key={i} className="h-full" style={{ borderRight: `1px solid ${c.ft}`, borderLeft: i === 0 ? `1px solid ${c.ft}` : 'none' }} />
                      ))}
                      <div className="absolute top-2.5 h-5 rounded-full flex items-center px-2 transition-all" style={{
                        left: barLeft, width: barWidth,
                        background: `linear-gradient(90deg, ${statusColor(p.status)}30, ${statusColor(p.status)}60)`,
                        border: `1.5px solid ${statusColor(p.status)}`,
                      }}>
                        <span className="text-[8px] font-bold whitespace-nowrap" style={{ color: statusColor(p.status) }}>
                          {p.status === 'published' ? '✓ Publié' : p.status === 'in-progress' ? `${score}%` : 'Brouillon'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${c.gc}`, minWidth: 800 }}>
                {[
                  { label: 'Publié', color: c.ok },
                  { label: 'En cours', color: c.og },
                  { label: 'Brouillon', color: c.gr },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-8 h-2.5 rounded-full" style={{ background: `${l.color}40`, border: `1.5px solid ${l.color}` }} />
                    <span className="text-[9px] font-semibold" style={{ color: l.color }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
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
    <div className="flex justify-between items-baseline gap-2 py-1.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
      <span className="text-[11px] md:text-[12px] shrink-0" style={{ color: c.gr }}>{label}</span>
      <span className="text-[11px] md:text-[12px] font-semibold text-right" style={{ color: c.mv, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined }}>{value}</span>
    </div>
  );

  return (
    <Card hover={false} className="p-4 md:p-6 mt-4">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
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

const DetailView = ({ project: p, onBack, onUpdate, onToast, onDelete, allProjects }: { project: Project; onBack: () => void; onUpdate: (p: Project) => void; onToast: (msg: string) => void; onDelete: (id: number) => void; allProjects: Project[] }) => {
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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-[13px] cursor-pointer bg-transparent border-none" style={{ color: c.gr }}>
          {icons.chevL} Projets
        </button>
        <div className="flex gap-1.5">
          <Btn variant="secondary" onClick={() => {
            const w = window.open('', '_blank');
            if (!w) return;
            w.document.write('<p>Génération en cours…</p>');
            fetch('/api/export-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })
              .then(r => r.text())
              .then(html => { w.document.open(); w.document.write(html); w.document.close(); })
              .catch(() => { w.close(); onToast('Erreur export PDF'); });
            onToast(`Export PDF : ${p.title}`);
          }}>{icons.download} PDF</Btn>
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
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>{p.title}</h2>
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
      <Card hover={false} className="p-4 md:p-6">
        <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Diagnostic couverture</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {Object.entries(DIAG_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.diag[key] ? c.ok : c.er }} />
              <span className="font-medium" style={{ color: p.diag[key] ? c.ok : c.er }}>{label}</span>
            </div>
          ))}
        </div>
        {p.corrections.length > 0 ? (
          <div className="rounded-lg p-3" style={{ background: '#FFF8F0', border: '1px solid #F4A55A' }}>
            <div className="flex items-center gap-1.5 font-semibold text-xs mb-2" style={{ color: c.og }}>
              {icons.warn} {p.corrections.length} correction{p.corrections.length > 1 ? 's' : ''} requise{p.corrections.length > 1 ? 's' : ''}
            </div>
            {p.corrections.map((fix, i) => (
              <div key={i} className="flex items-start gap-2 text-xs py-0.5" style={{ color: c.nr }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: c.er }} />
                <span>{fix}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center font-semibold text-[13px] py-2" style={{ color: c.ok }}>✓ Couverture conforme — prête pour production</div>
        )}
      </Card>

      {/* 4e de couverture — éditable */}
      <Card hover={false} className="p-4 md:p-6 mt-4">
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
          <div className="rounded-lg p-3 md:p-4" style={{ background: c.ft, border: `1px solid ${c.gc}` }}>
            <div className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: c.nr, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{p.backCover}</div>
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
      <Card hover={false} className="p-4 md:p-6 mt-4">
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

      {/* Série / Connexions */}
      {(p.series || p.collection) && (() => {
        const seriesBooks = p.series ? allProjects.filter(b => b.series === p.series && b.id !== p.id).sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0)) : [];
        const collectionBooks = p.collection ? allProjects.filter(b => b.collection === p.collection && b.id !== p.id) : [];
        const linked = [...seriesBooks, ...collectionBooks.filter(b => !seriesBooks.find(s => s.id === b.id))];
        if (linked.length === 0) return null;
        return (
          <Card hover={false} className="p-4 md:p-6 mt-4">
            <div className="flex justify-between items-center mb-4">
              <div className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>
                {p.series ? `Série : ${p.series}` : `Collection : ${p.collection}`}
              </div>
              <span className="text-[12px]" style={{ color: c.vm }}>{linked.length + 1} titre{linked.length > 0 ? 's' : ''}</span>
            </div>
            <div className="space-y-2">
              {/* Current book highlighted */}
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(200,149,46,0.06)', border: `1px solid ${c.or}` }}>
                <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                <div className="flex-1">
                  <div className="text-[12px] font-semibold" style={{ color: c.or }}>
                    {p.seriesOrder ? `Tome ${p.seriesOrder} — ` : ''}{p.title}
                  </div>
                  <div className="text-[10px]" style={{ color: c.gr }}>{p.pages}p · {p.editions.length} éditions · Actuel</div>
                </div>
              </div>
              {/* Linked books */}
              {linked.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[#FAF7F2] transition-colors" style={{ background: c.ft }}>
                  <CoverThumb emoji={b.cover} coverImage={b.coverImage} size="sm" />
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold" style={{ color: c.mv }}>
                      {b.seriesOrder ? `Tome ${b.seriesOrder} — ` : ''}{b.title}
                    </div>
                    <div className="text-[10px]" style={{ color: c.gr }}>{b.pages}p · {b.editions.length} éditions</div>
                  </div>
                  <Badge bg={b.status === 'published' ? '#D4F0E0' : b.status === 'in-progress' ? '#FDE8D0' : '#F0EDE8'} color={b.status === 'published' ? c.ok : b.status === 'in-progress' ? c.og : c.gr}>
                    {b.status === 'published' ? 'Publié' : b.status === 'in-progress' ? 'En cours' : 'Brouillon'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}

      {/* Historique des modifications */}
      {p.changelog && p.changelog.length > 0 && (
        <Card hover={false} className="p-5 mt-5">
          <div className="flex items-center justify-between mb-4">
            <div className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>📋 Historique</div>
            <Badge bg={c.ft} color={c.gr}>{p.changelog.length}</Badge>
          </div>
          <div className="relative pl-6" style={{ borderLeft: `2px solid ${c.gc}` }}>
            {[...p.changelog].reverse().slice(0, 10).map((entry, i) => (
              <div key={i} className="relative mb-4 last:mb-0">
                <div className="absolute -left-[25px] w-3 h-3 rounded-full border-2" style={{ background: i === 0 ? c.or : 'white', borderColor: i === 0 ? c.or : c.gc, top: 2 }} />
                <div className="text-[10px] font-bold" style={{ color: i === 0 ? c.or : c.gr }}>{entry.date}</div>
                <div className="text-[12px] mt-0.5" style={{ color: c.vm }}>{entry.action}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Gabarit Couverture */}
      <CoverSpecPanel pages={p.pages} genre={p.genre} title={p.title} />

      {/* Éditions / ISBN */}
      <Card hover={false} className="p-4 md:p-6 mt-4">
        <div className="flex justify-between items-center mb-4">
          <div className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Éditions &amp; ISBN</div>
          <span className="text-[12px] font-semibold" style={{ color: c.vm }}>{p.editions.length} format{p.editions.length > 1 ? 's' : ''} · {p.editions.length} ISBN</span>
        </div>
        <div className="space-y-2">
          {p.editions.map((ed, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 md:gap-4 p-3 rounded-lg" style={{ background: c.ft }}>
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
      <Card hover={false} className="p-4 md:p-6 mt-4">
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
  const [selectedDist, setSelectedDist] = useState<Distributor>('pollen');
  const [selectedTrim, setSelectedTrim] = useState('roman-fr');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [paperGSM, setPaperGSM] = useState(80);
  const [showComparison, setShowComparison] = useState(false);

  const dist = DISTRIBUTORS[selectedDist];

  // Generate specs for selected project
  const coverSpec = useMemo(() => {
    if (!selectedProject) return null;
    const coverData: ProjectCoverData = {
      title: selectedProject.title,
      author: selectedProject.author,
      genre: selectedProject.genre,
      collection: selectedProject.collection || undefined,
      pages: selectedProject.pages,
      isbn: selectedProject.editions[0]?.isbn,
      price: selectedProject.editions.find(e => e.price)?.price,
      backCoverText: selectedProject.backCover || undefined,
      hasBarcode: selectedProject.diag?.ean || false,
      hasCoverImage: !!selectedProject.coverImage,
      hasSpineText: selectedProject.diag?.dos || false,
      hasPublisherLogo: selectedProject.diag?.logo || false,
      hasDepotLegal: false,
      hasLegalNotice: false,
      hasPublisherName: true,
      selectedDistributors: [selectedDist],
    };
    return generateCoverSpec(coverData, selectedDist, selectedTrim, 'white', paperGSM);
  }, [selectedProject, selectedDist, selectedTrim, paperGSM]);

  // Comparison view
  const comparison = useMemo(() => {
    if (!selectedProject || !showComparison) return null;
    return compareDistributorSpecs(selectedTrim, selectedProject.pages, 'white', paperGSM);
  }, [selectedProject, selectedTrim, showComparison, paperGSM]);

  // Global audit for all projects
  const globalAudit = useMemo(() => {
    return projects.map(p => {
      const data: ProjectCoverData = {
        title: p.title, author: p.author, genre: p.genre,
        pages: p.pages, isbn: p.editions[0]?.isbn,
        price: p.editions.find(e => e.price)?.price,
        backCoverText: p.backCover || undefined,
        hasBarcode: p.diag?.ean || false,
        hasCoverImage: !!p.coverImage,
        hasSpineText: p.diag?.dos || false,
        hasPublisherLogo: p.diag?.logo || false,
        selectedDistributors: [selectedDist],
      };
      const audit = auditCover(data, selectedDist);
      return { project: p, audit };
    });
  }, [projects, selectedDist]);

  const readyCount = globalAudit.filter(a => a.audit.critical.length === 0).length;
  const issueCount = globalAudit.filter(a => a.audit.critical.length > 0).length;
  const totalIssues = globalAudit.reduce((s, a) => s + a.audit.critical.length, 0);

  return (
    <div>
      <h2 className="text-2xl mb-1" style={{ color: c.mv }}>Couvertures — Cahier des charges</h2>
      <p className="mb-4" style={{ color: c.gr, fontSize: 13 }}>
        Spécifications réelles {dist.name} · Audit automatique · Calcul des dimensions
      </p>

      {/* Distributor selector */}
      <div className="flex gap-2 mb-5">
        {(['pollen', 'kdp', 'ingramspark'] as Distributor[]).map(d => (
          <button key={d} onClick={() => setSelectedDist(d)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: selectedDist === d ? c.or : c.ft,
              color: selectedDist === d ? 'white' : c.mv,
              border: selectedDist === d ? 'none' : `1px solid ${c.gc}`,
            }}>
            {DISTRIBUTORS[d].name}
            <span className="ml-1 opacity-60">({DISTRIBUTORS[d].country})</span>
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="flex gap-3.5 mb-6">
        <StatCard value={readyCount} label={`Prêts ${dist.name}`} accent={c.ok} />
        <StatCard value={issueCount} label="À corriger" accent={c.er} />
        <StatCard value={totalIssues} label="Éléments manquants" accent={c.og} />
        <StatCard value={projects.filter(p => p.coverImage).length} label="Artwork intégré" accent={c.vm} />
      </div>

      {/* Distributor spec summary */}
      <Card hover={false} className="mb-5">
        <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="text-[13px] font-bold" style={{ color: c.mv }}>
            📋 Cahier des charges — {dist.fullName}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
          {[
            ['Fonds perdus', `${dist.bleedMm} mm`],
            ['Format PDF', dist.pdfFormat],
            ['Profil couleur', dist.colorProfile],
            ['Résolution', `${dist.recommendedDPI} DPI`],
            ['Texte dos min.', `${dist.minPagesForSpineText} pages`],
            ['Marge sécurité', `${dist.textSafetyMm} mm`],
            ['Papier couv.', `${dist.coverStockGSM} g/m²`],
            ['Traits de coupe', dist.cropMarksRequired ? 'Obligatoires' : 'Non requis'],
          ].map(([label, value]) => (
            <div key={label as string}>
              <div className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: c.gr }}>{label}</div>
              <div className="text-[12px] font-semibold" style={{ color: c.mv }}>{value}</div>
            </div>
          ))}
        </div>
        {/* Barcode spec */}
        <div className="px-3 md:px-5 pb-3">
          <div className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: c.gr }}>Code-barres</div>
          <div className="text-[12px]" style={{ color: c.mv }}>{dist.barcodeSpec}</div>
        </div>
        {/* Specific rules */}
        <div className="px-3 md:px-5 pb-4">
          <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.gr }}>Règles spécifiques {dist.name}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {dist.specificRules.map((rule, i) => (
              <div key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: c.nr }}>
                <span style={{ color: c.or }}>▸</span> {rule}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Project list with audit */}
      <Card hover={false} className="mb-5">
        <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.vm}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>
            Audit couvertures — {dist.name}
          </span>
        </div>
        {globalAudit.map(({ project: p, audit }) => {
          const isSelected = selectedProject?.id === p.id;
          return (
            <div key={p.id}>
              <div
                className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-3 cursor-pointer hover:bg-[#FAF7F2]"
                style={{ borderBottom: `1px solid ${c.ft}`, background: isSelected ? '#F5F0E8' : undefined }}
                onClick={() => setSelectedProject(isSelected ? null : p)}>
                <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                <span className="flex-1 text-[13px] font-semibold" style={{ color: c.mv }}>{p.title}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                  style={{
                    background: audit.critical.length === 0 ? '#D4F0E0' : '#FFE0D0',
                    color: audit.critical.length === 0 ? c.ok : c.er,
                  }}>
                  {audit.critical.length === 0 ? `✓ ${audit.score}/${audit.maxScore}` : `${audit.critical.length} manquant${audit.critical.length > 1 ? 's' : ''}`}
                </span>
                <span className="text-[10px]" style={{ color: c.gr }}>{isSelected ? '▼' : '▶'}</span>
              </div>

              {/* Expanded audit detail */}
              {isSelected && coverSpec && (
                <div className="px-3 md:px-5 py-3" style={{ background: '#FAFAF5', borderBottom: `1px solid ${c.ft}` }}>

                  {/* Trim + paper selectors */}
                  <div className="flex gap-3 mb-4 flex-wrap">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-semibold block mb-1" style={{ color: c.gr }}>Format</label>
                      <select value={selectedTrim} onChange={e => setSelectedTrim(e.target.value)}
                        className="text-[12px] px-3 py-1.5 rounded-lg border" style={{ borderColor: c.gc, color: c.mv, background: 'white' }}>
                        <optgroup label="Formats français">
                          {Object.entries(TRIM_SIZES).filter(([, v]) => v.label.includes('mm) ')).slice(0, 6).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Formats internationaux">
                          {Object.entries(TRIM_SIZES).filter(([, v]) => v.label.includes('"')).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-semibold block mb-1" style={{ color: c.gr }}>Papier intérieur</label>
                      <select value={paperGSM} onChange={e => setPaperGSM(Number(e.target.value))}
                        className="text-[12px] px-3 py-1.5 rounded-lg border" style={{ borderColor: c.gc, color: c.mv, background: 'white' }}>
                        <option value={80}>80 g/m² offset blanc</option>
                        <option value={90}>90 g/m² offset</option>
                        <option value={100}>100 g/m²</option>
                        <option value={120}>120 g/m²</option>
                        <option value={150}>150 g/m² couché mat</option>
                      </select>
                    </div>
                    <div className="ml-auto flex items-end">
                      <button onClick={() => setShowComparison(!showComparison)}
                        className="text-[11px] px-3 py-1.5 rounded-lg font-semibold"
                        style={{ background: showComparison ? c.or : c.ft, color: showComparison ? 'white' : c.mv }}>
                        {showComparison ? '✕ Fermer' : '⟷ Comparer 3 distributeurs'}
                      </button>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      ['Format fini', `${coverSpec.dimensions.trimWidthMm} × ${coverSpec.dimensions.trimHeightMm} mm`],
                      ['Dos', `${coverSpec.dimensions.spineWidthMm.toFixed(1)} mm`],
                      ['Planche totale', `${coverSpec.dimensions.totalWidthMm.toFixed(1)} × ${coverSpec.dimensions.totalHeightMm.toFixed(1)} mm`],
                      ['Pixels @300dpi', `${coverSpec.dimensions.totalWidthPx} × ${coverSpec.dimensions.totalHeightPx} px`],
                    ].map(([label, value]) => (
                      <div key={label as string} className="p-3 rounded-lg" style={{ background: 'white', border: `1px solid ${c.gc}` }}>
                        <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>{label}</div>
                        <div className="text-[13px] font-bold mt-1" style={{ color: c.mv, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Warnings */}
                  {coverSpec.dimensions.warnings.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg" style={{ background: '#FFF8E0', border: '1px solid #F0D060' }}>
                      {coverSpec.dimensions.warnings.map((w, i) => (
                        <div key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: '#8B6914' }}>
                          <span>⚠</span> {w}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Audit checklist */}
                  <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.gr }}>
                      Checklist couverture — {dist.name}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {coverSpec.checklist.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg"
                          style={{
                            background: item.done ? '#E8F5E8' : (item.required ? '#FFE8E0' : '#F5F0E8'),
                            border: `1px solid ${item.done ? '#A8D8A8' : (item.required ? '#FFB8A0' : c.gc)}`,
                          }}>
                          <span className="text-[14px]">{item.done ? '✓' : (item.required ? '✗' : '○')}</span>
                          <div className="flex-1">
                            <div className="text-[11px] font-semibold" style={{ color: item.done ? c.ok : (item.required ? c.er : c.gr) }}>
                              {item.label} {item.required && !item.done && <span className="text-[9px] font-bold ml-1">REQUIS</span>}
                            </div>
                            <div className="text-[10px]" style={{ color: c.gr }}>{item.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audit details with fix instructions */}
                  {coverSpec.audit.critical.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.er }}>
                        Actions requises ({coverSpec.audit.critical.length})
                      </div>
                      {coverSpec.audit.critical.map((item, i) => (
                        <div key={i} className="p-3 rounded-lg mb-1.5" style={{ background: '#FFF5F0', border: '1px solid #FFD0C0' }}>
                          <div className="text-[12px] font-semibold" style={{ color: c.er }}>✗ {item.label}</div>
                          <div className="text-[11px] mt-1" style={{ color: c.nr }}>{item.message}</div>
                          {item.fix && (
                            <div className="text-[11px] mt-1.5 p-2 rounded" style={{ background: '#FFF0E8', color: '#7A4A00' }}>
                              💡 {item.fix}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Export spec summary */}
                  <div className="p-4 rounded-lg" style={{ background: 'white', border: `1px solid ${c.gc}` }}>
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.or }}>
                      Spécifications d'export — {dist.name}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        ['Format', coverSpec.exportSpec.format],
                        ['Couleur', coverSpec.exportSpec.colorProfile],
                        ['Résolution', coverSpec.exportSpec.resolution],
                        ['Fonds perdus', coverSpec.exportSpec.bleed],
                        ['Traits de coupe', coverSpec.exportSpec.cropMarks ? 'Oui — obligatoires' : 'Non'],
                        ['Taille planche', coverSpec.exportSpec.totalSize],
                        ['Largeur dos', coverSpec.exportSpec.spineWidth],
                      ].map(([label, value]) => (
                        <div key={label as string}>
                          <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>{label}</div>
                          <div className="text-[11px] font-semibold mt-0.5" style={{ color: c.mv }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Publisher Charter — Charte éditoriale */}
                  {(() => {
                    const charter = JABRILIA_CHARTER; // TODO: load from user's publisher profile
                    const typoRec = getCoverTypoRecommendation(p.genre, p.collection || undefined, charter);
                    const charterAudit = auditCoverAgainstCharter({
                      title: p.title, author: p.author, genre: p.genre,
                      collection: p.collection || undefined, pages: p.pages,
                      backCover: p.backCover || undefined,
                    }, charter);
                    const col = typoRec.collection;

                    return (
                      <div className="mt-4 p-4 rounded-lg" style={{ background: '#FDFAF5', border: `2px solid ${c.or}` }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: c.or }}>
                            Charte {charter.fullName}
                          </div>
                          <div className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: '#FFF5E0', color: c.or }}>
                            {col.name}
                          </div>
                        </div>

                        {/* Typography recommendations */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          <div className="p-2 rounded-lg" style={{ background: 'white', border: `1px solid ${c.gc}` }}>
                            <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Titre couverture</div>
                            <div className="text-[12px] font-bold mt-0.5" style={{ color: c.mv, fontFamily: typoRec.title.fallback }}>
                              {typoRec.title.fontFamily} {typoRec.title.sizePt}pt
                            </div>
                            <div className="text-[9px] mt-0.5" style={{ color: c.gr }}>{typoRec.title.alignment}, couleur {typoRec.title.color}</div>
                          </div>
                          <div className="p-2 rounded-lg" style={{ background: 'white', border: `1px solid ${c.gc}` }}>
                            <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Auteur couverture</div>
                            <div className="text-[12px] font-bold mt-0.5" style={{ color: c.mv, fontFamily: typoRec.author.fallback }}>
                              {typoRec.author.fontFamily} {typoRec.author.sizePt}pt
                            </div>
                            <div className="text-[9px] mt-0.5" style={{ color: c.gr }}>{typoRec.author.alignment}</div>
                          </div>
                          <div className="p-2 rounded-lg" style={{ background: 'white', border: `1px solid ${c.gc}` }}>
                            <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Texte 4e</div>
                            <div className="text-[12px] font-bold mt-0.5" style={{ color: c.mv, fontFamily: typoRec.backText.fallback }}>
                              {typoRec.backText.fontFamily} {typoRec.backText.sizePt}pt
                            </div>
                            <div className="text-[9px] mt-0.5" style={{ color: c.gr }}>{typoRec.backText.alignment}</div>
                          </div>
                        </div>

                        {/* Collection palette */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Palette</div>
                          {Object.entries(col.palette).map(([key, color]) => (
                            <div key={key} className="flex items-center gap-1">
                              <div style={{ width: 14, height: 14, borderRadius: 4, background: color, border: '1px solid rgba(0,0,0,0.1)' }} />
                              <span className="text-[8px]" style={{ color: c.gr }}>{key}</span>
                            </div>
                          ))}
                        </div>

                        {/* Format & paper */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                          {[
                            ['Format', col.formatLabel],
                            ['Papier int.', col.paperType],
                            ['Couverture', `${col.coverPaperGSM}g ${col.coverFinish}`],
                            ['Dos min. texte', `${col.separatorStyle}`],
                          ].map(([label, value]) => (
                            <div key={label as string} className="text-[10px]">
                              <span className="font-semibold" style={{ color: c.gr }}>{label} : </span>
                              <span style={{ color: c.mv }}>{value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Back cover layout */}
                        <div className="mb-3">
                          <div className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: c.gr }}>
                            Structure 4e de couverture ({charter.name})
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {charter.coverRules.backCoverLayout.map((item, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#F0EBE0', color: c.mv }}>
                                {i > 0 && <span style={{ color: c.or }}> → </span>}{item}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Collection-specific notes */}
                        {col.notes.length > 0 && (
                          <div>
                            <div className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: c.gr }}>
                              Règles {col.name}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
                              {col.notes.map((note, i) => (
                                <div key={i} className="text-[10px] flex items-start gap-1" style={{ color: c.nr }}>
                                  <span style={{ color: c.or }}>▸</span> {note}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Comparison table */}
                  {showComparison && comparison && (
                    <div className="mt-4 p-4 rounded-lg" style={{ background: 'white', border: `1px solid ${c.gc}` }}>
                      <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: c.vm }}>
                        Comparaison 3 distributeurs — {p.title} ({p.pages} pages)
                      </div>
                      <div style={{overflowX:"auto",maxWidth:"100%"}}><table className="w-full text-[11px]">
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${c.gc}` }}>
                            <th className="text-left py-2 font-semibold" style={{ color: c.gr }}></th>
                            <th className="text-center py-2 font-semibold" style={{ color: c.or }}>Pollen (FR)</th>
                            <th className="text-center py-2 font-semibold" style={{ color: c.vm }}>KDP</th>
                            <th className="text-center py-2 font-semibold" style={{ color: '#1E40AF' }}>IngramSpark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['Fonds perdus', `${comparison.pollen.bleedMm} mm`, `${comparison.kdp.bleedMm} mm`, `${comparison.ingramspark.bleedMm} mm`],
                            ['Dos', `${comparison.pollen.spineWidthMm.toFixed(1)} mm`, `${comparison.kdp.spineWidthMm.toFixed(1)} mm`, `${comparison.ingramspark.spineWidthMm.toFixed(1)} mm`],
                            ['Planche', `${comparison.pollen.totalWidthMm.toFixed(0)} × ${comparison.pollen.totalHeightMm.toFixed(0)}`, `${comparison.kdp.totalWidthMm.toFixed(0)} × ${comparison.kdp.totalHeightMm.toFixed(0)}`, `${comparison.ingramspark.totalWidthMm.toFixed(0)} × ${comparison.ingramspark.totalHeightMm.toFixed(0)}`],
                            ['Pixels', `${comparison.pollen.totalWidthPx} × ${comparison.pollen.totalHeightPx}`, `${comparison.kdp.totalWidthPx} × ${comparison.kdp.totalHeightPx}`, `${comparison.ingramspark.totalWidthPx} × ${comparison.ingramspark.totalHeightPx}`],
                            ['Texte dos', comparison.pollen.canHaveSpineText ? 'Oui' : 'Non', comparison.kdp.canHaveSpineText ? 'Oui' : 'Non', comparison.ingramspark.canHaveSpineText ? 'Oui' : 'Non'],
                            ['Sécurité texte', `${comparison.pollen.textSafetyMm} mm`, `${comparison.kdp.textSafetyMm} mm`, `${comparison.ingramspark.textSafetyMm} mm`],
                            ['PDF', DISTRIBUTORS.pollen.pdfFormat, DISTRIBUTORS.kdp.pdfFormat, DISTRIBUTORS.ingramspark.pdfFormat],
                            ['Couleur', DISTRIBUTORS.pollen.colorProfile, DISTRIBUTORS.kdp.colorProfile, DISTRIBUTORS.ingramspark.colorProfile],
                          ].map((row, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${c.ft}` }}>
                              <td className="py-1.5 font-semibold" style={{ color: c.gr }}>{row[0]}</td>
                              <td className="py-1.5 text-center" style={{ color: c.mv }}>{row[1]}</td>
                              <td className="py-1.5 text-center" style={{ color: c.mv }}>{row[2]}</td>
                              <td className="py-1.5 text-center" style={{ color: c.mv }}>{row[3]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table></div>
                      <div className="mt-3 text-[10px] p-2 rounded" style={{ background: '#F5F0FF', color: '#5B3E8A' }}>
                        ⚠ Le dos diffère entre distributeurs — il faut un fichier couverture PAR distributeur.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {/* Distributor notes */}
      <Card hover={false}>
        <div className="px-3 md:px-5 py-3" style={{ borderBottom: `1px solid ${c.ft}` }}>
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.gr }}>Notes {dist.name}</span>
        </div>
        <div className="px-3 md:px-5 py-3">
          {dist.notes.map((note, i) => (
            <div key={i} className="text-[11px] flex items-start gap-2 mb-1.5" style={{ color: c.nr }}>
              <span style={{ color: c.or }}>•</span> {note}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// --- COVER STUDIO ---
const CoverStudioView = ({ projects, onToast }: { projects: Project[]; onToast: (msg: string) => void }) => {
  const [step, setStep] = useState<CoverStudioStep>('upload');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDist, setSelectedDist] = useState<Distributor>('pollen');
  const [coverStyle, setCoverStyle] = useState<'literary' | 'commercial' | 'artistic' | 'minimalist'>('literary');
  const [showPrompts, setShowPrompts] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showSocial, setShowSocial] = useState(false);

  // Generation state
  const [generating, setGenerating] = useState<string | null>(null); // 'dalle' | 'cover-pdf' | 'social-X' | 'runway'
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string | null>(null);
  const [runwayTaskId, setRunwayTaskId] = useState<string | null>(null);
  const [runwayVideoUrl, setRunwayVideoUrl] = useState<string | null>(null);

  // Load API keys from settings
  const getApiKey = (key: string): string | null => {
    try { const s = localStorage.getItem('jabr-settings'); return s ? JSON.parse(s)[key] || null : null; } catch { return null; }
  };

  const charter = JABRILIA_CHARTER;

  const coverProject = useMemo((): CoverProject | null => {
    if (!selectedProject) return null;
    return {
      title: selectedProject.title,
      subtitle: selectedProject.subtitle,
      author: selectedProject.author,
      genre: selectedProject.genre,
      collection: selectedProject.collection || undefined,
      pages: selectedProject.pages,
      isbn: selectedProject.editions[0]?.isbn,
      price: selectedProject.editions.find(e => e.price)?.price,
      backCoverText: selectedProject.backCover || undefined,
      publisherName: charter.fullName,
      coverImageUrl: selectedProject.coverImage || undefined,
      coverImageSource: selectedProject.coverImage ? 'upload' : undefined,
      distributor: selectedDist,
      trimSizeKey: selectedProject.genre.toLowerCase().includes('bd') ? 'BD'
        : (selectedProject.collection?.toLowerCase().includes('étincelles') || selectedProject.genre.toLowerCase().includes('jeunesse')) ? 'A5'
        : selectedProject.genre.toLowerCase().includes('poche') ? 'poche'
        : 'roman-fr',
      paperGSM: selectedProject.genre.toLowerCase().includes('bd') ? 150
        : (selectedProject.collection?.toLowerCase().includes('étincelles') || selectedProject.genre.toLowerCase().includes('jeunesse')) ? 90
        : 80,
    };
  }, [selectedProject, selectedDist]);

  const layout = useMemo(() => {
    if (!coverProject) return null;
    return generateCoverLayout(coverProject, charter);
  }, [coverProject]);

  const prompts = useMemo(() => {
    if (!coverProject) return null;
    return generateCoverImagePrompt(coverProject, coverStyle);
  }, [coverProject, coverStyle]);

  const trailer = useMemo(() => {
    if (!coverProject) return null;
    return generateTrailerBrief(coverProject, 15);
  }, [coverProject]);

  const marketingTexts = useMemo(() => {
    if (!coverProject) return null;
    return generateMarketingTexts(coverProject);
  }, [coverProject]);

  const steps: { id: CoverStudioStep; label: string; num: number }[] = [
    { id: 'upload', label: 'Sélection', num: 1 },
    { id: 'audit', label: 'Audit', num: 2 },
    { id: 'assemble', label: 'Assemblage', num: 3 },
    { id: 'marketing', label: 'Marketing Pack', num: 4 },
    { id: 'trailer', label: 'Bande-annonce', num: 5 },
    { id: 'export', label: 'Export', num: 6 },
  ];

  return (
    <div>
      <h2 className="text-2xl mb-1" style={{ color: c.mv }}>Cover Studio</h2>
      <p className="mb-4" style={{ color: c.gr, fontSize: 13 }}>
        De la couverture vierge au pack marketing complet
      </p>

      {/* Progress steps */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button onClick={() => setStep(s.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap"
              style={{
                background: step === s.id ? c.or : c.ft,
                color: step === s.id ? 'white' : c.mv,
                border: step === s.id ? 'none' : `1px solid ${c.gc}`,
              }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                style={{ background: step === s.id ? 'rgba(255,255,255,0.3)' : c.gc, color: step === s.id ? 'white' : c.gr }}>
                {s.num}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && <span className="text-[10px] mx-1" style={{ color: c.gc }}>→</span>}
          </div>
        ))}
      </div>

      {/* STEP 1: Select project */}
      {step === 'upload' && (
        <div>
          <Card hover={false} className="mb-4">
            <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.vm}` }}>
              <span className="text-[12px] font-bold" style={{ color: c.mv }}>1. Choisir un titre</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {projects.map(p => (
                  <div key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                    style={{
                      background: selectedProject?.id === p.id ? '#F0EBE0' : 'white',
                      border: `2px solid ${selectedProject?.id === p.id ? c.or : c.gc}`,
                    }}
                    onClick={() => setSelectedProject(p)}>
                    <CoverThumb emoji={p.cover} coverImage={p.coverImage} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold truncate" style={{ color: c.mv }}>{p.title}</div>
                      <div className="text-[10px]" style={{ color: c.gr }}>{p.genre} · {p.pages}p</div>
                      <div className="text-[10px] mt-0.5" style={{ color: p.coverImage ? c.ok : c.og }}>
                        {p.coverImage ? '✓ Artwork' : '○ Sans couverture'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {selectedProject && (
            <>
              {/* Distributor + No cover? */}
              <div className="flex gap-3 mb-4">
                <Card hover={false} className="flex-1">
                  <div className="p-4">
                    <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.gr }}>Distributeur cible</div>
                    <div className="flex gap-2">
                      {(['pollen', 'kdp', 'ingramspark'] as Distributor[]).map(d => (
                        <button key={d} onClick={() => setSelectedDist(d)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                          style={{ background: selectedDist === d ? c.or : c.ft, color: selectedDist === d ? 'white' : c.mv }}>
                          {DISTRIBUTORS[d].name}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* No cover? Generate with AI */}
              {!selectedProject.coverImage && (
                <Card hover={false} className="mb-4">
                  <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.vm}` }}>
                    <span className="text-[12px] font-bold" style={{ color: c.vm }}>Pas de couverture ? Générez-en une</span>
                  </div>
                  <div className="p-4">
                    <div className="text-[11px] mb-3" style={{ color: c.nr }}>
                      Choisissez un style et copiez le prompt vers DALL-E ou Midjourney.
                    </div>
                    <div className="flex gap-2 mb-4">
                      {(['literary', 'commercial', 'artistic', 'minimalist'] as const).map(s => (
                        <button key={s} onClick={() => { setCoverStyle(s); setShowPrompts(true); }}
                          className="px-3 py-2 rounded-lg text-[11px] font-semibold"
                          style={{ background: coverStyle === s ? c.vm : c.ft, color: coverStyle === s ? 'white' : c.mv }}>
                          {s === 'literary' ? 'Littéraire' : s === 'commercial' ? 'Commercial' : s === 'artistic' ? 'Artistique' : 'Minimaliste'}
                        </button>
                      ))}
                    </div>
                    {showPrompts && prompts && (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg" style={{ background: '#F5F0FF', border: `1px solid #D0C0FF` }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold" style={{ color: c.vm }}>Prompt DALL-E 3</span>
                            <button onClick={() => { navigator.clipboard.writeText(prompts.dalle); onToast('Prompt DALL-E copié'); }}
                              className="text-[10px] px-2 py-0.5 rounded" style={{ background: c.vm, color: 'white' }}>Copier</button>
                          </div>
                          <div className="text-[10px] leading-relaxed" style={{ color: c.nr }}>{prompts.dalle}</div>
                        </div>
                        <div className="p-3 rounded-lg" style={{ background: '#F0F5FF', border: `1px solid #C0D0FF` }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold" style={{ color: '#1E40AF' }}>Prompt Midjourney</span>
                            <button onClick={() => { navigator.clipboard.writeText(prompts.midjourney); onToast('Prompt Midjourney copié'); }}
                              className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#1E40AF', color: 'white' }}>Copier</button>
                          </div>
                          <div className="text-[10px] leading-relaxed font-mono" style={{ color: c.nr }}>{prompts.midjourney}</div>
                        </div>

                        {/* DALL-E Generate button */}
                        <div className="p-3 rounded-lg" style={{ background: '#F0FFF0', border: '1px solid #A0E0A0' }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-[11px] font-bold" style={{ color: '#166534' }}>Générer directement avec DALL-E 3</div>
                              <div className="text-[9px]" style={{ color: '#4B7A3E' }}>
                                {getApiKey('openaiKey') ? 'Clé API configurée ✓' : 'Configurez votre clé OpenAI dans Paramètres'}
                              </div>
                            </div>
                            <button
                              disabled={!getApiKey('openaiKey') || generating === 'dalle'}
                              onClick={async () => {
                                const key = getApiKey('openaiKey');
                                if (!key || !prompts) return;
                                setGenerating('dalle');
                                onToast('Génération DALL-E en cours…');
                                const result = await generateImageWithDALLE(prompts.dalle, key);
                                setGenerating(null);
                                if (result.imageUrl) {
                                  setGeneratedCoverUrl(result.imageUrl);
                                  onToast('Image générée ! Passez à l\'étape suivante.');
                                } else {
                                  onToast(`Erreur: ${result.error}`);
                                }
                              }}
                              className="text-[11px] px-4 py-2 rounded-lg font-semibold"
                              style={{
                                background: getApiKey('openaiKey') ? (generating === 'dalle' ? '#9CA3AF' : '#16a34a') : '#D1D5DB',
                                color: 'white', border: 'none', cursor: getApiKey('openaiKey') && generating !== 'dalle' ? 'pointer' : 'not-allowed',
                              }}>
                              {generating === 'dalle' ? '⏳ Génération…' : '🎨 Générer'}
                            </button>
                          </div>
                        </div>

                        {/* Generated image preview */}
                        {generatedCoverUrl && (
                          <div className="p-3 rounded-lg" style={{ background: '#FEFCE8', border: '1px solid #FDE047' }}>
                            <div className="text-[10px] font-bold mb-2" style={{ color: '#854D0E' }}>Image générée par DALL-E 3</div>
                            <img src={generatedCoverUrl} alt="Generated cover" className="rounded-lg w-full" style={{ maxHeight: 300, objectFit: 'contain' }} />
                            <button onClick={() => { window.open(generatedCoverUrl, '_blank'); }}
                              className="mt-2 text-[10px] px-3 py-1 rounded font-semibold" style={{ background: c.or, color: 'white', border: 'none', cursor: 'pointer' }}>
                              Télécharger l'image HD
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              <button onClick={() => setStep('audit')}
                className="px-4 md:px-6 py-2 rounded-lg text-[12px] md:text-[13px] font-semibold"
                style={{ background: c.or, color: 'white' }}>
                Suivant → Audit couverture
              </button>
            </>
          )}
        </div>
      )}

      {/* STEP 2: Audit */}
      {step === 'audit' && layout && coverProject && (
        <div>
          <Card hover={false} className="mb-4">
            <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
              <span className="text-[12px] font-bold" style={{ color: c.mv }}>
                2. Audit — Ce que JABR va ajouter sur la couverture
              </span>
            </div>
            <div className="p-4">
              <div className="text-[11px] mb-4" style={{ color: c.gr }}>
                JABR va assembler tous ces éléments selon les specs {DISTRIBUTORS[selectedDist].name} + la charte {charter.name}.
              </div>

              {/* What will be placed */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Front */}
                <div className="p-3 rounded-lg" style={{ background: '#F5FAF5', border: '1px solid #C0E0C0' }}>
                  <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: c.ok }}>1re de couverture (C1)</div>
                  {[
                    ['Titre', layout.front.title.text, `${layout.front.title.fontFamily} ${layout.front.title.sizePt}pt`],
                    ['Auteur', layout.front.author.text, `${layout.front.author.fontFamily} ${layout.front.author.sizePt}pt`],
                    ['Logo éditeur', charter.fullName, `Position: bas centre`],
                    layout.front.genre ? ['Collection', layout.front.genre.text, `${layout.front.genre.sizePt}pt`] : null,
                  ].filter(Boolean).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1.5">
                      <span className="text-[12px]" style={{ color: c.ok }}>✓</span>
                      <div>
                        <div className="text-[11px] font-semibold" style={{ color: c.mv }}>{(item as string[])[0]}</div>
                        <div className="text-[10px]" style={{ color: c.gr }}>{(item as string[])[1]} — {(item as string[])[2]}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Spine */}
                <div className="p-3 rounded-lg" style={{ background: '#FFF8F0', border: '1px solid #F0D0A0' }}>
                  <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: c.og }}>
                    Dos ({layout.spine.widthMm.toFixed(1)} mm)
                  </div>
                  {layout.spine.canHaveText ? (
                    <>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[12px]" style={{ color: c.ok }}>✓</span>
                        <div>
                          <div className="text-[11px] font-semibold" style={{ color: c.mv }}>Titre</div>
                          <div className="text-[10px]" style={{ color: c.gr }}>{layout.spine.title?.text}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[12px]" style={{ color: c.ok }}>✓</span>
                        <div>
                          <div className="text-[11px] font-semibold" style={{ color: c.mv }}>Auteur</div>
                          <div className="text-[10px]" style={{ color: c.gr }}>{layout.spine.author?.text}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px]" style={{ color: c.og }}>
                      Dos trop fin — pas de texte
                    </div>
                  )}
                </div>

                {/* Back */}
                <div className="p-3 rounded-lg" style={{ background: '#F5F0FF', border: '1px solid #D0C0FF' }}>
                  <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: c.vm }}>4e de couverture (C4)</div>
                  {[
                    ['Texte 4e', coverProject.backCoverText ? `${coverProject.backCoverText.length} car.` : 'À rédiger', `${layout.back.backText.fontFamily} ${layout.back.backText.sizePt}pt`],
                    ['ISBN', layout.back.isbn.text, 'JetBrains Mono 8pt'],
                    ['Code-barres EAN', selectedDist === 'kdp' ? 'Auto KDP' : `${layout.back.barcode.widthMm}×${layout.back.barcode.heightMm}mm`, selectedDist === 'kdp' ? 'Ajouté par KDP' : 'Noir 100%K sur blanc'],
                    ['Prix TTC', coverProject.price || 'À définir', 'JetBrains Mono 9pt'],
                    ['Éditeur', charter.fullName, `${layout.back.publisherName.sizePt}pt`],
                    layout.back.depotLegal ? ['Dépôt légal', layout.back.depotLegal.text, '7pt'] : null,
                    layout.back.legalNotice ? ['Mention légale', layout.back.legalNotice.text, '7pt'] : null,
                  ].filter(Boolean).map((item, i) => {
                    const arr = item as string[];
                    const isMissing = arr[1].includes('rédiger') || arr[1].includes('définir');
                    return (
                      <div key={i} className="flex items-center gap-2 mb-1.5">
                        <span className="text-[12px]" style={{ color: isMissing ? c.er : c.ok }}>{isMissing ? '✗' : '✓'}</span>
                        <div>
                          <div className="text-[11px] font-semibold" style={{ color: c.mv }}>{arr[0]}</div>
                          <div className="text-[10px]" style={{ color: c.gr }}>{arr[1]} — {arr[2]}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dimensions summary */}
              <div className="mt-4 p-3 rounded-lg" style={{ background: c.ft }}>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    ['Planche', `${layout.dimensions.totalWidthMm.toFixed(1)} × ${layout.dimensions.totalHeightMm.toFixed(1)} mm`],
                    ['Pixels', `${layout.dimensions.totalWidthPx} × ${layout.dimensions.totalHeightPx}`],
                    ['Dos', `${layout.dimensions.spineWidthMm.toFixed(1)} mm`],
                    ['Bleed', `${layout.dimensions.bleedMm} mm`],
                    ['PDF', DISTRIBUTORS[selectedDist].pdfFormat],
                  ].map(([l, v]) => (
                    <div key={l as string}>
                      <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>{l}</div>
                      <div className="text-[11px] font-bold" style={{ color: c.mv, fontFamily: "'JetBrains Mono', monospace" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            <button onClick={() => setStep('upload')} className="px-4 py-2 rounded-lg text-[12px]" style={{ border: `1px solid ${c.gc}`, color: c.mv }}>← Retour</button>
            <button onClick={() => setStep('assemble')} className="px-4 md:px-6 py-2 rounded-lg text-[12px] font-semibold" style={{ background: c.or, color: 'white' }}>Suivant → Assemblage</button>
          </div>
        </div>
      )}

      {/* STEP 3: Assembly preview */}
      {step === 'assemble' && layout && coverProject && selectedProject && (() => {
        const d = layout.dimensions;
        const col = getCoverTypoRecommendation(coverProject.genre, coverProject.collection, charter);
        const palette = col.collection?.palette || { primary: c.mv, secondary: c.or, accent: '#5B3E8A', background: '#FAF7F2', text: c.mv, muted: c.gr };
        const hasCover = !!selectedProject.coverImage;
        return (
        <div>
          {/* ═══ FRONT COVER — Hero Preview ═══ */}
          <Card hover={false} className="mb-4">
            <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.ok}` }}>
              <span className="text-[12px] font-bold" style={{ color: c.mv }}>
                3. Couverture assemblée — Rendu éditorial
              </span>
            </div>

            {/* Front cover — large, centered */}
            <div className="flex justify-center py-6 md:py-8" style={{ background: '#E8E4DE' }}>
              <div style={{
                width: 240, minHeight: 360,
                borderRadius: '2px 6px 6px 2px',
                boxShadow: '8px 8px 24px rgba(0,0,0,0.25), 2px 2px 8px rgba(0,0,0,0.15), inset -2px 0 6px rgba(0,0,0,0.08)',
                overflow: 'hidden', position: 'relative',
                background: hasCover ? undefined : palette.background,
                backgroundImage: hasCover ? `url(${selectedProject.coverImage})` : undefined,
                backgroundSize: 'cover', backgroundPosition: 'center',
              }}>
                {/* Overlay for text on image */}
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', padding: '24px 20px',
                  background: hasCover ? 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.05) 65%, rgba(0,0,0,0.5) 100%)' : 'none',
                }}>
                  {/* Author — top */}
                  <div style={{
                    textAlign: 'center', fontFamily: "'EB Garamond', 'Garamond', Georgia, serif",
                    fontSize: 12, letterSpacing: 3, textTransform: 'uppercase',
                    color: hasCover ? 'rgba(255,255,255,0.9)' : palette.text,
                    textShadow: hasCover ? '0 1px 4px rgba(0,0,0,0.6)' : 'none',
                  }}>
                    {coverProject.author}
                  </div>

                  {/* Title — center */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700,
                      fontSize: coverProject.title.length > 25 ? 20 : 24, lineHeight: 1.15,
                      color: hasCover ? 'white' : palette.primary,
                      textShadow: hasCover ? '0 2px 8px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.3)' : 'none',
                    }}>
                      {coverProject.title}
                    </div>
                    {coverProject.subtitle && (
                      <div style={{
                        fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
                        fontSize: 11, marginTop: 6, lineHeight: 1.3,
                        color: hasCover ? 'rgba(255,255,255,0.85)' : palette.muted,
                        textShadow: hasCover ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
                      }}>
                        {coverProject.subtitle}
                      </div>
                    )}
                  </div>

                  {/* Publisher — bottom */}
                  <div style={{
                    textAlign: 'center', fontFamily: "'Inter', sans-serif",
                    fontSize: 8, letterSpacing: 4, textTransform: 'uppercase',
                    color: hasCover ? 'rgba(255,255,255,0.7)' : palette.muted,
                    textShadow: hasCover ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
                  }}>
                    {charter.fullName}
                  </div>
                </div>
                {/* Book spine edge effect */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(90deg, rgba(0,0,0,0.15), transparent)' }} />
              </div>
            </div>
          </Card>

          {/* ═══ FULL SPREAD — Technical view ═══ */}
          <Card hover={false} className="mb-4">
            <div className="px-3 md:px-5 py-3" style={{ borderBottom: `1px solid ${c.gc}` }}>
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-[11px] font-semibold" style={{ color: c.gr }}>Planche complète (C4 + Dos + C1)</span>
                <span className="text-[10px] font-mono" style={{ color: c.or }}>
                  {d.totalWidthMm.toFixed(0)} × {d.totalHeightMm.toFixed(0)} mm · {d.totalWidthPx} × {d.totalHeightPx} px
                </span>
              </div>
            </div>
            <div className="p-3 md:p-4 overflow-x-auto" style={{ background: '#F0EDE8' }}>
              <div className="flex mx-auto" style={{ width: 'fit-content' }}>
                {/* C4 — Back */}
                <div style={{
                  width: 160, minHeight: 240, padding: 12,
                  background: 'white', borderRadius: '4px 0 0 4px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  boxShadow: '-3px 3px 10px rgba(0,0,0,0.1)',
                }}>
                  <div>
                    <div style={{ fontSize: 8, color: c.gr, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>4e de couverture</div>
                    <div style={{ fontSize: 8, lineHeight: 1.5, color: c.nr, fontFamily: "'EB Garamond', Georgia, serif" }}>
                      {coverProject.backCoverText ? coverProject.backCoverText.slice(0, 200) + '…' : 'Texte à rédiger…'}
                    </div>
                  </div>
                  <div style={{ borderTop: `1px solid ${c.ft}`, paddingTop: 8 }}>
                    <div style={{ fontSize: 7, color: c.gr, marginBottom: 4 }}>{charter.fullName}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: c.mv }}>
                      {coverProject.isbn || '978-2-488647-XX-X'}
                    </div>
                    <div style={{ width: 50, height: 16, background: '#F5F3EF', border: `1px solid ${c.gc}`, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 6, color: c.gr }}>EAN-13</span>
                    </div>
                    {coverProject.price && <div style={{ fontSize: 8, fontWeight: 700, color: c.mv, marginTop: 4 }}>{coverProject.price}</div>}
                  </div>
                </div>

                {/* Spine */}
                <div style={{
                  width: Math.max(16, Math.round(d.spineWidthMm * 1.2)),
                  minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: hasCover ? palette.primary : '#F5F0E8',
                  borderLeft: `1px solid rgba(0,0,0,0.1)`, borderRight: `1px solid rgba(0,0,0,0.1)`,
                }}>
                  {layout.spine.canHaveText && (
                    <div style={{
                      writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                      fontSize: 7, fontWeight: 600, letterSpacing: 0.5,
                      color: hasCover ? 'rgba(255,255,255,0.9)' : c.mv,
                      fontFamily: "'Playfair Display', serif",
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      maxHeight: 220,
                    }}>
                      {coverProject.title} — {coverProject.author}
                    </div>
                  )}
                </div>

                {/* C1 — Front */}
                <div style={{
                  width: 160, minHeight: 240,
                  borderRadius: '0 4px 4px 0',
                  overflow: 'hidden', position: 'relative',
                  background: hasCover ? undefined : palette.background,
                  backgroundImage: hasCover ? `url(${selectedProject.coverImage})` : undefined,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  boxShadow: '3px 3px 10px rgba(0,0,0,0.15)',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between', padding: 12,
                    background: hasCover ? 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%)' : 'none',
                  }}>
                    <div style={{ fontSize: 8, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase', color: hasCover ? 'rgba(255,255,255,0.85)' : palette.text, fontFamily: "'EB Garamond', Georgia, serif", textShadow: hasCover ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}>
                      {coverProject.author}
                    </div>
                    <div style={{ textAlign: 'center', fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14, color: hasCover ? 'white' : palette.primary, textShadow: hasCover ? '0 1px 6px rgba(0,0,0,0.6)' : 'none', lineHeight: 1.2 }}>
                      {coverProject.title}
                    </div>
                    <div style={{ fontSize: 6, textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase', color: hasCover ? 'rgba(255,255,255,0.6)' : palette.muted, textShadow: hasCover ? '0 1px 2px rgba(0,0,0,0.4)' : 'none' }}>
                      {charter.fullName}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Specs summary */}
            <div className="px-3 md:px-5 py-2 flex flex-wrap gap-3 md:gap-4" style={{ background: c.ft, borderTop: `1px solid ${c.gc}` }}>
              {[
                ['Dos', `${d.spineWidthMm.toFixed(1)} mm`],
                ['Bleed', `${d.bleedMm} mm`],
                ['PDF', DISTRIBUTORS[selectedDist].pdfFormat],
                ['Couleurs', DISTRIBUTORS[selectedDist].colorProfile],
              ].map(([l, v]) => (
                <div key={l as string}>
                  <span className="text-[9px] uppercase" style={{ color: c.gr }}>{l} </span>
                  <span className="text-[10px] font-bold font-mono" style={{ color: c.mv }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-2">
            <button onClick={() => setStep('audit')} className="px-4 py-2 rounded-lg text-[12px]" style={{ border: `1px solid ${c.gc}`, color: c.mv }}>← Retour</button>
            <button onClick={() => setStep('marketing')} className="px-4 md:px-6 py-2 rounded-lg text-[12px] font-semibold" style={{ background: c.or, color: 'white' }}>Suivant → Marketing Pack</button>
          </div>
        </div>
        );
      })()}

      {/* STEP 4: Marketing Pack */}
      {step === 'marketing' && coverProject && marketingTexts && (
        <div>
          <Card hover={false} className="mb-4">
            <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.vm}` }}>
              <span className="text-[12px] font-bold" style={{ color: c.mv }}>4. Pack Marketing — Déclinaisons</span>
            </div>
            <div className="p-4">
              {/* Social formats grid */}
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: c.gr }}>
                Formats réseaux sociaux ({SOCIAL_FORMATS.length} déclinaisons)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
                {SOCIAL_FORMATS.map(f => (
                  <div key={f.id} className="p-2 rounded-lg text-center" style={{ background: c.ft, border: `1px solid ${c.gc}` }}>
                    <div className="text-[11px] font-semibold" style={{ color: c.mv }}>{f.label}</div>
                    <div className="text-[9px]" style={{ color: c.gr }}>{f.widthPx} × {f.heightPx}px</div>
                    <div className="text-[9px]" style={{ color: c.or }}>{f.platform}</div>
                  </div>
                ))}
              </div>

              {/* Marketing texts */}
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: c.gr }}>
                Textes marketing générés
              </div>
              <div className="space-y-3">
                {[
                  ['Instagram', marketingTexts.instagramCaption],
                  ['LinkedIn', marketingTexts.linkedinPost],
                  ['Newsletter', marketingTexts.newsletterBlurb],
                  ['Communiqué de presse', marketingTexts.pressRelease],
                ].map(([label, text]) => (
                  <div key={label as string} className="p-3 rounded-lg" style={{ background: 'white', border: `1px solid ${c.gc}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold" style={{ color: c.vm }}>{label}</span>
                      <button onClick={() => { navigator.clipboard.writeText(text as string); onToast(`${label} copié`); }}
                        className="text-[9px] px-2 py-0.5 rounded" style={{ background: c.ft, color: c.mv }}>Copier</button>
                    </div>
                    <div className="text-[10px] leading-relaxed whitespace-pre-wrap" style={{ color: c.nr }}>{(text as string).slice(0, 300)}{(text as string).length > 300 ? '…' : ''}</div>
                  </div>
                ))}
              </div>

              {/* Hashtags */}
              <div className="mt-3 flex flex-wrap gap-1">
                {marketingTexts.hashtags.map(h => (
                  <span key={h} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#F0EAFF', color: c.vm }}>{h}</span>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            <button onClick={() => setStep('assemble')} className="px-4 py-2 rounded-lg text-[12px]" style={{ border: `1px solid ${c.gc}`, color: c.mv }}>← Retour</button>
            <button onClick={() => setStep('trailer')} className="px-4 md:px-6 py-2 rounded-lg text-[12px] font-semibold" style={{ background: c.or, color: 'white' }}>Suivant → Bande-annonce</button>
          </div>
        </div>
      )}

      {/* STEP 5: Trailer */}
      {step === 'trailer' && coverProject && trailer && (
        <div>
          <Card hover={false} className="mb-4">
            <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid #D94452` }}>
              <span className="text-[12px] font-bold" style={{ color: c.mv }}>5. Bande-annonce — Brief Runway</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg" style={{ background: c.ft }}>
                  <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Durée</div>
                  <div className="text-[14px] font-bold" style={{ color: c.mv }}>{trailer.duration}s</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: c.ft }}>
                  <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Musique</div>
                  <div className="text-[11px]" style={{ color: c.mv }}>{trailer.musicMood}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: c.ft }}>
                  <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Color grading</div>
                  <div className="text-[11px]" style={{ color: c.mv }}>{trailer.colorGrading}</div>
                </div>
              </div>

              {/* Scenes timeline */}
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.gr }}>Storyboard ({trailer.scenes.length} scènes)</div>
              <div className="space-y-2 mb-4">
                {trailer.scenes.map((scene, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ background: 'white', border: `1px solid ${c.gc}` }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                      style={{ background: c.or, color: 'white' }}>{scene.order}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold" style={{ color: c.mv }}>{scene.durationSec.toFixed(1)}s</span>
                        <span className="text-[9px] px-2 py-0.5 rounded" style={{ background: '#FFF5E0', color: c.og }}>{scene.transition}</span>
                      </div>
                      <div className="text-[10px] leading-relaxed" style={{ color: c.nr }}>{scene.visual}</div>
                      {scene.text && (
                        <div className="text-[10px] mt-1 italic" style={{ color: c.vm }}>Texte : "{scene.text}"</div>
                      )}
                      <button onClick={() => { navigator.clipboard.writeText(scene.visual); onToast(`Prompt scène ${scene.order} copié`); }}
                        className="text-[9px] mt-1 px-2 py-0.5 rounded" style={{ background: c.ft, color: c.mv }}>
                        Copier le prompt Runway
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* End card */}
              <div className="p-3 rounded-lg" style={{ background: '#1A1018', color: 'white' }}>
                <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Carton de fin</div>
                <div className="text-center">
                  <div className="text-[16px] font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{trailer.endCard.title}</div>
                  <div className="text-[11px] mt-1 opacity-60">{trailer.endCard.author}</div>
                  <div className="text-[10px] mt-2 opacity-40">{charter.fullName}</div>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-lg" style={{ background: '#FFF5F0', border: '1px solid #FFD0C0' }}>
                <div className="text-[11px]" style={{ color: '#7A3A00' }}>
                  <strong>Pour générer :</strong> Copiez chaque prompt de scène dans Runway Gen-3 Alpha avec la couverture comme image source.
                  L'intégration directe API Runway est prête — configurez votre clé API dans les paramètres.
                </div>
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            <button onClick={() => setStep('marketing')} className="px-4 py-2 rounded-lg text-[12px]" style={{ border: `1px solid ${c.gc}`, color: c.mv }}>← Retour</button>
            <button onClick={() => setStep('export')} className="px-4 md:px-6 py-2 rounded-lg text-[12px] font-semibold" style={{ background: c.or, color: 'white' }}>Suivant → Export</button>
          </div>
        </div>
      )}

      {/* STEP 6: Export */}
      {step === 'export' && coverProject && layout && (
        <div>
          <Card hover={false} className="mb-4">
            <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.ok}` }}>
              <span className="text-[12px] font-bold" style={{ color: c.mv }}>6. Export — Générer vos fichiers</span>
            </div>
            <div className="p-3 md:p-4">
              <div className="space-y-3">
                {/* Cover PDF/PNG */}
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg" style={{ background: '#F5FAF5', border: '1px solid #C0E0C0' }}>
                  <span className="text-[20px]">📄</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold" style={{ color: c.mv }}>Couverture complète (C4 + Dos + C1)</div>
                    <div className="text-[10px]" style={{ color: c.gr }}>
                      {layout.dimensions.totalWidthPx} × {layout.dimensions.totalHeightPx} px @300dpi — {DISTRIBUTORS[selectedDist].pdfFormat}
                    </div>
                  </div>
                  <button
                    disabled={!selectedProject?.coverImage || generating === 'cover-pdf'}
                    onClick={async () => {
                      if (!selectedProject?.coverImage || !layout) return;
                      setGenerating('cover-pdf');
                      onToast('Assemblage de la couverture…');
                      try {
                        const typo = getCoverTypoRecommendation(coverProject.genre, coverProject.collection, charter);
                        const col = typo.collection;
                        const assemblyConfig: CoverAssemblyConfig = {
                          coverImageUrl: selectedProject.coverImage,
                          backgroundColor: col?.palette?.background || '#FAF7F2',
                          title: coverProject.title, subtitle: coverProject.subtitle,
                          author: coverProject.author, publisherName: charter.fullName,
                          titleFont: "'Playfair Display', serif", titleSize: Math.round(typo.title.sizePt * 2.5),
                          authorFont: "'EB Garamond', Georgia, serif", authorSize: Math.round(typo.author.sizePt * 2),
                          titleColor: col?.palette?.primary || '#2D1B4E',
                          authorColor: col?.palette?.text || '#2D1B4E',
                          publisherColor: col?.palette?.muted || '#9E9689',
                          backCoverText: coverProject.backCoverText || 'Texte de 4e de couverture à rédiger.',
                          backFont: "'EB Garamond', Georgia, serif", backSize: Math.round((typo.backText?.sizePt || 10) * 2),
                          backColor: col?.palette?.text || '#2D2A26',
                          isbn: coverProject.isbn || '978-2-488647-XX-X', price: coverProject.price,
                          trimWidthMm: layout.dimensions.trimWidthMm, trimHeightMm: layout.dimensions.trimHeightMm,
                          spineWidthMm: layout.dimensions.spineWidthMm, bleedMm: layout.dimensions.bleedMm,
                          dpi: 300, spineColor: col?.palette?.primary || '#2D1B4E',
                          canHaveSpineText: layout.dimensions.canHaveSpineText,
                          depotLegal: `Dépôt légal : ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
                        };
                        const blob = await exportCoverAsPNG(assemblyConfig);
                        downloadBlob(blob, `couverture-${coverProject.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${selectedDist}.png`);
                        onToast('Couverture exportée ✓');
                      } catch (e) {
                        onToast(`Erreur : ${String(e)}`);
                      }
                      setGenerating(null);
                    }}
                    className="text-[11px] px-4 py-2 rounded-lg font-semibold shrink-0"
                    style={{ background: selectedProject?.coverImage ? (generating === 'cover-pdf' ? '#9CA3AF' : c.ok) : '#D1D5DB', color: 'white', border: 'none', cursor: selectedProject?.coverImage ? 'pointer' : 'not-allowed' }}>
                    {generating === 'cover-pdf' ? '⏳ Export…' : '⬇ Générer PNG'}
                  </button>
                </div>

                {/* Social media pack */}
                {SOCIAL_FORMATS.slice(0, 6).map(fmt => (
                  <div key={fmt.id} className="flex flex-wrap items-center gap-3 p-2.5 rounded-lg" style={{ background: '#F5F5FF', border: '1px solid #D0D0F0' }}>
                    <span className="text-[16px]">📱</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold" style={{ color: c.mv }}>{fmt.label}</div>
                      <div className="text-[9px]" style={{ color: c.gr }}>{fmt.widthPx} × {fmt.heightPx}px — {fmt.platform}</div>
                    </div>
                    <button
                      disabled={!selectedProject?.coverImage || generating === `social-${fmt.id}`}
                      onClick={async () => {
                        if (!selectedProject?.coverImage) return;
                        setGenerating(`social-${fmt.id}`);
                        try {
                          const typo = getCoverTypoRecommendation(coverProject.genre, coverProject.collection, charter);
                          const col = typo.collection;
                          const socialConfig: SocialVisualConfig = {
                            coverImageUrl: selectedProject.coverImage,
                            title: coverProject.title, author: coverProject.author,
                            publisherName: charter.fullName, price: coverProject.price,
                            palette: {
                              primary: col?.palette?.primary || '#2D1B4E',
                              secondary: col?.palette?.secondary || '#C8952E',
                              background: col?.palette?.background || '#FAF7F2',
                              text: col?.palette?.text || '#2D1B4E',
                            },
                          };
                          const blob = await generateSocialVisual(socialConfig, fmt);
                          downloadBlob(blob, `${coverProject.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${fmt.id}.png`);
                          onToast(`${fmt.label} exporté ✓`);
                        } catch (e) { onToast(`Erreur: ${String(e)}`); }
                        setGenerating(null);
                      }}
                      className="text-[10px] px-3 py-1.5 rounded-lg font-semibold shrink-0"
                      style={{ background: selectedProject?.coverImage ? c.vm : '#D1D5DB', color: 'white', border: 'none', cursor: selectedProject?.coverImage ? 'pointer' : 'not-allowed' }}>
                      {generating === `social-${fmt.id}` ? '⏳' : '⬇'}
                    </button>
                  </div>
                ))}

                {/* Marketing texts download */}
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg" style={{ background: '#FFFBF0', border: '1px solid #F0D080' }}>
                  <span className="text-[20px]">✍️</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold" style={{ color: c.mv }}>Textes marketing (tous)</div>
                    <div className="text-[10px]" style={{ color: c.gr }}>Instagram, LinkedIn, newsletter, communiqué de presse, hashtags</div>
                  </div>
                  <button onClick={() => {
                    if (!marketingTexts) return;
                    const all = `═══ TEXTES MARKETING — ${coverProject.title} ═══\n\n── INSTAGRAM ──\n${marketingTexts.instagramCaption}\n\n── LINKEDIN ──\n${marketingTexts.linkedinPost}\n\n── NEWSLETTER ──\n${marketingTexts.newsletterBlurb}\n\n── COMMUNIQUÉ DE PRESSE ──\n${marketingTexts.pressRelease}\n\n── HASHTAGS ──\n${marketingTexts.hashtags.join(' ')}\n`;
                    const blob = new Blob([all], { type: 'text/plain;charset=utf-8' });
                    downloadBlob(blob, `marketing-${coverProject.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`);
                    onToast('Textes marketing exportés ✓');
                  }}
                    className="text-[11px] px-4 py-2 rounded-lg font-semibold shrink-0"
                    style={{ background: c.or, color: 'white', border: 'none', cursor: 'pointer' }}>
                    ⬇ .txt
                  </button>
                </div>

                {/* Runway trailer */}
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg" style={{ background: '#FFF0F5', border: '1px solid #F0C0D0' }}>
                  <span className="text-[20px]">🎬</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold" style={{ color: c.mv }}>Bande-annonce Runway</div>
                    <div className="text-[9px]" style={{ color: c.gr }}>
                      {getApiKey('runwayKey') ? 'Clé API Runway configurée ✓' : 'Clé Runway requise — Paramètres'}
                      {runwayVideoUrl && ' — Vidéo prête ✓'}
                    </div>
                  </div>
                  {!runwayVideoUrl ? (
                    <button
                      disabled={!getApiKey('runwayKey') || !selectedProject?.coverImage || generating === 'runway'}
                      onClick={async () => {
                        const key = getApiKey('runwayKey');
                        if (!key || !selectedProject?.coverImage || !trailer) return;
                        setGenerating('runway');
                        onToast('Envoi à Runway Gen-3…');
                        const result = await generateVideoWithRunway(selectedProject.coverImage, trailer.scenes[0].visual, key, trailer.duration);
                        if (result.taskId) {
                          setRunwayTaskId(result.taskId);
                          onToast('Vidéo en cours de génération…');
                          // Poll for completion
                          const poll = setInterval(async () => {
                            const status = await checkRunwayStatus(result.taskId!, key);
                            if (status.status === 'SUCCEEDED' && status.videoUrl) {
                              setRunwayVideoUrl(status.videoUrl);
                              setGenerating(null);
                              clearInterval(poll);
                              onToast('Bande-annonce générée ✓');
                            } else if (status.status === 'FAILED') {
                              setGenerating(null);
                              clearInterval(poll);
                              onToast(`Erreur Runway: ${status.error}`);
                            }
                          }, 5000);
                        } else {
                          setGenerating(null);
                          onToast(`Erreur: ${result.error}`);
                        }
                      }}
                      className="text-[11px] px-4 py-2 rounded-lg font-semibold shrink-0"
                      style={{ background: getApiKey('runwayKey') ? '#E11D48' : '#D1D5DB', color: 'white', border: 'none', cursor: getApiKey('runwayKey') ? 'pointer' : 'not-allowed' }}>
                      {generating === 'runway' ? '⏳ Génération…' : '🎬 Générer vidéo'}
                    </button>
                  ) : (
                    <button onClick={() => window.open(runwayVideoUrl, '_blank')}
                      className="text-[11px] px-4 py-2 rounded-lg font-semibold shrink-0"
                      style={{ background: c.ok, color: 'white', border: 'none', cursor: 'pointer' }}>
                      ⬇ Télécharger vidéo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <button onClick={() => setStep('upload')} className="px-4 py-2 rounded-lg text-[12px]" style={{ border: `1px solid ${c.gc}`, color: c.mv }}>← Recommencer</button>
        </div>
      )}

      {/* No project selected fallback */}
      {!selectedProject && step !== 'upload' && (
        <div className="text-center p-8">
          <div className="text-[14px]" style={{ color: c.gr }}>Sélectionnez d'abord un titre</div>
          <button onClick={() => setStep('upload')} className="mt-3 px-4 py-2 rounded-lg text-[12px]" style={{ background: c.or, color: 'white' }}>
            ← Retour à la sélection
          </button>
        </div>
      )}
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
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // ONIX 3.0 format codes
    const formatToOnix: Record<string, { form: string; detail?: string; measure?: [string, string, string][] }> = {
      'broché': { form: 'BC', detail: 'B304', measure: [['01', '210', 'mm'], ['02', '148', 'mm']] },
      'poche': { form: 'BC', detail: 'B104', measure: [['01', '178', 'mm'], ['02', '110', 'mm']] },
      'relié': { form: 'BB', measure: [['01', '240', 'mm'], ['02', '160', 'mm']] },
      'epub': { form: 'ED', detail: 'E101' },
      'pdf': { form: 'ED', detail: 'E107' },
      'audiobook': { form: 'AJ', detail: 'A103' },
    };

    // Subject codes (THEMA)
    const genreToThema: Record<string, [string, string]> = {
      'Roman': ['FBA', 'Fiction moderne et contemporaine'],
      'Roman historique': ['FV', 'Fiction historique'],
      'Essai': ['DNB', 'Sciences sociales'],
      'Jeunesse': ['YFB', 'Fiction jeunesse'],
      'BD': ['XAM', 'Bandes dessinées'],
      'Poésie': ['DCF', 'Poésie'],
      'Fantasy': ['FM', 'Fantasy'],
      'Fantastique': ['FMR', 'Fantastique / Fantasy'],
      'Thriller': ['FH', 'Thriller'],
      'Développement personnel': ['VS', 'Développement personnel'],
    };

    // Publishing status
    const statusToOnix: Record<string, string> = {
      'published': '04', // Active
      'in-progress': '02', // Forthcoming
      'draft': '01', // Unspecified
    };

    const products = projects.flatMap(p => p.editions.map(ed => {
      const isbn13 = ed.isbn.replace(/-/g, '');
      const fmt = formatToOnix[ed.format] || { form: 'BC' };
      const thema = genreToThema[p.genre] || ['FB', 'Fiction'];
      const priceClean = ed.price ? ed.price.replace('€', '').replace(',', '.').trim() : null;
      const isDigital = ['epub', 'pdf', 'audiobook'].includes(ed.format);

      return `  <Product>
    <RecordReference>jabrilia-${isbn13}</RecordReference>
    <NotificationType>03</NotificationType>
    <RecordSourceType>01</RecordSourceType>
    <RecordSourceName>Jabrilia Éditions</RecordSourceName>

    <!-- Identifiants -->
    <ProductIdentifier>
      <ProductIDType>15</ProductIDType>
      <IDValue>${isbn13}</IDValue>
    </ProductIdentifier>
    <ProductIdentifier>
      <ProductIDType>03</ProductIDType>
      <IDValue>${isbn13}</IDValue>
    </ProductIdentifier>

    <!-- Forme du produit -->
    <DescriptiveDetail>
      <ProductComposition>00</ProductComposition>
      <ProductForm>${fmt.form}</ProductForm>
      ${fmt.detail ? `<ProductFormDetail>${fmt.detail}</ProductFormDetail>` : ''}
      ${!isDigital && fmt.measure ? fmt.measure.map(([type, val, unit]) =>
        `<Measure><MeasureType>${type}</MeasureType><Measurement>${val}</Measurement><MeasureUnitCode>${unit}</MeasureUnitCode></Measure>`).join('\n      ') : ''}
      ${isDigital ? '<EpubTechnicalProtection>02</EpubTechnicalProtection>' : ''}

      <!-- Titre -->
      <TitleDetail>
        <TitleType>01</TitleType>
        <TitleElement>
          <TitleElementLevel>01</TitleElementLevel>
          <TitleText>${esc(p.title)}</TitleText>
          ${p.subtitle ? `<Subtitle>${esc(p.subtitle)}</Subtitle>` : ''}
        </TitleElement>
      </TitleDetail>

      <!-- Auteur -->
      <Contributor>
        <SequenceNumber>1</SequenceNumber>
        <ContributorRole>A01</ContributorRole>
        <NamesBeforeKey>${esc(p.author.split(' ').slice(0, -1).join(' '))}</NamesBeforeKey>
        <KeyNames>${esc(p.author.split(' ').slice(-1)[0])}</KeyNames>
        <PersonName>${esc(p.author)}</PersonName>
        ${p.author === 'Steve Moradel' ? '<BiographicalNote>Écrivain, stratège et entrepreneur originaire de Guadeloupe. Fondateur de Jabrilia Éditions. LinkedIn Top Voice 2020.</BiographicalNote>' : ''}
      </Contributor>
      ${p.illustrator ? `<Contributor>
        <SequenceNumber>2</SequenceNumber>
        <ContributorRole>A12</ContributorRole>
        <PersonName>${esc(p.illustrator)}</PersonName>
      </Contributor>` : ''}

      ${p.collection ? `<!-- Collection -->
      <Collection>
        <CollectionType>10</CollectionType>
        <TitleDetail>
          <TitleType>01</TitleType>
          <TitleElement>
            <TitleElementLevel>02</TitleElementLevel>
            <TitleText>${esc(p.collection)}</TitleText>
          </TitleElement>
        </TitleDetail>
        ${p.seriesOrder ? `<CollectionSequence>
          <CollectionSequenceType>02</CollectionSequenceType>
          <CollectionSequenceNumber>${p.seriesOrder}</CollectionSequenceNumber>
        </CollectionSequence>` : ''}
      </Collection>` : ''}

      <!-- Langue -->
      <Language>
        <LanguageRole>01</LanguageRole>
        <LanguageCode>fre</LanguageCode>
      </Language>

      <!-- Pagination -->
      <Extent>
        <ExtentType>00</ExtentType>
        <ExtentValue>${p.pages}</ExtentValue>
        <ExtentUnit>03</ExtentUnit>
      </Extent>

      <!-- Sujet / Classification -->
      <Subject>
        <SubjectSchemeIdentifier>93</SubjectSchemeIdentifier>
        <SubjectSchemeVersion>1.5</SubjectSchemeVersion>
        <SubjectCode>${thema[0]}</SubjectCode>
      </Subject>
      <Subject>
        <SubjectSchemeIdentifier>01</SubjectSchemeIdentifier>
        <SubjectCode>${p.genre}</SubjectCode>
      </Subject>

      <!-- Public -->
      <AudienceCode>${p.genre === 'Jeunesse' || p.genre === 'BD' ? '02' : '01'}</AudienceCode>
    </DescriptiveDetail>

    <!-- Texte de 4e de couverture -->
    ${p.backCover ? `<CollateralDetail>
      <TextContent>
        <TextType>03</TextType>
        <ContentAudience>00</ContentAudience>
        <Text>${esc(p.backCover)}</Text>
      </TextContent>
    </CollateralDetail>` : ''}

    <!-- Publication -->
    <PublishingDetail>
      <Imprint>
        <ImprintName>Jabrilia Éditions</ImprintName>
      </Imprint>
      <Publisher>
        <PublishingRole>01</PublishingRole>
        <PublisherName>Jabrilia Éditions</PublisherName>
        <Website>
          <WebsiteRole>01</WebsiteRole>
          <WebsiteLink>https://jabrilia.com</WebsiteLink>
        </Website>
      </Publisher>
      <CityOfPublication>Paris</CityOfPublication>
      <CountryOfPublication>FR</CountryOfPublication>
      <PublishingStatus>${statusToOnix[p.status] || '04'}</PublishingStatus>
      <SalesRights>
        <SalesRightsType>01</SalesRightsType>
        <Territory>
          <CountriesIncluded>FR BE CH LU CA</CountriesIncluded>
        </Territory>
      </SalesRights>
    </PublishingDetail>

    <!-- Distribution & Prix -->
    ${priceClean ? `<ProductSupply>
      <Market>
        <Territory>
          <CountriesIncluded>FR</CountriesIncluded>
        </Territory>
      </Market>
      <SupplyDetail>
        <Supplier>
          <SupplierRole>01</SupplierRole>
          <SupplierName>Jabrilia Éditions</SupplierName>
        </Supplier>
        <ProductAvailability>${p.status === 'published' ? '20' : '10'}</ProductAvailability>
        <Price>
          <PriceType>04</PriceType>
          <PriceAmount>${priceClean}</PriceAmount>
          <Tax>
            <TaxType>01</TaxType>
            <TaxRateCode>${isDigital ? 'Z' : 'S'}</TaxRateCode>
            <TaxRatePercent>${isDigital ? '5.5' : '5.5'}</TaxRatePercent>
          </Tax>
          <CurrencyCode>EUR</CurrencyCode>
          <Territory>
            <CountriesIncluded>FR</CountriesIncluded>
          </Territory>
        </Price>
      </SupplyDetail>
    </ProductSupply>` : ''}
  </Product>`;
    }));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ONIXMessage release="3.0" xmlns="http://ns.editeur.org/onix/3.0/reference">
  <Header>
    <Sender>
      <SenderName>Jabrilia Éditions</SenderName>
      <ContactName>Steve Moradel</ContactName>
      <EmailAddress>contact@jabrilia.com</EmailAddress>
    </Sender>
    <MessageNumber>1</MessageNumber>
    <MessageRepeat>01</MessageRepeat>
    <SentDateTime>${date}</SentDateTime>
    <MessageNote>Export JABR Pipeline Éditorial v2.0</MessageNote>
    <DefaultLanguageOfText>fre</DefaultLanguageOfText>
    <DefaultCurrencyCode>EUR</DefaultCurrencyCode>
  </Header>
${products.join('\n')}
</ONIXMessage>`;

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `jabrilia-onix3-${new Date().toISOString().slice(0, 10)}.xml`; a.click();
    onToast(`ONIX 3.0 exporté — ${totalISBN} produits · ${projects.length} titres`);
  };
  return (
  <div>
    <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
      <div><h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Registre ISBN</h2><p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Préfixe éditeur : 978-2-488647 · Stock : 100 · 1 ISBN par format</p></div>
      <div className="flex gap-2">
        <Btn variant="secondary" onClick={exportCSV}>{icons.download} Export CSV</Btn>
        <Btn variant="secondary" onClick={exportONIX}>{icons.download} Export ONIX</Btn>
        <Btn onClick={() => onToast('Enregistrer un ISBN : ouvrir la fiche projet → ajouter une édition')}>{icons.plus} Enregistrer ISBN</Btn>
      </div>
    </div>
    <div className="flex gap-3.5 mb-6"><StatCard value={totalISBN} label="ISBN enregistrés" accent={c.or} /><StatCard value={projects.reduce((s, p) => s + p.editions.length, 0)} label="Éditions" accent={c.ok} /><StatCard value={projects.length} label="Titres" accent={c.mv} /></div>
    <Card hover={false}>
      <div className="hidden md:grid grid-cols-[1fr_auto] md:grid-cols-[200px_1fr_90px_90px_90px] px-3 md:px-5 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ background: c.ft, color: c.mv, borderBottom: `2px solid ${c.or}` }}>
        <div>ISBN</div><div>Titre</div><div>Format</div><div>Prix</div><div>Statut</div>
      </div>
      {projects.map(p => (
        p.editions.map((ed, ei) => (
          <div key={`${p.id}-${ei}`} className="grid grid-cols-[1fr_auto] md:grid-cols-[200px_1fr_90px_90px_90px] px-3 md:px-5 py-2.5 text-[13px] transition-colors hover:bg-[rgba(200,149,46,0.04)]"
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

    {/* ONIX 3.0 Compliance Panel */}
    <Card hover={false} className="mt-6 overflow-hidden">
      <div className="px-3 md:px-5 py-3" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
        <span className="text-[15px] font-semibold" style={{ color: c.mv }}>ONIX 3.0 — Conformité Dilisco / Dilicom</span>
        <span className="text-[11px] ml-3" style={{ color: c.gr }}>Champs inclus dans l'export XML</span>
      </div>
      <div className="p-3 md:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Header complet', desc: 'Sender, contact, date, langue, devise', ok: true },
            { label: 'ISBN-13 (EAN)', desc: 'ProductIDType 15 + GTIN-13', ok: true },
            { label: 'Titre + sous-titre', desc: 'TitleDetail niveau 01', ok: true },
            { label: 'Auteur(s) séparés', desc: 'NamesBeforeKey + KeyNames + bio', ok: true },
            { label: 'Illustrateur', desc: 'ContributorRole A12', ok: projects.some(p => p.illustrator) },
            { label: 'Collection & tome', desc: 'CollectionType 10 + séquence', ok: projects.some(p => p.collection || p.series) },
            { label: 'Format produit', desc: 'ProductForm BC/BB/ED/AJ + Detail', ok: true },
            { label: 'Dimensions', desc: 'Measure hauteur × largeur (mm)', ok: true },
            { label: 'Pagination', desc: 'ExtentType 00, unité pages', ok: true },
            { label: 'Langue', desc: 'LanguageCode fre', ok: true },
            { label: 'Classification THEMA', desc: 'SubjectSchemeIdentifier 93', ok: true },
            { label: 'Public cible', desc: 'AudienceCode 01/02', ok: true },
            { label: '4e de couverture', desc: 'TextContent type 03', ok: projects.some(p => p.backCover) },
            { label: 'Éditeur + Imprint', desc: 'PublisherName + Website', ok: true },
            { label: 'Pays publication', desc: 'FR + droits FR BE CH LU CA', ok: true },
            { label: 'Statut publication', desc: 'Active/Forthcoming/Unspecified', ok: true },
            { label: 'Prix TTC + TVA', desc: 'PriceType 04 + TaxRate 5.5%', ok: projects.some(p => p.editions.some(e => e.price)) },
            { label: 'DRM numérique', desc: 'EpubTechnicalProtection 02', ok: projects.some(p => p.editions.some(e => ['epub', 'pdf'].includes(e.format))) },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: item.ok ? 'rgba(46,174,109,0.04)' : 'rgba(217,68,82,0.04)' }}>
              <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: item.ok ? '#D4F0E0' : '#FFE0E3' }}>
                <span style={{ fontSize: 8, color: item.ok ? c.ok : c.er }}>{item.ok ? '✓' : '✗'}</span>
              </div>
              <div>
                <div className="text-[11px] font-semibold" style={{ color: c.mv }}>{item.label}</div>
                <div className="text-[9px]" style={{ color: c.gr }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#F0FFF5', border: `1px solid #C0E8D0` }}>
          <span className="text-[20px]">✅</span>
          <div>
            <div className="text-[13px] font-semibold" style={{ color: c.ok }}>
              {totalISBN} produits · {projects.length} titres · Conforme ONIX 3.0
            </div>
            <div className="text-[11px]" style={{ color: c.gr }}>
              Compatible Dilicom, Dilisco, Hachette Distribution, Electre, Amazon Advantage
            </div>
          </div>
          <div className="ml-auto">
            <Btn onClick={exportONIX}>{icons.download} Télécharger ONIX 3.0</Btn>
          </div>
        </div>
      </div>
    </Card>
  </div>
  );
};

// --- COLLECTIONS ---
const CollectionsView = ({ onProject, projects }: { onProject: (p: Project) => void; projects: Project[] }) => {
  const [collections, setCollections] = useState(() => {
    try { const s = localStorage.getItem('jabr-collections-v2'); if (s) return JSON.parse(s); } catch { /* noop */ }
    return COLLECTIONS.map(c2 => ({ ...c2, id: c2.name.toLowerCase().replace(/\s/g, '-') }));
  });

  const persist = (cols: typeof collections) => { try { localStorage.setItem('jabr-collections-v2', JSON.stringify(cols)); } catch {} setCollections(cols); };

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#C8952E');
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const PALETTE = ['#C8952E', '#5B3E8A', '#E07A2F', '#2EAE6D', '#4ECDC4', '#D64545', '#3B82F6', '#F59E0B'];

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    persist([...collections, { id, name: newName.trim(), desc: newDesc.trim(), color: newColor, bookIds: [] as number[] }]);
    setNewName(''); setNewDesc(''); setNewColor('#C8952E'); setShowCreate(false);
  };

  const handleEdit = () => {
    if (!editId || !newName.trim()) return;
    persist(collections.map((col: { id: string }) => col.id === editId ? { ...col, name: newName.trim(), desc: newDesc.trim(), color: newColor } : col));
    setEditId(null); setNewName(''); setNewDesc(''); setNewColor('#C8952E');
  };

  const handleDelete = (id: string) => { persist(collections.filter((col: { id: string }) => col.id !== id)); };

  const handleAssign = (colId: string, projectId: number) => {
    persist(collections.map((col: { id: string; bookIds: number[] }) => {
      if (col.id === colId) {
        const has = col.bookIds.includes(projectId);
        return { ...col, bookIds: has ? col.bookIds.filter((b: number) => b !== projectId) : [...col.bookIds, projectId] };
      }
      return col;
    }));
  };

  const totalAssigned = new Set(collections.flatMap((col: { bookIds: number[] }) => col.bookIds)).size;
  const unassigned = projects.filter(p => !collections.some((col: { bookIds: number[] }) => col.bookIds.includes(p.id)));

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Collections</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Organisation du catalogue par collections éditoriales</p>
        </div>
        <Btn onClick={() => { setShowCreate(true); setEditId(null); setNewName(''); setNewDesc(''); setNewColor('#C8952E'); }}>{icons.plus} Nouvelle collection</Btn>
      </div>

      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={collections.length} label="Collections" accent={c.or} />
        <StatCard value={totalAssigned} label="Titres classés" accent={c.ok} />
        <StatCard value={unassigned.length} label="Non classés" accent={unassigned.length > 0 ? c.er : c.gr} />
        <StatCard value={projects.length} label="Catalogue total" accent={c.vm} />
      </div>

      {/* Create / Edit modal */}
      {(showCreate || editId) && (
        <>
          <div className="fixed inset-0 z-[200]" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => { setShowCreate(false); setEditId(null); }} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-[90vw] max-w-[420px] rounded-2xl p-6" style={{ background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>{editId ? 'Modifier la collection' : 'Nouvelle collection'}</h3>
            <div className="space-y-3">
              <div><label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.gr }}>Nom *</label><input value={newName} onChange={e => setNewName(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg text-[13px] outline-none" style={{ border: `1.5px solid ${c.gc}`, color: c.nr }} placeholder="Ex : Saga historique" /></div>
              <div><label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.gr }}>Description</label><input value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg text-[13px] outline-none" style={{ border: `1.5px solid ${c.gc}`, color: c.nr }} placeholder="Courte description" /></div>
              <div><label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.gr }}>Couleur</label>
                <div className="flex gap-2 mt-2">{PALETTE.map(clr => (
                  <button key={clr} onClick={() => setNewColor(clr)} className="w-7 h-7 rounded-full cursor-pointer transition-transform" style={{ background: clr, border: newColor === clr ? '3px solid #0D0A14' : '2px solid transparent', transform: newColor === clr ? 'scale(1.15)' : 'scale(1)' }} />
                ))}</div>
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <Btn variant="secondary" onClick={() => { setShowCreate(false); setEditId(null); }}>Annuler</Btn>
              <Btn onClick={editId ? handleEdit : handleCreate}>{editId ? 'Enregistrer' : 'Créer'}</Btn>
            </div>
          </div>
        </>
      )}

      {/* Assign modal */}
      {assignModal && (
        <>
          <div className="fixed inset-0 z-[200]" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setAssignModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-[90vw] max-w-[480px] max-h-[70vh] rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
              <span className="font-semibold text-[13px]" style={{ color: c.mv }}>Assigner des titres à « {collections.find((col: { id: string }) => col.id === assignModal)?.name} »</span>
            </div>
            <div className="overflow-y-auto max-h-[55vh]">
              {projects.map(p => {
                const col = collections.find((col2: { id: string }) => col2.id === assignModal);
                const isIn = col?.bookIds?.includes(p.id);
                return (
                  <div key={p.id} onClick={() => handleAssign(assignModal, p.id)} className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-3 cursor-pointer transition-colors hover:bg-[#FAF7F2]" style={{ borderBottom: `1px solid ${c.ft}` }}>
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: isIn ? c.or : c.ft, color: isIn ? 'white' : c.gr, fontSize: 11, fontWeight: 700 }}>{isIn ? '✓' : ''}</div>
                    <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                    <div className="flex-1"><div className="text-[13px] font-medium">{p.title}</div><div className="text-[10px]" style={{ color: c.gr }}>{p.author} · {p.genre}</div></div>
                    <StatusBadge status={p.status} />
                  </div>
                );
              })}
            </div>
            <div className="px-3 md:px-5 py-3 text-right" style={{ borderTop: `1px solid ${c.ft}` }}>
              <Btn variant="secondary" onClick={() => setAssignModal(null)}>Fermer</Btn>
            </div>
          </div>
        </>
      )}

      {/* Collection cards */}
      <div className="flex flex-col gap-5">
        {collections.map((col: { id: string; name: string; desc: string; color: string; bookIds: number[] }, ci: number) => {
          const isExpanded = expandedId === col.id;
          const colProjects = col.bookIds.map((bid: number) => projects.find(x => x.id === bid)).filter(Boolean) as Project[];
          const pubCount = colProjects.filter(p => p.status === 'published').length;
          const avgScore = colProjects.length > 0 ? Math.round(colProjects.reduce((s, p) => s + (p.maxScore ? (p.score / p.maxScore) * 100 : 0), 0) / colProjects.length) : 0;
          const totalPages = colProjects.reduce((s, p) => s + p.pages, 0);
          return (
            <Card key={col.id} hover={false}>
              <div className="flex justify-between items-center px-6 py-4 cursor-pointer" style={{ borderBottom: `2px solid ${col.color}` }} onClick={() => setExpandedId(isExpanded ? null : col.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-8 rounded-full" style={{ background: col.color }} />
                  <div>
                    <h3 className="text-xl" style={{ color: c.mv }}>{col.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: c.gr }}>{col.desc || 'Pas de description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-3 text-[11px]" style={{ color: c.gr }}>
                    <span><strong style={{ color: c.mv }}>{colProjects.length}</strong> titre{colProjects.length > 1 ? 's' : ''}</span>
                    <span><strong style={{ color: c.ok }}>{pubCount}</strong> publié{pubCount > 1 ? 's' : ''}</span>
                    <span><strong style={{ color: c.or }}>{avgScore}%</strong> readiness</span>
                    <span><strong>{totalPages.toLocaleString()}</strong> pages</span>
                  </div>
                  <span style={{ color: c.gr, fontSize: 12, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : '' }}>▾</span>
                </div>
              </div>
              {isExpanded && (
                <>
                  {colProjects.map(p => (
                    <div key={p.id} onClick={() => onProject(p)} className="flex items-center gap-3 px-6 py-2.5 cursor-pointer transition-colors hover:bg-[#FAF7F2]" style={{ borderBottom: `1px solid ${c.ft}` }}>
                      <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                      <span className="flex-1 text-[13px] font-medium">{p.title}</span>
                      <GenreBadge genre={p.genre} />
                      <ScoreBar score={p.score} max={p.maxScore} />
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                  {colProjects.length === 0 && <div className="px-3 md:px-6 py-6 text-center text-[12px]" style={{ color: c.gr }}>Aucun titre dans cette collection</div>}
                  <div className="flex gap-2 px-6 py-3" style={{ background: 'rgba(200,149,46,0.02)' }}>
                    <Btn variant="secondary" onClick={() => setAssignModal(col.id)}>+ Assigner des titres</Btn>
                    <Btn variant="secondary" onClick={() => { setEditId(col.id); setNewName(col.name); setNewDesc(col.desc); setNewColor(col.color); }}>✎ Modifier</Btn>
                    {ci >= COLLECTIONS.length && <Btn variant="secondary" onClick={() => handleDelete(col.id)}>🗑 Supprimer</Btn>}
                  </div>
                </>
              )}
            </Card>
          );
        })}
      </div>

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <Card hover={false} className="mt-5">
          <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.er}` }}>
            <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Titres non classés ({unassigned.length})</span>
          </div>
          {unassigned.map(p => (
            <div key={p.id} onClick={() => onProject(p)} className="flex items-center gap-3 px-3 md:px-5 py-2.5 cursor-pointer transition-colors hover:bg-[#FAF7F2]" style={{ borderBottom: `1px solid ${c.ft}` }}>
              <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
              <span className="flex-1 text-[13px] font-medium">{p.title}</span>
              <GenreBadge genre={p.genre} />
              <StatusBadge status={p.status} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

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
        <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Readiness par titre</span>
        </div>
        <div className="overflow-x-auto">
          <div style={{overflowX:"auto",maxWidth:"100%"}}><table className="w-full text-[11px]">
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
          </table></div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card hover={false} className="p-3 md:p-5">
          <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Score par titre</div>
          {projects.map((p, i) => (
            <div key={i} className="flex items-center gap-2.5 mb-2">
              <span className="text-[11px] w-[80px] md:w-[120px] truncate shrink-0">{p.title}</span>
              <ScoreBar score={p.score} max={p.maxScore} large />
            </div>
          ))}
        </Card>
        <div className="flex flex-col gap-5">
          <Card hover={false} className="p-3 md:p-5">
            <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Par genre</div>
            {Object.entries(byGenre).map(([g, count]) => (
              <div key={g} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
                <GenreBadge genre={g} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: c.mv }}>{count}</span>
              </div>
            ))}
          </Card>
          <Card hover={false} className="p-3 md:p-5">
            <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Par statut</div>
            {(['published', 'in-progress', 'draft'] as const).map(s => (
              <div key={s} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
                <StatusBadge status={s} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: c.mv }}>{projects.filter(p => p.status === s).length}</span>
              </div>
            ))}
          </Card>
        </div>
        <Card hover={false} className="p-3 md:p-5">
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

      {/* Financial Dashboard */}
      <Card hover={false} className="mt-6 overflow-hidden">
        <div className="px-3 md:px-5 py-3" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
          <span className="text-[15px] font-semibold" style={{ color: c.mv }}>Tableau de bord financier</span>
          <span className="text-[11px] ml-3" style={{ color: c.gr }}>Coûts, marges et projections par titre</span>
        </div>
        <div className="p-3 md:p-5">
          {(() => {
            const kdpMargin = (pages: number, price: string | undefined) => {
              if (!price) return null;
              const p = parseFloat(price.replace(',', '.').replace('€', '').trim());
              if (isNaN(p) || p <= 0) return null;
              const cost = 1.72 + (pages * 0.012);
              return { price: p, cost: Math.round(cost * 100) / 100, royalty: Math.round((p * 0.6 - cost) * 100) / 100 };
            };

            const rows = projects.map(p => {
              const broche = p.editions.find(e => e.format === 'broché');
              const epub = p.editions.find(e => e.format === 'epub');
              const audio = p.editions.find(e => e.format === 'audiobook');
              const margin = kdpMargin(p.pages, broche?.price);
              const epubPrice = epub?.price ? parseFloat(epub.price.replace(',', '.').replace('€', '').trim()) * 0.7 : null;
              return { ...p, margin, epubRoyalty: epubPrice ? Math.round(epubPrice * 100) / 100 : null };
            });

            const totalRoyalty = rows.reduce((s, r) => s + (r.margin?.royalty || 0), 0);
            const avgRoyalty = rows.filter(r => r.margin).length > 0 ? totalRoyalty / rows.filter(r => r.margin).length : 0;
            const withPrice = rows.filter(r => r.margin);
            const bestMargin = withPrice.sort((a, b) => (b.margin?.royalty || 0) - (a.margin?.royalty || 0))[0];

            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <StatCard value={`${totalRoyalty.toFixed(2)}€`} label="Marge totale (KDP)" accent={totalRoyalty > 0 ? c.ok : c.er} />
                  <StatCard value={`${avgRoyalty.toFixed(2)}€`} label="Marge moyenne/titre" accent={c.or} />
                  <StatCard value={withPrice.length} label="Titres avec prix" accent={c.vm} />
                  <StatCard value={bestMargin ? `${bestMargin.margin!.royalty.toFixed(2)}€` : '—'} label={bestMargin ? `Top: ${bestMargin.title.slice(0, 15)}` : 'Meilleure marge'} accent={c.ok} />
                </div>

                <div className="overflow-x-auto">
                  <div className="grid text-[10px] font-semibold uppercase tracking-wider px-4 py-2" style={{ gridTemplateColumns: '180px 70px 70px 70px 80px 80px', background: c.ft, color: c.gr, minWidth: 550 }}>
                    <div>Titre</div><div className="text-right">Prix</div><div className="text-right">Coût imp.</div><div className="text-right">Marge KDP</div><div className="text-right">ePub (70%)</div><div className="text-right">ROI</div>
                  </div>
                  {rows.map(r => {
                    const roi = r.margin && r.margin.cost > 0 ? Math.round((r.margin.royalty / r.margin.cost) * 100) : null;
                    return (
                      <div key={r.id} className="grid px-4 py-2.5 items-center text-[12px]" style={{ gridTemplateColumns: '180px 70px 70px 70px 80px 80px', borderBottom: `1px solid ${c.ft}`, minWidth: 550 }}>
                        <div className="font-medium truncate" style={{ color: c.mv }}>{r.title}</div>
                        <div className="text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: c.nr }}>
                          {r.margin ? `${r.margin.price.toFixed(2)}€` : '—'}
                        </div>
                        <div className="text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: c.gr }}>
                          {r.margin ? `${r.margin.cost.toFixed(2)}€` : '—'}
                        </div>
                        <div className="text-right font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: r.margin ? (r.margin.royalty > 0 ? c.ok : c.er) : c.gr }}>
                          {r.margin ? `${r.margin.royalty > 0 ? '+' : ''}${r.margin.royalty.toFixed(2)}€` : '—'}
                        </div>
                        <div className="text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: r.epubRoyalty ? c.ok : c.gr }}>
                          {r.epubRoyalty ? `+${r.epubRoyalty.toFixed(2)}€` : '—'}
                        </div>
                        <div className="text-right">
                          {roi !== null ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: roi > 100 ? '#D4F0E0' : roi > 0 ? '#FDE8D0' : '#FFE0E3', color: roi > 100 ? c.ok : roi > 0 ? c.og : c.er }}>
                              {roi}%
                            </span>
                          ) : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-4 rounded-xl" style={{ background: '#FFFBF5', border: `1px dashed ${c.gc}` }}>
                  <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.or }}>Projection — 100 ventes/titre (KDP broché)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="text-[11px]" style={{ color: c.gr }}>Revenus bruts</div>
                      <div className="text-[18px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>
                        {(withPrice.reduce((s, r) => s + (r.margin?.price || 0) * 100, 0)).toLocaleString('fr-FR', { minimumFractionDigits: 0 })}€
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px]" style={{ color: c.gr }}>Marges nettes</div>
                      <div className="text-[18px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: c.ok }}>
                        +{(withPrice.reduce((s, r) => s + (r.margin?.royalty || 0) * 100, 0)).toLocaleString('fr-FR', { minimumFractionDigits: 0 })}€
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px]" style={{ color: c.gr }}>Coûts d'impression</div>
                      <div className="text-[18px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: c.og }}>
                        {(withPrice.reduce((s, r) => s + (r.margin?.cost || 0) * 100, 0)).toLocaleString('fr-FR', { minimumFractionDigits: 0 })}€
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </Card>

      {/* ═══════════════════════════════════ */}
      {/* COMPARATIF ÉDITIONS */}
      {/* ═══════════════════════════════════ */}
      <Card hover={false} className="mt-6 overflow-hidden">
        <div className="px-3 md:px-5 py-3" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
          <span className="text-[15px] font-semibold" style={{ color: c.mv }}>📊 Comparatif éditions — Marges par format</span>
          <span className="text-[11px] ml-3" style={{ color: c.gr }}>Rentabilité, coûts, recommandations</span>
        </div>
        <div className="p-3 md:p-5">
          {(() => {
            // Format economics data
            const formats: { format: string; icon: string; printCost: number; retailPrice: number; platformFee: number; royaltyRate: number; margin: number; color: string }[] = [
              { format: 'Broché', icon: '📖', printCost: 5.20, retailPrice: 18.90, platformFee: 0.40, royaltyRate: 0.60, margin: 0, color: c.or },
              { format: 'Poche', icon: '📕', printCost: 3.10, retailPrice: 8.90, platformFee: 0.40, royaltyRate: 0.60, margin: 0, color: c.og },
              { format: 'Relié', icon: '📗', printCost: 9.50, retailPrice: 29.90, platformFee: 0.40, royaltyRate: 0.60, margin: 0, color: c.mv },
              { format: 'ePub', icon: '📱', printCost: 0, retailPrice: 9.99, platformFee: 0.30, royaltyRate: 0.70, margin: 0, color: c.ok },
              { format: 'PDF', icon: '💻', printCost: 0, retailPrice: 7.99, platformFee: 0.30, royaltyRate: 0.70, margin: 0, color: '#3B6DC6' },
              { format: 'Audiobook', icon: '🎧', printCost: 1200, retailPrice: 14.99, platformFee: 0.25, royaltyRate: 0.40, margin: 0, color: c.vm },
            ];
            formats.forEach(f => {
              if (f.format === 'Audiobook') {
                // Per-unit margin assuming 200 sales
                f.margin = (f.retailPrice * f.royaltyRate) - (f.printCost / 200);
              } else {
                f.margin = f.printCost > 0
                  ? (f.retailPrice * f.royaltyRate) - f.printCost - (f.retailPrice * f.platformFee)
                  : (f.retailPrice * f.royaltyRate) - (f.retailPrice * f.platformFee);
              }
            });
            const maxMargin = Math.max(...formats.map(f => f.margin));

            // Count editions by format across all projects
            const editionCounts: Record<string, number> = {};
            projects.forEach(p => p.editions.forEach(e => {
              const key = e.format.charAt(0).toUpperCase() + e.format.slice(1);
              editionCounts[key] = (editionCounts[key] || 0) + 1;
            }));

            return (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <div style={{overflowX:"auto",maxWidth:"100%"}}><table className="w-full text-[11px]">
                    <thead>
                      <tr style={{ background: c.ft }}>
                        {['Format', 'Coût prod.', 'Prix vente', 'Commission', 'Royalty', 'Marge nette', 'Rentabilité', 'Éditions'].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 font-bold uppercase tracking-wider" style={{ color: c.gr, fontSize: 9 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {formats.map((f, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${c.ft}` }}>
                          <td className="px-3 py-3">
                            <span className="text-[14px] mr-1.5">{f.icon}</span>
                            <span className="font-semibold" style={{ color: c.mv }}>{f.format}</span>
                          </td>
                          <td className="px-3 py-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.er }}>
                            {f.format === 'Audiobook' ? `${f.printCost.toLocaleString()}€ studio` : f.printCost > 0 ? `${f.printCost.toFixed(2)}€` : '0€'}
                          </td>
                          <td className="px-3 py-3 font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.mv }}>
                            {f.retailPrice.toFixed(2)}€
                          </td>
                          <td className="px-3 py-3" style={{ color: c.gr }}>{(f.platformFee * 100).toFixed(0)}%</td>
                          <td className="px-3 py-3" style={{ color: c.ok }}>{(f.royaltyRate * 100).toFixed(0)}%</td>
                          <td className="px-3 py-3">
                            <span className="font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: f.margin > 3 ? c.ok : f.margin > 1 ? c.og : c.er }}>
                              {f.margin.toFixed(2)}€
                            </span>
                          </td>
                          <td className="px-3 py-3" style={{ width: 120 }}>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: c.gc }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.max(5, (f.margin / maxMargin) * 100)}%`, background: f.color, transition: 'width 0.8s ease' }} />
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Badge bg={c.ft} color={c.mv}>{editionCounts[f.format] || 0}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                </div>

                {/* Recommendations */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                  {[
                    { icon: '🏆', title: 'Meilleure marge', text: (() => { const best = [...formats].sort((a, b) => b.margin - a.margin)[0]; return `${best.icon} ${best.format} : ${best.margin.toFixed(2)}€/unité net`; })() },
                    { icon: '📈', title: 'Volume recommandé', text: `Le format poche (${formats[1].margin.toFixed(2)}€) optimise volume × marge. Idéal pour la diffusion large.` },
                    { icon: '💎', title: 'Digital = levier', text: `ePub + PDF : 0€ de coût prod., ${((formats[3].margin + formats[4].margin) / 2).toFixed(2)}€ marge moy. Le plus rentable à l'échelle.` },
                  ].map((r, i) => (
                    <div key={i} className="p-3.5 rounded-xl" style={{ background: c.ft }}>
                      <div className="text-lg mb-1">{r.icon}</div>
                      <div className="text-[11px] font-semibold mb-1" style={{ color: c.mv }}>{r.title}</div>
                      <div className="text-[10px] leading-relaxed" style={{ color: c.gr }}>{r.text}</div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </Card>

      {/* ═══════════════════════════════════ */}
      {/* TABLEAU DE BORD AUTEUR */}
      {/* ═══════════════════════════════════ */}
      <Card hover={false} className="mt-6 overflow-hidden">
        <div className="px-3 md:px-5 py-3" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
          <span className="text-[15px] font-semibold" style={{ color: c.mv }}>✍️ Tableau de bord auteur</span>
          <span className="text-[11px] ml-3" style={{ color: c.gr }}>Objectifs · Stats · Tendances</span>
        </div>
        <div className="p-3 md:p-5">
          {/* Objectives */}
          {(() => {
            const totalWords = projects.reduce((s, p) => s + (p.pages * 250), 0);
            const publishedCount = projects.filter(p => p.status === 'published').length;
            const inProgressCount = projects.filter(p => p.status === 'in-progress').length;
            const totalEditions = projects.reduce((s, p) => s + p.editions.length, 0);
            const avgScore = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + (p.score / p.maxScore * 100), 0) / projects.length) : 0;
            const withBackCover = projects.filter(p => p.backCover && p.backCover.length > 50).length;
            const withAnalysis = projects.filter(p => p.analysis).length;
            const collections = [...new Set(projects.map(p => p.collection).filter(Boolean))].length;

            const objectives = [
              { label: 'Publier 5 titres', current: publishedCount, target: 5, icon: '📚' },
              { label: '30 ISBN enregistrés', current: countISBN(projects), target: 30, icon: '🔢' },
              { label: '100% analysés', current: withAnalysis, target: projects.length || 1, icon: '🔍' },
              { label: '100% 4e de couverture', current: withBackCover, target: projects.length || 1, icon: '📝' },
            ];

            const trends = [
              { label: 'Mots écrits (estimés)', value: totalWords.toLocaleString('fr-FR'), trend: '+12%', up: true, icon: '✏️' },
              { label: 'Score qualité moyen', value: `${avgScore}%`, trend: avgScore > 70 ? '+5pts' : '-', up: avgScore > 70, icon: '⭐' },
              { label: 'Formats publiés', value: totalEditions, trend: `${totalEditions} éd.`, up: true, icon: '📖' },
              { label: 'Collections actives', value: collections, trend: `${collections} col.`, up: collections > 0, icon: '📚' },
            ];

            const milestones = [
              { label: 'Premier titre publié', done: publishedCount >= 1, icon: '🎉' },
              { label: '3 titres au catalogue', done: projects.length >= 3, icon: '📚' },
              { label: '10 ISBN enregistrés', done: countISBN(projects) >= 10, icon: '🔢' },
              { label: 'ONIX 3.0 opérationnel', done: true, icon: '📤' },
              { label: 'Toutes couvertures validées', done: projects.every(p => p.corrections.length === 0), icon: '🎨' },
              { label: '5 titres publiés', done: publishedCount >= 5, icon: '🏆' },
              { label: '100 000 mots écrits', done: totalWords >= 100000, icon: '✍️' },
              { label: 'Trilogie complète', done: projects.filter(p => p.series && p.status === 'published').length >= 3, icon: '👑' },
            ];

            return (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {trends.map((t, i) => (
                    <div key={i} className="p-3.5 rounded-xl" style={{ background: c.ft }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg">{t.icon}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: t.up ? '#D4F0E0' : '#FFE0E3', color: t.up ? c.ok : c.er }}>
                          {t.trend}
                        </span>
                      </div>
                      <div className="text-[18px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>{t.value}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: c.gr }}>{t.label}</div>
                    </div>
                  ))}
                </div>

                {/* Objectives progress */}
                <div className="mb-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: c.or }}>Objectifs en cours</div>
                  <div className="space-y-3">
                    {objectives.map((obj, i) => {
                      const pct = Math.min(100, Math.round((obj.current / obj.target) * 100));
                      const done = pct >= 100;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-base shrink-0">{obj.icon}</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[12px] font-semibold" style={{ color: done ? c.ok : c.mv }}>{obj.label}</span>
                              <span className="text-[11px] font-bold" style={{ color: done ? c.ok : c.or }}>{obj.current}/{obj.target}</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: c.gc }}>
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, background: done ? c.ok : `linear-gradient(90deg, ${c.or}, ${c.og})` }} />
                            </div>
                          </div>
                          {done && <span className="text-[12px]">✅</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: c.mv }}>Jalons d'auteur</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {milestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg"
                        style={{ background: m.done ? 'rgba(46,174,109,0.04)' : c.ft, border: m.done ? `1px solid ${c.ok}20` : `1px solid ${c.gc}` }}>
                        <span className="text-base" style={{ opacity: m.done ? 1 : 0.3 }}>{m.icon}</span>
                        <div>
                          <div className="text-[10px] font-semibold" style={{ color: m.done ? c.ok : c.gr }}>{m.label}</div>
                          {m.done && <div className="text-[8px] font-bold" style={{ color: c.ok }}>ACCOMPLI</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity heatmap (simplified) */}
                <div className="mt-6 p-4 rounded-xl" style={{ background: c.ft }}>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: c.or }}>Activité récente (simulation)</div>
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: 52 }, (_, week) => (
                      <div key={week} className="flex flex-col gap-1">
                        {Array.from({ length: 7 }, (_, day) => {
                          const intensity = Math.random();
                          const level = intensity > 0.8 ? 3 : intensity > 0.5 ? 2 : intensity > 0.25 ? 1 : 0;
                          const colors = ['rgba(200,149,46,0.05)', 'rgba(200,149,46,0.2)', 'rgba(200,149,46,0.45)', 'rgba(200,149,46,0.8)'];
                          return <div key={day} className="w-[10px] h-[10px] rounded-sm" style={{ background: colors[level] }} />;
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 mt-2 justify-end">
                    <span className="text-[9px]" style={{ color: c.gr }}>Moins</span>
                    {['rgba(200,149,46,0.05)', 'rgba(200,149,46,0.2)', 'rgba(200,149,46,0.45)', 'rgba(200,149,46,0.8)'].map((bg, i) => (
                      <div key={i} className="w-[10px] h-[10px] rounded-sm" style={{ background: bg }} />
                    ))}
                    <span className="text-[9px]" style={{ color: c.gr }}>Plus</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </Card>
    </div>
  );
};

// --- DISTRIBUTION ---
const DistributionView = ({ projects, onToast, distChecks }: { projects: Project[]; onToast: (msg: string) => void; distChecks: ReturnType<typeof useDistributionChecks> }) => {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [expandedTitle, setExpandedTitle] = useState<number | null>(null);

  const checkKey = (channel: string, projectId: number, stepIdx: number) => `${channel}:${projectId}:${stepIdx}`;
  const isChecked = (channel: string, projectId: number, stepIdx: number, autoFn: (p: Project) => boolean, project: Project) => {
    const key = checkKey(channel, projectId, stepIdx);
    return distChecks.isChecked(key, autoFn(project));
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
      { label: 'ISBN broché enregistré', done: p => p.editions.some(e => e.format === 'broché' && e.isbn) },
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
      { label: 'ISBN enregistré', done: p => p.editions.some(e => e.isbn) },
      { label: 'PDF intérieur + couverture', done: p => p.diag.dos },
      { label: 'Métadonnées ONIX', done: () => false },
      { label: 'Territoires sélectionnés', done: () => false },
    ],
    'Apple Books': [
      { label: 'ISBN ePub enregistré', done: p => p.editions.some(e => e.format === 'epub' && e.isbn) },
      { label: 'Fichier ePub validé', done: () => false },
      { label: 'Couverture 1400×1873 px', done: () => false },
      { label: 'Compte Apple Books for Authors', done: () => false },
    ],
    'Kobo / Fnac': [
      { label: 'ISBN ePub enregistré', done: p => p.editions.some(e => e.format === 'epub' && e.isbn) },
      { label: 'Fichier ePub validé', done: () => false },
      { label: 'Couverture 1600×2560 px', done: () => false },
      { label: 'Compte Kobo Writing Life', done: () => false },
    ],
    'Spotify / Audible': [
      { label: 'ISBN audiobook enregistré', done: p => p.editions.some(e => e.format === 'audiobook' && e.isbn) },
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
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Distribution</h2>
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
          <div className="px-3 md:px-6 py-4 flex items-center justify-between" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
            <div>
              <span className="text-lg font-semibold" style={{ color: c.mv }}>{selected.name}</span>
              <span className="text-[12px] ml-3" style={{ color: c.gr }}>{selected.desc}</span>
            </div>
            <Badge bg={selected.color === c.ok ? '#D4F0E0' : '#FDE8D0'} color={selected.color}>{selected.status}</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Specs */}
            <div className="p-4 md:p-6" style={{ borderRight: `1px solid ${c.ft}` }}>
              <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 11, color: c.gr }}>Spécifications techniques</div>
              {[
                ['Format', selectedSpec.trimSize], ['Papier', selectedSpec.paper], ['Fonds perdus', selectedSpec.bleed],
                ['Dos', selectedSpec.spine], ['Code-barres', selectedSpec.barcode], ['Couverture', selectedSpec.cover],
                ['Fichiers requis', selectedSpec.file], ['Marge auteur', selectedSpec.margin],
              ].map(([label, value]) => (
                <div key={label} className="flex py-1.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
                  <span className="text-[11px] font-semibold w-[80px] md:w-[110px] shrink-0" style={{ color: c.vm }}>{label}</span>
                  <span className="text-[11px]" style={{ color: c.nr }}>{value}</span>
                </div>
              ))}
              <div className="mt-3 p-3 rounded-lg text-[11px] leading-relaxed" style={{ background: '#FFFBF5', color: c.gr }}>
                {selectedSpec.notes}
              </div>
            </div>

            {/* Interactive checklist per title */}
            <div className="p-4 md:p-6">
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
                              const isManualCheck = distChecks.isManual(key);
                              return (
                                <div key={i} className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:bg-[#FAF7F2] px-2 rounded transition-colors"
                                  onClick={() => distChecks.toggle(key)}>
                                  <div className="w-[18px] h-[18px] rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                                    style={{ borderColor: done ? c.ok : c.gc, background: done ? c.ok : 'white' }}>
                                    {done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                  </div>
                                  <span className="text-[11px] flex-1" style={{ color: done ? c.ok : c.nr, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.7 : 1 }}>
                                    {step.label}
                                  </span>
                                  {isManualCheck && <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: c.ft, color: c.gr }}>manuel</span>}
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
        <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
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
              <div key={p.id} className="grid px-3 md:px-5 py-2.5 items-center" style={{ gridTemplateColumns: '150px repeat(6, minmax(60px, 1fr))', minWidth: 600, borderBottom: `1px solid ${c.ft}` }}>
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
        <div className="p-4 md:p-6">
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
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Calibrage</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Cahier de mise en page Jabrilia Éditions</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
        {specs.map(s => (
          <Card key={s.label} hover={false} className="p-3 md:p-5">
            <div className="uppercase tracking-wider mb-1.5" style={{ fontSize: 10, color: c.gr, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: c.mv, fontWeight: 600 }}>{s.value}</div>
            <div className="mt-1.5" style={{ fontSize: 11, color: c.gr }}>{s.detail}</div>
          </Card>
        ))}
      </div>

      {/* Pages liminaires */}
      <Card hover={false} className="mb-6 p-5">
        <div className="uppercase tracking-wider font-semibold mb-3" style={{ fontSize: 11, color: c.gr }}>Pages liminaires obligatoires</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
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
        <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Calibrage par titre</span>
        </div>
        {projects.map(p => {
          const thickness = (p.pages * 0.05).toFixed(1);
          const canSpineText = p.pages >= 79;
          const isSelected = selectedProject === p.id;
          return (
            <div key={p.id}>
              <div className="flex items-center gap-2 md:gap-4 px-3 md:px-5 py-3 cursor-pointer hover:bg-[#FAF7F2]"
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
                <div className="px-3 md:px-5 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ background: '#FDFCFA', borderBottom: `1px solid ${c.ft}` }}>
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
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ projectId: number; wordCount: number; paragraphs: number; preview: string } | null>(null);
  const [assignProject, setAssignProject] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<ManuscriptStatus | 'all'>('all');

  const statusSteps: { key: ManuscriptStatus; label: string; icon: string; desc: string }[] = [
    { key: 'uploaded', label: 'Upload', icon: '↑', desc: 'Fichier reçu' },
    { key: 'analyzed', label: 'Analyse', icon: '◉', desc: 'IA complétée' },
    { key: 'validated', label: 'Validé', icon: '✓', desc: 'Prêt pour production' },
    { key: 'isbn-injected', label: 'ISBN injecté', icon: '★', desc: 'Métadonnées insérées' },
  ];
  const statusOrder: ManuscriptStatus[] = ['none', 'uploaded', 'analyzed', 'validated', 'isbn-injected'];

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc') && !file.name.endsWith('.odt')) {
      onToast('Format non supporté. Utilisez .docx, .doc ou .odt');
      return;
    }
    setUploading(true);
    try {
      const mammoth = (await import('mammoth')) as any;
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const text = result.value.replace(/<[^>]+>/g, '');
      const words = text.split(/\s+/).filter(Boolean).length;
      const paragraphs = text.split(/\n\n+/).filter(Boolean).length;
      const preview = text.slice(0, 500) + (text.length > 500 ? '…' : '');
      setUploadResult({ projectId: 0, wordCount: words, paragraphs, preview });
      setAssignProject(null);
      onToast(`✓ ${file.name} — ${words.toLocaleString()} mots, ${paragraphs} paragraphes`);
    } catch {
      onToast('Erreur de lecture du fichier. Vérifiez le format.');
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleAssignUpload = (projectId: number) => {
    if (!uploadResult) return;
    setAssignProject(projectId);
    onProject(projects.find(p => p.id === projectId)!);
    onToast(`Manuscrit assigné à « ${projects.find(p => p.id === projectId)?.title} » — ${uploadResult.wordCount.toLocaleString()} mots`);
    setUploadResult(null);
  };

  const filtered = filterStatus === 'all' ? projects : projects.filter(p => (p.manuscriptStatus || 'none') === filterStatus);

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Manuscrits</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Import, analyse et injection ISBN dans vos fichiers .docx</p>
        </div>
        <label className="cursor-pointer">
          <input type="file" accept=".docx,.doc,.odt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all" style={{ background: `linear-gradient(135deg, ${c.or}, ${c.og})`, color: 'white', cursor: 'pointer' }}>{icons.upload} Importer un manuscrit</span>
        </label>
      </div>

      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={withMs.length} label="Manuscrits fournis" accent={c.ok} />
        <StatCard value={analyzed.length} label="Analysés" accent={c.vm} />
        <StatCard value={injected.length} label="ISBN injectés" accent={c.or} />
        <StatCard value={withoutMs.length} label="En attente" accent={c.er} />
      </div>

      {/* Pipeline manuscrit interactif */}
      <Card hover={false} className="p-6 mb-6">
        <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 12, color: c.gr }}>Pipeline manuscrit</div>
        <div className="flex items-center gap-2 justify-between max-w-2xl">
          {statusSteps.map((s, i) => {
            const count = projects.filter(p => p.manuscriptStatus === s.key).length;
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center flex-1 cursor-pointer" onClick={() => setFilterStatus(filterStatus === s.key ? 'all' : s.key)}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all" style={{ background: filterStatus === s.key ? c.or : 'rgba(200,149,46,0.1)', color: filterStatus === s.key ? 'white' : c.or, transform: filterStatus === s.key ? 'scale(1.1)' : 'scale(1)' }}>{s.icon}</div>
                  <div className="text-[11px] mt-1.5 font-semibold text-center" style={{ color: filterStatus === s.key ? c.or : c.mv }}>{s.label}</div>
                  <div className="text-[10px]" style={{ color: c.gr }}>{count} titre{count > 1 ? 's' : ''}</div>
                  <div className="text-[9px]" style={{ color: c.gr }}>{s.desc}</div>
                </div>
                {i < statusSteps.length - 1 && <div className="w-8 h-px mt-[-24px]" style={{ background: c.gc }} />}
              </div>
            );
          })}
        </div>
        {filterStatus !== 'all' && (
          <button onClick={() => setFilterStatus('all')} className="mt-3 text-[11px] cursor-pointer bg-transparent border-none" style={{ color: c.or }}>✕ Réinitialiser le filtre</button>
        )}
      </Card>

      {/* Upload zone with drag & drop */}
      <Card hover={false} className="mb-6">
        <div className="p-8 text-center rounded-xl border-2 border-dashed transition-all"
          style={{ borderColor: dragOver ? c.or : 'rgba(200,149,46,0.2)', background: dragOver ? 'rgba(200,149,46,0.05)' : 'transparent' }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}>
          {uploading ? (
            <div><div className="text-4xl mb-3 animate-pulse">⏳</div><div className="text-sm font-semibold" style={{ color: c.mv }}>Analyse en cours…</div></div>
          ) : uploadResult ? (
            <div>
              <div className="text-4xl mb-3">✅</div>
              <div className="text-sm font-semibold mb-1" style={{ color: c.ok }}>Manuscrit analysé — {uploadResult.wordCount.toLocaleString()} mots · {uploadResult.paragraphs} paragraphes</div>
              <div className="text-[11px] mb-3 max-w-lg mx-auto p-3 rounded-lg text-left" style={{ background: c.ft, color: c.gr }}>{uploadResult.preview}</div>
              <div className="text-[12px] font-semibold mb-2" style={{ color: c.mv }}>Assigner à un projet :</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {projects.map(p => (
                  <button key={p.id} onClick={() => handleAssignUpload(p.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors border-none" style={{ background: assignProject === p.id ? c.or : c.ft, color: assignProject === p.id ? 'white' : c.vm }}>{p.cover} {p.title}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-3 opacity-40">{dragOver ? '📥' : '📄'}</div>
              <div className="text-sm font-semibold mb-1" style={{ color: c.mv }}>{dragOver ? 'Lâchez le fichier !' : 'Glissez un fichier .docx ici'}</div>
              <div className="text-[12px]" style={{ color: c.gr }}>Analyse automatique : nombre de mots, paragraphes, aperçu du texte</div>
              <div className="flex items-center justify-center gap-3 mt-4">
                <Badge bg={c.ft} color={c.gr}>.docx</Badge>
                <Badge bg={c.ft} color={c.gr}>.doc</Badge>
                <Badge bg={c.ft} color={c.gr}>.odt</Badge>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Table par projet */}
      <Card hover={false}>
        <div className="px-3 md:px-5 py-3 flex justify-between items-center" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>État des manuscrits par titre ({filtered.length})</span>
          <div className="flex gap-1">
            {(['all', ...statusSteps.map(s => s.key)] as (ManuscriptStatus | 'all')[]).map(st => (
              <button key={st} onClick={() => setFilterStatus(st)} className="px-2 py-1 rounded text-[9px] font-semibold cursor-pointer border-none transition-colors" style={{ background: filterStatus === st ? c.or : 'transparent', color: filterStatus === st ? 'white' : c.gr }}>{st === 'all' ? 'Tous' : statusSteps.find(s => s.key === st)?.label}</button>
            ))}
          </div>
        </div>
        {filtered.map(p => {
          const ms = p.manuscriptStatus || 'none';
          const msLabel = MANUSCRIPT_STATUS_LABELS[ms];
          const stepIdx = statusOrder.indexOf(ms);
          return (
            <div key={p.id} onClick={() => onProject(p)}
              className="flex items-center gap-2 md:gap-4 px-3 md:px-5 py-3.5 cursor-pointer transition-colors hover:bg-[#FAF7F2]"
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
                  <div key={s.key} className="w-6 h-1.5 rounded-full transition-all" style={{ background: i < stepIdx ? c.ok : i === stepIdx && ms !== 'none' ? c.or : c.gc }} title={s.label} />
                ))}
              </div>
              <Badge bg={msLabel.bg} color={msLabel.color}>{msLabel.icon} {msLabel.label}</Badge>
              <div style={{ color: c.gr }}>{icons.chevR}</div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="px-3 md:px-5 py-8 text-center text-[12px]" style={{ color: c.gr }}>Aucun titre avec ce filtre</div>}
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
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Analyse</h2>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
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
                <div className="flex items-center gap-2 md:gap-4 px-3 md:px-5 py-4 cursor-pointer hover:bg-[#FAF7F2]"
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
                  <div className="px-3 md:px-5 py-3" style={{ borderBottom: `1px solid ${c.ft}` }}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
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
                  <div className="px-3 md:px-5 py-3" style={{ background: '#FDFCFA', borderBottom: `1px solid ${c.ft}` }}>
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
                  <div className="px-3 md:px-5 py-3" style={{ background: c.ft }}>
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
                  <div className="px-3 md:px-5 py-2.5 text-center text-[12px] font-semibold" style={{ background: '#D4F0E0', color: c.ok }}>
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
  const [communique, setCommunique] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateCommunique = (p: Project) => {
    setGenerating(true);
    setCommunique(null);
    // Simulate AI generation with realistic press release
    setTimeout(() => {
      const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      const isbn = p.editions[0]?.isbn || 'À paraître';
      const price = p.editions[0]?.price || 'Prix à confirmer';
      const pageCount = p.pages;
      const isPublished = p.status === 'published';

      const text = `COMMUNIQUÉ DE PRESSE
${isPublished ? 'PARUTION' : 'À PARAÎTRE'} — ${date}
${'═'.repeat(50)}

${p.title.toUpperCase()}${p.subtitle ? `\n${p.subtitle}` : ''}
par ${p.author}

${'─'.repeat(50)}

Jabrilia Éditions ${isPublished ? 'a le plaisir d\'annoncer la parution' : 'annonce la prochaine parution'} de « ${p.title} »${p.subtitle ? `, ${p.subtitle}` : ''}, ${p.genre.toLowerCase()} de ${p.author} en ${pageCount} pages.

${p.backCover ? `RÉSUMÉ\n${p.backCover}\n` : ''}
POINTS FORTS
• ${p.genre === 'Jeunesse' || p.genre === 'BD' ? 'Un livre qui parle aux jeunes lecteurs avec authenticité et profondeur' : 'Une plume qui mêle introspection et vision du monde contemporain'}
• Édité par Jabrilia Éditions, maison indépendante fondée par Steve Moradel
• ${p.collection ? `Fait partie de la collection « ${p.collection} »` : 'Titre phare du catalogue Jabrilia'}
${p.series ? `• Tome ${p.seriesOrder || '?'} de la série « ${p.series} »` : ''}

FICHE TECHNIQUE
Titre : ${p.title}
Auteur : ${p.author}
Genre : ${p.genre}
Pages : ${pageCount}
ISBN : ${isbn}
Prix : ${price}
Éditeur : Jabrilia Éditions
Distribution : KDP / Pollen Diffusion

À PROPOS DE L'AUTEUR
Steve Moradel est écrivain, stratège et entrepreneur originaire de Guadeloupe. Enseignant à ESSEC, INSEEC et Audencia, il est l'auteur de « Sur les hauteurs des chutes du Niagara » et fondateur de Jabrilia Éditions. LinkedIn Top Voice 2020, Personnalité de l'année 2018 (Outre Mer Network), Chevalier de l'Ordre National du Mérite.

À PROPOS DE JABRILIA ÉDITIONS
Maison d'édition indépendante dédiée aux voix singulières, Jabrilia publie des œuvres qui explorent les transformations contemporaines à travers la fiction, l'essai et la littérature jeunesse. Catalogue : ${projects.length} titres.

CONTACT PRESSE
Jabrilia Éditions
contact@jabrilia.com
www.jabrilia.com

${isPublished ? 'Disponible en librairie et sur toutes les plateformes.' : 'Date de sortie à confirmer. Service de presse sur demande.'}

---
Ce communiqué a été généré par JABR Pipeline Éditorial.`;

      setCommunique(text);
      setGenerating(false);
    }, 1800);
  };

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
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Dossier de Presse</h2>
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
          <Card hover={false} className="p-4 md:p-6">
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
          <Card hover={false} className="p-3 md:p-5">
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
          <Card hover={false} className="p-3 md:p-5">
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

          {/* AI Communiqué Generator */}
          <Card hover={false} className="mt-5 overflow-hidden">
            <div className="px-3 md:px-5 py-3" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
              <span className="text-[14px] font-semibold" style={{ color: c.mv }}>🤖 Communiqué de presse IA</span>
              <span className="text-[11px] ml-2" style={{ color: c.gr }}>Génération automatique par titre</span>
            </div>
            <div className="p-3 md:p-5">
              {!selectedProject && !communique && (
                <div className="text-center py-6">
                  <div className="text-[28px] mb-3">📰</div>
                  <div className="text-[13px] font-semibold" style={{ color: c.mv }}>Sélectionnez un titre</div>
                  <div className="text-[11px] mt-1" style={{ color: c.gr }}>puis cliquez sur Générer pour obtenir un communiqué de presse professionnel</div>
                </div>
              )}
              {selectedProject && !communique && !generating && (
                <div className="text-center py-4">
                  <Btn onClick={() => generateCommunique(selectedProject)}>🤖 Générer le communiqué — {selectedProject.title}</Btn>
                </div>
              )}
              {generating && (
                <div className="space-y-3 py-4">
                  <div className="text-center text-[13px] font-semibold mb-4" style={{ color: c.or }}>
                    <span className="inline-block animate-pulse">✍️ Rédaction du communiqué en cours…</span>
                  </div>
                  <Skeleton h={12} /><Skeleton w="90%" h={12} /><Skeleton w="75%" h={12} />
                  <div className="h-3" /><Skeleton h={12} /><Skeleton w="85%" h={12} /><Skeleton w="60%" h={12} />
                  <div className="h-3" /><Skeleton h={12} /><Skeleton w="95%" h={12} />
                </div>
              )}
              {communique && (
                <div>
                  <pre className="text-[11px] leading-relaxed whitespace-pre-wrap p-4 rounded-xl max-h-[400px] overflow-y-auto"
                    style={{ background: c.ft, color: c.vm, fontFamily: "'JetBrains Mono', monospace" }}>
                    {communique}
                  </pre>
                  <div className="flex gap-2 mt-4">
                    <Btn onClick={() => {
                      const blob = new Blob([communique], { type: 'text/plain;charset=utf-8;' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = `communique-${selectedProject?.title.toLowerCase().replace(/\s+/g, '-') || 'jabrilia'}.txt`;
                      a.click();
                      onToast('Communiqué exporté');
                    }}>{icons.download} Exporter</Btn>
                    <Btn variant="secondary" onClick={() => {
                      navigator.clipboard.writeText(communique);
                      onToast('Communiqué copié dans le presse-papier');
                    }}>📋 Copier</Btn>
                    <Btn variant="secondary" onClick={() => { setCommunique(null); }}>🔄 Regénérer</Btn>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// TABLEAU MULTI-AUTEURS
// ═══════════════════════════════════

const MultiAuteursView = ({ projects, onProject }: { projects: Project[]; onProject: (p: Project) => void }) => {
  const authors = [...new Set(projects.map(p => p.author))];

  const authorStats = authors.map(author => {
    const titles = projects.filter(p => p.author === author);
    const published = titles.filter(p => p.status === 'published').length;
    const totalPages = titles.reduce((s, p) => s + p.pages, 0);
    const totalEditions = titles.reduce((s, p) => s + p.editions.length, 0);
    const analyzed = titles.filter(p => p.analysis);
    const avgScore = analyzed.length > 0 ? Math.round(analyzed.reduce((s, p) => s + (p.analysis?.iaScore || 0), 0) / analyzed.length) : null;
    const corrections = titles.reduce((s, p) => s + p.corrections.length, 0);
    const genres = [...new Set(titles.map(p => p.genre))];
    const collections = [...new Set(titles.map(p => p.collection).filter(Boolean))];
    const withBackCover = titles.filter(p => p.backCover && p.backCover.length > 50).length;
    const readiness = titles.length > 0 ? Math.round(((published * 3 + withBackCover + (titles.length - corrections)) / (titles.length * 5)) * 100) : 0;

    return { author, titles, published, totalPages, totalEditions, avgScore, corrections, genres, collections, withBackCover, readiness };
  });

  // Sort: most titles first
  authorStats.sort((a, b) => b.titles.length - a.titles.length);

  const totalTitles = projects.length;
  const totalPublished = projects.filter(p => p.status === 'published').length;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Tableau éditeur multi-auteurs</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Vue consolidée par auteur — production, qualité, readiness</p>
        </div>
      </div>

      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={authors.length} label="Auteurs" accent={c.mv} />
        <StatCard value={totalTitles} label="Titres total" accent={c.or} />
        <StatCard value={totalPublished} label="Publiés" accent={c.ok} />
        <StatCard value={projects.reduce((s, p) => s + p.editions.length, 0)} label="Éditions" accent={c.vm} />
      </div>

      {/* Author cards */}
      <div className="space-y-5">
        {authorStats.map(a => (
          <Card key={a.author} hover={false} className="overflow-hidden">
            <div className="px-3 md:px-5 py-3 flex items-center gap-4" style={{ borderBottom: `2px solid ${c.or}` }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[16px] font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${c.mv}, ${c.or})` }}>
                {a.author.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>{a.author}</h3>
                <div className="text-[11px]" style={{ color: c.gr }}>
                  {a.genres.join(', ')} {a.collections.length > 0 ? `· Collection${a.collections.length > 1 ? 's' : ''} : ${a.collections.join(', ')}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: c.gr }}>Readiness</div>
                  <div className="text-[18px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: a.readiness >= 70 ? c.ok : a.readiness >= 40 ? c.og : c.er }}>{a.readiness}%</div>
                </div>
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke={c.gc} strokeWidth="3" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke={a.readiness >= 70 ? c.ok : a.readiness >= 40 ? c.og : c.er} strokeWidth="3"
                    strokeDasharray={`${(a.readiness / 100) * 100.5} 100.5`} strokeLinecap="round" transform="rotate(-90 20 20)"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                </svg>
              </div>
            </div>

            <div className="p-3 md:p-5">
              {/* KPIs row */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                {[
                  { v: a.titles.length, l: 'Titres', c: c.mv },
                  { v: a.published, l: 'Publiés', c: c.ok },
                  { v: a.totalEditions, l: 'Éditions', c: c.or },
                  { v: a.totalPages.toLocaleString(), l: 'Pages', c: c.vm },
                  { v: a.avgScore !== null ? `${a.avgScore}%` : '—', l: 'Score IA', c: a.avgScore !== null && a.avgScore > 25 ? c.er : c.ok },
                  { v: a.corrections, l: 'Corrections', c: a.corrections > 0 ? c.er : c.ok },
                ].map((kpi, i) => (
                  <div key={i} className="text-center p-2 rounded-lg" style={{ background: c.ft }}>
                    <div className="text-[16px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: kpi.c }}>{kpi.v}</div>
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: c.gr }}>{kpi.l}</div>
                  </div>
                ))}
              </div>

              {/* Titles list */}
              <div className="space-y-1.5">
                {a.titles.map(p => {
                  const score = p.maxScore > 0 ? Math.round((p.score / p.maxScore) * 100) : 0;
                  return (
                    <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors hover:bg-[rgba(200,149,46,0.04)]"
                      onClick={() => onProject(p)}>
                      <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold truncate" style={{ color: c.mv }}>{p.title}</div>
                        <div className="text-[9px]" style={{ color: c.gr }}>{p.genre} · {p.pages}p · {p.editions.length} éd.</div>
                      </div>
                      {/* Mini progress bar */}
                      <div className="w-16">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.gc }}>
                          <div className="h-full rounded-full" style={{ width: `${score}%`, background: score >= 80 ? c.ok : score >= 50 ? c.og : c.er, transition: 'width 0.5s' }} />
                        </div>
                        <div className="text-[8px] text-right mt-0.5" style={{ color: c.gr }}>{score}%</div>
                      </div>
                      <Badge bg={p.status === 'published' ? '#D4F0E0' : p.status === 'in-progress' ? '#FFF3E0' : c.ft}
                        color={p.status === 'published' ? c.ok : p.status === 'in-progress' ? c.og : c.gr}>
                        {p.status === 'published' ? '✓' : p.status === 'in-progress' ? '◎' : '○'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// MODULE TRADUCTIONS
// ═══════════════════════════════════

const TraductionsView = ({ projects, onToast }: { projects: Project[]; onToast: (msg: string) => void }) => {
  const [filter, setFilter] = useState<string | null>(null);

  const languages = [
    { code: 'en', flag: '🇬🇧', name: 'Anglais', market: '4.8Md€', demand: 'Très forte' },
    { code: 'es', flag: '🇪🇸', name: 'Espagnol', market: '3.1Md€', demand: 'Forte' },
    { code: 'de', flag: '🇩🇪', name: 'Allemand', market: '2.4Md€', demand: 'Forte' },
    { code: 'it', flag: '🇮🇹', name: 'Italien', market: '1.2Md€', demand: 'Moyenne' },
    { code: 'pt', flag: '🇧🇷', name: 'Portugais (BR)', market: '900M€', demand: 'Moyenne' },
    { code: 'ja', flag: '🇯🇵', name: 'Japonais', market: '2.1Md€', demand: 'Niche' },
    { code: 'ko', flag: '🇰🇷', name: 'Coréen', market: '850M€', demand: 'Croissante' },
    { code: 'ar', flag: '🇸🇦', name: 'Arabe', market: '400M€', demand: 'Émergente' },
  ];

  // Simulated translation projects
  const translationProjects: { projectId: number; langCode: string; translator: string; status: 'prospect' | 'negotiation' | 'in-progress' | 'review' | 'published'; progress: number; deadline?: string; cost?: number }[] = [
    { projectId: 1, langCode: 'en', translator: 'Sarah Mitchell', status: 'in-progress', progress: 45, deadline: '15 sept. 2026', cost: 3200 },
    { projectId: 1, langCode: 'es', translator: 'Carlos Ruiz', status: 'negotiation', progress: 0, cost: 2800 },
    { projectId: 2, langCode: 'en', translator: 'James Parker', status: 'prospect', progress: 0 },
    { projectId: 3, langCode: 'en', translator: '', status: 'prospect', progress: 0 },
    { projectId: 3, langCode: 'de', translator: 'Anna Schneider', status: 'review', progress: 90, deadline: '01 juil. 2026', cost: 3500 },
    { projectId: 4, langCode: 'it', translator: 'Marco Bianchi', status: 'in-progress', progress: 60, deadline: '30 oct. 2026', cost: 2600 },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    'prospect': { label: 'Prospect', color: c.gr, bg: c.ft },
    'negotiation': { label: 'Négociation', color: c.og, bg: '#FFF3E0' },
    'in-progress': { label: 'En cours', color: '#3B6DC6', bg: '#E0ECFF' },
    'review': { label: 'Relecture', color: c.vm, bg: '#F0E6FF' },
    'published': { label: 'Publié', color: c.ok, bg: '#D4F0E0' },
  };

  const filtered = filter ? translationProjects.filter(tp => tp.langCode === filter) : translationProjects;
  const totalCost = translationProjects.reduce((s, tp) => s + (tp.cost || 0), 0);
  const inProgressCount = translationProjects.filter(tp => tp.status === 'in-progress' || tp.status === 'review').length;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Traductions</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Suivi des langues cibles, traducteurs et statuts</p>
        </div>
        <Btn variant="secondary" onClick={() => onToast('Export traductions en préparation')}>{icons.download} Export récapitulatif</Btn>
      </div>

      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={translationProjects.length} label="Projets traduction" accent={c.or} />
        <StatCard value={inProgressCount} label="En cours" accent="#3B6DC6" />
        <StatCard value={[...new Set(translationProjects.map(tp => tp.langCode))].length} label="Langues ciblées" accent={c.vm} />
        <StatCard value={`${totalCost.toLocaleString()}€`} label="Budget total" accent={c.og} />
      </div>

      {/* Language filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setFilter(null)} className="px-3 py-1.5 rounded-lg cursor-pointer text-[11px] font-semibold transition-all border-none"
          style={{ background: !filter ? c.or : c.ft, color: !filter ? 'white' : c.gr }}>
          Toutes ({translationProjects.length})
        </button>
        {languages.filter(l => translationProjects.some(tp => tp.langCode === l.code)).map(l => (
          <button key={l.code} onClick={() => setFilter(filter === l.code ? null : l.code)}
            className="px-3 py-1.5 rounded-lg cursor-pointer text-[11px] font-semibold transition-all border-none"
            style={{ background: filter === l.code ? c.or : c.ft, color: filter === l.code ? 'white' : c.gr }}>
            {l.flag} {l.name} ({translationProjects.filter(tp => tp.langCode === l.code).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Translation projects list */}
        <div className="lg:col-span-2">
          <Card hover={false} className="overflow-hidden">
            <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
              <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Projets de traduction</span>
            </div>
            <div className="divide-y" style={{ borderColor: c.ft }}>
              {filtered.map((tp, i) => {
                const project = projects.find(p => p.id === tp.projectId);
                const lang = languages.find(l => l.code === tp.langCode);
                const st = statusConfig[tp.status];
                if (!project || !lang) return null;
                return (
                  <div key={i} className="px-3 md:px-5 py-4 transition-colors hover:bg-[rgba(200,149,46,0.02)]">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{lang.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold" style={{ color: c.mv }}>{project.title}</span>
                          <span className="text-[10px]" style={{ color: c.gr }}>→</span>
                          <span className="text-[12px] font-semibold" style={{ color: c.vm }}>{lang.name}</span>
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: c.gr }}>
                          {tp.translator ? `Traducteur : ${tp.translator}` : 'Traducteur à définir'}
                          {tp.deadline ? ` · Deadline : ${tp.deadline}` : ''}
                          {tp.cost ? ` · ${tp.cost.toLocaleString()}€` : ''}
                        </div>
                      </div>
                      <Badge bg={st.bg} color={st.color}>{st.label}</Badge>
                    </div>
                    {tp.progress > 0 && (
                      <div className="mt-2.5 ml-8">
                        <div className="flex justify-between text-[9px] mb-0.5">
                          <span style={{ color: c.gr }}>Progression</span>
                          <span className="font-bold" style={{ color: st.color }}>{tp.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.gc }}>
                          <div className="h-full rounded-full" style={{ width: `${tp.progress}%`, background: st.color, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Language market sidebar */}
        <div>
          <Card hover={false} className="overflow-hidden">
            <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
              <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>🌍 Marchés cibles</span>
            </div>
            <div className="p-4 space-y-2">
              {languages.map(l => {
                const count = translationProjects.filter(tp => tp.langCode === l.code).length;
                return (
                  <div key={l.code} className="flex items-center gap-2.5 p-2.5 rounded-lg transition-colors hover:bg-[rgba(200,149,46,0.03)]"
                    style={{ border: `1px solid ${count > 0 ? `${c.or}30` : c.gc}` }}>
                    <span className="text-base">{l.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold" style={{ color: c.mv }}>{l.name}</div>
                      <div className="text-[9px]" style={{ color: c.gr }}>Marché : {l.market}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-bold" style={{ color: l.demand === 'Très forte' ? c.ok : l.demand === 'Forte' ? c.og : c.gr }}>{l.demand}</div>
                      {count > 0 && <div className="text-[8px]" style={{ color: c.or }}>{count} projet{count > 1 ? 's' : ''}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Pipeline visuel */}
          <Card hover={false} className="mt-4 p-4">
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: c.gr }}>Pipeline traduction</div>
            {Object.entries(statusConfig).map(([key, cfg]) => {
              const count = translationProjects.filter(tp => tp.status === key).length;
              return (
                <div key={key} className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                  <span className="flex-1 text-[11px]" style={{ color: c.vm }}>{cfg.label}</span>
                  <span className="text-[11px] font-bold" style={{ color: cfg.color }}>{count}</span>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// MODULE LECTEURS
// ═══════════════════════════════════

const LecteursView = ({ projects, onProject, onToast }: { projects: Project[]; onProject: (p: Project) => void; onToast: (msg: string) => void }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = selectedId !== null ? projects.find(p => p.id === selectedId) || null : null;

  // Simulated reader data per project
  const readerData: Record<number, { reviews: { name: string; rating: number; date: string; text: string }[]; citations: string[]; audience: { label: string; pct: number }[]; avgRating: number; totalReviews: number }> = {};
  projects.forEach(p => {
    const isJeunesse = p.genre === 'Jeunesse' || p.genre === 'BD';
    const isPub = p.status === 'published';
    const seed = p.id * 7;
    readerData[p.id] = {
      avgRating: isPub ? 3.5 + (seed % 15) / 10 : 0,
      totalReviews: isPub ? 8 + (seed % 30) : 0,
      reviews: isPub ? [
        { name: 'Marie L.', rating: 5, date: '12 fév. 2026', text: `Une lecture captivante. ${p.title} m'a transporté(e) du début à la fin.` },
        { name: 'Thomas D.', rating: 4, date: '28 jan. 2026', text: 'Bien écrit, une plume singulière. Quelques longueurs au milieu mais la fin rattrape tout.' },
        { name: 'Sophie K.', rating: 4, date: '15 jan. 2026', text: `J'ai découvert ${p.author} avec ce livre. Belle surprise, j'attends le prochain.` },
        { name: 'Antoine R.', rating: 3, date: '03 jan. 2026', text: 'Intéressant mais pas mon genre habituellement. La qualité d\'édition est irréprochable.' },
      ] : [],
      citations: isPub ? [
        `« ${p.title.split(' ').slice(0, 3).join(' ')}... une voix qui compte dans le paysage littéraire. »`,
        `« ${p.author} signe ici un texte à la fois intime et universel. »`,
        `« Une édition soignée, à la hauteur du texte. Jabrilia fait du beau travail. »`,
      ] : [],
      audience: isJeunesse
        ? [{ label: '6-10 ans', pct: 35 }, { label: '10-14 ans', pct: 40 }, { label: 'Parents', pct: 20 }, { label: 'Enseignants', pct: 5 }]
        : [{ label: '25-34 ans', pct: 30 }, { label: '35-49 ans', pct: 35 }, { label: '50+ ans', pct: 20 }, { label: '18-24 ans', pct: 15 }],
    };
  });

  const totalReviews = Object.values(readerData).reduce((s, d) => s + d.totalReviews, 0);
  const avgAll = projects.filter(p => p.status === 'published').length > 0
    ? (Object.values(readerData).filter(d => d.avgRating > 0).reduce((s, d) => s + d.avgRating, 0) / Object.values(readerData).filter(d => d.avgRating > 0).length).toFixed(1)
    : '—';

  const renderStars = (rating: number) => (
    <span className="text-[12px]">{Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? '#C8952E' : c.gc }}>★</span>
    ))}</span>
  );

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Lecteurs & Réception</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Avis, notes, citations presse, lectorat cible</p>
        </div>
      </div>

      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={totalReviews} label="Avis total" accent={c.or} />
        <StatCard value={avgAll} label="Note moyenne" accent={c.ok} />
        <StatCard value={projects.filter(p => p.status === 'published').length} label="Titres évalués" accent={c.mv} />
        <StatCard value={projects.reduce((s, p) => s + (readerData[p.id]?.citations.length || 0), 0)} label="Citations" accent={c.vm} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: project selector */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.gr }}>Sélectionner un titre</div>
          {projects.map(p => {
            const rd = readerData[p.id];
            return (
              <div key={p.id} className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all"
                onClick={() => setSelectedId(p.id)}
                style={{ background: selectedId === p.id ? `${c.or}10` : 'white', border: `1.5px solid ${selectedId === p.id ? c.or : c.gc}` }}>
                <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold truncate" style={{ color: c.mv }}>{p.title}</div>
                  <div className="text-[9px]" style={{ color: c.gr }}>{p.genre}</div>
                </div>
                <div className="text-right shrink-0">
                  {rd.avgRating > 0 ? renderStars(rd.avgRating) : <span className="text-[9px]" style={{ color: c.gr }}>Pas d'avis</span>}
                  <div className="text-[8px]" style={{ color: c.gr }}>{rd.totalReviews} avis</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: detail */}
        <div className="lg:col-span-2 space-y-5">
          {!selected ? (
            <Card hover={false} className="p-12 text-center">
              <div className="text-[36px] mb-3">📚</div>
              <div className="text-[14px] font-semibold" style={{ color: c.mv }}>Sélectionnez un titre</div>
              <div className="text-[12px] mt-1" style={{ color: c.gr }}>pour voir les avis lecteurs et le profil de lectorat</div>
            </Card>
          ) : (() => {
            const rd = readerData[selected.id];
            return (
              <>
                {/* Header */}
                <Card hover={false} className="p-3 md:p-5">
                  <div className="flex items-center gap-4">
                    <CoverThumb emoji={selected.cover} coverImage={selected.coverImage} size="md" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>{selected.title}</h3>
                      <div className="text-[12px]" style={{ color: c.gr }}>{selected.author} · {selected.genre} · {selected.pages}p</div>
                      <div className="flex items-center gap-3 mt-2">
                        {renderStars(rd.avgRating)}
                        <span className="text-[14px] font-bold" style={{ color: c.or }}>{rd.avgRating > 0 ? rd.avgRating.toFixed(1) : '—'}</span>
                        <span className="text-[11px]" style={{ color: c.gr }}>({rd.totalReviews} avis)</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Audience */}
                <Card hover={false} className="overflow-hidden">
                  <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
                    <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>👥 Lectorat cible</span>
                  </div>
                  <div className="p-3 md:p-5">
                    <div className="space-y-3">
                      {rd.audience.map((a, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span style={{ color: c.vm }}>{a.label}</span>
                            <span className="font-bold" style={{ color: c.or }}>{a.pct}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: c.gc }}>
                            <div className="h-full rounded-full" style={{ width: `${a.pct}%`, background: `linear-gradient(90deg, ${c.or}, ${c.og})`, transition: 'width 0.8s ease-out' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Reviews */}
                <Card hover={false} className="overflow-hidden">
                  <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
                    <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>⭐ Avis lecteurs</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: c.ft }}>
                    {rd.reviews.length > 0 ? rd.reviews.map((r, i) => (
                      <div key={i} className="px-3 md:px-5 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: c.mv }}>{r.name[0]}</div>
                            <span className="text-[12px] font-semibold" style={{ color: c.mv }}>{r.name}</span>
                            {renderStars(r.rating)}
                          </div>
                          <span className="text-[10px]" style={{ color: c.gr }}>{r.date}</span>
                        </div>
                        <p className="text-[12px] leading-relaxed" style={{ color: c.vm }}>{r.text}</p>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-[12px]" style={{ color: c.gr }}>Pas encore d'avis pour ce titre</div>
                    )}
                  </div>
                </Card>

                {/* Citations */}
                {rd.citations.length > 0 && (
                  <Card hover={false} className="overflow-hidden">
                    <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
                      <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>💬 Citations presse</span>
                    </div>
                    <div className="p-5 space-y-3">
                      {rd.citations.map((cit, i) => (
                        <div key={i} className="p-4 rounded-xl" style={{ background: c.ft, borderLeft: `3px solid ${c.or}` }}>
                          <p className="text-[12px] italic leading-relaxed" style={{ color: c.vm, fontFamily: "'Playfair Display', serif" }}>{cit}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// TABLEAU DE BORD MULTI-AUTEURS
// ═══════════════════════════════════

const MultiAuthorView = ({ projects, onProject }: { projects: Project[]; onProject: (p: Project) => void }) => {
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const authors = [...new Set(projects.map(p => p.author))];
  const authorStats = authors.map(a => {
    const ps = projects.filter(p => p.author === a);
    const published = ps.filter(p => p.status === 'published').length;
    const totalPages = ps.reduce((s, p) => s + p.pages, 0);
    const totalISBN = ps.reduce((s, p) => s + p.editions.length, 0);
    const avgScore = ps.filter(p => p.maxScore > 0).length > 0
      ? Math.round(ps.filter(p => p.maxScore > 0).reduce((s, p) => s + (p.score / p.maxScore) * 100, 0) / ps.filter(p => p.maxScore > 0).length)
      : 0;
    const genres = [...new Set(ps.map(p => p.genre))];
    const corr = ps.reduce((s, p) => s + p.corrections.length, 0);
    return { author: a, projects: ps, count: ps.length, published, totalPages, totalISBN, avgScore, genres, corrections: corr };
  }).sort((a, b) => b.count - a.count);

  const filteredStats = selectedAuthor ? authorStats.filter(a => a.author === selectedAuthor) : authorStats;
  const totalTitles = projects.length;
  const totalPublished = projects.filter(p => p.status === 'published').length;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Tableau de bord éditeur</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Vue consolidée multi-auteurs · {authors.length} auteur{authors.length > 1 ? 's' : ''} · {totalTitles} titres</p>
        </div>
      </div>

      {/* KPIs consolidés */}
      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={authors.length} label="Auteurs" accent={c.mv} />
        <StatCard value={totalTitles} label="Titres total" accent={c.or} />
        <StatCard value={totalPublished} label="Publiés" accent={c.ok} />
        <StatCard value={projects.reduce((s, p) => s + p.editions.length, 0)} label="ISBN total" accent={c.vm} />
      </div>

      {/* Author filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setSelectedAuthor(null)} className="px-3 py-1.5 rounded-lg cursor-pointer text-[11px] font-semibold transition-all border-none"
          style={{ background: !selectedAuthor ? c.or : c.ft, color: !selectedAuthor ? 'white' : c.gr }}>
          Tous ({authors.length})
        </button>
        {authors.map(a => (
          <button key={a} onClick={() => setSelectedAuthor(selectedAuthor === a ? null : a)}
            className="px-3 py-1.5 rounded-lg cursor-pointer text-[11px] font-semibold transition-all border-none"
            style={{ background: selectedAuthor === a ? c.or : c.ft, color: selectedAuthor === a ? 'white' : c.gr }}>
            {a} ({projects.filter(p => p.author === a).length})
          </button>
        ))}
      </div>

      {/* Author cards */}
      <div className="space-y-5">
        {filteredStats.map(as => {
          const pctOfCatalogue = Math.round((as.count / totalTitles) * 100);
          return (
            <Card key={as.author} hover={false} className="overflow-hidden">
              <div className="px-3 md:px-5 py-3 flex items-center gap-4" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg, ${c.mv}, ${c.or})` }}>
                  {as.author.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="text-[16px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>{as.author}</div>
                  <div className="text-[11px]" style={{ color: c.gr }}>
                    {as.genres.join(', ')} · {pctOfCatalogue}% du catalogue
                  </div>
                </div>
                <div className="flex gap-3">
                  {[
                    { v: as.count, l: 'Titres', col: c.mv },
                    { v: as.published, l: 'Publiés', col: c.ok },
                    { v: as.totalISBN, l: 'ISBN', col: c.or },
                    { v: `${as.avgScore}%`, l: 'Score', col: as.avgScore > 70 ? c.ok : c.og },
                  ].map((kpi, i) => (
                    <div key={i} className="text-center px-3">
                      <div className="text-[18px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: kpi.col }}>{kpi.v}</div>
                      <div className="text-[8px] uppercase tracking-wider" style={{ color: c.gr }}>{kpi.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contribution bar */}
              <div className="px-3 md:px-5 py-3" style={{ borderBottom: `1px solid ${c.ft}` }}>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Contribution</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: c.gc }}>
                    <div className="h-full rounded-full" style={{ width: `${pctOfCatalogue}%`, background: `linear-gradient(90deg, ${c.or}, ${c.og})`, transition: 'width 0.8s ease' }} />
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: c.or }}>{pctOfCatalogue}%</span>
                </div>
              </div>

              {/* Titles grid */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {as.projects.map(p => {
                  const statusColor = p.status === 'published' ? c.ok : p.status === 'in-progress' ? c.og : c.gr;
                  return (
                    <div key={p.id} className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all hover:shadow-sm"
                      onClick={() => onProject(p)}
                      style={{ background: 'white', border: `1px solid ${c.gc}` }}>
                      <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold truncate" style={{ color: c.mv }}>{p.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                          <span className="text-[9px]" style={{ color: c.gr }}>{p.genre} · {p.pages}p · {p.editions.length} éd.</span>
                        </div>
                      </div>
                      {p.corrections.length > 0 && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FFE0E3', color: c.er }}>{p.corrections.length}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Cross-author comparison */}
      {authors.length > 1 && !selectedAuthor && (
        <Card hover={false} className="mt-5 overflow-hidden">
          <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
            <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>📊 Comparaison inter-auteurs</span>
          </div>
          <div className="overflow-x-auto">
            <div style={{overflowX:"auto",maxWidth:"100%"}}><table className="w-full text-[11px]">
              <thead>
                <tr style={{ background: c.ft }}>
                  {['Auteur', 'Titres', 'Publiés', 'ISBN', 'Pages total', 'Score moy.', 'Corrections', 'Poids catalogue'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold uppercase tracking-wider" style={{ color: c.gr, fontSize: 9 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {authorStats.map((as, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${c.ft}` }}>
                    <td className="px-3 py-3 font-semibold" style={{ color: c.mv }}>{as.author}</td>
                    <td className="px-3 py-3" style={{ color: c.vm }}>{as.count}</td>
                    <td className="px-3 py-3"><Badge bg="#D4F0E0" color={c.ok}>{as.published}</Badge></td>
                    <td className="px-3 py-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.or }}>{as.totalISBN}</td>
                    <td className="px-3 py-3" style={{ color: c.vm }}>{as.totalPages.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <span className="font-bold" style={{ color: as.avgScore > 70 ? c.ok : as.avgScore > 40 ? c.og : c.er }}>{as.avgScore}%</span>
                    </td>
                    <td className="px-3 py-3">
                      {as.corrections > 0
                        ? <Badge bg="#FFE0E3" color={c.er}>{as.corrections}</Badge>
                        : <span style={{ color: c.ok }}>✓</span>}
                    </td>
                    <td className="px-3 py-3" style={{ width: 100 }}>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: c.gc }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.round((as.count / totalTitles) * 100)}%`, background: c.or }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </Card>
      )}
    </div>
  );
};

// ═══════════════════════════════════
// BENCHMARK CONCURRENCE
// ═══════════════════════════════════

const BenchmarkView = ({ projects }: { projects: Project[] }) => {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const genres = [...new Set(projects.map(p => p.genre))];
  const activeGenre = selectedGenre || genres[0] || 'Roman';
  const genreProjects = projects.filter(p => p.genre === activeGenre);

  // Custom competitors (persisted)
  const [customCompetitors, setCustomCompetitors] = useState<Record<string, { name: string; price: string; pages: number; note: string }[]>>(() => {
    try { const s = localStorage.getItem('jabr-benchmark-competitors'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const persistCompetitors = (data: typeof customCompetitors) => { try { localStorage.setItem('jabr-benchmark-competitors', JSON.stringify(data)); } catch {} setCustomCompetitors(data); };

  const [showAddComp, setShowAddComp] = useState(false);
  const [compForm, setCompForm] = useState({ name: '', price: '', pages: '', note: '' });

  const addCompetitor = () => {
    if (!compForm.name.trim() || !compForm.price.trim()) return;
    const existing = customCompetitors[activeGenre] || [];
    persistCompetitors({ ...customCompetitors, [activeGenre]: [...existing, { name: compForm.name.trim(), price: compForm.price.trim(), pages: parseInt(compForm.pages) || 0, note: compForm.note.trim() }] });
    setCompForm({ name: '', price: '', pages: '', note: '' });
    setShowAddComp(false);
  };

  const removeCompetitor = (genre: string, idx: number) => {
    const existing = customCompetitors[genre] || [];
    persistCompetitors({ ...customCompetitors, [genre]: existing.filter((_: unknown, i: number) => i !== idx) });
  };

  // Market data by genre
  const marketData: Record<string, { avgPrice: number; avgPages: number; topPrice: number; lowPrice: number; avgPrint: number; marketSize: string; trend: string; competitors: { name: string; price: string; pages: number; note: string }[] }> = {
    'Roman': { avgPrice: 19.90, avgPages: 320, topPrice: 24.90, lowPrice: 7.90, avgPrint: 5.80, marketSize: '280M€', trend: '+2.1%', competitors: [
      { name: 'Gallimard — Blanche', price: '21,00€', pages: 280, note: 'Référence littéraire' },
      { name: 'Actes Sud', price: '20,50€', pages: 300, note: 'Littérature contemporaine' },
      { name: 'Grasset', price: '19,00€', pages: 260, note: 'Prix littéraires fréquents' },
      { name: 'Flammarion', price: '21,90€', pages: 340, note: 'Large catalogue' },
    ]},
    'Jeunesse': { avgPrice: 14.90, avgPages: 120, topPrice: 19.90, lowPrice: 5.90, avgPrint: 4.20, marketSize: '380M€', trend: '+4.3%', competitors: [
      { name: 'Nathan — Jeunesse', price: '12,90€', pages: 96, note: 'Leader jeunesse' },
      { name: 'Bayard', price: '13,50€', pages: 110, note: 'Presse + édition' },
      { name: 'Milan', price: '11,90€', pages: 80, note: 'Documentaires jeunesse' },
      { name: 'Gallimard Jeunesse', price: '15,90€', pages: 140, note: 'Classiques + nouveautés' },
    ]},
    'Fantasy': { avgPrice: 22.90, avgPages: 450, topPrice: 29.90, lowPrice: 8.90, avgPrint: 6.50, marketSize: '95M€', trend: '+8.7%', competitors: [
      { name: 'Bragelonne', price: '22,90€', pages: 480, note: 'Leader fantasy FR' },
      { name: 'L\'Atalante', price: '24,90€', pages: 520, note: 'SF & fantasy exigeante' },
      { name: 'Pocket Imaginaire', price: '8,90€', pages: 400, note: 'Poche référence' },
      { name: 'Mnémos', price: '21,00€', pages: 380, note: 'Indépendant reconnu' },
    ]},
    'Essai': { avgPrice: 21.50, avgPages: 280, topPrice: 25.00, lowPrice: 8.50, avgPrint: 5.40, marketSize: '190M€', trend: '+1.8%', competitors: [
      { name: 'La Découverte', price: '22,00€', pages: 320, note: 'Sciences humaines' },
      { name: 'Seuil', price: '20,00€', pages: 260, note: 'Essais grand public' },
      { name: 'PUF', price: '18,00€', pages: 240, note: 'Universitaire' },
      { name: 'Fayard', price: '23,50€', pages: 350, note: 'Politique & société' },
    ]},
    'BD': { avgPrice: 16.50, avgPages: 64, topPrice: 35.00, lowPrice: 10.95, avgPrint: 6.80, marketSize: '950M€', trend: '+5.2%', competitors: [
      { name: 'Dargaud', price: '14,50€', pages: 56, note: 'Franco-belge classique' },
      { name: 'Delcourt', price: '15,50€', pages: 48, note: 'Large catalogue' },
      { name: 'Casterman', price: '16,00€', pages: 64, note: 'BD d\'auteur' },
      { name: 'Ki-oon', price: '7,90€', pages: 192, note: 'Manga éditeur FR' },
    ]},
  };

  const market = marketData[activeGenre] || marketData['Roman'];
  const allCompetitors = [...market.competitors, ...(customCompetitors[activeGenre] || [])];
  const jabrAvgPrice = genreProjects.length > 0
    ? genreProjects.reduce((s, p) => {
        const price = primaryPrice(p);
        return s + (price ? parseFloat(price.replace('€', '').replace(',', '.')) : 0);
      }, 0) / genreProjects.length
    : 0;
  const jabrAvgPages = genreProjects.length > 0
    ? Math.round(genreProjects.reduce((s, p) => s + p.pages, 0) / genreProjects.length)
    : 0;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Benchmark Concurrence</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Positionnement marché, prix, concurrents par genre</p>
        </div>
      </div>

      {/* Genre tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {genres.map(g => (
          <button key={g} onClick={() => setSelectedGenre(g)}
            className="px-4 py-2 rounded-lg cursor-pointer text-[12px] font-semibold transition-all border-none"
            style={{ background: activeGenre === g ? c.or : c.ft, color: activeGenre === g ? 'white' : c.gr }}>
            {g} ({projects.filter(p => p.genre === g).length})
          </button>
        ))}
      </div>

      {/* Market overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <StatCard value={market.marketSize} label={`Marché ${activeGenre}`} accent={c.mv} />
        <StatCard value={market.trend} label="Tendance annuelle" accent={market.trend.startsWith('+') ? c.ok : c.er} />
        <StatCard value={`${market.avgPrice.toFixed(1)}€`} label="Prix moyen marché" accent={c.or} />
        <StatCard value={`${market.avgPages}p`} label="Pages moyen" accent={c.vm} />
        <StatCard value={jabrAvgPrice > 0 ? `${jabrAvgPrice.toFixed(1)}€` : '—'} label="Prix Jabrilia" accent={c.or} />
        <StatCard value={jabrAvgPages > 0 ? `${jabrAvgPages}p` : '—'} label="Pages Jabrilia" accent={c.vm} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Price positioning */}
        <Card hover={false} className="overflow-hidden">
          <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
            <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Positionnement prix</span>
          </div>
          <div className="p-3 md:p-5">
            <div className="relative h-12 rounded-xl mb-6 overflow-hidden" style={{ background: c.ft }}>
              <div className="absolute top-0 left-0 h-full rounded-l-xl" style={{ width: '100%', background: `linear-gradient(90deg, ${c.ok}15, ${c.og}15, ${c.er}15)` }} />
              <div className="absolute top-0 h-full flex flex-col items-center justify-end pb-1" style={{ left: `${((market.lowPrice - 5) / 30) * 100}%` }}>
                <div className="w-0.5 h-6" style={{ background: c.gr }} /><span className="text-[8px] font-bold" style={{ color: c.gr }}>{market.lowPrice}€</span>
              </div>
              <div className="absolute top-0 h-full flex flex-col items-center justify-end pb-1" style={{ left: `${((market.avgPrice - 5) / 30) * 100}%` }}>
                <div className="w-0.5 h-8" style={{ background: c.og }} /><span className="text-[8px] font-bold" style={{ color: c.og }}>Moy. {market.avgPrice}€</span>
              </div>
              <div className="absolute top-0 h-full flex flex-col items-center justify-end pb-1" style={{ left: `${Math.min(95, ((market.topPrice - 5) / 30) * 100)}%` }}>
                <div className="w-0.5 h-6" style={{ background: c.er }} /><span className="text-[8px] font-bold" style={{ color: c.er }}>{market.topPrice}€</span>
              </div>
              {jabrAvgPrice > 0 && (
                <div className="absolute top-0 h-full flex flex-col items-center" style={{ left: `${((jabrAvgPrice - 5) / 30) * 100}%` }}>
                  <div className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white mt-0.5" style={{ background: c.or }}>JABR {jabrAvgPrice.toFixed(1)}€</div>
                  <div className="w-0.5 flex-1" style={{ background: c.or }} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              {genreProjects.map(p => {
                const price = primaryPrice(p);
                const priceNum = price ? parseFloat(price.replace('€', '').replace(',', '.')) : 0;
                const diff = priceNum > 0 ? ((priceNum - market.avgPrice) / market.avgPrice * 100).toFixed(0) : null;
                return (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: c.ft }}>
                    <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold truncate" style={{ color: c.mv }}>{p.title}</div>
                      <div className="text-[10px]" style={{ color: c.gr }}>{p.pages}p · {price || 'Pas de prix'}</div>
                    </div>
                    {diff && (
                      <Badge bg={parseFloat(diff) > 5 ? '#FFE0E3' : parseFloat(diff) < -5 ? '#D4F0E0' : '#FFF3E0'}
                        color={parseFloat(diff) > 5 ? c.er : parseFloat(diff) < -5 ? c.ok : c.og}>
                        {parseFloat(diff) > 0 ? '+' : ''}{diff}% vs marché
                      </Badge>
                    )}
                  </div>
                );
              })}
              {genreProjects.length === 0 && (
                <div className="text-center py-4 text-[12px]" style={{ color: c.gr }}>Aucun titre Jabrilia en {activeGenre}</div>
              )}
            </div>
          </div>
        </Card>

        {/* Competitors — with add/remove */}
        <Card hover={false} className="overflow-hidden">
          <div className="px-3 md:px-5 py-3 flex justify-between items-center" style={{ borderBottom: `2px solid ${c.or}` }}>
            <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Concurrents — {activeGenre} ({allCompetitors.length})</span>
            <button onClick={() => setShowAddComp(!showAddComp)} className="text-[11px] font-semibold cursor-pointer bg-transparent border-none" style={{ color: c.or }}>{showAddComp ? '✕ Fermer' : '+ Ajouter'}</button>
          </div>
          {showAddComp && (
            <div className="px-3 md:px-5 py-3 flex gap-2 items-end flex-wrap" style={{ background: 'rgba(200,149,46,0.03)', borderBottom: `1px solid ${c.ft}` }}>
              <div className="flex-1 min-w-[120px]"><label className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Éditeur *</label><input value={compForm.name} onChange={e => setCompForm({ ...compForm, name: e.target.value })} className="w-full px-2 py-1.5 rounded text-[12px] outline-none" style={{ border: `1px solid ${c.gc}` }} placeholder="Gallimard" /></div>
              <div className="w-[80px]"><label className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Prix *</label><input value={compForm.price} onChange={e => setCompForm({ ...compForm, price: e.target.value })} className="w-full px-2 py-1.5 rounded text-[12px] outline-none" style={{ border: `1px solid ${c.gc}` }} placeholder="19,90€" /></div>
              <div className="w-[60px]"><label className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Pages</label><input value={compForm.pages} onChange={e => setCompForm({ ...compForm, pages: e.target.value })} className="w-full px-2 py-1.5 rounded text-[12px] outline-none" style={{ border: `1px solid ${c.gc}` }} placeholder="300" /></div>
              <div className="flex-1 min-w-[100px]"><label className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: c.gr }}>Note</label><input value={compForm.note} onChange={e => setCompForm({ ...compForm, note: e.target.value })} className="w-full px-2 py-1.5 rounded text-[12px] outline-none" style={{ border: `1px solid ${c.gc}` }} placeholder="Commentaire" /></div>
              <Btn onClick={addCompetitor}>Ajouter</Btn>
            </div>
          )}
          <div className="divide-y" style={{ borderColor: c.ft }}>
            {allCompetitors.map((comp, i) => {
              const isCustom = i >= market.competitors.length;
              const customIdx = i - market.competitors.length;
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[rgba(200,149,46,0.02)]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] font-bold" style={{ background: isCustom ? 'rgba(200,149,46,0.1)' : c.ft, color: c.mv }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold" style={{ color: c.mv }}>{comp.name} {isCustom && <span className="text-[9px] font-normal" style={{ color: c.or }}>· perso</span>}</div>
                    <div className="text-[10px]" style={{ color: c.gr }}>{comp.note}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.or }}>{comp.price}</div>
                    {comp.pages > 0 && <div className="text-[9px]" style={{ color: c.gr }}>{comp.pages}p moy.</div>}
                  </div>
                  {isCustom && <button onClick={() => removeCompetitor(activeGenre, customIdx)} className="text-[11px] cursor-pointer bg-transparent border-none" style={{ color: c.er }}>✕</button>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card hover={false} className="mt-5 p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: c.or }}>💡 Recommandations</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '💰', title: 'Prix', text: jabrAvgPrice > market.avgPrice ? `Vos prix sont ${((jabrAvgPrice - market.avgPrice) / market.avgPrice * 100).toFixed(0)}% au-dessus du marché. Envisagez un format poche pour compétitivité.` : jabrAvgPrice > 0 ? `Bon positionnement prix, ${((market.avgPrice - jabrAvgPrice) / market.avgPrice * 100).toFixed(0)}% sous la moyenne. Marge d'augmentation possible.` : `Définissez vos prix pour comparer avec le marché ${activeGenre}.` },
            { icon: '📖', title: 'Pages', text: jabrAvgPages > market.avgPages ? `Vos titres (${jabrAvgPages}p) sont plus longs que la moyenne (${market.avgPages}p). Atout qualité perçue.` : jabrAvgPages > 0 ? `Format compact (${jabrAvgPages}p vs ${market.avgPages}p). Cohérent si prix ajusté.` : `Pas de données de pagination pour ce genre.` },
            { icon: '📈', title: 'Marché', text: `Le segment ${activeGenre} pèse ${market.marketSize} avec une tendance de ${market.trend}. ${market.trend.startsWith('+') && parseFloat(market.trend) > 3 ? 'Segment dynamique, bon positionnement.' : 'Marché stable, misez sur la différenciation.'}` },
          ].map((rec, i) => (
            <div key={i} className="p-3.5 rounded-xl" style={{ background: c.ft }}>
              <div className="text-lg mb-1">{rec.icon}</div>
              <div className="text-[12px] font-semibold mb-1" style={{ color: c.mv }}>{rec.title}</div>
              <div className="text-[11px] leading-relaxed" style={{ color: c.gr }}>{rec.text}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════
// DROITS & CONTRATS
// ═══════════════════════════════════

const DroitsView = ({ projects, onToast }: { projects: Project[]; onToast: (msg: string) => void }) => {
  const rightsTypes = [
    { id: 'print', label: '📖 Droits d\'impression', desc: 'Impression et diffusion papier', territories: 'France, Belgique, Suisse, Luxembourg, Canada', status: 'actif', color: c.ok },
    { id: 'digital', label: '📱 Droits numériques', desc: 'ePub, PDF, plateformes digitales', territories: 'Mondial', status: 'actif', color: c.ok },
    { id: 'audio', label: '🎧 Droits audio', desc: 'Audiobooks, podcasts, lectures publiques', territories: 'Francophonie', status: 'actif', color: c.ok },
    { id: 'translation', label: '🌍 Droits de traduction', desc: 'Cessions de droits pour éditions étrangères', territories: '—', status: 'disponible', color: c.og },
    { id: 'adaptation', label: '🎬 Droits d\'adaptation', desc: 'Cinéma, série TV, théâtre, BD', territories: '—', status: 'disponible', color: c.og },
    { id: 'merchandise', label: '🎁 Produits dérivés', desc: 'Goodies, illustrations, licences', territories: '—', status: 'disponible', color: c.og },
  ];

  const [contracts, setContracts] = useState(() => {
    try { const s = localStorage.getItem('jabr-contracts-v2'); if (s) return JSON.parse(s); } catch { /* noop */ }
    return [
    { id: '1', title: 'Contrat d\'édition', author: 'Steve Moradel', type: 'Cession de droits', start: '2025-01-01', end: '2030-12-31', titles: projects.filter(p => p.author === 'Steve Moradel').length, status: 'actif', notes: '' },
    { id: '2', title: 'Distribution KDP', author: 'Jabrilia → Amazon', type: 'Distribution', start: '2025-02-15', end: '', titles: projects.filter(p => p.editions.some(e => e.format === 'broché' || e.format === 'epub')).length, status: 'actif', notes: 'Renouvelable automatiquement' },
    { id: '3', title: 'Illustratrice Anti-Stress', author: 'Allison Moradel', type: 'Commande illustration', start: '2025-01-01', end: '2025-06-30', titles: 1, status: 'terminé', notes: '' },
  ];
  });

  const persistContracts = (c2: typeof contracts) => { try { localStorage.setItem('jabr-contracts-v2', JSON.stringify(c2)); } catch {} setContracts(c2); };

  // Rights matrix state
  const [rightsMatrix, setRightsMatrix] = useState<Record<string, boolean>>(() => {
    try { const s = localStorage.getItem('jabr-rights-matrix'); if (s) return JSON.parse(s); } catch {}
    const m: Record<string, boolean> = {};
    projects.forEach(p => {
      m[`${p.id}-print`] = p.editions.some(e => ['broché', 'poche', 'relié'].includes(e.format));
      m[`${p.id}-digital`] = p.editions.some(e => ['epub', 'pdf'].includes(e.format));
      m[`${p.id}-audio`] = p.editions.some(e => e.format === 'audiobook');
    });
    return m;
  });
  const persistMatrix = (m: Record<string, boolean>) => { try { localStorage.setItem('jabr-rights-matrix', JSON.stringify(m)); } catch {} setRightsMatrix(m); };
  const toggleRight = (key: string) => { persistMatrix({ ...rightsMatrix, [key]: !rightsMatrix[key] }); };

  // Contract modal
  const [showModal, setShowModal] = useState(false);
  const [editContract, setEditContract] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', author: '', type: 'Cession de droits', start: '', end: '', notes: '' });

  const contractTypes = ['Cession de droits', 'Distribution', 'Commande illustration', 'Licence', 'Traduction', 'Adaptation', 'Autre'];

  const openCreate = () => { setForm({ title: '', author: '', type: 'Cession de droits', start: '', end: '', notes: '' }); setEditContract(null); setShowModal(true); };
  const openEdit = (ct: typeof contracts[0]) => { setForm({ title: ct.title, author: ct.author, type: ct.type, start: ct.start, end: ct.end, notes: ct.notes || '' }); setEditContract(ct.id); setShowModal(true); };

  const handleSave = () => {
    if (!form.title.trim() || !form.author.trim()) { onToast('Titre et auteur requis'); return; }
    if (editContract) {
      persistContracts(contracts.map((ct: { id: string }) => ct.id === editContract ? { ...ct, ...form } : ct));
      onToast('Contrat modifié');
    } else {
      persistContracts([...contracts, { id: Date.now().toString(), ...form, titles: 0, status: 'actif' }]);
      onToast('Contrat créé');
    }
    setShowModal(false);
  };

  const deleteContract = (id: string) => { persistContracts(contracts.filter((ct: { id: string }) => ct.id !== id)); onToast('Contrat supprimé'); };
  const toggleContractStatus = (id: string) => {
    persistContracts(contracts.map((ct: { id: string; status: string }) => ct.id === id ? { ...ct, status: ct.status === 'actif' ? 'terminé' : 'actif' } : ct));
  };

  const territories = [
    { zone: '🇫🇷 France', rights: 'Tous droits', titles: projects.length, active: true },
    { zone: '🇧🇪 Belgique', rights: 'Print + Digital', titles: projects.filter(p => p.status === 'published').length, active: true },
    { zone: '🇨🇭 Suisse', rights: 'Print + Digital', titles: projects.filter(p => p.status === 'published').length, active: true },
    { zone: '🇱🇺 Luxembourg', rights: 'Print + Digital', titles: projects.filter(p => p.status === 'published').length, active: true },
    { zone: '🇨🇦 Canada', rights: 'Print + Digital', titles: projects.filter(p => p.status === 'published').length, active: true },
    { zone: '🌍 Reste du monde', rights: 'Digital only', titles: projects.filter(p => p.editions.some(e => e.format === 'epub')).length, active: true },
    { zone: '🇬🇧 UK / 🇺🇸 US', rights: 'Non cédés', titles: 0, active: false },
    { zone: '🇩🇪 Allemagne', rights: 'Non cédés', titles: 0, active: false },
  ];

  const exportRights = () => {
    const lines = ['JABR — Récapitulatif des droits', `Date : ${new Date().toLocaleDateString('fr-FR')}`, '', '== CONTRATS ==', ...contracts.map((ct: { title: string; author: string; type: string; start: string; end: string; status: string }) => `${ct.title} | ${ct.author} | ${ct.type} | ${ct.start} → ${ct.end || 'Renouvelable'} | ${ct.status}`), '', '== MATRICE DROITS ==', ...projects.map(p => `${p.title} | Print:${rightsMatrix[`${p.id}-print`] ? '✓' : '—'} Digital:${rightsMatrix[`${p.id}-digital`] ? '✓' : '—'} Audio:${rightsMatrix[`${p.id}-audio`] ? '✓' : '—'} Trad:${rightsMatrix[`${p.id}-translation`] ? '✓' : '—'} Adapt:${rightsMatrix[`${p.id}-adaptation`] ? '✓' : '—'} Dérivés:${rightsMatrix[`${p.id}-merchandise`] ? '✓' : '—'}`)];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'jabr-droits-export.txt'; a.click();
    onToast('Export des droits téléchargé');
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Droits & Contrats</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Gestion des droits dérivés, adaptations et territoires</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={exportRights}>{icons.download} Export</Btn>
          <Btn onClick={openCreate}>{icons.plus} Nouveau contrat</Btn>
        </div>
      </div>

      {/* Contract modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-[200]" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-[90vw] max-w-[480px] rounded-2xl p-6" style={{ background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>{editContract ? 'Modifier le contrat' : 'Nouveau contrat'}</h3>
            <div className="space-y-3">
              <div><label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.gr }}>Titre du contrat *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg text-[13px] outline-none" style={{ border: `1.5px solid ${c.gc}` }} placeholder="Ex : Contrat de traduction EN" /></div>
              <div><label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.gr }}>Parties *</label><input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg text-[13px] outline-none" style={{ border: `1.5px solid ${c.gc}` }} placeholder="Ex : Jabrilia → Penguin Books" /></div>
              <div><label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.gr }}>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg text-[13px] outline-none cursor-pointer" style={{ border: `1.5px solid ${c.gc}` }}>
                  {contractTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.gr }}>Date début</label><input type="date" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg text-[13px] outline-none" style={{ border: `1.5px solid ${c.gc}` }} /></div>
                <div className="flex-1"><label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.gr }}>Date fin</label><input type="date" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg text-[13px] outline-none" style={{ border: `1.5px solid ${c.gc}` }} /></div>
              </div>
              <div><label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.gr }}>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2.5 rounded-lg text-[13px] outline-none resize-none" style={{ border: `1.5px solid ${c.gc}` }} placeholder="Notes optionnelles..." /></div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Annuler</Btn>
              <Btn onClick={handleSave}>{editContract ? 'Enregistrer' : 'Créer'}</Btn>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={rightsTypes.filter(r => r.status === 'actif').length} label="Droits actifs" accent={c.ok} />
        <StatCard value={rightsTypes.filter(r => r.status === 'disponible').length} label="Disponibles" accent={c.og} />
        <StatCard value={contracts.filter((ct: { status: string }) => ct.status === 'actif').length} label="Contrats actifs" accent={c.mv} />
        <StatCard value={territories.filter(t => t.active).length} label="Territoires" accent={c.or} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Types de droits */}
        <Card hover={false} className="overflow-hidden">
          <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
            <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Types de droits</span>
          </div>
          <div className="p-4 space-y-3">
            {rightsTypes.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[rgba(200,149,46,0.03)]" style={{ border: `1px solid ${c.gc}` }}>
                <span className="text-lg shrink-0">{r.label.split(' ')[0]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold" style={{ color: c.mv }}>{r.label.split(' ').slice(1).join(' ')}</div>
                  <div className="text-[10px]" style={{ color: c.gr }}>{r.desc}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: c.vm }}>🌍 {r.territories}</div>
                </div>
                <Badge bg={r.status === 'actif' ? '#D4F0E0' : '#FFF3E0'} color={r.color}>
                  {r.status === 'actif' ? '✓ Actif' : '◎ Disponible'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Territoires */}
        <Card hover={false} className="overflow-hidden">
          <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
            <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Couverture territoriale</span>
          </div>
          <div className="p-4">
            {territories.map((t, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
                <span className="text-base w-[80px] md:w-[120px] text-[12px] font-semibold" style={{ color: t.active ? c.mv : c.gr }}>{t.zone}</span>
                <div className="flex-1 text-[11px]" style={{ color: c.gr }}>{t.rights}</div>
                <span className="text-[11px] font-bold" style={{ color: t.active ? c.ok : c.gr }}>
                  {t.titles > 0 ? `${t.titles} titre${t.titles > 1 ? 's' : ''}` : '—'}
                </span>
                <div className="w-2 h-2 rounded-full" style={{ background: t.active ? c.ok : c.gc }} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Contrats CRUD */}
      <Card hover={false} className="mt-5 overflow-hidden">
        <div className="px-3 md:px-5 py-3 flex justify-between items-center" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Contrats ({contracts.length})</span>
          <Btn variant="secondary" onClick={openCreate}>{icons.plus} Ajouter</Btn>
        </div>
        <div className="divide-y" style={{ borderColor: c.ft }}>
          {contracts.map((ct: { id: string; title: string; author: string; type: string; start: string; end: string; status: string; titles: number; notes?: string }) => (
            <div key={ct.id} className="flex items-center gap-4 px-3 md:px-5 py-4 transition-colors hover:bg-[rgba(200,149,46,0.02)]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ct.status === 'actif' ? '#D4F0E0' : c.ft }}>
                <span className="text-base">{ct.type === 'Distribution' ? '🚚' : ct.type === 'Commande illustration' ? '🎨' : ct.type === 'Traduction' ? '🌍' : ct.type === 'Adaptation' ? '🎬' : '📜'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold" style={{ color: c.mv }}>{ct.title}</div>
                <div className="text-[11px]" style={{ color: c.gr }}>{ct.author} · {ct.type}</div>
                {ct.notes && <div className="text-[10px] mt-0.5 italic" style={{ color: c.gr }}>{ct.notes}</div>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px]" style={{ color: c.vm }}>{ct.start ? new Date(ct.start).toLocaleDateString('fr-FR') : '—'} → {ct.end ? new Date(ct.end).toLocaleDateString('fr-FR') : 'Renouvelable'}</div>
                <div className="text-[10px]" style={{ color: c.gr }}>{ct.titles} titre{ct.titles > 1 ? 's' : ''}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleContractStatus(ct.id)} className="cursor-pointer bg-transparent border-none"><Badge bg={ct.status === 'actif' ? '#D4F0E0' : c.ft} color={ct.status === 'actif' ? c.ok : c.gr}>{ct.status === 'actif' ? '✓ Actif' : '○ Terminé'}</Badge></button>
                <button onClick={() => openEdit(ct)} className="px-2 py-1 rounded cursor-pointer bg-transparent border-none text-[11px]" style={{ color: c.gr }}>✎</button>
                <button onClick={() => deleteContract(ct.id)} className="px-2 py-1 rounded cursor-pointer bg-transparent border-none text-[11px]" style={{ color: c.er }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Matrice droits × titres — INTERACTIVE */}
      <Card hover={false} className="mt-5 overflow-hidden">
        <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
          <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Matrice Droits × Titres</span>
          <span className="text-[10px] ml-2" style={{ color: c.gr }}>Cliquez pour modifier</span>
        </div>
        <div className="overflow-x-auto">
          <div style={{overflowX:"auto",maxWidth:"100%"}}><table className="w-full text-[11px]">
            <thead>
              <tr style={{ background: c.ft }}>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: c.mv }}>Titre</th>
                {['print', 'digital', 'audio', 'translation', 'adaptation', 'merchandise'].map(h => (
                  <th key={h} className="text-center px-2 py-2.5 font-semibold" style={{ color: c.gr }}>{h === 'print' ? 'Print' : h === 'digital' ? 'Digital' : h === 'audio' ? 'Audio' : h === 'translation' ? 'Trad.' : h === 'adaptation' ? 'Adapt.' : 'Dérivés'}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${c.ft}` }}>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: c.mv }}>{p.title}</td>
                  {['print', 'digital', 'audio', 'translation', 'adaptation', 'merchandise'].map(right => {
                    const key = `${p.id}-${right}`;
                    const active = !!rightsMatrix[key];
                    return (
                      <td key={right} className="text-center px-2 py-2.5">
                        <button onClick={() => toggleRight(key)} className="w-6 h-6 rounded-full mx-auto flex items-center justify-center cursor-pointer transition-all border-none" style={{ background: active ? '#D4F0E0' : c.ft }}>
                          <span style={{ fontSize: 10, color: active ? c.ok : c.gr }}>{active ? '✓' : '—'}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════
// SETTINGS
// ═══════════════════════════════════

// ═══════════════════════════════════
// CALENDRIER ÉDITORIAL + PLAN MÉDIA IA
// ═══════════════════════════════════

type CalEvent = { month: number; label: string; type: 'salon' | 'saison' | 'commercial' | 'media'; genres?: string[] };

const EVENTS_CALENDAR: CalEvent[] = [
  // Salons & événements littéraires
  { month: 1, label: 'Festival BD Angoulême', type: 'salon', genres: ['BD', 'Graphique'] },
  { month: 3, label: 'Salon du Livre Paris', type: 'salon' },
  { month: 3, label: 'Printemps des Poètes', type: 'salon', genres: ['Poésie', 'Essai'] },
  { month: 4, label: 'Foire du Livre Bruxelles', type: 'salon' },
  { month: 5, label: 'Salon du Livre Outre-Mer', type: 'salon' },
  { month: 6, label: 'Prix littéraires été (sélections)', type: 'salon' },
  { month: 9, label: 'Rentrée littéraire', type: 'salon' },
  { month: 10, label: 'Salon du Livre Jeunesse Montreuil (prep)', type: 'salon', genres: ['Jeunesse'] },
  { month: 10, label: 'Prix Goncourt / Renaudot / Femina', type: 'salon', genres: ['Roman'] },
  { month: 11, label: 'Salon du Livre Jeunesse Montreuil', type: 'salon', genres: ['Jeunesse'] },
  { month: 11, label: 'Black Friday / Cyber Monday', type: 'commercial' },
  // Saisons commerciales
  { month: 1, label: 'Bonnes résolutions (dev perso, santé)', type: 'saison', genres: ['Essai', 'Développement personnel'] },
  { month: 2, label: 'Saint-Valentin (romance, cadeaux)', type: 'commercial', genres: ['Roman'] },
  { month: 5, label: 'Fête des mères', type: 'commercial' },
  { month: 6, label: 'Lectures été / vacances', type: 'saison' },
  { month: 9, label: 'Rentrée scolaire', type: 'saison', genres: ['Jeunesse', 'Éducation'] },
  { month: 10, label: 'Halloween (thriller, fantastique)', type: 'saison', genres: ['Thriller', 'Fantasy', 'Fantastique'] },
  { month: 12, label: 'Noël — pic cadeaux livres', type: 'commercial' },
  { month: 12, label: 'Coffrets, éditions spéciales', type: 'commercial' },
  // Médias
  { month: 1, label: 'La Grande Librairie — rentrée janvier', type: 'media' },
  { month: 3, label: 'Émissions spéciales Salon du Livre', type: 'media' },
  { month: 9, label: 'La Grande Librairie — rentrée sept.', type: 'media' },
  { month: 9, label: 'Chroniques rentrée littéraire presse', type: 'media' },
];

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTH_FULL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const EVENT_COLORS: Record<CalEvent['type'], { bg: string; color: string; label: string }> = {
  salon: { bg: '#E8E0F0', color: '#5B3E8A', label: 'Salon' },
  saison: { bg: '#D4F0E0', color: '#2EAE6D', label: 'Saison' },
  commercial: { bg: '#FDE8D0', color: '#E07A2F', label: 'Commercial' },
  media: { bg: '#E0ECFF', color: '#3B6DC6', label: 'Média' },
};

type AiRecommendation = {
  sortie: { mois: string; raison: string }[];
  eviter: { mois: string; raison: string }[];
  medias: { nom: string; type: string; raison: string; contact?: string }[];
  evenements: { nom: string; date: string; action: string }[];
  strategie: string;
};

const CalendrierView = ({ projects, onToast, calStore }: { projects: Project[]; onToast: (msg: string) => void; calStore: ReturnType<typeof useCalendarResults> }) => {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aiResults = calStore.results as Record<number, AiRecommendation>;

  const currentMonth = new Date().getMonth() + 1;

  const analyzeProject = async (p: Project) => {
    if (aiResults[p.id]) { setSelectedProject(p.id); return; }
    setLoading(p.id);
    setError(null);
    try {
      const prompt = `Tu es un expert en stratégie éditoriale et plan média pour l'édition française. Analyse ce livre et recommande les meilleures périodes de sortie et un plan média.

LIVRE:
- Titre: ${p.title}
- Genre: ${p.genre}
- Collection: ${p.collection || 'Hors collection'}
- Pages: ${p.pages}
- Auteur: ${p.author}
- Formats: ${p.editions.map(e => e.format).join(', ')}
${p.backCover ? `- 4e de couverture: ${p.backCover.slice(0, 300)}` : ''}
${p.subtitle ? `- Sous-titre: ${p.subtitle}` : ''}

CONTEXTE: Jabrilia Éditions, éditeur indépendant basé en France. Auteur caribéen (Guadeloupe). Spécialités: littérature, essais, jeunesse, BD.

Réponds UNIQUEMENT en JSON valide sans backticks ni markdown, avec cette structure exacte:
{
  "sortie": [{"mois": "Septembre", "raison": "Rentrée littéraire..."}],
  "eviter": [{"mois": "Juillet", "raison": "Creux estival..."}],
  "medias": [{"nom": "France Inter - La Bande Originale", "type": "Radio", "raison": "Audience large, chronique culture quotidienne", "contact": "producteur@radiofrance.com"}],
  "evenements": [{"nom": "Salon du Livre Paris", "date": "Mars", "action": "Stand partagé, dédicace, pitch éditeur"}],
  "strategie": "Résumé en 2-3 phrases de la stratégie recommandée"
}

Donne 2-3 mois de sortie idéaux, 1-2 mois à éviter, 5-8 médias pertinents (radio, TV, presse, podcasts, blogs, réseaux), 3-5 événements, et une stratégie globale.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map((b: { type: string; text?: string }) => b.type === 'text' ? b.text : '').join('') || '';
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed: AiRecommendation = JSON.parse(cleaned);
      calStore.save(p.id, parsed);
      setSelectedProject(p.id);
      onToast(`Analyse calendrier : ${p.title}`);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de l\'analyse IA. Réessayez.');
      onToast('Erreur analyse calendrier');
    } finally {
      setLoading(null);
    }
  };

  const monthEvents = selectedMonth ? EVENTS_CALENDAR.filter(e => e.month === selectedMonth) : [];
  const selectedP = selectedProject ? projects.find(p => p.id === selectedProject) : null;
  const aiRec = selectedProject ? aiResults[selectedProject] : null;

  const exportPlanMedia = (p: Project, rec: AiRecommendation) => {
    const lines = [
      `PLAN MÉDIA & CALENDRIER ÉDITORIAL`,
      `${p.title} — ${p.genre} — ${p.author}`,
      `Jabrilia Éditions · ${new Date().toLocaleDateString('fr-FR')}`,
      ``,
      `═══ STRATÉGIE ═══`,
      rec.strategie,
      ``,
      `═══ FENÊTRES DE SORTIE RECOMMANDÉES ═══`,
      ...rec.sortie.map(s => `  ✦ ${s.mois}: ${s.raison}`),
      ``,
      `═══ PÉRIODES À ÉVITER ═══`,
      ...rec.eviter.map(e => `  ✗ ${e.mois}: ${e.raison}`),
      ``,
      `═══ MÉDIAS RECOMMANDÉS ═══`,
      ...rec.medias.map(m => `  → ${m.nom} (${m.type})\n    ${m.raison}${m.contact ? `\n    Contact: ${m.contact}` : ''}`),
      ``,
      `═══ ÉVÉNEMENTS ═══`,
      ...rec.evenements.map(e => `  📅 ${e.nom} — ${e.date}\n    Action: ${e.action}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `plan-media-${p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`; a.click();
    onToast(`Plan média exporté : ${p.title}`);
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Calendrier Éditorial</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Fenêtres de sortie optimales + plan média IA par titre</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard value={EVENTS_CALENDAR.filter(e => e.type === 'salon').length} label="Salons & prix" accent="#5B3E8A" />
        <StatCard value={EVENTS_CALENDAR.filter(e => e.type === 'commercial').length} label="Temps forts" accent={c.og} />
        <StatCard value={Object.keys(aiResults).length} label="Titres analysés" accent={c.ok} />
        <StatCard value={currentMonth} label={`Mois actuel (${MONTH_NAMES[currentMonth - 1]})`} accent={c.or} />
      </div>

      {/* Timeline 12 mois */}
      <Card hover={false} className="p-5 mb-6">
        <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 11, color: c.gr }}>
          Timeline annuelle — cliquez un mois pour voir les événements
        </div>
        <div className="grid grid-cols-12 gap-1">
          {MONTH_NAMES.map((m, i) => {
            const monthNum = i + 1;
            const events = EVENTS_CALENDAR.filter(e => e.month === monthNum);
            const isSelected = selectedMonth === monthNum;
            const isCurrent = currentMonth === monthNum;
            return (
              <div key={m} className="cursor-pointer rounded-lg p-2 text-center transition-all hover:scale-105"
                onClick={() => setSelectedMonth(isSelected ? null : monthNum)}
                style={{
                  background: isSelected ? c.or : isCurrent ? 'rgba(200,149,46,0.08)' : c.ft,
                  border: isCurrent && !isSelected ? `2px solid ${c.or}` : '2px solid transparent',
                }}>
                <div className="text-[10px] font-bold" style={{ color: isSelected ? 'white' : c.mv }}>{m}</div>
                <div className="flex justify-center gap-0.5 mt-1.5 flex-wrap">
                  {events.slice(0, 3).map((e, j) => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: EVENT_COLORS[e.type].color }} />
                  ))}
                  {events.length === 0 && <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.gc }} />}
                </div>
                <div className="text-[8px] mt-0.5 font-semibold" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : c.gr }}>
                  {events.length > 0 ? `${events.length}` : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 justify-center">
          {Object.entries(EVENT_COLORS).map(([type, { bg, color, label }]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[9px] font-semibold" style={{ color: c.gr }}>{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Month detail */}
      {selectedMonth && (
        <Card hover={false} className="p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold" style={{ color: c.mv }}>{MONTH_FULL[selectedMonth - 1]}</h3>
            <span className="text-[11px] font-semibold" style={{ color: c.gr }}>{monthEvents.length} événement{monthEvents.length > 1 ? 's' : ''}</span>
          </div>
          {monthEvents.length === 0 ? (
            <div className="text-center py-4 text-[12px]" style={{ color: c.gr }}>Mois calme — fenêtre possible pour sorties hors-calendrier</div>
          ) : (
            <div className="space-y-2">
              {monthEvents.map((e, i) => {
                const ec = EVENT_COLORS[e.type];
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: ec.bg + '30' }}>
                    <div className="w-2 h-8 rounded-full shrink-0" style={{ background: ec.color }} />
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold" style={{ color: c.mv }}>{e.label}</div>
                      {e.genres && <div className="text-[10px] mt-0.5" style={{ color: c.gr }}>Genres : {e.genres.join(', ')}</div>}
                    </div>
                    <Badge bg={ec.bg} color={ec.color}>{ec.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Projects — AI Analysis */}
      <Card hover={false} className="overflow-hidden mb-6">
        <div className="px-3 md:px-5 py-3 flex items-center justify-between" style={{ background: c.ft, borderBottom: `2px solid ${c.or}` }}>
          <div>
            <span className="text-[15px] font-semibold" style={{ color: c.mv }}>Moteur IA — Analyse par titre</span>
            <span className="text-[11px] ml-3" style={{ color: c.gr }}>Cliquez un titre pour obtenir fenêtre de sortie + plan média</span>
          </div>
        </div>

        <div className="p-3 md:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map(p => {
              const hasResult = !!aiResults[p.id];
              const isLoading = loading === p.id;
              const isSelected = selectedProject === p.id;
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ background: isSelected ? 'rgba(200,149,46,0.08)' : 'white', border: `2px solid ${isSelected ? c.or : c.gc}` }}
                  onClick={() => !isLoading && analyzeProject(p)}>
                  <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate" style={{ color: c.mv }}>{p.title}</div>
                    <div className="text-[10px]" style={{ color: c.gr }}>{p.genre} · {p.pages}p</div>
                  </div>
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: c.or, borderTopColor: 'transparent' }} />
                  ) : hasResult ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#D4F0E0' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2EAE6D" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  ) : (
                    <div className="text-[10px] px-2 py-1 rounded font-semibold" style={{ background: c.ft, color: c.vm }}>Analyser</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg text-[12px] font-semibold" style={{ background: '#FFF0F0', color: c.er }}>
          {error}
        </div>
      )}

      {/* AI Result panel */}
      {selectedP && aiRec && (
        <Card hover={false} className="overflow-hidden">
          <div className="px-3 md:px-6 py-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${c.mv}, #3E2768)` }}>
            <div className="flex items-center gap-3">
              <CoverThumb emoji={selectedP.cover} coverImage={selectedP.coverImage} size="sm" />
              <div>
                <div className="text-white font-semibold">{selectedP.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{selectedP.genre} · {selectedP.author}</div>
              </div>
            </div>
            <Btn variant="secondary" onClick={() => exportPlanMedia(selectedP, aiRec)}>{icons.download} Exporter plan</Btn>
          </div>

          {/* Stratégie globale */}
          <div className="px-3 md:px-6 py-4" style={{ background: 'rgba(200,149,46,0.04)', borderBottom: `1px solid ${c.gc}` }}>
            <div className="uppercase tracking-wider font-semibold mb-2" style={{ fontSize: 10, color: c.or }}>Stratégie recommandée</div>
            <div className="text-[13px] leading-relaxed" style={{ color: c.nr }}>{aiRec.strategie}</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Fenêtres de sortie */}
            <div className="p-4 md:p-6" style={{ borderRight: `1px solid ${c.ft}` }}>
              <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 11, color: c.ok }}>
                ✦ Fenêtres de sortie idéales
              </div>
              {aiRec.sortie.map((s, i) => (
                <div key={i} className="flex gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: c.ok }} />
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: c.mv }}>{s.mois}</div>
                    <div className="text-[11px] leading-relaxed" style={{ color: c.gr }}>{s.raison}</div>
                  </div>
                </div>
              ))}

              <div className="uppercase tracking-wider font-semibold mt-6 mb-4" style={{ fontSize: 11, color: c.er }}>
                ✗ Périodes à éviter
              </div>
              {aiRec.eviter.map((e, i) => (
                <div key={i} className="flex gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: c.er }} />
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: c.mv }}>{e.mois}</div>
                    <div className="text-[11px] leading-relaxed" style={{ color: c.gr }}>{e.raison}</div>
                  </div>
                </div>
              ))}

              <div className="uppercase tracking-wider font-semibold mt-6 mb-4" style={{ fontSize: 11, color: '#5B3E8A' }}>
                📅 Événements cibles
              </div>
              {aiRec.evenements.map((e, i) => (
                <div key={i} className="flex gap-3 mb-3 p-2.5 rounded-lg" style={{ background: c.ft }}>
                  <div>
                    <div className="text-[12px] font-semibold" style={{ color: c.mv }}>{e.nom}</div>
                    <div className="text-[10px]" style={{ color: c.vm }}>{e.date}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: c.gr }}>{e.action}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Plan média */}
            <div className="p-4 md:p-6">
              <div className="uppercase tracking-wider font-semibold mb-4" style={{ fontSize: 11, color: '#3B6DC6' }}>
                📡 Plan média recommandé
              </div>
              <div className="space-y-2.5">
                {aiRec.medias.map((m, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: 'white', border: `1px solid ${c.gc}` }}>
                    <div className="flex justify-between items-start">
                      <div className="text-[13px] font-semibold" style={{ color: c.mv }}>{m.nom}</div>
                      <Badge bg="#E0ECFF" color="#3B6DC6">{m.type}</Badge>
                    </div>
                    <div className="text-[11px] mt-1.5 leading-relaxed" style={{ color: c.gr }}>{m.raison}</div>
                    {m.contact && (
                      <div className="text-[10px] mt-1.5 font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.vm }}>
                        {m.contact}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

const SettingsView = ({ onToast, dark, toggleDark, onImport, lang, toggleLang, onRestartTour, onSignOut }: { onToast: (msg: string) => void; dark: boolean; toggleDark: () => void; onImport?: (projects: Project[]) => void; lang: Lang; toggleLang: () => void; onRestartTour?: () => void; onSignOut?: () => void }) => {
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
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div><h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Paramètres</h2><p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Configuration Jabrilia · Persistée localement</p></div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={handleExport}>{icons.download} Exporter</Btn>
          <Btn variant="secondary" onClick={handleReset}>Réinitialiser</Btn>
          <Btn onClick={handleSave}>{saved ? icons.check : icons.edit} {saved ? 'Enregistré ✓' : 'Enregistrer'}</Btn>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card hover={false} className="p-3 md:p-5">
          <h3 className="text-base mb-4" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Maison d&apos;édition</h3>
          <Field label="Nom" k="editeur" />
          <Field label="Auteur principal" k="auteur" />
          <Field label="Préfixe ISBN" k="prefixe" mono />
          <Field label="Email" k="email" />
          <Field label="Site web" k="site" />
          <Field label="Distributeur principal" k="distributor" />
        </Card>
        <Card hover={false} className="p-3 md:p-5">
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
          <Card hover={false} className="p-3 md:p-5">
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
          <Card hover={false} className="p-3 md:p-5">
            <h3 className="text-base mb-4" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Production audio</h3>
            <Field label="Voix TTS par défaut" k="ttsVoice" />
            <Field label="Coût estimé €/min" k="ttsCost" mono />
          </Card>
          <Card hover={false} className="p-3 md:p-5">
            <h3 className="text-base mb-4" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Interface</h3>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-[13px] font-semibold" style={{ color: c.nr }}>Mode sombre</div>
                <div className="text-[10px]" style={{ color: c.gr }}>Thème sombre pour réduire la fatigue oculaire</div>
              </div>
              <button onClick={toggleDark} className="w-12 h-6 rounded-full cursor-pointer border-none transition-colors relative"
                style={{ background: dark ? c.or : c.gc }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                  style={{ left: dark ? 24 : 2 }} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg" style={{ background: c.ft }}>
              <span className="text-lg">{dark ? '🌙' : '☀️'}</span>
              <span className="text-[11px] font-semibold" style={{ color: c.gr }}>{dark ? 'Thème sombre activé' : 'Thème clair (défaut)'}</span>
            </div>
          </Card>

          {/* Language */}
          <Card hover={false} className="p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>
              {t('settings.language', lang)}
            </h3>
            <p className="text-[12px] mb-4" style={{ color: c.gr }}>
              {lang === 'fr' ? 'Interface en français ou en anglais' : 'Switch interface language'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => { if (lang !== 'fr') toggleLang(); }} className="flex-1 py-3 px-4 rounded-xl cursor-pointer text-[13px] font-semibold transition-all"
                style={{ background: lang === 'fr' ? c.or : c.ft, color: lang === 'fr' ? 'white' : c.gr, border: `2px solid ${lang === 'fr' ? c.or : c.gc}` }}>
                🇫🇷 Français
              </button>
              <button onClick={() => { if (lang !== 'en') toggleLang(); }} className="flex-1 py-3 px-4 rounded-xl cursor-pointer text-[13px] font-semibold transition-all"
                style={{ background: lang === 'en' ? c.or : c.ft, color: lang === 'en' ? 'white' : c.gr, border: `2px solid ${lang === 'en' ? c.or : c.gc}` }}>
                🇬🇧 English
              </button>
            </div>
          </Card>

          {/* Onboarding tour */}
          <Card hover={false} className="p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>
              Tour guidé
            </h3>
            <p className="text-[12px] mb-4" style={{ color: c.gr }}>
              {lang === 'fr' ? 'Relancez le tour d\'introduction pour découvrir les fonctionnalités' : 'Restart the intro tour to discover features'}
            </p>
            <Btn variant="secondary" onClick={() => { onRestartTour?.(); onToast(lang === 'fr' ? 'Tour relancé !' : 'Tour restarted!'); }}>
              🚀 {lang === 'fr' ? 'Relancer le tour' : 'Restart tour'}
            </Btn>
          </Card>

          {/* Push Notifications */}
          <Card hover={false} className="p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>
              {lang === 'fr' ? 'Notifications navigateur' : 'Browser notifications'}
            </h3>
            <p className="text-[12px] mb-4" style={{ color: c.gr }}>
              {lang === 'fr' ? 'Rappels de deadlines, alertes corrections, notifications de publication' : 'Deadline reminders, correction alerts, publication notifications'}
            </p>
            <div className="flex gap-2">
              <Btn variant="secondary" onClick={async () => {
                if (!('Notification' in window)) {
                  onToast(lang === 'fr' ? 'Notifications non supportées par ce navigateur' : 'Notifications not supported');
                  return;
                }
                const perm = await Notification.requestPermission();
                if (perm === 'granted') {
                  try { localStorage.setItem('jabr-push', 'true'); } catch {}
                  new Notification('JABR — Jabrilia Éditions', {
                    body: lang === 'fr' ? 'Notifications activées ! Vous recevrez des rappels.' : 'Notifications enabled! You will receive reminders.',
                    icon: '/icon-192.svg',
                  });
                  onToast(lang === 'fr' ? 'Notifications activées ✓' : 'Notifications enabled ✓');
                } else {
                  onToast(lang === 'fr' ? 'Notifications refusées par le navigateur' : 'Notifications denied by browser');
                }
              }}>
                🔔 {lang === 'fr' ? 'Activer les notifications' : 'Enable notifications'}
              </Btn>
              <Btn variant="secondary" onClick={() => {
                try { localStorage.setItem('jabr-push', 'false'); } catch {}
                onToast(lang === 'fr' ? 'Notifications désactivées' : 'Notifications disabled');
              }}>
                🔕 {lang === 'fr' ? 'Désactiver' : 'Disable'}
              </Btn>
            </div>
          </Card>

          {/* Import CSV */}
          <Card hover={false} className="p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Import catalogue</h3>
            <p className="text-[12px] mb-4" style={{ color: c.gr }}>Importez un catalogue existant depuis un fichier CSV</p>

            <div className="p-4 rounded-xl mb-3" style={{ background: c.ft }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: c.or }}>Format CSV attendu</div>
              <div className="text-[11px] font-mono leading-relaxed" style={{ color: c.vm }}>
                title,author,genre,pages,status,isbn_broche,prix_broche,isbn_epub
              </div>
              <div className="text-[10px] mt-2" style={{ color: c.gr }}>
                Colonnes : title (requis), author, genre, pages, status (draft/in-progress/published), isbn_broche, prix_broche, isbn_epub, isbn_poche, isbn_relie, isbn_audiobook, isbn_pdf, collection, subtitle
              </div>
            </div>

            <div className="flex gap-2">
              <label className="flex-1">
                <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file || !onImport) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    try {
                      const text = ev.target?.result as string;
                      const lines = text.trim().split('\n');
                      if (lines.length < 2) { onToast('Fichier vide ou invalide'); return; }
                      const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase().replace(/"/g, ''));
                      const titleIdx = headers.indexOf('title');
                      if (titleIdx === -1) { onToast('Colonne "title" requise'); return; }

                      const getCol = (row: string[], name: string) => {
                        const idx = headers.indexOf(name);
                        return idx >= 0 ? (row[idx] || '').trim().replace(/"/g, '') : '';
                      };

                      const imported: Project[] = [];
                      for (let i = 1; i < lines.length; i++) {
                        const cols = lines[i].split(/[,;\t]/).map(c => c.trim());
                        const title = getCol(cols, 'title');
                        if (!title) continue;

                        const editions: Edition[] = [];
                        const addEd = (fmt: EditionFormat, isbnCol: string, priceCol?: string) => {
                          const isbn = getCol(cols, isbnCol);
                          if (isbn) editions.push({ format: fmt, isbn, price: priceCol ? getCol(cols, priceCol) || undefined : undefined, status: 'planned' });
                        };
                        addEd('broché', 'isbn_broche', 'prix_broche');
                        addEd('epub', 'isbn_epub');
                        addEd('poche', 'isbn_poche');
                        addEd('relié', 'isbn_relie');
                        addEd('audiobook', 'isbn_audiobook');
                        addEd('pdf', 'isbn_pdf');

                        const statusRaw = getCol(cols, 'status');
                        const status = (['draft', 'in-progress', 'published'] as const).includes(statusRaw as Project['status']) ? statusRaw as Project['status'] : 'draft';

                        imported.push({
                          id: Date.now() + i,
                          title,
                          subtitle: getCol(cols, 'subtitle') || undefined,
                          author: getCol(cols, 'author') || 'Inconnu',
                          genre: getCol(cols, 'genre') || 'Non classé',
                          collection: getCol(cols, 'collection') || undefined,
                          pages: parseInt(getCol(cols, 'pages')) || 200,
                          status,
                          editions,
                          score: 0, maxScore: 7, cover: '📖',
                          diag: { ean: false, prix: false, isbn_txt: false, texte4e: false, typo: false, dos: false, logo: false },
                          corrections: [],
                        });
                      }
                      if (imported.length > 0) {
                        onImport(imported);
                        onToast(`${imported.length} titre${imported.length > 1 ? 's' : ''} importé${imported.length > 1 ? 's' : ''}`);
                      } else {
                        onToast('Aucun titre valide trouvé');
                      }
                    } catch (err) {
                      onToast('Erreur de parsing CSV');
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }} />
                <div className="px-4 py-3 rounded-lg text-center cursor-pointer text-[13px] font-semibold transition-colors hover:bg-[#FAF7F2]"
                  style={{ border: `2px dashed ${c.gc}`, color: c.vm }}>
                  📂 Sélectionner un fichier CSV
                </div>
              </label>
              <Btn variant="secondary" onClick={() => {
                const csv = `title,author,genre,pages,status,isbn_broche,prix_broche,isbn_epub,collection,subtitle\n"Exemple","Auteur","Roman",300,"draft","978-2-488647-XX-X","14,90€","978-2-488647-XX-X","Ma Collection","Mon sous-titre"`;
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'jabr-template.csv'; a.click();
                onToast('Template CSV téléchargé');
              }}>{icons.download} Template</Btn>
            </div>
          </Card>

          {/* API Integrations — Cover Studio */}
          <Card hover={false} className="p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: c.vm }}>
              Intégrations IA — Cover Studio
            </h3>
            <p className="text-[12px] mb-4" style={{ color: c.gr }}>
              Clés API pour la génération automatique d&apos;images et de bandes-annonces
            </p>
            <Field label="OpenAI API Key (DALL-E 3)" k="openaiKey" mono />
            <Field label="Runway API Key (Gen-3 Alpha)" k="runwayKey" mono />
            <Field label="ElevenLabs API Key (TTS Audiobooks)" k="elevenLabsKey" mono />
            <Field label="Midjourney API Key (proxy)" k="midjourneyKey" mono />
            <div className="mt-3 p-3 rounded-lg" style={{ background: '#F0F5FF', border: '1px solid #C0D0FF' }}>
              <div className="text-[10px]" style={{ color: c.nr }}>
                <strong>OpenAI :</strong> images DALL-E 3 pour couvertures — <strong>Runway :</strong> vidéos Gen-3 Alpha pour bandes-annonces — <strong>Midjourney :</strong> via proxy API
              </div>
            </div>
          </Card>

          {/* Compte */}
          {onSignOut && (
            <Card hover={false} className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: c.or }}>
                {lang === 'fr' ? 'Abonnement' : 'Subscription'}
              </h3>
              <p className="text-[12px] mb-4" style={{ color: c.gr }}>
                {lang === 'fr' ? 'Gérez votre plan et votre facturation' : 'Manage your plan and billing'}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Btn variant="secondary" onClick={() => { window.location.href = '/pricing'; }}>
                  💎 {lang === 'fr' ? 'Voir les plans' : 'View plans'}
                </Btn>
                <Btn variant="secondary" onClick={async () => {
                  try {
                    const res = await fetch('/api/stripe/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                    else onToast(data.error || 'Portail non disponible');
                  } catch { onToast('Erreur portail facturation'); }
                }}>
                  📋 {lang === 'fr' ? 'Portail facturation' : 'Billing portal'}
                </Btn>
              </div>
            </Card>
          )}

          {/* Déconnexion */}
          {onSignOut && (
            <Card hover={false} className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#D64545' }}>
                {lang === 'fr' ? 'Déconnexion' : 'Sign out'}
              </h3>
              <p className="text-[12px] mb-4" style={{ color: c.gr }}>
                {lang === 'fr' ? 'Déconnectez-vous de votre espace éditorial' : 'Sign out of your editorial workspace'}
              </p>
              <Btn variant="secondary" onClick={() => { onSignOut(); }}>
                ⏻ {lang === 'fr' ? 'Se déconnecter' : 'Sign out'}
              </Btn>
            </Card>
          )}
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

  // Real audiobook state
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [audioChapters, setAudioChapters] = useState<Record<number, AudioChapter[]>>({});
  const [genProgress, setGenProgress] = useState<{ current: number; total: number } | null>(null);
  const [playingChapter, setPlayingChapter] = useState<string | null>(null);
  const [elevenLabsVoices, setElevenLabsVoices] = useState<ElevenLabsVoice[]>([]);

  // Load API key
  const getApiKey = (key: string): string | null => {
    try { const s = localStorage.getItem('jabr-settings'); return s ? JSON.parse(s)[key] || null : null; } catch { return null; }
  };
  const elevenLabsKey = getApiKey('elevenLabsKey');

  // Fetch real voices on mount if key exists
  useEffect(() => {
    if (elevenLabsKey) {
      fetchVoices(elevenLabsKey).then(v => { if (v.length > 0) setElevenLabsVoices(v); });
    }
  }, [elevenLabsKey]);

  // Per-project pipeline state (persisted)
  const [pipelineState, setPipelineState] = useState<Record<number, { step: number; voice: string; launched: boolean }>>(() => {
    try { const s = localStorage.getItem('jabr-audiobook-pipeline'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const persistPipeline = (state: typeof pipelineState) => { try { localStorage.setItem('jabr-audiobook-pipeline', JSON.stringify(state)); } catch {} setPipelineState(state); };

  const advanceStep = (projectId: number) => {
    const cur = pipelineState[projectId] || { step: 0, voice: 'adam-fr', launched: false };
    if (cur.step < 6) {
      persistPipeline({ ...pipelineState, [projectId]: { ...cur, step: cur.step + 1 } });
      onToast(`✓ Étape ${cur.step + 1}/6 complétée`);
    }
  };

  const resetPipeline = (projectId: number) => {
    const newState = { ...pipelineState };
    delete newState[projectId];
    persistPipeline(newState);
    setAudioChapters(prev => { const n = { ...prev }; delete n[projectId]; return n; });
    onToast('Pipeline réinitialisé');
  };

  const setVoice = (projectId: number, voice: string) => {
    const cur = pipelineState[projectId] || { step: 0, voice: 'adam-fr', launched: false };
    persistPipeline({ ...pipelineState, [projectId]: { ...cur, voice } });
  };

  // REAL PRODUCTION LAUNCH
  const launchRealProduction = async (p: Project) => {
    if (!elevenLabsKey) {
      onToast('Clé API ElevenLabs requise — Paramètres → Intégrations IA');
      return;
    }

    setGeneratingId(p.id);
    const cur = pipelineState[p.id] || { step: 0, voice: 'adam-fr', launched: false };
    persistPipeline({ ...pipelineState, [p.id]: { ...cur, launched: true, step: 1 } });

    // Step 1: Split into chapters
    onToast('📝 Étape 1 : Découpe en chapitres…');
    const sampleText = p.backCover || `Chapitre 1\n\n${p.title} par ${p.author}.\n\nCeci est un extrait de démonstration. Pour générer l'audiobook complet, importez le manuscrit .docx dans le module Manuscrits.\n\nChapitre 2\n\nSuite du texte de démonstration pour ${p.title}.`;
    const chapters = splitIntoChapters(sampleText, `${p.title} — ${p.author}`);
    setAudioChapters(prev => ({ ...prev, [p.id]: chapters }));

    // Step 2: Generate TTS
    persistPipeline({ ...pipelineState, [p.id]: { ...cur, launched: true, step: 2 } });
    onToast(`🎙️ Étape 2 : Génération vocale (${chapters.length} chapitres)…`);

    const voiceId = cur.voice === 'clone' ? 'EXAVITQu4vr4xnSDxMaL' : 
      elevenLabsVoices.find(v => v.id === cur.voice)?.id || 'EXAVITQu4vr4xnSDxMaL';

    const results = await generateFullAudiobook(
      chapters, voiceId, elevenLabsKey, 'eleven_multilingual_v2',
      (ch, idx, total) => {
        setGenProgress({ current: idx + 1, total });
        setAudioChapters(prev => {
          const updated = [...(prev[p.id] || [])];
          updated[idx] = ch;
          return { ...prev, [p.id]: updated };
        });
      }
    );

    setAudioChapters(prev => ({ ...prev, [p.id]: results }));

    // Step 3-6
    const doneCount = results.filter(c => c.status === 'done').length;
    persistPipeline({ ...pipelineState, [p.id]: { ...cur, launched: true, step: doneCount === results.length ? 6 : 4 } });
    setGeneratingId(null);
    setGenProgress(null);

    if (doneCount === results.length) {
      onToast(`✅ Audiobook "${p.title}" terminé — ${results.length} chapitres générés !`);
    } else {
      onToast(`⚠️ ${doneCount}/${results.length} chapitres générés — ${results.length - doneCount} erreurs`);
    }
  };

  const launchProduction = (projectId: number) => {
    const cur = pipelineState[projectId] || { step: 0, voice: 'adam-fr', launched: false };
    persistPipeline({ ...pipelineState, [projectId]: { ...cur, launched: true, step: Math.max(cur.step, 1) } });
    onToast('🎙️ Production lancée ! Étape 1 : Import en cours.');
  };

  const pipeline = [
    { icon: '📝', title: '1. Import', desc: 'Upload .docx · Découpe chapitres' },
    { icon: '🎙️', title: '2. Voix IA', desc: 'ElevenLabs TTS · Choix voix' },
    { icon: '🎛️', title: '3. Mastering', desc: 'Normalisation -14 LUFS · EQ' },
    { icon: '✅', title: '4. Validation', desc: 'Écoute · Corrections' },
    { icon: '📦', title: '5. Export', desc: 'MP3 320kbps par chapitre' },
    { icon: '🌐', title: '6. Distribution', desc: 'ACX/Audible · Spotify' },
  ];

  const voices = [
    { name: 'Narrateur FR — Masculin', id: 'adam-fr', desc: 'Voix grave, posée, littéraire', cost: '~0,30€/min' },
    { name: 'Narratrice FR — Féminin', id: 'bella-fr', desc: 'Voix claire, chaleureuse, expressive', cost: '~0,30€/min' },
    { name: 'Clonage voix auteur', id: 'clone', desc: '3 min d\'échantillon requis', cost: '~0,50€/min' },
    { name: 'Narrateur EN — English', id: 'adam-en', desc: 'Deep, literary, British accent', cost: '~0,30€/min' },
    ...(elevenLabsVoices.length > 0 ? [{ name: '── Voix ElevenLabs ──', id: 'divider', desc: `${elevenLabsVoices.length} voix détectées`, cost: '' }] : []),
    ...elevenLabsVoices.slice(0, 10).map(v => ({ name: v.name, id: v.id, desc: `${v.category} · ${v.description || ''}`.slice(0, 50), cost: '~0,30€/min' })),
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
  const inProduction = Object.values(pipelineState).filter(s => s.launched).length;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div><h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Audiobooks</h2><p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Production vocale IA — ElevenLabs TTS · Pipeline automatisé</p></div>
      </div>
      <div className="flex gap-3.5 mb-6 flex-wrap">
        <StatCard value={withAudio.length} label="Avec audiobook" accent={c.ok} />
        <StatCard value={inProduction} label="En production" accent={c.og} />
        <StatCard value={withoutAudio.length} label="Éligibles" accent={c.vm} />
        <StatCard value={`~${totalMinutes} min`} label="Durée totale est." accent={c.or} />
        <StatCard value={`~${estimatedCost}€`} label="Coût estimé TTS" accent={c.er} />
      </div>

      {/* Global pipeline overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-6">
        {pipeline.map((s, i) => {
          const atStep = withAudio.filter(p => (pipelineState[p.id]?.step || 0) === i + 1).length;
          const doneStep = withAudio.filter(p => (pipelineState[p.id]?.step || 0) > i + 1).length;
          return (
            <Card key={s.title} hover={false} className="p-4 text-center relative">
              <div className="text-2xl mb-1.5">{s.icon}</div>
              <div className="font-semibold text-[12px]" style={{ color: c.mv }}>{s.title}</div>
              <div className="text-[10px] mt-1 leading-relaxed" style={{ color: c.gr }}>{s.desc}</div>
              <div className="flex gap-1 justify-center mt-2">
                {atStep > 0 && <Badge bg="#FDE8D0" color={c.og}>{atStep} en cours</Badge>}
                {doneStep > 0 && <Badge bg="#D4F0E0" color={c.ok}>{doneStep} ✓</Badge>}
              </div>
              {i < pipeline.length - 1 && (
                <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 text-[14px]" style={{ color: c.gc }}>→</div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Voice selection + ACX specs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card hover={false} className="p-3 md:p-5">
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
        <Card hover={false} className="p-3 md:p-5">
          <div className="uppercase tracking-wider font-semibold mb-3" style={{ fontSize: 11, color: c.gr }}>Specs ACX / Audible</div>
          {acxSpecs.map(s => (
            <div key={s.label} className="flex py-1.5" style={{ borderBottom: `1px solid ${c.ft}` }}>
              <span className="text-[11px] font-semibold w-[80px] md:w-[110px] shrink-0" style={{ color: c.vm }}>{s.label}</span>
              <span className="text-[11px]" style={{ color: c.nr }}>{s.value}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Titles with audio — interactive pipeline */}
      {withAudio.length > 0 && (
        <Card hover={false} className="mb-5">
          <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.ok}` }}>
            <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Productions audiobook ({withAudio.length})</span>
          </div>
          {withAudio.map(p => {
            const audioEd = p.editions.find(e => e.format === 'audiobook')!;
            const duration = Math.round(p.pages * 1.5);
            const chapters = Math.round(p.pages / 20);
            const cost = Math.round(duration * 0.3);
            const isExpanded = expandedId === p.id;
            const ps = pipelineState[p.id] || { step: 0, voice: 'adam-fr', launched: false };
            const selectedVoice = voices.find(v => v.id === ps.voice) || voices[0];
            return (
              <div key={p.id}>
                <div className="flex items-center gap-2 md:gap-4 px-3 md:px-5 py-3 cursor-pointer hover:bg-[#FAF7F2]"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  style={{ borderBottom: `1px solid ${c.ft}` }}>
                  <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{p.title}</div>
                    <div style={{ fontSize: 11, color: c.gr }}>{p.pages} p · ~{duration} min · ~{chapters} ch.</div>
                  </div>
                  {/* Mini pipeline progress */}
                  <div className="flex gap-0.5">
                    {pipeline.map((_, i) => (
                      <div key={i} className="w-4 h-2 rounded-sm transition-all" style={{ background: i < ps.step ? c.ok : i === ps.step && ps.launched ? c.og : c.gc }} />
                    ))}
                  </div>
                  <div className="text-[11px] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.or }}>~{cost}€</div>
                  <Badge bg={ps.launched ? '#D4F0E0' : c.ft} color={ps.launched ? c.ok : c.gr}>{ps.launched ? `${ps.step}/6` : 'Non lancé'}</Badge>
                  <span style={{ color: c.gr, fontSize: 12, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : '' }}>▾</span>
                </div>
                {isExpanded && (
                  <div className="px-3 md:px-5 py-3" style={{ background: '#FDFCFA', borderBottom: `1px solid ${c.ft}` }}>
                    {/* Per-project pipeline */}
                    <div className="flex items-center gap-1 mb-4">
                      {pipeline.map((step, i) => (
                        <div key={i} className="flex items-center gap-1 flex-1">
                          <div className="flex flex-col items-center flex-1 cursor-pointer" onClick={e => { e.stopPropagation(); if (i === ps.step && ps.launched) advanceStep(p.id); }}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all" style={{ background: i < ps.step ? c.ok : i === ps.step && ps.launched ? c.og : c.gc, color: i <= ps.step && ps.launched ? 'white' : c.gr }}>{i < ps.step ? '✓' : step.icon}</div>
                            <div className="text-[9px] mt-1 text-center font-semibold" style={{ color: i <= ps.step ? c.mv : c.gr }}>{step.title.split('. ')[1]}</div>
                          </div>
                          {i < pipeline.length - 1 && <div className="w-4 h-px" style={{ background: i < ps.step ? c.ok : c.gc }} />}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Voice selector */}
                      <div className="p-3 rounded-lg" style={{ background: 'white', border: `1px solid ${c.ft}` }}>
                        <div className="text-[11px] font-semibold mb-2" style={{ color: c.vm }}>🎙️ Voix sélectionnée</div>
                        <select value={ps.voice} onChange={e => { e.stopPropagation(); setVoice(p.id, e.target.value); }} className="w-full text-[11px] p-2 rounded border-none cursor-pointer" style={{ background: c.ft, color: c.nr }}>
                          {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <div className="text-[10px] mt-1" style={{ color: c.gr }}>{selectedVoice.desc} · {selectedVoice.cost}</div>
                      </div>
                      {/* Stats */}
                      <div className="p-3 rounded-lg" style={{ background: 'white', border: `1px solid ${c.ft}` }}>
                        <div className="text-[11px] font-semibold mb-2" style={{ color: c.vm }}>📊 Estimation</div>
                        <div className="text-[10px] space-y-1" style={{ color: c.gr }}>
                          <div>Chapitres : ~{chapters}</div>
                          <div>Durée : ~{duration} min ({Math.floor(duration / 60)}h{duration % 60 > 0 ? `${duration % 60}` : ''})</div>
                          <div>ISBN : {audioEd.isbn}</div>
                          <div className="font-semibold" style={{ color: c.or }}>Coût TTS : ~{cost}€</div>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="p-3 rounded-lg flex flex-col gap-2" style={{ background: 'white', border: `1px solid ${c.ft}` }}>
                        <div className="text-[11px] font-semibold mb-1" style={{ color: c.vm }}>⚡ Actions</div>
                        {!ps.launched ? (
                          <>
                            <Btn onClick={() => { launchProduction(p.id); }}>🚀 Lancer (simulé)</Btn>
                            {elevenLabsKey && (
                              <Btn onClick={() => launchRealProduction(p)}>
                                {generatingId === p.id ? '⏳ Génération…' : '🎙️ Générer avec ElevenLabs'}
                              </Btn>
                            )}
                            {!elevenLabsKey && (
                              <div className="text-[9px] p-2 rounded" style={{ background: '#FFF5E0', color: '#7A5A00' }}>
                                Clé ElevenLabs requise → Paramètres
                              </div>
                            )}
                          </>
                        ) : ps.step < 6 ? (
                          <Btn onClick={() => { advanceStep(p.id); }}>→ Valider étape {ps.step + 1}</Btn>
                        ) : (
                          <Badge bg="#D4F0E0" color={c.ok}>✓ Production terminée</Badge>
                        )}
                        {ps.launched && <Btn variant="secondary" onClick={() => { resetPipeline(p.id); }}>↺ Réinitialiser</Btn>}
                      </div>
                    </div>

                    {/* Generation progress */}
                    {generatingId === p.id && genProgress && (
                      <div className="mt-3 p-3 rounded-lg" style={{ background: '#F0F5FF', border: '1px solid #C0D0FF' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" style={{ color: c.or }} />
                          <span className="text-[12px] font-semibold" style={{ color: c.mv }}>
                            Génération en cours… {genProgress.current}/{genProgress.total} chapitres
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: c.gc }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${(genProgress.current / genProgress.total) * 100}%`, background: c.or }} />
                        </div>
                      </div>
                    )}

                    {/* Generated chapters — audio player */}
                    {audioChapters[p.id] && audioChapters[p.id].length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                          <span className="text-[11px] font-semibold" style={{ color: c.vm }}>
                            🎧 Chapitres générés ({audioChapters[p.id].filter(c => c.status === 'done').length}/{audioChapters[p.id].length})
                          </span>
                          {audioChapters[p.id].some(c => c.audioBlob) && (
                            <button onClick={() => downloadAllChapters(audioChapters[p.id], p.title)}
                              className="text-[10px] px-3 py-1 rounded font-semibold" style={{ background: c.ok, color: 'white', border: 'none', cursor: 'pointer' }}>
                              ⬇ Tout télécharger
                            </button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {audioChapters[p.id].map((ch, ci) => (
                            <div key={ci} className="flex flex-wrap items-center gap-2 p-2 rounded-lg" style={{
                              background: ch.status === 'done' ? '#F5FAF5' : ch.status === 'generating' ? '#FFF8E0' : ch.status === 'error' ? '#FFF0F0' : c.ft,
                              border: `1px solid ${ch.status === 'done' ? '#C0E0C0' : ch.status === 'error' ? '#FFD0D0' : c.gc}`,
                            }}>
                              <span className="text-[10px] font-mono font-bold shrink-0" style={{ color: c.gr, width: 20 }}>{String(ch.id).padStart(2, '0')}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-semibold truncate" style={{ color: c.mv }}>{ch.title}</div>
                                <div className="text-[9px]" style={{ color: c.gr }}>{ch.wordCount} mots · ~{ch.estimatedMinutes} min</div>
                              </div>
                              {ch.status === 'generating' && <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" style={{ color: c.og }} />}
                              {ch.status === 'done' && ch.audioUrl && (
                                <>
                                  <audio src={ch.audioUrl} controls className="h-7" style={{ maxWidth: 120 }}
                                    onPlay={() => setPlayingChapter(`${p.id}-${ci}`)}
                                    onPause={() => setPlayingChapter(null)} />
                                  <button onClick={() => downloadChapterAudio(ch, p.title)}
                                    className="text-[9px] px-2 py-1 rounded shrink-0" style={{ background: c.ok, color: 'white', border: 'none', cursor: 'pointer' }}>⬇</button>
                                </>
                              )}
                              {ch.status === 'error' && <span className="text-[9px]" style={{ color: c.er }}>✗ {ch.error?.slice(0, 30)}</span>}
                              {ch.status === 'done' && <span className="text-[9px]" style={{ color: c.ok }}>✓</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {withoutAudio.length > 0 && (
        <Card hover={false}>
          <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.og}` }}>
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
const MarketingView = ({ projects, onToast, author }: { projects: Project[]; onToast: (msg: string) => void; author?: Author }) => {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [tab, setTab] = useState<'kit' | 'media' | 'amazon' | 'social'>('media');
  const [generatedKit, setGeneratedKit] = useState<Record<number, { brief: { tone: string; ambiance: string; targetAudience: string; themes: string[]; palette: { primary: string; secondary: string; accent: string }; oneLinePitch: string; backCoverHook: string; hashTags: string[]; marketingAngle: string; comparisons: string[]; visualKeywords: string[] }; marketing: { instagramCaption: string; linkedinPost: string; newsletterBlurb: string; pressRelease: string }; trailer: { duration: number; musicMood: string; scenes: { timestamp: number; visual: string; voiceOver: string; text: string }[] }; cover: { style: string; composition: string; typography: { titleFont: string; authorFont: string; placement: string }; genreConventions: string; thumbnailTest: string; promptMidjourney: string; promptDalle: string } }>>({});
  const [generatedMedia, setGeneratedMedia] = useState<Record<number, boolean>>({});

  // ── Media Engine v3 state ──
  const [mediaMode, setMediaMode] = useState<'budget' | 'objective'>('budget');
  const [mediaBudget, setMediaBudget] = useState(2000);
  const [mediaObjective, setMediaObjective] = useState(500);
  const [mediaPlanA, setMediaPlanA] = useState<MediaPlan | null>(null);
  const [mediaPlanB, setMediaPlanB] = useState<MediaPlan | null>(null);
  const [showAB, setShowAB] = useState(false);
  const [mediaExpanded, setMediaExpanded] = useState<string | null>(null);

  const buildMediaInput = useCallback((p: Project): MediaPlanInput => ({
    genre: p.genre,
    title: p.title,
    pages: p.pages,
    price: parseFloat((primaryPrice(p) || '19,90€').replace(',', '.').replace('€', '')) || 19.90,
    author: p.author,
    hasNewsletter: !!(author?.newsletter),
    newsletterSize: author?.newsletter?.subscribers || 0,
    hasExistingAudience: !!(author?.social && Object.keys(author.social).length > 0),
    audienceSize: author?.social ? Object.keys(author.social).length * 3000 : 0,
    isFirstBook: projects.filter(pr => pr.status === 'published').length === 0,
  }), [author, projects]);

  const runMediaEngine = useCallback(() => {
    const p = selectedProject ? projects.find(pr => pr.id === selectedProject) : null;
    if (!p) return;
    const input = buildMediaInput(p);
    
    if (mediaMode === 'budget') {
      setMediaPlanA(generateBudgetPlan(mediaBudget, input));
    } else {
      setMediaPlanA(generateObjectivePlan(mediaObjective, input));
    }
    setGeneratedMedia(prev => ({ ...prev, [p.id]: true }));
  }, [selectedProject, projects, mediaMode, mediaBudget, mediaObjective, buildMediaInput]);

  const runABComparison = useCallback(() => {
    const p = selectedProject ? projects.find(pr => pr.id === selectedProject) : null;
    if (!p) return;
    const input = buildMediaInput(p);
    
    const planBudget = generateBudgetPlan(mediaBudget, input);
    const planObjective = generateObjectivePlan(mediaObjective, input);
    setMediaPlanA(planBudget);
    setMediaPlanB(planObjective);
    setShowAB(true);
  }, [selectedProject, projects, mediaBudget, mediaObjective, buildMediaInput]);

  const generateKit = async (projectId: number) => {
    const { runFullPipeline } = await import('@/lib/engine');
    const p = projects.find(pr => pr.id === projectId);
    if (!p) return;
    const result = runFullPipeline({ title: p.title, genre: p.genre, pages: p.pages, backCover: p.backCover, collection: p.collection });
    setGeneratedKit(prev => ({ ...prev, [projectId]: result }));
    setSelectedProject(projectId);
    setTab('kit');
  };

  const generateMediaPlan = (projectId: number) => {
    setSelectedProject(projectId);
    setGeneratedMedia(prev => ({ ...prev, [projectId]: true }));
    setTab('media');
  };

  const sel = selectedProject ? projects.find(p => p.id === selectedProject) : null;
  const kit = selectedProject ? generatedKit[selectedProject] : null;

  // Genre-specific Amazon keywords
  const amazonKeywords: Record<string, { primary: string[]; long_tail: string[]; negative: string[]; bid: string }> = {
    'Jeunesse': {
      primary: ['livre enfant anti-stress', 'cahier activités enfant', 'livre relaxation enfant', 'livre bien-être jeunesse', 'mindfulness enfant'],
      long_tail: ['livre anti-stress enfant 6-10 ans', 'activités calme enfant anxieux', 'cahier coloriage relaxation', 'livre gestion émotions enfant', 'cadeau zen enfant'],
      negative: ['adulte', 'érotique', 'thriller', 'horreur'],
      bid: '0.35–0.55€',
    },
    'Roman': {
      primary: ['roman français contemporain', 'littérature francophone', 'roman aventure', 'nouveau roman 2025', 'roman auteur guadeloupéen'],
      long_tail: ['roman français chutes du niagara', 'littérature caribéenne francophone', 'roman voyage intérieur', 'auteur antillais roman', 'roman identité diaspora'],
      negative: ['romance', 'érotique', 'policier', 'thriller'],
      bid: '0.25–0.45€',
    },
    'Fantasy': {
      primary: ['fantasy français', 'roman fantasy francophone', 'saga fantasy 2025', 'fantasy épique', 'dark fantasy français'],
      long_tail: ['trilogie fantasy française trône', 'roman fantasy politique magie', 'saga epic fantasy francophone', 'fantasy monde secondaire français'],
      negative: ['romance', 'young adult', 'science fiction'],
      bid: '0.30–0.50€',
    },
    'Essai': {
      primary: ['essai philosophique', 'essai société contemporaine', 'essai stratégie', 'livre pensée critique', 'essai français 2026'],
      long_tail: ['essai philosophique monde contemporain', 'livre transformation digitale société', 'essai géopolitique francophone'],
      negative: ['roman', 'fiction', 'cuisine'],
      bid: '0.20–0.40€',
    },
    'BD': {
      primary: ['bande dessinée française', 'BD auteur indépendant', 'graphic novel français', 'BD contemporaine', 'roman graphique'],
      long_tail: ['bande dessinée indépendante édition limitée', 'BD auteur caribéen', 'graphic novel noir et blanc'],
      negative: ['manga', 'comics américain', 'marvel'],
      bid: '0.30–0.55€',
    },
  };

  // Social media templates per genre
  const socialTemplates: Record<string, { tiktok: { hooks: string[]; hashtags: string[]; format: string; timing: string }; instagram: { captions: string[]; hashtags: string[]; format: string; stories: string[] }; linkedin: { angle: string; hashtags: string[] } }> = {
    'Jeunesse': {
      tiktok: {
        hooks: ['POV : ton enfant découvre ce livre et ne le lâche plus 📖✨', 'Le livre anti-stress que j\'aurais aimé avoir enfant 🌈', '3 activités du livre que mes enfants adorent ↓', 'Quand le calme revient grâce à un seul livre 🧘‍♀️'],
        hashtags: ['#BookTok', '#BookTokFrance', '#LivreEnfant', '#AntiStress', '#ParentingTikTok', '#LectureEnfant', '#BienEtreEnfant', '#MomentCalme', '#JabrilliaEditions', '#LivreJeunesse', '#ActivitésEnfants', '#MindfulnessKids'],
        format: 'Vidéo 15-30s, feuilletage livre + réaction enfant, musique douce lo-fi',
        timing: 'Mercredi 14h + Samedi 10h (pics parents)',
      },
      instagram: {
        captions: [
          '📖 Un moment de calme dans le chaos du quotidien.\n\n« Mon Petit Livre Anti-Stress » aide votre enfant à apprivoiser ses émotions grâce à des activités ludiques et apaisantes.\n\n🎨 Illustré par @allisonmoradel\n📚 Disponible chez Jabrilia Éditions',
          '✨ Parce que le bien-être, ça s\'apprend aussi petit.\n\n136 pages d\'activités conçues avec des pédagogues pour aider les 6-10 ans à gérer le stress.\n\n→ Lien en bio',
        ],
        hashtags: ['#LivreEnfant', '#AntiStress', '#BienEtreEnfant', '#Parentalité', '#LectureJeunesse', '#ActivitésCréatives', '#GestionDesÉmotions', '#JabriliaEditions', '#SteveMoradel', '#AllisonMoradel', '#ÉditionIndépendante', '#LivreIllustré', '#Aquarelle', '#MomentCalme', '#ÉducationPositive'],
        format: 'Carrousel 5 slides : couverture → 3 pages intérieures → CTA',
        stories: ['Sondage « Votre enfant est stressé par l\'école ? »', 'Swipe-up vers Amazon', 'Before/After : moment de lecture calme', 'Unboxing du livre'],
      },
      linkedin: { angle: 'Le bien-être enfant comme enjeu éducatif — expertise auteur enseignant', hashtags: ['#Éducation', '#BienÊtre', '#Édition', '#Entrepreneuriat'] },
    },
    'Roman': {
      tiktok: {
        hooks: ['Ce roman m\'a fait voir Niagara autrement 🌊', 'Quand un auteur guadeloupéen écrit sur les chutes… 📖', 'Le livre que BookTok France n\'a pas encore découvert ↓', 'POV : tu ouvres un roman et tu ne peux plus le lâcher'],
        hashtags: ['#BookTok', '#BookTokFrance', '#RomanFrançais', '#LittératureFrancophone', '#NouveauRoman', '#LectureDuMoment', '#AuteurFrancophone', '#JabriliaEditions', '#Guadeloupe', '#LittératureCaribéenne', '#PageTurner', '#ConseilLecture'],
        format: 'Vidéo 15-45s, lecture d\'un extrait + ambiance visuelle, musique cinématique',
        timing: 'Dimanche 20h + Mardi 19h (pics lecture adulte)',
      },
      instagram: {
        captions: [
          '🏔️ « Sur les hauteurs des chutes du Niagara »\n\nUn roman sur les sommets qu\'on choisit de gravir et ceux qu\'on n\'attendait pas.\n\nUne plume entre Caraïbes et Amérique du Nord.\n\n📚 @jabriliaeditions',
          '📖 Chaque chapitre est un pas de plus vers soi-même.\n\nSteve Moradel signe un premier roman puissant qui traverse les frontières et les identités.\n\n→ Lien en bio',
        ],
        hashtags: ['#Roman', '#LittératureFrançaise', '#AuteurFrancophone', '#NouvelleVoix', '#Niagara', '#SteveMoradel', '#JabriliaEditions', '#RomanContemporain', '#LivreàLire', '#ConseilLecture', '#ÉditionIndépendante', '#LittératureCaribéenne', '#Guadeloupe', '#VoyageLittéraire', '#RentréeLittéraire'],
        format: 'Photo ambiance (paysage + livre) + carrousel extraits',
        stories: ['Citation du jour extraite du roman', 'Behind the scenes : l\'écriture', 'Q&A auteur en story'],
      },
      linkedin: { angle: 'L\'entrepreneuriat littéraire — de consultant à romancier, parcours atypique', hashtags: ['#Édition', '#Entrepreneuriat', '#LittératureFrançaise', '#ParcoursProfessionnel'] },
    },
    'Fantasy': {
      tiktok: {
        hooks: ['Si tu aimes Tolkien et la politique, ce roman est pour toi ⚔️', 'La fantasy française qu\'il vous faut en 2026 🔥', 'POV : tu découvres une trilogie épique francophone', 'Ce système de magie est INSANE ↓'],
        hashtags: ['#BookTok', '#FantasyBookTok', '#FantasyFrançaise', '#DarkFantasy', '#TrilogieFantasy', '#SagaÉpique', '#LeTrôneDeCendre', '#BookTokFrance', '#FantasyBooks', '#NouveautéLittéraire', '#SwordAndSorcery', '#Worldbuilding'],
        format: 'Vidéo 30-60s, aesthetic dark + extraits, musique épique orchestrale',
        timing: 'Vendredi 20h + Dimanche 15h (pics fantasy community)',
      },
      instagram: {
        captions: [
          '⚔️ « Le Trône de Cendre » — Tome I\n\nQuand le pouvoir consume ceux qui le convoitent.\n\nUne saga épique. Une plume française. Un monde qui ne pardonne pas.\n\n🔥 Bientôt chez @jabriliaeditions',
        ],
        hashtags: ['#Fantasy', '#FantasyFrançaise', '#SagaÉpique', '#DarkFantasy', '#Trilogie', '#LeTrôneDeCendre', '#BookstagramFrance', '#LivreFantasy', '#Worldbuilding', '#JabriliaEditions', '#NouveauRoman', '#ÉditionIndépendante'],
        format: 'Reels ambiance dark + map du monde + character art',
        stories: ['Sondage « Team personnage A ou B ? »', 'Countdown to release', 'Extraits exclusifs'],
      },
      linkedin: { angle: 'La fantasy comme vecteur de réflexion politique et sociale', hashtags: ['#Fantasy', '#Littérature', '#Créativité', '#Écriture'] },
    },
  };

  // Media plan budget allocation
  const budgetPlan = {
    total: 2000,
    digital: { pct: 80, breakdown: [
      { channel: 'Amazon Ads (Sponsored Products)', pct: 30, budget: 600, icon: '🛒', desc: 'Campagnes mots-clés, produits sponsorisés, ciblage par genre' },
      { channel: 'Instagram / Facebook Ads', pct: 20, budget: 400, icon: '📸', desc: 'Carrousels, reels sponsorisés, lookalike audiences lecteurs' },
      { channel: 'TikTok Ads (Spark Ads)', pct: 15, budget: 300, icon: '🎵', desc: 'Boost posts organiques BookTok, In-Feed natif' },
      { channel: 'Google Ads (Search)', pct: 8, budget: 160, icon: '🔍', desc: 'Mots-clés achat livre + genre spécifique' },
      { channel: 'Newsletter / Email (Brevo)', pct: 5, budget: 100, icon: '📧', desc: 'Campagnes Les Pages de Jade (12K abonnés)' },
      { channel: 'LinkedIn (organique + boost)', pct: 2, budget: 40, icon: '💼', desc: 'Thought leadership, parcours auteur-stratège' },
    ]},
    traditional: { pct: 20, breakdown: [
      { channel: 'Radio digitale (podcasts)', pct: 8, budget: 160, icon: '🎙️', desc: 'Passages podcasts littéraires, France Inter numérique, RFI' },
      { channel: 'Presse en ligne', pct: 7, budget: 140, icon: '📰', desc: 'Livres Hebdo, ActuaLitté, Babelio, encarts digitaux' },
      { channel: 'Blogueurs / Influenceurs livre', pct: 5, budget: 100, icon: '✍️', desc: 'Service presse, SP numériques, chroniques partenaires' },
    ]},
  };

  const withBackCover = projects.filter(p => p.backCover && p.backCover.length > 50);
  const tabs = [
    { id: 'media' as const, label: '⚡ Moteur Média', desc: 'Budget · Objectif · A/B' },
    { id: 'amazon' as const, label: '🛒 Amazon Ads', desc: 'Mots-clés & campagnes' },
    { id: 'social' as const, label: '📱 Social Media', desc: 'TikTok, Insta, LinkedIn' },
    { id: 'kit' as const, label: '🎬 Kit IA', desc: 'Génération auto' },
  ];

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl" style={{ color: c.mv }}>Marketing & Plan Média</h2>
          <p className="mt-1" style={{ color: c.gr, fontSize: 13 }}>Moteur intelligent · Budget ou Objectif · Comparaison A/B</p>
        </div>
      </div>

      <div className="flex gap-3.5 mb-5 flex-wrap">
        <StatCard value={projects.length} label="Titres catalogue" accent={c.or} />
        <StatCard value={Object.keys(generatedMedia).length} label="Plans générés" accent={c.ok} />
        <StatCard value={mediaPlanA ? `${mediaPlanA.totalBudget.toLocaleString()}€` : '—'} label="Dernier budget" accent="#3B6DC6" />
        <StatCard value={mediaPlanA ? mediaPlanA.totalEstimatedSales : '—'} label="Ventes estimées" accent={c.vm} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: c.ft }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 px-3 rounded-lg cursor-pointer border-none text-center transition-all"
            style={{ background: tab === t.id ? 'white' : 'transparent', color: tab === t.id ? c.mv : c.gr, boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
            <div className="text-[12px] font-semibold">{t.label}</div>
            <div className="text-[9px]">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* ═══ TAB: PLAN MÉDIA ═══ */}
      {tab === 'media' && (
        <div className="space-y-5">
          {/* Project Selector */}
          <Card hover={false} className="overflow-hidden">
            <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.vm}` }}>
              <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>📚 Sélectionnez un titre</span>
            </div>
            <div className="p-4 flex gap-2 flex-wrap">
              {projects.map(p => (
                <button key={p.id} onClick={() => { setSelectedProject(p.id); setMediaPlanA(null); setMediaPlanB(null); setShowAB(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                  style={{
                    background: selectedProject === p.id ? `${c.or}12` : c.ft,
                    border: `1.5px solid ${selectedProject === p.id ? c.or : c.gc}`,
                    cursor: 'pointer',
                  }}>
                  <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                  <div className="text-left">
                    <div className="text-[11px] font-semibold" style={{ color: selectedProject === p.id ? c.or : c.mv }}>{p.title}</div>
                    <div className="text-[9px]" style={{ color: c.gr }}>{p.genre} · {p.pages}p · {primaryPrice(p) || '—'}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Engine Controls */}
          <Card hover={false} className="overflow-hidden">
            <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
              <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>🎯 Moteur Plan Média v3</span>
            </div>
            <div className="p-3 md:p-5">
              {/* Mode selector */}
              <div className="flex gap-2 mb-4">
                {([['budget', '💰 Budget', 'J\'ai un budget, optimise'] , ['objective', '🎯 Objectif', 'Je veux X ventes']] as const).map(([m, label, desc]) => (
                  <button key={m} onClick={() => { setMediaMode(m); setShowAB(false); setMediaPlanB(null); }}
                    className="flex-1 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: mediaMode === m ? `${c.or}10` : c.ft,
                      border: `1.5px solid ${mediaMode === m ? c.or : c.gc}`,
                    }}>
                    <div className="text-[12px] font-bold" style={{ color: mediaMode === m ? c.or : c.mv }}>{label}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: c.gr }}>{desc}</div>
                  </button>
                ))}
              </div>

              {/* Input fields */}
              <div className="flex gap-3 items-end mb-4">
                {mediaMode === 'budget' ? (
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: c.gr }}>Budget total (€)</label>
                    <div className="flex items-center gap-2">
                      {[500, 1000, 2000, 3000, 5000].map(v => (
                        <button key={v} onClick={() => setMediaBudget(v)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                          style={{
                            background: mediaBudget === v ? c.or : c.ft,
                            color: mediaBudget === v ? 'white' : c.mv,
                            border: `1px solid ${mediaBudget === v ? c.or : c.gc}`,
                          }}>
                          {v.toLocaleString()}€
                        </button>
                      ))}
                      <input type="number" value={mediaBudget} onChange={e => setMediaBudget(parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1.5 rounded-lg text-[11px] text-center"
                        style={{ border: `1px solid ${c.gc}`, fontFamily: "'JetBrains Mono', monospace", color: c.mv }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: c.gr }}>Objectif ventes (exemplaires)</label>
                    <div className="flex items-center gap-2">
                      {[100, 250, 500, 1000, 2000].map(v => (
                        <button key={v} onClick={() => setMediaObjective(v)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                          style={{
                            background: mediaObjective === v ? c.or : c.ft,
                            color: mediaObjective === v ? 'white' : c.mv,
                            border: `1px solid ${mediaObjective === v ? c.or : c.gc}`,
                          }}>
                          {v.toLocaleString()}
                        </button>
                      ))}
                      <input type="number" value={mediaObjective} onChange={e => setMediaObjective(parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1.5 rounded-lg text-[11px] text-center"
                        style={{ border: `1px solid ${c.gc}`, fontFamily: "'JetBrains Mono', monospace", color: c.mv }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button onClick={runMediaEngine} disabled={!selectedProject}
                  className="px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all"
                  style={{
                    background: selectedProject ? `linear-gradient(135deg, ${c.or}, #E8B84B)` : c.gc,
                    color: selectedProject ? 'white' : c.gr,
                    cursor: selectedProject ? 'pointer' : 'not-allowed',
                  }}>
                  ⚡ Générer le plan
                </button>
                <button onClick={runABComparison} disabled={!selectedProject}
                  className="px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all"
                  style={{
                    background: selectedProject ? `${c.vm}15` : c.ft,
                    color: selectedProject ? c.vm : c.gr,
                    border: `1.5px solid ${selectedProject ? c.vm : c.gc}`,
                    cursor: selectedProject ? 'pointer' : 'not-allowed',
                  }}>
                  ⚔️ Comparaison A/B
                </button>
              </div>
              {!selectedProject && <div className="text-[10px] mt-2" style={{ color: c.og }}>↑ Sélectionnez un titre ci-dessus pour générer un plan</div>}
            </div>
          </Card>

          {/* Generated Plan */}
          {mediaPlanA && (
            <div className="space-y-4">
              {/* KPIs */}
              <div className="flex gap-3 flex-wrap">
                {[
                  { v: `${mediaPlanA.totalBudget.toLocaleString()}€`, l: 'Budget total', a: c.or },
                  { v: mediaPlanA.totalEstimatedSales.toLocaleString(), l: 'Ventes estimées', a: c.ok },
                  { v: `${mediaPlanA.costPerSale.toFixed(2)}€`, l: 'Coût par vente', a: mediaPlanA.costPerSale > 10 ? c.og : c.ok },
                  { v: `×${mediaPlanA.kpis.roi.toFixed(1)}`, l: 'ROI estimé', a: mediaPlanA.kpis.roi > 1 ? c.ok : c.er },
                  { v: mediaPlanA.kpis.reach.toLocaleString(), l: 'Reach', a: c.vm },
                ].map((kpi, i) => (
                  <div key={i} className="flex-1 min-w-[100px] p-3 rounded-xl text-center" style={{ background: c.ft, border: `1px solid ${c.gc}` }}>
                    <div className="text-[18px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: kpi.a }}>{kpi.v}</div>
                    <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: c.gr }}>{kpi.l}</div>
                  </div>
                ))}
              </div>

              {/* Channel allocations */}
              <Card hover={false} className="overflow-hidden">
                <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Répartition par canal</span>
                    <span className="text-[11px]" style={{ color: c.or }}>{mediaPlanA.channels.length} canaux actifs</span>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {mediaPlanA.channels.map((ch, i) => {
                    const isExpanded = mediaExpanded === ch.channel;
                    return (
                      <div key={ch.channel} className="rounded-xl overflow-hidden transition-all" style={{ background: isExpanded ? `${c.or}05` : 'transparent', border: isExpanded ? `1px solid ${c.or}20` : '1px solid transparent' }}>
                        <div className="flex items-center gap-3 p-2.5 cursor-pointer" onClick={() => setMediaExpanded(isExpanded ? null : ch.channel)}>
                          <span className="text-base shrink-0">{ch.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold" style={{ color: c.mv }}>{ch.label}</span>
                                <Badge bg={ch.priority === 'critical' ? '#D4F0E0' : ch.priority === 'high' ? '#FDE8D0' : c.ft} color={ch.priority === 'critical' ? c.ok : ch.priority === 'high' ? c.og : c.gr}>
                                  {ch.priority === 'critical' ? '★ Critique' : ch.priority === 'high' ? 'Élevée' : ch.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.or }}>{ch.budget.toLocaleString()}€</span>
                                <Badge bg={c.ft} color={c.gr}>{ch.percentage}%</Badge>
                              </div>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.gc }}>
                              <div className="h-full rounded-full transition-all duration-1000" style={{
                                width: `${ch.percentage}%`,
                                background: ch.priority === 'critical' ? c.ok : ch.priority === 'high' ? c.or : c.vm,
                              }} />
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[9px]" style={{ color: c.gr }}>~{ch.estimatedConversions} ventes</span>
                              <span className="text-[9px]" style={{ color: c.gr }}>CPC {ch.cpc.toFixed(2)}€</span>
                              <span className="text-[9px]" style={{ color: ch.roi > 1 ? c.ok : c.er }}>ROI ×{ch.roi.toFixed(1)}</span>
                            </div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.gr} strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}><polyline points="6 9 12 15 18 9" /></svg>
                        </div>

                        {isExpanded && (
                          <div className="px-3 md:px-5 pb-4 pt-1 space-y-3" style={{ animation: 'pageIn 0.2s ease-out' }}>
                            <div className="text-[11px] leading-relaxed" style={{ color: c.gr }}>{ch.description}</div>
                            <div>
                              <div className="text-[9px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: c.or }}>Actions concrètes</div>
                              {ch.tactics.map((t, j) => (
                                <div key={j} className="flex items-start gap-2 mb-1">
                                  <span className="text-[9px] mt-0.5" style={{ color: c.or }}>▸</span>
                                  <span className="text-[10px]" style={{ color: c.mv }}>{t}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px]" style={{ color: c.gr }}>⏱ {ch.timing}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Phases timeline */}
              <Card hover={false} className="overflow-hidden">
                <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
                  <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>📅 Calendrier de lancement</span>
                </div>
                <div className="p-5 space-y-2">
                  {mediaPlanA.phases.map((phase, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: c.ft }}>
                      <div className="text-center shrink-0 w-16">
                        <div className="text-[11px] font-bold" style={{ color: c.or }}>{phase.timing}</div>
                        <div className="text-[9px] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.gr }}>{phase.budget.toLocaleString()}€</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-[12px] font-bold mb-1" style={{ color: c.mv }}>{phase.name}</div>
                        <div className="space-y-0.5">
                          {phase.actions.map((a, j) => (
                            <div key={j} className="text-[10px]" style={{ color: c.gr }}>▸ {a}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recommendations & Warnings */}
              {(mediaPlanA.recommendations.length > 0 || mediaPlanA.warnings.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {mediaPlanA.recommendations.length > 0 && (
                    <Card hover={false} className="overflow-hidden">
                      <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.ok}` }}>
                        <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.ok }}>💡 Recommandations</span>
                      </div>
                      <div className="p-5 space-y-2">
                        {mediaPlanA.recommendations.map((r, i) => (
                          <div key={i} className="text-[11px] p-2.5 rounded-lg" style={{ background: '#D4F0E010', color: c.mv }}>✓ {r}</div>
                        ))}
                      </div>
                    </Card>
                  )}
                  {mediaPlanA.warnings.length > 0 && (
                    <Card hover={false} className="overflow-hidden">
                      <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.og}` }}>
                        <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.og }}>⚠️ Points d'attention</span>
                      </div>
                      <div className="p-5 space-y-2">
                        {mediaPlanA.warnings.map((w, i) => (
                          <div key={i} className="text-[11px] p-2.5 rounded-lg" style={{ background: '#FDE8D010', color: c.mv }}>⚠ {w}</div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* A/B Comparison */}
              {showAB && mediaPlanA && mediaPlanB && (() => {
                const ab = compareAB(mediaPlanA, mediaPlanB);
                return (
                  <Card hover={false} className="overflow-hidden">
                    <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.vm}` }}>
                      <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.vm }}>⚔️ Comparaison A/B</span>
                    </div>
                    <div className="p-3 md:p-5">
                      <div className="flex items-center gap-3 mb-4 justify-center">
                        <Badge bg={ab.winner === 'A' ? '#D4F0E0' : c.ft} color={ab.winner === 'A' ? c.ok : c.gr}>A: {mediaPlanA.label}</Badge>
                        <span className="text-[11px] font-bold" style={{ color: c.gr }}>vs</span>
                        <Badge bg={ab.winner === 'B' ? '#D4F0E0' : c.ft} color={ab.winner === 'B' ? c.ok : c.gr}>B: {mediaPlanB.label}</Badge>
                      </div>
                      <div className="space-y-2">
                        {ab.comparison.map((row, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: c.ft }}>
                            <span className="text-[10px] font-semibold w-28 shrink-0" style={{ color: c.gr }}>{row.metric}</span>
                            <span className="text-[11px] font-bold flex-1 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", color: row.winner === 'A' ? c.ok : c.mv }}>{row.valueA}</span>
                            <span className="text-[9px] shrink-0" style={{ color: c.gr }}>vs</span>
                            <span className="text-[11px] font-bold flex-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: row.winner === 'B' ? c.ok : c.mv }}>{row.valueB}</span>
                            <span className="text-[10px] shrink-0 w-6 text-center" style={{ color: row.winner === 'tie' ? c.gr : c.ok }}>{row.winner === 'tie' ? '=' : row.winner === 'A' ? '←' : '→'}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 rounded-xl text-[11px] leading-relaxed" style={{ background: `${c.vm}08`, color: c.mv, border: `1px solid ${c.vm}20` }}>
                        <strong style={{ color: c.vm }}>Verdict :</strong> {ab.summary}
                      </div>
                    </div>
                  </Card>
                );
              })()}
            </div>
          )}

          {/* Fallback if no plan generated yet */}
          {!mediaPlanA && selectedProject && generatedMedia[selectedProject] && (
            <div className="text-center py-10">
              <div className="text-[13px]" style={{ color: c.gr }}>Cliquez sur &quot;Générer le plan&quot; pour lancer le moteur média</div>
            </div>
          )}

          {/* Export plan */}
          {mediaPlanA && sel && (
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => {
                const plan = mediaPlanA;
                const lines = [
                  `PLAN MÉDIA — ${sel.title}`, `${sel.genre} · ${sel.author} · ${sel.pages} pages`,
                  `Mode : ${plan.mode === 'budget' ? 'Budget' : 'Objectif'} · Généré le ${new Date().toLocaleDateString('fr-FR')}`,
                  ``, `═══ KPIs ═══`,
                  `Budget total : ${plan.totalBudget.toLocaleString()}€`,
                  `Ventes estimées : ${plan.totalEstimatedSales}`,
                  `Coût par vente : ${plan.costPerSale.toFixed(2)}€`,
                  `ROI estimé : ×${plan.kpis.roi.toFixed(1)}`,
                  `Reach : ${plan.kpis.reach.toLocaleString()}`,
                  ``, `═══ CANAUX ═══`,
                  ...plan.channels.map(ch => `${ch.icon} ${ch.label} — ${ch.budget.toLocaleString()}€ (${ch.percentage}%) · ~${ch.estimatedConversions} ventes · ROI ×${ch.roi.toFixed(1)}\n  ${ch.tactics.join('\n  ')}`),
                  ``, `═══ PHASES ═══`,
                  ...plan.phases.map(ph => `${ph.name} (${ph.timing}) — ${ph.budget.toLocaleString()}€\n  ${ph.actions.join('\n  ')}`),
                  ...(plan.recommendations.length ? [``, `═══ RECOMMANDATIONS ═══`, ...plan.recommendations.map(r => `✓ ${r}`)] : []),
                  ...(plan.warnings.length ? [``, `═══ ALERTES ═══`, ...plan.warnings.map(w => `⚠ ${w}`)] : []),
                ];
                const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = `plan-media-${sel.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${plan.mode}.txt`; a.click();
                onToast(`Plan média exporté : ${sel.title}`);
              }}
                className="px-3 md:px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-2"
                style={{ background: c.ft, color: c.mv, border: `1.5px solid ${c.gc}` }}>
                {icons.download} Exporter le plan (.txt)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: AMAZON ADS ═══ */}
      {tab === 'amazon' && (
        <div className="space-y-5">
          {/* Amazon strategy overview */}
          <Card hover={false} className="p-3 md:p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[32px]">🛒</span>
              <div>
                <h3 className="text-[16px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>Stratégie Amazon Advertising</h3>
                <p className="text-[11px]" style={{ color: c.gr }}>Sponsored Products · Keyword Targeting · Budget par genre</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: '🎯', title: 'Sponsored Products', desc: 'Apparaître dans les résultats de recherche et pages produit similaires. CPC moyen 0.25-0.55€.' },
                { icon: '📚', title: 'Product Display', desc: 'Cibler les lecteurs qui consultent des livres similaires dans votre genre. Retargeting automatique.' },
                { icon: '🏷️', title: 'Sponsored Brands', desc: 'Bannière en haut de recherche avec logo Jabrilia + 3 titres. Branding éditeur.' },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: c.ft }}>
                  <div className="text-lg mb-2">{s.icon}</div>
                  <div className="text-[12px] font-semibold mb-1" style={{ color: c.mv }}>{s.title}</div>
                  <div className="text-[10px] leading-relaxed" style={{ color: c.gr }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Keywords by genre */}
          {projects.map(p => {
            const kw = amazonKeywords[p.genre] || amazonKeywords['Roman'];
            return (
              <Card key={p.id} hover={false} className="overflow-hidden">
                <div className="px-3 md:px-5 py-3 flex items-center gap-3" style={{ borderBottom: `2px solid ${c.or}` }}>
                  <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                  <div>
                    <span className="text-[13px] font-semibold" style={{ color: c.mv }}>{p.title}</span>
                    <span className="text-[10px] ml-2" style={{ color: c.gr }}>{p.genre} · Enchère recommandée : {kw.bid}</span>
                  </div>
                </div>
                <div className="p-3 md:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Primary keywords */}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: c.ok }}>🎯 Mots-clés primaires</div>
                    <div className="space-y-1.5">
                      {kw.primary.map((k, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px]" style={{ background: '#D4F0E020', border: '1px solid #D4F0E0', color: c.vm }}>
                          <span className="text-[8px]" style={{ color: c.ok }}>●</span> {k}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Long tail */}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: c.or }}>🔎 Long tail (haute conversion)</div>
                    <div className="space-y-1.5">
                      {kw.long_tail.map((k, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px]" style={{ background: `${c.or}08`, border: `1px solid ${c.or}30`, color: c.vm }}>
                          <span className="text-[8px]" style={{ color: c.or }}>●</span> {k}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Negative */}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: c.er }}>🚫 Mots-clés négatifs</div>
                    <div className="space-y-1.5">
                      {kw.negative.map((k, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px]" style={{ background: '#FFE0E320', border: '1px solid #FFE0E3', color: c.gr }}>
                          <span className="text-[8px]" style={{ color: c.er }}>✗</span> {k}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 rounded-lg text-[9px]" style={{ background: c.ft, color: c.gr }}>
                      💡 Exclure ces termes pour éviter les impressions non pertinentes et optimiser le ROAS
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ TAB: SOCIAL MEDIA ═══ */}
      {tab === 'social' && (
        <div className="space-y-5">
          {projects.map(p => {
            const social = socialTemplates[p.genre] || socialTemplates['Roman'];
            if (!social) return null;
            return (
              <Card key={p.id} hover={false} className="overflow-hidden">
                <div className="px-3 md:px-5 py-3 flex items-center gap-3" style={{ borderBottom: `2px solid ${c.or}` }}>
                  <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                  <div className="flex-1">
                    <span className="text-[13px] font-semibold" style={{ color: c.mv }}>{p.title}</span>
                    <span className="text-[10px] ml-2" style={{ color: c.gr }}>{p.genre}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => { navigator.clipboard.writeText(social.instagram.hashtags.join(' ')); onToast('Hashtags Instagram copiés !'); }}
                      className="px-2.5 py-1 rounded-lg cursor-pointer border-none text-[9px] font-semibold" style={{ background: '#E1306C15', color: '#E1306C' }}>
                      📋 Copier # Insta
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(social.tiktok.hashtags.join(' ')); onToast('Hashtags TikTok copiés !'); }}
                      className="px-2.5 py-1 rounded-lg cursor-pointer border-none text-[9px] font-semibold" style={{ background: '#00000010', color: '#000' }}>
                      📋 Copier # TikTok
                    </button>
                  </div>
                </div>

                <div className="p-3 md:p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* TikTok */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">🎵</span>
                      <span className="text-[12px] font-bold" style={{ color: c.mv }}>TikTok / BookTok</span>
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: c.or }}>Hooks vidéo</div>
                    <div className="space-y-1.5 mb-3">
                      {social.tiktok.hooks.map((h, i) => (
                        <div key={i} className="p-2.5 rounded-lg text-[11px] leading-relaxed" style={{ background: c.ft, color: c.vm }}>
                          {h}
                        </div>
                      ))}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: c.or }}>Format & timing</div>
                    <div className="text-[10px] mb-2" style={{ color: c.gr }}>{social.tiktok.format}</div>
                    <div className="text-[10px] mb-3" style={{ color: c.gr }}>📅 {social.tiktok.timing}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: c.or }}>Hashtags</div>
                    <div className="flex flex-wrap gap-1">
                      {social.tiktok.hashtags.map((h, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: '#00000008', color: '#333' }}>{h}</span>
                      ))}
                    </div>
                  </div>

                  {/* Instagram */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">📸</span>
                      <span className="text-[12px] font-bold" style={{ color: c.mv }}>Instagram</span>
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#E1306C' }}>Caption prête à poster</div>
                    <div className="space-y-2 mb-3">
                      {social.instagram.captions.slice(0, 1).map((cap, i) => (
                        <div key={i} className="p-3 rounded-xl text-[10px] leading-relaxed whitespace-pre-line cursor-pointer"
                          style={{ background: '#E1306C08', border: '1px solid #E1306C20', color: c.vm }}
                          onClick={() => { navigator.clipboard.writeText(cap); onToast('Caption copiée !'); }}>
                          {cap}
                          <div className="text-[8px] mt-2 font-bold" style={{ color: '#E1306C' }}>Cliquez pour copier</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#E1306C' }}>Format</div>
                    <div className="text-[10px] mb-3" style={{ color: c.gr }}>{social.instagram.format}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#E1306C' }}>Stories</div>
                    <div className="space-y-1">
                      {social.instagram.stories.map((s, i) => (
                        <div key={i} className="text-[10px] flex items-center gap-1.5" style={{ color: c.vm }}>
                          <span style={{ color: '#E1306C' }}>▸</span> {s}
                        </div>
                      ))}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5 mt-3" style={{ color: '#E1306C' }}>Hashtags</div>
                    <div className="flex flex-wrap gap-1">
                      {social.instagram.hashtags.map((h, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: '#E1306C08', color: '#E1306C' }}>{h}</span>
                      ))}
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">💼</span>
                      <span className="text-[12px] font-bold" style={{ color: c.mv }}>LinkedIn</span>
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#0A66C2' }}>Angle éditorial</div>
                    <div className="p-3 rounded-xl text-[11px] leading-relaxed mb-3" style={{ background: '#0A66C208', border: '1px solid #0A66C220', color: c.vm }}>
                      {social.linkedin.angle}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#0A66C2' }}>Hashtags</div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {social.linkedin.hashtags.map((h, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: '#0A66C208', color: '#0A66C2' }}>{h}</span>
                      ))}
                    </div>

                    <div className="text-[9px] font-bold uppercase tracking-wider mb-2 mt-4 pt-3" style={{ color: c.or, borderTop: `1px solid ${c.gc}` }}>💡 Tips cross-plateforme</div>
                    <div className="space-y-1.5">
                      {[
                        'Poster TikTok → recycler en Reel Instagram',
                        'Extraire citation → LinkedIn + Story Insta',
                        'UGC lecteurs → reposter sur tous les canaux',
                        'Lien Amazon UTM dans chaque bio',
                      ].map((tip, i) => (
                        <div key={i} className="text-[10px] flex items-center gap-1.5" style={{ color: c.vm }}>
                          <span style={{ color: c.ok }}>✓</span> {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ TAB: KIT IA ═══ */}
      {tab === 'kit' && (
        <div>
          {/* Engine pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
            {[
              { icon: '📋', name: 'Brief créatif', desc: 'Ton, thèmes, palette, audience' },
              { icon: '📱', name: 'Kit Marketing', desc: 'Instagram, LinkedIn, newsletter' },
              { icon: '🎬', name: 'Script Trailer', desc: 'Voix off + visuels + musique' },
              { icon: '🎨', name: 'Brief Couverture', desc: 'Direction artistique + prompts IA' },
              { icon: '🎧', name: 'Plan Audiobook', desc: 'Chapitres, voix, mastering' },
            ].map((e, i) => (
              <Card key={e.name} hover={false} className="p-4 text-center relative">
                <div className="text-2xl mb-1.5">{e.icon}</div>
                <div className="font-semibold text-[11px]" style={{ color: c.mv }}>{e.name}</div>
                <div className="text-[9px] mt-1 leading-relaxed" style={{ color: c.gr }}>{e.desc}</div>
                {i < 4 && <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 text-[14px]" style={{ color: c.gc }}>→</div>}
              </Card>
            ))}
          </div>

          {/* Project selector for kit generation */}
          <Card hover={false} className="mb-6">
            <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
              <span className="uppercase tracking-wider font-semibold" style={{ fontSize: 12, color: c.gr }}>Sélectionner un titre pour générer le kit</span>
            </div>
            {projects.map(p => {
              const hasBack = p.backCover && p.backCover.length > 50;
              const isSelected = selectedProject === p.id;
              const hasKit = generatedKit[p.id];
              return (
                <div key={p.id} className="flex items-center gap-2 md:gap-4 px-3 md:px-5 py-3 cursor-pointer hover:bg-[#FAF7F2]"
                  style={{ borderBottom: `1px solid ${c.ft}`, background: isSelected ? '#FAF7F2' : undefined }}
                  onClick={() => generateKit(p.id)}>
                  <CoverThumb emoji={p.cover} coverImage={p.coverImage} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold" style={{ color: c.mv }}>{p.title}</div>
                    <div className="text-[10px]" style={{ color: c.gr }}>{p.genre} · {p.author}</div>
                  </div>
                  {!hasBack && <Badge bg="#FFF3E0" color={c.og}>Sans 4e</Badge>}
                  {hasKit ? <Badge bg="#D4F0E0" color={c.ok}>✓ Généré</Badge> : <span onClick={(e) => { e.stopPropagation(); generateKit(p.id); }}><Btn variant="secondary" onClick={() => {}}>Générer</Btn></span>}
                </div>
              );
            })}
          </Card>

          {/* Kit results */}
          {sel && kit && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Brief */}
              <Card hover={false} className="overflow-hidden">
                <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
                  <span className="text-[13px] font-semibold" style={{ color: c.mv }}>📋 Brief créatif — {sel.title}</span>
                </div>
                <div className="p-5 space-y-2.5">
                  {[
                    { l: 'Ton', v: kit.brief.tone }, { l: 'Ambiance', v: kit.brief.ambiance }, { l: 'Audience', v: kit.brief.targetAudience },
                    { l: 'Pitch', v: kit.brief.oneLinePitch }, { l: 'Angle marketing', v: kit.brief.marketingAngle },
                  ].map(f => (
                    <div key={f.l} className="flex gap-2"><span className="text-[9px] font-bold uppercase tracking-wider shrink-0 w-20 pt-0.5" style={{ color: c.or }}>{f.l}</span><span className="text-[11px] leading-relaxed" style={{ color: c.vm }}>{f.v}</span></div>
                  ))}
                  <div className="flex flex-wrap gap-1 mt-2">{kit.brief.hashTags.map((h, i) => <span key={i} className="px-2 py-0.5 rounded-full text-[9px]" style={{ background: c.ft, color: c.vm }}>{h}</span>)}</div>
                </div>
              </Card>
              {/* Marketing */}
              <Card hover={false} className="overflow-hidden">
                <div className="px-3 md:px-5 py-3" style={{ borderBottom: `2px solid ${c.or}` }}>
                  <span className="text-[13px] font-semibold" style={{ color: c.mv }}>📱 Kit Marketing</span>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { l: '📸 Instagram', v: kit.marketing.instagramCaption },
                    { l: '💼 LinkedIn', v: kit.marketing.linkedinPost },
                    { l: '📧 Newsletter', v: kit.marketing.newsletterBlurb },
                  ].map(f => (
                    <div key={f.l} className="p-3 rounded-xl cursor-pointer hover:shadow-sm transition-shadow" style={{ background: c.ft }}
                      onClick={() => { navigator.clipboard.writeText(f.v); onToast(`${f.l} copié !`); }}>
                      <div className="text-[10px] font-bold mb-1" style={{ color: c.or }}>{f.l}</div>
                      <div className="text-[10px] leading-relaxed" style={{ color: c.vm }}>{f.v}</div>
                      <div className="text-[8px] mt-1 font-bold" style={{ color: c.gr }}>Cliquer pour copier</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════
// TOAST
// ═══════════════════════════════════
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const isError = message.toLowerCase().includes('erreur');

  useEffect(() => {
    const t = setTimeout(() => { setPhase('out'); setTimeout(onClose, 400); }, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl"
      style={{
        background: isError ? '#2D1B4E' : c.mv, color: 'white',
        animation: phase === 'in' ? 'toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'toastOut 0.4s ease-in forwards',
        border: `1px solid ${isError ? 'rgba(217,68,82,0.3)' : 'rgba(200,149,46,0.2)'}`,
      }}>
      <span className="flex shrink-0" style={{ color: isError ? '#E8616D' : c.oc }}>
        {isError ? icons.warn : icons.check}
      </span>
      <span className="text-[13px] font-medium">{message}</span>
      <button onClick={() => { setPhase('out'); setTimeout(onClose, 400); }}
        className="ml-1 cursor-pointer bg-transparent border-none opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: 'white' }}>{icons.close}</button>
    </div>
  );
};

// ═══════════════════════════════════
// NOTIFICATION PANEL
// ═══════════════════════════════════

// ═══════════════════════════════════
// COMMAND PALETTE — Ctrl+K
// ═══════════════════════════════════

type CmdResult = { type: 'project' | 'isbn' | 'module' | 'collection' | 'action' | 'note' | 'correction'; label: string; sub: string; icon: string; action: () => void; matchField?: string };

const highlightMatch = (text: string, query: string) => {
  if (!query || query.length < 2) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<mark style={{ background: 'rgba(200,149,46,0.2)', color: 'inherit', padding: '0 1px', borderRadius: 2 }}>{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>;
};

const CommandPalette = ({ open, onClose, projects, onProject, onNav }: {
  open: boolean; onClose: () => void; projects: Project[];
  onProject: (p: Project) => void; onNav: (id: string) => void;
}) => {
  const [q, setQ] = useState('');
  const inputRef = { current: null as HTMLInputElement | null };
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setQ('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const query = q.toLowerCase().trim();

  const results: CmdResult[] = [];

  if (query.length > 0) {
    // Search projects (title, author, genre, subtitle)
    projects.forEach(p => {
      const fields: [string, string][] = [
        [p.title, 'titre'], [p.author, 'auteur'], [p.genre, 'genre'],
        [p.subtitle || '', 'sous-titre'], [p.collection || '', 'collection'],
      ];
      const match = fields.find(([val]) => val.toLowerCase().includes(query));
      if (match) {
        results.push({
          type: 'project', label: p.title, sub: `${p.genre} · ${p.author} · ${p.pages}p`,
          icon: p.cover, action: () => { onProject(p); onClose(); }, matchField: match[1]
        });
      }
    });

    // Search in back cover text
    projects.forEach(p => {
      if (p.backCover && p.backCover.toLowerCase().includes(query) && !results.find(r => r.type === 'project' && r.label === p.title)) {
        const idx = p.backCover.toLowerCase().indexOf(query);
        const snippet = '…' + p.backCover.slice(Math.max(0, idx - 20), idx + query.length + 30) + '…';
        results.push({
          type: 'note', label: p.title, sub: snippet,
          icon: '📄', action: () => { onProject(p); onClose(); }, matchField: '4e de couverture'
        });
      }
    });

    // Search in notes
    projects.forEach(p => {
      if (p.notes && p.notes.toLowerCase().includes(query)) {
        const idx = p.notes.toLowerCase().indexOf(query);
        const snippet = '…' + p.notes.slice(Math.max(0, idx - 20), idx + query.length + 30) + '…';
        results.push({
          type: 'note', label: p.title, sub: snippet,
          icon: '📝', action: () => { onProject(p); onClose(); }, matchField: 'notes'
        });
      }
    });

    // Search corrections
    projects.forEach(p => {
      p.corrections.forEach(corr => {
        if (corr.toLowerCase().includes(query)) {
          results.push({
            type: 'correction', label: corr, sub: p.title,
            icon: '⚠️', action: () => { onProject(p); onClose(); }, matchField: 'correction'
          });
        }
      });
    });

    // Search ISBN
    projects.forEach(p => {
      p.editions.forEach(e => {
        if (e.isbn.toLowerCase().includes(query)) {
          results.push({
            type: 'isbn', label: e.isbn, sub: `${p.title} · ${FORMAT_LABELS[e.format]?.label || e.format}`,
            icon: '🔢', action: () => { onProject(p); onClose(); }
          });
        }
      });
    });

    // Search collections
    const matchedColls = new Set<string>();
    COLLECTIONS.forEach(col => {
      if (col.name.toLowerCase().includes(query) || col.desc.toLowerCase().includes(query)) {
        if (!matchedColls.has(col.name)) {
          matchedColls.add(col.name);
          results.push({
            type: 'collection', label: col.name, sub: col.desc,
            icon: '📚', action: () => { onNav('collections'); onClose(); }
          });
        }
      }
    });

    // Search modules / pages
    const modules: [string, string, string][] = [
      ['dashboard', 'Dashboard', 'Vue d\'ensemble, KPIs, catalogue, Kanban'],
      ['projets', 'Projets', 'Catalogue complet, Kanban, filtres, tri'],
      ['manuscrits', 'Manuscrits', 'Pipeline manuscrit, upload, statuts'],
      ['analyse', 'Analyse IA', 'Scanner 6D, détection patterns, score IA'],
      ['calibrage', 'Calibrage', 'Gabarit couverture, dos, format Jabrilia'],
      ['couvertures', 'Couvertures', 'Diagnostic, corrections, gabarit'],
      ['cover-studio', '◆ Cover Studio', 'Couverture → Pack marketing → Bande-annonce'],
      ['audiobooks', 'Audiobooks', 'Pipeline audio, voix, chapitres'],
      ['distribution', 'Distribution', 'KDP, Pollen, IngramSpark, Apple, Kobo, Spotify'],
      ['marketing', 'Marketing', 'Kit réseaux sociaux, fiches produit'],
      ['presse', 'Dossier Presse', 'Communiqué, bio auteur, extraits'],
      ['calendrier', 'Calendrier Éditorial', 'Fenêtre de sortie IA, plan média'],
      ['analytics', 'Analytics', 'Readiness, revenus, finances, ROI'],
      ['isbn', 'ISBN', 'Attribution, export CSV, ONIX 3.0'],
      ['collections', 'Collections', 'Regroupement par série ou thématique'],
      ['droits', 'Droits & Contrats', 'Droits dérivés, adaptations, traductions, territoires, contrats'],
      ['benchmark', 'Benchmark Concurrence', 'Positionnement prix, concurrents par genre, tendances marché'],
      ['lecteurs', 'Lecteurs & Réception', 'Avis, notes, citations presse, lectorat cible par titre'],
      ['traductions', 'Traductions', 'Langues cibles, traducteurs, progression, marchés internationaux'],
      ['multiauteurs', 'Multi-auteurs', 'Vue consolidée par auteur, readiness, production, qualité'],
      ['editeur', 'Tableau éditeur', 'Vue consolidée multi-auteurs, comparaison, poids catalogue'],
      ['settings', 'Paramètres', 'Éditeur, import CSV, thème sombre'],
    ];
    modules.forEach(([id, label, desc]) => {
      if (label.toLowerCase().includes(query) || desc.toLowerCase().includes(query) || id.includes(query)) {
        results.push({
          type: 'module', label, sub: desc,
          icon: '📂', action: () => { onNav(id); onClose(); }
        });
      }
    });

    // Actions
    const actions: [string, string, string, () => void][] = [
      ['Nouveau projet', 'Créer un nouveau titre dans le catalogue', '➕', () => { onNav('projets'); onClose(); }],
      ['Export ONIX', 'Exporter le catalogue au format ONIX 3.0', '📤', () => { onNav('isbn'); onClose(); }],
      ['Export PDF', 'Exporter une fiche projet en PDF', '📑', () => { onNav('projets'); onClose(); }],
      ['Mode sombre', 'Basculer le thème clair/sombre', '🌙', () => { onNav('settings'); onClose(); }],
      ['Import CSV', 'Importer un catalogue depuis un fichier CSV', '📂', () => { onNav('settings'); onClose(); }],
      ['Calendrier IA', 'Analyser les fenêtres de sortie', '📅', () => { onNav('calendrier'); onClose(); }],
      ['Plan média', 'Générer un plan média par titre', '📡', () => { onNav('calendrier'); onClose(); }],
    ];
    actions.forEach(([label, desc, icon, action]) => {
      if (label.toLowerCase().includes(query) || desc.toLowerCase().includes(query)) {
        results.push({ type: 'action', label, sub: desc, icon, action });
      }
    });
  } else {
    // Default suggestions when empty
    results.push({ type: 'action', label: 'Nouveau projet', sub: 'Créer un titre', icon: '➕', action: () => { onNav('projets'); onClose(); } });
    projects.slice(0, 4).forEach(p => {
      results.push({
        type: 'project', label: p.title, sub: `${p.genre} · ${p.author}`,
        icon: p.cover, action: () => { onProject(p); onClose(); }
      });
    });
    results.push({ type: 'module', label: 'Calendrier Éditorial', sub: 'Fenêtre de sortie + plan média IA', icon: '📅', action: () => { onNav('calendrier'); onClose(); } });
    results.push({ type: 'module', label: 'Analytics', sub: 'Finances, readiness, ROI', icon: '📈', action: () => { onNav('analytics'); onClose(); } });
    results.push({ type: 'module', label: 'Distribution', sub: 'KDP, Pollen, IngramSpark…', icon: '🚚', action: () => { onNav('distribution'); onClose(); } });
  }

  // Clamp selection
  const clampedIdx = Math.min(selectedIdx, results.length - 1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[clampedIdx]) { results[clampedIdx].action(); }
    else if (e.key === 'Escape') { onClose(); }
  };

  const typeLabels: Record<CmdResult['type'], string> = { project: 'Titre', isbn: 'ISBN', module: 'Module', collection: 'Collection', action: 'Action', note: 'Contenu', correction: 'Correction' };
  const typeColors: Record<CmdResult['type'], { bg: string; color: string }> = {
    project: { bg: '#E8E0F0', color: '#5B3E8A' },
    isbn: { bg: '#FDE8D0', color: '#E07A2F' },
    module: { bg: '#D4F0E0', color: '#2EAE6D' },
    collection: { bg: '#E0ECFF', color: '#3B6DC6' },
    action: { bg: '#F5F3EF', color: '#9E9689' },
    note: { bg: '#FFF8E0', color: '#C8952E' },
    correction: { bg: '#FFE0E3', color: '#D94452' },
  };

  // Group results by type for headers
  const grouped: { type: CmdResult['type']; items: (CmdResult & { globalIdx: number })[] }[] = [];
  let globalIdx = 0;
  const typeOrder: CmdResult['type'][] = ['action', 'project', 'note', 'correction', 'isbn', 'collection', 'module'];
  typeOrder.forEach(type => {
    const items = results
      .map((r, i) => ({ ...r, globalIdx: i }))
      .filter(r => r.type === type);
    if (items.length > 0) grouped.push({ type, items });
  });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black bg-opacity-40 backdrop-blur-sm" onClick={onClose} />

      {/* Palette */}
      <div className="fixed top-[12%] left-1/2 -translate-x-1/2 z-[101] w-[92vw] max-w-[580px]"
        style={{ animation: 'cmdSlide 0.2s ease-out' }}>
        <style>{`@keyframes cmdSlide { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ border: `1px solid ${c.gc}` }}>
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `2px solid ${c.or}` }}>
            <span style={{ color: c.or }}>{icons.search}</span>
            <input ref={el => { inputRef.current = el; }} value={q} onChange={e => { setQ(e.target.value); setSelectedIdx(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher un titre, ISBN, module, contenu, action…"
              className="flex-1 bg-transparent border-none outline-none text-[15px]"
              style={{ color: c.mv, fontFamily: "'Inter', sans-serif" }} />
            <kbd className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: c.ft, color: c.gr, border: `1px solid ${c.gc}` }}>ESC</kbd>
          </div>

          {/* Results grouped */}
          <div className="max-h-[400px] overflow-y-auto">
            {results.length === 0 && q.length > 0 && (
              <div className="px-3 md:px-5 py-8 text-center">
                <div className="text-[24px] mb-2">🔍</div>
                <div className="text-[13px] font-semibold" style={{ color: c.mv }}>Aucun résultat pour « {q} »</div>
                <div className="text-[11px] mt-1" style={{ color: c.gr }}>Essayez un titre, auteur, ISBN, genre ou mot-clé</div>
              </div>
            )}
            {grouped.map(group => (
              <div key={group.type}>
                {query.length > 0 && (
                  <div className="px-3 md:px-5 pt-3 pb-1">
                    <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: typeColors[group.type].color }}>
                      {typeLabels[group.type]}s ({group.items.length})
                    </span>
                  </div>
                )}
                {group.items.map(r => {
                  const tc = typeColors[r.type];
                  const i = r.globalIdx;
                  return (
                    <div key={`${r.type}-${r.label}-${i}`}
                      onClick={r.action}
                      onMouseEnter={() => setSelectedIdx(i)}
                      className="flex items-center gap-3 px-3 md:px-5 py-2.5 cursor-pointer transition-colors"
                      style={{ background: i === clampedIdx ? 'rgba(200,149,46,0.06)' : 'transparent', borderLeft: i === clampedIdx ? `3px solid ${c.or}` : '3px solid transparent' }}>
                      <span className="text-base shrink-0">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate" style={{ color: c.mv }}>
                          {query ? highlightMatch(r.label, query) : r.label}
                        </div>
                        <div className="text-[11px] truncate" style={{ color: c.gr }}>
                          {query ? highlightMatch(r.sub, query) : r.sub}
                        </div>
                      </div>
                      {r.matchField && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-semibold shrink-0" style={{ background: c.ft, color: c.gr }}>
                          {r.matchField}
                        </span>
                      )}
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: tc.bg, color: tc.color }}>
                        {typeLabels[r.type]}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-4 px-3 md:px-5 py-2.5" style={{ borderTop: `1px solid ${c.ft}`, background: c.ft }}>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: c.gr }}>
              <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'white', border: `1px solid ${c.gc}`, fontSize: 9 }}>↑↓</kbd> naviguer
            </span>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: c.gr }}>
              <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'white', border: `1px solid ${c.gc}`, fontSize: 9 }}>↵</kbd> ouvrir
            </span>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: c.gr }}>
              <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'white', border: `1px solid ${c.gc}`, fontSize: 9 }}>esc</kbd> fermer
            </span>
            <span className="ml-auto text-[10px] font-semibold" style={{ color: c.or }}>{results.length} résultat{results.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </>
  );
};

type Notif = { type: 'error' | 'warning' | 'info' | 'success'; title: string; desc: string; icon?: string };

const generateNotifs = (projects: Project[]): Notif[] => {
  const notifs: Notif[] = [];
  const currentMonth = new Date().getMonth() + 1;

  // Cover corrections needed
  const corr = projects.filter(p => p.corrections.length > 0);
  if (corr.length > 0) {
    notifs.push({ type: 'error', title: `${corr.reduce((s, p) => s + p.corrections.length, 0)} corrections couverture`, desc: `${corr.map(p => p.title).join(', ')}`, icon: '🔴' });
  }

  // Missing prices
  const noPrice = projects.filter(p => p.editions.some(e => !e.price && e.isbn));
  if (noPrice.length > 0) {
    notifs.push({ type: 'warning', title: `Prix manquant sur ${noPrice.length} titre${noPrice.length > 1 ? 's' : ''}`, desc: noPrice.map(p => p.title).slice(0, 3).join(', '), icon: '💰' });
  }

  // Missing back cover text
  const noBack = projects.filter(p => !p.backCover);
  if (noBack.length > 0) {
    notifs.push({ type: 'warning', title: `4e de couverture manquante`, desc: `${noBack.length} titre${noBack.length > 1 ? 's' : ''} sans texte de 4e`, icon: '📝' });
  }

  // Manuscripts not analyzed
  const noAnalysis = projects.filter(p => p.manuscriptFile && !p.analysis);
  if (noAnalysis.length > 0) {
    notifs.push({ type: 'info', title: `${noAnalysis.length} manuscrit${noAnalysis.length > 1 ? 's' : ''} non analysé${noAnalysis.length > 1 ? 's' : ''}`, desc: 'Lancez le Scanner 6D pour détecter les patterns IA', icon: '🔍' });
  }

  // High IA score
  const highIa = projects.filter(p => p.analysis && p.analysis.iaScore > 30);
  if (highIa.length > 0) {
    notifs.push({ type: 'error', title: `Score IA élevé (>${'\u200B'}30%)`, desc: highIa.map(p => `${p.title}: ${p.analysis!.iaScore}%`).join(', '), icon: '🤖' });
  }

  // Seasonal windows approaching
  const seasonalHints: Record<number, string[]> = {
    7: ['Préparez vos sorties rentrée littéraire (septembre)'],
    8: ['Rentrée littéraire dans 1 mois — finalisez vos manuscrits'],
    9: ['Rentrée littéraire en cours — c\'est le moment de publier'],
    10: ['Salon du Livre Jeunesse approche — titres jeunesse prêts ?', 'Prix littéraires : soumettez vos candidatures'],
    11: ['Black Friday / Noël — vérifiez vos stocks et ePubs', 'Salon Montreuil ce mois-ci'],
    1: ['Angoulême approche — titres BD prêts ?', 'Saison bonnes résolutions — dev perso en vitrine'],
    2: ['Salon du Livre Paris dans 1 mois — préparez vos ouvrages'],
    3: ['Salon du Livre Paris ce mois — dédicaces et pitch éditeurs'],
  };
  const hints = seasonalHints[currentMonth] || [];
  hints.forEach(h => {
    notifs.push({ type: 'info', title: 'Fenêtre éditoriale', desc: h, icon: '📅' });
  });

  // Drafts stalling
  const drafts = projects.filter(p => p.status === 'draft');
  if (drafts.length > 0) {
    notifs.push({ type: 'warning', title: `${drafts.length} brouillon${drafts.length > 1 ? 's' : ''} en attente`, desc: 'Manuscrits à faire avancer dans le pipeline', icon: '📋' });
  }

  // ISBN status
  const usedISBN = countISBN(projects);
  if (usedISBN > 80) {
    notifs.push({ type: 'warning', title: `ISBN : ${usedISBN}/100 utilisés`, desc: `${100 - usedISBN} ISBN restants — pensez à réapprovisionner`, icon: '🔢' });
  } else {
    notifs.push({ type: 'success', title: `ISBN : ${usedISBN}/100`, desc: `${100 - usedISBN} ISBN disponibles`, icon: '✅' });
  }

  return notifs;
};

const NotifPanel = ({ open, onClose, projects }: { open: boolean; onClose: () => void; projects: Project[] }) => {
  if (!open) return null;
  const notifs = generateNotifs(projects);
  const errors = notifs.filter(n => n.type === 'error');
  const warnings = notifs.filter(n => n.type === 'warning');
  const infos = notifs.filter(n => n.type === 'info');
  const successes = notifs.filter(n => n.type === 'success');

  const colorMap = { error: c.er, warning: c.og, info: '#3B6DC6', success: c.ok };

  return (
    <div className="absolute top-full right-0 mt-2 w-[360px] bg-white rounded-xl shadow-xl border z-50" style={{ borderColor: c.gc }}>
      <div className="flex justify-between items-center px-4 py-3" style={{ borderBottom: `1px solid ${c.gc}` }}>
        <div>
          <span className="font-semibold text-[13px]" style={{ color: c.mv }}>Notifications</span>
          <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full font-bold" style={{ background: errors.length > 0 ? '#FFE0E3' : '#D4F0E0', color: errors.length > 0 ? c.er : c.ok }}>
            {notifs.length}
          </span>
        </div>
        <button onClick={onClose} className="cursor-pointer bg-transparent border-none" style={{ color: c.gr }}>{icons.close}</button>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {[...errors, ...warnings, ...infos, ...successes].map((n, i) => (
          <div key={i} className="px-4 py-3 flex gap-3" style={{ borderBottom: `1px solid ${c.ft}` }}>
            <span className="text-base shrink-0">{n.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold" style={{ color: colorMap[n.type] }}>{n.title}</div>
              <div className="text-[11px] mt-0.5 leading-relaxed" style={{ color: c.gr }}>{n.desc}</div>
            </div>
            <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: colorMap[n.type] }} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// MAIN APP
// ═══════════════════════════════════
// ═══════════════════════════════════
// ONBOARDING GUIDED TOUR
// ═══════════════════════════════════
const ONBOARD_STEPS = [
  { title: 'Bienvenue sur JABR 👋', desc: 'Votre usine de production éditoriale. De la couverture vierge au pack marketing complet — JABR fait tout.', icon: '🚀', tip: 'Ce tour rapide vous montre les fonctions clés.' },
  { title: 'Dashboard', desc: 'Vue d\'ensemble de votre catalogue : KPIs, readiness par titre, graphiques. 8 moteurs IA intégrés.', icon: '📊', tip: 'Cliquez sur un titre pour ouvrir sa fiche détaillée.' },
  { title: '◆ Cover Studio — Le cœur de JABR', desc: 'En 6 étapes : sélection du titre → audit → assemblage de la couverture (titre, auteur, ISBN, code-barres) → pack marketing → bande-annonce → export. JABR assemble votre couverture prête à imprimer.', icon: '🎨', tip: 'Menu ☰ → ◆ Cover Studio. Choisissez un titre et traversez les étapes.' },
  { title: 'Pas de couverture ? Générez-en une', desc: 'JABR crée les prompts DALL-E 3 et Midjourney adaptés à votre genre. Ou branchez votre clé API OpenAI pour générer directement dans JABR.', icon: '✨', tip: 'Cover Studio → Étape 1 → "Générez-en une"' },
  { title: 'Pack Marketing automatique', desc: '12 formats sociaux (Instagram, Facebook, LinkedIn, TikTok…), textes marketing, hashtags, communiqué de presse. Tout généré en un clic.', icon: '📱', tip: 'Cover Studio → Étape 4 (Marketing Pack) et Étape 6 (Export)' },
  { title: 'Bande-annonce Runway', desc: 'JABR génère un storyboard scène par scène avec les prompts pour Runway Gen-3 Alpha. Branchez votre clé API pour générer la vidéo directement.', icon: '🎬', tip: 'Cover Studio → Étape 5 (Bande-annonce)' },
  { title: '22 modules', desc: 'Manuscrits, Analyse IA, Calibrage, Couvertures, Distribution, Marketing, Presse, Calendrier, Analytics, ISBN, ONIX 3.0, Droits, Benchmark…', icon: '⚙️', tip: 'Ctrl+K pour chercher n\'importe quoi.' },
  { title: 'C\'est parti !', desc: 'Commencez par ◆ Cover Studio pour voir JABR en action. Sélectionnez un titre et traversez les 6 étapes.', icon: '🎯', tip: 'Relancez ce tour depuis Paramètres.' },
];

const OnboardingOverlay = ({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) => {
  const s = ONBOARD_STEPS[step];
  const isLast = step === ONBOARD_STEPS.length - 1;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(45,27,78,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="max-w-md w-full mx-4 rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', animation: 'scaleIn 0.3s ease-out' }}>
        {/* Progress bar */}
        <div className="h-1" style={{ background: c.gc }}>
          <div className="h-full transition-all duration-500" style={{ width: `${((step + 1) / ONBOARD_STEPS.length) * 100}%`, background: `linear-gradient(90deg, ${c.or}, ${c.og})` }} />
        </div>
        <div className="p-8 text-center">
          <div className="text-[48px] mb-4">{s.icon}</div>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>{s.title}</h3>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: c.gr }}>{s.desc}</p>
          <div className="inline-block px-3 py-1.5 rounded-lg text-[11px]" style={{ background: c.ft, color: c.og }}>
            💡 {s.tip}
          </div>
        </div>
        <div className="flex items-center justify-between px-8 pb-6">
          <button onClick={onSkip} className="text-[12px] cursor-pointer bg-transparent border-none" style={{ color: c.gr }}>
            {isLast ? '' : 'Passer le tour'}
          </button>
          <div className="flex items-center gap-1.5">
            {ONBOARD_STEPS.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all" style={{ background: i === step ? c.or : i < step ? c.ok : c.gc }} />
            ))}
          </div>
          <button onClick={onNext}
            className="px-3 md:px-5 py-2.5 rounded-xl font-semibold text-[13px] text-white cursor-pointer border-none transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${c.or}, ${c.og})`, boxShadow: '0 4px 16px rgba(200,149,46,0.3)' }}>
            {isLast ? '🚀 Commencer' : 'Suivant →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function JabrApp({ author, onSwitchAuthor, userId, onSignOut }: { author?: Author; onSwitchAuthor?: () => void; userId?: string | null; onSignOut?: () => void } = {}) {
  const [page, setPage] = useState('dashboard');
  const [project, setProject] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { projects: allProjects, loading, persisted, addProject, updateProject, deleteProject } = useProjects(userId);
  
  // Filter projects by author if one is selected
  const projects = useMemo(() => {
    if (!author) return allProjects;
    return allProjects.filter(p => 
      p.author === author.displayName || 
      p.author.includes(author.lastName) ||
      p.illustrator === author.displayName
    );
  }, [allProjects, author]);
  const distChecks = useDistributionChecks();
  const calStore = useCalendarResults();
  const [search, setSearch] = useState('');
  const [filterGenre, setFilterGenre] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCollection, setFilterCollection] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'title' | 'pages' | 'score' | 'editions'>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [onboardStep, setOnboardStep] = useState<number | null>(() => {
    try { return localStorage.getItem('jabr-onboarded') === 'true' ? null : 0; } catch { return 0; }
  });
  const finishOnboard = useCallback(() => {
    setOnboardStep(null);
    try { localStorage.setItem('jabr-onboarded', 'true'); } catch {}
  }, []);

  // Keyboard shortcuts
  const [showShortcuts, setShowShortcuts] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      // Ctrl/Cmd combos
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); }
        else if (e.key === 'n') { e.preventDefault(); setModalOpen(true); }
        else if (e.key === '/') { e.preventDefault(); setShowShortcuts(s => !s); }
        else if (e.key === 'b') { e.preventDefault(); setSidebarOpen(s => !s); }
        return;
      }

      // Alt + number: navigate to module
      if (e.altKey) {
        const navMap: Record<string, string> = {
          '1': 'dashboard', '2': 'projets', '3': 'manuscrits', '4': 'analyse',
          '5': 'distribution', '6': 'analytics', '7': 'isbn', '8': 'presse',
          '9': 'calendrier', '0': 'settings',
        };
        if (navMap[e.key]) { e.preventDefault(); navigate(navMap[e.key]); }
        return;
      }

      // Single key shortcuts (only when not in cmd palette)
      if (!cmdOpen) {
        if (e.key === '?') { e.preventDefault(); setShowShortcuts(s => !s); }
        if (e.key === 'Escape') {
          if (showShortcuts) setShowShortcuts(false);
          else if (project) { setProject(null); setPage('dashboard'); }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cmdOpen, project, showShortcuts]);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('jabr-dark') === 'true'; } catch { return false; }
  });
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem('jabr-lang') as Lang) || 'fr'; } catch { return 'fr'; }
  });
  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next: Lang = prev === 'fr' ? 'en' : 'fr';
      try { localStorage.setItem('jabr-lang', next); } catch {}
      return next;
    });
  }, []);

  // Update mutable theme reference before render
  c = dark ? darkColors : lightColors;

  const toggleDark = useCallback(() => {
    setDark(prev => {
      const next = !prev;
      try { localStorage.setItem('jabr-dark', String(next)); } catch {}
      return next;
    });
  }, []);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => { setIsOnline(true); setToast('Connexion rétablie — synchronisation…'); };
    const off = () => { setIsOnline(false); setToast('Mode hors-ligne — vos données sont en cache'); };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    // Listen for SW sync messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'SYNC_COMPLETE') setToast('Synchronisation terminée ✓');
      });
    }
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Push notifications on load
  useEffect(() => {
    try {
      if (localStorage.getItem('jabr-push') !== 'true') return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const corr = projects.reduce((s, p) => s + p.corrections.length, 0);
      const noAnalysis = projects.filter(p => !p.analysis).length;
      const drafts = projects.filter(p => p.status === 'draft').length;
      const alerts: string[] = [];
      if (corr > 0) alerts.push(`${corr} correction${corr > 1 ? 's' : ''} en attente`);
      if (noAnalysis > 0) alerts.push(`${noAnalysis} manuscrit${noAnalysis > 1 ? 's' : ''} non analysé${noAnalysis > 1 ? 's' : ''}`);
      if (drafts > 0) alerts.push(`${drafts} brouillon${drafts > 1 ? 's' : ''} à finaliser`);
      if (alerts.length > 0) {
        setTimeout(() => {
          new Notification('JABR — Rappels', { body: alerts.join(' · '), icon: '/icon-192.svg' });
        }, 3000);
      }
    } catch {}
  }, [projects.length]);

  const navigate = (id: string) => { setPage(id); setProject(null); };
  const openProject = (p: Project) => { setProject(p); setPage('detail'); };
  const handleAdd = (p: Project) => { addProject(p); showToast(`Projet créé : ${p.title}`); };
  const showToast = (msg: string) => setToast(msg);
  const handleUpdate = (updated: Project) => {
    const now = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    const old = projects.find(p => p.id === updated.id);
    const log: string[] = [];
    if (old) {
      if (old.status !== updated.status) log.push(`Statut → ${updated.status === 'published' ? 'Publié' : updated.status === 'in-progress' ? 'En cours' : 'Brouillon'}`);
      if (old.title !== updated.title) log.push(`Titre modifié → ${updated.title}`);
      if (old.editions.length !== updated.editions.length) log.push(`Éditions : ${old.editions.length} → ${updated.editions.length}`);
      if ((old.backCover || '') !== (updated.backCover || '')) log.push('4e de couverture mise à jour');
      if ((old.notes || '') !== (updated.notes || '')) log.push('Notes éditoriales modifiées');
      if (old.corrections.length !== updated.corrections.length) log.push(`Corrections : ${old.corrections.length} → ${updated.corrections.length}`);
      if (JSON.stringify(old.diag) !== JSON.stringify(updated.diag)) log.push('Diagnostic couverture mis à jour');
    }
    if (log.length === 0) log.push('Fiche modifiée');
    const changelog = [...(updated.changelog || []), ...log.map(action => ({ date: now, action }))];
    const withLog = { ...updated, changelog };
    updateProject(withLog);
    setProject(withLog);
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

  const notifCount = generateNotifs(projects).filter(n => n.type === 'error' || n.type === 'warning').length;

  const renderContent = () => {
    if (loading) return (
      <div className="page-enter">
        {/* Skeleton KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
        {/* Skeleton cards */}
        <div className="skeleton h-10 rounded-xl mb-3 w-48" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 mb-3 items-center">
            <div className="skeleton w-10 h-14 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 rounded w-3/4" />
              <div className="skeleton h-3 rounded w-1/2" />
            </div>
            <div className="skeleton w-20 h-6 rounded" />
          </div>
        ))}
      </div>
    );
    if (project) return <DetailView project={project} onBack={() => navigate('dashboard')} onUpdate={handleUpdate} onToast={showToast} onDelete={handleDelete} allProjects={projects} />;
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
      case 'projets': return <DashboardView onProject={openProject} onNew={() => setModalOpen(true)} projects={filtered} allProjects={projects} onNav={navigate} onUpdateProject={handleUpdate} />;
      case 'orchestration': return <OrchestrationView projects={projects} onProject={openProject} onNav={navigate} />;
      case 'couvertures': return <CouverturesView onProject={openProject} projects={filtered} />;
      case 'cover-studio': return <CoverStudioView projects={filtered} onToast={showToast} />;
      case 'isbn': return <ISBNView projects={filtered} onToast={showToast} />;
      case 'collections': return <CollectionsView onProject={openProject} projects={projects} />;
      case 'droits': return <DroitsView projects={projects} onToast={showToast} />;
      case 'benchmark': return <BenchmarkView projects={projects} />;
      case 'lecteurs': return <LecteursView projects={projects} onProject={openProject} onToast={showToast} />;
      case 'traductions': return <TraductionsView projects={projects} onToast={showToast} />;
      case 'multiauteurs': return <MultiAuteursView projects={projects} onProject={openProject} />;
      case 'editeur': return <MultiAuthorView projects={projects} onProject={openProject} />;
      case 'marketing': return <MarketingView projects={projects} onToast={showToast} author={author} />;
      case 'analytics': return <AnalyticsView projects={projects} />;
      case 'distribution': return <DistributionView projects={projects} onToast={showToast} distChecks={distChecks} />;
      case 'calibrage': return <CalibrageView projects={projects} />;
      case 'manuscrits': return <ManuscritsView projects={projects} onProject={openProject} onToast={showToast} />;
      case 'analyse': return <AnalyseView projects={projects} onProject={openProject} onToast={showToast} />;
      case 'audiobooks': return <AudiobooksView projects={projects} onToast={showToast} />;
      case 'presse': return <PresseView projects={projects} onProject={openProject} onToast={showToast} />;
      case 'calendrier': return <CalendrierView projects={projects} onToast={showToast} calStore={calStore} />;
      case 'settings': return <SettingsView onToast={showToast} dark={dark} toggleDark={toggleDark} onImport={(imported) => imported.forEach(p => addProject(p))} lang={lang} toggleLang={toggleLang} onRestartTour={() => { setOnboardStep(0); try { localStorage.removeItem('jabr-onboarded'); } catch {} }} onSignOut={onSignOut} />;
      default: return <DashboardView onProject={openProject} onNew={() => setModalOpen(true)} projects={filtered} allProjects={projects} onNav={navigate} onUpdateProject={handleUpdate} />;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ overflow: 'hidden', maxWidth: '100vw', fontFamily: "'Inter', sans-serif", background: c.bc }}>
      <Sidebar active={project ? 'projets' : page} onNav={navigate} projects={projects} persisted={persisted} open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} lang={lang} onToggleLang={toggleLang} author={author} onSwitchAuthor={onSwitchAuthor} />
      <div className="flex-1 flex flex-col" style={{ minWidth: 0, overflow: 'hidden' }}>
        {/* TOP BAR */}
        <div className="flex gap-2 items-center py-2 bg-white" style={{ padding: '8px 12px', borderBottom: `1px solid ${c.gc}`, maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
          {/* Hamburger for mobile */}
          <button className="md:hidden shrink-0 cursor-pointer bg-transparent border-none p-1" style={{ color: c.mv }} onClick={() => setSidebarOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg flex-1 min-w-0" style={{ background: c.ft }}>
            <span style={{ color: c.gr }}>{icons.search}</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un titre, un genre, un auteur…"
              className="bg-transparent outline-none text-sm flex-1" style={{ color: c.nr }} />
            {(search || hasFilters) && <button onClick={clearFilters} className="cursor-pointer bg-transparent border-none" style={{ color: c.gr }}>{icons.close}</button>}
            <button onClick={() => setCmdOpen(true)} className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer bg-transparent"
              style={{ border: `1px solid ${c.gc}`, color: c.gr, fontSize: 10, fontWeight: 600 }}>
              ⌘K
            </button>
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
        <div className="flex-1 overflow-y-auto" style={{ overflowX: 'hidden' }} onClick={() => notifOpen && setNotifOpen(false)}>
          <div style={{ padding: 16, maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
            <div key={project ? `p-${project.id}` : page} className="max-w-full overflow-hidden" style={{ animation: 'pageIn 0.3s ease-out' }}>{renderContent()}</div>
          </div>
        </div>
      </div>
      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[180] py-2 text-center text-[11px] font-semibold text-white"
          style={{ background: 'linear-gradient(90deg, #E07A2F, #D94452)', animation: 'fadeUp 0.3s ease-out' }}>
          📡 Mode hors-ligne — Vos données sont disponibles en cache local
        </div>
      )}
      {showShortcuts && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center" style={{ background: 'rgba(45,27,78,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowShortcuts(false)}>
          <div className="max-w-lg w-full mx-4 rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'scaleIn 0.2s ease-out' }}
            onClick={e => e.stopPropagation()}>
            <div className="px-3 md:px-6 py-4 flex justify-between items-center" style={{ borderBottom: `2px solid ${c.or}` }}>
              <h3 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: c.mv }}>⌨️ Raccourcis clavier</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-[18px] cursor-pointer bg-transparent border-none" style={{ color: c.gr }}>✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-2">
              {[
                ['Ctrl + K', 'Recherche globale'],
                ['Ctrl + N', 'Nouveau projet'],
                ['Ctrl + B', 'Toggle sidebar'],
                ['Ctrl + /', 'Raccourcis (cette fenêtre)'],
                ['?', 'Raccourcis (cette fenêtre)'],
                ['Esc', 'Fermer / Retour'],
                ['Alt + 1', 'Dashboard'],
                ['Alt + 2', 'Projets'],
                ['Alt + 3', 'Manuscrits'],
                ['Alt + 4', 'Analyse IA'],
                ['Alt + 5', 'Distribution'],
                ['Alt + 6', 'Analytics'],
                ['Alt + 7', 'ISBN'],
                ['Alt + 8', 'Presse'],
                ['Alt + 9', 'Calendrier'],
                ['Alt + 0', 'Paramètres'],
              ].map(([key, label], i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-[12px]" style={{ color: c.vm }}>{label}</span>
                  <kbd className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: c.ft, color: c.mv, border: `1px solid ${c.gc}` }}>{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {onboardStep !== null && (
        <OnboardingOverlay step={onboardStep}
          onNext={() => { if (onboardStep >= ONBOARD_STEPS.length - 1) finishOnboard(); else setOnboardStep(onboardStep + 1); }}
          onSkip={finishOnboard} />
      )}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} projects={projects} onProject={openProject} onNav={navigate} />
    </div>
  );
}
