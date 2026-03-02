import { NextRequest, NextResponse } from 'next/server';
import { analyzeText } from '@/lib/scanner';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!file.name.endsWith('.docx')) {
      return NextResponse.json({ error: 'Format non supporté. Envoyez un fichier .docx' }, { status: 400 });
    }

    // Limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 });
    }

    // Extract text from .docx using mammoth
    const buffer = Buffer.from(await file.arrayBuffer());
    const { value: text } = await mammoth.extractRawText({ buffer });

    if (!text || text.trim().length < 100) {
      return NextResponse.json({ error: 'Le fichier semble vide ou trop court' }, { status: 400 });
    }

    // Run scanner
    const result = analyzeText(text, {
      title,
      file: file.name,
      extended: true,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Scanner error:', err);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse du manuscrit' },
      { status: 500 }
    );
  }
}
