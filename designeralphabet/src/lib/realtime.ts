import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import { supabase } from './supabase';
import type { Card } from './Cards';
import type { Participant, Response, TimelineEntry } from './gamification';

const SESSION_COOKIE = 'cda-session';
const SESSION_STORAGE_KEY = 'cda-session';
const PARTICIPANT_KEY_PREFIX = 'cda:participant:';

export interface Session {
	code: string;
	title: string | null;
	template_slug: string | null;
	challenge: string | null;
	facilitator_email: string | null;
	active_phase_key: string | null;
	active_round: string | null;
	round_expires_at: string | null;
	status: 'planned' | 'live' | 'done';
	created_at: string;
}

export interface Question {
	id: string;
	room_code: string;
	section: string;
	phase_key: string | null;
	text: string;
	lens: string | null;
	response_type: string | null;
	map_type: string | null;
	config: Record<string, unknown> | null;
	order_index: number | null;
	recommended_dashboards: string[];
	enable_voting: boolean | null;
	created_at: string;
}

export interface ChatMessage {
	id: string;
	room_code: string;
	participant_id: string | null;
	message: string;
	created_at: string;
}

export interface Phase {
	id: string;
	session_code: string;
	phase_key: string | null;
	cards?: Card[];
	title: string | null;
	description: string | null;
	order_index: number | null;
	duration_minutes: number | null;
	dashboards: string[];
	status: 'pending' | 'active' | 'completed';
	started_at: string | null;
	completed_at: string | null;
	created_at: string | null;
	updated_at: string | null;
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
let ws: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

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

function connectWebSocket(code: string) {
	if (!browser) return;

	// WebSocket is completely disabled - use Supabase Realtime instead
	console.log('[WS] WebSocket disabled - all realtime functionality uses Supabase');
	return;

	// Clean up existing connection
	if (ws) {
		ws.close();
		ws = null;
	}

	// Create WebSocket connection
	const explicitWsUrl = (import.meta.env.VITE_REALTIME_WS_URL ?? '').trim();
	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	const wsUrl = explicitWsUrl.length > 0 ? explicitWsUrl : `${protocol}//${window.location.host}/ws`;

	ws = new WebSocket(wsUrl);

	ws.onopen = () => {
		console.log('[WS] Connected to session:', code);
		// Send HELLO message to register with session
		ws?.send(JSON.stringify({ type: 'HELLO', code }));
	};

	ws.onmessage = (event) => {
		try {
			const message = JSON.parse(event.data);
			handleWebSocketMessage(message, code);
		} catch (error) {
			console.error('[WS] Failed to parse message:', error);
		}
	};

	ws.onerror = (error) => {
		console.error('[WS] Error:', error);
	};

	ws.onclose = () => {
		console.log('[WS] Disconnected from session:', code);
		ws = null;

		// Attempt to reconnect if still active
		if (activeCode === code) {
			reconnectTimeout = setTimeout(() => {
				console.log('[WS] Attempting to reconnect...');
				connectWebSocket(code);
			}, 3000);
		}
	};
}

function handleWebSocketMessage(message: any, code: string) {
	switch (message.type) {
		case 'VOTE_UPDATED': {
			// Update specific response vote count
			responses.update((current) =>
				current.map((r) =>
					r.id === message.responseId ? { ...r, votes: message.votes } : r
				)
			);
			break;
		}

		case 'RESPONSE_ADDED': {
			// Add new response to list
			responses.update((current) => [...current, message.response]);
			break;
		}

		case 'PHASE_UPDATE': {
			// Update phases
			if (message.phases) {
				phases.set(message.phases);
			}
			// Refresh session to get latest active phase
			fetchBundle(code);
			break;
		}

		case 'PRESENCE': {
			// Update participants list
			if (message.participants) {
				participants.set(message.participants);
			}
			break;
		}

		case 'TIMELINE_ADDED': {
			// Add timeline item
			timeline.update((current) => [...current, message.item]);
			break;
		}

		case 'CHAT_MESSAGE': {
			// Add chat message
			chat.update((current) => [...current, message.message]);
			break;
		}

		case 'QUESTION_ADDED': {
			// Add new question
			questions.update((current) => [...current, message.question]);
			break;
		}

		case 'SCORE_UPDATED': {
			// Update participant score
			participants.update((current) =>
				current.map((p) =>
					p.id === message.participantId
						? { ...p, points: message.points, badges: message.badges }
						: p
				)
			);
			break;
		}

		case 'ROUND_UPDATE': {
			// Update active round
			sessionDetails.update((s) =>
				s ? { ...s, active_round: message.round, round_expires_at: message.endsAt } : s
			);
			break;
		}

		case 'STEP_CHANGE': {
			// Update session status
			sessionDetails.update((s) => (s ? { ...s, status: message.status } : s));
			break;
		}

		default:
			console.log('[WS] Unhandled message type:', message.type);
	}
}

export async function startRealtimeSession(code: string) {
	if (!browser) return;
	if (!code) return;

	if (activeCode === code && ws) {
		return;
	}

	stopRealtimeSession();
	activeCode = code;
	await fetchBundle(code);

	// Connect WebSocket for realtime updates
	connectWebSocket(code);

	// Keep polling as fallback (longer interval)
	pollHandle = setInterval(() => fetchBundle(code), POLL_INTERVAL * 3);
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

	if (reconnectTimeout) {
		clearTimeout(reconnectTimeout);
		reconnectTimeout = null;
	}

	if (ws) {
		ws.close();
		ws = null;
	}

	activeCode = null;
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
				if (!parsed.id && parsed.participantId) {
					parsed.id = parsed.participantId;
				}
				if (!parsed.participantId && parsed.id) {
					parsed.participantId = parsed.id;
				}
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
		const normalized = {
			...profile,
			sessionCode: (profile as any).sessionCode ?? code,
			id: (profile as any).id ?? (profile as any).participantId ?? '',
			participantId: (profile as any).participantId ?? (profile as any).id ?? ''
		};
		const serialized = JSON.stringify(normalized);
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
