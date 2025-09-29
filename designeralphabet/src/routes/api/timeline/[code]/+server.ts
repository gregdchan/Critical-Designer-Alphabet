import { json } from '@sveltejs/kit';
import { query } from '$lib/database.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { code } = params;

    if (!code) {
      return json({ error: 'Session code is required' }, { status: 400 });
    }

    // Get all timeline items for the session
    const timeline = await query(
      'SELECT id, label, item_text, owner, metric, risk_note, created_at FROM timeline WHERE room_code = ? ORDER BY created_at ASC',
      [code]
    );

    return json({
      success: true,
      timeline
    });

  } catch (error) {
    console.error('Error fetching timeline:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};