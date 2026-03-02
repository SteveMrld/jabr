import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { projects } = await request.json();
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const published = projects.filter((p: any) => p.status === 'published').length;
    const inProgress = projects.filter((p: any) => p.status === 'in-progress').length;
    const totalISBN = projects.reduce((s: number, p: any) => s + (p.editions?.length || 0), 0);
    const totalPages = projects.reduce((s: number, p: any) => s + (p.pages || 0), 0);

    const projectCards = projects.map((p: any, i: number) => {
      const status = p.status === 'published' ? 'Publié' : p.status === 'in-progress' ? 'En cours' : 'Brouillon';
      const statusColor = p.status === 'published' ? '#2EAE6D' : p.status === 'in-progress' ? '#E07A2F' : '#9E9689';
      const statusBg = p.status === 'published' ? '#D4F0E0' : p.status === 'in-progress' ? '#FFF3E0' : '#F5F3EF';
      const score = p.maxScore > 0 ? Math.round((p.score / p.maxScore) * 100) : 0;
      const editions = (p.editions || []).map((e: any) => `
        <tr>
          <td style="padding:6px 10px;font-size:11px;color:#5B3E8A;text-transform:capitalize">${e.format}</td>
          <td style="padding:6px 10px;font-size:11px;font-family:'JetBrains Mono',monospace;color:#2D1B4E">${e.isbn || '—'}</td>
          <td style="padding:6px 10px;font-size:11px;color:#C8952E;font-weight:600">${e.price || '—'}</td>
          <td style="padding:6px 10px;font-size:11px"><span style="background:${e.status === 'in-progress' ? '#FFF3E0' : e.status === 'assigned' ? '#D4F0E0' : '#F5F3EF'};color:${e.status === 'in-progress' ? '#E07A2F' : e.status === 'assigned' ? '#2EAE6D' : '#9E9689'};padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700">${e.status}</span></td>
        </tr>
      `).join('');

      const diagChecks = p.diag ? Object.entries(p.diag).map(([k, v]) => `
        <span style="display:inline-block;padding:2px 8px;border-radius:8px;font-size:9px;margin:2px;background:${v ? '#D4F0E0' : '#FFE0E3'};color:${v ? '#2EAE6D' : '#D94452'}">${v ? '✓' : '✗'} ${k}</span>
      `).join('') : '';

      return `
      ${i > 0 ? '<div style="page-break-before:always"></div>' : ''}
      <div style="margin-bottom:40px">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #C8952E">
          <div style="width:60px;height:80px;border-radius:8px;background:linear-gradient(135deg,#2D1B4E,#5B3E8A);display:flex;align-items:center;justify-content:center;font-size:28px;color:white">${p.cover || '📖'}</div>
          <div style="flex:1">
            <h2 style="font-family:'Playfair Display',serif;font-size:22px;color:#2D1B4E;margin-bottom:2px">${p.title}</h2>
            ${p.subtitle ? `<div style="font-size:13px;color:#5B3E8A;margin-bottom:4px">${p.subtitle}</div>` : ''}
            <div style="font-size:12px;color:#9E9689">${p.author} · ${p.genre} · ${p.pages} pages${p.collection ? ` · Collection « ${p.collection} »` : ''}${p.series ? ` · Série « ${p.series} » T${p.seriesOrder || '?'}` : ''}</div>
          </div>
          <div style="text-align:right">
            <span style="background:${statusBg};color:${statusColor};padding:4px 12px;border-radius:8px;font-size:10px;font-weight:700">${status}</span>
            <div style="margin-top:6px;font-size:11px;color:#9E9689">Score ${score}%</div>
          </div>
        </div>

        ${p.backCover ? `
        <div style="margin-bottom:16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#C8952E;font-weight:700;margin-bottom:6px">4e de couverture</div>
          <div style="font-size:12px;color:#5B3E8A;line-height:1.7;padding:12px 16px;background:#F5F3EF;border-radius:8px">${p.backCover}</div>
        </div>` : ''}

        ${editions ? `
        <div style="margin-bottom:16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#C8952E;font-weight:700;margin-bottom:6px">Éditions & ISBN</div>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#F5F3EF">
              <th style="padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#9E9689;font-weight:700">Format</th>
              <th style="padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#9E9689;font-weight:700">ISBN</th>
              <th style="padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#9E9689;font-weight:700">Prix</th>
              <th style="padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#9E9689;font-weight:700">Statut</th>
            </tr></thead>
            <tbody>${editions}</tbody>
          </table>
        </div>` : ''}

        ${diagChecks ? `
        <div style="margin-bottom:16px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#C8952E;font-weight:700;margin-bottom:6px">Diagnostic couverture</div>
          <div>${diagChecks}</div>
        </div>` : ''}

        ${p.corrections && p.corrections.length > 0 ? `
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#D94452;font-weight:700;margin-bottom:6px">Corrections (${p.corrections.length})</div>
          ${p.corrections.map((c: string) => `<div style="font-size:11px;color:#D94452;padding:4px 0">• ${c}</div>`).join('')}
        </div>` : ''}
      </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Catalogue Jabrilia Éditions — ${date}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Inter',sans-serif; color:#2D2A26; background:white; padding:40px; max-width:800px; margin:0 auto; }
@media print { body { padding:20px; } }
</style>
</head>
<body>
  <!-- Cover page -->
  <div style="text-align:center;padding:80px 0 60px;border-bottom:3px solid #C8952E;margin-bottom:40px">
    <div style="font-size:14px;letter-spacing:6px;text-transform:uppercase;color:#C8952E;margin-bottom:12px">★</div>
    <h1 style="font-family:'Playfair Display',serif;font-size:36px;color:#2D1B4E;margin-bottom:8px">Catalogue</h1>
    <div style="font-family:'Playfair Display',serif;font-size:18px;color:#C8952E;letter-spacing:4px;margin-bottom:24px">JABRILIA ÉDITIONS</div>
    <div style="font-size:12px;color:#9E9689">${date}</div>
    <div style="display:flex;justify-content:center;gap:24px;margin-top:32px">
      <div style="text-align:center"><div style="font-family:'Playfair Display',serif;font-size:28px;color:#2D1B4E;font-weight:700">${projects.length}</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#9E9689">Titres</div></div>
      <div style="text-align:center"><div style="font-family:'Playfair Display',serif;font-size:28px;color:#2D1B4E;font-weight:700">${totalISBN}</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#9E9689">ISBN</div></div>
      <div style="text-align:center"><div style="font-family:'Playfair Display',serif;font-size:28px;color:#2D1B4E;font-weight:700">${published}</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#9E9689">Publiés</div></div>
      <div style="text-align:center"><div style="font-family:'Playfair Display',serif;font-size:28px;color:#2D1B4E;font-weight:700">${totalPages.toLocaleString()}</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#9E9689">Pages</div></div>
    </div>
  </div>

  <!-- Table of contents -->
  <div style="margin-bottom:40px">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#C8952E;font-weight:700;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #E8E4DF">Sommaire</div>
    ${projects.map((p: any, i: number) => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px dotted #E8E4DF">
        <span style="font-size:11px;color:#9E9689;width:20px">${i + 1}.</span>
        <span style="flex:1;font-size:12px;color:#2D1B4E;font-weight:600">${p.title}</span>
        <span style="font-size:10px;color:#9E9689">${p.genre}</span>
        <span style="font-size:10px;color:#5B3E8A">${p.pages}p</span>
        <span style="background:${p.status === 'published' ? '#D4F0E0' : p.status === 'in-progress' ? '#FFF3E0' : '#F5F3EF'};color:${p.status === 'published' ? '#2EAE6D' : p.status === 'in-progress' ? '#E07A2F' : '#9E9689'};padding:2px 8px;border-radius:8px;font-size:8px;font-weight:700">${p.status === 'published' ? 'Publié' : p.status === 'in-progress' ? 'En cours' : 'Brouillon'}</span>
      </div>
    `).join('')}
  </div>

  <div style="page-break-before:always"></div>

  <!-- Project fiches -->
  ${projectCards}

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:20px;border-top:2px solid #C8952E;text-align:center">
    <div style="font-family:'Playfair Display',serif;font-size:14px;color:#C8952E;letter-spacing:3px;margin-bottom:4px">JABRILIA ÉDITIONS</div>
    <div style="font-size:10px;color:#9E9689">Pipeline éditorial v2.1 · ${projects.length} titres · ${totalISBN} ISBN · Généré le ${date}</div>
    <div style="font-size:10px;color:#9E9689;margin-top:4px">contact@jabrilia.com · www.jabrilia.com</div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="catalogue-jabrilia-${new Date().toISOString().slice(0, 10)}.html"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
