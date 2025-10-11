<script lang="ts">
	import PieChart from '$lib/components/charts/PieChart.svelte';
	import ParticipantJourneyChart from '$lib/components/charts/ParticipantJourneyChart.svelte';
	import type { ChartData } from '$lib/types/charts';
	import PhaseStackedBar from '$lib/components/charts/PhaseStackedBar.svelte';
	import PhaseTopIdeasBubbles from '$lib/components/charts/PhaseTopIdeasBubbles.svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	type ApiResponse = {
		success: boolean;
		session?: any;
		participants?: Array<{ id: string; name: string; color?: string }>;
		responses?: Array<{
			id: string;
			participant_id: string | null;
			question_id: string;
			text: string;
			votes: number;
			createdAt?: string;
			created_at?: string;
			questions?: { text?: string; section?: string } | null;
		}>;
		questions?: any[];
		error?: string;
	};

	let sessionCode = '';
	let loading = false;
	let error = '';
	let participants: Array<{ id: string; name: string; color?: string }> = [];
	let responses: ApiResponse['responses'] = [];
	let selectedParticipantId: string | null = null;
	let questions: any[] = [];
	let phases: any[] = [];

	$: selectedParticipant = participants.find((p) => p.id === selectedParticipantId) || null;

	async function loadSession() {
		error = '';
		if (!sessionCode || sessionCode.trim().length < 3) {
			error = 'Enter a valid session code';
			return;
		}
		loading = true;
		try {
			// Primary: rich dashboard API (has joined questions in responses)
			const res = await fetch(`/api/dashboard/${encodeURIComponent(sessionCode.trim())}`);
			let data: ApiResponse | null = null;
			try {
				data = await res.json();
			} catch {
				data = null;
			}

			if (data?.success) {
				participants = data.participants || [];
				responses = data.responses || [];
				questions = data.questions || [];
				phases = data.phases || [];
			} else {
				// Fallback: generic session API
				const alt = await fetch(`/api/session/${encodeURIComponent(sessionCode.trim())}`);
				const altData: any = await alt.json();
				if (!altData?.success) {
					throw new Error(altData?.error || data?.error || 'Failed to load session');
				}
				participants = altData.participants || [];
				responses = altData.responses || [];
				questions = altData.questions || [];
				phases = altData.phases || [];
			}
			// Only default-select if not already provided or invalid
			const hasExisting =
				selectedParticipantId && participants.some((p) => p.id === selectedParticipantId);
			if (!hasExisting) {
				selectedParticipantId = participants[0]?.id ?? null;
			}
		} catch (e: any) {
			error = e?.message || 'Failed to load session';
		} finally {
			loading = false;
		}
	}

	// Derived data for charts
	$: participantResponses = (responses || []).filter(
		(r) => r.participant_id === selectedParticipantId
	);

	// Pull query params to prefill
	let hasLoadedFromParams = false;
	$: {
		if (browser) {
			const url = $page?.url;
			if (url && !hasLoadedFromParams) {
				const code = url.searchParams.get('code');
				const pid = url.searchParams.get('participant');
				if (code && code !== sessionCode) {
					sessionCode = code;
					hasLoadedFromParams = true;
					// load session automatically
					loadSession();
				}
				if (pid && pid !== selectedParticipantId) {
					selectedParticipantId = pid;
				}
			}
		}
	}

	// Lens donut data (PieChart)
	let lensDonut: ChartData = {
		title: 'Lens Profile',
		series: [{ id: 'lenses', points: [] }]
	};

	$: {
		lensDonut = {
			title: 'Lens Profile',
			series: [
				{
					id: 'lenses',
					points: Object.entries(
						participantResponses.reduce((acc: Record<string, number>, r) => {
							const lens = (r.questions?.section || 'General') as string;
							acc[lens] = (acc[lens] || 0) + 1;
							return acc;
						}, {})
					)
						.map(([label, value]) => ({ id: label, label, value }))
						.sort((a, b) => b.value - a.value)
				}
			]
		};
	}

	// Journey points
	const qPhaseMap = () => {
		const map = new Map<string, string>();
		// Create a lookup from phase_key to phase title
		const phaseKeyToTitle = new Map<string, string>();
		for (const phase of phases || []) {
			if (phase?.phase_key && phase?.title) {
				phaseKeyToTitle.set(phase.phase_key, phase.title);
			}
		}
		
		// Map question IDs to phase titles (not keys)
		for (const q of questions || []) {
			if (q?.id && q?.phase_key) {
				const phaseTitle = phaseKeyToTitle.get(q.phase_key) || q.phase_key;
				map.set(q.id, phaseTitle);
			}
		}
		return map;
	};

	$: journeyPoints = participantResponses
		.map((r) => ({
			t: new Date(r.createdAt || r.created_at || Date.now()),
			lens: (r.questions?.section || 'General') as string,
			text: r.questions?.text || r.text,
			votes: r.votes || 0,
			phase: qPhaseMap().get(r.question_id) || undefined
		}))
		.sort((a, b) => a.t.getTime() - b.t.getTime());

	// Phase engagement stacked data
	$: phaseStacks = (() => {
		const map = new Map<string, Map<string, number>>(); // phase -> lens -> count
		const phaseMap = qPhaseMap();
		for (const r of participantResponses) {
			const phase = phaseMap.get(r.question_id) || 'Unassigned';
			const lens = (r.questions?.section || 'General') as string;
			if (!map.has(phase)) map.set(phase, new Map());
			const inner = map.get(phase)!;
			inner.set(lens, (inner.get(lens) || 0) + 1);
		}
		// preserve discovery order by first appearance time
		const order = Array.from(
			new Set(participantResponses.map((r) => phaseMap.get(r.question_id) || 'Unassigned'))
		);
		return order
			.filter((p) => !!p)
			.map((phase) => ({
				phase: phase as string,
				stacks: Array.from(map.get(phase as string)?.entries() || []).map(([lens, value]) => ({
					lens,
					value
				}))
			}));
	})();

	// Top ideas by phase (session‑wide, not just this participant)
	$: phaseIdeas = (() => {
		const phaseMap = qPhaseMap();
		const grouped = new Map<string, any[]>();
		for (const r of responses || []) {
			const phase = phaseMap.get(r.question_id) || 'Unassigned';
			const arr = grouped.get(phase) || [];
			arr.push({
				id: r.id,
				label: r.text || '(no text)',
				votes: Number(r.votes || 0),
				participantId: r.participant_id || null,
				participantName: participants.find((p) => p.id === r.participant_id)?.name || null,
				lens: (r.questions?.section || null) as any
			});
			grouped.set(phase, arr);
		}
		const topN = 6;
		return Array.from(grouped.entries()).map(([phase, items]) => ({
			phase,
			items: items.sort((a: any, b: any) => b.votes - a.votes).slice(0, topN)
		}));
	})();
</script>

<section class="mx-auto max-w-[1200px] px-4 py-8 space-y-6">
	<header class="flex items-end justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold text-ink">Participant Story (beta)</h1>
			<p class="text-sm text-ink-2">Explore one person’s journey across lenses and questions.</p>
		</div>
		<form class="flex items-center gap-2" on:submit|preventDefault={loadSession}>
			<input
				class="rounded-md border border-line bg-surface-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-2 focus:border-brand focus:outline-none"
				placeholder="Session code (e.g., ABC123)"
				bind:value={sessionCode}
			/>
			<button class="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
				>Load</button
			>
		</form>
	</header>

	{#if error}
		<div class="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
			{error}
		</div>
	{/if}

	{#if loading}
		<div class="rounded-lg border border-line bg-surface-elevated p-6 text-ink-2">Loading…</div>
	{/if}

	{#if !loading && participants.length > 0}
		<div class="flex flex-wrap items-center gap-3">
			<label for="participant-select" class="text-sm text-ink-2">Participant</label>
			<select
				id="participant-select"
				class="rounded-md border border-line bg-surface-elevated px-3 py-2 text-sm"
				bind:value={selectedParticipantId}
			>
				{#each participants as p}
					<option value={p.id}>{p.name || 'Anonymous'}</option>
				{/each}
			</select>
		</div>

		<div class="mt-6 grid gap-6 md:grid-cols-2">
			<div class="rounded-2xl border border-line bg-surface-elevated p-4">
				<h2 class="mb-3 text-sm font-semibold text-ink">Lens Profile</h2>
				<div class="h-[320px]">
					<PieChart data={lensDonut} title="Lens Profile" />
				</div>
			</div>

			<div class="rounded-2xl border border-line bg-surface-elevated p-4">
				<h2 class="mb-3 text-sm font-semibold text-ink">Journey</h2>
				<div class="h-[320px]">
					<ParticipantJourneyChart title="Journey" points={journeyPoints} />
				</div>
			</div>
		</div>

		<!-- Phase engagement skew -->
		{#if phaseStacks.length > 0}
			<div class="rounded-2xl border border-line bg-surface-elevated p-4 mt-6">
				<h2 class="mb-3 text-sm font-semibold text-ink">Phase Engagement</h2>
				<div class="h-[320px]">
					<PhaseStackedBar title="Phase Engagement" data={phaseStacks} />
				</div>
			</div>
		{/if}

		<!-- Top ideas by phase (most popular) -->
		{#if phaseIdeas.length > 0}
			{@const mobileHeight = phaseIdeas.length * 366 + 64}
			<div class="rounded-2xl border border-line bg-surface-elevated p-4 mt-6">
				<h2 class="mb-3 text-sm font-semibold text-ink">Most Popular Ideas by Phase</h2>
				<!-- Increase height on mobile to accommodate taller phase cells -->
				<div class="phase-bubbles-container" style="--mobile-height: {mobileHeight}px;">
					<PhaseTopIdeasBubbles
						title="Top Ideas"
						data={phaseIdeas}
						highlightParticipantId={selectedParticipantId}
					/>
				</div>
			</div>
		{/if}

		{#if selectedParticipant}
			<div class="mt-4 text-xs text-ink-2">
				Showing responses for <span class="text-ink font-medium">{selectedParticipant.name}</span>
			</div>
		{/if}
	{/if}
</section>

<style>
	.text-ink {
		color: hsl(var(--text-primary));
	}
	.text-ink-2 {
		color: hsl(var(--text-muted));
	}
	.bg-surface-elevated {
		background: hsl(var(--surface-elevated));
	}
	.border-line {
		border-color: hsl(var(--border-subtle));
	}
	.phase-bubbles-container {
		height: 420px;
	}
	@media (max-width: 640px) {
		.phase-bubbles-container {
			/* Dynamic height based on number of phases */
			height: var(--mobile-height, 1200px);
			min-height: 800px;
			overflow: visible;
		}
	}
</style>
