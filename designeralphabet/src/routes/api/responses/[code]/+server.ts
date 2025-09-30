import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getResponses } from '$lib/server/workshop';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const responses = await getResponses(params.code);
		return json({ success: true, responses });
	} catch (error: any) {
		console.error('Failed to load responses', error);
		return json(
			{ success: false, error: error?.message ?? 'Internal server error' },
			{ status: 500 }
		);
	}
};
