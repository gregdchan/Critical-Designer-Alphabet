<script lang="ts">
	import {
		IconUsers as Users,
		IconMessage as MessageSquare,
		IconChecklist as Checklist
	} from '@tabler/icons-svelte';

	const metrics = [
		{
			label: 'Inclusive prompts',
			value: '142'
		},
		{
			label: 'Active collaboration spaces',
			value: '32'
		},
		{
			label: 'Recognition badges earned',
			value: '580'
		}
	];

	const features = [
		{
			title: 'Collaborative Planning',
			copy: 'Facilitate real-time, accessible planning sessions where every voice is valued and equity is prioritized.',
			icon: Users
		},
		{
			title: 'Justice-Informed Dialogue',
			copy: 'Guide teams through structured prompts and reflection tools that center justice and inclusion in every decision.',
			icon: MessageSquare
		},
		{
			title: 'Strategic Action Mapping',
			copy: 'Transform insights into actionable strategies with transparent tracking and shared accountability.',
			icon: Checklist
		}
	];

	const badgeDeck = [
		{
			title: 'Equity Advocate',
			description:
				'Champion inclusive practices and ensure marginalized perspectives are centered in planning.'
		},
		{
			title: 'Justice Facilitator',
			description:
				'Lead sessions that surface systemic barriers and co-create solutions for lasting impact.'
		},
		{
			title: 'Collaborative Strategist',
			description: 'Foster open dialogue and collective ownership of design outcomes.'
		}
	];
</script>

<section class="surface rounded-3xl px-8 py-12 shadow-xl">
	<div class="grid gap-12 lg:grid-cols-2">
		<div class="space-y-8">
			<div class="space-y-6">
				<span
					class="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-brand"
				>
					<Checklist class="h-4 w-4" />
					Inclusive Design Planning Tool
				</span>
				<h1 class="text-3xl font-bold leading-tight text-ink sm:text-4xl">
					Equity-Focused Strategy Facilitator
				</h1>
				<p class="max-w-2xl text-lg leading-relaxed text-ink-2">
					Empower your team to plan, reflect, and act with intention. This platform supports justice-informed design, inclusive facilitation, and transparent collaboration for equitable outcomes.
				</p>
				<div class="flex flex-wrap items-center gap-4">
					<a
						class="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
						href="/session"
					>
						Start Planning
					</a>
					<a
						class="inline-flex items-center gap-2 rounded-md border border-line px-6 py-3 text-sm font-medium text-ink-2 transition hover:bg-surface-muted hover:text-ink"
						href="/cards"
					>
						Explore Prompts
					</a>
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-3">
				{#each metrics as metric}
					<div
						class="surface-muted rounded-lg px-5 py-4 transition hover:shadow-sm"
					>
						<p class="text-sm text-ink-2">{metric.label}</p>
						<p class="mt-2 text-2xl font-semibold text-ink">{metric.value}</p>
					</div>
				{/each}
			</div>
		</div>

		<div class="surface rounded-3xl p-6">
			<h2 class="mb-6 text-lg font-semibold text-ink">Key Features</h2>
			<div class="space-y-4">
				{#each features as feature}
					<div class="flex gap-4 rounded-lg border border-line bg-surface-elevated p-4">
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

<section class="surface mt-16 rounded-[2.5rem] px-6 py-12 sm:px-10">
	<div class="flex flex-col gap-10 lg:flex-row">
		<div class="flex-1 space-y-6">
			<h2 class="font-retro text-xl uppercase tracking-[0.4em] text-brand">
				Justice-Centered Engagement Loop
			</h2>
			<p class="max-w-xl text-sm text-ink-2">
				Support your team in surfacing lived experiences, exploring equity challenges, and co-creating strategies for meaningful change. Our tools foster open dialogue, shared learning, and collective action.
			</p>
			<ul class="space-y-4 text-xs uppercase tracking-[0.25em] text-ink-2">
				<li class="flex items-center gap-3 text-blue-600">
					<span class="h-2 w-8 rounded-full bg-blue-400" /> Adaptive prompts for equity-focused conversations
				</li>
				<li class="flex items-center gap-3 text-brand">
					<span class="h-2 w-8 rounded-full bg-brand" /> Collaborative facilitation and transparent decision-making
				</li>
				<li class="flex items-center gap-3 text-emerald-600">
					<span class="h-2 w-8 rounded-full bg-emerald-400" /> Recognition for inclusive leadership and shared progress
				</li>
			</ul>
		</div>
		<div class="flex-1 space-y-5">
			<div
				class="surface rounded-[1.75rem] p-6 shadow-lg"
			>
				<h3 class="font-techno text-sm uppercase tracking-[0.3em] text-ink">Recognition Badges</h3>
				<p class="mt-2 text-xs text-ink-2">Celebrate inclusive facilitation, equity advocacy, and collaborative strategy.</p>
				<div class="mt-6 grid gap-4 md:grid-cols-3">
					{#each badgeDeck as badge}
						<div
							class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-5 text-xs text-ink-2 shadow-sm"
						>
							<p class="font-retro text-[0.65rem] uppercase tracking-[0.35em] text-brand">
								{badge.title}
							</p>
							<p class="mt-3 text-[0.65rem] leading-relaxed text-ink-2">{badge.description}</p>
						</div>
					{/each}
				</div>
			</div>
			<div
				class="rounded-[1.75rem] border border-blue-200 bg-blue-50 px-6 py-5 text-xs uppercase tracking-[0.25em] text-blue-600 shadow-sm"
			>
				Real-time collaboration, multilingual support, and accessible design empower teams to co-create with purpose and equity.
			</div>
		</div>
	</div>
</section>

<section class="surface mt-16 rounded-[2.5rem] px-6 py-12 sm:px-10">
	<div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
		<div class="space-y-5">
			<h2 class="font-retro text-xl uppercase tracking-[0.4em] text-emerald-600">
				Inclusive Planning Checklist
			</h2>
			<p class="text-sm text-ink-2">
				Designed for accessibility and equity, this tool ensures all perspectives are valued and every idea is considered throughout the design process.
			</p>
			<ul class="space-y-3 text-xs uppercase tracking-[0.3em] text-ink-2">
				<li>Multilingual prompts and resources</li>
				<li>Right-to-left language support</li>
				<li>Clear focus indicators and keyboard navigation</li>
				<li>Secure, transparent team collaboration</li>
			</ul>
		</div>
		<div
			class="surface rounded-[2rem] p-6 shadow-lg"
		>
			<h3 class="font-techno text-sm uppercase tracking-[0.3em] text-blue-600">
				Platform Capabilities
			</h3>
			<div class="mt-4 space-y-4 text-xs text-ink-2">
				<p class="leading-relaxed">
					<strong class="text-ink">Facilitated Collaboration:</strong> Teams explore ideas, challenges, and opportunities together with real-time feedback and inclusive prompts.
				</p>
				<p class="leading-relaxed">
					<strong class="text-ink">Strategic Co-Creation:</strong> Structured sessions, recognition badges, and equity-focused challenges drive engagement and shared understanding.
				</p>
				<p class="leading-relaxed">
					<strong class="text-ink">Insightful Summaries:</strong> Export session insights to support ongoing equity work and strategic planning.
				</p>
			</div>
		</div>
	</div>
</section>
