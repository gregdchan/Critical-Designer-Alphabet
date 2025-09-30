import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addParticipant, getSession } from '$lib/server/workshop';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { code, email, color, name } = await request.json();
    if (!code || !email) {
      return json({ success: false, error: 'code and email are required' }, { status: 400 });
    }

    const session = await getSession(code);
    if (!session) {
      return json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    if (!session.facilitator_email || session.facilitator_email.toLowerCase() !== String(email).toLowerCase()) {
      return json({ success: false, error: 'Email does not match facilitator on file' }, { status: 403 });
    }

    const participant = await addParticipant({
      code,
      name: name ?? email,
      role: 'facilitator',
      color: color ?? '#ff00ff'
    });

    return json({ success: true, participant });
  } catch (error: any) {
    console.error('Failed facilitator login', error);
    return json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
};
