<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { Badge } from '$lib/gamification';

	export let badge: Badge | null = null;
	export let onDismiss: () => void = () => {};

	let showConfetti = false;

	$: if (badge) {
		showConfetti = true;
		// Auto-dismiss after 5 seconds
		setTimeout(() => {
			onDismiss();
		}, 5000);
	}

	function handleDismiss() {
		showConfetti = false;
		onDismiss();
	}

	// Confetti particle positions
	const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
		id: i,
		x: Math.random() * 100,
		y: Math.random() * 100,
		rotation: Math.random() * 360,
		scale: 0.5 + Math.random() * 0.5,
		delay: Math.random() * 200
	}));
</script>

{#if badge}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 200 }}
	>
		<!-- Backdrop -->
		<div
			class="absolute inset-0 bg-ink/60 backdrop-blur-sm"
			on:click={handleDismiss}
			on:keydown={(e) => e.key === 'Escape' && handleDismiss()}
			role="button"
			tabindex="0"
			aria-label="Close notification"
		/>

		<!-- Badge card -->
		<div
			class="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border-2 bg-surface shadow-2xl"
			style="border-color: {badge.color}"
			transition:fly={{ y: 50, duration: 400, easing: quintOut }}
		>
			<!-- Confetti animation -->
			{#if showConfetti}
				<div class="absolute inset-0 overflow-hidden pointer-events-none">
					{#each confettiParticles as particle}
						<div
							class="absolute w-2 h-2 rounded-full animate-confetti"
							style="
								left: {particle.x}%;
								top: -10%;
								background-color: {badge.color};
								opacity: 0.8;
								transform: rotate({particle.rotation}deg) scale({particle.scale});
								animation-delay: {particle.delay}ms;
							"
						/>
					{/each}
				</div>
			{/if}

			<!-- Content -->
			<div class="relative p-8 text-center">
				<!-- Header -->
				<div class="mb-4">
					<div class="mb-2 text-sm font-medium uppercase tracking-wider text-ink-muted">
						Badge Unlocked!
					</div>
					<div class="mb-4 text-6xl" role="img" aria-label={badge.name}>
						{badge.icon}
					</div>
				</div>

				<!-- Badge info -->
				<h3 class="mb-2 text-2xl font-bold text-ink" style="color: {badge.color}">
					{badge.name}
				</h3>
				<p class="mb-4 text-base text-ink-muted">
					{badge.description}
				</p>

				<!-- Points badge -->
				<div class="mb-6 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2">
					<span class="text-sm font-medium text-ink-muted">Earned</span>
					<span class="text-xl font-bold text-brand">+{badge.points}</span>
					<span class="text-sm font-medium text-ink-muted">points</span>
				</div>

				<!-- Dismiss button -->
				<button
					on:click={handleDismiss}
					class="w-full rounded-lg border border-line bg-surface-muted px-6 py-3 font-medium text-ink transition hover:border-line-strong hover:bg-surface"
				>
					Continue
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes confetti {
		0% {
			transform: translateY(0) rotate(0deg) scale(1);
			opacity: 1;
		}
		100% {
			transform: translateY(100vh) rotate(720deg) scale(0.5);
			opacity: 0;
		}
	}

	.animate-confetti {
		animation: confetti 3s ease-out forwards;
	}
</style>
