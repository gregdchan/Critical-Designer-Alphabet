import type { RequestHandler } from './$types';
import { buildSessionExport } from '$lib/server/workshop';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const markdown = await buildSessionExport(params.code);
		return new Response(markdown, {
			status: 200,
			headers: {
				'Content-Type': 'text/markdown; charset=utf-8',
				'Content-Disposition': `attachment; filename="session-${params.code}.md"`
			}
		});
	} catch (error: any) {
		console.error('Failed to export session', error);
		return new Response(`Error exporting session: ${error?.message ?? 'Internal server error'}`, {
			status: 500
		});
	}
};
