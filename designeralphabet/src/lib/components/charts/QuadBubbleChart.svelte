<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';

	type ResponseNode = {
		id: string;
		text: string;
		lens?: string;
		cards?: string[] | null;
		votes?: number;
		participantName?: string;
	};

	export let responses: ResponseNode[] = [];
	export let width = 860;
	export let height = 540;

	let svg: SVGSVGElement;
	let tooltipEl: HTMLDivElement;
	let mounted = false;

	const lensPalette: Record<string, string> = {
		Risk: '#f472b6',
		Work: '#38bdf8',
		Sustainability: '#22d3ee',
		Ethics: '#a855f7',
		Justice: '#f97316',
		Community: '#bef264',
		Agency: '#22c55e'
	};

	const impactLabels = {
		high: 'HIGH IMPACT',
		low: 'LOW IMPACT'
	} as const;

	const effortLabels = {
		high: 'HIGH EFFORT',
		low: 'LOW EFFORT'
	} as const;

	const baseGradientStops = [
		{ offset: '0%', color: 'rgba(40, 224, 255, 0.35)' },
		{ offset: '45%', color: 'rgba(168, 85, 247, 0.15)' },
		{ offset: '100%', color: 'rgba(12, 12, 24, 0.85)' }
	];

	const lensColor = (lens: string | undefined, fallback: string) => {
		if (!lens) return fallback;
		const entry = Object.entries(lensPalette).find(
			([key]) => key.toLowerCase() === lens.toLowerCase()
		);
		return entry ? entry[1] : fallback;
	};

	function normalise(values: number[], minRange = 0.08, maxRange = 0.92) {
		const min = d3.min(values) ?? 0;
		const max = d3.max(values) ?? 1;
		const delta = max - min || 1;
		return (value: number) => {
			const normalised = (value - min) / delta;
			return minRange + normalised * (maxRange - minRange);
		};
	}

	type BubbleNode = {
		id: string;
		raw: ResponseNode;
		label: string;
		lens: string;
		votes: number;
		cards: number;
		participant: string;
		targetX: number;
		targetY: number;
		radius: number;
		baseColor: string;
		x?: number;
		y?: number;
		vx?: number;
		vy?: number;
	} & d3.SimulationNodeDatum;

	function buildNodes(data: ResponseNode[]): BubbleNode[] {
		if (!data.length) return [];

		const voteValues = data.map((d) => Math.max(0, d.votes ?? 0));
		const cardValues = data.map((d) => (Array.isArray(d.cards) ? d.cards.length : 0));
		const lengthValues = data.map((d) => d.text?.length ?? 0);

		const impactScale = normalise(voteValues);
		const effortScale = normalise(
			data.map((_, index) => cardValues[index] * 2 + lengthValues[index] / 120),
			0.12,
			0.88
		);
		const radiusScale = d3
			.scaleSqrt()
			.domain([0, d3.max(voteValues) || 1])
			.range([18, 56]);

		return data.map((response, index) => {
			const votes = Math.max(0, response.votes ?? 0);
			const cards = Array.isArray(response.cards) ? response.cards.length : 0;
			const lens = response.lens ?? 'Inspiration';
			return {
				id: response.id ?? `bubble-${index}`,
				raw: response,
				label: response.text ?? '—',
				lens,
				votes,
				cards,
				participant: response.participantName ?? 'Anonymous',
				targetX: impactScale(votes),
				targetY: 1 - effortScale(cards * 1.5 + (response.text?.length ?? 0) / 160),
				radius: radiusScale(votes),
				baseColor: lensColor(lens, '#14b8a6')
			} satisfies BubbleNode;
		});
	}

	function renderChart() {
		if (!mounted || !svg || !tooltipEl) return;

		const nodes = buildNodes(responses);
		const hasData = nodes.length > 0;

		const margin = { top: 56, right: 64, bottom: 64, left: 72 };
		const chartWidth = width - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;

		const xScale = d3.scaleLinear().domain([0, 1]).range([0, chartWidth]);
		const yScale = d3.scaleLinear().domain([0, 1]).range([chartHeight, 0]);

		const root = d3.select(svg);
		root.selectAll('*').remove();
		root.attr('viewBox', `0 0 ${width} ${height}`);

		const defs = root.append('defs');

		const gradient = defs
			.append('radialGradient')
			.attr('id', 'quad-bubble-bg')
			.attr('cx', '50%')
			.attr('cy', '50%')
			.attr('r', '85%');

		baseGradientStops.forEach(({ offset, color }) => {
			gradient.append('stop').attr('offset', offset).attr('stop-color', color);
		});

		const glow = defs
			.append('filter')
			.attr('id', 'bubble-glow')
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
			.attr('fill', 'url(#quad-bubble-bg)')
			.attr('stroke', 'rgba(148, 163, 184, 0.45)')
			.attr('stroke-opacity', 0.4)
			.attr('stroke-width', 1.5);

		if (hasData) {
			const grid = container.append('g').attr('class', 'gridlines');

			const impactAxis = d3.axisBottom(xScale).ticks(6);
			const effortAxis = d3.axisLeft(yScale).ticks(6);

			grid
				.append('g')
				.attr('class', 'grid-x')
				.attr('transform', `translate(0, ${chartHeight})`)
				.call(impactAxis.tickSize(-chartHeight).tickFormat(() => ''));

			grid
				.append('g')
				.attr('class', 'grid-y')
				.call(effortAxis.tickSize(-chartWidth).tickFormat(() => ''));

			grid
				.selectAll('line')
				.attr('stroke', 'rgba(148, 163, 184, 0.18)')
				.attr('stroke-dasharray', '4 10');
		}

		container
			.append('line')
			.attr('x1', chartWidth / 2)
			.attr('y1', 24)
			.attr('x2', chartWidth / 2)
			.attr('y2', chartHeight - 24)
			.attr('stroke', 'rgba(255, 255, 255, 0.16)')
			.attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '6 14');

		container
			.append('line')
			.attr('x1', 24)
			.attr('y1', chartHeight / 2)
			.attr('x2', chartWidth - 24)
			.attr('y2', chartHeight / 2)
			.attr('stroke', 'rgba(255, 255, 255, 0.16)')
			.attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '6 14');

		const titleGroup = container.append('g');

		titleGroup
			.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', -24)
			.attr('text-anchor', 'middle')
			.attr('fill', '#f8fafc')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-weight', 600)
			.attr('font-size', 18)
			.text('Impact vs. Effort — Neon Quad');

		titleGroup
			.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', -4)
			.attr('text-anchor', 'middle')
			.attr('fill', 'rgba(203, 213, 225, 0.75)')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', 12)
			.text('Vote-weighted bubbles sized by community energy');

		const axisLabelGroup = container.append('g');

		axisLabelGroup
			.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', chartHeight + 36)
			.attr('text-anchor', 'middle')
			.attr('fill', '#38bdf8')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', 13)
			.attr('letter-spacing', 2)
			.text(`${impactLabels.low} ↔ ${impactLabels.high}`);

		axisLabelGroup
			.append('text')
			.attr('x', -44)
			.attr('y', chartHeight / 2)
			.attr('transform', `rotate(-90, ${-44}, ${chartHeight / 2})`)
			.attr('text-anchor', 'middle')
			.attr('fill', '#a855f7')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', 13)
			.attr('letter-spacing', 2)
			.text(`${effortLabels.low} ↕ ${effortLabels.high}`);

		const tooltip = d3.select(tooltipEl).style('opacity', 0).style('pointer-events', 'none');

		if (!hasData) {
			container
				.append('text')
				.attr('x', chartWidth / 2)
				.attr('y', chartHeight / 2)
				.attr('text-anchor', 'middle')
				.attr('fill', 'rgba(226, 232, 240, 0.8)')
				.attr('font-family', 'Orbitron, sans-serif')
				.attr('font-size', 14)
				.text('Add responses to watch the quad light up.');
			return;
		}

		const simulationNodes: BubbleNode[] = nodes.map((node) => ({ ...node }));

		const simulation = d3
			.forceSimulation<BubbleNode>(simulationNodes)
			.force('x', d3.forceX<BubbleNode>((d) => xScale(d.targetX)).strength(0.6))
			.force('y', d3.forceY<BubbleNode>((d) => yScale(d.targetY)).strength(0.6))
			.force(
				'collide',
				d3.forceCollide<BubbleNode>((d) => d.radius + 6)
			)
			.stop();

		for (let i = 0; i < 200; i += 1) {
			simulation.tick();
		}

		const nodeGroup = container
			.append('g')
			.attr('class', 'nodes')
			.selectAll('g.node')
			.data(simulationNodes)
			.enter()
			.append('g')
			.attr('class', 'node')
			.attr('transform', (d) => `translate(${d.x}, ${d.y})`);

		nodeGroup
			.append('circle')
			.attr('class', 'bubble-core')
			.attr('r', 0)
			.attr('fill', (d) => d.baseColor)
			.attr('fill-opacity', 0.32)
			.attr('stroke', (d) => d.baseColor)
			.attr('stroke-width', 2)
			.attr('filter', 'url(#bubble-glow)')
			.transition()
			.ease(d3.easeElastic.period(0.6))
			.duration(1000)
			.attr('r', (d) => d.radius);

		nodeGroup
			.append('circle')
			.attr('class', 'bubble-ring')
			.attr('r', 0)
			.attr('stroke', (d) => d.baseColor)
			.attr('stroke-opacity', 0.35)
			.attr('stroke-width', (d) => Math.max(2, Math.min(6, d.cards * 1.5)))
			.attr('fill', 'none')
			.attr('stroke-dasharray', '8 22')
			.transition()
			.duration(900)
			.attr('r', (d) => d.radius + 10);

		nodeGroup
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('dy', '0.35em')
			.attr('fill', '#f8fafc')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-weight', 600)
			.attr('font-size', 12)
			.style('pointer-events', 'none')
			.text((d) => d.votes || '0')
			.style('opacity', 0)
			.transition()
			.duration(800)
			.delay(200)
			.style('opacity', 1);

		nodeGroup
			.on('pointerenter', function (event, d) {
				d3.select(this)
					.select('.bubble-core')
					.transition()
					.duration(240)
					.attr('fill-opacity', 0.55)
					.attr('stroke-width', 3.5);

				d3.select(this)
					.select('.bubble-ring')
					.transition()
					.duration(240)
					.attr('stroke-opacity', 0.65)
					.attr('stroke-width', Math.max(4, d.cards * 1.8));

				const bounds = (svg.parentNode as HTMLElement).getBoundingClientRect();
				tooltip
					.style('opacity', 0.98)
					.html(
						`
            <div class="tooltip-title" style="color:${d.baseColor}">${d.lens}</div>
            <div class="tooltip-body">
              <p>${d.label}</p>
              <div class="tooltip-metadata">
                <span>${d.votes} vote${d.votes === 1 ? '' : 's'}</span>
                <span>${d.cards} card link${d.cards === 1 ? '' : 's'}</span>
              </div>
              <div class="tooltip-footer">${d.participant}</div>
            </div>`
					)
					.style(
						'transform',
						`translate(${event.clientX - bounds.left + 16}px, ${event.clientY - bounds.top - 24}px)`
					);
			})
			.on('pointermove', function (event) {
				const bounds = (svg.parentNode as HTMLElement).getBoundingClientRect();
				tooltip.style(
					'transform',
					`translate(${event.clientX - bounds.left + 16}px, ${event.clientY - bounds.top - 24}px)`
				);
			})
			.on('pointerleave', function () {
				d3.select(this)
					.select('.bubble-core')
					.transition()
					.duration(240)
					.attr('fill-opacity', 0.32)
					.attr('stroke-width', 2);

				d3.select(this)
					.select('.bubble-ring')
					.transition()
					.duration(240)
					.attr('stroke-opacity', 0.35)
					.attr('stroke-width', (d: any) => Math.max(2, Math.min(6, d.cards * 1.5)));

				tooltip.style('opacity', 0);
			});

		const legend = container
			.append('g')
			.attr('class', 'legend')
			.attr('transform', `translate(${chartWidth - 200}, ${chartHeight - 120})`);

		legend
			.append('text')
			.attr('fill', 'rgba(226, 232, 240, 0.85)')
			.attr('font-size', 12)
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-weight', 600)
			.text('Lens palette');

		const legendItems = legend
			.append('g')
			.attr('transform', 'translate(0, 18)')
			.selectAll('g')
			.data(Array.from(d3.group(nodes, (node) => node.lens).keys()))
			.enter()
			.append('g')
			.attr('transform', (_, i) => `translate(0, ${i * 20})`);

		legendItems
			.append('circle')
			.attr('r', 5)
			.attr('fill', (lens) => lensColor(lens, '#38bdf8'));

		legendItems
			.append('text')
			.attr('x', 12)
			.attr('y', 0)
			.attr('dy', '0.35em')
			.attr('fill', 'rgba(226, 232, 240, 0.88)')
			.attr('font-size', 11)
			.attr('font-family', 'Orbitron, sans-serif')
			.text((lens) => lens);

		legend
			.append('text')
			.attr('x', 0)
			.attr('y', legendItems.size() * 20 + 20)
			.attr('fill', 'rgba(148, 163, 184, 0.9)')
			.attr('font-size', 10)
			.attr('font-family', 'Orbitron, sans-serif')
			.text('Ring thickness shows linked cards.');
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

<div class="quad-bubble-wrapper">
	<svg bind:this={svg} role="img" aria-label="Impact versus effort bubble chart"></svg>
	<div bind:this={tooltipEl} class="chart-tooltip"></div>
</div>

<style>
	.quad-bubble-wrapper {
		position: relative;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1.75rem;
		border-radius: 1.25rem;
		background:
			radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.18), transparent 55%),
			radial-gradient(circle at 80% 25%, rgba(236, 72, 153, 0.18), transparent 55%),
			radial-gradient(circle at 50% 80%, rgba(34, 197, 94, 0.16), transparent 65%),
			rgba(8, 11, 24, 0.92);
		border: 1px solid rgba(148, 163, 184, 0.25);
		box-shadow: 0 30px 60px rgba(15, 23, 42, 0.45);
	}

	svg {
		width: 100%;
		height: auto;
	}

	.chart-tooltip {
		position: absolute;
		min-width: 220px;
		max-width: 280px;
		padding: 0.9rem 1.1rem;
		border-radius: 0.85rem;
		background: rgba(12, 14, 24, 0.95);
		border: 1px solid rgba(148, 163, 184, 0.4);
		color: #f8fafc;
		font-family: 'Orbitron', system-ui, sans-serif;
		font-size: 0.72rem;
		line-height: 1.4;
		pointer-events: none;
		mix-blend-mode: screen;
		box-shadow: 0 12px 32px rgba(14, 116, 144, 0.25);
		transition: opacity 120ms ease;
	}

	:global(.chart-tooltip .tooltip-title) {
		font-weight: 700;
		margin-bottom: 0.4rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	:global(.chart-tooltip .tooltip-metadata) {
		display: flex;
		gap: 0.6rem;
		margin-top: 0.45rem;
		font-size: 0.68rem;
		opacity: 0.75;
	}

	:global(.chart-tooltip .tooltip-footer) {
		margin-top: 0.6rem;
		font-size: 0.65rem;
		letter-spacing: 0.06em;
		opacity: 0.7;
	}
</style>
