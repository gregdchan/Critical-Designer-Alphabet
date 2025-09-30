import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateScore } from '$lib/server/workshop';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { participantId, delta, badge } = await request.json();
		if (!participantId) {
			return json({ success: false, error: 'participantId is required' }, { status: 400 });
		}

		const result = await updateScore({
			participantId: String(participantId),
			delta: Number(delta ?? 0),
			badge
		});
		if (!result) {
			return json({ success: false, error: 'Participant not found' }, { status: 404 });
		}
		return json({ success: true, ...result });
	} catch (error: any) {
		console.error('Failed to update score', error);
		return json(
			{ success: false, error: error?.message ?? 'Internal server error' },
			{ status: 500 }
		);
	}
};
