<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import { getThemeColors } from '$lib/utils/colors';

	type WordCloudResponse = {
		id: string;
		text: string;
		votes?: number;
		lens?: string;
		participantName?: string;
		participantColor?: string;
		participant_id?: string | null;
	};

	export let responses: WordCloudResponse[] = [];
	export let question = '';

	let container: HTMLDivElement | null = null;
	let width: number = 900;
	let height: number = 600;
	let svg: SVGSVGElement;
	let mounted = false;

	// Zoom/pan support
	let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
	let rootGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
	let currentTransform = d3.zoomIdentity;

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

	type WordBubble = {
		id: string;
		text: string;
		votes: number;
		votePercentage: number;
		radius: number;
		x: number;
		y: number;
		color: string;
		lens: string;
		participant: string;
	};

	function normaliseLens(raw?: string) {
		if (!raw) return 'General';
		const match = (lensOrder as readonly string[]).find(
			(key) => key.toLowerCase() === raw.toLowerCase()
		);
		return match ?? raw;
	}

	function calculateWordBubbles(
		data: WordCloudResponse[],
		theme: ReturnType<typeof getThemeColors>
	): WordBubble[] {
		if (data.length === 0) return [];

		// Calculate total votes and max votes for better scaling
		const totalVotes = data.reduce((sum, r) => sum + (r.votes || 0), 0);
		const maxVotes = Math.max(...data.map((r) => r.votes || 0), 1);
		const minVotes = Math.min(...data.map((r) => r.votes || 0).filter((v) => v > 0), 0);

		// Bubble sizing - more dramatic range to emphasize top items
		const minRadius = 18;
		const maxRadius = 80;

		// Map responses to bubbles with vote percentages
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

		const bubbles = data
			.filter((r) => r.text && r.text.trim().length > 0)
			.map((response, idx) => {
				const votes = response.votes || 0;
				const votePercentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
				const lensLabel = normaliseLens(response.lens);

				// Scale radius based on votes with exponential curve for more dramatic differences
				let radius: number;
				if (totalVotes > 0 && maxVotes > 0) {
					// Exponential vote-based sizing for more emphasis on popular items
					const normalizedVotes = votes / maxVotes; // 0 to 1
					const exponentialScale = Math.pow(normalizedVotes, 0.6); // Soften but still emphasize top
					radius = minRadius + exponentialScale * (maxRadius - minRadius);
				} else {
					// Equal sizing with some variation based on text length
					const textLen = response.text?.length || 10;
					radius = minRadius + Math.min(12, Math.sqrt(textLen) * 1.5);
				}

				// Use participant color if available, otherwise fall back to lens color
				const color = response.participantColor || resolveLensColor(lensLabel);

				return {
					id: response.id,
					text: response.text,
					votes,
					votePercentage,
					radius,
					x: 0,
					y: 0,
					color,
					lens: lensLabel || 'General',
					participant: response.participantName || 'Anonymous'
				};
			});

		return bubbles;
	}

	function packBubbles(bubbles: WordBubble[], width: number, height: number): WordBubble[] {
		if (bubbles.length === 0) return [];

		// Use D3 pack layout for optimal bubble positioning
		const packLayout = d3.pack<WordBubble>().size([width, height]).padding(5);

		// Create hierarchy
		const root = d3
			.hierarchy<any>({
				children: bubbles
			})
			.sum((d: any) => d.radius * d.radius); // Area-based packing

		// Apply pack layout
		packLayout(root);

		// Extract positioned bubbles
		const positioned = root.leaves().map((node: any) => ({
			...node.data,
			x: node.x,
			y: node.y,
			radius: node.r
		}));

		return positioned;
	}

	function renderWordCloud() {
		if (!mounted || !svg) return;

		const theme = getThemeColors();
		const wordBubbles = calculateWordBubbles(responses, theme);
		if (wordBubbles.length === 0) return;


		// Responsive layout: On mobile, legend goes below chart; on desktop, to the right
		const isMobile = width < 768;
		const legendWidth = isMobile ? 0 : 170;
		const topMargin = 40;
		const bottomMargin = isMobile ? 120 : 30; // Extra space for legend on mobile
		const chartWidth = Math.max(300, width - legendWidth);
		const chartHeight = Math.max(300, height - topMargin - bottomMargin);

		// Always pack to the SVG's full width/height for true centering
		const positionedBubbles = packBubbles(wordBubbles, width, height);
		// Centering logic: find bounding box of all bubbles and offset to center in SVG
		if (positionedBubbles.length > 0) {
			let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
			for (const b of positionedBubbles) {
				const x0 = b.x - b.radius;
				const x1 = b.x + b.radius;
				const y0 = b.y - b.radius;
				const y1 = b.y + b.radius;
				if (x0 < minX) minX = x0;
				if (x1 > maxX) maxX = x1;
				if (y0 < minY) minY = y0;
				if (y1 > maxY) maxY = y1;
			}
			const cloudWidth = maxX - minX;
			const cloudHeight = maxY - minY;
			const offsetX = width / 2 - (minX + cloudWidth / 2);
			const offsetY = height / 2 - (minY + cloudHeight / 2);
			positionedBubbles.forEach(b => {
				b.x += offsetX;
				b.y += offsetY;
			});
		}
		const lensColorByName = new Map<string, string>();
		positionedBubbles.forEach((bubble) => {
			if (!lensColorByName.has(bubble.lens)) {
				lensColorByName.set(bubble.lens, bubble.color);
			}
		});

		// Clear previous content
		d3.select(svg).selectAll('*').remove();

		const svgSel = d3.select(svg).attr('width', width).attr('height', height);

		// Create INTERACTIVE layer (bubbles) - this will be zoomed/panned
		// No left margin for true centering
		const leftMargin = 0;
		const interactiveGroup = svgSel
			.append('g')
			.attr('class', 'interactive-layer')
			.attr('transform', `translate(${leftMargin}, 0)`);

		rootGroup = interactiveGroup;
		// preserve previous pan/zoom
		rootGroup.attr('transform', `translate(${leftMargin}, 0) ${currentTransform.toString()}`);

		// Create FIXED UI layer (title, legend, stats) - this stays put
		const uiGroup = svgSel.append('g').attr('class', 'ui-layer').style('pointer-events', 'none'); // Don't block interactions with bubbles

		// enable pinch zoom and panning ONLY on interactive layer
		const pad = 0.5;
		const translateExtent: [[number, number], [number, number]] = [
			[-width * pad, -height * pad],
			[width * (1 + pad), height * (1 + pad)]
		];

		zoomBehavior = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([0.5, 8]) // Increased zoom range
			.translateExtent(translateExtent)
			// Ignore mouse wheel to avoid fighting page scroll; still allows touch pinch
			.filter((event: any) => {
				// Allow touch + trackpad pinch (wheel with ctrlKey), but block regular wheel scroll
				if (event.type === 'wheel') return !!event.ctrlKey;
				return true;
			})
			.on('zoom', (event: any) => {
				currentTransform = event.transform;
				if (rootGroup) {
					rootGroup.attr('transform', `translate(${leftMargin}, ${topMargin}) ${currentTransform.toString()}`);
				}
			});

		svgSel
			.on('.zoom', null)
			.call(zoomBehavior as any)
			.on('dblclick.zoom', null)
			.style('cursor', 'grab');

		// Drag cursor feedback
		svgSel
			.on('mousedown.dragcursor touchstart.dragcursor', () => svgSel.style('cursor', 'grabbing'))
			.on('mouseup.dragcursor touchend.dragcursor mouseleave.dragcursor', () =>
				svgSel.style('cursor', 'grab')
			);

		// Create bubble groups in INTERACTIVE layer
		const bubbleGroups = interactiveGroup
			.selectAll('.bubble')
			.data(positionedBubbles)
			.join('g')
			.attr('class', 'bubble')
			.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

		// Calculate top tier for visual emphasis
		const sortedByVotes = [...positionedBubbles].sort((a, b) => b.votes - a.votes);
		const topTierThreshold = sortedByVotes[Math.floor(sortedByVotes.length * 0.2)]?.votes || 0;

		// Add circles
		bubbleGroups
			.append('circle')
			.attr('r', (d: any) => d.radius)
			.attr('fill', (d: any) => d.color)
			.attr('opacity', (d: any) => {
				// Top 20% get full opacity, rest get reduced
				return d.votes >= topTierThreshold ? 0.9 : 0.7;
			})
			.attr('stroke', 'hsl(var(--surface-elevated))')
			.attr('stroke-width', 2)
			.style('cursor', 'pointer')
			.on('mouseenter', function (event: any, d: any) {
				// Highlight circle
				d3.select(this).interrupt().transition().duration(180).attr('opacity', 1).attr('stroke-width', 3);

				// Subtle nudge animation on the whole bubble group
				const group = d3.select(this.parentNode as SVGGElement);
				const maxNudge = Math.min(8, d.radius * 0.12);
				const offsetX = (Math.random() - 0.5) * 2 * maxNudge;
				const offsetY = (Math.random() - 0.5) * 2 * maxNudge;
				group
					.interrupt()
					.transition()
					.duration(180)
					.ease(d3.easeCubicOut)
					.attr('transform', `translate(${d.x + offsetX},${d.y + offsetY}) scale(1.03)`);

				// Show tooltip
				const tooltip = d3.select('body').selectAll('.word-cloud-tooltip').data([null]);
				const tooltipEnter = tooltip
					.enter()
					.append('div')
					.attr('class', 'word-cloud-tooltip')
					.style('position', 'fixed')
					.style('background', 'hsl(var(--surface-elevated))')
					.style('color', 'hsl(var(--text-primary))')
					.style('padding', '8px 10px')
					.style('border-radius', '8px')
					.style('border', '1px solid hsl(var(--brand))')
					.style('pointer-events', 'none')
					.style('font-size', '12px')
					.style('box-shadow', '0 6px 18px hsl(var(--brand) / 0.15)')
					.style('backdrop-filter', 'blur(8px)')
					.style('z-index', '99999');

				const tooltipMerge = tooltipEnter.merge(tooltip);

				tooltipMerge
					.html(
						`
						${question ? `<div style="font-size: 11px; font-weight: 600; color: ${theme.brand}; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid hsl(var(--border-subtle));">${question}</div>` : ''}
						<div style="font-weight: 600; font-size: 13px; margin-bottom: 8px; color: ${theme.ink};">${d.text}</div>
						<div style="color: ${theme.ink2}; margin-bottom: 4px; font-size: 11px;">By: ${d.participant}</div>
						<div style="color: ${theme.inkMuted}; font-size: 11px; margin-bottom: 4px;">Lens: ${d.lens}</div>
						<div style="color: ${theme.brand}; font-weight: 600; margin-top: 8px; padding-top: 8px; border-top: 1px solid hsl(var(--border-subtle));">
							${d.votes} votes (${d.votePercentage.toFixed(1)}%)
						</div>
					`
					)
					.style('left', event.pageX + 15 + 'px')
					.style('top', event.pageY + 8 + 'px')
					.style('opacity', 1);
			})
			.on('mousemove', function (event: any) {
				d3.select('body')
					.selectAll('.word-cloud-tooltip')
					.style('left', event.pageX + 15 + 'px')
					.style('top', event.pageY + 8 + 'px');
			})
			.on('mouseleave', function (event: any, d: any) {
				const isTopTier = d.votes >= topTierThreshold;
				d3.select(this)
					.transition()
					.duration(200)
					.attr('opacity', isTopTier ? 0.9 : 0.65)
					.attr('stroke-width', isTopTier ? 3 : 2);

				// Return the bubble group to its original position/scale
				const group = d3.select(this.parentNode as SVGGElement);
				group
					.interrupt()
					.transition()
					.duration(220)
					.ease(d3.easeCubicOut)
					.attr('transform', `translate(${d.x},${d.y}) scale(1)`);

				d3.select('body').selectAll('.word-cloud-tooltip').remove();
			});

		// Add text labels
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

				// Calculate font size based on bubble radius
				const fontSize = Math.max(9, Math.min(14, d.radius / 3.5));
				text.attr('font-size', `${fontSize}px`);

				const lineHeight = fontSize * 1.2;
				const maxLines = Math.max(1, Math.floor((d.radius * 1.6) / lineHeight));

				// Simple approach: create tspan lines
				const lines: string[] = [];
				let currentLine = '';

				for (const word of words) {
					const testLine = currentLine ? `${currentLine} ${word}` : word;
					// Rough estimate: 0.6 * fontSize per character
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

				// Truncate if needed
				const displayLines = lines.slice(0, maxLines);
				if (displayLines.length === 0 && words.length > 0) {
					// Fallback: show first word truncated
					displayLines.push(words[0].slice(0, 12) + (words[0].length > 12 ? '...' : ''));
				}

				// Add tspan for each line
				const startY = (-(displayLines.length - 1) * lineHeight) / 2;
				displayLines.forEach((line, i) => {
					text
						.append('tspan')
						.attr('x', 0)
						.attr('dy', i === 0 ? `${startY}px` : `${lineHeight}px`)
						.text(line);
				});
			});

		// Add vote count badges for items with votes
		bubbleGroups
			.filter((d: any) => d.votes > 0)
			.append('circle')
			.attr('cx', (d: any) => d.radius * 0.6)
			.attr('cy', (d: any) => -d.radius * 0.6)
			.attr('r', (d: any) => Math.min(d.radius * 0.25, 20))
			.attr('fill', theme.brand)
			.attr('stroke', 'hsl(var(--surface-elevated))')
			.attr('stroke-width', 2);

		bubbleGroups
			.filter((d: any) => d.votes > 0)
			.append('text')
			.attr('x', (d: any) => d.radius * 0.6)
			.attr('y', (d: any) => -d.radius * 0.6)
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.attr('fill', 'white')
			.attr('font-size', (d: any) => Math.min(d.radius * 0.2, 12) + 'px')
			.attr('font-weight', '700')
			.attr('pointer-events', 'none')
			.text((d: any) => d.votes);

		// ===== FIXED UI LAYER (title, legend, stats) =====
		// Add title to fixed UI layer, top left
		uiGroup
			.append('text')
			.attr('x', 10)
			.attr('y', 28)
			.attr('text-anchor', 'start')
			.attr('fill', theme.ink)
			.attr('font-size', '16px')
			.attr('font-weight', '700')
			.text('Response Word Cloud');

		// Add legend to fixed UI layer - only show if there are actual lenses (not just "General")
		const uniqueLenses = Array.from(new Set(positionedBubbles.map((b: any) => b.lens)));
		const hasActualLenses =
			uniqueLenses.length > 1 || (uniqueLenses.length === 1 && uniqueLenses[0] !== 'General');

		if (hasActualLenses) {
			// Responsive legend positioning
			const legendX = isMobile ? 20 : width - 160;
			const legendY = isMobile ? height - bottomMargin + 20 : 50;
			const legend = uiGroup.append('g').attr('transform', `translate(${legendX}, ${legendY})`);

			legend
				.append('text')
				.attr('x', 0)
				.attr('y', 0)
				.attr('fill', theme.ink)
				.attr('font-size', '12px')
				.attr('font-weight', '700')
				.text('Lenses');

			legend
				.selectAll('.legend-item')
				.data(uniqueLenses)
				.join('g')
				.attr('class', 'legend-item')
				.attr('transform', (d: any, i: number) =>
					isMobile ? `translate(${i * 80}, 0)` : `translate(0, ${i * 20 + 15})`
				)
				.each(function (lens: any) {
					const item = d3.select(this);
					const lensColor = lensColorByName.get(lens) ?? theme.ink2;
					item.append('circle').attr('r', 6).attr('fill', lensColor).attr('opacity', 0.8);

					item
						.append('text')
						.attr('x', 14)
						.attr('y', 4)
						.attr('fill', theme.ink2)
						.attr('font-size', '10px')
						.text(lens);
				});
		}

		// Add stats to fixed UI layer
		const totalVotes = positionedBubbles.reduce((sum: number, b: any) => sum + b.votes, 0);
		uiGroup
			.append('text')
			.attr('x', 10)
			.attr('y', height - 10)
			.attr('fill', theme.inkMuted)
			.attr('font-size', '11px')
			.attr('font-weight', '600')
			.text(`${positionedBubbles.length} responses · ${totalVotes} total votes`);
	}

	$: if (mounted && responses) {
		renderWordCloud();
	}

	onMount(() => {
		mounted = true;
		if (container && ro) ro.observe(container);
		renderWordCloud();
	});

	onDestroy(() => {
		mounted = false;
		ro?.disconnect();
		// Clean up any tooltips
		d3.select('body').selectAll('.word-cloud-tooltip').remove();
	});
</script>


<div bind:this={container} class="word-cloud-container">
	<svg
		bind:this={svg}
		viewBox={`0 0 ${width} ${height}`}
		width={width}
		height={height}
		preserveAspectRatio="xMidYMid meet"
	></svg>
</div>

<style>
	.word-cloud-container {
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		height: 100%;
		aspect-ratio: 16/9;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Allow touch gestures (pan/pinch) without page scrolling */
		touch-action: none;
	}

	/* Portrait on mobile */
	@media (max-width: 768px) {
		.word-cloud-container {
			height: 70dvh;
			min-height: 360px;
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
