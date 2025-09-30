import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addTimelineItem } from '$lib/server/workshop';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { code, label, itemText, owner, metric, riskNote } = await request.json();
		if (!code || !label || !itemText) {
			return json(
				{ success: false, error: 'code, label, and itemText are required' },
				{ status: 400 }
			);
		}

		const item = await addTimelineItem({
			code,
			label,
			itemText,
			owner,
			metric,
			riskNote
		});

		return json({ success: true, item });
	} catch (error: any) {
		console.error('Failed to add timeline item', error);
		return json(
			{ success: false, error: error?.message ?? 'Internal server error' },
			{ status: 500 }
		);
	}
};
