import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface CardUnlock {
	cardId: string;
	unlockedAt: string;
	unlockedBy: 'participation' | 'badge' | 'manual';
}

export interface CardUnlockRequirement {
	cardId: string;
	requiredPoints?: number;
	requiredBadges?: string[];
	requiredResponses?: number;
}

// Card unlock progression tiers
export const CARD_UNLOCK_TIERS: CardUnlockRequirement[] = [
	// Tier 1: Starter cards (always unlocked)
	// These would be the first 5-8 cards that are immediately available

	// Tier 2: Unlock at 50 points
	{ cardId: 'tier2', requiredPoints: 50 },

	// Tier 3: Unlock at 100 points
	{ cardId: 'tier3', requiredPoints: 100 },

	// Tier 4: Unlock with specific badges
	{
		cardId: 'tier4-quality',
		requiredBadges: ['thoughtful-contributor', 'deep-thinker']
	},

	// Tier 5: Unlock with card expertise
	{
		cardId: 'tier5-expert',
		requiredBadges: ['card-expert', 'pluriverse-champion'],
		requiredPoints: 150
	},

	// Tier 6: Unlock with community engagement
	{
		cardId: 'tier6-community',
		requiredResponses: 10,
		requiredPoints: 200
	}
];

function createCardUnlockStore(sessionCode: string) {
	const storageKey = `cda:card-unlocks:${sessionCode}`;

	// Initialize from localStorage
	let initialUnlocks: CardUnlock[] = [];
	if (browser) {
		const stored = localStorage.getItem(storageKey);
		if (stored) {
			try {
				initialUnlocks = JSON.parse(stored);
			} catch (e) {
				console.error('Failed to parse card unlocks:', e);
			}
		}
	}

	const { subscribe, set, update } = writable<CardUnlock[]>(initialUnlocks);

	// Auto-save to localStorage on changes
	if (browser) {
		subscribe((value) => {
			localStorage.setItem(storageKey, JSON.stringify(value));
		});
	}

	return {
		subscribe,
		unlockCard: (cardId: string, method: 'participation' | 'badge' | 'manual' = 'manual') => {
			update((unlocks) => {
				// Check if already unlocked
				if (unlocks.some((u) => u.cardId === cardId)) {
					return unlocks;
				}

				return [
					...unlocks,
					{
						cardId,
						unlockedAt: new Date().toISOString(),
						unlockedBy: method
					}
				];
			});
		},
		isUnlocked: (cardId: string, currentUnlocks: CardUnlock[]) => {
			return currentUnlocks.some((u) => u.cardId === cardId);
		},
		checkAndUnlock: (
			participantPoints: number,
			participantBadges: string[],
			participantResponses: number,
			currentUnlocks: CardUnlock[]
		) => {
			const toUnlock: string[] = [];

			CARD_UNLOCK_TIERS.forEach((req) => {
				// Skip if already unlocked
				if (currentUnlocks.some((u) => u.cardId === req.cardId)) {
					return;
				}

				let meetsRequirements = true;

				// Check point requirement
				if (req.requiredPoints !== undefined && participantPoints < req.requiredPoints) {
					meetsRequirements = false;
				}

				// Check badge requirements
				if (req.requiredBadges && req.requiredBadges.length > 0) {
					const hasBadges = req.requiredBadges.every((badgeId) =>
						participantBadges.includes(badgeId)
					);
					if (!hasBadges) {
						meetsRequirements = false;
					}
				}

				// Check response requirement
				if (req.requiredResponses !== undefined && participantResponses < req.requiredResponses) {
					meetsRequirements = false;
				}

				if (meetsRequirements) {
					toUnlock.push(req.cardId);
				}
			});

			// Unlock all eligible cards
			toUnlock.forEach((cardId) => {
				update((unlocks) => {
					if (unlocks.some((u) => u.cardId === cardId)) {
						return unlocks;
					}
					return [
						...unlocks,
						{
							cardId,
							unlockedAt: new Date().toISOString(),
							unlockedBy: 'participation'
						}
					];
				});
			});

			return toUnlock;
		},
		reset: () => set([]),
		clear: () => {
			set([]);
			if (browser) {
				localStorage.removeItem(storageKey);
			}
		}
	};
}

export function createSessionCardUnlockStore(sessionCode: string) {
	return createCardUnlockStore(sessionCode);
}
