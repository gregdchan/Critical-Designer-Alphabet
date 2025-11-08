<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { browser } from '$app/environment';

	export let isOpen = false;
	export let sessionCode = '';
	export let participantName = '';
	export let onClose: () => void = () => {};

	type FeedbackType = 'bug' | 'feature' | 'improvement' | 'praise';

	let feedbackType: FeedbackType = 'improvement';
	let subject = '';
	let message = '';
	let includeSessionData = true;
	let isSubmitting = false;

	const feedbackTypes: { value: FeedbackType; label: string; icon: string; color: string }[] = [
		{ value: 'bug', label: 'Bug Report', icon: '🐛', color: 'red' },
		{ value: 'feature', label: 'Feature Request', icon: '💡', color: 'blue' },
		{ value: 'improvement', label: 'Improvement Idea', icon: '⚡', color: 'yellow' },
		{ value: 'praise', label: 'Positive Feedback', icon: '💖', color: 'green' }
	];

	async function handleSubmit() {
		if (!subject.trim() || !message.trim()) {
			alert('Please fill in both subject and message fields.');
			return;
		}

		isSubmitting = true;

		try {
			const feedbackData = {
				type: feedbackType,
				subject: subject.trim(),
				message: message.trim(),
				sessionCode: includeSessionData ? sessionCode : null,
				participantName: includeSessionData ? participantName : 'Anonymous',
				userAgent: browser ? navigator.userAgent : 'Unknown',
				timestamp: new Date().toISOString(),
				url: browser ? window.location.href : ''
			};

			// In a real implementation, this would POST to an API endpoint
			console.log('Feedback submitted:', feedbackData);

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Save to localStorage as backup
			if (browser) {
				const storedFeedback = JSON.parse(
					localStorage.getItem('cda:feedback-queue') || '[]'
				);
				storedFeedback.push(feedbackData);
				localStorage.setItem('cda:feedback-queue', JSON.stringify(storedFeedback));
			}

			alert(
				'Thank you for your feedback! Your input helps us improve the platform for everyone.'
			);

			// Reset form
			subject = '';
			message = '';
			feedbackType = 'improvement';

			onClose();
		} catch (error) {
			console.error('Failed to submit feedback:', error);
			alert('Failed to submit feedback. Your feedback has been saved locally and will be sent when connection is restored.');
		} finally {
			isSubmitting = false;
		}
	}

	$: selectedType = feedbackTypes.find((t) => t.value === feedbackType);
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
			aria-label="Close feedback form"
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
						<h2 class="text-2xl font-bold text-ink">📢 Share Feedback</h2>
						<p class="text-sm text-ink-muted">Help us improve the platform</p>
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
				<form on:submit|preventDefault={handleSubmit} class="space-y-6">
					<!-- Feedback Type -->
					<section>
						<h3 class="mb-3 text-sm font-semibold text-ink">Type of Feedback</h3>
						<div class="grid grid-cols-2 gap-3">
							{#each feedbackTypes as type}
								<label
									class="group relative cursor-pointer overflow-hidden rounded-lg border-2 p-4 transition"
									class:border-brand={feedbackType === type.value}
									class:bg-brand/10={feedbackType === type.value}
									class:border-line={feedbackType !== type.value}
									class:bg-surface-muted={feedbackType !== type.value}
								>
									<input
										type="radio"
										bind:group={feedbackType}
										value={type.value}
										class="sr-only"
									/>
									<div class="flex items-center gap-3">
										<div class="text-2xl">{type.icon}</div>
										<div class="flex-1">
											<div class="font-semibold text-ink">{type.label}</div>
										</div>
										{#if feedbackType === type.value}
											<div class="text-brand">✓</div>
										{/if}
									</div>
								</label>
							{/each}
						</div>
					</section>

					<!-- Subject -->
					<section>
						<label class="mb-2 block text-sm font-semibold text-ink">
							Subject <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={subject}
							placeholder="Brief summary of your feedback"
							required
							maxlength="100"
							class="w-full rounded-lg border border-line bg-surface px-4 py-2 text-ink placeholder-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
						/>
						<div class="mt-1 text-right text-xs text-ink-muted">
							{subject.length}/100
						</div>
					</section>

					<!-- Message -->
					<section>
						<label class="mb-2 block text-sm font-semibold text-ink">
							Details <span class="text-red-500">*</span>
						</label>
						<textarea
							bind:value={message}
							placeholder={feedbackType === 'bug'
								? 'Please describe what happened, what you expected, and steps to reproduce...'
								: feedbackType === 'feature'
									? 'Describe the feature and how it would improve your experience...'
									: feedbackType === 'improvement'
										? 'What could be better and how?'
										: 'What did you love about your experience?'}
							required
							rows="6"
							maxlength="1000"
							class="w-full rounded-lg border border-line bg-surface px-4 py-2 text-ink placeholder-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand resize-y"
						/>
						<div class="mt-1 text-right text-xs text-ink-muted">
							{message.length}/1000
						</div>
					</section>

					<!-- Include Session Data -->
					<section>
						<label class="flex items-start gap-3 rounded-lg border border-line bg-surface-muted p-4 cursor-pointer hover:bg-surface transition">
							<input
								type="checkbox"
								bind:checked={includeSessionData}
								class="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-2 focus:ring-brand focus:ring-offset-2"
							/>
							<div class="flex-1">
								<div class="font-semibold text-ink">Include Session Context</div>
								<div class="text-sm text-ink-muted">
									Share session code and your name to help us investigate (recommended for bug reports)
								</div>
							</div>
						</label>
					</section>

					<!-- Guidelines -->
					<section>
						<details class="rounded-lg border border-line bg-surface-muted">
							<summary class="cursor-pointer p-4 font-semibold text-ink hover:bg-surface">
								💡 Feedback Guidelines
							</summary>
							<div class="border-t border-line p-4 text-sm text-ink-muted space-y-2">
								<p><strong>For Bug Reports:</strong></p>
								<ul class="ml-4 list-disc space-y-1">
									<li>Describe what you were doing when the bug occurred</li>
									<li>Include any error messages you saw</li>
									<li>Mention your browser and device type</li>
									<li>Note if the issue is reproducible</li>
								</ul>

								<p class="pt-2"><strong>For Feature Requests:</strong></p>
								<ul class="ml-4 list-disc space-y-1">
									<li>Explain the problem you're trying to solve</li>
									<li>Describe how the feature would help</li>
									<li>Share any examples from other tools</li>
								</ul>

								<p class="pt-2"><strong>For Improvement Ideas:</strong></p>
								<ul class="ml-4 list-disc space-y-1">
									<li>Identify what currently works but could be better</li>
									<li>Suggest specific changes</li>
									<li>Explain the expected benefit</li>
								</ul>
							</div>
						</details>
					</section>

					<!-- Submit Button -->
					<section>
						<button
							type="submit"
							disabled={isSubmitting || !subject.trim() || !message.trim()}
							class="w-full rounded-lg bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if isSubmitting}
								<span class="flex items-center justify-center gap-2">
									<span class="animate-spin">⏳</span>
									Submitting...
								</span>
							{:else}
								Send Feedback
							{/if}
						</button>
					</section>
				</form>
			</div>

			<!-- Footer -->
			<div class="border-t border-line bg-surface-muted px-6 py-3 text-xs text-ink-muted">
				Your feedback is invaluable. We read every submission and prioritize based on community needs.
			</div>
		</div>
	</div>
{/if}

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>
