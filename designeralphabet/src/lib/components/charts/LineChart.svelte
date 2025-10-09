<script lang="ts">
	import { select } from 'd3-selection';
	import { scaleLinear } from 'd3-scale';
	import { line, curveMonotoneX, area } from 'd3-shape';
	import { max } from 'd3-array';
	import { onMount, afterUpdate } from 'svelte';
	import { getThemeColors } from '$lib/utils/colors';

	export let data: Array<{ value: number; count: number }> = [];
	export let scaleSettings = { min: 0, max: 10, minLabel: 'Min', maxLabel: 'Max' };
	export let totalResponses = 0;
	export let width = 800;
	export let height = 400;

	let svgElement: SVGSVGElement;
	let chartGroup: SVGGElement;

	const margin = { top: 20, right: 40, bottom: 60, left: 60 };
	$: innerWidth = width - margin.left - margin.right;
	$: innerHeight = height - margin.top - margin.bottom;

	function updateChart() {
		if (!svgElement || !chartGroup || data.length === 0) return;

		const chart = select(chartGroup);
		chart.selectAll('*').remove();
		const theme = getThemeColors();

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
			.attr('stroke', 'hsl(var(--border-subtle) / 0.6)')
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
			.attr('stroke', theme.brand)
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
			.attr('fill', theme.brand)
			.attr('stroke', theme.ink)
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
					.attr('fill', 'hsl(var(--surface) / 0.92)')
					.attr('rx', 4);

				tooltip
					.append('text')
					.attr('text-anchor', 'middle')
					.attr('dy', '-0.8em')
					.attr('fill', theme.brand)
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
			.attr('stroke', 'hsl(var(--border-strong))')
			.attr('stroke-width', 2);

		// X-axis labels
		const xTicks = [scaleSettings.min, Math.floor((scaleSettings.min + scaleSettings.max) / 2), scaleSettings.max];
		xTicks.forEach((tick) => {
			xAxis
				.append('text')
				.attr('x', xScale(tick))
				.attr('y', 25)
				.attr('text-anchor', 'middle')
				.attr('fill', theme.ink)
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
				.attr('fill', theme.inkMuted)
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
				.attr('fill', theme.inkMuted)
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
			.attr('stroke', 'hsl(var(--border-strong))')
			.attr('stroke-width', 2);

		// Y-axis labels
		yTicks.forEach((tick) => {
			yAxis
				.append('text')
				.attr('x', -10)
				.attr('y', yScale(tick))
				.attr('dy', '0.35em')
				.attr('text-anchor', 'end')
				.attr('fill', theme.ink)
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
			.attr('fill', theme.inkMuted)
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
				.attr('fill', 'hsl(var(--brand) / 0.1)')
				.attr('stroke', 'hsl(var(--brand) / 0.3)')
				.attr('stroke-width', 1);

			badge
				.append('text')
				.attr('x', -60)
				.attr('y', 12)
				.attr('dy', '0.35em')
				.attr('text-anchor', 'middle')
				.attr('fill', theme.brand)
				.attr('font-family', 'Orbitron, sans-serif')
				.attr('font-size', '11px')
				.attr('font-weight', '600')
				.text(`${d.value} → ${d.count} response${d.count !== 1 ? 's' : ''}`);
		});
	}

	onMount(() => {
		updateChart();
	});

	afterUpdate(() => {
		if (data.length > 0) {
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
			<linearGradient id="line-gradient" x1="0" x2="1">
				<stop offset="0%" stop-color="hsl(var(--brand-soft))" stop-opacity="0.9" />
				<stop offset="100%" stop-color="hsl(var(--brand))" stop-opacity="1" />
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

	{#if data.length === 0}
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
		background-color: hsl(var(--surface) / 0.9);
		backdrop-filter: blur(4px);
	}

	.empty-text {
		color: hsl(var(--text-secondary));
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
		filter: drop-shadow(0 0 8px hsl(var(--brand)));
	}
</style>
