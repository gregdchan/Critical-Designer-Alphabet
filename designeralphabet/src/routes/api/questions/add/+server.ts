import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addQuestion } from '$lib/server/workshop';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { code, section, text } = await request.json();
    if (!code || !section || !text) {
      return json({ success: false, error: 'code, section, and text are required' }, { status: 400 });
    }

    const question = await addQuestion({ code, section, text });
    return json({ success: true, question });
  } catch (error: any) {
    console.error('Failed to add question', error);
    return json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
};
