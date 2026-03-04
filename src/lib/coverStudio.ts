// ═══════════════════════════════════════════════════════════════════
// JABR — Cover Studio Engine
// From blank image to print-ready cover + marketing pack
// ═══════════════════════════════════════════════════════════════════

import { type Distributor, DISTRIBUTORS, calculateCoverDimensions, type CoverDimensions } from './coverSpecs';
import { type PublisherCharter, type CollectionSpec, getCoverTypoRecommendation } from './publisherCharter';

// ═══════════════════════════════════
// TYPES
// ═══════════════════════════════════

export type CoverStudioStep = 'upload' | 'audit' | 'assemble' | 'marketing' | 'trailer' | 'export';

export interface CoverProject {
  // Book info
  title: string;
  subtitle?: string;
  author: string;
  genre: string;
  collection?: string;
  pages: number;
  isbn?: string;
  price?: string;
  backCoverText?: string;
  publisherName: string;
  // Cover image
  coverImageUrl?: string;        // uploaded or AI-generated
  coverImageSource?: 'upload' | 'dalle' | 'midjourney' | 'manual';
  // Distributor
  distributor: Distributor;
  trimSizeKey: string;
  paperGSM: number;
}

// What elements are placed on the cover
export interface CoverLayout {
  // Front cover (C1)
  front: {
    title: { text: string; fontFamily: string; sizePt: number; color: string; x: number; y: number; align: string };
    subtitle?: { text: string; fontFamily: string; sizePt: number; color: string; x: number; y: number; align: string };
    author: { text: string; fontFamily: string; sizePt: number; color: string; x: number; y: number; align: string };
    genre?: { text: string; fontFamily: string; sizePt: number; color: string; x: number; y: number; align: string };
    publisherLogo: { x: number; y: number; widthMm: number };
    collection?: { text: string; fontFamily: string; sizePt: number; color: string; x: number; y: number };
  };
  // Spine
  spine: {
    title?: { text: string; fontFamily: string; sizePt: number; color: string };
    author?: { text: string; fontFamily: string; sizePt: number; color: string };
    publisherLogo?: boolean;
    canHaveText: boolean;
    widthMm: number;
  };
  // Back cover (C4)
  back: {
    backText: { text: string; fontFamily: string; sizePt: number; color: string; x: number; y: number; maxWidthMm: number };
    isbn: { text: string; fontFamily: string; sizePt: number; color: string; x: number; y: number };
    barcode: { x: number; y: number; widthMm: number; heightMm: number };
    price: { text: string; fontFamily: string; sizePt: number; color: string; x: number; y: number };
    depotLegal?: { text: string; fontFamily: string; sizePt: number; color: string; x: number; y: number };
    publisherName: { text: string; fontFamily: string; sizePt: number; color: string; x: number; y: number };
    legalNotice?: { text: string; fontFamily: string; sizePt: number; color: string; x: number; y: number };
  };
  // Dimensions
  dimensions: CoverDimensions;
}

// Social media asset format
export interface SocialAsset {
  id: string;
  label: string;
  platform: string;
  widthPx: number;
  heightPx: number;
  description: string;
  layout: 'cover-centered' | 'cover-left' | 'quote-overlay' | 'announcement';
}

// Trailer brief
export interface TrailerBrief {
  duration: number; // seconds
  musicMood: string;
  colorGrading: string;
  scenes: {
    order: number;
    durationSec: number;
    visual: string;      // prompt for Runway
    text?: string;        // overlay text
    transition: string;
  }[];
  endCard: {
    title: string;
    author: string;
    releaseDate?: string;
    buyLink?: string;
  };
}

// ═══════════════════════════════════
// SOCIAL MEDIA FORMATS
// ═══════════════════════════════════

export const SOCIAL_FORMATS: SocialAsset[] = [
  { id: 'ig-post', label: 'Instagram Post', platform: 'Instagram', widthPx: 1080, heightPx: 1080, description: 'Carré 1:1', layout: 'cover-centered' },
  { id: 'ig-story', label: 'Instagram Story', platform: 'Instagram', widthPx: 1080, heightPx: 1920, description: '9:16 vertical', layout: 'cover-centered' },
  { id: 'ig-reel-cover', label: 'Cover Reel', platform: 'Instagram', widthPx: 1080, heightPx: 1350, description: '4:5 portrait', layout: 'cover-left' },
  { id: 'fb-post', label: 'Facebook Post', platform: 'Facebook', widthPx: 1200, heightPx: 630, description: '1.91:1 paysage', layout: 'cover-left' },
  { id: 'fb-cover', label: 'Bannière Facebook', platform: 'Facebook', widthPx: 820, heightPx: 312, description: 'Bannière page', layout: 'cover-left' },
  { id: 'x-post', label: 'Post X/Twitter', platform: 'X', widthPx: 1200, heightPx: 675, description: '16:9', layout: 'cover-left' },
  { id: 'linkedin', label: 'LinkedIn Post', platform: 'LinkedIn', widthPx: 1200, heightPx: 627, description: '1.91:1', layout: 'cover-left' },
  { id: 'tiktok', label: 'TikTok Cover', platform: 'TikTok', widthPx: 1080, heightPx: 1920, description: '9:16', layout: 'cover-centered' },
  { id: 'newsletter', label: 'Bannière Newsletter', platform: 'Email', widthPx: 600, heightPx: 300, description: '2:1 email', layout: 'cover-left' },
  { id: 'amazon-a+', label: 'Amazon A+ Content', platform: 'Amazon', widthPx: 970, heightPx: 600, description: 'Module A+', layout: 'cover-left' },
  { id: 'mockup-3d', label: 'Mockup 3D', platform: 'Tous', widthPx: 1200, heightPx: 1200, description: 'Rendu 3D du livre', layout: 'cover-centered' },
  { id: 'bookmark', label: 'Marque-page', platform: 'Print', widthPx: 600, heightPx: 1800, description: '50 × 150 mm @300dpi', layout: 'cover-centered' },
];

// ═══════════════════════════════════
// COVER LAYOUT GENERATOR
// ═══════════════════════════════════

export function generateCoverLayout(
  project: CoverProject,
  charter: PublisherCharter
): CoverLayout {
  const dimensions = calculateCoverDimensions(
    project.trimSizeKey,
    project.pages,
    project.distributor,
    'white',
    project.paperGSM
  );

  const typo = getCoverTypoRecommendation(project.genre, project.collection, charter);
  const col = typo.collection;
  const dist = DISTRIBUTORS[project.distributor];

  const trimW = dimensions.trimWidthMm;
  const trimH = dimensions.trimHeightMm;
  const safety = dimensions.textSafetyMm;

  // Front cover positioning
  const frontCenterX = trimW / 2;
  const frontLayout = {
    title: {
      text: project.title,
      fontFamily: typo.title.fontFamily,
      sizePt: typo.title.sizePt,
      color: typo.title.color,
      x: frontCenterX,
      y: trimH * 0.38, // ~38% from top
      align: typo.title.alignment,
    },
    subtitle: project.subtitle ? {
      text: project.subtitle,
      fontFamily: typo.title.fontFamily,
      sizePt: typo.title.sizePt * 0.6,
      color: typo.title.color,
      x: frontCenterX,
      y: trimH * 0.48,
      align: typo.title.alignment,
    } : undefined,
    author: {
      text: project.author,
      fontFamily: typo.author.fontFamily,
      sizePt: typo.author.sizePt,
      color: typo.author.color,
      x: frontCenterX,
      y: trimH * 0.15, // top area
      align: charter.coverRules.authorPosition === 'top' ? 'center' : 'center',
    },
    genre: project.collection ? {
      text: project.collection,
      fontFamily: typo.author.fontFamily,
      sizePt: 9,
      color: col.palette.muted,
      x: frontCenterX,
      y: trimH * 0.55,
      align: 'center',
    } : undefined,
    publisherLogo: {
      x: frontCenterX,
      y: trimH - safety - 15, // 15mm from bottom safe zone
      widthMm: 20,
    },
    collection: project.collection ? {
      text: project.collection,
      fontFamily: typo.author.fontFamily,
      sizePt: 8,
      color: col.palette.muted,
      x: frontCenterX,
      y: trimH * 0.90,
    } : undefined,
  };

  // Spine
  const spineLayout = {
    title: dimensions.canHaveSpineText ? {
      text: project.title.length > 30 ? project.title.slice(0, 28) + '…' : project.title,
      fontFamily: typo.title.fontFamily,
      sizePt: Math.min(9, dimensions.spineWidthMm * 0.35 * 2.83), // fit to spine
      color: typo.title.color,
    } : undefined,
    author: dimensions.canHaveSpineText ? {
      text: project.author,
      fontFamily: typo.author.fontFamily,
      sizePt: Math.min(7, dimensions.spineWidthMm * 0.25 * 2.83),
      color: typo.author.color,
    } : undefined,
    publisherLogo: charter.coverRules.publisherLogoOnSpine && dimensions.canHaveSpineText,
    canHaveText: dimensions.canHaveSpineText,
    widthMm: dimensions.spineWidthMm,
  };

  // Back cover positioning
  const backCenterX = trimW / 2;
  const barcodePos = charter.coverRules.barcodePosition;
  const barcodeX = barcodePos === 'bottom-right' ? trimW - safety - dist.barcodeMinWidthMm
    : barcodePos === 'bottom-left' ? safety
    : (trimW - dist.barcodeMinWidthMm) / 2;

  const backLayout = {
    backText: {
      text: project.backCoverText || '[Texte de 4e de couverture à rédiger]',
      fontFamily: typo.backText.fontFamily,
      sizePt: typo.backText.sizePt,
      color: typo.backText.color,
      x: safety + 2,
      y: safety + 15,
      maxWidthMm: trimW - (safety + 2) * 2,
    },
    isbn: {
      text: project.isbn || '978-2-488647-XX-X',
      fontFamily: "'JetBrains Mono', monospace",
      sizePt: 8,
      color: '#333333',
      x: barcodeX,
      y: trimH - safety - dist.barcodeMinHeightMm - 12,
    },
    barcode: {
      x: barcodeX,
      y: trimH - safety - dist.barcodeMinHeightMm - 5,
      widthMm: dist.barcodeMinWidthMm,
      heightMm: dist.barcodeMinHeightMm,
    },
    price: {
      text: project.price || '€ XX,XX',
      fontFamily: "'JetBrains Mono', monospace",
      sizePt: 9,
      color: '#333333',
      x: barcodeX + dist.barcodeMinWidthMm + 3,
      y: trimH - safety - dist.barcodeMinHeightMm + 5,
    },
    depotLegal: project.distributor === 'pollen' ? {
      text: `Dépôt légal : ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
      fontFamily: typo.backText.fontFamily,
      sizePt: 7,
      color: '#666666',
      x: safety + 2,
      y: trimH - safety - 8,
    } : undefined,
    publisherName: {
      text: project.publisherName,
      fontFamily: typo.author.fontFamily,
      sizePt: 8,
      color: '#666666',
      x: backCenterX,
      y: trimH - safety - dist.barcodeMinHeightMm - 25,
    },
    legalNotice: project.distributor === 'pollen' ? {
      text: 'Imprimé en France',
      fontFamily: typo.backText.fontFamily,
      sizePt: 7,
      color: '#666666',
      x: safety + 2,
      y: trimH - safety - 3,
    } : undefined,
  };

  return {
    front: frontLayout,
    spine: spineLayout,
    back: backLayout,
    dimensions,
  };
}

// ═══════════════════════════════════
// AI GENERATION PROMPTS
// ═══════════════════════════════════

export function generateCoverImagePrompt(
  project: CoverProject,
  style: 'literary' | 'commercial' | 'artistic' | 'minimalist' = 'literary'
): { midjourney: string; dalle: string } {
  const genreKeywords: Record<string, string> = {
    'Roman': 'literary fiction, evocative atmosphere, subtle symbolism',
    'Fantasy': 'epic fantasy, dramatic lighting, mythical elements',
    'Essai': 'abstract conceptual, intellectual, clean design',
    'Jeunesse': 'children illustration, warm colors, playful, inviting',
    'BD': 'comic book art, dynamic composition, rich colors',
    'Thriller': 'dark atmosphere, tension, mystery, dramatic shadows',
    'Science-fiction': 'futuristic, cosmic, technological, otherworldly',
    'Poésie': 'ethereal, delicate, watercolor, dreamlike',
  };

  const genreHint = genreKeywords[project.genre] || 'literary, evocative';

  const styleHints: Record<string, string> = {
    literary: 'editorial quality, sophisticated, subtle palette, like a Gallimard or Actes Sud cover',
    commercial: 'eye-catching, bold colors, high contrast, bestseller look, standout on shelf',
    artistic: 'painterly, textured, fine art quality, gallery-worthy, unique artistic vision',
    minimalist: 'clean, white space, elegant typography-focused, Scandinavian design aesthetic',
  };

  const base = `Book cover for "${project.title}" by ${project.author}. Genre: ${project.genre}. ${genreHint}. Style: ${styleHints[style]}. No text on the image — text will be added separately. High resolution, 300 DPI print quality.`;

  return {
    midjourney: `${base} --ar 2:3 --s 750 --q 2 --v 6.1`,
    dalle: `Create a book cover illustration for "${project.title}" by ${project.author}. ${genreHint}. ${styleHints[style]}. IMPORTANT: Do NOT include any text, title, or author name on the image. The image should be a pure visual that will have typography added on top. Professional editorial quality, suitable for print at 300 DPI.`,
  };
}

// ═══════════════════════════════════
// TRAILER BRIEF GENERATOR
// ═══════════════════════════════════

export function generateTrailerBrief(
  project: CoverProject,
  durationSec: number = 15
): TrailerBrief {
  const genreMoods: Record<string, { music: string; grading: string }> = {
    'Roman': { music: 'piano doux, cordes subtiles, mélancolique', grading: 'tons chauds, grain cinéma' },
    'Fantasy': { music: 'orchestre épique, percussions, cuivres', grading: 'contrastes forts, teintes dorées' },
    'Essai': { music: 'ambient minimaliste, nappes synthétiques', grading: 'noir et blanc avec accents couleur' },
    'Jeunesse': { music: 'ukulélé, glockenspiel, joyeux', grading: 'couleurs vives et chaudes, lumineux' },
    'BD': { music: 'guitare électrique, énergique', grading: 'saturé, pop art' },
    'Thriller': { music: 'basses profondes, tension, silence', grading: 'désaturé, ombres dures, bleu acier' },
  };

  const mood = genreMoods[project.genre] || genreMoods['Roman'];
  const sceneCount = Math.max(3, Math.floor(durationSec / 4));
  const sceneDuration = durationSec / (sceneCount + 1); // +1 for end card

  const scenes: TrailerBrief['scenes'] = [];

  // Scene 1: Atmospheric opening
  scenes.push({
    order: 1,
    durationSec: sceneDuration,
    visual: `Slow camera pan across an atmospheric scene related to "${project.title}". ${project.genre} mood. Cinematic, 24fps, shallow depth of field.`,
    text: project.author,
    transition: 'fade-in',
  });

  // Scene 2: Theme visual
  scenes.push({
    order: 2,
    durationSec: sceneDuration,
    visual: `Key thematic visual for "${project.title}" — evoke the central emotion of the book. ${mood.grading}. Slow dolly movement.`,
    transition: 'cross-dissolve',
  });

  // Scene 3+: Additional atmosphere
  for (let i = 3; i <= sceneCount; i++) {
    scenes.push({
      order: i,
      durationSec: sceneDuration,
      visual: `Scene ${i} — building tension or emotion. Close-up detail shot related to "${project.title}". ${mood.grading}.`,
      text: i === sceneCount ? `"${project.backCoverText?.slice(0, 80) || project.title}"` : undefined,
      transition: 'cross-dissolve',
    });
  }

  return {
    duration: durationSec,
    musicMood: mood.music,
    colorGrading: mood.grading,
    scenes,
    endCard: {
      title: project.title,
      author: project.author,
      releaseDate: undefined,
      buyLink: undefined,
    },
  };
}

// ═══════════════════════════════════
// MARKETING TEXT GENERATOR
// ═══════════════════════════════════

export interface MarketingTexts {
  instagramCaption: string;
  linkedinPost: string;
  tweetThread: string[];
  newsletterBlurb: string;
  pressRelease: string;
  hashtags: string[];
  oneLiner: string;
}

export function generateMarketingTexts(project: CoverProject): MarketingTexts {
  const hashtags = [
    '#NouveauLivre', '#LittératureFrançaise',
    `#${project.genre.replace(/\s/g, '')}`,
    `#${project.publisherName.replace(/\s/g, '')}`,
    '#LivresDuMois', '#BookstagramFR',
  ];

  return {
    instagramCaption: `📖 "${project.title}" — ${project.author}\n\n[Texte d'accroche à personnaliser avec Claude]\n\n${project.price ? `${project.price} — ` : ''}Disponible en librairie et en ligne.\n\n${hashtags.join(' ')}`,
    linkedinPost: `🔖 Parution | "${project.title}" de ${project.author}\n\n[Description professionnelle à générer avec Claude — contextualiser par rapport aux thèmes du livre et au parcours de l'auteur]\n\nÉdité par ${project.publisherName}.`,
    tweetThread: [
      `📖 "${project.title}" de ${project.author} — [accroche] ${hashtags.slice(0, 3).join(' ')}`,
      `[Citation ou extrait marquant du livre — à rédiger]`,
      `Disponible maintenant. ${project.price || ''} — En librairie et en ligne.`,
    ],
    newsletterBlurb: `Cher(e) lecteur/lectrice,\n\nJ'ai le plaisir de vous annoncer la parution de "${project.title}".\n\n[Résumé personnel et intime — à rédiger avec Claude]\n\n${project.price ? `Prix : ${project.price}` : ''}`,
    pressRelease: `COMMUNIQUÉ DE PRESSE\n\n${project.publisherName} — Nouvelle parution\n\n"${project.title}" de ${project.author}\n${project.genre} — ${project.pages} pages\n${project.isbn ? `ISBN : ${project.isbn}` : ''}\n${project.price ? `Prix public : ${project.price}` : ''}\n\n[Résumé éditorial — à générer avec Claude]\n\nContact presse : ${project.publisherName}`,
    hashtags,
    oneLiner: `"${project.title}" — ${project.author} (${project.publisherName})`,
  };
}

// ═══════════════════════════════════
// API CONFIGURATION
// ═══════════════════════════════════

export interface APIConfig {
  openai?: { apiKey: string; model: string };   // GPT-4 + DALL-E 3
  anthropic?: { apiKey: string; model: string }; // Claude for layout
  runway?: { apiKey: string };                    // Runway Gen-3
  midjourney?: { apiKey: string };                // Midjourney (via proxy)
}

// Placeholder for API calls — will be implemented when user provides keys
export async function generateCoverImage(
  prompt: string,
  config: APIConfig,
  provider: 'dalle' | 'midjourney' = 'dalle'
): Promise<{ imageUrl?: string; error?: string }> {
  if (provider === 'dalle' && config.openai?.apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openai.apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1792', // Portrait for book cover
          quality: 'hd',
        }),
      });
      const data = await response.json();
      if (data.data?.[0]?.url) {
        return { imageUrl: data.data[0].url };
      }
      return { error: data.error?.message || 'Erreur DALL-E' };
    } catch (e) {
      return { error: `Erreur réseau : ${e}` };
    }
  }
  return { error: `Clé API ${provider} non configurée` };
}

export async function generateTrailerVideo(
  brief: TrailerBrief,
  coverImageUrl: string,
  config: APIConfig
): Promise<{ videoUrl?: string; error?: string }> {
  if (!config.runway?.apiKey) {
    return { error: 'Clé API Runway non configurée' };
  }

  // Runway Gen-3 Alpha Turbo API call
  try {
    const firstScene = brief.scenes[0];
    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.runway.apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: 'gen3a_turbo',
        promptImage: coverImageUrl,
        promptText: firstScene.visual,
        duration: Math.min(brief.duration, 10), // Runway max 10s per gen
        watermark: false,
        ratio: '9:16', // Vertical for social
      }),
    });
    const data = await response.json();
    return { videoUrl: data.output?.[0] || undefined, error: data.error };
  } catch (e) {
    return { error: `Erreur Runway : ${e}` };
  }
}
