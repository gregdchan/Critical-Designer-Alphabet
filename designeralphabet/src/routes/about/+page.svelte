<script lang="ts">
	import {
		IconStar,
		IconUsers,
		IconChartBar,
		IconMessageCircle,
		IconLifebuoy
	} from '@tabler/icons-svelte';
	import type { PageContent } from '$lib/pages';

	export let data: {
		page: PageContent | null;
		error?: string;
	};

	const page = data.page;

	const heroTitle =
		page?.heroTitle ?? page?.title ?? 'About the Critical Designer Alphabet Platform';
	const heroSubtitle =
		page?.heroSubtitle ??
		page?.localizedHeroSubtitle?.en ??
		page?.localizedHeroSubtitle?.fr ??
		'A collaborative workshop environment inspired by The Designer’s Critical Alphabet and built for inclusive design teams.';

	function toParagraphs(text?: string | null) {
		if (!text) return [] as string[];
		return text
			.split(/\n+/)
			.map((entry) => entry.trim())
			.filter(Boolean);
	}

	const summaryParagraphs = toParagraphs(page?.summaryText ?? page?.localizedSummary?.en);

	type SectionShape = {
		title: string;
		subtitle?: string;
		body: string[];
		bullets?: string[];
		accent?: keyof typeof accentStyles;
		icon?: typeof IconStar;
	};

	const fallbackSections: SectionShape[] = [
		{
			title: 'Mission & Origins',
			subtitle: 'Fusing academic insight with multiplayer facilitation',
			body: [
				'This platform translates The Designer’s Critical Alphabet into an interactive, digital experience—preserving Dr. Lesley-Ann Noel’s justice-centered prompts while extending them into modern collaboration tooling.',
				'We focus on accessibility, multilingual content, and the ability for teams to examine power, bias, and representation together in real time.'
			],
			accent: 'blue',
			icon: IconStar
		},
		{
			title: 'Facilitator Experience',
			subtitle: 'Guided sessions, flexible rules, tailored outcomes',
			body: [
				'Facilitators orchestrate stages, prompts, and card decks with clear guardrails. Timers, reminders, and progress signals keep groups aligned without sacrificing reflection time.'
			],
			bullets: [
				'Session templates tuned for policy, service, and strategy sprints',
				'Room codes, lobby management, and participant presence tracking',
				'Real-time adjustments to cadence, scoring, and breakout prompts'
			],
			accent: 'purple',
			icon: IconUsers
		},
		{
			title: 'Shared Insights & Data',
			subtitle: 'Ground decisions in transparent, equitable evidence',
			body: [
				'Participants contribute stories, risks, and opportunities which are logged in MariaDB and surfaced through accessible data visualizations. Every insight is traceable back to the cards and voices that inspired it.'
			],
			bullets: [
				'D3-driven heatmaps and scoreboards tuned for dark-mode clarity',
				'Exportable summaries for retro, PDF, or markdown handoffs',
				'Integrations with Sanity for content governance and localization'
			],
			accent: 'cyan',
			icon: IconChartBar
		},
		{
			title: 'Inclusive Practice & Community',
			subtitle: 'Supporting pluriversal, justice-centered design cultures',
			body: [
				'Our workflow centers equitable participation—roles, presence avatars, chat moderation, and badges reward practices that amplify marginalized perspectives.'
			],
			bullets: [
				'Keyboard-first navigation and WCAG AA color contrast baseline',
				'Localized prompts with RTL-friendly layout options',
				'Gamified achievements that celebrate collective, not individual, wins'
			],
			accent: 'amber',
			icon: IconMessageCircle
		},
		{
			title: 'Support & Next Steps',
			subtitle: 'Built and maintained by Gregory D. Chan',
			body: [
				'Need workshop guidance or partnership? Reach out to co-create facilitation roadmaps, integrate the platform into your organization, or explore bespoke justice-centered engagements.'
			],
			bullets: [
				'Email: hello@criticalalphabet.app',
				'Updates and roadmap: dashboard notifications & design system page',
				'Attribution: Always credit Dr. Lesley-Ann Noel for the original deck'
			],
			accent: 'emerald',
			icon: IconLifebuoy
		}
	];

	const accentStyles = {
		blue: {
			header: 'bg-blue-600/20 text-blue-300',
			border: 'border-blue-500/40'
		},
		purple: {
			header: 'bg-purple-600/20 text-purple-300',
			border: 'border-purple-500/40'
		},
		cyan: {
			header: 'bg-cyan-600/20 text-cyan-300',
			border: 'border-cyan-500/40'
		},
		amber: {
			header: 'bg-amber-600/20 text-amber-300',
			border: 'border-amber-500/40'
		},
		emerald: {
			header: 'bg-emerald-600/20 text-emerald-300',
			border: 'border-emerald-500/40'
		}
	} as const;

	const icons = [IconStar, IconUsers, IconChartBar, IconMessageCircle, IconLifebuoy] as const;

	const pageSections: SectionShape[] | undefined = page?.sections?.map((section, index) => ({
		title: section.title ?? fallbackSections[index]?.title ?? `Section ${index + 1}`,
		subtitle: section.eyebrow ?? fallbackSections[index]?.subtitle,
		body: toParagraphs(section.bodyText) ?? fallbackSections[index]?.body ?? [],
		bullets: fallbackSections[index]?.bullets,
		accent:
			(section.accentColor as keyof typeof accentStyles | undefined) ??
			fallbackSections[index]?.accent,
		icon: fallbackSections[index]?.icon ?? icons[index % icons.length]
	}));

	const sections = (pageSections?.length ? pageSections : fallbackSections).map(
		(section, index) => {
			const accent = section.accent ?? fallbackSections[index]?.accent ?? 'blue';
			const icon = section.icon ?? fallbackSections[index]?.icon ?? icons[index % icons.length];
			return {
				...section,
				accent,
				icon,
				styles: accentStyles[accent as keyof typeof accentStyles]
			};
		}
	);
</script>

<svelte:head>
	<title>About - Critical Designer Alphabet</title>
	<meta
		name="description"
		content="Learn how the Critical Designer Alphabet platform extends Dr. Lesley-Ann Noel’s work into an interactive, justice-centered workshop environment."
	/>
</svelte:head>

<div class="space-y-12">
   <div class="text-center space-y-4">
	   <h1 class="text-4xl font-bold text-primary">{heroTitle}</h1>
	   <p class="text-lg text-secondary max-w-3xl mx-auto">{heroSubtitle}</p>
	   {#if summaryParagraphs.length}
		   <div class="max-w-3xl mx-auto space-y-2 text-secondary">
			   {#each summaryParagraphs as paragraph}
				   <p>{paragraph}</p>
			   {/each}
		   </div>
	   {:else if data.error}
		   <p class="text-sm text-amber-300">{data.error}</p>
	   {/if}
   </div>

   {#each sections as section, index}
	   <section
		   class={`panel p-8 ${section.styles?.border ?? ''}`}
	   >
		   <div class="flex items-start gap-4 mb-6">
			   <div
				   class={`flex h-12 w-12 items-center justify-center rounded-lg ${section.styles?.header ?? 'bg-neon-cyan/20 text-neon-cyan'}`}
			   >
				   <svelte:component this={section.icon ?? icons[index % icons.length]} class="h-6 w-6" />
			   </div>
			   <div>
				   <h2 class="text-2xl font-semibold text-primary mb-2">{section.title}</h2>
				   {#if section.subtitle}
					   <p class="text-secondary">{section.subtitle}</p>
				   {/if}
			   </div>
		   </div>

		   <div class="space-y-4 text-secondary">
			   {#each section.body as paragraph}
				   <p>{paragraph}</p>
			   {/each}

			   {#if section.bullets?.length}
				   <ul class="list-disc list-inside space-y-2 ml-4 text-secondary">
					   {#each section.bullets as bullet}
						   <li>{bullet}</li>
					   {/each}
				   </ul>
			   {/if}
		   </div>
	   </section>
   {/each}
</div>
