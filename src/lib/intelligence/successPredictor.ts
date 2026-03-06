// ═══════════════════════════════════════════════════════════════════
// JABR — Book Success Predictor
// Multi-dimensional scoring with confidence and recommendations
// ═══════════════════════════════════════════════════════════════════

import { callClaude, parseJSONResponse, type AIProviderConfig } from './aiProvider';
import { type EditorialReport } from './editorialEngine';

// ═══════════════════════════════════
// TYPES
// ═══════════════════════════════════

export interface PredictionResult {
  globalScore: number; // 0-100
  confidence: number;  // 0-100
  verdict: string;     // "Publier", "Retravailler", "Passer", etc.
  verdictEmoji: string;

  // Breakdown (radar)
  dimensions: {
    qualiteNarrative: number;
    originalite: number;
    marketFit: number;
    potentielCommercial: number;
    potentielPresse: number;
    potentielAdaptation: number;
    adequationCatalogue: number;
  };

  // Recommendations
  recommendations: { priority: 'high' | 'medium' | 'low'; action: string; impact: string }[];

  // Reasons
  topReasons: string[];

  // Comparison
  percentile: number; // "mieux que X% des manuscrits analysés"

  analysisDate: string;
}

// ═══════════════════════════════════
// PREDICTOR (from Editorial Report)
// ═══════════════════════════════════

export function predictFromReport(report: EditorialReport, catalogueSize: number = 10): PredictionResult {
  const { qualityScore, originalityScore, marketFitScore } = report;

  // Compute dimensions
  const qualiteNarrative = qualityScore;
  const originalite = originalityScore;
  const marketFit = marketFitScore;
  const potentielCommercial = report.commercialPotential === 'very-high' ? 90 : report.commercialPotential === 'high' ? 75 : report.commercialPotential === 'medium' ? 55 : 30;
  const potentielPresse = report.pressPotential === 'high' ? 80 : report.pressPotential === 'medium' ? 55 : 30;
  const potentielAdaptation = report.adaptationPotential === 'high' ? 80 : report.adaptationPotential === 'medium' ? 55 : 30;
  const adequationCatalogue = Math.min(95, Math.round(
    (report.genre === 'Roman' || report.genre === 'Essai' ? 70 : 50) +
    (report.themes.length >= 3 ? 10 : 0) +
    (report.comparables.length >= 2 ? 10 : 0) +
    Math.round(Math.random() * 5)
  ));

  const dimensions = { qualiteNarrative, originalite, marketFit, potentielCommercial, potentielPresse, potentielAdaptation, adequationCatalogue };

  // Weighted global score
  const weights = { qualiteNarrative: 0.20, originalite: 0.15, marketFit: 0.20, potentielCommercial: 0.20, potentielPresse: 0.10, potentielAdaptation: 0.05, adequationCatalogue: 0.10 };
  const globalScore = Math.round(
    Object.entries(weights).reduce((sum, [key, weight]) => sum + (dimensions[key as keyof typeof dimensions] || 0) * weight, 0)
  );

  // Verdict
  let verdict: string;
  let verdictEmoji: string;
  if (globalScore >= 80) { verdict = 'Publier — Priorité haute'; verdictEmoji = '🚀'; }
  else if (globalScore >= 65) { verdict = 'Publier — Accompagnement éditorial'; verdictEmoji = '✅'; }
  else if (globalScore >= 50) { verdict = 'Retravailler — Potentiel à développer'; verdictEmoji = '🔧'; }
  else if (globalScore >= 35) { verdict = 'À reconsidérer — Faiblesses structurelles'; verdictEmoji = '⚠️'; }
  else { verdict = 'Passer — Ne correspond pas au catalogue'; verdictEmoji = '❌'; }

  // Recommendations
  const recommendations: PredictionResult['recommendations'] = [];
  if (qualiteNarrative < 60) recommendations.push({ priority: 'high', action: 'Travail éditorial approfondi sur la structure narrative', impact: 'Qualité +15-20 pts' });
  if (marketFit < 50) recommendations.push({ priority: 'high', action: 'Repositionner le titre — angle commercial à affiner', impact: 'Market fit +10-15 pts' });
  if (potentielPresse > 60 && potentielCommercial < 60) recommendations.push({ priority: 'medium', action: 'Stratégie presse first — titres prescripteurs', impact: 'Visibilité × 3' });
  if (originalite > 70) recommendations.push({ priority: 'medium', action: 'Mettre en avant l\'originalité dans le pitch', impact: 'Différenciation forte' });
  if (potentielAdaptation > 60) recommendations.push({ priority: 'low', action: 'Préparer un one-pager droits audiovisuels', impact: 'Revenus secondaires' });
  if (adequationCatalogue > 70) recommendations.push({ priority: 'medium', action: 'Cross-promotion avec les titres existants du catalogue', impact: 'Synergie catalogue' });
  if (recommendations.length === 0) recommendations.push({ priority: 'medium', action: 'Lancer la production — le titre est prêt', impact: 'Time-to-market' });

  // Top reasons
  const topReasons: string[] = [];
  const sortedDims = Object.entries(dimensions).sort(([, a], [, b]) => b - a);
  topReasons.push(`Point fort : ${dimLabel(sortedDims[0][0])} (${sortedDims[0][1]}/100)`);
  topReasons.push(`Point fort : ${dimLabel(sortedDims[1][0])} (${sortedDims[1][1]}/100)`);
  const weakest = sortedDims[sortedDims.length - 1];
  if (weakest[1] < 50) topReasons.push(`Point faible : ${dimLabel(weakest[0])} (${weakest[1]}/100)`);
  topReasons.push(`Confiance du modèle : ${report.confidence}%`);

  // Percentile (simulated from global score distribution)
  const percentile = Math.min(99, Math.max(5, Math.round(globalScore * 1.1 - 5)));

  return {
    globalScore,
    confidence: report.confidence,
    verdict,
    verdictEmoji,
    dimensions,
    recommendations,
    topReasons,
    percentile,
    analysisDate: new Date().toISOString(),
  };
}

function dimLabel(key: string): string {
  const labels: Record<string, string> = {
    qualiteNarrative: 'Qualité narrative',
    originalite: 'Originalité',
    marketFit: 'Market fit',
    potentielCommercial: 'Potentiel commercial',
    potentielPresse: 'Potentiel presse',
    potentielAdaptation: 'Potentiel adaptation',
    adequationCatalogue: 'Adéquation catalogue',
  };
  return labels[key] || key;
}

// ═══════════════════════════════════
// AI-POWERED PREDICTION
// ═══════════════════════════════════

export async function predictWithAI(
  title: string, author: string, genre: string, text: string, pages: number,
  config: AIProviderConfig
): Promise<{ prediction?: PredictionResult; error?: string }> {
  const excerpt = text.length > 6000 ? text.slice(0, 3000) + '\n[...]\n' + text.slice(-3000) : text;

  const prompt = `Tu es un expert en prédiction de succès éditorial. Analyse ce manuscrit et produis un scoring prédictif.

TITRE : ${title} | AUTEUR : ${author} | GENRE : ${genre} | PAGES : ${pages}
EXTRAIT :
---
${excerpt}
---

Réponds UNIQUEMENT en JSON strict :
{
  "globalScore": 68,
  "confidence": 72,
  "verdict": "Publier — Accompagnement éditorial",
  "verdictEmoji": "✅",
  "dimensions": {
    "qualiteNarrative": 70, "originalite": 65, "marketFit": 72,
    "potentielCommercial": 60, "potentielPresse": 55,
    "potentielAdaptation": 40, "adequationCatalogue": 75
  },
  "recommendations": [
    {"priority": "high", "action": "action concrète", "impact": "impact attendu"}
  ],
  "topReasons": ["raison 1", "raison 2", "raison 3"],
  "percentile": 68
}

Sois calibré : 50-60 = correct, 60-75 = bon, 75+ = très bon, 85+ = exceptionnel.`;

  const result = await callClaude(
    'Tu es un algorithme de scoring éditorial. Réponds UNIQUEMENT en JSON.',
    prompt, config
  );

  if (result.error) return { error: result.error };
  const prediction = parseJSONResponse<PredictionResult>(result.text || '');
  if (!prediction) return { error: 'Impossible de parser la prédiction' };
  prediction.analysisDate = new Date().toISOString();
  return { prediction };
}

// ═══════════════════════════════════
// DIMENSION LABELS & COLORS
// ═══════════════════════════════════

export const DIMENSION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  qualiteNarrative: { label: 'Qualité narrative', color: '#2D1B4E', icon: '✍️' },
  originalite: { label: 'Originalité', color: '#5B3E8A', icon: '💎' },
  marketFit: { label: 'Market fit', color: '#C8952E', icon: '📊' },
  potentielCommercial: { label: 'Potentiel commercial', color: '#E07A2F', icon: '🛒' },
  potentielPresse: { label: 'Potentiel presse', color: '#4A8FD4', icon: '📰' },
  potentielAdaptation: { label: 'Potentiel adaptation', color: '#D94452', icon: '🎬' },
  adequationCatalogue: { label: 'Adéquation catalogue', color: '#2EAE6D', icon: '📚' },
};
