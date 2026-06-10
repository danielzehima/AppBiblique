/**
 * Client Supabase (auth + base) pour Demeure.
 * La clé "publishable" est conçue pour être publique (la sécurité repose sur RLS).
 * Surcharge possible via les variables d'env EXPO_PUBLIC_SUPABASE_*.
 */
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://njtajlgkiowonpvbrazc.supabase.co';
const SUPABASE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_Mt2vruyUj0BXlDldpOikgw_01MeXdXz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
