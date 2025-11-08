<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import type { Response, Participant } from '$lib/gamification';

	export let responses: Response[] = [];
	export let participants: Participant[] = [];
	export let title = 'Participation Equity';
	export let height = 400;

	let chartContainer: HTMLDivElement;

	interface ParticipationData {
		participant: string;
		responseCount: number;
		voteCount: number;
		cardUsage: number;
		color: string;
		role: string;
	}

	let participationData: ParticipationData[] = [];
	let equityScore = 0;
	let giniCoefficient = 0;

	$: if (participants.length > 0 && responses.length > 0) {
		calculateParticipation();
		renderChart();
	}

	function calculateGini(values: number[]): number {
		if (values.length === 0) return 0;

		const sorted = [...values].sort((a, b) => a - b);
		const n = sorted.length;
		const total = sorted.reduce((sum, v) => sum + v, 0);

		if (total === 0) return 0;

		let sum = 0;
		for (let i = 0; i < n; i++) {
			sum += ((i + 1) * sorted[i]) / total;
		}

		return (2 * sum) / n - (n + 1) / n;
	}

	function calculateParticipation() {
		participationData = participants
			.map((participant) => {
				const userResponses = responses.filter((r) => r.participant_id === participant.id);
				return {
					participant: participant.name,
					responseCount: userResponses.length,
					voteCount: userResponses.reduce((sum, r) => sum + (r.votes || 0), 0),
					cardUsage: userResponses.reduce((sum, r) => sum + (r.cards?.length || 0), 0),
					color: participant.color,
					role: participant.role
				};
			})
			.filter((d) => d.responseCount > 0) // Only participants with contributions
			.sort((a, b) => b.responseCount - a.responseCount);

		// Calculate equity metrics
		const responseCounts = participationData.map((d) => d.responseCount);
		giniCoefficient = calculateGini(responseCounts);
		equityScore = Math.round((1 - giniCoefficient) * 100);
	}

	function renderChart() {
		if (!chartContainer || participationData.length === 0) return;

		// Clear previous chart
		d3.select(chartContainer).selectAll('*').remove();

		const margin = { top: 20, right: 20, bottom: 100, left: 60 };
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
			.scaleBand()
			.domain(participationData.map((d) => d.participant))
			.range([0, width])
			.padding(0.2);

		const yScale = d3
			.scaleLinear()
			.domain([0, d3.max(participationData, (d) => d.responseCount) || 10])
			.range([chartHeight, 0]);

		// Calculate ideal equal distribution line
		const avgResponses =
			participationData.reduce((sum, d) => sum + d.responseCount, 0) / participationData.length;

		// Draw ideal equity line
		svg
			.append('line')
			.attr('x1', 0)
			.attr('y1', yScale(avgResponses))
			.attr('x2', width)
			.attr('y2', yScale(avgResponses))
			.attr('stroke', 'hsl(var(--brand))')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,5')
			.style('opacity', 0.5);

		svg
			.append('text')
			.attr('x', width - 5)
			.attr('y', yScale(avgResponses) - 5)
			.attr('text-anchor', 'end')
			.attr('fill', 'hsl(var(--brand))')
			.style('font-size', '10px')
			.style('opacity', 0.7)
			.text('Ideal equity line');

		// Tooltip
		const tooltip = d3
			.select(chartContainer)
			.append('div')
			.attr('class', 'equity-tooltip')
			.style('position', 'absolute')
			.style('visibility', 'hidden')
			.style('background', 'hsl(var(--surface))')
			.style('border', '1px solid hsl(var(--line))')
			.style('border-radius', '8px')
			.style('padding', '8px 12px')
			.style('font-size', '12px')
			.style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
			.style('z-index', '1000')
			.style('pointer-events', 'none');

		// Bars
		svg
			.selectAll('.bar')
			.data(participationData)
			.join('rect')
			.attr('class', 'bar')
			.attr('x', (d) => xScale(d.participant) || 0)
			.attr('y', (d) => yScale(d.responseCount))
			.attr('width', xScale.bandwidth())
			.attr('height', (d) => chartHeight - yScale(d.responseCount))
			.attr('fill', (d) => d.color || 'hsl(var(--brand))')
			.attr('rx', 4)
			.style('opacity', 0.8)
			.on('mouseover', function (event, d) {
				d3.select(this).style('opacity', 1).style('cursor', 'pointer');

				tooltip
					.style('visibility', 'visible')
					.html(
						`
						<div style="color: hsl(var(--ink)); min-width: 180px;">
							<div style="font-weight: 600; margin-bottom: 6px;">${d.participant}</div>
							${d.role === 'facilitator' ? '<div style="font-size: 10px; color: hsl(var(--brand)); margin-bottom: 4px;">Facilitator</div>' : ''}
							<div style="margin-bottom: 2px;">
								<span style="color: hsl(var(--ink-muted));">Responses:</span> ${d.responseCount}
							</div>
							<div style="margin-bottom: 2px;">
								<span style="color: hsl(var(--ink-muted));">Votes received:</span> ${d.voteCount}
							</div>
							<div>
								<span style="color: hsl(var(--ink-muted));">Cards used:</span> ${d.cardUsage}
							</div>
							<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid hsl(var(--line)); font-size: 10px; color: hsl(var(--ink-muted));">
								${d.responseCount < avgResponses ? 'Below' : d.responseCount > avgResponses ? 'Above' : 'At'} average (${avgResponses.toFixed(1)})
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
				d3.select(this).style('opacity', 0.8);
				tooltip.style('visibility', 'hidden');
			});

		// Value labels on bars
		svg
			.selectAll('.value-label')
			.data(participationData)
			.join('text')
			.attr('class', 'value-label')
			.attr('x', (d) => (xScale(d.participant) || 0) + xScale.bandwidth() / 2)
			.attr('y', (d) => yScale(d.responseCount) - 5)
			.attr('text-anchor', 'middle')
			.attr('fill', 'currentColor')
			.style('font-size', '11px')
			.style('font-weight', '600')
			.text((d) => d.responseCount);

		// X axis with participant names
		svg
			.append('g')
			.attr('transform', `translate(0,${chartHeight})`)
			.call(d3.axisBottom(xScale))
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
					.text((d) => {
						const str = String(d);
						return str.length > 15 ? str.substring(0, 15) + '...' : str;
					})
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
			.attr('y', -45)
			.attr('x', -chartHeight / 2)
			.attr('text-anchor', 'middle')
			.attr('fill', 'currentColor')
			.style('font-size', '11px')
			.style('opacity', 0.7)
			.text('Number of Responses');
	}

	onMount(() => {
		if (participants.length > 0 && responses.length > 0) {
			calculateParticipation();
			renderChart();
		}

		// Re-render on window resize
		const handleResize = () => renderChart();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	// Determine equity level text and color
	$: equityLevel =
		equityScore >= 80
			? { text: 'Excellent', color: 'text-green-500' }
			: equityScore >= 60
				? { text: 'Good', color: 'text-blue-500' }
				: equityScore >= 40
					? { text: 'Moderate', color: 'text-yellow-500' }
					: { text: 'Low', color: 'text-orange-500' };
</script>

<div class="participation-equity-chart">
	<h3 class="mb-4 text-lg font-semibold text-ink">{title}</h3>

	{#if participationData.length === 0}
		<div class="flex h-64 items-center justify-center text-center text-ink-muted">
			<div>
				<div class="mb-2 text-4xl">⚖️</div>
				<div class="text-sm">Equity metrics will appear here</div>
				<div class="text-xs">Participation data needed to analyze inclusivity</div>
			</div>
		</div>
	{:else}
		<!-- Equity Score Banner -->
		<div class="mb-4 rounded-xl border border-line bg-surface-muted p-4">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-sm text-ink-muted">Equity Score</div>
					<div class="text-3xl font-bold text-ink">{equityScore}%</div>
					<div class="text-xs {equityLevel.color}">{equityLevel.text} distribution</div>
				</div>
				<div class="text-right">
					<div class="text-sm text-ink-muted">Gini Coefficient</div>
					<div class="text-2xl font-bold text-ink">{giniCoefficient.toFixed(3)}</div>
					<div class="text-xs text-ink-muted">0 = perfect equity</div>
				</div>
			</div>
			<div class="mt-3 h-2 overflow-hidden rounded-full bg-surface">
				<div
					class="h-full rounded-full bg-gradient-to-r from-orange-500 via-yellow-500 via-blue-500 to-green-500"
					style="width: {equityScore}%;"
				/>
			</div>
		</div>

		<div bind:this={chartContainer} class="w-full" style="min-height: {height}px;" />

		<div class="mt-4 grid grid-cols-2 gap-4 text-center">
			<div class="rounded-lg border border-line bg-surface-muted p-3">
				<div class="text-2xl font-bold text-brand">{participationData.length}</div>
				<div class="text-xs text-ink-muted">Active Contributors</div>
			</div>
			<div class="rounded-lg border border-line bg-surface-muted p-3">
				<div class="text-2xl font-bold text-brand">
					{participationData.reduce((sum, d) => sum + d.responseCount, 0)}
				</div>
				<div class="text-xs text-ink-muted">Total Contributions</div>
			</div>
		</div>

		<!-- Equity Insights -->
		<div class="mt-4 rounded-lg border border-line bg-surface-muted p-4">
			<div class="mb-2 text-sm font-semibold text-ink">💡 Equity Insights</div>
			<div class="space-y-2 text-xs text-ink-muted">
				{#if equityScore >= 80}
					<div>✓ Distribution is very balanced - all voices are being heard!</div>
				{:else if equityScore >= 60}
					<div>
						✓ Good participation balance. Consider encouraging quieter participants.
					</div>
				{:else if equityScore >= 40}
					<div>
						⚠ Some participants are contributing significantly more than others. Facilitator may
						want to invite quieter voices.
					</div>
				{:else}
					<div>
						⚠ Significant imbalance detected. Consider strategies to amplify underrepresented
						voices.
					</div>
				{/if}
				<div class="pt-2 text-[10px] opacity-70">
					The Gini coefficient measures inequality in participation. Lower values (closer to 0)
					indicate more equitable distribution of contributions.
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.participation-equity-chart {
		width: 100%;
	}
</style>
