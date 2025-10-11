<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { line, curveMonotoneX } from 'd3-shape';
	import { max } from 'd3-array';
	import { select } from 'd3-selection';
	import ChartFrame from '$lib/components/charts/ChartFrame.svelte';
	import type { ChartData } from '$lib/types/charts';

	export let data: ChartData | null = null;
	export let title = '';
	const ariaLabel = 'Line chart showing rating distribution';

	let tooltipEl: HTMLDivElement | null = null;
	let rootEl: SVGGElement;

	// Extract scale settings from data metadata or use defaults
	$: scaleSettings = (data?.meta as any)?.scaleSettings ?? {
		min: 0,
		max: 10,
		minLabel: 'Min',
		maxLabel: 'Max'
	};

	// Convert ChartData to line chart format: label is rating value, value is count
	$: chartPoints =
		data?.series?.[0]?.points
			?.map((p) => ({
				value: Number(p.label), // label contains the rating value (e.g., "5")
				count: p.value // value contains the count of responses
			}))
			.filter((p) => !isNaN(p.value))
			.sort((a, b) => a.value - b.value) ?? [];

	function render(
		root: SVGGElement,
		innerWidth: number,
		innerHeight: number,
		points: Array<{ value: number; count: number }>
	) {
		const g = select(root);
		g.selectAll('*').remove();
		if (!points || points.length === 0) return;

		const xScale = scaleLinear()
			.domain([scaleSettings.min, scaleSettings.max])
			.range([0, innerWidth]);

		const yScale = scaleLinear()
			.domain([0, max(points, (d) => d.count) || 1])
			.range([innerHeight, 0]);

		// Grid lines
		const yTicks = yScale.ticks(5);
		g.selectAll('.grid-line')
			.data(yTicks)
			.enter()
			.append('line')
			.attr('x1', 0)
			.attr('x2', innerWidth)
			.attr('y1', (d: number) => yScale(d))
			.attr('y2', (d: number) => yScale(d))
			.attr('stroke', 'hsl(var(--border-subtle))')
			.attr('stroke-width', 0.5)
			.attr('opacity', 0.3);

		// Line
		const lineGenerator = line<{ value: number; count: number }>()
			.x((d) => xScale(d.value))
			.y((d) => yScale(d.count))
			.curve(curveMonotoneX);

		g.append('path')
			.datum(points)
			.attr('fill', 'none')
			.attr('stroke', 'var(--chart-1)')
			.attr('stroke-width', 2)
			.attr('d', lineGenerator);

		// Data points
		const pointsSelection = g
			.selectAll('.data-point')
			.data(points)
			.enter()
			.append('circle')
			.attr('cx', (d) => xScale(d.value))
			.attr('cy', (d) => yScale(d.count))
			.attr('r', 4)
			.attr('fill', 'var(--chart-1)')
			.attr('stroke', 'hsl(var(--surface))')
			.attr('stroke-width', 2)
			.style('cursor', 'pointer');

		// Hover interactions
		pointsSelection
			.on('mouseover', function (event, d: any) {
				select(this).transition().duration(200).attr('r', 7);
				if (!tooltipEl) return;
				const { clientX, clientY } = event as MouseEvent;
				tooltipEl.style.opacity = '1';
				tooltipEl.style.left = clientX + 8 + 'px';
				tooltipEl.style.top = clientY + 8 + 'px';
				const total = points.reduce((s, p) => s + p.count, 0) || 1;
				const pct = ((d.count / total) * 100).toFixed(1);
				tooltipEl.innerHTML = `
          <div style="font-weight:700; margin-bottom:4px;">${title || 'Rating'}</div>
          <div><strong>Value:</strong> ${d.value}</div>
          <div><strong>Responses:</strong> ${d.count} <span style="opacity:0.8">(${pct}%)</span></div>
          <div style="margin-top:4px; font-size:11px; opacity:0.8;">
            Scale: ${scaleSettings.minLabel ?? 'Min'} – ${scaleSettings.maxLabel ?? 'Max'}
          </div>
        `;
			})
			.on('mousemove', function (event) {
				if (!tooltipEl) return;
				const { clientX, clientY } = event as MouseEvent;
				tooltipEl.style.left = clientX + 8 + 'px';
				tooltipEl.style.top = clientY + 8 + 'px';
			})
			.on('mouseout', function () {
				select(this).transition().duration(200).attr('r', 4);
				if (tooltipEl) tooltipEl.style.opacity = '0';
			});

		// X-axis
		const xAxis = g.append('g').attr('transform', `translate(0, ${innerHeight})`);
		xAxis
			.append('line')
			.attr('x1', 0)
			.attr('x2', innerWidth)
			.attr('stroke', 'hsl(var(--border-strong))')
			.attr('stroke-width', 1);

		const xTicks = [
			scaleSettings.min,
			Math.floor((scaleSettings.min + scaleSettings.max) / 2),
			scaleSettings.max
		];
		xTicks.forEach((tick) => {
			xAxis
				.append('text')
				.attr('x', xScale(tick))
				.attr('y', 20)
				.attr('text-anchor', 'middle')
				.attr('fill', 'hsl(var(--text-primary))')
				.attr('font-size', '11px')
				.text(tick);
		});

		// Low/High labels at the ends of the x-axis for clarity
		if (scaleSettings?.minLabel) {
			xAxis
				.append('text')
				.attr('x', 0)
				.attr('y', 36)
				.attr('text-anchor', 'start')
				.attr('fill', 'hsl(var(--text-secondary))')
				.attr('font-size', '11px')
				.style('font-weight', '600')
				.text(scaleSettings.minLabel);
		}
		if (scaleSettings?.maxLabel) {
			xAxis
				.append('text')
				.attr('x', innerWidth)
				.attr('y', 36)
				.attr('text-anchor', 'end')
				.attr('fill', 'hsl(var(--text-secondary))')
				.attr('font-size', '11px')
				.style('font-weight', '600')
				.text(scaleSettings.maxLabel);
		}

		// Y-axis
		const yAxis = g.append('g');
		yAxis
			.append('line')
			.attr('y1', 0)
			.attr('y2', innerHeight)
			.attr('stroke', 'hsl(var(--border-strong))')
			.attr('stroke-width', 1);

		yTicks.forEach((tick) => {
			yAxis
				.append('text')
				.attr('x', -8)
				.attr('y', yScale(tick))
				.attr('dy', '0.35em')
				.attr('text-anchor', 'end')
				.attr('fill', 'hsl(var(--text-primary))')
				.attr('font-size', '11px')
				.text(tick);
		});
	}
</script>

<ChartFrame {title} {ariaLabel} let:innerWidth let:innerHeight>
	<g bind:this={rootEl}>
		{@html (render(rootEl, innerWidth, innerHeight, chartPoints), '')}
	</g>
	<div
		slot="tooltip"
		bind:this={tooltipEl}
		style="position:fixed;opacity:0;pointer-events:none;background:hsl(var(--surface-elevated));border:1px solid hsl(var(--brand));border-radius:8px;padding:8px 10px;font-size:12px;color:hsl(var(--text-primary));white-space:nowrap;box-shadow:0 6px 18px hsl(var(--brand) / 0.15);z-index:99999;"
	/>
</ChartFrame>
