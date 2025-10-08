<script lang="ts">
	import { select } from 'd3-selection';
	import { scaleLinear, scaleBand } from 'd3-scale';
	import { max } from 'd3-array';
	import { onMount, afterUpdate } from 'svelte';

	export let data: Array<{ label: string; value: number; percentage: number }> = [];
	export let width = 800;
	export let height = 400;
	export let question = '';
	export let totalResponses = 0;

	let svgElement: SVGSVGElement;
	let chartGroup: SVGGElement;

	const margin = { top: 20, right: 80, bottom: 60, left: 200 };
	$: innerWidth = width - margin.left - margin.right;
	$: innerHeight = height - margin.top - margin.bottom;

	function updateChart() {
		if (!svgElement || !data.length) return;

		const chart = select(chartGroup);
		chart.selectAll('*').remove();

		// Scales
		const yScale = scaleBand()
			.domain(data.map((d) => d.label))
			.range([0, innerHeight])
			.padding(0.2);

		const xScale = scaleLinear()
			.domain([0, max(data, (d) => d.value) || 1])
			.range([0, innerWidth]);

		// Bars
		const bars = chart
			.selectAll('.bar')
			.data(data)
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
				.attr('fill', 'rgba(148, 163, 184, 0.25)')
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
			.attr('rx', 6);

		// Animate bars
		barRects
			.transition()
			.duration(800)
			.delay((d, i) => i * 100)
			.attr('width', (d) => xScale(d.value));

		// Value labels inside bars
		bars
			.append('text')
			.attr('class', 'bar-value')
			.attr('x', (d) => xScale(d.value) - 10)
			.attr('y', (d) => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', 'end')
			.attr('fill', '#0f172a')
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
			.attr('fill', '#475569')
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
			.data(data)
			.enter()
			.append('text')
			.attr('class', 'y-label')
			.attr('x', -10)
			.attr('y', (d) => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', 'end')
			.attr('fill', '#1f2937')
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

<div class="bar-chart-container">
		<svg bind:this={svgElement} {width} {height} class="bar-chart">
		<defs>
				<linearGradient id="bar-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" style="stop-color:#4c6ef5;stop-opacity:1" />
					<stop offset="100%" style="stop-color:#38bdf8;stop-opacity:1" />
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

	{#if data.length === 0}
		<div class="overlay">
			<div class="empty-text">No responses yet</div>
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
		background-color: rgba(255, 255, 255, 0.82);
		border: 1px solid rgba(148, 163, 184, 0.35);
		border-radius: 1rem;
		color: #475569;
		backdrop-filter: blur(6px);
	}

	.empty-text {
		color: #475569;
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
</style>
