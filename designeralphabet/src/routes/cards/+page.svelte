<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import SimpleDrawer from '$lib/components/SimpleDrawer.svelte';
	import { getDrawerStore } from '$lib/stores/drawer';
	import { drawerOpen } from '$lib/stores/drawer';
	import { fetchCards, type Card } from '$lib/Cards';
	import {
		IconRefresh as Shuffle,
		IconStar as Sparkles,
		IconSearch as Search,
		IconX as X,
		IconArrowRight as ArrowRight
	} from '@tabler/icons-svelte';

	const drawerStore = getDrawerStore();

	const MAX_SELECTION = 5;
	const MIN_RANDOM = 3;
	const CATEGORIES = ['theory', 'practice', 'lens', 'mindset', 'method'];

	type VariantName = 'cyan' | 'pink' | 'lime' | 'purple';

	const CATEGORY_VARIANTS: Record<string, VariantName> = {
		theory: 'purple',
		practice: 'cyan',
		lens: 'pink',
		mindset: 'lime',
		method: 'cyan'
	};

	const NEON_VARIANTS = {
		cyan: {
			border: 'border-neonCyan/40',
			glow: 'shadow-neon-cyan',
			accent: 'text-neonCyan',
			chip: 'border-neonCyan/40 bg-neonCyan/10 text-neonCyan'
		},
		pink: {
			border: 'border-neonPink/40',
			glow: 'shadow-neon-pink',
			accent: 'text-neonPink',
			chip: 'border-neonPink/40 bg-neonPink/10 text-neonPink'
		},
		lime: {
			border: 'border-neonLime/40',
			glow: 'shadow-neon-lime',
			accent: 'text-neonLime',
			chip: 'border-neonLime/40 bg-neonLime/10 text-neonLime'
		},
		purple: {
			border: 'border-retroPurple/40',
			glow: 'shadow-neon-pink',
			accent: 'text-retroPurple',
			chip: 'border-retroPurple/40 bg-retroPurple/10 text-retroPurple'
		}
	} as const;

	type VariantAttr = keyof (typeof NEON_VARIANTS)[VariantName];

	function getVariant(card: Card): VariantName {
		const neonKey = card.category ? CATEGORY_VARIANTS[card.category] : undefined;
		return neonKey ?? 'cyan';
	}

	function variantClass(card: Card, key: VariantAttr) {
		return NEON_VARIANTS[getVariant(card)][key];
	}

	let cards: Card[] = [];
	let loading = true;
	let error: string | null = null;
	let selectedCards: Card[] = [];
	let searchTerm = '';
	let categoryFilter: string | null = null;
	let letterFilter: string | null = null;
	let tagFilter: string[] = [];
	let activeCard: Card | null = null;
	let statusMessage = '';

	let allLetters: string[] = [];
	let allTags: string[] = [];

	onMount(async () => {
		try {
			const deck = await fetchCards();
			cards = deck;
			const letters = new Set<string>();
			const tags = new Set<string>();
			deck.forEach((card) => {
				if (card.letter) letters.add(card.letter.toUpperCase());
				card.tags?.forEach((tag) => tags.add(tag));
			});
			allLetters = Array.from(letters).sort();
			allTags = Array.from(tags).sort((a, b) => a.localeCompare(b));
			if (!deck.length) {
				statusMessage = 'No cards found yet. Add cards in Sanity Studio to populate the library.';
			}
		} catch (err) {
			console.error(err);
			error = 'Unable to load cards from Sanity. Check your API credentials and try again.';
		} finally {
			loading = false;
		}
	});

	$: filteredCards = cards.filter((card) => {
		if (categoryFilter && card.category !== categoryFilter) return false;
		if (letterFilter && card.letter?.toUpperCase() !== letterFilter) return false;
		if (tagFilter.length && !tagFilter.every((tag) => card.tags?.includes(tag))) return false;
		if (!searchTerm.trim()) return true;
		const term = searchTerm.toLowerCase();
		return (
			card.title?.toLowerCase().includes(term) ||
			card.description?.toLowerCase().includes(term) ||
			card.prompt?.toLowerCase().includes(term) ||
			card.cardID?.toLowerCase().includes(term)
		);
	});

	function toggleCard(card: Card) {
		const exists = selectedCards.some((entry) => entry._id === card._id);
		if (exists) {
			selectedCards = selectedCards.filter((entry) => entry._id !== card._id);
			statusMessage = `Removed ${card.title} from the session deck.`;
			return;
		}
		if (selectedCards.length >= MAX_SELECTION) {
			statusMessage = 'You can stage up to five cards at a time. Remove one before adding another.';
			return;
		}
		selectedCards = [...selectedCards, card];
		statusMessage = `Added ${card.title} to the session deck.`;
	}

	function toggleTag(tag: string) {
		tagFilter = tagFilter.includes(tag)
			? tagFilter.filter((entry) => entry !== tag)
			: [...tagFilter, tag];
	}

	function randomDraw() {
		if (!cards.length) return;
		const pool = [...cards];
		const target = Math.min(
			Math.floor(Math.random() * (MAX_SELECTION - MIN_RANDOM + 1)) + MIN_RANDOM,
			pool.length
		);
		const draw: Card[] = [];
		while (draw.length < target && pool.length) {
			const index = Math.floor(Math.random() * pool.length);
			const [card] = pool.splice(index, 1);
			draw.push(card);
		}
		selectedCards = draw;
		statusMessage = `Randomly selected ${draw.length} cards. Ready to kick off a session.`;
	}

	function openDetails(card: Card) {
		activeCard = card;
		drawerStore.open();
	}

	function closeDetails() {
		activeCard = null;
		drawerStore.close();
	}

	function generateRoomCode(length = 6) {
		const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let result = '';
		for (let i = 0; i < length; i += 1) {
			result += alphabet[Math.floor(Math.random() * alphabet.length)];
		}
		return result;
	}

	function persistSelection(cardIds: string[]) {
		if (typeof sessionStorage === 'undefined') return;
		sessionStorage.setItem('critical-alphabet:stagedCards', JSON.stringify(cardIds));
	}

	function startSession() {
		if (!selectedCards.length) {
			statusMessage = 'Select at least one card to seed your session.';
			return;
		}
		const code = generateRoomCode();
		persistSelection(selectedCards.map((card) => card.cardID ?? card._id));
		goto(`/session?code=${code}`);
	}

	function clearFilters() {
		searchTerm = '';
		categoryFilter = null;
		letterFilter = null;
		tagFilter = [];
	}
</script>

<section class="space-y-12 text-white" aria-live="polite">
	<header
		class="space-y-6 rounded-[2.5rem] border border-white/10 bg-midnight/80 p-8 shadow-[0_0_35px_rgba(0,255,247,0.12)] sm:p-10"
	>
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div class="space-y-3">
				<p
					class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[0.65rem] uppercase tracking-[0.3em] text-white/70"
				>
					<Sparkles class="h-4 w-4 text-neonCyan" /> Retro Card Library
				</p>
				<h1 class="font-retro text-2xl uppercase tracking-[0.45em] text-white sm:text-3xl">
					Build inclusive decks with neon precision
				</h1>
				<p class="max-w-3xl text-sm text-white/70">
					Filter by lens, remix prompts, and stage up to five cards. Every selection syncs to live
					sessions so your team can explore justice-centered design moves together.
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-3">
				<button
					class="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60 transition hover:border-neonCyan/60 hover:text-neonCyan"
					type="button"
					on:click={clearFilters}
					aria-label="Clear all filters"
				>
					<X class="h-4 w-4" />
					Clear filters
				</button>
				<button
					class="rounded-full border border-neonCyan/40 bg-neonCyan/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neonCyan shadow-neon-cyan transition hover:bg-neonCyan/25 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
					type="button"
					on:click={randomDraw}
					disabled={loading || !cards.length}
				>
					<Shuffle class="h-4 w-4" />
					Random draw (3–5)
				</button>
				<button
					class="rounded-full border border-neonPink/40 bg-neonPink/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neonPink shadow-neon-pink transition hover:bg-neonPink/30 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
					type="button"
					on:click={startSession}
					disabled={!selectedCards.length}
				>
					<Sparkles class="h-4 w-4" />
					Launch session
				</button>
			</div>
		</div>
		<div class="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
			<label
				class="group relative flex items-center gap-3 rounded-2xl border border-white/15 bg-black/50 px-4 py-3 shadow-[0_0_25px_rgba(255,255,255,0.04)]"
			>
				<Search class="h-4 w-4 text-neonCyan/70" aria-hidden="true" />
				<span class="sr-only">Search cards</span>
				<input
					class="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-white/40"
					type="search"
					placeholder="Search title, description, prompt, or ID"
					bind:value={searchTerm}
				/>
				<div
					class="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-focus-within:opacity-100"
				>
					<div class="absolute inset-0 rounded-2xl border border-neonCyan/40" aria-hidden="true" />
				</div>
			</label>
			<div class="flex items-center justify-end text-xs uppercase tracking-[0.3em] text-white/50">
				{filteredCards.length} of {cards.length} cards visible
			</div>
		</div>
		<div class="flex flex-col gap-4 text-[0.7rem] uppercase tracking-[0.25em] text-white/60">
			<div class="flex flex-wrap items-center gap-2">
				{#each CATEGORIES as category}
					<button
						class={`rounded-full border px-4 py-2 transition ${
							categoryFilter === category
								? 'border-neonCyan/60 bg-neonCyan/20 text-neonCyan shadow-neon-cyan'
								: 'border-white/15 bg-black/40 text-white/65 hover:border-neonCyan/40 hover:text-neonCyan'
						}`}
						type="button"
						on:click={() => (categoryFilter = categoryFilter === category ? null : category)}
					>
						{category}
					</button>
				{/each}
			</div>
			{#if allLetters.length}
				<div class="flex flex-wrap gap-1 text-[0.6rem] uppercase tracking-[0.35em]">
					{#each allLetters as letter}
						<button
							type="button"
							class={`rounded-full px-3 py-1 transition ${
								letterFilter === letter
									? 'border border-neonPink/50 bg-neonPink/20 text-neonPink shadow-neon-pink'
									: 'border border-white/15 bg-black/40 text-white/60 hover:border-neonPink/40 hover:text-neonPink'
							}`}
							on:click={() => (letterFilter = letterFilter === letter ? null : letter)}
						>
							{letter}
						</button>
					{/each}
				</div>
			{/if}
			{#if allTags.length}
				<div class="flex flex-wrap gap-2 text-[0.6rem] uppercase tracking-[0.3em]">
					{#each allTags as tag}
						<button
							type="button"
							class={`rounded-full border px-3 py-1 transition ${
								tagFilter.includes(tag)
									? 'border-neonLime/60 bg-neonLime/20 text-neonLime shadow-neon-lime'
									: 'border-white/15 bg-black/40 text-white/60 hover:border-neonLime/40 hover:text-neonLime'
							}`}
							on:click={() => toggleTag(tag)}
						>
							{tag}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</header>

	{#if loading}
		<div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
			{#each Array.from({ length: 6 }) as _, index}
				<div
					class="animate-pulse rounded-[2rem] border border-white/10 bg-black/40 p-6 shadow-[0_0_30px_rgba(255,255,255,0.04)]"
				>
					<div class="h-6 w-24 rounded-full bg-white/10"></div>
					<div class="mt-4 h-4 w-full rounded-full bg-white/10"></div>
					<div class="mt-2 h-4 w-5/6 rounded-full bg-white/10"></div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="rounded-[2rem] border border-rose-500/50 bg-rose-500/10 p-6 text-sm text-rose-200">
			<p class="font-semibold uppercase tracking-[0.25em]">{error}</p>
			<p class="mt-2 text-xs text-rose-100/80">
				Verify your <code class="code">VITE_SANITY_*</code> variables and confirm the dataset is publicly
				readable.
			</p>
		</div>
	{:else if !cards.length}
		<div class="rounded-[2rem] border border-white/15 bg-black/50 p-6 text-sm text-white/70">
			{statusMessage}
		</div>
	{:else if !filteredCards.length}
		<div class="rounded-[2rem] border border-white/15 bg-black/50 p-6 text-sm text-white/70">
			No cards match these filters. Try clearing filters or drawing at random.
		</div>
	{:else}
		<div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
			{#each filteredCards as card, index (card._id)}
				<div>
					<article
						class={`group flex h-full flex-col gap-4 rounded-[2rem] border ${variantClass(card, 'border')} bg-black/60 p-6 shadow-[0_0_25px_rgba(255,255,255,0.05)] transition hover:-translate-y-1 ${variantClass(card, 'glow')} ${
							selectedCards.some((entry) => entry._id === card._id)
								? 'ring-2 ring-neonCyan/80 shadow-neon-cyan'
								: 'hover:shadow-[0_0_40px_rgba(0,255,247,0.12)]'
						}`}
					>
						<div class="flex items-start gap-4">
							<span
								class="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-black/40 font-retro text-xs uppercase tracking-[0.3em] text-white shadow-[0_0_18px_rgba(255,255,255,0.08)]"
								style={`box-shadow: 0 0 20px ${card.styleMeta?.neonColor ?? 'rgba(0,255,247,0.25)'} inset;`}
							>
								{card.letter ?? '?'}
							</span>
							<div class="flex-1 space-y-2">
								<div class="flex items-center gap-3">
									<span class="font-techno text-sm uppercase tracking-[0.2em] text-white"
										>{card.title}</span
									>
									{#if card.category}
										<span
											class={`rounded-full border px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] ${variantClass(card, 'chip')}`}
										>
											{card.category}
										</span>
									{/if}
								</div>
								<p class="text-[0.6rem] uppercase tracking-[0.35em] text-white/50">{card.cardID}</p>
							</div>
							<button
								class="rounded-full border border-white/15 bg-black/50 p-2 text-white/70 transition hover:border-neonCyan/60 hover:text-neonCyan"
								type="button"
								aria-label="View details"
								on:click={() => openDetails(card)}
							>
								<ArrowRight class="h-4 w-4" />
							</button>
						</div>
						{#if card.description}
							<p class="line-clamp-3 text-sm text-white/70">{card.description}</p>
						{/if}
						<div
							class="flex flex-wrap gap-2 text-[0.6rem] uppercase tracking-[0.25em] text-white/60"
						>
							{#if card.tags?.length}
								{#each card.tags.slice(0, 4) as tag}
									<span class="rounded-full border border-white/15 bg-white/5 px-3 py-1">{tag}</span
									>
								{/each}
								{#if card.tags.length > 4}
									<span class="rounded-full border border-white/15 bg-white/5 px-3 py-1"
										>+{card.tags.length - 4}</span
									>
								{/if}
							{/if}
						</div>
						<div class="mt-auto space-y-2">
							<button
								class={`w-full rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition ${
									selectedCards.some((entry) => entry._id === card._id)
										? 'border-neonCyan/60 bg-neonCyan/25 text-neonCyan shadow-neon-cyan'
										: 'border-white/15 bg-black/40 text-white/70 hover:border-neonCyan/40 hover:text-neonCyan'
								}`}
								type="button"
								on:click={() => toggleCard(card)}
							>
								{selectedCards.some((entry) => entry._id === card._id) ? 'Staged' : 'Stage card'}
							</button>
						</div>
					</article>
				</div>
			{/each}
		</div>
	{/if}

	{#if statusMessage}
		<p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/60">{statusMessage}</p>
	{/if}
</section>

{#if selectedCards.length}
	<div class="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
		<div
			class="pointer-events-auto flex w-full max-w-4xl flex-col gap-4 rounded-[2rem] border border-neonCyan/40 bg-midnight/90 p-5 text-white shadow-[0_0_45px_rgba(0,255,247,0.2)] backdrop-blur"
		>
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="font-retro text-xs uppercase tracking-[0.35em] text-neonCyan">
						{selectedCards.length} card{selectedCards.length === 1 ? '' : 's'} staged
					</p>
					<p class="text-[0.65rem] uppercase tracking-[0.3em] text-white/60">
						{selectedCards.map((card) => `${card.letter ?? '?'} · ${card.cardID}`).join(', ')}
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<button
						class="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-neonCyan/40 hover:text-neonCyan"
						type="button"
						on:click={randomDraw}
					>
						<Shuffle class="h-4 w-4" />
						Shuffle again
					</button>
					<button
						class="rounded-full border border-neonPink/50 bg-neonPink/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neonPink shadow-neon-pink transition hover:bg-neonPink/30"
						type="button"
						on:click={startSession}
					>
						<Sparkles class="h-4 w-4" />
						Launch session
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<SimpleDrawer open={$drawerOpen} on:backdrop={closeDetails}>
	{#if activeCard}
		<article class="flex h-full flex-col gap-6 overflow-y-auto bg-midnight/95 p-6 text-white">
			<header class="flex items-start justify-between gap-4">
				<div class="space-y-3">
					<div
						class="flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-white/60"
					>
						{#if activeCard.category}
							<span class={`rounded-full border px-3 py-1 ${variantClass(activeCard, 'chip')}`}>
								{activeCard.category}
							</span>
						{/if}
						<span class="rounded-full border border-white/15 px-3 py-1">{activeCard.cardID}</span>
					</div>
					<h2 class="font-retro text-xl uppercase tracking-[0.4em]">{activeCard.title}</h2>
					<p class="text-xs uppercase tracking-[0.35em] text-white/60">
						Letter {activeCard.letter}
					</p>
				</div>
				<button
					class="rounded-full border border-white/15 bg-black/50 p-2 text-white/70 transition hover:border-neonCyan/40 hover:text-neonCyan"
					type="button"
					on:click={closeDetails}
					aria-label="Close"
				>
					<X class="h-4 w-4" />
				</button>
			</header>
			{#if activeCard.description}
				<section
					class="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/75"
				>
					<h3 class="text-xs uppercase tracking-[0.3em] text-neonCyan">Description</h3>
					<p>{activeCard.description}</p>
				</section>
			{/if}
			{#if activeCard.prompt}
				<section
					class="rounded-2xl border border-neonPink/40 bg-neonPink/10 p-4 text-sm text-white/85 shadow-neon-pink"
				>
					<h3 class="text-xs uppercase tracking-[0.3em] text-neonPink">Prompt</h3>
					<p class="mt-2">{activeCard.prompt}</p>
				</section>
			{/if}
			{#if activeCard.exampleUse?.length}
				<section class="space-y-3 text-sm text-white/75">
					<h3 class="text-xs uppercase tracking-[0.3em] text-neonCyan">Example Uses</h3>
					<ul class="space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4">
						{#each activeCard.exampleUse as example}
							<li class="leading-relaxed">{example}</li>
						{/each}
					</ul>
				</section>
			{/if}
			{#if activeCard.readingList?.length}
				<section class="space-y-3 text-sm text-white/75">
					<h3 class="text-xs uppercase tracking-[0.3em] text-neonCyan">Reading List</h3>
					<ul class="space-y-2">
						{#each activeCard.readingList as item}
							<li>
								{#if item.url}
									<a
										class="text-neonCyan underline-offset-4 hover:underline"
										href={item.url}
										target="_blank"
										rel="noreferrer"
									>
										{item.title}
									</a>
								{:else}
									{item.title}
								{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/if}
			{#if activeCard.sources?.length}
				<section class="space-y-3 text-sm text-white/75">
					<h3 class="text-xs uppercase tracking-[0.3em] text-neonCyan">Sources</h3>
					<ul class="space-y-2">
						{#each activeCard.sources as source}
							<li>
								<a
									class="text-neonPink underline-offset-4 hover:underline"
									href={source}
									target="_blank"
									rel="noreferrer">{source}</a
								>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
			<footer class="mt-auto space-y-3 text-xs text-white/60">
				<button
					class="w-full rounded-full border border-neonCyan/40 bg-neonCyan/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neonCyan shadow-neon-cyan transition hover:bg-neonCyan/30"
					type="button"
					on:click={() => activeCard && toggleCard(activeCard)}
				>
					{activeCard && selectedCards.some((entry) => entry._id === activeCard?._id)
						? 'Remove from staged deck'
						: 'Stage this card'}
				</button>
				<p>
					The Designer’s Critical Alphabet is by Dr. Lesley-Ann Noel. Respect licensing and context
					when sharing.
				</p>
			</footer>
		</article>
	{/if}
</SimpleDrawer>
