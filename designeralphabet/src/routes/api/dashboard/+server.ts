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
		let totalIdeas = 0; // written entries only
		let totalSharedValues = 0; // written ideas with votes >= 1
		let activeSessions = 0;

		const sessionsWithCounts = await Promise.all(
			(sessions || []).map(async (session) => {
				// Get participant count
				const { count: participantCount } = await supabaseAdmin
					.from('participants')
					.select('*', { count: 'exact', head: true })
					.eq('room_code', session.code);

				// Get written idea count (responses joined to questions filtered to written/text)
				const { count: ideaCount } = await supabaseAdmin
					.from('responses')
					.select('id, questions!inner(response_type)', { count: 'exact', head: true })
					.eq('room_code', session.code)
					.in('questions.response_type', ['written', 'text']);

				// Get question count
				const { count: questionCount } = await supabaseAdmin
					.from('questions')
					.select('*', { count: 'exact', head: true })
					.eq('room_code', session.code);

				// Count shared values (written ideas with 1+ votes)
				const { count: sharedWritten } = await supabaseAdmin
					.from('responses')
					.select('id, questions!inner(response_type)', { count: 'exact', head: true })
					.eq('room_code', session.code)
					.in('questions.response_type', ['written', 'text'])
					.gte('votes', 1);

				// Count shared values for multiple-choice responses where the same selection
				// was chosen by 2 or more participants within the same question.
				const { data: choiceRows, error: choiceErr } = await supabaseAdmin
					.from('responses')
					.select('question_id, text, questions!inner(response_type)')
					.eq('room_code', session.code)
					.in('questions.response_type', ['singleChoice', 'multiSelect', 'multiple_choice', 'multiselect']);

				if (choiceErr) throw new Error(choiceErr.message);

				let sharedChoices = 0;
				if (Array.isArray(choiceRows) && choiceRows.length > 0) {
					const counts = new Map<string, number>();
					for (const row of choiceRows) {
						const text = (row as any).text || '';
						const qid = (row as any).question_id || '';
						// Split by semicolon first, else by comma
						let choices: string[] = [];
						if (text.includes(';')) {
							choices = text
								.split(';')
								.map((s) => s.trim())
								.filter((s) => s.length > 0);
						} else if (text.includes(',')) {
							choices = text
								.split(',')
								.map((s) => s.trim())
								.filter((s) => s.length > 0);
						} else if (text.trim().length > 0) {
							choices = [text.trim()];
						}

						for (const c of choices) {
							// Normalize choice for grouping (case-insensitive, trimmed)
							const norm = c.toLowerCase();
							const key = JSON.stringify([qid, norm]);
							counts.set(key, (counts.get(key) || 0) + 1);
						}
					}
					sharedChoices = Array.from(counts.values()).filter((n) => n >= 2).length;
				}

				const sharedCount = (sharedWritten || 0) + sharedChoices;

				totalParticipants += participantCount || 0;
				totalIdeas += ideaCount || 0;
				totalSharedValues += sharedCount || 0;

				if (session.status === 'live') {
					activeSessions++;
				}

				return {
					code: session.code,
					name: session.title || `Session ${session.code}`,
					status: session.status,
					createdAt: session.created_at,
					participantCount: participantCount || 0,
					ideaCount: ideaCount || 0,
					questionCount: questionCount || 0,
					sharedCount: sharedCount || 0,
					template: session.template_slug || 'Unknown Template',
					facilitator: session.facilitator_email || 'Unknown',
					challenge: session.challenge
				};
			})
		);

		const avgEngagement =
			sessionsWithCounts.length > 0
				? Math.round((totalIdeas / Math.max(totalParticipants, 1)) * 10) / 10
				: 0;

		const dashboardMetrics = {
			totalSessions: sessionsWithCounts.length,
			totalParticipants,
			totalIdeas: totalIdeas,
			avgEngagement,
			activeSessions,
			sharedValues: totalSharedValues
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
						activeSessions: 0,
						sharedValues: 0
					}
				},
			{ status: 500 }
		);
	}
};
