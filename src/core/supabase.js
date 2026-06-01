/**
 * The one and only Supabase client instance.
 * Everything that talks to Supabase imports `supabase` from here.
 * Never call createClient anywhere else.
 */
import { createClient } from '@supabase/supabase-js';
import { config, hasSupabase } from './config.js';

export const supabase = hasSupabase
  ? createClient(config.supabase.url, config.supabase.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export { hasSupabase };
