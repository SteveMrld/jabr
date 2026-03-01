'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { PROJECTS as STATIC_PROJECTS, type Project, type Edition, type EditionFormat } from './data';

// DB row types
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
  diag: Record<string, boolean>;
  corrections: string[];
}

interface DbEdition {
  id: number;
  project_id: number;
  format: string;
  isbn: string;
  price: string | null;
  status: string;
}

// Convert DB rows → Project
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
    .map(e => ({
      format: e.format as EditionFormat,
      isbn: e.isbn,
      price: e.price || undefined,
      status: e.status as Edition['status'],
    })),
  score: row.score,
  maxScore: row.max_score,
  status: row.status as Project['status'],
  pages: row.pages,
  cover: row.cover,
  diag: row.diag,
  corrections: row.corrections || [],
});

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(STATIC_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [persisted, setPersisted] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const sb = getSupabase();
        if (!sb) { setLoading(false); return; }

        const [{ data: rows, error: pErr }, { data: eds, error: eErr }] = await Promise.all([
          sb.from('projects').select('*').order('id'),
          sb.from('editions').select('*').order('project_id, id'),
        ]);

        if (pErr || eErr) throw pErr || eErr;
        if (rows && rows.length > 0 && eds) {
          setProjects(rows.map((r: DbProject) => toProject(r, eds as DbEdition[])));
          setPersisted(true);
        }
      } catch (err) {
        console.warn('Supabase non disponible, mode local:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ADD project
  const addProject = useCallback(async (p: Project) => {
    if (!isSupabaseConfigured()) {
      setProjects(prev => [...prev, p]);
      return;
    }

    try {
      const { data: row, error } = await getSupabase()!
        .from('projects')
        .insert({
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
          diag: p.diag,
          corrections: p.corrections,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert editions
      if (p.editions.length > 0) {
        const { error: edErr } = await getSupabase()!.from('editions').insert(
          p.editions.map(e => ({
            project_id: row.id,
            format: e.format,
            isbn: e.isbn,
            price: e.price || null,
            status: e.status,
          }))
        );
        if (edErr) throw edErr;
      }

      // Reload
      const newProject = { ...p, id: row.id };
      setProjects(prev => [...prev, newProject]);
    } catch (err) {
      console.error('Erreur ajout:', err);
      setProjects(prev => [...prev, p]);
    }
  }, []);

  // UPDATE project
  const updateProject = useCallback(async (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));

    if (!isSupabaseConfigured()) return;

    try {
      const { error } = await getSupabase()!
        .from('projects')
        .update({
          title: updated.title,
          subtitle: updated.subtitle || null,
          author: updated.author,
          illustrator: updated.illustrator || null,
          genre: updated.genre,
          collection: updated.collection || null,
          score: updated.score,
          max_score: updated.maxScore,
          status: updated.status,
          pages: updated.pages,
          cover: updated.cover,
          diag: updated.diag,
          corrections: updated.corrections,
        })
        .eq('id', updated.id);

      if (error) throw error;
    } catch (err) {
      console.error('Erreur update:', err);
    }
  }, []);

  // DELETE project
  const deleteProject = useCallback(async (id: number) => {
    setProjects(prev => prev.filter(p => p.id !== id));

    if (!isSupabaseConfigured()) return;

    try {
      // Editions auto-deleted via CASCADE
      const { error } = await getSupabase()!.from('projects').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Erreur delete:', err);
    }
  }, []);

  return { projects, loading, persisted, addProject, updateProject, deleteProject };
}
