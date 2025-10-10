<script lang="ts">
	import { select } from 'd3-selection';
	import { scaleLinear, scaleSqrt } from 'd3-scale';
import BaseChart from './BaseChart.svelte';
import { useResponses } from '$lib/hooks/useSupabaseRealtime';
import { getRiskColor, getThemeColors } from '$lib/utils/colors';
	import type { RiskDatum, ChartDimensions } from '$lib/types/charts';

	export let roomCode: string;
	export let theme: 'dark' | 'light' = 'dark';
	export let width = 600;
	export let height = 500;

	let svgElement: SVGSVGElement;
	let dimensions: ChartDimensions;
	let fallbackDimensions: ChartDimensions = {
		width,
		height,
		innerWidth: width,
		innerHeight: height,
		margins: { top: 0, right: 0, bottom: 0, left: 0 }
	};
	let tooltip: { show: boolean; x: number; y: number; data: RiskDatum | null } = {
		show: false,
		x: 0,
		y: 0,
		data: null
	};

	// Data state
	let responses: any[] = [];
	let riskData: RiskDatum[] = [];
	let loading = true;
	let error: string | null = null;

	// Set up realtime data subscription
	useResponses(roomCode, (state) => {
		responses = state.data;
		loading = state.loading;
		error = state.error;
		updateRiskData();
	});

	function updateRiskData() {
		if (!responses.length) {
			riskData = [];
			return;
		}

		// Filter for risk-related responses
		const riskResponses = responses.filter((response) => {
			const lens = response.questions?.lens?.toLowerCase();
			return lens === 'risk' || response.text.toLowerCase().includes('risk');
		});

		// Transform responses to risk data
		riskData = riskResponses.map((response, index) => {
			// Use structured metadata if available, otherwise use defaults
			const metadata = response.metadata;
			const hasRiskMetadata = metadata && metadata.type === 'riskAssessment';

			// Get impact and likelihood from metadata or use defaults
			const impact = hasRiskMetadata ? metadata.impact : 3;
			const likelihood = hasRiskMetadata ? metadata.likelihood : 3;

			return {
				id: response.id,
				risk: response.text,
				impact: Math.max(1, Math.min(5, impact)),
				likelihood: Math.max(1, Math.min(5, likelihood)),
				votes: voteCount,
				text: response.text
			};
		});

		if (svgElement && dimensions) {
			updateVisualization();
		}
	}

	function updateVisualization() {
		if (!svgElement || !dimensions || !riskData.length) return;

		const { innerWidth, innerHeight } = dimensions;
 		const themeColors = getThemeColors();

		// Scales
		const xScale = scaleLinear().domain([0.5, 5.5]).range([0, innerWidth]);

		const yScale = scaleLinear().domain([0.5, 5.5]).range([innerHeight, 0]);

		const radiusScale = scaleSqrt()
			.domain([0, Math.max(...riskData.map((d) => d.votes))])
			.range([8, 30]);

		const chart = select(svgElement).select('.chart-content');

		// Remove existing elements
		chart.selectAll('*').remove();

		// Add quadrant backgrounds
		const quadrants = [
			{
				x: 0,
				y: 0,
				width: innerWidth / 2,
				height: innerHeight / 2,
				risk: 'low',
				label: 'Low Impact\nHigh Likelihood'
			},
			{
				x: innerWidth / 2,
				y: 0,
				width: innerWidth / 2,
				height: innerHeight / 2,
				risk: 'high',
				label: 'High Impact\nHigh Likelihood'
			},
			{
				x: 0,
				y: innerHeight / 2,
				width: innerWidth / 2,
				height: innerHeight / 2,
				risk: 'low',
				label: 'Low Impact\nLow Likelihood'
			},
			{
				x: innerWidth / 2,
				y: innerHeight / 2,
				width: innerWidth / 2,
				height: innerHeight / 2,
				risk: 'medium',
				label: 'High Impact\nLow Likelihood'
			}
		];

	chart
		.selectAll('.quadrant')
		.data(quadrants)
		.enter()
		.append('rect')
		.attr('class', 'quadrant')
		.attr('x', (d) => d.x)
		.attr('y', (d) => d.y)
		.attr('width', (d) => d.width)
		.attr('height', (d) => d.height)
		.attr('fill', (d) => {
			switch (d.risk) {
				case 'low':
					return 'hsl(var(--risk-low) / 0.12)';
				case 'medium':
					return 'hsl(var(--risk-medium) / 0.12)';
				case 'high':
					return 'hsl(var(--risk-high) / 0.12)';
				default:
					return 'hsl(var(--surface) / 0.08)';
			}
		})
		.attr('stroke', (d) => {
			switch (d.risk) {
				case 'low':
					return themeColors.risk.low;
				case 'medium':
					return themeColors.risk.medium;
				case 'high':
					return themeColors.risk.high;
				default:
					return 'hsl(var(--border-subtle) / 0.35)';
			}
		})
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '5,5')
			.attr('opacity', 0.5);

		// Add quadrant labels
		chart
			.selectAll('.quadrant-label')
			.data(quadrants)
			.enter()
			.append('text')
			.attr('class', 'quadrant-label')
			.attr('x', (d) => d.x + d.width / 2)
			.attr('y', (d) => d.y + 20)
			.attr('text-anchor', 'middle')
			.attr('fill', 'currentColor')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '10px')
			.attr('opacity', 0.6)
			.selectAll('tspan')
			.data((d) => d.label.split('\n'))
			.enter()
			.append('tspan')
			.attr('x', function () {
				return select(this.parentNode).attr('x');
			})
			.attr('dy', (d, i) => (i === 0 ? 0 : '1.2em'))
			.text((d) => d);

		// Add grid lines
		for (let i = 1; i <= 5; i++) {
			// Vertical lines
			chart
				.append('line')
				.attr('class', 'grid-line')
				.attr('x1', xScale(i))
				.attr('x2', xScale(i))
				.attr('y1', 0)
				.attr('y2', innerHeight)
				.attr('stroke', 'currentColor')
				.attr('stroke-opacity', 0.1)
				.attr('stroke-dasharray', '2,2');

			// Horizontal lines
			chart
				.append('line')
				.attr('class', 'grid-line')
				.attr('x1', 0)
				.attr('x2', innerWidth)
				.attr('y1', yScale(i))
				.attr('y2', yScale(i))
				.attr('stroke', 'currentColor')
				.attr('stroke-opacity', 0.1)
				.attr('stroke-dasharray', '2,2');
		}

		// Add risk bubbles
		const bubbles = chart
			.selectAll('.risk-bubble')
			.data(riskData)
			.enter()
			.append('circle')
			.attr('class', 'risk-bubble')
			.attr('cx', (d) => xScale(d.likelihood))
			.attr('cy', (d) => yScale(d.impact))
			.attr('r', 0)
			.attr('fill', (d) => getRiskColor(d.impact, d.likelihood))
			.attr('stroke', (d) => getRiskColor(d.impact, d.likelihood))
			.attr('stroke-width', 2)
			.attr('opacity', 0.8)
			.attr('filter', 'url(#neon-glow)')
			.style('cursor', 'pointer');

		// Animate bubbles
		bubbles
			.transition()
			.duration(500)
			.delay((d, i) => i * 100)
			.attr('r', (d) => radiusScale(d.votes || 5));

		// Add interactions
		bubbles
			.on('mouseover', handleMouseOver)
			.on('mousemove', handleMouseMove)
			.on('mouseout', handleMouseOut)
			.on('click', handleClick);

		// Add axes
		const xAxis = chart
			.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0, ${innerHeight})`);

		const yAxis = chart.append('g').attr('class', 'y-axis');

		// X-axis
		xAxis
			.append('line')
			.attr('x1', 0)
			.attr('x2', innerWidth)
			.attr('stroke', 'currentColor')
			.attr('stroke-opacity', 0.3);

		xAxis
			.append('text')
			.attr('x', innerWidth / 2)
			.attr('y', 35)
			.attr('text-anchor', 'middle')
			.attr('fill', 'currentColor')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '14px')
			.text('Likelihood →');

		// Y-axis
		yAxis
			.append('line')
			.attr('y1', 0)
			.attr('y2', innerHeight)
			.attr('stroke', 'currentColor')
			.attr('stroke-opacity', 0.3);

		yAxis
			.append('text')
			.attr('x', -innerHeight / 2)
			.attr('y', -25)
			.attr('text-anchor', 'middle')
			.attr('transform', 'rotate(-90)')
			.attr('fill', 'currentColor')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '14px')
			.text('← Impact');

		// Add axis labels
		for (let i = 1; i <= 5; i++) {
			xAxis
				.append('text')
				.attr('x', xScale(i))
				.attr('y', 20)
				.attr('text-anchor', 'middle')
				.attr('fill', 'currentColor')
				.attr('font-family', 'Orbitron, sans-serif')
				.attr('font-size', '12px')
				.text(i);

			yAxis
				.append('text')
				.attr('x', -10)
				.attr('y', yScale(i))
				.attr('text-anchor', 'end')
				.attr('dy', '0.35em')
				.attr('fill', 'currentColor')
				.attr('font-family', 'Orbitron, sans-serif')
				.attr('font-size', '12px')
				.text(i);
		}

		// Add legend
		const legend = chart
			.append('g')
			.attr('class', 'legend')
			.attr('transform', `translate(${innerWidth - 150}, 20)`);

	const legendData = [
		{ color: themeColors.risk.low, label: 'Low Risk' },
		{ color: themeColors.risk.medium, label: 'Medium Risk' },
		{ color: themeColors.risk.high, label: 'High Risk' },
		{ color: themeColors.risk.critical, label: 'Critical Risk' }
	];

		legend
			.selectAll('.legend-item')
			.data(legendData)
			.enter()
			.append('g')
			.attr('class', 'legend-item')
			.attr('transform', (d, i) => `translate(0, ${i * 20})`)
			.each(function (d) {
				const item = select(this);

				item
					.append('circle')
					.attr('r', 6)
					.attr('fill', d.color)
					.attr('stroke', d.color)
					.attr('stroke-width', 1);

				item
					.append('text')
					.attr('x', 15)
					.attr('dy', '0.35em')
					.attr('fill', 'currentColor')
					.attr('font-family', 'Orbitron, sans-serif')
					.attr('font-size', '11px')
					.text(d.label);
			});
	}

	function handleMouseOver(event: MouseEvent, d: RiskDatum) {
		tooltip = {
			show: true,
			x: event.offsetX,
			y: event.offsetY,
			data: d
		};

		// Highlight bubble
		select(event.currentTarget)
			.transition()
			.duration(200)
			.attr('stroke-width', 4)
			.attr('r', function () {
				return Number(select(this).attr('r')) * 1.2;
			});
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
		const radiusScale = scaleSqrt()
			.domain([0, Math.max(...riskData.map((d) => d.votes))])
			.range([8, 30]);

		select(event.currentTarget)
			.transition()
			.duration(200)
			.attr('stroke-width', 2)
			.attr('r', (d: RiskDatum) => radiusScale(d.votes || 5));
	}

	function handleClick(event: MouseEvent, d: RiskDatum) {
		console.log('Risk clicked:', d);
		// Add click behavior here
	}

	function handleResize(newDimensions: ChartDimensions) {
		dimensions = newDimensions;
		fallbackDimensions = newDimensions;
		if (riskData.length > 0) {
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
	title="Risk Impact Matrix"
	className="risk-impact-matrix-chart"
	ariaLabel="Risk impact matrix showing identified risks plotted by likelihood and impact"
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
				Loading risk data...
			</text>
		{:else if error}
			<text
				x={getCenterX()}
				y={getCenterY()}
				text-anchor="middle"
				fill="hsl(var(--accent-critical))"
				class="chart-text"
			>
				Error: {error}
			</text>
		{:else if riskData.length === 0}
			<text
				x={getCenterX()}
				y={getCenterY()}
				text-anchor="middle"
				fill="currentColor"
				class="chart-text"
			>
				No risk data available...
			</text>
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="tooltip">
		{#if tooltip.show && tooltip.data}
			<div
				class="tooltip bg-gray-900 text-white p-3 rounded-lg shadow-lg border max-w-xs"
				style="transform: translate({tooltip.x + 10}px, {tooltip.y -
					10}px); border-color: {getRiskColor(tooltip.data.impact, tooltip.data.likelihood)}"
			>
				<div
					class="font-bold text-sm mb-1"
					style="color: {getRiskColor(tooltip.data.impact, tooltip.data.likelihood)}"
				>
					Risk Assessment
				</div>
				<div class="text-xs mb-2">
					Impact: {tooltip.data.impact}/5 • Likelihood: {tooltip.data.likelihood}/5 • {tooltip.data
						.votes} votes
				</div>
				<div class="text-xs text-gray-300 leading-tight">
					{tooltip.data.text.substring(0, 150)}{tooltip.data.text.length > 150 ? '...' : ''}
				</div>
			</div>
		{/if}
	</svelte:fragment>
</BaseChart>

<style>
	:global(.risk-impact-matrix-chart .risk-bubble) {
		transition: all 0.2s ease;
	}

	:global(.risk-impact-matrix-chart .risk-bubble:hover) {
		opacity: 1;
	}

	:global(.risk-impact-matrix-chart .legend) {
		filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.3));
	}

	.tooltip {
		z-index: 1000;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
	}
</style>
