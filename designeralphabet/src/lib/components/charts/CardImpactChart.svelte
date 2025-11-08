<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import type { Response } from '$lib/gamification';

	export let responses: Response[] = [];
	export let title = 'Card Impact Analysis';
	export let height = 400;

	let chartContainer: HTMLDivElement;
	let cardStats: {
		card: string;
		usageCount: number;
		avgVotes: number;
		totalVotes: number;
		responseIds: string[];
	}[] = [];

	$: if (responses.length > 0) {
		calculateCardStats();
		renderChart();
	}

	function calculateCardStats() {
		const cardMap = new Map<
			string,
			{ count: number; votes: number; responseIds: string[] }
		>();

		responses.forEach((response) => {
			const cards = response.cards || [];
			cards.forEach((card) => {
				if (!cardMap.has(card)) {
					cardMap.set(card, { count: 0, votes: 0, responseIds: [] });
				}
				const stats = cardMap.get(card)!;
				stats.count += 1;
				stats.votes += response.votes || 0;
				stats.responseIds.push(response.id);
			});
		});

		cardStats = Array.from(cardMap.entries())
			.map(([card, stats]) => ({
				card,
				usageCount: stats.count,
				avgVotes: stats.count > 0 ? stats.votes / stats.count : 0,
				totalVotes: stats.votes,
				responseIds: stats.responseIds
			}))
			.sort((a, b) => b.usageCount - a.usageCount)
			.slice(0, 15); // Top 15 cards
	}

	function renderChart() {
		if (!chartContainer || cardStats.length === 0) return;

		// Clear previous chart
		d3.select(chartContainer).selectAll('*').remove();

		const margin = { top: 20, right: 120, bottom: 40, left: 150 };
		const width = chartContainer.clientWidth - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;

		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height)
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		// Scales
		const xScale = d3
			.scaleLinear()
			.domain([0, d3.max(cardStats, (d) => d.usageCount) || 10])
			.range([0, width]);

		const yScale = d3
			.scaleBand()
			.domain(cardStats.map((d) => d.card))
			.range([0, chartHeight])
			.padding(0.2);

		// Color scale for vote quality
		const colorScale = d3
			.scaleSequential()
			.domain([0, d3.max(cardStats, (d) => d.avgVotes) || 5])
			.interpolator(d3.interpolateViridis);

		// Bars
		svg
			.selectAll('.bar')
			.data(cardStats)
			.join('rect')
			.attr('class', 'bar')
			.attr('x', 0)
			.attr('y', (d) => yScale(d.card) || 0)
			.attr('width', (d) => xScale(d.usageCount))
			.attr('height', yScale.bandwidth())
			.attr('fill', (d) => colorScale(d.avgVotes))
			.attr('rx', 4)
			.style('opacity', 0.8)
			.on('mouseover', function (event, d) {
				d3.select(this).style('opacity', 1).style('cursor', 'pointer');
			})
			.on('mouseout', function () {
				d3.select(this).style('opacity', 0.8);
			});

		// Card labels (left)
		svg
			.selectAll('.label')
			.data(cardStats)
			.join('text')
			.attr('class', 'label')
			.attr('x', -10)
			.attr('y', (d) => (yScale(d.card) || 0) + yScale.bandwidth() / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', 'end')
			.attr('fill', 'currentColor')
			.style('font-size', '12px')
			.style('font-weight', '500')
			.text((d) => d.card.length > 20 ? d.card.substring(0, 20) + '...' : d.card);

		// Usage count labels (right)
		svg
			.selectAll('.count-label')
			.data(cardStats)
			.join('text')
			.attr('class', 'count-label')
			.attr('x', (d) => xScale(d.usageCount) + 8)
			.attr('y', (d) => (yScale(d.card) || 0) + yScale.bandwidth() / 2)
			.attr('dy', '0.35em')
			.attr('fill', 'currentColor')
			.style('font-size', '11px')
			.style('font-weight', '600')
			.text((d) => `${d.usageCount} uses`);

		// Avg votes indicator (far right)
		svg
			.selectAll('.vote-label')
			.data(cardStats)
			.join('text')
			.attr('class', 'vote-label')
			.attr('x', width + 10)
			.attr('y', (d) => (yScale(d.card) || 0) + yScale.bandwidth() / 2)
			.attr('dy', '0.35em')
			.attr('fill', 'currentColor')
			.style('font-size', '10px')
			.style('opacity', 0.7)
			.text((d) => `⭐ ${d.avgVotes.toFixed(1)}`);

		// X axis
		svg
			.append('g')
			.attr('transform', `translate(0,${chartHeight})`)
			.call(d3.axisBottom(xScale).ticks(5))
			.call((g) => g.select('.domain').attr('stroke', 'currentColor').style('opacity', 0.2))
			.call((g) =>
				g.selectAll('.tick line').attr('stroke', 'currentColor').style('opacity', 0.2)
			)
			.call((g) => g.selectAll('.tick text').attr('fill', 'currentColor').style('opacity', 0.6));

		// Legend
		const legend = svg
			.append('g')
			.attr('transform', `translate(0, ${chartHeight + 30})`);

		legend
			.append('text')
			.attr('x', 0)
			.attr('y', 0)
			.attr('fill', 'currentColor')
			.style('font-size', '11px')
			.style('opacity', 0.7)
			.text('Color intensity = Average votes per use');
	}

	onMount(() => {
		if (responses.length > 0) {
			calculateCardStats();
			renderChart();
		}

		// Re-render on window resize
		const handleResize = () => renderChart();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
</script>

<div class="card-impact-chart">
	<h3 class="mb-4 text-lg font-semibold text-ink">{title}</h3>
	{#if cardStats.length === 0}
		<div class="flex h-64 items-center justify-center text-center text-ink-muted">
			<div>
				<div class="mb-2 text-4xl">📊</div>
				<div class="text-sm">No card usage data yet</div>
				<div class="text-xs">Cards will appear here as participants reference them</div>
			</div>
		</div>
	{:else}
		<div bind:this={chartContainer} class="w-full" style="min-height: {height}px;" />
		<div class="mt-4 grid grid-cols-3 gap-4 text-center">
			<div class="rounded-lg border border-line bg-surface-muted p-3">
				<div class="text-2xl font-bold text-brand">{cardStats.length}</div>
				<div class="text-xs text-ink-muted">Unique Cards</div>
			</div>
			<div class="rounded-lg border border-line bg-surface-muted p-3">
				<div class="text-2xl font-bold text-brand">
					{cardStats.reduce((sum, d) => sum + d.usageCount, 0)}
				</div>
				<div class="text-xs text-ink-muted">Total Uses</div>
			</div>
			<div class="rounded-lg border border-line bg-surface-muted p-3">
				<div class="text-2xl font-bold text-brand">
					{cardStats.length > 0
						? (
								cardStats.reduce((sum, d) => sum + d.avgVotes, 0) / cardStats.length
							).toFixed(1)
						: 0}
				</div>
				<div class="text-xs text-ink-muted">Avg Impact</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.card-impact-chart {
		width: 100%;
	}
</style>
