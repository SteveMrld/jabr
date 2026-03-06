// ═══════════════════════════════════════════════════════════════════
// JABR — Publishing Economics Simulator
// P&L simulation, break-even, margin analysis, scenario comparison
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════
// TYPES
// ═══════════════════════════════════

export interface EconomicsInput {
  title: string;
  // Print
  printRun: number;          // tirage
  printCostPerUnit: number;  // coût impression unitaire €
  coverCost: number;         // coût couverture / maquette €
  editingCost: number;       // coût correction / mise en page €
  // Pricing
  priceTTC: number;          // prix public TTC €
  tvaRate: number;           // taux TVA (5.5% pour livres)
  // Distribution
  distributorMargin: number; // % marge distributeur (ex: 55% pour Pollen)
  diffuserMargin: number;    // % marge diffuseur (si séparé, sinon 0)
  // Rights
  authorRoyaltyRate: number; // % droits auteur sur prix HT
  // Fixed costs
  marketingBudget: number;   // budget marketing €
  isbnCost: number;          // coût ISBN (0 si déjà acheté)
  otherFixed: number;        // autres frais fixes €
  // Digital (optional)
  hasEpub: boolean;
  epubPrice: number;
  epubRoyaltyRate: number;   // % sur ePub (souvent 70% sur KDP)
  estimatedEpubSales: number;
  // Audio (optional)
  hasAudiobook: boolean;
  audiobookCost: number;     // coût production audio €
  audiobookPrice: number;
  audiobookRoyaltyRate: number;
  estimatedAudioSales: number;
}

export interface EconomicsResult {
  // Revenue
  priceHT: number;
  revenuePerUnit: number;      // ce que l'éditeur touche par unité
  grossRevenuePrint: number;
  grossRevenueEpub: number;
  grossRevenueAudio: number;
  totalGrossRevenue: number;

  // Costs
  totalPrintCost: number;
  totalFixedCosts: number;
  authorRoyalties: number;
  totalCosts: number;

  // Profitability
  netResult: number;
  marginPercent: number;
  breakEvenUnits: number;
  breakEvenPercent: number;    // % du tirage pour atteindre le point mort

  // Per unit
  costPerUnit: number;
  profitPerUnit: number;

  // Scenarios
  scenarios: EconomicsScenario[];
}

export interface EconomicsScenario {
  name: string;
  sellThrough: number;     // % du tirage vendu
  unitsSold: number;
  revenue: number;
  costs: number;
  netResult: number;
  margin: number;
  verdict: 'loss' | 'breakeven' | 'profit' | 'strong';
}

// ═══════════════════════════════════
// SIMULATOR
// ═══════════════════════════════════

export function simulateEconomics(input: EconomicsInput): EconomicsResult {
  const {
    printRun, printCostPerUnit, coverCost, editingCost,
    priceTTC, tvaRate, distributorMargin, diffuserMargin,
    authorRoyaltyRate, marketingBudget, isbnCost, otherFixed,
    hasEpub, epubPrice, epubRoyaltyRate, estimatedEpubSales,
    hasAudiobook, audiobookCost, audiobookPrice, audiobookRoyaltyRate, estimatedAudioSales,
  } = input;

  // Price calculations
  const priceHT = priceTTC / (1 + tvaRate / 100);
  const totalDistMargin = distributorMargin + diffuserMargin; // % total
  const revenuePerUnit = priceHT * (1 - totalDistMargin / 100);

  // Print revenue (assume various sell-through for scenarios later)
  const grossRevenuePrint = revenuePerUnit * printRun;

  // ePub revenue
  const epubRevenuePerUnit = hasEpub ? epubPrice * (epubRoyaltyRate / 100) : 0;
  const grossRevenueEpub = hasEpub ? epubRevenuePerUnit * estimatedEpubSales : 0;

  // Audiobook revenue
  const audioRevenuePerUnit = hasAudiobook ? audiobookPrice * (audiobookRoyaltyRate / 100) : 0;
  const grossRevenueAudio = hasAudiobook ? audioRevenuePerUnit * estimatedAudioSales : 0;

  const totalGrossRevenue = grossRevenuePrint + grossRevenueEpub + grossRevenueAudio;

  // Costs
  const totalPrintCost = printRun * printCostPerUnit;
  const totalFixedCosts = coverCost + editingCost + marketingBudget + isbnCost + otherFixed + (hasAudiobook ? audiobookCost : 0);
  const authorRoyaltiesPrint = priceHT * (authorRoyaltyRate / 100) * printRun;
  const authorRoyaltiesEpub = hasEpub ? epubPrice * (authorRoyaltyRate / 100) * estimatedEpubSales : 0;
  const authorRoyalties = authorRoyaltiesPrint + authorRoyaltiesEpub;
  const totalCosts = totalPrintCost + totalFixedCosts + authorRoyalties;

  // Profitability
  const netResult = totalGrossRevenue - totalCosts;
  const marginPercent = totalGrossRevenue > 0 ? (netResult / totalGrossRevenue) * 100 : 0;

  // Break-even
  const fixedCostsTotal = totalFixedCosts;
  const contributionPerUnit = revenuePerUnit - printCostPerUnit - (priceHT * authorRoyaltyRate / 100);
  const breakEvenUnits = contributionPerUnit > 0 ? Math.ceil(fixedCostsTotal / contributionPerUnit) : printRun;
  const breakEvenPercent = (breakEvenUnits / printRun) * 100;

  // Per unit (at full sell-through)
  const costPerUnit = totalCosts / printRun;
  const profitPerUnit = revenuePerUnit - costPerUnit;

  // Scenarios
  const scenarios: EconomicsScenario[] = [
    buildScenario('Prudent (40%)', 0.40, input, revenuePerUnit, totalFixedCosts, printCostPerUnit, authorRoyaltyRate, priceHT, grossRevenueEpub * 0.5, grossRevenueAudio * 0.5),
    buildScenario('Réaliste (65%)', 0.65, input, revenuePerUnit, totalFixedCosts, printCostPerUnit, authorRoyaltyRate, priceHT, grossRevenueEpub, grossRevenueAudio),
    buildScenario('Optimiste (90%)', 0.90, input, revenuePerUnit, totalFixedCosts, printCostPerUnit, authorRoyaltyRate, priceHT, grossRevenueEpub * 1.5, grossRevenueAudio * 1.5),
  ];

  return {
    priceHT,
    revenuePerUnit,
    grossRevenuePrint,
    grossRevenueEpub,
    grossRevenueAudio,
    totalGrossRevenue,
    totalPrintCost,
    totalFixedCosts,
    authorRoyalties,
    totalCosts,
    netResult,
    marginPercent,
    breakEvenUnits,
    breakEvenPercent,
    costPerUnit,
    profitPerUnit,
    scenarios,
  };
}

function buildScenario(
  name: string, sellThrough: number, input: EconomicsInput,
  revenuePerUnit: number, fixedCosts: number, printCostPerUnit: number,
  authorRoyaltyRate: number, priceHT: number,
  epubRevenue: number, audioRevenue: number
): EconomicsScenario {
  const unitsSold = Math.round(input.printRun * sellThrough);
  const printRevenue = revenuePerUnit * unitsSold;
  const revenue = printRevenue + epubRevenue + audioRevenue;
  const printCost = input.printRun * printCostPerUnit; // Always pay for full print run
  const royalties = priceHT * (authorRoyaltyRate / 100) * unitsSold;
  const costs = fixedCosts + printCost + royalties;
  const netResult = revenue - costs;
  const margin = revenue > 0 ? (netResult / revenue) * 100 : 0;

  return {
    name,
    sellThrough: sellThrough * 100,
    unitsSold,
    revenue: Math.round(revenue),
    costs: Math.round(costs),
    netResult: Math.round(netResult),
    margin: Math.round(margin),
    verdict: netResult < -100 ? 'loss' : netResult < 100 ? 'breakeven' : margin > 20 ? 'strong' : 'profit',
  };
}

// ═══════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════

export const DEFAULT_ECONOMICS: EconomicsInput = {
  title: '',
  printRun: 500,
  printCostPerUnit: 4.50,
  coverCost: 500,
  editingCost: 800,
  priceTTC: 19.90,
  tvaRate: 5.5,
  distributorMargin: 55,
  diffuserMargin: 0,
  authorRoyaltyRate: 8,
  marketingBudget: 500,
  isbnCost: 0,
  otherFixed: 200,
  hasEpub: true,
  epubPrice: 9.99,
  epubRoyaltyRate: 70,
  estimatedEpubSales: 100,
  hasAudiobook: false,
  audiobookCost: 1500,
  audiobookPrice: 19.99,
  audiobookRoyaltyRate: 40,
  estimatedAudioSales: 50,
};
