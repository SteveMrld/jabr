import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { projects } = await request.json();
    const published = projects.filter((p: any) => p.status === 'published').length;
    const inProgress = projects.filter((p: any) => p.status === 'in-progress').length;
    const totalISBN = projects.reduce((s: number, p: any) => s + (p.editions?.length || 0), 0);
    const totalPages = projects.reduce((s: number, p: any) => s + (p.pages || 0), 0);
    const genres = [...new Set(projects.map((p: any) => p.genre))];

    const slides = [
      // Slide 1: Cover
      `<div class="slide" style="background:linear-gradient(160deg,#2D1B4E,#1A0F2E);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
        <div style="font-size:80px;margin-bottom:30px">★</div>
        <h1 style="font-family:'Playfair Display',serif;font-size:64px;color:white;margin-bottom:12px">JABR</h1>
        <div style="font-size:18px;color:#C8952E;letter-spacing:6px;margin-bottom:40px">JABRILIA ÉDITIONS</div>
        <div style="font-size:16px;color:rgba(255,255,255,0.4)">Pipeline éditorial · Pitch Deck ${new Date().getFullYear()}</div>
      </div>`,

      // Slide 2: Numbers
      `<div class="slide" style="background:#FAF7F2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
        <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#C8952E;margin-bottom:40px">En chiffres</div>
        <div style="display:flex;gap:60px;align-items:flex-end">
          ${[
            { n: projects.length, l: 'Titres' },
            { n: totalISBN, l: 'ISBN' },
            { n: published, l: 'Publiés' },
            { n: totalPages.toLocaleString(), l: 'Pages' },
            { n: genres.length, l: 'Genres' },
          ].map(d => `<div><div style="font-family:'Playfair Display',serif;font-size:56px;color:#2D1B4E;font-weight:700">${d.n}</div><div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#9E9689;margin-top:8px">${d.l}</div></div>`).join('')}
        </div>
      </div>`,

      // Slide 3: Catalogue
      `<div class="slide" style="background:white;padding:60px">
        <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#C8952E;margin-bottom:32px">Catalogue</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px">
          ${projects.slice(0, 6).map((p: any) => `
            <div style="display:flex;gap:16px;padding:20px;border-radius:12px;background:#FAF7F2;border:1px solid #E8E4DF">
              <div style="width:50px;height:66px;border-radius:6px;background:linear-gradient(135deg,#2D1B4E,#5B3E8A);display:flex;align-items:center;justify-content:center;font-size:24px">${p.cover || '📖'}</div>
              <div>
                <div style="font-family:'Playfair Display',serif;font-size:16px;color:#2D1B4E;font-weight:700">${p.title}</div>
                <div style="font-size:12px;color:#9E9689;margin-top:4px">${p.author} · ${p.genre} · ${p.pages}p</div>
                <div style="margin-top:8px"><span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:700;background:${p.status === 'published' ? '#D4F0E0' : p.status === 'in-progress' ? '#FFF3E0' : '#F5F3EF'};color:${p.status === 'published' ? '#2EAE6D' : p.status === 'in-progress' ? '#E07A2F' : '#9E9689'}">${p.status === 'published' ? 'Publié' : p.status === 'in-progress' ? 'En cours' : 'Brouillon'}</span></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`,

      // Slide 4: Genres
      `<div class="slide" style="background:linear-gradient(160deg,#2D1B4E,#5B3E8A);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
        <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#C8952E;margin-bottom:40px">Lignes éditoriales</div>
        <div style="display:flex;gap:32px;flex-wrap:wrap;justify-content:center">
          ${(genres as string[]).map((g: string) => {
            const count = projects.filter((p: any) => p.genre === g).length;
            return `<div style="padding:24px 40px;border-radius:16px;background:rgba(255,255,255,0.06);border:1px solid rgba(200,149,46,0.2)">
              <div style="font-family:'Playfair Display',serif;font-size:28px;color:white;font-weight:700">${count}</div>
              <div style="font-size:13px;color:#C8952E;margin-top:4px">${g}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`,

      // Slide 5: Pipeline
      `<div class="slide" style="background:#FAF7F2;padding:60px">
        <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#C8952E;margin-bottom:32px">Pipeline JABR</div>
        <div style="display:flex;gap:20px;align-items:stretch">
          ${['Manuscrit → Analyse IA', 'ISBN & Calibrage', 'Couverture & Diagnostic', 'Distribution & Marketing', 'ONIX 3.0 & Presse'].map((step, i) => `
            <div style="flex:1;padding:24px;border-radius:12px;background:white;border:1px solid #E8E4DF;text-align:center;position:relative">
              <div style="font-family:'Playfair Display',serif;font-size:28px;color:#C8952E;margin-bottom:8px">${i + 1}</div>
              <div style="font-size:13px;color:#2D1B4E;font-weight:600">${step}</div>
              ${i < 4 ? '<div style="position:absolute;right:-14px;top:50%;transform:translateY(-50%);font-size:18px;color:#C8952E">→</div>' : ''}
            </div>
          `).join('')}
        </div>
        <div style="text-align:center;margin-top:32px;font-size:14px;color:#9E9689">18 modules · PWA · i18n FR/EN · Export ONIX 3.0</div>
      </div>`,

      // Slide 6: Author
      `<div class="slide" style="background:white;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px">
        <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#C8952E;margin-bottom:32px">L'auteur éditeur</div>
        <div style="font-family:'Playfair Display',serif;font-size:36px;color:#2D1B4E;margin-bottom:12px">Steve Moradel</div>
        <div style="font-size:14px;color:#9E9689;max-width:500px;line-height:1.8;margin-bottom:24px">
          Écrivain · Stratège · Entrepreneur<br>
          Enseignant ESSEC, INSEEC, Audencia
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
          ${['LinkedIn Top Voice 2020', 'Personnalité 2018', 'Chevalier ONM', 'Fondateur Acting For Water'].map(d => `
            <div style="padding:6px 16px;border-radius:8px;background:#FAF7F2;font-size:11px;color:#5B3E8A;font-weight:600;border:1px solid #E8E4DF">${d}</div>
          `).join('')}
        </div>
      </div>`,

      // Slide 7: CTA
      `<div class="slide" style="background:linear-gradient(160deg,#2D1B4E,#1A0F2E);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
        <div style="font-size:60px;margin-bottom:24px">★</div>
        <h2 style="font-family:'Playfair Display',serif;font-size:44px;color:white;margin-bottom:16px">Jabrilia Éditions</h2>
        <div style="font-size:16px;color:rgba(255,255,255,0.4);margin-bottom:40px">De l'idée au livre, sans friction.</div>
        <div style="font-size:14px;color:#C8952E">contact@jabrilia.com · jabrilia.com · jabr-eta.vercel.app</div>
      </div>`,
    ];

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Jabrilia Éditions — Pitch Deck</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Inter',sans-serif; overflow:hidden; background:#000; }
.slide { width:100vw; height:100vh; position:absolute; top:0; left:0; opacity:0; transition:opacity 0.5s ease; }
.slide.active { opacity:1; }
.controls { position:fixed; bottom:30px; left:50%; transform:translateX(-50%); display:flex; gap:10px; z-index:100; }
.controls button { padding:8px 20px; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:600; background:rgba(255,255,255,0.1); color:white; backdrop-filter:blur(10px); transition:background 0.2s; }
.controls button:hover { background:rgba(200,149,46,0.4); }
.dots { position:fixed; bottom:70px; left:50%; transform:translateX(-50%); display:flex; gap:8px; z-index:100; }
.dot { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,0.2); cursor:pointer; transition:all 0.3s; }
.dot.active { background:#C8952E; transform:scale(1.3); }
.counter { position:fixed; top:20px; right:30px; font-size:12px; color:rgba(255,255,255,0.3); z-index:100; }
</style>
</head>
<body>
${slides.map((s, i) => s.replace('class="slide"', `class="slide${i === 0 ? ' active' : ''}" id="s${i}"`)).join('\n')}
<div class="dots">${slides.map((_, i) => `<div class="dot${i === 0 ? ' active' : ''}" onclick="go(${i})"></div>`).join('')}</div>
<div class="controls">
  <button onclick="prev()">← Précédent</button>
  <button onclick="next()">Suivant →</button>
</div>
<div class="counter"><span id="cn">1</span> / ${slides.length}</div>
<script>
let cur=0;const tot=${slides.length};
function go(n){document.querySelectorAll('.slide').forEach((s,i)=>s.classList.toggle('active',i===n));document.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('active',i===n));cur=n;document.getElementById('cn').textContent=n+1;}
function next(){go((cur+1)%tot);}
function prev(){go((cur-1+tot)%tot);}
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' ')next();if(e.key==='ArrowLeft')prev();if(e.key==='Escape')window.close();});
</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
