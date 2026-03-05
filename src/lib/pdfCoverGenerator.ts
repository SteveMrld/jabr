// ═══════════════════════════════════════════════════════════════════
// JABR — PDF Cover Generator (pdf-lib)
// Generates real PDF files for print production
// ═══════════════════════════════════════════════════════════════════

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, degrees } from 'pdf-lib';

function mmToPoints(mm: number): number {
  return mm * 2.8346456693; // 1mm = 2.8346pt
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

export interface PDFCoverConfig {
  // Dimensions
  trimWidthMm: number;
  trimHeightMm: number;
  spineWidthMm: number;
  bleedMm: number;
  // Text
  title: string;
  subtitle?: string;
  author: string;
  publisherName: string;
  backCoverText: string;
  isbn: string;
  price?: string;
  depotLegal?: string;
  // Colors
  titleColor: string;
  spineColor: string;
  // Cover image (base64 PNG/JPEG)
  coverImageBytes?: Uint8Array;
  coverImageType?: 'png' | 'jpeg';
  // Spine
  canHaveSpineText: boolean;
}

export async function generateCoverPDF(config: PDFCoverConfig): Promise<Uint8Array> {
  const {
    trimWidthMm, trimHeightMm, spineWidthMm, bleedMm,
    title, subtitle, author, publisherName, backCoverText, isbn, price, depotLegal,
    titleColor, spineColor, coverImageBytes, coverImageType,
    canHaveSpineText,
  } = config;

  const trimW = mmToPoints(trimWidthMm);
  const trimH = mmToPoints(trimHeightMm);
  const spineW = mmToPoints(spineWidthMm);
  const bleed = mmToPoints(bleedMm);
  const totalW = trimW * 2 + spineW + bleed * 2;
  const totalH = trimH + bleed * 2;
  const safeMargin = mmToPoints(8);

  const pdfDoc = await PDFDocument.create();
  
  // Set metadata
  pdfDoc.setTitle(`Couverture — ${title}`);
  pdfDoc.setAuthor(author);
  pdfDoc.setProducer('JABR — Jabrilia Éditions Pipeline');
  pdfDoc.setCreator('JABR Cover Studio');

  const page = pdfDoc.addPage([totalW, totalH]);
  
  // Load fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  // ── WHITE BACKGROUND ──
  page.drawRectangle({ x: 0, y: 0, width: totalW, height: totalH, color: rgb(1, 1, 1) });

  // ── C4 (Back cover) — Left side ──
  const c4X = bleed;
  const c4Y = bleed;

  // Back cover text
  const backTextColor = hexToRgb('#2D2A26');
  const maxTextWidth = trimW - safeMargin * 2;
  const backFontSize = 9;
  const lineHeight = backFontSize * 1.6;
  const lines = wrapTextPDF(timesRoman, backCoverText, backFontSize, maxTextWidth);
  const maxLines = Math.floor((trimH - safeMargin * 4 - 80) / lineHeight);
  
  lines.slice(0, maxLines).forEach((line, i) => {
    page.drawText(line, {
      x: c4X + safeMargin,
      y: c4Y + trimH - safeMargin - backFontSize - i * lineHeight,
      size: backFontSize,
      font: timesRoman,
      color: rgb(backTextColor.r, backTextColor.g, backTextColor.b),
    });
  });

  // Publisher name
  page.drawText(publisherName, {
    x: c4X + safeMargin,
    y: c4Y + safeMargin + 70,
    size: 7,
    font: helvetica,
    color: rgb(0.62, 0.59, 0.54),
  });

  // ISBN
  page.drawText(`ISBN : ${isbn}`, {
    x: c4X + safeMargin,
    y: c4Y + safeMargin + 55,
    size: 7,
    font: courier,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Barcode placeholder rectangle
  const barcodeW = mmToPoints(38);
  const barcodeH = mmToPoints(18);
  page.drawRectangle({
    x: c4X + trimW - safeMargin - barcodeW,
    y: c4Y + safeMargin + 10,
    width: barcodeW, height: barcodeH,
    color: rgb(0.95, 0.94, 0.92),
    borderColor: rgb(0.85, 0.83, 0.80),
    borderWidth: 0.5,
  });
  page.drawText('EAN-13', {
    x: c4X + trimW - safeMargin - barcodeW / 2 - 10,
    y: c4Y + safeMargin + barcodeH / 2 + 5,
    size: 7, font: courier, color: rgb(0.6, 0.6, 0.6),
  });
  page.drawText(isbn.replace(/[-\s]/g, ''), {
    x: c4X + trimW - safeMargin - barcodeW / 2 - 20,
    y: c4Y + safeMargin + 5,
    size: 7, font: courier, color: rgb(0.2, 0.2, 0.2),
  });

  // Price
  if (price) {
    page.drawText(price, {
      x: c4X + trimW - safeMargin - barcodeW - mmToPoints(5),
      y: c4Y + safeMargin + barcodeH / 2,
      size: 10, font: helveticaBold, color: rgb(0.18, 0.10, 0.30),
    });
  }

  // Depot legal
  if (depotLegal) {
    page.drawText(depotLegal, {
      x: c4X + safeMargin,
      y: c4Y + safeMargin + 2,
      size: 6, font: helvetica, color: rgb(0.6, 0.6, 0.6),
    });
  }

  // ── SPINE ──
  const spineX = bleed + trimW;
  const sc = hexToRgb(spineColor);
  page.drawRectangle({
    x: spineX, y: bleed,
    width: spineW, height: trimH,
    color: rgb(sc.r, sc.g, sc.b),
  });

  if (canHaveSpineText && spineW > mmToPoints(6)) {
    const spineText = `${title}  —  ${author}`;
    const spineFontSize = Math.min(8, spineW / 2.8346 * 0.35);
    // Vertical text on spine (rotated)
    // Spine text
    const spineTextWidth = helveticaBold.widthOfTextAtSize(spineText, spineFontSize);
    const spineCenter = spineX + spineW / 2;
    const spineMidY = bleed + trimH / 2;
    
    // Draw rotated text
    page.drawText(spineText, {
      x: spineCenter + spineFontSize / 3,
      y: spineMidY - spineTextWidth / 2,
      size: spineFontSize,
      font: helveticaBold,
      color: rgb(1, 1, 1),
      rotate: degrees(90),
    });
  }

  // ── C1 (Front cover) — Right side ──
  const c1X = bleed + trimW + spineW;
  const c1Y = bleed;

  // Embed cover image if provided
  if (coverImageBytes && coverImageType) {
    try {
      const image = coverImageType === 'png'
        ? await pdfDoc.embedPng(coverImageBytes)
        : await pdfDoc.embedJpg(coverImageBytes);
      
      // Scale to fit front cover area
      const imgDims = image.scale(1);
      const scaleX = (trimW + bleed) / imgDims.width;
      const scaleY = trimH / imgDims.height;
      const scale = Math.max(scaleX, scaleY); // Cover entire area
      
      page.drawImage(image, {
        x: c1X,
        y: c1Y,
        width: imgDims.width * scale,
        height: imgDims.height * scale,
      });

      // Semi-transparent overlays for text readability
      // Top gradient
      page.drawRectangle({
        x: c1X, y: c1Y + trimH - mmToPoints(30),
        width: trimW + bleed, height: mmToPoints(30),
        color: rgb(0, 0, 0), opacity: 0.3,
      });
      // Bottom gradient
      page.drawRectangle({
        x: c1X, y: c1Y,
        width: trimW + bleed, height: mmToPoints(20),
        color: rgb(0, 0, 0), opacity: 0.3,
      });

      // Author — top (white on image)
      const authorWidth = helvetica.widthOfTextAtSize(author.toUpperCase(), 10);
      page.drawText(author.toUpperCase(), {
        x: c1X + trimW / 2 - authorWidth / 2,
        y: c1Y + trimH - safeMargin - 12,
        size: 10, font: helvetica, color: rgb(1, 1, 1),
      });

      // Title — center (white on image)
      const titleFontSize = title.length > 25 ? 18 : 22;
      const titleLines = wrapTextPDF(timesRomanBold, title, titleFontSize, trimW - safeMargin * 2);
      const titleLineH = titleFontSize * 1.3;
      const titleStartY = c1Y + trimH / 2 + (titleLines.length * titleLineH) / 2;
      titleLines.forEach((line, i) => {
        const tw = timesRomanBold.widthOfTextAtSize(line, titleFontSize);
        page.drawText(line, {
          x: c1X + trimW / 2 - tw / 2,
          y: titleStartY - i * titleLineH,
          size: titleFontSize, font: timesRomanBold, color: rgb(1, 1, 1),
        });
      });

      // Subtitle
      if (subtitle) {
        const subSize = 9;
        const sw = timesRoman.widthOfTextAtSize(subtitle, subSize);
        page.drawText(subtitle, {
          x: c1X + trimW / 2 - sw / 2,
          y: titleStartY - titleLines.length * titleLineH - 5,
          size: subSize, font: timesRoman, color: rgb(0.9, 0.9, 0.9),
        });
      }

      // Publisher — bottom (white on image)
      const pubText = publisherName.toUpperCase();
      const pw = helveticaBold.widthOfTextAtSize(pubText, 7);
      page.drawText(pubText, {
        x: c1X + trimW / 2 - pw / 2,
        y: c1Y + safeMargin,
        size: 7, font: helveticaBold, color: rgb(0.85, 0.85, 0.85),
      });

    } catch {
      // Fallback: solid background
      drawFrontCoverText(page, c1X, c1Y, trimW, trimH, safeMargin, config, timesRomanBold, timesRoman, helvetica, helveticaBold);
    }
  } else {
    // No image: clean typographic cover
    const bgColor = hexToRgb('#FAF7F2');
    page.drawRectangle({
      x: c1X, y: c1Y,
      width: trimW + bleed, height: trimH,
      color: rgb(bgColor.r, bgColor.g, bgColor.b),
    });
    drawFrontCoverText(page, c1X, c1Y, trimW, trimH, safeMargin, config, timesRomanBold, timesRoman, helvetica, helveticaBold);
  }

  // ── TRIM MARKS ──
  const markLen = mmToPoints(5);
  const markColor = rgb(0, 0, 0);
  // Top-left
  page.drawLine({ start: { x: bleed, y: totalH - bleed }, end: { x: bleed, y: totalH - bleed + markLen }, thickness: 0.25, color: markColor });
  page.drawLine({ start: { x: bleed, y: totalH - bleed }, end: { x: bleed - markLen, y: totalH - bleed }, thickness: 0.25, color: markColor });
  // Top-right
  page.drawLine({ start: { x: totalW - bleed, y: totalH - bleed }, end: { x: totalW - bleed, y: totalH - bleed + markLen }, thickness: 0.25, color: markColor });
  page.drawLine({ start: { x: totalW - bleed, y: totalH - bleed }, end: { x: totalW - bleed + markLen, y: totalH - bleed }, thickness: 0.25, color: markColor });
  // Bottom-left
  page.drawLine({ start: { x: bleed, y: bleed }, end: { x: bleed, y: bleed - markLen }, thickness: 0.25, color: markColor });
  page.drawLine({ start: { x: bleed, y: bleed }, end: { x: bleed - markLen, y: bleed }, thickness: 0.25, color: markColor });
  // Bottom-right
  page.drawLine({ start: { x: totalW - bleed, y: bleed }, end: { x: totalW - bleed, y: bleed - markLen }, thickness: 0.25, color: markColor });
  page.drawLine({ start: { x: totalW - bleed, y: bleed }, end: { x: totalW - bleed + markLen, y: bleed }, thickness: 0.25, color: markColor });

  return pdfDoc.save();
}

function drawFrontCoverText(
  page: PDFPage, c1X: number, c1Y: number, trimW: number, trimH: number, safeMargin: number,
  config: PDFCoverConfig, timesRomanBold: PDFFont, timesRoman: PDFFont, helvetica: PDFFont, helveticaBold: PDFFont
) {
  const tc = hexToRgb(config.titleColor);
  
  // Author
  const authorText = config.author.toUpperCase();
  const aw = helvetica.widthOfTextAtSize(authorText, 10);
  page.drawText(authorText, {
    x: c1X + trimW / 2 - aw / 2,
    y: c1Y + trimH - safeMargin - 20,
    size: 10, font: helvetica, color: rgb(tc.r, tc.g, tc.b),
  });

  // Title
  const titleFontSize = config.title.length > 25 ? 20 : 26;
  const titleLines = wrapTextPDF(timesRomanBold, config.title, titleFontSize, trimW - safeMargin * 2);
  const titleLineH = titleFontSize * 1.3;
  const titleStartY = c1Y + trimH / 2 + (titleLines.length * titleLineH) / 2;
  titleLines.forEach((line, i) => {
    const tw = timesRomanBold.widthOfTextAtSize(line, titleFontSize);
    page.drawText(line, {
      x: c1X + trimW / 2 - tw / 2,
      y: titleStartY - i * titleLineH,
      size: titleFontSize, font: timesRomanBold, color: rgb(tc.r, tc.g, tc.b),
    });
  });

  // Subtitle
  if (config.subtitle) {
    const sw = timesRoman.widthOfTextAtSize(config.subtitle, 10);
    page.drawText(config.subtitle, {
      x: c1X + trimW / 2 - sw / 2,
      y: titleStartY - titleLines.length * titleLineH - 8,
      size: 10, font: timesRoman, color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Publisher
  const pubText = config.publisherName.toUpperCase();
  const pw = helveticaBold.widthOfTextAtSize(pubText, 7);
  page.drawText(pubText, {
    x: c1X + trimW / 2 - pw / 2,
    y: c1Y + safeMargin + 5,
    size: 7, font: helveticaBold, color: rgb(0.6, 0.6, 0.6),
  });
}

function wrapTextPDF(font: PDFFont, text: string, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ═══════════════════════════════════
// DOWNLOAD HELPER
// ═══════════════════════════════════

export function downloadPDF(bytes: Uint8Array, filename: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = new Blob([bytes as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════
// IMAGE FETCH HELPER
// ═══════════════════════════════════

export async function fetchImageAsBytes(url: string): Promise<{ bytes: Uint8Array; type: 'png' | 'jpeg' } | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const type = blob.type.includes('png') ? 'png' : 'jpeg';
    return { bytes: new Uint8Array(arrayBuffer), type };
  } catch {
    return null;
  }
}
