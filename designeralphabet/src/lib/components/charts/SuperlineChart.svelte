<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import { getThemeColors } from '$lib/utils/colors';
	import type { Question } from '$lib/types/workshop';

	type Response = {
		id: string;
		text: string;
		participant_id?: string | null;
		question_id?: string;
		created_at?: string;
	};

	export let responses: Response[] = [];
	export let questions: Question[] = [];

	let container: HTMLDivElement | null = null;
	let width = 900;
	let height = 600;
	let svg: SVGSVGElement;
	let mounted = false;

	// Track which questions are visible
	let visibleQuestions = new Set<string>();

	const ro = typeof ResizeObserver !== 'undefined'
		? new ResizeObserver((entries) => {
				const r = entries[0]?.contentRect;
				if (r) {
					width = Math.max(300, r.width);
					height = Math.max(300, r.height);
				}
			})
		: null;

	type DataPoint = {
		timestamp: Date;
		value: number;
		questionId: string;
		questionText: string;
	};

	type QuestionSeries = {
		questionId: string;
		questionText: string;
		color: string;
		data: DataPoint[];
		min: number;
		max: number;
		avg: number;
		visible: boolean;
	};

	function parseScaleResponses(
		responses: Response[],
		questions: Question[],
		theme: ReturnType<typeof getThemeColors>
	): QuestionSeries[] {
		const questionMap = new Map(questions.map(q => [q.id, q]));
		const scaleQuestions = questions.filter(q => q.response_type === 'scale');

		if (scaleQuestions.length === 0) return [];

		// Initialize all as visible
		if (visibleQuestions.size === 0) {
			scaleQuestions.forEach(q => visibleQuestions.add(q.id));
		}

		const seriesMap = new Map<string, DataPoint[]>();

		// Group responses by question
		responses.forEach(r => {
			const q = questionMap.get(r.question_id || '');
			if (!q || q.response_type !== 'scale') return;

			const value = parseFloat(r.text);
			if (isNaN(value)) return;

			const timestamp = r.created_at ? new Date(r.created_at) : new Date();

			if (!seriesMap.has(r.question_id || '')) {
				seriesMap.set(r.question_id || '', []);
			}

			seriesMap.get(r.question_id || '')!.push({
				timestamp,
				value,
				questionId: r.question_id || '',
				questionText: q.text || 'Unknown'
			});
		});

		// Create series for each question
		const series: QuestionSeries[] = [];
		let colorIndex = 0;

		seriesMap.forEach((data, questionId) => {
			const q = questionMap.get(questionId);
			if (!q || data.length === 0) return;

			// Sort by timestamp
			data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

			const values = data.map(d => d.value);
			const min = Math.min(...values);
			const max = Math.max(...values);
			const avg = values.reduce((a, b) => a + b, 0) / values.length;

			series.push({
				questionId,
				questionText: q.text || 'Unknown',
				color: theme.chart[colorIndex % theme.chart.length],
				data,
				min,
				max,
				avg,
				visible: visibleQuestions.has(questionId)
			});

			colorIndex++;
		});

		return series;
	}

	function renderSuperline() {
		if (!mounted || !svg) return;

		const theme = getThemeColors();
		const series = parseScaleResponses(responses, questions, theme);

		// Clear previous
		d3.select(svg).selectAll('*').remove();

		if (series.length === 0) {
			const g = d3.select(svg).attr('width', width).attr('height', height).append('g');
			g.append('text')
				.attr('x', width / 2)
				.attr('y', height / 2)
				.attr('text-anchor', 'middle')
				.attr('fill', theme.inkMuted)
				.attr('font-size', '14px')
				.text('No scale/slider questions with responses yet');
			return;
		}

		const visibleSeries = series.filter(s => s.visible);

		const margin = { top: 40, right: 200, bottom: 60, left: 60 };
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		const svgSelection = d3.select(svg).attr('width', width).attr('height', height);
		const g = svgSelection.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		// Get all timestamps and values
		const allData = visibleSeries.flatMap(s => s.data);
		if (allData.length === 0) {
			g.append('text')
				.attr('x', innerWidth / 2)
				.attr('y', innerHeight / 2)
				.attr('text-anchor', 'middle')
				.attr('fill', theme.inkMuted)
				.attr('font-size', '14px')
				.text('Select questions from the legend to display');
			return;
		}

		const timeExtent = d3.extent(allData, d => d.timestamp) as [Date, Date];
		const globalMin = 0; // Start at 0 for better comparison
		const globalMax = Math.max(...visibleSeries.map(s => s.max), 10);

		// Scales
		const xScale = d3.scaleTime().domain(timeExtent).range([0, innerWidth]);

		const yScale = d3.scaleLinear().domain([globalMin, globalMax]).range([innerHeight, 0]).nice();

		// Axes
		const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat('%H:%M') as any);
		const yAxis = d3.axisLeft(yScale).ticks(8);

		g.append('g')
			.attr('transform', `translate(0,${innerHeight})`)
			.call(xAxis)
			.attr('color', theme.ink2)
			.selectAll('text')
			.attr('font-size', '11px');

		g.append('g')
			.call(yAxis)
			.attr('color', theme.ink2)
			.selectAll('text')
			.attr('font-size', '11px');

		// Grid lines
		g.append('g')
			.attr('class', 'grid')
			.attr('opacity', 0.1)
			.call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat('' as any));

		// Line generator
		const line = d3
			.line<DataPoint>()
			.x(d => xScale(d.timestamp))
			.y(d => yScale(d.value))
			.curve(d3.curveMonotoneX);

		// Draw lines
		visibleSeries.forEach(s => {
			g.append('path')
				.datum(s.data)
				.attr('fill', 'none')
				.attr('stroke', s.color)
				.attr('stroke-width', 2.5)
				.attr('d', line)
				.attr('opacity', 0.8);

			// Add dots
			g.selectAll(`.dot-${s.questionId}`)
				.data(s.data)
				.join('circle')
				.attr('class', `dot-${s.questionId}`)
				.attr('cx', d => xScale(d.timestamp))
				.attr('cy', d => yScale(d.value))
				.attr('r', 4)
				.attr('fill', s.color)
				.attr('stroke', 'white')
				.attr('stroke-width', 2)
				.style('cursor', 'pointer')
				.on('mouseenter', function (event: any, d: any) {
					d3.select(this).transition().duration(200).attr('r', 6);

					const tooltip = d3.select('body').selectAll('.superline-tooltip').data([null]);
					const tooltipEnter = tooltip
						.enter()
						.append('div')
						.attr('class', 'superline-tooltip')
						.style('position', 'absolute')
						.style('background', 'hsl(var(--surface) / 0.95)')
						.style('color', 'hsl(var(--text-on-teal))')
						.style('padding', '12px')
						.style('border-radius', '8px')
						.style('border', '1px solid hsl(var(--border-subtle))')
						.style('pointer-events', 'none')
						.style('font-size', '12px')
						.style('box-shadow', '0 4px 12px hsl(var(--brand-soft) / 0.35)')
						.style('backdrop-filter', 'blur(8px)')
						.style('z-index', '1000')
						.style('max-width', '300px');

					const tooltipMerge = tooltipEnter.merge(tooltip);

					tooltipMerge
						.html(
							`
							<div style="font-size: 11px; font-weight: 600; color: ${s.color}; margin-bottom: 8px;">${s.questionText}</div>
							<div style="font-weight: 600; font-size: 16px; margin-bottom: 4px; color: ${theme.ink};">${d.value}</div>
							<div style="color: ${theme.inkMuted}; font-size: 11px;">${d3.timeFormat('%b %d, %H:%M')(d.timestamp)}</div>
						`
						)
						.style('left', event.pageX + 15 + 'px')
						.style('top', event.pageY - 10 + 'px')
						.style('opacity', 1);
				})
				.on('mousemove', function (event: any) {
					d3.select('body')
						.selectAll('.superline-tooltip')
						.style('left', event.pageX + 15 + 'px')
						.style('top', event.pageY - 10 + 'px');
				})
				.on('mouseleave', function () {
					d3.select(this).transition().duration(200).attr('r', 4);
					d3.select('body').selectAll('.superline-tooltip').remove();
				});
		});

		// Axis labels
		g.append('text')
			.attr('x', innerWidth / 2)
			.attr('y', innerHeight + 45)
			.attr('text-anchor', 'middle')
			.attr('fill', theme.ink2)
			.attr('font-size', '12px')
			.attr('font-weight', '600')
			.text('Time');

		g.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('x', -innerHeight / 2)
			.attr('y', -45)
			.attr('text-anchor', 'middle')
			.attr('fill', theme.ink2)
			.attr('font-size', '12px')
			.attr('font-weight', '600')
			.text('Value');

		// Title
		g.append('text')
			.attr('x', innerWidth / 2)
			.attr('y', -20)
			.attr('text-anchor', 'middle')
			.attr('fill', theme.ink)
			.attr('font-size', '16px')
			.attr('font-weight', '700')
			.text('Comparative Scale Trends');

		// Interactive Legend
		const legend = g.append('g').attr('transform', `translate(${innerWidth + 20}, 0)`);

		series.forEach((s, i) => {
			const legendItem = legend
				.append('g')
				.attr('transform', `translate(0, ${i * 80})`)
				.style('cursor', 'pointer')
				.on('click', () => {
					if (visibleQuestions.has(s.questionId)) {
						visibleQuestions.delete(s.questionId);
					} else {
						visibleQuestions.add(s.questionId);
					}
					visibleQuestions = visibleQuestions; // Trigger reactivity
					renderSuperline();
				});

			// Background for better clickability
			legendItem
				.append('rect')
				.attr('x', -5)
				.attr('y', -15)
				.attr('width', 170)
				.attr('height', 75)
				.attr('fill', s.visible ? 'hsl(var(--surface-elevated) / 0.3)' : 'transparent')
				.attr('rx', 4);

			// Color indicator
			legendItem
				.append('rect')
				.attr('width', 4)
				.attr('height', 40)
				.attr('fill', s.color)
				.attr('opacity', s.visible ? 1 : 0.3)
				.attr('rx', 2);

			// Question text (truncated)
			legendItem
				.append('text')
				.attr('x', 10)
				.attr('y', 5)
				.attr('fill', s.visible ? theme.ink : theme.inkMuted)
				.attr('font-size', '10px')
				.attr('font-weight', '600')
				.text(s.questionText.substring(0, 25) + (s.questionText.length > 25 ? '...' : ''));

			// Stats
			legendItem
				.append('text')
				.attr('x', 10)
				.attr('y', 20)
				.attr('fill', s.visible ? theme.ink2 : theme.inkMuted)
				.attr('font-size', '9px')
				.text(`Avg: ${s.avg.toFixed(1)}`);

			legendItem
				.append('text')
				.attr('x', 10)
				.attr('y', 32)
				.attr('fill', s.visible ? theme.ink2 : theme.inkMuted)
				.attr('font-size', '9px')
				.text(`Range: ${s.min.toFixed(1)} - ${s.max.toFixed(1)}`);

			// Visibility indicator
			legendItem
				.append('text')
				.attr('x', 150)
				.attr('y', 5)
				.attr('fill', s.visible ? s.color : theme.inkMuted)
				.attr('font-size', '14px')
				.text(s.visible ? '👁' : '👁‍🗨');
		});

		// Instructions
		g.append('text')
			.attr('x', innerWidth + 20)
			.attr('y', series.length * 80 + 20)
			.attr('fill', theme.inkMuted)
			.attr('font-size', '10px')
			.attr('font-style', 'italic')
			.text('Click to toggle');
	}

	$: if (mounted && responses && questions) {
		renderSuperline();
	}

	onMount(() => {
		mounted = true;
		if (container && ro) ro.observe(container);
		renderSuperline();
	});

	onDestroy(() => {
		mounted = false;
		ro?.disconnect();
		d3.select('body').selectAll('.superline-tooltip').remove();
	});
</script>

<div bind:this={container} class="relative superline-container">
	<svg bind:this={svg} viewBox="0 0 {width} {height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"></svg>
</div>

<style>
	.superline-container {
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		aspect-ratio: 16/9;
	}

	@media (max-width: 768px) {
		.superline-container {
			aspect-ratio: 4/3;
		}
	}

	svg {
		display: block;
		width: 100%;
		height: 100%;
		min-height: 500px;
		background: linear-gradient(
			135deg,
			hsl(var(--surface-muted)) 0%,
			hsl(var(--surface)) 100%
		);
		border-radius: 12px;
	}
</style>
