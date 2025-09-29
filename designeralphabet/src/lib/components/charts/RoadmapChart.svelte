<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';

  export let responses: any[] = [];
  export let width = 900;
  export let height = 600;

  let svg: SVGElement;
  let mounted = false;

  interface RoadmapItem {
    id: string;
    text: string;
    lane: number;
    phase: number;
    priority: 'high' | 'medium' | 'low';
    votes: number;
    lens: string;
    type: string;
    participantName: string;
    effort: number;
    impact: number;
  }

  const phases = ['Now', 'Next', 'Later', 'Future'];
  const lanes = ['Infrastructure', 'Features', 'Research', 'Community'];

  const priorityColors = {
    high: '#ff2aad',
    medium: '#00fff7',
    low: '#aaff00'
  };

  function processData(responses: any[]): RoadmapItem[] {
    return responses.map((response, index) => {
      const votes = response.votes || 0;
      const effort = Math.random();
      const impact = Math.random();

      let priority: 'high' | 'medium' | 'low';
      if (votes >= 5) priority = 'high';
      else if (votes >= 2) priority = 'medium';
      else priority = 'low';

      let phase = 0;
      if (effort < 0.3) phase = 0; // Now
      else if (effort < 0.6) phase = 1; // Next
      else if (effort < 0.8) phase = 2; // Later
      else phase = 3; // Future

      const lane = Math.floor(Math.random() * lanes.length);

      return {
        id: `item-${response.id || index}`,
        text: response.text?.substring(0, 60) + (response.text?.length > 60 ? '...' : '') || 'No content',
        lane,
        phase,
        priority,
        votes,
        lens: response.lens || 'Unknown',
        type: response.type || 'Idea',
        participantName: response.participantName || 'Anonymous',
        effort,
        impact
      };
    });
  }

  function renderChart() {
    if (!svg || !mounted) return;

    const data = processData(responses);
    const margin = { top: 60, right: 40, bottom: 60, left: 120 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const phaseWidth = chartWidth / phases.length;
    const laneHeight = chartHeight / lanes.length;

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
      .attr('fill', '#aaff00')
      .attr('font-size', '18px')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-weight', '600')
      .text('ROADMAP SWIMLANES');

    for (let i = 0; i <= phases.length; i++) {
      chart.append('line')
        .attr('x1', i * phaseWidth)
        .attr('y1', 0)
        .attr('x2', i * phaseWidth)
        .attr('y2', chartHeight)
        .attr('stroke', 'rgba(255, 255, 255, 0.2)')
        .attr('stroke-width', i === 0 || i === phases.length ? 2 : 1);
    }

    for (let i = 0; i <= lanes.length; i++) {
      chart.append('line')
        .attr('x1', 0)
        .attr('y1', i * laneHeight)
        .attr('x2', chartWidth)
        .attr('y2', i * laneHeight)
        .attr('stroke', 'rgba(255, 255, 255, 0.2)')
        .attr('stroke-width', i === 0 || i === lanes.length ? 2 : 1);
    }

    phases.forEach((phase, i) => {
      chart.append('text')
        .attr('x', i * phaseWidth + phaseWidth / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#00fff7')
        .attr('font-size', '14px')
        .attr('font-family', 'Orbitron, sans-serif')
        .attr('font-weight', '600')
        .text(phase);
    });

    lanes.forEach((lane, i) => {
      chart.append('text')
        .attr('x', -10)
        .attr('y', i * laneHeight + laneHeight / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('fill', '#ffffff')
        .attr('font-size', '12px')
        .attr('font-family', 'Orbitron, sans-serif')
        .attr('font-weight', '600')
        .text(lane);
    });

    const tooltip = d3.select('body').append('div')
      .attr('class', 'roadmap-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(5, 5, 5, 0.95)')
      .style('color', '#fff')
      .style('border', '1px solid rgba(170, 255, 0, 0.5)')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('font-family', 'Orbitron, sans-serif')
      .style('font-size', '12px')
      .style('max-width', '280px')
      .style('z-index', '1000');

    const groupedData = d3.group(data, d => `${d.lane}-${d.phase}`);

    groupedData.forEach((items, key) => {
      const [lane, phase] = key.split('-').map(Number);
      const x = phase * phaseWidth + 10;
      const y = lane * laneHeight + 10;
      const availableWidth = phaseWidth - 20;
      const availableHeight = laneHeight - 20;

      const itemsPerRow = Math.max(1, Math.floor(Math.sqrt(items.length)));
      const itemWidth = Math.min(120, (availableWidth - 10 * (itemsPerRow - 1)) / itemsPerRow);
      const itemHeight = Math.min(40, (availableHeight - 10 * (Math.ceil(items.length / itemsPerRow) - 1)) / Math.ceil(items.length / itemsPerRow));

      items.forEach((item, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const itemX = x + col * (itemWidth + 10);
        const itemY = y + row * (itemHeight + 10);

        const itemGroup = chart.append('g')
          .attr('class', 'roadmap-item')
          .attr('transform', `translate(${itemX}, ${itemY})`);

        itemGroup.append('rect')
          .attr('width', itemWidth)
          .attr('height', itemHeight)
          .attr('fill', priorityColors[item.priority])
          .attr('fill-opacity', 0.2)
          .attr('stroke', priorityColors[item.priority])
          .attr('stroke-width', 2)
          .attr('rx', 6)
          .style('cursor', 'pointer')
          .style('filter', `drop-shadow(0 0 6px ${priorityColors[item.priority]}40)`)
          .on('mouseover', function(event) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('fill-opacity', 0.4)
              .attr('stroke-width', 3);

            tooltip.style('visibility', 'visible')
              .html(`<strong>${item.text}</strong><br/>
                     <span style="color: ${priorityColors[item.priority]}">${item.priority.toUpperCase()} Priority</span><br/>
                     ${item.lens} • ${item.type}<br/>
                     By: ${item.participantName}<br/>
                     Votes: ${item.votes}<br/>
                     Lane: ${lanes[item.lane]}<br/>
                     Phase: ${phases[item.phase]}`)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px');
          })
          .on('mousemove', function(event) {
            tooltip.style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px');
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('fill-opacity', 0.2)
              .attr('stroke-width', 2);

            tooltip.style('visibility', 'hidden');
          });

        if (itemHeight > 25) {
          itemGroup.append('text')
            .attr('x', itemWidth / 2)
            .attr('y', itemHeight / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', '9px')
            .attr('font-family', 'Orbitron, sans-serif')
            .attr('font-weight', '600')
            .style('pointer-events', 'none')
            .text(item.votes.toString());
        }

        itemGroup.append('circle')
          .attr('cx', itemWidth - 8)
          .attr('cy', 8)
          .attr('r', 4)
          .attr('fill', priorityColors[item.priority])
          .style('pointer-events', 'none');
      });
    });

    const legend = chart.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${chartWidth - 150}, 20)`);

    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', '#ffffff')
      .attr('font-size', '12px')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-weight', '600')
      .text('Priority:');

    Object.entries(priorityColors).forEach(([priority, color], index) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${20 + index * 20})`);

      legendItem.append('circle')
        .attr('cx', 6)
        .attr('cy', 0)
        .attr('r', 4)
        .attr('fill', color);

      legendItem.append('text')
        .attr('x', 15)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .attr('fill', '#ffffff')
        .attr('font-size', '10px')
        .attr('font-family', 'Orbitron, sans-serif')
        .text(priority.toUpperCase());
    });
  }

  onMount(() => {
    mounted = true;
    renderChart();
  });

  onDestroy(() => {
    d3.selectAll('.roadmap-tooltip').remove();
  });

  $: if (mounted && responses) {
    renderChart();
  }
</script>

<div class="roadmap-container">
  <svg bind:this={svg}></svg>
</div>

<style>
  .roadmap-container {
    width: 100%;
    display: flex;
    justify-content: center;
    background: rgb(30, 41, 59);
    border-radius: 0.5rem;
    padding: 1.5rem;
    border: 1px solid rgb(71, 85, 105);
  }
</style>