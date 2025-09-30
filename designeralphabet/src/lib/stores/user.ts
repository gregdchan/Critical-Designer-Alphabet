import { browser } from '$app/environment';
import { writable } from 'svelte/store';

type UserRole = 'participant' | 'facilitator';

export type CurrentUser = {
  participantId: string;
  sessionCode: string;
  name: string;
  role: UserRole;
  color: string;
  email?: string;
};

const STORAGE_KEY = 'cda:current-user';

function readStoredUser(): CurrentUser | null {
  if (!browser) return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.participantId || !parsed?.sessionCode) return null;
    return parsed as CurrentUser;
  } catch (error) {
    console.warn('Failed to parse stored user profile');
    return null;
  }
}

export const currentUser = writable<CurrentUser | null>(readStoredUser());

if (browser) {
  currentUser.subscribe((value) => {
    if (!value) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  });
}

export function clearCurrentUser() {
  if (browser) {
    localStorage.removeItem(STORAGE_KEY);
  }
  currentUser.set(null);
}
