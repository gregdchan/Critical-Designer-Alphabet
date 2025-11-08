<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { getAIConfig, setAIConfig, enableAI, disableAI, isAIEnabled } from '$lib/services/ai';
	import type { AIConfig } from '$lib/services/ai';

	export let isOpen = false;
	export let onClose: () => void = () => {};

	let config: AIConfig = getAIConfig();
	let apiKey = config.apiKey;
	let showApiKey = false;

	function handleSave() {
		if (config.enabled && !apiKey.trim()) {
			alert('Please enter an API key to enable AI features');
			return;
		}

		if (config.enabled) {
			enableAI(apiKey);
		} else {
			disableAI();
		}

		setAIConfig({
			model: config.model,
			temperature: config.temperature
		});

		alert('AI settings saved successfully!');
		onClose();
	}

	function handleToggleAI() {
		config.enabled = !config.enabled;
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
			aria-label="Close AI settings"
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
						<h2 class="text-2xl font-bold text-ink">🤖 AI Settings</h2>
						<p class="text-sm text-ink-muted">Configure AI-powered recommendations (optional)</p>
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
					<!-- Enable/Disable Toggle -->
					<section>
						<label
							class="flex items-start gap-3 rounded-lg border-2 border-line bg-surface-muted p-4 cursor-pointer hover:bg-surface transition"
							class:border-brand={config.enabled}
							class:bg-brand/10={config.enabled}
						>
							<input
								type="checkbox"
								bind:checked={config.enabled}
								on:change={handleToggleAI}
								class="mt-1 h-5 w-5 rounded border-line text-brand focus:ring-2 focus:ring-brand focus:ring-offset-2"
							/>
							<div class="flex-1">
								<div class="font-bold text-ink">Enable AI Recommendations</div>
								<div class="text-sm text-ink-muted">
									Use OpenAI to suggest relevant cards based on response content
								</div>
							</div>
						</label>
					</section>

					<!-- API Key -->
					{#if config.enabled}
						<section>
							<h3 class="mb-2 text-sm font-semibold text-ink">OpenAI API Key</h3>
							<div class="rounded-lg border border-line bg-surface-muted p-4">
								<div class="mb-3">
									<label class="flex items-center gap-2">
										<input
											type={showApiKey ? 'text' : 'password'}
											bind:value={apiKey}
											placeholder="sk-..."
											class="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
										/>
										<button
											on:click={() => (showApiKey = !showApiKey)}
											class="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface-elevated"
										>
											{showApiKey ? '🙈 Hide' : '👁️ Show'}
										</button>
									</label>
								</div>
								<p class="text-xs text-ink-muted">
									Get your API key from
									<a
										href="https://platform.openai.com/api-keys"
										target="_blank"
										rel="noopener noreferrer"
										class="text-brand hover:underline"
									>
										OpenAI Platform
									</a>. Your key is stored locally and never sent to our servers.
								</p>
							</div>
						</section>

						<!-- Model Selection -->
						<section>
							<h3 class="mb-2 text-sm font-semibold text-ink">Model</h3>
							<select
								bind:value={config.model}
								class="w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
							>
								<option value="gpt-4">GPT-4 (Recommended)</option>
								<option value="gpt-4-turbo">GPT-4 Turbo (Faster)</option>
								<option value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</option>
							</select>
							<p class="mt-2 text-xs text-ink-muted">
								GPT-4 provides the best recommendations. GPT-3.5 is cheaper but less accurate.
							</p>
						</section>

						<!-- Temperature -->
						<section>
							<h3 class="mb-2 text-sm font-semibold text-ink">
								Creativity: {config.temperature.toFixed(1)}
							</h3>
							<input
								type="range"
								min="0"
								max="1"
								step="0.1"
								bind:value={config.temperature}
								class="w-full accent-brand"
							/>
							<div class="mt-2 flex justify-between text-xs text-ink-muted">
								<span>More Focused</span>
								<span>More Creative</span>
							</div>
						</section>

						<!-- Features Info -->
						<section>
							<h3 class="mb-3 text-sm font-semibold text-ink">AI-Powered Features</h3>
							<div class="space-y-3">
								<div class="flex gap-3 rounded-lg border border-line bg-surface-muted p-3">
									<div class="text-2xl">🎯</div>
									<div class="flex-1">
										<div class="font-semibold text-ink">Smart Card Recommendations</div>
										<div class="text-xs text-ink-muted">
											AI suggests relevant cards based on your response content
										</div>
									</div>
								</div>
								<div class="flex gap-3 rounded-lg border border-line bg-surface-muted p-3">
									<div class="text-2xl">📊</div>
									<div class="flex-1">
										<div class="font-semibold text-ink">Response Quality Analysis</div>
										<div class="text-xs text-ink-muted">
											Get constructive feedback on your contributions
										</div>
									</div>
								</div>
								<div class="flex gap-3 rounded-lg border border-line bg-surface-muted p-3">
									<div class="text-2xl">💡</div>
									<div class="flex-1">
										<div class="font-semibold text-ink">Contextual Insights</div>
										<div class="text-xs text-ink-muted">
											Receive suggestions for deepening critical thinking
										</div>
									</div>
								</div>
							</div>
						</section>

						<!-- Privacy Notice -->
						<section>
							<div class="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
								<div class="mb-2 flex items-center gap-2">
									<span class="text-yellow-500">⚠️</span>
									<span class="font-semibold text-ink">Privacy Notice</span>
								</div>
								<p class="text-xs text-ink-muted">
									When AI is enabled, your response text is sent to OpenAI for analysis. No
									personal data or names are included. OpenAI does not use API data to train
									models. See
									<a
										href="https://openai.com/policies/api-data-usage-policies"
										target="_blank"
										rel="noopener noreferrer"
										class="text-brand hover:underline"
									>
										OpenAI's Data Usage Policy
									</a>
									for details.
								</p>
							</div>
						</section>
					{:else}
						<section>
							<div class="rounded-lg border border-line bg-surface-muted p-8 text-center">
								<div class="mb-3 text-4xl">🤖</div>
								<div class="mb-2 font-semibold text-ink">AI Features Disabled</div>
								<div class="text-sm text-ink-muted">
									Enable AI above to unlock intelligent card recommendations and quality analysis
								</div>
							</div>
						</section>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			<div class="border-t border-line bg-surface-muted px-6 py-4">
				<div class="flex items-center justify-end gap-3">
					<button
						on:click={onClose}
						class="rounded-lg border border-line bg-surface px-4 py-2 font-medium text-ink transition hover:bg-surface-elevated"
					>
						Cancel
					</button>
					<button
						on:click={handleSave}
						class="rounded-lg bg-brand px-6 py-2 font-semibold text-white transition hover:bg-brand/90"
					>
						Save Settings
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
