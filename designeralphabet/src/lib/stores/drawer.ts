import { writable } from 'svelte/store';

export const drawerOpen = writable(false);

export function getDrawerStore() {
	return {
		open: () => drawerOpen.set(true),
		close: () => drawerOpen.set(false),
		toggle: () => drawerOpen.update((n) => !n)
	};
}
