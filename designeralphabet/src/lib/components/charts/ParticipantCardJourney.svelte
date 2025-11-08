<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import type { Response, Participant } from '$lib/gamification';

	export let responses: Response[] = [];
	export let participant: Participant | null = null;
	export let title = 'Your Card Journey';
	export let height = 300;

	let chartContainer: HTMLDivElement;
	let journeyData: {
		timestamp: Date;
		cards: string[];
		responseText: string;
		votes: number;
	}[] = [];

	$: if (participant && responses.length > 0) {
		calculateJourney();
		renderChart();
	}

	function calculateJourney() {
		if (!participant) return;

		journeyData = responses
			.filter((r) => r.participant_id === participant.id && (r.cards?.length || 0) > 0)
			.map((r) => ({
				timestamp: new Date(r.created_at),
				cards: r.cards || [],
				responseText: r.text,
				votes: r.votes || 0
			}))
			.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
	}

	function renderChart() {
		if (!chartContainer || journeyData.length === 0) return;

		// Clear previous chart
		d3.select(chartContainer).selectAll('*').remove();

		const margin = { top: 20, right: 20, bottom: 60, left: 40 };
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
			.scaleTime()
			.domain(d3.extent(journeyData, (d) => d.timestamp) as [Date, Date])
			.range([0, width]);

		const yScale = d3
			.scaleLinear()
			.domain([0, d3.max(journeyData, (d) => d.cards.length) || 5])
			.range([chartHeight, 0]);

		const sizeScale = d3
			.scaleSqrt()
			.domain([0, d3.max(journeyData, (d) => d.votes) || 10])
			.range([4, 16]);

		// Color scale for variety
		const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

		// Line path
		const line = d3
			.line<{ timestamp: Date; cards: string[] }>()
			.x((d) => xScale(d.timestamp))
			.y((d) => yScale(d.cards.length))
			.curve(d3.curveMonotoneX);

		// Draw line
		svg
			.append('path')
			.datum(journeyData)
			.attr('fill', 'none')
			.attr('stroke', 'hsl(var(--brand))')
			.attr('stroke-width', 2)
			.attr('d', line)
			.style('opacity', 0.6);

		// Tooltip
		const tooltip = d3
			.select(chartContainer)
			.append('div')
			.attr('class', 'journey-tooltip')
			.style('position', 'absolute')
			.style('visibility', 'hidden')
			.style('background', 'hsl(var(--surface))')
			.style('border', '1px solid hsl(var(--line))')
			.style('border-radius', '8px')
			.style('padding', '8px 12px')
			.style('font-size', '12px')
			.style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
			.style('z-index', '1000')
			.style('pointer-events', 'none')
			.style('max-width', '250px');

		// Circles for each data point
		svg
			.selectAll('.journey-point')
			.data(journeyData)
			.join('circle')
			.attr('class', 'journey-point')
			.attr('cx', (d) => xScale(d.timestamp))
			.attr('cy', (d) => yScale(d.cards.length))
			.attr('r', (d) => sizeScale(d.votes))
			.attr('fill', (d, i) => colorScale(i.toString()))
			.attr('stroke', 'hsl(var(--surface))')
			.attr('stroke-width', 2)
			.style('cursor', 'pointer')
			.on('mouseover', function (event, d) {
				d3.select(this).attr('stroke-width', 3).style('opacity', 1);

				const timeStr = d.timestamp.toLocaleString('en-US', {
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				});

				tooltip
					.style('visibility', 'visible')
					.html(
						`
						<div style="color: hsl(var(--ink));">
							<div style="font-weight: 600; margin-bottom: 4px;">${timeStr}</div>
							<div style="margin-bottom: 4px;">
								<span style="color: hsl(var(--ink-muted));">Cards:</span> ${d.cards.length}
							</div>
							<div style="margin-bottom: 4px;">
								<span style="color: hsl(var(--ink-muted));">Votes:</span> ${d.votes}
							</div>
							<div style="font-size: 10px; color: hsl(var(--ink-muted)); margin-top: 6px; padding-top: 6px; border-top: 1px solid hsl(var(--line));">
								${d.cards.join(', ')}
							</div>
						</div>
					`
					)
					.style('left', event.pageX + 10 + 'px')
					.style('top', event.pageY - 10 + 'px');
			})
			.on('mousemove', function (event) {
				tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px');
			})
			.on('mouseout', function () {
				d3.select(this).attr('stroke-width', 2).style('opacity', 0.9);
				tooltip.style('visibility', 'hidden');
			});

		// X axis
		svg
			.append('g')
			.attr('transform', `translate(0,${chartHeight})`)
			.call(
				d3
					.axisBottom(xScale)
					.ticks(5)
					.tickFormat((d) =>
						d3.timeFormat('%b %d')(d as Date)
					)
			)
			.call((g) => g.select('.domain').attr('stroke', 'currentColor').style('opacity', 0.2))
			.call((g) =>
				g.selectAll('.tick line').attr('stroke', 'currentColor').style('opacity', 0.2)
			)
			.call((g) =>
				g
					.selectAll('.tick text')
					.attr('fill', 'currentColor')
					.style('opacity', 0.6)
					.attr('transform', 'rotate(-45)')
					.style('text-anchor', 'end')
			);

		// Y axis
		svg
			.append('g')
			.call(d3.axisLeft(yScale).ticks(5))
			.call((g) => g.select('.domain').attr('stroke', 'currentColor').style('opacity', 0.2))
			.call((g) =>
				g.selectAll('.tick line').attr('stroke', 'currentColor').style('opacity', 0.2)
			)
			.call((g) => g.selectAll('.tick text').attr('fill', 'currentColor').style('opacity', 0.6));

		// Y axis label
		svg
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', -30)
			.attr('x', -chartHeight / 2)
			.attr('text-anchor', 'middle')
			.attr('fill', 'currentColor')
			.style('font-size', '11px')
			.style('opacity', 0.7)
			.text('Cards per Response');
	}

	onMount(() => {
		if (participant && responses.length > 0) {
			calculateJourney();
			renderChart();
		}

		// Re-render on window resize
		const handleResize = () => renderChart();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
</script>

<div class="participant-card-journey">
	<h3 class="mb-4 text-lg font-semibold text-ink">{title}</h3>
	{#if !participant}
		<div class="flex h-64 items-center justify-center text-center text-ink-muted">
			<div>
				<div class="mb-2 text-4xl">👤</div>
				<div class="text-sm">Join the session to see your journey</div>
			</div>
		</div>
	{:else if journeyData.length === 0}
		<div class="flex h-64 items-center justify-center text-center text-ink-muted">
			<div>
				<div class="mb-2 text-4xl">🗺️</div>
				<div class="text-sm">Your card journey will appear here</div>
				<div class="text-xs">Start using cards in your responses to track your progress</div>
			</div>
		</div>
	{:else}
		<div bind:this={chartContainer} class="relative w-full" style="min-height: {height}px;" />
		<div class="mt-4 grid grid-cols-2 gap-4 text-center">
			<div class="rounded-lg border border-line bg-surface-muted p-3">
				<div class="text-2xl font-bold text-brand">{journeyData.length}</div>
				<div class="text-xs text-ink-muted">Card-Enhanced Responses</div>
			</div>
			<div class="rounded-lg border border-line bg-surface-muted p-3">
				<div class="text-2xl font-bold text-brand">
					{new Set(journeyData.flatMap((d) => d.cards)).size}
				</div>
				<div class="text-xs text-ink-muted">Unique Cards Explored</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.participant-card-journey {
		width: 100%;
	}
</style>
