// ═══════════════════════════════════════════════════════════════════
// JABR — Audiobook Production Engine
// ElevenLabs TTS integration · Chapter splitting · Audio mastering
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════
// TYPES
// ═══════════════════════════════════

export interface AudioChapter {
  id: number;
  title: string;
  text: string;
  wordCount: number;
  estimatedMinutes: number;
  status: 'pending' | 'generating' | 'done' | 'error';
  audioUrl?: string;
  audioBlob?: Blob;
  error?: string;
}

export interface AudiobookProject {
  projectId: number;
  title: string;
  author: string;
  chapters: AudioChapter[];
  voiceId: string;
  voiceName: string;
  modelId: string;
  totalWords: number;
  totalMinutes: number;
  estimatedCost: number;
  status: 'idle' | 'splitting' | 'generating' | 'mastering' | 'done' | 'error';
  progress: number; // 0-100
}

export interface ElevenLabsVoice {
  id: string;
  name: string;
  category: string;
  description: string;
  previewUrl?: string;
  costPerChar: number; // approximate
}

// ═══════════════════════════════════
// CHAPTER SPLITTER
// ═══════════════════════════════════

export function splitIntoChapters(text: string, title: string): AudioChapter[] {
  // Try to detect chapter patterns
  const patterns = [
    /^(Chapitre\s+\w+[.\s:—–-]*.*?)$/gim,
    /^(CHAPITRE\s+\w+[.\s:—–-]*.*?)$/gm,
    /^(Chapter\s+\w+[.\s:—–-]*.*?)$/gim,
    /^(\d+\.\s+.+)$/gm,
    /^(#{1,3}\s+.+)$/gm, // Markdown headers
    /^(Prologue|Épilogue|Introduction|Conclusion|Avant-propos|Préface)$/gim,
  ];

  let splits: { title: string; startIdx: number }[] = [];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length >= 2) {
      splits = matches.map(m => ({
        title: m[1].replace(/^#+\s*/, '').trim(),
        startIdx: m.index!,
      }));
      break;
    }
  }

  // Fallback: split by double newlines every ~2000 words
  if (splits.length < 2) {
    const words = text.split(/\s+/);
    const chunkSize = 2000;
    const chunks = Math.ceil(words.length / chunkSize);
    splits = [];
    for (let i = 0; i < chunks; i++) {
      const startWord = i * chunkSize;
      // Find the actual character position
      let charPos = 0;
      let wordCount = 0;
      for (let j = 0; j < text.length && wordCount < startWord; j++) {
        if (text[j] === ' ' || text[j] === '\n') wordCount++;
        charPos = j;
      }
      splits.push({
        title: i === 0 ? 'Introduction' : `Section ${i + 1}`,
        startIdx: i === 0 ? 0 : charPos,
      });
    }
  }

  // Build chapters from splits
  const chapters: AudioChapter[] = [];

  // Add opening credits
  chapters.push({
    id: 0,
    title: 'Opening Credits',
    text: `${title}. Écrit par ${title.includes('—') ? title : 'l\'auteur'}. Lu par voix de synthèse. Produit par Jabrilia Éditions.`,
    wordCount: 15,
    estimatedMinutes: 0.5,
    status: 'pending',
  });

  for (let i = 0; i < splits.length; i++) {
    const start = splits[i].startIdx;
    const end = i < splits.length - 1 ? splits[i + 1].startIdx : text.length;
    const chapterText = text.slice(start, end).trim();
    const wordCount = chapterText.split(/\s+/).length;

    chapters.push({
      id: i + 1,
      title: splits[i].title,
      text: chapterText,
      wordCount,
      estimatedMinutes: Math.round(wordCount / 150 * 10) / 10, // ~150 words/min for narration
      status: 'pending',
    });
  }

  // Add closing credits
  chapters.push({
    id: chapters.length,
    title: 'Closing Credits',
    text: `Fin de ${title}. Merci de votre écoute. Ce livre audio a été produit par Jabrilia Éditions.`,
    wordCount: 20,
    estimatedMinutes: 0.5,
    status: 'pending',
  });

  return chapters;
}

// ═══════════════════════════════════
// ELEVENLABS API
// ═══════════════════════════════════

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

export async function fetchVoices(apiKey: string): Promise<ElevenLabsVoice[]> {
  try {
    const res = await fetch(`${ELEVENLABS_BASE}/voices`, {
      headers: { 'xi-api-key': apiKey },
    });
    const data = await res.json();
    if (!data.voices) return [];
    return data.voices.map((v: Record<string, unknown>) => ({
      id: v.voice_id as string,
      name: v.name as string,
      category: (v.category as string) || 'premade',
      description: ((v.labels as Record<string, string>)?.description) || '',
      previewUrl: v.preview_url as string,
      costPerChar: 0.00003, // approx for Creator plan
    }));
  } catch {
    return [];
  }
}

export async function generateSpeech(
  text: string,
  voiceId: string,
  apiKey: string,
  modelId: string = 'eleven_multilingual_v2'
): Promise<{ audioBlob?: Blob; error?: string }> {
  try {
    const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      return { error: (err as Record<string, unknown>).detail as string || `HTTP ${res.status}` };
    }

    const blob = await res.blob();
    return { audioBlob: blob };
  } catch (e) {
    return { error: `Erreur réseau : ${String(e)}` };
  }
}

// ═══════════════════════════════════
// BATCH GENERATION
// ═══════════════════════════════════

export async function generateChapterAudio(
  chapter: AudioChapter,
  voiceId: string,
  apiKey: string,
  modelId: string = 'eleven_multilingual_v2',
  onProgress?: (chapter: AudioChapter) => void
): Promise<AudioChapter> {
  const updated = { ...chapter, status: 'generating' as const };
  onProgress?.(updated);

  // Split long chapters into chunks (ElevenLabs has a 5000 char limit per request)
  const maxChars = 4500;
  const textChunks: string[] = [];
  let remaining = chapter.text;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      textChunks.push(remaining);
      break;
    }
    // Find a good break point (end of sentence)
    let breakPoint = remaining.lastIndexOf('. ', maxChars);
    if (breakPoint < maxChars * 0.5) breakPoint = remaining.lastIndexOf(' ', maxChars);
    if (breakPoint < 0) breakPoint = maxChars;
    textChunks.push(remaining.slice(0, breakPoint + 1));
    remaining = remaining.slice(breakPoint + 1).trim();
  }

  const audioBlobs: Blob[] = [];
  for (const chunk of textChunks) {
    const result = await generateSpeech(chunk, voiceId, apiKey, modelId);
    if (result.error) {
      return { ...chapter, status: 'error', error: result.error };
    }
    if (result.audioBlob) {
      audioBlobs.push(result.audioBlob);
    }
    // Small delay to respect rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  // Merge audio blobs
  const mergedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(mergedBlob);

  const done: AudioChapter = {
    ...chapter,
    status: 'done',
    audioBlob: mergedBlob,
    audioUrl,
  };
  onProgress?.(done);
  return done;
}

// ═══════════════════════════════════
// FULL AUDIOBOOK GENERATION
// ═══════════════════════════════════

export async function generateFullAudiobook(
  chapters: AudioChapter[],
  voiceId: string,
  apiKey: string,
  modelId: string = 'eleven_multilingual_v2',
  onChapterDone?: (chapter: AudioChapter, index: number, total: number) => void
): Promise<AudioChapter[]> {
  const results: AudioChapter[] = [];

  for (let i = 0; i < chapters.length; i++) {
    const result = await generateChapterAudio(
      chapters[i], voiceId, apiKey, modelId,
      (ch) => onChapterDone?.(ch, i, chapters.length)
    );
    results.push(result);

    if (result.status === 'error') {
      // Continue with remaining chapters even if one fails
      console.error(`Chapter ${i} failed:`, result.error);
    }

    // Delay between chapters
    await new Promise(r => setTimeout(r, 1000));
  }

  return results;
}

// ═══════════════════════════════════
// DOWNLOAD HELPERS
// ═══════════════════════════════════

export function downloadChapterAudio(chapter: AudioChapter, bookTitle: string) {
  if (!chapter.audioBlob) return;
  const url = URL.createObjectURL(chapter.audioBlob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = bookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const safeChapter = chapter.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  a.download = `${safeTitle}-${String(chapter.id).padStart(2, '0')}-${safeChapter}.mp3`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAllChapters(chapters: AudioChapter[], bookTitle: string) {
  const done = chapters.filter(c => c.audioBlob);
  done.forEach((ch, i) => {
    setTimeout(() => downloadChapterAudio(ch, bookTitle), i * 500);
  });
}

// ═══════════════════════════════════
// COST ESTIMATION
// ═══════════════════════════════════

export function estimateCost(totalChars: number, plan: 'starter' | 'creator' | 'pro' = 'creator'): {
  cost: number;
  currency: string;
  plan: string;
  charsIncluded: number;
  overage: number;
} {
  const plans = {
    starter: { monthly: 5, chars: 30000, overagePerChar: 0.0003 },
    creator: { monthly: 22, chars: 100000, overagePerChar: 0.00024 },
    pro: { monthly: 99, chars: 500000, overagePerChar: 0.00018 },
  };

  const p = plans[plan];
  const overage = Math.max(0, totalChars - p.chars);
  const cost = p.monthly + overage * p.overagePerChar;

  return {
    cost: Math.round(cost * 100) / 100,
    currency: '€',
    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
    charsIncluded: p.chars,
    overage,
  };
}

// ═══════════════════════════════════
// ACX/AUDIBLE SPECS VALIDATION
// ═══════════════════════════════════

export interface ACXValidation {
  valid: boolean;
  checks: { label: string; ok: boolean; detail: string }[];
}

export function validateACXSpecs(chapters: AudioChapter[], coverImageUrl?: string): ACXValidation {
  const totalMinutes = chapters.reduce((s, c) => s + c.estimatedMinutes, 0);
  const hasOpening = chapters.some(c => c.title.toLowerCase().includes('opening'));
  const hasClosing = chapters.some(c => c.title.toLowerCase().includes('closing'));
  const allDone = chapters.every(c => c.status === 'done');

  const checks = [
    { label: 'Durée minimum', ok: totalMinutes >= 60, detail: `${Math.round(totalMinutes)} min (min: 60 min)` },
    { label: 'Opening Credits', ok: hasOpening, detail: hasOpening ? 'Présent ✓' : 'Manquant — requis par ACX' },
    { label: 'Closing Credits', ok: hasClosing, detail: hasClosing ? 'Présent ✓' : 'Manquant — requis par ACX' },
    { label: 'Fichiers par chapitre', ok: chapters.length >= 3, detail: `${chapters.length} fichiers` },
    { label: 'Audio généré', ok: allDone, detail: allDone ? 'Tous les chapitres ✓' : `${chapters.filter(c => c.status === 'done').length}/${chapters.length}` },
    { label: 'Couverture 2400×2400', ok: !!coverImageUrl, detail: coverImageUrl ? 'Image disponible' : 'Requis — JPEG carré 2400px' },
  ];

  return { valid: checks.every(c => c.ok), checks };
}
