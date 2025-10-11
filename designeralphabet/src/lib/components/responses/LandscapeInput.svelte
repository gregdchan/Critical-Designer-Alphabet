<script lang="ts">
	import { createLandscapeMetadata } from '$lib/types/responseMetadata';
	import type { Question } from '$lib/types/workshop';
	import { createEventDispatcher } from 'svelte';

	export let question: Question;

	const dispatch = createEventDispatcher<{
		submit: { text: string; metadata: any };
	}>();

	const landscapeConfig = question.config?.landscape as any;
	const xLabel = landscapeConfig?.xLabel || 'Horizontal Axis';
	const yLabel = landscapeConfig?.yLabel || 'Vertical Axis';
	const minX = landscapeConfig?.minX || 0;
	const maxX = landscapeConfig?.maxX || 10;
	const minY = landscapeConfig?.minY || 0;
	const maxY = landscapeConfig?.maxY || 10;

	let label = '';
	let x = (maxX + minX) / 2; // Start in center
	let y = (maxY + minY) / 2;
	let isDragging = false;

	let canvasElement: SVGSVGElement;
	const canvasWidth = 400;
	const canvasHeight = 400;
	const padding = 40;
	const plotWidth = canvasWidth - 2 * padding;
	const plotHeight = canvasHeight - 2 * padding;

	// Convert data coordinates to canvas coordinates
	function dataToCanvas(dataX: number, dataY: number): { cx: number; cy: number } {
		const cx = padding + ((dataX - minX) / (maxX - minX)) * plotWidth;
		const cy = canvasHeight - padding - ((dataY - minY) / (maxY - minY)) * plotHeight;
		return { cx, cy };
	}

	// Convert canvas coordinates to data coordinates
	function canvasToData(cx: number, cy: number): { x: number; y: number } {
		const x = minX + ((cx - padding) / plotWidth) * (maxX - minX);
		const y = minY + ((canvasHeight - padding - cy) / plotHeight) * (maxY - minY);
		return {
			x: Math.max(minX, Math.min(maxX, x)),
			y: Math.max(minY, Math.min(maxY, y))
		};
	}

	function handleMouseDown(event: MouseEvent) {
		isDragging = true;
		updatePosition(event);
	}

	function handleMouseMove(event: MouseEvent) {
		if (isDragging) {
			updatePosition(event);
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleTouchStart(event: TouchEvent) {
		isDragging = true;
		updatePositionTouch(event);
	}

	function handleTouchMove(event: TouchEvent) {
		if (isDragging) {
			event.preventDefault();
			updatePositionTouch(event);
		}
	}

	function handleTouchEnd() {
		isDragging = false;
	}

	function updatePosition(event: MouseEvent) {
		const rect = canvasElement.getBoundingClientRect();
		const scaleX = canvasWidth / rect.width;
		const scaleY = canvasHeight / rect.height;
		const cx = (event.clientX - rect.left) * scaleX;
		const cy = (event.clientY - rect.top) * scaleY;
		const data = canvasToData(cx, cy);
		x = data.x;
		y = data.y;
	}

	function updatePositionTouch(event: TouchEvent) {
		const touch = event.touches[0];
		const rect = canvasElement.getBoundingClientRect();
		const scaleX = canvasWidth / rect.width;
		const scaleY = canvasHeight / rect.height;
		const cx = (touch.clientX - rect.left) * scaleX;
		const cy = (touch.clientY - rect.top) * scaleY;
		const data = canvasToData(cx, cy);
		x = data.x;
		y = data.y;
	}

	function handleSubmit() {
		if (!label.trim()) return;

		const metadata = createLandscapeMetadata(x, y, xLabel, yLabel);

		dispatch('submit', {
			text: label,
			metadata
		});

		// Reset form
		label = '';
		x = (maxX + minX) / 2;
		y = (maxY + minY) / 2;
	}

	$: markerPos = dataToCanvas(x, y);
	$: gridLines = Array.from({ length: 5 }, (_, i) => i * 0.25);
</script>

<svelte:window on:mouseup={handleMouseUp} on:touchend={handleTouchEnd} />

<div class="landscape-input space-y-6">
	<div class="text-center">
		<h3 class="text-lg font-bold text-gray-800 mb-1">2D Positioning</h3>
		<p class="text-sm text-gray-600">Click or drag to position your item</p>
	</div>

	<!-- Label Input -->
	<div>
		<label for="item-label" class="block text-sm font-semibold text-gray-700 mb-2">
			Item Label
		</label>
		<input
			id="item-label"
			type="text"
			bind:value={label}
			placeholder="Enter a label for this position..."
			class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
		/>
	</div>

	<!-- Interactive Canvas -->
	<div class="relative">
		<svg
			bind:this={canvasElement}
			viewBox="0 0 {canvasWidth} {canvasHeight}"
			class="w-full border-2 border-gray-300 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 cursor-crosshair touch-none"
			on:mousedown={handleMouseDown}
			on:mousemove={handleMouseMove}
			on:touchstart={handleTouchStart}
			on:touchmove={handleTouchMove}
		>
			<!-- Grid lines -->
			<g opacity="0.15">
				{#each gridLines as ratio}
					<!-- Vertical grid lines -->
					<line
						x1={padding + ratio * plotWidth}
						y1={padding}
						x2={padding + ratio * plotWidth}
						y2={canvasHeight - padding}
						stroke="gray"
						stroke-width="1"
					/>
					<!-- Horizontal grid lines -->
					<line
						x1={padding}
						y1={padding + ratio * plotHeight}
						x2={canvasWidth - padding}
						y2={padding + ratio * plotHeight}
						stroke="gray"
						stroke-width="1"
					/>
				{/each}
			</g>

			<!-- Axes -->
			<g stroke="hsl(var(--ink2))" stroke-width="2">
				<!-- X axis -->
				<line
					x1={padding}
					y1={canvasHeight - padding}
					x2={canvasWidth - padding}
					y2={canvasHeight - padding}
				/>
				<!-- Y axis -->
				<line x1={padding} y1={padding} x2={padding} y2={canvasHeight - padding} />
			</g>

			<!-- Axis labels -->
			<text
				x={canvasWidth / 2}
				y={canvasHeight - 10}
				text-anchor="middle"
				fill="hsl(var(--ink))"
				font-size="12"
				font-weight="600"
			>
				{xLabel}
			</text>

			<text
				x={20}
				y={canvasHeight / 2}
				text-anchor="middle"
				fill="hsl(var(--ink))"
				font-size="12"
				font-weight="600"
				transform="rotate(-90, 20, {canvasHeight / 2})"
			>
				{yLabel}
			</text>

			<!-- Min/Max labels -->
			<text
				x={padding}
				y={canvasHeight - padding + 25}
				text-anchor="middle"
				fill="gray"
				font-size="10">{minX}</text
			>
			<text
				x={canvasWidth - padding}
				y={canvasHeight - padding + 25}
				text-anchor="middle"
				fill="gray"
				font-size="10">{maxX}</text
			>
			<text
				x={padding - 20}
				y={canvasHeight - padding + 5}
				text-anchor="end"
				fill="gray"
				font-size="10">{minY}</text
			>
			<text x={padding - 20} y={padding + 5} text-anchor="end" fill="gray" font-size="10"
				>{maxY}</text
			>

			<!-- Marker -->
			<g>
				<circle
					cx={markerPos.cx}
					cy={markerPos.cy}
					r="12"
					fill="hsl(var(--brand))"
					stroke="white"
					stroke-width="3"
					class="transition-all cursor-grab"
					class:cursor-grabbing={isDragging}
					opacity="0.9"
				/>
				{#if label.trim()}
					<text
						x={markerPos.cx}
						y={markerPos.cy - 20}
						text-anchor="middle"
						fill="hsl(var(--ink))"
						font-size="11"
						font-weight="600"
						class="pointer-events-none"
					>
						{label.substring(0, 20)}{label.length > 20 ? '...' : ''}
					</text>
				{/if}
			</g>
		</svg>
	</div>

	<!-- Coordinate Display -->
	<div class="grid grid-cols-2 gap-4">
		<div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
			<div class="text-xs text-blue-600 font-semibold mb-1">{xLabel}</div>
			<div class="text-lg font-bold text-blue-800">{x.toFixed(1)}</div>
		</div>
		<div class="p-3 bg-purple-50 rounded-lg border border-purple-200">
			<div class="text-xs text-purple-600 font-semibold mb-1">{yLabel}</div>
			<div class="text-lg font-bold text-purple-800">{y.toFixed(1)}</div>
		</div>
	</div>

	<!-- Submit Button -->
	<button
		on:click={handleSubmit}
		disabled={!label.trim()}
		class="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
	>
		Submit Position
	</button>
</div>

<style>
	svg {
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
	}
</style>
