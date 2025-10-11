<script lang="ts">
	import { pack, hierarchy } from 'd3-hierarchy';
	import { select } from 'd3-selection';
	import ChartFrame from '$lib/components/charts/ChartFrame.svelte';
	import { getThemeColors } from '$lib/utils/colors';

	export type Idea = {
		id: string;
		label: string;
		votes: number;
		participantId?: string | null;
		participantName?: string | null;
		lens?: string | null;
	};

	export type PhaseIdeas = { phase: string; items: Idea[] };

	export let title = 'Top Ideas by Phase';
	export let data: PhaseIdeas[] = [];
	export let highlightParticipantId: string | null = null;

	let rootEl: SVGGElement;
	let tooltipEl: HTMLDivElement | null = null;

	const theme = getThemeColors();

	function render(root: SVGGElement, innerWidth: number, innerHeight: number) {
		const g = select(root);
		g.selectAll('*').remove();
		if (!data.length) return;

		const phases = data.map((d) => d.phase);
		const cols = innerWidth < 640 ? 1 : innerWidth < 900 ? 2 : 3;
		const cellGap = 16;
		const cellWidth = Math.floor((innerWidth - cellGap * (cols - 1)) / cols);
		const rows = Math.ceil(phases.length / cols);
		const cellHeight = Math.floor((innerHeight - cellGap * (rows - 1)) / Math.max(1, rows));

		data.forEach((phaseData, idx) => {
			const col = idx % cols;
			const row = Math.floor(idx / cols);
			const x0 = col * (cellWidth + cellGap);
			const y0 = row * (cellHeight + cellGap);

			const cell = g.append('g').attr('transform', `translate(${x0},${y0})`);
			// background
			cell
				.append('rect')
				.attr('width', cellWidth)
				.attr('height', cellHeight)
				.attr('fill', 'hsl(var(--surface-muted))')
				.attr('rx', 10);

			// title
			cell
				.append('text')
				.attr('x', 10)
				.attr('y', 18)
				.attr('fill', 'hsl(var(--text-primary))')
				.style('font-size', '12px')
				.style('font-weight', '600')
				.text(phaseData.phase);

			// bubble pack area
			const radiusPad = 6;
			const contentWidth = cellWidth - 20;
			const contentHeight = cellHeight - 26;
			const cx = x0 + cellWidth / 2;
			const cy = y0 + cellHeight / 2 + 6;

			// build hierarchy for pack
			const root = hierarchy<any>({ children: phaseData.items })
				.sum((d: any) => Math.max(1, d.votes))
				.sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0));

			const p = pack<any>().size([contentWidth, contentHeight]).padding(radiusPad);
			p(root);

			const local = g.append('g').attr('transform', `translate(${x0 + 10},${y0 + 22})`);
			const nodes = local
				.selectAll('g.node')
				.data(root.leaves())
				.join('g')
				.attr('class', 'node')
				.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

			nodes
				.append('circle')
				.attr('r', (d: any) => d.r)
				.attr('fill', (_d: any, i: number) => theme.chart[i % theme.chart.length])
				.attr('opacity', (d: any) =>
					highlightParticipantId
						? d.data.participantId === highlightParticipantId
							? 0.95
							: 0.2
						: 0.85
				)
				.attr('stroke', (d: any) =>
					highlightParticipantId && d.data.participantId === highlightParticipantId
						? theme.brand
						: 'hsl(var(--surface-elevated))'
				)
				.attr('stroke-width', (d: any) =>
					highlightParticipantId && d.data.participantId === highlightParticipantId ? 3 : 2
				)
				.style('cursor', 'pointer')
				.on('mousemove', (event: MouseEvent, d: any) => {
					if (!tooltipEl) return;
					tooltipEl.style.opacity = '1';
					tooltipEl.style.left = event.pageX + 8 + 'px';
					tooltipEl.style.top = event.pageY + 8 + 'px';
					const pct = (() => {
						const total = phaseData.items.reduce((s, it) => s + (Number(it.votes) || 0), 0) || 1;
						return ((d.data.votes / total) * 100).toFixed(1);
					})();
					tooltipEl.innerHTML = `
            <div style="font-weight:700;margin-bottom:4px;">${title}</div>
            <div><strong>Phase:</strong> ${phaseData.phase}</div>
            <div style="max-width:260px"><strong>Idea:</strong> ${d.data.label}</div>
            <div><strong>Votes:</strong> ${d.data.votes} <span style="opacity:.8">(${pct}%)</span></div>
            ${d.data.participantName ? `<div style=\"opacity:.85\">by ${d.data.participantName}</div>` : ''}
          `;
				})
				.on('mouseleave', () => tooltipEl && (tooltipEl.style.opacity = '0'));

			// labels inside circles (truncate)
			nodes
				.append('text')
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'middle')
				.attr('fill', 'white')
				.style('font-weight', '600')
				.style('font-size', '11px')
				.style('pointer-events', 'none')
				.text((d: any) => {
					const maxChars = Math.max(3, Math.floor(d.r / 3));
					return (
						(d.data.label || '').slice(0, maxChars) +
						((d.data.label || '').length > maxChars ? '…' : '')
					);
				});
		});
	}
</script>

<ChartFrame {title} ariaLabel="Top ideas by phase" let:innerWidth let:innerHeight>
	<g bind:this={rootEl}>
		{@html (render(rootEl, innerWidth, innerHeight), '')}
	</g>
	<div
		slot="tooltip"
		bind:this={tooltipEl}
		style="position:fixed;opacity:0;pointer-events:none;background:hsl(var(--surface-elevated));border:1px solid hsl(var(--brand));border-radius:8px;padding:8px 10px;font-size:12px;color:hsl(var(--text-primary));box-shadow:0 6px 18px hsl(var(--brand) / 0.15);max-width:300px"
	/>
</ChartFrame>
