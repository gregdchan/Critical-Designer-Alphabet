<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';

  export let responses: any[] = [];
  export let width = 800;
  export let height = 500;

  let svg: SVGElement;
  let mounted = false;

  interface HeatmapData {
    row: number;
    col: number;
    value: number;
    color: string;
    lens: string;
    maturity: string;
    count: number;
    responses: any[];
  }

  const maturityLevels = [
    'Emerging', 'Developing', 'Established', 'Advanced', 'Leading'
  ];

  const lenses = [
    'Justice', 'Ethics', 'Community', 'Agency', 'Sustainability'
  ];

  const colorScale = d3.scaleSequential(d3.interpolateViridis)
    .domain([0, 10]);

  const neonColors: { [key: string]: string } = {
    'Justice': '#00fff7',
    'Ethics': '#ff2aad',
    'Community': '#aaff00',
    'Agency': '#6c00ff',
    'Sustainability': '#ffa500'
  };

  function processData(responses: any[]): HeatmapData[] {
    const data: HeatmapData[] = [];

    for (let row = 0; row < lenses.length; row++) {
      for (let col = 0; col < maturityLevels.length; col++) {
        const lens = lenses[row];
        const maturity = maturityLevels[col];

        const matchingResponses = responses.filter(r =>
          r.lens === lens && getMaturityLevel(r) === maturity
        );

        data.push({
          row,
          col,
          value: matchingResponses.length,
          color: neonColors[lens] || '#ffffff',
          lens,
          maturity,
          count: matchingResponses.length,
          responses: matchingResponses
        });
      }
    }

    return data;
  }

  function getMaturityLevel(response: any): string {
    if (!response.text) return 'Emerging';

    const text = response.text.toLowerCase();
    const votes = response.votes || 0;

    if (votes >= 8) return 'Leading';
    if (votes >= 6) return 'Advanced';
    if (votes >= 4) return 'Established';
    if (votes >= 2) return 'Developing';
    return 'Emerging';
  }

  function renderChart() {
    if (!svg || !mounted) return;

    const data = processData(responses);
    const margin = { top: 60, right: 40, bottom: 80, left: 120 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const cellWidth = chartWidth / maturityLevels.length;
    const cellHeight = chartHeight / lenses.length;

    d3.select(svg).selectAll('*').remove();

    const container = d3.select(svg)
      .attr('width', width)
      .attr('height', height);

    container.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'rgba(13, 13, 13, 0.8)')
      .attr('rx', 12);

    const chart = container.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    chart.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#00fff7')
      .attr('font-size', '18px')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-weight', '600')
      .text('MATURITY HEATMAP');

    const xScale = d3.scaleBand()
      .domain(maturityLevels)
      .range([0, chartWidth])
      .padding(0.05);

    const yScale = d3.scaleBand()
      .domain(lenses)
      .range([0, chartHeight])
      .padding(0.05);

    const maxCount = d3.max(data, d => d.count) || 1;

    const tooltip = d3.select('body').append('div')
      .attr('class', 'heatmap-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(5, 5, 5, 0.95)')
      .style('color', '#fff')
      .style('border', '1px solid rgba(0, 255, 247, 0.5)')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('font-family', 'Orbitron, sans-serif')
      .style('font-size', '12px')
      .style('max-width', '250px')
      .style('z-index', '1000');

    const cells = chart.selectAll<SVGGElement, HeatmapData>('.cell')
      .data<HeatmapData>(data)
      .enter()
      .append('g')
      .attr('class', 'cell')
      .attr('transform', d => `translate(${xScale(d.maturity)}, ${yScale(d.lens)})`);

    cells.append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', (d: HeatmapData) => d.count === 0 ? 'rgba(255, 255, 255, 0.1)' : d.color)
      .attr('fill-opacity', (d: HeatmapData) => (d.count === 0 ? 0.1 : Math.max(0.3, d.count / maxCount)))
      .attr('stroke', (d: HeatmapData) => d.color)
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .style('filter', (d: HeatmapData) => d.count > 0 ? `drop-shadow(0 0 8px ${d.color}40)` : 'none')
      .on('mouseover', function(this: SVGRectElement, event: MouseEvent, d: HeatmapData) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', 2)
          .attr('fill-opacity', Math.max(0.5, d.count / maxCount));

        const responseList = d.responses
          .map(r => `• ${r.text?.substring(0, 40)}${r.text?.length > 40 ? '...' : ''}`)
          .join('<br/>');

        tooltip.style('visibility', 'visible')
          .html(`<strong>${d.lens} × ${d.maturity}</strong><br/>
                 Count: ${d.count}<br/><br/>
                 ${responseList || 'No responses'}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mousemove', function(this: SVGRectElement, event: MouseEvent) {
        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(this: SVGRectElement, event: MouseEvent, d: HeatmapData) {
        const targetOpacity = d.count === 0 ? 0.1 : Math.max(0.3, d.count / maxCount);
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', 1)
          .attr('fill-opacity', targetOpacity);

        tooltip.style('visibility', 'hidden');
      });

    cells.append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', (d: HeatmapData) => (d.count > 0 ? '#000' : '#666'))
      .attr('font-size', '14px')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-weight', '600')
      .style('pointer-events', 'none')
      .text((d: HeatmapData) => d.count || '');

    const xAxis = chart.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`);

    xAxis.selectAll('.x-label')
      .data(maturityLevels)
      .enter()
      .append('text')
      .attr('class', 'x-label')
      .attr('x', d => (xScale(d) || 0) + xScale.bandwidth() / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#00fff7')
      .attr('font-size', '12px')
      .attr('font-family', 'Orbitron, sans-serif')
      .text(d => d);

    const yAxis = chart.append('g')
      .attr('class', 'y-axis');

    yAxis.selectAll('.y-label')
      .data(lenses)
      .enter()
      .append('text')
      .attr('class', 'y-label')
      .attr('x', -10)
      .attr('y', d => (yScale(d) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', d => neonColors[d] || '#ffffff')
      .attr('font-size', '12px')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-weight', '600')
      .text(d => d);

    chart.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 50)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '14px')
      .attr('font-family', 'Orbitron, sans-serif')
      .text('Maturity Level');

    chart.append('text')
      .attr('x', -60)
      .attr('y', chartHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '14px')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('transform', `rotate(-90, -60, ${chartHeight / 2})`)
      .text('Design Lens');
  }

  onMount(() => {
    mounted = true;
    renderChart();
  });

  onDestroy(() => {
    d3.selectAll('.heatmap-tooltip').remove();
  });

  $: if (mounted && responses) {
    renderChart();
  }
</script>

<div class="heatmap-container">
  <svg bind:this={svg}></svg>
</div>

<style>
  .heatmap-container {
    width: 100%;
    display: flex;
    justify-content: center;
    background: rgb(30, 41, 59);
    border-radius: 0.5rem;
    padding: 1.5rem;
    border: 1px solid rgb(71, 85, 105);
  }
</style>
