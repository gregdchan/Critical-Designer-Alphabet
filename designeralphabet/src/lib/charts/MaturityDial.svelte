<script lang="ts">
	import { select } from 'd3-selection';
	import { arc } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';
	import { interpolate } from 'd3-interpolate';
	import BaseChart from './BaseChart.svelte';
	import { getMaturityColor, MATURITY_COLORS } from '$lib/utils/colors';
	import type { ChartDimensions } from '$lib/types/charts';

	export let roomCode: string;
	export let theme: 'dark' | 'light' = 'dark';
	export let width = 400;
	export let height = 400;
	export let maturityLevel = 3; // 1-5
	export let progress = 0.6; // 0-1 within current level

	let svgElement: SVGSVGElement | undefined;
	let dimensions: ChartDimensions | undefined;

	// Room code for future real-time integration
	$: if (roomCode) {
		// Future: Load real-time maturity data based on roomCode
		console.debug('MaturityDial for room:', roomCode);
	}

	// Maturity stages
	const stages = [
		{ level: 1, name: 'Foundational', description: 'Basic awareness' },
		{ level: 2, name: 'Developing', description: 'Early adoption' },
		{ level: 3, name: 'Proficient', description: 'Regular use' },
		{ level: 4, name: 'Advanced', description: 'Strategic integration' },
		{ level: 5, name: 'Aspirational', description: 'Innovation leadership' }
	];

	$: currentStage = stages[Math.max(0, Math.min(4, maturityLevel - 1))];

	function updateVisualization() {
		if (!svgElement || !dimensions) return;

		const { innerWidth, innerHeight } = dimensions;
		const radius = Math.min(innerWidth, innerHeight) / 2 - 20;
		const centerX = innerWidth / 2;
		const centerY = innerHeight / 2;

		// Arc generator
		const arcGenerator = arc()
			.innerRadius(radius * 0.6)
			.outerRadius(radius * 0.9)
			.cornerRadius(5);

		// Angle scale (240 degrees total, starting from bottom left)
		const angleScale = scaleLinear().domain([0, 5]).range([-2.4, 0.6]); // radians

		const chart = select(svgElement).select('.chart-content');

		// Remove existing elements
		chart.selectAll('*').remove();

		// Create background arcs for all stages
		chart
			.selectAll('.background-arc')
			.data(stages)
			.enter()
			.append('path')
			.attr('class', 'background-arc')
			.attr('transform', `translate(${centerX}, ${centerY})`)
			.attr('d', (d, i) => {
				return arcGenerator({
					startAngle: angleScale(i),
					endAngle: angleScale(i + 1),
					innerRadius: radius * 0.6,
					outerRadius: radius * 0.9
				});
			})
			.attr('fill', 'rgba(255, 255, 255, 0.1)')
			.attr('stroke', 'rgba(255, 255, 255, 0.2)')
			.attr('stroke-width', 1);

		// Create progress arcs
		const progressArcs = chart
			.selectAll('.progress-arc')
			.data(stages.slice(0, maturityLevel))
			.enter()
			.append('path')
			.attr('class', 'progress-arc')
			.attr('transform', `translate(${centerX}, ${centerY})`)
			.attr('fill', (d, i) => {
				if (i < maturityLevel - 1) {
					return MATURITY_COLORS[i];
				} else {
					// Current level - show progress
					return MATURITY_COLORS[i];
				}
			})
			.attr('stroke', (d, i) => MATURITY_COLORS[i])
			.attr('stroke-width', 2)
			.attr('filter', 'url(#neon-glow)')
			.attr('opacity', 0);

		// Animate progress arcs
		progressArcs
			.transition()
			.duration(1000)
			.delay((d, i) => i * 200)
			.attr('opacity', 1)
			.attrTween('d', (d, i) => {
				const startAngle = angleScale(i);
				const endAngle = angleScale(i + 1);

				let targetEndAngle = endAngle;
				if (i === maturityLevel - 1) {
					// Current level - animate to progress
					targetEndAngle = startAngle + (endAngle - startAngle) * progress;
				}

				const interpolateAngle = interpolate(startAngle, targetEndAngle);

				return (t: number) => {
					const result = arcGenerator({
						startAngle: startAngle,
						endAngle: interpolateAngle(t),
						innerRadius: radius * 0.6,
						outerRadius: radius * 0.9
					});
					return result || '';
				};
			});

		// Add stage labels
		const labels = chart
			.selectAll('.stage-label')
			.data(stages)
			.enter()
			.append('g')
			.attr('class', 'stage-label')
			.attr('transform', `translate(${centerX}, ${centerY})`);

		labels
			.append('text')
			.attr('class', 'stage-text')
			.attr('x', (_d, i) => {
				const angle = (angleScale(i) + angleScale(i + 1)) / 2;
				return Math.cos(angle) * radius * 1.1;
			})
			.attr('y', (_d, i) => {
				const angle = (angleScale(i) + angleScale(i + 1)) / 2;
				return Math.sin(angle) * radius * 1.1;
			})
			.attr('text-anchor', 'middle')
			.attr('fill', 'currentColor')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '12px')
			.attr('opacity', 0)
			.text((d) => d.name)
			.transition()
			.duration(500)
			.delay(1200)
			.attr('opacity', 1);

		// Center content
		const centerGroup = chart
			.append('g')
			.attr('class', 'center-content')
			.attr('transform', `translate(${centerX}, ${centerY})`);

		// Center circle
		centerGroup
			.append('circle')
			.attr('r', radius * 0.5)
			.attr('fill', 'rgba(0, 0, 0, 0.7)')
			.attr('stroke', getMaturityColor(maturityLevel))
			.attr('stroke-width', 3)
			.attr('filter', 'url(#neon-glow)')
			.attr('opacity', 0)
			.transition()
			.duration(500)
			.delay(1500)
			.attr('opacity', 1);

		// Current stage name
		centerGroup
			.append('text')
			.attr('class', 'current-stage')
			.attr('text-anchor', 'middle')
			.attr('dy', '-0.5em')
			.attr('fill', getMaturityColor(maturityLevel))
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '18px')
			.attr('font-weight', 'bold')
			.attr('opacity', 0)
			.text(currentStage.name)
			.transition()
			.duration(500)
			.delay(1800)
			.attr('opacity', 1);

		// Level indicator
		centerGroup
			.append('text')
			.attr('class', 'level-indicator')
			.attr('text-anchor', 'middle')
			.attr('dy', '0.5em')
			.attr('fill', 'currentColor')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '14px')
			.attr('opacity', 0)
			.text(`Level ${maturityLevel}`)
			.transition()
			.duration(500)
			.delay(2000)
			.attr('opacity', 1);

		// Progress percentage
		centerGroup
			.append('text')
			.attr('class', 'progress-text')
			.attr('text-anchor', 'middle')
			.attr('dy', '1.5em')
			.attr('fill', 'currentColor')
			.attr('font-family', 'Orbitron, sans-serif')
			.attr('font-size', '12px')
			.attr('opacity', 0)
			.text(`${Math.round(progress * 100)}% complete`)
			.transition()
			.duration(500)
			.delay(2200)
			.attr('opacity', 1);

		// Add pulsing animation to current level
		const currentArc = chart.select(`.progress-arc:nth-child(${maturityLevel + stages.length})`);

		function pulse() {
			currentArc
				.transition()
				.duration(1500)
				.attr('opacity', 0.6)
				.transition()
				.duration(1500)
				.attr('opacity', 1)
				.on('end', pulse);
		}

		setTimeout(pulse, 2500);
	}

	function handleResize(newDimensions: ChartDimensions) {
		dimensions = newDimensions;
		updateVisualization();
	}

	// Watch for changes to maturity data
	$: if (svgElement && dimensions) {
		updateVisualization();
	}
</script>

<BaseChart
	{width}
	{height}
	{theme}
	title="AI Maturity Level"
	className="maturity-dial-chart"
	ariaLabel={`AI Maturity gauge showing ${currentStage.name} level ${maturityLevel} at ${Math.round(progress * 100)}% completion`}
	on:resize={(event) => handleResize(event.detail)}
	on:mounted={() => updateVisualization()}
>
	<svelte:fragment slot="default" let:svgElement={svg} let:dimensions={dims}>
		{@const _ = svg && dims ? ((svgElement = svg), (dimensions = dims)) : null}
		<!-- SVG content is handled in updateVisualization -->
	</svelte:fragment>
</BaseChart>

<style>
	:global(.maturity-dial-chart .progress-arc) {
		transition: opacity 0.3s ease;
	}

	:global(.maturity-dial-chart .stage-text) {
		text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
	}

	:global(.maturity-dial-chart .current-stage) {
		text-shadow: 0 0 10px currentColor;
	}

	:global(.maturity-dial-chart .center-content circle) {
		filter: drop-shadow(0 0 10px currentColor);
	}
</style>
