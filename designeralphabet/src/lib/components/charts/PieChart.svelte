<script lang="ts">
  import { pie, arc } from 'd3-shape';
  import { select } from 'd3-selection';
  import ChartFrame from '$lib/components/charts/ChartFrame.svelte';
  import type { ChartData } from '$lib/types/charts';

  export let data: ChartData | null = null;
  export let title = '';
  const ariaLabel = 'Pie chart of option proportions';

  let tooltipEl: HTMLDivElement | null = null;
  let rootEl: SVGGElement;

  function render(root: SVGGElement, innerWidth: number, innerHeight: number, currentData: ChartData | null) {
    const g = select(root);
    g.selectAll('*').remove();
    if (!currentData || !currentData.series?.[0]?.points?.length) return;
    const points = currentData.series[0].points;
    const total = points.reduce((s, p) => s + (Number.isFinite(p.value) ? p.value : 0), 0) || 1;

    const radius = Math.max(10, Math.min(innerWidth, innerHeight) / 2 - 4);
    const centerX = innerWidth / 2;
    const centerY = innerHeight / 2;

    const pieGen = pie<any>().sort(null).value((d: any) => Math.max(0, d.value));
    const arcs = pieGen(points);
    const arcGen = arc<any>().innerRadius(radius * 0.5).outerRadius(radius);

    const rootG = g.append('g').attr('transform', `translate(${centerX},${centerY})`).attr('data-testid', 'pie-root');

    rootG
      .selectAll('path')
      .data(arcs)
      .join('path')
      .attr('d', arcGen as any)
      .attr('fill', (_, i) => `var(--chart-${(i % 8) + 1})`)
      .on('mousemove', (event, d: any) => {
        if (!tooltipEl) return;
        const { clientX, clientY } = event as MouseEvent;
        tooltipEl.style.opacity = '1';
        tooltipEl.style.transform = `translate(${clientX + 12}px, ${clientY - 12}px)`;
        const pct = ((d.data.value / total) * 100).toFixed(1);
        tooltipEl.textContent = `${d.data.label}: ${d.data.value} (${pct}%)`;
      })
      .on('mouseleave', () => tooltipEl && (tooltipEl.style.opacity = '0'));

    // Labels (hide under 7%, truncate long labels)
    rootG
      .selectAll('text')
      .data(arcs)
      .join('text')
      .attr('transform', (d: any) => `translate(${arcGen.centroid(d)})`)
      .attr('dy', '0.35em')
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle')
      .attr('fill', 'hsl(var(--text-primary))')
      .text((d: any) => {
        if ((d.data.value / total) * 100 < 7) return '';
        const label = d.data.label;
        // Truncate labels based on slice size
        const pct = (d.data.value / total) * 100;
        const maxLen = pct >= 15 ? 12 : pct >= 10 ? 8 : 6;
        return label.length > maxLen ? label.slice(0, maxLen) + '...' : label;
      });
  }
</script>

<ChartFrame {title} {ariaLabel} let:innerWidth let:innerHeight>
  <g bind:this={rootEl}>
    {@html (render(rootEl, innerWidth, innerHeight, data), '')}
  </g>
  <div slot="tooltip" bind:this={tooltipEl} style="position:absolute;opacity:0;pointer-events:none" />
</ChartFrame>
