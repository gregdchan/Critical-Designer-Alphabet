<script lang="ts">
	import { scaleBand, scaleLinear } from 'd3-scale';
	import { select } from 'd3-selection';
	import ChartFrame from '$lib/components/charts/ChartFrame.svelte';
	import { getThemeColors } from '$lib/utils/colors';

	type PhaseStack = { phase: string; stacks: Array<{ lens: string; value: number }> };
	export let title = 'Phase Engagement';
	export let data: PhaseStack[] = [];

	let rootEl: SVGGElement;
	let tooltipEl: HTMLDivElement | null = null;

	$: theme = getThemeColors();
	$: lenses = Array.from(new Set(data.flatMap((d) => d.stacks.map((s) => s.lens))));

	function colorFor(lens: string, i: number) {
		return theme.chart[i % theme.chart.length] || theme.brand;
	}

	function render(root: SVGGElement, innerWidth: number, innerHeight: number, _data: PhaseStack[]) {
		const g = select(root);
		g.selectAll('*').remove();
		if (!data.length) return;

		// totals per phase
		const totals = data.map((d) => d.stacks.reduce((s, v) => s + (v.value || 0), 0));
		const maxTotal = Math.max(1, ...totals);

		const isMobile = innerWidth < 560;
		// Reserve space on the left for phase labels (desktop) and on the right for legend
		const leftPad = isMobile ? 0 : 100;
		const legendWidth = isMobile ? 0 : 220; // widen to prevent overlap with bars

		const y = scaleBand<string>()
			.domain(data.map((d) => d.phase))
			.range([0, innerHeight])
			.padding(0.18);

		const x = scaleLinear()
			.domain([0, maxTotal])
			// Bars stop before the legend area on desktop
			.range([0, innerWidth - (leftPad + legendWidth)]);

		const row = g.selectAll('g.row').data(data).join('g').attr('class', 'row');

		// background rows
		row
			.append('rect')
			.attr('x', 0)
			.attr('y', (d) => y(d.phase) || 0)
			// Background width excludes legend area so it doesn't sit behind labels
			.attr('width', innerWidth - legendWidth)
			.attr('height', y.bandwidth())
			.attr('fill', 'hsl(var(--surface-muted))');

		// phase labels (left) — hide on mobile
		if (!isMobile) {
			row
				.append('text')
				.attr('x', 8)
				.attr('y', (d) => (y(d.phase) || 0) + y.bandwidth() / 2)
				.attr('text-anchor', 'start')
				.attr('fill', 'hsl(var(--text-primary))')
				.style('font-size', '11px')
				.style('font-weight', '600')
				.text((d) => d.phase);
		}

		// stacked bars
		row.each(function (d, idx) {
			let offset = leftPad; // leave space for labels on desktop
			const r = select(this);
			const total = d.stacks.reduce((s, v) => s + (v.value || 0), 0) || 1;
			d.stacks
				.filter((s) => s.value > 0)
				.forEach((s, i) => {
					const w = x(s.value);
					const yPos = y(d.phase) || 0;
					const c = colorFor(s.lens, lenses.indexOf(s.lens));
					r.append('rect')
						.attr('x', offset)
						.attr('y', yPos)
						.attr('height', y.bandwidth())
						.attr('width', Math.max(0, w))
						.attr('fill', c)
						.attr('opacity', 0.9)
						.attr('rx', 3)
						.on('mousemove', (event) => {
							if (!tooltipEl) return;
							const { clientX, clientY } = event as MouseEvent;
							const pct = ((s.value / total) * 100).toFixed(1);
							tooltipEl.style.opacity = '1';
							tooltipEl.style.left = clientX + 8 + 'px';
							tooltipEl.style.top = clientY + 8 + 'px';
							tooltipEl.innerHTML = `
                <div style="font-weight:700;margin-bottom:4px;">${title}</div>
                <div><strong>Phase:</strong> ${d.phase}</div>
                <div><strong>Lens:</strong> ${s.lens}</div>
                <div><strong>Responses:</strong> ${s.value} <span style="opacity:.8">(${pct}%)</span></div>
              `;
						})
						.on('mouseleave', () => tooltipEl && (tooltipEl.style.opacity = '0'));
					offset += w;
				});
		});

		// Legend sits in reserved right area on desktop; compact on mobile
		const legendX = isMobile ? 0 : innerWidth - legendWidth + 10;
		const legendY = 0;
		const legend = g.append('g').attr('transform', `translate(${Math.max(0, legendX)}, ${legendY})`);
		legend
			.selectAll('g')
			.data(lenses)
			.join('g')
			.attr('transform', (_d, i) => `translate(0, ${i * 18})`)
			.each(function (lens, i) {
				const it = select(this);
				it.append('rect')
					.attr('width', 10)
					.attr('height', 10)
					.attr('fill', colorFor(lens, i))
					.attr('rx', 2);
				it.append('text')
					.attr('x', 14)
					.attr('y', 9)
					.attr('fill', 'hsl(var(--text-primary))')
					.style('font-size', '11px')
					.text(lens);
			});
	}
</script>

<ChartFrame {title} ariaLabel="Phase stacked bar" let:innerWidth let:innerHeight>
	<g bind:this={rootEl}>
		{@html (rootEl && render(rootEl, innerWidth, innerHeight, data), '')}
	</g>
	<div
		slot="tooltip"
		bind:this={tooltipEl}
		style="position:fixed;opacity:0;pointer-events:none;background:hsl(var(--surface-elevated));border:1px solid hsl(var(--brand));border-radius:8px;padding:8px 10px;font-size:12px;color:hsl(var(--text-primary));box-shadow:0 6px 18px hsl(var(--brand) / 0.15);z-index:99999;"
	/>
</ChartFrame>
