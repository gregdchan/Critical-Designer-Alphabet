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
let supabaseChannel: ReturnType<typeof supabase.channel> | null = null;
let sessionStatusChannel: ReturnType<typeof supabase.channel> | null = null;
let isRealtimeEnabled = false;

async function fetchBundle(code: string) {
	try {
		console.log(`[Realtime] Fetching bundle for session: ${code}`);
		// Add timestamp to prevent caching
		const res = await fetch(`/api/session/${code}?t=${Date.now()}`, {
			cache: 'no-store'
		});
		const data = await res.json();
		if (!data.success) {
			console.warn('[Realtime] Bundle fetch failed:', data.error);
			return;
		}
		console.log('[Realtime] Bundle received:', {
			session: !!data.session,
			participants: data.participants?.length || 0,
			questions: data.questions?.length || 0,
			responses: data.responses?.length || 0,
			phases: data.phases?.length || 0
		});
		console.log('[Realtime] Questions dashboards:', data.questions?.map((q: any) => ({
			text: q.text?.substring(0, 40),
			recommended_dashboards: q.recommended_dashboards
		})));
		sessionDetails.set(data.session);
		participants.set(data.participants ?? []);
		questions.set(data.questions ?? []);
		responses.set(data.responses ?? []);
		timeline.set(data.timeline ?? []);
		chat.set(data.chat ?? []);
		phases.set(data.phases ?? []);
	} catch (error) {
		console.error('[Realtime] Failed to load session bundle', error);
	}
}

function connectWebSocket(code: string) {
	if (!browser) return;

	// WebSocket is completely disabled - use Supabase Realtime instead
	console.log('[WS] WebSocket disabled - all realtime functionality uses Supabase');
	/* Disabled WebSocket code - keeping for reference
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

	const newWs = new WebSocket(wsUrl);
	ws = newWs;

	newWs.onopen = () => {
		console.log('[WS] Connected to session:', code);
		// Send HELLO message to register with session
		newWs.send(JSON.stringify({ type: 'HELLO', code }));
	};

	newWs.onmessage = (event) => {
		try {
			const message = JSON.parse(event.data);
			handleWebSocketMessage(message, code);
		} catch (error) {
			console.error('[WS] Failed to parse message:', error);
		}
	};

	newWs.onerror = (error) => {
		console.error('[WS] Error:', error);
	};

	newWs.onclose = () => {
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
	*/
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

function setupDataSubscriptions(code: string) {
	if (!browser) return;
	
	// Set up Supabase Realtime subscriptions for all data tables
	supabaseChannel = supabase
		.channel(`session:${code}`)
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'participants', filter: `room_code=eq.${code}` },
			async () => {
				console.log('[Realtime] Participants updated');
				await fetchBundle(code);
			}
		)
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'responses', filter: `room_code=eq.${code}` },
			async (payload) => {
				console.log('[Realtime] Responses updated!', payload);
				await fetchBundle(code);
			}
		)
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'questions', filter: `room_code=eq.${code}` },
			async () => {
				console.log('[Realtime] Questions updated');
				await fetchBundle(code);
			}
		)
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'timeline', filter: `room_code=eq.${code}` },
			async () => {
				console.log('[Realtime] Timeline updated');
				await fetchBundle(code);
			}
		)
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'chat', filter: `room_code=eq.${code}` },
			async () => {
				console.log('[Realtime] Chat updated');
				await fetchBundle(code);
			}
		)
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'session_phases', filter: `session_code=eq.${code}` },
			async () => {
				console.log('[Realtime] Phases updated');
				await fetchBundle(code);
			}
		)
		.subscribe((status) => {
			console.log(`[Realtime] Data subscription status: ${status}`);
		});
}

function setupSessionStatusSubscription(code: string) {
	if (!browser) return;
	
	// Separate subscription to watch for session status changes
	sessionStatusChannel = supabase
		.channel(`session-status:${code}`)
		.on(
			'postgres_changes',
			{ event: 'UPDATE', schema: 'public', table: 'sessions', filter: `code=eq.${code}` },
			async (payload) => {
				console.log('[Realtime] Session status updated', payload);
				const newSession = payload.new as Session;
				await fetchBundle(code);
				
				// Dynamically adjust realtime behavior based on new status
				if (newSession.status === 'live' && !isRealtimeEnabled) {
					console.log('[Realtime] Session went live - enabling realtime subscriptions');
					setupDataSubscriptions(code);
					isRealtimeEnabled = true;
					// Set up more frequent polling for live sessions
					if (pollHandle) clearInterval(pollHandle);
					pollHandle = setInterval(() => fetchBundle(code), POLL_INTERVAL * 6); // 30 seconds
				} else if (newSession.status !== 'live' && isRealtimeEnabled) {
					console.log('[Realtime] Session ended - disabling realtime subscriptions');
					if (supabaseChannel) {
						supabase.removeChannel(supabaseChannel);
						supabaseChannel = null;
					}
					isRealtimeEnabled = false;
					// Use less frequent polling for ended/planned sessions
					if (pollHandle) clearInterval(pollHandle);
					pollHandle = setInterval(() => fetchBundle(code), POLL_INTERVAL * 30); // 2.5 minutes
				}
			}
		)
		.subscribe((status) => {
			console.log(`[Realtime] Session status subscription: ${status}`);
		});
}

export async function startRealtimeSession(code: string) {
	if (!browser) return;
	if (!code) return;

	if (activeCode === code && sessionStatusChannel) {
		return;
	}

	stopRealtimeSession();
	activeCode = code;
	await fetchBundle(code);

	// Get current session status to determine realtime behavior
	const currentSession = await (async () => {
		try {
			const res = await fetch(`/api/session/${code}`);
			const data = await res.json();
			return data.session as Session | null;
		} catch (error) {
			console.error('[Realtime] Failed to fetch session status', error);
			return null;
		}
	})();

	// Always subscribe to session status changes
	setupSessionStatusSubscription(code);

	// Only enable realtime subscriptions if session is live
	if (currentSession?.status === 'live') {
		console.log('[Realtime] Session is live - enabling realtime subscriptions');
		setupDataSubscriptions(code);
		isRealtimeEnabled = true;
		// More frequent polling for live sessions
		pollHandle = setInterval(() => fetchBundle(code), POLL_INTERVAL * 6); // 30 seconds
	} else {
		console.log(`[Realtime] Session is ${currentSession?.status || 'unknown'} - using polling only`);
		isRealtimeEnabled = false;
		// Less frequent polling for non-live sessions
		pollHandle = setInterval(() => fetchBundle(code), POLL_INTERVAL * 30); // 2.5 minutes
	}
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

	if (supabaseChannel) {
		supabase.removeChannel(supabaseChannel);
		supabaseChannel = null;
	}

	if (sessionStatusChannel) {
		supabase.removeChannel(sessionStatusChannel);
		sessionStatusChannel = null;
	}

	activeCode = null;
	isRealtimeEnabled = false;
}

export async function addResponse(
	code: string,
	payload: { questionId: string; participantId: string | null; text: string; cards?: string[]; metadata?: any }
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
