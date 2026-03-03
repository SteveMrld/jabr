// ═══════════════════════════════════════════════════
// JABR MediaPlan Engine v3.0
// Moteur intelligent de plan média éditorial
// Mode Budget | Mode Objectif | Comparaison A/B
// ═══════════════════════════════════════════════════

// ── Types ──

export type MediaChannel =
  | 'amazon_ads'
  | 'instagram'
  | 'tiktok'
  | 'google_ads'
  | 'newsletter'
  | 'linkedin'
  | 'podcasts'
  | 'presse'
  | 'blogueurs'
  | 'booktube'
  | 'salon';

export interface ChannelAllocation {
  channel: MediaChannel;
  label: string;
  icon: string;
  budget: number;           // €
  percentage: number;       // 0-100
  estimatedReach: number;   // personnes touchées
  estimatedClicks: number;
  estimatedConversions: number; // ventes estimées
  cpc: number;              // coût par clic
  conversionRate: number;   // %
  roi: number;              // retour sur investissement estimé
  priority: 'critical' | 'high' | 'medium' | 'low';
  timing: string;           // quand lancer
  description: string;
  tactics: string[];        // actions concrètes
}

export interface MediaPhase {
  name: string;
  timing: string;
  budget: number;
  channels: MediaChannel[];
  actions: string[];
}

export interface MediaPlan {
  id: string;
  label: string;
  mode: 'budget' | 'objective';
  inputBudget?: number;
  inputObjective?: number;
  totalBudget: number;
  totalEstimatedSales: number;
  costPerSale: number;
  channels: ChannelAllocation[];
  phases: MediaPhase[];
  kpis: {
    reach: number;
    clicks: number;
    conversions: number;
    roi: number;
    costPerAcquisition: number;
  };
  recommendations: string[];
  warnings: string[];
}

export interface MediaPlanInput {
  genre: string;
  title: string;
  pages: number;
  price: number;           // prix de vente TTC
  author: string;
  hasNewsletter: boolean;
  newsletterSize: number;
  hasExistingAudience: boolean;
  audienceSize: number;     // followers total
  isFirstBook: boolean;
  publicationDate?: string;
}

// ── Genre-specific conversion data ──

interface GenreProfile {
  avgCPC: Record<MediaChannel, number>;
  conversionRates: Record<MediaChannel, number>;
  reachMultipliers: Record<MediaChannel, number>;
  bestChannels: MediaChannel[];
  budgetSplit: Record<MediaChannel, number>; // % allocation idéale
  avgPricePoint: number;
  seasonality: { peak: number[]; low: number[] }; // mois
  avgROAS: number; // return on ad spend
}

const GENRE_PROFILES: Record<string, GenreProfile> = {
  'Jeunesse': {
    avgCPC: { amazon_ads: 0.22, instagram: 0.35, tiktok: 0.18, google_ads: 0.45, newsletter: 0.05, linkedin: 0.80, podcasts: 0.60, presse: 0.40, blogueurs: 0.25, booktube: 0.20, salon: 0.30 },
    conversionRates: { amazon_ads: 4.2, instagram: 2.8, tiktok: 3.5, google_ads: 3.0, newsletter: 8.5, linkedin: 0.5, podcasts: 1.2, presse: 0.8, blogueurs: 3.8, booktube: 2.5, salon: 6.0 },
    reachMultipliers: { amazon_ads: 1.0, instagram: 1.8, tiktok: 2.5, google_ads: 0.8, newsletter: 0.3, linkedin: 0.2, podcasts: 1.5, presse: 2.0, blogueurs: 1.2, booktube: 1.0, salon: 0.5 },
    bestChannels: ['amazon_ads', 'instagram', 'tiktok', 'blogueurs', 'salon'],
    budgetSplit: { amazon_ads: 25, instagram: 22, tiktok: 18, google_ads: 5, newsletter: 5, linkedin: 0, podcasts: 5, presse: 5, blogueurs: 10, booktube: 0, salon: 5 },
    avgPricePoint: 14.90,
    seasonality: { peak: [3, 4, 10, 11, 12], low: [6, 7, 8] },
    avgROAS: 3.2,
  },
  'Roman': {
    avgCPC: { amazon_ads: 0.30, instagram: 0.40, tiktok: 0.25, google_ads: 0.55, newsletter: 0.06, linkedin: 0.90, podcasts: 0.50, presse: 0.35, blogueurs: 0.20, booktube: 0.22, salon: 0.35 },
    conversionRates: { amazon_ads: 3.5, instagram: 2.0, tiktok: 2.8, google_ads: 2.5, newsletter: 7.0, linkedin: 0.3, podcasts: 1.8, presse: 1.2, blogueurs: 4.5, booktube: 3.0, salon: 5.0 },
    reachMultipliers: { amazon_ads: 1.0, instagram: 1.5, tiktok: 2.0, google_ads: 0.9, newsletter: 0.3, linkedin: 0.3, podcasts: 2.0, presse: 2.5, blogueurs: 1.5, booktube: 1.8, salon: 0.6 },
    bestChannels: ['amazon_ads', 'booktube', 'blogueurs', 'instagram', 'podcasts'],
    budgetSplit: { amazon_ads: 30, instagram: 15, tiktok: 10, google_ads: 8, newsletter: 5, linkedin: 2, podcasts: 10, presse: 7, blogueurs: 8, booktube: 3, salon: 2 },
    avgPricePoint: 19.90,
    seasonality: { peak: [1, 3, 9, 10], low: [7, 8] },
    avgROAS: 2.8,
  },
  'Fantasy': {
    avgCPC: { amazon_ads: 0.28, instagram: 0.32, tiktok: 0.20, google_ads: 0.50, newsletter: 0.05, linkedin: 1.00, podcasts: 0.55, presse: 0.45, blogueurs: 0.18, booktube: 0.15, salon: 0.25 },
    conversionRates: { amazon_ads: 4.0, instagram: 2.5, tiktok: 3.8, google_ads: 2.2, newsletter: 9.0, linkedin: 0.2, podcasts: 1.5, presse: 0.6, blogueurs: 5.0, booktube: 4.2, salon: 7.0 },
    reachMultipliers: { amazon_ads: 1.2, instagram: 1.6, tiktok: 3.0, google_ads: 0.7, newsletter: 0.3, linkedin: 0.1, podcasts: 1.2, presse: 1.0, blogueurs: 2.0, booktube: 2.5, salon: 0.8 },
    bestChannels: ['tiktok', 'amazon_ads', 'booktube', 'blogueurs', 'salon'],
    budgetSplit: { amazon_ads: 28, instagram: 12, tiktok: 20, google_ads: 5, newsletter: 5, linkedin: 0, podcasts: 5, presse: 3, blogueurs: 10, booktube: 7, salon: 5 },
    avgPricePoint: 22.90,
    seasonality: { peak: [3, 6, 10, 11, 12], low: [1, 2] },
    avgROAS: 3.5,
  },
  'Essai': {
    avgCPC: { amazon_ads: 0.35, instagram: 0.50, tiktok: 0.40, google_ads: 0.60, newsletter: 0.07, linkedin: 0.55, podcasts: 0.40, presse: 0.30, blogueurs: 0.30, booktube: 0.35, salon: 0.40 },
    conversionRates: { amazon_ads: 3.0, instagram: 1.5, tiktok: 1.2, google_ads: 3.5, newsletter: 6.5, linkedin: 2.0, podcasts: 2.5, presse: 2.0, blogueurs: 3.0, booktube: 1.5, salon: 4.0 },
    reachMultipliers: { amazon_ads: 0.8, instagram: 1.0, tiktok: 0.8, google_ads: 1.2, newsletter: 0.4, linkedin: 1.5, podcasts: 2.5, presse: 3.0, blogueurs: 0.8, booktube: 0.5, salon: 0.5 },
    bestChannels: ['linkedin', 'podcasts', 'presse', 'amazon_ads', 'google_ads'],
    budgetSplit: { amazon_ads: 22, instagram: 8, tiktok: 5, google_ads: 12, newsletter: 6, linkedin: 12, podcasts: 12, presse: 12, blogueurs: 5, booktube: 2, salon: 4 },
    avgPricePoint: 21.90,
    seasonality: { peak: [1, 3, 9, 10], low: [7, 8] },
    avgROAS: 2.2,
  },
  'BD': {
    avgCPC: { amazon_ads: 0.25, instagram: 0.28, tiktok: 0.15, google_ads: 0.45, newsletter: 0.05, linkedin: 0.90, podcasts: 0.50, presse: 0.35, blogueurs: 0.15, booktube: 0.18, salon: 0.20 },
    conversionRates: { amazon_ads: 3.8, instagram: 3.5, tiktok: 4.0, google_ads: 2.0, newsletter: 7.5, linkedin: 0.3, podcasts: 1.0, presse: 1.5, blogueurs: 5.5, booktube: 3.5, salon: 8.0 },
    reachMultipliers: { amazon_ads: 1.0, instagram: 2.5, tiktok: 3.5, google_ads: 0.6, newsletter: 0.3, linkedin: 0.1, podcasts: 1.0, presse: 1.5, blogueurs: 2.0, booktube: 1.5, salon: 1.0 },
    bestChannels: ['instagram', 'tiktok', 'salon', 'blogueurs', 'amazon_ads'],
    budgetSplit: { amazon_ads: 20, instagram: 25, tiktok: 18, google_ads: 3, newsletter: 4, linkedin: 0, podcasts: 3, presse: 5, blogueurs: 12, booktube: 3, salon: 7 },
    avgPricePoint: 16.90,
    seasonality: { peak: [1, 3, 6, 10, 11, 12], low: [] },
    avgROAS: 3.0,
  },
};

// Fallback for unknown genres
const DEFAULT_PROFILE: GenreProfile = GENRE_PROFILES['Roman'];

const CHANNEL_LABELS: Record<MediaChannel, { label: string; icon: string }> = {
  amazon_ads: { label: 'Amazon Ads', icon: '🛒' },
  instagram: { label: 'Instagram / Facebook', icon: '📸' },
  tiktok: { label: 'TikTok BookTok', icon: '🎵' },
  google_ads: { label: 'Google Ads', icon: '🔍' },
  newsletter: { label: 'Newsletter', icon: '📧' },
  linkedin: { label: 'LinkedIn', icon: '💼' },
  podcasts: { label: 'Podcasts littéraires', icon: '🎙️' },
  presse: { label: 'Presse en ligne', icon: '📰' },
  blogueurs: { label: 'Blogueurs / SP', icon: '✍️' },
  booktube: { label: 'BookTube / BookTok', icon: '📹' },
  salon: { label: 'Salons & événements', icon: '🎪' },
};

// ═══════════════════════════════════
// CORE ENGINE
// ═══════════════════════════════════

function getProfile(genre: string): GenreProfile {
  // Try exact match first, then partial match
  if (GENRE_PROFILES[genre]) return GENRE_PROFILES[genre];
  const key = Object.keys(GENRE_PROFILES).find(k =>
    genre.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(genre.toLowerCase())
  );
  return key ? GENRE_PROFILES[key] : DEFAULT_PROFILE;
}

function computeChannelAllocation(
  channel: MediaChannel,
  budget: number,
  profile: GenreProfile,
  input: MediaPlanInput,
): ChannelAllocation {
  const cpc = profile.avgCPC[channel];
  const convRate = profile.conversionRates[channel] / 100;
  const reachMult = profile.reachMultipliers[channel];

  // Adjust for newsletter size
  let adjustedConvRate = convRate;
  if (channel === 'newsletter' && input.hasNewsletter) {
    adjustedConvRate = convRate * (1 + Math.min(input.newsletterSize / 20000, 1.5));
  }
  // Adjust for existing audience
  if (['instagram', 'tiktok', 'linkedin'].includes(channel) && input.hasExistingAudience) {
    adjustedConvRate = convRate * (1 + Math.min(input.audienceSize / 50000, 1.2));
  }
  // First book penalty
  if (input.isFirstBook) {
    adjustedConvRate *= 0.7;
  }

  const clicks = budget > 0 ? Math.round(budget / cpc) : 0;
  const conversions = Math.round(clicks * adjustedConvRate);
  const reach = Math.round(clicks * reachMult * 12); // rough reach multiplier
  const roi = budget > 0 ? ((conversions * input.price) - budget) / budget : 0;

  const isBest = profile.bestChannels.includes(channel);
  const priority: ChannelAllocation['priority'] =
    isBest && budget > 100 ? 'critical' :
    isBest ? 'high' :
    budget > 50 ? 'medium' : 'low';

  const { label, icon } = CHANNEL_LABELS[channel];

  // Generate tactics
  const tactics = generateTactics(channel, input);

  // Timing
  const timing = generateTiming(channel, input);

  return {
    channel, label, icon, budget,
    percentage: 0, // will be computed after
    estimatedReach: reach,
    estimatedClicks: clicks,
    estimatedConversions: conversions,
    cpc, conversionRate: adjustedConvRate * 100,
    roi: Math.round(roi * 100) / 100,
    priority, timing,
    description: getChannelDescription(channel, input.genre),
    tactics,
  };
}

function generateTactics(channel: MediaChannel, input: MediaPlanInput): string[] {
  const genre = input.genre.toLowerCase();
  const tactics: Record<MediaChannel, string[]> = {
    amazon_ads: [
      `Sponsored Products : ciblage "${input.title}" + mots-clés genre`,
      `Enchères ${genre.includes('fantasy') ? '0,25-0,40€' : '0,30-0,55€'} CPC`,
      'Product Display pour retargeting visiteurs',
      `Mots-clés négatifs : ${genre.includes('jeunesse') ? 'coloriage, cahier vacances' : 'résumé, pdf gratuit'}`,
    ],
    instagram: [
      'Carrousel 5 slides : couverture → 3 extraits → CTA',
      'Reels 15-30s avec hook accrocheur',
      `Stories interactives : sondage, countdown J-${7}`,
      input.hasNewsletter ? `Lookalike audience depuis ${input.author}` : 'Ciblage par intérêts littéraires',
    ],
    tiktok: [
      `Hook BookTok : "Ce livre va changer votre vision de ${genre.includes('fantasy') ? 'la fantasy' : 'la littérature'}"`,
      'Format In-Feed natif 15-45s',
      'Spark Ads sur posts organiques performants',
      genre.includes('fantasy') || genre.includes('bd') ? 'Trend challenge #BookTok' : 'Format storytelling intimiste',
    ],
    google_ads: [
      `Mots-clés d'achat : "acheter livre ${input.genre.toLowerCase()}"`,
      'Ciblage France + Francophonie',
      'Extensions de prix et avis',
      'Remarketing Display sur sites littéraires',
    ],
    newsletter: [
      input.hasNewsletter ? `Séquence pré-lancement sur ${input.author} (${input.newsletterSize.toLocaleString()} abonnés)` : 'Campagne Brevo ciblée',
      'Email J-15 : teaser exclusif',
      'Email J-Day : lien achat + bonus lecteur',
      'Email J+7 : premières reviews + UGC',
    ],
    linkedin: [
      `Article : parcours d'écriture de "${input.title}"`,
      'Post thought leadership lié aux thèmes',
      `Boost organique : angle ${genre.includes('essai') ? 'expertise + data' : 'storytelling auteur'}`,
      'Engagement groupes littéraires professionnels',
    ],
    podcasts: [
      genre.includes('essai') ? 'Passages France Inter, RFI, podcasts spécialisés' : 'Podcasts littéraires indépendants',
      `Pitch : "${input.title}" — angle original pour interview`,
      'Envoi SP numérique aux producteurs podcast',
      'Audio extrait pour promotion croisée',
    ],
    presse: [
      'Encarts Livres Hebdo, ActuaLitté, Babelio',
      'Communiqué de presse ciblé journalistes',
      `Angle presse : ${genre.includes('essai') ? 'expertise et actualité' : 'découverte littéraire'}`,
      'Articles sponsorisés presse en ligne',
    ],
    blogueurs: [
      'SP numériques aux top blogueurs genre',
      `Chroniques partenaires ${genre.includes('fantasy') || genre.includes('bd') ? 'BookTok + BookTube' : 'blogs littéraires'}`,
      'Kit média complet : visuels + résumé + bio',
      'Relais chroniques sur réseaux sociaux',
    ],
    booktube: [
      'Envoi SP physique aux BookTubers',
      'Unboxing vidéo sponsorisé',
      `${genre.includes('fantasy') ? 'Review + théories fan' : 'Chronique approfondie'}`,
      'Playlist thématique collaborative',
    ],
    salon: [
      'Stand Jabrilia salon du livre',
      `Dédicaces + rencontres auteur "${input.author}"`,
      'Goodies + marque-pages exclusifs',
      'Vente directe avec réduction salon',
    ],
  };
  return tactics[channel] || [];
}

function generateTiming(channel: MediaChannel, input: MediaPlanInput): string {
  const timings: Record<MediaChannel, string> = {
    amazon_ads: 'J-7 → J+60 (activation progressive)',
    instagram: 'J-21 → J+30 (teasing → lancement → UGC)',
    tiktok: 'J-14 → J+21 (viral window)',
    google_ads: 'J-3 → J+45 (capture intent)',
    newsletter: 'J-15, J-Day, J+7, J+30',
    linkedin: 'J-21 → J+14 (thought leadership)',
    podcasts: 'J-30 → J+30 (long lead)',
    presse: 'J-45 → J-7 (presse = anticipation)',
    blogueurs: 'J-30 → J-7 (SP en amont)',
    booktube: 'J-14 → J+14 (aligné lancement)',
    salon: 'Dates salon spécifiques',
  };
  return timings[channel] || 'À planifier';
}

function getChannelDescription(channel: MediaChannel, genre: string): string {
  const g = genre.toLowerCase();
  const descs: Record<MediaChannel, string> = {
    amazon_ads: `Campagnes Sponsored Products ciblées ${genre}. Le canal à plus fort ROI direct pour les ventes livres.`,
    instagram: `Carrousels et Reels pour ${g.includes('jeunesse') ? 'toucher les parents et prescripteurs' : 'créer de l\'envie autour du livre'}.`,
    tiktok: `BookTok est le canal #1 de découverte livre ${g.includes('fantasy') || g.includes('bd') ? '— communauté très active sur ce genre' : '— fort potentiel viral'}.`,
    google_ads: `Capture d'intention : toucher les gens qui cherchent activement à acheter un livre ${genre}.`,
    newsletter: `Canal le plus rentable : toucher une audience qualifiée qui a déjà exprimé son intérêt.`,
    linkedin: `${g.includes('essai') ? 'Canal stratégique pour les essais — audience professionnelle qualifiée' : 'Angle thought leadership pour visibilité auteur'}.`,
    podcasts: `Interviews et chroniques audio — forte crédibilité et engagement long ${g.includes('essai') ? '(essentiel pour les essais)' : ''}.`,
    presse: `Couverture presse traditionnelle — crédibilité et visibilité large auprès des prescripteurs.`,
    blogueurs: `Chroniques authentiques par des passionnés — fort taux de conversion via la recommandation.`,
    booktube: `Vidéos longues de recommandation — communauté engagée de lecteurs ${g.includes('fantasy') ? 'fantasy' : ''}.`,
    salon: `Rencontre directe avec les lecteurs — conversion immédiate et fidélisation.`,
  };
  return descs[channel] || '';
}

// ═══════════════════════════════════
// PLAN GENERATORS
// ═══════════════════════════════════

/**
 * Mode BUDGET : "J'ai X€, optimise ma répartition"
 */
export function generateBudgetPlan(budget: number, input: MediaPlanInput): MediaPlan {
  const profile = getProfile(input.genre);

  // Compute allocations based on genre profile
  const ALL_CHANNELS: MediaChannel[] = [
    'amazon_ads', 'instagram', 'tiktok', 'google_ads', 'newsletter',
    'linkedin', 'podcasts', 'presse', 'blogueurs', 'booktube', 'salon',
  ];

  // Filter out channels with 0% allocation
  const activeChannels = ALL_CHANNELS.filter(ch => profile.budgetSplit[ch] > 0);

  // Compute budget per channel
  const channels = activeChannels.map(ch => {
    const pct = profile.budgetSplit[ch];
    const channelBudget = Math.round(budget * pct / 100);
    return computeChannelAllocation(ch, channelBudget, profile, input);
  });

  // Compute percentages
  const totalAllocated = channels.reduce((s, ch) => s + ch.budget, 0);
  channels.forEach(ch => {
    ch.percentage = totalAllocated > 0 ? Math.round((ch.budget / totalAllocated) * 100) : 0;
  });

  // Sort by priority then budget
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  channels.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || b.budget - a.budget);

  const kpis = {
    reach: channels.reduce((s, ch) => s + ch.estimatedReach, 0),
    clicks: channels.reduce((s, ch) => s + ch.estimatedClicks, 0),
    conversions: channels.reduce((s, ch) => s + ch.estimatedConversions, 0),
    roi: budget > 0 ? Math.round(((channels.reduce((s, ch) => s + ch.estimatedConversions, 0) * input.price) - budget) / budget * 100) / 100 : 0,
    costPerAcquisition: 0,
  };
  kpis.costPerAcquisition = kpis.conversions > 0 ? Math.round(budget / kpis.conversions * 100) / 100 : 0;

  // Phases
  const phases = generatePhases(budget, activeChannels, input);

  // Recommendations
  const recommendations = generateRecommendations(channels, kpis, input, budget);
  const warnings = generateWarnings(channels, kpis, input, budget);

  return {
    id: `budget-${budget}-${Date.now()}`,
    label: `Plan ${budget.toLocaleString()}€`,
    mode: 'budget',
    inputBudget: budget,
    totalBudget: totalAllocated,
    totalEstimatedSales: kpis.conversions,
    costPerSale: kpis.costPerAcquisition,
    channels, phases, kpis,
    recommendations, warnings,
  };
}

/**
 * Mode OBJECTIF : "Je veux vendre X exemplaires, dis-moi combien dépenser"
 */
export function generateObjectivePlan(targetSales: number, input: MediaPlanInput): MediaPlan {
  const profile = getProfile(input.genre);

  // Reverse-engineer budget from target sales
  // Use weighted average conversion rate across best channels
  const bestChannels = profile.bestChannels.slice(0, 5);
  const avgConvRate = bestChannels.reduce((s, ch) => s + profile.conversionRates[ch], 0) / bestChannels.length / 100;
  const avgCPC = bestChannels.reduce((s, ch) => s + profile.avgCPC[ch], 0) / bestChannels.length;

  // Clicks needed = targetSales / avgConvRate
  const clicksNeeded = Math.ceil(targetSales / avgConvRate);
  const estimatedBudget = Math.ceil(clicksNeeded * avgCPC);

  // Add 15% buffer for inefficiency
  const budgetWithBuffer = Math.ceil(estimatedBudget * 1.15);

  // Now generate like budget mode but flag it as objective
  const plan = generateBudgetPlan(budgetWithBuffer, input);
  plan.id = `objective-${targetSales}-${Date.now()}`;
  plan.label = `Plan ${targetSales} ventes`;
  plan.mode = 'objective';
  plan.inputObjective = targetSales;

  // Add objective-specific recommendations
  plan.recommendations.unshift(
    `Pour atteindre ${targetSales} ventes, budget recommandé : ${budgetWithBuffer.toLocaleString()}€ (incluant 15% de marge).`
  );

  if (targetSales > 500 && !input.hasNewsletter) {
    plan.recommendations.push('Avec une newsletter active, vous pourriez réduire ce budget de 20-30%.');
  }

  return plan;
}

/**
 * Comparaison A/B entre deux plans
 */
export function compareAB(planA: MediaPlan, planB: MediaPlan): {
  winner: 'A' | 'B' | 'tie';
  comparison: {
    metric: string;
    valueA: string;
    valueB: string;
    winner: 'A' | 'B' | 'tie';
    insight: string;
  }[];
  summary: string;
} {
  const metrics = [
    {
      metric: 'Budget total',
      valueA: `${planA.totalBudget.toLocaleString()}€`,
      valueB: `${planB.totalBudget.toLocaleString()}€`,
      winner: planA.totalBudget < planB.totalBudget ? 'A' as const : planA.totalBudget > planB.totalBudget ? 'B' as const : 'tie' as const,
      scoreA: planA.totalBudget < planB.totalBudget ? 1 : 0,
      insight: `Différence de ${Math.abs(planA.totalBudget - planB.totalBudget).toLocaleString()}€`,
    },
    {
      metric: 'Ventes estimées',
      valueA: planA.totalEstimatedSales.toLocaleString(),
      valueB: planB.totalEstimatedSales.toLocaleString(),
      winner: planA.totalEstimatedSales > planB.totalEstimatedSales ? 'A' as const : planA.totalEstimatedSales < planB.totalEstimatedSales ? 'B' as const : 'tie' as const,
      scoreA: planA.totalEstimatedSales > planB.totalEstimatedSales ? 1 : 0,
      insight: `${Math.abs(planA.totalEstimatedSales - planB.totalEstimatedSales)} ventes d'écart`,
    },
    {
      metric: 'Coût par vente',
      valueA: `${planA.costPerSale.toFixed(2)}€`,
      valueB: `${planB.costPerSale.toFixed(2)}€`,
      winner: planA.costPerSale < planB.costPerSale ? 'A' as const : planA.costPerSale > planB.costPerSale ? 'B' as const : 'tie' as const,
      scoreA: planA.costPerSale < planB.costPerSale ? 1 : 0,
      insight: `${planA.costPerSale < planB.costPerSale ? 'Plan A' : 'Plan B'} plus efficient`,
    },
    {
      metric: 'ROI estimé',
      valueA: `×${planA.kpis.roi.toFixed(1)}`,
      valueB: `×${planB.kpis.roi.toFixed(1)}`,
      winner: planA.kpis.roi > planB.kpis.roi ? 'A' as const : planA.kpis.roi < planB.kpis.roi ? 'B' as const : 'tie' as const,
      scoreA: planA.kpis.roi > planB.kpis.roi ? 1 : 0,
      insight: `Meilleur retour sur investissement`,
    },
    {
      metric: 'Reach estimé',
      valueA: planA.kpis.reach.toLocaleString(),
      valueB: planB.kpis.reach.toLocaleString(),
      winner: planA.kpis.reach > planB.kpis.reach ? 'A' as const : planA.kpis.reach < planB.kpis.reach ? 'B' as const : 'tie' as const,
      scoreA: planA.kpis.reach > planB.kpis.reach ? 1 : 0,
      insight: `Audience potentielle touchée`,
    },
    {
      metric: 'Canaux actifs',
      valueA: `${planA.channels.length}`,
      valueB: `${planB.channels.length}`,
      winner: planA.channels.length > planB.channels.length ? 'A' as const : planA.channels.length < planB.channels.length ? 'B' as const : 'tie' as const,
      scoreA: planA.channels.length > planB.channels.length ? 1 : 0,
      insight: `Diversification des canaux`,
    },
  ];

  const scoreA = metrics.filter(m => m.winner === 'A').length;
  const scoreB = metrics.filter(m => m.winner === 'B').length;
  const winner = scoreA > scoreB ? 'A' as const : scoreB > scoreA ? 'B' as const : 'tie' as const;

  const summary = winner === 'tie'
    ? 'Les deux plans sont globalement équivalents. Le choix dépend de votre priorité : volume de ventes ou efficacité budgétaire.'
    : `Le Plan ${winner} l'emporte sur ${winner === 'A' ? scoreA : scoreB}/6 métriques. ${
      winner === 'A'
        ? planA.mode === 'budget' ? 'Meilleur rapport coût/efficacité.' : 'Atteint l\'objectif de ventes plus efficacement.'
        : planB.mode === 'budget' ? 'Meilleur rapport coût/efficacité.' : 'Atteint l\'objectif de ventes plus efficacement.'
    }`;

  return {
    winner,
    comparison: metrics.map(({ scoreA: _, ...rest }) => rest),
    summary,
  };
}

// ── Helpers ──

function generatePhases(budget: number, channels: MediaChannel[], input: MediaPlanInput): MediaPhase[] {
  return [
    {
      name: 'Teasing',
      timing: 'J-30 → J-15',
      budget: Math.round(budget * 0.10),
      channels: channels.filter(c => ['instagram', 'newsletter', 'linkedin', 'presse'].includes(c)),
      actions: [
        'Reveal couverture sur réseaux sociaux',
        'Countdown stories Instagram',
        'Envoi SP aux blogueurs',
        'Pitch presse et podcasts',
      ],
    },
    {
      name: 'Pré-lancement',
      timing: 'J-15 → J-1',
      budget: Math.round(budget * 0.20),
      channels: channels.filter(c => ['amazon_ads', 'instagram', 'tiktok', 'newsletter', 'blogueurs'].includes(c)),
      actions: [
        'Activation pre-order Amazon',
        'Teasers vidéo TikTok/Reels',
        'Email pré-lancement newsletter',
        'Premières chroniques blogueurs',
      ],
    },
    {
      name: 'Lancement',
      timing: 'J-Day → J+7',
      budget: Math.round(budget * 0.35),
      channels: channels,
      actions: [
        'Tous canaux activés simultanément',
        'Live Instagram / événement lancement',
        'Boost TikTok et Instagram max',
        'Amazon Ads : enchères agressives',
      ],
    },
    {
      name: 'Amplification',
      timing: 'J+7 → J+30',
      budget: Math.round(budget * 0.25),
      channels: channels.filter(c => ['amazon_ads', 'tiktok', 'instagram', 'google_ads', 'booktube'].includes(c)),
      actions: [
        'Retargeting ads sur visiteurs',
        'UGC lecteurs republié',
        'Premières reviews Amazon poussées',
        'Podcasts et interviews en replay',
      ],
    },
    {
      name: 'Long tail',
      timing: 'J+30 → J+90',
      budget: Math.round(budget * 0.10),
      channels: channels.filter(c => ['amazon_ads', 'google_ads', 'newsletter'].includes(c)),
      actions: [
        'SEO Amazon (mots-clés optimisés)',
        'Contenu evergreen blog/LinkedIn',
        'Campagnes Google Ads basse enchère',
        'Newsletter de rappel et cross-sell',
      ],
    },
  ];
}

function generateRecommendations(channels: ChannelAllocation[], kpis: MediaPlan['kpis'], input: MediaPlanInput, budget: number): string[] {
  const recs: string[] = [];

  // Best channel
  const bestChannel = [...channels].sort((a, b) => b.roi - a.roi)[0];
  if (bestChannel) {
    recs.push(`Canal à privilégier : ${bestChannel.label} (ROI estimé ×${bestChannel.roi.toFixed(1)}, ${bestChannel.estimatedConversions} ventes).`);
  }

  // Newsletter boost
  if (input.hasNewsletter && input.newsletterSize > 5000) {
    recs.push(`Votre newsletter (${input.newsletterSize.toLocaleString()} abonnés) est votre arme secrète — conversion 3× supérieure aux ads.`);
  } else if (!input.hasNewsletter) {
    recs.push('Créer une newsletter pourrait réduire votre budget média de 25% tout en augmentant les ventes.');
  }

  // Budget efficiency
  if (kpis.costPerAcquisition > input.price * 0.6) {
    recs.push(`Attention : coût par vente (${kpis.costPerAcquisition.toFixed(2)}€) élevé vs prix (${input.price}€). Concentrez sur les 3 meilleurs canaux.`);
  }

  // Seasonality
  const now = new Date();
  const month = now.getMonth() + 1;
  const profile = getProfile(input.genre);
  if (profile.seasonality.peak.includes(month)) {
    recs.push(`Bon timing ! ${getMonthName(month)} est une période forte pour le ${input.genre.toLowerCase()}.`);
  } else if (profile.seasonality.low.includes(month)) {
    recs.push(`${getMonthName(month)} est une période creuse pour le ${input.genre.toLowerCase()}. Envisagez de décaler le lancement.`);
  }

  return recs;
}

function generateWarnings(channels: ChannelAllocation[], kpis: MediaPlan['kpis'], input: MediaPlanInput, budget: number): string[] {
  const warns: string[] = [];

  if (budget < 500) {
    warns.push('Budget inférieur à 500€ : concentrez sur 2-3 canaux max pour un impact réel.');
  }

  if (kpis.roi < 0.5) {
    warns.push('ROI estimé faible. Réduisez les canaux à faible conversion et concentrez le budget.');
  }

  const zeroBudget = channels.filter(ch => ch.budget < 10);
  if (zeroBudget.length > 3) {
    warns.push(`${zeroBudget.length} canaux sous-financés (<10€). Mieux vaut supprimer que saupoudrer.`);
  }

  if (input.isFirstBook && budget > 3000) {
    warns.push('Premier livre avec un gros budget : testez d\'abord avec 1 000-1 500€, puis réinvestissez selon les résultats.');
  }

  return warns;
}

function getMonthName(month: number): string {
  return ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][month] || '';
}
