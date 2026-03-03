-- =============================================
-- JABR v3 — Migration Multi-Tenant
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- ═══ TABLE: authors ═══
CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  bio TEXT DEFAULT '',
  email TEXT,
  website TEXT,
  photo_url TEXT,
  social JSONB DEFAULT '{}',
  distinctions TEXT[] DEFAULT '{}',
  isbn_prefix TEXT,
  default_genres TEXT[] DEFAULT '{}',
  newsletter_name TEXT,
  newsletter_subscribers INT DEFAULT 0,
  color TEXT DEFAULT '#C8952E',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ TABLE: media_plans ═══
CREATE TABLE IF NOT EXISTS media_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('budget', 'objective')),
  input_budget INT,
  input_objective INT,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ ALTER: projects — add user_id + author_id ═══
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'user_id') THEN
    ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'author_id') THEN
    ALTER TABLE projects ADD COLUMN author_id UUID REFERENCES authors(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'back_cover') THEN
    ALTER TABLE projects ADD COLUMN back_cover TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'cover_image') THEN
    ALTER TABLE projects ADD COLUMN cover_image TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'publication_date') THEN
    ALTER TABLE projects ADD COLUMN publication_date DATE;
  END IF;
END $$;

-- ═══ ALTER: editions — add user_id ═══
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'editions' AND column_name = 'user_id') THEN
    ALTER TABLE editions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_authors_user ON authors(user_id);
CREATE INDEX IF NOT EXISTS idx_media_plans_user ON media_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_media_plans_project ON media_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_author ON projects(author_id);

-- ═══ TRIGGERS ═══
CREATE TRIGGER authors_updated_at
  BEFORE UPDATE ON authors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══ RLS POLICIES — Real multi-tenant ═══

-- Drop old public policies
DROP POLICY IF EXISTS "Public access projects" ON projects;
DROP POLICY IF EXISTS "Public access editions" ON editions;

-- Projects: users see only their own
CREATE POLICY "Users own projects" ON projects
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Editions: users see only their own
ALTER TABLE editions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own editions" ON editions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authors: users see only their own
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own authors" ON authors
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Media plans: users see only their own
ALTER TABLE media_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own media_plans" ON media_plans
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ═══ STORAGE BUCKET — Covers ═══
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Users upload covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'covers' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Public read covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "Users delete own covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ═══ FUNCTION: Seed data for new user ═══
CREATE OR REPLACE FUNCTION seed_new_user()
RETURNS TRIGGER AS $$
DECLARE
  author_id UUID;
BEGIN
  -- Create default author profile
  INSERT INTO authors (user_id, first_name, last_name, bio, color)
  VALUES (NEW.id, split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', 1),
          COALESCE(split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2), ''),
          '', '#C8952E')
  RETURNING id INTO author_id;

  -- Create a sample project
  INSERT INTO projects (user_id, author_id, title, genre, status, pages, cover, score, max_score, diag, corrections)
  VALUES (NEW.id, author_id, 'Mon premier livre', 'Roman', 'draft', 0, '📖', 0, 7,
          '{"ean":false,"prix":false,"isbn_txt":false,"texte4e":false,"typo":false,"dos":false,"logo":false}', '{}');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION seed_new_user();

