<script lang="ts">
	import { onMount } from 'svelte';
	import { useResponses, useQuestions } from '$lib/hooks/useSupabaseRealtime';
	import LineChart from './LineChart.svelte';

	export let roomCode: string;
	export let questionId: string;
	export let width = 800;
	export let height = 400;

	let data: Array<{ value: number; count: number }> = [];
	let scaleSettings = { min: 0, max: 10, minLabel: 'Min', maxLabel: 'Max' };
	let totalResponses = 0;
	let loading = true;
	let error: string | null = null;

	let responses: any[] = [];
	let questions: any[] = [];

	onMount(() => {
		useResponses(roomCode, (state) => {
			responses = state.data;
			loading = state.loading;
			error = state.error;
			updateData();
		});

		useQuestions(roomCode, (state) => {
			questions = state.data;
			updateData();
		});
	});

	function updateData() {
		if (!questionId || !responses.length || !questions.length) {
			if (!loading) {
				data = [];
			}
			return;
		}

		const questionData = questions.find((q) => q.id === questionId);
		if (!questionData) {
			data = [];
			return;
		}

		scaleSettings = questionData.scale || { min: 0, max: 10, minLabel: 'Min', maxLabel: 'Max' };
		const questionResponses = responses.filter((r) => r.question_id === questionId);

		// Count occurrences of each value
		const valueCounts = new Map<number, number>();
		questionResponses.forEach((response) => {
			const value = typeof response.value === 'string' ? parseFloat(response.value) : response.value;
			if (!isNaN(value)) {
				valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
			}
		});

		// Convert to array and sort
		data = Array.from(valueCounts.entries())
			.map(([value, count]) => ({ value, count }))
			.sort((a, b) => a.value - b.value);

		totalResponses = data.reduce((sum, d) => sum + d.count, 0);
	}
</script>

<div class="realtime-chart-wrapper">
	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading chart data...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>Error: {error}</p>
		</div>
	{:else}
		<LineChart {data} {scaleSettings} {totalResponses} {width} {height} roomCode="" questionId="" />
	{/if}
</div>

<style>
	.realtime-chart-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		gap: 1rem;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 4px solid rgb(6, 182, 212);
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-state p,
	.error-state p {
		color: rgb(148, 163, 184);
		font-size: 0.875rem;
	}

	.error-state p {
		color: rgb(239, 68, 68);
	}
</style>
