import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const project = await request.json();

    // Build comprehensive HTML for PDF
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Fiche Projet — ${project.title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; color: #2D2A26; background: white; padding: 40px; max-width: 800px; margin: 0 auto; }
.header { border-bottom: 3px solid #C8952E; padding-bottom: 24px; margin-bottom: 32px; }
.header h1 { font-family: 'Playfair Display', serif; font-size: 28px; color: #2D1B4E; margin-bottom: 4px; }
.header .subtitle { font-size: 14px; color: #9E9689; }
.header .meta { display: flex; gap: 16px; margin-top: 12px; font-size: 12px; color: #5B3E8A; }
.header .meta span { background: #F5F3EF; padding: 4px 12px; border-radius: 6px; }
.section { margin-bottom: 28px; }
.section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #C8952E; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #E8E4DF; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.field { background: #F5F3EF; padding: 10px 14px; border-radius: 8px; }
.field-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #9E9689; font-weight: 600; margin-bottom: 2px; }
.field-value { font-size: 13px; font-weight: 600; color: #2D1B4E; }
.badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; }
.badge-ok { background: #D4F0E0; color: #2EAE6D; }
.badge-warn { background: #FDE8D0; color: #E07A2F; }
.badge-err { background: #FFE0E3; color: #D94452; }
.edition-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #F5F3EF; font-size: 12px; }
.edition-format { font-weight: 600; color: #2D1B4E; }
.edition-isbn { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #5B3E8A; }
.diag-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 12px; }
.diag-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-ok { background: #2EAE6D; }
.dot-err { background: #D94452; }
.bar-container { height: 6px; border-radius: 3px; background: #F5F3EF; margin-top: 4px; }
.bar { height: 100%; border-radius: 3px; }
.footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #C8952E; text-align: center; font-size: 10px; color: #9E9689; }
.text-block { font-size: 12px; line-height: 1.7; color: #4A4542; background: #F5F3EF; padding: 14px; border-radius: 8px; }
@media print { body { padding: 20px; } }
</style>
</head>
<body>

<div class="header">
  <h1>${project.title}</h1>
  ${project.subtitle ? `<div class="subtitle">${project.subtitle}</div>` : ''}
  <div class="meta">
    <span>${project.author}</span>
    <span>${project.genre}</span>
    <span>${project.pages} pages</span>
    ${project.collection ? `<span>${project.collection}</span>` : ''}
    <span class="badge ${project.status === 'published' ? 'badge-ok' : project.status === 'in-progress' ? 'badge-warn' : 'badge-err'}">${project.status === 'published' ? 'Publié' : project.status === 'in-progress' ? 'En cours' : 'Brouillon'}</span>
  </div>
</div>

<div class="section">
  <div class="section-title">Éditions & ISBN</div>
  ${project.editions.map((e: { format: string; isbn: string; price?: string; status: string }) => `
    <div class="edition-row">
      <span class="edition-format">${e.format.charAt(0).toUpperCase() + e.format.slice(1)}</span>
      <span class="edition-isbn">${e.isbn}</span>
      <span>${e.price || '—'}</span>
      <span class="badge ${e.status === 'assigned' ? 'badge-ok' : 'badge-warn'}">${e.status}</span>
    </div>
  `).join('')}
</div>

<div class="section">
  <div class="section-title">Diagnostic Couverture — Score ${project.score}/${project.maxScore}</div>
  <div class="grid2">
    ${Object.entries(project.diag as Record<string, boolean>).map(([key, val]) => `
      <div class="diag-item">
        <div class="diag-dot ${val ? 'dot-ok' : 'dot-err'}"></div>
        <span>${key}</span>
        <span class="badge ${val ? 'badge-ok' : 'badge-err'}">${val ? '✓' : '✗'}</span>
      </div>
    `).join('')}
  </div>
  ${project.corrections && project.corrections.length > 0 ? `
    <div style="margin-top: 12px; padding: 10px 14px; background: #FFF8F0; border-radius: 8px; border-left: 3px solid #E07A2F;">
      <div style="font-size: 10px; font-weight: 700; color: #E07A2F; margin-bottom: 6px;">Corrections requises</div>
      ${project.corrections.map((c: string) => `<div style="font-size: 11px; color: #4A4542; padding: 2px 0;">• ${c}</div>`).join('')}
    </div>
  ` : ''}
</div>

${project.analysis ? `
<div class="section">
  <div class="section-title">Scanner 6D — Analyse Manuscrit</div>
  <div class="grid3">
    <div class="field">
      <div class="field-label">Score IA</div>
      <div class="field-value" style="color: ${project.analysis.iaScore > 30 ? '#D94452' : project.analysis.iaScore > 15 ? '#E07A2F' : '#2EAE6D'}">${project.analysis.iaScore}%</div>
      <div class="bar-container"><div class="bar" style="width: ${project.analysis.iaScore}%; background: ${project.analysis.iaScore > 30 ? '#D94452' : '#2EAE6D'}"></div></div>
    </div>
    <div class="field">
      <div class="field-label">Mots</div>
      <div class="field-value">${project.analysis.wordCount.toLocaleString()}</div>
    </div>
    <div class="field">
      <div class="field-label">Phrases (moy.)</div>
      <div class="field-value">${project.analysis.avgSentenceLength} mots</div>
    </div>
    <div class="field">
      <div class="field-label">Redondances</div>
      <div class="field-value">${project.analysis.redundancies}</div>
    </div>
    <div class="field">
      <div class="field-label">Patterns IA</div>
      <div class="field-value">${project.analysis.flaggedPatterns.length}</div>
    </div>
    <div class="field">
      <div class="field-label">Densité</div>
      <div class="field-value">${Math.round(project.analysis.wordCount / Math.max(project.pages, 1))} m/p</div>
    </div>
  </div>
  ${project.analysis.flaggedPatterns.length > 0 ? `
    <div style="margin-top: 12px; padding: 10px 14px; background: #FFF8F0; border-radius: 8px;">
      <div style="font-size: 10px; font-weight: 700; color: #E07A2F; margin-bottom: 6px;">${project.analysis.flaggedPatterns.length} patterns détectés</div>
      ${project.analysis.flaggedPatterns.slice(0, 5).map((fp: { pattern: string; count: number; severity: string }) => `
        <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0;">
          <span style="color: ${fp.severity === 'critical' ? '#D94452' : '#E07A2F'}">● ${fp.pattern}</span>
          <span style="color: #9E9689; font-weight: 600;">×${fp.count}</span>
        </div>
      `).join('')}
    </div>
  ` : ''}
</div>
` : ''}

${project.backCover ? `
<div class="section">
  <div class="section-title">4e de Couverture</div>
  <div class="text-block">${project.backCover}</div>
</div>
` : ''}

${project.notes ? `
<div class="section">
  <div class="section-title">Notes Éditoriales</div>
  <div class="text-block">${project.notes}</div>
</div>
` : ''}

<div class="footer">
  <strong style="color: #C8952E;">JABR</strong> — Jabrilia Éditions · Pipeline éditorial v2.0<br>
  Fiche générée le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Erreur génération PDF' }, { status: 500 });
  }
}
