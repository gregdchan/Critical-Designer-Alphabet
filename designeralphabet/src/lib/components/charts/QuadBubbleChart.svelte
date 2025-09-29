<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';

  export let responses: any[] = [];
  export let width = 800;
  export let height = 600;

  let svg: SVGElement;
  let mounted = false;

  interface BubbleData {
    id: string;
    x: number;
    y: number;
    radius: number;
    color: string;
    text: string;
    lens: string;
    type: string;
    votes: number;
    participantName: string;
  }

  const quadrants = [
    { label: 'High Impact / Low Effort', x: 0.75, y: 0.25, color: '#00fff7' },
    { label: 'High Impact / High Effort', x: 0.75, y: 0.75, color: '#ff2aad' },
    { label: 'Low Impact / Low Effort', x: 0.25, y: 0.25, color: '#aaff00' },
    { label: 'Low Impact / High Effort', x: 0.25, y: 0.75, color: '#6c00ff' }
  ];

  function processData(responses: any[]): BubbleData[] {
    return responses.map((response, index) => {
      const impact = Math.random() * 0.8 + 0.1;
      const effort = Math.random() * 0.8 + 0.1;
      const votes = response.votes || 0;

      return {
        id: `bubble-${response.id || index}`,
        x: impact,
        y: effort,
        radius: Math.max(20, 10 + votes * 5),
        color: getColorByLens(response.lens),
        text: response.text?.substring(0, 50) + (response.text?.length > 50 ? '...' : ''),
        lens: response.lens || 'Unknown',
        type: response.type || 'Idea',
        votes: votes,
        participantName: response.participantName || 'Anonymous'
      };
    });
  }

  function getColorByLens(lens: string): string {
    const lensColors: { [key: string]: string } = {
      'Justice': '#00fff7',
      'Ethics': '#ff2aad',
      'Community': '#aaff00',
      'Agency': '#6c00ff',
      'Sustainability': '#ffa500'
    };
    return lensColors[lens] || '#ffffff';
  }

  function renderChart() {
    if (!svg || !mounted) return;

    const data = processData(responses);
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    d3.select(svg).selectAll('*').remove();

    const container = d3.select(svg)
      .attr('width', width)
      .attr('height', height);

    const chart = container.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    chart.append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', 'rgba(13, 13, 13, 0.8)')
      .attr('stroke', 'rgba(0, 255, 247, 0.2)')
      .attr('rx', 12);

    chart.append('line')
      .attr('x1', 0)
      .attr('y1', chartHeight / 2)
      .attr('x2', chartWidth)
      .attr('y2', chartHeight / 2)
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    chart.append('line')
      .attr('x1', chartWidth / 2)
      .attr('y1', 0)
      .attr('x2', chartWidth / 2)
      .attr('y2', chartHeight)
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    chart.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#00fff7')
      .attr('font-size', '12px')
      .attr('font-family', 'Orbitron, sans-serif')
      .text('HIGH IMPACT');

    chart.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#aaff00')
      .attr('font-size', '12px')
      .attr('font-family', 'Orbitron, sans-serif')
      .text('LOW IMPACT');

    chart.append('text')
      .attr('x', -10)
      .attr('y', chartHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#aaff00')
      .attr('font-size', '12px')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('transform', `rotate(-90, -10, ${chartHeight / 2})`)
      .text('LOW EFFORT');

    chart.append('text')
      .attr('x', chartWidth + 20)
      .attr('y', chartHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ff2aad')
      .attr('font-size', '12px')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('transform', `rotate(90, ${chartWidth + 20}, ${chartHeight / 2})`)
      .text('HIGH EFFORT');

    const xScale = d3.scaleLinear().domain([0, 1]).range([0, chartWidth]);
    const yScale = d3.scaleLinear().domain([0, 1]).range([chartHeight, 0]);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'quad-bubble-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(5, 5, 5, 0.95)')
      .style('color', '#fff')
      .style('border', '1px solid rgba(0, 255, 247, 0.5)')
      .style('border-radius', '8px')
      .style('padding', '10px')
      .style('font-family', 'Orbitron, sans-serif')
      .style('font-size', '12px')
      .style('max-width', '200px')
      .style('z-index', '1000');

    const bubbles = chart.selectAll('.bubble')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'bubble')
      .attr('transform', d => `translate(${xScale(d.x)}, ${yScale(d.y)})`);

    bubbles.append('circle')
      .attr('r', 0)
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.7)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 0 6px rgba(0, 255, 247, 0.4))')
      .style('cursor', 'pointer')
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('r', d => d.radius);

    bubbles.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-weight', '600')
      .style('pointer-events', 'none')
      .text(d => d.votes.toString())
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .style('opacity', 1);

    bubbles
      .on('mouseover', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d.radius * 1.2)
          .attr('stroke-width', 3);

        tooltip.style('visibility', 'visible')
          .html(`<strong>${d.lens}</strong><br/>
                 ${d.type}<br/>
                 <em>${d.text}</em><br/>
                 By: ${d.participantName}<br/>
                 Votes: ${d.votes}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mousemove', function(event) {
        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d.radius)
          .attr('stroke-width', 2);

        tooltip.style('visibility', 'hidden');
      });
  }

  onMount(() => {
    mounted = true;
    renderChart();
  });

  onDestroy(() => {
    d3.selectAll('.quad-bubble-tooltip').remove();
  });

  $: if (mounted && responses) {
    renderChart();
  }
</script>

<div class="quad-bubble-container">
  <svg bind:this={svg}></svg>
</div>

<style>
  .quad-bubble-container {
    width: 100%;
    display: flex;
    justify-content: center;
    background: rgb(30, 41, 59);
    border-radius: 0.5rem;
    padding: 1.5rem;
    border: 1px solid rgb(71, 85, 105);
  }
</style>