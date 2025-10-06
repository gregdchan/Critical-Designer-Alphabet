import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import { supabase } from './supabase';
import type { Participant, Response, TimelineEntry } from './gamification';

const SESSION_COOKIE = 'cda-session';
const SESSION_STORAGE_KEY = 'cda-session';
const PARTICIPANT_KEY_PREFIX = 'cda:participant:';

export interface Session {
	id: string;
	code: string;
	name: string;
	description?: string;
	status: string;
	created_at: string;
	updated_at: string;
}

export interface Question {
	id: string;
	section: string;
	text: string;
	lens: string;
	response_type: string;
	map_type: string;
}

export interface ChatMessage {
	id: string;
	session_code: string;
	participant_id: string;
	message: string;
	created_at: string;
}

export interface Phase {
	id: string;
	session_code: string;
	name: string;
	description?: string;
	status: string;
	started_at?: string;
	ended_at?: string;
}

export type SessionBundle = {
	session: Session;
	participants: Participant[];
	questions: Question[];
	responses: Response[];
	timeline: TimelineEntry[];
	chat: ChatMessage[];
	phases: Phase[];
};

const POLL_INTERVAL = 5000;

export const sessionDetails = writable<Session | null>(null);
export const participants = writable<Participant[]>([]);
export const questions = writable<Question[]>([]);
export const responses = writable<Response[]>([]);
export const timeline = writable<TimelineEntry[]>([]);
export const chat = writable<ChatMessage[]>([]);
export const phases = writable<Phase[]>([]);

let pollHandle: ReturnType<typeof setInterval> | null = null;
let activeCode: string | null = null;

async function fetchBundle(code: string) {
	try {
		const res = await fetch(`/api/session/${code}`);
		const data = await res.json();
		if (!data.success) return;
		sessionDetails.set(data.session);
		participants.set(data.participants ?? []);
		questions.set(data.questions ?? []);
		responses.set(data.responses ?? []);
		timeline.set(data.timeline ?? []);
		chat.set(data.chat ?? []);
		phases.set(data.phases ?? []);
	} catch (error) {
		console.error('Failed to load session bundle', error);
	}
}

export async function startRealtimeSession(code: string) {
	if (!browser) return;
	activeCode = code;
	stopRealtimeSession();
	await fetchBundle(code);
	pollHandle = setInterval(() => fetchBundle(code), POLL_INTERVAL);
}

export async function refreshSession(code: string) {
	if (!browser) return;
	await fetchBundle(code);
}

export function stopRealtimeSession() {
	if (pollHandle) {
		clearInterval(pollHandle);
		pollHandle = null;
	}
}

export async function addResponse(
	code: string,
	payload: { questionId: string; participantId: string | null; text: string; cards?: string[] }
) {
	try {
		const res = await fetch('/api/responses/add', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				code,
				...payload,
				questionId: payload.questionId,
				participantId: payload.participantId
			})
		});
		const data = await res.json();
		if (data.success) {
			await fetchBundle(code);
		}
		return data;
	} catch (error) {
		console.error('Error adding response', error);
		return { success: false, error: 'Failed to add response' };
	}
}

export async function voteResponse(responseId: string, delta = 1) {
	try {
		const res = await fetch('/api/responses/vote', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ responseId, delta })
		});
		return await res.json();
	} catch (error) {
		console.error('Error voting response', error);
		return { success: false, error: 'Failed to vote' };
	}
}

export async function addTimelineEntry(
	code: string,
	payload: {
		label: 'Now' | 'Next' | 'Later';
		itemText: string;
		owner?: string;
		metric?: string;
		riskNote?: string;
	}
) {
	try {
		const res = await fetch('/api/timeline/add', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code, ...payload })
		});
		const data = await res.json();
		if (data.success) {
			await fetchBundle(code);
		}
		return data;
	} catch (error) {
		console.error('Error adding timeline item', error);
		return { success: false, error: 'Failed to add timeline item' };
	}
}

export async function sendChatMessage(
	code: string,
	payload: { participantId: string | null; message: string }
) {
	try {
		const res = await fetch('/api/chat/send', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code, ...payload })
		});
		const data = await res.json();
		if (data.success) {
			await fetchBundle(code);
		}
		return data;
	} catch (error) {
		console.error('Error sending chat message', error);
		return { success: false, error: 'Failed to send chat message' };
	}
}

export const leaderboard = derived([participants], ([$participants]) =>
	[...$participants].sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
);

export async function startPhase(code: string, phaseKey: string) {
	try {
		const res = await fetch('/api/session/phase', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code, phaseKey, action: 'start' })
		});
		const data = await res.json();
		if (data.success) {
			await fetchBundle(code);
		}
		return data;
	} catch (error) {
		console.error('Failed to start phase', error);
		return { success: false, error: 'Failed to start phase' };
	}
}

export async function completePhase(code: string, phaseKey: string) {
	try {
		const res = await fetch('/api/session/phase', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code, phaseKey, action: 'complete' })
		});
		const data = await res.json();
		if (data.success) {
			await fetchBundle(code);
		}
		return data;
	} catch (error) {
		console.error('Failed to complete phase', error);
		return { success: false, error: 'Failed to complete phase' };
	}
}

export function channelFor(code: string) {
	return supabase.channel(`workshop:${code}`, {
		config: { broadcast: { ack: true }, presence: { key: crypto.randomUUID() } }
	});
}

export function getParticipantProfile(code: string) {
	if (!browser) return null;
	const keysToCheck = [
		localStorage.getItem(`${PARTICIPANT_KEY_PREFIX}${code}`),
		sessionStorage.getItem(SESSION_STORAGE_KEY),
		(() => {
			const match = document.cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
			return match ? decodeURIComponent(match[1]) : null;
		})()
	];

	for (const raw of keysToCheck) {
		if (!raw) continue;
		try {
			const parsed = JSON.parse(raw);
			if (!parsed) continue;
			if (!parsed.sessionCode || parsed.sessionCode === code) {
				return parsed;
			}
		} catch {
			console.warn('Invalid participant profile encountered');
		}
	}

	return null;
}

export function storeParticipantProfile(code: string, profile: Participant) {
	if (!browser) return;
	try {
		const serialized = JSON.stringify(profile);
		localStorage.setItem(`${PARTICIPANT_KEY_PREFIX}${code}`, serialized);
		sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
		document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(serialized)}; path=/; SameSite=Lax`;
	} catch (error) {
		console.error('Failed to persist participant profile', error);
	}
}

export function clearParticipantProfile(code: string) {
	if (!browser) return;
	if (code) {
		localStorage.removeItem(`${PARTICIPANT_KEY_PREFIX}${code}`);
	}
	sessionStorage.removeItem(SESSION_STORAGE_KEY);
	document.cookie = `${SESSION_COOKIE}=; Max-Age=0; path=/`;
}
