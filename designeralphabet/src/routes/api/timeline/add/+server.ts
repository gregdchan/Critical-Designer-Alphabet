import { json } from '@sveltejs/kit';
import { query } from '$lib/database.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { code, label, itemText, owner, metric, riskNote } = await request.json();

    if (!code || !label || !itemText) {
      return json({ error: 'Missing required fields: code, label, itemText' }, { status: 400 });
    }

    // Validate label
    if (!['Now', 'Next', 'Later'].includes(label)) {
      return json({ error: 'Invalid label. Must be Now, Next, or Later' }, { status: 400 });
    }

    // Check if session exists
    const session = await query(
      'SELECT code FROM sessions WHERE code = ?',
      [code]
    );

    if (session.length === 0) {
      return json({ error: 'Session not found' }, { status: 404 });
    }

    // Add timeline item
    const result = await query(
      'INSERT INTO timeline (room_code, label, item_text, owner, metric, risk_note) VALUES (?, ?, ?, ?, ?, ?)',
      [code, label, itemText, owner || null, metric || null, riskNote || null]
    );

    const timelineId = result.insertId;

    return json({
      success: true,
      timeline: {
        id: timelineId,
        room_code: code,
        label,
        item_text: itemText,
        owner,
        metric,
        risk_note: riskNote
      }
    });

  } catch (error) {
    console.error('Error adding timeline item:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};