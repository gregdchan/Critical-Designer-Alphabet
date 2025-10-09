<script lang="ts">
	import { select } from 'd3-selection';
	import { scaleLinear, scaleBand } from 'd3-scale';
	import { max } from 'd3-array';
	import { onMount, afterUpdate } from 'svelte';
	import { getThemeColors } from '$lib/utils/colors';
	import type { ChartData, ChartPoint } from '$lib/types/charts';
	import { browser } from '$app/environment';

	// Unified ChartData type (new approach)
	export let chartData: ChartData | null = null;

	// Legacy data props (backward compatible)
	export let data: Array<{ label: string; value: number; percentage?: number }> = [];
	export let width = 800;
	export let height = 400;
	export let question = '';
	export let totalResponses = 0;
	export let ariaLabel = 'Bar chart showing response distribution';

	// Convert chartData to internal format
	$: normalizedData = chartData
		? chartData.series[0]?.points.map((p: ChartPoint) => ({
				label: p.label,
				value: p.value,
				percentage: totalResponses > 0 ? (p.value / totalResponses) * 100 : 0,
				color: p.color
			})) || []
		: data.map(d => ({ ...d, percentage: d.percentage || 0 }));

	let svgElement: SVGSVGElement;
	let chartGroup: SVGGElement;
	let tooltip: HTMLDivElement;
	let showTooltip = false;
	let tooltipData = { label: '', value: 0, percentage: 0, x: 0, y: 0 };

	const margin = { top: 20, right: 80, bottom: 60, left: 200 };
	$: innerWidth = width - margin.left - margin.right;
	$: innerHeight = height - margin.top - margin.bottom;

	function updateChart() {
		if (!browser || !svgElement || !normalizedData.length) return;

		const chart = select(chartGroup);
		const theme = getThemeColors();
		chart.selectAll('*').remove();

		// Scales
		const yScale = scaleBand()
			.domain(normalizedData.map((d) => d.label))
			.range([0, innerHeight])
			.padding(0.2);

		const xScale = scaleLinear()
			.domain([0, max(normalizedData, (d) => d.value) || 1])
			.range([0, innerWidth]);

		// Bars
		const bars = chart
			.selectAll('.bar')
			.data(normalizedData)
			.enter()
			.append('g')
			.attr('class', 'bar-group');

			// Bar backgrounds
			bars
				.append('rect')
				.attr('class', 'bar-background')
				.attr('x', 0)
				.attr('y', (d) => yScale(d.label) || 0)
				.attr('width', innerWidth)
				.attr('height', yScale.bandwidth())
				.attr('fill', 'hsl(var(--text-muted) / 0.25)')
				.attr('rx', 6);

		// Animated bars
		const barRects = bars
			.append('rect')
			.attr('class', 'bar')
			.attr('x', 0)
			.attr('y', (d) => yScale(d.label) || 0)
			.attr('width', 0)
			.attr('height', yScale.bandwidth())
			.attr('fill', 'url(#bar-gradient)')
			.attr('rx', 6)
			.style('cursor', 'pointer');

		// Animate bars
		barRects
			.transition()
			.duration(800)
			.delay((d, i) => i * 100)
			.attr('width', (d) => xScale(d.value));

		// Add hover interactions
		barRects
			.on('mouseenter', function(event, d) {
				select(this)
					.transition()
					.duration(200)
					.attr('opacity', 0.8);
				
				showTooltipData(event, d);
			})
			.on('mousemove', function(event) {
				updateTooltipPosition(event);
			})
			.on('mouseleave', function() {
				select(this)
					.transition()
					.duration(200)
					.attr('opacity', 1);
				
				hideTooltipData();
			});

		// Value labels inside bars
		bars
			.append('text')
			.attr('class', 'bar-value')
			.attr('x', (d) => xScale(d.value) - 10)
			.attr('y', (d) => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', 'end')
			.attr('fill', 'hsl(var(--text-on-teal))')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text((d) => d.value)
			.transition()
			.duration(500)
			.delay((d, i) => i * 100 + 800)
			.attr('opacity', (d) => (d.value > 0 ? 1 : 0));

		// Percentage labels outside bars
		bars
			.append('text')
			.attr('class', 'bar-percentage')
			.attr('x', innerWidth + 10)
			.attr('y', (d) => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', 'start')
			.attr('fill', theme.ink2)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '12px')
			.attr('opacity', 0)
			.text((d) => `${d.percentage.toFixed(1)}%`)
			.transition()
			.duration(500)
			.delay((d, i) => i * 100 + 1000)
			.attr('opacity', 1);

		// Y-axis labels (option names)
		chart
			.selectAll('.y-label')
			.data(normalizedData)
			.enter()
			.append('text')
			.attr('class', 'y-label')
			.attr('x', -10)
			.attr('y', (d) => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', 'end')
			.attr('fill', theme.ink)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '13px')
			.attr('font-weight', '500')
			.text((d) => d.label)
			.each(function (d) {
				const text = select(this);
				const textWidth = (this as SVGTextElement).getComputedTextLength();
				if (textWidth > margin.left - 20) {
					// Truncate text if too long
					let truncated = d.label;
					while (textWidth > margin.left - 20 && truncated.length > 3) {
						truncated = truncated.slice(0, -1);
						text.text(truncated + '...');
						if ((this as SVGTextElement).getComputedTextLength() <= margin.left - 20) break;
					}
				}
			});
	}

	function showTooltipData(event: MouseEvent, d: any) {
		const totalCount = normalizedData.reduce((sum, item) => sum + item.value, 0);
		tooltipData = {
			label: d.label,
			value: d.value,
			percentage: totalCount > 0 ? (d.value / totalCount) * 100 : 0,
			x: event.clientX,
			y: event.clientY
		};
		showTooltip = true;
	}

	function updateTooltipPosition(event: MouseEvent) {
		if (showTooltip) {
			tooltipData = { ...tooltipData, x: event.clientX, y: event.clientY };
		}
	}

	function hideTooltipData() {
		showTooltip = false;
	}

	onMount(() => {
		updateChart();
	});

	afterUpdate(() => {
		if (normalizedData.length > 0) {
			updateChart();
		}
	});

	$: if (svgElement && chartGroup && normalizedData) {
		updateChart();
	}
</script>

<div class="bar-chart-container">
	<svg bind:this={svgElement} {width} {height} class="bar-chart" role="img" aria-label={chartData?.title || ariaLabel}>
		<defs>
			<linearGradient id="bar-gradient" x1="0" x2="1">
				<stop offset="0%" stop-color="hsl(var(--brand-soft))" stop-opacity="0.9" />
				<stop offset="100%" stop-color="hsl(var(--brand))" stop-opacity="1" />
			</linearGradient>
			<filter id="bar-glow">
				<feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
				<feMerge>
					<feMergeNode in="coloredBlur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>
		<g bind:this={chartGroup} transform="translate({margin.left}, {margin.top})" />
	</svg>

	{#if normalizedData.length === 0}
		<div class="overlay">
			<div class="empty-text">No responses yet</div>
		</div>
	{/if}

	<!-- Tooltip -->
	{#if showTooltip}
		<div 
			bind:this={tooltip}
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
	.bar-chart-container {
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
		background-color: hsl(var(--surface-elevated) / 0.82);
		border: 1px solid hsl(var(--text-muted) / 0.35);
		border-radius: 1rem;
		color: hsl(var(--text-secondary));
		backdrop-filter: blur(6px);
	}

	.empty-text {
		color: hsl(var(--text-secondary));
		font-size: 0.875rem;
	}

	:global(.bar) {
		filter: url(#bar-glow);
		transition: opacity 0.3s ease, transform 0.2s ease;
	}

	:global(.bar:hover) {
		opacity: 0.9;
		transform: translateX(2px);
	}

	:global(.y-label) {
		cursor: default;
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
