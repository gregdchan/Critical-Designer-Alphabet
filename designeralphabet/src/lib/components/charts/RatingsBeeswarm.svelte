<script lang="ts">
	import { forceSimulation, forceX, forceY, forceCollide } from 'd3-force';
	import { scaleLinear } from 'd3-scale';
	import { select } from 'd3-selection';
	import ChartFrame from '$lib/components/charts/ChartFrame.svelte';

	export type RatingPoint = { value: number; lens?: string; question?: string; t?: Date };
	export let title = 'Ratings Beeswarm';
	export let points: RatingPoint[] = [];
	export let min = 0;
	export let max = 10;

	let rootEl: SVGGElement;
	let tooltipEl: HTMLDivElement | null = null;

	function simulate(nodes: any[], width: number, height: number) {
		const r = 6;
		return new Promise<void>((resolve) => {
			forceSimulation(nodes)
				.force('x', forceX((d: any) => d.xTarget).strength(0.8))
				.force('y', forceY(height / 2).strength(0.05))
				.force('collide', forceCollide(r + 1))
				.alpha(0.9)
				.alphaMin(0.02)
				.on('end', () => resolve())
				.stop()
				.tick(200);
		});
	}

	async function render(root: SVGGElement, innerWidth: number, innerHeight: number) {
		const g = select(root);
		g.selectAll('*').remove();
		if (!points.length) return;

		const x = scaleLinear().domain([min, max]).range([0, innerWidth]);
		const nodes = points
			.filter((p) => Number.isFinite(p.value))
			.map((p) => ({ ...p, xTarget: x(p.value), x: x(p.value), y: innerHeight / 2 }));

		await simulate(nodes, innerWidth, innerHeight);

		// Axis line
		g.append('line')
			.attr('x1', 0)
			.attr('x2', innerWidth)
			.attr('y1', innerHeight / 2)
			.attr('y2', innerHeight / 2)
			.attr('stroke', 'hsl(var(--border-strong))');

		// Ticks at min/mid/max
		const ticks = [min, Math.floor((min + max) / 2), max];
		ticks.forEach((t) => {
			g.append('text')
				.attr('x', x(t))
				.attr('y', innerHeight / 2 + 16)
				.attr('text-anchor', 'middle')
				.attr('fill', 'hsl(var(--text-primary))')
				.attr('font-size', '11px')
				.text(t);
		});

		// Dots
		const dots = g
			.selectAll('circle')
			.data(nodes)
			.join('circle')
			.attr('cx', (d: any) => d.x)
			.attr('cy', (d: any) => d.y)
			.attr('r', 6)
			.attr('fill', 'var(--chart-1)')
			.attr('stroke', 'hsl(var(--surface))')
			.attr('stroke-width', 2)
			.style('cursor', 'pointer')
			.on('mousemove', (event, d: any) => {
				if (!tooltipEl) return;
				const { pageX, pageY } = event as MouseEvent;
				tooltipEl.style.opacity = '1';
				tooltipEl.style.left = pageX + 8 + 'px';
				tooltipEl.style.top = pageY + 8 + 'px';
				const when = d.t
					? new Date(d.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
					: '';
				tooltipEl.innerHTML = `
          <div style=\"font-weight:700;margin-bottom:4px;\">${title}<\/div>
          <div><strong>Rating:<\/strong> ${d.value}<\/div>
          ${d.lens ? `<div><strong>Lens:<\/strong> ${d.lens}<\/div>` : ''}
          ${d.question ? `<div style=\"max-width:240px\"><strong>Question:<\/strong> ${d.question}<\/div>` : ''}
          ${when ? `<div style=\"opacity:0.8\">${when}<\/div>` : ''}
        `;
			})
			.on('mouseleave', () => tooltipEl && (tooltipEl.style.opacity = '0'));
	}
</script>

<ChartFrame {title} ariaLabel="Ratings beeswarm" let:innerWidth let:innerHeight>
	<g bind:this={rootEl}>
		{@html (render(rootEl, innerWidth, innerHeight), '')}
	</g>
	<div
		slot="tooltip"
		bind:this={tooltipEl}
		style="position:fixed;opacity:0;pointer-events:none;background:hsl(var(--surface-elevated));border:1px solid hsl(var(--brand));border-radius:8px;padding:8px 10px;font-size:12px;color:hsl(var(--text-primary));box-shadow:0 6px 18px hsl(var(--brand) / 0.15);max-width:280px"
	/>
</ChartFrame>
