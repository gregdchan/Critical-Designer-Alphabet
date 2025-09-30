import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSession } from '$lib/server/workshop';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { code, title, templateSlug, challenge, facilitatorEmail } = await request.json();
		if (!code || !title) {
			return json({ success: false, error: 'code and title are required' }, { status: 400 });
		}

		try {
			const session = await createSession({
				code,
				title,
				templateSlug,
				challenge,
				facilitatorEmail
			});
			return json({ success: true, session });
		} catch (error: any) {
			const duplicateCodes = ['ER_DUP_ENTRY', '23505', '409'];
			if (duplicateCodes.includes(error?.code ?? error?.status?.toString())) {
				return json({ success: false, error: 'Session code already exists' }, { status: 409 });
			}
			throw error;
		}
	} catch (error: any) {
		console.error('Failed to create session', error);
		return json(
			{ success: false, error: error?.message ?? 'Internal server error' },
			{ status: 500 }
		);
	}
};
