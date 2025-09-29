import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateSessionStatus } from '$lib/server/workshop';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { code, status } = await request.json();
    if (!code || !status) {
      return json({ success: false, error: 'code and status are required' }, { status: 400 });
    }

    const updated = await updateSessionStatus(code, status);
    if (!updated) {
      return json({ success: false, error: 'Session not found' }, { status: 404 });
    }
    return json({ success: true, session: updated });
  } catch (error: any) {
    console.error('Failed to update session status', error);
    return json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
};
