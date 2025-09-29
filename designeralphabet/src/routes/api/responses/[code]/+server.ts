import { json } from '@sveltejs/kit';
import { query } from '$lib/database.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { code } = params;

    if (!code) {
      return json({ error: 'Session code is required' }, { status: 400 });
    }

    // Get all responses for the session
    const responses = await query(
      'SELECT id, lens, type, text, cards, author, votes, created_at FROM responses WHERE room_code = ? ORDER BY created_at DESC',
      [code]
    );

    // Parse cards JSON for each response
    const formattedResponses = responses.map((response: any) => ({
      ...response,
      cards: response.cards ? JSON.parse(response.cards) : []
    }));

    return json({
      success: true,
      responses: formattedResponses
    });

  } catch (error) {
    console.error('Error fetching responses:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};