export interface Project {
  id: number;
  title: string;
  subtitle?: string;
  author: string;
  illustrator?: string;
  genre: string;
  collection?: string;
  isbn: string;
  price?: string;
  score: number;
  maxScore: number;
  status: 'published' | 'in-progress' | 'draft';
  pages: number;
  cover: string;
  diag: Record<string, boolean>;
  corrections: string[];
}

export const PROJECTS: Project[] = [
  { id: 1, title: "Mon Petit Livre Anti-Stress", author: "Steve Moradel", illustrator: "Allison Moradel", genre: "Jeunesse", collection: "Étincelles", isbn: "978-2-488647-00-7", price: "18,90€", score: 7, maxScore: 7, status: "in-progress", pages: 136, cover: "🌅", diag: { ean: true, prix: true, isbn_txt: true, texte4e: true, typo: true, dos: true, logo: true }, corrections: [] },
  { id: 2, title: "Sur les hauteurs des chutes du Niagara", author: "Steve Moradel", genre: "Roman", isbn: "978-2-488647-03-8", score: 4, maxScore: 7, status: "draft", pages: 280, cover: "🏔️", diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: true, logo: true }, corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte"] },
  { id: 3, title: "Du Chaos Naît une Étoile", author: "Steve Moradel", genre: "Essai", isbn: "978-2-488647-07-6", score: 3, maxScore: 7, status: "draft", pages: 220, cover: "⭐", diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: false, logo: true }, corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte", "Ajouter texte sur dos"] },
  { id: 4, title: "Dans les Failles du Siècle", author: "Steve Moradel", genre: "Essai", isbn: "978-2-488647-10-6", score: 4, maxScore: 7, status: "draft", pages: 310, cover: "🌍", diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: true, logo: true }, corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte"] },
  { id: 5, title: "Aurora", author: "Steve Moradel", genre: "Roman", isbn: "978-2-488647-13-7", score: 4, maxScore: 7, status: "in-progress", pages: 350, cover: "❄️", diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: true, logo: true }, corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte"] },
  { id: 6, title: "Le Trône de Cendre", subtitle: "Tome I – Le Lion Déchu", author: "Steve Moradel", genre: "Roman historique", isbn: "978-2-488647-17-5", score: 3, maxScore: 7, status: "in-progress", pages: 420, cover: "🏛️", diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: false, logo: true }, corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte", "Corriger dos (AURORA → Le Trône de Cendre)"] },
  { id: 7, title: "À l'Ombre des Oliviers", author: "Steve Moradel", genre: "Roman", isbn: "978-2-488647-21-2", score: 4, maxScore: 7, status: "draft", pages: 290, cover: "🫒", diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: true, logo: true }, corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte"] },
  { id: 8, title: "Les Mémoires Reliées", author: "Steve Moradel", genre: "Roman", isbn: "978-2-488647-25-0", score: 4, maxScore: 7, status: "draft", pages: 330, cover: "🔗", diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: true, dos: true, logo: true }, corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte"] },
  { id: 9, title: "Le Temps des Étincelles", author: "Steve et Allison Moradel", genre: "BD", collection: "Étincelles", isbn: "978-2-488647-29-8", score: 3, maxScore: 7, status: "in-progress", pages: 64, cover: "✨", diag: { ean: false, prix: false, isbn_txt: false, texte4e: true, typo: false, dos: true, logo: true }, corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte", "Corriger ETINCELLES → ÉTINCELLES"] },
  { id: 10, title: "Les Réparatrices", author: "Steve Moradel", genre: "Essai", isbn: "978-2-488647-31-1", score: 2, maxScore: 7, status: "draft", pages: 240, cover: "🧵", diag: { ean: false, prix: false, isbn_txt: false, texte4e: false, typo: true, dos: false, logo: true }, corrections: ["Ajouter EAN-13", "Ajouter prix TTC", "Ajouter ISBN texte", "Fournir texte 4e", "Fournir 4e de couverture"] },
];

export const PIPELINE_STEPS = [
  "Calibrage", "Couverture", "Diagnostic", "BAT", "ePub", "Audio", "Marketing", "Distribution"
];

export const COLLECTIONS = [
  { name: "Étincelles", desc: "Jeunesse & BD — Livres pour les jeunes esprits", color: "#E07A2F", bookIds: [1, 9] },
  { name: "Romans", desc: "Fiction littéraire", color: "#5B3E8A", bookIds: [2, 5, 6, 7, 8] },
  { name: "Essais", desc: "Non-fiction, essais, récits", color: "#C8952E", bookIds: [3, 4, 10] },
];

export const DIAG_LABELS: Record<string, string> = {
  ean: "Code-barres EAN", prix: "Prix TTC", isbn_txt: "ISBN texte",
  texte4e: "Texte 4e", typo: "Typographie", dos: "Dos", logo: "Logo Jabrilia"
};

export const DISTRIBUTION_CHANNELS = [
  { name: "Pollen / Kiosque", desc: "Distribution librairie France", status: "En attente ISBN", color: "#E07A2F" },
  { name: "Amazon KDP", desc: "Print on demand + Kindle", status: "Prêt", color: "#2EAE6D" },
  { name: "IngramSpark", desc: "Distribution internationale", status: "En attente fichiers", color: "#E07A2F" },
  { name: "Apple Books", desc: "ePub + Audiobook", status: "En préparation", color: "#9E9689" },
  { name: "Kobo / Fnac", desc: "ePub francophone", status: "En préparation", color: "#9E9689" },
  { name: "Spotify / Audible", desc: "Audiobook", status: "Phase 2", color: "#5B3E8A" },
];
