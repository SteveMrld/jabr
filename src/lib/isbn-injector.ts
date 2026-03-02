// ═══════════════════════════════════════════════════
// JABR ISBN Injector — Injection page copyright .docx
// Insère la page de mentions légales avec ISBN,
// dépôt légal, éditeur, et crédits dans un manuscrit.
// ═══════════════════════════════════════════════════

export interface CopyrightData {
  title: string;
  subtitle?: string;
  author: string;
  illustrator?: string;
  isbn: string;
  publisher: string;
  publisherAddress: string;
  printedBy: string;
  depositDate: string; // "Mars 2026"
  edition: string; // "Première édition"
  collection?: string;
  copyright?: string; // "© 2026 Steve Moradel"
  rights?: string;
  website?: string;
}

// Default Jabrilia data
export const JABRILIA_DEFAULTS: Partial<CopyrightData> = {
  publisher: 'Jabrilia Éditions',
  publisherAddress: 'Jabrilia Éditions — Paris, France',
  printedBy: 'Imprimé par Amazon / Lightning Source',
  edition: 'Première édition',
  rights: 'Tous droits réservés. Aucune partie de cet ouvrage ne peut être reproduite, stockée ou transmise sous quelque forme que ce soit sans l\'autorisation écrite préalable de l\'éditeur.',
  website: 'www.jabrilia.com',
};

/**
 * Génère le contenu texte de la page copyright.
 */
export function generateCopyrightText(data: CopyrightData): string {
  const lines: string[] = [];

  // Titre
  lines.push(data.title);
  if (data.subtitle) lines.push(data.subtitle);
  lines.push('');

  // Auteur
  lines.push(`${data.author}`);
  if (data.illustrator) lines.push(`Illustrations : ${data.illustrator}`);
  lines.push('');

  // Copyright
  const year = new Date().getFullYear();
  lines.push(data.copyright || `© ${year} ${data.author}`);
  lines.push('');

  // ISBN
  lines.push(`ISBN : ${data.isbn}`);
  lines.push('');

  // Dépôt légal
  lines.push(`Dépôt légal : ${data.depositDate}`);
  lines.push(data.edition);
  lines.push('');

  // Éditeur
  lines.push(data.publisher);
  lines.push(data.publisherAddress);
  if (data.website) lines.push(data.website);
  lines.push('');

  // Impression
  lines.push(data.printedBy);
  lines.push('');

  // Collection
  if (data.collection) {
    lines.push(`Collection : ${data.collection}`);
    lines.push('');
  }

  // Droits
  if (data.rights) {
    lines.push(data.rights);
  }

  return lines.join('\n');
}

/**
 * Génère le XML OpenXML pour la page copyright.
 * Retourne un paragraphe XML à insérer dans document.xml.
 */
export function generateCopyrightXml(data: CopyrightData): string {
  const year = new Date().getFullYear();
  const copyright = data.copyright || `© ${year} ${data.author}`;

  // Helper: create a paragraph with specific formatting
  const para = (text: string, opts?: { bold?: boolean; size?: number; spacing?: number; align?: string }) => {
    const sz = opts?.size || 18; // 9pt default (half-points)
    const spacingAfter = opts?.spacing ?? 60;
    const jc = opts?.align || 'center';
    return `<w:p>
      <w:pPr>
        <w:jc w:val="${jc}"/>
        <w:spacing w:after="${spacingAfter}" w:line="276" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Garamond" w:hAnsi="Garamond"/>
          <w:sz w:val="${sz}"/>
          <w:szCs w:val="${sz}"/>
          ${opts?.bold ? '<w:b/><w:bCs/>' : ''}
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>`;
  };

  // Empty paragraph for spacing
  const spacer = (pts: number = 200) => `<w:p>
    <w:pPr><w:spacing w:after="${pts}"/></w:pPr>
  </w:p>`;

  // Page break before
  const pageBreak = `<w:p>
    <w:pPr><w:sectPr><w:pgSz w:w="9639" w:h="14496"/></w:sectPr></w:pPr>
    <w:r><w:br w:type="page"/></w:r>
  </w:p>`;

  const lines: string[] = [];

  // Page break to ensure copyright is on its own page
  lines.push(pageBreak);

  // Vertical spacing to push content toward center/bottom
  lines.push(spacer(2000));

  // Title
  lines.push(para(data.title, { bold: true, size: 24, spacing: 40 }));
  if (data.subtitle) {
    lines.push(para(data.subtitle, { size: 20, spacing: 80 }));
  }

  lines.push(spacer(200));

  // Author
  lines.push(para(data.author, { size: 20, spacing: 40 }));
  if (data.illustrator) {
    lines.push(para(`Illustrations : ${data.illustrator}`, { size: 18, spacing: 80 }));
  }

  lines.push(spacer(200));

  // Copyright + ISBN
  lines.push(para(copyright, { size: 18, spacing: 40 }));
  lines.push(para(`ISBN : ${data.isbn}`, { bold: true, size: 18, spacing: 80 }));

  lines.push(spacer(120));

  // Dépôt légal
  lines.push(para(`Dépôt légal : ${data.depositDate}`, { size: 16, spacing: 20 }));
  lines.push(para(data.edition, { size: 16, spacing: 80 }));

  lines.push(spacer(120));

  // Éditeur
  lines.push(para(data.publisher, { bold: true, size: 18, spacing: 20 }));
  lines.push(para(data.publisherAddress, { size: 16, spacing: 20 }));
  if (data.website) {
    lines.push(para(data.website, { size: 16, spacing: 80 }));
  }

  // Impression
  lines.push(para(data.printedBy, { size: 16, spacing: 80 }));

  // Collection
  if (data.collection) {
    lines.push(para(`Collection : ${data.collection}`, { size: 16, spacing: 80 }));
  }

  lines.push(spacer(200));

  // Droits
  if (data.rights) {
    lines.push(para(data.rights, { size: 14, spacing: 0, align: 'both' }));
  }

  return lines.join('\n');
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Génère les données copyright à partir d'un projet JABR.
 */
export function projectToCopyrightData(project: {
  title: string;
  subtitle?: string;
  author: string;
  illustrator?: string;
  collection?: string;
  editions: { format: string; isbn: string }[];
}): CopyrightData {
  const primaryEdition = project.editions.find(e => e.format === 'broché') || project.editions[0];
  const now = new Date();
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return {
    ...JABRILIA_DEFAULTS as CopyrightData,
    title: project.title,
    subtitle: project.subtitle,
    author: project.author,
    illustrator: project.illustrator,
    isbn: primaryEdition?.isbn || '',
    collection: project.collection,
    depositDate: `${months[now.getMonth()]} ${now.getFullYear()}`,
    copyright: `© ${now.getFullYear()} ${project.author}`,
  };
}
