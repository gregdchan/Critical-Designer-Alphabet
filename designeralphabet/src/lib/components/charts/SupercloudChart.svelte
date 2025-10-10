<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import { getThemeColors } from '$lib/utils/colors';
	import type { Question } from '$lib/types/workshop';

	type Response = {
		id: string;
		text: string;
		votes?: number;
		lens?: string;
		participantName?: string;
		participantColor?: string;
		participant_id?: string | null;
		question_id?: string;
	};

	export let responses: Response[] = [];
	export let questions: Question[] = [];

	let container: HTMLDivElement | null = null;
	let width = 900;
	let height = 600;
	let svg: SVGSVGElement;
	let mounted = false;

	// Zoom/pan state
	let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
	let rootGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
	let currentTransform = d3.zoomIdentity;

	const ro = typeof ResizeObserver !== 'undefined'
		? new ResizeObserver((entries) => {
				const r = entries[0]?.contentRect;
				if (r) {
					width = Math.max(300, r.width);
					height = Math.max(300, r.height);
				}
			})
		: null;

	type AggregatedBubble = {
		id: string;
		text: string;
		value: number; // votes for written, count for choice, avg for scale
		type: 'written' | 'choice' | 'scale';
		questionText: string;
		radius: number;
		x: number;
		y: number;
		color: string;
		metadata: string; // extra info for tooltip
	};

	function aggregateData(
		responses: Response[],
		questions: Question[],
		theme: ReturnType<typeof getThemeColors>
	): AggregatedBubble[] {
		const bubbles: AggregatedBubble[] = [];
		const questionMap = new Map(questions.map(q => [q.id, q]));

		// 1. Written responses (sized by votes)
		const writtenResponses = responses.filter(r => {
			const q = questionMap.get(r.question_id || '');
			return q?.response_type === 'written' && r.text?.trim();
		});

		writtenResponses.forEach(r => {
			const q = questionMap.get(r.question_id || '');
			bubbles.push({
				id: r.id,
				text: r.text,
				value: r.votes || 0,
				type: 'written',
				questionText: q?.text || 'Unknown',
				radius: 0, // will be calculated
				x: 0,
				y: 0,
				color: r.participantColor || theme.chart[0],
				metadata: `${r.votes || 0} votes`
			});
		});

		// 2. Choice responses (count frequency)
		const choiceResponses = responses.filter(r => {
			const q = questionMap.get(r.question_id || '');
			return ['singleChoice', 'multiSelect'].includes(q?.response_type || '') && r.text?.trim();
		});

		// Count occurrences
		const choiceCounts = new Map<string, { count: number; questionId: string; questionText: string }>();
		choiceResponses.forEach(r => {
			const key = `${r.question_id}:${r.text}`;
			const existing = choiceCounts.get(key);
			const q = questionMap.get(r.question_id || '');
			if (existing) {
				existing.count++;
			} else {
				choiceCounts.set(key, {
					count: 1,
					questionId: r.question_id || '',
					questionText: q?.text || 'Unknown'
				});
			}
		});

		choiceCounts.forEach((data, key) => {
			const text = key.split(':')[1];
			bubbles.push({
				id: key,
				text,
				value: data.count,
				type: 'choice',
				questionText: data.questionText,
				radius: 0,
				x: 0,
				y: 0,
				color: theme.chart[1],
				metadata: `${data.count} selections`
			});
		});

		// 3. Scale responses (group by question, show avg)
		const scaleResponses = responses.filter(r => {
			const q = questionMap.get(r.question_id || '');
			return q?.response_type === 'scale';
		});

		const scaleByQuestion = new Map<string, { values: number[]; questionText: string }>();
		scaleResponses.forEach(r => {
			const q = questionMap.get(r.question_id || '');
			if (!q) return;
			const value = parseFloat(r.text);
			if (isNaN(value)) return;

			const existing = scaleByQuestion.get(r.question_id || '');
			if (existing) {
				existing.values.push(value);
			} else {
				scaleByQuestion.set(r.question_id || '', {
					values: [value],
					questionText: q.text || 'Unknown'
				});
			}
		});

		scaleByQuestion.forEach((data, questionId) => {
			const avg = data.values.reduce((a, b) => a + b, 0) / data.values.length;
			const q = questionMap.get(questionId);
			const scaleMax = (q?.config?.scale as any)?.max || 10;

			bubbles.push({
				id: questionId,
				text: `${data.questionText.substring(0, 30)}...`,
				value: data.values.length, // size by response count
				type: 'scale',
				questionText: data.questionText,
				radius: 0,
				x: 0,
				y: 0,
				color: theme.chart[2],
				metadata: `Avg: ${avg.toFixed(1)}/${scaleMax} (${data.values.length} responses)`
			});
		});

		return bubbles;
	}

	function calculateSizes(bubbles: AggregatedBubble[]): AggregatedBubble[] {
		if (bubbles.length === 0) return [];

		const maxValue = Math.max(...bubbles.map(b => b.value), 1);
		const minRadius = 20;
		const maxRadius = 80;

		return bubbles.map(b => ({
			...b,
			radius: minRadius + (Math.pow(b.value / maxValue, 0.6) * (maxRadius - minRadius))
		}));
	}

	function packBubbles(bubbles: AggregatedBubble[], width: number, height: number): AggregatedBubble[] {
		if (bubbles.length === 0) return [];

		const packLayout = d3.pack<AggregatedBubble>()
			.size([width, height])
			.padding(5);

		const root = d3.hierarchy<any>({
			children: bubbles
		}).sum((d: any) => d.radius * d.radius);

		packLayout(root);

		const positioned = root.leaves().map((node: any) => ({
			...node.data,
			x: node.x,
			y: node.y,
			radius: node.r
		}));

		return positioned;
	}

	function renderSupercloud() {
		if (!mounted || !svg) return;

		const theme = getThemeColors();
		const aggregated = aggregateData(responses, questions, theme);
		const sized = calculateSizes(aggregated);
		const positioned = packBubbles(sized, width, height);

		// Clear previous
		d3.select(svg).selectAll('*').remove();


		// Root group for all chart elements (so we can pan it)
		const g = d3
			.select(svg)
			.attr('width', width)
			.attr('height', height)
			.append('g');

		rootGroup = g;
		// Preserve existing transform between renders
		rootGroup.attr('transform', currentTransform.toString());

		// Initialize/update zoom behavior for panning-only
		const translateExtentPadding = 0.5; // allow slight overscroll
		const txMin = -width * translateExtentPadding;
		const tyMin = -height * translateExtentPadding;
		const txMax = width * (1 + translateExtentPadding);
		const tyMax = height * (1 + translateExtentPadding);

		zoomBehavior = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([0.7, 3]) // allow pinch-zoom while keeping reasonable bounds
			.translateExtent([
				[txMin, tyMin],
				[txMax, tyMax]
			])
			// Ignore mouse wheel zoom to avoid interfering with page scroll; allow touch pinch and drag
			.filter((event: any) => {
				// Allow touch + trackpad pinch (wheel with ctrlKey), but block regular wheel scroll
				if (event.type === 'wheel') return !!event.ctrlKey;
				return true;
			})
			.on('zoom', (event: any) => {
				currentTransform = event.transform;
				if (rootGroup) rootGroup.attr('transform', currentTransform.toString());
			});

		// Bind zoom to the SVG (clear prior handlers first)
		const svgSel = d3.select(svg)
			.on('.zoom', null)
			.call(zoomBehavior as any)
			.on('dblclick.zoom', null) // disable double-click zoom behavior
			.style('cursor', 'grab');

		// Visual feedback for dragging
		svgSel
			.on('mousedown.dragcursor touchstart.dragcursor', () => svgSel.style('cursor', 'grabbing'))
			.on('mouseup.dragcursor touchend.dragcursor mouseleave.dragcursor', () => svgSel.style('cursor', 'grab'));

		// Type legend
		const typeColors = {
			written: theme.chart[0],
			choice: theme.chart[1],
			scale: theme.chart[2]
		};

		const legend = g.append('g').attr('transform', `translate(${width - 150}, 20)`);

		Object.entries(typeColors).forEach(([type, color], i) => {
			const item = legend.append('g').attr('transform', `translate(0, ${i * 25})`);
			item.append('circle').attr('r', 6).attr('fill', color).attr('opacity', 0.8);
			item.append('text')
				.attr('x', 12)
				.attr('y', 4)
				.attr('fill', theme.ink2)
				.attr('font-size', '11px')
				.text(type === 'written' ? '💬 Responses (votes)' : type === 'choice' ? '☑️ Choices (freq)' : '📊 Scales (avg)');
		});

		// Bubbles
		const bubbleGroups = g
			.selectAll('.bubble')
			.data(positioned)
			.join('g')
			.attr('class', 'bubble')
			.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

		// Circles
		const topTierThreshold = positioned.sort((a, b) => b.value - a.value)[Math.floor(positioned.length * 0.2)]?.value || 0;

		bubbleGroups
			.append('circle')
			.attr('r', (d: any) => d.radius)
			.attr('fill', (d: any) => d.color)
			.attr('opacity', (d: any) => d.value >= topTierThreshold ? 0.9 : 0.65)
			.attr('stroke', (d: any) => d.value >= topTierThreshold ? theme.brand : 'hsl(var(--surface-elevated))')
			.attr('stroke-width', (d: any) => d.value >= topTierThreshold ? 3 : 2)
			.style('cursor', 'pointer')
			.on('mouseenter', function (event: any, d: any) {
				d3.select(this).transition().duration(200).attr('opacity', 1).attr('stroke-width', 4);

				const tooltip = d3.select('body').selectAll('.supercloud-tooltip').data([null]);
				const tooltipEnter = tooltip
					.enter()
					.append('div')
					.attr('class', 'supercloud-tooltip')
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
						<div style="font-size: 11px; font-weight: 600; color: ${theme.brand}; margin-bottom: 8px;">${d.questionText}</div>
						<div style="font-weight: 600; font-size: 13px; margin-bottom: 8px; color: ${theme.ink};">${d.text}</div>
						<div style="color: ${theme.brand}; font-weight: 600; margin-top: 8px; padding-top: 8px; border-top: 1px solid hsl(var(--border-subtle));">
							${d.metadata}
						</div>
					`
					)
					.style('left', event.pageX + 15 + 'px')
					.style('top', event.pageY - 10 + 'px')
					.style('opacity', 1);
			})
			.on('mousemove', function (event: any) {
				d3.select('body')
					.selectAll('.supercloud-tooltip')
					.style('left', event.pageX + 15 + 'px')
					.style('top', event.pageY - 10 + 'px');
			})
			.on('mouseleave', function (event: any, d: any) {
				const isTopTier = d.value >= topTierThreshold;
				d3.select(this)
					.transition()
					.duration(200)
					.attr('opacity', isTopTier ? 0.9 : 0.65)
					.attr('stroke-width', isTopTier ? 3 : 2);

				d3.select('body').selectAll('.supercloud-tooltip').remove();
			});

		// Text labels
		bubbleGroups
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', 'white')
			.attr('font-weight', '600')
			.attr('pointer-events', 'none')
			.style('user-select', 'none')
			.style('text-shadow', '0 1px 2px rgba(0,0,0,0.3)')
			.each(function (d: any) {
				const text = d3.select(this);
				const maxWidth = d.radius * 1.6;
				const words = d.text.split(/\s+/);

				const fontSize = Math.max(9, Math.min(14, d.radius / 3.5));
				text.attr('font-size', `${fontSize}px`);

				const lineHeight = fontSize * 1.2;
				const maxLines = Math.max(1, Math.floor((d.radius * 1.6) / lineHeight));

				const lines: string[] = [];
				let currentLine = '';

				for (const word of words) {
					const testLine = currentLine ? `${currentLine} ${word}` : word;
					const estimatedWidth = testLine.length * fontSize * 0.6;

					if (estimatedWidth > maxWidth && currentLine) {
						lines.push(currentLine);
						currentLine = word;
						if (lines.length >= maxLines) break;
					} else {
						currentLine = testLine;
					}
				}

				if (currentLine && lines.length < maxLines) {
					lines.push(currentLine);
				}

				const displayLines = lines.slice(0, maxLines);
				if (displayLines.length === 0 && words.length > 0) {
					displayLines.push(words[0].slice(0, 12) + (words[0].length > 12 ? '...' : ''));
				}

				const startY = -(displayLines.length - 1) * lineHeight / 2;
				displayLines.forEach((line, i) => {
					text.append('tspan')
						.attr('x', 0)
						.attr('dy', i === 0 ? `${startY}px` : `${lineHeight}px`)
						.text(line);
				});
			});

		// Stats
		g.append('text')
			.attr('x', 10)
			.attr('y', height - 10)
			.attr('fill', theme.inkMuted)
			.attr('font-size', '11px')
			.attr('font-weight', '600')
			.text(`${positioned.length} aggregated insights from ${questions.length} questions`);
	}

	$: if (mounted && responses && questions) {
		renderSupercloud();
	}

	onMount(() => {
		mounted = true;
		if (container && ro) ro.observe(container);
		renderSupercloud();
	});

	onDestroy(() => {
		mounted = false;
		ro?.disconnect();
		d3.select('body').selectAll('.supercloud-tooltip').remove();
	});
</script>

<div bind:this={container} class="relative supercloud-container">
	<svg bind:this={svg} viewBox="0 0 {width} {height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"></svg>
</div>

<style>
	.supercloud-container {
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		/* Prefer flexible height; fall back to aspect on larger screens */
		height: 100%;
		aspect-ratio: 16/9;
		/* Enable touch panning without scrolling the page */
		touch-action: none;
	}

	@media (max-width: 768px) {
		.supercloud-container {
			/* On small screens, fill vertical space */
			height: 80dvh;
			min-height: 400px;
			aspect-ratio: auto;
		}
	}

	svg {
		display: block;
		width: 100%;
		height: 100%;
		min-height: 400px;
		background: linear-gradient(
			135deg,
			hsl(var(--surface-muted)) 0%,
			hsl(var(--surface)) 100%
		);
		border-radius: 12px;
	}
</style>
