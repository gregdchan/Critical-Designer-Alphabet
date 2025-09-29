import { writable } from 'svelte/store';

export type TimerState = {
  secs: number;
  running: boolean;
};

export function createTimer(initialSecs = 900) {
  const { subscribe: baseSubscribe, set, update } = writable<TimerState>({
    secs: initialSecs,
    running: false
  });
  let interval: ReturnType<typeof setInterval> | null = null;
  let baseSeconds = initialSecs;

  function clear() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function tick() {
    update((state) => {
      if (!state.running) {
        return state;
      }

      const next = state.secs - 1;
      if (next <= 0) {
        clear();
        return { secs: 0, running: false };
      }

      return { ...state, secs: next };
    });
  }

  function start() {
    update((state) => {
      if (!interval) {
        interval = setInterval(tick, 1000);
      }

      return { ...state, running: true };
    });
  }

  function pause() {
    clear();
    update((state) => ({ ...state, running: false }));
  }

  function reset(nextSeconds = baseSeconds) {
    baseSeconds = nextSeconds;
    clear();
    set({ secs: nextSeconds, running: false });
  }

  function setSeconds(nextSeconds: number) {
    baseSeconds = nextSeconds;
    update((state) => ({ ...state, secs: nextSeconds }));
  }

  function subscribe(run: (value: TimerState) => void) {
    const unsubscribe = baseSubscribe(run);
    return () => {
      unsubscribe();
      clear();
    };
  }

  return {
    subscribe,
    start,
    pause,
    reset,
    setSeconds,
    stop: clear
  };
}
