import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getParticipants } from '$lib/server/workshop';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const participants = await getParticipants(params.code);
		return json({ success: true, participants });
	} catch (error: any) {
		console.error('Failed to load participants', error);
		return json(
			{ success: false, error: error?.message ?? 'Internal server error' },
			{ status: 500 }
		);
	}
};
