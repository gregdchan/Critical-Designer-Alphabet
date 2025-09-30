import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addResponse } from '$lib/server/workshop';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { code, questionId, participantId, text, cards } = await request.json();
		if (!code || !questionId || !text) {
			return json(
				{ success: false, error: 'code, questionId, and text are required' },
				{ status: 400 }
			);
		}

		const response = await addResponse({
			code,
			questionId: String(questionId),
			participantId: participantId ? String(participantId) : null,
			text,
			cards: Array.isArray(cards) ? cards : []
		});

		return json({ success: true, response });
	} catch (error: any) {
		console.error('Failed to add response', error);
		return json(
			{ success: false, error: error?.message ?? 'Internal server error' },
			{ status: 500 }
		);
	}
};
