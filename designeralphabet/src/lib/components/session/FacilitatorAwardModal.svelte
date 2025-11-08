<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { FACILITATOR_AWARD_TYPES, type Participant } from '$lib/gamification';

	export let isOpen = false;
	export let participants: Participant[] = [];
	export let currentFacilitatorName = '';
	export let onAward: (participantId: string, awardTypeId: string) => void = () => {};
	export let onClose: () => void = () => {};

	let selectedParticipant: string | null = null;
	let selectedAwardType: string | null = null;

	$: eligibleParticipants = participants.filter((p) => p.role !== 'facilitator');

	function handleAward() {
		if (!selectedParticipant || !selectedAwardType) {
			alert('Please select both a participant and an award type.');
			return;
		}
		onAward(selectedParticipant, selectedAwardType);
		resetForm();
		onClose();
	}

	function resetForm() {
		selectedParticipant = null;
		selectedAwardType = null;
	}

	function handleClose() {
		resetForm();
		onClose();
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 200 }}
	>
		<!-- Backdrop -->
		<div
			class="absolute inset-0 bg-ink/60 backdrop-blur-sm"
			on:click={handleClose}
			on:keydown={(e) => e.key === 'Escape' && handleClose()}
			role="button"
			tabindex="0"
			aria-label="Close award modal"
		/>

		<!-- Modal -->
		<div
			class="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
			transition:fly={{ y: 50, duration: 300 }}
		>
			<!-- Header -->
			<div class="border-b border-line bg-surface-muted px-6 py-4">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-2xl font-bold text-ink">🏆 Award Recognition</h2>
						<p class="text-sm text-ink-muted">Recognize outstanding contributions</p>
					</div>
					<button
						on:click={handleClose}
						class="rounded-lg border border-line bg-surface px-4 py-2 font-medium text-ink transition hover:border-line-strong hover:bg-surface-muted"
					>
						Close
					</button>
				</div>
			</div>

			<!-- Content -->
			<div class="overflow-y-auto p-6" style="max-height: calc(90vh - 180px);">
				<div class="space-y-6">
					<!-- Select Participant -->
					<div>
						<label class="mb-2 block text-sm font-semibold text-ink">
							Select Participant
						</label>
						<div class="grid gap-3 sm:grid-cols-2">
							{#each eligibleParticipants as participant}
								<button
									class="group relative overflow-hidden rounded-xl border-2 p-4 text-left transition"
									class:border-brand={selectedParticipant === participant.id}
									class:bg-brand/10={selectedParticipant === participant.id}
									class:border-line={selectedParticipant !== participant.id}
									class:bg-surface-muted={selectedParticipant !== participant.id}
									on:click={() => (selectedParticipant = participant.id)}
								>
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
											style="background-color: {participant.color}"
										>
											{participant.name.charAt(0).toUpperCase()}
										</div>
										<div class="flex-1">
											<div class="font-semibold text-ink">{participant.name}</div>
											<div class="text-xs text-ink-muted">{participant.points} points</div>
										</div>
										{#if selectedParticipant === participant.id}
											<div class="text-brand">✓</div>
										{/if}
									</div>
								</button>
							{/each}
						</div>
						{#if eligibleParticipants.length === 0}
							<div class="py-8 text-center text-ink-muted">
								<div class="text-2xl">👥</div>
								<div class="text-sm">No participants to award yet</div>
							</div>
						{/if}
					</div>

					<!-- Select Award Type -->
					<div>
						<label class="mb-2 block text-sm font-semibold text-ink"> Select Award Type </label>
						<div class="space-y-3">
							{#each FACILITATOR_AWARD_TYPES as award}
								<button
									class="group relative w-full overflow-hidden rounded-xl border-2 p-4 text-left transition"
									class:border-brand={selectedAwardType === award.id}
									class:bg-brand/10={selectedAwardType === award.id}
									class:border-line={selectedAwardType !== award.id}
									class:bg-surface-muted={selectedAwardType !== award.id}
									on:click={() => (selectedAwardType = award.id)}
								>
									<div class="flex items-start gap-4">
										<div
											class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-2xl"
											style="background-color: {award.color}20; color: {award.color}"
										>
											{award.icon}
										</div>
										<div class="flex-1">
											<div class="flex items-center gap-2">
												<div class="font-bold text-ink" style="color: {award.color}">
													{award.name}
												</div>
												<span class="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-medium text-brand">
													+{award.points} pts
												</span>
											</div>
											<div class="mt-1 text-sm text-ink-muted">{award.description}</div>
										</div>
										{#if selectedAwardType === award.id}
											<div class="text-brand">✓</div>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="border-t border-line bg-surface-muted px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="text-sm text-ink-muted">
						{#if selectedParticipant && selectedAwardType}
							{@const participant = eligibleParticipants.find((p) => p.id === selectedParticipant)}
							{@const award = FACILITATOR_AWARD_TYPES.find((a) => a.id === selectedAwardType)}
							Ready to award <span class="font-semibold text-ink">{award?.name}</span> to
							<span class="font-semibold text-ink">{participant?.name}</span>
						{:else}
							Select a participant and award type to continue
						{/if}
					</div>
					<button
						on:click={handleAward}
						disabled={!selectedParticipant || !selectedAwardType}
						class="rounded-lg bg-brand px-6 py-2 font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Award Recognition
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
