<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let durationMinutes = 5;
	export let label = 'Reflection Time';
	export let onComplete: () => void = () => {};
	export let autoStart = true;

	let secondsRemaining = durationMinutes * 60;
	let isActive = false;
	let intervalId: ReturnType<typeof setInterval> | null = null;

	$: minutes = Math.floor(secondsRemaining / 60);
	$: seconds = secondsRemaining % 60;
	$: progressPercent = ((durationMinutes * 60 - secondsRemaining) / (durationMinutes * 60)) * 100;

	function start() {
		if (isActive) return;
		isActive = true;
		intervalId = setInterval(() => {
			if (secondsRemaining > 0) {
				secondsRemaining -= 1;
			} else {
				stop();
				onComplete();
			}
		}, 1000);
	}

	function pause() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
		isActive = false;
	}

	function reset() {
		pause();
		secondsRemaining = durationMinutes * 60;
	}

	function stop() {
		pause();
		secondsRemaining = 0;
	}

	onMount(() => {
		if (autoStart) {
			start();
		}
	});

	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});

	$: isWarning = secondsRemaining <= 60 && secondsRemaining > 0;
	$: isComplete = secondsRemaining === 0;
</script>

<div
	class="reflection-timer relative overflow-hidden rounded-2xl border-2 border-line bg-surface-muted p-6 shadow-lg"
	class:border-yellow-500={isWarning}
	class:border-green-500={isComplete}
	role="timer"
	aria-label="{label} - {minutes} minutes {seconds} seconds remaining"
>
	<!-- Background progress bar -->
	<div
		class="absolute inset-0 bg-brand/10 transition-all duration-1000 ease-linear"
		style="width: {progressPercent}%"
	/>

	<!-- Content -->
	<div class="relative z-10">
		<!-- Label -->
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-xl font-bold text-ink">{label}</h3>
			{#if isWarning}
				<span class="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-500">
					⚠️ Final Minute
				</span>
			{:else if isComplete}
				<span class="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-500">
					✓ Complete
				</span>
			{:else}
				<span class="rounded-full bg-brand/20 px-3 py-1 text-xs font-semibold text-brand">
					🕐 In Progress
				</span>
			{/if}
		</div>

		<!-- Timer Display -->
		<div class="mb-6 text-center">
			<div
				class="text-6xl font-bold tabular-nums text-ink"
				class:text-yellow-500={isWarning}
				class:text-green-500={isComplete}
			>
				{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
			</div>
			<div class="mt-2 text-sm text-ink-muted">
				{#if isComplete}
					Reflection time complete - you may now respond
				{:else if isWarning}
					Wrap up your thoughts...
				{:else}
					Take time to reflect before responding
				{/if}
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="mb-4 h-2 overflow-hidden rounded-full bg-surface">
			<div
				class="h-full transition-all duration-1000 ease-linear"
				class:bg-brand={!isWarning && !isComplete}
				class:bg-yellow-500={isWarning}
				class:bg-green-500={isComplete}
				style="width: {progressPercent}%"
			/>
		</div>

		<!-- Controls -->
		<div class="flex gap-3">
			{#if !isActive && !isComplete}
				<button
					on:click={start}
					class="flex-1 rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand/90"
				>
					▶️ Start
				</button>
			{:else if isActive}
				<button
					on:click={pause}
					class="flex-1 rounded-lg border border-line bg-surface px-4 py-2 font-semibold text-ink transition hover:bg-surface-elevated"
				>
					⏸️ Pause
				</button>
			{/if}
			<button
				on:click={reset}
				class="rounded-lg border border-line bg-surface px-4 py-2 font-semibold text-ink transition hover:bg-surface-elevated"
			>
				🔄 Reset
			</button>
		</div>
	</div>
</div>

<style>
	.reflection-timer {
		min-width: 300px;
	}
</style>
