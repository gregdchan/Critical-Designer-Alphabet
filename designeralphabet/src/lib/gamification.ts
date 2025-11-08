export interface Participant {
	id: string;
	room_code: string;
	name: string;
	role: 'facilitator' | 'participant';
	color: string;
	points: number;
	badges: string[];
	email?: string | null;
	device_id?: string | null;
	created_at: string;
}

export interface Vote {
	participantId: string;
	timestamp?: string;
}

export interface Response {
	id: string;
	room_code: string;
	question_id: string;
	participant_id: string | null;
	text: string;
	metadata: Record<string, unknown> | null;
	cards: string[];
	votes: number;
	created_at: string;
	// Populated from joins
	questions?: {
		lens: string | null;
		response_type: string | null;
		map_type: string | null;
	};
}

export interface TimelineEntry {
	id: string;
	room_code: string;
	label: 'Now' | 'Next' | 'Later';
	item_text: string;
	owner: string | null;
	metric: string | null;
	risk_note: string | null;
	created_at: string;
}

export interface Badge {
	id: string;
	name: string;
	description: string;
	icon: string;
	color: string;
	requirement: (
		participant: Participant,
		responses: Response[],
		timeline: TimelineEntry[]
	) => boolean;
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
			responses.filter((r) => r.participant_id === participant.id).length >= 1,
		points: 10
	},
	{
		id: 'prolific-contributor',
		name: 'Prolific Contributor',
		description: 'Added 5 or more ideas to the session',
		icon: '💡',
		color: '#f59e0b',
		requirement: (participant, responses) =>
			responses.filter((r) => r.participant_id === participant.id).length >= 5,
		points: 25
	},
	{
		id: 'community-champion',
		name: 'Community Champion',
		description: "Voted on 10 or more other participants' ideas",
		icon: '🤝',
		color: '#3b82f6',
		requirement: (participant, responses) =>
			// Note: votes is a number, not an array - this badge may need different logic
			responses.filter((r) => r.participant_id !== participant.id && (r.votes || 0) > 0).length >=
			10,
		points: 20
	},
	{
		id: 'lens-explorer',
		name: 'Lens Explorer',
		description: 'Contributed ideas across 3 different critical design lenses',
		icon: '🔍',
		color: '#8b5cf6',
		requirement: (participant, responses) => {
			const userResponses = responses.filter((r) => r.participant_id === participant.id);
			const uniqueLenses = new Set(userResponses.map((r) => r.questions?.lens).filter(Boolean));
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
			const userResponses = responses.filter((r) => r.participant_id === participant.id);
			const totalVotes = userResponses.reduce((sum, r) => sum + (r.votes || 0), 0);
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
			// Simplified: check if participant is among first 3 contributors
			const sortedResponses = [...responses].sort(
				(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
			);
			const firstThree = sortedResponses.slice(0, 3);
			return firstThree.some((r) => r.participant_id === participant.id);
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
			const userResponses = responses.filter((r) => r.participant_id === participant.id);
			const justiceResponses = userResponses.filter((r) => r.questions?.lens === 'Justice');
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
			// Simplified to participants who both contribute and engage with others
			const userResponses = responses.filter((r) => r.participant_id === participant.id);
			const othersWithVotes = responses.filter(
				(r) => r.participant_id !== participant.id && (r.votes || 0) > 0
			).length;
			return userResponses.length >= 3 && othersWithVotes >= 5;
		},
		points: 30
	},
	{
		id: 'card-curious',
		name: 'Card Curious',
		description: 'Viewed 5 different cards',
		icon: '📖',
		color: '#9333ea',
		requirement: (participant, responses) => {
			// Check if participant has used at least 5 unique cards
			const userResponses = responses.filter((r) => r.participant_id === participant.id);
			const uniqueCards = new Set(userResponses.flatMap((r) => r.cards || []));
			return uniqueCards.size >= 5;
		},
		points: 15
	},
	{
		id: 'card-scholar',
		name: 'Card Scholar',
		description: 'Referenced 10 cards in your responses',
		icon: '📚',
		color: '#7c3aed',
		requirement: (participant, responses) => {
			const userResponses = responses.filter((r) => r.participant_id === participant.id);
			const totalCards = userResponses.reduce((sum, r) => sum + (r.cards?.length || 0), 0);
			return totalCards >= 10;
		},
		points: 30
	},
	{
		id: 'card-expert',
		name: 'Card Expert',
		description: 'Mastered all cards in one category',
		icon: '🎓',
		color: '#6366f1',
		requirement: (participant, responses) => {
			// This is a simplified check - ideally would verify category coverage
			const userResponses = responses.filter((r) => r.participant_id === participant.id);
			const uniqueCards = new Set(userResponses.flatMap((r) => r.cards || []));
			// Assume 10+ cards from diverse sources indicates category mastery
			return uniqueCards.size >= 10 && userResponses.length >= 5;
		},
		points: 50
	},
	{
		id: 'pluriverse-champion',
		name: 'Pluriverse Champion',
		description: 'Used cards from all 5 categories',
		icon: '🌈',
		color: '#ec4899',
		requirement: (participant, responses) => {
			// Simplified: check for diverse card usage
			const userResponses = responses.filter((r) => r.participant_id === participant.id);
			const uniqueCards = new Set(userResponses.flatMap((r) => r.cards || []));
			// Assume 15+ unique cards indicates coverage across categories
			return uniqueCards.size >= 15;
		},
		points: 75
	},
	{
		id: 'theory-practice-bridge',
		name: 'Theory-Practice Bridge',
		description: 'Combined Theory and Practice cards in one response',
		icon: '🔬',
		color: '#10b981',
		requirement: (participant, responses) => {
			const userResponses = responses.filter((r) => r.participant_id === participant.id);
			// Check if any response has 2+ cards (indicating combination)
			return userResponses.some((r) => (r.cards?.length || 0) >= 2);
		},
		points: 25
	},
	// Phase 5: Quality-focused badges
	{
		id: 'thoughtful-contributor',
		name: 'Thoughtful Contributor',
		description: 'Consistently produce high-quality ideas that resonate with others',
		icon: '💎',
		color: '#a855f7',
		requirement: (participant, responses) => {
			const userResponses = responses.filter((r) => r.participant_id === participant.id);
			if (userResponses.length < 3) return false;
			const avgVotes = userResponses.reduce((sum, r) => sum + (r.votes || 0), 0) / userResponses.length;
			// Average 3+ votes per contribution
			return avgVotes >= 3;
		},
		points: 50
	},
	{
		id: 'deep-thinker',
		name: 'Deep Thinker',
		description: 'Provide detailed, substantive contributions with 200+ characters',
		icon: '🧠',
		color: '#0ea5e9',
		requirement: (participant, responses) => {
			const userResponses = responses.filter((r) => r.participant_id === participant.id);
			// At least 5 responses with 200+ characters each
			const detailedResponses = userResponses.filter((r) => r.text.length >= 200);
			return detailedResponses.length >= 5;
		},
		points: 40
	},
	{
		id: 'gem-finder',
		name: 'Gem Finder',
		description: 'Identify and amplify high-quality contributions from others',
		icon: '🔎',
		color: '#f97316',
		requirement: (participant, responses) => {
			// Find responses from others that this participant might have voted on
			// Since we track total votes, we'll approximate by checking if user is active in voting
			const userResponses = responses.filter((r) => r.participant_id === participant.id);
			const totalResponses = responses.filter((r) => r.participant_id !== participant.id);
			const highQualityOthers = totalResponses.filter((r) => (r.votes || 0) >= 5);
			// Active participant who contributes while others get voted up
			return userResponses.length >= 3 && highQualityOthers.length >= 5;
		},
		points: 35
	}
];

export function calculateParticipantScore(
	participant: Participant,
	responses: Response[],
	timeline: TimelineEntry[]
): number {
	let totalScore = 0;

	// Base points for participation
	totalScore += 5; // Joining the session

	// Points per contribution
	const userResponses = responses.filter((r) => r.participant_id === participant.id);
	totalScore += userResponses.length * 2; // 2 points per idea

	// Points per vote received
	const votesReceived = userResponses.reduce((sum, r) => sum + (r.votes || 0), 0);
	totalScore += votesReceived * 1; // 1 point per vote received

	// Badge bonuses
	const earnedBadges = getEarnedBadges(participant, responses, timeline);
	totalScore += earnedBadges.reduce((sum, badge) => sum + badge.points, 0);

	return totalScore;
}

export function getEarnedBadges(
	participant: Participant,
	responses: Response[],
	timeline: TimelineEntry[]
): Badge[] {
	return BADGES.filter((badge) => badge.requirement(participant, responses, timeline));
}

export function getLeaderboard(
	participants: Participant[],
	responses: Response[],
	timeline: TimelineEntry[]
) {
	return participants
		.map((participant) => ({
			...participant,
			score: calculateParticipantScore(participant, responses, timeline),
			badges: getEarnedBadges(participant, responses, timeline),
			contributionCount: responses.filter((r) => r.participant_id === participant.id).length,
			votesReceived: responses
				.filter((r) => r.participant_id === participant.id)
				.reduce((sum, r) => sum + (r.votes || 0), 0)
		}))
		.sort((a, b) => b.score - a.score);
}

export function getNewlyEarnedBadges(
	participant: Participant,
	responses: Response[],
	timeline: TimelineEntry[],
	previousBadgeIds: string[] = []
): Badge[] {
	const currentBadges = getEarnedBadges(participant, responses, timeline);
	return currentBadges.filter((badge) => !previousBadgeIds.includes(badge.id));
}

// Phase 5: Quality metrics
export function calculateQualityScore(participant: Participant, responses: Response[]): number {
	const userResponses = responses.filter((r) => r.participant_id === participant.id);
	if (userResponses.length === 0) return 0;

	// Calculate card diversity (unique cards used)
	const uniqueCards = new Set(userResponses.flatMap((r) => r.cards || []));
	const cardDiversity = uniqueCards.size;

	// Calculate total votes received
	const totalVotes = userResponses.reduce((sum, r) => sum + (r.votes || 0), 0);

	// Quality score = votes × card diversity multiplier
	// Higher diversity amplifies the value of votes
	const diversityMultiplier = 1 + cardDiversity * 0.1; // 10% bonus per unique card
	return Math.round(totalVotes * diversityMultiplier);
}

// Phase 5: Facilitator awards
export interface FacilitatorAward {
	id: string;
	name: string;
	description: string;
	icon: string;
	color: string;
	recipientId: string;
	recipientName: string;
	awardedBy: string;
	awardedAt: string;
	points: number;
}

export const FACILITATOR_AWARD_TYPES = [
	{
		id: 'most-inspiring',
		name: 'Most Inspiring',
		description: 'Sparked creative thinking in others',
		icon: '✨',
		color: '#fbbf24',
		points: 50
	},
	{
		id: 'best-question',
		name: 'Best Question Asker',
		description: 'Asked thought-provoking questions',
		icon: '❓',
		color: '#8b5cf6',
		points: 40
	},
	{
		id: 'team-player',
		name: 'Ultimate Team Player',
		description: 'Supported and elevated teammates',
		icon: '🤝',
		color: '#10b981',
		points: 45
	},
	{
		id: 'innovation-champion',
		name: 'Innovation Champion',
		description: 'Pushed boundaries with bold ideas',
		icon: '🚀',
		color: '#ec4899',
		points: 55
	},
	{
		id: 'bridge-builder',
		name: 'Bridge Builder',
		description: 'Connected diverse perspectives',
		icon: '🌉',
		color: '#06b6d4',
		points: 45
	}
];

export function awardFacilitatorBadge(
	recipientId: string,
	recipientName: string,
	awardTypeId: string,
	facilitatorName: string
): FacilitatorAward | null {
	const awardType = FACILITATOR_AWARD_TYPES.find((a) => a.id === awardTypeId);
	if (!awardType) return null;

	return {
		...awardType,
		recipientId,
		recipientName,
		awardedBy: facilitatorName,
		awardedAt: new Date().toISOString()
	};
}
