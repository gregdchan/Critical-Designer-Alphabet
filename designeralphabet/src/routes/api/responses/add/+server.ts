import { json } from '@sveltejs/kit';
import { query } from '$lib/database.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { code, lens, type, text, cards, author } = await request.json();

    if (!code || !lens || !type || !text || !author) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate type
    if (!['usecase', 'concern', 'goal', 'metric'].includes(type)) {
      return json({ error: 'Invalid type. Must be usecase, concern, goal, or metric' }, { status: 400 });
    }

    // Check if session exists
    const session = await query(
      'SELECT code FROM sessions WHERE code = ?',
      [code]
    );

    if (session.length === 0) {
      return json({ error: 'Session not found' }, { status: 404 });
    }

    // Add response
    const result = await query(
      'INSERT INTO responses (room_code, lens, type, text, cards, author) VALUES (?, ?, ?, ?, ?, ?)',
      [code, lens, type, text, JSON.stringify(cards || []), author]
    );

    const responseId = result.insertId;

    // Award points to participant
    const cardBonus = (cards && cards.length >= 2) ? 3 : 0; // Bonus for linking 2+ cards
    const basePoints = 2; // Base points for idea
    const totalPoints = basePoints + cardBonus;

    await query(
      'UPDATE participants SET points = points + ? WHERE room_code = ? AND name = ?',
      [totalPoints, code, author]
    );

    return json({
      success: true,
      response: {
        id: responseId,
        room_code: code,
        lens,
        type,
        text,
        cards: cards || [],
        author,
        votes: 0,
        pointsAwarded: totalPoints
      }
    });

  } catch (error) {
    console.error('Error adding response:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};