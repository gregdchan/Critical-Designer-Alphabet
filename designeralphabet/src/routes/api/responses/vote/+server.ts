import { json } from '@sveltejs/kit';
import { query } from '$lib/database.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { responseId } = await request.json();

    if (!responseId) {
      return json({ error: 'Response ID is required' }, { status: 400 });
    }

    // Check if response exists and get author
    const response = await query(
      'SELECT id, author, room_code FROM responses WHERE id = ?',
      [responseId]
    );

    if (response.length === 0) {
      return json({ error: 'Response not found' }, { status: 404 });
    }

    const { author, room_code } = response[0];

    // Increment vote count
    await query(
      'UPDATE responses SET votes = votes + 1 WHERE id = ?',
      [responseId]
    );

    // Award point to response author for receiving a vote
    await query(
      'UPDATE participants SET points = points + 1 WHERE room_code = ? AND name = ?',
      [room_code, author]
    );

    return json({
      success: true,
      message: 'Vote recorded successfully'
    });

  } catch (error) {
    console.error('Error recording vote:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};