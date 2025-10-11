<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import { getThemeColors } from '$lib/utils/colors';

	type RoadmapResponse = {
		text?: string;
		votes?: number;
		lens?: string;
		participantName?: string;
		cards?: string[] | null;
	};

	export let responses: RoadmapResponse[] = [];
	export let width = 920;
	export let height = 560;

	let svg: SVGSVGElement;
	let tooltipEl: HTMLDivElement;
	let mounted = false;

	const phases = ['Now', 'Next', 'Later', 'Signal'] as const;
	const laneFallbacks = ['Infrastructure', 'Practice', 'Policy', 'Community'];

	const lensOrder = [
		'Risk',
		'Work',
		'Sustainability',
		'Ethics',
		'Community',
		'Justice',
		'Agency'
	] as const;

	type RoadmapCard = {
		id: string;
		text: string;
		votes: number;
		lens: string;
		participant: string;
		cards: number;
		color: string;
		phase: (typeof phases)[number];
		lane: string;
		priority: 'High' | 'Medium' | 'Watch';
	};

	function normaliseLens(raw?: string) {
		if (!raw) return 'Community';
		const match = (lensOrder as readonly string[]).find(
			(key) => key.toLowerCase() === raw.toLowerCase()
		);
		return match ?? raw;
	}

	function derivePhase(votes: number) {
		if (votes >= 6) return 'Now';
		if (votes >= 3) return 'Next';
		if (votes >= 1) return 'Later';
		return 'Signal';
	}

	function derivePriority(votes: number) {
		if (votes >= 6) return 'High';
		if (votes >= 3) return 'Medium';
		return 'Watch';
	}

	function buildCards(
		data: RoadmapResponse[],
		theme: ReturnType<typeof getThemeColors>
	): RoadmapCard[] {
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
		const resolveLensColor = (lens: string) => {
			if (lensColors.has(lens)) return lensColors.get(lens)!;
			const base = basePalette[lens];
			if (base) {
				lensColors.set(lens, base);
				return base;
			}
			const color = fallbackPalette[fallbackIndex % fallbackPalette.length] ?? theme.brand;
			fallbackIndex += 1;
			lensColors.set(lens, color);
			return color;
		};

		return data.map((response, index) => {
			const votes = Math.max(0, response.votes ?? 0);
			const lens = normaliseLens(response.lens);
			const color = resolveLensColor(lens);
			const text = response.text?.trim() ?? 'Idea pending detail';

			return {
				id: `roadmap-${index}`,
				text: text.length > 140 ? `${text.slice(0, 140)}…` : text,
				votes,
				lens,
				participant: response.participantName ?? 'Anonymous',
				cards: Array.isArray(response.cards) ? response.cards.length : 0,
				color,
				phase: derivePhase(votes),
				lane: lens,
				priority: derivePriority(votes)
			} satisfies RoadmapCard;
		});
	}

	function renderChart() {
		if (!mounted || !svg || !tooltipEl) return;

		const theme = getThemeColors();
		const cards = buildCards(responses, theme);
		const uniqueLanes = Array.from(new Set(cards.map((card) => card.lane)));
		const lanes = uniqueLanes.length ? uniqueLanes : laneFallbacks;
		const laneColors = new Map<string, string>();
		cards.forEach((card) => {
			if (!laneColors.has(card.lane)) {
				laneColors.set(card.lane, card.color);
			}
		});

		const margin = { top: 80, right: 56, bottom: 80, left: 160 };
		const chartWidth = width - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;
		const columnWidth = chartWidth / phases.length;
		const laneHeight = chartHeight / lanes.length;

		const root = d3.select(svg);
		root.selectAll('*').remove();
		root.attr('viewBox', `0 0 ${width} ${height}`);

		const defs = root.append('defs');

		const bgGradient = defs
			.append('linearGradient')
			.attr('id', 'roadmap-background')
			.attr('x1', '0%')
			.attr('x2', '100%')
			.attr('y1', '0%')
			.attr('y2', '100%');

		bgGradient.append('stop').attr('offset', '0%').attr('stop-color', 'hsl(var(--surface) / 0.95)');
		bgGradient
			.append('stop')
			.attr('offset', '100%')
			.attr('stop-color', 'hsl(var(--surface-muted) / 0.98)');

		const glow = defs
			.append('filter')
			.attr('id', 'roadmap-glow')
			.attr('x', '-35%')
			.attr('y', '-35%')
			.attr('width', '170%')
			.attr('height', '170%');

		glow.append('feGaussianBlur').attr('stdDeviation', 8).attr('result', 'coloredBlur');
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
			.attr('rx', 28)
			.attr('fill', 'url(#roadmap-background)')
			.attr('stroke', 'hsl(var(--brand) / 0.25)')
			.attr('stroke-width', 1.4)
			.style('filter', 'url(#roadmap-glow)');

		const tooltip = d3.select(tooltipEl).style('opacity', 0).style('pointer-events', 'none');

		// Phase dividers
		const dividerGroup = container.append('g').attr('class', 'phase-dividers');

		phases.forEach((phase, index) => {
			const x = index * columnWidth;
			dividerGroup
				.append('line')
				.attr('x1', x)
				.attr('x2', x)
				.attr('y1', 16)
				.attr('y2', chartHeight - 16)
				.attr('stroke', 'hsl(var(--border-subtle) / 0.35)')
				.attr('stroke-width', index === 0 ? 0 : 1.2)
				.attr('stroke-dasharray', '6 12');

			dividerGroup
				.append('text')
				.attr('x', x + columnWidth / 2)
				.attr('y', -28)
				.attr('text-anchor', 'middle')
				.attr('fill', theme.brand)
				.attr('font-family', 'Orbitron, sans-serif')
				.attr('font-size', 14)
				.attr('letter-spacing', 2)
				.attr('font-weight', 600)
				.text(phase.toUpperCase());
		});

		// Lane labels
		lanes.forEach((lane, index) => {
			const y = index * laneHeight + laneHeight / 2;
			container
				.append('text')
				.attr('x', -24)
				.attr('y', y)
				.attr('dy', '0.35em')
				.attr('text-anchor', 'end')
				.attr('fill', laneColors.get(lane) ?? theme.ink2)
				.attr('font-family', 'Orbitron, sans-serif')
				.attr('font-weight', 600)
				.attr('font-size', 12)
				.text(lane.toUpperCase());

			container
				.append('line')
				.attr('x1', 10)
				.attr('y1', y)
				.attr('x2', chartWidth - 10)
				.attr('y2', y)
				.attr('stroke', 'hsl(var(--border-subtle) / 0.25)')
				.attr('stroke-dasharray', '4 10');
		});

		container
			.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', -48)
			.attr('text-anchor', 'middle')
			.attr('fill', theme.ink)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', 18)
			.attr('font-weight', 600)
			.text('Roadmap Swimlanes — Momentum Tracker');

		container
			.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', -26)
			.attr('text-anchor', 'middle')
			.attr('fill', theme.inkMuted)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', 12)
			.text('Votes move cards forward; lens color telegraphs stewardship.');

		const grouped = d3.group(cards, (card) => `${card.lane}::${card.phase}`);

		const cellGroup = container.append('g').attr('class', 'lane-phase-cells');

		grouped.forEach((items, key) => {
			const [lane, phase] = key.split('::');
			const laneIndex = lanes.indexOf(lane);
			const phaseIndex = phases.indexOf(phase as (typeof phases)[number]);
			const cellX = phaseIndex * columnWidth;
			const cellY = laneIndex * laneHeight;

			const cellPadding = 18;
			const cellWidth = columnWidth - cellPadding * 2;
			const cellHeight = laneHeight - cellPadding * 2;

			const columnCount = Math.max(1, Math.floor(cellWidth / 180));
			const cardWidth = Math.min(180, (cellWidth - (columnCount - 1) * 16) / columnCount);
			const cardHeightBase = 86;

			items.forEach((card, index) => {
				const col = index % columnCount;
				const row = Math.floor(index / columnCount);
				const xPos = cellX + cellPadding + col * (cardWidth + 16);
				const yPos = cellY + cellPadding + row * (cardHeightBase + 18);

				const cardGroup = cellGroup
					.append('g')
					.attr('class', 'roadmap-card')
					.attr('transform', `translate(${xPos}, ${yPos})`);

				cardGroup
					.append('rect')
					.attr('width', cardWidth)
					.attr('height', cardHeightBase)
					.attr('rx', 14)
					.attr('fill', 'hsl(var(--surface) / 0.9)')
					.attr('stroke', card.color)
					.attr('stroke-width', 1.5)
					.attr('stroke-opacity', 0.55)
					.style('filter', 'drop-shadow(0 14px 24px hsl(var(--brand-soft) / 0.25))');

				cardGroup
					.append('rect')
					.attr('width', cardWidth)
					.attr('height', 4)
					.attr('rx', 2)
					.attr('fill', card.color)
					.attr('y', -6);

				cardGroup
					.append('text')
					.attr('x', 12)
					.attr('y', 18)
					.attr('fill', 'hsl(var(--text-on-teal))')
					.attr('font-family', 'Orbitron, sans-serif')
					.attr('font-size', 11)
					.attr('font-weight', 600)
					.text(card.lens.toUpperCase());

				cardGroup
					.append('text')
					.attr('x', 12)
					.attr('y', 36)
					.attr('fill', theme.ink2)
					.attr('font-family', 'Orbitron, sans-serif')
					.attr('font-size', 10)
					.attr('letter-spacing', 0.4)
					.text(`${card.priority} • ${card.votes} vote${card.votes === 1 ? '' : 's'}`);

				const body = cardGroup
					.append('text')
					.attr('x', 12)
					.attr('y', 52)
					.attr('fill', theme.inkMuted)
					.attr('font-family', 'Orbitron, sans-serif')
					.attr('font-size', 9)
					.attr('opacity', 0.95);

				const wrapped = wrapText(card.text, Math.max(18, cardWidth - 24));
				wrapped.forEach((line, i) => {
					body
						.append('tspan')
						.attr('x', 12)
						.attr('dy', i === 0 ? 0 : 12)
						.text(line);
				});

				cardGroup
					.append('text')
					.attr('x', 12)
					.attr('y', cardHeightBase - 12)
					.attr('fill', theme.inkMuted)
					.attr('font-family', 'Orbitron, sans-serif')
					.attr('font-size', 8.5)
					.text(card.participant);

				cardGroup
					.on('pointerenter', function (event) {
						d3.select(this)
							.select('rect')
							.transition()
							.duration(200)
							.attr('stroke-width', 2.4)
							.attr('stroke', card.color)
							.attr('stroke-opacity', 1);

						const bounds = (svg.parentNode as HTMLElement).getBoundingClientRect();
						tooltip
							.style('opacity', 0.98)
							.html(
								`
                <div class="tooltip-heading" style="color:${card.color}">${card.lens} → ${card.phase}</div>
                <div class="tooltip-body">${card.text}</div>
                <div class="tooltip-meta">${card.participant}</div>
              `
							)
							.style(
								'transform',
								`translate(${event.clientX - bounds.left + 16}px, ${event.clientY - bounds.top - 20}px)`
							);
					})
					.on('pointermove', function (event) {
						const bounds = (svg.parentNode as HTMLElement).getBoundingClientRect();
						tooltip.style(
							'transform',
							`translate(${event.clientX - bounds.left + 16}px, ${event.clientY - bounds.top - 20}px)`
						);
					})
					.on('pointerleave', function () {
						d3.select(this)
							.select('rect')
							.transition()
							.duration(160)
							.attr('stroke-width', 1.5)
							.attr('stroke', card.color)
							.attr('stroke-opacity', 0.55);

						tooltip.style('opacity', 0);
					});
			});
		});

		const legend = container
			.append('g')
			.attr('transform', `translate(${chartWidth - 210}, ${chartHeight + 44})`);

		const legendItems: Array<{ label: string; caption: string; color: string }> = [
			{ label: 'High', caption: 'Ready to activate', color: theme.accentWarm },
			{ label: 'Medium', caption: 'Staging next', color: theme.brand },
			{ label: 'Watch', caption: 'Signals to nurture', color: theme.accentCritical }
		];

		legend
			.append('text')
			.attr('x', 0)
			.attr('y', -12)
			.attr('fill', theme.inkMuted)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', 10)
			.text('Priority legend');

		const legendGroup = legend
			.selectAll('g')
			.data(legendItems)
			.enter()
			.append('g')
			.attr('transform', (_, index) => `translate(0, ${index * 22})`);

		legendGroup
			.append('circle')
			.attr('r', 6)
			.attr('fill', (d) => d.color);

		legendGroup
			.append('text')
			.attr('x', 12)
			.attr('y', 0)
			.attr('dy', '0.35em')
			.attr('fill', theme.ink)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', 11)
			.text((d) => d.label);

		legendGroup
			.append('text')
			.attr('x', 60)
			.attr('y', 0)
			.attr('dy', '0.35em')
			.attr('fill', theme.inkMuted)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', 9)
			.text((d) => d.caption);

		if (cards.length === 0) {
			container
				.append('text')
				.attr('x', chartWidth / 2)
				.attr('y', chartHeight / 2)
				.attr('text-anchor', 'middle')
				.attr('fill', theme.ink2)
				.attr('font-family', 'Orbitron, sans-serif')
				.attr('font-size', 14)
				.text('Add responses to populate the roadmap.');
		}
	}

	function wrapText(text: string, width: number) {
		const words = text.split(/\s+/);
		const lines: string[] = [];
		let currentLine = '';

		words.forEach((word) => {
			const tentative = currentLine ? `${currentLine} ${word}` : word;
			if (tentative.length * 6.2 > width) {
				if (currentLine) {
					lines.push(currentLine);
				}
				currentLine = word;
			} else {
				currentLine = tentative;
			}
		});

		if (currentLine) {
			lines.push(currentLine);
		}

		return lines.slice(0, 3);
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

<div class="roadmap-wrapper">
	<svg bind:this={svg} role="img" aria-label="Roadmap swimlanes"></svg>
	<div bind:this={tooltipEl} class="chart-tooltip"></div>
</div>

<style>
	.roadmap-wrapper {
		position: relative;
		width: 100%;
		padding: 1.8rem;
		border-radius: 1.5rem;
		background:
			radial-gradient(circle at 15% 25%, hsl(var(--brand) / 0.18), transparent 55%),
			radial-gradient(circle at 80% 20%, hsl(var(--accent-warm) / 0.18), transparent 60%),
			radial-gradient(circle at 50% 80%, hsl(var(--accent-critical) / 0.18), transparent 70%),
			hsl(var(--surface));
		border: 1px solid hsl(var(--brand) / 0.24);
		box-shadow: 0 34px 72px hsl(var(--brand-soft) / 0.38);
	}

	svg {
		width: 100%;
		height: auto;
	}

	.chart-tooltip {
		position: absolute;
		min-width: 240px;
		max-width: 320px;
		padding: 1rem 1.1rem 1.2rem;
		border-radius: 1rem;
		background: hsl(var(--surface) / 0.98);
		border: 1px solid hsl(var(--brand) / 0.35);
		color: hsl(var(--text-on-teal));
		font-family: 'Orbitron', system-ui, sans-serif;
		font-size: 0.68rem;
		line-height: 1.4;
		pointer-events: none;
		mix-blend-mode: screen;
		box-shadow: 0 20px 40px hsl(var(--brand) / 0.28);
	}

	:global(.chart-tooltip .tooltip-heading) {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 700;
		margin-bottom: 0.45rem;
	}

	:global(.chart-tooltip .tooltip-body) {
		font-size: 0.7rem;
		opacity: 0.85;
		color: hsl(var(--text-secondary));
		margin-bottom: 0.6rem;
	}

	:global(.chart-tooltip .tooltip-meta) {
		font-size: 0.64rem;
		opacity: 0.7;
		color: hsl(var(--text-muted));
		letter-spacing: 0.08em;
	}
</style>
