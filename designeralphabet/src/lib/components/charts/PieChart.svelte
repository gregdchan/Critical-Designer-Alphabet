<script lang="ts">
  import { pie, arc } from 'd3-shape';
  import { select } from 'd3-selection';
  import ChartFrame from '$lib/components/charts/ChartFrame.svelte';
  import type { ChartData, ChartPoint } from '$lib/types/charts';

  export let data: ChartData | null = null;
  export let title = '';
  const ariaLabel = 'Pie chart of option proportions';

  let tooltipEl: HTMLDivElement | null = null;
  let rootEl: SVGGElement;
  let selectedSlice: ChartPoint | null = null;

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
      .attr('stroke', 'hsl(var(--surface-elevated))')
      .attr('stroke-width', '2')
      .attr('cursor', 'pointer')
      .attr('opacity', (d: any) => selectedSlice && selectedSlice.id === d.data.id ? 1 : 0.85)
      .on('click', (event, d: any) => {
        selectedSlice = selectedSlice?.id === d.data.id ? null : d.data;
      })
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
      .attr('pointer-events', 'none')
      .text((d: any) => {
        if ((d.data.value / total) * 100 < 7) return '';
        const label = d.data.label;
        // Truncate labels based on slice size
        const pct = (d.data.value / total) * 100;
        const maxLen = pct >= 15 ? 12 : pct >= 10 ? 8 : 6;
        return label.length > maxLen ? label.slice(0, maxLen) + '...' : label;
      });
  }

  $: if (data && rootEl) {
    // Re-render when selectedSlice changes to update opacity
    const points = data?.series?.[0]?.points || [];
    const total = points.reduce((s, p) => s + (Number.isFinite(p.value) ? p.value : 0), 0) || 1;
    select(rootEl).selectAll('path').attr('opacity', (d: any) =>
      selectedSlice && selectedSlice.id === d.data.id ? 1 : 0.85
    );
  }

  $: percentage = selectedSlice && data ?
    ((selectedSlice.value / (data.series[0]?.points.reduce((s, p) => s + p.value, 0) || 1)) * 100).toFixed(1) : '0';
</script>

<div class="w-full h-full flex flex-col gap-4">
  <ChartFrame {title} {ariaLabel} let:innerWidth let:innerHeight>
    <g bind:this={rootEl}>
      {@html (render(rootEl, innerWidth, innerHeight, data), '')}
    </g>
    <div slot="tooltip" bind:this={tooltipEl} style="position:absolute;opacity:0;pointer-events:none" />
  </ChartFrame>

  {#if selectedSlice}
    <div class="rounded-xl border-2 border-purple-400/30 bg-purple-50/80 p-4 shadow-lg backdrop-blur-sm transition-all">
      <div class="flex items-start justify-between gap-3 mb-3">
        <h3 class="font-bold text-purple-900 text-sm uppercase tracking-wide">Selected Option</h3>
        <button
          on:click={() => selectedSlice = null}
          class="text-purple-600 hover:text-purple-800 transition-colors"
          aria-label="Close detail panel"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="space-y-2">
        <p class="text-purple-900 font-semibold break-words">{selectedSlice.label}</p>
        <div class="flex items-baseline gap-2 text-sm">
          <span class="text-purple-700 font-medium">{selectedSlice.value} responses</span>
          <span class="text-purple-600">({percentage}%)</span>
        </div>
      </div>
    </div>
  {:else}
    <div class="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 text-center">
      <p class="text-slate-500 text-sm">Click or tap on a slice to see the full label and details</p>
    </div>
  {/if}
</div>
