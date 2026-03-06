// ═══════════════════════════════════════════════════════════════════
// JABR — Editorial Intelligence Engine
// Converts a manuscript/synopsis into a full editorial report
// ═══════════════════════════════════════════════════════════════════

import { callClaude, parseJSONResponse, type AIProviderConfig } from './aiProvider';

// ═══════════════════════════════════
// TYPES
// ═══════════════════════════════════

export interface EditorialReport {
  // Identity
  genre: string;
  subGenres: string[];
  tonality: string;
  themes: string[];

  // Positioning
  comparables: { title: string; author: string; why: string }[];
  readerPromise: string;
  positioning: string;

  // Audience
  audiencePrimary: { label: string; age: string; description: string };
  audienceSecondary: { label: string; age: string; description: string };

  // Assessment
  strengths: string[];
  risks: string[];
  qualityScore: number;     // 0-100
  originalityScore: number; // 0-100
  marketFitScore: number;   // 0-100

  // Marketing
  marketingAngles: { angle: string; target: string; channel: string }[];
  keywords: string[];
  pitch: string; // 2-3 sentences

  // Prediction signals
  commercialPotential: 'low' | 'medium' | 'high' | 'very-high';
  pressPotential: 'low' | 'medium' | 'high';
  adaptationPotential: 'low' | 'medium' | 'high';

  // Meta
  confidence: number; // 0-100
  analysisDate: string;
}

// ═══════════════════════════════════
// PROMPTS
// ═══════════════════════════════════

const SYSTEM_PROMPT = `Tu es un directeur éditorial expérimenté travaillant pour une maison d'édition indépendante francophone. Tu analyses des manuscrits et produis des rapports éditoriaux structurés.

Tu dois TOUJOURS répondre en JSON strict, sans aucun texte avant ou après le JSON. Pas de markdown, pas de commentaires.`;

function buildAnalysisPrompt(title: string, author: string, genre: string, text: string, pages: number): string {
  const excerpt = text.length > 8000 ? text.slice(0, 4000) + '\n\n[...]\n\n' + text.slice(-4000) : text;

  return `Analyse ce manuscrit et produis un rapport éditorial complet.

TITRE : ${title}
AUTEUR : ${author}
GENRE DÉCLARÉ : ${genre}
PAGES : ${pages}
EXTRAIT :
---
${excerpt}
---

Produis un JSON avec EXACTEMENT cette structure :
{
  "genre": "genre principal détecté",
  "subGenres": ["sous-genre 1", "sous-genre 2"],
  "tonality": "description de la tonalité en 1 phrase",
  "themes": ["thème 1", "thème 2", "thème 3"],
  "comparables": [
    {"title": "Titre comparable", "author": "Auteur", "why": "Pourquoi ce comparable"}
  ],
  "readerPromise": "La promesse lecteur en 1-2 phrases",
  "positioning": "Positionnement éditorial en 2-3 phrases",
  "audiencePrimary": {"label": "Nom du segment", "age": "tranche d'âge", "description": "description"},
  "audienceSecondary": {"label": "Nom du segment", "age": "tranche d'âge", "description": "description"},
  "strengths": ["force 1", "force 2", "force 3"],
  "risks": ["risque 1", "risque 2"],
  "qualityScore": 72,
  "originalityScore": 65,
  "marketFitScore": 70,
  "marketingAngles": [
    {"angle": "angle", "target": "cible", "channel": "canal"}
  ],
  "keywords": ["mot-clé 1", "mot-clé 2"],
  "pitch": "Pitch en 2-3 phrases",
  "commercialPotential": "medium",
  "pressPotential": "medium",
  "adaptationPotential": "low",
  "confidence": 75
}

Sois précis, honnête et calibré. Ne survalue pas. Un score de 60-70 est un bon manuscrit. Au-dessus de 80, c'est exceptionnel.`;
}

// ═══════════════════════════════════
// ANALYSIS FUNCTION
// ═══════════════════════════════════

export async function analyzeManuscript(
  title: string,
  author: string,
  genre: string,
  text: string,
  pages: number,
  config: AIProviderConfig
): Promise<{ report?: EditorialReport; error?: string }> {
  const prompt = buildAnalysisPrompt(title, author, genre, text, pages);
  const result = await callClaude(SYSTEM_PROMPT, prompt, config);

  if (result.error) return { error: result.error };
  if (!result.text) return { error: 'Réponse vide' };

  const report = parseJSONResponse<EditorialReport>(result.text);
  if (!report) return { error: 'Impossible de parser le rapport éditorial' };

  // Add metadata
  report.analysisDate = new Date().toISOString();

  return { report };
}

// ═══════════════════════════════════
// OFFLINE ANALYSIS (no API key)
// Uses heuristics from text stats
// ═══════════════════════════════════

export function analyzeOffline(
  title: string,
  author: string,
  genre: string,
  text: string,
  pages: number,
  backCover?: string
): EditorialReport {
  const wordCount = text.split(/\s+/).length;
  const avgSentenceLen = text.split(/[.!?]+/).filter(s => s.trim()).length > 0
    ? wordCount / text.split(/[.!?]+/).filter(s => s.trim()).length : 15;
  const hasDialogue = (text.match(/[«""—]/g) || []).length > 10;
  const hasParagraphs = (text.match(/\n\n/g) || []).length > 5;

  // Detect themes from keywords
  const lowerText = (text + ' ' + (backCover || '')).toLowerCase();
  const themeMap: Record<string, string[]> = {
    'identité': ['identité', 'racines', 'mémoire', 'héritage', 'ancêtres'],
    'famille': ['famille', 'mère', 'père', 'enfant', 'fils', 'fille', 'frère', 'soeur'],
    'amour': ['amour', 'passion', 'désir', 'coeur', 'tendresse'],
    'pouvoir': ['pouvoir', 'trône', 'roi', 'reine', 'royaume', 'empire'],
    'nature': ['mer', 'océan', 'forêt', 'montagne', 'terre', 'climat'],
    'justice': ['justice', 'droit', 'loi', 'tribunal', 'procès'],
    'technologie': ['intelligence artificielle', 'robot', 'numérique', 'algorithme'],
    'spiritualité': ['dieu', 'prière', 'âme', 'esprit', 'sacré', 'foi'],
  };

  const themes: string[] = [];
  for (const [theme, keywords] of Object.entries(themeMap)) {
    if (keywords.some(k => lowerText.includes(k))) themes.push(theme);
  }
  if (themes.length === 0) themes.push('contemporain', 'société');

  // Genre-based comparables
  const comparablesByGenre: Record<string, { title: string; author: string; why: string }[]> = {
    'Roman': [
      { title: 'Chanson douce', author: 'Leïla Slimani', why: 'Roman contemporain français primé, tension psychologique' },
      { title: 'L\'Anomalie', author: 'Hervé Le Tellier', why: 'Littérature française contemporaine, originalité narrative' },
    ],
    'Fantasy': [
      { title: 'La Horde du Contrevent', author: 'Alain Damasio', why: 'Fantasy francophone ambitieuse, écriture littéraire' },
      { title: 'Les Enfants de la Terre', author: 'Jean M. Auel', why: 'Fresque historique/mythique, immersion dans un monde ancien' },
    ],
    'Essai': [
      { title: 'Sapiens', author: 'Yuval Noah Harari', why: 'Essai grand public, vulgarisation intellectuelle' },
      { title: 'Indignez-vous !', author: 'Stéphane Hessel', why: 'Essai engagé, format court, impact éditorial' },
    ],
    'Jeunesse': [
      { title: 'Le Petit Prince', author: 'Saint-Exupéry', why: 'Jeunesse universelle, profondeur philosophique' },
      { title: 'Harry Potter', author: 'J.K. Rowling', why: 'Jeunesse avec profondeur narrative et monde immersif' },
    ],
  };

  const comparables = comparablesByGenre[genre] || comparablesByGenre['Roman'];

  // Scoring heuristics
  const qualityScore = Math.min(95, Math.max(30,
    50 + (hasParagraphs ? 10 : 0) + (hasDialogue ? 8 : 0)
    + (avgSentenceLen > 10 && avgSentenceLen < 25 ? 10 : -5)
    + (wordCount > 40000 ? 10 : wordCount > 20000 ? 5 : -5)
    + Math.round(Math.random() * 10)
  ));

  const originalityScore = Math.min(90, Math.max(25,
    45 + themes.length * 5 + (genre === 'Fantasy' || genre === 'Science-fiction' ? 10 : 0)
    + Math.round(Math.random() * 15)
  ));

  const marketFitScore = Math.min(90, Math.max(30,
    50 + (genre === 'Roman' || genre === 'Thriller' ? 10 : 0)
    + (pages >= 200 && pages <= 400 ? 10 : -5)
    + Math.round(Math.random() * 10)
  ));

  return {
    genre,
    subGenres: themes.slice(0, 2).map(t => `${genre} — ${t}`),
    tonality: avgSentenceLen > 20 ? 'Littéraire, phrases longues, contemplative' : hasDialogue ? 'Vive, dialoguée, rythmée' : 'Narrative, descriptive, fluide',
    themes: themes.slice(0, 4),
    comparables,
    readerPromise: backCover?.slice(0, 150) || `Un ${genre.toLowerCase()} de ${pages} pages qui explore ${themes.slice(0, 2).join(' et ')}.`,
    positioning: `${genre} contemporain francophone, ${pages} pages. Positionnement : littérature générale avec thématiques ${themes.slice(0, 2).join(', ')}.`,
    audiencePrimary: { label: 'Lecteurs littéraire', age: '30-55 ans', description: `Amateurs de ${genre.toLowerCase()} français, lecteurs réguliers, sensibles aux thèmes de ${themes[0] || 'société'}.` },
    audienceSecondary: { label: 'Prescripteurs', age: '25-45 ans', description: 'Libraires indépendants, blogueurs littéraires, clubs de lecture.' },
    strengths: [
      hasParagraphs ? 'Structure narrative bien découpée' : 'Texte continu immersif',
      hasDialogue ? 'Dialogues présents, rythme varié' : 'Voix narrative forte',
      `Thématiques porteuses : ${themes.slice(0, 2).join(', ')}`,
    ],
    risks: [
      pages > 400 ? 'Longueur potentiellement dissuasive pour un premier roman' : pages < 150 ? 'Format court — positionnement prix délicat' : 'Marché concurrentiel sur ce segment',
      `Visibilité à construire pour un auteur ${author.includes('Moradel') ? 'en développement' : 'émergent'}`,
    ],
    qualityScore,
    originalityScore,
    marketFitScore,
    marketingAngles: [
      { angle: `${themes[0] || genre} contemporain`, target: 'Grand public littéraire', channel: 'Librairies + Instagram' },
      { angle: 'Voix singulière', target: 'Prescripteurs', channel: 'Presse + blogs littéraires' },
      { angle: backCover ? 'Accroche 4e' : 'Découverte auteur', target: 'Lecteurs curieux', channel: 'Newsletter + Amazon' },
    ],
    keywords: [genre.toLowerCase(), ...themes.slice(0, 3), 'littérature française', author.split(' ').pop()?.toLowerCase() || ''],
    pitch: backCover?.slice(0, 200) || `"${title}" de ${author} — un ${genre.toLowerCase()} de ${pages} pages qui interroge ${themes.slice(0, 2).join(' et ')}. Publié par Jabrilia Éditions.`,
    commercialPotential: marketFitScore > 70 ? 'high' : marketFitScore > 50 ? 'medium' : 'low',
    pressPotential: qualityScore > 70 ? 'high' : qualityScore > 50 ? 'medium' : 'low',
    adaptationPotential: genre === 'Thriller' || genre === 'Fantasy' ? 'high' : genre === 'Roman' ? 'medium' : 'low',
    confidence: backCover && text.length > 1000 ? 72 : 45,
    analysisDate: new Date().toISOString(),
  };
}
