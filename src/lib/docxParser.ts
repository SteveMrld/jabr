// ═══════════════════════════════════════════════════════════════════
// JABR — DOCX Parser for Audiobook Text Extraction
// Uses mammoth.js to extract clean text from .docx files
// ═══════════════════════════════════════════════════════════════════

import mammoth from 'mammoth';

export interface ParsedManuscript {
  rawText: string;
  wordCount: number;
  estimatedPages: number;
  estimatedMinutes: number;
  detectedChapters: string[];
}

export async function parseDocx(file: File): Promise<ParsedManuscript> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Extract raw text (no HTML)
  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value;
  
  // Stats
  const wordCount = rawText.split(/\s+/).filter(w => w.length > 0).length;
  const estimatedPages = Math.round(wordCount / 250); // ~250 words/page
  const estimatedMinutes = Math.round(wordCount / 150); // ~150 words/min narration

  // Detect chapters
  const chapterPatterns = [
    /^(Chapitre\s+\w+[.\s:—–-]*.*?)$/gim,
    /^(CHAPITRE\s+\w+[.\s:—–-]*.*?)$/gm,
    /^(Chapter\s+\w+[.\s:—–-]*.*?)$/gim,
    /^(Prologue|Épilogue|Introduction|Conclusion|Avant-propos|Préface)$/gim,
  ];

  const detectedChapters: string[] = [];
  for (const pattern of chapterPatterns) {
    const matches = [...rawText.matchAll(pattern)];
    matches.forEach(m => detectedChapters.push(m[1].trim()));
    if (detectedChapters.length >= 2) break;
  }

  return {
    rawText,
    wordCount,
    estimatedPages,
    estimatedMinutes,
    detectedChapters: detectedChapters.length > 0 ? detectedChapters : [`~${Math.ceil(wordCount / 2000)} sections auto-détectées`],
  };
}
