<script lang="ts">
	import {
		IconExternalLink as ExternalLink,
		IconScale as Scale,
		IconHeart as Heart,
		IconUsers as Users
	} from '@tabler/icons-svelte';
</script>

<svelte:head>
	<title>Credits & Attribution - Critical Design Planner</title>
	<meta
		name="description"
		content="Credits and attribution for the Critical Design Planner workshop platform."
	/>
</svelte:head>

<div class="space-y-16 max-w-5xl mx-auto px-4 py-12">
	<!-- Header -->
	<header class="text-center mb-10">
		<h1 class="text-5xl font-extrabold text-primary mb-3 tracking-tight">Credits & Attribution</h1>
		<p class="text-lg text-secondary max-w-2xl mx-auto">
			Recognizing the foundations, creators, and communities that inspire the Critical Design Planner.
		</p>
	</header>

	<!-- Intellectual Foundations -->
	<section class="panel p-8 rounded-2xl shadow-lg bg-white/80">
		<div class="flex items-center gap-5 mb-6">
			<div class="flex h-14 w-14 items-center justify-center rounded-xl bg-brand/15 text-brand">
				<Scale class="h-7 w-7" />
			</div>
			<div>
				<h2 class="text-2xl font-bold text-primary mb-1">Intellectual Foundations</h2>
				<p class="text-secondary text-base">
					Inspired by <strong>The Designer's Critical Alphabet</strong> by <span class="text-brand font-medium">Dr. Lesley-Ann Noel</span>
				</p>
			</div>
		</div>
		<div class="space-y-4 text-secondary text-base">
			<p>
				The Critical Design Planner builds on the concepts introduced in <strong>The Designer's Critical Alphabet</strong>, a card deck created by <span class="text-brand font-medium">Dr. Lesley-Ann Noel</span>—Dean of Design at OCAD University and advocate for inclusive, justice-centered design.
			</p>
			<p>
				Her work encourages designers to reflect on power, bias, sustainability, and justice. The digital platform adapts these prompts for collaborative, real-time workshops.
			</p>
			<div class="flex flex-wrap gap-4 mt-6">
				<a
					href="https://www.ocadu.ca/academics/explore-faculty/lnoel"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 text-brand hover:text-neon-pink transition-colors font-medium"
				>
					OCADU Profile <ExternalLink class="h-4 w-4" />
				</a>
				<a
					href="https://linkedin.com/in/lesleyannnoel?originalSubdomain=ca"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 text-brand hover:text-neon-pink transition-colors font-medium"
				>
					LinkedIn <ExternalLink class="h-4 w-4" />
				</a>
			</div>
		</div>
	</section>

	<!-- Platform Credits -->
	<section class="panel p-8 rounded-2xl shadow-lg bg-white/80">
		<div class="flex items-center gap-5 mb-6">
			<div class="flex h-14 w-14 items-center justify-center rounded-xl bg-retro-purple/15 text-retro-purple">
				<Users class="h-7 w-7" />
			</div>
			<div>
				<h2 class="text-2xl font-bold text-primary mb-1">About the Platform</h2>
				<p class="text-secondary text-base">Critical Design Planner – digital facilitation & gamified workshops</p>
			</div>
		</div>
		<div class="space-y-4 text-secondary text-base">
			<p>
				Designed and developed by <span class="font-medium text-retro-purple">Gregory D. Chan</span>, this platform transforms the Critical Alphabet into an interactive, real-time workshop tool for design thinking and policy innovation.
			</p>
			<ul class="list-disc list-inside space-y-2 ml-4">
				<li>Facilitator dashboard for session setup and rules</li>
				<li>Live participant input and breakout sessions</li>
				<li>Gamified scoring, badges, and engagement</li>
				<li>Real-time group insights and data visualizations</li>
				<li>Templates for organizational strategy and policy design</li>
			</ul>
		</div>
	</section>

	<!-- Licensing -->
	<section class="panel p-8 rounded-2xl shadow-lg bg-white/80">
		<div class="flex items-center gap-5 mb-6">
			<div class="flex h-14 w-14 items-center justify-center rounded-xl bg-pastel-orange/20 text-pastel-orange">
				<Scale class="h-7 w-7" />
			</div>
			<div>
				<h2 class="text-2xl font-bold text-primary mb-1">Licensing & Attribution</h2>
				<p class="text-secondary text-base">Please respect intellectual property and attribution</p>
			</div>
		</div>
		<div class="space-y-4">
			<div class="surface-muted border border-brand/30 rounded-lg p-4 text-brand">
				<strong>The Designer's Critical Alphabet</strong> (physical deck) is the intellectual property of Dr. Lesley-Ann Noel. Always credit her when referencing or using the original cards.
			</div>
			<div class="surface-muted border border-retro-purple/30 rounded-lg p-4 text-retro-purple">
				Critical Design Planner web application &copy; Gregory D. Chan. All rights reserved.
			</div>
			<ul class="space-y-2 text-secondary text-base mt-2">
				<li>• Do not copy, distribute, or commercialize this platform without permission.</li>
				<li>• Workshops using the physical deck must acknowledge Dr. Noel as creator.</li>
			</ul>
		</div>
	</section>

	<!-- Resources -->
	<section class="panel p-8 rounded-2xl shadow-lg bg-white/80">
		<div class="flex items-center gap-5 mb-6">
			<div class="flex h-14 w-14 items-center justify-center rounded-xl bg-pastel-green/30 text-pastel-green">
				<Heart class="h-7 w-7" />
			</div>
			<div>
				<h2 class="text-2xl font-bold text-primary mb-1">🌍 Resources for Inclusive & Pluriversal Design</h2>
				<p class="text-secondary text-base">
					Communities and networks advancing justice-centered design
				</p>
			</div>
		</div>
		<div class="grid gap-8 md:grid-cols-2">
			<div class="space-y-5">
				<ResourceCard
					title="Pluriversal Design SIG"
					desc="A global community exploring pluriversal approaches to design research and education."
					url="https://pluriversal.design"
					border="border-brand"
				/>
				<ResourceCard
					title="Design Justice Network"
					desc="Principles and practices centering marginalized voices in design."
					url="https://designjustice.org"
					border="border-neon-pink"
				/>
				<ResourceCard
					title="Liberatory Design"
					desc="Tools and mindsets for resisting oppression and fostering equitable collaboration."
					url="https://www.design.school/liberatory-design"
					border="border-neon-lime"
				/>
				<ResourceCard
					title="Decolonising Design Group"
					desc="Scholarly and activist perspectives on decolonial and pluriversal approaches to design."
					url="https://decolonisingdesign.org"
					border="border-retro-purple"
				/>
			</div>
			<div class="space-y-5">
				<ResourceCard
					title="World Design Organization (WDO)"
					desc="International hub supporting socially responsible design practices."
					url="https://wdo.org"
					border="border-brand"
				/>
				<ResourceCard
					title="Pluriversal Radio / Medium"
					desc="Essays and conversations on design for a world of many worlds."
					url="https://medium.com/pluriversal-design"
					border="border-pastel-orange"
				/>
				<ResourceCard
					title="Global Pluralism & Design"
					desc="Broader resource on pluralism and inclusive approaches that can inspire design practice."
					url="https://www.pluralism.ca"
					border="border-brand"
				/>
			</div>
		</div>
	</section>

	<!-- Acknowledgements -->
	<section class="panel bg-gradient-to-r from-brand/10 to-retro-purple/10 p-8 rounded-2xl shadow-lg">
		<h2 class="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
			<Heart class="h-7 w-7 text-neon-pink" />
			Acknowledgements
		</h2>
		<div class="space-y-3 text-secondary text-base">
			<p>
				<span class="font-medium text-brand">Dr. Lesley-Ann Noel</span> — for the original Critical Alphabet and her leadership in inclusive design.
			</p>
			<p>
				<span class="font-medium">Design Justice Network, Liberatory Design, Pluriversal Design SIG, Decolonising Design Group</span> — for frameworks and research shaping equity-centered practice.
			</p>
			<p>
				<span class="font-medium">Open-source communities</span> — SvelteKit, TailwindCSS, D3.js, MariaDB.
			</p>
		</div>
		<div class="mt-8 pt-6 border-t border-brand/30">
			<p class="text-center text-secondary italic">
				✨ The Critical Design Planner is an original digital platform by Gregory D. Chan, inspired by pluriversal and inclusive design theory, and the foundational work of Dr. Lesley-Ann Noel.
			</p>
		</div>
	</section>
</div>

<!-- ResourceCard component (inline for brevity, or move to a separate file if preferred) -->
<script lang="ts">
	export let title: string;
	export let desc: string;
	export let url: string;
	export let border: string;
</script>

<!-- Only render ResourceCard if props are present (for inline use) -->
{#if title && desc && url && border}
	<div class={`border-l-4 ${border} pl-4`}>
		<h3 class="font-semibold text-primary mb-1">{title}</h3>
		<p class="text-sm text-secondary mb-2">{desc}</p>
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-1 text-brand hover:text-neon-pink text-sm font-medium"
		>
			{url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
			<ExternalLink class="h-3 w-3" />
		</a>
	</div>
{/if}
