<script lang="ts">
	import {
		IconStar as Sparkles,
		IconUsers as Users,
		IconMessage as MessageSquare
	} from '@tabler/icons-svelte';

	const arcadeMetrics = [
		{
			label: 'Inclusive prompts',
			value: '142',
			valueClass: 'text-neonPink',
			shadowClass: 'hover:shadow-neon-pink'
		},
		{
			label: 'Live collab rooms',
			value: '32',
			valueClass: 'text-neonCyan',
			shadowClass: 'hover:shadow-brand'
		},
		{
			label: 'Unlocked badges',
			value: '580',
			valueClass: 'text-neonLime',
			shadowClass: 'hover:shadow-neon-lime'
		}
	];

	const playModes = [
		{
			title: 'Retro Session Engine',
			copy: 'Co-create in synchronized stages with neon timers, shared decks, and positionality prompts that keep justice centered.',
			icon: Sparkles,
			accent: 'from-neonPink via-retroPurple to-neonCyan'
		},
		{
			title: 'Arcade Chat',
			copy: 'Drop pixel-emoji reactions, collaborate in real-time chat threads, and keep the vibe inclusive with moderated prompts.',
			icon: MessageSquare,
			accent: 'from-neonCyan via-neonLime to-retroPurple'
		},
		{
			title: 'Presence Radar',
			copy: 'See teammates pop in as neon avatars, pair up for side quests, and keep the tempo with gamified facilitators controls.',
			icon: Users,
			accent: 'from-retroPurple via-neonPink to-neonLime'
		}
	];

	const badgeDeck = [
		{
			title: 'Neon Connector',
			description:
				'Link three or more justice lenses in one story and watch your neon multiplier kick in.'
		},
		{
			title: 'Critical Thinker',
			description:
				'Finish Positionality + Justice steps without skipping, and unlock a shimmering cyan flourish.'
		},
		{
			title: 'Retro Hero',
			description: 'Hold the room from start to finish—no missed stages, no skipped voices.'
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
					<Sparkles class="h-4 w-4" />
					Inclusive Planning Platform
				</span>
				<h1 class="text-3xl font-bold leading-tight text-ink sm:text-4xl">
					Critical Designer Planner
				</h1>
				<p class="max-w-2xl text-lg leading-relaxed text-ink-2">
					Facilitate justice-centered design sessions with inclusive prompts, real-time
					collaboration, and gamified interactions that make every voice heard.
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
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-3">
				{#each arcadeMetrics as metric}
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
			<h2 class="mb-6 text-lg font-semibold text-ink">Session Features</h2>
			<div class="space-y-4">
				{#each playModes as mode}
					<div class="flex gap-4 rounded-lg border border-line bg-surface-elevated p-4">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-brand"
						>
							<svelte:component this={mode.icon} class="h-5 w-5" />
						</div>
						<div>
							<p class="text-sm font-medium text-ink">{mode.title}</p>
							<p class="mt-1 text-sm text-ink-2">{mode.copy}</p>
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
				Critical Design Engagement Loop
			</h2>
			<p class="max-w-xl text-sm text-ink-2">
				This platform empowers teams to surface, explore, and engage in strategic conversations around critical design. Through deeply inclusive prompts and collaborative tools, teams can co-create, share values, and address concerns in real time.
			</p>
			<ul class="space-y-4 text-xs uppercase tracking-[0.25em] text-ink-2">
				<li class="flex items-center gap-3 text-rose-500">
					<span class="h-2 w-8 rounded-full bg-rose-400" /> Adaptive prompts that spark meaningful, justice-centered dialogue
				</li>
				<li class="flex items-center gap-3 text-brand">
					<span class="h-2 w-8 rounded-full bg-brand" /> Gamified design stages to encourage inclusive participation
				</li>
				<li class="flex items-center gap-3 text-emerald-500">
					<span class="h-2 w-8 rounded-full bg-emerald-400" /> Achievement badges for surfacing shared values and addressing issues
				</li>
			</ul>
		</div>
		<div class="flex-1 space-y-5">
			<div
				class="surface rounded-[1.75rem] p-6 shadow-lg"
			>
				<h3 class="font-techno text-sm uppercase tracking-[0.3em] text-ink">Badge Deck</h3>
				<p class="mt-2 text-xs text-ink-2">Earn recognition for inclusive facilitation and strategic co-creation.</p>
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
				class="rounded-[1.75rem] border border-rose-200 bg-rose-50 px-6 py-5 text-xs uppercase tracking-[0.25em] text-rose-500 shadow-sm"
			>
				Real-time collaboration, multilingual support, and accessible design help teams break through barriers and co-create with intention.
			</div>
		</div>
	</div>
</section>

<section class="surface mt-16 rounded-[2.5rem] px-6 py-12 sm:px-10">
	<div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
		<div class="space-y-5">
			<h2 class="font-retro text-xl uppercase tracking-[0.4em] text-emerald-500">
				Inclusive Planning Checklist
			</h2>
			<p class="text-sm text-ink-2">
				Designed for accessibility and inclusion, this tool ensures every voice is heard and every idea is valued throughout the design process.
			</p>
			<ul class="space-y-3 text-xs uppercase tracking-[0.3em] text-ink-2">
				<li>Multilingual prompts and descriptions</li>
				<li>Right-to-left language support</li>
				<li>Clear focus indicators and keyboard navigation</li>
				<li>Secure, transparent team collaboration</li>
			</ul>
		</div>
		<div
			class="surface rounded-[2rem] p-6 shadow-lg"
		>
			<h3 class="font-techno text-sm uppercase tracking-[0.3em] text-rose-500">
				Platform Features
			</h3>
			<div class="mt-4 space-y-4 text-xs text-ink-2">
				<p class="leading-relaxed">
					<strong class="text-ink">Facilitated Collaboration:</strong> Teams explore ideas, themes, and concerns together with real-time feedback and shared prompts.
				</p>
				<p class="leading-relaxed">
					<strong class="text-ink">Strategic Co-Creation:</strong> Gamified sessions, achievement badges, and inclusive design challenges drive engagement and shared understanding.
				</p>
				<p class="leading-relaxed">
					<strong class="text-ink">Insightful Summaries:</strong> Export session insights to support ongoing change management and design planning.
				</p>
			</div>
		</div>
	</div>
</section>
