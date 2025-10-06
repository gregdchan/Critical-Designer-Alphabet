import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
	try {
		// Get session overview data
		const { data: sessions, error: sessionsError } = await supabaseAdmin
			.from('sessions')
			.select(
				`
				code,
				title,
				status,
				created_at,
				facilitator_email,
				challenge,
				template_slug
			`
			)
			.order('created_at', { ascending: false })
			.limit(50);

		if (sessionsError) {
			throw new Error(sessionsError.message);
		}

		// Calculate aggregated metrics by getting counts for each session
		let totalParticipants = 0;
		let totalResponses = 0;
		let activeSessions = 0;

		const sessionsWithCounts = await Promise.all(
			(sessions || []).map(async (session) => {
				// Get participant count
				const { count: participantCount } = await supabaseAdmin
					.from('participants')
					.select('*', { count: 'exact', head: true })
					.eq('room_code', session.code);

				// Get response count
				const { count: responseCount } = await supabaseAdmin
					.from('responses')
					.select('*', { count: 'exact', head: true })
					.eq('room_code', session.code);

				// Get question count
				const { count: questionCount } = await supabaseAdmin
					.from('questions')
					.select('*', { count: 'exact', head: true })
					.eq('room_code', session.code);

				totalParticipants += participantCount || 0;
				totalResponses += responseCount || 0;

				if (session.status === 'live') {
					activeSessions++;
				}

				return {
					code: session.code,
					name: session.title || `Session ${session.code}`,
					status: session.status,
					createdAt: session.created_at,
					participantCount: participantCount || 0,
					responseCount: responseCount || 0,
					questionCount: questionCount || 0,
					template: session.template_slug || 'Unknown Template',
					facilitator: session.facilitator_email || 'Unknown',
					challenge: session.challenge
				};
			})
		);

		const avgEngagement =
			sessionsWithCounts.length > 0
				? Math.round((totalResponses / Math.max(totalParticipants, 1)) * 10) / 10
				: 0;

		const dashboardMetrics = {
			totalSessions: sessionsWithCounts.length,
			totalParticipants,
			totalIdeas: totalResponses,
			avgEngagement,
			activeSessions
		};

		return json({
			success: true,
			sessions: sessionsWithCounts,
			metrics: dashboardMetrics
		});
	} catch (error: any) {
		console.error('Failed to load dashboard data:', error);
		return json(
			{
				success: false,
				error: error?.message ?? 'Internal server error',
				sessions: [],
				metrics: {
					totalSessions: 0,
					totalParticipants: 0,
					totalIdeas: 0,
					avgEngagement: 0,
					activeSessions: 0
				}
			},
			{ status: 500 }
		);
	}
};
