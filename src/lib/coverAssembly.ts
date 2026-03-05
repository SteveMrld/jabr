// ═══════════════════════════════════════════════════════════════════
// JABR — Cover Assembly Engine
// Canvas-based cover generation: image + title + author + ISBN + barcode
// API integrations: DALL-E, Runway
// Social media visual generator
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════
// BARCODE GENERATOR (EAN-13)
// ═══════════════════════════════════

function calculateEAN13CheckDigit(digits12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check.toString();
}

function encodeEAN13(isbn: string): number[] {
  // Clean ISBN to 13 digits
  const clean = isbn.replace(/[-\s]/g, '');
  const digits = clean.length === 12 ? clean + calculateEAN13CheckDigit(clean) : clean.slice(0, 13);
  
  const LEFT_ODD  = [[0,0,0,1,1,0,1],[0,0,1,1,0,0,1],[0,0,1,0,0,1,1],[0,1,1,1,1,0,1],[0,1,0,0,0,1,1],[0,1,1,0,0,0,1],[0,1,0,1,1,1,1],[0,1,1,1,0,1,1],[0,1,1,0,1,1,1],[0,0,0,1,0,1,1]];
  const LEFT_EVEN = [[0,1,0,0,1,1,1],[0,1,1,0,0,1,1],[0,0,1,1,0,1,1],[0,1,0,0,0,0,1],[0,0,1,1,1,0,1],[0,1,1,1,0,0,1],[0,0,0,0,1,0,1],[0,0,1,0,0,0,1],[0,0,0,1,0,0,1],[0,0,1,0,1,1,1]];
  const RIGHT     = [[1,1,1,0,0,1,0],[1,1,0,0,1,1,0],[1,1,0,1,1,0,0],[1,0,0,0,0,1,0],[1,0,1,1,1,0,0],[1,0,0,1,1,1,0],[1,0,1,0,0,0,0],[1,0,0,0,1,0,0],[1,0,0,1,0,0,0],[1,1,1,0,1,0,0]];
  const PARITY    = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];

  const bars: number[] = [];
  // Start guard
  bars.push(1, 0, 1);
  // Left 6 digits
  const parity = PARITY[parseInt(digits[0])];
  for (let i = 1; i <= 6; i++) {
    const d = parseInt(digits[i]);
    const encoding = parity[i - 1] === 'L' ? LEFT_ODD[d] : LEFT_EVEN[d];
    bars.push(...encoding);
  }
  // Center guard
  bars.push(0, 1, 0, 1, 0);
  // Right 6 digits
  for (let i = 7; i <= 12; i++) {
    bars.push(...RIGHT[parseInt(digits[i])]);
  }
  // End guard
  bars.push(1, 0, 1);
  return bars;
}

function drawBarcode(ctx: CanvasRenderingContext2D, isbn: string, x: number, y: number, width: number, height: number) {
  const bars = encodeEAN13(isbn);
  const barWidth = width / bars.length;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x - 4, y - 4, width + 8, height + 20);
  
  for (let i = 0; i < bars.length; i++) {
    if (bars[i] === 1) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + i * barWidth, y, barWidth + 0.5, height);
    }
  }
  
  // ISBN text below barcode
  const clean = isbn.replace(/[-\s]/g, '');
  ctx.fillStyle = '#000000';
  ctx.font = `${Math.max(8, height * 0.2)}px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(clean.slice(0, 13), x + width / 2, y + height + 12);
}

// ═══════════════════════════════════
// COVER CANVAS ASSEMBLER
// ═══════════════════════════════════

export interface CoverAssemblyConfig {
  // Image
  coverImageUrl?: string;
  backgroundColor?: string;
  // Text
  title: string;
  subtitle?: string;
  author: string;
  publisherName: string;
  // Fonts
  titleFont: string;
  titleSize: number;
  authorFont: string;
  authorSize: number;
  // Colors
  titleColor: string;
  authorColor: string;
  publisherColor: string;
  // 4e de couverture
  backCoverText: string;
  backFont: string;
  backSize: number;
  backColor: string;
  // ISBN / Barcode
  isbn: string;
  price?: string;
  // Dimensions (mm)
  trimWidthMm: number;
  trimHeightMm: number;
  spineWidthMm: number;
  bleedMm: number;
  // DPI
  dpi: number;
  // Spine
  spineColor?: string;
  canHaveSpineText: boolean;
  // Publisher
  depotLegal?: string;
}

function mmToPx(mm: number, dpi: number): number {
  return Math.round(mm * dpi / 25.4);
}

export async function assembleCover(config: CoverAssemblyConfig): Promise<HTMLCanvasElement> {
  const {
    coverImageUrl, backgroundColor = '#FDFAF5',
    title, subtitle, author, publisherName,
    titleFont, titleSize, authorFont, authorSize,
    titleColor, authorColor, publisherColor,
    backCoverText, backFont, backSize, backColor,
    isbn, price,
    trimWidthMm, trimHeightMm, spineWidthMm, bleedMm,
    dpi, spineColor = '#2D1B4E', canHaveSpineText, depotLegal
  } = config;

  const trimW = mmToPx(trimWidthMm, dpi);
  const trimH = mmToPx(trimHeightMm, dpi);
  const spineW = mmToPx(spineWidthMm, dpi);
  const bleed = mmToPx(bleedMm, dpi);
  const totalW = trimW * 2 + spineW + bleed * 2;
  const totalH = trimH + bleed * 2;
  const safeMargin = mmToPx(5, dpi);

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, totalW, totalH);

  // ── C4 (Back cover) ──
  const c4X = bleed;
  const c4Y = bleed;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(c4X, c4Y, trimW, trimH);

  // Back cover text
  ctx.fillStyle = backColor;
  ctx.font = `${backSize}px ${backFont}`;
  ctx.textAlign = 'left';
  const maxTextW = trimW - safeMargin * 2;
  const lines = wrapText(ctx, backCoverText || '', maxTextW);
  const lineHeight = backSize * 1.6;
  const textStartY = c4Y + safeMargin + backSize;
  lines.slice(0, Math.floor((trimH - safeMargin * 4) / lineHeight)).forEach((line, i) => {
    ctx.fillText(line, c4X + safeMargin, textStartY + i * lineHeight);
  });

  // Publisher name on C4
  ctx.fillStyle = '#9E9689';
  ctx.font = `${Math.round(backSize * 0.7)}px 'Inter', sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(publisherName, c4X + safeMargin, c4Y + trimH - safeMargin * 2 - 80);

  // ISBN text
  ctx.fillStyle = '#333333';
  ctx.font = `${Math.round(backSize * 0.65)}px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(`ISBN : ${isbn}`, c4X + safeMargin, c4Y + trimH - safeMargin * 2 - 60);

  // Barcode
  const barcodeW = mmToPx(38, dpi);
  const barcodeH = mmToPx(18, dpi);
  const barcodeX = c4X + trimW - safeMargin - barcodeW;
  const barcodeY = c4Y + trimH - safeMargin - barcodeH - 16;
  drawBarcode(ctx, isbn, barcodeX, barcodeY, barcodeW, barcodeH);

  // Price
  if (price) {
    ctx.fillStyle = '#2D1B4E';
    ctx.font = `bold ${Math.round(backSize * 0.9)}px 'Inter', sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(price, c4X + trimW - safeMargin, barcodeY - 10);
  }

  // Depot legal
  if (depotLegal) {
    ctx.fillStyle = '#9E9689';
    ctx.font = `${Math.round(backSize * 0.6)}px 'Inter', sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(depotLegal, c4X + safeMargin, c4Y + trimH - safeMargin - 5);
  }

  // ── Spine ──
  const spineX = bleed + trimW;
  ctx.fillStyle = spineColor;
  ctx.fillRect(spineX, bleed, spineW, trimH);

  if (canHaveSpineText && spineW > mmToPx(5, dpi)) {
    ctx.save();
    ctx.translate(spineX + spineW / 2, bleed + trimH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `600 ${Math.min(Math.round(spineW * 0.35), mmToPx(3, dpi))}px 'Playfair Display', serif`;
    ctx.textAlign = 'center';
    const spineText = `${title}  —  ${author}`;
    ctx.fillText(spineText, 0, 0);
    ctx.restore();
  }

  // ── C1 (Front cover) ──
  const c1X = bleed + trimW + spineW;
  const c1Y = bleed;

  // Draw cover image or solid background
  if (coverImageUrl) {
    try {
      const img = await loadImage(coverImageUrl);
      // Cover the full front area + bleeds on right/top/bottom
      ctx.drawImage(img, c1X, c1Y, trimW, trimH);
      // Also extend to right bleed
      ctx.drawImage(img, c1X, c1Y, trimW + bleed, trimH);
    } catch {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(c1X, c1Y, trimW + bleed, trimH);
    }
  } else {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(c1X, c1Y, trimW + bleed, trimH);
  }

  // Text overlay on front
  // Gradient overlay for readability
  if (coverImageUrl) {
    const gradTop = ctx.createLinearGradient(c1X, c1Y, c1X, c1Y + trimH * 0.3);
    gradTop.addColorStop(0, 'rgba(0,0,0,0.5)');
    gradTop.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradTop;
    ctx.fillRect(c1X, c1Y, trimW, trimH * 0.3);

    const gradBot = ctx.createLinearGradient(c1X, c1Y + trimH * 0.7, c1X, c1Y + trimH);
    gradBot.addColorStop(0, 'rgba(0,0,0,0)');
    gradBot.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = gradBot;
    ctx.fillRect(c1X, c1Y + trimH * 0.7, trimW, trimH * 0.3);
  }

  // Author — top
  ctx.fillStyle = coverImageUrl ? '#FFFFFF' : authorColor;
  ctx.font = `${authorSize}px ${authorFont}`;
  ctx.textAlign = 'center';
  if (coverImageUrl) ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
  ctx.fillText(author.toUpperCase(), c1X + trimW / 2, c1Y + safeMargin + authorSize * 2);
  ctx.shadowBlur = 0;

  // Title — center
  ctx.fillStyle = coverImageUrl ? '#FFFFFF' : titleColor;
  ctx.font = `bold ${titleSize}px ${titleFont}`;
  ctx.textAlign = 'center';
  if (coverImageUrl) { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8; }
  const titleLines = wrapText(ctx, title, trimW - safeMargin * 2);
  const titleLineH = titleSize * 1.2;
  const titleStartY = c1Y + trimH / 2 - (titleLines.length * titleLineH) / 2;
  titleLines.forEach((line, i) => {
    ctx.fillText(line, c1X + trimW / 2, titleStartY + i * titleLineH);
  });
  ctx.shadowBlur = 0;

  // Subtitle
  if (subtitle) {
    ctx.fillStyle = coverImageUrl ? 'rgba(255,255,255,0.85)' : titleColor;
    ctx.font = `italic ${Math.round(titleSize * 0.45)}px ${titleFont}`;
    if (coverImageUrl) { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4; }
    ctx.fillText(subtitle, c1X + trimW / 2, titleStartY + titleLines.length * titleLineH + 10);
    ctx.shadowBlur = 0;
  }

  // Publisher — bottom
  ctx.fillStyle = coverImageUrl ? 'rgba(255,255,255,0.7)' : publisherColor;
  ctx.font = `600 ${Math.round(authorSize * 0.6)}px 'Inter', sans-serif`;
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  if (coverImageUrl) { ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 3; }
  ctx.fillText(publisherName.toUpperCase(), c1X + trimW / 2, c1Y + trimH - safeMargin * 1.5);
  ctx.shadowBlur = 0;

  return canvas;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// ═══════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════

export async function exportCoverAsPNG(config: CoverAssemblyConfig): Promise<Blob> {
  const canvas = await assembleCover(config);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas export failed')), 'image/png');
  });
}

export async function exportCoverAsJPEG(config: CoverAssemblyConfig, quality = 0.95): Promise<Blob> {
  const canvas = await assembleCover(config);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas export failed')), 'image/jpeg', quality);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════
// SOCIAL MEDIA VISUAL GENERATOR
// ═══════════════════════════════════

export interface SocialVisualConfig {
  coverImageUrl?: string;
  title: string;
  author: string;
  publisherName: string;
  price?: string;
  palette: { primary: string; secondary: string; background: string; text: string };
}

export async function generateSocialVisual(
  config: SocialVisualConfig,
  format: { id: string; widthPx: number; heightPx: number; layout: string }
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = format.widthPx;
  canvas.height = format.heightPx;
  const ctx = canvas.getContext('2d')!;
  const { widthPx: w, heightPx: h } = format;

  // Background
  ctx.fillStyle = config.palette.background;
  ctx.fillRect(0, 0, w, h);

  // Accent bar
  ctx.fillStyle = config.palette.secondary;
  ctx.fillRect(0, 0, w, 4);

  if (format.layout === 'cover-centered' || format.layout === 'cover-left') {
    // Try to load cover image
    let coverImg: HTMLImageElement | null = null;
    if (config.coverImageUrl) {
      try { coverImg = await loadImage(config.coverImageUrl); } catch { /* silent */ }
    }

    if (format.layout === 'cover-centered') {
      // ── CENTERED LAYOUT (Instagram post, story, TikTok) ──
      const coverW = Math.round(w * 0.5);
      const coverH = Math.round(coverW * 1.5);
      const coverX = (w - coverW) / 2;
      const coverY = (h - coverH) / 2 - h * 0.05;

      // Shadow behind book
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 10;

      if (coverImg) {
        ctx.drawImage(coverImg, coverX, coverY, coverW, coverH);
      } else {
        ctx.fillStyle = config.palette.primary;
        ctx.fillRect(coverX, coverY, coverW, coverH);
        // Title on solid cover
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(coverW * 0.12)}px 'Playfair Display', serif`;
        ctx.textAlign = 'center';
        ctx.fillText(config.title, coverX + coverW / 2, coverY + coverH / 2);
      }
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

      // Title below
      ctx.fillStyle = config.palette.text;
      ctx.font = `bold ${Math.round(w * 0.045)}px 'Playfair Display', serif`;
      ctx.textAlign = 'center';
      ctx.fillText(config.title, w / 2, coverY + coverH + h * 0.06);

      // Author
      ctx.fillStyle = config.palette.secondary;
      ctx.font = `${Math.round(w * 0.03)}px 'Inter', sans-serif`;
      ctx.fillText(config.author, w / 2, coverY + coverH + h * 0.1);

      // Publisher
      ctx.fillStyle = '#9E9689';
      ctx.font = `600 ${Math.round(w * 0.02)}px 'Inter', sans-serif`;
      ctx.fillText(config.publisherName.toUpperCase(), w / 2, h - h * 0.04);

    } else {
      // ── LEFT LAYOUT (Facebook, LinkedIn, X, newsletter) ──
      const coverH = Math.round(h * 0.7);
      const coverW = Math.round(coverH / 1.5);
      const coverX = w * 0.06;
      const coverY = (h - coverH) / 2;

      ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 6;
      if (coverImg) {
        ctx.drawImage(coverImg, coverX, coverY, coverW, coverH);
      } else {
        ctx.fillStyle = config.palette.primary;
        ctx.fillRect(coverX, coverY, coverW, coverH);
      }
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

      // Text on right
      const textX = coverX + coverW + w * 0.06;
      const textMaxW = w - textX - w * 0.06;

      ctx.fillStyle = config.palette.text;
      ctx.font = `bold ${Math.round(h * 0.07)}px 'Playfair Display', serif`;
      ctx.textAlign = 'left';
      const titleLines = wrapText(ctx, config.title, textMaxW);
      titleLines.forEach((line, i) => {
        ctx.fillText(line, textX, h * 0.35 + i * h * 0.09);
      });

      ctx.fillStyle = config.palette.secondary;
      ctx.font = `${Math.round(h * 0.04)}px 'Inter', sans-serif`;
      ctx.fillText(config.author, textX, h * 0.35 + titleLines.length * h * 0.09 + h * 0.04);

      if (config.price) {
        ctx.fillStyle = config.palette.primary;
        ctx.font = `bold ${Math.round(h * 0.05)}px 'Inter', sans-serif`;
        ctx.fillText(config.price, textX, h * 0.8);
      }

      ctx.fillStyle = '#9E9689';
      ctx.font = `600 ${Math.round(h * 0.025)}px 'Inter', sans-serif`;
      ctx.fillText(config.publisherName.toUpperCase(), textX, h * 0.9);
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Export failed')), 'image/png');
  });
}

// ═══════════════════════════════════
// DALL-E API INTEGRATION
// ═══════════════════════════════════

export async function generateImageWithDALLE(
  prompt: string,
  apiKey: string
): Promise<{ imageUrl?: string; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1792',
        quality: 'hd',
      }),
    });
    const data = await response.json();
    if (data.data?.[0]?.url) return { imageUrl: data.data[0].url };
    return { error: data.error?.message || 'Erreur DALL-E inconnue' };
  } catch (e) {
    return { error: `Erreur réseau : ${String(e)}` };
  }
}

// ═══════════════════════════════════
// RUNWAY API INTEGRATION
// ═══════════════════════════════════

export async function generateVideoWithRunway(
  imageUrl: string,
  prompt: string,
  apiKey: string,
  duration: number = 5
): Promise<{ taskId?: string; error?: string }> {
  try {
    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: 'gen3a_turbo',
        promptImage: imageUrl,
        promptText: prompt,
        duration: Math.min(duration, 10),
        watermark: false,
        ratio: '9:16',
      }),
    });
    const data = await response.json();
    if (data.id) return { taskId: data.id };
    return { error: data.error?.message || JSON.stringify(data) };
  } catch (e) {
    return { error: `Erreur Runway : ${String(e)}` };
  }
}

export async function checkRunwayStatus(
  taskId: string,
  apiKey: string
): Promise<{ status: string; videoUrl?: string; error?: string }> {
  try {
    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06' },
    });
    const data = await response.json();
    return { status: data.status || 'unknown', videoUrl: data.output?.[0], error: data.failure };
  } catch (e) {
    return { status: 'error', error: String(e) };
  }
}
