'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { type Project } from './data';

// ═══════════════════════════════════
// AUTHOR ENTITY — JABR v3
// ═══════════════════════════════════

export interface Author {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  photo?: string;
  email?: string;
  website?: string;
  social?: {
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
    twitter?: string;
  };
  distinctions?: string[];
  isbnPrefix?: string;
  defaultGenres?: string[];
  newsletter?: { name: string; subscribers: number };
  createdAt: string;
  color: string;
}

// ── Gradient palette for author cards ──
const AUTHOR_GRADIENTS: [string, string][] = [
  ['#2D1B4E', '#C8952E'],
  ['#1A3A5C', '#4ECDC4'],
  ['#4A0E2E', '#E07A2F'],
  ['#0B3D2E', '#A8E6CE'],
  ['#3D0C5C', '#FF6B6B'],
  ['#1C1C2E', '#F5DCA0'],
  ['#2E1A0B', '#E8B84B'],
  ['#0E2F44', '#48D1CC'],
];

export const getAuthorGradient = (index: number): [string, string] => {
  return AUTHOR_GRADIENTS[index % AUTHOR_GRADIENTS.length];
};

export const getAuthorInitials = (author: Author): string => {
  return `${author.firstName[0] || ''}${author.lastName[0] || ''}`.toUpperCase();
};

// ── Default seed author ──
export const DEFAULT_AUTHORS: Author[] = [
  {
    id: 'steve-moradel',
    firstName: 'Steve',
    lastName: 'Moradel',
    displayName: 'Steve Moradel',
    bio: 'Entrepreneur, stratège et écrivain. Auteur de « Sur les hauteurs des chutes du Niagara ». Fondateur de Jabrilia Éditions. LinkedIn Top Voice 2020, Personnalité de l\'année 2018 Outre-Mer Network.',
    email: 'steve@jabrilia.com',
    website: 'https://jabrilia.com',
    social: { instagram: '@stevemoradel', linkedin: 'stevemoradel', tiktok: '@stevemoradel' },
    distinctions: ['LinkedIn Top Voice 2020', 'Personnalité de l\'année 2018'],
    isbnPrefix: '978-2-488647',
    defaultGenres: ['Roman', 'Essai', 'BD', 'Jeunesse'],
    newsletter: { name: 'Les Pages de Jade', subscribers: 12000 },
    createdAt: '2024-01-01T00:00:00Z',
    color: '#C8952E',
  },
  {
    id: 'allison-moradel',
    firstName: 'Allison',
    lastName: 'Moradel',
    displayName: 'Allison Moradel',
    bio: 'Illustratrice et autrice jeunesse. Co-autrice de « Mon Petit Livre Anti-Stress » et « Le Temps des Étincelles ».',
    social: { instagram: '@allisonmoradel' },
    defaultGenres: ['Jeunesse', 'BD'],
    createdAt: '2024-06-01T00:00:00Z',
    color: '#4ECDC4',
  },
];

// ═══════════════════════════════════
// LOCAL STORAGE PERSISTENCE
// ═══════════════════════════════════

const LS_AUTHORS_KEY = 'jabr-authors-v3';
const LS_ACTIVE_AUTHOR_KEY = 'jabr-active-author-v3';

const saveAuthorsLS = (authors: Author[]) => {
  try { localStorage.setItem(LS_AUTHORS_KEY, JSON.stringify(authors)); } catch {}
};

const loadAuthorsLS = (): Author[] | null => {
  try {
    const raw = localStorage.getItem(LS_AUTHORS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveActiveAuthorId = (id: string) => {
  try { localStorage.setItem(LS_ACTIVE_AUTHOR_KEY, id); } catch {}
};

const loadActiveAuthorId = (): string | null => {
  try { return localStorage.getItem(LS_ACTIVE_AUTHOR_KEY); } catch { return null; }
};

// ═══════════════════════════════════
// SUPABASE → Author mapping
// ═══════════════════════════════════

interface DbAuthor {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  bio: string;
  email: string | null;
  website: string | null;
  photo_url: string | null;
  social: Record<string, string>;
  distinctions: string[];
  isbn_prefix: string | null;
  default_genres: string[];
  newsletter_name: string | null;
  newsletter_subscribers: number;
  color: string;
  created_at: string;
}

const dbToAuthor = (row: DbAuthor): Author => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  displayName: row.display_name,
  bio: row.bio || '',
  photo: row.photo_url || undefined,
  email: row.email || undefined,
  website: row.website || undefined,
  social: row.social && Object.keys(row.social).length > 0 ? row.social as Author['social'] : undefined,
  distinctions: row.distinctions?.length ? row.distinctions : undefined,
  isbnPrefix: row.isbn_prefix || undefined,
  defaultGenres: row.default_genres?.length ? row.default_genres : undefined,
  newsletter: row.newsletter_name ? { name: row.newsletter_name, subscribers: row.newsletter_subscribers } : undefined,
  createdAt: row.created_at,
  color: row.color,
});

const authorToDb = (a: Omit<Author, 'id' | 'displayName' | 'createdAt'>, userId: string) => ({
  user_id: userId,
  first_name: a.firstName,
  last_name: a.lastName,
  bio: a.bio || '',
  email: a.email || null,
  website: a.website || null,
  photo_url: a.photo || null,
  social: a.social || {},
  distinctions: a.distinctions || [],
  isbn_prefix: a.isbnPrefix || null,
  default_genres: a.defaultGenres || [],
  newsletter_name: a.newsletter?.name || null,
  newsletter_subscribers: a.newsletter?.subscribers || 0,
  color: a.color || '#C8952E',
});

// ═══════════════════════════════════
// HOOK: useAuthors — Auth-aware
// ═══════════════════════════════════

export function useAuthors(userId?: string | null) {
  const [authors, setAuthors] = useState<Author[]>(DEFAULT_AUTHORS);
  const [activeAuthorId, setActiveAuthorId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load on mount: Supabase if auth'd, else localStorage
  useEffect(() => {
    const load = async () => {
      if (isSupabaseConfigured() && userId) {
        try {
          const sb = getSupabase();
          if (sb) {
            const { data, error } = await sb.from('authors').select('*').eq('user_id', userId).order('created_at');
            if (!error && data && data.length > 0) {
              const mapped = (data as DbAuthor[]).map(dbToAuthor);
              setAuthors(mapped);
              saveAuthorsLS(mapped);
              const savedActive = loadActiveAuthorId();
              if (savedActive && mapped.find(a => a.id === savedActive)) {
                setActiveAuthorId(savedActive);
              }
              setLoaded(true);
              return;
            }
            // First time user — seed from defaults
            if (!error && data && data.length === 0) {
              const seeded: Author[] = [];
              for (const def of DEFAULT_AUTHORS) {
                const { data: row, error: insErr } = await sb.from('authors')
                  .insert(authorToDb(def, userId))
                  .select().single();
                if (!insErr && row) seeded.push(dbToAuthor(row as DbAuthor));
              }
              if (seeded.length > 0) {
                setAuthors(seeded);
                saveAuthorsLS(seeded);
                setLoaded(true);
                return;
              }
            }
          }
        } catch (err) {
          console.warn('Authors Supabase fallback:', err);
        }
      }

      // Fallback: localStorage
      const saved = loadAuthorsLS();
      if (saved && saved.length > 0) {
        setAuthors(saved);
      } else {
        saveAuthorsLS(DEFAULT_AUTHORS);
      }
      const savedActive = loadActiveAuthorId();
      if (savedActive) setActiveAuthorId(savedActive);
      setLoaded(true);
    };
    load();
  }, [userId]);

  const activeAuthor = authors.find(a => a.id === activeAuthorId) || null;

  const selectAuthor = useCallback((id: string) => {
    setActiveAuthorId(id);
    saveActiveAuthorId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setActiveAuthorId(null);
    try { localStorage.removeItem(LS_ACTIVE_AUTHOR_KEY); } catch {}
  }, []);

  const addAuthor = useCallback(async (author: Author) => {
    // Optimistic update
    const next = [...authors, author];
    setAuthors(next);
    saveAuthorsLS(next);

    if (isSupabaseConfigured() && userId) {
      try {
        const { data: row, error } = await getSupabase()!.from('authors')
          .insert(authorToDb(author, userId))
          .select().single();
        if (!error && row) {
          const dbAuth = dbToAuthor(row as DbAuthor);
          const withReal = next.map(a => a === author ? dbAuth : a);
          setAuthors(withReal);
          saveAuthorsLS(withReal);
          return dbAuth;
        }
      } catch (err) {
        console.error('Erreur ajout auteur:', err);
      }
    }
    return author;
  }, [authors, userId]);

  const updateAuthor = useCallback(async (updated: Author) => {
    const next = authors.map(a => a.id === updated.id ? updated : a);
    setAuthors(next);
    saveAuthorsLS(next);

    if (isSupabaseConfigured() && userId) {
      try {
        const payload: Record<string, unknown> = {};
        payload.first_name = updated.firstName;
        payload.last_name = updated.lastName;
        payload.bio = updated.bio || '';
        payload.email = updated.email || null;
        payload.website = updated.website || null;
        payload.social = updated.social || {};
        payload.distinctions = updated.distinctions || [];
        payload.isbn_prefix = updated.isbnPrefix || null;
        payload.default_genres = updated.defaultGenres || [];
        payload.color = updated.color;
        payload.newsletter_name = updated.newsletter?.name || null;
        payload.newsletter_subscribers = updated.newsletter?.subscribers || 0;

        await getSupabase()!.from('authors').update(payload).eq('id', updated.id).eq('user_id', userId);
      } catch (err) {
        console.error('Erreur update auteur:', err);
      }
    }
  }, [authors, userId]);

  const deleteAuthor = useCallback(async (id: string) => {
    const next = authors.filter(a => a.id !== id);
    setAuthors(next);
    saveAuthorsLS(next);

    if (activeAuthorId === id) {
      setActiveAuthorId(null);
      try { localStorage.removeItem(LS_ACTIVE_AUTHOR_KEY); } catch {}
    }

    if (isSupabaseConfigured() && userId) {
      try {
        await getSupabase()!.from('authors').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.error('Erreur delete auteur:', err);
      }
    }
  }, [authors, activeAuthorId, userId]);

  // Filter projects by author
  const getAuthorProjects = useCallback((authorId: string, projects: Project[]) => {
    const author = authors.find(a => a.id === authorId);
    if (!author) return [];
    return projects.filter(p =>
      p.author === author.displayName ||
      p.author.includes(author.lastName) ||
      p.illustrator === author.displayName
    );
  }, [authors]);

  return {
    authors, activeAuthor, activeAuthorId, loaded,
    selectAuthor, clearSelection,
    addAuthor, updateAuthor, deleteAuthor,
    getAuthorProjects,
  };
}
