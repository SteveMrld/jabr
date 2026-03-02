// ═══════════════════════════════════════════════════
// JABR Engine v1.0 — Moteur IA Orchestré
// Pipeline multi-IA pour production éditoriale
// ═══════════════════════════════════════════════════

// ── Types ──

export interface CreativeBrief {
  title: string;
  genre: string;
  tone: string;
  themes: string[];
  ambiance: string;
  palette: { primary: string; secondary: string; accent: string; mood: string };
  visualKeywords: string[];
  targetAudience: string;
  marketingAngle: string;
  comparisons: string[]; // "Si vous avez aimé X..."
  oneLinePitch: string;
  backCoverHook: string;
  hashTags: string[];
}

export interface MarketingKit {
  instagramCaption: string;
  instagramStoryText: string;
  linkedinPost: string;
  newsletterBlurb: string;
  tweetThread: string[];
  pressRelease: string;
}

export interface TrailerScript {
  duration: number; // seconds
  scenes: { timestamp: number; visual: string; voiceOver: string; text: string }[];
  musicMood: string;
  closingCTA: string;
}

export interface CoverBrief {
  style: string;
  composition: string;
  typography: { titleFont: string; authorFont: string; placement: string };
  palette: { bg: string; title: string; accent: string };
  references: string[];
  genreConventions: string;
  thumbnailTest: string; // Ce qui doit être lisible en miniature Amazon
  promptMidjourney: string;
  promptDalle: string;
}

export interface AudiobookPlan {
  totalChapters: number;
  estimatedDuration: number; // minutes
  voiceProfile: string;
  pacing: string;
  specialInstructions: string[];
  chapterBreakdown: { chapter: string; estimatedMinutes: number }[];
}

export type EngineType = 'brief' | 'marketing' | 'trailer' | 'cover' | 'audiobook';

export interface EngineResult<T = unknown> {
  engine: EngineType;
  projectId: number;
  timestamp: string;
  result: T;
  tokensUsed?: number;
}

// ── Genre-specific knowledge base ──

const GENRE_KNOWLEDGE: Record<string, {
  tones: string[];
  audiences: string[];
  coverStyles: string[];
  marketingAngles: string[];
  comparables: string[];
}> = {
  'Roman': {
    tones: ['intimiste', 'contemplatif', 'lyrique', 'engagé', 'mélancolique'],
    audiences: ['Lecteurs de littérature contemporaine, 30-55 ans', 'Amateurs de fiction française'],
    coverStyles: ['Minimaliste typographique', 'Photo artistique floue', 'Illustration abstraite', 'Paysage évocateur'],
    marketingAngles: ['Profondeur émotionnelle', 'Voyage intérieur', 'Réflexion sur la condition humaine'],
    comparables: ['Laurent Gaudé', 'Delphine de Vigan', 'Sylvain Tesson', 'Leïla Slimani'],
  },
  'Essai': {
    tones: ['analytique', 'visionnaire', 'accessible', 'engagé', 'didactique'],
    audiences: ['Lecteurs non-fiction, cadres, étudiants', 'Curieux des enjeux contemporains'],
    coverStyles: ['Typo forte sur fond uni', 'Graphisme conceptuel', 'Photo documentaire'],
    marketingAngles: ['Expertise de l\'auteur', 'Pertinence du sujet', 'Nouveau regard'],
    comparables: ['Edgar Morin', 'Yuval Noah Harari', 'Bruno Latour'],
  },
  'Jeunesse': {
    tones: ['bienveillant', 'ludique', 'rassurant', 'pédagogique'],
    audiences: ['Enfants 6-12 ans', 'Parents et éducateurs'],
    coverStyles: ['Illustration colorée', 'Aquarelle douce', 'Personnage central expressif'],
    marketingAngles: ['Aide à l\'enfant', 'Outil pédagogique', 'Moment de partage parent-enfant'],
    comparables: ['Collection "Max et Lili"', 'Françoise Dolto jeunesse'],
  },
  'BD': {
    tones: ['visuel', 'cinématographique', 'immersif'],
    audiences: ['Lecteurs BD/graphic novel, 15-45 ans', 'Amateurs d\'art séquentiel'],
    coverStyles: ['Case emblématique', 'Illustration pleine page', 'Composition dynamique'],
    marketingAngles: ['Force visuelle', 'Narration graphique', 'Univers singulier'],
    comparables: ['Bastien Vivès', 'Riad Sattouf', 'Marjane Satrapi'],
  },
  'Poésie': {
    tones: ['contemplatif', 'musical', 'fragmentaire', 'dense'],
    audiences: ['Amateurs de poésie contemporaine', 'Lecteurs de littérature exigeante'],
    coverStyles: ['Épuré, beaucoup de blanc', 'Typo soignée seule', 'Œuvre d\'art abstraite'],
    marketingAngles: ['Beauté de la langue', 'Expérience de lecture unique'],
    comparables: ['Christian Bobin', 'Adonis', 'Ocean Vuong'],
  },
};

// ── Color palettes by mood ──

const MOOD_PALETTES: Record<string, { primary: string; secondary: string; accent: string }> = {
  'sombre': { primary: '#1A1A2E', secondary: '#16213E', accent: '#E94560' },
  'lumineux': { primary: '#FEFEFE', secondary: '#F0E6D3', accent: '#D4A574' },
  'mélancolique': { primary: '#2C3E50', secondary: '#8E9AAF', accent: '#CBC0D3' },
  'chaleureux': { primary: '#8D6E63', secondary: '#D7CCC8', accent: '#FF8A65' },
  'mystérieux': { primary: '#212121', secondary: '#4A148C', accent: '#CE93D8' },
  'poétique': { primary: '#ECEFF1', secondary: '#B0BEC5', accent: '#5C6BC0' },
  'enfantin': { primary: '#FFF8E1', secondary: '#FFECB3', accent: '#FF7043' },
  'engagé': { primary: '#B71C1C', secondary: '#212121', accent: '#FAFAFA' },
};

// ── Engine 1: Creative Brief Generator ──

export function generateCreativeBrief(project: {
  title: string;
  genre: string;
  pages: number;
  backCover?: string;
  collection?: string;
}): CreativeBrief {
  const knowledge = GENRE_KNOWLEDGE[project.genre] || GENRE_KNOWLEDGE['Roman'];
  const backCover = project.backCover || '';

  // Analyze back cover for themes
  const themeKeywords: Record<string, string[]> = {
    'identité': ['identité', 'qui suis-je', 'origines', 'racines', 'appartenance'],
    'résilience': ['résilience', 'surmonter', 'épreuve', 'reconstruire', 'se relever', 'traverser'],
    'mémoire': ['mémoire', 'souvenir', 'passé', 'héritage', 'transmission', 'oubli'],
    'amour': ['amour', 'passion', 'désir', 'cœur', 'sentiment', 'tendresse'],
    'deuil': ['deuil', 'perte', 'absence', 'mort', 'disparition', 'manque'],
    'nature': ['nature', 'mer', 'montagne', 'forêt', 'terre', 'océan', 'paysage'],
    'pouvoir': ['pouvoir', 'domination', 'résistance', 'liberté', 'oppression'],
    'enfance': ['enfant', 'enfance', 'grandir', 'innocence', 'jeu', 'école'],
    'voyage': ['voyage', 'chemin', 'route', 'partir', 'découvrir', 'horizon'],
    'transformation': ['transformation', 'changement', 'mutation', 'devenir', 'évolution'],
  };

  const detectedThemes: string[] = [];
  const lowerBack = backCover.toLowerCase();
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(k => lowerBack.includes(k))) detectedThemes.push(theme);
  }
  if (detectedThemes.length === 0) detectedThemes.push('condition humaine', 'introspection');

  // Determine mood
  const darkWords = ['sombre', 'nuit', 'ombre', 'douleur', 'mort', 'peur', 'silence', 'froid'];
  const lightWords = ['lumière', 'espoir', 'soleil', 'joie', 'rire', 'doux', 'chaleur', 'printemps'];
  const darkScore = darkWords.filter(w => lowerBack.includes(w)).length;
  const lightScore = lightWords.filter(w => lowerBack.includes(w)).length;
  const mood = project.genre === 'Jeunesse' ? 'enfantin' : project.genre === 'Essai' ? 'engagé'
    : darkScore > lightScore + 2 ? 'sombre' : lightScore > darkScore + 2 ? 'lumineux'
    : darkScore > lightScore ? 'mélancolique' : 'chaleureux';

  const palette = MOOD_PALETTES[mood] || MOOD_PALETTES['chaleureux'];

  // Generate visual keywords from title + back cover
  const titleWords = project.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const visualKeywords = [...new Set([...titleWords, ...detectedThemes.slice(0, 3)])].slice(0, 8);

  // Marketing angle
  const angle = knowledge.marketingAngles[Math.floor(detectedThemes.length % knowledge.marketingAngles.length)] || knowledge.marketingAngles[0];

  // Hashtags
  const baseHashtags = ['#NouveauRoman', '#LittératureFrançaise', '#JabriliaEditions', '#Lecture'];
  const genreHashtags: Record<string, string[]> = {
    'Roman': ['#RomanContemporain', '#Fiction', '#BookstagramFR'],
    'Essai': ['#Essai', '#NonFiction', '#Réflexion'],
    'Jeunesse': ['#LivreJeunesse', '#LectureEnfant', '#ÉducationPositive'],
    'BD': ['#BDFrançaise', '#GraphicNovel', '#BandeDessinée'],
    'Poésie': ['#Poésie', '#PoésieContemporaine', '#Vers'],
  };

  return {
    title: project.title,
    genre: project.genre,
    tone: knowledge.tones[detectedThemes.length % knowledge.tones.length] || 'intimiste',
    themes: detectedThemes,
    ambiance: mood,
    palette: { ...palette, mood },
    visualKeywords,
    targetAudience: knowledge.audiences[0],
    marketingAngle: angle,
    comparisons: knowledge.comparables.slice(0, 2),
    oneLinePitch: backCover.length > 50 ? backCover.split(/[.!?]/)[0].trim() + '.' : `Un ${project.genre.toLowerCase()} signé Steve Moradel.`,
    backCoverHook: backCover.length > 100 ? backCover.slice(0, 150).trim() + '…' : backCover,
    hashTags: [...(genreHashtags[project.genre] || []), ...baseHashtags].slice(0, 8),
  };
}

// ── Engine 2: Marketing Kit Generator ──

export function generateMarketingKit(brief: CreativeBrief): MarketingKit {
  const themes = brief.themes.slice(0, 3).join(', ');
  const comparisons = brief.comparisons.length > 0 ? `Pour les lecteurs de ${brief.comparisons.join(' et ')}.` : '';

  return {
    instagramCaption: `${brief.oneLinePitch}\n\n${brief.backCoverHook}\n\n${comparisons}\n\n${brief.hashTags.join(' ')}`,

    instagramStoryText: `NOUVEAU\n\n« ${brief.title} »\nSteve Moradel\n\n${brief.oneLinePitch}\n\nDisponible maintenant`,

    linkedinPost: `📖 ${brief.title} — Steve Moradel\n\nThèmes : ${themes}\n\n${brief.backCoverHook}\n\n${brief.marketingAngle}. Un texte qui explore ${brief.themes[0] || 'la condition humaine'} avec la profondeur et la poésie qui caractérisent l'écriture de Steve Moradel.\n\n${comparisons}\n\nÉditions Jabrilia · ${brief.genre}\n\n${brief.hashTags.slice(0, 5).join(' ')}`,

    newsletterBlurb: `Cher(e) lecteur/lectrice,\n\nJ'ai le plaisir de vous annoncer la sortie de « ${brief.title} ».\n\n${brief.backCoverHook}\n\nCe ${brief.genre.toLowerCase()} aborde ${themes} — des thèmes qui me tiennent profondément à cœur.\n\n${brief.marketingAngle}.\n\nJ'espère qu'il trouvera sa place dans votre bibliothèque.\n\nLittérairement,\nSteve Moradel`,

    tweetThread: [
      `📖 « ${brief.title} » — maintenant disponible. ${brief.oneLinePitch}`,
      `Thèmes : ${themes}. ${brief.marketingAngle}.`,
      `${comparisons} Éditions Jabrilia. ${brief.hashTags.slice(0, 4).join(' ')}`,
    ],

    pressRelease: `COMMUNIQUÉ DE PRESSE\n\nParution : « ${brief.title} » de Steve Moradel\nÉditeur : Jabrilia Éditions\nGenre : ${brief.genre}\n\n${brief.backCoverHook}\n\nÀ PROPOS DE L'AUTEUR\nSteve Moradel est écrivain, stratège et enseignant. Chevalier de l'Ordre National du Mérite, Prix de l'Africanité 2024, il poursuit une œuvre littéraire explorant les transformations du monde contemporain.\n\nCONTACT PRESSE\nJabrilia Éditions — contact@jabrilia.com`,
  };
}

// ── Engine 3: Trailer Script Generator ──

export function generateTrailerScript(brief: CreativeBrief, pages: number): TrailerScript {
  const duration = 45; // seconds
  const mood = brief.ambiance;

  const musicMoods: Record<string, string> = {
    'sombre': 'Piano lent, cordes graves, atmosphère tendue',
    'lumineux': 'Piano doux, cordes légères, harpe',
    'mélancolique': 'Violoncelle solo, piano minimal, réverbération',
    'chaleureux': 'Guitare acoustique, piano chaleureux',
    'mystérieux': 'Synthé atmosphérique, nappes, tension croissante',
    'enfantin': 'Xylophone, ukulélé, percussions douces',
    'engagé': 'Percussion tribale, basse profonde, montée en puissance',
  };

  // Extract first powerful sentence from back cover
  const hookSentence = brief.backCoverHook.split(/[.!?]/)[0]?.trim() || brief.oneLinePitch;

  return {
    duration,
    scenes: [
      { timestamp: 0, visual: `Fondu noir → texte blanc: « ${brief.themes[0]?.toUpperCase() || brief.genre.toUpperCase()} »`, voiceOver: '', text: brief.themes[0] || '' },
      { timestamp: 5, visual: `Image d'ambiance ${mood} — ${brief.visualKeywords.slice(0, 3).join(', ')}`, voiceOver: hookSentence, text: '' },
      { timestamp: 15, visual: `Transition — mots-clés apparaissent: ${brief.themes.slice(0, 3).join(' · ')}`, voiceOver: brief.oneLinePitch, text: '' },
      { timestamp: 25, visual: 'Couverture du livre — zoom lent', voiceOver: '', text: `« ${brief.title} »\nSteve Moradel` },
      { timestamp: 35, visual: 'Logo Jabrilia Éditions + disponibilité', voiceOver: `${brief.title}. Disponible maintenant.`, text: 'Jabrilia Éditions' },
    ],
    musicMood: musicMoods[mood] || musicMoods['mélancolique'],
    closingCTA: `Disponible en librairie et sur les plateformes numériques.\njabrilia.com`,
  };
}

// ── Engine 4: Cover Brief Generator ──

export function generateCoverBrief(brief: CreativeBrief, collection?: string): CoverBrief {
  const knowledge = GENRE_KNOWLEDGE[brief.genre] || GENRE_KNOWLEDGE['Roman'];
  const style = knowledge.coverStyles[0];

  // Collection-specific guidance
  const collectionStyles: Record<string, { font: string; placement: string }> = {
    'Plume Noire': { font: 'Serif élégant (Cormorant Garamond)', placement: 'Titre haut, auteur bas' },
    'Horizons': { font: 'Sans-serif moderne (Montserrat)', placement: 'Titre centré, auteur sous le titre' },
    'Éclats': { font: 'Serif classique (Playfair Display)', placement: 'Titre bas, visuel dominant' },
    'Mondes Illustrés': { font: 'Display créatif', placement: 'Intégré à l\'illustration' },
    'Racines': { font: 'Serif organique (EB Garamond)', placement: 'Titre haut avec filet décoratif' },
  };

  const colStyle = collection ? collectionStyles[collection] : null;

  const moodToStyle: Record<string, string> = {
    'sombre': 'Contraste élevé, ombres profondes, typo blanche sur fond sombre',
    'lumineux': 'Tons clairs, beaucoup d\'espace blanc, typo dorée ou sépia',
    'mélancolique': 'Tons froids désaturés, brume, flou artistique',
    'chaleureux': 'Tons terre et ocre, lumière dorée, texture papier',
    'mystérieux': 'Clair-obscur, reflets, éléments partiellement cachés',
    'enfantin': 'Couleurs vives, formes rondes, illustration figurative',
    'engagé': 'Typo forte, couleurs saturées, composition graphique',
  };

  const themes = brief.themes.join(', ');
  const visualDesc = brief.visualKeywords.join(', ');

  return {
    style,
    composition: moodToStyle[brief.ambiance] || moodToStyle['chaleureux'],
    typography: {
      titleFont: colStyle?.font || 'Serif classique (Cormorant Garamond)',
      authorFont: 'Petites capitales, même famille',
      placement: colStyle?.placement || 'Titre tiers supérieur, auteur bas',
    },
    palette: {
      bg: brief.palette.primary,
      title: brief.palette.accent,
      accent: brief.palette.secondary,
    },
    references: knowledge.comparables.map(a => `Couvertures de ${a}`),
    genreConventions: `${brief.genre} français : ${style}. Thèmes : ${themes}.`,
    thumbnailTest: `Le titre « ${brief.title} » et le nom « Steve Moradel » doivent être lisibles en 80×120 px (miniature Amazon).`,
    promptMidjourney: `Book cover, ${brief.genre.toLowerCase()}, ${visualDesc}, ${brief.ambiance} mood, ${brief.palette.mood} color palette, editorial design, minimalist, professional, no text --ar 2:3 --s 750`,
    promptDalle: `Professional book cover design for a French ${brief.genre.toLowerCase()} novel. Mood: ${brief.ambiance}. Visual elements: ${visualDesc}. Style: ${style}. Color palette: ${brief.palette.mood}. No text on the image. High quality editorial design.`,
  };
}

// ── Engine 5: Audiobook Plan Generator ──

export function generateAudiobookPlan(project: {
  title: string;
  genre: string;
  pages: number;
  backCover?: string;
}): AudiobookPlan {
  const minutesPerPage = project.genre === 'BD' ? 0.5 : project.genre === 'Poésie' ? 2.5 : 1.5;
  const estimatedDuration = Math.round(project.pages * minutesPerPage);
  const chaptersEstimate = Math.max(1, Math.round(project.pages / 20));

  const voiceProfiles: Record<string, string> = {
    'Roman': 'Narrateur littéraire — voix grave posée, rythme varié, pauses dramatiques',
    'Essai': 'Voix didactique — claire, articulée, rythme régulier, ton engagé',
    'Jeunesse': 'Voix chaleureuse — expressive, rythme dynamique, intonations variées',
    'BD': 'Multi-voix recommandé — narrateur + personnages distincts',
    'Poésie': 'Voix contemplative — lente, musicale, silences significatifs',
  };

  const pacing: Record<string, string> = {
    'Roman': '150-160 mots/min — ralentir dans les passages introspectifs, accélérer dans les dialogues',
    'Essai': '160-170 mots/min — rythme régulier, pauses entre les concepts',
    'Jeunesse': '130-140 mots/min — rythme lent, articulé, pauses fréquentes',
    'Poésie': '100-120 mots/min — respecter les blancs, les retours à la ligne',
  };

  const chapters: { chapter: string; estimatedMinutes: number }[] = [];
  chapters.push({ chapter: 'Opening Credits', estimatedMinutes: 0.5 });
  for (let i = 1; i <= chaptersEstimate; i++) {
    chapters.push({ chapter: `Chapitre ${i}`, estimatedMinutes: Math.round(estimatedDuration / chaptersEstimate) });
  }
  chapters.push({ chapter: 'Closing Credits', estimatedMinutes: 0.5 });

  return {
    totalChapters: chaptersEstimate,
    estimatedDuration,
    voiceProfile: voiceProfiles[project.genre] || voiceProfiles['Roman'],
    pacing: pacing[project.genre] || pacing['Roman'],
    specialInstructions: [
      'Normalisation : -14 LUFS intégrés (standard ACX)',
      'Bruit de fond : ≤ -60 dB',
      'Peak : ≤ -3 dB',
      'Silence entre chapitres : 3 secondes',
      'Silence entre sections : 1 seconde',
      'Format export : MP3 192kbps CBR mono 44.1kHz',
      'Métadonnées ID3 : titre, auteur, numéro de chapitre',
    ],
    chapterBreakdown: chapters,
  };
}

// ── Orchestrator: run full pipeline ──

export interface FullPipelineResult {
  brief: CreativeBrief;
  marketing: MarketingKit;
  trailer: TrailerScript;
  cover: CoverBrief;
  audiobook: AudiobookPlan;
  timestamp: string;
}

export function runFullPipeline(project: {
  title: string;
  genre: string;
  pages: number;
  backCover?: string;
  collection?: string;
}): FullPipelineResult {
  // Engine 1: Brief (feeds all others)
  const brief = generateCreativeBrief(project);

  // Engine 2: Marketing (from brief)
  const marketing = generateMarketingKit(brief);

  // Engine 3: Trailer (from brief + pages)
  const trailer = generateTrailerScript(brief, project.pages);

  // Engine 4: Cover (from brief + collection)
  const cover = generateCoverBrief(brief, project.collection);

  // Engine 5: Audiobook (from project)
  const audiobook = generateAudiobookPlan(project);

  return {
    brief,
    marketing,
    trailer,
    cover,
    audiobook,
    timestamp: new Date().toISOString(),
  };
}
