<script lang="ts">
	import {
		IconLayoutDashboard,
		IconUsers,
		IconMessage,
		IconChartBar,
		IconStar,
		IconStar as IconSparkle,
		IconActivity
	} from '@tabler/icons-svelte';

	const corePalette = [
		{
			token: 'primary',
			label: 'Primary Blue',
			value: '#3b82f6',
			usage: 'Primary buttons, highlights',
			swatch: 'bg-[#3b82f6]'
		},
		{
			token: 'secondary',
			label: 'Secondary Violet',
			value: '#8b5cf6',
			usage: 'Charts, secondary CTAs',
			swatch: 'bg-[#8b5cf6]'
		},
		{
			token: 'accent',
			label: 'Accent Cyan',
			value: '#06b6d4',
			usage: 'Inputs, borders, data viz',
			swatch: 'bg-[#06b6d4]'
		},
		{
			token: 'success',
			label: 'Success Emerald',
			value: '#10b981',
			usage: 'Positive confirmations',
			swatch: 'bg-[#10b981]'
		},
		{
			token: 'warning',
			label: 'Warning Amber',
			value: '#f59e0b',
			usage: 'Timers, alerts',
			swatch: 'bg-[#f59e0b]'
		},
		{
			token: 'error',
			label: 'Error Rose',
			value: '#ef4444',
			usage: 'Destructive actions',
			swatch: 'bg-[#ef4444]'
		}
	];

	const neutralPalette = [
		{
			token: 'surface',
			label: 'Surface Slate 800',
			value: '#1e293b',
			usage: 'Cards, hero shells',
			swatch: 'bg-slate-800'
		},
		{
			token: 'surface-alt',
			label: 'Surface Slate 900',
			value: '#0f172a',
			usage: 'Application background',
			swatch: 'bg-slate-900'
		},
		{
			token: 'border',
			label: 'Border Slate 600',
			value: '#475569',
			usage: 'Container outlines',
			swatch: 'bg-slate-600'
		},
		{
			token: 'text-primary',
			label: 'Text Primary',
			value: '#f8fafc',
			usage: 'Headings & key copy',
			swatch: 'bg-slate-100'
		},
		{
			token: 'text-secondary',
			label: 'Text Secondary',
			value: '#cbd5f5',
			usage: 'Paragraph + helper copy',
			swatch: 'bg-slate-400'
		}
	];

	const typography = [
		{
			label: 'Display / Hero',
			className: 'text-3xl font-semibold text-slate-100 sm:text-4xl',
			preview: 'Critical Designer Alphabet',
			usage: 'Hero titles, page headlines'
		},
		{
			label: 'Body / Base',
			className: 'text-base leading-relaxed text-slate-300',
			preview: 'A collaborative workshop platform for inclusive design thinking.',
			usage: 'Paragraph copy, supporting text'
		},
		{
			label: 'Mono / Data',
			className: 'font-mono text-sm uppercase tracking-widest text-slate-400',
			preview: 'SESSION · CODE · ZX3K82',
			usage: 'Room codes, statistics, chips'
		}
	];

	const statTiles = [
		{
			label: 'Inclusive prompts',
			value: '142',
			description: 'Published in Sanity',
			icon: IconLayoutDashboard
		},
		{
			label: 'Live rooms',
			value: '32',
			description: 'MariaDB tracked sessions',
			icon: IconUsers
		},
		{
			label: 'Unlocked badges',
			value: '580',
			description: 'Across facilitator teams',
			icon: IconStar
		}
	];

	const buttonVariants = [
		{
			name: 'Primary',
			className:
				'inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700',
			usage: 'Start Session, main CTAs'
		},
		{
			name: 'Secondary',
			className:
				'inline-flex items-center gap-2 rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white',
			usage: 'Alt actions, navigation'
		},
		{
			name: 'Ghost',
			className:
				'inline-flex items-center gap-2 rounded-md bg-slate-800/70 px-4 py-2 text-sm font-medium text-blue-300 transition hover:bg-slate-700',
			usage: 'Low-emphasis actions on dark surfaces'
		}
	];

	const cardTags = ['Justice', 'Agency', 'Community'];
</script>

<div class="space-y-16">
	<header class="rounded-lg border border-slate-600 bg-slate-800 px-8 py-12 shadow-lg">
		<div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
			<div class="space-y-6">
				<span
					class="inline-flex items-center gap-2 rounded-md border border-blue-500/20 bg-blue-600/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-blue-300"
				>
					<IconSparkle class="h-4 w-4" /> Design System Overview
				</span>
				<h1 class="text-3xl font-semibold text-slate-100 sm:text-4xl">
					Critical Designer Alphabet UI Kit
				</h1>
				<p class="max-w-2xl text-base leading-relaxed text-slate-300">
					This page mirrors the production experience—Inter-first typography, slate gradients,
					accessible blues, and session-focused interactions. Use it to snapshot current tokens,
					components, and layout patterns as we continue evolving the MariaDB-powered collaboration
					suite.
				</p>
				<div
					class="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-slate-400"
				>
					<span>Review · {new Date().toLocaleDateString()}</span>
					<span>Framework · SvelteKit + Tailwind</span>
					<span>Data · Sanity &amp; MariaDB</span>
				</div>
			</div>
			<div class="rounded-lg border border-slate-600 bg-slate-900/80 p-6 shadow-inner">
				<p class="text-sm font-semibold text-slate-100">Hero Snapshot</p>
				<p class="mt-3 text-sm text-slate-300">
					Primary CTAs sit on blue gradients, secondary actions use slate outlines, and supporting
					copy holds a 1.6 line height. This card matches the home hero shell for rapid visual QA.
				</p>
				<div class="mt-6 flex flex-wrap items-center gap-3">
					<span
						class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
						>Primary Action</span
					>
					<span
						class="inline-flex items-center gap-2 rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200"
					>
						Secondary Action
					</span>
				</div>
			</div>
		</div>
	</header>

	<section id="colors" class="rounded-lg border border-slate-700 bg-slate-900/90 p-8 shadow">
		<h2 class="text-lg font-semibold text-slate-100">Color Tokens</h2>
		<p class="mt-2 text-sm text-slate-400">
			Defined in <code class="code">tailwind.config.cjs</code>. Core palette leans on accessible
			blues and violets with legacy neon hues available when extra pop is required.
		</p>

		<div class="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
			{#each corePalette as swatch}
				<div class="rounded-lg border border-slate-700 bg-slate-800/80 p-5">
					<div class={`h-16 w-full rounded-md ${swatch.swatch}`} aria-hidden="true" />
					<p class="mt-4 text-sm font-medium text-slate-100">{swatch.label}</p>
					<p class="text-xs text-slate-400">
						Token <code class="code">{swatch.token}</code> · {swatch.value}
					</p>
					<p class="text-xs text-slate-500 mt-1">{swatch.usage}</p>
				</div>
			{/each}
		</div>

		<h3 class="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
			Neutrals &amp; Text
		</h3>
		<div class="mt-4 grid gap-4 md:grid-cols-3">
			{#each neutralPalette as swatch}
				<div class="rounded-lg border border-slate-700 bg-slate-800/80 p-4">
					<div class={`h-12 w-full rounded ${swatch.swatch}`} aria-hidden="true" />
					<p class="mt-3 text-sm font-medium text-slate-100">{swatch.label}</p>
					<p class="text-xs text-slate-500">{swatch.value}</p>
					<p class="text-xs text-slate-500 mt-1">{swatch.usage}</p>
				</div>
			{/each}
		</div>
	</section>

	<section
		class="grid gap-8 rounded-lg border border-slate-700 bg-slate-900/90 p-8 lg:grid-cols-[0.9fr_1.1fr]"
	>
		<div class="space-y-6">
			<h2 class="text-lg font-semibold text-slate-100">Typography</h2>
			<p class="text-sm text-slate-400">
				Inter is the primary stack; JetBrains Mono handles codes and data. Maintain 1.6 line-height
				for paragraphs and tighter headings for emphasis.
			</p>
			{#each typography as sample}
				<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-4">
					<p class="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
						{sample.label}
					</p>
					<p class={`mt-2 ${sample.className}`}>{sample.preview}</p>
					<p class="mt-2 text-xs text-slate-500">{sample.usage}</p>
				</div>
			{/each}
			<div class="rounded-lg border border-blue-500/30 bg-blue-600/10 p-4 text-xs text-blue-200">
				Fonts are loaded via Google Fonts in <code class="code">src/app.html</code>. Prefer
				<code class="code">font-semibold</code>
				for headings and <code class="code">font-medium</code> for body.
			</div>
		</div>

		<div class="space-y-6">
			<h2 class="text-lg font-semibold text-slate-100">Hero + Stat Composition</h2>
			<div class="rounded-lg border border-slate-700 bg-slate-800 p-6">
				<span
					class="inline-flex items-center gap-2 rounded-md border border-blue-500/20 bg-blue-600/10 px-3 py-1 text-xs font-medium text-blue-300"
				>
					Inclusive Planning Platform
				</span>
				<h3 class="mt-4 text-2xl font-semibold text-slate-100">Critical Designer Alphabet</h3>
				<p class="mt-3 text-sm text-slate-300 leading-relaxed">
					A collaborative planning platform for inclusive design thinking. Create real-time
					sessions, explore design cards, and visualize inclusive data.
				</p>
				<div class="mt-5 grid gap-3 sm:grid-cols-3">
					{#each statTiles as tile}
						<div class="rounded-md border border-slate-700 bg-slate-900/80 p-4">
							<div class="flex items-center gap-2 text-slate-400">
								<svelte:component this={tile.icon} class="h-4 w-4" />
								<span class="text-xs uppercase tracking-[0.2em]">{tile.label}</span>
							</div>
							<p class="mt-2 text-2xl font-semibold text-slate-100">{tile.value}</p>
							<p class="text-xs text-slate-500">{tile.description}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section class="rounded-lg border border-slate-700 bg-slate-900/90 p-8">
		<h2 class="text-lg font-semibold text-slate-100">Buttons &amp; Interactions</h2>
		<p class="mt-2 text-sm text-slate-400">
			Rounded-md corners align with cards and drawers. Shadows stay subtle to preserve legibility on
			dark backgrounds.
		</p>

		<div class="mt-6 grid gap-4 md:grid-cols-3">
			{#each buttonVariants as variant}
				<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-5 space-y-3">
					<span class="text-xs font-medium uppercase tracking-[0.2em] text-slate-400"
						>{variant.name}</span
					>
					<button type="button" class={variant.className}>{variant.name}</button>
					<p class="text-xs text-slate-500">{variant.usage}</p>
				</div>
			{/each}
		</div>

		<div class="mt-8 grid gap-6 lg:grid-cols-2">
			<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-6">
				<p class="text-sm font-semibold text-slate-200">Form Controls</p>
				<div class="mt-4 space-y-4 text-sm text-slate-300">
					<div>
						<label
							for="ds-session-code"
							class="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-400"
							>Session Code</label
						>
						<input
							id="ds-session-code"
							class="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 font-mono text-sm uppercase tracking-widest text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="ZX3K82"
						/>
					</div>
					<div>
						<label
							for="ds-select"
							class="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-400"
							>Lens</label
						>
						<select
							id="ds-select"
							class="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option>Justice</option>
							<option>Ethics</option>
							<option>Community</option>
						</select>
					</div>
				</div>
			</div>
			<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-6">
				<p class="text-sm font-semibold text-slate-200">Card Shell</p>
				<div class="mt-4 rounded-lg border border-slate-700 bg-slate-900/70 p-5">
					<div class="flex items-start gap-3">
						<span
							class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 font-mono text-sm text-blue-300"
							>A</span
						>
						<div class="flex-1">
							<p class="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Theory</p>
							<h3 class="text-lg font-semibold text-slate-100">Agency</h3>
							<p class="text-xs text-slate-500">Card ID · AGY-01</p>
						</div>
						<span class="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300"
							>Details</span
						>
					</div>
					<p class="mt-4 text-sm text-slate-300 leading-relaxed">
						Explore how power shows up in your product decisions and map pathways to redistribute
						agency across your team and stakeholders.
					</p>
					<div class="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
						{#each cardTags as tag}
							<span class="rounded-full border border-slate-600 px-3 py-1">{tag}</span>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="rounded-lg border border-slate-700 bg-slate-900/90 p-8">
		<h2 class="text-lg font-semibold text-slate-100">Layout Surfaces &amp; Patterns</h2>
		<div class="mt-6 grid gap-6 lg:grid-cols-3">
			<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-5">
				<IconLayoutDashboard class="h-5 w-5 text-blue-300" />
				<h3 class="mt-3 text-sm font-semibold text-slate-100">Container</h3>
				<p class="mt-2 text-xs text-slate-500">
					Max width 72rem, 24px horizontal padding, 64px top spacing.
				</p>
			</div>
			<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-5">
				<IconMessage class="h-5 w-5 text-cyan-300" />
				<h3 class="mt-3 text-sm font-semibold text-slate-100">Right Drawer</h3>
				<p class="mt-2 text-xs text-slate-500">
					Backdrop blur, slate 900 surface, 24px padding, toggled via <code class="code"
						>SimpleDrawer</code
					>.
				</p>
			</div>
			<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-5">
				<IconChartBar class="h-5 w-5 text-violet-300" />
				<h3 class="mt-3 text-sm font-semibold text-slate-100">Data Viz</h3>
				<p class="mt-2 text-xs text-slate-500">
					D3 charts use Accent Cyan glows and mono axis labels. Keep max drop shadow at 8px blur.
				</p>
			</div>
		</div>
	</section>

	<section class="rounded-lg border border-slate-700 bg-slate-900/90 p-8">
		<h2 class="text-lg font-semibold text-slate-100">Accessibility &amp; Motion</h2>
		<div class="mt-6 grid gap-6 md:grid-cols-3">
			<div class="rounded-lg border border-blue-500/30 bg-blue-600/10 p-5 text-xs text-blue-200">
				<IconActivity class="h-4 w-4" />
				<p class="mt-3 font-semibold text-blue-100">Focus States</p>
				<p class="mt-2 text-blue-100/80">
					Use <code class="code">focus-visible</code> utilities. Default ring: 2px blue with 2px offset
					on slate surfaces.
				</p>
			</div>
			<div class="rounded-lg border border-slate-700 bg-slate-800/80 p-5 text-xs text-slate-300">
				<p class="font-semibold text-slate-100">Motion</p>
				<p class="mt-2">
					Animations run under 200ms and respect reduced-motion. Use opacity/scale combos; avoid
					large translations.
				</p>
			</div>
			<div
				class="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-5 text-xs text-emerald-100"
			>
				<p class="font-semibold">Contrast</p>
				<p class="mt-2">
					Primary combinations meet WCAG AA on slate backgrounds. Accent cyan gradients include 60%
					transparency to guard contrast.
				</p>
			</div>
		</div>
	</section>
</div>
