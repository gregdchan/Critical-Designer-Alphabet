import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTimeline } from '$lib/server/workshop';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const timeline = await getTimeline(params.code);
		return json({ success: true, timeline });
	} catch (error: any) {
		console.error('Failed to load timeline', error);
		return json(
			{ success: false, error: error?.message ?? 'Internal server error' },
			{ status: 500 }
		);
	}
};
