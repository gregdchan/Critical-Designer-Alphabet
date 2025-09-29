import { json } from '@sveltejs/kit';
import { query } from '$lib/database.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { code, name, role, color } = await request.json();

    if (!code || !name || !role || !color) {
      return json({ error: 'Missing required fields: code, name, role, color' }, { status: 400 });
    }

    // Validate role
    if (!['facilitator', 'participant'].includes(role)) {
      return json({ error: 'Invalid role. Must be facilitator or participant' }, { status: 400 });
    }

    // Check if session exists
    const session = await query(
      'SELECT code FROM sessions WHERE code = ?',
      [code]
    );

    if (session.length === 0) {
      return json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if facilitator already exists for this session
    if (role === 'facilitator') {
      const existingFacilitator = await query(
        'SELECT id FROM participants WHERE room_code = ? AND role = ?',
        [code, 'facilitator']
      );

      if (existingFacilitator.length > 0) {
        return json({ error: 'Facilitator already exists for this session' }, { status: 409 });
      }
    }

    // Add participant
    const result = await query(
      'INSERT INTO participants (room_code, name, role, color, badges) VALUES (?, ?, ?, ?, ?)',
      [code, name, role, color, JSON.stringify([])]
    );

    const participantId = result.insertId;

    return json({
      success: true,
      participant: {
        id: participantId,
        room_code: code,
        name,
        role,
        color,
        points: 0,
        badges: []
      }
    });

  } catch (error) {
    console.error('Error joining session:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};