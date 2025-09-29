import { derived, writable } from 'svelte/store';

export const stepOrder = [
  'setup',
  'draw',
  'ideate',
  'integrate',
  'positionality',
  'justice',
  'prototype',
  'feedback',
  'commit'
] as const;

export type SessionStep = (typeof stepOrder)[number];

export type PresenceSnapshot = {
  clientId: string;
  nickname: string;
  color: string;
  role: 'participant' | 'facilitator';
  cursor?: { x: number; y: number } | null;
  lastActive: number;
};

export type TimerState = {
  secs: number;
  running: boolean;
  updatedAt: number;
};

export type PointLedger = Record<string, number>;

export const step = writable<SessionStep>('setup');
export const timer = writable<TimerState>({ secs: 0, running: false, updatedAt: Date.now() });
export const selection = writable<string[]>([]);
export const presence = writable<Record<string, PresenceSnapshot>>({});
export const points = writable<PointLedger>({});
export const fairnessMultiplier = writable(1);
export const optInTelemetry = writable<boolean>(false);

export const presenceList = derived(presence, ($presence) => Object.values($presence));

export const leaderboard = derived(points, ($points) =>
  Object.entries($points)
    .map(([id, value]) => ({ id, points: value }))
    .sort((a, b) => b.points - a.points)
);

export function resetSessionStores() {
  step.set('setup');
  timer.set({ secs: 0, running: false, updatedAt: Date.now() });
  selection.set([]);
  presence.set({});
  points.set({});
  fairnessMultiplier.set(1);
}

export function awardPoints(participantId: string, delta: number) {
  if (!participantId || Number.isNaN(delta)) return;
  points.update((ledger) => ({
    ...ledger,
    [participantId]: (ledger[participantId] ?? 0) + delta
  }));
}

export function updateFairnessMultiplier(participantsWhoContributed: number, totalParticipants: number, distinctCards = 0) {
  if (!totalParticipants) {
    fairnessMultiplier.set(1);
    return;
  }

  let multiplier = 1;
  const contributionRate = participantsWhoContributed / totalParticipants;
  if (contributionRate >= 0.7) {
    multiplier *= 1.2;
  }
  if (distinctCards >= 3) {
    multiplier *= 1.1;
  }

  fairnessMultiplier.set(Number(multiplier.toFixed(2)));
}
