<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { ChartDimensions, ChartMargins } from '$lib/types/charts';
	import { BACKGROUND_COLORS } from '$lib/utils/colors';

	export let width = 600;
	export let height = 400;
	export let margins: ChartMargins = { top: 20, right: 20, bottom: 30, left: 40 };
export let theme: 'dark' | 'light' = 'light';
	export let title = '';
	export let className = '';
	export let ariaLabel = '';

	const dispatch = createEventDispatcher<{
		resize: ChartDimensions;
		mounted: HTMLElement;
	}>();

	let containerElement: HTMLDivElement;
	let svgElement: SVGSVGElement;
	let dimensions: ChartDimensions;

	$: innerWidth = Math.max(0, width - margins.left - margins.right);
	$: innerHeight = Math.max(0, height - margins.bottom - margins.top);

	$: dimensions = {
		width,
		height,
		innerWidth,
		innerHeight,
		margins
	};

	$: if (dimensions) {
		dispatch('resize', dimensions);
	}

	onMount(() => {
		if (containerElement) {
			dispatch('mounted', containerElement);
		}

		const resizeObserver = new ResizeObserver(() => {
			if (containerElement) {
				const rect = containerElement.getBoundingClientRect();
				width = rect.width;
				height = rect.height;
			}
		});

		if (containerElement) {
			resizeObserver.observe(containerElement);
		}

		return () => {
			resizeObserver.disconnect();
		};
	});

	$: bgColor = theme === 'dark' ? '#1f2937' : BACKGROUND_COLORS.card;
	$: textColor = theme === 'dark' ? '#f8fafc' : '#1f2937';
</script>

<div
	bind:this={containerElement}
	class="chart-container {className}"
	style="background-color: {bgColor}; color: {textColor};"
	role="img"
	aria-label={ariaLabel || title}
>
	{#if title}
		<h3 class="chart-title font-techno text-lg font-semibold mb-4 text-center">
			{title}
		</h3>
	{/if}

	<svg
		bind:this={svgElement}
		{width}
		{height}
		viewBox="0 0 {width} {height}"
		class="chart-svg w-full h-full"
		aria-labelledby={title ? 'chart-title' : undefined}
	>
			<defs>
				<!-- Soft glow filter -->
				<filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
					<feMerge>
						<feMergeNode in="coloredBlur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				<!-- Gradient definitions -->
				<linearGradient id="neon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" style="stop-color:var(--chart-1);stop-opacity:1" />
					<stop offset="50%" style="stop-color:var(--chart-5);stop-opacity:1" />
					<stop offset="100%" style="stop-color:var(--chart-3);stop-opacity:1" />
				</linearGradient>

				<radialGradient id="radial-glow" cx="50%" cy="50%" r="50%">
					<stop offset="0%" style="stop-color:var(--chart-2);stop-opacity:0.6" />
					<stop offset="70%" style="stop-color:var(--chart-2);stop-opacity:0.2" />
					<stop offset="100%" style="stop-color:var(--chart-2);stop-opacity:0" />
				</radialGradient>
			</defs>

		<!-- Chart content area -->
		<g class="chart-content" transform="translate({margins.left},{margins.top})">
			<slot {dimensions} {svgElement} />
		</g>

		<!-- Grid lines (optional) -->
		<g class="grid-lines" opacity="0.1">
			<slot name="grid" {dimensions} />
		</g>

		<!-- Axes -->
		<g class="axes">
			<slot name="axes" {dimensions} />
		</g>

		<!-- Overlays and interactions -->
		<g class="overlays">
			<slot name="overlays" {dimensions} />
		</g>
	</svg>

	<!-- Tooltip container -->
	<div class="tooltip-container absolute pointer-events-none z-10">
		<slot name="tooltip" />
	</div>
</div>

<style>
	.chart-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		border: 1px solid hsl(var(--border-subtle));
		border-radius: 1.5rem;
		box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
	}

	.chart-svg {
		display: block;
		font-family: 'Orbitron', sans-serif;
	}

	.chart-title {
		color: hsl(var(--text-primary));
		text-shadow: 0 8px 22px rgba(15, 23, 42, 0.12);
	}

	:global(.neon-stroke) {
		filter: url(#neon-glow);
	}

	:global(.chart-text) {
		font-family: 'Orbitron', sans-serif;
		font-size: 12px;
		fill: currentColor;
	}

	:global(.chart-axis) {
		stroke: currentColor;
		stroke-opacity: 0.3;
	}

	:global(.chart-grid) {
		stroke: currentColor;
		stroke-opacity: 0.1;
		stroke-dasharray: 2, 2;
	}
</style>
