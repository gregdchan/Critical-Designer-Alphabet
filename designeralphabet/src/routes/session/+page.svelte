<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { get, writable } from 'svelte/store';
	import { IconUsers, IconPresentationAnalytics, IconSparkles } from '@tabler/icons-svelte';
	import { clearParticipantProfile } from '$lib/realtime';

	// Store for session info
	const sessionInfo = writable<{ code: string } | null>(null);

	// Check for session persistence and auto-redirect
	onMount(() => {
		let sessionData: string | null = null;
		if (typeof sessionStorage !== 'undefined') {
			sessionData = sessionStorage.getItem('cda-session');
		}
		if (!sessionData && typeof document !== 'undefined') {
			const match = document.cookie.match(/cda-session=([^;]+)/);
			if (match) sessionData = decodeURIComponent(match[1]);
		}
		if (sessionData) {
			try {
				const session = JSON.parse(sessionData);
				if (session && session.code) {
					sessionInfo.set({ code: session.code });
					// If not already on the session page, redirect
					if (!window.location.pathname.startsWith(`/session/${session.code}`)) {
						goto(`/session/${session.code}`);
					}
				}
			} catch (e) {
				sessionInfo.set(null);
			}
		} else {
			sessionInfo.set(null);
		}
	});

	function leaveSession() {
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.removeItem('cda-session');
		}
		if (typeof document !== 'undefined') {
			document.cookie = 'cda-session=; Max-Age=0; path=/';
		}
		const active = get(sessionInfo);
		if (active?.code) {
			clearParticipantProfile(active.code);
		}
		sessionInfo.set(null);
		goto('/session');
	}

	function openFacilitator() {
		goto('/facilitator');
	}

	function openJoin() {
		goto('/join');
	}

	function openPresentation() {
		const info = get(sessionInfo);
		if (info?.code) {
			if (typeof window !== 'undefined') {
				window.open(`/presentation?code=${info.code}`, '_blank');
			}
		} else {
			goto('/presentation');
		}
	}
</script>

{#if $sessionInfo}
	<div
		class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-brand/20 bg-white/85 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur"
	>
		<div class="flex items-center gap-2">
			<span class="inline-block h-3 w-3 rounded-full bg-success animate-pulse"></span>
			<span class="font-semibold text-slate-900">Session Active:</span>
			<span class="ml-1 font-mono text-brand-soft">{$sessionInfo.code}</span>
		</div>
		<button
			class="rounded-full border border-brand/30 bg-brand-soft/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-brand hover:bg-brand-soft hover:text-white transition"
			on:click={leaveSession}
		>
			Leave Session
		</button>
	</div>
{/if}

<div
	class="min-h-screen bg-gradient-to-br from-surface-muted via-surface to-slate-200 flex items-center justify-center p-6"
>
	<div class="max-w-4xl w-full space-y-10 text-center">
		<div class="space-y-4">
			<h1
				class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand to-secondary"
			>
				Live Session Arcade
			</h1>
			<p class="text-lg text-slate-600">
				Choose how you want to join the Critical Designer Alphabet experience. Facilitators launch
				sessions, participants dive into collaborative play, and the presentation view keeps the
				whole room in sync.
			</p>
		</div>

		<div class="grid gap-6 md:grid-cols-3">
			<button
				class="group panel flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-left text-slate-600 transition hover:-translate-y-1 hover:border-brand-soft/50 hover:shadow-lg"
				on:click={openFacilitator}
			>
				<IconSparkles class="h-10 w-10 text-brand" />
				<h2 class="text-lg font-semibold text-slate-900">Facilitator Console</h2>
				<p class="text-sm text-slate-600 group-hover:text-slate-500">
					Create a session, pick templates, and guide inclusive planning.
				</p>
			</button>

			<button
				class="group panel flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-left text-slate-600 transition hover:-translate-y-1 hover:border-secondary/40 hover:shadow-lg"
				on:click={openPresentation}
			>
				<IconPresentationAnalytics class="h-10 w-10 text-secondary" />
				<h2 class="text-lg font-semibold text-slate-900">Presentation View</h2>
				<p class="text-sm text-slate-600 group-hover:text-slate-500">
					Broadcast live stats, heatmaps, and QR join codes on the big screen.
				</p>
			</button>

			<button
				class="group panel flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-left text-slate-600 transition hover:-translate-y-1 hover:border-success/40 hover:shadow-lg"
				on:click={openJoin}
			>
				<IconUsers class="h-10 w-10 text-success" />
				<h2 class="text-lg font-semibold text-slate-900">Participant Join</h2>
				<p class="text-sm text-slate-600 group-hover:text-slate-500">
					Enter a code, pick a neon avatar, and start sharing inclusive insights.
				</p>
			</button>
		</div>
	</div>
</div>
