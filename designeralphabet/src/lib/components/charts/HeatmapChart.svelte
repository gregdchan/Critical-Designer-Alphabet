<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import * as d3 from 'd3';

  export type Response = {
    lens?: string;
    text?: string;
    votes?: number;
  };

  export let responses: Response[] = [];
  export let width = 880;
  export let height = 520;

  let svg: SVGSVGElement;
  let tooltipEl: HTMLDivElement;
  let mounted = false;

  const maturityLevels = ['Emerging', 'Developing', 'Established', 'Advanced', 'Leading'] as const;
  const lensOrder = ['Risk', 'Work', 'Sustainability', 'Ethics', 'Community', 'Justice', 'Agency'] as const;

  type HeatmapCell = {
    lens: string;
    maturity: string;
    count: number;
    responses: Response[];
  };

  const lensPalette: Record<string, string> = {
    Risk: '#f97316',
    Work: '#38bdf8',
    Sustainability: '#22d3ee',
    Ethics: '#a855f7',
    Community: '#bef264',
    Justice: '#f472b6',
    Agency: '#22c55e'
  };

  function getMaturityBucket(votes: number | undefined) {
    const safeVotes = votes ?? 0;
    if (safeVotes >= 8) return 'Leading';
    if (safeVotes >= 6) return 'Advanced';
    if (safeVotes >= 4) return 'Established';
    if (safeVotes >= 2) return 'Developing';
    return 'Emerging';
  }

  function prepareData(source: Response[]): HeatmapCell[] {
    const grouped = d3.rollups(
      source,
      (rows) => rows,
      (row) => (row.lens ? normaliseLens(row.lens) : 'Other'),
      (row) => getMaturityBucket(row.votes)
    );

    const dataset: HeatmapCell[] = [];

    const allLenses = Array.from(new Set([...lensOrder, ...grouped.map(([lens]) => lens)]));

    allLenses.forEach((lens) => {
      maturityLevels.forEach((maturity) => {
        const lensEntry = grouped.find(([key]) => key === lens);
        const responsesForCell = lensEntry
          ? lensEntry[1].find(([bucket]) => bucket === maturity)?.[1] ?? []
          : [];
        dataset.push({
          lens,
          maturity,
          count: responsesForCell.length,
          responses: responsesForCell
        });
      });
    });

    return dataset;
  }

  function normaliseLens(raw: string) {
    const match = Object.keys(lensPalette).find((key) => key.toLowerCase() === raw.toLowerCase());
    return match ?? raw;
  }

  function renderChart() {
    if (!mounted || !svg || !tooltipEl) return;

    const data = prepareData(responses);
    const chartLenses = Array.from(new Set(data.map((d) => d.lens)));

    const margin = { top: 72, right: 48, bottom: 96, left: 132 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleBand<string>().domain(maturityLevels as unknown as string[]).range([0, chartWidth]).padding(0.12);
    const yScale = d3.scaleBand<string>().domain(chartLenses).range([0, chartHeight]).padding(0.18);

    const maxCount = d3.max(data, (d) => d.count) ?? 1;

    const fillScale = d3
      .scaleSequential(d3.interpolateTurbo)
      .domain([0, Math.max(4, maxCount)]);

    const root = d3.select(svg);
    root.selectAll('*').remove();
    root.attr('viewBox', `0 0 ${width} ${height}`);

    const defs = root.append('defs');
    const backgroundGradient = defs
      .append('linearGradient')
      .attr('id', 'heatmap-background')
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '100%');

    backgroundGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(15, 23, 42, 0.95)');

    backgroundGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(8, 15, 32, 0.98)');

    const glow = defs
      .append('filter')
      .attr('id', 'heatmap-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    glow.append('feGaussianBlur').attr('stdDeviation', 6).attr('result', 'coloredBlur');
    const glowMerge = glow.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const container = root.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    container
      .append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('rx', 24)
      .attr('fill', 'url(#heatmap-background)')
      .attr('stroke', 'rgba(148, 163, 184, 0.35)')
      .attr('stroke-width', 1.2)
      .style('filter', 'url(#heatmap-glow)');

    const tooltip = d3.select(tooltipEl).style('opacity', 0).style('pointer-events', 'none');

    const grid = container.append('g').attr('class', 'heatmap-grid');
    xScale.domain().forEach((tick) => {
      grid
        .append('line')
        .attr('x1', (xScale(tick) ?? 0) + xScale.bandwidth() / 2)
        .attr('x2', (xScale(tick) ?? 0) + xScale.bandwidth() / 2)
        .attr('y1', 12)
        .attr('y2', chartHeight - 12)
        .attr('stroke', 'rgba(148, 163, 184, 0.12)')
        .attr('stroke-dasharray', '4 10');
    });

    yScale.domain().forEach((tick) => {
      grid
        .append('line')
        .attr('y1', (yScale(tick) ?? 0) + yScale.bandwidth() / 2)
        .attr('y2', (yScale(tick) ?? 0) + yScale.bandwidth() / 2)
        .attr('x1', 12)
        .attr('x2', chartWidth - 12)
        .attr('stroke', 'rgba(148, 163, 184, 0.12)')
        .attr('stroke-dasharray', '4 10');
    });

    const cells = container
      .append('g')
      .attr('class', 'cells')
      .selectAll('g.cell')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'cell')
      .attr('transform', (d) => `translate(${xScale(d.maturity) ?? 0}, ${yScale(d.lens) ?? 0})`);

    cells
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 10)
      .attr('fill', (d) => (d.count === 0 ? 'rgba(140, 148, 190, 0.12)' : fillScale(d.count)))
      .attr('fill-opacity', (d) => (d.count === 0 ? 0.18 : 0.88))
      .attr('stroke', (d) => (d.count === 0 ? 'rgba(148, 163, 184, 0.25)' : 'rgba(255,255,255,0.15)'))
      .attr('stroke-width', 1.2)
      .style('cursor', 'pointer')
      .on('pointerenter', function (event, d) {
        const rect = d3.select(this);
        rect
          .transition()
          .duration(200)
          .attr('stroke', 'rgba(255,255,255,0.65)')
          .attr('stroke-width', 2);

        cells.classed('dimmed', (cell) => cell.lens !== d.lens && cell.maturity !== d.maturity);
        cells
          .filter((cell) => cell.lens === d.lens || cell.maturity === d.maturity)
          .classed('highlighted', true);

        const bounds = (svg.parentNode as HTMLElement).getBoundingClientRect();
        const previewList = d.responses
          .slice(0, 4)
          .map((entry) => `• ${entry.text?.slice(0, 80) ?? 'Untitled response'}${entry.text && entry.text.length > 80 ? '…' : ''}`)
          .join('<br/>');

        tooltip
          .style('opacity', 0.98)
          .html(`
            <div class="tooltip-heading">${d.lens} × ${d.maturity}</div>
            <div class="tooltip-count">${d.count} insight${d.count === 1 ? '' : 's'}</div>
            <div class="tooltip-list">${previewList || 'No entries yet'}</div>
          `)
          .style('transform', `translate(${event.clientX - bounds.left + 18}px, ${event.clientY - bounds.top - 24}px)`);
      })
      .on('pointermove', function (event) {
        const bounds = (svg.parentNode as HTMLElement).getBoundingClientRect();
        tooltip.style('transform', `translate(${event.clientX - bounds.left + 18}px, ${event.clientY - bounds.top - 24}px)`);
      })
      .on('pointerleave', function () {
        d3.select(this)
          .transition()
          .duration(180)
          .attr('stroke', 'rgba(255,255,255,0.15)')
          .attr('stroke-width', 1.2);

        cells.classed('dimmed', false).classed('highlighted', false);
        tooltip.style('opacity', 0);
      });

    cells
      .append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2 - 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(248, 250, 252, 0.94)')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-weight', 600)
      .attr('font-size', 14)
      .text((d) => (d.count > 0 ? d.count.toString() : ''));

    cells
      .append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2 + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(226, 232, 240, 0.75)')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-size', 9)
      .text((d) => (d.count > 1 ? 'voices' : d.count === 1 ? 'voice' : ''));

    const xAxis = container.append('g').attr('transform', `translate(0, ${chartHeight})`);
    xAxis
      .selectAll('text')
      .data(maturityLevels)
      .enter()
      .append('text')
      .attr('x', (d) => (xScale(d) ?? 0) + xScale.bandwidth() / 2)
      .attr('y', 32)
      .attr('text-anchor', 'middle')
      .attr('fill', '#38bdf8')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-size', 12)
      .text((d) => d.toUpperCase());

    const yAxis = container.append('g');
    yAxis
      .selectAll('text')
      .data(chartLenses)
      .enter()
      .append('text')
      .attr('x', -28)
      .attr('y', (d) => (yScale(d) ?? 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', (d) => lensPalette[d] ?? '#94a3b8')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-weight', 600)
      .attr('font-size', 12)
      .text((d) => d.toUpperCase());

    container
      .append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -28)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(224, 231, 255, 0.92)')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-size', 18)
      .attr('font-weight', 600)
      .text('Maturity Heatmap — Justice-Centered Readiness');

    container
      .append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(148, 163, 184, 0.75)')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-size', 12)
      .text('Votes steer maturity; hover for representative voices.');

    const legend = container
      .append('g')
      .attr('transform', `translate(${chartWidth - 220}, ${chartHeight + 56})`);

    const legendGradient = defs
      .append('linearGradient')
      .attr('id', 'heatmap-legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    legendGradient.append('stop').attr('offset', '0%').attr('stop-color', fillScale(0));
    legendGradient.append('stop').attr('offset', '100%').attr('stop-color', fillScale(maxCount));

    legend
      .append('rect')
      .attr('width', 160)
      .attr('height', 12)
      .attr('rx', 6)
      .attr('fill', 'url(#heatmap-legend-gradient)');

    const legendScale = d3.scaleLinear().domain([0, maxCount]).range([0, 160]);
    const legendAxis = d3.axisBottom(legendScale).ticks(4).tickFormat((value) => `${value}`);

    legend
      .append('g')
      .attr('transform', 'translate(0, 12)')
      .call(legendAxis)
      .selectAll('text')
      .attr('fill', 'rgba(226, 232, 240, 0.8)')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-size', 10);

    legend.selectAll('path,line').attr('stroke', 'rgba(94, 234, 212, 0.4)');
    legend.select('g').select('.domain').attr('stroke-width', 0);

    legend
      .append('text')
      .attr('x', 0)
      .attr('y', -8)
      .attr('fill', 'rgba(148, 163, 184, 0.85)')
      .attr('font-size', 10)
      .attr('font-family', 'Orbitron, sans-serif')
      .text('Response density');
  }

  onMount(() => {
    mounted = true;
    renderChart();
  });

  onDestroy(() => {
    mounted = false;
  });

  $: if (mounted) {
    renderChart();
  }
</script>

<div class="heatmap-wrapper">
  <svg bind:this={svg} role="img" aria-label="Responses maturity heatmap"></svg>
  <div bind:this={tooltipEl} class="chart-tooltip"></div>
</div>

<style>
  .heatmap-wrapper {
    position: relative;
    width: 100%;
    padding: 1.75rem;
    border-radius: 1.5rem;
    background:
      radial-gradient(circle at 15% 20%, rgba(59, 130, 246, 0.18), transparent 60%),
      radial-gradient(circle at 78% 18%, rgba(236, 72, 153, 0.14), transparent 55%),
      radial-gradient(circle at 50% 80%, rgba(45, 212, 191, 0.2), transparent 70%),
      rgba(5, 8, 18, 0.94);
    border: 1px solid rgba(94, 234, 212, 0.2);
    box-shadow: 0 30px 60px rgba(7, 89, 133, 0.35);
  }

  svg {
    width: 100%;
    height: auto;
  }

  .chart-tooltip {
    position: absolute;
    min-width: 220px;
    max-width: 320px;
    padding: 1rem 1.1rem 1.1rem;
    border-radius: 0.9rem;
    background: rgba(4, 7, 14, 0.95);
    border: 1px solid rgba(94, 234, 212, 0.35);
    color: #f8fafc;
    font-family: 'Orbitron', system-ui, sans-serif;
    font-size: 0.7rem;
    line-height: 1.45;
    pointer-events: none;
    box-shadow: 0 18px 38px rgba(45, 212, 191, 0.28);
    mix-blend-mode: screen;
  }

  .chart-tooltip .tooltip-heading {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    margin-bottom: 0.35rem;
  }

  .chart-tooltip .tooltip-count {
    font-size: 0.68rem;
    opacity: 0.8;
    margin-bottom: 0.6rem;
  }

  .chart-tooltip .tooltip-list {
    display: grid;
    gap: 0.25rem;
    font-size: 0.68rem;
    opacity: 0.8;
  }

  g.cell.dimmed {
    opacity: 0.25;
  }

  g.cell.highlighted {
    opacity: 1;
  }
</style>
