<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';

	type LandscapeResponse = {
		id: string;
		text: string;
		metadata?: Record<string, any> | null;
		participantName?: string;
		lens?: string;
		votes?: number;
	};

	export let responses: LandscapeResponse[] = [];
	export let width = 900;
	export let height = 600;
	export let xLabel = 'X Axis';
	export let yLabel = 'Y Axis';
	export let minX = 0;
	export let maxX = 10;
	export let minY = 0;
	export let maxY = 10;

	let svg: SVGSVGElement;
	let tooltipEl: HTMLDivElement;
	let mounted = false;

	const lensPalette: Record<string, string> = {
		Risk: '#f97316',
		Work: '#38bdf8',
		Sustainability: '#22d3ee',
		Ethics: '#a855f7',
		Community: '#bef264',
		Justice: '#f472b6',
		Agency: '#22c55e'
	};

	type PlotPoint = {
		id: string;
		x: number;
		y: number;
		label: string;
		text: string;
		participant: string;
		lens: string;
		color: string;
		votes: number;
	};

	function parseResponseData(response: LandscapeResponse): PlotPoint | null {
		// Try to parse coordinates from metadata or text
		let x = 5;
		let y = 5;
		let label = '';

		if (response.metadata) {
			if (typeof response.metadata.x === 'number') x = response.metadata.x;
			if (typeof response.metadata.y === 'number') y = response.metadata.y;
			if (typeof response.metadata.label === 'string') label = response.metadata.label;
		}

		// Fallback: try parsing from text if it's JSON
		if (!response.metadata || (!response.metadata.x && !response.metadata.y)) {
			try {
				const parsed = JSON.parse(response.text);
				if (typeof parsed.x === 'number') x = parsed.x;
				if (typeof parsed.y === 'number') y = parsed.y;
				if (typeof parsed.label === 'string') label = parsed.label || '';
			} catch {
				// Not JSON, skip this response
				return null;
			}
		}

		const lensColor = response.lens
			? lensPalette[response.lens] || '#94a3b8'
			: '#94a3b8';

		return {
			id: response.id,
			x,
			y,
			label: label || response.text?.slice(0, 30) || 'Response',
			text: response.text,
			participant: response.participantName || 'Anonymous',
			lens: response.lens || 'General',
			color: lensColor,
			votes: response.votes || 0
		};
	}

	function calculateTrendLine(points: PlotPoint[]): { slope: number; intercept: number; r2: number } | null {
		if (points.length < 2) return null;

		const n = points.length;
		const sumX = points.reduce((sum, p) => sum + p.x, 0);
		const sumY = points.reduce((sum, p) => sum + p.y, 0);
		const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
		const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
		const sumY2 = points.reduce((sum, p) => sum + p.y * p.y, 0);

		const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
		const intercept = (sumY - slope * sumX) / n;

		// Calculate R² (coefficient of determination)
		const meanY = sumY / n;
		const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
		const ssResidual = points.reduce((sum, p) => {
			const predicted = slope * p.x + intercept;
			return sum + Math.pow(p.y - predicted, 2);
		}, 0);
		const r2 = 1 - ssResidual / ssTotal;

		return { slope, intercept, r2 };
	}

	function renderChart() {
		if (!mounted || !svg || !tooltipEl) return;

		const parsedPoints = responses
			.map(parseResponseData)
			.filter((p): p is PlotPoint => p !== null);

		if (parsedPoints.length === 0) return;

		const margin = { top: 60, right: 120, bottom: 80, left: 80 };
		const chartWidth = width - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;

		// Clear previous content
		d3.select(svg).selectAll('*').remove();

		const g = d3
			.select(svg)
			.attr('width', width)
			.attr('height', height)
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		// Scales
		const xScale = d3.scaleLinear().domain([minX, maxX]).range([0, chartWidth]);
		const yScale = d3.scaleLinear().domain([minY, maxY]).range([chartHeight, 0]);

		// Grid lines
		g.append('g')
			.attr('class', 'grid')
			.selectAll('line.vertical')
			.data(xScale.ticks(10))
			.join('line')
			.attr('class', 'vertical')
			.attr('x1', (d) => xScale(d))
			.attr('x2', (d) => xScale(d))
			.attr('y1', 0)
			.attr('y2', chartHeight)
			.attr('stroke', 'rgba(148, 163, 184, 0.1)')
			.attr('stroke-width', 1);

		g.append('g')
			.attr('class', 'grid')
			.selectAll('line.horizontal')
			.data(yScale.ticks(10))
			.join('line')
			.attr('class', 'horizontal')
			.attr('x1', 0)
			.attr('x2', chartWidth)
			.attr('y1', (d) => yScale(d))
			.attr('y2', (d) => yScale(d))
			.attr('stroke', 'rgba(148, 163, 184, 0.1)')
			.attr('stroke-width', 1);

		// Calculate and draw trend line
		const trendLine = calculateTrendLine(parsedPoints);
		if (trendLine) {
			const { slope, intercept, r2 } = trendLine;
			const lineData = [
				{ x: minX, y: slope * minX + intercept },
				{ x: maxX, y: slope * maxX + intercept }
			];

			g.append('line')
				.attr('x1', xScale(lineData[0].x))
				.attr('y1', yScale(lineData[0].y))
				.attr('x2', xScale(lineData[1].x))
				.attr('y2', yScale(lineData[1].y))
				.attr('stroke', '#06b6d4')
				.attr('stroke-width', 2)
				.attr('stroke-dasharray', '5,5')
				.attr('opacity', 0.6);

			// Add R² label
			g.append('text')
				.attr('x', chartWidth - 10)
				.attr('y', 10)
				.attr('text-anchor', 'end')
				.attr('fill', '#06b6d4')
				.attr('font-size', '12px')
				.attr('font-weight', '600')
				.text(`Trend: R² = ${r2.toFixed(3)}`);

			// Add slope direction indicator
			const direction = slope > 0 ? '↗' : slope < 0 ? '↘' : '→';
			g.append('text')
				.attr('x', chartWidth - 10)
				.attr('y', 30)
				.attr('text-anchor', 'end')
				.attr('fill', '#94a3b8')
				.attr('font-size', '11px')
				.text(`Slope: ${slope.toFixed(2)} ${direction}`);
		}

		// Axes
		const xAxis = d3.axisBottom(xScale).ticks(10);
		const yAxis = d3.axisLeft(yScale).ticks(10);

		g.append('g')
			.attr('transform', `translate(0,${chartHeight})`)
			.call(xAxis)
			.selectAll('text')
			.attr('fill', '#cbd5e1')
			.attr('font-size', '11px');

		g.append('g')
			.call(yAxis)
			.selectAll('text')
			.attr('fill', '#cbd5e1')
			.attr('font-size', '11px');

		// Axis labels
		g.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', chartHeight + 50)
			.attr('text-anchor', 'middle')
			.attr('fill', '#e2e8f0')
			.attr('font-size', '13px')
			.attr('font-weight', '600')
			.text(xLabel);

		g.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('x', -chartHeight / 2)
			.attr('y', -55)
			.attr('text-anchor', 'middle')
			.attr('fill', '#e2e8f0')
			.attr('font-size', '13px')
			.attr('font-weight', '600')
			.text(yLabel);

		// Plot points
		const pointGroup = g
			.selectAll('.point')
			.data(parsedPoints)
			.join('g')
			.attr('class', 'point')
			.attr('transform', (d) => `translate(${xScale(d.x)},${yScale(d.y)})`);

		// Point circles (size based on votes)
		pointGroup
			.append('circle')
			.attr('r', (d) => Math.max(5, Math.min(15, 5 + d.votes)))
			.attr('fill', (d) => d.color)
			.attr('opacity', 0.7)
			.attr('stroke', '#fff')
			.attr('stroke-width', 2)
			.style('cursor', 'pointer');

		// Point labels
		pointGroup
			.append('text')
			.attr('x', 0)
			.attr('y', (d) => -Math.max(5, Math.min(15, 5 + d.votes)) - 8)
			.attr('text-anchor', 'middle')
			.attr('fill', '#e2e8f0')
			.attr('font-size', '10px')
			.attr('font-weight', '500')
			.text((d) => d.label.slice(0, 20));

		// Tooltip interactions
		pointGroup
			.on('mouseenter', function (event, d) {
				d3.select(this).select('circle').attr('opacity', 1).attr('stroke-width', 3);

				tooltipEl.innerHTML = `
					<div class="text-xs font-semibold text-white mb-1">${d.label}</div>
					<div class="text-xs text-slate-300 mb-2">${d.participant}</div>
					<div class="text-xs text-slate-400 mb-1">Position: (${d.x.toFixed(1)}, ${d.y.toFixed(1)})</div>
					<div class="text-xs text-slate-400">Lens: ${d.lens}</div>
					<div class="text-xs text-slate-400">Votes: ${d.votes}</div>
				`;
				tooltipEl.style.display = 'block';
				tooltipEl.style.left = `${event.pageX + 10}px`;
				tooltipEl.style.top = `${event.pageY - 10}px`;
			})
			.on('mouseleave', function () {
				d3.select(this).select('circle').attr('opacity', 0.7).attr('stroke-width', 2);
				tooltipEl.style.display = 'none';
			});

		// Legend
		const uniqueLenses = Array.from(new Set(parsedPoints.map((p) => p.lens)));
		const legend = g
			.append('g')
			.attr('transform', `translate(${chartWidth + 20}, 0)`);

		legend
			.selectAll('.legend-item')
			.data(uniqueLenses)
			.join('g')
			.attr('class', 'legend-item')
			.attr('transform', (d, i) => `translate(0, ${i * 22})`)
			.each(function (lens) {
				const item = d3.select(this);
				item
					.append('circle')
					.attr('r', 5)
					.attr('fill', lensPalette[lens] || '#94a3b8')
					.attr('opacity', 0.7);

				item
					.append('text')
					.attr('x', 12)
					.attr('y', 4)
					.attr('fill', '#cbd5e1')
					.attr('font-size', '11px')
					.text(lens);
			});

		// Title
		g.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', -30)
			.attr('text-anchor', 'middle')
			.attr('fill', '#f1f5f9')
			.attr('font-size', '16px')
			.attr('font-weight', '700')
			.text('Response Landscape');

		// Statistics summary
		const stats = g
			.append('g')
			.attr('transform', `translate(${chartWidth + 20}, ${uniqueLenses.length * 22 + 30})`);

		stats
			.append('text')
			.attr('fill', '#94a3b8')
			.attr('font-size', '10px')
			.attr('font-weight', '600')
			.text(`n = ${parsedPoints.length}`);

		if (trendLine) {
			const correlation = trendLine.slope > 0 ? 'Positive' : trendLine.slope < 0 ? 'Negative' : 'No';
			stats
				.append('text')
				.attr('y', 15)
				.attr('fill', '#94a3b8')
				.attr('font-size', '10px')
				.text(`${correlation} correlation`);
		}
	}

	$: if (mounted && responses) {
		renderChart();
	}

	onMount(() => {
		mounted = true;
		renderChart();
	});

	onDestroy(() => {
		mounted = false;
	});
</script>

<div class="relative">
	<svg bind:this={svg}></svg>
	<div
		bind:this={tooltipEl}
		class="pointer-events-none absolute rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur"
		style="display: none;"
	></div>
</div>

<style>
	svg {
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
		border-radius: 12px;
	}
</style>
