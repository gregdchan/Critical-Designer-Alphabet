import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listSessions, type SessionStatus } from '$lib/server/workshop';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const statusParam = url.searchParams.get('status');
		const facilitatorEmail = url.searchParams.get('facilitatorEmail') ?? undefined;
		const allowed = new Set<SessionStatus>(['planned', 'live', 'done']);
		const statuses = (
			statusParam
				? statusParam
						.split(',')
						.map((value) => value.trim())
						.filter((value) => allowed.has(value as SessionStatus))
				: ['planned', 'live']
		) as SessionStatus[];

		const sessions = await listSessions({ statuses, facilitatorEmail });
		return json({
			success: true,
			sessions
		});
	} catch (error: any) {
		console.error('Failed to list sessions', error);
		return json(
			{ success: false, error: error?.message ?? 'Internal server error' },
			{ status: 500 }
		);
	}
};
