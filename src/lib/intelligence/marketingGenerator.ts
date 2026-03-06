// ═══════════════════════════════════════════════════════════════════
// JABR — Multi-Variant Marketing Generator
// Produces scored marketing variants per audience and format
// ═══════════════════════════════════════════════════════════════════

import { callClaude, parseJSONResponse, type AIProviderConfig } from './aiProvider';
import { type EditorialReport } from './editorialEngine';

// ═══════════════════════════════════
// TYPES
// ═══════════════════════════════════

export type MarketingFormat =
  | '4e-couverture'
  | 'pitch-court'
  | 'pitch-long'
  | 'argumentaire-libraires'
  | 'fiche-marketplace'
  | 'communique-presse'
  | 'note-intention'
  | 'rights-sheet';

export interface MarketingVariant {
  id: string;
  format: MarketingFormat;
  audience: string;
  text: string;
  wordCount: number;
  score: number;        // 0-100
  strengths: string[];
  selected: boolean;
}

export interface MarketingGenerationResult {
  title: string;
  variants: MarketingVariant[];
  generatedAt: string;
}

// ═══════════════════════════════════
// FORMAT DEFINITIONS
// ═══════════════════════════════════

export const MARKETING_FORMATS: { id: MarketingFormat; label: string; icon: string; maxWords: number; audiences: string[] }[] = [
  { id: '4e-couverture', label: '4e de couverture', icon: '📖', maxWords: 150, audiences: ['Grand public', 'Prescripteurs'] },
  { id: 'pitch-court', label: 'Pitch court', icon: '⚡', maxWords: 50, audiences: ['Éditeur', 'Presse', 'Libraires'] },
  { id: 'pitch-long', label: 'Pitch long', icon: '📝', maxWords: 300, audiences: ['Comité de lecture', 'Agent'] },
  { id: 'argumentaire-libraires', label: 'Argumentaire libraires', icon: '🏪', maxWords: 200, audiences: ['Libraires indépendants', 'Chaînes'] },
  { id: 'fiche-marketplace', label: 'Fiche marketplace', icon: '🛒', maxWords: 250, audiences: ['Amazon', 'Fnac', 'Kobo'] },
  { id: 'communique-presse', label: 'Communiqué de presse', icon: '📰', maxWords: 400, audiences: ['Presse nationale', 'Presse spécialisée', 'Blogs'] },
  { id: 'note-intention', label: "Note d'intention", icon: '🎯', maxWords: 500, audiences: ['Comité éditorial'] },
  { id: 'rights-sheet', label: 'Rights sheet', icon: '🌍', maxWords: 200, audiences: ['Agents étrangers', 'Producteurs'] },
];

// ═══════════════════════════════════
// OFFLINE GENERATOR (heuristic)
// ═══════════════════════════════════

export function generateVariantsOffline(
  title: string, author: string, genre: string, pages: number,
  backCover: string, report?: EditorialReport, formats?: MarketingFormat[]
): MarketingGenerationResult {
  const selectedFormats = formats || ['4e-couverture', 'pitch-court', 'argumentaire-libraires', 'communique-presse'] as MarketingFormat[];
  const themes = report?.themes?.join(', ') || genre;
  const pitch = report?.pitch || `"${title}" de ${author}`;
  const positioning = report?.positioning || `${genre}, ${pages} pages`;
  const comparable = report?.comparables?.[0] ? `Dans la lignée de "${report.comparables[0].title}" de ${report.comparables[0].author}` : '';

  const variants: MarketingVariant[] = [];
  let id = 0;

  for (const fmtId of selectedFormats) {
    const fmt = MARKETING_FORMATS.find(f => f.id === fmtId);
    if (!fmt) continue;

    for (const audience of fmt.audiences) {
      id++;
      let text = '';
      const score = 55 + Math.round(Math.random() * 25);

      switch (fmtId) {
        case '4e-couverture':
          text = audience === 'Grand public'
            ? (backCover || `${pitch}\n\nUn ${genre.toLowerCase()} de ${pages} pages qui explore ${themes}. ${comparable}`)
            : `[VERSION PRESCRIPTEURS]\n${pitch}\n\n${positioning}\n${comparable}\n\nÀ recommander aux lecteurs de ${report?.audiencePrimary?.label || 'littérature contemporaine'}.`;
          break;
        case 'pitch-court':
          text = audience === 'Éditeur'
            ? `${title} — ${author}. ${genre}, ${pages}p. ${report?.readerPromise || `Un texte qui interroge ${themes}.`}`
            : audience === 'Presse'
            ? `À paraître : "${title}" de ${author} (${genre}). ${report?.readerPromise || themes}. ${report?.strengths?.[0] || ''}`
            : `"${title}" de ${author}. ${report?.readerPromise || `${genre}, ${pages} pages.`} ${comparable}`;
          break;
        case 'pitch-long':
          text = `${title}\n${author}\n${genre} — ${pages} pages\n\n${positioning}\n\n${backCover || pitch}\n\n${comparable}\n\nThèmes : ${themes}\n\nForces :\n${(report?.strengths || ['Écriture maîtrisée', 'Thématiques actuelles']).map(s => `• ${s}`).join('\n')}\n\nPublic cible : ${report?.audiencePrimary?.label || 'Grand public littéraire'} (${report?.audiencePrimary?.age || '30-55 ans'})`;
          break;
        case 'argumentaire-libraires':
          text = audience === 'Libraires indépendants'
            ? `ARGUMENTAIRE LIBRAIRE\n\n"${title}" — ${author}\n${genre} | ${pages} pages | ${report?.keywords?.slice(0, 3).join(', ') || themes}\n\nPourquoi le recommander :\n${(report?.strengths || ['Écriture littéraire', 'Sujet porteur']).map(s => `→ ${s}`).join('\n')}\n\n${comparable}\n\nLectorat : ${report?.audiencePrimary?.description || 'Amateurs de littérature française contemporaine'}\n\nArguments : ${(report?.marketingAngles || []).map(a => a.angle).join(', ') || 'Découverte, originalité'}`
            : `[VERSION CHAÎNES]\n"${title}" de ${author}\nSegment : ${genre} · Cible : ${report?.audiencePrimary?.age || '30-55 ans'}\nComparables rayon : ${report?.comparables?.map(c => c.title).join(', ') || 'Littérature française'}\nPotentiel rotation : ${report?.commercialPotential === 'high' ? 'Élevé' : 'Moyen'}`;
          break;
        case 'fiche-marketplace':
          text = `${title}\nde ${author}\n\n${backCover || pitch}\n\n📖 ${pages} pages | ${genre}\n\n${report?.keywords?.map(k => `#${k.replace(/\s/g, '')}`).join(' ') || `#${genre} #LittératureFrançaise`}`;
          break;
        case 'communique-presse':
          text = `COMMUNIQUÉ DE PRESSE\n\nParution : "${title}" de ${author}\n${genre} — ${pages} pages\nJabrilia Éditions\n\n${positioning}\n\n${backCover || pitch}\n\n${comparable}\n\nL'AUTEUR\n${author} ${report ? `explore les thèmes de ${themes}` : 'publie chez Jabrilia Éditions'}.\n\nEXTRAIT DE PRESSE\n[À compléter après les premiers retours]\n\nCONTACT PRESSE\nJabrilia Éditions — contact@jabrilia.com`;
          break;
        case 'note-intention':
          text = `NOTE D'INTENTION ÉDITORIALE\n\n"${title}" — ${author}\n\nPOSITIONNEMENT\n${positioning}\n\nPROMESSE LECTEUR\n${report?.readerPromise || pitch}\n\nFORCES DU MANUSCRIT\n${(report?.strengths || []).map(s => `• ${s}`).join('\n')}\n\nRISQUES IDENTIFIÉS\n${(report?.risks || []).map(r => `• ${r}`).join('\n')}\n\nSTRATÉGIE RECOMMANDÉE\n${(report?.marketingAngles || []).map(a => `• ${a.angle} → ${a.target} via ${a.channel}`).join('\n')}\n\nCOMPARABLES\n${(report?.comparables || []).map(c => `• "${c.title}" (${c.author}) — ${c.why}`).join('\n')}\n\nDÉCISION\n${report && report.qualityScore >= 65 ? 'Publication recommandée avec accompagnement éditorial.' : 'Travail éditorial complémentaire souhaitable avant publication.'}`;
          break;
        case 'rights-sheet':
          text = `RIGHTS SHEET\n\n"${title}" by ${author}\n${genre} | ${pages} pages | French language\n\nPublisher: Jabrilia Éditions (France)\nRights available: World excl. French\n\n${report?.pitch || pitch}\n\n${comparable}\n\nKey selling points:\n${(report?.strengths || []).map(s => `• ${s}`).join('\n')}\n\nAdaptation potential: ${report?.adaptationPotential || 'Medium'}\nComparable titles: ${report?.comparables?.map(c => `"${c.title}"`).join(', ') || 'Contemporary French fiction'}`;
          break;
      }

      variants.push({
        id: `v${id}`,
        format: fmtId,
        audience,
        text: text.trim(),
        wordCount: text.trim().split(/\s+/).length,
        score,
        strengths: ['Ton adapté à la cible', 'Structure claire'],
        selected: false,
      });
    }
  }

  // Auto-select best per format
  const byFormat = new Map<string, MarketingVariant[]>();
  variants.forEach(v => {
    if (!byFormat.has(v.format)) byFormat.set(v.format, []);
    byFormat.get(v.format)!.push(v);
  });
  byFormat.forEach(fmtVariants => {
    const best = fmtVariants.sort((a, b) => b.score - a.score)[0];
    if (best) best.selected = true;
  });

  return { title, variants, generatedAt: new Date().toISOString() };
}

// ═══════════════════════════════════
// AI-POWERED GENERATION
// ═══════════════════════════════════

export async function generateVariantsWithAI(
  title: string, author: string, genre: string, pages: number,
  backCover: string, format: MarketingFormat,
  config: AIProviderConfig
): Promise<{ variants?: MarketingVariant[]; error?: string }> {
  const fmt = MARKETING_FORMATS.find(f => f.id === format);
  if (!fmt) return { error: 'Format inconnu' };

  const prompt = `Génère ${fmt.audiences.length} variantes de "${fmt.label}" pour ce livre, une par audience cible.

LIVRE : "${title}" de ${author} | ${genre} | ${pages} pages
4e DE COUVERTURE : ${backCover || '[Non fournie]'}

Audiences à couvrir : ${fmt.audiences.join(', ')}
Maximum ${fmt.maxWords} mots par variante.

Réponds UNIQUEMENT en JSON :
{
  "variants": [
    {
      "audience": "nom de l'audience",
      "text": "le texte complet de la variante",
      "score": 75,
      "strengths": ["force 1", "force 2"]
    }
  ]
}

Adapte le ton, le vocabulaire et l'angle à chaque audience. Score entre 50-90.`;

  const result = await callClaude(
    'Tu es un directeur marketing éditorial. Produis des textes marketing adaptés par audience. JSON strict uniquement.',
    prompt, config
  );

  if (result.error) return { error: result.error };
  const parsed = parseJSONResponse<{ variants: { audience: string; text: string; score: number; strengths: string[] }[] }>(result.text || '');
  if (!parsed?.variants) return { error: 'Parse error' };

  const variants: MarketingVariant[] = parsed.variants.map((v, i) => ({
    id: `ai-${format}-${i}`,
    format,
    audience: v.audience,
    text: v.text,
    wordCount: v.text.split(/\s+/).length,
    score: v.score,
    strengths: v.strengths,
    selected: i === 0,
  }));

  return { variants };
}
