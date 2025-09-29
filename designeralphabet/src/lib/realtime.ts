import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';

export type SessionBundle = {
  session: any;
  participants: any[];
  questions: any[];
  responses: any[];
  timeline: any[];
  chat: any[];
};

const POLL_INTERVAL = 5000;

export const sessionDetails = writable<any | null>(null);
export const participants = writable<any[]>([]);
export const questions = writable<any[]>([]);
export const responses = writable<any[]>([]);
export const timeline = writable<any[]>([]);
export const chat = writable<any[]>([]);

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

export function stopRealtimeSession() {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
}

export async function addResponse(code: string, payload: { questionId: number; participantId: number | null; text: string; cards?: string[] }) {
  try {
    const res = await fetch('/api/responses/add', {
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
    console.error('Error adding response', error);
    return { success: false, error: 'Failed to add response' };
  }
}

export async function voteResponse(responseId: number, delta = 1) {
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

export async function addTimelineEntry(code: string, payload: { label: 'Now' | 'Next' | 'Later'; itemText: string; owner?: string; metric?: string; riskNote?: string }) {
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

export async function sendChatMessage(code: string, payload: { participantId: number | null; message: string }) {
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

export function getParticipantProfile(code: string) {
  if (!browser) return null;
  const raw = localStorage.getItem(`cda:participant:${code}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Invalid participant profile in storage');
    return null;
  }
}

export function storeParticipantProfile(code: string, profile: any) {
  if (!browser) return;
  localStorage.setItem(`cda:participant:${code}`, JSON.stringify(profile));
}

export function clearParticipantProfile(code: string) {
  if (!browser) return;
  localStorage.removeItem(`cda:participant:${code}`);
}
