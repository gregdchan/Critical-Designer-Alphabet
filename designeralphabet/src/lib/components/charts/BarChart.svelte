<script lang="ts">
  import { scaleBand, scaleLinear } from 'd3-scale';
  import { max } from 'd3-array';
  import { select } from 'd3-selection';
  import ChartFrame from '$lib/components/charts/ChartFrame.svelte';
  import type { ChartData } from '$lib/types/charts';

  export let data: ChartData | null = null;
  export let title = '';
  const ariaLabel = 'Bar chart showing option tallies';

  let tooltipEl: HTMLDivElement | null = null;
  let rootEl: SVGGElement;

  function render(root: SVGGElement, innerWidth: number, innerHeight: number, currentData: ChartData | null) {
    const g = select(root);
    g.selectAll('*').remove();
    if (!currentData || !currentData.series?.[0]?.points?.length) return;
    const points = currentData.series[0].points;

    const y = scaleBand()
      .domain(points.map((d) => d.label))
      .range([0, innerHeight])
      .padding(0.18);

    const x = scaleLinear()
      .domain([0, Math.max(1, max(points, (d) => d.value) ?? 1)])
      .range([0, innerWidth]);

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

    rows
      .append('rect')
      .attr('x', 0)
      .attr('y', (d) => y(d.label) ?? 0)
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d.value))
      .attr('fill', 'var(--chart-1)')
      .attr('rx', 6)
      .attr('data-testid', 'bar-root');

    // Labels and values
    rows
      .append('text')
      .attr('x', -8)
      .attr('y', (d) => (y(d.label) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', 'hsl(var(--text-primary))')
      .style('font-size', '12px')
      .text((d) => d.label);

    rows
      .append('text')
      .attr('x', (d) => x(d.value) + 6)
      .attr('y', (d) => (y(d.label) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'start')
      .attr('fill', 'hsl(var(--text-primary))')
      .style('font-size', '12px')
      .text((d) => d.value);

    rows
      .on('mousemove', (event, d: any) => {
        if (!tooltipEl) return;
        const { clientX, clientY } = event as MouseEvent;
        tooltipEl.style.opacity = '1';
        tooltipEl.style.transform = `translate(${clientX + 12}px, ${clientY - 12}px)`;
        tooltipEl.textContent = `${d.label}: ${d.value}`;
      })
      .on('mouseleave', () => tooltipEl && (tooltipEl.style.opacity = '0'));
  }
</script>

<ChartFrame {title} {ariaLabel} let:innerWidth let:innerHeight>
  <g bind:this={rootEl}>
    {@html (render(rootEl, innerWidth, innerHeight, data), '')}
  </g>
  <div slot="tooltip" bind:this={tooltipEl} style="position:absolute;opacity:0;pointer-events:none" />
</ChartFrame>
