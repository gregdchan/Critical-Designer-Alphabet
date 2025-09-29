import { json } from '@sveltejs/kit';
import { query } from '$lib/database.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { participantId, delta, badge } = await request.json();

    if (!participantId || delta === undefined) {
      return json({ error: 'Missing required fields: participantId and delta' }, { status: 400 });
    }

    // Check if participant exists
    const participant = await query(
      'SELECT id, points, badges FROM participants WHERE id = ?',
      [participantId]
    );

    if (participant.length === 0) {
      return json({ error: 'Participant not found' }, { status: 404 });
    }

    const currentBadges = participant[0].badges ? JSON.parse(participant[0].badges) : [];

    // Update points
    const newPoints = Math.max(0, participant[0].points + delta);

    // Add badge if provided and not already earned
    let updatedBadges = currentBadges;
    if (badge && !currentBadges.includes(badge)) {
      updatedBadges = [...currentBadges, badge];
    }

    await query(
      'UPDATE participants SET points = ?, badges = ? WHERE id = ?',
      [newPoints, JSON.stringify(updatedBadges), participantId]
    );

    return json({
      success: true,
      participant: {
        id: participantId,
        points: newPoints,
        badges: updatedBadges,
        pointsChanged: delta,
        badgeEarned: badge && !currentBadges.includes(badge) ? badge : null
      }
    });

  } catch (error) {
    console.error('Error updating score:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};