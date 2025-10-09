<script lang="ts">
	import { select } from 'd3-selection';
	import { arc, pie } from 'd3-shape';
	import { scaleOrdinal } from 'd3-scale';
	import { interpolate } from 'd3-interpolate';
	import { onMount, afterUpdate } from 'svelte';
	import { getThemeColors } from '$lib/utils/colors';

	export let data: Array<{ label: string; value: number; percentage: number }> = [];
	export let width = 400;
	export let height = 400;
	export let showLegend = true;
	export let question = '';

	let svgElement: SVGSVGElement;
	let chartGroup: SVGGElement;
	let showTooltip = false;
	let tooltipData = { label: '', value: 0, percentage: 0, x: 0, y: 0 };

	const margin = { top: 20, right: 20, bottom: 20, left: 20 };
	$: radius = Math.min(width, height) / 2 - Math.max(...Object.values(margin));
	$: centerX = width / 2;
	$: centerY = height / 2;

	const colorScale = scaleOrdinal<string>();

	function updateChart() {
		if (!svgElement || !chartGroup || data.length === 0) return;

		const chart = select(chartGroup);
		const theme = getThemeColors();

		const palette = [
			...theme.chart,
			theme.accentWarm,
			theme.accentCritical,
			theme.brand,
			theme.brandSoft,
			theme.ink,
			theme.ink2
		];

		colorScale.range(palette);

		// Arc generator for pie slices
		const arcGenerator = arc<any>()
			.innerRadius(radius * 0.5) // Donut chart
			.outerRadius(radius);

		// Pie layout
		const pieLayout = pie<any>()
			.value((d) => d.value)
			.sort(null); // Maintain order

		const pieData = pieLayout(data);

		// Update color scale domain
		colorScale.domain(data.map((d) => d.label));

		// Bind data
		const slices = chart.selectAll('.pie-slice').data(pieData, (d: any) => d.data.label);

		// Exit
		slices.exit().transition().duration(500).attr('opacity', 0).remove();

		// Enter + Update
		const slicesEnter = slices
			.enter()
			.append('g')
			.attr('class', 'pie-slice')
			.attr('transform', `translate(${centerX}, ${centerY})`);

		slicesEnter
			.append('path')
			.attr('class', 'slice-path')
			.attr('fill', (d: any) => colorScale(d.data.label))
			.attr('stroke', theme.surfaceMuted)
			.attr('stroke-width', 1.5)
			.style('cursor', 'pointer')
			.attr('opacity', 0)
			.on('mouseover', handleMouseOver)
			.on('mousemove', handleMouseMove)
			.on('mouseout', handleMouseOut)
			.each(function (d: any) {
				(this as any)._current = { startAngle: 0, endAngle: 0 };
			});

		// Update existing slices
		const allSlices = slicesEnter.merge(slices as any);

		allSlices
			.select('.slice-path')
			.transition()
			.duration(750)
			.attr('opacity', 1)
			.attrTween('d', function (d: any) {
				const interpolateArc = interpolate((this as any)._current, d);
				(this as any)._current = interpolateArc(1);
				return (t: number) => arcGenerator(interpolateArc(t)) || '';
			});

		// Update center text
		updateCenterText();
	}

	function updateCenterText() {
		const theme = getThemeColors();
		const chart = select(chartGroup);
		const totalCount = data.reduce((sum, d) => sum + d.value, 0);

		// Remove existing center text
		chart.selectAll('.center-text').remove();

		// Add center text group
		const centerText = chart
			.append('g')
			.attr('class', 'center-text')
			.attr('transform', `translate(${centerX}, ${centerY})`);

		centerText
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('dy', '-0.3em')
			.attr('fill', theme.ink)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '32px')
			.attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text(totalCount)
			.transition()
			.duration(500)
			.attr('opacity', 1);

		centerText
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('dy', '1.2em')
			.attr('fill', theme.ink2)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '14px')
			.attr('opacity', 0)
			.text('responses')
			.transition()
			.duration(500)
			.delay(200)
			.attr('opacity', 1);
	}

	function handleMouseOver(event: MouseEvent, d: any) {
		const totalCount = data.reduce((sum, item) => sum + item.value, 0);
		tooltipData = {
			label: d.data.label,
			value: d.data.value,
			percentage: totalCount > 0 ? (d.data.value / totalCount) * 100 : 0,
			x: event.clientX,
			y: event.clientY
		};
		showTooltip = true;

		select(event.currentTarget as Element)
			.transition()
			.duration(200)
			.attr('opacity', 0.8)
			.attr('transform', function () {
				const angle = (d.startAngle + d.endAngle) / 2;
				const x = Math.cos(angle - Math.PI / 2) * 10;
				const y = Math.sin(angle - Math.PI / 2) * 10;
				return `translate(${x}, ${y})`;
			});
	}

	function handleMouseMove(event: MouseEvent) {
		if (showTooltip) {
			tooltipData = { ...tooltipData, x: event.clientX, y: event.clientY };
		}
	}

	function handleMouseOut(event: MouseEvent) {
		showTooltip = false;

		select(event.currentTarget as Element)
			.transition()
			.duration(200)
			.attr('opacity', 1)
			.attr('transform', 'translate(0, 0)');
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

<div class="pie-chart-container" class:with-legend={showLegend}>
	<svg bind:this={svgElement} {width} {height} class="pie-chart">
		<defs>
			<filter id="pie-glow">
				<feGaussianBlur stdDeviation="3" result="coloredBlur" />
				<feMerge>
					<feMergeNode in="coloredBlur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>
		<g bind:this={chartGroup} />
	</svg>

	{#if showLegend && data.length > 0}
		<div class="legend">
			<div class="legend-title">Distribution</div>
			{#each data as item, i}
				<div class="legend-item">
					<div class="legend-color" style="background-color: {colorScale(item.label)}"></div>
					<div class="legend-label" title={item.label}>{item.label}</div>
					<div class="legend-value">{item.value}</div>
					<div class="legend-percentage">{item.percentage.toFixed(1)}%</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if data.length === 0}
		<div class="overlay">
			<div class="empty-text">No responses yet</div>
		</div>
	{/if}

	<!-- Tooltip -->
	{#if showTooltip}
		<div 
			class="chart-tooltip"
			style="left: {tooltipData.x + 15}px; top: {tooltipData.y - 10}px;"
		>
			{#if question}
				<div class="tooltip-question">{question}</div>
			{/if}
			<div class="tooltip-label">{tooltipData.label}</div>
			<div class="tooltip-stats">
				<div class="tooltip-stat">
					<span class="stat-label">Responses:</span>
					<span class="stat-value">{tooltipData.value}</span>
				</div>
				<div class="tooltip-stat">
					<span class="stat-label">Percentage:</span>
					<span class="stat-value">{tooltipData.percentage.toFixed(1)}%</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.pie-chart-container {
		position: relative;
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.pie-chart-container.with-legend {
		flex-direction: row;
	}

	.pie-chart {
		flex-shrink: 0;
		display: block;
		max-width: 100%;
		height: auto;
	}

	.legend {
		flex: 1;
		min-width: 200px;
		max-width: 300px;
	}

	.legend-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--text-muted));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
	}

.legend-item {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.5rem;
	border-radius: 0.5rem;
	transition: background-color 0.2s, transform 0.2s;
}

.legend-item:hover {
	background-color: hsl(var(--surface-muted) / 0.35);
	transform: translateX(4px);
	}

	.legend-color {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 0.25rem;
		flex-shrink: 0;
	}

	.legend-label {
		flex: 1;
		font-size: 0.875rem;
		color: hsl(var(--text-secondary));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.legend-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--text-primary));
		tabular-nums: true;
	}

	.legend-percentage {
		width: 3.5rem;
		text-align: right;
		font-size: 0.75rem;
		color: hsl(var(--text-muted));
		tabular-nums: true;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		background-color: hsl(var(--surface) / 0.92);
		backdrop-filter: blur(4px);
	}

	.empty-text {
		color: hsl(var(--text-secondary));
		font-size: 0.875rem;
	}

	:global(.pie-chart .slice-path) {
		filter: url(#pie-glow);
		transition: all 0.2s ease;
	}

	.chart-tooltip {
		position: fixed;
		pointer-events: none;
		background: hsl(var(--surface-elevated));
		border: 1px solid hsl(var(--brand) / 0.3);
		border-radius: 8px;
		padding: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		z-index: 1000;
		min-width: 200px;
		backdrop-filter: blur(8px);
	}

	.tooltip-question {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--brand));
		margin-bottom: 8px;
		padding-bottom: 6px;
		border-bottom: 1px solid hsl(var(--border-subtle));
	}

	.tooltip-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--text-primary));
		margin-bottom: 8px;
	}

	.tooltip-stats {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.tooltip-stat {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
	}

	.stat-label {
		color: hsl(var(--text-secondary));
	}

	.stat-value {
		font-weight: 600;
		color: hsl(var(--brand));
		font-family: 'Orbitron', sans-serif;
	}
</style>
