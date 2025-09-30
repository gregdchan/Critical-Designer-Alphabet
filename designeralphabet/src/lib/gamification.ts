export interface Badge {
	id: string;
	name: string;
	description: string;
	icon: string;
	color: string;
	requirement: (participant: any, responses: any[], timeline: any[]) => boolean;
	points: number;
}

export interface Achievement {
	id: string;
	participantId: string;
	badgeId: string;
	earnedAt: string;
	sessionCode: string;
}

export const BADGES: Badge[] = [
	{
		id: 'first-contributor',
		name: 'First Steps',
		description: 'Made your first contribution to the session',
		icon: '🌱',
		color: '#10b981',
		requirement: (participant, responses) =>
			responses.filter((r) => r.participantId === participant.id).length >= 1,
		points: 10
	},
	{
		id: 'prolific-contributor',
		name: 'Prolific Contributor',
		description: 'Added 5 or more ideas to the session',
		icon: '💡',
		color: '#f59e0b',
		requirement: (participant, responses) =>
			responses.filter((r) => r.participantId === participant.id).length >= 5,
		points: 25
	},
	{
		id: 'community-champion',
		name: 'Community Champion',
		description: "Voted on 10 or more other participants' ideas",
		icon: '🤝',
		color: '#3b82f6',
		requirement: (participant, responses) =>
			responses.filter((r) => r.votes?.some((v: any) => v.participantId === participant.id))
				.length >= 10,
		points: 20
	},
	{
		id: 'lens-explorer',
		name: 'Lens Explorer',
		description: 'Contributed ideas across 3 different critical design lenses',
		icon: '🔍',
		color: '#8b5cf6',
		requirement: (participant, responses) => {
			const userResponses = responses.filter((r) => r.participantId === participant.id);
			const uniqueLenses = new Set(userResponses.map((r) => r.lens));
			return uniqueLenses.size >= 3;
		},
		points: 30
	},
	{
		id: 'engagement-champion',
		name: 'Engagement Champion',
		description: 'Received 10 or more votes on your contributions',
		icon: '🌟',
		color: '#ec4899',
		requirement: (participant, responses) => {
			const userResponses = responses.filter((r) => r.participantId === participant.id);
			const totalVotes = userResponses.reduce((sum, r) => sum + (r.votes?.length || 0), 0);
			return totalVotes >= 10;
		},
		points: 35
	},
	{
		id: 'early-bird',
		name: 'Early Bird',
		description: 'First to contribute after session start',
		icon: '🐦',
		color: '#06b6d4',
		requirement: (participant, responses, timeline) => {
			const sessionStart = timeline.find((t) => t.type === 'session_started');
			if (!sessionStart) return false;
			const firstResponse = responses
				.filter((r) => new Date(r.createdAt) > new Date(sessionStart.timestamp))
				.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
			return firstResponse?.participantId === participant.id;
		},
		points: 15
	},
	{
		id: 'justice-advocate',
		name: 'Justice Advocate',
		description: 'Consistently used the "Justice" lens in contributions',
		icon: '⚖️',
		color: '#ef4444',
		requirement: (participant, responses) => {
			const userResponses = responses.filter((r) => r.participantId === participant.id);
			const justiceResponses = userResponses.filter((r) => r.lens === 'Justice');
			return justiceResponses.length >= 3 && userResponses.length >= 5;
		},
		points: 40
	},
	{
		id: 'collaboration-catalyst',
		name: 'Collaboration Catalyst',
		description: "Referenced or built upon others' ideas in your contributions",
		icon: '🤲',
		color: '#84cc16',
		requirement: (participant, responses) => {
			// This would require analyzing text content for references
			// For now, simplified to participants who both contribute and vote heavily
			const userResponses = responses.filter((r) => r.participantId === participant.id);
			const votesGiven = responses.filter((r) =>
				r.votes?.some((v: any) => v.participantId === participant.id)
			).length;
			return userResponses.length >= 3 && votesGiven >= 5;
		},
		points: 30
	}
];

export function calculateParticipantScore(
	participant: any,
	responses: any[],
	timeline: any[]
): number {
	let totalScore = 0;

	// Base points for participation
	totalScore += 5; // Joining the session

	// Points per contribution
	const userResponses = responses.filter((r) => r.participantId === participant.id);
	totalScore += userResponses.length * 2; // 2 points per idea

	// Points per vote received
	const votesReceived = userResponses.reduce((sum, r) => sum + (r.votes?.length || 0), 0);
	totalScore += votesReceived * 1; // 1 point per vote received

	// Badge bonuses
	const earnedBadges = getEarnedBadges(participant, responses, timeline);
	totalScore += earnedBadges.reduce((sum, badge) => sum + badge.points, 0);

	return totalScore;
}

export function getEarnedBadges(participant: any, responses: any[], timeline: any[]): Badge[] {
	return BADGES.filter((badge) => badge.requirement(participant, responses, timeline));
}

export function getLeaderboard(participants: any[], responses: any[], timeline: any[]) {
	return participants
		.map((participant) => ({
			...participant,
			score: calculateParticipantScore(participant, responses, timeline),
			badges: getEarnedBadges(participant, responses, timeline),
			contributionCount: responses.filter((r) => r.participantId === participant.id).length,
			votesReceived: responses
				.filter((r) => r.participantId === participant.id)
				.reduce((sum, r) => sum + (r.votes?.length || 0), 0)
		}))
		.sort((a, b) => b.score - a.score);
}

export function getNewlyEarnedBadges(
	participant: any,
	responses: any[],
	timeline: any[],
	previousBadgeIds: string[] = []
): Badge[] {
	const currentBadges = getEarnedBadges(participant, responses, timeline);
	return currentBadges.filter((badge) => !previousBadgeIds.includes(badge.id));
}
