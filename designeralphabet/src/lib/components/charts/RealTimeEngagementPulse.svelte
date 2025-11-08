<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { Response, Participant } from '$lib/gamification';

	export let responses: Response[] = [];
	export let participants: Participant[] = [];
	export let title = 'Real-Time Engagement';
	export let height = 250;
	export let timeWindowMinutes = 30;

	let chartContainer: HTMLDivElement;
	let previousResponseCount = 0;
	let pulseAnimation = false;

	interface TimeSlot {
		timestamp: Date;
		responseCount: number;
		participantCount: number;
		cardUsage: number;
	}

	let timelineData: TimeSlot[] = [];

	$: if (responses.length > 0) {
		if (responses.length > previousResponseCount) {
			triggerPulse();
		}
		previousResponseCount = responses.length;
		calculateTimeline();
		renderChart();
	}

	function triggerPulse() {
		pulseAnimation = true;
		setTimeout(() => (pulseAnimation = false), 1000);
	}

	function calculateTimeline() {
		const now = new Date();
		const windowStart = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);

		// Filter responses within time window
		const recentResponses = responses.filter((r) => {
			const timestamp = new Date(r.created_at);
			return timestamp >= windowStart && timestamp <= now;
		});

		// Group responses into 1-minute buckets
		const bucketSize = 60 * 1000; // 1 minute
		const buckets = new Map<number, { responses: Response[]; participants: Set<string> }>();

		recentResponses.forEach((response) => {
			const timestamp = new Date(response.created_at);
			const bucketKey = Math.floor(timestamp.getTime() / bucketSize) * bucketSize;

			if (!buckets.has(bucketKey)) {
				buckets.set(bucketKey, { responses: [], participants: new Set() });
			}

			const bucket = buckets.get(bucketKey)!;
			bucket.responses.push(response);
			if (response.participant_id) {
				bucket.participants.add(response.participant_id);
			}
		});

		// Fill all time slots (including empty ones)
		timelineData = [];
		for (let t = windowStart.getTime(); t <= now.getTime(); t += bucketSize) {
			const bucket = buckets.get(t);
			timelineData.push({
				timestamp: new Date(t),
				responseCount: bucket?.responses.length || 0,
				participantCount: bucket?.participants.size || 0,
				cardUsage: bucket?.responses.reduce((sum, r) => sum + (r.cards?.length || 0), 0) || 0
			});
		}
	}

	function renderChart() {
		if (!chartContainer || timelineData.length === 0) return;

		// Clear previous chart
		d3.select(chartContainer).selectAll('*').remove();

		const margin = { top: 20, right: 60, bottom: 40, left: 40 };
		const width = chartContainer.clientWidth - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;

		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height)
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		// Scales
		const xScale = d3
			.scaleTime()
			.domain(d3.extent(timelineData, (d) => d.timestamp) as [Date, Date])
			.range([0, width]);

		const yScale = d3
			.scaleLinear()
			.domain([0, Math.max(d3.max(timelineData, (d) => d.responseCount) || 5, 3)])
			.range([chartHeight, 0]);

		// Area gradient
		const gradient = svg
			.append('defs')
			.append('linearGradient')
			.attr('id', 'engagement-gradient')
			.attr('x1', '0%')
			.attr('y1', '0%')
			.attr('x2', '0%')
			.attr('y2', '100%');

		gradient
			.append('stop')
			.attr('offset', '0%')
			.attr('stop-color', 'hsl(var(--brand))')
			.attr('stop-opacity', 0.6);

		gradient
			.append('stop')
			.attr('offset', '100%')
			.attr('stop-color', 'hsl(var(--brand))')
			.attr('stop-opacity', 0.1);

		// Area generator
		const area = d3
			.area<TimeSlot>()
			.x((d) => xScale(d.timestamp))
			.y0(chartHeight)
			.y1((d) => yScale(d.responseCount))
			.curve(d3.curveMonotoneX);

		// Line generator
		const line = d3
			.line<TimeSlot>()
			.x((d) => xScale(d.timestamp))
			.y((d) => yScale(d.responseCount))
			.curve(d3.curveMonotoneX);

		// Draw area
		svg
			.append('path')
			.datum(timelineData)
			.attr('fill', 'url(#engagement-gradient)')
			.attr('d', area);

		// Draw line
		svg
			.append('path')
			.datum(timelineData)
			.attr('fill', 'none')
			.attr('stroke', 'hsl(var(--brand))')
			.attr('stroke-width', 2)
			.attr('d', line);

		// Tooltip
		const tooltip = d3
			.select(chartContainer)
			.append('div')
			.attr('class', 'pulse-tooltip')
			.style('position', 'absolute')
			.style('visibility', 'hidden')
			.style('background', 'hsl(var(--surface))')
			.style('border', '1px solid hsl(var(--line))')
			.style('border-radius', '8px')
			.style('padding', '8px 12px')
			.style('font-size', '12px')
			.style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
			.style('z-index', '1000')
			.style('pointer-events', 'none');

		// Invisible overlay for hover
		const bisect = d3.bisector<TimeSlot, Date>((d) => d.timestamp).left;

		svg
			.append('rect')
			.attr('width', width)
			.attr('height', chartHeight)
			.attr('fill', 'transparent')
			.on('mousemove', function (event) {
				const x0 = xScale.invert(d3.pointer(event)[0]);
				const i = bisect(timelineData, x0, 1);
				const d0 = timelineData[i - 1];
				const d1 = timelineData[i];
				const d = x0.getTime() - d0?.timestamp.getTime() > d1?.timestamp.getTime() - x0.getTime() ? d1 : d0;

				if (d) {
					tooltip
						.style('visibility', 'visible')
						.html(
							`
							<div style="color: hsl(var(--ink));">
								<div style="font-weight: 600; margin-bottom: 4px;">
									${d.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
								</div>
								<div style="margin-bottom: 2px;">
									<span style="color: hsl(var(--ink-muted));">Responses:</span> ${d.responseCount}
								</div>
								<div style="margin-bottom: 2px;">
									<span style="color: hsl(var(--ink-muted));">Participants:</span> ${d.participantCount}
								</div>
								<div>
									<span style="color: hsl(var(--ink-muted));">Cards:</span> ${d.cardUsage}
								</div>
							</div>
						`
						)
						.style('left', event.pageX + 10 + 'px')
						.style('top', event.pageY - 10 + 'px');
				}
			})
			.on('mouseout', function () {
				tooltip.style('visibility', 'hidden');
			});

		// X axis
		svg
			.append('g')
			.attr('transform', `translate(0,${chartHeight})`)
			.call(
				d3
					.axisBottom(xScale)
					.ticks(5)
					.tickFormat((d) => d3.timeFormat('%H:%M')(d as Date))
			)
			.call((g) => g.select('.domain').attr('stroke', 'currentColor').style('opacity', 0.2))
			.call((g) =>
				g.selectAll('.tick line').attr('stroke', 'currentColor').style('opacity', 0.2)
			)
			.call((g) => g.selectAll('.tick text').attr('fill', 'currentColor').style('opacity', 0.6));

		// Y axis
		svg
			.append('g')
			.call(d3.axisLeft(yScale).ticks(5))
			.call((g) => g.select('.domain').attr('stroke', 'currentColor').style('opacity', 0.2))
			.call((g) =>
				g.selectAll('.tick line').attr('stroke', 'currentColor').style('opacity', 0.2)
			)
			.call((g) => g.selectAll('.tick text').attr('fill', 'currentColor').style('opacity', 0.6));

		// Y axis label
		svg
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', -30)
			.attr('x', -chartHeight / 2)
			.attr('text-anchor', 'middle')
			.attr('fill', 'currentColor')
			.style('font-size', '11px')
			.style('opacity', 0.7)
			.text('Responses/min');

		// Current value indicator
		const currentValue = timelineData[timelineData.length - 1];
		if (currentValue) {
			svg
				.append('circle')
				.attr('cx', xScale(currentValue.timestamp))
				.attr('cy', yScale(currentValue.responseCount))
				.attr('r', 4)
				.attr('fill', 'hsl(var(--brand))')
				.attr('stroke', 'hsl(var(--surface))')
				.attr('stroke-width', 2);

			svg
				.append('text')
				.attr('x', width + 5)
				.attr('y', yScale(currentValue.responseCount))
				.attr('dy', '0.35em')
				.attr('fill', 'hsl(var(--brand))')
				.style('font-size', '12px')
				.style('font-weight', '600')
				.text(currentValue.responseCount);
		}
	}

	onMount(() => {
		if (responses.length > 0) {
			calculateTimeline();
			renderChart();
		}

		// Auto-refresh every 10 seconds
		const interval = setInterval(() => {
			calculateTimeline();
			renderChart();
		}, 10000);

		// Re-render on window resize
		const handleResize = () => renderChart();
		window.addEventListener('resize', handleResize);

		return () => {
			clearInterval(interval);
			window.removeEventListener('resize', handleResize);
		};
	});

	onDestroy(() => {
		// Clean up handled by onMount return
	});
</script>

<div class="real-time-engagement-pulse">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-lg font-semibold text-ink">{title}</h3>
		<div class="flex items-center gap-2">
			<div
				class="h-2 w-2 rounded-full bg-brand"
				class:pulse-active={pulseAnimation}
				style="transition: all 0.3s ease;"
			/>
			<span class="text-xs text-ink-muted">Live</span>
		</div>
	</div>

	{#if timelineData.length === 0 || responses.length === 0}
		<div class="flex h-64 items-center justify-center text-center text-ink-muted">
			<div>
				<div class="mb-2 text-4xl">💓</div>
				<div class="text-sm">Engagement pulse will appear here</div>
				<div class="text-xs">Real-time activity tracking over the last {timeWindowMinutes} minutes</div>
			</div>
		</div>
	{:else}
		<div bind:this={chartContainer} class="relative w-full" style="min-height: {height}px;" />
		<div class="mt-4 grid grid-cols-3 gap-4 text-center">
			<div class="rounded-lg border border-line bg-surface-muted p-3">
				<div class="text-2xl font-bold text-brand">
					{timelineData.reduce((sum, d) => sum + d.responseCount, 0)}
				</div>
				<div class="text-xs text-ink-muted">Recent Responses</div>
			</div>
			<div class="rounded-lg border border-line bg-surface-muted p-3">
				<div class="text-2xl font-bold text-brand">
					{new Set(
						timelineData.flatMap((d) =>
							responses
								.filter(
									(r) =>
										new Date(r.created_at) >= d.timestamp &&
										new Date(r.created_at) < new Date(d.timestamp.getTime() + 60000)
								)
								.map((r) => r.participant_id)
								.filter(Boolean)
						)
					).size}
				</div>
				<div class="text-xs text-ink-muted">Active Participants</div>
			</div>
			<div class="rounded-lg border border-line bg-surface-muted p-3">
				<div class="text-2xl font-bold text-brand">
					{timelineData.reduce((sum, d) => sum + d.cardUsage, 0)}
				</div>
				<div class="text-xs text-ink-muted">Cards Referenced</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.real-time-engagement-pulse {
		width: 100%;
	}

	.pulse-active {
		animation: pulse 1s ease-out;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.5;
			transform: scale(1.5);
		}
	}
</style>
