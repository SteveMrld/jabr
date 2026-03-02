// ═══════════════════════════════════════════════════
// JABR Scanner v2.0 — Moteur d'analyse IA (TypeScript)
// Compatible avec l'interface AnalysisResult de data.ts
// ═══════════════════════════════════════════════════

export interface FlaggedPattern {
  pattern: string;
  count: number;
  severity: 'critical' | 'moderate' | 'minor';
}

export interface ScanResult {
  iaScore: number;
  wordCount: number;
  redundancies: number;
  avgSentenceLength: number;
  timestamp: string;
  flaggedPatterns: FlaggedPattern[];
}

export interface ScanResultExtended extends ScanResult {
  file: string;
  title: string;
  sentences: { count: number; avgLength: number; maxLength: number; longCount: number };
  adverbs: { total: number; unique: number; densityPer10k: number; top: { word: string; count: number }[] };
  redundanciesDetail: { expression: string; count: number }[];
  diagnostic: { level: string; label: string };
  // 6 dimensions Moradel
  dimensions: {
    rythme: DimensionScore;
    images: DimensionScore;
    tension: DimensionScore;
    voix: DimensionScore;
    architecture: DimensionScore;
    sensorialite: DimensionScore;
    global: number; // 0-10
  };
}

export interface DimensionScore {
  score: number; // 0-10 (10 = excellent)
  label: string;
  findings: string[];
  metrics: Record<string, number | string>;
}

// ── Pattern definitions ──

interface PatternDef {
  id: string;
  label: string;
  regex: RegExp;
  severity: 'critical' | 'moderate' | 'minor';
}

const PATTERNS: PatternDef[] = [
  // CRITICAL — Structures rhétoriques GPT
  { id: "antithese_ne_pas", label: '"ne [V] pas [X] : il/elle [V]"', regex: /[Nn]e\s+\w+\s+pas\s+.{3,40}\s*[:;]\s*(?:il|elle|ils|elles|on|c['']est)\s+\w+/g, severity: "critical" },
  { id: "il_ne_sagit_pas", label: '"Il ne s\'agit pas de... mais de..."', regex: /[Ii]l\s+ne\s+s['']agit\s+pas\s+(?:seulement\s+)?de\b/g, severity: "critical" },
  { id: "ce_nest_pas_cest", label: '"Ce n\'est pas... c\'est..."', regex: /[Cc]e\s+n['']est\s+pas\s+.{3,50}\s*[,:;]\s*c['']est\b/g, severity: "critical" },
  { id: "dans_un_monde_ou", label: '"Dans un monde où..."', regex: /[Dd]ans\s+un\s+monde\s+où\b/g, severity: "critical" },
  { id: "force_est_de", label: '"Force est de constater"', regex: /[Ff]orce\s+est\s+de\s+constater/g, severity: "critical" },
  { id: "il_convient_de", label: '"Il convient de"', regex: /[Ii]l\s+convient\s+de\b/g, severity: "critical" },
  { id: "plus_que_jamais", label: '"Plus que jamais"', regex: /[Pp]lus\s+que\s+jamais\b/g, severity: "critical" },
  { id: "a_lheure_ou", label: '"À l\'heure où"', regex: /[ÀAa]\s+l['']heure\s+où\b/g, severity: "critical" },
  { id: "bien_plus_que", label: '"Bien plus qu\'un(e)..."', regex: /[Bb]ien\s+plus\s+qu['']un[e]?\b/g, severity: "critical" },

  // MODERATE — Connecteurs et tics GPT
  { id: "car_debut", label: '"Car" en début de phrase', regex: /(?:^|\.\s+)Car\s+\w+/gm, severity: "moderate" },
  { id: "en_effet", label: '"En effet"', regex: /[Ee]n\s+effet\b/g, severity: "moderate" },
  { id: "ainsi_debut", label: '"Ainsi" en début de phrase', regex: /(?:^|\.\s+)Ainsi[,\s]/gm, severity: "moderate" },
  { id: "neanmoins", label: '"Néanmoins"', regex: /[Nn]éanmoins\b/g, severity: "moderate" },
  { id: "toutefois", label: '"Toutefois"', regex: /[Tt]outefois\b/g, severity: "moderate" },
  { id: "par_ailleurs", label: '"Par ailleurs"', regex: /[Pp]ar\s+ailleurs\b/g, severity: "moderate" },
  { id: "en_outre", label: '"En outre"', regex: /[Ee]n\s+outre\b/g, severity: "moderate" },
  { id: "face_a", label: '"Face à"', regex: /[Ff]ace\s+à\b/g, severity: "moderate" },
  { id: "il_existe", label: '"Il existe"', regex: /[Ii]l\s+existe\b/g, severity: "moderate" },
  { id: "il_est_important", label: '"Il est important/essentiel/crucial"', regex: /[Ii]l\s+est\s+(?:important|essentiel|crucial|fondamental|nécessaire)\b/g, severity: "moderate" },
  { id: "cela_signifie", label: '"Cela signifie/implique/suppose"', regex: /[Cc]ela\s+(?:signifie|implique|suppose|révèle|témoigne)\b/g, severity: "moderate" },
  { id: "en_realite", label: '"En réalité"', regex: /[Ee]n\s+réalité\b/g, severity: "moderate" },
  { id: "autrement_dit", label: '"Autrement dit"', regex: /[Aa]utrement\s+dit\b/g, severity: "moderate" },
  { id: "il_est_clair", label: '"Il est clair/évident que"', regex: /[Ii]l\s+est\s+(?:clair|évident)\s+que\b/g, severity: "moderate" },
  { id: "quelque_chose", label: '"Quelque chose" (vague)', regex: /[Qq]uelque\s+chose\b/g, severity: "moderate" },
  { id: "et_virgule", label: '"Et," en début de phrase', regex: /(?:^|\.\s+)Et,\s+/gm, severity: "moderate" },

  // MINOR — Tics stylistiques
  { id: "silence", label: '"Un silence" / "Le silence"', regex: /[UuLl][ne]?\s+silence\b/g, severity: "minor" },
  { id: "regard", label: '"Son/Le regard"', regex: /(?:[Ss]on|[Ll]e|[Uu]n)\s+regard\b/g, severity: "minor" },
  { id: "souffle", label: '"Un souffle" / "Son souffle"', regex: /(?:[Uu]n|[Ss]on|[Ll]e)\s+souffle\b/g, severity: "minor" },
  { id: "premiere_fois", label: '"Pour la première fois"', regex: /[Pp]our\s+la\s+première\s+fois\b/g, severity: "minor" },
  { id: "au_fond", label: '"Au fond"', regex: /[Aa]u\s+fond\b/g, severity: "minor" },
  { id: "malgre_tout", label: '"Malgré tout"', regex: /[Mm]algré\s+tout\b/g, severity: "minor" },
  { id: "profondement", label: '"Profondément"', regex: /[Pp]rofondément\b/g, severity: "minor" },
  { id: "silencieusement", label: '"Silencieusement"', regex: /[Ss]ilencieusement\b/g, severity: "minor" },
  { id: "imperceptiblement", label: '"Imperceptiblement"', regex: /[Ii]mperceptiblement\b/g, severity: "minor" },
  { id: "inexorablement", label: '"Inexorablement"', regex: /[Ii]nexorablement\b/g, severity: "minor" },
  { id: "murmura", label: '"murmura-t-il/elle"', regex: /murmura-t-(?:il|elle)\b/g, severity: "minor" },
  { id: "soupira", label: '"soupira / souffla"', regex: /(?:soupira|souffla)(?:-t-(?:il|elle))?\b/g, severity: "minor" },
  { id: "comme_si", label: '"Comme si" (excès comparatif)', regex: /[Cc]omme\s+si\b/g, severity: "minor" },
];

const FREQ_THRESHOLDS: Record<string, number> = { critical: 1.0, moderate: 2.0, minor: 3.0 };

// ── Helpers ──

function countWords(text: string): number {
  return (text.match(/\b\w+\b/g) || []).length;
}

function splitSentences(text: string): string[] {
  let protected_ = text;
  for (const abbr of ["M.", "Mme.", "Dr.", "St.", "etc.", "cf.", "p.", "vol."]) {
    protected_ = protected_.replaceAll(abbr, abbr.replace(".", "§D§"));
  }
  return protected_.split(/[.!?…]+\s+/).map(s => s.replace(/§D§/g, ".").trim()).filter(Boolean);
}

function countMatches(text: string, regex: RegExp): number {
  // Reset lastIndex and count
  const r = new RegExp(regex.source, regex.flags);
  return (text.match(r) || []).length;
}

// ── Core analysis ──

function detectPatterns(text: string, title?: string): FlaggedPattern[] {
  const wordCount = countWords(text);
  const ratio = wordCount / 10000 || 1;
  const results: FlaggedPattern[] = [];

  for (const p of PATTERNS) {
    const count = countMatches(text, p.regex);
    if (count === 0) continue;

    const freq = count / ratio;
    const threshold = FREQ_THRESHOLDS[p.severity] ?? 2;

    if (freq >= threshold || (p.severity === "critical" && count >= 2)) {
      results.push({ pattern: p.label, count, severity: p.severity });
    }
  }

  // Auto-référence au titre
  if (title && title.length > 5) {
    const titleRegex = new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const titleCount = countMatches(text, titleRegex);
    if (titleCount >= 3) {
      results.push({ pattern: `Auto-référence: "${title}"`, count: titleCount, severity: "critical" });
    }
  }

  // Sort: critical first, then by count desc
  const order: Record<string, number> = { critical: 0, moderate: 1, minor: 2 };
  results.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9) || b.count - a.count);

  return results;
}

function detectRedundancies(text: string): { count: number; top: { expression: string; count: number }[] } {
  const words = text.toLowerCase().match(/\b[a-zàâäéèêëïîôùûüÿçœæ]+\b/g) || [];
  if (words.length < 100) return { count: 0, top: [] };

  const stopNgrams = new Set([
    "de la", "il y a", "dans le", "dans la", "sur le", "sur la",
    "c est", "il est", "elle est", "je ne", "il ne", "ce qui",
    "ce que", "de son", "de ses", "à la", "par le", "par la",
    "avec le", "avec la", "pour le", "pour la", "qui est",
    "il y", "y a", "ne pas", "pas de", "de le",
  ]);

  const stopWords = new Set([
    "le", "la", "les", "de", "du", "des", "un", "une", "et", "en", "à", "au", "aux",
    "que", "qui", "ne", "pas", "se", "son", "sa", "ses", "ce", "il", "elle",
    "dans", "sur", "par", "pour", "avec",
  ]);

  // Count trigrams
  const triCounts = new Map<string, number>();
  for (let i = 0; i < words.length - 2; i++) {
    const tri = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    triCounts.set(tri, (triCounts.get(tri) || 0) + 1);
  }

  // Count quadgrams
  const quadCounts = new Map<string, number>();
  for (let i = 0; i < words.length - 3; i++) {
    const quad = `${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`;
    quadCounts.set(quad, (quadCounts.get(quad) || 0) + 1);
  }

  const results: { expression: string; count: number }[] = [];

  for (const [ngram, count] of triCounts) {
    if (count >= 5 && !stopNgrams.has(ngram)) {
      const ws = ngram.split(" ");
      if (!ws.every(w => stopWords.has(w))) {
        results.push({ expression: ngram, count });
      }
    }
  }

  for (const [ngram, count] of quadCounts) {
    if (count >= 3) {
      const ws = ngram.split(" ");
      if (!ws.every(w => stopWords.has(w))) {
        results.push({ expression: ngram, count });
      }
    }
  }

  results.sort((a, b) => b.count - a.count);
  return { count: results.length, top: results.slice(0, 20) };
}

function detectAdverbs(text: string): { total: number; unique: number; densityPer10k: number; top: { word: string; count: number }[] } {
  const exclusions = new Set([
    "moment", "comment", "document", "département", "gouvernement", "mouvement",
    "sentiment", "événement", "élément", "instrument", "monument", "jugement",
    "changement", "traitement", "logement", "comportement", "environnement",
    "développement", "management", "supplément", "complément", "argument",
    "consentement", "enseignement", "raisonnement", "médicament", "parlement",
  ]);

  const matches = text.toLowerCase().match(/\b\w{4,}ment\b/g) || [];
  const filtered = matches.filter(w => !exclusions.has(w));

  const counts = new Map<string, number>();
  for (const w of filtered) counts.set(w, (counts.get(w) || 0) + 1);

  const wordCount = countWords(text);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, count]) => ({ word, count }));

  return {
    total: filtered.length,
    unique: counts.size,
    densityPer10k: wordCount > 0 ? Math.round((filtered.length / wordCount) * 10000 * 10) / 10 : 0,
    top,
  };
}

function computeIaScore(patterns: FlaggedPattern[], wordCount: number, redundancyCount: number, adverbDensity: number): number {
  let score = 0;

  for (const p of patterns) {
    if (p.severity === "critical") score += Math.min(p.count, 6) * 8;
    else if (p.severity === "moderate") score += Math.min(p.count, 8) * 3;
    else score += Math.min(p.count, 8) * 1;
  }

  score += Math.min(redundancyCount, 20) * 0.5;
  if (wordCount > 0) score += Math.min(adverbDensity * 2, 10);

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ═══════════════════════════════════════════════════
// 6 DIMENSIONS MORADEL
// ═══════════════════════════════════════════════════

// ── D1: RYTHME ──
// Alternance longue/courte/moyenne, souffle architecturé, ratio phrases < 5 mots

function analyzeRythme(sentences: string[]): DimensionScore {
  if (sentences.length < 10) return { score: 5, label: 'Insuffisant', findings: ['Texte trop court pour analyse rythmique'], metrics: {} };

  const lengths = sentences.map(countWords);
  const short = lengths.filter(l => l < 5).length;
  const medium = lengths.filter(l => l >= 5 && l <= 20).length;
  const long_ = lengths.filter(l => l > 20 && l <= 40).length;
  const veryLong = lengths.filter(l => l > 40).length;
  const total = lengths.length;

  const shortRatio = (short / total) * 100;
  const longRatio = ((long_ + veryLong) / total) * 100;
  const mediumRatio = (medium / total) * 100;

  // Detect alternation quality: count transitions between categories
  let transitions = 0;
  const cats = lengths.map(l => l < 5 ? 'S' : l <= 20 ? 'M' : 'L');
  for (let i = 1; i < cats.length; i++) {
    if (cats[i] !== cats[i - 1]) transitions++;
  }
  const transitionRatio = total > 1 ? (transitions / (total - 1)) * 100 : 0;

  // Detect monotony: consecutive same-category sentences
  let maxConsecutive = 1, current = 1;
  for (let i = 1; i < cats.length; i++) {
    if (cats[i] === cats[i - 1]) { current++; maxConsecutive = Math.max(maxConsecutive, current); }
    else current = 1;
  }

  // Scoring
  let score = 10;
  const findings: string[] = [];

  // Short phrase ratio: ideal 6-8%, >15% = problematic
  if (shortRatio > 20) { score -= 3; findings.push(`Excès de phrases < 5 mots : ${Math.round(shortRatio)}% (seuil : 6-8%)`); }
  else if (shortRatio > 12) { score -= 1.5; findings.push(`Phrases < 5 mots un peu élevées : ${Math.round(shortRatio)}%`); }
  else if (shortRatio < 3) { score -= 1; findings.push(`Trop peu de phrases courtes : ${Math.round(shortRatio)}% (manque de percutant)`); }

  // Long phrases: need some > 30 words for literary breath
  if (longRatio < 5) { score -= 2; findings.push(`Manque de phrases longues architecturées (> 20 mots) : ${Math.round(longRatio)}%`); }
  if (veryLong === 0 && total > 30) { score -= 1; findings.push('Aucune phrase > 40 mots — pas de souffle littéraire'); }

  // Monotony: too many medium phrases
  if (mediumRatio > 80) { score -= 2; findings.push(`Monotonie : ${Math.round(mediumRatio)}% de phrases moyennes (12-18 mots)`); }

  // Transition quality
  if (transitionRatio < 30) { score -= 2; findings.push(`Faible alternance rythmique : ${Math.round(transitionRatio)}% de transitions`); }
  else if (transitionRatio > 60) { findings.push('Bonne alternance rythmique'); }

  if (maxConsecutive > 6) { score -= 1; findings.push(`${maxConsecutive} phrases consécutives de même longueur`); }

  if (findings.length === 0 || (findings.length === 1 && findings[0].includes('Bonne'))) findings.push('Rythme varié et maîtrisé');

  return {
    score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)),
    label: score >= 8 ? 'Excellent' : score >= 6 ? 'Correct' : score >= 4 ? 'Insuffisant' : 'Défaillant',
    findings,
    metrics: {
      'Phrases courtes (<5 mots)': `${Math.round(shortRatio)}%`,
      'Phrases moyennes (5-20)': `${Math.round(mediumRatio)}%`,
      'Phrases longues (>20)': `${Math.round(longRatio)}%`,
      'Phrases très longues (>40)': veryLong,
      'Taux alternance': `${Math.round(transitionRatio)}%`,
      'Max consécutives même type': maxConsecutive,
    },
  };
}

// ── D2: IMAGES ──
// Métaphores, comparaisons, densité figurative, images mortes vs originales

function analyzeImages(text: string): DimensionScore {
  const wordCount = countWords(text);
  if (wordCount < 100) return { score: 5, label: 'Insuffisant', findings: ['Texte trop court'], metrics: {} };

  // Detect comparisons (comme, tel, pareil à, semblable à, à la manière de)
  const comparisons = countMatches(text, /\b(?:comme\s+(?:un|une|le|la|les|des|si)\b|tel(?:le)?s?\s+(?:un|une|le|la)\b|pareil(?:le)?s?\s+à\b|semblable\s+à\b|à\s+la\s+manière\s+de\b)/gi);

  // Dead/cliché metaphors
  const deadMetaphors = [
    /au\s+bout\s+du\s+tunnel/gi, /flot\s+de\s+(?:larmes|paroles)/gi,
    /poids\s+(?:du\s+monde|sur\s+(?:ses|les)\s+épaules)/gi, /cœur\s+(?:lourd|serré|brisé|de\s+pierre)/gi,
    /lumière\s+au\s+bout/gi, /mer\s+(?:de\s+)?(?:larmes|problèmes)/gi,
    /mur\s+(?:du\s+silence|de\s+glace)/gi, /voile\s+(?:de\s+(?:tristesse|brume))/gi,
    /comme\s+une?\s+(?:fenêtre|corde|voile|rideau)\s+(?:intérieur|invisible)/gi,
    /vague\s+(?:de\s+)?(?:chaleur|froid|émotion|tristesse)/gi,
    /ombre\s+(?:de\s+(?:lui|elle|soi)-même)/gi,
  ];
  let deadCount = 0;
  for (const dm of deadMetaphors) deadCount += countMatches(text, dm);

  // Extended metaphors (image filée): detect repeated figurative field in close proximity
  // Detect sensory/figurative verbs
  const figurativeVerbs = countMatches(text, /\b(?:ondulait|ruisselait|crépitait|éclaboussait|s'embrasait|brûlait|flottait|dansait|tremblait|vibrait|palpitait|frémissait|grondait)\b/gi);

  // Density
  const ratio10k = wordCount / 10000 || 1;
  const compDensity = comparisons / ratio10k;
  const figurativeDensity = (comparisons + figurativeVerbs) / ratio10k;

  let score = 5; // Start neutral
  const findings: string[] = [];

  // Comparison density: ideal 15-30 per 10k words for literary fiction
  if (compDensity < 5) { score -= 2; findings.push(`Très peu de comparaisons : ${comparisons} (${Math.round(compDensity)}/10k mots)`); }
  else if (compDensity < 15) { score -= 1; findings.push(`Densité figurative faible : ${Math.round(compDensity)} comparaisons/10k mots`); }
  else if (compDensity >= 15 && compDensity <= 40) { score += 3; findings.push(`Bonne densité figurative : ${Math.round(compDensity)} comparaisons/10k mots`); }
  else if (compDensity > 40) { score += 1; findings.push(`Densité très élevée — vérifier la qualité : ${Math.round(compDensity)}/10k mots`); }

  // Figurative verbs
  if (figurativeVerbs > 5) { score += 1; findings.push(`${figurativeVerbs} verbes figuratifs détectés — bon ancrage imagé`); }

  // Dead metaphors penalty
  if (deadCount > 3) { score -= 2; findings.push(`${deadCount} images mortes/clichés détectées`); }
  else if (deadCount > 0) { score -= 0.5; findings.push(`${deadCount} image(s) convenue(s)`); }

  // No metaphors at all
  if (comparisons === 0 && figurativeVerbs === 0) {
    score = 1;
    findings.length = 0;
    findings.push('Aucune image détectée — texte abstrait, désincarné');
  }

  return {
    score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)),
    label: score >= 8 ? 'Riche' : score >= 6 ? 'Correct' : score >= 4 ? 'Pauvre' : 'Absent',
    findings,
    metrics: {
      'Comparaisons': comparisons,
      'Densité/10k mots': Math.round(compDensity),
      'Verbes figuratifs': figurativeVerbs,
      'Images mortes': deadCount,
    },
  };
}

// ── D3: TENSION ──
// Résistance du personnage, variation émotionnelle, mouvement dramatique

function analyzeTension(text: string): DimensionScore {
  const wordCount = countWords(text);
  if (wordCount < 200) return { score: 5, label: 'Insuffisant', findings: ['Texte trop court'], metrics: {} };

  // Passive reception markers (IA pattern: character accepts everything calmly)
  const passiveMarkers = [
    /il\s+(?:sentit|comprit|accepta|réalisa)\s+que\b/gi,
    /(?:une?\s+)?(?:calme|paix|sérénité|douceur)\s+(?:s'installa|l'envahit|le\s+gagna)/gi,
    /(?:quelque\s+chose)\s+(?:se\s+(?:déplaça|déposa|installa|posa))\s+en\s+(?:lui|elle)/gi,
    /la\s+pensée\s+(?:passa|glissa|s'effaça)\s+(?:sans|doucement)/gi,
    /pour\s+la\s+première\s+fois\s+depuis\s+(?:longtemps|des\s+(?:mois|années|semaines))/gi,
    /(?:pas\s+de\s+\w+\.\s*pas\s+de\s+\w+\.\s*(?:plutôt|juste)\s+(?:un|une))/gi,
  ];
  let passiveCount = 0;
  for (const pm of passiveMarkers) passiveCount += countMatches(text, pm);

  // Active tension markers (resistance, conflict, doubt, anger)
  const tensionMarkers = [
    /\b(?:refusa|résista|s'opposa|protesta|rejeta|nia|frappa|cria|hurla|gronda)\b/gi,
    /\b(?:colère|rage|fureur|révolte|dégoût|honte|peur|terreur|angoisse|panique)\b/gi,
    /\b(?:mais\s+(?:pourquoi|comment|non)|impossible|jamais|assez)\b/gi,
    /[!?]{1,3}/g,
  ];
  let tensionCount = 0;
  for (const tm of tensionMarkers) tensionCount += countMatches(text, tm);

  // Flat adjectives (IA over-uses calm/gentle/soft/quiet)
  const flatAdj = countMatches(text, /\b(?:calme|doux|douce|tranquille|discret|discrète|simple|paisible|léger|légère|lointain|lointaine)\b/gi);

  const ratio10k = wordCount / 10000 || 1;
  const passiveDensity = passiveCount / ratio10k;
  const tensionDensity = tensionCount / ratio10k;
  const flatDensity = flatAdj / ratio10k;

  let score = 6;
  const findings: string[] = [];

  // Passive markers
  if (passiveDensity > 10) { score -= 3; findings.push(`Réception passive omniprésente : ${passiveCount} marqueurs (${Math.round(passiveDensity)}/10k)`); }
  else if (passiveDensity > 5) { score -= 1.5; findings.push(`Excès de réception passive : ${passiveCount} marqueurs`); }

  // Tension markers
  if (tensionDensity < 5) { score -= 2; findings.push('Très peu de marqueurs de tension, conflit ou résistance'); }
  else if (tensionDensity >= 15) { score += 2; findings.push('Bonne densité de tension et conflit'); }
  else if (tensionDensity >= 8) { score += 1; }

  // Flat adjectives
  if (flatDensity > 30) { score -= 2; findings.push(`Adjectifs plats suremployés : ${flatAdj} occurrences ("calme", "doux", "simple"…)`); }
  else if (flatDensity > 15) { score -= 1; findings.push(`Adjectifs plats fréquents (${flatAdj} occ.)`); }

  // Ratio passive/tension
  if (passiveCount > 0 && tensionCount > 0) {
    const ratio = tensionCount / passiveCount;
    if (ratio < 0.5) findings.push('Le personnage subit plus qu\'il n\'agit');
    else if (ratio > 2) findings.push('Bon équilibre action/intériorité');
  }

  if (findings.length === 0) findings.push('Tension narrative correcte');

  return {
    score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)),
    label: score >= 8 ? 'Puissant' : score >= 6 ? 'Correct' : score >= 4 ? 'Plat' : 'Inerte',
    findings,
    metrics: {
      'Marqueurs passifs': passiveCount,
      'Marqueurs de tension': tensionCount,
      'Adjectifs plats': flatAdj,
      'Ratio tension/passif': passiveCount > 0 ? Math.round((tensionCount / passiveCount) * 10) / 10 : '∞',
    },
  };
}

// ── D4: VOIX ──
// Score inversé de iaScore (iaScore élevé = voix contaminée = score voix bas)

function analyzeVoix(iaScore: number, patterns: FlaggedPattern[]): DimensionScore {
  const score = Math.max(0, 10 - (iaScore / 10));
  const criticals = patterns.filter(p => p.severity === 'critical');
  const findings: string[] = [];

  if (iaScore >= 60) findings.push(`Voix fortement contaminée IA : ${criticals.length} patterns critiques`);
  else if (iaScore >= 35) findings.push(`Voix suspecte : ${patterns.length} patterns détectés`);
  else if (iaScore >= 15) findings.push(`Quelques traces IA résiduelles (${patterns.length} patterns)`);
  else findings.push('Voix authentique — pas de signature IA détectée');

  return {
    score: Math.round(score * 10) / 10,
    label: score >= 8 ? 'Authentique' : score >= 6 ? 'Acceptable' : score >= 4 ? 'Contaminée' : 'IA dominante',
    findings,
    metrics: {
      'Score IA brut': iaScore,
      'Patterns critiques': criticals.length,
      'Patterns totaux': patterns.length,
    },
  };
}

// ── D5: ARCHITECTURE ──
// Variation des ouvertures, fermetures, attaques

function analyzeArchitecture(text: string): DimensionScore {
  // Split into chapters/sections
  const sections = text.split(/(?:Chapitre|CHAPITRE|PARTIE|Partie|PROLOGUE|ÉPILOGUE)\s+/i).filter(s => s.trim().length > 100);

  if (sections.length < 2) return { score: 5, label: 'N/A', findings: ['Pas assez de chapitres pour analyser l\'architecture'], metrics: { 'Sections détectées': sections.length } };

  // Analyze openings (first 50 words of each section)
  const openingTypes: string[] = [];
  for (const s of sections) {
    const first50 = s.trim().split(/\s+/).slice(0, 50).join(' ');
    if (/^[A-ZÀ-Ü][\w]+ (?:marchait|regardait|contemplait|s'assit|se tenait|était\s+(?:assis|debout|seul))/.test(first50)) {
      openingTypes.push('description-perso');
    } else if (/^(?:Le |La |Les |Un |Une |L'|Il |Elle )(?:soleil|lumière|pluie|vent|nuit|matin|ciel|neige|brume|silence)/.test(first50)) {
      openingTypes.push('atmosphere');
    } else if (/^[—–\-]/.test(first50) || /^«/.test(first50)) {
      openingTypes.push('dialogue');
    } else if (/^\d|^Ce\s+(?:jour|matin|soir)/.test(first50)) {
      openingTypes.push('temporel');
    } else {
      openingTypes.push('autre');
    }
  }

  // Analyze closings (last 50 words)
  const closingTypes: string[] = [];
  for (const s of sections) {
    const words = s.trim().split(/\s+/);
    const last50 = words.slice(-50).join(' ');
    if (/(?:comprit|pensa|se dit|réalisa|savait)\s+que\b/.test(last50)) {
      closingTypes.push('philosophique');
    } else if (/[.]\s*$/.test(last50) && /(?:marcha|partit|s'éloigna|ferma|quitta)/.test(last50)) {
      closingTypes.push('action');
    } else {
      closingTypes.push('autre');
    }
  }

  // Score based on variety
  const openingVariety = new Set(openingTypes).size;
  const closingVariety = new Set(closingTypes).size;

  // Count same-type consecutive openings
  let sameOpenings = 0;
  for (let i = 1; i < openingTypes.length; i++) {
    if (openingTypes[i] === openingTypes[i - 1]) sameOpenings++;
  }

  let score = 6;
  const findings: string[] = [];

  // Opening variety
  if (openingVariety === 1 && sections.length > 3) { score -= 3; findings.push(`Toutes les ouvertures sont du même type (${openingTypes[0]})`); }
  else if (openingVariety < sections.length * 0.4) { score -= 1; findings.push(`Faible variété d'ouvertures : ${openingVariety} types pour ${sections.length} chapitres`); }
  else { score += 2; findings.push(`Bonne variété d'ouvertures : ${openingVariety} types`); }

  // Closing variety
  if (closingVariety === 1 && sections.length > 3) { score -= 2; findings.push('Toutes les fermetures sont du même type'); }

  // Consecutive same openings
  if (sameOpenings > 2) { score -= 1; findings.push(`${sameOpenings} paires de chapitres consécutifs avec la même ouverture`); }

  // In medias res detection
  const hasInMediasRes = openingTypes.some(t => t === 'dialogue' || t === 'autre');
  if (!hasInMediasRes && sections.length > 4) { score -= 1; findings.push('Aucune attaque in medias res détectée'); }

  if (findings.length === 0) findings.push('Architecture variée');

  return {
    score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)),
    label: score >= 8 ? 'Varié' : score >= 6 ? 'Correct' : score >= 4 ? 'Monotone' : 'Répétitif',
    findings,
    metrics: {
      'Chapitres analysés': sections.length,
      'Types d\'ouverture': openingVariety,
      'Types de fermeture': closingVariety,
      'Ouvertures similaires consécutives': sameOpenings,
    },
  };
}

// ── D6: SENSORIALITÉ ──
// 5 sens mobilisés, ancrage corporel, lieu incarné

function analyzeSensorialite(text: string): DimensionScore {
  const wordCount = countWords(text);
  if (wordCount < 200) return { score: 5, label: 'Insuffisant', findings: ['Texte trop court'], metrics: {} };

  // Vue
  const vue = countMatches(text, /\b(?:regard(?:a|ait|er)?|v[io](?:t|yait|ir)|aperç(?:ut|evait)|contempl(?:a|ait)|observ(?:a|ait)|lumière|ombre|couleur|obscur|brillant|sombre|lueur|reflet|silhouette|horizon|éclat|scintill)/gi);
  // Ouïe
  const ouie = countMatches(text, /\b(?:entend(?:it|ait|re)|écout(?:a|ait)|bruit|son|voix|cri|silence|murmur|chuchotement|grondement|craquement|siffl|tintement|écho|résonn|fracas|bourdonne)/gi);
  // Toucher
  const toucher = countMatches(text, /\b(?:touch(?:a|ait|er)|caress(?:a|ait)|peau|main|doigt|froid|chaud|brûl(?:ait|ure)|douleur|frisson|rugueux|lisse|humide|sec|moite|tiède|glacé|pression|effleur)/gi);
  // Odorat
  const odorat = countMatches(text, /\b(?:odeur|parfum|sent(?:ait|it)|pu(?:ait|anteur)|arome|fragrance|effluv|narine|empest|embaumait|relent|âcre|musqué)/gi);
  // Goût
  const gout = countMatches(text, /\b(?:goût|saveur|amertume|dégust|avala|mâch|acid|sucré|salé|amer|épicé|langue|palais|boire|bu[vt])/gi);

  // Body anchoring
  const body = countMatches(text, /\b(?:cœur|poitrine|ventre|gorge|jambe|bras|épaule|nuque|front|joue|lèvre|souffle|respir|pouls|tempe|hanche|genou|dos|thorax|mâchoire|estomac|muscle)/gi);

  // Place incarnation
  const place = countMatches(text, /\b(?:rue|immeuble|mur|plancher|plafond|fenêtre|porte|escalier|trottoir|café|bar|cuisine|chambre|jardin|parc|pont|rivière|mer|montagne|forêt|allée|terrasse|quai|gare|aéroport)/gi);

  const sensesActive = [vue, ouie, toucher, odorat, gout].filter(s => s > 0).length;
  const ratio10k = wordCount / 10000 || 1;
  const totalSensory = vue + ouie + toucher + odorat + gout;
  const sensoryDensity = totalSensory / ratio10k;

  let score = 3; // Start low, build up
  const findings: string[] = [];

  // Number of senses
  if (sensesActive >= 5) { score += 4; findings.push('Les 5 sens sont mobilisés'); }
  else if (sensesActive >= 4) { score += 3; findings.push(`${sensesActive} sens sur 5 mobilisés`); }
  else if (sensesActive >= 3) { score += 2; findings.push(`Seulement ${sensesActive} sens mobilisés`); }
  else if (sensesActive <= 2) { score += 0; findings.push(`Très faible : seulement ${sensesActive} sens mobilisé(s)`); }

  // Specific senses
  if (odorat === 0) findings.push('Aucune odeur dans le texte');
  if (gout === 0) findings.push('Aucun goût dans le texte');
  if (toucher < 3) findings.push('Toucher quasi absent — le corps du personnage n\'existe pas');

  // Sensory density
  if (sensoryDensity > 40) { score += 2; findings.push('Densité sensorielle riche'); }
  else if (sensoryDensity > 20) { score += 1; }
  else if (sensoryDensity < 10) { score -= 1; findings.push('Texte abstrait — peu d\'ancrage sensoriel'); }

  // Body
  if (body > 5) { score += 1; findings.push(`Ancrage corporel présent (${body} marqueurs)`); }
  else if (body <= 1) { findings.push('Le personnage n\'a pas de corps'); }

  // Place
  if (place > 5) { score += 0.5; }
  else if (place <= 1) { findings.push('Lieu non incarné — pas de détail spatial'); }

  return {
    score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)),
    label: score >= 8 ? 'Immersif' : score >= 6 ? 'Correct' : score >= 4 ? 'Faible' : 'Abstrait',
    findings,
    metrics: {
      'Vue': vue,
      'Ouïe': ouie,
      'Toucher': toucher,
      'Odorat': odorat,
      'Goût': gout,
      'Sens actifs': `${sensesActive}/5`,
      'Ancrage corporel': body,
      'Ancrage spatial': place,
    },
  };
}

// ── Public API ──

export function analyzeText(text: string, options?: { title?: string; file?: string; extended?: boolean }): ScanResult | ScanResultExtended {
  const wordCount = countWords(text);
  if (wordCount < 50) {
    return {
      iaScore: 0, wordCount, redundancies: 0, avgSentenceLength: 0,
      timestamp: new Date().toISOString().slice(0, 10),
      flaggedPatterns: [],
    };
  }

  const sentences = splitSentences(text);
  const sentLengths = sentences.map(countWords);
  const avgSentenceLength = sentLengths.length > 0
    ? Math.round((sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length) * 10) / 10
    : 0;

  const patterns = detectPatterns(text, options?.title);
  const redundancies = detectRedundancies(text);
  const adverbs = detectAdverbs(text);
  const iaScore = computeIaScore(patterns, wordCount, redundancies.count, adverbs.densityPer10k);

  const base: ScanResult = {
    iaScore,
    wordCount,
    redundancies: redundancies.count,
    avgSentenceLength,
    timestamp: new Date().toISOString().slice(0, 10),
    flaggedPatterns: patterns,
  };

  if (!options?.extended) return base;

  const level = iaScore < 15 ? "clean" : iaScore < 35 ? "acceptable" : iaScore < 60 ? "suspect" : "critical";
  const labels: Record<string, string> = {
    clean: "✓ Manuscrit propre — voix authentique",
    acceptable: "⚠ Acceptable — quelques retouches recommandées",
    suspect: "⚠ Suspect — réécriture partielle nécessaire",
    critical: "✗ Fortement IA — réécriture substantielle requise",
  };

  // 6 Dimensions Moradel
  const d1 = analyzeRythme(sentences);
  const d2 = analyzeImages(text);
  const d3 = analyzeTension(text);
  const d4 = analyzeVoix(iaScore, patterns);
  const d5 = analyzeArchitecture(text);
  const d6 = analyzeSensorialite(text);
  const globalScore = Math.round(((d1.score + d2.score + d3.score + d4.score + d5.score + d6.score) / 6) * 10) / 10;

  return {
    ...base,
    file: options?.file || "",
    title: options?.title || "",
    sentences: {
      count: sentences.length,
      avgLength: avgSentenceLength,
      maxLength: sentLengths.length > 0 ? Math.max(...sentLengths) : 0,
      longCount: sentLengths.filter(l => l > 40).length,
    },
    adverbs,
    redundanciesDetail: redundancies.top.slice(0, 10),
    diagnostic: { level, label: labels[level] || "" },
    dimensions: {
      rythme: d1,
      images: d2,
      tension: d3,
      voix: d4,
      architecture: d5,
      sensorialite: d6,
      global: globalScore,
    },
  };
}
