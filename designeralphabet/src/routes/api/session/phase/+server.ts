import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { startSessionPhase, completeSessionPhase } from '$lib/server/workshop';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { code, phaseKey, action } = await request.json();
		if (!code || !phaseKey || !action) {
			return json(
				{ success: false, error: 'code, phaseKey, and action are required' },
				{ status: 400 }
			);
		}

		switch (action) {
			case 'start':
				await startSessionPhase(code, phaseKey);
				break;
			case 'complete':
				await completeSessionPhase(code, phaseKey);
				break;
			case 'restart':
				// Restart the timer by updating the started_at timestamp
				await startSessionPhase(code, phaseKey);
				break;
			default:
				return json({ success: false, error: `Unknown action ${action}` }, { status: 400 });
		}

		return json({ success: true });
	} catch (error: any) {
		console.error('Failed to update session phase', error);
		return json(
			{ success: false, error: error?.message ?? 'Internal server error' },
			{ status: 500 }
		);
	}
};
