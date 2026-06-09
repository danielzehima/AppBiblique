/**
 * État d'authentification (session Supabase), partagé dans l'app.
 */
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase/client';

type AuthState = {
  session: Session | null;
  user: User | null;
  ready: boolean;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  ready: false,
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));

/** À appeler une fois au démarrage (récupère la session + écoute les changements). */
export function initAuth(): () => void {
  supabase.auth
    .getSession()
    .then(({ data }) =>
      useAuth.setState({ session: data.session, user: data.session?.user ?? null, ready: true }),
    )
    .catch((e) => {
      console.error('getSession', e);
      useAuth.setState({ ready: true });
    });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useAuth.setState({ session, user: session?.user ?? null, ready: true });
  });

  return () => data.subscription.unsubscribe();
}
