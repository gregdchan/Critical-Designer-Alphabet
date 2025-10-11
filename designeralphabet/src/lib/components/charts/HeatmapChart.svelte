<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import { getThemeColors } from '$lib/utils/colors';

	type Response = {
		lens?: string;
		text?: string;
		votes?: number;
	};

	export let responses: Response[] = [];
	export let width = 880;
	export let height = 520;
	export let question = '';

	let svg: SVGSVGElement;
	let tooltipEl: HTMLDivElement;
	let mounted = false;

	const maturityLevels = ['Emerging', 'Developing', 'Established', 'Advanced', 'Leading'] as const;
	const lensOrder = [
		'Risk',
		'Work',
		'Sustainability',
		'Ethics',
		'Community',
		'Justice',
		'Agency'
	] as const;

	type HeatmapCell = {
		lens: string;
		maturity: string;
		count: number;
		responses: Response[];
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
					? (lensEntry[1].find(([bucket]) => bucket === maturity)?.[1] ?? [])
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
		const match = (lensOrder as readonly string[]).find(
			(key) => key.toLowerCase() === raw.toLowerCase()
		);
		return match ?? raw;
	}

	function renderChart() {
		if (!mounted || !svg || !tooltipEl) return;

		const data = prepareData(responses);
		const chartLenses = Array.from(new Set(data.map((d) => d.lens)));
		const theme = getThemeColors();
		const lensPalette = Object.fromEntries(
			(lensOrder as readonly string[]).map((lens, idx) => [
				lens,
				theme.chart[idx % theme.chart.length] ?? theme.brand
			])
		);

		const margin = { top: 72, right: 48, bottom: 96, left: 132 };
		const chartWidth = width - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;

		const xScale = d3
			.scaleBand<string>()
			.domain(maturityLevels as unknown as string[])
			.range([0, chartWidth])
			.padding(0.12);
		const yScale = d3.scaleBand<string>().domain(chartLenses).range([0, chartHeight]).padding(0.18);

		const maxCount = d3.max(data, (d) => d.count) ?? 1;
		const fillStops = theme.chart.length
			? theme.chart
			: [theme.surfaceMuted, theme.accentWarm, theme.accentCritical];
		const maxRange = Math.max(4, maxCount);
		const domainStops = fillStops.map((_, idx) =>
			idx === fillStops.length - 1 ? maxRange : (idx / Math.max(1, fillStops.length - 1)) * maxRange
		);
		const fillScale = d3.scaleLinear<string>().domain(domainStops).range(fillStops);

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
			.attr('stop-color', 'hsl(var(--surface) / 0.95)');

		backgroundGradient
			.append('stop')
			.attr('offset', '100%')
			.attr('stop-color', 'hsl(var(--surface-muted) / 0.98)');

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

		const container = root
			.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		container
			.append('rect')
			.attr('width', chartWidth)
			.attr('height', chartHeight)
			.attr('rx', 24)
			.attr('fill', 'url(#heatmap-background)')
			.attr('stroke', 'hsl(var(--border-subtle) / 0.35)')
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
				.attr('stroke', 'hsl(var(--border-subtle) / 0.2)')
				.attr('stroke-dasharray', '4 10');
		});

		yScale.domain().forEach((tick) => {
			grid
				.append('line')
				.attr('y1', (yScale(tick) ?? 0) + yScale.bandwidth() / 2)
				.attr('y2', (yScale(tick) ?? 0) + yScale.bandwidth() / 2)
				.attr('x1', 12)
				.attr('x2', chartWidth - 12)
				.attr('stroke', 'hsl(var(--border-subtle) / 0.2)')
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
			.attr('fill', (d) =>
				d.count === 0 ? 'hsl(var(--surface-muted) / 0.35)' : fillScale(d.count)
			)
			.attr('fill-opacity', (d) => (d.count === 0 ? 0.28 : 0.88))
			.attr('stroke', (d) =>
				d.count === 0 ? 'hsl(var(--border-subtle) / 0.4)' : 'hsl(var(--surface-elevated) / 0.15)'
			)
			.attr('stroke-width', 1.2)
			.style('cursor', 'pointer')
			.on('pointerenter', function (event, d) {
				const rect = d3.select(this);
				rect
					.transition()
					.duration(200)
					.attr('stroke', 'hsl(var(--surface-elevated) / 0.75)')
					.attr('stroke-width', 2);

				cells.classed('dimmed', (cell) => cell.lens !== d.lens && cell.maturity !== d.maturity);
				cells
					.filter((cell) => cell.lens === d.lens || cell.maturity === d.maturity)
					.classed('highlighted', true);

				const bounds = (svg.parentNode as HTMLElement).getBoundingClientRect();
				const previewList = d.responses
					.slice(0, 4)
					.map(
						(entry) =>
							`• ${entry.text?.slice(0, 80) ?? 'Untitled response'}${entry.text && entry.text.length > 80 ? '…' : ''}`
					)
					.join('<br/>');

				tooltip
					.style('opacity', 0.98)
					.html(
						`
            ${question ? `<div class="tooltip-question">${question}</div>` : ''}
            <div class="tooltip-heading">${d.lens} × ${d.maturity}</div>
            <div class="tooltip-count">${d.count} insight${d.count === 1 ? '' : 's'}</div>
            <div class="tooltip-list">${previewList || 'No entries yet'}</div>
          `
					)
					.style(
						'transform',
						`translate(${event.clientX - bounds.left + 18}px, ${event.clientY - bounds.top - 24}px)`
					);
			})
			.on('pointermove', function (event) {
				const bounds = (svg.parentNode as HTMLElement).getBoundingClientRect();
				tooltip.style(
					'transform',
					`translate(${event.clientX - bounds.left + 18}px, ${event.clientY - bounds.top - 24}px)`
				);
			})
			.on('pointerleave', function () {
				d3.select(this)
					.transition()
					.duration(180)
					.attr('stroke', 'hsl(var(--surface-elevated) / 0.15)')
					.attr('stroke-width', 1.2);

				cells.classed('dimmed', false).classed('highlighted', false);
				tooltip.style('opacity', 0);
			});

		cells
			.append('text')
			.attr('x', xScale.bandwidth() / 2)
			.attr('y', yScale.bandwidth() / 2 - 2)
			.attr('text-anchor', 'middle')
			.attr('fill', 'hsl(var(--text-on-teal))')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-weight', 600)
			.attr('font-size', 14)
			.text((d) => (d.count > 0 ? d.count.toString() : ''));

		cells
			.append('text')
			.attr('x', xScale.bandwidth() / 2)
			.attr('y', yScale.bandwidth() / 2 + 16)
			.attr('text-anchor', 'middle')
			.attr('fill', 'hsl(var(--text-on-teal) / 0.75)')
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
			.attr('fill', theme.brand)
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
			.attr('fill', (d) => lensPalette[d] ?? theme.ink2)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-weight', 600)
			.attr('font-size', 12)
			.text((d) => d.toUpperCase());

		container
			.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', -28)
			.attr('text-anchor', 'middle')
			.attr('fill', theme.ink)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', 18)
			.attr('font-weight', 600)
			.text('Maturity Heatmap — Justice-Centered Readiness');

		container
			.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', -8)
			.attr('text-anchor', 'middle')
			.attr('fill', theme.inkMuted)
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
		const legendAxis = d3
			.axisBottom(legendScale)
			.ticks(4)
			.tickFormat((value) => `${value}`);

		legend
			.append('g')
			.attr('transform', 'translate(0, 12)')
			.call(legendAxis)
			.selectAll('text')
			.attr('fill', theme.ink2)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', 10);

		legend.selectAll('path,line').attr('stroke', 'hsl(var(--brand) / 0.4)');
		legend.select('g').select('.domain').attr('stroke-width', 0);

		legend
			.append('text')
			.attr('x', 0)
			.attr('y', -8)
			.attr('fill', theme.inkMuted)
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
			radial-gradient(circle at 15% 20%, hsl(var(--brand) / 0.18), transparent 60%),
			radial-gradient(circle at 78% 18%, hsl(var(--accent-critical) / 0.14), transparent 55%),
			radial-gradient(circle at 50% 80%, hsl(var(--accent-warm) / 0.2), transparent 70%),
			hsl(var(--surface));
		border: 1px solid hsl(var(--border-strong) / 0.35);
		box-shadow: 0 30px 60px hsl(var(--brand-soft) / 0.35);
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
		background: hsl(var(--surface) / 0.95);
		border: 1px solid hsl(var(--brand) / 0.35);
		color: hsl(var(--text-on-teal));
		font-family: 'Orbitron', system-ui, sans-serif;
		font-size: 0.7rem;
		line-height: 1.45;
		pointer-events: none;
		box-shadow: 0 18px 38px hsl(var(--brand) / 0.28);
		mix-blend-mode: screen;
	}

	:global(.chart-tooltip .tooltip-question) {
		font-size: 0.7rem;
		font-weight: 600;
		color: hsl(var(--brand));
		margin-bottom: 0.6rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid hsl(var(--border-subtle));
	}

	:global(.chart-tooltip .tooltip-heading) {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 700;
		margin-bottom: 0.35rem;
	}

	:global(.chart-tooltip .tooltip-count) {
		font-size: 0.68rem;
		opacity: 0.8;
		margin-bottom: 0.6rem;
	}

	:global(.chart-tooltip .tooltip-list) {
		display: grid;
		gap: 0.25rem;
		font-size: 0.68rem;
		opacity: 0.8;
	}

	:global(g.cell.dimmed) {
		opacity: 0.25;
	}

	:global(g.cell.highlighted) {
		opacity: 1;
	}
</style>
