import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { voteResponse } from '$lib/server/workshop';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { responseId, delta } = await request.json();
    if (!responseId) {
      return json({ success: false, error: 'responseId is required' }, { status: 400 });
    }

    const result = await voteResponse({ responseId: String(responseId), delta: Number(delta ?? 0) });
    if (!result) {
      return json({ success: false, error: 'Response not found' }, { status: 404 });
    }
    return json({ success: true, ...result });
  } catch (error: any) {
    console.error('Failed to update vote', error);
    return json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
};
