// ═══════════════════════════════════════════════════════════════════
// JABR — Publisher Charter (Charte Éditoriale)
// Each publishing house has its own identity, specs, and rules
// ═══════════════════════════════════════════════════════════════════

export interface TypographySpec {
  fontFamily: string;
  fallback: string;
  sizePt: number;
  lineHeightPt: number;
  alignment: 'justified' | 'left' | 'right' | 'center';
  indentMm: number;
  color: string;
}

export interface CollectionSpec {
  id: string;
  name: string;
  description: string;
  // Format
  formatLabel: string;
  widthMm: number;
  heightMm: number;
  // Margins (mm)
  marginInnerMm: number;
  marginOuterMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  mirrorMargins: boolean;
  // Typography
  bodyText: TypographySpec;
  chapterTitle: TypographySpec;
  chapterNumber: TypographySpec;
  folios: TypographySpec;
  // Cover typography
  coverTitle: TypographySpec;
  coverAuthor: TypographySpec;
  coverBackText: TypographySpec;
  // Palette
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  // Rules
  chapterStartsRecto: boolean;
  separatorStyle: string;
  firstParaNoIndent: boolean;
  dialogDash: string;
  // Paper
  paperGSM: number;
  paperType: string;
  coverPaperGSM: number;
  coverFinish: 'mat' | 'brillant';
  // Pages liminaires (order)
  prelimPages: string[];
  // Specific notes
  notes: string[];
}

export interface PublisherCharter {
  id: string;
  name: string;
  fullName: string;
  // Identity
  logoUrl?: string;
  logoPositionCover: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right';
  address: string;
  website?: string;
  email?: string;
  // Legal
  siret?: string;
  isbnPrefix: string;
  legalMentions: {
    depotLegal: boolean;
    imprimeur: string;
    acheveDimprimer: boolean;
    mentionFiction: boolean;
    copyrightFormat: string;
  };
  // Distributors
  defaultDistributor: string;
  distributors: string[];
  // Collections
  collections: CollectionSpec[];
  // Global cover rules
  coverRules: {
    authorPosition: 'top' | 'center' | 'bottom';
    titlePosition: 'top' | 'center' | 'bottom';
    publisherLogoOnSpine: boolean;
    backCoverLayout: string[];
    barcodePosition: 'bottom-left' | 'bottom-right' | 'bottom-center';
    pricePosition: 'near-barcode' | 'top-right' | 'bottom';
  };
  // Created/updated
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════
// JABRILIA ÉDITIONS — PRE-FILLED CHARTER
// ═══════════════════════════════════════════════════

const JABRILIA_ROMAN: CollectionSpec = {
  id: 'jabrilia-roman',
  name: 'Romans & Essais',
  description: 'Littérature contemporaine, essais, récits — format classique français',
  formatLabel: 'Roman français (13,5 × 21 cm)',
  widthMm: 135,
  heightMm: 210,
  marginInnerMm: 23.0,
  marginOuterMm: 19.0,
  marginTopMm: 18.0,
  marginBottomMm: 27.0,
  mirrorMargins: true,
  bodyText: {
    fontFamily: 'EB Garamond',
    fallback: 'Garamond, Georgia, serif',
    sizePt: 11.5,
    lineHeightPt: 15,
    alignment: 'justified',
    indentMm: 4.5,
    color: '#1A1A1A',
  },
  chapterTitle: {
    fontFamily: 'EB Garamond',
    fallback: 'Garamond, Georgia, serif',
    sizePt: 15,
    lineHeightPt: 20,
    alignment: 'left',
    indentMm: 0,
    color: '#1A1A1A',
  },
  chapterNumber: {
    fontFamily: 'EB Garamond',
    fallback: 'Garamond, Georgia, serif',
    sizePt: 12.5,
    lineHeightPt: 16,
    alignment: 'left',
    indentMm: 0,
    color: '#1A1A1A',
  },
  folios: {
    fontFamily: 'EB Garamond',
    fallback: 'Garamond, Georgia, serif',
    sizePt: 9,
    lineHeightPt: 12,
    alignment: 'center',
    indentMm: 0,
    color: '#666666',
  },
  coverTitle: {
    fontFamily: 'Playfair Display',
    fallback: 'Georgia, serif',
    sizePt: 28,
    lineHeightPt: 34,
    alignment: 'center',
    indentMm: 0,
    color: '#1A1A1A',
  },
  coverAuthor: {
    fontFamily: 'EB Garamond',
    fallback: 'Garamond, Georgia, serif',
    sizePt: 14,
    lineHeightPt: 18,
    alignment: 'center',
    indentMm: 0,
    color: '#1A1A1A',
  },
  coverBackText: {
    fontFamily: 'EB Garamond',
    fallback: 'Garamond, Georgia, serif',
    sizePt: 10.5,
    lineHeightPt: 14,
    alignment: 'justified',
    indentMm: 0,
    color: '#333333',
  },
  palette: {
    primary: '#2D1B4E',
    secondary: '#C8952E',
    accent: '#5B3E8A',
    background: '#FFFFFF',
    text: '#1A1A1A',
    muted: '#6B645B',
  },
  chapterStartsRecto: true,
  separatorStyle: '∗ ∗ ∗',
  firstParaNoIndent: true,
  dialogDash: '—',
  paperGSM: 80,
  paperType: 'Offset blanc 80g',
  coverPaperGSM: 250,
  coverFinish: 'mat',
  prelimPages: [
    'Faux-titre (titre seul, petites capitales, centré)',
    'Page blanche',
    'Page de titre (Auteur / Titre / « roman » / Jabrilia Éditions)',
    'Page copyright (©, ISBN, dépôt légal, achevé d\'imprimer, mention fiction)',
    'Dédicace (italique, fer à droite)',
    'Page blanche',
  ],
  notes: [
    'Chapitres : numéro en petites capitales 12,5 pt, titre en 15 pt romain (ni gras ni italique)',
    'Espace 6-8 lignes avant le titre de chapitre',
    '1 ligne entre numéro et titre, 2-3 lignes entre titre et texte',
    'Tirets de dialogue : cadratin (—)',
    'Pas de gras dans le corps du texte',
    'Pas de doubles espaces',
    'Folios invisibles sur les pages de titre de chapitre et liminaires',
  ],
};

const JABRILIA_ETINCELLES: CollectionSpec = {
  id: 'jabrilia-etincelles',
  name: 'Collection Étincelles',
  description: 'Jeunesse illustrée, 8-11 ans — grandes transitions humaines avec douceur',
  formatLabel: 'A5 (151 × 216 mm)',
  widthMm: 151,
  heightMm: 216,
  marginInnerMm: 20.0,
  marginOuterMm: 15.0,
  marginTopMm: 15.0,
  marginBottomMm: 20.0,
  mirrorMargins: true,
  bodyText: {
    fontFamily: 'EB Garamond',
    fallback: 'Garamond, Georgia, serif',
    sizePt: 12.5,
    lineHeightPt: 18,
    alignment: 'justified',
    indentMm: 5.0,
    color: '#2D1810',
  },
  chapterTitle: {
    fontFamily: 'EB Garamond',
    fallback: 'Garamond, Georgia, serif',
    sizePt: 18,
    lineHeightPt: 24,
    alignment: 'center',
    indentMm: 0,
    color: '#2D1810',
  },
  chapterNumber: {
    fontFamily: 'EB Garamond',
    fallback: 'Garamond, Georgia, serif',
    sizePt: 14,
    lineHeightPt: 18,
    alignment: 'center',
    indentMm: 0,
    color: '#E8874A',
  },
  folios: {
    fontFamily: 'EB Garamond',
    fallback: 'Garamond, Georgia, serif',
    sizePt: 9,
    lineHeightPt: 12,
    alignment: 'center',
    indentMm: 0,
    color: '#9E8E7E',
  },
  coverTitle: {
    fontFamily: 'Playfair Display',
    fallback: 'Georgia, serif',
    sizePt: 26,
    lineHeightPt: 32,
    alignment: 'center',
    indentMm: 0,
    color: '#2D1810',
  },
  coverAuthor: {
    fontFamily: 'EB Garamond',
    fallback: 'Garamond, Georgia, serif',
    sizePt: 13,
    lineHeightPt: 16,
    alignment: 'center',
    indentMm: 0,
    color: '#2D1810',
  },
  coverBackText: {
    fontFamily: 'EB Garamond',
    fallback: 'Garamond, Georgia, serif',
    sizePt: 11,
    lineHeightPt: 15,
    alignment: 'justified',
    indentMm: 0,
    color: '#2D1810',
  },
  palette: {
    primary: '#E8874A',
    secondary: '#C8952E',
    accent: '#D4A574',
    background: '#FAF7F2',
    text: '#2D1810',
    muted: '#9E8E7E',
  },
  chapterStartsRecto: true,
  separatorStyle: '✦',
  firstParaNoIndent: true,
  dialogDash: '—',
  paperGSM: 90,
  paperType: 'Bouffant ivoire 90g',
  coverPaperGSM: 250,
  coverFinish: 'mat',
  prelimPages: [
    'Faux-titre',
    'Page collection (Collection Étincelles)',
    'Page de titre (Auteur & Illustrateur / Titre / Jabrilia Éditions)',
    'Page copyright (©, ISBN, dépôt légal, mention illustrateur)',
    'Dédicace',
    'Page blanche',
  ],
  notes: [
    'Fond crème #FAF7F2 obligatoire sur toutes les pages',
    'Texte en brun profond #2D1810 — JAMAIS en noir pur',
    'Palette chaude uniquement — interdiction de gris froid',
    'Corail/abricot #E8874A = couleur signature collection',
    'Étoile dorée comme symbole récurrent (étincelle)',
    'Frises végétales (feuilles, branches) comme motif décoratif',
    'Niveau de finition : Bayard / Nathan / Gallimard Jeunesse',
    'Illustrations : résolution 300 DPI minimum',
  ],
};

const JABRILIA_BD: CollectionSpec = {
  id: 'jabrilia-bd',
  name: 'Bande dessinée & Roman graphique',
  description: 'BD et romans graphiques — format européen, palette chaude',
  formatLabel: 'BD européenne (170 × 240 mm)',
  widthMm: 170,
  heightMm: 240,
  marginInnerMm: 15.0,
  marginOuterMm: 10.0,
  marginTopMm: 10.0,
  marginBottomMm: 12.0,
  mirrorMargins: true,
  bodyText: {
    fontFamily: 'Georgia',
    fallback: 'Times New Roman, serif',
    sizePt: 10,
    lineHeightPt: 13,
    alignment: 'left',
    indentMm: 0,
    color: '#1A1A1A',
  },
  chapterTitle: {
    fontFamily: 'Playfair Display',
    fallback: 'Georgia, serif',
    sizePt: 22,
    lineHeightPt: 28,
    alignment: 'center',
    indentMm: 0,
    color: '#2D1810',
  },
  chapterNumber: {
    fontFamily: 'Playfair Display',
    fallback: 'Georgia, serif',
    sizePt: 16,
    lineHeightPt: 20,
    alignment: 'center',
    indentMm: 0,
    color: '#C8952E',
  },
  folios: {
    fontFamily: 'Georgia',
    fallback: 'serif',
    sizePt: 8,
    lineHeightPt: 10,
    alignment: 'center',
    indentMm: 0,
    color: '#999999',
  },
  coverTitle: {
    fontFamily: 'Playfair Display',
    fallback: 'Georgia, serif',
    sizePt: 32,
    lineHeightPt: 38,
    alignment: 'center',
    indentMm: 0,
    color: '#FFFFFF',
  },
  coverAuthor: {
    fontFamily: 'Georgia',
    fallback: 'serif',
    sizePt: 14,
    lineHeightPt: 18,
    alignment: 'center',
    indentMm: 0,
    color: '#F0E6D6',
  },
  coverBackText: {
    fontFamily: 'Georgia',
    fallback: 'serif',
    sizePt: 10.5,
    lineHeightPt: 14,
    alignment: 'justified',
    indentMm: 0,
    color: '#333333',
  },
  palette: {
    primary: '#C8952E',
    secondary: '#8B4513',
    accent: '#E07A2F',
    background: '#F5E6D0',
    text: '#2D1810',
    muted: '#9E8E7E',
  },
  chapterStartsRecto: true,
  separatorStyle: '—',
  firstParaNoIndent: true,
  dialogDash: '—',
  paperGSM: 150,
  paperType: 'Couché mat 150g',
  coverPaperGSM: 300,
  coverFinish: 'brillant',
  prelimPages: [
    'Page de garde (illustration pleine page)',
    'Page de titre (Auteur / Titre / Jabrilia Éditions)',
    'Page copyright (©, ISBN, dépôt légal, crédits illustration)',
  ],
  notes: [
    'Palette ocre / terracotta / doré — chaleur et luminosité',
    'Georgia comme police de narration et dialogue',
    'Playfair Display pour les titres et intertitres',
    'Papier couché mat 150g pour rendu des couleurs',
    'Couverture brillante 300g (impact visuel en librairie)',
    'Impression CMYK Fogra39 obligatoire',
    'Résolution illustrations : 300 DPI minimum, 400 DPI recommandé',
  ],
};

export const JABRILIA_CHARTER: PublisherCharter = {
  id: 'jabrilia',
  name: 'Jabrilia',
  fullName: 'Jabrilia Éditions',
  logoPositionCover: 'bottom-center',
  address: 'Jabrilia Éditions — France',
  website: 'https://jabrilia.com',
  email: 'contact@jabrilia.com',
  isbnPrefix: '978-2-488647',
  legalMentions: {
    depotLegal: true,
    imprimeur: 'Achevé d\'imprimer par [imprimeur] — [mois] [année]',
    acheveDimprimer: true,
    mentionFiction: true,
    copyrightFormat: '© [année] Jabrilia Éditions — Tous droits réservés',
  },
  defaultDistributor: 'pollen',
  distributors: ['pollen', 'kdp', 'ingramspark'],
  collections: [JABRILIA_ROMAN, JABRILIA_ETINCELLES, JABRILIA_BD],
  coverRules: {
    authorPosition: 'top',
    titlePosition: 'center',
    publisherLogoOnSpine: true,
    backCoverLayout: [
      'Texte de 4e (résumé / accroche)',
      'Espace',
      'Nom de l\'auteur (bio courte optionnelle)',
      'Espace',
      'Logo Jabrilia Éditions',
      'ISBN + code-barres EAN-13',
      'Prix TTC',
      'Mention dépôt légal',
    ],
    barcodePosition: 'bottom-right',
    pricePosition: 'near-barcode',
  },
  createdAt: '2024-01-01',
  updatedAt: '2026-03-04',
};

// ═══════════════════════════════════════════════════
// EMPTY CHARTER TEMPLATE (for new publishers)
// ═══════════════════════════════════════════════════

export const EMPTY_CHARTER: PublisherCharter = {
  id: '',
  name: '',
  fullName: '',
  logoPositionCover: 'bottom-center',
  address: '',
  isbnPrefix: '978-2-',
  legalMentions: {
    depotLegal: true,
    imprimeur: '',
    acheveDimprimer: false,
    mentionFiction: false,
    copyrightFormat: '© [année] [Éditeur] — Tous droits réservés',
  },
  defaultDistributor: 'pollen',
  distributors: ['pollen'],
  collections: [{
    id: 'default',
    name: 'Collection principale',
    description: '',
    formatLabel: 'Roman français (13,5 × 21 cm)',
    widthMm: 135,
    heightMm: 210,
    marginInnerMm: 23.0,
    marginOuterMm: 19.0,
    marginTopMm: 18.0,
    marginBottomMm: 27.0,
    mirrorMargins: true,
    bodyText: {
      fontFamily: '',
      fallback: 'Georgia, serif',
      sizePt: 11,
      lineHeightPt: 15,
      alignment: 'justified',
      indentMm: 5,
      color: '#1A1A1A',
    },
    chapterTitle: { fontFamily: '', fallback: 'Georgia, serif', sizePt: 16, lineHeightPt: 20, alignment: 'left', indentMm: 0, color: '#1A1A1A' },
    chapterNumber: { fontFamily: '', fallback: 'Georgia, serif', sizePt: 12, lineHeightPt: 16, alignment: 'left', indentMm: 0, color: '#1A1A1A' },
    folios: { fontFamily: '', fallback: 'Georgia, serif', sizePt: 9, lineHeightPt: 12, alignment: 'center', indentMm: 0, color: '#666666' },
    coverTitle: { fontFamily: '', fallback: 'Georgia, serif', sizePt: 24, lineHeightPt: 30, alignment: 'center', indentMm: 0, color: '#1A1A1A' },
    coverAuthor: { fontFamily: '', fallback: 'Georgia, serif', sizePt: 14, lineHeightPt: 18, alignment: 'center', indentMm: 0, color: '#1A1A1A' },
    coverBackText: { fontFamily: '', fallback: 'Georgia, serif', sizePt: 10, lineHeightPt: 14, alignment: 'justified', indentMm: 0, color: '#333333' },
    palette: { primary: '#333333', secondary: '#666666', accent: '#C8952E', background: '#FFFFFF', text: '#1A1A1A', muted: '#999999' },
    chapterStartsRecto: true,
    separatorStyle: '∗ ∗ ∗',
    firstParaNoIndent: true,
    dialogDash: '—',
    paperGSM: 80,
    paperType: 'Offset blanc 80g',
    coverPaperGSM: 250,
    coverFinish: 'mat',
    prelimPages: ['Faux-titre', 'Page de titre', 'Copyright'],
    notes: [],
  }],
  coverRules: {
    authorPosition: 'top',
    titlePosition: 'center',
    publisherLogoOnSpine: false,
    backCoverLayout: ['Texte de 4e', 'ISBN + code-barres', 'Prix TTC'],
    barcodePosition: 'bottom-right',
    pricePosition: 'near-barcode',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ═══════════════════════════════════════════════════
// CHARTER-AWARE COVER AUDIT
// ═══════════════════════════════════════════════════
// Extends the distributor audit with publisher-specific checks

export interface CharterAuditItem {
  id: string;
  label: string;
  status: 'ok' | 'missing' | 'warning' | 'mismatch';
  message: string;
  expected?: string;
  actual?: string;
  fix?: string;
}

export function auditCoverAgainstCharter(
  project: {
    title: string;
    author: string;
    genre: string;
    collection?: string;
    pages: number;
    coverTitleFont?: string;
    coverAuthorFont?: string;
    backCover?: string;
  },
  charter: PublisherCharter
): CharterAuditItem[] {
  const items: CharterAuditItem[] = [];

  // Find matching collection
  const col = charter.collections.find(c =>
    (project.genre.toLowerCase().includes('bd') || project.genre.toLowerCase().includes('graphique'))
      ? c.id.includes('bd')
      : (project.genre.toLowerCase().includes('jeunesse') || project.collection?.toLowerCase().includes('étincelles'))
        ? c.id.includes('etincelles') || c.id.includes('jeunesse')
        : c.id.includes('roman') || c.id === 'default'
  ) || charter.collections[0];

  if (col) {
    items.push({
      id: 'collection_match',
      label: 'Collection',
      status: 'ok',
      message: `Collection détectée : ${col.name}`,
    });

    // Check cover title font
    if (project.coverTitleFont && project.coverTitleFont !== col.coverTitle.fontFamily) {
      items.push({
        id: 'cover_title_font',
        label: 'Police titre couverture',
        status: 'mismatch',
        message: `Police non conforme à la charte ${charter.name}`,
        expected: `${col.coverTitle.fontFamily} ${col.coverTitle.sizePt}pt`,
        actual: project.coverTitleFont,
        fix: `Utiliser ${col.coverTitle.fontFamily} en ${col.coverTitle.sizePt}pt, ${col.coverTitle.alignment}`,
      });
    } else {
      items.push({
        id: 'cover_title_font',
        label: 'Police titre couverture',
        status: project.coverTitleFont ? 'ok' : 'warning',
        message: project.coverTitleFont
          ? `${project.coverTitleFont} — conforme`
          : `Recommandation charte : ${col.coverTitle.fontFamily} ${col.coverTitle.sizePt}pt`,
        expected: `${col.coverTitle.fontFamily} ${col.coverTitle.sizePt}pt`,
      });
    }

    // Paper specs
    items.push({
      id: 'paper_spec',
      label: 'Papier intérieur',
      status: 'ok',
      message: `Charte ${charter.name} : ${col.paperType}`,
      expected: col.paperType,
    });

    items.push({
      id: 'cover_paper',
      label: 'Papier couverture',
      status: 'ok',
      message: `${col.coverPaperGSM} g/m² ${col.coverFinish}`,
      expected: `${col.coverPaperGSM} g/m² ${col.coverFinish}`,
    });

    // Format check
    items.push({
      id: 'format',
      label: 'Format de la collection',
      status: 'ok',
      message: `${col.formatLabel}`,
      expected: `${col.widthMm} × ${col.heightMm} mm`,
    });

    // Palette
    items.push({
      id: 'palette',
      label: 'Palette couleurs',
      status: 'ok',
      message: `Primaire ${col.palette.primary}, accent ${col.palette.accent}, fond ${col.palette.background}`,
    });

    // Back cover layout
    items.push({
      id: 'back_layout',
      label: 'Structure 4e de couverture',
      status: 'ok',
      message: charter.coverRules.backCoverLayout.join(' → '),
    });
  }

  // Legal mentions
  if (charter.legalMentions.depotLegal) {
    items.push({
      id: 'depot_legal_charter',
      label: 'Dépôt légal',
      status: 'ok',
      message: `Requis par la charte ${charter.name}`,
      expected: 'Mention "Dépôt légal : [mois] [année]"',
    });
  }

  if (charter.legalMentions.acheveDimprimer) {
    items.push({
      id: 'acheve_imprimer',
      label: 'Achevé d\'imprimer',
      status: 'ok',
      message: charter.legalMentions.imprimeur,
      expected: charter.legalMentions.imprimeur,
    });
  }

  // ISBN prefix
  items.push({
    id: 'isbn_prefix',
    label: 'Préfixe ISBN',
    status: 'ok',
    message: `Préfixe éditeur : ${charter.isbnPrefix}`,
    expected: charter.isbnPrefix,
  });

  return items;
}

// Get collection-specific cover typography recommendations
export function getCoverTypoRecommendation(
  genre: string,
  collectionName: string | undefined,
  charter: PublisherCharter
): {
  title: TypographySpec;
  author: TypographySpec;
  backText: TypographySpec;
  collection: CollectionSpec;
} {
  const col = charter.collections.find(c =>
    (genre.toLowerCase().includes('bd') || genre.toLowerCase().includes('graphique'))
      ? c.id.includes('bd')
      : (genre.toLowerCase().includes('jeunesse') || collectionName?.toLowerCase().includes('étincelles'))
        ? c.id.includes('etincelles') || c.id.includes('jeunesse')
        : c.id.includes('roman') || c.id === 'default'
  ) || charter.collections[0];

  return {
    title: col.coverTitle,
    author: col.coverAuthor,
    backText: col.coverBackText,
    collection: col,
  };
}
