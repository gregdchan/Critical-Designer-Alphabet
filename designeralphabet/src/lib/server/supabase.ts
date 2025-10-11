import { createClient } from '@supabase/supabase-js';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

const url = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE;

// Only validate environment variables when not in build mode
if (!building) {
	if (!url) {
		console.error('Available env vars:', Object.keys(env));
		throw new Error('Missing Supabase URL. Set VITE_SUPABASE_URL in your environment.');
	}

	if (!serviceRoleKey) {
		console.error('Available env vars:', Object.keys(env));
		throw new Error(
			'Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE for server-side access.'
		);
	}
}

// Use fallback values during build to prevent errors
const safeUrl = url || 'https://placeholder.supabase.co';
const safeServiceRoleKey = serviceRoleKey || 'placeholder-key';

export const supabaseAdmin = createClient(safeUrl, safeServiceRoleKey, {
	auth: { persistSession: false },
	global: { headers: { 'X-Client-Info': 'cda-workshop-server' } }
});
