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
			shadowClass: 'hover:shadow-neon-cyan'
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

<section class="rounded-lg border border-slate-600 bg-slate-800 px-8 py-12 shadow-lg">
	<div class="grid gap-12 lg:grid-cols-2">
		<div class="space-y-8">
			<div class="space-y-6">
				<span
					class="inline-flex items-center gap-2 rounded-md bg-blue-600/10 border border-blue-500/20 px-3 py-1.5 text-sm text-blue-400"
				>
					<Sparkles class="h-4 w-4" />
					Inclusive Planning Platform
				</span>
				<h1 class="text-3xl font-bold leading-tight text-slate-100 sm:text-4xl">
					Critical Designer Alphabet
				</h1>
				<p class="max-w-2xl text-lg text-slate-300 leading-relaxed">
					A collaborative planning platform for inclusive design thinking. Create live sessions,
					explore design cards, and visualize insights through interactive data storytelling.
				</p>
				<div class="flex flex-wrap items-center gap-4">
					<a
						class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
						href="/session"
					>
						Start Session
					</a>
					<a
						class="inline-flex items-center gap-2 rounded-md border border-slate-600 px-6 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-slate-100"
						href="/cards"
					>
						Browse Cards
					</a>
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-3">
				{#each arcadeMetrics as metric}
					<div
						class="rounded-lg border border-slate-600 bg-slate-700 px-5 py-4 transition hover:bg-slate-600"
					>
						<p class="text-sm text-slate-400">{metric.label}</p>
						<p class="mt-2 text-2xl font-semibold text-slate-100">{metric.value}</p>
					</div>
				{/each}
			</div>
		</div>

		<div class="rounded-lg border border-slate-600 bg-slate-800 p-6">
			<h2 class="text-lg font-semibold text-slate-100 mb-6">Session Features</h2>
			<div class="space-y-4">
				{#each playModes as mode}
					<div class="flex gap-4 rounded-lg border border-slate-600 bg-slate-700 p-4">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400"
						>
							<svelte:component this={mode.icon} class="h-5 w-5" />
						</div>
						<div>
							<p class="text-sm font-medium text-slate-100">{mode.title}</p>
							<p class="mt-1 text-sm text-slate-400">{mode.copy}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<section class="mt-16 rounded-[2.5rem] border border-white/10 bg-midnight/80 px-6 py-12 sm:px-10">
	<div class="flex flex-col gap-10 lg:flex-row">
		<div class="flex-1 space-y-6">
			<h2 class="font-retro text-xl uppercase tracking-[0.4em] text-neonCyan">
				Gamified Justice Loop
			</h2>
			<p class="max-w-xl text-sm text-white/70">
				Every session weaves inclusive design prompts with celebratory motion. Earn neon points for
				equitable moves, unlock collaborative badges, and let Motion One drive micro-animations that
				keep energy high without sacrificing accessibility.
			</p>
			<ul class="space-y-4 text-xs uppercase tracking-[0.25em] text-white/60">
				<li class="flex items-center gap-3 text-neonPink">
					<span class="h-2 w-8 rounded-full bg-neonPink" /> Generative positionality prompts &amp; remixable
					steps
				</li>
				<li class="flex items-center gap-3 text-neonCyan">
					<span class="h-2 w-8 rounded-full bg-neonCyan" /> Dynamic timer grid with pulse, shake, and
					team sync
				</li>
				<li class="flex items-center gap-3 text-neonLime">
					<span class="h-2 w-8 rounded-full bg-neonLime" /> Retro badges plus justice-centered mini-challenges
				</li>
			</ul>
		</div>
		<div class="flex-1 space-y-5">
			<div
				class="rounded-[1.75rem] border border-white/10 bg-midnight/90 p-6 shadow-[0_0_38px_rgba(0,255,247,0.1)]"
			>
				<h3 class="font-techno text-sm uppercase tracking-[0.3em] text-white">Badge Deck</h3>
				<p class="mt-2 text-xs text-white/60">Stack accolades for inclusive facilitation feats.</p>
				<div class="mt-6 grid gap-4 md:grid-cols-3">
					{#each badgeDeck as badge}
						<div
							class="rounded-xl border border-neonCyan/20 bg-black/60 px-4 py-5 text-xs text-white/70 shadow-neon-cyan"
						>
							<p class="font-retro text-[0.65rem] uppercase tracking-[0.35em] text-neonCyan">
								{badge.title}
							</p>
							<p class="mt-3 text-[0.65rem] leading-relaxed text-white/60">{badge.description}</p>
						</div>
					{/each}
				</div>
			</div>
			<div
				class="rounded-[1.75rem] border border-neonPink/30 bg-neonPink/10 px-6 py-5 text-xs uppercase tracking-[0.25em] text-neonPink shadow-neon-pink"
			>
				Motion icons, Supabase presence pulses, and Sanity-powered multilingual prompts keep—or
				bit-crush—the status quo.
			</div>
		</div>
	</div>
</section>

<section class="mt-16 rounded-[2.5rem] border border-white/10 bg-midnight/75 px-6 py-12 sm:px-10">
	<div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
		<div class="space-y-5">
			<h2 class="font-retro text-xl uppercase tracking-[0.4em] text-neonLime">
				Inclusive Arcade Checklist
			</h2>
			<p class="text-sm text-white/70">
				WCAG 2.2 AA contrast, keyboard-only controls, reduced motion toggles, and translation-ready
				content make every neon flourish purposeful.
			</p>
			<ul class="space-y-3 text-xs uppercase tracking-[0.3em] text-white/70">
				<li>Sanity i18n fields for prompts + descriptions</li>
				<li>RTL-friendly layout utilities &amp; logical spacing</li>
				<li>Focus-visible neon rings &amp; skip navigation</li>
				<li>Supabase RLS policies for safe collaboration</li>
			</ul>
		</div>
		<div
			class="rounded-[2rem] border border-white/10 bg-black/70 p-6 shadow-[0_0_35px_rgba(255,42,173,0.12)]"
		>
			<h3 class="font-techno text-sm uppercase tracking-[0.3em] text-neonPink">Retro Ops</h3>
			<div class="mt-4 space-y-4 text-xs text-white/65">
				<p>
					<strong>Supabase Realtime:</strong> presence, broadcast, neon avatars, synchronized prompts.
				</p>
				<p>
					<strong>Sanity Studio:</strong> retro themes, achievements, and localized card prompts.
				</p>
				<p>
					<strong>Export:</strong> neon PDF + markdown summaries for session retros and sharing.
				</p>
			</div>
		</div>
	</div>
</section>
