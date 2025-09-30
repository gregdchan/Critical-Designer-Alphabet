import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getSession,
	getParticipants,
	getQuestions,
	getResponses,
	getTimeline,
	getChat,
	getSessionPhases
} from '$lib/server/workshop';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const session = await getSession(params.code);
		if (!session) {
			return json({ success: false, error: 'Session not found' }, { status: 404 });
		}

		const [participants, questions, responses, timeline, chat, phases] = await Promise.all([
			getParticipants(params.code),
			getQuestions(params.code),
			getResponses(params.code),
			getTimeline(params.code),
			getChat(params.code),
			getSessionPhases(params.code)
		]);

		return json({
			success: true,
			session,
			participants,
			questions,
			responses,
			timeline,
			chat,
			phases
		});
	} catch (error: any) {
		console.error('Failed to load session', error);
		return json(
			{ success: false, error: error?.message ?? 'Internal server error' },
			{ status: 500 }
		);
	}
};
