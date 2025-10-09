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

    // Calculate max label width dynamically
    const tempText = g.append('text').style('font-size', '11px').style('font-weight', '500');
    const maxLabelWidth = Math.max(
      ...points.map((d) => {
        tempText.text(d.label);
        return (tempText.node() as any)?.getComputedTextLength() || 0;
      }),
      80 // minimum
    );
    tempText.remove();

    // Reserve space for labels and values
    const labelWidth = Math.min(maxLabelWidth + 16, innerWidth * 0.3); // Max 30% of width
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

    // Labels on the left - wrap long text onto multiple lines using tspans
    rows
      .append('text')
      .attr('x', 4)
      .attr('y', (d) => (y(d.label) ?? 0) + y.bandwidth() / 2)
      .attr('text-anchor', 'start')
      .attr('fill', 'hsl(var(--text-primary))')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .each(function(d: any) {
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
          text.append('tspan')
            .attr('x', 4)
            .attr('y', (y(d.label) ?? 0) + y.bandwidth() / 2 + (i - (lines.length-1)/2) * lineHeight)
            .attr('dy', '0.35em')
            .text(l);
        });
      });

    // Bars with gradient colors
    rows
      .append('rect')
      .attr('x', labelWidth)
      .attr('y', (d) => y(d.label) ?? 0)
      .attr('height', y.bandwidth())
      .attr('width', (d) => Math.max(0, x(d.value)))
      .attr('fill', (d, i) => `var(--chart-${(i % 8) + 1})`)
      .attr('rx', 4)
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
