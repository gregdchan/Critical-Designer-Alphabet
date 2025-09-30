import { createClient } from '@supabase/supabase-js';
import { building } from '$app/environment';

const url = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE;

// Only validate environment variables when not in build mode
if (!building) {
  if (!url) {
    throw new Error('Missing Supabase URL. Set VITE_SUPABASE_URL in your environment.');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE for server-side access.');
  }
}

// Use fallback values during build to prevent errors
const safeUrl = url || 'https://placeholder.supabase.co';
const safeServiceRoleKey = serviceRoleKey || 'placeholder-key';

export const supabaseAdmin = createClient(safeUrl, safeServiceRoleKey, {
  auth: { persistSession: false },
  global: { headers: { 'X-Client-Info': 'cda-workshop-server' } }
});
