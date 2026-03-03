'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { type User, type Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null, session: null, loading: true, error: null,
  });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setState({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
        error: error?.message ?? null,
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
        error: null,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase non configuré' };
    setState(s => ({ ...s, loading: true, error: null }));

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || email.split('@')[0] },
      },
    });

    if (error) {
      setState(s => ({ ...s, loading: false, error: error.message }));
      return { error: error.message };
    }

    setState(s => ({
      ...s,
      user: data.user,
      session: data.session,
      loading: false,
    }));
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase non configuré' };
    setState(s => ({ ...s, loading: true, error: null }));

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setState(s => ({ ...s, loading: false, error: error.message }));
      return { error: error.message };
    }

    setState(s => ({
      ...s,
      user: data.user,
      session: data.session,
      loading: false,
    }));
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setState(s => ({ ...s, loading: true }));
    await supabase.auth.signOut();
    setState({ user: null, session: null, loading: false, error: null });
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase non configuré' };

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });

    return { error: error?.message ?? null };
  }, []);

  return {
    ...state,
    isAuthenticated: !!state.user,
    isConfigured: isSupabaseConfigured(),
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}
