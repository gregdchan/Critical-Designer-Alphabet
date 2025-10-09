<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { select } from 'd3-selection';
	import { line, curveCardinal } from 'd3-shape';
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { extent, max } from 'd3-array';
	import BaseChart from './BaseChart.svelte';
import { useTimeline } from '$lib/hooks/useSupabaseRealtime';
import { getThemeColors } from '$lib/utils/colors';
	import type { ParticipationPoint, ChartDimensions } from '$lib/types/charts';

	export let roomCode: string;
	export let theme: 'dark' | 'light' = 'dark';
	export let width = 600;
	export let height = 300;

	let svgElement: SVGSVGElement;
	let dimensions: ChartDimensions;
	let updateInterval: NodeJS.Timeout;
	let fallbackDimensions: ChartDimensions = {
		width,
		height,
		innerWidth: width,
		innerHeight: height,
		margins: { top: 0, right: 0, bottom: 0, left: 0 }
	};

	// Data state
	let timelineData: any[] = [];
	let participationData: ParticipationPoint[] = [];
	let loading = true;
	let error: string | null = null;

	// Chart settings
	const maxDataPoints = 30; // Last 5 minutes in 10-second intervals
	const updateIntervalMs = 10000; // Update every 10 seconds

	// Set up realtime data subscription
	useTimeline(roomCode, (state) => {
		timelineData = state.data;
		loading = state.loading;
		error = state.error;
		updateParticipationData();
	});

	onMount(() => {
		// Set up periodic updates
		updateInterval = setInterval(() => {
			updateParticipationData();
		}, updateIntervalMs);

		return () => {
			if (updateInterval) {
				clearInterval(updateInterval);
			}
		};
	});

	onDestroy(() => {
		if (updateInterval) {
			clearInterval(updateInterval);
		}
	});

	function updateParticipationData() {
		if (!timelineData.length) {
			participationData = [];
			return;
		}

		const now = new Date();
		const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

		// Create time buckets for the last 5 minutes
		const buckets = [];
		for (let i = 0; i < maxDataPoints; i++) {
			const time = new Date(
				now.getTime() - (maxDataPoints - 1 - i) * ((5 * 60 * 1000) / maxDataPoints)
			);
			buckets.push({
				timestamp: time,
				submissions: 0,
				events: []
			});
		}

		// Count events in each bucket
		timelineData.forEach((event) => {
			const eventTime = new Date(event.created_at);
			if (eventTime >= fiveMinutesAgo && eventTime <= now) {
				const bucketIndex = Math.floor(
					(eventTime.getTime() - fiveMinutesAgo.getTime()) / ((5 * 60 * 1000) / maxDataPoints)
				);
				if (bucketIndex >= 0 && bucketIndex < buckets.length) {
					buckets[bucketIndex].submissions++;
					buckets[bucketIndex].events.push(event);
				}
			}
		});

		// Calculate fairness multiplier (simplified)
		const totalParticipants = new Set(timelineData.map((e) => e.participant_id)).size;
		const recentParticipants = new Set(
			timelineData
				.filter((e) => new Date(e.created_at) >= fiveMinutesAgo)
				.map((e) => e.participant_id)
		).size;

		const fairnessMultiplier =
			totalParticipants > 0 ? 1 + (recentParticipants / totalParticipants) * 0.2 : 1;

		// Convert to participation data
		participationData = buckets.map((bucket) => ({
			timestamp: bucket.timestamp,
			submissions: bucket.submissions,
			fairnessMultiplier: fairnessMultiplier
		}));

		if (svgElement && dimensions) {
			updateVisualization();
		}
	}

	function updateVisualization() {
		if (!svgElement || !dimensions || !participationData.length) return;

		const { innerWidth, innerHeight } = dimensions;
		const themeColors = getThemeColors();
		const primary = themeColors.brand;

		// Scales
		const xScale = scaleTime()
			.domain(extent(participationData, (d) => d.timestamp) as [Date, Date])
			.range([0, innerWidth]);

		const yScale = scaleLinear()
			.domain([0, max(participationData, (d) => d.submissions) || 10])
			.range([innerHeight, 0]);

		// Line generator
		const lineGenerator = line<ParticipationPoint>()
			.x((d) => xScale(d.timestamp))
			.y((d) => yScale(d.submissions))
			.curve(curveCardinal);

		const chart = select(svgElement).select('.chart-content');

		// Remove existing elements
		chart.selectAll('*').remove();

		// Add gradient definition for line
		const defs = select(svgElement).select('defs');

		const gradient = defs
			.append('linearGradient')
			.attr('id', 'pulse-gradient')
			.attr('gradientUnits', 'userSpaceOnUse')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', 0)
			.attr('y2', innerHeight);

		gradient
			.append('stop')
			.attr('offset', '0%')
			.attr('stop-color', primary)
			.attr('stop-opacity', 0.85);

		gradient
			.append('stop')
			.attr('offset', '100%')
			.attr('stop-color', primary)
			.attr('stop-opacity', 0.1);

		// Add area under curve
		const areaGenerator = line<ParticipationPoint>()
			.x((d) => xScale(d.timestamp))
			.y0(innerHeight)
			.y1((d) => yScale(d.submissions))
			.curve(curveCardinal);

		chart
			.append('path')
			.datum(participationData)
			.attr('class', 'pulse-area')
			.attr('fill', 'url(#pulse-gradient)')
			.attr('d', areaGenerator as any)
			.attr('opacity', 0)
			.transition()
			.duration(500)
			.attr('opacity', 1);

		// Add main line
		chart
			.append('path')
			.datum(participationData)
			.attr('class', 'pulse-line')
			.attr('fill', 'none')
			.attr('stroke', primary)
			.attr('stroke-width', 3)
			.attr('filter', 'url(#neon-glow)')
			.attr('d', lineGenerator)
			.attr('stroke-dasharray', function () {
				return this.getTotalLength();
			})
			.attr('stroke-dashoffset', function () {
				return this.getTotalLength();
			})
			.transition()
			.duration(1000)
			.attr('stroke-dashoffset', 0);

		// Add data points
	chart
		.selectAll('.pulse-dot')
		.data(participationData)
		.enter()
		.append('circle')
		.attr('class', 'pulse-dot')
		.attr('cx', (d) => xScale(d.timestamp))
		.attr('cy', (d) => yScale(d.submissions))
		.attr('r', 0)
		.attr('fill', primary)
		.attr('stroke', 'white')
			.attr('stroke-width', 2)
			.attr('filter', 'url(#neon-glow)')
			.transition()
			.duration(300)
			.delay((d, i) => i * 50)
			.attr('r', (d, i) => (i === participationData.length - 1 ? 6 : 3));

		// Add pulsing animation to latest point
		const latestDot = chart.select('.pulse-dot:last-child');

		function pulseLatest() {
			latestDot
				.transition()
				.duration(1000)
				.attr('r', 10)
				.attr('opacity', 0.5)
				.transition()
				.duration(1000)
				.attr('r', 6)
				.attr('opacity', 1)
				.on('end', pulseLatest);
		}

		setTimeout(pulseLatest, 1500);

		// Add axes
		const xAxis = chart
			.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0, ${innerHeight})`);

		const yAxis = chart.append('g').attr('class', 'y-axis');

		// Simple axis lines
		xAxis
			.append('line')
			.attr('x1', 0)
			.attr('x2', innerWidth)
			.attr('y1', 0)
			.attr('y2', 0)
			.attr('stroke', 'currentColor')
			.attr('stroke-opacity', 0.3);

		yAxis
			.append('line')
			.attr('x1', 0)
			.attr('x2', 0)
			.attr('y1', 0)
			.attr('y2', innerHeight)
			.attr('stroke', 'currentColor')
			.attr('stroke-opacity', 0.3);

		// Add axis labels
		xAxis
			.append('text')
			.attr('x', innerWidth / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', 'currentColor')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '12px')
			.text('Time (last 5 minutes)');

		yAxis
			.append('text')
			.attr('x', -innerHeight / 2)
			.attr('y', -25)
			.attr('text-anchor', 'middle')
			.attr('transform', 'rotate(-90)')
			.attr('fill', 'currentColor')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '12px')
			.text('Submissions/min');

		// Add fairness multiplier indicator
		const latestData = participationData[participationData.length - 1];
		if (latestData) {
			const multiplierGroup = chart
				.append('g')
				.attr('class', 'fairness-indicator')
				.attr('transform', `translate(${innerWidth - 100}, 20)`);

		multiplierGroup
			.append('rect')
			.attr('width', 90)
			.attr('height', 40)
			.attr('rx', 5)
			.attr('fill', 'hsl(var(--surface) / 0.92)')
			.attr('stroke', themeColors.accentWarm)
			.attr('stroke-width', 1);

			multiplierGroup
				.append('text')
				.attr('x', 45)
				.attr('y', 15)
				.attr('text-anchor', 'middle')
				.attr('fill', 'currentColor')
				.attr('font-family', 'Orbitron, sans-serif')
				.attr('font-size', '10px')
				.text('Fairness');

		multiplierGroup
			.append('text')
			.attr('x', 45)
			.attr('y', 30)
			.attr('text-anchor', 'middle')
			.attr('fill', themeColors.accentWarm)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text(`×${latestData.fairnessMultiplier.toFixed(1)}`);
		}
	}

	function handleResize(newDimensions: ChartDimensions) {
		dimensions = newDimensions;
		fallbackDimensions = newDimensions;
		if (participationData.length > 0) {
			updateVisualization();
		}
	}

	const getCenterX = () => (dimensions ?? fallbackDimensions).innerWidth / 2;
	const getCenterY = () => (dimensions ?? fallbackDimensions).innerHeight / 2;
</script>

<BaseChart
	{width}
	{height}
	{theme}
	title="Participation Pulse"
	className="participation-pulse-chart"
	ariaLabel="Real-time participation activity showing submissions per minute over the last 5 minutes"
	on:resize={(event) => handleResize(event.detail)}
>
	<svelte:fragment slot="default">
		{#if loading}
			<text
				x={getCenterX()}
				y={getCenterY()}
				text-anchor="middle"
				fill="currentColor"
				class="chart-text"
			>
				Loading activity data...
			</text>
		{:else if error}
			<text
				x={getCenterX()}
				y={getCenterY()}
				text-anchor="middle"
				fill="#ef4444"
				class="chart-text"
			>
				Error: {error}
			</text>
		{:else if participationData.length === 0}
			<text
				x={getCenterX()}
				y={getCenterY()}
				text-anchor="middle"
				fill="currentColor"
				class="chart-text"
			>
				Waiting for activity...
			</text>
		{/if}
	</svelte:fragment>
</BaseChart>

<style>
	:global(.participation-pulse-chart .pulse-line) {
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	:global(.participation-pulse-chart .pulse-dot) {
		cursor: pointer;
		transition: all 0.2s ease;
	}

	:global(.participation-pulse-chart .pulse-dot:hover) {
		r: 5;
	}

	:global(.participation-pulse-chart .fairness-indicator) {
		filter: drop-shadow(0 0 5px rgba(170, 255, 0, 0.3));
	}
</style>
