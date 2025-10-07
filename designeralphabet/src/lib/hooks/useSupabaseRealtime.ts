import { supabase } from '$lib/supabase';
import { onDestroy } from 'svelte';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
	table: string;
	roomCode: string;
	roomColumn?: string;
	filter?: Record<string, unknown>;
	select?: string;
}

interface RealtimeState<T> {
	data: T[];
	loading: boolean;
	error: string | null;
}

export function useSupabaseRealtime<T>(
	options: UseRealtimeOptions,
	setState: (state: RealtimeState<T>) => void
) {
	const { table, roomCode, roomColumn = 'room_code', filter = {}, select = '*' } = options;
	let channel: RealtimeChannel | null = null;
	let currentState: RealtimeState<T> = {
		data: [],
		loading: true,
		error: null
	};

	function updateState(patch: Partial<RealtimeState<T>>) {
		currentState = { ...currentState, ...patch };
		// Emit a shallow copy so consumers get a new reference each time
		setState({ ...currentState, data: [...currentState.data] });
	}

	// Initial state
	setState({ ...currentState, data: [...currentState.data] });

	async function initializeData() {
		try {
			updateState({ loading: true, error: null });

			let query = supabase.from(table).select(select);

			// Apply room code filter
			if (roomCode) {
				query = query.eq(roomColumn, roomCode.toUpperCase());
			}

			// Apply additional filters
			Object.entries(filter).forEach(([key, value]) => {
				query = query.eq(key, value);
			});

			const { data, error } = await query;

			if (error) {
				console.error(`Error fetching ${table}:`, error);
				updateState({ loading: false, error: error.message });
				return;
			}

			updateState({
				data: (data as T[]) ?? [],
				loading: false,
				error: null
			});
		} catch (err) {
			console.error(`Unexpected error fetching ${table}:`, err);
			updateState({
				loading: false,
				error: err instanceof Error ? err.message : 'Unknown error'
			});
		}
	}

	async function setupRealtimeSubscription() {
		try {
			const channelName = `${table}:${roomCode}`;
			channel = supabase.channel(channelName);

			channel
				.on(
					'postgres_changes',
					{
						event: '*',
						schema: 'public',
						table: table,
						filter: roomCode ? `${roomColumn}=eq.${roomCode.toUpperCase()}` : undefined
					},
					(payload) => {
						console.log(`Realtime update for ${table}:`, payload);
						// Refresh data on any change
						refreshData();
					}
				)
				.subscribe((status) => {
					console.log(`Realtime subscription status for ${table}:`, status);
				});
		} catch (err) {
			console.error(`Error setting up realtime subscription for ${table}:`, err);
		}
	}

	async function refreshData() {
		try {
			let query = supabase.from(table).select(select);

			if (roomCode) {
				query = query.eq(roomColumn, roomCode.toUpperCase());
			}

			Object.entries(filter).forEach(([key, value]) => {
				query = query.eq(key, value);
			});

			const { data, error } = await query;

			if (error) {
				console.error(`Error refreshing ${table}:`, error);
				updateState({ error: error.message });
				return;
			}

			updateState({
				data: (data as T[]) ?? [],
				error: null
			});
		} catch (err) {
			console.error(`Error refreshing ${table}:`, err);
		}
	}

	// Initialize
	initializeData();
	setupRealtimeSubscription();

	// Cleanup on destroy
	onDestroy(() => {
		if (channel) {
			supabase.removeChannel(channel);
		}
	});

	return {
		refresh: refreshData
	};
}

// Specialized hooks for common data types
export function useResponses(roomCode: string, setState: (state: RealtimeState<any>) => void) {
	return useSupabaseRealtime(
		{
			table: 'responses',
			roomCode,
			select:
				'*, participants!inner(name), questions!inner(section, text, lens, response_type, map_type)'
		},
		setState
	);
}

export function useParticipants(roomCode: string, setState: (state: RealtimeState<any>) => void) {
	return useSupabaseRealtime(
		{
			table: 'participants',
			roomCode,
			select: '*'
		},
		setState
	);
}

export function useTimeline(roomCode: string, setState: (state: RealtimeState<any>) => void) {
	return useSupabaseRealtime(
		{
			table: 'timeline',
			roomCode,
			select: '*'
		},
		setState
	);
}

export function useChat(roomCode: string, setState: (state: RealtimeState<any>) => void) {
	return useSupabaseRealtime(
		{
			table: 'chat',
			roomCode,
			select: '*, participants!inner(name)'
		},
		setState
	);
}

// Utility for managing multiple subscriptions
export function useMultipleRealtime<T extends Record<string, any>>(
	subscriptions: Array<{
		key: keyof T;
		table: string;
		roomCode: string;
		filter?: Record<string, unknown>;
		select?: string;
	}>,
	setState: (state: Partial<T>) => void
) {
	const cleanup: Array<() => void> = [];

	subscriptions.forEach(({ key, ...options }) => {
		const { refresh } = useSupabaseRealtime(options, (realtimeState) => {
			setState({ [key]: realtimeState } as Partial<T>);
		});

		cleanup.push(refresh);
	});

	onDestroy(() => {
		cleanup.forEach((fn) => fn());
	});

	return {
		refreshAll: () => cleanup.forEach((fn) => fn())
	};
}
