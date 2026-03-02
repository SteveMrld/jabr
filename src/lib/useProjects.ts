'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { PROJECTS as STATIC_PROJECTS, type Project, type Edition, type EditionFormat, type AnalysisResult, type ManuscriptStatus } from './data';

// ═══════════════════════════════════
// LOCAL STORAGE PERSISTENCE
// ═══════════════════════════════════

const LS_PROJECTS_KEY = 'jabr-projects-v2';
const LS_CHECKLISTS_KEY = 'jabr-dist-checklists';
const LS_CALENDAR_KEY = 'jabr-calendar-results';

const saveToLS = (key: string, data: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

const loadFromLS = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch { return null; }
};

// ═══════════════════════════════════
// SUPABASE DB TYPES
// ═══════════════════════════════════

interface DbProject {
  id: number;
  title: string;
  subtitle: string | null;
  author: string;
  illustrator: string | null;
  genre: string;
  collection: string | null;
  score: number;
  max_score: number;
  status: string;
  pages: number;
  cover: string;
  cover_image: string | null;
  back_cover: string | null;
  notes: string | null;
  diag: Record<string, boolean>;
  corrections: string[];
  manuscript_status: string | null;
  manuscript_file: string | null;
  analysis: AnalysisResult | null;
}

interface DbEdition {
  id: number;
  project_id: number;
  format: string;
  isbn: string;
  price: string | null;
  status: string;
}

const toProject = (row: DbProject, editions: DbEdition[]): Project => ({
  id: row.id,
  title: row.title,
  subtitle: row.subtitle || undefined,
  author: row.author,
  illustrator: row.illustrator || undefined,
  genre: row.genre,
  collection: row.collection || undefined,
  editions: editions
    .filter(e => e.project_id === row.id)
    .map(e => ({ format: e.format as EditionFormat, isbn: e.isbn, price: e.price || undefined, status: e.status as Edition['status'] })),
  score: row.score,
  maxScore: row.max_score,
  status: row.status as Project['status'],
  pages: row.pages,
  cover: row.cover,
  coverImage: row.cover_image || undefined,
  backCover: row.back_cover || undefined,
  notes: row.notes || undefined,
  diag: row.diag,
  corrections: row.corrections || [],
  manuscriptStatus: (row.manuscript_status as ManuscriptStatus) || undefined,
  manuscriptFile: row.manuscript_file || undefined,
  analysis: row.analysis || undefined,
});

const toDbRow = (p: Project) => ({
  title: p.title,
  subtitle: p.subtitle || null,
  author: p.author,
  illustrator: p.illustrator || null,
  genre: p.genre,
  collection: p.collection || null,
  score: p.score,
  max_score: p.maxScore,
  status: p.status,
  pages: p.pages,
  cover: p.cover,
  cover_image: p.coverImage || null,
  back_cover: p.backCover || null,
  notes: p.notes || null,
  diag: p.diag,
  corrections: p.corrections,
  manuscript_status: p.manuscriptStatus || null,
  manuscript_file: p.manuscriptFile || null,
  analysis: p.analysis || null,
});

// ═══════════════════════════════════
// DISTRIBUTION CHECKLISTS STORE
// ═══════════════════════════════════

export function useDistributionChecks() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = loadFromLS<Record<string, boolean>>(LS_CHECKLISTS_KEY);
    if (saved) setChecks(saved);
  }, []);

  const toggle = useCallback((key: string) => {
    setChecks(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveToLS(LS_CHECKLISTS_KEY, next);
      return next;
    });
  }, []);

  const isChecked = useCallback((key: string, autoValue: boolean) => {
    return checks[key] !== undefined ? checks[key] : autoValue;
  }, [checks]);

  const isManual = useCallback((key: string) => checks[key] !== undefined, [checks]);

  return { checks, toggle, isChecked, isManual };
}

// ═══════════════════════════════════
// CALENDAR AI RESULTS STORE
// ═══════════════════════════════════

export function useCalendarResults() {
  const [results, setResults] = useState<Record<number, unknown>>({});

  useEffect(() => {
    const saved = loadFromLS<Record<number, unknown>>(LS_CALENDAR_KEY);
    if (saved) setResults(saved);
  }, []);

  const save = useCallback((projectId: number, result: unknown) => {
    setResults(prev => {
      const next = { ...prev, [projectId]: result };
      saveToLS(LS_CALENDAR_KEY, next);
      return next;
    });
  }, []);

  const get = useCallback((projectId: number) => results[projectId] || null, [results]);

  return { results, save, get };
}

// ═══════════════════════════════════
// MAIN PROJECTS HOOK
// ═══════════════════════════════════

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(STATIC_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [persisted, setPersisted] = useState(false);

  // Persist to localStorage on every change
  const persistLocal = useCallback((projs: Project[]) => {
    saveToLS(LS_PROJECTS_KEY, projs);
  }, []);

  // Load on mount: Supabase first, then localStorage, then static
  useEffect(() => {
    const load = async () => {
      // Try localStorage first (always available)
      const localData = loadFromLS<Project[]>(LS_PROJECTS_KEY);

      if (isSupabaseConfigured()) {
        try {
          const sb = getSupabase();
          if (sb) {
            const [{ data: rows, error: pErr }, { data: eds, error: eErr }] = await Promise.all([
              sb.from('projects').select('*').order('id'),
              sb.from('editions').select('*').order('project_id, id'),
            ]);
            if (!pErr && !eErr && rows && rows.length > 0 && eds) {
              const loaded = rows.map((r: DbProject) => toProject(r, eds as DbEdition[]));
              setProjects(loaded);
              persistLocal(loaded);
              setPersisted(true);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Supabase non disponible:', err);
        }
      }

      // Fallback: localStorage
      if (localData && localData.length > 0) {
        setProjects(localData);
        setPersisted(true);
      }
      // else: keep STATIC_PROJECTS and save them
      else {
        persistLocal(STATIC_PROJECTS);
      }
      setLoading(false);
    };
    load();
  }, [persistLocal]);

  // ADD
  const addProject = useCallback(async (p: Project) => {
    const updated = [...projects, p];
    setProjects(updated);
    persistLocal(updated);

    if (isSupabaseConfigured()) {
      try {
        const { data: row, error } = await getSupabase()!.from('projects').insert(toDbRow(p)).select().single();
        if (error) throw error;
        if (p.editions.length > 0) {
          await getSupabase()!.from('editions').insert(
            p.editions.map(e => ({ project_id: row.id, format: e.format, isbn: e.isbn, price: e.price || null, status: e.status }))
          );
        }
        const withId = updated.map(proj => proj === p ? { ...proj, id: row.id } : proj);
        setProjects(withId);
        persistLocal(withId);
      } catch (err) {
        console.error('Erreur ajout Supabase:', err);
      }
    }
  }, [projects, persistLocal]);

  // UPDATE
  const updateProject = useCallback(async (updated: Project) => {
    const next = projects.map(p => p.id === updated.id ? updated : p);
    setProjects(next);
    persistLocal(next);

    if (isSupabaseConfigured()) {
      try {
        await getSupabase()!.from('projects').update(toDbRow(updated)).eq('id', updated.id);
      } catch (err) {
        console.error('Erreur update Supabase:', err);
      }
    }
  }, [projects, persistLocal]);

  // DELETE
  const deleteProject = useCallback(async (id: number) => {
    const next = projects.filter(p => p.id !== id);
    setProjects(next);
    persistLocal(next);

    if (isSupabaseConfigured()) {
      try {
        await getSupabase()!.from('projects').delete().eq('id', id);
      } catch (err) {
        console.error('Erreur delete Supabase:', err);
      }
    }
  }, [projects, persistLocal]);

  return { projects, loading, persisted: persisted || !!loadFromLS(LS_PROJECTS_KEY), addProject, updateProject, deleteProject };
}
