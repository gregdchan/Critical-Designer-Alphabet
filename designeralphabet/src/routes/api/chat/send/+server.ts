import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addChatMessage } from '$lib/server/workshop';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { code, participantId, message } = await request.json();
		if (!code || !message) {
			return json({ success: false, error: 'code and message are required' }, { status: 400 });
		}

		const chatMessage = await addChatMessage({
			code,
			participantId: participantId ? String(participantId) : null,
			message
		});
		return json({ success: true, message: chatMessage });
	} catch (error: any) {
		console.error('Failed to send chat message', error);
		return json(
			{ success: false, error: error?.message ?? 'Internal server error' },
			{ status: 500 }
		);
	}
};
