<script lang="ts">
	import { select } from 'd3-selection';
	import { arc } from 'd3-shape';
	import { interpolate } from 'd3-interpolate';
	import BaseChart from './BaseChart.svelte';
	import { useParticipants, useResponses } from '$lib/hooks/useSupabaseRealtime';
	import { NEON_COLORS } from '$lib/utils/colors';
	import type { ChartDimensions } from '$lib/types/charts';

	export let roomCode: string;
	export let theme: 'dark' | 'light' = 'dark';
	export let width = 300;
	export let height = 300;

	let svgElement: SVGSVGElement | undefined;
	let dimensions: ChartDimensions | undefined;
	let fallbackDimensions: ChartDimensions = {
		width,
		height,
		innerWidth: width,
		innerHeight: height,
		margins: { top: 0, right: 0, bottom: 0, left: 0 }
	};

	// Data state
	let participants: any[] = [];
	let responses: any[] = [];
	let loading = true;
	let error: string | null = null;

	// Calculated metrics
	let totalParticipants = 0;
	let activeParticipants = 0;
	let inclusivityPercentage = 0;
	let fairnessMultiplier = 1.0;

	// Set up realtime data subscriptions
	useParticipants(roomCode, (state) => {
		participants = state.data;
		loading = state.loading;
		error = state.error;
		calculateMetrics();
	});

	useResponses(roomCode, (state) => {
		responses = state.data;
		calculateMetrics();
	});

	function calculateMetrics() {
		if (!participants.length) {
			totalParticipants = 0;
			activeParticipants = 0;
			inclusivityPercentage = 0;
			fairnessMultiplier = 1.0;
			return;
		}

		totalParticipants = participants.length;

		// Count participants who have submitted responses
		const participantIds = new Set(responses.map((r) => r.participant_id));
		activeParticipants = participantIds.size;

		// Calculate inclusivity percentage
		inclusivityPercentage =
			totalParticipants > 0 ? (activeParticipants / totalParticipants) * 100 : 0;

		// Calculate fairness multiplier (boost for higher participation)
		fairnessMultiplier = 1.0 + (inclusivityPercentage / 100) * 0.2;

		if (svgElement && dimensions) {
			updateVisualization();
		}
	}

	function updateVisualization() {
		if (!svgElement || !dimensions) return;

		const { innerWidth, innerHeight } = dimensions;
		const radius = Math.min(innerWidth, innerHeight) / 2 - 20;
		const centerX = innerWidth / 2;
		const centerY = innerHeight / 2;

		// Arc generator for gauge
		const arcGenerator = arc()
			.innerRadius(radius * 0.7)
			.outerRadius(radius * 0.9)
			.cornerRadius(5);

		// Gauge spans 180 degrees (half circle)
		const startAngle = -Math.PI / 2 - Math.PI / 2; // Start at bottom left
		const endAngle = -Math.PI / 2 + Math.PI / 2; // End at bottom right

		const chart = select(svgElement).select('.chart-content');

		// Remove existing elements
		chart.selectAll('*').remove();

		// Background arc
		chart
			.append('path')
			.attr('class', 'gauge-background')
			.attr('transform', `translate(${centerX}, ${centerY})`)
			.attr(
				'd',
				arcGenerator({
					startAngle: startAngle,
					endAngle: endAngle,
					innerRadius: radius * 0.7,
					outerRadius: radius * 0.9
				})
			)
			.attr('fill', 'rgba(255, 255, 255, 0.1)')
			.attr('stroke', 'rgba(255, 255, 255, 0.2)')
			.attr('stroke-width', 1);

		// Progress arc
		const progressAngle = startAngle + (endAngle - startAngle) * (inclusivityPercentage / 100);

		const progressArc = chart
			.append('path')
			.attr('class', 'gauge-progress')
			.attr('transform', `translate(${centerX}, ${centerY})`)
			.attr('fill', getInclusivityColor(inclusivityPercentage))
			.attr('stroke', getInclusivityColor(inclusivityPercentage))
			.attr('stroke-width', 2)
			.attr('filter', 'url(#neon-glow)')
			.attr('opacity', 0);

		// Animate progress arc
		progressArc
			.transition()
			.duration(1500)
			.attr('opacity', 1)
			.attrTween('d', () => {
				const interpolateAngle = interpolate(startAngle, progressAngle);
				return (t: number) => {
					const result = arcGenerator({
						startAngle: startAngle,
						endAngle: interpolateAngle(t),
						innerRadius: radius * 0.7,
						outerRadius: radius * 0.9
					});
					return result || '';
				};
			});

		// Add tick marks
		const tickCount = 11; // 0, 10, 20, ..., 100
		for (let i = 0; i < tickCount; i++) {
			const angle = startAngle + (endAngle - startAngle) * (i / (tickCount - 1));
			const tickInner = radius * 0.65;
			const tickOuter = radius * 0.7;

			chart
				.append('line')
				.attr('class', 'gauge-tick')
				.attr('transform', `translate(${centerX}, ${centerY})`)
				.attr('x1', Math.cos(angle) * tickInner)
				.attr('y1', Math.sin(angle) * tickInner)
				.attr('x2', Math.cos(angle) * tickOuter)
				.attr('y2', Math.sin(angle) * tickOuter)
				.attr('stroke', 'currentColor')
				.attr('stroke-width', i % 2 === 0 ? 2 : 1)
				.attr('opacity', 0.5);

			// Add labels for major ticks
			if (i % 2 === 0) {
				chart
					.append('text')
					.attr('class', 'gauge-label')
					.attr('transform', `translate(${centerX}, ${centerY})`)
					.attr('x', Math.cos(angle) * (radius * 0.6))
					.attr('y', Math.sin(angle) * (radius * 0.6))
					.attr('text-anchor', 'middle')
					.attr('dy', '0.35em')
					.attr('fill', 'currentColor')
					.attr('font-family', 'Orbitron, sans-serif')
					.attr('font-size', '10px')
					.text(`${i * 10}%`);
			}
		}

		// Needle/pointer
		const needleAngle = startAngle + (endAngle - startAngle) * (inclusivityPercentage / 100);

		const needle = chart
			.append('g')
			.attr('class', 'gauge-needle')
			.attr('transform', `translate(${centerX}, ${centerY})`);

		needle
			.append('line')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', Math.cos(startAngle) * radius * 0.5)
			.attr('y2', Math.sin(startAngle) * radius * 0.5)
			.attr('stroke', '#ff2aad')
			.attr('stroke-width', 3)
			.attr('stroke-linecap', 'round')
			.attr('filter', 'url(#neon-glow)')
			.transition()
			.duration(2000)
			.attr('x2', Math.cos(needleAngle) * radius * 0.5)
			.attr('y2', Math.sin(needleAngle) * radius * 0.5);

		// Center dot
		needle
			.append('circle')
			.attr('r', 5)
			.attr('fill', '#ff2aad')
			.attr('stroke', 'white')
			.attr('stroke-width', 2)
			.attr('filter', 'url(#neon-glow)');

		// Center content
		const centerGroup = chart
			.append('g')
			.attr('class', 'center-content')
			.attr('transform', `translate(${centerX}, ${centerY + radius * 0.3})`);

		// Percentage display
		centerGroup
			.append('text')
			.attr('class', 'percentage-text')
			.attr('text-anchor', 'middle')
			.attr('dy', '-0.5em')
			.attr('fill', getInclusivityColor(inclusivityPercentage))
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '24px')
			.attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text(`${Math.round(inclusivityPercentage)}%`)
			.transition()
			.duration(500)
			.delay(2000)
			.attr('opacity', 1);

		// Participation count
		centerGroup
			.append('text')
			.attr('class', 'participation-text')
			.attr('text-anchor', 'middle')
			.attr('dy', '0.5em')
			.attr('fill', 'currentColor')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '12px')
			.attr('opacity', 0)
			.text(`${activeParticipants}/${totalParticipants} active`)
			.transition()
			.duration(500)
			.delay(2200)
			.attr('opacity', 1);

		// Fairness multiplier
		centerGroup
			.append('text')
			.attr('class', 'multiplier-text')
			.attr('text-anchor', 'middle')
			.attr('dy', '1.5em')
			.attr('fill', NEON_COLORS.lime)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '14px')
			.attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text(`×${fairnessMultiplier.toFixed(1)}`)
			.transition()
			.duration(500)
			.delay(2400)
			.attr('opacity', 1);

		// Status label
		const statusText = getInclusivityStatus(inclusivityPercentage);
		centerGroup
			.append('text')
			.attr('class', 'status-text')
			.attr('text-anchor', 'middle')
			.attr('dy', '2.5em')
			.attr('fill', 'currentColor')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '10px')
			.attr('opacity', 0)
			.text(statusText)
			.transition()
			.duration(500)
			.delay(2600)
			.attr('opacity', 1);
	}

	function getInclusivityColor(percentage: number): string {
		if (percentage >= 80) return NEON_COLORS.lime; // Green - Excellent
		if (percentage >= 60) return NEON_COLORS.yellow; // Yellow - Good
		if (percentage >= 40) return NEON_COLORS.orange; // Orange - Fair
		return NEON_COLORS.pink; // Pink - Needs improvement
	}

	function getInclusivityStatus(percentage: number): string {
		if (percentage >= 80) return 'Excellent';
		if (percentage >= 60) return 'Good';
		if (percentage >= 40) return 'Fair';
		return 'Improving';
	}

function handleResize(newDimensions: ChartDimensions) {
	dimensions = newDimensions;
	fallbackDimensions = newDimensions;
	updateVisualization();
}

	// Watch for changes
	$: if (svgElement && dimensions) {
		updateVisualization();
	}
</script>

<BaseChart
	{width}
	{height}
	{theme}
	title="Inclusivity Meter"
	className="inclusivity-meter-chart"
	ariaLabel={`Inclusivity gauge showing ${Math.round(inclusivityPercentage)}% participation with ${activeParticipants} of ${totalParticipants} participants active`}
	on:resize={(event) => handleResize(event.detail)}
	on:mounted={() => updateVisualization()}
>
	<svelte:fragment slot="default" let:svgElement={svg} let:dimensions={dims}>
		{@const _ = svg && dims ? ((svgElement = svg), (dimensions = dims), (fallbackDimensions = dims)) : null}
		{#if loading}
			<text
				x={(dimensions ?? fallbackDimensions).innerWidth / 2}
				y={(dimensions ?? fallbackDimensions).innerHeight / 2}
				text-anchor="middle"
				fill="currentColor"
				class="chart-text"
			>
				Loading participants...
			</text>
		{:else if error}
			<text
				x={(dimensions ?? fallbackDimensions).innerWidth / 2}
				y={(dimensions ?? fallbackDimensions).innerHeight / 2}
				text-anchor="middle"
				fill="#ef4444"
				class="chart-text"
			>
				Error: {error}
			</text>
		{/if}
	</svelte:fragment>
</BaseChart>

<style>
	:global(.inclusivity-meter-chart .gauge-progress) {
		transition: opacity 0.3s ease;
	}

	:global(.inclusivity-meter-chart .gauge-needle) {
		filter: drop-shadow(0 0 5px #ff2aad);
	}

	:global(.inclusivity-meter-chart .percentage-text) {
		text-shadow: 0 0 10px currentColor;
	}

	:global(.inclusivity-meter-chart .multiplier-text) {
		text-shadow: 0 0 8px currentColor;
	}
</style>
