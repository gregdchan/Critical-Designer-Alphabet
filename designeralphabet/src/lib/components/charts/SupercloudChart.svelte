<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import { getThemeColors } from '$lib/utils/colors';
	// Accept minimal Question shape from either realtime/workshop sources
	type AnyQuestion = {
		id: string;
		text?: string;
		response_type?: string | null;
		config?: any;
		phase_key?: string | null;
	};

	type Response = {
		id: string;
		text: string;
		votes?: number;
		lens?: string;
		participantName?: string;
		participantColor?: string;
		participant_id?: string | null;
		question_id?: string;
		questionType?: string; // Added for response type tracking
	};

	export let responses: Response[] = [];
	export let questions: AnyQuestion[] = [];

	let container: HTMLDivElement | null = null;
	let width = 900;
	let height = 600;
	let svg: SVGSVGElement;
	let mounted = false;

	// Zoom/pan state
	let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
	let rootGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
	let currentTransform = d3.zoomIdentity;

	// Filter state for interactive legends
	let activeTypeFilter: string | null = null; // 'written', 'choice', 'scale', or null (all)
	let activeLensFilter: string | null = null; // lens name or null (all)
	let activePhaseFilter: string | null = null; // phase_key or null (all)

	const ro =
		typeof ResizeObserver !== 'undefined'
			? new ResizeObserver((entries) => {
					const r = entries[0]?.contentRect;
					if (r) {
						width = Math.max(300, r.width);
						height = Math.max(300, r.height);
					}
				})
			: null;

	const lensOrder = [
		'Risk',
		'Work',
		'Sustainability',
		'Ethics',
		'Community',
		'Justice',
		'Agency'
	] as const;

	function normaliseLens(raw?: string) {
		if (!raw) return 'General';
		const match = (lensOrder as readonly string[]).find(
			(key) => key.toLowerCase() === raw.toLowerCase()
		);
		return match ?? raw;
	}

	type AggregatedBubble = {
		id: string;
		text: string;
		value: number; // votes for written, count for choice, avg for scale
		type: 'written' | 'choice' | 'scale';
		lens: string; // Added lens field
		phase: string; // Added phase field
		questionText: string;
		radius: number;
		x: number;
		y: number;
		color: string;
		lensColor: string; // Added for lens ring
		metadata: string; // extra info for tooltip
	};

	function aggregateData(
		responses: Response[],
		questions: AnyQuestion[],
		theme: ReturnType<typeof getThemeColors>
	): AggregatedBubble[] {
		const bubbles: AggregatedBubble[] = [];
		const questionMap = new Map(questions.map((q) => [q.id, q]));

		// Define diverse colors for different response types
		const responseTypeColors = {
			written: '#8B5CF6', // Purple - for open text responses
			choice: '#3B82F6', // Blue - for multiple choice
			scale: '#10B981', // Green - for scale/rating
			default: '#6366F1' // Indigo - fallback
		};

		// Lens color mapping
		const basePalette = Object.fromEntries(
			(lensOrder as readonly string[]).map((lens, idx) => [
				lens,
				theme.chart[idx % theme.chart.length] ?? theme.brand
			])
		);
		const fallbackPalette = [
			...theme.chart,
			theme.brand,
			theme.brandSoft,
			theme.accentWarm,
			theme.accentCritical,
			theme.ink
		];
		const lensColors = new Map<string, string>();
		let fallbackIndex = 0;

		const resolveLensColor = (lensLabel: string) => {
			if (lensColors.has(lensLabel)) return lensColors.get(lensLabel)!;
			const base = basePalette[lensLabel];
			if (base) {
				lensColors.set(lensLabel, base);
				return base;
			}
			const color = fallbackPalette[fallbackIndex % fallbackPalette.length] ?? theme.brand;
			fallbackIndex += 1;
			lensColors.set(lensLabel, color);
			return color;
		};

		// 1. Written responses (sized by votes)
		const writtenResponses = responses.filter((r) => {
			const q = questionMap.get(r.question_id || '');
			return q?.response_type === 'written' && r.text?.trim();
		});

		writtenResponses.forEach((r) => {
			const q = questionMap.get(r.question_id || '');
			const lensLabel = normaliseLens(r.lens);
			const phaseLabel = q?.phase_key || 'No Phase';
			bubbles.push({
				id: r.id,
				text: r.text,
				value: r.votes || 0,
				type: 'written',
				lens: lensLabel,
				phase: phaseLabel,
				questionText: q?.text || 'Unknown',
				radius: 0, // will be calculated
				x: 0,
				y: 0,
				color: responseTypeColors.written,
				lensColor: resolveLensColor(lensLabel),
				metadata: `${r.votes || 0} votes`
			});
		});

		// 2. Choice responses (count frequency)
		const choiceResponses = responses.filter((r) => {
			const q = questionMap.get(r.question_id || '');
			return ['singleChoice', 'multiSelect'].includes(q?.response_type || '') && r.text?.trim();
		});

		// Count occurrences
		const choiceCounts = new Map<
			string,
			{ count: number; questionId: string; questionText: string; lens: string; phase: string }
		>();
		choiceResponses.forEach((r) => {
			const key = `${r.question_id}:${r.text}`;
			const existing = choiceCounts.get(key);
			const q = questionMap.get(r.question_id || '');
			const lensLabel = normaliseLens(r.lens);
			const phaseLabel = q?.phase_key || 'No Phase';
			if (existing) {
				existing.count++;
			} else {
				choiceCounts.set(key, {
					count: 1,
					questionId: r.question_id || '',
					questionText: q?.text || 'Unknown',
					lens: lensLabel,
					phase: phaseLabel
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
				lens: data.lens,
				phase: data.phase,
				questionText: data.questionText,
				radius: 0,
				x: 0,
				y: 0,
				color: responseTypeColors.choice,
				lensColor: resolveLensColor(data.lens),
				metadata: `${data.count} selections`
			});
		});

		// 3. Scale responses (group by question, show avg)
		const scaleResponses = responses.filter((r) => {
			const q = questionMap.get(r.question_id || '');
			return q?.response_type === 'scale';
		});

		const scaleByQuestion = new Map<
			string,
			{ values: number[]; questionText: string; lens: string; phase: string }
		>();
		scaleResponses.forEach((r) => {
			const q = questionMap.get(r.question_id || '');
			if (!q) return;
			const value = parseFloat(r.text);
			if (isNaN(value)) return;

			const lensLabel = normaliseLens(r.lens);
			const phaseLabel = q?.phase_key || 'No Phase';
			const existing = scaleByQuestion.get(r.question_id || '');
			if (existing) {
				existing.values.push(value);
			} else {
				scaleByQuestion.set(r.question_id || '', {
					values: [value],
					questionText: q.text || 'Unknown',
					lens: lensLabel,
					phase: phaseLabel
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
				lens: data.lens,
				phase: data.phase,
				questionText: data.questionText,
				radius: 0,
				x: 0,
				y: 0,
				color: responseTypeColors.scale,
				lensColor: resolveLensColor(data.lens),
				metadata: `Avg: ${avg.toFixed(1)}/${scaleMax} (${data.values.length} responses)`
			});
		});

		return bubbles;
	}

	function calculateSizes(bubbles: AggregatedBubble[]): AggregatedBubble[] {
		if (bubbles.length === 0) return [];

		const maxValue = Math.max(...bubbles.map((b) => b.value), 1);
		const minRadius = 20;
		const maxRadius = 80;

		return bubbles.map((b) => ({
			...b,
			radius: minRadius + Math.pow(b.value / maxValue, 0.6) * (maxRadius - minRadius)
		}));
	}

	function packBubbles(
		bubbles: AggregatedBubble[],
		width: number,
		height: number
	): AggregatedBubble[] {
		if (bubbles.length === 0) return [];

		const packLayout = d3.pack<AggregatedBubble>().size([width, height]).padding(5);

		const root = d3
			.hierarchy<any>({
				children: bubbles
			})
			.sum((d: any) => d.radius * d.radius);

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

		// Reserve space for legends (right side) and stats (bottom)
		const legendWidth = 180;
		const topMargin = 20;
		const bottomMargin = 35;
		const chartWidth = Math.max(400, width - legendWidth);
		const chartHeight = Math.max(300, height - topMargin - bottomMargin);

		const positioned = packBubbles(sized, chartWidth, chartHeight);

		// Clear previous
		d3.select(svg).selectAll('*').remove();

		const svgSel = d3.select(svg).attr('width', width).attr('height', height);

		// Create INTERACTIVE layer (bubbles) - this will be zoomed/panned
		const interactiveGroup = svgSel
			.append('g')
			.attr('class', 'interactive-layer')
			.attr('transform', `translate(0, ${topMargin})`);

		rootGroup = interactiveGroup;
		// Preserve existing transform between renders
		rootGroup.attr('transform', `translate(0, ${topMargin}) ${currentTransform.toString()}`);

		// Create FIXED UI layer (legends, stats) - this stays put
		const uiGroup = svgSel.append('g').attr('class', 'ui-layer');

		// Initialize/update zoom behavior for panning-only
		const translateExtentPadding = 0.5; // allow slight overscroll
		const txMin = -chartWidth * translateExtentPadding;
		const tyMin = -chartHeight * translateExtentPadding;
		const txMax = chartWidth * (1 + translateExtentPadding);
		const tyMax = chartHeight * (1 + translateExtentPadding);

		zoomBehavior = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([0.5, 8]) // Increased zoom range for better exploration
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
				if (rootGroup) {
					rootGroup.attr('transform', `translate(0, ${topMargin}) ${currentTransform.toString()}`);
				}
			});

		// Bind zoom to the SVG (clear prior handlers first)
		svgSel
			.on('.zoom', null)
			.call(zoomBehavior as any)
			.on('dblclick.zoom', null) // disable double-click zoom behavior
			.style('cursor', 'grab');

		// Visual feedback for dragging
		svgSel
			.on('mousedown.dragcursor touchstart.dragcursor', () => svgSel.style('cursor', 'grabbing'))
			.on('mouseup.dragcursor touchend.dragcursor mouseleave.dragcursor', () =>
				svgSel.style('cursor', 'grab')
			);

		// Create lensColorByName map for legend
		const lensColorByName = new Map<string, string>();
		positioned.forEach((bubble) => {
			if (!lensColorByName.has(bubble.lens)) {
				lensColorByName.set(bubble.lens, bubble.lensColor);
			}
		});

		// ===== FIXED UI LAYER (legends, stats) =====
		// Legends - Response Types and Lenses
		const legendX = width - 170;
		const legendY = 50;

		// Response Type Legend
		const responseTypeLegend = uiGroup
			.append('g')
			.attr('transform', `translate(${legendX}, ${legendY})`);

		responseTypeLegend
			.append('text')
			.attr('x', 0)
			.attr('y', 0)
			.attr('fill', theme.ink)
			.attr('font-size', '12px')
			.attr('font-weight', '700')
			.text('Response Types');

		const responseTypes = [
			{ type: 'written', label: '💬 Responses', color: '#8B5CF6' },
			{ type: 'choice', label: '☑️ Choices', color: '#3B82F6' },
			{ type: 'scale', label: '📊 Scales', color: '#10B981' }
		];

		responseTypeLegend
			.selectAll('.type-legend-item')
			.data(responseTypes)
			.join('g')
			.attr('class', 'type-legend-item')
			.attr('transform', (d: any, i: number) => `translate(0, ${i * 20 + 15})`)
			.style('cursor', 'pointer')
			.on('click', function (_event: any, item: any) {
				// Toggle filter: click again to deactivate
				if (activeTypeFilter === item.type) {
					activeTypeFilter = null;
				} else {
					activeTypeFilter = item.type;
				}
				renderSupercloud();
			})
			.each(function (item: any) {
				const g = d3.select(this);
				const isActive = activeTypeFilter === null || activeTypeFilter === item.type;

				g.append('circle')
					.attr('r', 6)
					.attr('fill', item.color)
					.attr('opacity', isActive ? 0.8 : 0.3)
					.attr('stroke', activeTypeFilter === item.type ? theme.brand : 'none')
					.attr('stroke-width', 2);

				g.append('text')
					.attr('x', 12)
					.attr('y', 4)
					.attr('fill', isActive ? theme.ink2 : theme.inkMuted)
					.attr('font-size', '10px')
					.attr('font-weight', activeTypeFilter === item.type ? '700' : '400')
					.text(item.label);
			}); // Lens Legend
		const lensLegendY = legendY + responseTypes.length * 20 + 40;
		const uniqueLenses = Array.from(new Set(positioned.map((b: any) => b.lens)));
		const lensLegend = uiGroup
			.append('g')
			.attr('transform', `translate(${legendX}, ${lensLegendY})`);

		lensLegend
			.append('text')
			.attr('x', 0)
			.attr('y', 0)
			.attr('fill', theme.ink)
			.attr('font-size', '12px')
			.attr('font-weight', '700')
			.text('Lenses (Ring)');

		lensLegend
			.selectAll('.lens-legend-item')
			.data(uniqueLenses)
			.join('g')
			.attr('class', 'lens-legend-item')
			.attr('transform', (d: any, i: number) => `translate(0, ${i * 20 + 15})`)
			.style('cursor', 'pointer')
			.on('click', function (_event: any, lens: any) {
				// Toggle filter: click again to deactivate
				if (activeLensFilter === lens) {
					activeLensFilter = null;
				} else {
					activeLensFilter = lens;
				}
				renderSupercloud();
			})
			.each(function (lens: any) {
				const item = d3.select(this);
				const lensColor = lensColorByName.get(lens) ?? theme.ink2;
				const isActive = activeLensFilter === null || activeLensFilter === lens;

				// Show ring style to match bubbles
				item
					.append('circle')
					.attr('r', 6)
					.attr('fill', 'none')
					.attr('stroke', lensColor)
					.attr('stroke-width', activeLensFilter === lens ? 4 : 3)
					.attr('opacity', isActive ? 0.8 : 0.3);

				item
					.append('text')
					.attr('x', 14)
					.attr('y', 4)
					.attr('fill', isActive ? theme.ink2 : theme.inkMuted)
					.attr('font-size', '10px')
					.attr('font-weight', activeLensFilter === lens ? '700' : '400')
					.text(lens);
			});

		// Phase Legend
		const phaseLegendY = lensLegendY + uniqueLenses.length * 20 + 40;
		const uniquePhases = Array.from(new Set(positioned.map((b: any) => b.phase)));
		const phaseLegend = uiGroup
			.append('g')
			.attr('transform', `translate(${legendX}, ${phaseLegendY})`);

		phaseLegend
			.append('text')
			.attr('x', 0)
			.attr('y', 0)
			.attr('fill', theme.ink)
			.attr('font-size', '12px')
			.attr('font-weight', '700')
			.text('Session Phases');

		phaseLegend
			.selectAll('.phase-legend-item')
			.data(uniquePhases)
			.join('g')
			.attr('class', 'phase-legend-item')
			.attr('transform', (d: any, i: number) => `translate(0, ${i * 20 + 15})`)
			.style('cursor', 'pointer')
			.on('click', function (_event: any, phase: any) {
				// Toggle filter: click again to deactivate
				if (activePhaseFilter === phase) {
					activePhaseFilter = null;
				} else {
					activePhaseFilter = phase;
				}
				renderSupercloud();
			})
			.each(function (phase: any) {
				const item = d3.select(this);
				const isActive = activePhaseFilter === null || activePhaseFilter === phase;

				// Show square icon for phases
				item
					.append('rect')
					.attr('x', -6)
					.attr('y', -6)
					.attr('width', 12)
					.attr('height', 12)
					.attr('fill', theme.brand)
					.attr('opacity', isActive ? 0.6 : 0.2)
					.attr('stroke', activePhaseFilter === phase ? theme.ink : 'none')
					.attr('stroke-width', 2);

				item
					.append('text')
					.attr('x', 14)
					.attr('y', 4)
					.attr('fill', isActive ? theme.ink2 : theme.inkMuted)
					.attr('font-size', '10px')
					.attr('font-weight', activePhaseFilter === phase ? '700' : '400')
					.text(phase === 'No Phase' ? '(No Phase)' : phase);
			});

		// ===== INTERACTIVE LAYER (bubbles) =====
		// Bubbles in interactive layer
		const bubbleGroups = interactiveGroup
			.selectAll('.bubble')
			.data(positioned)
			.join('g')
			.attr('class', 'bubble')
			.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
			// Apply filtering based on active filters
			.attr('opacity', (d: any) => {
				if (activeTypeFilter && d.type !== activeTypeFilter) return 0.05;
				if (activeLensFilter && d.lens !== activeLensFilter) return 0.05;
				if (activePhaseFilter && d.phase !== activePhaseFilter) return 0.05;
				return 1;
			})
			.style('pointer-events', (d: any) => {
				if (activeTypeFilter && d.type !== activeTypeFilter) return 'none';
				if (activeLensFilter && d.lens !== activeLensFilter) return 'none';
				if (activePhaseFilter && d.phase !== activePhaseFilter) return 'none';
				return 'all';
			});

		// Calculate top tier for visual emphasis
		const topTierThreshold =
			positioned.sort((a, b) => b.value - a.value)[Math.floor(positioned.length * 0.2)]?.value || 0;

		// Add outer lens ring first (so it's behind the main circle)
		bubbleGroups
			.append('circle')
			.attr('r', (d: any) => d.radius + 3)
			.attr('fill', 'none')
			.attr('stroke', (d: any) => d.lensColor)
			.attr('stroke-width', 4)
			.attr('opacity', 0.8);

		// Add main circles with response type color
		bubbleGroups
			.append('circle')
			.attr('r', (d: any) => d.radius)
			.attr('fill', (d: any) => d.color)
			.attr('opacity', (d: any) => (d.value >= topTierThreshold ? 0.9 : 0.7))
			.attr('stroke', (d: any) =>
				d.value >= topTierThreshold ? 'hsl(var(--brand))' : 'hsl(var(--surface-elevated))'
			)
			.attr('stroke-width', (d: any) => (d.value >= topTierThreshold ? 3 : 2))
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
						<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
							<div style="display: flex; align-items: center; gap: 4px;">
								<div style="width: 12px; height: 12px; border-radius: 50%; background: ${d.color};"></div>
								<span style="color: ${theme.inkMuted}; font-size: 11px; text-transform: capitalize;">${d.type}</span>
							</div>
							<div style="display: flex; align-items: center; gap: 4px;">
								<div style="width: 12px; height: 12px; border-radius: 50%; border: 3px solid ${d.lensColor};"></div>
								<span style="color: ${theme.inkMuted}; font-size: 11px;">Lens: ${d.lens}</span>
							</div>
						</div>
						<div style="color: ${theme.brand}; font-weight: 600; margin-top: 8px; padding-top: 8px; border-top: 1px solid hsl(var(--border-subtle));">
							${d.metadata}
						</div>
					`
					)
					.style('left', event.pageX + 15 + 'px')
					.style('top', event.pageY + 8 + 'px')
					.style('opacity', 1);
			})
			.on('mousemove', function (event: any) {
				d3.select('body')
					.selectAll('.supercloud-tooltip')
					.style('left', event.pageX + 15 + 'px')
					.style('top', event.pageY + 8 + 'px');
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

				const startY = (-(displayLines.length - 1) * lineHeight) / 2;
				displayLines.forEach((line, i) => {
					text
						.append('tspan')
						.attr('x', 0)
						.attr('dy', i === 0 ? `${startY}px` : `${lineHeight}px`)
						.text(line);
				});
			});

		// Stats in fixed UI layer
		uiGroup
			.append('text')
			.attr('x', 10)
			.attr('y', height - 10)
			.attr('fill', theme.inkMuted)
			.attr('font-size', '11px')
			.attr('font-weight', '600')
			.style('pointer-events', 'none')
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
	<svg
		bind:this={svg}
		viewBox="0 0 {width} {height}"
		width="100%"
		height="100%"
		preserveAspectRatio="xMidYMid meet"
	></svg>
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
		background: linear-gradient(135deg, hsl(var(--surface-muted)) 0%, hsl(var(--surface)) 100%);
		border-radius: 12px;
	}
</style>
