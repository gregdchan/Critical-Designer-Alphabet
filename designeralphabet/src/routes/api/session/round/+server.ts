import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { setActiveRound } from '$lib/server/workshop';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { code, action, roundName, durationMinutes } = await request.json();
		if (!code) {
			return json({ success: false, error: 'code is required' }, { status: 400 });
		}

		if (action === 'clear') {
			const session = await setActiveRound(code, { name: null, endsAt: null });
			return json({ success: true, session });
		}

		const name = typeof roundName === 'string' ? roundName.trim() : '';
		if (!name) {
			return json(
				{ success: false, error: 'roundName is required when starting a round' },
				{ status: 400 }
			);
		}

		let expiresAt: string | null = null;
		const minutes = Number(durationMinutes);
		if (!Number.isNaN(minutes) && minutes > 0) {
			const now = new Date();
			now.setMinutes(now.getMinutes() + Math.round(minutes));
			expiresAt = now.toISOString();
		}

		const session = await setActiveRound(code, { name, endsAt: expiresAt });
		return json({ success: true, session });
	} catch (error: any) {
		console.error('Failed to update session round', error);
		return json(
			{ success: false, error: error?.message ?? 'Internal server error' },
			{ status: 500 }
		);
	}
};
