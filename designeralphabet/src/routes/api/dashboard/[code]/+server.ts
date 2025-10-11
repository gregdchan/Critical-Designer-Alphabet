import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ params }) => {
	const { code } = params;

	if (!code) {
		return json({ success: false, error: 'Session code is required' }, { status: 400 });
	}

	try {
		// Get session details
		const { data: session, error: sessionError } = await supabaseAdmin
			.from('sessions')
			.select('*')
			.eq('code', code.toUpperCase())
			.single();

		if (sessionError) {
			throw new Error(sessionError.message);
		}

		if (!session) {
			return json({ success: false, error: 'Session not found' }, { status: 404 });
		}

		// Get participants
		const { data: participants, error: participantsError } = await supabaseAdmin
			.from('participants')
			.select('*')
			.eq('room_code', code.toUpperCase())
			.order('created_at', { ascending: true });

		if (participantsError) {
			throw new Error(participantsError.message);
		}

		// Get questions
		const { data: questions, error: questionsError } = await supabaseAdmin
			.from('questions')
			.select('*')
			.eq('room_code', code.toUpperCase())
			.order('order_index', { ascending: true });

		if (questionsError) {
			throw new Error(questionsError.message);
		}

		// Get responses
		const { data: responses, error: responsesError } = await supabaseAdmin
			.from('responses')
			.select(
				`
				id,
				participant_id,
				question_id,
				text,
				cards,
				votes,
				created_at,
				questions!inner(section, text, lens, response_type, map_type)
			`
			)
			.eq('room_code', code.toUpperCase())
			.order('created_at', { ascending: true });

		if (responsesError) {
			throw new Error(responsesError.message);
		}

		// Get timeline entries
		const { data: timeline, error: timelineError } = await supabaseAdmin
			.from('timeline')
			.select('*')
			.eq('room_code', code.toUpperCase())
			.order('created_at', { ascending: true });

		if (timelineError) {
			throw new Error(timelineError.message);
		}

		// Get chat messages
		const { data: chat, error: chatError } = await supabaseAdmin
			.from('chat')
			.select('*')
			.eq('room_code', code.toUpperCase())
			.order('created_at', { ascending: true });

		if (chatError) {
			throw new Error(chatError.message);
		}

		// Transform responses to include both snake_case and camelCase for compatibility
		const transformedResponses =
			responses?.map((response) => {
				const participant = participants?.find((p) => p.id === response.participant_id);
				// Handle the joined questions data - it's an object, not an array
				const question = Array.isArray(response.questions)
					? response.questions[0]
					: response.questions;
				// Robustly coerce votes to a number: supports numeric, numeric string, or array length
				const rawVotes: any = (response as any).votes;
				const voteCount = Array.isArray(rawVotes)
					? rawVotes.length
					: (Number(rawVotes) && Number.isFinite(Number(rawVotes)) ? Number(rawVotes) : 0);
				const responseLength = response.text?.length || 0;

				// Calculate meaningful metrics instead of random values
				const impact = Math.min(10, Math.max(1, voteCount * 2 + 1)); // Based on votes (1-10)
				const effort = Math.min(10, Math.max(1, responseLength / 20 + 1)); // Based on response length (1-10)
				const urgency = Math.min(10, Math.max(1, Math.random() * 8 + 1)); // Random but valid (1-9)
				const feasibility = Math.min(10, Math.max(1, 10 - effort + Math.random() * 2)); // Inverse of effort with variance (1-10)

				return {
					id: response.id,
					room_code: code.toUpperCase(),
					question_id: response.question_id,
					participant_id: response.participant_id, // snake_case for gamification.ts
					participantId: response.participant_id, // camelCase for existing code compatibility
					participantName: participant?.name || 'Anonymous',
					text: response.text || '',
					lens: question?.section || 'Unknown',
					type: question?.response_type || 'written',
					mapType: question?.map_type || 'responses',
					votes: voteCount,
					cards: Array.isArray(response.cards) ? response.cards : [],
					created_at: response.created_at, // snake_case for gamification.ts
					createdAt: response.created_at, // camelCase for existing code compatibility
					metadata: null,
					// Add fields needed for visualizations - ensure no NaN values
					impact: isNaN(impact) ? 5 : impact,
					effort: isNaN(effort) ? 5 : effort,
					urgency: isNaN(urgency) ? 5 : urgency,
					feasibility: isNaN(feasibility) ? 5 : feasibility,
					// Include questions data for badge calculations
					questions: question
				};
			}) || [];

		// Don't calculate scores in API - let dashboard use gamification.ts for consistent scoring
		// Return raw participants so getLeaderboard() can calculate accurate scores with badges

		// Transform timeline for better display
		const transformedTimeline =
			timeline?.map((entry) => ({
				id: entry.id,
				type: entry.category || 'event',
				timestamp: entry.created_at,
				description: entry.text || entry.category || 'Timeline event',
				owner: entry.owner || 'System',
				label: entry.label || 'Now'
			})) || [];

		return json({
			success: true,
			session: {
				code: session.code,
				name: session.title || `Session ${session.code}`,
				status: session.status,
				template: session.template_slug || 'Unknown Template',
				facilitator: session.facilitator_email || 'Unknown',
				challenge: session.challenge,
				createdAt: session.created_at
			},
			participants: participants || [],
			responses: transformedResponses,
			timeline: transformedTimeline,
			questions: questions || [],
			chat: chat || []
		});
	} catch (error: any) {
		console.error(`Failed to load session data for ${code}:`, error);
		return json(
			{
				success: false,
				error: error?.message ?? 'Internal server error'
			},
			{ status: 500 }
		);
	}
};
