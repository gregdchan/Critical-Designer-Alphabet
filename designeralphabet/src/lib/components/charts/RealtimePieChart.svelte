<script lang="ts">
	import { onMount } from 'svelte';
	import { useResponses, useQuestions } from '$lib/hooks/useSupabaseRealtime';
	import PieChart from './PieChart.svelte';

	export let roomCode: string;
	export let questionId: string;
	export let width = 400;
	export let height = 400;
	export let showLegend = true;

	let data: Array<{ label: string; value: number; percentage: number }> = [];
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

		const questionResponses = responses.filter((r) => r.question_id === questionId);
		const options = questionData.options || [];

		const responseCounts = options.map((option: string) => {
			const count = questionResponses.filter((r) => {
				try {
					const value = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
					return Array.isArray(value) ? value.includes(option) : value === option;
				} catch {
					return r.value === option;
				}
			}).length;
			return { label: option, value: count };
		});

		const totalCount = responseCounts.reduce((sum, rc) => sum + rc.value, 0);

		data = responseCounts
			.filter((rc) => rc.value > 0)
			.map((rc) => ({
				label: rc.label,
				value: rc.value,
				percentage: totalCount > 0 ? (rc.value / totalCount) * 100 : 0
			}));
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
		<PieChart {data} {width} {height} {showLegend} roomCode="" questionId="" />
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
