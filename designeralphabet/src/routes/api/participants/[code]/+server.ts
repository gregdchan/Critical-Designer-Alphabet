import { json } from '@sveltejs/kit';
import { query } from '$lib/database.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { code } = params;

    if (!code) {
      return json({ error: 'Session code is required' }, { status: 400 });
    }

    // Get all participants for the session
    const participants = await query(
      'SELECT id, name, role, color, points, badges FROM participants WHERE room_code = ? ORDER BY created_at ASC',
      [code]
    );

    // Parse badges JSON for each participant
    const formattedParticipants = participants.map((participant: any) => ({
      ...participant,
      badges: participant.badges ? JSON.parse(participant.badges) : []
    }));

    return json({
      success: true,
      participants: formattedParticipants
    });

  } catch (error) {
    console.error('Error fetching participants:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};