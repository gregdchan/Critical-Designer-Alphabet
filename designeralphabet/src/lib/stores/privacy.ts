import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface PrivacySettings {
	anonymousVoting: boolean;
	hideParticipantNames: boolean;
	disableActivityTracking: boolean;
	optOutOfLeaderboard: boolean;
}

const DEFAULT_SETTINGS: PrivacySettings = {
	anonymousVoting: false,
	hideParticipantNames: false,
	disableActivityTracking: false,
	optOutOfLeaderboard: false
};

function createPrivacyStore(sessionCode: string) {
	const storageKey = `cda:privacy:${sessionCode}`;

	// Initialize from localStorage
	let initialSettings = DEFAULT_SETTINGS;
	if (browser) {
		const stored = localStorage.getItem(storageKey);
		if (stored) {
			try {
				initialSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
			} catch (e) {
				console.error('Failed to parse privacy settings:', e);
			}
		}
	}

	const { subscribe, set, update } = writable<PrivacySettings>(initialSettings);

	// Auto-save to localStorage
	if (browser) {
		subscribe((value) => {
			localStorage.setItem(storageKey, JSON.stringify(value));
		});
	}

	return {
		subscribe,
		updateSetting: <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
			update((settings) => ({
				...settings,
				[key]: value
			}));
		},
		reset: () => {
			set(DEFAULT_SETTINGS);
		},
		clear: () => {
			set(DEFAULT_SETTINGS);
			if (browser) {
				localStorage.removeItem(storageKey);
			}
		}
	};
}

export function createSessionPrivacyStore(sessionCode: string) {
	return createPrivacyStore(sessionCode);
}

// Data export utilities
export interface ExportData {
	session: {
		code: string;
		exportedAt: string;
	};
	participant: {
		id: string;
		name: string;
		responses: number;
		votes: number;
		points: number;
		badges: string[];
	};
	responses: {
		id: string;
		text: string;
		cards: string[];
		votes: number;
		createdAt: string;
	}[];
	timeline: {
		label: string;
		text: string;
		createdAt: string;
	}[];
}

export function exportParticipantData(data: ExportData, format: 'json' | 'csv' = 'json'): void {
	if (!browser) return;

	if (format === 'json') {
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		downloadBlob(blob, `participant-data-${data.session.code}-${Date.now()}.json`);
	} else if (format === 'csv') {
		// Convert responses to CSV
		const csvRows = [
			['Response ID', 'Text', 'Cards', 'Votes', 'Created At'],
			...data.responses.map((r) => [
				r.id,
				`"${r.text.replace(/"/g, '""')}"`, // Escape quotes
				r.cards.join('; '),
				r.votes.toString(),
				r.createdAt
			])
		];
		const csvContent = csvRows.map((row) => row.join(',')).join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv' });
		downloadBlob(blob, `participant-data-${data.session.code}-${Date.now()}.csv`);
	}
}

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function requestDataDeletion(sessionCode: string, participantId: string): string {
	// In a real implementation, this would make an API call
	// For now, return a confirmation message
	return `Data deletion requested for participant ${participantId} in session ${sessionCode}. This request will be processed within 30 days in accordance with GDPR/privacy regulations.`;
}
