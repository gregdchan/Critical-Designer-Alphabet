import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getChat } from '$lib/server/workshop';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const chat = await getChat(params.code);
    return json({ success: true, chat });
  } catch (error: any) {
    console.error('Failed to load chat history', error);
    return json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
};
