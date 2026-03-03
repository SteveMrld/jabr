'use client';

import { useState, useEffect, useCallback } from 'react';
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
  photo?: string; // URL or base64
  email?: string;
  website?: string;
  social?: {
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
    twitter?: string;
  };
  distinctions?: string[];
  isbnPrefix?: string; // If different from default
  defaultGenres?: string[];
  newsletter?: { name: string; subscribers: number };
  createdAt: string;
  color: string; // Accent gradient color
}

// ── Gradient palette for author cards ──
const AUTHOR_GRADIENTS = [
  ['#2D1B4E', '#C8952E'], // mauve → or (Jabrilia default)
  ['#1A3A5C', '#4ECDC4'], // deep blue → teal
  ['#4A0E2E', '#E07A2F'], // burgundy → orange
  ['#0B3D2E', '#A8E6CE'], // forest → mint
  ['#3D0C5C', '#FF6B6B'], // purple → coral
  ['#1C1C2E', '#F5DCA0'], // midnight → gold
  ['#2E1A0B', '#E8B84B'], // chocolate → amber
  ['#0E2F44', '#48D1CC'], // navy → turquoise
];

export const getAuthorGradient = (index: number): [string, string] => {
  return AUTHOR_GRADIENTS[index % AUTHOR_GRADIENTS.length] as [string, string];
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
    social: {
      instagram: '@stevemoradel',
      linkedin: 'stevemoradel',
      tiktok: '@stevemoradel',
    },
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
    social: {
      instagram: '@allisonmoradel',
    },
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

const saveAuthors = (authors: Author[]) => {
  try { localStorage.setItem(LS_AUTHORS_KEY, JSON.stringify(authors)); } catch {}
};

const loadAuthors = (): Author[] | null => {
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
// HOOK: useAuthors
// ═══════════════════════════════════

export function useAuthors() {
  const [authors, setAuthors] = useState<Author[]>(DEFAULT_AUTHORS);
  const [activeAuthorId, setActiveAuthorId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    const saved = loadAuthors();
    if (saved && saved.length > 0) {
      setAuthors(saved);
    } else {
      saveAuthors(DEFAULT_AUTHORS);
    }
    const savedActive = loadActiveAuthorId();
    if (savedActive) setActiveAuthorId(savedActive);
    setLoaded(true);
  }, []);

  const activeAuthor = authors.find(a => a.id === activeAuthorId) || null;

  const selectAuthor = useCallback((id: string) => {
    setActiveAuthorId(id);
    saveActiveAuthorId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setActiveAuthorId(null);
    try { localStorage.removeItem(LS_ACTIVE_AUTHOR_KEY); } catch {}
  }, []);

  const addAuthor = useCallback((author: Author) => {
    setAuthors(prev => {
      const next = [...prev, author];
      saveAuthors(next);
      return next;
    });
  }, []);

  const updateAuthor = useCallback((updated: Author) => {
    setAuthors(prev => {
      const next = prev.map(a => a.id === updated.id ? updated : a);
      saveAuthors(next);
      return next;
    });
  }, []);

  const deleteAuthor = useCallback((id: string) => {
    setAuthors(prev => {
      const next = prev.filter(a => a.id !== id);
      saveAuthors(next);
      return next;
    });
    if (activeAuthorId === id) {
      setActiveAuthorId(null);
      try { localStorage.removeItem(LS_ACTIVE_AUTHOR_KEY); } catch {}
    }
  }, [activeAuthorId]);

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
    authors,
    activeAuthor,
    activeAuthorId,
    loaded,
    selectAuthor,
    clearSelection,
    addAuthor,
    updateAuthor,
    deleteAuthor,
    getAuthorProjects,
  };
}
