import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import { supabase } from './supabase';

const SESSION_COOKIE = 'cda-session';
const SESSION_STORAGE_KEY = 'cda-session';
const PARTICIPANT_KEY_PREFIX = 'cda:participant:';

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
  payload: { label: 'Now' | 'Next' | 'Later'; itemText: string; owner?: string; metric?: string; riskNote?: string }
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
    } catch (error) {
      console.warn('Invalid participant profile encountered');
    }
  }

  return null;
}

export function storeParticipantProfile(code: string, profile: any) {
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
