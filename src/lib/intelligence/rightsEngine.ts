// ═══════════════════════════════════════════════════════════════════
// JABR — Rights & Adaptation Engine
// Territory matrix, adaptation scoring (film/series/animation/audio),
// hooks identification, one-pager export
// ═══════════════════════════════════════════════════════════════════

import { type EditorialReport } from './editorialEngine';

// ═══════════════════════════════════
// TYPES
// ═══════════════════════════════════

export interface Territory {
  zone: string;
  code: string;
  language: string;
  available: boolean;
  status: 'available' | 'sold' | 'negotiation' | 'reserved';
  buyer?: string;
  note?: string;
}

export interface AdaptationScore {
  type: 'film' | 'series' | 'animation' | 'audio' | 'theatre' | 'videogame';
  label: string;
  icon: string;
  score: number; // 0-100
  hooks: string[];
  notes: string;
}

export interface RightsAnalysis {
  title: string;
  author: string;
  territories: Territory[];
  adaptations: AdaptationScore[];
  globalAdaptationScore: number;
  topHooks: string[];
  onePagerText: string;
  analysisDate: string;
}

// ═══════════════════════════════════
// TERRITORIES
// ═══════════════════════════════════

export const DEFAULT_TERRITORIES: Territory[] = [
  { zone: 'France', code: 'FR', language: 'Français', available: false, status: 'reserved', note: 'Jabrilia Éditions' },
  { zone: 'Belgique/Suisse/Luxembourg', code: 'BEFR', language: 'Français', available: false, status: 'reserved', note: 'Inclus droits francophones' },
  { zone: 'Canada francophone', code: 'CAFR', language: 'Français', available: true, status: 'available' },
  { zone: 'Afrique francophone', code: 'AFFR', language: 'Français', available: true, status: 'available' },
  { zone: 'États-Unis / UK', code: 'EN', language: 'Anglais', available: true, status: 'available' },
  { zone: 'Allemagne / Autriche', code: 'DE', language: 'Allemand', available: true, status: 'available' },
  { zone: 'Espagne / Am. Latine', code: 'ES', language: 'Espagnol', available: true, status: 'available' },
  { zone: 'Italie', code: 'IT', language: 'Italien', available: true, status: 'available' },
  { zone: 'Portugal / Brésil', code: 'PT', language: 'Portugais', available: true, status: 'available' },
  { zone: 'Pays-Bas', code: 'NL', language: 'Néerlandais', available: true, status: 'available' },
  { zone: 'Pologne', code: 'PL', language: 'Polonais', available: true, status: 'available' },
  { zone: 'Russie', code: 'RU', language: 'Russe', available: true, status: 'available' },
  { zone: 'Chine', code: 'CN', language: 'Mandarin', available: true, status: 'available' },
  { zone: 'Japon', code: 'JP', language: 'Japonais', available: true, status: 'available' },
  { zone: 'Corée', code: 'KR', language: 'Coréen', available: true, status: 'available' },
  { zone: 'Turquie', code: 'TR', language: 'Turc', available: true, status: 'available' },
  { zone: 'Monde arabe', code: 'AR', language: 'Arabe', available: true, status: 'available' },
  { zone: 'Inde', code: 'IN', language: 'Hindi/Anglais', available: true, status: 'available' },
];

// ═══════════════════════════════════
// ADAPTATION SCORING
// ═══════════════════════════════════

export function analyzeRights(
  title: string, author: string, genre: string, pages: number,
  report?: EditorialReport
): RightsAnalysis {
  const themes = report?.themes || [];
  const strengths = report?.strengths || [];
  const hasDialogue = strengths.some(s => s.toLowerCase().includes('dialogue'));
  const hasWorldBuilding = themes.some(t => ['pouvoir', 'nature', 'guerre', 'voyage'].includes(t.toLowerCase()));
  const isVisual = genre === 'BD' || genre === 'Fantasy' || genre === 'Science-fiction' || genre === 'Thriller';
  const isLiterary = genre === 'Roman' || genre === 'Essai' || genre === 'Poésie';
  const isYA = genre === 'Jeunesse';

  // Film score
  const filmScore = Math.min(95, Math.max(15,
    (isVisual ? 65 : isLiterary ? 45 : 35)
    + (hasDialogue ? 10 : 0)
    + (pages >= 200 && pages <= 400 ? 8 : -5)
    + (themes.length >= 2 ? 5 : 0)
    + Math.round(Math.random() * 10 - 5)
  ));

  const filmHooks: string[] = [];
  if (isVisual) filmHooks.push('Univers visuellement riche');
  if (hasDialogue) filmHooks.push('Dialogues cinématographiques');
  if (hasWorldBuilding) filmHooks.push('World-building adaptable');
  if (themes.includes('Pouvoir')) filmHooks.push('Enjeux de pouvoir — tension dramatique');
  if (themes.includes('Amour')) filmHooks.push('Arc sentimental porteur');
  if (filmHooks.length === 0) filmHooks.push('Potentiel narratif à développer pour l\'écran');

  // Series score (higher for longer works, multi-POV, world-building)
  const seriesScore = Math.min(95, Math.max(10,
    (pages > 300 ? 60 : pages > 200 ? 45 : 30)
    + (hasWorldBuilding ? 15 : 0)
    + (genre === 'Fantasy' || genre === 'Thriller' ? 15 : 0)
    + (report?.comparables?.some(c => c.title.includes('Trône') || c.title.includes('Horde')) ? 10 : 0)
    + Math.round(Math.random() * 8 - 4)
  ));

  // Animation score
  const animationScore = Math.min(90, Math.max(10,
    (isYA ? 70 : genre === 'BD' ? 65 : genre === 'Fantasy' ? 55 : 25)
    + (themes.includes('Nature') ? 10 : 0)
    + (themes.includes('Famille') ? 10 : 0)
    + Math.round(Math.random() * 8 - 4)
  ));

  // Audio (podcast/audiobook dramatized)
  const audioScore = Math.min(90, Math.max(20,
    (hasDialogue ? 65 : 45)
    + (genre === 'Thriller' ? 15 : genre === 'Roman' ? 10 : 0)
    + (pages >= 150 ? 8 : -5)
    + Math.round(Math.random() * 8 - 4)
  ));

  // Theatre
  const theatreScore = Math.min(85, Math.max(10,
    (hasDialogue ? 55 : 25)
    + (genre === 'Roman' && pages < 300 ? 15 : 0)
    + (themes.includes('Famille') || themes.includes('Justice') ? 10 : 0)
    + Math.round(Math.random() * 10 - 5)
  ));

  // Video game
  const videogameScore = Math.min(85, Math.max(5,
    (genre === 'Fantasy' || genre === 'Science-fiction' ? 60 : 15)
    + (hasWorldBuilding ? 15 : 0)
    + (pages > 300 ? 5 : 0)
    + Math.round(Math.random() * 10 - 5)
  ));

  const adaptations: AdaptationScore[] = [
    { type: 'film', label: 'Film', icon: '🎬', score: filmScore, hooks: filmHooks, notes: filmScore > 60 ? 'Format long-métrage envisageable' : 'Adaptation nécessiterait un travail conséquent' },
    { type: 'series', label: 'Série TV', icon: '📺', score: seriesScore, hooks: seriesScore > 60 ? ['Arc narratif multi-épisodes', 'Personnages récurrents'] : ['Format à développer'], notes: seriesScore > 70 ? 'Fort potentiel sériel — 6 à 10 épisodes' : 'Potentiel limité en l\'état' },
    { type: 'animation', label: 'Animation', icon: '✨', score: animationScore, hooks: animationScore > 60 ? ['Univers visuel distinct', 'Public familial/YA'] : ['Niche animation'], notes: isYA ? 'Cible naturelle animation jeunesse' : 'Adaptation animation possible mais non évidente' },
    { type: 'audio', label: 'Audio dramatisé', icon: '🎧', score: audioScore, hooks: audioScore > 60 ? ['Narration immersive', 'Voix multiples possibles'] : ['Format audio standard'], notes: hasDialogue ? 'Excellent potentiel podcast/audio dramatisé' : 'Audiobook classique recommandé' },
    { type: 'theatre', label: 'Théâtre', icon: '🎭', score: theatreScore, hooks: theatreScore > 50 ? ['Dialogues adaptables', 'Huis clos possible'] : ['Adaptation théâtrale complexe'], notes: theatreScore > 60 ? 'Adaptation scénique envisageable' : 'Peu adapté au format théâtral' },
    { type: 'videogame', label: 'Jeu vidéo', icon: '🎮', score: videogameScore, hooks: videogameScore > 50 ? ['Univers explorable', 'Lore riche'] : ['Pas de potentiel jeu évident'], notes: genre === 'Fantasy' ? 'Univers propice au RPG/aventure' : 'Adaptation jeu peu pertinente' },
  ];

  const globalAdaptationScore = Math.round(adaptations.reduce((s, a) => s + a.score, 0) / adaptations.length);

  const topHooks = adaptations
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .flatMap(a => a.hooks.slice(0, 1).map(h => `${a.icon} ${h}`));

  // One-pager text
  const onePagerText = `RIGHTS & ADAPTATION — ONE-PAGER

"${title}" by ${author}
${genre} | ${pages} pages | French language
Publisher: Jabrilia Éditions

SYNOPSIS
${report?.pitch || `A ${genre.toLowerCase()} exploring ${themes.join(', ') || 'contemporary themes'}.`}

KEY SELLING POINTS
${(report?.strengths || ['Strong narrative voice', 'Universal themes']).map(s => `• ${s}`).join('\n')}

ADAPTATION POTENTIAL (${globalAdaptationScore}/100)
${adaptations.sort((a, b) => b.score - a.score).map(a => `${a.icon} ${a.label}: ${a.score}/100 — ${a.notes}`).join('\n')}

TOP HOOKS
${topHooks.map(h => `→ ${h}`).join('\n')}

COMPARABLE TITLES
${(report?.comparables || []).map(c => `• "${c.title}" (${c.author})`).join('\n') || '• Contemporary French fiction'}

RIGHTS AVAILABLE
World rights excluding French language (France, Belgium, Switzerland, Luxembourg)

CONTACT
Jabrilia Éditions — contact@jabrilia.com`;

  return {
    title, author,
    territories: DEFAULT_TERRITORIES.map(t => ({ ...t })),
    adaptations,
    globalAdaptationScore,
    topHooks,
    onePagerText,
    analysisDate: new Date().toISOString(),
  };
}
