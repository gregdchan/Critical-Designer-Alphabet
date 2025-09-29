import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addParticipant } from '$lib/server/workshop';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { code, name, role, color } = await request.json();
    if (!code || !name || !role || !color) {
      return json({ success: false, error: 'code, name, role, and color are required' }, { status: 400 });
    }

    const participant = await addParticipant({ code, name, role, color });
    return json({ success: true, participant });
  } catch (error: any) {
    console.error('Failed to add participant', error);
    return json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
};
