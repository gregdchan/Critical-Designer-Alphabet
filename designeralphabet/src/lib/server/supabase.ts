import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE;

if (!url) {
  throw new Error('Missing Supabase URL. Set VITE_SUPABASE_URL in your environment.');
}

if (!serviceRoleKey) {
  throw new Error('Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE for server-side access.');
}

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
  global: { headers: { 'X-Client-Info': 'cda-workshop-server' } }
});
