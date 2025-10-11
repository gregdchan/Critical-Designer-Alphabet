<script context="module" lang="ts">
	export type JourneyPoint = {
		t: Date; // timestamp
		lens: string; // categorical
		text?: string; // question text
		votes?: number;
		phase?: string;
		questionPosition?: number; // position in the question sequence
	};
</script>

<script lang="ts">
	import { scalePoint, scaleLinear } from 'd3-scale';
	import { select } from 'd3-selection';
	import ChartFrame from '$lib/components/charts/ChartFrame.svelte';

	export let title = 'Journey by Lens';
	export let points: JourneyPoint[] = [];

	let tooltipEl: HTMLDivElement | null = null;
	let rootEl: SVGGElement;

	$: lenses = Array.from(new Set(points.map((p) => p.lens))).filter(Boolean);
	$: ordered = [...points].sort((a, b) => (a.t?.getTime?.() || 0) - (b.t?.getTime?.() || 0));

	// Assign question positions based on time order
	$: orderedWithPositions = ordered.map((p, i) => ({ ...p, questionPosition: i + 1 }));

	// Group by lens and position for aggregation
	$: aggregated = (() => {
		const map = new Map<
			string,
			Map<number, { votes: number; count: number; text: string; phase?: string }>
		>();

		orderedWithPositions.forEach((p) => {
			if (!map.has(p.lens)) map.set(p.lens, new Map());
			const lensMap = map.get(p.lens)!;
			const pos = p.questionPosition || 0;

			if (!lensMap.has(pos)) {
				lensMap.set(pos, { votes: 0, count: 0, text: p.text || '', phase: p.phase });
			}
			const cell = lensMap.get(pos)!;
			cell.votes += p.votes || 0;
			cell.count += 1;
			if (!cell.text && p.text) cell.text = p.text;
			if (!cell.phase && p.phase) cell.phase = p.phase;
		});

		const result: Array<{
			lens: string;
			position: number;
			engagement: number;
			text: string;
			phase?: string;
		}> = [];
		map.forEach((lensMap, lens) => {
			lensMap.forEach((data, position) => {
				result.push({
					lens,
					position,
					engagement: data.votes + data.count, // Combined engagement metric
					text: data.text,
					phase: data.phase
				});
			});
		});

		return result;
	})();

	$: maxPosition = Math.max(0, ...orderedWithPositions.map((p) => p.questionPosition || 0));
	$: maxEngagement = Math.max(1, ...aggregated.map((d) => d.engagement));

	function render(root: SVGGElement, innerWidth: number, innerHeight: number) {
		const g = select(root);
		g.selectAll('*').remove();
		if (!aggregated.length) return;

		// X scale: question positions (1, 2, 3, ...)
		const x = scalePoint<number>()
			.domain(Array.from({ length: maxPosition }, (_, i) => i + 1))
			.range([0, innerWidth])
			.padding(0.5);

		// Y scale: lenses
		const y = scalePoint<string>().domain(lenses).range([0, innerHeight]).padding(0.5);

		// Horizontal lens guide lines
		g.append('g')
			.selectAll('line')
			.data(lenses)
			.join('line')
			.attr('x1', 0)
			.attr('x2', innerWidth)
			.attr('y1', (d) => y(d) || 0)
			.attr('y2', (d) => y(d) || 0)
			.attr('stroke', 'hsl(var(--border-subtle))')
			.attr('stroke-width', 1)
			.attr('opacity', 0.3);

		// Lens labels on left
		g.append('g')
			.selectAll('text')
			.data(lenses)
			.join('text')
			.attr('x', -8)
			.attr('y', (d) => y(d) || 0)
			.attr('text-anchor', 'end')
			.attr('dy', '0.35em')
			.attr('fill', 'hsl(var(--text-primary))')
			.style('font-size', '11px')
			.style('font-weight', '500')
			.text((d) => d);

		// Bubble size scale based on engagement
		const r = scaleLinear().domain([0, maxEngagement]).range([4, 18]);

		// Bubbles
		g.append('g')
			.selectAll('circle')
			.data(aggregated)
			.join('circle')
			.attr('cx', (d) => x(d.position) || 0)
			.attr('cy', (d) => y(d.lens) || 0)
			.attr('r', (d) => r(d.engagement))
			.attr('fill', (d: any) =>
				d.phase
					? `var(--chart-${(Math.abs(d.phase?.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)) % 6) + 2})`
					: 'var(--chart-1)'
			)
			.attr('opacity', 0.7)
			.attr('stroke', 'hsl(var(--surface))')
			.attr('stroke-width', 2)
			.style('cursor', 'pointer')
			.on('mouseover', function () {
				select(this)
					.transition()
					.duration(120)
					.attr('r', (d: any) => r(d?.engagement || 0) + 3)
					.attr('opacity', 1);
			})
			.on('mousemove', (event, d: any) => {
				if (!tooltipEl) return;
				const { pageX, pageY } = event as MouseEvent;
				tooltipEl.style.opacity = '1';
				tooltipEl.style.left = pageX + 8 + 'px';
				tooltipEl.style.top = pageY + 8 + 'px';
				tooltipEl.innerHTML = `
          <div style="font-weight:700;margin-bottom:4px;">${title}</div>
          <div><strong>Lens:</strong> ${d.lens}</div>
          <div><strong>Question:</strong> ${d.position}</div>
          ${d.text ? `<div style=\"max-width:240px;margin-top:4px;opacity:0.9\">${d.text}</div>` : ''}
          <div style="margin-top:4px;"><strong>Engagement:</strong> ${d.engagement}</div>
          ${d.phase ? `<div style=\"opacity:0.8\"><strong>Phase:</strong> ${d.phase}</div>` : ''}
        `;
			})
			.on('mouseleave', function () {
				if (tooltipEl) tooltipEl.style.opacity = '0';
				select(this)
					.transition()
					.duration(120)
					.attr('r', (d: any) => r(d?.engagement || 0))
					.attr('opacity', 0.7);
			});

		// X axis labels (question positions)
		const showEveryNth = maxPosition > 20 ? 5 : maxPosition > 10 ? 2 : 1;
		g.append('g')
			.selectAll('text')
			.data(Array.from({ length: maxPosition }, (_, i) => i + 1))
			.join('text')
			.attr('x', (d) => x(d) || 0)
			.attr('y', innerHeight + 16)
			.attr('text-anchor', 'middle')
			.attr('fill', 'hsl(var(--text-secondary))')
			.style('font-size', '10px')
			.style('opacity', (d) => (d % showEveryNth === 0 ? 1 : 0.3))
			.text((d) => d);
	}
</script>

<ChartFrame
	{title}
	ariaLabel="Participant journey"
	margin={{ top: 24, right: 24, bottom: 40, left: 100 }}
	let:innerWidth
	let:innerHeight
>
	<g bind:this={rootEl}>
		{@html (render(rootEl, innerWidth, innerHeight), '')}
	</g>
	<div
		slot="tooltip"
		bind:this={tooltipEl}
		style="position:fixed;opacity:0;pointer-events:none;background:hsl(var(--surface-elevated));border:1px solid hsl(var(--brand));border-radius:8px;padding:8px 10px;font-size:12px;color:hsl(var(--text-primary));box-shadow:0 6px 18px hsl(var(--brand) / 0.15);max-width:280px"
	/>
</ChartFrame>
