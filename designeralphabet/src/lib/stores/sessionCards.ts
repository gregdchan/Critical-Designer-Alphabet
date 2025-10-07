import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Card } from '$lib/Cards';

const STORAGE_KEY_PREFIX = 'cda:session-cards:';

export interface SessionCardStore {
	selectedCards: Card[];
	isCardPanelOpen: boolean;
}

function createSessionCardStore(sessionCode: string) {
	const storageKey = `${STORAGE_KEY_PREFIX}${sessionCode}`;

	// Load from localStorage
	const initialData: SessionCardStore =
		browser && localStorage.getItem(storageKey)
			? JSON.parse(localStorage.getItem(storageKey) || '{}')
			: { selectedCards: [], isCardPanelOpen: false };

	const { subscribe, set, update } = writable<SessionCardStore>(initialData);

	// Auto-save to localStorage
	if (browser) {
		subscribe((value) => {
			localStorage.setItem(storageKey, JSON.stringify(value));
		});
	}

	return {
		subscribe,
		toggleCard: (card: Card, maxSelection = 5) => {
			update((store) => {
				const index = store.selectedCards.findIndex((c) => c._id === card._id);
				if (index >= 0) {
					// Remove card
					store.selectedCards = store.selectedCards.filter((c) => c._id !== card._id);
				} else if (store.selectedCards.length < maxSelection) {
					// Add card
					store.selectedCards = [...store.selectedCards, card];
				}
				return store;
			});
		},
		addCard: (card: Card, maxSelection = 5) => {
			update((store) => {
				const exists = store.selectedCards.some((c) => c._id === card._id);
				if (!exists && store.selectedCards.length < maxSelection) {
					store.selectedCards = [...store.selectedCards, card];
				}
				return store;
			});
		},
		removeCard: (cardId: string) => {
			update((store) => {
				store.selectedCards = store.selectedCards.filter((c) => c._id !== cardId);
				return store;
			});
		},
		clearCards: () => {
			update((store) => {
				store.selectedCards = [];
				return store;
			});
		},
		setCardPanelOpen: (isOpen: boolean) => {
			update((store) => {
				store.isCardPanelOpen = isOpen;
				return store;
			});
		},
		toggleCardPanel: () => {
			update((store) => {
				store.isCardPanelOpen = !store.isCardPanelOpen;
				return store;
			});
		},
		getCardNames: () => {
			let cardNames: string[] = [];
			update((store) => {
				cardNames = store.selectedCards.map((c) => c.title || c.letter || 'Unknown');
				return store;
			});
			return cardNames;
		},
		reset: () => {
			set({ selectedCards: [], isCardPanelOpen: false });
			if (browser) {
				localStorage.removeItem(storageKey);
			}
		}
	};
}

export { createSessionCardStore };
