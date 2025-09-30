<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import sanityClient from '$lib/sanity';
	import { browser } from '$app/environment';
	import { currentUser } from '$lib/stores/user';
	import { storeParticipantProfile } from '$lib/realtime';
	import {
		IconPlayerPlay as Play,
		IconSettings as Settings,
		IconUsers as Users
	} from '@tabler/icons-svelte';

	type TemplateRound = {
		key?: string;
		name?: string;
		minutes?: number;
		questions?: string[];
	};

  interface WorkshopTemplate {
    _id: string;
    title: string;
    slug?: { current?: string } | string;
    description?: string;
    challenge?: string;
    lenses?: string[];
    sections?: {
      onboarding?: {
        title?: string;
        introCopy?: string;
        whatToBring?: string[];
        rules?: string[];
        quickStart?: string[];
      };
      breakout?: {
        rounds?: TemplateRound[];
      };
      synthesis?: {
        methods?: string[];
        instructions?: string;
      };
      commitments?: {
        instructions?: string;
        exportFields?: string[];
      };
    };
    phases?: Array<{
      key?: string;
      title?: string;
      description?: string;
      durationMinutes?: number | null;
      dashboards?: string[] | null;
    }>;
    facilitation?: {
      roles?: string[];
      fairnessThreshold?: number;
      scoring?: {
        idea?: number;
				vote?: number;
				linkCards?: number;
				reflection?: number;
				justice?: number;
			};
			badges?: string[];
		};
		visuals?: {
			charts?: string[];
			theme?: {
				_id?: string;
				name?: string;
				palette?: Record<string, string>;
				fonts?: Record<string, string>;
				cardStyle?: Record<string, unknown>;
			};
		};
		aiAssist?: {
			enabled?: boolean;
			maxAlternates?: number;
			guidance?: string;
		};
		resources?: Array<{ title?: string; url?: string }>;
		steps?: Array<{
			key?: string;
			name?: string;
			minutes?: number;
			instructions?: string;
		}>;
	}

	let facilitatorName = '';
	let facilitatorEmail = '';
	let sessionCode = '';
	let sessionTitle = '';
	let selectedTemplate: WorkshopTemplate | null = null;
	let templates: WorkshopTemplate[] = [];
	let loading = false;
	let loadingTemplates = true;
	let sessionChallenge = '';
	let lastTemplateId: string | null = null;

  const templateQuery = `*[_type == "workshopTemplate"]{
    _id,
    title,
    slug,
    description,
    challenge,
    lenses,
    sections,
    phases,
    facilitation,
    visuals{
      charts,
      theme->{
        _id,
        name,
        palette,
        fonts,
        cardStyle
      }
    },
    aiAssist,
    resources
  }` as const;

	async function fetchTemplates() {
		try {
			templates = await sanityClient.fetch(templateQuery);
		} catch (error) {
			console.error('Error loading templates:', error);
		} finally {
			loadingTemplates = false;
		}
	}

	$: {
		const nextTemplateId = selectedTemplate?._id ?? null;
		if (nextTemplateId !== lastTemplateId) {
			sessionChallenge = selectedTemplate?.challenge ?? '';
			lastTemplateId = nextTemplateId;
		}
	}

	function generateSessionCode() {
		sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
	}

	async function seedQuestions(code: string, rounds: TemplateRound[] = []) {
		if (!rounds.length) return;
		const payloads = rounds
			.flatMap((round) =>
				(round?.questions ?? []).map((text) => ({
					code,
					section: round?.name ?? round?.key ?? 'Breakout',
					text: text.trim()
				}))
			)
			.filter((entry) => entry.text.length);

		await Promise.all(
			payloads.map((payload) =>
				fetch('/api/questions/add', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				}).catch((error) => {
					console.error('Failed to seed question', error);
				})
			)
		);
	}

	async function createSession() {
		if (
			!facilitatorName ||
			!facilitatorEmail ||
			!sessionCode ||
			!sessionTitle ||
			!selectedTemplate
		) {
			alert('Please fill in all fields and select a template');
			return;
		}

		loading = true;
		try {
			const templateSlug =
				typeof selectedTemplate.slug === 'string'
					? selectedTemplate.slug
					: selectedTemplate.slug?.current;

      const sessionResponse = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionCode,
          title: sessionTitle,
          templateSlug,
          challenge: sessionChallenge.trim() || selectedTemplate.challenge || null,
          facilitatorEmail: facilitatorEmail.trim().toLowerCase(),
          phases: selectedTemplate.phases ?? []
        })
      });

			const sessionData = await sessionResponse.json();
			if (!sessionData.success) {
				throw new Error(sessionData.error);
			}

			const facilitatorColor = selectedTemplate.visuals?.theme?.palette?.neonPink ?? '#ff00ff';

			const participantResponse = await fetch('/api/participants/join', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					code: sessionCode,
					name: facilitatorName,
					role: 'facilitator',
					color: facilitatorColor
				})
			});

			const participantData = await participantResponse.json();
			if (!participantData.success) {
				throw new Error(participantData.error);
			}

			await seedQuestions(sessionCode, selectedTemplate.sections?.breakout?.rounds ?? []);

			if (browser && participantData.participant) {
				const profile = {
					participantId: participantData.participant.id as string,
					sessionCode,
					name: facilitatorName,
					email: facilitatorEmail.trim().toLowerCase(),
					role: 'facilitator' as const,
					color: facilitatorColor
				};
				currentUser.set(profile);
				storeParticipantProfile(sessionCode, profile);
			}

			if (browser) {
				window.open(`/presentation?code=${sessionCode}`, '_blank');
			}

			goto(`/session/${sessionCode}?role=facilitator`);
		} catch (error) {
			console.error('Error creating session:', error);
			alert('Failed to create session. Please try again.');
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		generateSessionCode();
		await fetchTemplates();
	});

	$: if (!sessionTitle && selectedTemplate) {
		sessionTitle = `${selectedTemplate.title} — ${new Date()
			.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
			.toUpperCase()}`;
	}

	$: if (!selectedTemplate && templates.length) {
		selectedTemplate = templates[0];
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-cyan-900 p-6">
	<div class="max-w-4xl mx-auto">
		<header class="text-center mb-12">
			<h1
				class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4"
			>
				Design Session Console
			</h1>
			<p class="text-slate-300 text-lg">
				Plan inclusive design sprints for AI roadmaps, policy pilots, or any iterative challenge.
			</p>
		</header>

		<div class="grid lg:grid-cols-2 gap-8">
			<!-- Setup Form -->
			<div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/20">
				<h2 class="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
					<Settings class="w-6 h-6 text-cyan-400" />
					Session Setup
				</h2>

				<form on:submit|preventDefault={createSession} class="space-y-6">
					<div>
						<label for="facilitatorName" class="block text-sm font-medium text-slate-300 mb-2">
							Your Name
						</label>
						<input
							id="facilitatorName"
							type="text"
							bind:value={facilitatorName}
							placeholder="Enter your name"
							class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
							required
						/>
					</div>

					<div>
						<label for="facilitatorEmail" class="block text-sm font-medium text-slate-300 mb-2">
							Email
						</label>
						<input
							id="facilitatorEmail"
							type="email"
							bind:value={facilitatorEmail}
							placeholder="you@example.org"
							class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
							required
						/>
					</div>

					<div>
						<label for="sessionTitle" class="block text-sm font-medium text-slate-300 mb-2">
							Session Title
						</label>
						<input
							id="sessionTitle"
							type="text"
							bind:value={sessionTitle}
							placeholder="e.g., Inclusive Roadmap Session — Product Team"
							class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
							required
						/>
					</div>

					<div>
						<label for="sessionChallenge" class="block text-sm font-medium text-slate-300 mb-2">
							Challenge Focus
						</label>
						<textarea
							id="sessionChallenge"
							rows="3"
							bind:value={sessionChallenge}
							placeholder="e.g., Align our cross-functional team on equitable AI guardrails for the next release."
							class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
						></textarea>
						<p class="mt-2 text-xs text-slate-400">
							Pulled from the template by default—edit to match the specific opportunity you're
							tackling today.
						</p>
					</div>

					<div>
						<label for="sessionCode" class="block text-sm font-medium text-slate-300 mb-2">
							Session Code
						</label>
						<div class="flex gap-2">
							<input
								id="sessionCode"
								type="text"
								bind:value={sessionCode}
								class="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent font-mono text-lg"
								required
							/>
							<button
								type="button"
								on:click={generateSessionCode}
								class="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
							>
								New Code
							</button>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading || !selectedTemplate}
						class="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if loading}
							<div
								class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
							></div>
							Creating Session...
						{:else}
							<Play class="w-5 h-5" />
							Launch Session
						{/if}
					</button>
				</form>
			</div>

			<!-- Template Selection -->
			<div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-400/20">
				<h2 class="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
					<Users class="w-6 h-6 text-purple-400" />
					Template Preview
				</h2>

				{#if loadingTemplates}
					<div class="flex items-center justify-center py-12">
						<div
							class="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"
						></div>
					</div>
				{:else if templates.length === 0}
					<p class="text-slate-400 text-center py-8">
						No templates found. Add planning templates in Sanity Studio.
					</p>
				{:else}
					<div class="space-y-4">
						{#each templates as template}
							<button
								type="button"
								on:click={() => (selectedTemplate = template)}
								class="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 {selectedTemplate?._id ===
								template._id
									? 'border-purple-400 bg-purple-400/10'
									: 'border-slate-600 hover:border-purple-400/50 bg-slate-700/50'}"
							>
								<h3 class="font-semibold text-white mb-2">{template.title}</h3>
								<p class="text-sm text-slate-300 mb-3">
									{template.description || 'No description available'}
								</p>
								{#if template.challenge}
									<div class="mb-3 rounded-lg border border-purple-400/30 bg-purple-400/10 p-3">
										<p class="text-xs uppercase tracking-[0.3em] text-purple-200">
											Challenge Focus
										</p>
										<p class="mt-2 text-sm text-slate-100">{template.challenge}</p>
									</div>
								{/if}

								<div class="space-y-3 text-xs">
									<!-- Lenses -->
									<div>
										<span class="text-slate-400">Lenses:</span>
										<div class="flex flex-wrap gap-1 mt-1">
											{#each template.lenses ?? [] as lens}
												<span class="px-2 py-1 bg-cyan-400/20 text-cyan-300 rounded">{lens}</span>
											{/each}
										</div>
									</div>

									<!-- Session Details -->
									<div class="grid grid-cols-2 gap-4">
										<div>
											<span class="text-slate-400">Breakout Rounds:</span>
											<span class="text-white ml-2"
												>{template.sections?.breakout?.rounds?.length || 0}</span
											>
										</div>
										<div>
											<span class="text-slate-400">Total Duration:</span>
											<span class="text-white ml-2">
												{(template.sections?.breakout?.rounds ?? []).reduce(
													(total, round) => total + (round.minutes || 0),
													0
												)}min
											</span>
										</div>
									</div>

									<!-- Features -->
									<div class="flex flex-wrap gap-2">
										{#if template.aiAssist?.enabled}
											<span
												class="px-2 py-1 bg-purple-400/20 text-purple-300 rounded flex items-center gap-1"
											>
												🤖 AI Assist
											</span>
										{/if}
										{#if template.visuals?.theme}
											<span class="px-2 py-1 bg-green-400/20 text-green-300 rounded">
												🎨 Custom Theme
											</span>
										{/if}
										{#if template.resources && template.resources.length > 0}
											<span class="px-2 py-1 bg-yellow-400/20 text-yellow-300 rounded">
												📚 {template.resources.length} Resources
											</span>
										{/if}
										{#if template.visuals?.charts && template.visuals.charts.length > 0}
											<span class="px-2 py-1 bg-blue-400/20 text-blue-300 rounded">
												📊 Data Viz
											</span>
										{/if}
									</div>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		{#if selectedTemplate}
			<div class="mt-8 space-y-6">
				<!-- Template Overview -->
				<div class="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-600">
					<h3 class="text-xl font-semibold text-white mb-4">
						Template Preview: {selectedTemplate.title}
					</h3>

					<div class="grid md:grid-cols-3 gap-6">
						<!-- Facilitation Details -->
						<div class="bg-slate-700/50 rounded-lg p-4">
							<h4 class="font-semibold text-cyan-400 mb-3">Facilitation</h4>
							<div class="space-y-2 text-sm">
								<div>
									<span class="text-slate-400">Roles:</span>
									<div class="flex flex-wrap gap-1 mt-1">
										{#each selectedTemplate.facilitation?.roles ?? [] as role}
											<span class="px-2 py-1 bg-cyan-400/20 text-cyan-300 rounded text-xs"
												>{role}</span
											>
										{/each}
									</div>
								</div>
								{#if selectedTemplate.facilitation?.scoring}
									<div>
										<span class="text-slate-400">Scoring:</span>
										<div class="text-xs text-slate-300 mt-1">
											Idea: {selectedTemplate.facilitation.scoring.idea}pts, Vote: {selectedTemplate
												.facilitation.scoring.vote}pts, Reflection: {selectedTemplate.facilitation
												.scoring.reflection}pts
										</div>
									</div>
								{/if}
								{#if selectedTemplate.facilitation?.badges}
									<div>
										<span class="text-slate-400">Badges:</span>
										<div class="text-xs text-purple-300 mt-1">
											{selectedTemplate.facilitation.badges.length} available
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- AI & Features -->
						<div class="bg-slate-700/50 rounded-lg p-4">
							<h4 class="font-semibold text-purple-400 mb-3">Features</h4>
							<div class="space-y-2 text-sm">
								<div class="flex items-center gap-2">
									<span class="text-slate-400">AI Assist:</span>
									<span class="text-white">
										{selectedTemplate.aiAssist?.enabled ? '✅ Enabled' : '❌ Disabled'}
									</span>
								</div>
								{#if selectedTemplate.aiAssist?.enabled}
									<div class="text-xs text-slate-300">
										Max alternates: {selectedTemplate.aiAssist.maxAlternates}
									</div>
								{/if}
								<div class="flex items-center gap-2">
									<span class="text-slate-400">Theme:</span>
									<span class="text-white">
										{selectedTemplate.visuals?.theme?.name || 'Default'}
									</span>
								</div>
								{#if selectedTemplate.visuals?.charts}
									<div>
										<span class="text-slate-400">Charts:</span>
										<div class="flex flex-wrap gap-1 mt-1">
											{#each selectedTemplate.visuals.charts as chart}
												<span class="px-2 py-1 bg-blue-400/20 text-blue-300 rounded text-xs"
													>{chart}</span
												>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- Resources -->
						<div class="bg-slate-700/50 rounded-lg p-4">
							<h4 class="font-semibold text-yellow-400 mb-3">Resources</h4>
							<div class="space-y-2 text-sm">
								{#if selectedTemplate.resources && selectedTemplate.resources.length > 0}
									{#each selectedTemplate.resources.slice(0, 3) as resource}
										<div class="text-slate-300">
											<a
												href={resource.url}
												target="_blank"
												class="hover:text-yellow-300 transition-colors"
											>
												📎 {resource.title}
											</a>
										</div>
									{/each}
									{#if selectedTemplate.resources.length > 3}
										<div class="text-xs text-slate-400">
											+{selectedTemplate.resources.length - 3} more resources
										</div>
									{/if}
								{:else}
									<div class="text-slate-400 text-xs">No resources defined</div>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Breakout Rounds -->
				{#if selectedTemplate.sections?.breakout?.rounds && selectedTemplate.sections.breakout.rounds.length > 0}
					<div class="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-600">
						<h4 class="text-lg font-semibold text-white mb-4">Breakout Rounds</h4>
						<div class="grid gap-4">
							{#each selectedTemplate.sections.breakout.rounds as round, index}
								<div class="bg-slate-700/50 rounded-lg p-4">
									<div class="flex items-center gap-3 mb-3">
										<span
											class="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 text-slate-900 rounded-full flex items-center justify-center text-sm font-bold"
										>
											{index + 1}
										</span>
										<div>
											<h5 class="font-medium text-white">{round.name}</h5>
											<span class="text-xs text-slate-400">{round.minutes} minutes</span>
										</div>
									</div>

									{#if round.questions && round.questions.length > 0}
										<div>
											<span class="text-sm text-slate-400 mb-2 block"
												>Questions ({round.questions.length}):</span
											>
											<div class="space-y-1 max-h-32 overflow-y-auto">
												{#each round.questions.slice(0, 3) as question}
													<div class="text-sm text-slate-300 bg-slate-600/30 rounded px-3 py-2">
														{question}
													</div>
												{/each}
												{#if round.questions.length > 3}
													<div class="text-xs text-slate-400 px-3 py-1">
														+{round.questions.length - 3} more questions...
													</div>
												{/if}
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Synthesis & Methods -->
				{#if selectedTemplate.sections?.synthesis}
					<div class="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-600">
						<h4 class="text-lg font-semibold text-white mb-4">Synthesis & Methods</h4>
						<div class="grid md:grid-cols-2 gap-6">
							{#if selectedTemplate.sections.synthesis.methods}
								<div>
									<span class="text-sm text-slate-400 mb-2 block">Methods:</span>
									<div class="flex flex-wrap gap-2">
										{#each selectedTemplate.sections.synthesis.methods as method}
											<span class="px-3 py-2 bg-green-400/20 text-green-300 rounded text-sm"
												>{method}</span
											>
										{/each}
									</div>
								</div>
							{/if}
							{#if selectedTemplate.sections.synthesis.instructions}
								<div>
									<span class="text-sm text-slate-400 mb-2 block">Instructions:</span>
									<p class="text-sm text-slate-300 bg-slate-700/30 rounded p-3">
										{selectedTemplate.sections.synthesis.instructions}
									</p>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
