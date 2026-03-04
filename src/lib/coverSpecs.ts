// ═══════════════════════════════════════════════════════════════════
// JABR — Cover Specifications Engine
// Real specs from KDP, IngramSpark, Pollen/Imprimeur FR
// ═══════════════════════════════════════════════════════════════════

export type Distributor = 'kdp' | 'ingramspark' | 'pollen';
export type PaperColor = 'white' | 'cream';
export type InkType = 'bw' | 'color' | 'premium-color';
export type BindingType = 'paperback' | 'hardcover';

// ── Distributor Profile ──
export interface DistributorProfile {
  id: Distributor;
  name: string;
  fullName: string;
  country: string;
  // Bleed
  bleedMm: number;
  // PDF
  pdfFormat: string;
  colorProfile: string;
  minDPI: number;
  recommendedDPI: number;
  // Spine
  minPagesForSpineText: number;
  spineTextMarginMm: number; // margin on each side of spine text
  // Barcode
  barcodeRequired: boolean;
  barcodeSpec: string;
  barcodeMinWidthMm: number;
  barcodeMinHeightMm: number;
  barcodeColor: string;
  // Text safety
  textSafetyMm: number; // min distance from trim for text
  // Spine calculation
  spineFormula: 'kdp' | 'ingram' | 'french';
  // Paper thickness factors (inches for KDP/Ingram, mm for French)
  whitePageThicknessIn: number;
  creamPageThicknessIn: number;
  // Cover stock
  coverStockGSM: number;
  // Crop marks
  cropMarksRequired: boolean;
  // File format
  acceptedFormats: string[];
  // Specific notes
  notes: string[];
  // Required cover elements
  requiredElements: CoverElement[];
  // Specific rules
  specificRules: string[];
}

export interface CoverElement {
  id: string;
  label: string;
  location: 'front' | 'back' | 'spine' | 'any';
  required: boolean;
  description: string;
}

// ── Cover Dimensions Result ──
export interface CoverDimensions {
  distributor: Distributor;
  trimWidthMm: number;
  trimHeightMm: number;
  spineWidthMm: number;
  bleedMm: number;
  // Full cover (back + spine + front + bleeds)
  totalWidthMm: number;
  totalHeightMm: number;
  // In pixels at recommended DPI
  totalWidthPx: number;
  totalHeightPx: number;
  // Safe zones
  textSafetyMm: number;
  spineTextMarginMm: number;
  canHaveSpineText: boolean;
  // Barcode zone
  barcodeZone: { widthMm: number; heightMm: number; };
  // Summary for display
  summary: string[];
  warnings: string[];
}

// ── Cover Audit Result ──
export interface CoverAuditItem {
  id: string;
  label: string;
  status: 'ok' | 'missing' | 'warning';
  message: string;
  location: 'front' | 'back' | 'spine' | 'general';
  fix?: string;
}

export interface CoverAudit {
  distributor: Distributor;
  score: number;
  maxScore: number;
  items: CoverAuditItem[];
  critical: CoverAuditItem[];
  warnings: CoverAuditItem[];
  passed: CoverAuditItem[];
}

// ═══════════════════════════════════════════════════
// DISTRIBUTOR SPECS DATABASE
// ═══════════════════════════════════════════════════

const COVER_ELEMENTS_COMMON: CoverElement[] = [
  { id: 'title', label: 'Titre', location: 'front', required: true, description: 'Titre du livre, lisible et hiérarchisé' },
  { id: 'author', label: 'Nom de l\'auteur', location: 'front', required: true, description: 'Nom complet de l\'auteur' },
  { id: 'publisher_logo', label: 'Logo éditeur', location: 'front', required: false, description: 'Logo de la maison d\'édition' },
  { id: 'back_text', label: 'Texte 4e de couverture', location: 'back', required: true, description: 'Résumé ou accroche (max 250 mots)' },
  { id: 'isbn_text', label: 'ISBN imprimé', location: 'back', required: true, description: 'Numéro ISBN-13 en texte lisible' },
  { id: 'barcode_ean', label: 'Code-barres EAN-13', location: 'back', required: true, description: 'Code-barres ISBN avec EAN-13' },
  { id: 'price', label: 'Prix TTC', location: 'back', required: true, description: 'Prix de vente TTC en euros' },
  { id: 'spine_title', label: 'Titre sur le dos', location: 'spine', required: false, description: 'Titre abrégé + auteur sur la tranche' },
  { id: 'spine_publisher', label: 'Logo éditeur dos', location: 'spine', required: false, description: 'Logo ou nom éditeur sur la tranche' },
  { id: 'genre', label: 'Genre / Collection', location: 'front', required: false, description: 'Indication du genre ou de la collection' },
];

export const DISTRIBUTORS: Record<Distributor, DistributorProfile> = {
  kdp: {
    id: 'kdp',
    name: 'KDP',
    fullName: 'Amazon Kindle Direct Publishing',
    country: 'International',
    bleedMm: 3.2,
    pdfFormat: 'PDF (pas de PDF/X requis)',
    colorProfile: 'sRGB ou CMYK',
    minDPI: 300,
    recommendedDPI: 300,
    minPagesForSpineText: 79,
    spineTextMarginMm: 1.6,
    barcodeRequired: false,
    barcodeSpec: 'KDP ajoute automatiquement le code-barres',
    barcodeMinWidthMm: 50.8,
    barcodeMinHeightMm: 30,
    barcodeColor: 'Auto (ajouté par KDP)',
    textSafetyMm: 6.4,
    spineFormula: 'kdp',
    whitePageThicknessIn: 0.002252,
    creamPageThicknessIn: 0.0025,
    coverStockGSM: 220,
    cropMarksRequired: false,
    acceptedFormats: ['PDF'],
    notes: [
      'KDP place automatiquement le code-barres — ne pas en inclure un',
      'Couverture = 1 image continue (front + dos + back), centrée sur le dos',
      'Aplatir tous les calques avant export',
      'Fichier max 650 Mo',
      'Papier couverture : 80 lb (220 g/m²), brillant ou mat',
    ],
    requiredElements: [
      ...COVER_ELEMENTS_COMMON.map(e =>
        e.id === 'barcode_ean' ? { ...e, required: false, description: 'Ajouté automatiquement par KDP — ne pas inclure' } : e
      ),
    ],
    specificRules: [
      'Pas de traits de coupe, repères ou annotations',
      'Pas de contenu transparent — aplatir les calques',
      'Bordures déconseillées (variance de coupe ±3,2 mm)',
      'Variance de pliage du dos : ±3,2 mm',
      'Fond perdu obligatoire de 3,2 mm sur les 4 côtés',
      'Noir enrichi déconseillé pour texte courant',
    ],
  },

  ingramspark: {
    id: 'ingramspark',
    name: 'IngramSpark',
    fullName: 'IngramSpark / Lightning Source',
    country: 'International',
    bleedMm: 3.0,
    pdfFormat: 'PDF/X-1a:2001 ou PDF/X-3:2002',
    colorProfile: 'CMYK obligatoire (pas de RGB)',
    minDPI: 200,
    recommendedDPI: 300,
    minPagesForSpineText: 48,
    spineTextMarginMm: 2.0, // for spine > 9mm; 1mm for spine < 9mm
    barcodeRequired: true,
    barcodeSpec: 'Code-barres ISBN obligatoire, fourni dans le template IngramSpark',
    barcodeMinWidthMm: 44.45,
    barcodeMinHeightMm: 25.4,
    barcodeColor: '100% Noir (0/0/0/100 CMYK) sur fond blanc',
    textSafetyMm: 6.0,
    spineFormula: 'ingram',
    whitePageThicknessIn: 0.002252,
    creamPageThicknessIn: 0.0025,
    coverStockGSM: 220,
    cropMarksRequired: false,
    acceptedFormats: ['PDF/X-1a:2001', 'PDF/X-3:2002'],
    notes: [
      'Le code-barres DOIT être inclus — IngramSpark ne l\'ajoute pas',
      'Toutes les polices DOIVENT être embarquées',
      'Toutes les images en CMYK — aucun RGB autorisé',
      'Noir enrichi recommandé : 60C / 40M / 40Y / 100K',
      'Le template IngramSpark inclut les repères — ne pas les modifier',
      'L\'épine diffère légèrement de KDP — utiliser le calculateur IngramSpark',
    ],
    requiredElements: COVER_ELEMENTS_COMMON,
    specificRules: [
      'PDF/X-1a:2001 obligatoire — pas de PDF standard',
      'Toutes les images en CMYK, pas de RGB',
      'Polices 100% embarquées',
      'Noir enrichi : 60/40/40/100 CMYK pour aplats noirs',
      'Texte ≤24pt : utiliser 100% K uniquement',
      'Images < 200 DPI rejetées',
      'Dos > 9mm : marge de sécurité dos = 2mm chaque côté',
      'Dos < 9mm : marge de sécurité dos = 1mm chaque côté',
      'Zone code-barres : 44,45 × 25,4 mm minimum, noir 100%K sur blanc',
    ],
  },

  pollen: {
    id: 'pollen',
    name: 'Pollen',
    fullName: 'Pollen-Difpop / Imprimeur France',
    country: 'France',
    bleedMm: 2.5,
    pdfFormat: 'PDF/X-1a (Fogra39)',
    colorProfile: 'CMYK — Profil Fogra39',
    minDPI: 300,
    recommendedDPI: 300,
    minPagesForSpineText: 60, // ~5mm spine
    spineTextMarginMm: 2.0,
    barcodeRequired: true,
    barcodeSpec: 'Code-barres EAN-13 avec ISBN, 100% noir sur fond blanc',
    barcodeMinWidthMm: 40,
    barcodeMinHeightMm: 22,
    barcodeColor: '100% Noir sur fond blanc — pas de quadri',
    textSafetyMm: 5.0,
    spineFormula: 'french',
    whitePageThicknessIn: 0, // not used, we use mm
    creamPageThicknessIn: 0,
    coverStockGSM: 250,
    cropMarksRequired: true,
    acceptedFormats: ['PDF/X-1a', 'PDF haute résolution'],
    notes: [
      'Format standard français : fonds perdus 2,5 mm (pas 3,2 mm comme KDP)',
      'Traits de coupe OBLIGATOIRES (interrompus à 3mm)',
      'Profil couleur Fogra39 obligatoire',
      'Couverture : 1 fichier PDF planche (C4 + dos + C1)',
      'Intérieur : 1 fichier PDF séparé, page à page',
      'Papier couverture : 250 g/m² (vs 220 g/m² KDP)',
      'Zone tranquille : 10mm du bord pour éléments importants',
      'Bon à tirer (BAT) requis avant impression',
    ],
    requiredElements: [
      ...COVER_ELEMENTS_COMMON,
      { id: 'legal_notice', label: 'Mention légale', location: 'back', required: true, description: 'Mention "Imprimé en France" ou origine' },
      { id: 'publisher_name', label: 'Nom éditeur', location: 'back', required: true, description: 'Nom complet de la maison d\'édition' },
      { id: 'depot_legal', label: 'Dépôt légal', location: 'back', required: true, description: 'Mention "Dépôt légal : [mois] [année]"' },
    ],
    specificRules: [
      'PDF/X-1a avec profil Fogra39',
      'Fonds perdus : 2,5 mm sur les 4 côtés',
      'Traits de coupe obligatoires (interrompus à 3mm de l\'intersection)',
      'CMYK uniquement — aucun RGB',
      'Code-barres : noir 100%K sur fond blanc, jamais en quadri',
      'Dos < 5mm : aucun texte sur la tranche',
      'Zone tranquille : 10mm minimum pour éléments importants',
      'Prix TTC obligatoire sur la 4e de couverture',
      'ISBN + EAN-13 obligatoires pour distribution librairie',
      'Mention dépôt légal obligatoire',
      'Papier couverture standard : 250 g/m² couché mat ou brillant',
    ],
  },
};

// ═══════════════════════════════════════════════════
// SPINE CALCULATION ENGINE
// ═══════════════════════════════════════════════════

// French standard paper thicknesses (mm per page, recto-verso = 1 feuille = 2 pages)
const FR_PAPER_THICKNESS_MM: Record<string, number> = {
  // grammage → épaisseur par feuille (2 pages) en mm
  '80': 0.106,   // 80 g/m² offset blanc — standard roman
  '90': 0.120,   // 90 g/m² offset
  '100': 0.130,  // 100 g/m²
  '115': 0.140,  // 115 g/m² couché
  '120': 0.150,  // 120 g/m²
  '150': 0.180,  // 150 g/m² couché mat
  '170': 0.200,  // 170 g/m² couché
  'bouffant80': 0.140, // Bouffant 80g (plus épais, texture)
  'bouffant90': 0.170, // Bouffant 90g — roman premium
};

export function calculateSpineWidth(
  pages: number,
  distributor: Distributor,
  paperColor: PaperColor = 'white',
  paperGSM: number = 80
): number {
  const dist = DISTRIBUTORS[distributor];

  if (dist.spineFormula === 'kdp' || dist.spineFormula === 'ingram') {
    // KDP & IngramSpark: spine = pages × thickness_per_page (in inches)
    const thicknessPerPage = paperColor === 'cream'
      ? dist.creamPageThicknessIn
      : dist.whitePageThicknessIn;
    const spineInches = pages * thicknessPerPage;
    return spineInches * 25.4; // convert to mm
  }

  if (dist.spineFormula === 'french') {
    // French: spine = (pages / 2) × thickness_per_sheet (mm)
    const key = String(paperGSM);
    const thicknessPerSheet = FR_PAPER_THICKNESS_MM[key] || FR_PAPER_THICKNESS_MM['80'];
    const sheets = pages / 2;
    return sheets * thicknessPerSheet;
  }

  return 0;
}

// ═══════════════════════════════════════════════════
// COVER DIMENSIONS CALCULATOR
// ═══════════════════════════════════════════════════

export interface TrimSize {
  label: string;
  widthMm: number;
  heightMm: number;
  category: 'standard' | 'large' | 'pocket' | 'custom';
}

export const TRIM_SIZES: Record<string, TrimSize> = {
  // French standards
  'A5': { label: 'A5 (148 × 210 mm)', widthMm: 148, heightMm: 210, category: 'standard' },
  'roman-fr': { label: 'Roman français (140 × 210 mm)', widthMm: 140, heightMm: 210, category: 'standard' },
  'poche': { label: 'Poche (110 × 178 mm)', widthMm: 110, heightMm: 178, category: 'pocket' },
  'BD': { label: 'BD (170 × 240 mm)', widthMm: 170, heightMm: 240, category: 'large' },
  'jeunesse': { label: 'Jeunesse (200 × 200 mm)', widthMm: 200, heightMm: 200, category: 'standard' },
  'A4': { label: 'A4 (210 × 297 mm)', widthMm: 210, heightMm: 297, category: 'large' },
  // International (KDP/Ingram)
  '5x8': { label: '5 × 8" (127 × 203 mm)', widthMm: 127, heightMm: 203.2, category: 'pocket' },
  '5.5x8.5': { label: '5.5 × 8.5" (140 × 216 mm)', widthMm: 139.7, heightMm: 215.9, category: 'standard' },
  '6x9': { label: '6 × 9" (152 × 229 mm)', widthMm: 152.4, heightMm: 228.6, category: 'standard' },
  '6.14x9.21': { label: '6.14 × 9.21" (156 × 234 mm)', widthMm: 156, heightMm: 234, category: 'standard' },
  '7x10': { label: '7 × 10" (178 × 254 mm)', widthMm: 177.8, heightMm: 254, category: 'large' },
  '8.5x11': { label: '8.5 × 11" (216 × 279 mm)', widthMm: 215.9, heightMm: 279.4, category: 'large' },
};

export function calculateCoverDimensions(
  trimSizeKey: string,
  pages: number,
  distributor: Distributor,
  paperColor: PaperColor = 'white',
  paperGSM: number = 80
): CoverDimensions {
  const dist = DISTRIBUTORS[distributor];
  const trim = TRIM_SIZES[trimSizeKey];

  if (!trim) throw new Error(`Trim size inconnu: ${trimSizeKey}`);

  const spineWidthMm = calculateSpineWidth(pages, distributor, paperColor, paperGSM);
  const bleed = dist.bleedMm;

  // Total cover width = bleed + back + spine + front + bleed
  const totalWidthMm = bleed + trim.widthMm + spineWidthMm + trim.widthMm + bleed;
  const totalHeightMm = bleed + trim.heightMm + bleed;

  // Convert to pixels at recommended DPI
  const mmToInch = 1 / 25.4;
  const totalWidthPx = Math.ceil(totalWidthMm * mmToInch * dist.recommendedDPI);
  const totalHeightPx = Math.ceil(totalHeightMm * mmToInch * dist.recommendedDPI);

  const canHaveSpineText = pages >= dist.minPagesForSpineText;

  // Determine spine text margin based on distributor rules
  let spineTextMargin = dist.spineTextMarginMm;
  if (distributor === 'ingramspark' && spineWidthMm < 9) {
    spineTextMargin = 1.0; // Reduced for thin spines
  }

  const warnings: string[] = [];

  if (!canHaveSpineText) {
    warnings.push(`Pas de texte autorisé sur le dos (minimum ${dist.minPagesForSpineText} pages, vous en avez ${pages})`);
  }

  if (pages < 24) {
    warnings.push('Nombre de pages très faible — vérifier les minimums du distributeur');
  }

  if (distributor === 'pollen' && spineWidthMm < 5) {
    warnings.push('Dos < 5mm — aucun texte sur la tranche recommandé par les imprimeurs français');
  }

  const summary = [
    `Format fini : ${trim.widthMm} × ${trim.heightMm} mm`,
    `Dos : ${spineWidthMm.toFixed(1)} mm (${pages} pages)`,
    `Fonds perdus : ${bleed} mm`,
    `Planche totale : ${totalWidthMm.toFixed(1)} × ${totalHeightMm.toFixed(1)} mm`,
    `Dimensions pixels : ${totalWidthPx} × ${totalHeightPx} px @${dist.recommendedDPI} DPI`,
    `Texte sur le dos : ${canHaveSpineText ? 'Oui' : 'Non'}`,
    `Marge de sécurité texte : ${dist.textSafetyMm} mm du bord`,
    `Profil couleur : ${dist.colorProfile}`,
    `Format PDF : ${dist.pdfFormat}`,
  ];

  return {
    distributor,
    trimWidthMm: trim.widthMm,
    trimHeightMm: trim.heightMm,
    spineWidthMm,
    bleedMm: bleed,
    totalWidthMm,
    totalHeightMm,
    totalWidthPx,
    totalHeightPx,
    textSafetyMm: dist.textSafetyMm,
    spineTextMarginMm: spineTextMargin,
    canHaveSpineText,
    barcodeZone: {
      widthMm: dist.barcodeMinWidthMm,
      heightMm: dist.barcodeMinHeightMm,
    },
    summary,
    warnings,
  };
}

// ═══════════════════════════════════════════════════
// COVER AUDIT ENGINE
// ═══════════════════════════════════════════════════

export interface ProjectCoverData {
  title: string;
  author: string;
  genre: string;
  collection?: string;
  pages: number;
  isbn?: string;
  price?: string;
  backCoverText?: string;
  hasBarcode: boolean;
  hasCoverImage: boolean;
  hasSpineText: boolean;
  hasPublisherLogo: boolean;
  hasDepotLegal?: boolean;  // FR specific
  hasLegalNotice?: boolean; // FR specific
  hasPublisherName?: boolean;
  selectedDistributors: Distributor[];
}

export function auditCover(
  project: ProjectCoverData,
  distributor: Distributor
): CoverAudit {
  const dist = DISTRIBUTORS[distributor];
  const items: CoverAuditItem[] = [];

  // 1. Title
  items.push({
    id: 'title', label: 'Titre',
    status: project.title ? 'ok' : 'missing',
    message: project.title ? `"${project.title}" — présent` : 'Titre manquant sur la 1re de couverture',
    location: 'front',
    fix: project.title ? undefined : 'Ajouter le titre en gros sur la 1re de couverture',
  });

  // 2. Author
  items.push({
    id: 'author', label: 'Auteur',
    status: project.author ? 'ok' : 'missing',
    message: project.author ? `${project.author} — présent` : 'Nom de l\'auteur manquant',
    location: 'front',
    fix: project.author ? undefined : 'Ajouter le nom de l\'auteur sur la 1re de couverture',
  });

  // 3. Back cover text
  const hasBack = project.backCoverText && project.backCoverText.length > 20;
  items.push({
    id: 'back_text', label: 'Texte 4e de couverture',
    status: hasBack ? 'ok' : 'missing',
    message: hasBack
      ? `Texte 4e : ${project.backCoverText!.length} caractères`
      : 'Texte de 4e de couverture absent ou trop court',
    location: 'back',
    fix: hasBack ? undefined : 'Rédiger un résumé accrocheur (150-250 mots) pour la 4e de couverture',
  });

  // 4. ISBN
  const hasISBN = project.isbn && project.isbn.length >= 13;
  items.push({
    id: 'isbn_text', label: 'ISBN imprimé',
    status: hasISBN ? 'ok' : 'missing',
    message: hasISBN ? `ISBN ${project.isbn}` : 'ISBN non attribué',
    location: 'back',
    fix: hasISBN ? undefined : 'Attribuer un ISBN-13 et l\'imprimer sur la 4e de couverture',
  });

  // 5. Barcode — depends on distributor
  if (distributor === 'kdp') {
    items.push({
      id: 'barcode_ean', label: 'Code-barres EAN',
      status: 'ok',
      message: 'KDP ajoute automatiquement le code-barres — ne pas en inclure',
      location: 'back',
    });
  } else {
    items.push({
      id: 'barcode_ean', label: 'Code-barres EAN-13',
      status: project.hasBarcode ? 'ok' : 'missing',
      message: project.hasBarcode
        ? `Code-barres présent (min ${dist.barcodeMinWidthMm} × ${dist.barcodeMinHeightMm} mm)`
        : `Code-barres EAN-13 OBLIGATOIRE pour ${dist.name}`,
      location: 'back',
      fix: project.hasBarcode
        ? undefined
        : `Générer un code-barres EAN-13 à partir de l'ISBN. Zone minimum : ${dist.barcodeMinWidthMm} × ${dist.barcodeMinHeightMm} mm. Couleur : ${dist.barcodeColor}`,
    });
  }

  // 6. Price
  items.push({
    id: 'price', label: 'Prix TTC',
    status: project.price ? 'ok' : 'missing',
    message: project.price ? `Prix : ${project.price}` : 'Prix TTC manquant',
    location: 'back',
    fix: project.price ? undefined : 'Ajouter le prix de vente TTC sur la 4e de couverture',
  });

  // 7. Cover image / visual
  items.push({
    id: 'cover_visual', label: 'Visuel de couverture',
    status: project.hasCoverImage ? 'ok' : 'missing',
    message: project.hasCoverImage
      ? 'Artwork intégré'
      : 'Aucun visuel de couverture uploadé',
    location: 'front',
    fix: project.hasCoverImage
      ? undefined
      : `Créer un visuel de couverture à ${dist.recommendedDPI} DPI minimum, en ${dist.colorProfile}`,
  });

  // 8. Spine text
  const spineWidth = calculateSpineWidth(project.pages, distributor);
  const canSpine = project.pages >= dist.minPagesForSpineText;
  if (canSpine) {
    items.push({
      id: 'spine_text', label: 'Texte sur le dos',
      status: project.hasSpineText ? 'ok' : 'warning',
      message: project.hasSpineText
        ? `Texte dos présent (dos : ${spineWidth.toFixed(1)} mm)`
        : `Dos de ${spineWidth.toFixed(1)} mm — le texte est possible mais absent`,
      location: 'spine',
      fix: project.hasSpineText
        ? undefined
        : 'Ajouter titre + auteur sur la tranche, avec marge de ' + dist.spineTextMarginMm + ' mm de chaque côté',
    });
  } else {
    items.push({
      id: 'spine_text', label: 'Texte sur le dos',
      status: project.hasSpineText ? 'warning' : 'ok',
      message: project.hasSpineText
        ? `⚠ Dos trop fin (${spineWidth.toFixed(1)} mm, min ${dist.minPagesForSpineText} pages) — le texte sera illisible ou rejeté`
        : `Dos de ${spineWidth.toFixed(1)} mm — pas de texte (correct)`,
      location: 'spine',
      fix: project.hasSpineText
        ? `Retirer le texte du dos — minimum ${dist.minPagesForSpineText} pages requises par ${dist.name}`
        : undefined,
    });
  }

  // 9. Publisher logo
  items.push({
    id: 'publisher_logo', label: 'Logo éditeur',
    status: project.hasPublisherLogo ? 'ok' : 'warning',
    message: project.hasPublisherLogo ? 'Logo éditeur présent' : 'Logo éditeur absent (recommandé)',
    location: 'front',
    fix: project.hasPublisherLogo ? undefined : 'Ajouter le logo de la maison d\'édition',
  });

  // 10. Pollen/FR-specific requirements
  if (distributor === 'pollen') {
    items.push({
      id: 'depot_legal', label: 'Mention dépôt légal',
      status: project.hasDepotLegal ? 'ok' : 'missing',
      message: project.hasDepotLegal
        ? 'Mention dépôt légal présente'
        : 'Mention "Dépôt légal : [mois] [année]" OBLIGATOIRE pour distribution France',
      location: 'back',
      fix: project.hasDepotLegal
        ? undefined
        : 'Ajouter "Dépôt légal : mars 2026" (ou le mois de publication) sur la 4e de couverture',
    });

    items.push({
      id: 'legal_notice', label: 'Mention légale impression',
      status: project.hasLegalNotice ? 'ok' : 'missing',
      message: project.hasLegalNotice
        ? 'Mention d\'impression présente'
        : 'Mention "Imprimé en France" (ou pays d\'origine) obligatoire',
      location: 'back',
      fix: project.hasLegalNotice
        ? undefined
        : 'Ajouter "Imprimé en France" ou "Imprimé par [imprimeur]" sur la 4e',
    });

    items.push({
      id: 'publisher_name_back', label: 'Nom éditeur (4e)',
      status: project.hasPublisherName ? 'ok' : 'missing',
      message: project.hasPublisherName
        ? 'Nom de l\'éditeur présent en 4e'
        : 'Nom de la maison d\'édition absent de la 4e de couverture',
      location: 'back',
      fix: project.hasPublisherName
        ? undefined
        : 'Ajouter "Jabrilia Éditions" (ou le nom de votre maison) sur la 4e',
    });
  }

  // Calculate score
  const maxScore = items.filter(i => i.status !== 'ok' || i.location !== 'spine').length || items.length;
  const score = items.filter(i => i.status === 'ok').length;

  return {
    distributor,
    score,
    maxScore: items.length,
    items,
    critical: items.filter(i => i.status === 'missing'),
    warnings: items.filter(i => i.status === 'warning'),
    passed: items.filter(i => i.status === 'ok'),
  };
}

// ═══════════════════════════════════════════════════
// COVER GENERATION SPEC (what JABR produces)
// ═══════════════════════════════════════════════════

export interface CoverSpec {
  distributor: Distributor;
  dimensions: CoverDimensions;
  audit: CoverAudit;
  checklist: {
    label: string;
    done: boolean;
    required: boolean;
    detail: string;
  }[];
  exportSpec: {
    format: string;
    colorProfile: string;
    resolution: string;
    bleed: string;
    cropMarks: boolean;
    totalSize: string;
    spineWidth: string;
    notes: string[];
  };
}

export function generateCoverSpec(
  project: ProjectCoverData,
  distributor: Distributor,
  trimSizeKey: string,
  paperColor: PaperColor = 'white',
  paperGSM: number = 80
): CoverSpec {
  const dimensions = calculateCoverDimensions(trimSizeKey, project.pages, distributor, paperColor, paperGSM);
  const audit = auditCover(project, distributor);
  const dist = DISTRIBUTORS[distributor];

  const checklist = [
    { label: 'Visuel de couverture', done: project.hasCoverImage, required: true, detail: `Image haute résolution ${dist.recommendedDPI} DPI en ${dist.colorProfile}` },
    { label: 'Titre + auteur sur C1', done: !!(project.title && project.author), required: true, detail: 'Hiérarchie typographique claire' },
    { label: 'Texte de 4e de couverture', done: !!(project.backCoverText && project.backCoverText.length > 20), required: true, detail: 'Résumé accrocheur, 150-250 mots' },
    { label: 'ISBN attribué', done: !!(project.isbn), required: true, detail: `ISBN-13 imprimé en clair sur la 4e` },
    { label: 'Code-barres EAN', done: distributor === 'kdp' || project.hasBarcode, required: distributor !== 'kdp', detail: distributor === 'kdp' ? 'Ajouté par KDP' : `${dist.barcodeColor}, zone ${dist.barcodeMinWidthMm} × ${dist.barcodeMinHeightMm} mm` },
    { label: 'Prix TTC', done: !!project.price, required: true, detail: 'Prix de vente imprimé sur la 4e' },
    { label: 'Logo éditeur', done: project.hasPublisherLogo, required: false, detail: 'Logo de la maison d\'édition' },
    { label: 'Texte sur le dos', done: project.hasSpineText && dimensions.canHaveSpineText, required: false, detail: dimensions.canHaveSpineText ? `Titre + auteur, marge ${dimensions.spineTextMarginMm} mm` : `Pas de texte (dos ${dimensions.spineWidthMm.toFixed(1)} mm)` },
  ];

  if (distributor === 'pollen') {
    checklist.push(
      { label: 'Mention dépôt légal', done: !!project.hasDepotLegal, required: true, detail: '"Dépôt légal : [mois] [année]"' },
      { label: 'Mention d\'impression', done: !!project.hasLegalNotice, required: true, detail: '"Imprimé en France"' },
      { label: 'Nom éditeur en 4e', done: !!project.hasPublisherName, required: true, detail: 'Nom complet de la maison d\'édition' },
    );
  }

  const exportSpec = {
    format: dist.pdfFormat,
    colorProfile: dist.colorProfile,
    resolution: `${dist.recommendedDPI} DPI`,
    bleed: `${dist.bleedMm} mm sur les 4 côtés`,
    cropMarks: dist.cropMarksRequired,
    totalSize: `${dimensions.totalWidthMm.toFixed(1)} × ${dimensions.totalHeightMm.toFixed(1)} mm (${dimensions.totalWidthPx} × ${dimensions.totalHeightPx} px)`,
    spineWidth: `${dimensions.spineWidthMm.toFixed(1)} mm`,
    notes: dist.specificRules,
  };

  return { distributor, dimensions, audit, checklist, exportSpec };
}

// ═══════════════════════════════════════════════════
// MULTI-DISTRIBUTOR COMPARISON
// ═══════════════════════════════════════════════════

export function compareDistributorSpecs(
  trimSizeKey: string,
  pages: number,
  paperColor: PaperColor = 'white',
  paperGSM: number = 80
): Record<Distributor, CoverDimensions> {
  return {
    kdp: calculateCoverDimensions(trimSizeKey, pages, 'kdp', paperColor, paperGSM),
    ingramspark: calculateCoverDimensions(trimSizeKey, pages, 'ingramspark', paperColor, paperGSM),
    pollen: calculateCoverDimensions(trimSizeKey, pages, 'pollen', paperColor, paperGSM),
  };
}
