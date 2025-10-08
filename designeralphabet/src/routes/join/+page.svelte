<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import {
		IconUserPlus as UserPlus,
		IconPalette as Palette,
		IconArrowLeft as ArrowLeft,
		IconInfoCircle as InfoCircle
	} from '@tabler/icons-svelte';
	import { currentUser } from '$lib/stores/user';
	import sanityClient from '$lib/sanity';
	import { storeParticipantProfile } from '$lib/realtime';

	export let data: { code: string };

	let participantName = '';
	let sessionCode = '';
	let selectedColor = '#00ffff'; // Default to neon cyan
	let loading = false;
	let previewLoading = false;
	let previewError = '';
	let sessionPreview: {
		title?: string | null;
		challenge?: string | null;
		template_slug?: string | null;
	} | null = null;
	let templateBlueprint: {
		title?: string;
		description?: string;
		challenge?: string;
		lenses?: string[];
	} | null = null;
	let lastPreviewCode = '';
	let previewRequestId = 0;
	let activeSessions: Array<{
		code: string;
		title: string | null;
		status: string;
		created_at: string;
	}> = [];
	let activeLoading = true;
	let activeError = '';
	let joinAsFacilitator = false;
	let facilitatorEmail = '';
	let facilitatorSessions: Array<{
		code: string;
		title: string | null;
		status: string;
		created_at: string;
	}> = [];
	let facilitatorLoading = false;
	let facilitatorError = '';
	let lastFacilitatorEmail = '';

	const avatarColors = [
		{ name: 'Neon Cyan', value: '#00ffff' },
		{ name: 'Neon Pink', value: '#ff00ff' },
		{ name: 'Neon Lime', value: '#39ff14' },
		{ name: 'Electric Blue', value: '#0080ff' },
		{ name: 'Hot Pink', value: '#ff1493' },
		{ name: 'Lime Green', value: '#32cd32' },
		{ name: 'Orange Red', value: '#ff4500' },
		{ name: 'Purple', value: '#8a2be2' },
		{ name: 'Gold', value: '#ffd700' },
		{ name: 'Spring Green', value: '#00ff7f' }
	];

	onMount(() => {
		loadActiveSessions();
		if (data.code) {
			sessionCode = data.code.toUpperCase();
		}
	});

	function goHome() {
		goto('/');
	}

	$: if (browser) {
		const normalized = sessionCode.trim().toUpperCase();
		if (normalized.length === 6 && normalized !== lastPreviewCode) {
			lastPreviewCode = normalized;
			loadPreview(normalized);
		} else if (normalized.length !== 6 && lastPreviewCode) {
			lastPreviewCode = '';
			previewRequestId += 1;
			sessionPreview = null;
			templateBlueprint = null;
			previewError = '';
			previewLoading = false;
		}
	}

	$: if (browser) {
		if (joinAsFacilitator) {
			const normalizedEmail = facilitatorEmail.trim().toLowerCase();
			if (normalizedEmail && normalizedEmail !== lastFacilitatorEmail) {
				lastFacilitatorEmail = normalizedEmail;
				loadFacilitatorSessions(normalizedEmail);
			} else if (!normalizedEmail) {
				lastFacilitatorEmail = '';
				facilitatorSessions = [];
				facilitatorError = '';
			}
		} else {
			lastFacilitatorEmail = '';
			facilitatorSessions = [];
			facilitatorError = '';
		}
	}

	async function loadPreview(code: string) {
		if (!browser) return;

		previewRequestId += 1;
		const requestKey = previewRequestId;
		previewLoading = true;
		previewError = '';
		sessionPreview = null;
		templateBlueprint = null;

		try {
			const response = await fetch(`/api/session/${code}`);
			const payload = await response.json();

			if (requestKey !== previewRequestId) {
				return;
			}

			if (!payload.success) {
				previewError = payload.error ?? 'Session not found. Check the code and try again.';
				return;
			}

			sessionPreview = payload.session ?? null;

			const slug = payload.session?.template_slug;
			if (slug) {
				try {
					const blueprint = await sanityClient.fetch(
						`*[_type == "workshopTemplate" && slug.current == $slug][0]{
              title,
              description,
              challenge,
              lenses
            }`,
						{ slug }
					);
					if (requestKey === previewRequestId) {
						templateBlueprint = blueprint ?? null;
					}
				} catch (error) {
					console.error('Failed to load template blueprint', error);
				}
			}
		} catch (error) {
			console.error('Failed to load session preview', error);
			if (requestKey === previewRequestId) {
				previewError = 'Unable to load session preview. Check the code and try again.';
			}
		} finally {
			if (requestKey === previewRequestId) {
				previewLoading = false;
			}
		}
	}

	async function loadActiveSessions() {
		activeLoading = true;
		activeError = '';
		try {
			const response = await fetch('/api/session/list');
			const payload = await response.json();
			if (!payload.success) {
				throw new Error(payload.error ?? 'Unable to load active sessions');
			}
			activeSessions = payload.sessions ?? [];
		} catch (error) {
			console.error('Failed to load active sessions', error);
			activeError = (error as Error).message ?? 'Unable to load active sessions';
		} finally {
			activeLoading = false;
		}
	}

	async function loadFacilitatorSessions(email: string) {
		facilitatorLoading = true;
		facilitatorError = '';
		try {
			const params = new URLSearchParams({ facilitatorEmail: email, status: 'planned,live,done' });
			const response = await fetch(`/api/session/list?${params.toString()}`);
			const payload = await response.json();
			if (!payload.success) {
				throw new Error(payload.error ?? 'Unable to load facilitator sessions');
			}
			facilitatorSessions = payload.sessions ?? [];
		} catch (error) {
			console.error('Failed to load facilitator sessions', error);
			facilitatorError = (error as Error).message ?? 'Unable to load facilitator sessions';
			facilitatorSessions = [];
		} finally {
			facilitatorLoading = false;
		}
	}

	function chooseSession(code: string) {
		sessionCode = code.toUpperCase();
		loadPreview(sessionCode);
	}

	async function joinSession() {
		if (!sessionCode) {
			alert('Please enter a session code');
			return;
		}

		if (!joinAsFacilitator && !participantName) {
			alert('Please enter your name');
			return;
		}

		if (joinAsFacilitator && !facilitatorEmail) {
			alert('Facilitator email is required');
			return;
		}

		loading = true;
		try {
			const uppercaseCode = sessionCode.toUpperCase();

			if (joinAsFacilitator) {
				const response = await fetch('/api/session/facilitator', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						code: uppercaseCode,
						email: facilitatorEmail.trim().toLowerCase(),
						name: participantName || facilitatorEmail,
						color: selectedColor
					})
				});

				const data = await response.json();
				if (!data.success) {
					throw new Error(data.error || 'Unable to authenticate facilitator');
				}

				if (browser && data.participant) {
					const profile = {
						participantId: data.participant.id as string,
						sessionCode: uppercaseCode,
						name: participantName || facilitatorEmail,
						email: facilitatorEmail.trim().toLowerCase(),
						role: 'facilitator' as const,
						color: selectedColor
					};
					currentUser.set(profile);
					storeParticipantProfile(uppercaseCode, profile);
				}
			} else {
				const response = await fetch('/api/participants/join', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						code: uppercaseCode,
						name: participantName,
						role: 'participant',
						color: selectedColor
					})
				});

				const data = await response.json();
				if (!data.success) {
					throw new Error(data.error || 'Failed to join session');
				}

				if (browser && data.participant) {
					const profile = {
						participantId: data.participant.id as string,
						sessionCode: uppercaseCode,
						name: participantName,
						role: 'participant' as const,
						color: selectedColor
					};
					currentUser.set(profile);
					storeParticipantProfile(uppercaseCode, profile);
				}
			}

			goto(`/session/${uppercaseCode}${joinAsFacilitator ? '?role=facilitator' : ''}`);
		} catch (error) {
			console.error('Error joining session:', error);
			alert((error as Error).message ?? 'Failed to join session. Please try again.');
		} finally {
			loading = false;
		}
	}
</script>

<div
	class="min-h-screen bg-gradient-to-br from-surface-muted via-surface to-white flex items-center justify-center p-6"
>
	<div class="w-full max-w-md">
		<!-- Back Navigation -->
		<button
			on:click={goHome}
			class="mb-4 flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
		>
			<ArrowLeft class="w-4 h-4" />
			Back to Home
		</button>

		<div
			class="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-cyan-400/20 shadow-2xl"
		>
			<header class="text-center mb-8">
				<div
					class="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4"
				>
					<UserPlus class="w-8 h-8 text-white" />
				</div>
				<h1
					class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2"
				>
					Join Session
				</h1>
				<p class="text-slate-300">Enter your details to join the session</p>
			</header>

			<form on:submit|preventDefault={joinSession} class="space-y-6">
				<div>
					<label for="participantName" class="block text-sm font-medium text-slate-300 mb-2">
						{joinAsFacilitator ? 'Facilitator Display Name (optional)' : 'Your Name'}
					</label>
					<input
						id="participantName"
						type="text"
						bind:value={participantName}
						placeholder="Enter your name"
						class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
						required={!joinAsFacilitator}
					/>
				</div>

				<div>
					<label for="sessionCode" class="block text-sm font-medium text-slate-300 mb-2">
						Session Code
					</label>
					<input
						id="sessionCode"
						type="text"
						bind:value={sessionCode}
						placeholder="Enter 6-character code"
						class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent font-mono text-lg tracking-wider uppercase transition-all"
						maxlength="6"
						required
					/>
				</div>

				<div
					class="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3"
				>
					<label class="flex items-center gap-2 text-sm text-slate-200">
						<input type="checkbox" bind:checked={joinAsFacilitator} />
						I'm joining as the session facilitator
					</label>
					{#if joinAsFacilitator}
						<button
							type="button"
							class="text-xs text-cyan-300 hover:text-cyan-100"
							on:click={() => activeSessions.length === 0 && loadActiveSessions()}
						>
							Refresh sessions
						</button>
					{/if}
				</div>

				{#if joinAsFacilitator}
					<div>
						<label for="facilitatorEmail" class="block text-sm font-medium text-slate-300 mb-2">
							Facilitator Email
						</label>
						<input
							id="facilitatorEmail"
							type="email"
							bind:value={facilitatorEmail}
							placeholder="you@example.org"
							class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
							required
						/>
						<p class="mt-2 text-xs text-slate-400">
							Use the same email you provided when launching the session to regain facilitator
							access.
						</p>
					</div>
				{/if}

				<div role="group" aria-labelledby="avatar-color-label">
					<p
						id="avatar-color-label"
						class="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300"
					>
						<Palette class="w-4 h-4" />
						Choose Your Avatar Color
					</p>
					<div class="grid grid-cols-5 gap-3">
						{#each avatarColors as color}
							<button
								type="button"
								on:click={() => (selectedColor = color.value)}
								class="w-12 h-12 rounded-full border-2 transition-all hover:scale-110 {selectedColor ===
								color.value
									? 'border-white ring-2 ring-cyan-400'
									: 'border-slate-600'}"
								style="background-color: {color.value}"
								title={color.name}
							>
								{#if selectedColor === color.value}
									<div class="w-full h-full rounded-full flex items-center justify-center">
										<div class="w-3 h-3 bg-white rounded-full"></div>
									</div>
								{/if}
							</button>
						{/each}
					</div>
					<p class="text-xs text-slate-400 mt-2 text-center">
						Selected: {avatarColors.find((c) => c.value === selectedColor)?.name}
					</p>
				</div>

				<div class="pt-4">
					<button
						type="submit"
						disabled={loading}
						class="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
					>
						{#if loading}
							<div
								class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
							></div>
							Joining...
						{:else}
							<UserPlus class="w-5 h-5" />
							Join Session
						{/if}
					</button>
				</div>
			</form>

			<div class="mt-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
				{#if previewLoading}
					<div class="flex items-center gap-3 text-slate-300 text-sm">
						<InfoCircle class="w-5 h-5 text-cyan-300 animate-pulse" />
						Loading session blueprint…
					</div>
				{:else if previewError}
					<div class="flex items-start gap-3 text-sm text-rose-300">
						<InfoCircle class="w-5 h-5 flex-shrink-0" />
						<span>{previewError}</span>
					</div>
				{:else if sessionPreview}
					<div class="space-y-4">
						<div>
							<p class="text-xs uppercase tracking-[0.3em] text-cyan-200">Session Blueprint</p>
							<h2 class="mt-2 text-lg font-semibold text-white">
								{sessionPreview.title ?? 'Untitled Session'}
							</h2>
							<p class="text-xs text-slate-400">Code: {sessionCode.toUpperCase()}</p>
						</div>

						{#if sessionPreview.challenge || templateBlueprint?.challenge}
							<div class="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-3">
								<p class="text-xs uppercase tracking-[0.3em] text-cyan-200">Challenge Focus</p>
								<p class="mt-2 text-sm text-slate-100">
									{sessionPreview.challenge ?? templateBlueprint?.challenge}
								</p>
							</div>
						{/if}

						{#if templateBlueprint?.description}
							<p class="text-sm text-slate-300 leading-relaxed">
								{templateBlueprint.description}
							</p>
						{/if}

						{#if templateBlueprint?.lenses?.length}
							<div>
								<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Lenses</p>
								<div class="mt-2 flex flex-wrap gap-2">
									{#each templateBlueprint.lenses as lens}
										<span
											class="px-3 py-1 rounded-full border border-purple-400/40 bg-purple-400/10 text-xs text-purple-200"
										>
											{lens}
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<p class="flex items-start gap-3 text-sm text-slate-300">
						<InfoCircle class="w-5 h-5 text-slate-400" />
						Enter a 6-character session code to preview the focus and lenses before joining.
					</p>
				{/if}
			</div>

			<div class="mt-8 pt-6 border-t border-slate-700">
				<p class="text-xs text-slate-400 text-center">
					Don't have a session code? Contact your session lead.
				</p>
			</div>
		</div>

		<div class="mt-6 rounded-2xl border border-slate-700 bg-slate-800/50 p-6 shadow-lg">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-white">Recent Active Sessions</h2>
				<button
					class="text-xs uppercase tracking-[0.2em] text-cyan-300 hover:text-cyan-100"
					type="button"
					on:click={loadActiveSessions}
				>
					Refresh
				</button>
			</div>
			{#if activeLoading}
				<div class="flex items-center justify-center py-6">
					<div
						class="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"
					></div>
					<span class="ml-3 text-slate-300">Loading sessions...</span>
				</div>
			{:else if activeError}
				<div class="text-center py-6">
					<p class="text-rose-300 mb-3">{activeError}</p>
					<button
						class="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
						on:click={loadActiveSessions}
					>
						Try Again
					</button>
				</div>
			{:else if activeSessions.length === 0}
				<p class="mt-4 text-sm text-slate-400 text-center py-4">
					No active sessions right now. Check back soon!
				</p>
			{:else}
				<div class="mt-4 grid gap-3">
					{#each activeSessions as session}
						<button
							type="button"
							class="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-left transition hover:border-cyan-400/40 hover:bg-slate-900/90"
							on:click={() => chooseSession(session.code)}
						>
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-1">
									<span class="text-sm font-semibold text-white">
										{session.title ?? 'Untitled Session'}
									</span>
									<span
										class="px-2 py-1 text-xs rounded-full {session.status === 'live'
											? 'bg-green-400/20 text-green-300'
											: 'bg-yellow-400/20 text-yellow-300'}"
									>
										{session.status}
									</span>
								</div>
								<div class="flex items-center gap-3 text-xs text-slate-400">
									<span class="font-mono">{session.code}</span>
									<span>{new Date(session.created_at).toLocaleDateString()}</span>
								</div>
							</div>
							<div class="text-cyan-400 text-sm">Join →</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Preview Avatar -->
		<div class="mt-6 bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-600">
			<p class="text-sm text-slate-300 text-center mb-3">Preview:</p>
			<div class="flex items-center justify-center gap-3">
				<div
					class="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-white font-semibold text-sm"
					style="background-color: {selectedColor}"
				>
					{participantName ? participantName.charAt(0).toUpperCase() : '?'}
				</div>
				<span class="text-white font-medium">
					{participantName || 'Your Name'}
				</span>
			</div>
		</div>
	</div>
</div>
