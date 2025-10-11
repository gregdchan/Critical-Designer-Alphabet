<script lang="ts">
	import {
		IconStar as Sparkles,
		IconUsers as Users,
		IconMessage as MessageSquare
	} from '@tabler/icons-svelte';

	const platformMetrics = [
		{
			label: 'Design prompts',
			value: 'A-Z',
			valueClass: 'text-neonPink',
			shadowClass: 'hover:shadow-neon-pink'
		},
		{
			label: 'Chart types',
			value: '8+',
			valueClass: 'text-neonCyan',
			shadowClass: 'hover:shadow-brand'
		},
		{
			label: 'Real-time updates',
			value: '∞',
			valueClass: 'text-neonLime',
			shadowClass: 'hover:shadow-neon-lime'
		}
	];

	const coreFeatures = [
		{
			title: 'Phase-Based Sessions',
			copy: 'Structure workshops into clear phases with prompts, timers, and real-time participation tracking.',
			icon: Sparkles,
			accent: 'from-neonPink via-retroPurple to-neonCyan'
		},
		{
			title: 'Live Visualizations',
			copy: 'See ideas emerge through word clouds, bubble charts, and interactive data visualizations.',
			icon: MessageSquare,
			accent: 'from-neonCyan via-neonLime to-retroPurple'
		},
		{
			title: 'Participant Journeys',
			copy: 'Track individual contributions, voting patterns, and engagement across all phases.',
			icon: Users,
			accent: 'from-retroPurple via-neonPink to-neonLime'
		}
	];

	const badgeDeck = [
		{
			title: 'Active Contributor',
			description:
				'Share thoughtful responses across multiple phases and help build the collective knowledge base.'
		},
		{
			title: 'Critical Thinker',
			description:
				'Engage deeply with prompts, vote on key ideas, and help surface important perspectives.'
		},
		{
			title: 'Session Champion',
			description:
				'Facilitate sessions that bring together diverse voices and create space for justice-centered dialogue.'
		}
	];
</script>

<section class="surface rounded-3xl shadow-xl p-8">
	<div class="grid gap-8 lg:grid-cols-2">
		<div class="space-y-8">
			<div class="space-y-6">
				<span
					class="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-brand"
				>
					<Sparkles class="h-4 w-4" />
					Inclusive Planning Platform
				</span>
				<h1 class="text-3xl font-bold leading-tight text-ink sm:text-4xl">
					Critical Designer Alphabet
				</h1>
				<p class="max-w-2xl text-lg leading-relaxed text-ink-2">
					Facilitate justice-centered design workshops with phase-based sessions, real-time
					collaboration, and rich data visualizations that amplify every voice.
				</p>
				<div class="flex flex-wrap items-center gap-4">
					<a
						class="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
						href="/session"
					>
						Start Session
					</a>
					<a
						class="inline-flex items-center gap-2 rounded-md border border-line px-6 py-3 text-sm font-medium text-ink-2 transition hover:bg-surface-muted hover:text-ink"
						href="/cards"
					>
						Browse Cards
					</a>
					<a
						class="inline-flex items-center gap-2 rounded-md border border-line px-6 py-3 text-sm font-medium text-ink-2 transition hover:bg-surface-muted hover:text-ink"
						href="/story"
					>
						View Story Demo
					</a>
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-3">
				{#each platformMetrics as metric}
					<div class="surface-muted rounded-lg px-5 py-4 transition hover:shadow-sm">
						<p class="text-sm text-ink-2">{metric.label}</p>
						<p class="mt-2 text-2xl font-semibold text-ink">{metric.value}</p>
					</div>
				{/each}
			</div>
		</div>

		<div class="surface-elevated rounded-2xl p-6 border border-line">
			<h2 class="mb-6 text-lg font-semibold text-ink">Core Features</h2>
			<div class="space-y-4">
				{#each coreFeatures as feature}
					<div class="flex gap-4 rounded-lg border border-line bg-surface p-4">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-brand"
						>
							<svelte:component this={feature.icon} class="h-5 w-5" />
						</div>
						<div>
							<p class="text-sm font-medium text-ink">{feature.title}</p>
							<p class="mt-1 text-sm text-ink-2">{feature.copy}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<section class="surface mt-16 rounded-[2.5rem] p-8">
	<div class="flex flex-col gap-10 lg:flex-row">
		<div class="flex-1 space-y-6">
			<h2 class="font-retro text-xl uppercase tracking-[0.4em] text-brand">
				Workshop Flow
			</h2>
			<p class="max-w-xl text-sm text-ink-2">
				Guide participants through structured phases while capturing ideas, voting on priorities,
				and visualizing contributions in real-time.
			</p>
			<ul class="space-y-4 text-xs uppercase tracking-[0.25em] text-ink-2">
				<li class="flex items-center gap-3 text-rose-500">
					<span class="h-2 w-8 rounded-full bg-rose-400" /> Multiple input types: text responses,
					voting, ratings, and choices
				</li>
				<li class="flex items-center gap-3 text-brand">
					<span class="h-2 w-8 rounded-full bg-brand" /> Live charts: word clouds, bubble maps,
					and journey visualizations
				</li>
				<li class="flex items-center gap-3 text-emerald-500">
					<span class="h-2 w-8 rounded-full bg-emerald-400" /> Track individual participant stories
					and contributions across all phases
				</li>
			</ul>
		</div>
		<div class="flex-1 space-y-5">
			<div class="surface-elevated rounded-[1.75rem] p-6 shadow-lg border border-line">
				<h3 class="font-techno text-sm uppercase tracking-[0.3em] text-ink">Badge Deck</h3>
				<p class="mt-2 text-xs text-ink-2">
					Earn recognition for thoughtful facilitation and helpful collaboration.
				</p>
				<div class="mt-6 grid gap-4 md:grid-cols-3">
					{#each badgeDeck as badge}
						<div
							class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-5 text-xs text-ink-2 shadow-sm"
						>
							<p class="font-retro text-[0.45rem] uppercase tracking-[0.2em] text-brand break-words">
								{badge.title}
							</p>
							<p class="mt-3 text-[0.65rem] leading-relaxed text-ink-2">{badge.description}</p>
						</div>
					{/each}
				</div>
			</div>
			<div
				class="rounded-[1.75rem] border border-rose-200 bg-rose-50 px-6 py-5 text-xs uppercase tracking-[0.25em] text-rose-500 shadow-sm"
			>
				Based on Dr. Lesley-Ann Noel's Critical Design Alphabet—bringing justice-centered
				design practice to digital workshops.
			</div>
		</div>
	</div>
</section>

<section class="surface mt-16 rounded-[2.5rem] p-8">
	<div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
		<div class="space-y-5">
			<h2 class="font-retro text-xl uppercase tracking-[0.4em] text-emerald-500">
				Session Features
			</h2>
			<p class="text-sm text-ink-2">
				Built for facilitators: manage phases, track engagement, and visualize contributions
				as they happen in real-time.
			</p>
			<ul class="space-y-3 text-xs uppercase tracking-[0.3em] text-ink-2">
				<li>Phase-based structure with timer controls</li>
				<li>Multiple response types: text, voting, ratings, choices</li>
				<li>Live voting and idea prioritization</li>
				<li>Word clouds, bubble charts, and journey visualizations</li>
				<li>Individual participant story tracking</li>
				<li>Export session data (CSV/JSON)</li>
			</ul>
		</div>
		<div class="surface-elevated rounded-[2rem] p-6 shadow-lg border border-line">
			<h3 class="font-techno text-sm uppercase tracking-[0.3em] text-rose-500">
				Platform Capabilities
			</h3>
			<div class="mt-4 space-y-4 text-xs text-ink-2">
				<p class="leading-relaxed">
					<strong class="text-ink">Real-Time Visualizations:</strong> See ideas emerge through word clouds,
					bubble charts, bar/pie/line charts, and interactive phase comparisons.
				</p>
				<p class="leading-relaxed">
					<strong class="text-ink">Participant Journeys:</strong> Track each person's contributions,
					voting patterns, lens engagement, and phase-by-phase participation.
				</p>
				<p class="leading-relaxed">
					<strong class="text-ink">Export & Analysis:</strong> Download session data, response timelines,
					and voting results for reports and follow-ups.
				</p>
			</div>
		</div>
	</div>
</section>
