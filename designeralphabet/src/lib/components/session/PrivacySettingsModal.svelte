<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import type { PrivacySettings } from '$lib/stores/privacy';
	import { exportParticipantData, requestDataDeletion, type ExportData } from '$lib/stores/privacy';

	export let isOpen = false;
	export let settings: PrivacySettings;
	export let sessionCode: string;
	export let participantId: string = '';
	export let participantName: string = '';
	export let exportData: ExportData | null = null;
	export let onUpdateSetting: <K extends keyof PrivacySettings>(
		key: K,
		value: PrivacySettings[K]
	) => void = () => {};
	export let onClose: () => void = () => {};

	function handleExportJSON() {
		if (exportData) {
			exportParticipantData(exportData, 'json');
		}
	}

	function handleExportCSV() {
		if (exportData) {
			exportParticipantData(exportData, 'csv');
		}
	}

	function handleRequestDeletion() {
		const confirmation = confirm(
			'Are you sure you want to request deletion of all your data? This action cannot be undone and will be processed within 30 days.'
		);
		if (confirmation) {
			const message = requestDataDeletion(sessionCode, participantId);
			alert(message);
		}
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
			on:click={onClose}
			on:keydown={(e) => e.key === 'Escape' && onClose()}
			role="button"
			tabindex="0"
			aria-label="Close privacy settings"
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
						<h2 class="text-2xl font-bold text-ink">🔒 Privacy & Data</h2>
						<p class="text-sm text-ink-muted">Control your privacy and data settings</p>
					</div>
					<button
						on:click={onClose}
						class="rounded-lg border border-line bg-surface px-4 py-2 font-medium text-ink transition hover:border-line-strong hover:bg-surface-muted"
					>
						Close
					</button>
				</div>
			</div>

			<!-- Content -->
			<div class="overflow-y-auto p-6" style="max-height: calc(90vh - 180px);">
				<div class="space-y-6">
					<!-- Privacy Settings -->
					<section>
						<h3 class="mb-3 text-lg font-semibold text-ink">Privacy Settings</h3>
						<div class="space-y-3">
							<!-- Anonymous Voting -->
							<label class="flex items-start gap-3 rounded-lg border border-line bg-surface-muted p-4 cursor-pointer hover:bg-surface transition">
								<input
									type="checkbox"
									checked={settings.anonymousVoting}
									on:change={(e) => onUpdateSetting('anonymousVoting', e.currentTarget.checked)}
									class="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-2 focus:ring-brand focus:ring-offset-2"
								/>
								<div class="flex-1">
									<div class="font-semibold text-ink">Anonymous Voting</div>
									<div class="text-sm text-ink-muted">
										Your votes will not be attributed to your name
									</div>
								</div>
							</label>

							<!-- Hide Names -->
							<label class="flex items-start gap-3 rounded-lg border border-line bg-surface-muted p-4 cursor-pointer hover:bg-surface transition">
								<input
									type="checkbox"
									checked={settings.hideParticipantNames}
									on:change={(e) =>
										onUpdateSetting('hideParticipantNames', e.currentTarget.checked)}
									class="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-2 focus:ring-brand focus:ring-offset-2"
								/>
								<div class="flex-1">
									<div class="font-semibold text-ink">Hide My Name</div>
									<div class="text-sm text-ink-muted">
										Display as "Anonymous Participant" in leaderboards and charts
									</div>
								</div>
							</label>

							<!-- Disable Activity Tracking -->
							<label class="flex items-start gap-3 rounded-lg border border-line bg-surface-muted p-4 cursor-pointer hover:bg-surface transition">
								<input
									type="checkbox"
									checked={settings.disableActivityTracking}
									on:change={(e) =>
										onUpdateSetting('disableActivityTracking', e.currentTarget.checked)}
									class="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-2 focus:ring-brand focus:ring-offset-2"
								/>
								<div class="flex-1">
									<div class="font-semibold text-ink">Disable Activity Tracking</div>
									<div class="text-sm text-ink-muted">
										Don't show "last active" timestamps or real-time activity
									</div>
								</div>
							</label>

							<!-- Opt Out of Leaderboard -->
							<label class="flex items-start gap-3 rounded-lg border border-line bg-surface-muted p-4 cursor-pointer hover:bg-surface transition">
								<input
									type="checkbox"
									checked={settings.optOutOfLeaderboard}
									on:change={(e) => onUpdateSetting('optOutOfLeaderboard', e.currentTarget.checked)}
									class="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-2 focus:ring-brand focus:ring-offset-2"
								/>
								<div class="flex-1">
									<div class="font-semibold text-ink">Opt Out of Leaderboard</div>
									<div class="text-sm text-ink-muted">
										Don't display my name/ranking in public leaderboards
									</div>
								</div>
							</label>
						</div>
					</section>

					<!-- Data Export -->
					<section>
						<h3 class="mb-3 text-lg font-semibold text-ink">Data Export</h3>
						<div class="rounded-lg border border-line bg-surface-muted p-4">
							<p class="mb-4 text-sm text-ink-muted">
								Download all your contributions, votes, and activity data from this session.
							</p>
							<div class="flex gap-3">
								<button
									on:click={handleExportJSON}
									disabled={!exportData}
									class="flex-1 rounded-lg border border-line bg-surface px-4 py-2 font-medium text-ink transition hover:border-line-strong hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
								>
									📄 Export as JSON
								</button>
								<button
									on:click={handleExportCSV}
									disabled={!exportData}
									class="flex-1 rounded-lg border border-line bg-surface px-4 py-2 font-medium text-ink transition hover:border-line-strong hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
								>
									📊 Export as CSV
								</button>
							</div>
						</div>
					</section>

					<!-- Data Deletion -->
					<section>
						<h3 class="mb-3 text-lg font-semibold text-ink">Data Deletion</h3>
						<div class="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
							<p class="mb-4 text-sm text-ink-muted">
								Request permanent deletion of all your data from this session. This action cannot be
								undone and will be processed within 30 days.
							</p>
							<button
								on:click={handleRequestDeletion}
								class="w-full rounded-lg border border-red-500 bg-red-500/20 px-4 py-2 font-semibold text-red-500 transition hover:bg-red-500/30"
							>
								⚠️ Request Data Deletion
							</button>
						</div>
					</section>

					<!-- Privacy Notice -->
					<section>
						<h3 class="mb-3 text-lg font-semibold text-ink">Privacy Notice</h3>
						<div class="rounded-lg border border-line bg-surface-muted p-4 text-xs text-ink-muted space-y-2">
							<p>
								Your privacy is important to us. This application follows GDPR and privacy best
								practices:
							</p>
							<ul class="ml-4 space-y-1 list-disc">
								<li>All data is stored locally in your browser unless you choose to share it</li>
								<li>Session data is only accessible to participants with the session code</li>
								<li>You can export or delete your data at any time</li>
								<li>Facilitators can see aggregate analytics but cannot access individual private settings</li>
								<li>No data is sold or shared with third parties</li>
							</ul>
						</div>
					</section>
				</div>
			</div>
		</div>
	</div>
{/if}
