<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { Response } from '$lib/gamification';

	export let responses: Response[] = [];
	export let title = 'Card Influence Network';
	export let height = 500;

	let chartContainer: HTMLDivElement;
	let simulation: d3.Simulation<any, any> | null = null;

	interface NetworkNode {
		id: string;
		usage: number;
		avgVotes: number;
	}

	interface NetworkLink {
		source: string;
		target: string;
		strength: number;
	}

	let networkData: { nodes: NetworkNode[]; links: NetworkLink[] } = {
		nodes: [],
		links: []
	};

	$: if (responses.length > 0) {
		calculateNetwork();
		renderNetwork();
	}

	function calculateNetwork() {
		// Build co-occurrence matrix
		const cardUsage = new Map<string, { count: number; votes: number }>();
		const coOccurrence = new Map<string, number>();

		responses.forEach((response) => {
			const cards = response.cards || [];
			const votes = response.votes || 0;

			// Track individual card usage
			cards.forEach((card) => {
				if (!cardUsage.has(card)) {
					cardUsage.set(card, { count: 0, votes: 0 });
				}
				const usage = cardUsage.get(card)!;
				usage.count += 1;
				usage.votes += votes;
			});

			// Track co-occurrence (cards used together)
			for (let i = 0; i < cards.length; i++) {
				for (let j = i + 1; j < cards.length; j++) {
					const pair = [cards[i], cards[j]].sort().join('|||');
					coOccurrence.set(pair, (coOccurrence.get(pair) || 0) + 1);
				}
			}
		});

		// Build nodes (top 20 cards by usage)
		const nodes: NetworkNode[] = Array.from(cardUsage.entries())
			.map(([id, stats]) => ({
				id,
				usage: stats.count,
				avgVotes: stats.count > 0 ? stats.votes / stats.count : 0
			}))
			.sort((a, b) => b.usage - a.usage)
			.slice(0, 20);

		const nodeIds = new Set(nodes.map((n) => n.id));

		// Build links (only between existing nodes)
		const links: NetworkLink[] = Array.from(coOccurrence.entries())
			.map(([pair, strength]) => {
				const [source, target] = pair.split('|||');
				return { source, target, strength };
			})
			.filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target))
			.filter((link) => link.strength >= 2); // Only show meaningful connections

		networkData = { nodes, links };
	}

	function renderNetwork() {
		if (!chartContainer || networkData.nodes.length === 0) return;

		// Stop existing simulation
		if (simulation) {
			simulation.stop();
		}

		// Clear previous chart
		d3.select(chartContainer).selectAll('*').remove();

		const width = chartContainer.clientWidth;
		const chartHeight = height;

		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', width)
			.attr('height', chartHeight)
			.attr('viewBox', [0, 0, width, chartHeight]);

		// Color scale
		const colorScale = d3
			.scaleSequential()
			.domain([0, d3.max(networkData.nodes, (d) => d.avgVotes) || 5])
			.interpolator(d3.interpolatePlasma);

		// Size scale
		const sizeScale = d3
			.scaleSqrt()
			.domain([0, d3.max(networkData.nodes, (d) => d.usage) || 10])
			.range([8, 30]);

		// Link width scale
		const linkWidthScale = d3
			.scaleLinear()
			.domain([0, d3.max(networkData.links, (d) => d.strength) || 5])
			.range([1, 8]);

		// Create force simulation
		simulation = d3
			.forceSimulation(networkData.nodes as any)
			.force(
				'link',
				d3
					.forceLink(networkData.links)
					.id((d: any) => d.id)
					.distance(100)
					.strength((d: any) => d.strength * 0.1)
			)
			.force('charge', d3.forceManyBody().strength(-300))
			.force('center', d3.forceCenter(width / 2, chartHeight / 2))
			.force('collision', d3.forceCollide().radius((d: any) => sizeScale(d.usage) + 5));

		// Draw links
		const link = svg
			.append('g')
			.selectAll('line')
			.data(networkData.links)
			.join('line')
			.attr('stroke', 'hsl(var(--line))')
			.attr('stroke-opacity', 0.4)
			.attr('stroke-width', (d) => linkWidthScale(d.strength));

		// Tooltip
		const tooltip = d3
			.select(chartContainer)
			.append('div')
			.attr('class', 'network-tooltip')
			.style('position', 'absolute')
			.style('visibility', 'hidden')
			.style('background', 'hsl(var(--surface))')
			.style('border', '1px solid hsl(var(--line))')
			.style('border-radius', '8px')
			.style('padding', '8px 12px')
			.style('font-size', '12px')
			.style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
			.style('z-index', '1000')
			.style('pointer-events', 'none');

		// Draw nodes
		const node = svg
			.append('g')
			.selectAll('circle')
			.data(networkData.nodes)
			.join('circle')
			.attr('r', (d) => sizeScale(d.usage))
			.attr('fill', (d) => colorScale(d.avgVotes))
			.attr('stroke', 'hsl(var(--surface))')
			.attr('stroke-width', 2)
			.style('cursor', 'grab')
			.on('mouseover', function (event, d) {
				d3.select(this).attr('stroke-width', 3);
				tooltip
					.style('visibility', 'visible')
					.html(
						`
						<div style="color: hsl(var(--ink)); min-width: 150px;">
							<div style="font-weight: 600; margin-bottom: 4px;">${d.id}</div>
							<div style="margin-bottom: 4px;">
								<span style="color: hsl(var(--ink-muted));">Used:</span> ${d.usage} times
							</div>
							<div>
								<span style="color: hsl(var(--ink-muted));">Avg votes:</span> ${d.avgVotes.toFixed(1)}
							</div>
						</div>
					`
					)
					.style('left', event.pageX + 10 + 'px')
					.style('top', event.pageY - 10 + 'px');
			})
			.on('mousemove', function (event) {
				tooltip.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px');
			})
			.on('mouseout', function () {
				d3.select(this).attr('stroke-width', 2);
				tooltip.style('visibility', 'hidden');
			})
			.call(
				d3
					.drag<SVGCircleElement, NetworkNode>()
					.on('start', dragstarted)
					.on('drag', dragged)
					.on('end', dragended) as any
			);

		// Add labels
		const label = svg
			.append('g')
			.selectAll('text')
			.data(networkData.nodes)
			.join('text')
			.text((d) => (d.id.length > 12 ? d.id.substring(0, 12) + '...' : d.id))
			.attr('font-size', 10)
			.attr('fill', 'currentColor')
			.attr('text-anchor', 'middle')
			.attr('dy', '.35em')
			.style('pointer-events', 'none')
			.style('user-select', 'none')
			.style('font-weight', '500');

		// Update positions on tick
		simulation.on('tick', () => {
			link
				.attr('x1', (d: any) => d.source.x)
				.attr('y1', (d: any) => d.source.y)
				.attr('x2', (d: any) => d.target.x)
				.attr('y2', (d: any) => d.target.y);

			node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

			label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
		});

		function dragstarted(event: any) {
			if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
			event.subject.fx = event.subject.x;
			event.subject.fy = event.subject.y;
		}

		function dragged(event: any) {
			event.subject.fx = event.x;
			event.subject.fy = event.y;
		}

		function dragended(event: any) {
			if (!event.active && simulation) simulation.alphaTarget(0);
			event.subject.fx = null;
			event.subject.fy = null;
		}
	}

	onMount(() => {
		if (responses.length > 0) {
			calculateNetwork();
			renderNetwork();
		}

		// Re-render on window resize
		const handleResize = () => renderNetwork();
		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
			if (simulation) simulation.stop();
		};
	});

	onDestroy(() => {
		if (simulation) {
			simulation.stop();
		}
	});
</script>

<div class="card-influence-network">
	<h3 class="mb-4 text-lg font-semibold text-ink">{title}</h3>
	{#if networkData.nodes.length === 0}
		<div class="flex h-96 items-center justify-center text-center text-ink-muted">
			<div>
				<div class="mb-2 text-4xl">🕸️</div>
				<div class="text-sm">Card connections will appear here</div>
				<div class="text-xs">Use multiple cards together to see their relationships</div>
			</div>
		</div>
	{:else}
		<div bind:this={chartContainer} class="relative w-full" style="min-height: {height}px;" />
		<div class="mt-4 grid grid-cols-3 gap-4 text-center">
			<div class="rounded-lg border border-line bg-surface-muted p-3">
				<div class="text-2xl font-bold text-brand">{networkData.nodes.length}</div>
				<div class="text-xs text-ink-muted">Cards in Network</div>
			</div>
			<div class="rounded-lg border border-line bg-surface-muted p-3">
				<div class="text-2xl font-bold text-brand">{networkData.links.length}</div>
				<div class="text-xs text-ink-muted">Connections</div>
			</div>
			<div class="rounded-lg border border-line bg-surface-muted p-3">
				<div class="text-2xl font-bold text-brand">
					{networkData.links.length > 0
						? (
								networkData.links.reduce((sum, l) => sum + l.strength, 0) /
								networkData.links.length
							).toFixed(1)
						: 0}
				</div>
				<div class="text-xs text-ink-muted">Avg Co-use</div>
			</div>
		</div>
		<div class="mt-4 text-center text-xs text-ink-muted">
			💡 Tip: Drag nodes to explore connections. Node size = usage frequency, color = average
			votes
		</div>
	{/if}
</div>

<style>
	.card-influence-network {
		width: 100%;
	}
</style>
