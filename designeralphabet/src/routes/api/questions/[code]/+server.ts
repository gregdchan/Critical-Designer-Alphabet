import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getQuestions } from '$lib/server/workshop';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const questions = await getQuestions(params.code);
    return json({ success: true, questions });
  } catch (error: any) {
    console.error('Failed to load questions', error);
    return json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
};
