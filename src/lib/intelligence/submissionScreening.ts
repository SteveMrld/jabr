// ═══════════════════════════════════════════════════════════════════
// JABR — Smart Submission Screening
// Intake, triage, scoring for incoming manuscripts
// ═══════════════════════════════════════════════════════════════════

import { callClaude, parseJSONResponse, type AIProviderConfig } from './aiProvider';

// ═══════════════════════════════════
// TYPES
// ═══════════════════════════════════

export type SubmissionStatus = 'inbox' | 'triaged' | 'shortlist' | 'reading' | 'rejected' | 'accepted';

export interface Submission {
  id: string;
  // Metadata
  title: string;
  author: string;
  authorEmail?: string;
  genre: string;
  pages: number;
  wordCount: number;
  receivedAt: string;
  // Triage
  status: SubmissionStatus;
  triageScore: number;    // 0-100
  summary?: string;
  detectedGenre?: string;
  detectedThemes?: string[];
  strengths?: string[];
  concerns?: string[];
  recommendation?: string;
  // Assignment
  assignedTo?: string;
  notes?: string;
  // Source text
  excerpt?: string;
}

// ═══════════════════════════════════
// TRIAGE SCORING (heuristic)
// ═══════════════════════════════════

export function triageSubmission(
  title: string, author: string, genre: string, text: string, wordCount: number
): Omit<Submission, 'id' | 'receivedAt' | 'status'> {
  const pages = Math.round(wordCount / 250);

  // Basic text analysis
  const avgSentenceLen = text.split(/[.!?]+/).filter(s => s.trim().length > 10).length > 0
    ? wordCount / text.split(/[.!?]+/).filter(s => s.trim().length > 10).length : 15;
  const hasDialogue = (text.match(/[«""—]/g) || []).length > 5;
  const paragraphCount = (text.match(/\n\n/g) || []).length;
  const hasStructure = paragraphCount > 5;
  const uniqueWords = new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 3)).size;
  const vocabularyRichness = wordCount > 0 ? uniqueWords / wordCount : 0;

  // Theme detection
  const lower = text.toLowerCase();
  const themes: string[] = [];
  const themeKeywords: Record<string, string[]> = {
    'Amour': ['amour', 'passion', 'coeur', 'désir', 'tendresse', 'embrasser'],
    'Famille': ['famille', 'mère', 'père', 'enfant', 'frère', 'soeur', 'héritage'],
    'Identité': ['identité', 'racines', 'mémoire', 'qui suis-je', 'origines'],
    'Pouvoir': ['pouvoir', 'roi', 'trône', 'domination', 'empire', 'conquête'],
    'Nature': ['mer', 'forêt', 'montagne', 'climat', 'terre', 'océan'],
    'Mort': ['mort', 'deuil', 'disparition', 'funérailles', 'fantôme'],
    'Guerre': ['guerre', 'bataille', 'armée', 'soldat', 'conflit'],
    'Technologie': ['robot', 'intelligence artificielle', 'numérique', 'algorithme'],
    'Justice': ['justice', 'procès', 'tribunal', 'innocent', 'coupable'],
    'Voyage': ['voyage', 'exil', 'migration', 'frontière', 'ailleurs'],
  };
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(k => lower.includes(k))) themes.push(theme);
  }

  // Score calculation
  let score = 40;
  // Structure
  if (hasStructure) score += 8;
  if (hasDialogue) score += 5;
  // Length appropriateness
  if (wordCount >= 40000 && wordCount <= 120000) score += 10; // Novel range
  else if (wordCount >= 20000 && wordCount <= 40000) score += 5; // Novella
  else if (wordCount < 5000) score -= 10; // Too short
  // Vocabulary
  if (vocabularyRichness > 0.15) score += 8;
  else if (vocabularyRichness > 0.10) score += 4;
  // Sentence variety
  if (avgSentenceLen >= 10 && avgSentenceLen <= 22) score += 8;
  // Genre match
  if (['Roman', 'Thriller', 'Fantasy', 'Essai', 'Jeunesse'].includes(genre)) score += 5;
  // Themes
  score += Math.min(10, themes.length * 3);
  // Cap
  score = Math.min(95, Math.max(10, score + Math.round(Math.random() * 8 - 4)));

  // Summary
  const firstParagraph = text.split(/\n\n/).filter(p => p.trim().length > 50)[0] || text.slice(0, 200);
  const summary = firstParagraph.slice(0, 200).trim() + (firstParagraph.length > 200 ? '…' : '');

  // Strengths and concerns
  const strengths: string[] = [];
  const concerns: string[] = [];
  if (hasStructure) strengths.push('Texte bien structuré en paragraphes');
  if (hasDialogue) strengths.push('Présence de dialogues — dynamisme narratif');
  if (vocabularyRichness > 0.15) strengths.push('Vocabulaire riche et varié');
  if (themes.length >= 3) strengths.push(`Thématiques multiples : ${themes.slice(0, 3).join(', ')}`);
  if (wordCount >= 40000) strengths.push(`Volume adapté au genre (${wordCount.toLocaleString()} mots)`);

  if (!hasStructure) concerns.push('Peu de structure paragraphique');
  if (wordCount < 20000) concerns.push('Texte court — format à vérifier');
  if (avgSentenceLen > 30) concerns.push('Phrases longues — risque de lourdeur');
  if (themes.length === 0) concerns.push('Thématiques peu identifiables à ce stade');

  // Recommendation
  let recommendation: string;
  if (score >= 75) recommendation = 'Passage en lecture prioritaire recommandé';
  else if (score >= 55) recommendation = 'Lecture de confirmation à planifier';
  else if (score >= 40) recommendation = 'Second regard possible si créneau éditorial';
  else recommendation = 'Ne correspond pas aux critères actuels du catalogue';

  return {
    title, author, genre, pages, wordCount,
    triageScore: score,
    summary,
    detectedGenre: genre || (hasDialogue ? 'Roman' : themes.includes('Pouvoir') ? 'Fantasy/Historique' : 'Littérature générale'),
    detectedThemes: themes.length > 0 ? themes : ['Non identifiés'],
    strengths: strengths.length > 0 ? strengths : ['Manuscrit à analyser en profondeur'],
    concerns: concerns.length > 0 ? concerns : ['RAS à ce stade'],
    recommendation,
    excerpt: text.slice(0, 500),
  };
}

// ═══════════════════════════════════
// AI-POWERED TRIAGE
// ═══════════════════════════════════

export async function triageWithAI(
  title: string, author: string, text: string,
  config: AIProviderConfig
): Promise<{ triage?: Partial<Submission>; error?: string }> {
  const excerpt = text.length > 5000 ? text.slice(0, 2500) + '\n[...]\n' + text.slice(-2500) : text;

  const prompt = `Tu es responsable du comité de lecture d'une maison d'édition indépendante. Trie ce manuscrit.

TITRE : ${title} | AUTEUR : ${author}
EXTRAIT :
---
${excerpt}
---

JSON strict :
{
  "triageScore": 65,
  "genre": "genre détecté",
  "summary": "résumé en 2-3 phrases",
  "themes": ["thème 1", "thème 2"],
  "strengths": ["force 1", "force 2"],
  "concerns": ["point d'attention 1"],
  "recommendation": "recommandation claire en 1 phrase"
}`;

  const result = await callClaude('Tu es un comité de lecture. JSON strict.', prompt, config);
  if (result.error) return { error: result.error };
  const parsed = parseJSONResponse<{ triageScore: number; genre: string; summary: string; themes: string[]; strengths: string[]; concerns: string[]; recommendation: string }>(result.text || '');
  if (!parsed) return { error: 'Parse error' };

  return {
    triage: {
      triageScore: parsed.triageScore,
      detectedGenre: parsed.genre,
      summary: parsed.summary,
      detectedThemes: parsed.themes,
      strengths: parsed.strengths,
      concerns: parsed.concerns,
      recommendation: parsed.recommendation,
    },
  };
}

// ═══════════════════════════════════
// STATUS LABELS
// ═══════════════════════════════════

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, { label: string; color: string; bg: string; icon: string }> = {
  inbox: { label: 'Réception', color: '#6B7280', bg: '#F3F4F6', icon: '📬' },
  triaged: { label: 'Trié', color: '#C8952E', bg: '#FFF8E0', icon: '📊' },
  shortlist: { label: 'Shortlist', color: '#5B3E8A', bg: '#F0EAFF', icon: '⭐' },
  reading: { label: 'En lecture', color: '#4A8FD4', bg: '#E8F0FF', icon: '📖' },
  rejected: { label: 'Refusé', color: '#D94452', bg: '#FFE0E4', icon: '✗' },
  accepted: { label: 'Accepté', color: '#2EAE6D', bg: '#D4F0E0', icon: '✓' },
};
