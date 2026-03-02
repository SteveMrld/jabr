// JABR i18n — FR/EN translations
export type Lang = 'fr' | 'en';

const translations = {
  // Navigation
  'nav.dashboard': { fr: 'Dashboard', en: 'Dashboard' },
  'nav.projets': { fr: 'Projets', en: 'Projects' },
  'nav.manuscrits': { fr: 'Manuscrits', en: 'Manuscripts' },
  'nav.analyse': { fr: 'Analyse IA', en: 'AI Analysis' },
  'nav.calibrage': { fr: 'Calibrage', en: 'Calibration' },
  'nav.couvertures': { fr: 'Couvertures', en: 'Covers' },
  'nav.audiobooks': { fr: 'Audiobooks', en: 'Audiobooks' },
  'nav.distribution': { fr: 'Distribution', en: 'Distribution' },
  'nav.marketing': { fr: 'Marketing', en: 'Marketing' },
  'nav.presse': { fr: 'Dossier Presse', en: 'Press Kit' },
  'nav.calendrier': { fr: 'Calendrier', en: 'Calendar' },
  'nav.analytics': { fr: 'Analytics', en: 'Analytics' },
  'nav.isbn': { fr: 'ISBN', en: 'ISBN' },
  'nav.collections': { fr: 'Collections', en: 'Collections' },
  'nav.droits': { fr: 'Droits', en: 'Rights' },
  'nav.settings': { fr: 'Paramètres', en: 'Settings' },

  // Dashboard
  'dash.title': { fr: 'Dashboard', en: 'Dashboard' },
  'dash.catalogue': { fr: 'Catalogue', en: 'Catalog' },
  'dash.list': { fr: 'Liste', en: 'List' },
  'dash.kanban': { fr: 'Kanban', en: 'Kanban' },
  'dash.newProject': { fr: 'Nouveau projet', en: 'New project' },
  'dash.published': { fr: 'Publiés', en: 'Published' },
  'dash.inProgress': { fr: 'En cours', en: 'In progress' },
  'dash.corrections': { fr: 'Corrections', en: 'Corrections' },
  'dash.avgIa': { fr: 'Score IA moyen', en: 'Avg AI score' },
  'dash.titles': { fr: 'titres', en: 'titles' },
  'dash.title_singular': { fr: 'titre', en: 'title' },
  'dash.editions': { fr: 'Éditions', en: 'Editions' },

  // Statuses
  'status.draft': { fr: 'Brouillon', en: 'Draft' },
  'status.inProgress': { fr: 'En cours', en: 'In progress' },
  'status.published': { fr: 'Publié', en: 'Published' },

  // Kanban
  'kanban.dragHere': { fr: 'Glissez un titre ici', en: 'Drag a title here' },

  // Sort
  'sort.title': { fr: 'Titre', en: 'Title' },
  'sort.score': { fr: 'Score', en: 'Score' },
  'sort.status': { fr: 'Statut', en: 'Status' },
  'sort.editions': { fr: 'Éditions', en: 'Editions' },

  // Detail view
  'detail.modify': { fr: 'Modifier', en: 'Edit' },
  'detail.delete': { fr: 'Supprimer', en: 'Delete' },
  'detail.export': { fr: 'PDF', en: 'PDF' },
  'detail.editions': { fr: 'Éditions & ISBN', en: 'Editions & ISBN' },
  'detail.diagnostic': { fr: 'Diagnostic Couverture', en: 'Cover Diagnostic' },
  'detail.scanner': { fr: 'Scanner 6D', en: '6D Scanner' },
  'detail.backCover': { fr: '4e de couverture', en: 'Back cover' },
  'detail.notes': { fr: 'Notes éditoriales', en: 'Editorial notes' },
  'detail.series': { fr: 'Série / Connexions', en: 'Series / Connections' },
  'detail.changelog': { fr: 'Historique', en: 'History' },

  // ISBN
  'isbn.title': { fr: 'Registre ISBN', en: 'ISBN Registry' },
  'isbn.assigned': { fr: 'Attribués', en: 'Assigned' },
  'isbn.available': { fr: 'Disponibles', en: 'Available' },
  'isbn.exportCSV': { fr: 'Export CSV', en: 'Export CSV' },
  'isbn.exportONIX': { fr: 'Export ONIX', en: 'Export ONIX' },
  'isbn.compliance': { fr: 'Conformité Dilisco / Dilicom', en: 'Dilisco / Dilicom Compliance' },

  // Analytics
  'analytics.title': { fr: 'Analytics', en: 'Analytics' },
  'analytics.readiness': { fr: 'Readiness par titre', en: 'Readiness by title' },
  'analytics.finances': { fr: 'Tableau de bord financier', en: 'Financial dashboard' },
  'analytics.author': { fr: 'Tableau de bord auteur', en: 'Author dashboard' },
  'analytics.objectives': { fr: 'Objectifs en cours', en: 'Current objectives' },
  'analytics.milestones': { fr: 'Jalons d\'auteur', en: 'Author milestones' },
  'analytics.activity': { fr: 'Activité récente', en: 'Recent activity' },
  'analytics.less': { fr: 'Moins', en: 'Less' },
  'analytics.more': { fr: 'Plus', en: 'More' },

  // Presse
  'presse.title': { fr: 'Dossier de Presse', en: 'Press Kit' },
  'presse.generate': { fr: 'Générer le communiqué', en: 'Generate press release' },
  'presse.aiTitle': { fr: 'Communiqué de presse IA', en: 'AI Press Release' },
  'presse.selectTitle': { fr: 'Sélectionnez un titre', en: 'Select a title' },
  'presse.copy': { fr: 'Copier', en: 'Copy' },
  'presse.regenerate': { fr: 'Regénérer', en: 'Regenerate' },
  'presse.export': { fr: 'Exporter', en: 'Export' },

  // Calendrier
  'cal.title': { fr: 'Calendrier Éditorial', en: 'Editorial Calendar' },

  // Distribution
  'dist.title': { fr: 'Distribution', en: 'Distribution' },

  // Settings
  'settings.title': { fr: 'Paramètres', en: 'Settings' },
  'settings.editor': { fr: 'Identité éditeur', en: 'Publisher identity' },
  'settings.darkMode': { fr: 'Thème sombre', en: 'Dark mode' },
  'settings.import': { fr: 'Import catalogue', en: 'Import catalog' },
  'settings.language': { fr: 'Langue', en: 'Language' },
  'settings.csvFormat': { fr: 'Format CSV attendu', en: 'Expected CSV format' },
  'settings.template': { fr: 'Template', en: 'Template' },
  'settings.selectFile': { fr: 'Sélectionner un fichier CSV', en: 'Select a CSV file' },

  // Droits & Contrats
  'droits.title': { fr: 'Droits & Contrats', en: 'Rights & Contracts' },
  'droits.subtitle': { fr: 'Gestion des droits dérivés, adaptations et territoires', en: 'Derivative rights, adaptations & territories management' },
  'droits.primary': { fr: 'Droits primaires', en: 'Primary rights' },
  'droits.derivative': { fr: 'Droits dérivés', en: 'Derivative rights' },
  'droits.territories': { fr: 'Territoires', en: 'Territories' },
  'droits.contracts': { fr: 'Contrats actifs', en: 'Active contracts' },
  'droits.adaptation': { fr: 'Adaptation', en: 'Adaptation' },
  'droits.translation': { fr: 'Traduction', en: 'Translation' },
  'droits.audiovisual': { fr: 'Audiovisuel', en: 'Audiovisual' },
  'droits.merchandise': { fr: 'Produits dérivés', en: 'Merchandise' },

  // Common
  'common.search': { fr: 'Rechercher…', en: 'Search…' },
  'common.noResult': { fr: 'Aucun résultat', en: 'No results' },
  'common.export': { fr: 'Exporter', en: 'Export' },
  'common.save': { fr: 'Enregistrer', en: 'Save' },
  'common.cancel': { fr: 'Annuler', en: 'Cancel' },
  'common.close': { fr: 'Fermer', en: 'Close' },
  'common.pages': { fr: 'pages', en: 'pages' },
  'common.pipeline': { fr: 'Pipeline éditorial', en: 'Publishing pipeline' },
  'common.accomplished': { fr: 'ACCOMPLI', en: 'DONE' },
} as const;

export type TransKey = keyof typeof translations;

export function t(key: TransKey, lang: Lang): string {
  return translations[key]?.[lang] || key;
}

export default translations;
