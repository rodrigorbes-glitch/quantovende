import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Para o frontend, usamos exclusivamente a ANON KEY e dependemos do RLS.
// Se as chaves não estiverem configuradas (ex: modo offline ou fork do dev), instanciamos nulo ou dummy.
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const hasSupabase = !!supabase;
