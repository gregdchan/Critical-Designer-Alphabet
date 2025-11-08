<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { browser } from '$app/environment';

	export let onComplete: () => void = () => {};
	export let role: 'facilitator' | 'participant' = 'participant';

	let currentStep = 0;
	let isVisible = true;

	const participantSteps = [
		{
			title: 'Welcome to Design Thinking',
			description:
				'This collaborative platform helps you explore critical design thinking through the pluriversal lens of the Critical Designer Alphabet.',
			icon: '👋',
			tips: [
				'Your contributions shape the collective vision',
				'Use cards to deepen your critical perspective',
				'Engage with others through voting and discussion'
			]
		},
		{
			title: 'Critical Designer Alphabet Cards',
			description:
				'Cards introduce concepts like pluriversality, decolonization, and design justice. Reference them in your responses to earn points and badges.',
			icon: '🎴',
			tips: [
				'Browse cards by category or search',
				'Select up to 5 cards per response',
				'AI can suggest relevant cards (if enabled)',
				'Unlock more cards by participating actively'
			]
		},
		{
			title: 'Contribute & Collaborate',
			description:
				'Share your ideas, vote on contributions, and engage in real-time chat to build collective understanding.',
			icon: '💡',
			tips: [
				'Respond to prompts with thoughtful contributions',
				'Vote for ideas that resonate with you',
				'Use the timeline to organize ideas (Now/Next/Later)',
				'Chat with other participants for deeper discussion'
			]
		},
		{
			title: 'Earn Badges & Points',
			description:
				'Your participation is recognized through badges and points. Quality contributions earn more rewards than quantity alone.',
			icon: '🏆',
			tips: [
				'16 badges available for different achievements',
				'Card-based badges reward critical thinking depth',
				'Quality badges value thoughtful contributions',
				'Check the leaderboard to see your progress'
			]
		},
		{
			title: 'Privacy & Settings',
			description:
				'You control your data and privacy. Export, delete, or anonymize your contributions at any time.',
			icon: '🔒',
			tips: [
				'Enable anonymous voting if desired',
				'Export your data anytime (JSON or CSV)',
				'Request data deletion (GDPR compliant)',
				'Opt out of leaderboard if you prefer'
			]
		}
	];

	const facilitatorSteps = [
		{
			title: 'Welcome, Facilitator',
			description:
				'Guide your team through collaborative design thinking with powerful facilitation tools and real-time insights.',
			icon: '🎯',
			tips: [
				'Manage session phases and timing',
				'Award special recognition to participants',
				'Monitor equity and participation balance',
				'Export data for post-session analysis'
			]
		},
		{
			title: 'Session Management',
			description:
				'Control the flow of your workshop with phased questions, timed reflection periods, and status tracking.',
			icon: '⚙️',
			tips: [
				'Set session status: Planned → Live → Done',
				'Use phases to structure the workshop',
				'Enable reflection timers for deeper thinking',
				'Monitor real-time participation pulse'
			]
		},
		{
			title: 'Award Recognition',
			description:
				'Celebrate outstanding contributions with facilitator awards that grant bonus points and visibility.',
			icon: '🏅',
			tips: [
				'5 special awards: Inspiring, Best Question, Team Player, Innovation, Bridge Builder',
				'Award points range from 40-55 per badge',
				'Recognition appears in leaderboard and participant profiles',
				'Use awards to reinforce workshop values'
			]
		},
		{
			title: 'Analytics & Insights',
			description:
				'Access advanced visualizations showing card impact, participation equity, and engagement patterns.',
			icon: '📊',
			tips: [
				'View Card Impact chart to see which concepts resonate',
				'Monitor Participation Equity with Gini coefficient',
				'Track real-time engagement pulse',
				'Analyze card influence networks and journeys'
			]
		},
		{
			title: 'Export & Share',
			description:
				'Export session data, generate reports, and share insights with your team after the workshop.',
			icon: '📤',
			tips: [
				'Download participant data (with consent)',
				'Export visualizations as images',
				'Generate summary reports',
				'Share session code for async participation'
			]
		}
	];

	$: steps = role === 'facilitator' ? facilitatorSteps : participantSteps;
	$: currentStepData = steps[currentStep];
	$: isFirstStep = currentStep === 0;
	$: isLastStep = currentStep === steps.length - 1;

	function nextStep() {
		if (isLastStep) {
			markOnboardingComplete();
			onComplete();
			isVisible = false;
		} else {
			currentStep += 1;
		}
	}

	function previousStep() {
		if (currentStep > 0) {
			currentStep -= 1;
		}
	}

	function skip() {
		markOnboardingComplete();
		onComplete();
		isVisible = false;
	}

	function markOnboardingComplete() {
		if (browser) {
			localStorage.setItem('cda:onboarding-completed', 'true');
		}
	}

	export function shouldShowOnboarding(): boolean {
		if (!browser) return false;
		return localStorage.getItem('cda:onboarding-completed') !== 'true';
	}
</script>

{#if isVisible}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-md"
		transition:fade={{ duration: 300 }}
	>
		<div
			class="relative w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-brand bg-surface shadow-2xl"
			transition:fly={{ y: 50, duration: 400 }}
		>
			<!-- Progress Bar -->
			<div class="h-1 bg-surface-muted">
				<div
					class="h-full bg-brand transition-all duration-300"
					style="width: {((currentStep + 1) / steps.length) * 100}%"
				/>
			</div>

			<!-- Content -->
			<div class="p-8">
				<!-- Icon & Title -->
				<div class="mb-6 text-center">
					<div class="mb-4 text-6xl" role="img" aria-label={currentStepData.title}>
						{currentStepData.icon}
					</div>
					<h2 class="mb-2 text-3xl font-bold text-ink">{currentStepData.title}</h2>
					<p class="text-lg text-ink-muted">{currentStepData.description}</p>
				</div>

				<!-- Tips List -->
				<div class="mb-8 rounded-xl border border-line bg-surface-muted p-6">
					<h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
						Key Points
					</h3>
					<ul class="space-y-3">
						{#each currentStepData.tips as tip, index}
							<li
								class="flex gap-3"
								in:fly={{ x: -20, delay: index * 100 }}
							>
								<span class="text-brand">✓</span>
								<span class="flex-1 text-ink">{tip}</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Navigation -->
				<div class="flex items-center justify-between gap-4">
					<!-- Progress Dots -->
					<div class="flex gap-2">
						{#each steps as _, index}
							<button
								on:click={() => (currentStep = index)}
								class="h-2 w-2 rounded-full transition-all"
								class:bg-brand={index === currentStep}
								class:w-8={index === currentStep}
								class:bg-line={index !== currentStep}
								aria-label="Go to step {index + 1}"
							/>
						{/each}
					</div>

					<!-- Buttons -->
					<div class="flex gap-3">
						{#if !isFirstStep}
							<button
								on:click={previousStep}
								class="rounded-lg border border-line bg-surface px-6 py-2 font-medium text-ink transition hover:bg-surface-elevated"
							>
								← Back
							</button>
						{/if}

						{#if !isLastStep}
							<button
								on:click={skip}
								class="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-surface-elevated"
							>
								Skip Tour
							</button>
						{/if}

						<button
							on:click={nextStep}
							class="rounded-lg bg-brand px-8 py-2 font-semibold text-white transition hover:bg-brand/90"
						>
							{isLastStep ? "Let's Go! 🚀" : 'Next →'}
						</button>
					</div>
				</div>

				<!-- Step Counter -->
				<div class="mt-4 text-center text-sm text-ink-muted">
					Step {currentStep + 1} of {steps.length}
				</div>
			</div>
		</div>
	</div>
{/if}
