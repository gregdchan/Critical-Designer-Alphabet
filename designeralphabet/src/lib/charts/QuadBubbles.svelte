<script lang="ts">
	import { select } from 'd3-selection';
	import { forceSimulation, forceManyBody, forceCenter, forceX, forceY } from 'd3-force';
	import { scaleSqrt } from 'd3-scale';
	import BaseChart from './BaseChart.svelte';
	import { useResponses } from '$lib/hooks/useSupabaseRealtime';
	import { getLensColor } from '$lib/utils/colors';
	import type { BubbleDatum, ChartDimensions } from '$lib/types/charts';

	export let roomCode: string;
	export let theme: 'dark' | 'light' = 'dark';
	export let width = 800;
	export let height = 600;

	let svgElement: SVGSVGElement;
	let dimensions: ChartDimensions;
	let tooltip: { show: boolean; x: number; y: number; data: BubbleDatum | null } = {
		show: false,
		x: 0,
		y: 0,
		data: null
	};

	// Data state
	let responses: any[] = [];
	let bubbleData: BubbleDatum[] = [];
	let loading = true;
	let error: string | null = null;

	// D3 elements
	let simulation: any;
	let bubbles: any;

	// Lens centers for force positioning
	const lensPositions = {
		Risk: { x: 0.2, y: 0.3 },
		Work: { x: 0.8, y: 0.3 },
		Sustainability: { x: 0.2, y: 0.7 },
		Ethics: { x: 0.8, y: 0.7 },
		Justice: { x: 0.5, y: 0.2 },
		Culture: { x: 0.5, y: 0.8 },
		Innovation: { x: 0.1, y: 0.5 },
		Governance: { x: 0.9, y: 0.5 }
	};

	// Set up realtime data subscription
	useResponses(roomCode, (state) => {
		responses = state.data;
		loading = state.loading;
		error = state.error;
		updateBubbleData();
	});

	function updateBubbleData() {
		if (!responses.length) {
			bubbleData = [];
			return;
		}

		// Group responses by lens and aggregate
		const lensGroups = responses.reduce((acc, response) => {
			const lens = response.questions?.lens || 'Unknown';
			if (!acc[lens]) {
				acc[lens] = [];
			}
			acc[lens].push(response);
			return acc;
		}, {});

		// Create bubble data
		bubbleData = Object.entries(lensGroups).map(([lens, items]: [string, any[]]) => {
			const totalVotes = items.reduce((sum, item) => sum + (item.votes?.length || 0), 0);
			const totalCards = items.reduce((sum, item) => sum + (item.cards?.length || 0), 0);

			// Sample representative text
			const representativeText = items
				.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
				.slice(0, 3)
				.map((item) => item.text)
				.join('; ');

			return {
				id: lens,
				lens,
				text: representativeText,
				votes: totalVotes,
				cardsCount: totalCards,
				count: items.length
			};
		});

		if (svgElement && dimensions) {
			updateVisualization();
		}
	}

	function updateVisualization() {
		if (!svgElement || !dimensions || !bubbleData.length) return;

		const { innerWidth, innerHeight } = dimensions;

		// Scales
		const radiusScale = scaleSqrt()
			.domain([0, Math.max(...bubbleData.map((d) => d.votes + d.cardsCount + d.count))])
			.range([20, 80]);

		// Update bubble data with positions
		bubbleData = bubbleData.map((d) => ({
			...d,
			radius: radiusScale(d.votes + d.cardsCount + d.count),
			x: d.x || (lensPositions[d.lens]?.x || 0.5) * innerWidth,
			y: d.y || (lensPositions[d.lens]?.y || 0.5) * innerHeight
		}));

		// Set up force simulation
		if (simulation) {
			simulation.stop();
		}

		simulation = forceSimulation(bubbleData)
			.force('charge', forceManyBody().strength(-100))
			.force('center', forceCenter(innerWidth / 2, innerHeight / 2))
			.force(
				'collision',
				forceManyBody()
					.strength(1)
					.distanceMax((d) => d.radius + 10)
			)
			.force(
				'x',
				forceX()
					.x((d) => (lensPositions[d.lens]?.x || 0.5) * innerWidth)
					.strength(0.3)
			)
			.force(
				'y',
				forceY()
					.y((d) => (lensPositions[d.lens]?.y || 0.5) * innerHeight)
					.strength(0.3)
			)
			.alpha(0.8)
			.alphaDecay(0.02);

		// Select chart content group
		const chart = select(svgElement).select('.chart-content');

		// Bind data
		bubbles = chart.selectAll('.bubble-group').data(bubbleData, (d) => d.id);

		// Remove old bubbles
		bubbles.exit().transition().duration(300).attr('opacity', 0).remove();

		// Add new bubble groups
		const bubblesEnter = bubbles
			.enter()
			.append('g')
			.attr('class', 'bubble-group')
			.attr('opacity', 0);

		// Add circles
		bubblesEnter
			.append('circle')
			.attr('class', 'bubble')
			.attr('r', 0)
			.attr('fill', (d) => getLensColor(d.lens))
			.attr('stroke', (d) => getLensColor(d.lens))
			.attr('stroke-width', 2)
			.attr('filter', 'url(#neon-glow)')
			.style('cursor', 'pointer');

		// Add labels
		bubblesEnter
			.append('text')
			.attr('class', 'bubble-label')
			.attr('text-anchor', 'middle')
			.attr('dy', '0.35em')
			.attr('fill', 'white')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.text((d) => d.lens);

		// Add vote count
		bubblesEnter
			.append('text')
			.attr('class', 'bubble-count')
			.attr('text-anchor', 'middle')
			.attr('dy', '1.5em')
			.attr('fill', 'white')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '12px')
			.text((d) => `${d.votes} votes`);

		// Merge enter and update selections
		bubbles = bubblesEnter.merge(bubbles);

		// Initial positioning and animations
		bubbles.transition().duration(500).attr('opacity', 1);

		bubbles
			.select('.bubble')
			.transition()
			.duration(500)
			.attr('r', (d) => d.radius);

		// Set up interactions
		bubbles
			.on('mouseover', handleMouseOver)
			.on('mousemove', handleMouseMove)
			.on('mouseout', handleMouseOut)
			.on('click', handleClick);

		// Update positions during simulation
		simulation.on('tick', () => {
			bubbles.attr('transform', (d) => `translate(${d.x},${d.y})`);
		});
	}

	function handleMouseOver(event: MouseEvent, d: BubbleDatum) {
		tooltip = {
			show: true,
			x: event.offsetX,
			y: event.offsetY,
			data: d
		};

		// Highlight bubble
		select(event.currentTarget)
			.select('.bubble')
			.transition()
			.duration(200)
			.attr('stroke-width', 4)
			.attr('opacity', 1);
	}

	function handleMouseMove(event: MouseEvent) {
		tooltip = {
			...tooltip,
			x: event.offsetX,
			y: event.offsetY
		};
	}

	function handleMouseOut(event: MouseEvent) {
		tooltip = {
			show: false,
			x: 0,
			y: 0,
			data: null
		};

		// Reset bubble
		select(event.currentTarget)
			.select('.bubble')
			.transition()
			.duration(200)
			.attr('stroke-width', 2)
			.attr('opacity', 0.8);
	}

	function handleClick(event: MouseEvent, d: BubbleDatum) {
		console.log('Bubble clicked:', d);
		// Add click behavior here (e.g., drill down to detailed view)
	}

	function handleResize(newDimensions: ChartDimensions) {
		dimensions = newDimensions;
		if (bubbleData.length > 0) {
			updateVisualization();
		}
	}
</script>

<BaseChart
	{width}
	{height}
	{theme}
	title="Response Bubbles by Lens"
	className="quad-bubbles-chart"
	ariaLabel="Bubble chart showing responses grouped by critical design lens"
	on:resize={(event) => handleResize(event.detail)}
>
	<svelte:fragment slot="default">
		{#if loading}
			<text
				x={dimensions.innerWidth / 2}
				y={dimensions.innerHeight / 2}
				text-anchor="middle"
				fill="currentColor"
				class="chart-text"
			>
				Loading responses...
			</text>
		{:else if error}
			<text
				x={dimensions.innerWidth / 2}
				y={dimensions.innerHeight / 2}
				text-anchor="middle"
				fill="#ef4444"
				class="chart-text"
			>
				Error: {error}
			</text>
		{:else if bubbleData.length === 0}
			<text
				x={dimensions.innerWidth / 2}
				y={dimensions.innerHeight / 2}
				text-anchor="middle"
				fill="currentColor"
				class="chart-text"
			>
				No responses yet...
			</text>
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="tooltip">
		{#if tooltip.show && tooltip.data}
			<div
				class="tooltip bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-neon-cyan max-w-xs"
				style="transform: translate({tooltip.x + 10}px, {tooltip.y - 10}px)"
			>
				<div class="font-bold text-sm mb-1" style="color: {getLensColor(tooltip.data.lens)}">
					{tooltip.data.lens}
				</div>
				<div class="text-xs mb-2">
					{tooltip.data.count} responses • {tooltip.data.votes} votes • {tooltip.data.cardsCount} cards
				</div>
				<div class="text-xs text-gray-300 leading-tight">
					{tooltip.data.text.substring(0, 100)}{tooltip.data.text.length > 100 ? '...' : ''}
				</div>
			</div>
		{/if}
	</svelte:fragment>
</BaseChart>

<style>
	:global(.quad-bubbles-chart .bubble) {
		opacity: 0.8;
		transition: all 0.2s ease;
	}

	:global(.quad-bubbles-chart .bubble:hover) {
		opacity: 1;
	}

	:global(.quad-bubbles-chart .bubble-label) {
		pointer-events: none;
		text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
	}

	:global(.quad-bubbles-chart .bubble-count) {
		pointer-events: none;
		text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
	}

	.tooltip {
		z-index: 1000;
		box-shadow: 0 0 20px rgba(0, 255, 247, 0.3);
	}
</style>
