<script lang="ts">
	import { select } from 'd3-selection';
	import { scaleLinear } from 'd3-scale';
	import { line, curveMonotoneX, area } from 'd3-shape';
	import { extent, max } from 'd3-array';
	import { onMount, afterUpdate } from 'svelte';
	import { useResponses, useQuestions } from '$lib/hooks/useSupabaseRealtime';

	export let roomCode: string = '';
	export let questionId: string = '';
	export let width = 800;
	export let height = 400;

	let svgElement: SVGSVGElement;
	let chartGroup: SVGGElement;
	let data: Array<{ value: number; count: number }> = [];
	let scaleSettings = { min: 0, max: 10, minLabel: 'Min', maxLabel: 'Max' };
	let totalResponses = 0;
	let loading = true;
	let error: string | null = null;

	const margin = { top: 20, right: 40, bottom: 60, left: 60 };
	$: innerWidth = width - margin.left - margin.right;
	$: innerHeight = height - margin.top - margin.bottom;

	// Supabase realtime subscriptions
	let responses: any[] = [];
	let questions: any[] = [];

	if (roomCode) {
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
	}

	function updateData() {
		if (!questionId || !responses.length || !questions.length) {
			data = [];
			return;
		}

		const question = questions.find((q) => q.id === questionId);
		if (!question) {
			data = [];
			return;
		}

		scaleSettings = question.scale || { min: 0, max: 10, minLabel: 'Min', maxLabel: 'Max' };
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

		if (svgElement && chartGroup) {
			updateChart();
		}
	}

	function updateChart() {
		if (!svgElement || !chartGroup || data.length === 0) return;

		const chart = select(chartGroup);
		chart.selectAll('*').remove();

		// Scales
		const xScale = scaleLinear()
			.domain([scaleSettings.min, scaleSettings.max])
			.range([0, innerWidth]);

		const yScale = scaleLinear()
			.domain([0, max(data, (d) => d.count) || 1])
			.range([innerHeight, 0]);

		// Grid lines
		const yTicks = yScale.ticks(5);
		chart
			.selectAll('.grid-line')
			.data(yTicks)
			.enter()
			.append('line')
			.attr('class', 'grid-line')
			.attr('x1', 0)
			.attr('x2', innerWidth)
			.attr('y1', (d) => yScale(d))
			.attr('y2', (d) => yScale(d))
			.attr('stroke', 'rgb(51, 65, 85)')
			.attr('stroke-width', 0.5)
			.attr('opacity', 0.5);

		// Area under curve
		const areaGenerator = area<{ value: number; count: number }>()
			.x((d) => xScale(d.value))
			.y0(innerHeight)
			.y1((d) => yScale(d.count))
			.curve(curveMonotoneX);

		chart
			.append('path')
			.datum(data)
			.attr('class', 'area')
			.attr('fill', 'url(#line-gradient)')
			.attr('d', areaGenerator)
			.attr('opacity', 0)
			.transition()
			.duration(800)
			.attr('opacity', 0.3);

		// Line
		const lineGenerator = line<{ value: number; count: number }>()
			.x((d) => xScale(d.value))
			.y((d) => yScale(d.count))
			.curve(curveMonotoneX);

		const path = chart
			.append('path')
			.datum(data)
			.attr('class', 'line')
			.attr('fill', 'none')
			.attr('stroke', '#10b981')
			.attr('stroke-width', 3)
			.attr('filter', 'url(#line-glow)')
			.attr('d', lineGenerator);

		// Animate line
		const totalLength = (path.node() as SVGPathElement).getTotalLength();
		path
			.attr('stroke-dasharray', `${totalLength} ${totalLength}`)
			.attr('stroke-dashoffset', totalLength)
			.transition()
			.duration(1200)
			.attr('stroke-dashoffset', 0);

		// Data points
		const points = chart
			.selectAll('.data-point')
			.data(data)
			.enter()
			.append('circle')
			.attr('class', 'data-point')
			.attr('cx', (d) => xScale(d.value))
			.attr('cy', (d) => yScale(d.count))
			.attr('r', 0)
			.attr('fill', '#10b981')
			.attr('stroke', '#0f172a')
			.attr('stroke-width', 2)
			.attr('filter', 'url(#line-glow)')
			.style('cursor', 'pointer');

		points
			.transition()
			.duration(500)
			.delay((d, i) => 1200 + i * 50)
			.attr('r', 5);

		// Add tooltips on hover
		points
			.on('mouseover', function (event, d) {
				select(this).transition().duration(200).attr('r', 8);

				const tooltip = chart
					.append('g')
					.attr('class', 'tooltip')
					.attr('transform', `translate(${xScale(d.value)}, ${yScale(d.count) - 20})`);

				tooltip
					.append('rect')
					.attr('x', -40)
					.attr('y', -25)
					.attr('width', 80)
					.attr('height', 20)
					.attr('fill', 'rgba(0, 0, 0, 0.9)')
					.attr('rx', 4);

				tooltip
					.append('text')
					.attr('text-anchor', 'middle')
					.attr('dy', '-0.8em')
					.attr('fill', '#10b981')
					.attr('font-family', 'Orbitron, sans-serif')
					.attr('font-size', '12px')
					.attr('font-weight', 'bold')
					.text(`${d.value}: ${d.count}`);
			})
			.on('mouseout', function () {
				select(this).transition().duration(200).attr('r', 5);
				chart.selectAll('.tooltip').remove();
			});

		// X-axis
		const xAxis = chart
			.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0, ${innerHeight})`);

		xAxis
			.append('line')
			.attr('x1', 0)
			.attr('x2', innerWidth)
			.attr('stroke', 'rgb(100, 116, 139)')
			.attr('stroke-width', 2);

		// X-axis labels
		const xTicks = [scaleSettings.min, Math.floor((scaleSettings.min + scaleSettings.max) / 2), scaleSettings.max];
		xTicks.forEach((tick) => {
			xAxis
				.append('text')
				.attr('x', xScale(tick))
				.attr('y', 25)
				.attr('text-anchor', 'middle')
				.attr('fill', 'rgb(203, 213, 225)')
				.attr('font-family', 'Orbitron, sans-serif')
				.attr('font-size', '13px')
				.attr('font-weight', '600')
				.text(tick);
		});

		// X-axis scale labels
		if (scaleSettings.minLabel) {
			xAxis
				.append('text')
				.attr('x', xScale(scaleSettings.min))
				.attr('y', 45)
				.attr('text-anchor', 'middle')
				.attr('fill', 'rgb(148, 163, 184)')
				.attr('font-family', 'Orbitron, sans-serif')
				.attr('font-size', '11px')
				.text(scaleSettings.minLabel);
		}

		if (scaleSettings.maxLabel) {
			xAxis
				.append('text')
				.attr('x', xScale(scaleSettings.max))
				.attr('y', 45)
				.attr('text-anchor', 'middle')
				.attr('fill', 'rgb(148, 163, 184)')
				.attr('font-family', 'Orbitron, sans-serif')
				.attr('font-size', '11px')
				.text(scaleSettings.maxLabel);
		}

		// Y-axis
		const yAxis = chart.append('g').attr('class', 'y-axis');

		yAxis
			.append('line')
			.attr('y1', 0)
			.attr('y2', innerHeight)
			.attr('stroke', 'rgb(100, 116, 139)')
			.attr('stroke-width', 2);

		// Y-axis labels
		yTicks.forEach((tick) => {
			yAxis
				.append('text')
				.attr('x', -10)
				.attr('y', yScale(tick))
				.attr('dy', '0.35em')
				.attr('text-anchor', 'end')
				.attr('fill', 'rgb(203, 213, 225)')
				.attr('font-family', 'Orbitron, sans-serif')
				.attr('font-size', '12px')
				.text(tick);
		});

		// Y-axis label
		yAxis
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('x', -innerHeight / 2)
			.attr('y', -45)
			.attr('text-anchor', 'middle')
			.attr('fill', 'rgb(148, 163, 184)')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '13px')
			.text('Responses');

		// Summary badges
		const badgeGroup = chart
			.append('g')
			.attr('class', 'badges')
			.attr('transform', `translate(${innerWidth - 10}, 10)`);

		data.forEach((d, i) => {
			const badge = badgeGroup
				.append('g')
				.attr('transform', `translate(0, ${i * 28})`);

			badge
				.append('rect')
				.attr('x', -120)
				.attr('width', 120)
				.attr('height', 24)
				.attr('rx', 12)
				.attr('fill', 'rgba(16, 185, 129, 0.1)')
				.attr('stroke', 'rgba(16, 185, 129, 0.3)')
				.attr('stroke-width', 1);

			badge
				.append('text')
				.attr('x', -60)
				.attr('y', 12)
				.attr('dy', '0.35em')
				.attr('text-anchor', 'middle')
				.attr('fill', '#10b981')
				.attr('font-family', 'Orbitron, sans-serif')
				.attr('font-size', '11px')
				.attr('font-weight', '600')
				.text(`${d.value} → ${d.count} response${d.count !== 1 ? 's' : ''}`);
		});
	}

	onMount(() => {
		if (!roomCode) {
			updateChart();
		}
	});

	afterUpdate(() => {
		if (!roomCode && data.length > 0) {
			updateChart();
		}
	});

	$: if (svgElement && chartGroup && data) {
		updateChart();
	}
</script>

<div class="line-chart-container">
	<svg bind:this={svgElement} {width} {height} class="line-chart">
		<defs>
			<linearGradient id="line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" style="stop-color:#10b981;stop-opacity:0.8" />
				<stop offset="100%" style="stop-color:#10b981;stop-opacity:0.1" />
			</linearGradient>
			<filter id="line-glow">
				<feGaussianBlur stdDeviation="3" result="coloredBlur" />
				<feMerge>
					<feMergeNode in="coloredBlur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>
		<g bind:this={chartGroup} transform="translate({margin.left}, {margin.top})" />
	</svg>

	{#if loading}
		<div class="overlay">
			<div class="spinner"></div>
			<div class="loading-text">Loading data...</div>
		</div>
	{:else if error}
		<div class="overlay">
			<div class="error-text">Error: {error}</div>
		</div>
	{:else if data.length === 0}
		<div class="overlay">
			<div class="empty-text">No responses yet</div>
		</div>
	{/if}
</div>

<style>
	.line-chart-container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		background-color: rgba(15, 23, 42, 0.8);
		backdrop-filter: blur(4px);
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

	.loading-text,
	.empty-text {
		color: rgb(148, 163, 184);
		font-size: 0.875rem;
	}

	.error-text {
		color: rgb(239, 68, 68);
		font-size: 0.875rem;
	}

	:global(.line-chart .line) {
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	:global(.line-chart .data-point) {
		transition: all 0.2s ease;
	}

	:global(.line-chart .data-point:hover) {
		filter: drop-shadow(0 0 8px #10b981);
	}
</style>
