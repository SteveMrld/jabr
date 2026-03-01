-- =============================================
-- JABR — Schéma Supabase
-- =============================================

-- Table principale des projets
CREATE TABLE projects (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT NOT NULL DEFAULT 'Steve Moradel',
  illustrator TEXT,
  genre TEXT NOT NULL DEFAULT 'Roman',
  collection TEXT,
  score INT NOT NULL DEFAULT 0,
  max_score INT NOT NULL DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'in-progress', 'draft')),
  pages INT NOT NULL DEFAULT 0,
  cover TEXT NOT NULL DEFAULT '📖',
  diag JSONB NOT NULL DEFAULT '{"ean":false,"prix":false,"isbn_txt":false,"texte4e":false,"typo":false,"dos":false,"logo":false}',
  corrections TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Éditions (1 ISBN par format par projet)
CREATE TABLE editions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('broché', 'poche', 'epub', 'audiobook', 'pdf', 'relié')),
  isbn TEXT NOT NULL UNIQUE,
  price TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'ready', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, format)
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index
CREATE INDEX idx_editions_project ON editions(project_id);
CREATE INDEX idx_projects_status ON projects(status);

-- RLS (Row Level Security) — désactivé pour le MVP
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE editions ENABLE ROW LEVEL SECURITY;

-- Politique publique (anon peut tout faire pour le MVP)
CREATE POLICY "Public access projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access editions" ON editions FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- SEED DATA — Catalogue Jabrilia Éditions
-- =============================================

INSERT INTO projects (id, title, author, illustrator, genre, collection, score, max_score, status, pages, cover, diag, corrections)
OVERRIDING GENERATED ALWAYS
VALUES
  (1, 'Mon Petit Livre Anti-Stress', 'Steve Moradel', 'Allison Moradel', 'Jeunesse', 'Étincelles', 7, 7, 'in-progress', 136, '🌅', '{"ean":true,"prix":true,"isbn_txt":true,"texte4e":true,"typo":true,"dos":true,"logo":true}', '{}'),
  (2, 'Sur les hauteurs des chutes du Niagara', 'Steve Moradel', NULL, 'Roman', NULL, 4, 7, 'draft', 280, '🏔️', '{"ean":false,"prix":false,"isbn_txt":false,"texte4e":true,"typo":true,"dos":true,"logo":true}', '{"Ajouter EAN-13","Ajouter prix TTC","Ajouter ISBN texte"}'),
  (3, 'Du Chaos Naît une Étoile', 'Steve Moradel', NULL, 'Essai', NULL, 3, 7, 'draft', 220, '⭐', '{"ean":false,"prix":false,"isbn_txt":false,"texte4e":true,"typo":true,"dos":false,"logo":true}', '{"Ajouter EAN-13","Ajouter prix TTC","Ajouter ISBN texte","Ajouter texte sur dos"}'),
  (4, 'Dans les Failles du Siècle', 'Steve Moradel', NULL, 'Essai', NULL, 4, 7, 'draft', 310, '🌍', '{"ean":false,"prix":false,"isbn_txt":false,"texte4e":true,"typo":true,"dos":true,"logo":true}', '{"Ajouter EAN-13","Ajouter prix TTC","Ajouter ISBN texte"}'),
  (5, 'Aurora', 'Steve Moradel', NULL, 'Roman', NULL, 4, 7, 'in-progress', 350, '❄️', '{"ean":false,"prix":false,"isbn_txt":false,"texte4e":true,"typo":true,"dos":true,"logo":true}', '{"Ajouter EAN-13","Ajouter prix TTC","Ajouter ISBN texte"}'),
  (6, 'Le Trône de Cendre', 'Steve Moradel', NULL, 'Roman historique', NULL, 3, 7, 'in-progress', 420, '🏛️', '{"ean":false,"prix":false,"isbn_txt":false,"texte4e":true,"typo":true,"dos":false,"logo":true}', '{"Ajouter EAN-13","Ajouter prix TTC","Ajouter ISBN texte","Corriger dos (AURORA → Le Trône de Cendre)"}'),
  (7, 'À l''Ombre des Oliviers', 'Steve Moradel', NULL, 'Roman', NULL, 4, 7, 'draft', 290, '🫒', '{"ean":false,"prix":false,"isbn_txt":false,"texte4e":true,"typo":true,"dos":true,"logo":true}', '{"Ajouter EAN-13","Ajouter prix TTC","Ajouter ISBN texte"}'),
  (8, 'Les Mémoires Reliées', 'Steve Moradel', NULL, 'Roman', NULL, 4, 7, 'draft', 330, '🔗', '{"ean":false,"prix":false,"isbn_txt":false,"texte4e":true,"typo":true,"dos":true,"logo":true}', '{"Ajouter EAN-13","Ajouter prix TTC","Ajouter ISBN texte"}'),
  (9, 'Le Temps des Étincelles', 'Steve et Allison Moradel', NULL, 'BD', 'Étincelles', 3, 7, 'in-progress', 64, '✨', '{"ean":false,"prix":false,"isbn_txt":false,"texte4e":true,"typo":false,"dos":true,"logo":true}', '{"Ajouter EAN-13","Ajouter prix TTC","Ajouter ISBN texte","Corriger ETINCELLES → ÉTINCELLES"}'),
  (10, 'Les Réparatrices', 'Steve Moradel', NULL, 'Essai', NULL, 2, 7, 'draft', 240, '🧵', '{"ean":false,"prix":false,"isbn_txt":false,"texte4e":false,"typo":true,"dos":false,"logo":true}', '{"Ajouter EAN-13","Ajouter prix TTC","Ajouter ISBN texte","Fournir texte 4e","Fournir 4e de couverture"}');

-- Reset sequence
SELECT setval(pg_get_serial_sequence('projects', 'id'), (SELECT MAX(id) FROM projects));

INSERT INTO editions (project_id, format, isbn, price, status) VALUES
  -- Anti-Stress
  (1, 'broché', '978-2-488647-00-7', '18,90€', 'in-progress'),
  (1, 'epub', '978-2-488647-01-4', NULL, 'planned'),
  (1, 'pdf', '978-2-488647-02-1', NULL, 'planned'),
  -- Niagara
  (2, 'broché', '978-2-488647-03-8', NULL, 'planned'),
  (2, 'poche', '978-2-488647-04-5', NULL, 'planned'),
  (2, 'epub', '978-2-488647-05-2', NULL, 'planned'),
  -- Du Chaos
  (3, 'broché', '978-2-488647-07-6', NULL, 'planned'),
  (3, 'epub', '978-2-488647-08-3', NULL, 'planned'),
  -- Failles du Siècle
  (4, 'broché', '978-2-488647-10-6', NULL, 'planned'),
  (4, 'poche', '978-2-488647-11-3', NULL, 'planned'),
  (4, 'epub', '978-2-488647-12-0', NULL, 'planned'),
  -- Aurora
  (5, 'broché', '978-2-488647-13-7', NULL, 'in-progress'),
  (5, 'poche', '978-2-488647-14-4', NULL, 'planned'),
  (5, 'epub', '978-2-488647-15-1', NULL, 'planned'),
  (5, 'audiobook', '978-2-488647-16-8', NULL, 'planned'),
  -- Trône de Cendre
  (6, 'broché', '978-2-488647-17-5', NULL, 'in-progress'),
  (6, 'relié', '978-2-488647-18-2', NULL, 'planned'),
  (6, 'epub', '978-2-488647-19-9', NULL, 'planned'),
  (6, 'audiobook', '978-2-488647-20-5', NULL, 'planned'),
  -- Oliviers
  (7, 'broché', '978-2-488647-21-2', NULL, 'planned'),
  (7, 'poche', '978-2-488647-22-9', NULL, 'planned'),
  (7, 'epub', '978-2-488647-23-6', NULL, 'planned'),
  -- Mémoires Reliées
  (8, 'broché', '978-2-488647-25-0', NULL, 'planned'),
  (8, 'epub', '978-2-488647-26-7', NULL, 'planned'),
  -- Étincelles BD
  (9, 'broché', '978-2-488647-29-8', NULL, 'in-progress'),
  (9, 'epub', '978-2-488647-30-4', NULL, 'planned'),
  -- Réparatrices
  (10, 'broché', '978-2-488647-31-1', NULL, 'planned'),
  (10, 'epub', '978-2-488647-32-8', NULL, 'planned'),
  (10, 'audiobook', '978-2-488647-33-5', NULL, 'planned');
