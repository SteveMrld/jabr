export type EditionFormat = 'broché' | 'poche' | 'epub' | 'audiobook' | 'pdf' | 'relié';

export interface Edition {
  format: EditionFormat;
  isbn: string;
  price?: string;
  status: 'planned' | 'in-progress' | 'ready' | 'published';
}

export const FORMAT_LABELS: Record<EditionFormat, { label: string; icon: string }> = {
  'broché': { label: 'Broché', icon: '📕' },
  'poche': { label: 'Poche', icon: '📗' },
  'epub': { label: 'ePub', icon: '📱' },
  'audiobook': { label: 'Audiobook', icon: '🎧' },
  'pdf': { label: 'PDF', icon: '📄' },
  'relié': { label: 'Relié', icon: '📘' },
};

export const EDITION_STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  'planned': { label: 'Prévu', bg: '#E8E4DF', color: '#6B6560' },
  'in-progress': { label: 'En cours', bg: '#FDE8D0', color: '#B05A1A' },
  'ready': { label: 'Prêt', bg: '#D4F0E0', color: '#1A6B42' },
  'published': { label: 'Publié', bg: '#D4F0E0', color: '#1A6B42' },
};

export type ManuscriptStatus = 'none' | 'uploaded' | 'analyzed' | 'validated' | 'isbn-injected';

export const MANUSCRIPT_STATUS_LABELS: Record<ManuscriptStatus, { label: string; bg: string; color: string; icon: string }> = {
  'none': { label: 'Non fourni', bg: '#E8E4DF', color: '#6B6560', icon: '○' },
  'uploaded': { label: 'Uploadé', bg: '#FDE8D0', color: '#B05A1A', icon: '↑' },
  'analyzed': { label: 'Analysé', bg: '#E8E0F0', color: '#3E2768', icon: '◉' },
  'validated': { label: 'Validé', bg: '#D4F0E0', color: '#1A6B42', icon: '✓' },
  'isbn-injected': { label: 'ISBN injecté', bg: '#D4F0E0', color: '#1A6B42', icon: '★' },
};

export interface AnalysisResult {
  iaScore: number; // 0-100, lower = less AI
  redundancies: number;
  avgSentenceLength: number;
  flaggedPatterns: { pattern: string; count: number; severity: 'critical' | 'moderate' | 'minor' }[];
  wordCount: number;
  timestamp: string;
}

export interface Project {
  id: number;
  title: string;
  subtitle?: string;
  author: string;
  illustrator?: string;
  genre: string;
  collection?: string;
  editions: Edition[];
  score: number;
  maxScore: number;
  status: 'published' | 'in-progress' | 'draft';
  pages: number;
  cover: string;
  coverImage?: string;
  backCover?: string;
  diag: Record<string, boolean>;
  corrections: string[];
  manuscriptStatus?: ManuscriptStatus;
  manuscriptFile?: string;
  analysis?: AnalysisResult;
  notes?: string;
  series?: string;
  seriesOrder?: number;
  printCost?: number;
  revenue?: number;
  changelog?: { date: string; action: string }[];
}

export const PROJECTS: Project[] = [
  {
    id: 1, title: "Mon Petit Livre Anti-Stress", author: "Steve Moradel", illustrator: "Allison Moradel",
    genre: "Jeunesse", collection: "Étincelles", score: 7, maxScore: 7, status: "in-progress", pages: 136, cover: "🌅", coverImage: "/covers/anti-stress.jpg",
    editions: [
      { format: 'broché', isbn: '978-2-488647-00-7', price: '18,90€', status: 'in-progress' },
      { format: 'epub', isbn: '978-2-488647-01-4', status: 'planned' },
      { format: 'pdf', isbn: '978-2-488647-02-1', status: 'planned' },
    ],
    diag: { ean: true, prix: true, isbn_txt: true, texte4e: true, typo: true, dos: true, logo: true }, manuscriptStatus: "validated", corrections: [], printCost: 4.85, revenue: 0,
    backCover: "Et si tu avais en toi tous les super-pouvoirs pour apprivoiser le stress ? Dans ce livre, découvre 8 personnages attachants qui, comme toi, vivent des moments pas toujours faciles : la rentrée, les disputes, les peurs du soir… Grâce à des activités ludiques, des exercices de respiration et des histoires réconfortantes, apprends à transformer tes émotions en forces. Un compagnon doux et joyeux, à lire seul ou en famille.",
    changelog: [
      { date: '15 jan. 2025', action: 'Projet créé' },
      { date: '28 jan. 2025', action: 'Illustrations validées par Allison Moradel' },
      { date: '10 fév. 2025', action: 'ISBN broché attribué — 978-2-488647-00-7' },
      { date: '22 fév. 2025', action: 'Diagnostic couverture : 7/7 validé' },
      { date: '05 mar. 2025', action: 'Statut → En cours' },
      { date: '18 mar. 2025', action: 'Calibrage couverture finalisé (136p)' },
    ]
  },
  {
    id: 2, title: "Sur les hauteurs des chutes du Niagara", author: "Steve Moradel",
    genre: "Roman", score: 4, maxScore: 7, status: "draft", pages: 280, cover: "🏔️", coverImage: "/covers/niagara.jpg",
    backCover: "Entre les grondements des chutes et le silence des mémoires enfouies, un homme remonte le fil de son histoire. De la Guadeloupe aux rives du Niagara, ce roman puissant explore les cicatrices de l'esclavage, la quête d'identité et la force insoupçonnée de ceux qui refusent d'oublier. Un premier roman habité, porté par une écriture à la fois lyrique et incandescente.",
    editions: [
      { format: 'broché', isbn: '978-2-488647-03-8', price: '21,90€', status: 'planned' },
      { format: 'poche', isbn: '978-2-488647-04-5', status: 'planned' },
      { format: 'epub', isbn: '978-2-488647-05-2', status: 'planned' },
    ],
    diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: true, logo: true },
    manuscriptStatus: "analyzed", corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte"]
  },
  {
    id: 3, title: "Du Chaos Naît une Étoile", author: "Steve Moradel",
    genre: "Essai", score: 3, maxScore: 7, status: "draft", pages: 220, cover: "⭐", coverImage: "/covers/chaos.jpg",
    backCover: "Et si les crises étaient le terreau des plus grandes transformations ? Dans cet essai percutant, Steve Moradel décrypte les mécanismes par lesquels le chaos — personnel, collectif, civilisationnel — engendre l'innovation et le renouveau. Une invitation à changer de regard sur l'instabilité du monde.",
    editions: [
      { format: 'broché', isbn: '978-2-488647-07-6', price: '19,90€', status: 'planned' },
      { format: 'epub', isbn: '978-2-488647-08-3', status: 'planned' },
    ],
    diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: false, logo: true },
    corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte", "Ajouter texte sur dos"]
  },
  {
    id: 4, title: "Dans les Failles du Siècle", author: "Steve Moradel",
    genre: "Essai", score: 4, maxScore: 7, status: "draft", pages: 310, cover: "🌍", coverImage: "/covers/failles.jpg",
    editions: [
      { format: 'broché', isbn: '978-2-488647-10-6', price: '22,90€', status: 'planned' },
      { format: 'poche', isbn: '978-2-488647-11-3', status: 'planned' },
      { format: 'epub', isbn: '978-2-488647-12-0', status: 'planned' },
    ],
    diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: true, logo: true },
    corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte"]
  },
  {
    id: 5, title: "Aurora", author: "Steve Moradel",
    genre: "Roman", score: 4, maxScore: 7, status: "in-progress", pages: 350, cover: "❄️", coverImage: "/covers/aurora.jpg",
    editions: [
      { format: 'broché', isbn: '978-2-488647-13-7', price: '14,90€', status: 'in-progress' },
      { format: 'poche', isbn: '978-2-488647-14-4', status: 'planned' },
      { format: 'epub', isbn: '978-2-488647-15-1', status: 'planned' },
      { format: 'audiobook', isbn: '978-2-488647-16-8', status: 'planned' },
    ],
    diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: true, logo: true },
    corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte"]
  },
  {
    id: 6, title: "Le Trône de Cendre", subtitle: "Tome I – Le Lion Déchu", author: "Steve Moradel",
    genre: "Roman historique", series: "Le Trône de Cendre", seriesOrder: 1, score: 3, maxScore: 7, status: "in-progress", pages: 420, cover: "🏛️", coverImage: "/covers/trone-de-cendre.jpg",
    backCover: "An 350 avant J.-C. Le royaume de Kush vacille. Tandis que l'empire d'Égypte étend son ombre sur les terres du sud, un prince déchu jure de reconquérir le trône qui lui a été arraché. Mais le pouvoir a un prix que même les dieux n'osent nommer. Entre alliances mortelles, trahisons de palais et batailles épiques aux portes de Méroé, « Le Lion Déchu » ouvre une trilogie magistrale où se mêlent l'Histoire et la légende.",
    editions: [
      { format: 'broché', isbn: '978-2-488647-17-5', price: '24,90€', status: 'in-progress' },
      { format: 'relié', isbn: '978-2-488647-18-2', status: 'planned' },
      { format: 'epub', isbn: '978-2-488647-19-9', status: 'planned' },
      { format: 'audiobook', isbn: '978-2-488647-20-5', status: 'planned' },
    ],
    diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: false, logo: true },
    manuscriptStatus: "uploaded", corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte", "Corriger dos (AURORA → Le Trône de Cendre)"]
  },
  {
    id: 7, title: "À l'Ombre des Oliviers", author: "Steve Moradel",
    genre: "Roman", score: 4, maxScore: 7, status: "draft", pages: 290, cover: "🫒", coverImage: "/covers/oliviers.jpg",
    editions: [
      { format: 'broché', isbn: '978-2-488647-21-2', price: '19,90€', status: 'planned' },
      { format: 'poche', isbn: '978-2-488647-22-9', status: 'planned' },
      { format: 'epub', isbn: '978-2-488647-23-6', status: 'planned' },
    ],
    diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: true, logo: true },
    corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte"]
  },
  {
    id: 8, title: "Les Mémoires Reliées", author: "Steve Moradel",
    genre: "Roman", score: 4, maxScore: 7, status: "draft", pages: 330, cover: "🔗", coverImage: "/covers/memoires-reliees.jpg",
    backCover: "Trois générations. Trois corps marqués par la même douleur. Quand Élise découvre que la maladie chronique qui la consume porte l'empreinte d'un traumatisme familial enfoui, elle plonge dans les mémoires de sa grand-mère antillaise. Un roman bouleversant sur la douleur héritée, le silence des mères et la puissance de la réparation.",
    editions: [
      { format: 'broché', isbn: '978-2-488647-25-0', price: '23,90€', status: 'planned' },
      { format: 'epub', isbn: '978-2-488647-26-7', status: 'planned' },
    ],
    diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: true, logo: true },
    manuscriptStatus: "analyzed", corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte"]
  },
  {
    id: 9, title: "Le Temps des Étincelles", author: "Steve et Allison Moradel",
    genre: "BD", collection: "Étincelles", score: 3, maxScore: 7, status: "in-progress", pages: 64, cover: "✨", coverImage: "/covers/etincelles.jpg",
    backCover: "« Papa, est-ce que l'intelligence artificielle peut ressentir des choses ? » Jade a dix ans et pose les questions que les adultes n'osent plus se poser. À travers un dialogue tendre et profond entre un père et sa fille, cette bande dessinée explore notre rapport à la technologie, au vivant et à ce qui fait de nous des humains. 144 pages d'émerveillement illustré.",
    editions: [
      { format: 'broché', isbn: '978-2-488647-29-8', price: '29,90€', status: 'in-progress' },
      { format: 'epub', isbn: '978-2-488647-30-4', status: 'planned' },
    ],
    diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: false, dos: true, logo: true },
    manuscriptStatus: "uploaded", corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte", "Corriger ETINCELLES → ÉTINCELLES"]
  },
  {
    id: 10, title: "Les Réparatrices", author: "Steve Moradel",
    genre: "Essai", score: 2, maxScore: 7, status: "draft", pages: 240, cover: "🧵", coverImage: "/covers/reparatrices.jpg",
    backCover: "Elles sont treize. Treize femmes qui, chacune à leur manière, réparent le monde. De l'infirmière de brousse à la juge internationale, de la militante écologiste à la poétesse exilée, ces portraits croisés racontent la force silencieuse de celles qui recousent les déchirures du siècle. Un essai lumineux, entre reportage et hommage.",
    editions: [
      { format: 'broché', isbn: '978-2-488647-31-1', price: '21,90€', status: 'planned' },
      { format: 'epub', isbn: '978-2-488647-32-8', status: 'planned' },
      { format: 'audiobook', isbn: '978-2-488647-33-5', status: 'planned' },
    ],
    diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: false, logo: true },
    corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte", "Fournir 4e de couverture"]
  },
];

export const PIPELINE_STEPS = [
  "Calibrage", "Couverture", "Diagnostic", "BAT", "ePub", "Audio", "Marketing", "Distribution"
];

export const COLLECTIONS = [
  { name: "Étincelles", desc: "Jeunesse & BD — Livres pour les jeunes esprits", color: "#E07A2F", bookIds: [1, 9] },
  { name: "Romans", desc: "Fiction littéraire", color: "#5B3E8A", bookIds: [2, 5, 6, 7, 8] },
  { name: "Essais", desc: "Non-fiction, essais, récits", color: "#C8952E", bookIds: [3, 4, 10] },
];

export const DIAG_LABELS: Record<string, string> = {
  ean: "Code-barres EAN", prix: "Prix TTC", isbn_txt: "ISBN texte",
  texte4e: "Texte 4e", typo: "Typographie", dos: "Dos", logo: "Logo Jabrilia"
};

export const DISTRIBUTION_CHANNELS = [
  { name: "Pollen / Kiosque", desc: "Distribution librairie France", status: "En attente ISBN", color: "#E07A2F" },
  { name: "Amazon KDP", desc: "Print on demand + Kindle", status: "Prêt", color: "#2EAE6D" },
  { name: "IngramSpark", desc: "Distribution internationale", status: "En attente fichiers", color: "#E07A2F" },
  { name: "Apple Books", desc: "ePub + Audiobook", status: "En préparation", color: "#9E9689" },
  { name: "Kobo / Fnac", desc: "ePub francophone", status: "En préparation", color: "#9E9689" },
  { name: "Spotify / Audible", desc: "Audiobook", status: "Phase 2", color: "#5B3E8A" },
];

// ═══════════════════════════════════
// COVER SPECIFICATIONS — KDP & IMPRIMEUR FR
// ═══════════════════════════════════

export type TrimSizeKey = '5x8' | '5.25x8' | '5.5x8.5' | '6x9' | '6.14x9.21' | '6.69x9.61' | '7x10' | '7.44x9.69' | '7.5x9.25' | '8x10' | '8.25x6' | '8.25x8.25' | '8.5x8.5' | '8.5x11';

export interface TrimSize {
  key: TrimSizeKey;
  label: string;
  widthIn: number;
  heightIn: number;
  widthMm: number;
  heightMm: number;
  minPages: number;
  maxPages: number;
  recommended?: string[];
}

export const KDP_TRIM_SIZES: TrimSize[] = [
  { key: '5x8', label: '5" × 8"', widthIn: 5, heightIn: 8, widthMm: 127, heightMm: 203.2, minPages: 24, maxPages: 828, recommended: ['Roman', 'Fiction'] },
  { key: '5.25x8', label: '5,25" × 8"', widthIn: 5.25, heightIn: 8, widthMm: 133.4, heightMm: 203.2, minPages: 24, maxPages: 828 },
  { key: '5.5x8.5', label: '5,5" × 8,5"', widthIn: 5.5, heightIn: 8.5, widthMm: 139.7, heightMm: 215.9, minPages: 24, maxPages: 828, recommended: ['Roman', 'Essai'] },
  { key: '6x9', label: '6" × 9"', widthIn: 6, heightIn: 9, widthMm: 152.4, heightMm: 228.6, minPages: 24, maxPages: 828, recommended: ['Essai', 'Non-fiction'] },
  { key: '6.14x9.21', label: '6,14" × 9,21"', widthIn: 6.14, heightIn: 9.21, widthMm: 156, heightMm: 234, minPages: 24, maxPages: 828, recommended: ['Roman', 'Essai'] },
  { key: '6.69x9.61', label: '6,69" × 9,61"', widthIn: 6.69, heightIn: 9.61, widthMm: 170, heightMm: 244, minPages: 24, maxPages: 828 },
  { key: '7x10', label: '7" × 10"', widthIn: 7, heightIn: 10, widthMm: 177.8, heightMm: 254, minPages: 24, maxPages: 828, recommended: ['BD', 'Illustré'] },
  { key: '7.44x9.69', label: '7,44" × 9,69"', widthIn: 7.44, heightIn: 9.69, widthMm: 189, heightMm: 246, minPages: 24, maxPages: 828 },
  { key: '7.5x9.25', label: '7,5" × 9,25"', widthIn: 7.5, heightIn: 9.25, widthMm: 190.5, heightMm: 235, minPages: 24, maxPages: 828 },
  { key: '8x10', label: '8" × 10"', widthIn: 8, heightIn: 10, widthMm: 203.2, heightMm: 254, minPages: 24, maxPages: 590 },
  { key: '8.25x6', label: '8,25" × 6"', widthIn: 8.25, heightIn: 6, widthMm: 209.6, heightMm: 152.4, minPages: 24, maxPages: 590 },
  { key: '8.25x8.25', label: '8,25" × 8,25"', widthIn: 8.25, heightIn: 8.25, widthMm: 209.6, heightMm: 209.6, minPages: 24, maxPages: 590 },
  { key: '8.5x8.5', label: '8,5" × 8,5"', widthIn: 8.5, heightIn: 8.5, widthMm: 215.9, heightMm: 215.9, minPages: 24, maxPages: 590 },
  { key: '8.5x11', label: '8,5" × 11"', widthIn: 8.5, heightIn: 11, widthMm: 215.9, heightMm: 279.4, minPages: 24, maxPages: 590, recommended: ['Jeunesse', 'Cahier'] },
];

export type PaperType = 'white' | 'cream' | 'color' | 'color-standard';

export interface PaperSpec {
  type: PaperType;
  label: string;
  thicknessPerPage: number; // inches
  gsm: number;
}

export const KDP_PAPER_TYPES: PaperSpec[] = [
  { type: 'white', label: 'Blanc (N&B)', thicknessPerPage: 0.002252, gsm: 75 },
  { type: 'cream', label: 'Crème (N&B)', thicknessPerPage: 0.0025, gsm: 80 },
  { type: 'color', label: 'Couleur premium', thicknessPerPage: 0.002252, gsm: 75 },
  { type: 'color-standard', label: 'Couleur standard', thicknessPerPage: 0.0032, gsm: 106 },
];

export const KDP_CONSTANTS = {
  bleedIn: 0.125,            // 3.2 mm
  bleedMm: 3.2,
  safeMarginIn: 0.25,        // 6.4 mm
  safeMarginMm: 6.4,
  coverThicknessIn: 0.06,    // ajout couverture
  minPagesForSpineText: 79,
  spineMarginIn: 0.0625,     // 1.6 mm
  spineMarginMm: 1.6,
  barcodeWidthMm: 50.8,      // 2" barcode zone
  barcodeHeightMm: 30.5,
  dpi: 300,
  maxFileSizeMb: 650,
  coverFinish: ['Brillant', 'Mat'] as const,
};

// French printing standards (Imprimeur FR / Pollen distribution)
export const FR_PRINT_CONSTANTS = {
  bleedMm: 2.5,              // fonds perdus standard FR
  safeMarginMm: 6,           // marge de sécurité
  rainingMm: 7,              // rainage d'aisance
  dpi: 300,
  colorSpace: 'CMJN',
  barcodeZoneMm: { w: 30, h: 20 },
  coverPaperGsm: 300,        // couverture standard
  finishes: ['Pelliculé brillant', 'Pelliculé mat', 'Soft touch', 'Vernis 3D', 'Dorure', 'Argenture'] as const,
};

export interface CoverSpecs {
  channel: 'kdp' | 'fr';
  trimSize: TrimSize;
  paperType: PaperSpec;
  pages: number;
  spineWidthIn: number;
  spineWidthMm: number;
  totalWidthIn: number;
  totalHeightIn: number;
  totalWidthMm: number;
  totalHeightMm: number;
  frontCoverMm: { w: number; h: number };
  backCoverMm: { w: number; h: number };
  canHaveSpineText: boolean;
  pixelWidth: number;
  pixelHeight: number;
}

// KDP Cover calculator
export function calcKDPCover(trimKey: TrimSizeKey, pages: number, paperType: PaperType = 'white'): CoverSpecs {
  const trim = KDP_TRIM_SIZES.find(t => t.key === trimKey) || KDP_TRIM_SIZES[3]; // default 6x9
  const paper = KDP_PAPER_TYPES.find(p => p.type === paperType) || KDP_PAPER_TYPES[0];

  const spineIn = (pages * paper.thicknessPerPage) + KDP_CONSTANTS.coverThicknessIn;
  const spineMm = spineIn * 25.4;

  const totalWidthIn = KDP_CONSTANTS.bleedIn + trim.widthIn + spineIn + trim.widthIn + KDP_CONSTANTS.bleedIn;
  const totalHeightIn = KDP_CONSTANTS.bleedIn + trim.heightIn + KDP_CONSTANTS.bleedIn;

  const totalWidthMm = totalWidthIn * 25.4;
  const totalHeightMm = totalHeightIn * 25.4;

  return {
    channel: 'kdp',
    trimSize: trim,
    paperType: paper,
    pages,
    spineWidthIn: Math.round(spineIn * 10000) / 10000,
    spineWidthMm: Math.round(spineMm * 100) / 100,
    totalWidthIn: Math.round(totalWidthIn * 10000) / 10000,
    totalHeightIn: Math.round(totalHeightIn * 10000) / 10000,
    totalWidthMm: Math.round(totalWidthMm * 100) / 100,
    totalHeightMm: Math.round(totalHeightMm * 100) / 100,
    frontCoverMm: { w: trim.widthMm, h: trim.heightMm },
    backCoverMm: { w: trim.widthMm, h: trim.heightMm },
    canHaveSpineText: pages >= KDP_CONSTANTS.minPagesForSpineText,
    pixelWidth: Math.ceil(totalWidthIn * KDP_CONSTANTS.dpi),
    pixelHeight: Math.ceil(totalHeightIn * KDP_CONSTANTS.dpi),
  };
}

// French imprimeur cover calculator (format A5 = 148×210 default)
export type FrTrimKey = 'A5' | 'A5+' | 'roman' | 'BD' | 'A4';

export const FR_TRIM_SIZES: Record<FrTrimKey, { label: string; wMm: number; hMm: number }> = {
  'A5': { label: 'A5 (148 × 210 mm)', wMm: 148, hMm: 210 },
  'A5+': { label: '152 × 229 mm', wMm: 152, hMm: 229 },
  'roman': { label: 'Roman (140 × 216 mm)', wMm: 140, hMm: 216 },
  'BD': { label: 'BD (195 × 265 mm)', wMm: 195, hMm: 265 },
  'A4': { label: 'A4 (210 × 297 mm)', wMm: 210, hMm: 297 },
};

export function calcFRCover(trimKey: FrTrimKey, pages: number, paperGsm: number = 80): CoverSpecs {
  const trim = FR_TRIM_SIZES[trimKey];
  // Spine: PPI depends on paper weight. ~80gsm offset = ~0.074mm per feuille
  const ppiCoeff = paperGsm <= 80 ? 0.074 : paperGsm <= 90 ? 0.080 : paperGsm <= 100 ? 0.089 : 0.100;
  const spineMm = (pages / 2) * ppiCoeff + 1; // +1mm rainage
  const spineIn = spineMm / 25.4;

  const bleed = FR_PRINT_CONSTANTS.bleedMm;
  const totalWidthMm = bleed + trim.wMm + spineMm + trim.wMm + bleed;
  const totalHeightMm = bleed + trim.hMm + bleed;

  const totalWidthIn = totalWidthMm / 25.4;
  const totalHeightIn = totalHeightMm / 25.4;

  const trimSizeObj: TrimSize = {
    key: '6x9' as TrimSizeKey,
    label: trim.label,
    widthIn: trim.wMm / 25.4,
    heightIn: trim.hMm / 25.4,
    widthMm: trim.wMm,
    heightMm: trim.hMm,
    minPages: 24,
    maxPages: 1000,
  };

  return {
    channel: 'fr',
    trimSize: trimSizeObj,
    paperType: { type: 'white', label: `Offset ${paperGsm}g`, thicknessPerPage: ppiCoeff / 25.4, gsm: paperGsm },
    pages,
    spineWidthIn: Math.round(spineIn * 10000) / 10000,
    spineWidthMm: Math.round(spineMm * 100) / 100,
    totalWidthIn: Math.round(totalWidthIn * 100) / 100,
    totalHeightIn: Math.round(totalHeightIn * 100) / 100,
    totalWidthMm: Math.round(totalWidthMm * 100) / 100,
    totalHeightMm: Math.round(totalHeightMm * 100) / 100,
    frontCoverMm: { w: trim.wMm, h: trim.hMm },
    backCoverMm: { w: trim.wMm, h: trim.hMm },
    canHaveSpineText: spineMm >= 5,
    pixelWidth: Math.ceil((totalWidthMm / 25.4) * FR_PRINT_CONSTANTS.dpi),
    pixelHeight: Math.ceil((totalHeightMm / 25.4) * FR_PRINT_CONSTANTS.dpi),
  };
}

// Manuscript data (applied to PROJECTS)
// Helpers
export const countISBN = (projects: Project[]) => projects.reduce((s, p) => s + p.editions.length, 0);
export const primaryISBN = (p: Project) => p.editions[0]?.isbn || '—';
export const primaryPrice = (p: Project) => p.editions.find(e => e.price)?.price;

// Manuscript data (applied to PROJECTS)
const MANUSCRIPT_DATA: Record<number, { status: ManuscriptStatus; file?: string; analysis?: AnalysisResult }> = {
  1: { status: 'validated', file: 'anti-stress-final.docx' },
  2: { status: 'isbn-injected', file: 'niagara-v-finale.docx', analysis: { iaScore: 12, redundancies: 3, avgSentenceLength: 18, wordCount: 68400, timestamp: '2026-02-20', flaggedPatterns: [
    { pattern: '"pour la première fois"', count: 4, severity: 'minor' },
    { pattern: '"quelque chose se déposa"', count: 1, severity: 'minor' },
  ] } },
  3: { status: 'analyzed', file: 'du-chaos-v3.docx', analysis: { iaScore: 8, redundancies: 2, avgSentenceLength: 16, wordCount: 52800, timestamp: '2026-02-18', flaggedPatterns: [
    { pattern: '"il sentit que"', count: 2, severity: 'minor' },
  ] } },
  4: { status: 'analyzed', file: 'failles-du-siecle-v4.docx', analysis: { iaScore: 38, redundancies: 14, avgSentenceLength: 22, wordCount: 74200, timestamp: '2026-02-15', flaggedPatterns: [
    { pattern: '"ne X pas Y : elle/il Z"', count: 12, severity: 'critical' },
    { pattern: '"cette mutation/transformation"', count: 36, severity: 'critical' },
    { pattern: '"Dans les failles du siècle,"', count: 8, severity: 'critical' },
    { pattern: '"car" en début de phrase', count: 16, severity: 'moderate' },
    { pattern: '"face à"', count: 14, severity: 'moderate' },
    { pattern: '"il existe"', count: 5, severity: 'moderate' },
    { pattern: '"silencieusement"', count: 4, severity: 'minor' },
  ] } },
  5: { status: 'uploaded', file: 'aurora-manuscrit.docx' },
  6: { status: 'uploaded', file: 'trone-de-cendre-t1.docx' },
  7: { status: 'uploaded', file: 'oliviers-v-finale.docx' },
  8: { status: 'validated', file: 'memoires-reliees-v3.docx', analysis: { iaScore: 6, redundancies: 1, avgSentenceLength: 17, wordCount: 79200, timestamp: '2026-02-22', flaggedPatterns: [] } },
  9: { status: 'uploaded', file: 'etincelles-scenar-v11.docx' },
  10: { status: 'none' },
};

// Apply manuscript data
PROJECTS.forEach(p => {
  const md = MANUSCRIPT_DATA[p.id];
  if (md) {
    p.manuscriptStatus = md.status;
    p.manuscriptFile = md.file;
    p.analysis = md.analysis;
  }
});

// 4e de couverture texts
const BACK_COVER_TEXTS: Record<number, string> = {
  1: `Il y a des jours où tout déborde.\nDes jours où l'on ne comprend pas ce qui se passe à l'intérieur de soi.\nCe livre est né pour ces moments-là.\n\nÀ travers des histoires douces, des exercices simples et des images qui apaisent, Mon petit livre anti-stress accompagne l'enfant pas à pas pour reconnaître ses émotions, les apprivoiser et retrouver le calme.\n\nRespirer. Écouter. Exprimer. Se relever.\n\nUn livre à lire, à garder près de soi, à ouvrir chaque fois que l'on en a besoin.\nComme une présence rassurante qui ne disparaît jamais.\n\nUn ouvrage pour grandir avec ses émotions — en confiance.`,
  2: '', // À compléter
  3: `Il arrive un moment où tout s'effondre. Où les certitudes vacillent, où les masques tombent, où l'ancien monde ne nous porte plus. Ce moment-là, nous le redoutons. Et pourtant, c'est peut-être le plus précieux de tous.\n\nDans cet essai philosophique profondément humain, Steve Moradel explore les territoires intimes de la transformation. Loin des méthodes miracle et des raccourcis faciles, il nous invite à un voyage au cœur de nos effondrements pour y découvrir cette vérité bouleversante : du chaos naît une étoile.\n\nÀ travers des récits touchants, des réflexions profondes et une prose d'une rare beauté, ce livre accompagne ceux qui traversent les tempêtes de l'existence. Il révèle comment nos crises les plus douloureuses peuvent devenir les matrices de notre renaissance.`,
  4: `Nous avons cru que la mondialisation abolirait les frontières, qu'Internet rapprocherait les peuples, que la technologie rendrait le monde plus juste. Pourtant, ces promesses ont souvent aggravé les fractures qu'elles prétendaient guérir.\n\nDes câbles sous-marins aux maîtres invisibles de la finance, du crédit social chinois aux dérives de l'intelligence artificielle, Steve Moradel révèle comment les fractures géopolitiques se répercutent jusqu'dans nos vies intimes.\n\nCar tout est lié. Une décision prise dans un bureau de BlackRock influence l'emploi de millions de personnes. Un câble sectionné paralyse des continents entiers.\n\nMais dans ces failles, il ne s'agit pas seulement de décrire ce qui vacille. Il s'agit d'entrevoir ce qui peut tenir. Car les fractures sont aussi des ouvertures où la lumière passe.\n\nUn diagnostic lucide de notre époque et une invitation à repenser l'avenir.`,
  5: `Dans les tréfonds glacés de l'Antarctique, la frontière entre légende et réalité s'effondre.\nSous des kilomètres de glace, une découverte bouleverse l'ordre établi : un sanctuaire oublié, témoin d'un savoir perdu et d'ambitions inimaginables. Aurora n'est pas qu'un lieu : c'est une promesse. Celle d'un avenir façonné par des secrets trop longtemps dissimulés.\n\nMais tout progrès a son prix, et ce qui sommeille dans les silences d'Aurora pourrait bien redéfinir la place de l'humanité dans l'univers. Entre vérités enfouies et visions d'un monde nouveau, une question demeure : sommes-nous prêts pour ce qui nous attend ?`,
  6: `Il y a vingt ans, un roi a fait un choix.\n\nUn enfant est né dans le silence. Sa mère est morte en lui donnant la vie. Et parce que ses yeux semblaient voir trop loin, on a décidé qu'il ne régnerait jamais.\n\nOn a inversé l'ordre des naissances. On a réécrit les registres. On a enterré la vérité.\n\nAspelta a grandi dans l'ombre de son frère, ignorant ce qu'on lui avait volé. Jusqu'au jour où, lors d'un rituel sacré, la terre elle-même a refusé de mentir.\n\nDans l'empire de Kush, au cœur de l'Afrique ancienne, le pouvoir repose sur la pierre — et la pierre se souvient.\n\nJusqu'où ira-t-on pour maintenir un mensonge ?\nEt quel prix paiera-t-on quand il s'effondrera ?\n\nLa terre n'oublie jamais. Elle attend.`,
  7: `Sous le ciel brûlé de promesses déchues, deux destins se croisent et s'affrontent sur une terre où l'espoir et le désespoir dansent une valse tragique. Liora, fille d'un kibboutz marqué par la résilience de ses ancêtres, et Rayane, jeune homme épris de la terre de Gaza, découvrent que leurs vies, comme les branches noueuses des oliviers millénaires, sont profondément enracinées dans l'histoire de leurs peuples.\n\nChaque pierre, chaque souffle d'air, porte le poids des luttes et des rêves, dans un récit qui interroge la mémoire, la transmission et la possibilité fragile d'un futur apaisé. Une fresque humaine et universelle, un voyage au cœur des blessures et des résistances, où la douleur des pertes laisse parfois entrevoir la force de l'espoir.`,
  8: `Et si nos douleurs n'étaient que les échos d'histoires oubliées ?\n\nGabriel, Élise, Sophie, Cécile… Ils vivent séparés, mais une souffrance inexplicable les unit. Une douleur qui dépasse le corps, une vibration qui semble venir d'ailleurs. À mesure qu'ils explorent leurs passés, un mystère émerge : et si ces maux invisibles étaient les fragments d'une mémoire partagée ?\n\nAu croisement du réel et du mystique, Les Mémoires Reliées nous plonge dans une quête bouleversante, où chaque douleur révèle un lien, chaque rencontre éclaire un chemin. Un récit puissant et lumineux sur ce qui nous unit au-delà de nous-mêmes.`,
  9: `Et si les idées voyageaient comme des étincelles ?\nJade a 15 ans, une curiosité vive, des questions plein les poches… et une soif d'apprendre que rien n'arrête.\n\nEn explorant les souvenirs de sa famille, les objets du quotidien, ou les traces laissées par les inventions humaines, elle découvre peu à peu le fil invisible qui relie l'histoire de la technologie à celle des émotions, des rêves et des transmissions.\n\nEntre poésie et réflexion, Le Temps d'une Étincelle est une bande dessinée hybride, sensible et lumineuse. Elle traverse les âges et les idées, mêle l'intime au collectif, et propose une autre manière de comprendre notre monde : non pas comme une suite de révolutions, mais comme un tissu fragile et merveilleux de gestes, de mémoires et de choix.\n\nÀ hauteur d'adolescente, avec justesse et humanité, cette œuvre invite petits et grands à ouvrir les mains… pour laisser passer la lumière.`,
  10: `Elles n'ont pas renversé le monde. Elles l'ont recousu.\n\nTreize femmes. Trois continents. Deux siècles de fractures.\n\nTubman guidait des fugitifs dans la nuit. Parks est restée assise quand tout lui ordonnait de se lever. Curie a ouvert aux femmes les portes d'une science qui ne voulait pas d'elles. Angelou a transformé le silence d'une enfant brisée en une voix universelle.\n\nLà où la révolutionnaire fait table rase, la réparatrice fait table de résurrection. Elle ne détruit pas l'ancien monde — elle identifie dans les décombres ce qui mérite d'être sauvé, puis tisse, patiemment, ce qui permettra à cette parcelle de beauté de survivre.\n\nLes Réparatrices révèle une vérité méconnue : les solutions aux crises de notre époque naissent souvent là où personne ne regarde.`,
};

// Apply back cover texts
PROJECTS.forEach(p => {
  const text = BACK_COVER_TEXTS[p.id];
  if (text) p.backCover = text;
});
