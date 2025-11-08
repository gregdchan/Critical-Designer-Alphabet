<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { Participant, Response, TimelineEntry } from '$lib/gamification';
	import { getLeaderboard } from '$lib/gamification';

	export let participants: Participant[] = [];
	export let responses: Response[] = [];
	export let timeline: TimelineEntry[] = [];
	export let currentParticipantId: string | null = null;
	export let isOpen: boolean = false;
	export let onClose: () => void = () => {};

	$: leaderboard = getLeaderboard(participants, responses, timeline);
	$: top5 = leaderboard.slice(0, 5);
	$: currentUserRank = leaderboard.findIndex((p) => p.id === currentParticipantId) + 1;
	$: currentUser = leaderboard.find((p) => p.id === currentParticipantId);
	$: showCurrentUser = currentUserRank > 5 && currentUser;

	function getRankIcon(rank: number): string {
		switch (rank) {
			case 1:
				return '🥇';
			case 2:
				return '🥈';
			case 3:
				return '🥉';
			default:
				return '🏅';
		}
	}

	function getRankColor(rank: number): string {
		switch (rank) {
			case 1:
				return '#fbbf24'; // gold
			case 2:
				return '#9ca3af'; // silver
			case 3:
				return '#cd7f32'; // bronze
			default:
				return '#6b7280'; // gray
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-40 flex items-center justify-center p-4"
		transition:fade={{ duration: 200 }}
	>
		<!-- Backdrop -->
		<div
			class="absolute inset-0 bg-ink/60 backdrop-blur-sm"
			on:click={onClose}
			on:keydown={(e) => e.key === 'Escape' && onClose()}
			role="button"
			tabindex="0"
			aria-label="Close leaderboard"
		/>

		<!-- Leaderboard panel -->
		<div
			class="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
			transition:fly={{ y: 50, duration: 300 }}
		>
			<!-- Header -->
			<div class="border-b border-line bg-surface-muted px-6 py-4">
				<div class="flex items-center justify-between">
					<h2 class="text-2xl font-bold text-ink">🏆 Leaderboard</h2>
					<button
						on:click={onClose}
						class="rounded-lg border border-line bg-surface px-4 py-2 font-medium text-ink transition hover:border-line-strong hover:bg-surface-muted"
					>
						Close
					</button>
				</div>
			</div>

			<!-- Leaderboard list -->
			<div class="overflow-y-auto p-6" style="max-height: calc(90vh - 120px);">
				<div class="space-y-3">
					{#each top5 as participant, index (participant.id)}
						{@const rank = index + 1}
						{@const isCurrentUser = participant.id === currentParticipantId}
						<div
							class="group relative overflow-hidden rounded-xl border-2 bg-surface-muted p-4 transition"
							class:border-brand={isCurrentUser}
							class:bg-brand/5={isCurrentUser}
							class:border-line={!isCurrentUser}
							style={isCurrentUser ? '' : `border-color: ${getRankColor(rank)}20`}
							animate:flip={{ duration: 400 }}
							transition:fly={{ y: 20, delay: index * 50 }}
						>
							<!-- Rank badge -->
							<div
								class="absolute -left-2 -top-2 flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-lg"
								style="background-color: {getRankColor(rank)}; opacity: 0.9;"
							>
								{getRankIcon(rank)}
							</div>

							<!-- Content -->
							<div class="ml-10 flex items-center justify-between gap-4">
								<!-- Participant info -->
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<h3 class="text-lg font-bold text-ink">
											{participant.name}
											{#if isCurrentUser}
												<span class="text-sm font-normal text-brand">(You)</span>
											{/if}
										</h3>
										{#if participant.role === 'facilitator'}
											<span class="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-medium text-brand">
												Facilitator
											</span>
										{/if}
									</div>

									<!-- Stats -->
									<div class="mt-1 flex gap-4 text-sm text-ink-muted">
										<span>💡 {participant.contributionCount} ideas</span>
										<span>⭐ {participant.votesReceived} votes</span>
										<span>🏅 {participant.badges.length} badges</span>
									</div>

									<!-- Badges -->
									{#if participant.badges.length > 0}
										<div class="mt-2 flex flex-wrap gap-1">
											{#each participant.badges.slice(0, 5) as badge}
												<div
													class="group/badge relative flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition hover:scale-105"
													style="border-color: {badge.color}; background-color: {badge.color}15;"
													title={badge.description}
												>
													<span>{badge.icon}</span>
													<span class="hidden sm:inline" style="color: {badge.color};">
														{badge.name}
													</span>
													<!-- Tooltip -->
													<div class="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg group-hover/badge:block">
														<div class="font-bold" style="color: {badge.color};">
															{badge.name}
														</div>
														<div class="text-ink-muted">{badge.description}</div>
														<div class="mt-1 text-brand">+{badge.points} pts</div>
													</div>
												</div>
											{/each}
											{#if participant.badges.length > 5}
												<div class="rounded-full border border-line bg-surface px-2 py-1 text-xs font-medium text-ink-muted">
													+{participant.badges.length - 5}
												</div>
											{/if}
										</div>
									{/if}
								</div>

								<!-- Score -->
								<div class="text-right">
									<div class="text-3xl font-bold text-brand">{participant.score}</div>
									<div class="text-xs text-ink-muted">points</div>
								</div>
							</div>
						</div>
					{/each}

					<!-- Current user (if outside top 5) -->
					{#if showCurrentUser && currentUser}
						<div class="my-4 border-t border-line pt-4">
							<div class="mb-2 text-center text-sm font-medium text-ink-muted">Your Position</div>
							<div
								class="relative overflow-hidden rounded-xl border-2 border-brand bg-brand/5 p-4"
								transition:fly={{ y: 20 }}
							>
								<!-- Rank badge -->
								<div
									class="absolute -left-2 -top-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-500 text-2xl text-white shadow-lg"
								>
									#{currentUserRank}
								</div>

								<!-- Content -->
								<div class="ml-10 flex items-center justify-between gap-4">
									<!-- Participant info -->
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<h3 class="text-lg font-bold text-ink">
												{currentUser.name}
												<span class="text-sm font-normal text-brand">(You)</span>
											</h3>
										</div>

										<!-- Stats -->
										<div class="mt-1 flex gap-4 text-sm text-ink-muted">
											<span>💡 {currentUser.contributionCount} ideas</span>
											<span>⭐ {currentUser.votesReceived} votes</span>
											<span>🏅 {currentUser.badges.length} badges</span>
										</div>

										<!-- Badges -->
										{#if currentUser.badges.length > 0}
											<div class="mt-2 flex flex-wrap gap-1">
												{#each currentUser.badges.slice(0, 3) as badge}
													<div
														class="flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium"
														style="border-color: {badge.color}; background-color: {badge.color}15;"
													>
														<span>{badge.icon}</span>
														<span class="hidden sm:inline" style="color: {badge.color};">
															{badge.name}
														</span>
													</div>
												{/each}
												{#if currentUser.badges.length > 3}
													<div class="rounded-full border border-line bg-surface px-2 py-1 text-xs font-medium text-ink-muted">
														+{currentUser.badges.length - 3}
													</div>
												{/if}
											</div>
										{/if}
									</div>

									<!-- Score -->
									<div class="text-right">
										<div class="text-3xl font-bold text-brand">{currentUser.score}</div>
										<div class="text-xs text-ink-muted">points</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Empty state -->
				{#if leaderboard.length === 0}
					<div class="py-12 text-center text-ink-muted">
						<div class="mb-2 text-4xl">🏆</div>
						<div class="text-lg font-medium">No participants yet</div>
						<div class="text-sm">Be the first to contribute and earn points!</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
