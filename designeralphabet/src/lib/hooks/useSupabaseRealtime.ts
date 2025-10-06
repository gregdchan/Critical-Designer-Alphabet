import { supabase } from '$lib/supabase';
import { onDestroy } from 'svelte';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
	table: string;
	roomCode: string;
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
	const { table, roomCode, filter = {}, select = '*' } = options;
	let channel: RealtimeChannel | null = null;

	// Initial state
	setState({
		data: [],
		loading: true,
		error: null
	});

	async function initializeData() {
		try {
			setState(state => ({ ...state, loading: true, error: null }));

			let query = supabase.from(table).select(select);

			// Apply room code filter
			if (roomCode) {
				query = query.eq('session_code', roomCode.toUpperCase());
			}

			// Apply additional filters
			Object.entries(filter).forEach(([key, value]) => {
				query = query.eq(key, value);
			});

			const { data, error } = await query;

			if (error) {
				console.error(`Error fetching ${table}:`, error);
				setState(state => ({
					...state,
					loading: false,
					error: error.message
				}));
				return;
			}

			setState({
				data: data || [],
				loading: false,
				error: null
			});
		} catch (err) {
			console.error(`Unexpected error fetching ${table}:`, err);
			setState(state => ({
				...state,
				loading: false,
				error: err instanceof Error ? err.message : 'Unknown error'
			}));
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
						filter: roomCode ? `session_code=eq.${roomCode.toUpperCase()}` : undefined
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
				query = query.eq('session_code', roomCode.toUpperCase());
			}

			Object.entries(filter).forEach(([key, value]) => {
				query = query.eq(key, value);
			});

			const { data, error } = await query;

			if (error) {
				console.error(`Error refreshing ${table}:`, error);
				setState(state => ({
					...state,
					error: error.message
				}));
				return;
			}

			setState(state => ({
				...state,
				data: data || [],
				error: null
			}));
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
			select: '*, participants!inner(name), questions!inner(section, text, lens, response_type, map_type)'
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
		cleanup.forEach(fn => fn());
	});

	return {
		refreshAll: () => cleanup.forEach(fn => fn())
	};
}