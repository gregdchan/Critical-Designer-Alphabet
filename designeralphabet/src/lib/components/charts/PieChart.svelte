<script lang="ts">
	import { select } from 'd3-selection';
	import { arc, pie } from 'd3-shape';
	import { scaleOrdinal } from 'd3-scale';
	import { interpolate } from 'd3-interpolate';
	import { onMount, afterUpdate } from 'svelte';
	import { useResponses, useQuestions } from '$lib/hooks/useSupabaseRealtime';

	export let roomCode: string = '';
	export let questionId: string = '';
	export let width = 400;
	export let height = 400;
	export let showLegend = true;

	let svgElement: SVGSVGElement;
	let chartGroup: SVGGElement;
	let data: Array<{ label: string; value: number; percentage: number }> = [];
	let previousData: Array<{ label: string; value: number }> = [];
	let loading = true;
	let error: string | null = null;

	const margin = { top: 20, right: 20, bottom: 20, left: 20 };
	$: radius = Math.min(width, height) / 2 - Math.max(...Object.values(margin));
	$: centerX = width / 2;
	$: centerY = height / 2;

	const colors = [
		'#3b82f6', // blue
		'#8b5cf6', // purple
		'#ec4899', // pink
		'#f59e0b', // amber
		'#10b981', // emerald
		'#06b6d4', // cyan
		'#6366f1', // indigo
		'#f43f5e'  // rose
	];

	const colorScale = scaleOrdinal<string>().range(colors);

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

		const questionResponses = responses.filter((r) => r.question_id === questionId);
		const options = question.options || [];

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

		// Filter out zero values and calculate percentages
		data = responseCounts
			.filter((rc) => rc.value > 0)
			.map((rc) => ({
				label: rc.label,
				value: rc.value,
				percentage: totalCount > 0 ? (rc.value / totalCount) * 100 : 0
			}));

		if (svgElement && chartGroup) {
			updateChart();
		}
	}

	function updateChart() {
		if (!svgElement || !chartGroup || data.length === 0) return;

		const chart = select(chartGroup);

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
			.attr('stroke', '#1e293b')
			.attr('stroke-width', 2)
			.style('cursor', 'pointer')
			.attr('opacity', 0)
			.on('mouseover', handleMouseOver)
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
			.attr('fill', 'white')
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
			.attr('fill', 'rgb(148, 163, 184)')
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

	function handleMouseOut(event: MouseEvent) {
		select(event.currentTarget as Element)
			.transition()
			.duration(200)
			.attr('opacity', 1)
			.attr('transform', 'translate(0, 0)');
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
	.pie-chart-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.pie-chart-container.with-legend {
		flex-direction: row;
	}

	.pie-chart {
		flex-shrink: 0;
	}

	.legend {
		flex: 1;
		min-width: 200px;
		max-width: 300px;
	}

	.legend-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: rgb(148, 163, 184);
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
		transition: background-color 0.2s;
	}

	.legend-item:hover {
		background-color: rgba(51, 65, 85, 0.5);
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
		color: rgb(203, 213, 225);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.legend-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: rgb(226, 232, 240);
		tabular-nums: true;
	}

	.legend-percentage {
		width: 3.5rem;
		text-align: right;
		font-size: 0.75rem;
		color: rgb(148, 163, 184);
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

	:global(.pie-chart .slice-path) {
		filter: url(#pie-glow);
		transition: all 0.2s ease;
	}
</style>
