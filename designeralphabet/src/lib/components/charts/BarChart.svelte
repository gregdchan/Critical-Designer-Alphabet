<script lang="ts">
	import { scaleBand, scaleLinear } from 'd3-scale';
	import { max } from 'd3-array';
	import { select } from 'd3-selection';
	import ChartFrame from '$lib/components/charts/ChartFrame.svelte';
	import type { ChartData, ChartPoint } from '$lib/types/charts';

	export let data: ChartData | null = null;
	export let title = '';
	const ariaLabel = 'Bar chart showing option tallies';

	let tooltipEl: HTMLDivElement | null = null;
	let rootEl: SVGGElement;
	let selectedBar: ChartPoint | null = null;

	function render(
		root: SVGGElement,
		innerWidth: number,
		innerHeight: number,
		currentData: ChartData | null
	) {
		const g = select(root);
		g.selectAll('*').remove();
		if (!currentData || !currentData.series?.[0]?.points?.length) return;
		const points = currentData.series[0].points;

		// Hide labels on mobile/small screens
		const isMobile = innerWidth < 500;
		const labelWidth = isMobile ? 0 : Math.min(120, innerWidth * 0.3); // No labels on mobile
		const valueWidth = 40; // Space for right value labels
		const barAreaWidth = Math.max(50, innerWidth - labelWidth - valueWidth);

		const y = scaleBand()
			.domain(points.map((d) => d.label))
			.range([0, innerHeight])
			.padding(0.18);

		const x = scaleLinear()
			.domain([0, Math.max(1, max(points, (d) => d.value) ?? 1)])
			.range([0, barAreaWidth]);

		// Row background for readability
		g.append('g')
			.selectAll('rect')
			.data(points)
			.join('rect')
			.attr('x', 0)
			.attr('y', (d) => y(d.label) ?? 0)
			.attr('width', innerWidth)
			.attr('height', y.bandwidth())
			.attr('fill', 'hsl(var(--surface-muted))');

		const rows = g.append('g').selectAll('g').data(points).join('g');

		// Labels on the left - only show on larger screens
		if (!isMobile) {
			rows
				.append('text')
				.attr('x', 4)
				.attr('y', (d) => (y(d.label) ?? 0) + y.bandwidth() / 2)
				.attr('text-anchor', 'start')
				.attr('fill', 'hsl(var(--text-primary))')
				.style('font-size', '11px')
				.style('font-weight', '500')
				.each(function (d: any) {
					const text = select(this);
					const availableWidth = labelWidth - 8;
					const words = d.label.split(/\s+/);
					let line = '';
					let lines: string[] = [];
					for (let i = 0; i < words.length; i++) {
						const testLine = line ? line + ' ' + words[i] : words[i];
						// Create a temp tspan to measure width
						text.text('');
						const tspan = text.append('tspan').text(testLine);
						const tspanLength = (tspan.node() as any)?.getComputedTextLength() || 0;
						tspan.remove();
						if (tspanLength > availableWidth && line) {
							lines.push(line);
							line = words[i];
						} else {
							line = testLine;
						}
					}
					if (line) lines.push(line);
					text.text('');
					const lineHeight = 13; // px
					lines.forEach((l, i) => {
						text
							.append('tspan')
							.attr('x', 4)
							.attr(
								'y',
								(y(d.label) ?? 0) + y.bandwidth() / 2 + (i - (lines.length - 1) / 2) * lineHeight
							)
							.attr('dy', '0.35em')
							.text(l);
					});
				});
		}

		// Bars with gradient colors
		rows
			.append('rect')
			.attr('x', labelWidth)
			.attr('y', (d) => y(d.label) ?? 0)
			.attr('height', y.bandwidth())
			.attr('width', (d) => Math.max(0, x(d.value)))
			.attr('fill', (d, i) => `var(--chart-${(i % 8) + 1})`)
			.attr('rx', 4)
			.attr('cursor', 'pointer')
			.attr('opacity', (d: any) => (selectedBar && selectedBar.id === d.id ? 1 : 0.85))
			.attr('data-testid', 'bar-root');

		// Values on the right
		rows
			.append('text')
			.attr('x', (d) => labelWidth + x(d.value) + 6)
			.attr('y', (d) => (y(d.label) ?? 0) + y.bandwidth() / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', 'start')
			.attr('fill', 'hsl(var(--text-primary))')
			.style('font-size', '11px')
			.style('font-weight', '600')
			.style('pointer-events', 'none')
			.text((d) => d.value);

		rows
			.on('click', (event, d: any) => {
				selectedBar = selectedBar?.id === d.id ? null : d;
			})
			.on('mousemove', (event, d: any) => {
				if (!tooltipEl) return;
				const { pageX, pageY } = event as MouseEvent;
				tooltipEl.style.opacity = '1';
				tooltipEl.style.left = pageX + 8 + 'px';
				tooltipEl.style.top = pageY + 8 + 'px';
				const total = points.reduce((s, p) => s + (Number.isFinite(p.value) ? p.value : 0), 0) || 1;
				const pct = ((d.value / total) * 100).toFixed(1);
				tooltipEl.innerHTML = `
          <div style=\"font-weight:700;margin-bottom:4px;\">${title || 'Responses'}<\/div>
          <div><strong>Option:<\/strong> ${d.label}<\/div>
          <div><strong>Responses:<\/strong> ${d.value} <span style=\"opacity:0.8\">(${pct}%)<\/span><\/div>
        `;
			})
			.on('mouseleave', () => tooltipEl && (tooltipEl.style.opacity = '0'));
	}

	$: if (data && rootEl) {
		// Re-render when selectedBar changes to update opacity
		select(rootEl)
			.selectAll('rect[data-testid="bar-root"]')
			.attr('opacity', (d: any) => (selectedBar && selectedBar.id === d.id ? 1 : 0.85));
	}

	$: total = data?.series?.[0]?.points.reduce((s, p) => s + p.value, 0) || 1;
	$: percentage = selectedBar ? ((selectedBar.value / total) * 100).toFixed(1) : '0';
</script>

<div class="w-full h-full flex flex-col gap-4">
	<ChartFrame {title} {ariaLabel} let:innerWidth let:innerHeight>
		<g bind:this={rootEl}>
			{@html (render(rootEl, innerWidth, innerHeight, data), '')}
		</g>
		<div
			slot="tooltip"
			bind:this={tooltipEl}
			style="position:fixed;opacity:0;pointer-events:none;background:hsl(var(--surface-elevated));border:1px solid hsl(var(--brand));border-radius:8px;padding:8px 10px;font-size:12px;color:hsl(var(--text-primary));white-space:nowrap;box-shadow:0 6px 18px hsl(var(--brand) / 0.15);z-index:99999;"
		/>
	</ChartFrame>

	{#if selectedBar}
		<div
			class="rounded-xl border-2 border-blue-400/30 bg-blue-50/80 p-4 shadow-lg backdrop-blur-sm transition-all"
		>
			<div class="flex items-start justify-between gap-3 mb-3">
				<h3 class="font-bold text-blue-900 text-sm uppercase tracking-wide">Selected Option</h3>
				<button
					on:click={() => (selectedBar = null)}
					class="text-blue-600 hover:text-blue-800 transition-colors"
					aria-label="Close detail panel"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			<div class="space-y-2">
				<p class="text-blue-900 font-semibold break-words">{selectedBar.label}</p>
				<div class="flex items-baseline gap-2 text-sm">
					<span class="text-blue-700 font-medium">{selectedBar.value} responses</span>
					<span class="text-blue-600">({percentage}%)</span>
				</div>
			</div>
		</div>
	{:else}
		<div class="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 text-center">
			<p class="text-slate-500 text-sm">Click or tap on a bar to see the full label and details</p>
		</div>
	{/if}
</div>
