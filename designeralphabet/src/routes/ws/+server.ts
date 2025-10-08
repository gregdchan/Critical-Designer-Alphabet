import type { RequestHandler } from './$types';

// WebSocket endpoint has been DISABLED - Use Supabase Realtime instead
// This endpoint is no longer supported and will return 410 Gone

export const GET: RequestHandler = async () => {
	return new Response(
		JSON.stringify({
			error: 'WebSocket endpoint disabled',
			message: 'This endpoint has been removed. All realtime functionality now uses Supabase Realtime. Please update your client code.'
		}),
		{
			status: 410, // Gone
			headers: { 'Content-Type': 'application/json' }
		}
	);
};
