import type { Project } from "./data";

export interface DimensionScore {
  score: number;
  label: string;
  factors: { name: string; value: number; max: number; weight: number }[];
  bottleneck: string | null;
}

export interface TitleOrchestration {
  projectId: number; title: string; genre: string; status: string;
  editorial: DimensionScore; production: DimensionScore; distribution: DimensionScore;
  marketing: DimensionScore; international: DimensionScore;
  globalScore: number; globalGrade: "A" | "B" | "C" | "D" | "F";
  priorities: Priority[]; bottlenecks: string[];
  nextAction: string; estimatedWeeksToReady: number;
}

export interface Priority {
  rank: number; action: string; dimension: string;
  impact: "critical" | "high" | "medium" | "low";
  effort: "quick-win" | "moderate" | "heavy"; rationale: string;
}

export interface CatalogueInsight {
  totalTitles: number; avgGlobalScore: number; readyToPublish: number;
  criticalBottlenecks: { title: string; issue: string }[];
  topPriority: { title: string; action: string } | null;
  portfolioBalance: { genre: string; count: number; avgScore: number }[];
  weeklyFocus: string[];
}
function scoreEditorial(p: Project): DimensionScore {
  const factors: DimensionScore["factors"] = [];
  const msMap: Record<string, number> = { none: 0, uploaded: 8, analyzed: 15, validated: 22, "isbn-injected": 25 };
  factors.push({ name: "Manuscrit", value: msMap[p.manuscriptStatus || "none"] || 0, max: 25, weight: 0.25 });
  let iaScore = 0;
  if (p.analysis) { iaScore = p.analysis.iaScore < 15 ? 25 : p.analysis.iaScore < 30 ? 20 : p.analysis.iaScore < 50 ? 12 : 5; }
  factors.push({ name: "Qualite IA", value: iaScore, max: 25, weight: 0.25 });
  factors.push({ name: "Corrections", value: Math.min(25, p.corrections.length * 5), max: 25, weight: 0.25 });
  factors.push({ name: "Readiness", value: p.maxScore > 0 ? Math.round((p.score / p.maxScore) * 25) : 0, max: 25, weight: 0.25 });
  const total = factors.reduce((s, f) => s + f.value, 0);
  const bottleneck = !p.manuscriptStatus || p.manuscriptStatus === "none" ? "Aucun manuscrit fourni" : !p.analysis ? "Analyse IA non effectuee" : p.corrections.length === 0 ? "Aucune correction" : null;
  return { score: total, label: "Editorial", factors, bottleneck };
}

function scoreProduction(p: Project): DimensionScore {
  const factors: DimensionScore["factors"] = [];
  const fmts = new Set(p.editions.map(e => e.format));
  factors.push({ name: "Formats", value: Math.min(30, fmts.size * 6), max: 30, weight: 0.3 });
  const dT = Object.keys(p.diag).length, dO = Object.values(p.diag).filter(Boolean).length;
  factors.push({ name: "Couverture", value: dT > 0 ? Math.round((dO / dT) * 30) : 0, max: 30, weight: 0.3 });
  const wI = p.editions.filter(e => e.isbn && e.isbn.length > 5).length;
  factors.push({ name: "ISBN", value: p.editions.length > 0 ? Math.round((wI / p.editions.length) * 20) : 0, max: 20, weight: 0.2 });
  const wP = p.editions.filter(e => e.price).length;
  factors.push({ name: "Pricing", value: p.editions.length > 0 ? Math.round((wP / p.editions.length) * 20) : 0, max: 20, weight: 0.2 });
  const total = factors.reduce((s, f) => s + f.value, 0);
  const bottleneck = factors[1].value < 15 ? "Couverture non validee" : factors[2].value < 10 ? "ISBN manquants" : factors[3].value < 10 ? "Prix non definis" : fmts.size < 2 ? "Un seul format" : null;
  return { score: total, label: "Production", factors, bottleneck };
}

function scoreDistribution(p: Project): DimensionScore {
  const factors: DimensionScore["factors"] = [];
  const rE = p.editions.filter(e => e.status === "ready" || e.status === "published").length;
  factors.push({ name: "Editions pretes", value: p.editions.length > 0 ? Math.round((rE / p.editions.length) * 40) : 0, max: 40, weight: 0.4 });
  const hasPhy = p.editions.some(e => ["broche", "poche", "relie"].includes(e.format));
  const hasDig = p.editions.some(e => ["epub", "pdf"].includes(e.format));
  const hasAud = p.editions.some(e => e.format === "audiobook");
  factors.push({ name: "Canaux", value: (hasPhy ? 12 : 0) + (hasDig ? 12 : 0) + (hasAud ? 6 : 0), max: 30, weight: 0.3 });
  factors.push({ name: "Statut", value: p.status === "published" ? 30 : p.status === "in-progress" ? 15 : 5, max: 30, weight: 0.3 });
  const total = factors.reduce((s, f) => s + f.value, 0);
  const bottleneck = factors[0].value < 10 ? "Aucune edition prete" : !hasDig ? "Pas de format digital" : !hasPhy ? "Pas de format physique" : null;
  return { score: total, label: "Distribution", factors, bottleneck };
}
function scoreMarketing(p: Project): DimensionScore {
  const factors: DimensionScore["factors"] = [];
  const gB: Record<string, number> = { Fantasy: 25, BD: 22, Jeunesse: 20, Roman: 18, Essai: 15 };
  factors.push({ name: "Potentiel genre", value: gB[p.genre] || 15, max: 25, weight: 0.25 });
  const bcS = p.backCover && p.backCover.length > 50 ? 25 : p.backCover ? 12 : 0;
  factors.push({ name: "Texte 4e couv.", value: bcS, max: 25, weight: 0.25 });
  factors.push({ name: "Volume contenu", value: p.pages > 200 ? 25 : p.pages > 100 ? 18 : p.pages > 50 ? 12 : 5, max: 25, weight: 0.25 });
  factors.push({ name: "Timing", value: p.status === "published" ? 25 : p.status === "in-progress" ? 15 : 5, max: 25, weight: 0.25 });
  const total = factors.reduce((s, f) => s + f.value, 0);
  const bottleneck = bcS === 0 ? "Pas de texte 4e couverture" : factors[3].value < 15 ? "Titre pas en production" : null;
  return { score: total, label: "Marketing", factors, bottleneck };
}

function scoreInternational(p: Project): DimensionScore {
  const factors: DimensionScore["factors"] = [];
  const hasEpub = p.editions.some(e => e.format === "epub");
  const hasPdf = p.editions.some(e => e.format === "pdf");
  factors.push({ name: "Formats digitaux", value: (hasEpub ? 20 : 0) + (hasPdf ? 10 : 0), max: 30, weight: 0.3 });
  const iA: Record<string, number> = { Fantasy: 30, BD: 28, Jeunesse: 22, Roman: 18, Essai: 12 };
  factors.push({ name: "Attrait intl", value: iA[p.genre] || 15, max: 30, weight: 0.3 });
  factors.push({ name: "Potentiel serie", value: p.series ? 20 : 0, max: 20, weight: 0.2 });
  factors.push({ name: "Maturite", value: p.status === "published" ? 20 : (p.manuscriptStatus === "validated" || p.manuscriptStatus === "isbn-injected") ? 15 : 5, max: 20, weight: 0.2 });
  const total = factors.reduce((s, f) => s + f.value, 0);
  const bottleneck = !hasEpub ? "Pas de ePub pour distribution intl" : factors[1].value < 15 ? "Genre faible potentiel export" : null;
  return { score: total, label: "International", factors, bottleneck };
}

function generatePriorities(p: Project, sc: { editorial: DimensionScore; production: DimensionScore; distribution: DimensionScore; marketing: DimensionScore; international: DimensionScore }): Priority[] {
  const pr: Priority[] = [];
  if (!p.manuscriptStatus || p.manuscriptStatus === "none") {
    pr.push({ rank: 0, action: "Fournir le manuscrit .docx", dimension: "Editorial", impact: "critical", effort: "quick-win", rationale: "Bloque toute la chaine" });
  } else if (!p.analysis) {
    pr.push({ rank: 0, action: "Lancer analyse IA manuscrit", dimension: "Editorial", impact: "high", effort: "quick-win", rationale: "Detecte patterns IA" });
  }
  if (sc.production.score < 50) {
    const dO = Object.values(p.diag).filter(Boolean).length, dT = Object.keys(p.diag).length;
    if (dT > 0 && dO < dT) pr.push({ rank: 0, action: "Finaliser couverture", dimension: "Production", impact: "high", effort: "moderate", rationale: "Impact conversion Amazon" });
    const noP = p.editions.filter(e => !e.price).length;
    if (noP > 0) pr.push({ rank: 0, action: "Definir les prix", dimension: "Production", impact: "medium", effort: "quick-win", rationale: "Requis avant vente" });
  }
  if (!p.editions.some(e => ["epub", "pdf"].includes(e.format))) pr.push({ rank: 0, action: "Ajouter format digital", dimension: "Distribution", impact: "high", effort: "moderate", rationale: "Ouvre Kindle/Kobo/Apple" });
  if (!p.editions.some(e => e.format === "audiobook") && p.pages > 100 && p.genre !== "BD") pr.push({ rank: 0, action: "Planifier audiobook", dimension: "Distribution", impact: "medium", effort: "heavy", rationale: "Marche audio croissant" });
  if (!p.backCover || p.backCover.length < 50) pr.push({ rank: 0, action: "Rediger texte 4e couverture", dimension: "Marketing", impact: "critical", effort: "quick-win", rationale: "Element cle conversion" });
  const iO: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const eO: Record<string, number> = { "quick-win": 0, moderate: 1, heavy: 2 };
  pr.sort((a, b) => iO[a.impact] - iO[b.impact] || eO[a.effort] - eO[b.effort]);
  pr.forEach((p2, i) => { p2.rank = i + 1; });
  return pr.slice(0, 5);
}

function computeGrade(s: number): "A" | "B" | "C" | "D" | "F" {
  if (s >= 80) return "A"; if (s >= 65) return "B"; if (s >= 45) return "C"; if (s >= 25) return "D"; return "F";
}

export function orchestrateTitle(p: Project): TitleOrchestration {
  const ed = scoreEditorial(p), pr = scoreProduction(p), di = scoreDistribution(p), mk = scoreMarketing(p), it = scoreInternational(p);
  const gs = Math.round(ed.score * 0.25 + pr.score * 0.25 + di.score * 0.20 + mk.score * 0.20 + it.score * 0.10);
  const prios = generatePriorities(p, { editorial: ed, production: pr, distribution: di, marketing: mk, international: it });
  const bns = [ed, pr, di, mk, it].filter(d => d.bottleneck).map(d => d.bottleneck!);
  return {
    projectId: p.id, title: p.title, genre: p.genre, status: p.status,
    editorial: ed, production: pr, distribution: di, marketing: mk, international: it,
    globalScore: gs, globalGrade: computeGrade(gs), priorities: prios, bottlenecks: bns,
    nextAction: prios.length > 0 ? prios[0].action : "Titre pret",
    estimatedWeeksToReady: p.status === "published" ? 0 : gs >= 80 ? 2 : gs >= 60 ? 4 : gs >= 40 ? 8 : 12,
  };
}

export function orchestrateCatalogue(projects: Project[]): CatalogueInsight {
  const res = projects.map(orchestrateTitle);
  const avg = res.length > 0 ? Math.round(res.reduce((s, r) => s + r.globalScore, 0) / res.length) : 0;
  const crits = res.filter(r => r.priorities.some(pp => pp.impact === "critical")).map(r => ({ title: r.title, issue: r.priorities.find(pp => pp.impact === "critical")!.action }));
  const gm = new Map<string, { scores: number[]; count: number }>();
  res.forEach(r => { const g = gm.get(r.genre) || { scores: [], count: 0 }; g.scores.push(r.globalScore); g.count++; gm.set(r.genre, g); });
  const pb = Array.from(gm.entries()).map(([genre, d]) => ({ genre, count: d.count, avgScore: Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) }));
  const sorted = [...res].sort((a, b) => a.globalScore - b.globalScore);
  const wf = sorted.slice(0, 3).filter(r => r.priorities.length > 0).map(r => r.title + " : " + r.priorities[0].action);
  return {
    totalTitles: projects.length, avgGlobalScore: avg,
    readyToPublish: res.filter(r => r.globalGrade === "A" || r.globalGrade === "B").length,
    criticalBottlenecks: crits,
    topPriority: sorted.length > 0 && sorted[0].priorities.length > 0 ? { title: sorted[0].title, action: sorted[0].priorities[0].action } : null,
    portfolioBalance: pb, weeklyFocus: wf,
  };
}

export interface MarketingVariant {
  id: string; label: string; text: string;
  scores: { tonalCoherence: number; emotionalDensity: number; ctaStrength: number; genreAlignment: number };
  totalScore: number; recommended: boolean;
}

export function compareMarketingVariants(variants: { label: string; text: string }[], genre: string): MarketingVariant[] {
  const results: MarketingVariant[] = variants.map((v, i) => {
    const text = v.text.toLowerCase(), words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const avgSL = sentences.length > 0 ? words / sentences.length : words;
    const tonalCoherence = Math.min(100, Math.max(20, 100 - Math.abs(avgSL - 15) * 4));
    const eW = ["decouvr", "passion", "boulevers", "extraordinaire", "unique", "puissant", "vibrant", "captiv", "fascinant", "intense", "magique"];
    const emotionalDensity = Math.min(100, Math.round(eW.filter(w => text.includes(w)).length / Math.max(1, words / 30) * 25));
    const cI = ["decouvrez", "plongez", "rejoignez", "commandez", "maintenant", "votre", "vous"];
    const ctaStrength = Math.min(100, cI.filter(w => text.includes(w)).length * 15);
    const gV: Record<string, string[]> = { Fantasy: ["magie", "royaume", "quete", "dragon", "ombre"], Roman: ["vie", "amour", "destin", "famille"], Jeunesse: ["aventure", "courage", "reve"], Essai: ["analyse", "societe", "monde"], BD: ["dessin", "planche", "visuel"] };
    const vocab = gV[genre] || gV["Roman"];
    const genreAlignment = Math.min(100, Math.round(vocab.filter(w => text.includes(w)).length / Math.max(1, vocab.length * 0.3) * 35));
    const totalScore = Math.round(tonalCoherence * 0.25 + emotionalDensity * 0.25 + ctaStrength * 0.25 + genreAlignment * 0.25);
    return { id: "variant-" + i, label: v.label, text: v.text, scores: { tonalCoherence, emotionalDensity, ctaStrength, genreAlignment }, totalScore, recommended: false };
  });
  if (results.length > 0) { results.reduce((a, b) => a.totalScore > b.totalScore ? a : b).recommended = true; }
  return results.sort((a, b) => b.totalScore - a.totalScore);
}
