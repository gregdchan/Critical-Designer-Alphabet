<script lang="ts">
	import RealtimeBarChart from '$lib/components/charts/RealtimeBarChart.svelte';
	import RealtimePieChart from '$lib/components/charts/RealtimePieChart.svelte';
	import RealtimeLineChart from '$lib/components/charts/RealtimeLineChart.svelte';

	let roomCode = '1CKADZ'; // Replace with your test session code
	let questionId = ''; // You'll need to get a question ID from your database

	// For testing, you can set these manually or fetch from Supabase
</script>

<div class="test-page">
	<h1>Realtime Charts Test</h1>

	<div class="controls">
		<label>
			Room Code:
			<input type="text" bind:value={roomCode} placeholder="e.g. 1CKADZ" />
		</label>
		<label>
			Question ID:
			<input type="text" bind:value={questionId} placeholder="Enter question UUID" />
		</label>
	</div>

	{#if roomCode && questionId}
		<div class="charts-grid">
			<div class="chart-container">
				<h2>Bar Chart</h2>
				<RealtimeBarChart {roomCode} {questionId} width={800} height={400} />
			</div>

			<div class="chart-container">
				<h2>Pie Chart</h2>
				<RealtimePieChart {roomCode} {questionId} width={400} height={400} />
			</div>

			<div class="chart-container">
				<h2>Line Chart</h2>
				<RealtimeLineChart {roomCode} {questionId} width={800} height={400} />
			</div>
		</div>
	{:else}
		<p class="instructions">Enter a room code and question ID to test the realtime charts.</p>
	{/if}
</div>

<style>
	.test-page {
		padding: 2rem;
		min-height: 100vh;
		background: linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59));
		color: white;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 2rem;
		color: rgb(6, 182, 212);
	}

	.controls {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.5rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		color: rgb(148, 163, 184);
		font-size: 0.875rem;
	}

	input {
		padding: 0.5rem;
		background: rgb(30, 41, 59);
		border: 1px solid rgb(51, 65, 85);
		border-radius: 0.25rem;
		color: white;
		font-family: 'Courier New', monospace;
	}

	input:focus {
		outline: none;
		border-color: rgb(6, 182, 212);
	}

	.charts-grid {
		display: grid;
		gap: 2rem;
	}

	.chart-container {
		padding: 1.5rem;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgb(51, 65, 85);
		border-radius: 0.5rem;
	}

	.chart-container h2 {
		margin-bottom: 1rem;
		font-size: 1.25rem;
		color: rgb(148, 163, 184);
	}

	.instructions {
		padding: 2rem;
		text-align: center;
		color: rgb(148, 163, 184);
		font-size: 1.125rem;
	}
</style>
