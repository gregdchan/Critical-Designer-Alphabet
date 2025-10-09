import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabase';
import { broadcast } from './realtime';

export type SessionStatus = 'planned' | 'live' | 'done';

export interface Session {
	code: string;
	title: string | null;
	template_slug: string | null;
	challenge: string | null;
	facilitator_email: string | null;
	active_phase_key: string | null;
	active_round: string | null;
	round_expires_at: string | null;
	status: SessionStatus;
	created_at: string;
}

export interface SessionPhase {
	id: string;
	session_code: string;
	phase_key: string | null;
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

export interface TemplatePhase {
	key?: string;
	title?: string;
	description?: string;
	durationMinutes?: number | null;
	dashboards?: string[] | null;
}

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

export interface ResponseRow {
	id: string;
	room_code: string;
	question_id: string;
	participant_id: string | null;
	text: string;
	metadata: Record<string, unknown> | null;
	cards: string[];
	votes: number;
	created_at: string;
}

export interface TimelineItem {
	id: string;
	room_code: string;
	label: 'Now' | 'Next' | 'Later';
	item_text: string;
	owner: string | null;
	metric: string | null;
	risk_note: string | null;
	created_at: string;
}

export interface ChatMessage {
	id: string;
	room_code: string;
	participant_id: string | null;
	message: string;
	created_at: string;
}

function ensure<T>(response: PostgrestSingleResponse<T>, context: string): T {
	const { data, error } = response;
	if (error || !data) {
		throw new Error(error?.message ?? `Supabase query failed: ${context}`);
	}
	return data;
}

function ensureArray<T>(response: { data: T[] | null; error: any }, context: string): T[] {
	const { data, error } = response;
	if (error || !data) {
		throw new Error(error?.message ?? `Supabase query failed: ${context}`);
	}
	return data;
}

function normalizeBadges(value: unknown): string[] {
	if (Array.isArray(value)) return value as string[];
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? (parsed as string[]) : [];
		} catch (error) {
			return [];
		}
	}
	return [];
}

function asParticipant(row: any): Participant {
	return {
		...row,
		points: Number(row.points ?? 0),
		badges: normalizeBadges(row.badges)
	} as Participant;
}

function asResponse(row: any): ResponseRow {
	return {
		...row,
		votes: Number(row.votes ?? 0),
		cards: Array.isArray(row.cards)
			? (row.cards as string[])
			: typeof row.cards === 'string'
				? (() => {
						try {
							const parsed = JSON.parse(row.cards);
							return Array.isArray(parsed) ? (parsed as string[]) : [];
						} catch (error) {
							return [];
						}
					})()
				: []
	} as ResponseRow;
}

export async function createSession({
	code,
	title,
	templateSlug,
	challenge,
	facilitatorEmail,
	phases
}: {
	code: string;
	title: string;
	templateSlug?: string;
	challenge?: string;
	facilitatorEmail?: string;
	phases?: TemplatePhase[];
}) {
	const response = await supabaseAdmin
		.from('sessions')
		.insert({
			code,
			title,
			template_slug: templateSlug ?? null,
			challenge: challenge ?? null,
			facilitator_email: facilitatorEmail ?? null,
			active_round: null,
			round_expires_at: null
		})
		.select()
		.single();

	const session = ensure(response, 'createSession');

	if (phases?.length) {
		const rows = phases.map((phase, index) => ({
			session_code: code,
			phase_key: phase.key ?? `phase-${index + 1}`,
			title: phase.title ?? phase.key ?? `Phase ${index + 1}`,
			description: phase.description ?? null,
			order_index: index,
			duration_minutes: phase.durationMinutes ?? null,
			dashboards: Array.isArray(phase.dashboards) ? phase.dashboards : [],
			status: 'pending'
		}));

		const { error } = await supabaseAdmin.from('session_phases').insert(rows);
		if (error) {
			throw new Error(error.message);
		}
	}

	return session as Session;
}

export async function updateSessionStatus(code: string, status: SessionStatus) {
	const response = await supabaseAdmin
		.from('sessions')
		.update({ status })
		.eq('code', code)
		.select()
		.single();

	const session = ensure(response, 'updateSessionStatus');
	broadcast(code, { type: 'STEP_CHANGE', status });
	return session as Session;
}

export async function setActiveRound(
	code: string,
	round: { name: string | null; endsAt: string | null }
) {
	const response = await supabaseAdmin
		.from('sessions')
		.update({ active_round: round.name ?? null, round_expires_at: round.endsAt ?? null })
		.eq('code', code)
		.select()
		.single();

	const session = ensure(response, 'setActiveRound');
	broadcast(code, {
		type: 'ROUND_UPDATE',
		round: session.active_round,
		endsAt: session.round_expires_at
	});
	return session as Session;
}

export async function getSession(code: string) {
	const response = await supabaseAdmin.from('sessions').select('*').eq('code', code).maybeSingle();

	const { data, error } = response;
	if (error) throw new Error(error.message);
	return (data ?? undefined) as Session | undefined;
}

export async function listSessions({
	statuses,
	facilitatorEmail
}: {
	statuses?: SessionStatus[];
	facilitatorEmail?: string;
} = {}) {
	let query = supabaseAdmin.from('sessions').select('*').order('created_at', { ascending: false });

	if (statuses?.length) {
		query = query.in('status', statuses);
	}

	if (facilitatorEmail) {
		query = query.ilike('facilitator_email', facilitatorEmail.trim().toLowerCase());
	}

	const response = await query;
	return ensureArray(response, 'listSessions') as Session[];
}

export async function getSessionPhases(code: string): Promise<SessionPhase[]> {
	const response = await supabaseAdmin
		.from('session_phases')
		.select('*')
		.eq('session_code', code)
		.order('order_index', { ascending: true });

	return ensureArray(response, 'getSessionPhases').map((row: any) => ({
		...row,
		dashboards: Array.isArray(row.dashboards) ? (row.dashboards as string[]) : []
	})) as SessionPhase[];
}

export async function startSessionPhase(code: string, phaseKey: string) {
	const now = new Date().toISOString();

	const phaseRecord = await supabaseAdmin
		.from('session_phases')
		.select('id, order_index')
		.eq('session_code', code)
		.eq('phase_key', phaseKey)
		.maybeSingle();

	if (phaseRecord.error) throw new Error(phaseRecord.error.message);
	if (!phaseRecord.data) throw new Error('Phase not found');

	const orderIndex = phaseRecord.data.order_index ?? 0;

	await supabaseAdmin
		.from('session_phases')
		.update({ status: 'completed', completed_at: now })
		.eq('session_code', code)
		.lt('order_index', orderIndex)
		.not('status', 'eq', 'completed');

	await supabaseAdmin
		.from('session_phases')
		.update({ status: 'pending', started_at: null, completed_at: null })
		.eq('session_code', code)
		.gt('order_index', orderIndex)
		.not('status', 'eq', 'pending');

	const target = await supabaseAdmin
		.from('session_phases')
		.update({ status: 'active', started_at: now, completed_at: null })
		.eq('id', phaseRecord.data.id)
		.select()
		.single();

	const updated = ensure(target, 'startSessionPhase') as SessionPhase;

	await supabaseAdmin
		.from('sessions')
		.update({ active_phase_key: phaseKey, status: 'live' })
		.eq('code', code);

	const phases = await getSessionPhases(code);
	broadcast(code, { type: 'PHASE_UPDATE', phases, activePhaseKey: phaseKey });
	return updated;
}

export async function completeSessionPhase(
	code: string,
	phaseKey: string,
	{ autoAdvance = true } = {}
) {
	const now = new Date().toISOString();

	const phaseRecord = await supabaseAdmin
		.from('session_phases')
		.select('id, order_index')
		.eq('session_code', code)
		.eq('phase_key', phaseKey)
		.maybeSingle();

	if (phaseRecord.error) throw new Error(phaseRecord.error.message);
	if (!phaseRecord.data) throw new Error('Phase not found');

	const updated = await supabaseAdmin
		.from('session_phases')
		.update({ status: 'completed', completed_at: now })
		.eq('id', phaseRecord.data.id)
		.select()
		.single();

	ensure(updated, 'completeSessionPhase');

	let nextPhaseKey: string | null = null;

	if (autoAdvance) {
		const next = await supabaseAdmin
			.from('session_phases')
			.select('phase_key')
			.eq('session_code', code)
			.gt('order_index', phaseRecord.data.order_index ?? 0)
			.order('order_index', { ascending: true })
			.eq('status', 'pending')
			.limit(1)
			.maybeSingle();

		if (!next.error && next.data?.phase_key) {
			nextPhaseKey = next.data.phase_key;
			if (nextPhaseKey) {
				await startSessionPhase(code, nextPhaseKey);
				return;
			}
		}
	}

	await supabaseAdmin.from('sessions').update({ active_phase_key: nextPhaseKey }).eq('code', code);

	const phases = await getSessionPhases(code);
	broadcast(code, { type: 'PHASE_UPDATE', phases, activePhaseKey: nextPhaseKey });
}

export async function addParticipant({
	code,
	name,
	role,
	color,
	email,
	deviceId
}: {
	code: string;
	name: string;
	role: 'facilitator' | 'participant';
	color: string;
	email?: string;
	deviceId?: string;
}) {
	console.log('[addParticipant] Creating participant:', { code, name, role, email: email ? '***' : null, deviceId: deviceId ? '***' : null });

	// Check if participant with this email already exists in this session
	if (email) {
		const existing = await supabaseAdmin
			.from('participants')
			.select('*')
			.eq('room_code', code)
			.eq('email', email)
			.maybeSingle();

		if (existing.data) {
			console.log('[addParticipant] Found existing participant by email, returning:', existing.data.id);
			const participants = await getParticipants(code);
			broadcast(code, { type: 'PRESENCE', participants });
			return asParticipant(existing.data);
		}
	}

	// Check by device_id as fallback
	if (deviceId) {
		const existing = await supabaseAdmin
			.from('participants')
			.select('*')
			.eq('room_code', code)
			.eq('device_id', deviceId)
			.maybeSingle();

		if (existing.data) {
			console.log('[addParticipant] Found existing participant by device_id, returning:', existing.data.id);
			const participants = await getParticipants(code);
			broadcast(code, { type: 'PRESENCE', participants });
			return asParticipant(existing.data);
		}
	}

	// Create new participant
	const response = await supabaseAdmin
		.from('participants')
		.insert({
			room_code: code,
			name,
			role,
			color,
			email: email || null,
			device_id: deviceId || null
		})
		.select()
		.single();

	const participant = asParticipant(ensure(response, 'addParticipant'));
	console.log('[addParticipant] Created new participant:', participant.id);

	const participants = await getParticipants(code);
	broadcast(code, { type: 'PRESENCE', participants });
	return participants.find((p) => p.id === participant.id);
}

export async function getParticipants(code: string): Promise<Participant[]> {
	const response = await supabaseAdmin
		.from('participants')
		.select('*')
		.eq('room_code', code)
		.order('created_at', { ascending: true });

	return ensureArray(response, 'getParticipants').map(asParticipant);
}

export async function addQuestion({
	code,
	section,
	text,
	lens,
	responseType,
	mapType,
	config,
	phaseKey,
	orderIndex,
	recommendedDashboards,
	enableVoting
}: {
	code: string;
	section: string;
	text: string;
	lens?: string | null;
	responseType?: string | null;
	mapType?: string | null;
	config?: Record<string, unknown> | null;
	phaseKey?: string | null;
	orderIndex?: number | null;
	recommendedDashboards?: string[];
	enableVoting?: boolean | null;
}) {
	const response = await supabaseAdmin
		.from('questions')
		.insert({
			room_code: code,
			section,
			text,
			lens: lens ?? null,
			response_type: responseType ?? 'written',
			map_type: mapType ?? 'responses',
			config: config ?? {},
			phase_key: phaseKey ?? null,
			order_index: typeof orderIndex === 'number' ? orderIndex : null,
			recommended_dashboards: recommendedDashboards ?? [],
			enable_voting: enableVoting ?? true
		})
		.select()
		.single();

	const questionRow = ensure(response, 'addQuestion') as Question;
	const question: Question = {
		...questionRow,
		config: (questionRow.config ?? {}) as Record<string, unknown>,
		recommended_dashboards: Array.isArray(questionRow.recommended_dashboards)
			? (questionRow.recommended_dashboards as string[])
			: []
	};
	broadcast(code, { type: 'QUESTION_ADDED', question });
	return question;
}

export async function getQuestions(code: string): Promise<Question[]> {
	const response = await supabaseAdmin
		.from('questions')
		.select('*')
		.eq('room_code', code)
		.order('created_at', { ascending: true });

	return ensureArray(response, 'getQuestions') as Question[];
}

export async function addResponse({
	code,
	questionId,
	participantId,
	text,
	cards
}: {
	code: string;
	questionId: string;
	participantId: string | null;
	text: string;
	cards: string[];
}) {
	// Log the incoming response data for debugging
	console.log('[addResponse] Creating response:', {
		code,
		questionId,
		participantId,
		hasText: !!text,
		cardsCount: cards?.length || 0
	});

	if (!participantId) {
		console.warn('[addResponse] WARNING: participant_id is NULL! Response will be anonymous.');
	}

	const response = await supabaseAdmin
		.from('responses')
		.insert({
			room_code: code,
			question_id: questionId,
			participant_id: participantId,
			text,
			cards
		})
		.select()
		.single();

	const result = asResponse(ensure(response, 'addResponse'));

	console.log('[addResponse] Response created:', {
		id: result.id,
		participant_id: result.participant_id,
		question_id: result.question_id
	});

	broadcast(code, { type: 'RESPONSE_ADDED', response: result });
	return result;
}

export async function getResponses(code: string): Promise<ResponseRow[]> {
	const response = await supabaseAdmin
		.from('responses')
		.select('*')
		.eq('room_code', code)
		.order('created_at', { ascending: true });

	return ensureArray(response, 'getResponses').map(asResponse);
}

export async function voteResponse({ responseId, delta }: { responseId: string; delta: number }) {
	const existing = await supabaseAdmin
		.from('responses')
		.select('room_code, votes')
		.eq('id', responseId)
		.maybeSingle();

	if (existing.error) throw new Error(existing.error.message);
	if (!existing.data) return undefined;

	const currentVotes = Number(existing.data.votes ?? 0);
	const votes = Math.max(0, currentVotes + delta);

	const updated = await supabaseAdmin
		.from('responses')
		.update({ votes })
		.eq('id', responseId)
		.select('id, votes, room_code')
		.single();

	const record = ensure(updated, 'voteResponse');
	broadcast(record.room_code as string, {
		type: 'VOTE_UPDATED',
		responseId,
		votes: Number(record.votes ?? votes)
	});
	return { responseId, votes: Number(record.votes ?? votes) };
}

export async function addTimelineItem({
	code,
	label,
	itemText,
	owner,
	metric,
	riskNote
}: {
	code: string;
	label: 'Now' | 'Next' | 'Later';
	itemText: string;
	owner?: string;
	metric?: string;
	riskNote?: string;
}) {
	const response = await supabaseAdmin
		.from('timeline')
		.insert({
			room_code: code,
			label,
			item_text: itemText,
			owner: owner ?? null,
			metric: metric ?? null,
			risk_note: riskNote ?? null
		})
		.select()
		.single();

	const item = ensure(response, 'addTimelineItem') as TimelineItem;
	broadcast(code, { type: 'TIMELINE_ADDED', item });
	return item;
}

export async function getTimeline(code: string): Promise<TimelineItem[]> {
	const response = await supabaseAdmin
		.from('timeline')
		.select('*')
		.eq('room_code', code)
		.order('created_at', { ascending: true });

	return ensureArray(response, 'getTimeline') as TimelineItem[];
}

export async function updateScore({
	participantId,
	delta,
	badge
}: {
	participantId: string;
	delta: number;
	badge?: string;
}) {
	const existing = await supabaseAdmin
		.from('participants')
		.select('room_code, points, badges')
		.eq('id', participantId)
		.maybeSingle();

	if (existing.error) throw new Error(existing.error.message);
	if (!existing.data) return undefined;

	const roomCode = existing.data.room_code as string;
	const currentPoints = Number(existing.data.points ?? 0);
	const badges = normalizeBadges(existing.data.badges);

	if (badge && !badges.includes(badge)) badges.push(badge);

	const newPoints = currentPoints + delta;

	const updated = await supabaseAdmin
		.from('participants')
		.update({ points: newPoints, badges })
		.eq('id', participantId)
		.select('points, badges')
		.single();

	ensure(updated, 'updateScore');

	broadcast(roomCode, {
		type: 'SCORE_UPDATED',
		participantId,
		points: newPoints,
		badges
	});

	return { participantId, points: newPoints, badges };
}

export async function addChatMessage({
	code,
	participantId,
	message
}: {
	code: string;
	participantId: string | null;
	message: string;
}) {
	const response = await supabaseAdmin
		.from('chat')
		.insert({ room_code: code, participant_id: participantId, message })
		.select()
		.single();

	const chatMessage = ensure(response, 'addChatMessage') as ChatMessage;
	broadcast(code, { type: 'CHAT_MESSAGE', message: chatMessage });
	return chatMessage;
}

export async function getChat(code: string): Promise<ChatMessage[]> {
	const response = await supabaseAdmin
		.from('chat')
		.select('*')
		.eq('room_code', code)
		.order('created_at', { ascending: true });

	return ensureArray(response, 'getChat') as ChatMessage[];
}

export async function buildSessionExport(code: string) {
	const session = await getSession(code);
	if (!session) return `# Session ${code}\n\nNo session data found.`;

	const [participants, questions, responses, timeline, chat] = await Promise.all([
		getParticipants(code),
		getQuestions(code),
		getResponses(code),
		getTimeline(code),
		getChat(code)
	]);

	const lines: string[] = [];
	lines.push(`# Session Summary — ${session.title ?? 'Untitled Session'} (${code})`);
	lines.push('');
	lines.push(`Status: **${session.status.toUpperCase()}**`);
	lines.push(`Created: ${session.created_at}`);
	lines.push('');

	lines.push('## Participants');
	participants.forEach((p) => {
		lines.push(
			`- ${p.name} (${p.role}) — ${p.points} pts ${p.badges?.length ? `· Badges: ${p.badges.join(', ')}` : ''}`
		);
	});
	lines.push('');

	lines.push('## Questions & Responses');
	questions.forEach((question) => {
		lines.push(`### ${question.section} — ${question.text}`);
		responses
			.filter((response) => response.question_id === question.id)
			.forEach((response) => {
				const tags = response.cards?.length ? ` _(cards: ${response.cards.join(', ')})_` : '';
				const author =
					participants.find((p) => p.id === response.participant_id)?.name ?? 'Unknown';
				lines.push(`- **${author}** (${response.votes} votes): ${response.text}${tags}`);
			});
		lines.push('');
	});

	lines.push('## Timeline');
	timeline.forEach((item) => {
		lines.push(
			`- **${item.label}** · ${item.item_text}${item.owner ? ` (owner: ${item.owner})` : ''}${item.metric ? ` · metric: ${item.metric}` : ''}`
		);
	});
	lines.push('');

	lines.push('## Chat Highlights');
	chat.forEach((entry) => {
		const author = participants.find((p) => p.id === entry.participant_id)?.name ?? 'Anonymous';
		lines.push(`- ${author}: ${entry.message}`);
	});
	lines.push('');

	lines.push('---');
	lines.push(
		'Credits: The Designer’s Critical Alphabet by Dr. Lesley-Ann Noel. Platform by Gregory D. Chan.'
	);

	return lines.join('\n');
}
