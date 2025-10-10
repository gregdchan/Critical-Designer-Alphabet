<script lang="ts">
  import { scalePoint, scaleLinear } from 'd3-scale';
  import { line, curveMonotoneX } from 'd3-shape';
  import { select } from 'd3-selection';
  import ChartFrame from '$lib/components/charts/ChartFrame.svelte';

  export type JourneyPoint = {
    t: Date; // timestamp
    lens: string; // categorical
    text?: string; // question text
    votes?: number;
  };

  export let title = 'Journey by Lens';
  export let points: JourneyPoint[] = [];

  let tooltipEl: HTMLDivElement | null = null;
  let rootEl: SVGGElement;

  $: lenses = Array.from(new Set(points.map((p) => p.lens))).filter(Boolean);
  $: ordered = [...points].sort((a, b) => (a.t?.getTime?.() || 0) - (b.t?.getTime?.() || 0));

  function render(root: SVGGElement, innerWidth: number, innerHeight: number) {
    const g = select(root);
    g.selectAll('*').remove();
    if (!ordered.length) return;

    const x = scalePoint<number>()
      .domain(ordered.map((_, i) => i))
      .range([0, innerWidth])
      .padding(0.5);

    const y = scalePoint<string>()
      .domain(lenses)
      .range([innerHeight, 0])
      .padding(0.8);

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
      .attr('opacity', 0.4);

    // Lens labels on left
    g.append('g')
      .selectAll('text')
      .data(lenses)
      .join('text')
      .attr('x', -8)
      .attr('y', (d) => (y(d) || 0))
      .attr('text-anchor', 'end')
      .attr('dy', '0.35em')
      .attr('fill', 'hsl(var(--text-primary))')
      .style('font-size', '11px')
      .text((d) => d);

    // Build path points
    const pathPts = ordered.map((p, i) => ({ x: x(i) || 0, y: y(p.lens) || 0 }));
    const path = line<any>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(curveMonotoneX);

    g.append('path')
      .datum(pathPts)
      .attr('fill', 'none')
      .attr('stroke', 'var(--chart-1)')
      .attr('stroke-width', 2)
      .attr('d', path as any);

    // Nodes sized by votes
    const maxVotes = Math.max(1, ...ordered.map((d) => d.votes || 0));
    const r = scaleLinear().domain([0, maxVotes]).range([4, 10]);

    g.append('g')
      .selectAll('circle')
      .data(ordered.map((d, i) => ({ ...d, i })))
      .join('circle')
      .attr('cx', (d) => x(d.i) || 0)
      .attr('cy', (d) => y(d.lens) || 0)
      .attr('r', (d) => r(d.votes || 0))
      .attr('fill', 'var(--chart-1)')
      .attr('stroke', 'hsl(var(--surface))')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function () {
        select(this).transition().duration(120).attr('r', (d: any) => r((d?.votes || 0)) + 2);
      })
      .on('mousemove', (event, d: any) => {
        if (!tooltipEl) return;
        const { pageX, pageY } = event as MouseEvent;
        tooltipEl.style.opacity = '1';
        tooltipEl.style.left = pageX + 12 + 'px';
        tooltipEl.style.top = pageY - 12 + 'px';
        const when = d.t ? new Date(d.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        tooltipEl.innerHTML = `
          <div style="font-weight:700;margin-bottom:4px;">${title}</div>
          <div><strong>Lens:</strong> ${d.lens}</div>
          ${d.text ? `<div style=\"max-width:240px\"><strong>Question:</strong> ${d.text}</div>` : ''}
          <div><strong>Votes:</strong> ${d.votes || 0}</div>
          ${when ? `<div style=\"opacity:0.8\">${when}</div>` : ''}
        `;
      })
      .on('mouseleave', function () {
        if (tooltipEl) tooltipEl.style.opacity = '0';
        select(this).transition().duration(120).attr('r', (d: any) => r((d?.votes || 0)));
      });

    // X labels (indices)
    g.append('g')
      .selectAll('text')
      .data(ordered.map((_, i) => i))
      .join('text')
      .attr('x', (d) => x(d) || 0)
      .attr('y', innerHeight + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', 'hsl(var(--text-secondary))')
      .style('font-size', '11px')
      .text((d) => d + 1);
  }
</script>

<ChartFrame {title} ariaLabel="Participant journey" let:innerWidth let:innerHeight>
  <g bind:this={rootEl}>
    {@html (render(rootEl, innerWidth, innerHeight), '')}
  </g>
  <div slot="tooltip" bind:this={tooltipEl} style="position:fixed;opacity:0;pointer-events:none;background:hsl(var(--surface-elevated));border:1px solid hsl(var(--brand));border-radius:8px;padding:8px 10px;font-size:12px;color:hsl(var(--text-primary));box-shadow:0 6px 18px hsl(var(--brand) / 0.15);max-width:280px" />
</ChartFrame>

<style>
  :global(.chart-frame) {
    /* ensure tooltip stays within frame on mobile */
  }
</style>

