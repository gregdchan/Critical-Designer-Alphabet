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
			.eq('session_code', code.toUpperCase())
			.order('created_at', { ascending: true });

		if (participantsError) {
			throw new Error(participantsError.message);
		}

		// Get questions
		const { data: questions, error: questionsError } = await supabaseAdmin
			.from('questions')
			.select('*')
			.eq('session_code', code.toUpperCase())
			.order('order_index', { ascending: true });

		if (questionsError) {
			throw new Error(questionsError.message);
		}

		// Get responses
		const { data: responses, error: responsesError } = await supabaseAdmin
			.from('responses')
			.select(`
				id,
				participant_id,
				question_id,
				text,
				cards,
				votes,
				created_at,
				questions!inner(section, text, lens, response_type, map_type)
			`)
			.eq('session_code', code.toUpperCase())
			.order('created_at', { ascending: true });

		if (responsesError) {
			throw new Error(responsesError.message);
		}

		// Get timeline entries
		const { data: timeline, error: timelineError } = await supabaseAdmin
			.from('timeline')
			.select('*')
			.eq('session_code', code.toUpperCase())
			.order('created_at', { ascending: true });

		if (timelineError) {
			throw new Error(timelineError.message);
		}

		// Get chat messages
		const { data: chat, error: chatError } = await supabaseAdmin
			.from('chat')
			.select('*')
			.eq('session_code', code.toUpperCase())
			.order('created_at', { ascending: true });

		if (chatError) {
			throw new Error(chatError.message);
		}

		// Transform responses for visualization
		const transformedResponses = responses?.map(response => {
			const participant = participants?.find(p => p.id === response.participant_id);
			const question = response.questions;

			return {
				id: response.id,
				participantId: response.participant_id,
				participantName: participant?.name || 'Anonymous',
				text: response.text,
				lens: question?.section || 'Unknown',
				type: question?.response_type || 'written',
				mapType: question?.map_type || 'responses',
				votes: Array.isArray(response.votes) ? response.votes : [],
				cards: Array.isArray(response.cards) ? response.cards : [],
				createdAt: response.created_at,
				// Add fields needed for visualizations
				impact: Math.random() * 10, // TODO: Calculate based on votes/engagement
				effort: Math.random() * 10, // TODO: Calculate from response complexity
				urgency: Math.random() * 10, // TODO: Calculate from timeline placement
				feasibility: Math.random() * 10 // TODO: Calculate from participant feedback
			};
		}) || [];

		// Create participant leaderboard data
		const participantStats = participants?.map(participant => {
			const participantResponses = responses?.filter(r => r.participant_id === participant.id) || [];
			const totalVotes = participantResponses.reduce((sum, r) => {
				const voteCount = Array.isArray(r.votes) ? r.votes.length : 0;
				return sum + voteCount;
			}, 0);

			const participantTimeline = timeline?.filter(t => t.owner === participant.name) || [];
			const participantChat = chat?.filter(c => c.participant_id === participant.id) || [];

			// Calculate engagement score
			const responseScore = participantResponses.length * 10;
			const voteScore = totalVotes * 2;
			const timelineScore = participantTimeline.length * 15;
			const chatScore = participantChat.length * 5;
			const pointsScore = participant.points || 0;

			const totalScore = responseScore + voteScore + timelineScore + chatScore + pointsScore;

			return {
				id: participant.id,
				name: participant.name,
				role: participant.role,
				avatarColor: participant.color,
				joinedAt: participant.created_at,
				contributionCount: participantResponses.length,
				votesReceived: totalVotes,
				timelineEntries: participantTimeline.length,
				chatMessages: participantChat.length,
				points: participant.points || 0,
				score: totalScore,
				badges: participant.badges || [],
				// Calculate recent activity
				lastActivity: Math.max(
					...[
						...participantResponses.map(r => new Date(r.created_at).getTime()),
						...participantTimeline.map(t => new Date(t.created_at).getTime()),
						...participantChat.map(c => new Date(c.created_at).getTime())
					].filter(Boolean),
					new Date(participant.created_at).getTime()
				)
			};
		}).sort((a, b) => b.score - a.score) || [];

		// Transform timeline for better display
		const transformedTimeline = timeline?.map(entry => ({
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
			participants: participantStats,
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