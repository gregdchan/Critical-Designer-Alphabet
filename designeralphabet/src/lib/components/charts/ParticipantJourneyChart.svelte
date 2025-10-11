<script context="module" lang="ts">
	export type JourneyPoint = {
		t: Date;
		lens: string;
		text?: string;
		votes?: number;
		phase?: string;
		questionPosition?: number;
	};
</script>

<script lang="ts">
	import { scalePoint, scaleLinear } from "d3-scale";
	import { select } from "d3-selection";
	import "d3-transition";
	import { line, curveMonotoneX } from "d3-shape";
	import ChartFrame from "$lib/components/charts/ChartFrame.svelte";
	import { getThemeColors } from "$lib/utils/colors";

	export let title = "Journey by Lens";
	export let points: JourneyPoint[] = [];

	let tooltipEl: HTMLDivElement | null = null;
	let rootEl: SVGGElement;

	import { onMount, onDestroy } from 'svelte';

	onMount(() => {
		// Create and append tooltip
		tooltipEl = document.createElement('div');
		tooltipEl.style.position = 'fixed';
		tooltipEl.style.pointerEvents = 'none';
		tooltipEl.style.zIndex = '99999';
		tooltipEl.style.opacity = '0';
		tooltipEl.style.transition = 'opacity 0.2s ease';
		tooltipEl.style.display = 'block';
		tooltipEl.style.background = 'hsl(var(--surface-elevated))';
		tooltipEl.style.borderRadius = '8px';
		tooltipEl.style.padding = '8px 10px';
		tooltipEl.style.fontSize = '12px';
		tooltipEl.style.color = 'hsl(var(--text-primary))';
		tooltipEl.style.boxShadow = '0 6px 18px hsl(var(--brand) / 0.15)';
		tooltipEl.style.maxWidth = '300px';
		tooltipEl.style.border = '1px solid hsl(var(--border-subtle))';
		document.body.appendChild(tooltipEl);
	});

	onDestroy(() => {
		if (tooltipEl && document.body.contains(tooltipEl)) {
			document.body.removeChild(tooltipEl);
		}
	});

	const theme = getThemeColors();
	$: lenses = Array.from(new Set(points.map((p) => p.lens))).filter(Boolean);
	$: lensColors = (() => {
		const map = new Map<string, string>();
		lenses.forEach((lens, i) => {
			map.set(lens, theme.chart[i % theme.chart.length] || theme.brand);
		});
		return map;
	})();

	$: ordered = [...points].sort((a, b) => (a.t?.getTime?.() || 0) - (b.t?.getTime?.() || 0));
	$: orderedWithPositions = ordered.map((p, i) => ({ ...p, questionPosition: i + 1 }));

	// Calculate journey insights
	$: journeyInsights = (() => {
		if (orderedWithPositions.length === 0) return {};
		
		const totalVotes = orderedWithPositions.reduce((sum, p) => sum + (p.votes || 0), 0);
		const avgVotes = totalVotes / orderedWithPositions.length;
		const mostEngagedPost = orderedWithPositions.reduce((max, p) => (p.votes || 0) > (max.votes || 0) ? p : max, orderedWithPositions[0]);
		const lensDistribution = orderedWithPositions.reduce((acc: Record<string, number>, p) => {
			acc[p.lens] = (acc[p.lens] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		const primaryLens = Object.keys(lensDistribution).reduce((a, b) => lensDistribution[a] > lensDistribution[b] ? a : b);
		const engagementTrend = orderedWithPositions.slice(-3).reduce((sum, p) => sum + (p.votes || 0), 0) / 3;
		
		return {
			totalPosts: orderedWithPositions.length,
			totalVotes,
			avgEngagement: avgVotes,
			mostEngagedPost,
			primaryLens,
			recentEngagement: engagementTrend,
			isEngagementGrowing: engagementTrend > avgVotes
		};
	})();

	function render(root: SVGGElement, innerWidth: number, innerHeight: number, _points: JourneyPoint[]) {
		if (!tooltipEl) {
			console.warn('[JourneyChart] Tooltip element not ready, skipping render');
			return;
		}

		const g = select(root);
		g.selectAll("*").remove();

		if (!points.length) {
			g.append("text")
				.attr("x", innerWidth / 2)
				.attr("y", innerHeight / 2)
				.attr("text-anchor", "middle")
				.attr("fill", theme.ink2)
				.text("No journey data available");
			return;
		}

		// Chart dimensions - maximize the use of available space
		const margin = { left: 60, right: 20, top: 20, bottom: 50 };
		const chartWidth = innerWidth - margin.left - margin.right;
		const chartHeight = innerHeight - margin.top - margin.bottom;

		// Calculate scales
		const maxVotes = Math.max(1, ...orderedWithPositions.map(p => p.votes || 0));
		const numQuestions = orderedWithPositions.length;

		// X scale: question position (0-indexed internally, displayed as 1-indexed)
		const xScale = scaleLinear()
			.domain([0, Math.max(1, numQuestions - 1)])
			.range([0, chartWidth]);

		// Y scale: votes (0 to max)
		const yScale = scaleLinear()
			.domain([0, maxVotes])
			.range([chartHeight, 0]);

		// Create data points with proper positioning
		const pathData = orderedWithPositions.map((point, i) => {
			const x = xScale(i);
			const y = yScale(point.votes || 0);
			const engagementRatio = (point.votes || 0) / maxVotes;

			return { ...point, x, y, progress: i / Math.max(1, numQuestions - 1), engagementRatio };
		});

		// Size scale based on votes
		const sizeScale = scaleLinear()
			.domain([0, maxVotes])
			.range([8, 24]);

		// Engagement level categorization
		const getEngagementLevel = (votes: number) => {
			if (votes === 0) return 'none';
			if (votes <= 2) return 'low';
			if (votes <= 5) return 'medium';
			if (votes <= 10) return 'high';
			return 'viral';
		};

		const getEngagementColor = (votes: number, baseColor: string) => {
			const level = getEngagementLevel(votes);
			switch (level) {
				case 'none': return `${baseColor}80`; // 50% opacity
				case 'low': return `${baseColor}CC`; // 80% opacity  
				case 'medium': return baseColor; // full color
				case 'high': return baseColor; // full color with glow effect
				case 'viral': return '#FFD700'; // gold for viral posts
				default: return baseColor;
			}
		};

		const chart = g.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

		// Add Y-axis (votes)
		const yAxisTicks = 5;
		const yTickValues = Array.from({ length: yAxisTicks + 1 }, (_, i) =>
			Math.round((maxVotes / yAxisTicks) * i)
		);

		chart.append('g')
			.selectAll('g.y-tick')
			.data(yTickValues)
			.join('g')
			.attr('class', 'y-tick')
			.each(function(votes) {
				const tick = select(this);
				const y = yScale(votes);

				// Grid line
				tick.append('line')
					.attr('x1', 0)
					.attr('x2', chartWidth)
					.attr('y1', y)
					.attr('y2', y)
					.attr('stroke', 'hsl(var(--border-subtle))')
					.attr('stroke-width', 1)
					.attr('stroke-dasharray', '2,4')
					.attr('opacity', 0.3);

				// Tick mark
				tick.append('line')
					.attr('x1', -6)
					.attr('x2', 0)
					.attr('y1', y)
					.attr('y2', y)
					.attr('stroke', 'hsl(var(--text-muted))')
					.attr('stroke-width', 1);

				// Label
				tick.append('text')
					.attr('x', -10)
					.attr('y', y)
					.attr('dy', '0.35em')
					.attr('text-anchor', 'end')
					.attr('fill', 'hsl(var(--text-primary))')
					.style('font-size', '11px')
					.text(votes);
			});

		// Y-axis label
		chart.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('x', -chartHeight / 2)
			.attr('y', -45)
			.attr('text-anchor', 'middle')
			.attr('fill', 'hsl(var(--text-primary))')
			.style('font-size', '11px')
			.style('font-weight', '600')
			.text('Responses');

		// Add X-axis (questions)
		const xAxisTicks = Math.min(10, numQuestions);
		const xTickValues = Array.from({ length: xAxisTicks }, (_, i) =>
			Math.round((i / (xAxisTicks - 1)) * (numQuestions - 1))
		);

		chart.append('g')
			.selectAll('g.x-tick')
			.data(xTickValues)
			.join('g')
			.attr('class', 'x-tick')
			.each(function(questionIndex) {
				const tick = select(this);
				const x = xScale(questionIndex);

				// Tick mark
				tick.append('line')
					.attr('x1', x)
					.attr('x2', x)
					.attr('y1', chartHeight)
					.attr('y2', chartHeight + 6)
					.attr('stroke', 'hsl(var(--text-muted))')
					.attr('stroke-width', 1);

				// Label (1-indexed for display)
				tick.append('text')
					.attr('x', x)
					.attr('y', chartHeight + 20)
					.attr('text-anchor', 'middle')
					.attr('fill', 'hsl(var(--text-primary))')
					.style('font-size', '11px')
					.text(questionIndex + 1);
			});

		// X-axis label
		chart.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', chartHeight + 40)
			.attr('text-anchor', 'middle')
			.attr('fill', 'hsl(var(--text-primary))')
			.style('font-size', '11px')
			.style('font-weight', '600')
			.text('Question');

		// Draw journey points (posts) along the path with enhanced styling
		chart.selectAll('.journey-point')
			.data(pathData)
			.join('circle')
			.attr('class', 'journey-point')
			.attr('cx', d => d.x)
			.attr('cy', d => d.y)
			.attr('r', d => sizeScale(d.votes || 0))
			.attr('fill', d => {
				const baseColor = lensColors.get(d.lens) || theme.brand;
				return getEngagementColor(d.votes || 0, baseColor);
			})
			.attr('stroke', d => {
				const level = getEngagementLevel(d.votes || 0);
				if (level === 'viral') return '#FF6B35';
				if (level === 'high') return '#00D9FF';
				return 'white';
			})
			.attr('stroke-width', d => {
				const level = getEngagementLevel(d.votes || 0);
				if (level === 'viral' || level === 'high') return 3;
				return 2;
			})
			.style('cursor', 'pointer')
			.style('transition', 'all 0.3s ease')
			.style('filter', d => {
				const level = getEngagementLevel(d.votes || 0);
				if (level === 'viral') return 'drop-shadow(0 0 12px #FFD700)';
				if (level === 'high') return 'drop-shadow(0 0 8px #00D9FF)';
				return 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))';
			})
			.on('mouseover', function(event, d) {
	
				const circle = select(this);
				const originalRadius = sizeScale(d.votes || 0);

				// Smooth scale animation
				circle.transition()
					.duration(200)
					.attr('r', originalRadius + 6)
					.style('filter', () => {
						const level = getEngagementLevel(d.votes || 0);
						if (level === 'viral') return 'drop-shadow(0 0 16px #FFD700)';
						if (level === 'high') return 'drop-shadow(0 0 12px #00D9FF)';
						return 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
					});

				// Show context overlay with animation
				const overlay = chart.select(`.context-overlay-${pathData.indexOf(d)}`);
				if (!overlay.empty()) {
					overlay.transition()
						.duration(300)
						.style('opacity', '1');
				}

				// Enhanced tooltip
				if (tooltipEl) {
				console.log('[JourneyChart] Mouseover - tooltip:', tooltipEl, 'clientX:', event.clientX, 'clientY:', event.clientY);
					tooltipEl.style.opacity = '1';
					tooltipEl.style.left = event.clientX + 8 + 'px';
					tooltipEl.style.top = event.clientY + 8 + 'px';
					tooltipEl.style.border = `1px solid ${lensColors.get(d.lens) || theme.brand}`;
					tooltipEl.innerHTML = `
						<div style="font-weight:700;margin-bottom:4px;">${d.lens}</div>
						${d.phase ? `<div><strong>Phase:</strong> ${d.phase}</div>` : ''}
						<div><strong>Question:</strong> #${d.questionPosition || ''}</div>
						<div><strong>Responses:</strong> ${d.votes || 0}</div>
						${d.text ? `<div style="margin-top:4px;max-width:200px;font-size:11px;font-style:italic;">"${d.text}"</div>` : ''}
					`;
				}
			})
		.on('mousemove', function(event) {
			// Update tooltip position as mouse moves
			if (tooltipEl && tooltipEl.style.opacity === '1') {
				tooltipEl.style.left = event.clientX + 8 + 'px';
				tooltipEl.style.top = event.clientY + 8 + 'px';
			}
		})
			.on('mouseout', function(_event, d) {
				const circle = select(this);
				const originalRadius = sizeScale(d.votes || 0);

				// Smooth scale back animation
				circle.transition()
					.duration(200)
					.attr('r', originalRadius)
					.style('filter', () => {
						const level = getEngagementLevel(d.votes || 0);
						if (level === 'viral') return 'drop-shadow(0 0 12px #FFD700)';
						if (level === 'high') return 'drop-shadow(0 0 8px #00D9FF)';
						return 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))';
					});

				// Hide context overlay with animation
				const overlay = chart.select(`.context-overlay-${pathData.indexOf(d)}`);
				if (!overlay.empty()) {
					overlay.transition()
						.duration(200)
						.style('opacity', '0');
				}

				// Hide tooltip
				if (tooltipEl) {
					tooltipEl.style.opacity = '0';
				}
			});

		// Add axis labels at the ends
		// Start marker
		chart.append('text')
			.attr('x', 0)
			.attr('y', chartHeight + 35)
			.attr('text-anchor', 'start')
			.attr('fill', 'hsl(var(--accent-success))')
			.style('font-size', '9px')
			.style('font-weight', '600')
			.text('Start');

		// Latest marker
		chart.append('text')
			.attr('x', chartWidth)
			.attr('y', chartHeight + 35)
			.attr('text-anchor', 'end')
			.attr('fill', 'hsl(var(--accent-brand))')
			.style('font-size', '9px')
			.style('font-weight', '600')
			.text('Latest');

		// Context overlays (hidden by default, shown on hover) - fully styled
		chart.selectAll('.context-overlay')
			.data(pathData)
			.join('g')
			.attr('class', (_d, i) => `context-overlay context-overlay-${i}`)
			.attr('transform', d => `translate(${d.x}, ${d.y})`)
			.style('opacity', '0')
			.style('pointer-events', 'none')
			.each(function(d) {
				const overlay = select(this);
				const radius = sizeScale(d.votes || 0);

				// Lens indicator with enhanced styling
				overlay.append('circle')
					.attr('cx', -radius - 8)
					.attr('cy', -radius - 8)
					.attr('r', 6)
					.attr('fill', lensColors.get(d.lens) || theme.brand)
					.attr('stroke', 'white')
					.attr('stroke-width', 2)
					.style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');

				overlay.append('text')
					.attr('x', -radius - 8)
					.attr('y', -radius - 8)
					.attr('text-anchor', 'middle')
					.attr('dy', '0.35em')
					.attr('fill', 'white')
					.style('font-size', '7px')
					.style('font-weight', '700')
					.style('font-family', 'system-ui, -apple-system, sans-serif')
					.text(d.lens.charAt(0).toUpperCase());

				// Text preview with styled background
				if (d.text && d.text.length > 0) {
					const previewText = d.text.length > 25 ? d.text.substring(0, 25) + '...' : d.text;

					// Background for text
					const textBBox = overlay.append('text')
						.attr('x', 0)
						.attr('y', radius + 16)
						.attr('text-anchor', 'middle')
						.attr('fill', 'transparent')
						.style('font-size', '9px')
						.style('font-family', 'system-ui, -apple-system, sans-serif')
						.text(previewText);

					// Get text dimensions for background
					const bbox = textBBox.node()?.getBBox();
					if (bbox) {
						overlay.append('rect')
							.attr('x', bbox.x - 4)
							.attr('y', bbox.y - 2)
							.attr('width', bbox.width + 8)
							.attr('height', bbox.height + 4)
							.attr('fill', 'hsl(var(--surface))')
							.attr('stroke', 'hsl(var(--border-subtle))')
							.attr('stroke-width', 1)
							.attr('rx', 4)
							.style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
							.style('opacity', '0.95');
					}

					// Actual text on top
					overlay.append('text')
						.attr('x', 0)
						.attr('y', radius + 16)
						.attr('text-anchor', 'middle')
						.attr('fill', 'hsl(var(--text-primary))')
						.style('font-size', '9px')
						.style('font-weight', '500')
						.style('font-family', 'system-ui, -apple-system, sans-serif')
						.text(previewText);
				}

				// Vote count badge with enhanced styling
				if ((d.votes || 0) > 0) {
					// Badge background with glow
					overlay.append('circle')
						.attr('cx', radius + 6)
						.attr('cy', -radius - 6)
						.attr('r', 8)
						.attr('fill', 'hsl(var(--accent-success))')
						.attr('stroke', 'white')
						.attr('stroke-width', 2)
						.style('filter', 'drop-shadow(0 2px 6px rgba(34, 197, 94, 0.4))');

					// Badge inner glow
					overlay.append('circle')
						.attr('cx', radius + 6)
						.attr('cy', -radius - 6)
						.attr('r', 6)
						.attr('fill', 'rgba(255, 255, 255, 0.2)')
						.style('pointer-events', 'none');

					overlay.append('text')
						.attr('x', radius + 6)
						.attr('y', -radius - 6)
						.attr('text-anchor', 'middle')
						.attr('dy', '0.35em')
						.attr('fill', 'white')
						.style('font-size', '7px')
						.style('font-weight', '700')
						.style('font-family', 'system-ui, -apple-system, sans-serif')
						.style('text-shadow', '0 1px 2px rgba(0,0,0,0.3)')
						.text(d.votes || 0);
				}

				// Phase indicator (subtle)
				if (d.phase) {
					overlay.append('text')
						.attr('x', 0)
						.attr('y', -radius - 12)
						.attr('text-anchor', 'middle')
						.attr('fill', 'hsl(var(--text-muted))')
						.style('font-size', '7px')
						.style('font-weight', '600')
						.style('opacity', '0.7')
						.style('font-family', 'system-ui, -apple-system, sans-serif')
						.text(d.phase);
				}
			});
	}
</script>

<ChartFrame
	{title}
	ariaLabel="Participant journey scatter plot"
	margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
	let:innerWidth
	let:innerHeight
>
	<g bind:this={rootEl}>
		{@html (rootEl && render(rootEl, innerWidth, innerHeight, points), "")}
	</g>
</ChartFrame>
