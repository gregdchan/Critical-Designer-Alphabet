import { json } from '@sveltejs/kit';
import { query } from '$lib/database.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { code, title, templateId } = await request.json();

    if (!code || !title) {
      return json({ error: 'Missing required fields: code and title' }, { status: 400 });
    }

    // Check if session code already exists
    const existingSession = await query(
      'SELECT code FROM sessions WHERE code = ?',
      [code]
    );

    if (existingSession.length > 0) {
      return json({ error: 'Session code already exists' }, { status: 409 });
    }

    // Create new session
    await query(
      'INSERT INTO sessions (code, title, template_id) VALUES (?, ?, ?)',
      [code, title, templateId || null]
    );

    return json({
      success: true,
      session: { code, title, templateId, status: 'planned' }
    });

  } catch (error) {
    console.error('Error creating session:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};