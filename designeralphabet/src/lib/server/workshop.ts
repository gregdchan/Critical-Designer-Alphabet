import { query } from '$lib/database';
import { broadcast } from './realtime';

export type SessionStatus = 'planned' | 'live' | 'done';

export interface Session {
  code: string;
  title: string | null;
  template_id: string | null;
  status: SessionStatus;
  created_at: string;
}

export interface Participant {
  id: number;
  room_code: string;
  name: string;
  role: 'facilitator' | 'participant';
  color: string;
  points: number;
  badges: any;
  created_at: string;
}

export interface Question {
  id: number;
  room_code: string;
  section: string;
  text: string;
  created_at: string;
}

export interface ResponseRow {
  id: number;
  room_code: string;
  question_id: number;
  participant_id: number | null;
  text: string;
  cards: string[];
  votes: number;
  created_at: string;
}

export interface TimelineItem {
  id: number;
  room_code: string;
  label: 'Now' | 'Next' | 'Later';
  item_text: string;
  owner: string | null;
  metric: string | null;
  risk_note: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  room_code: string;
  participant_id: number | null;
  message: string;
  created_at: string;
}

function parseJson<T>(value: any, fallback: T): T {
  if (!value) return fallback;
  if (Array.isArray(value) || typeof value === 'object') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return fallback;
  }
}

export async function createSession({ code, title, templateId }: { code: string; title: string; templateId?: string }) {
  await query(
    'INSERT INTO sessions (code, title, template_id) VALUES (?, ?, ?)',
    [code, title ?? null, templateId ?? null]
  );
  return getSession(code);
}

export async function updateSessionStatus(code: string, status: SessionStatus) {
  await query('UPDATE sessions SET status = ? WHERE code = ?', [status, code]);
  broadcast(code, { type: 'STEP_CHANGE', status });
  return getSession(code);
}

export async function getSession(code: string) {
  const rows = (await query('SELECT * FROM sessions WHERE code = ?', [code])) as any[];
  return rows[0] as Session | undefined;
}

export async function addParticipant({
  code,
  name,
  role,
  color
}: {
  code: string;
  name: string;
  role: 'facilitator' | 'participant';
  color: string;
}) {
  const result: any = await query(
    'INSERT INTO participants (room_code, name, role, color) VALUES (?, ?, ?, ?)',
    [code, name, role, color]
  );
  const participantId = Number(result.insertId);
  const participants = await getParticipants(code);
  broadcast(code, { type: 'PRESENCE', participants });
  return participants.find((p) => p.id === participantId);
}

export async function getParticipants(code: string): Promise<Participant[]> {
  const rows = (await query('SELECT * FROM participants WHERE room_code = ? ORDER BY created_at', [code])) as any[];
  return rows.map((row) => ({
    ...row,
    badges: parseJson(row.badges, [])
  }));
}

export async function addQuestion({
  code,
  section,
  text
}: {
  code: string;
  section: string;
  text: string;
}) {
  const result: any = await query(
    'INSERT INTO questions (room_code, section, text) VALUES (?, ?, ?)',
    [code, section, text]
  );
  const question = await getQuestionById(result.insertId);
  if (question) {
    broadcast(code, { type: 'QUESTION_ADDED', question });
  }
  return question;
}

async function getQuestionById(id: number): Promise<Question | undefined> {
  const rows = (await query('SELECT * FROM questions WHERE id = ?', [id])) as any[];
  return rows[0];
}

async function getResponseById(id: number): Promise<ResponseRow | undefined> {
  const rows = (await query('SELECT * FROM responses WHERE id = ?', [id])) as any[];
  const response = rows[0];
  if (!response) return undefined;
  return {
    ...response,
    cards: parseJson<string[]>(response.cards, [])
  } as ResponseRow;
}

export async function getQuestions(code: string): Promise<Question[]> {
  const rows = (await query('SELECT * FROM questions WHERE room_code = ? ORDER BY created_at', [code])) as any[];
  return rows as Question[];
}

export async function addResponse({
  code,
  questionId,
  participantId,
  text,
  cards
}: {
  code: string;
  questionId: number;
  participantId: number | null;
  text: string;
  cards: string[];
}) {
  const result: any = await query(
    'INSERT INTO responses (room_code, question_id, participant_id, text, cards) VALUES (?, ?, ?, ?, ?)',
    [code, questionId, participantId, text, JSON.stringify(cards ?? [])]
  );
  const response = await getResponseById(result.insertId);
  if (response) {
    broadcast(code, { type: 'RESPONSE_ADDED', response });
  }
  return response;
}

export async function voteResponse({ responseId, delta }: { responseId: number; delta: number }) {
  const row = (await query('SELECT room_code, votes FROM responses WHERE id = ?', [responseId])) as any[];
  if (!row.length) return undefined;
  const response = row[0];
  const newVotes = Math.max(0, Number(response.votes) + delta);
  await query('UPDATE responses SET votes = ? WHERE id = ?', [newVotes, responseId]);
  broadcast(response.room_code, { type: 'VOTE_UPDATED', responseId, votes: newVotes });
  return { responseId, votes: newVotes };
}

export async function getResponses(code: string): Promise<ResponseRow[]> {
  const rows = (await query(
    'SELECT * FROM responses WHERE room_code = ? ORDER BY created_at',
    [code]
  )) as any[];
  return rows.map((row) => ({
    ...row,
    cards: parseJson<string[]>(row.cards, [])
  }));
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
  const result: any = await query(
    'INSERT INTO timeline (room_code, label, item_text, owner, metric, risk_note) VALUES (?, ?, ?, ?, ?, ?)',
    [code, label, itemText, owner ?? null, metric ?? null, riskNote ?? null]
  );
  const rows = (await query('SELECT * FROM timeline WHERE id = ?', [result.insertId])) as any[];
  const timelineItem = rows[0] as TimelineItem | undefined;
  if (timelineItem) {
    broadcast(code, { type: 'TIMELINE_ADDED', item: timelineItem });
  }
  return timelineItem;
}

export async function getTimeline(code: string): Promise<TimelineItem[]> {
  const rows = (await query(
    'SELECT * FROM timeline WHERE room_code = ? ORDER BY created_at',
    [code]
  )) as any[];
  return rows as TimelineItem[];
}

export async function updateScore({
  participantId,
  delta,
  badge
}: {
  participantId: number;
  delta: number;
  badge?: string;
}) {
  const rows = (await query('SELECT room_code, points, badges FROM participants WHERE id = ?', [participantId])) as any[];
  if (!rows.length) return undefined;
  const participant = rows[0];
  const newPoints = Number(participant.points ?? 0) + delta;
  const badges = parseJson<string[]>(participant.badges, []);
  if (badge && !badges.includes(badge)) {
    badges.push(badge);
  }
  await query('UPDATE participants SET points = ?, badges = ? WHERE id = ?', [newPoints, JSON.stringify(badges), participantId]);
  broadcast(participant.room_code, {
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
  participantId: number | null;
  message: string;
}) {
  const result: any = await query(
    'INSERT INTO chat (room_code, participant_id, message) VALUES (?, ?, ?)',
    [code, participantId, message]
  );
  const rows = (await query('SELECT * FROM chat WHERE id = ?', [result.insertId])) as any[];
  const chatMessage = rows[0] as ChatMessage | undefined;
  if (chatMessage) {
    broadcast(code, { type: 'CHAT_MESSAGE', message: chatMessage });
  }
  return chatMessage;
}

export async function getChat(code: string): Promise<ChatMessage[]> {
  const rows = (await query('SELECT * FROM chat WHERE room_code = ? ORDER BY created_at', [code])) as any[];
  return rows as ChatMessage[];
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
  lines.push(`# Workshop Summary — ${session.title ?? 'Untitled Session'} (${code})`);
  lines.push('');
  lines.push(`Status: **${session.status.toUpperCase()}**`);
  lines.push(`Created: ${session.created_at}`);
  lines.push('');

  lines.push('## Participants');
  participants.forEach((p) => {
    lines.push(`- ${p.name} (${p.role}) — ${p.points} pts ${p.badges?.length ? `· Badges: ${p.badges.join(', ')}` : ''}`);
  });
  lines.push('');

  lines.push('## Questions & Responses');
  questions.forEach((question) => {
    lines.push(`### ${question.section} — ${question.text}`);
    responses
      .filter((response) => response.question_id === question.id)
      .forEach((response) => {
        const tags = response.cards?.length ? ` _(cards: ${response.cards.join(', ')})_` : '';
        const author = participants.find((p) => p.id === response.participant_id)?.name ?? 'Unknown';
        lines.push(`- **${author}** (${response.votes} votes): ${response.text}${tags}`);
      });
    lines.push('');
  });

  lines.push('## Timeline');
  timeline.forEach((item) => {
    lines.push(`- **${item.label}** · ${item.item_text}${item.owner ? ` (owner: ${item.owner})` : ''}${item.metric ? ` · metric: ${item.metric}` : ''}`);
  });
  lines.push('');

  lines.push('## Chat Highlights');
  chat.forEach((entry) => {
    const author = participants.find((p) => p.id === entry.participant_id)?.name ?? 'Anonymous';
    lines.push(`- ${author}: ${entry.message}`);
  });
  lines.push('');

  lines.push('---');
  lines.push('Credits: The Designer’s Critical Alphabet by Dr. Lesley-Ann Noel. Platform by Gregory D. Chan.');

  return lines.join('\n');
}
