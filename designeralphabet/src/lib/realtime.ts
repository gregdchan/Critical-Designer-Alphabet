import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export interface WorkshopData {
  participants: any[];
  responses: any[];
  timeline: any[];
  session: any;
}

// Real-time data stores
export const participants = writable<any[]>([]);
export const responses = writable<any[]>([]);
export const timeline = writable<any[]>([]);
export const session = writable<any>({});

// Polling intervals
const POLL_INTERVAL = 5000; // 5 seconds
let pollingIntervals: NodeJS.Timeout[] = [];

export function startRealTimePolling(sessionCode: string) {
  if (!browser) return;

  stopRealTimePolling();

  // Poll participants
  const participantsInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/participants/${sessionCode}`);
      const data = await response.json();
      if (data.success) {
        participants.set(data.participants);
      }
    } catch (error) {
      console.error('Error polling participants:', error);
    }
  }, POLL_INTERVAL);

  // Poll responses
  const responsesInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/responses/${sessionCode}`);
      const data = await response.json();
      if (data.success) {
        responses.set(data.responses);
      }
    } catch (error) {
      console.error('Error polling responses:', error);
    }
  }, POLL_INTERVAL);

  // Poll timeline
  const timelineInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/timeline/${sessionCode}`);
      const data = await response.json();
      if (data.success) {
        timeline.set(data.timeline);
      }
    } catch (error) {
      console.error('Error polling timeline:', error);
    }
  }, POLL_INTERVAL);

  pollingIntervals = [participantsInterval, responsesInterval, timelineInterval];

  // Initial load
  loadInitialData(sessionCode);
}

export function stopRealTimePolling() {
  pollingIntervals.forEach(interval => clearInterval(interval));
  pollingIntervals = [];
}

async function loadInitialData(sessionCode: string) {
  try {
    const [participantsRes, responsesRes, timelineRes] = await Promise.all([
      fetch(`/api/participants/${sessionCode}`),
      fetch(`/api/responses/${sessionCode}`),
      fetch(`/api/timeline/${sessionCode}`)
    ]);

    const [participantsData, responsesData, timelineData] = await Promise.all([
      participantsRes.json(),
      responsesRes.json(),
      timelineRes.json()
    ]);

    if (participantsData.success) participants.set(participantsData.participants);
    if (responsesData.success) responses.set(responsesData.responses);
    if (timelineData.success) timeline.set(timelineData.timeline);
  } catch (error) {
    console.error('Error loading initial data:', error);
  }
}

// Helper functions for API calls
export async function addResponse(sessionCode: string, response: any) {
  try {
    const res = await fetch('/api/responses/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: sessionCode, ...response })
    });
    return await res.json();
  } catch (error) {
    console.error('Error adding response:', error);
    return { success: false, error: 'Failed to add response' };
  }
}

export async function voteResponse(responseId: number) {
  try {
    const res = await fetch('/api/responses/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responseId })
    });
    return await res.json();
  } catch (error) {
    console.error('Error voting response:', error);
    return { success: false, error: 'Failed to vote' };
  }
}

export async function addTimelineItem(sessionCode: string, item: any) {
  try {
    const res = await fetch('/api/timeline/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: sessionCode, ...item })
    });
    return await res.json();
  } catch (error) {
    console.error('Error adding timeline item:', error);
    return { success: false, error: 'Failed to add timeline item' };
  }
}

export async function joinSession(sessionCode: string, participant: any) {
  try {
    const res = await fetch('/api/participants/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: sessionCode, ...participant })
    });
    return await res.json();
  } catch (error) {
    console.error('Error joining session:', error);
    return { success: false, error: 'Failed to join session' };
  }
}
