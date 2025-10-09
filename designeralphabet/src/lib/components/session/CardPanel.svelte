<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchCards, type Card } from '$lib/Cards';
	import {
		IconChevronRight,
		IconChevronDown,
		IconX,
		IconCheck,
		IconSearch,
		IconCards,
		IconStar
	} from '@tabler/icons-svelte';

	export let selectedCards: Card[] = [];
	export let maxSelection = 5;
	export let onCardToggle: (card: Card) => void = () => {};
	export let isOpen = false;
	export let isMobile = false;

	// Function to close the panel (for mobile)
	function closePanel() {
		isOpen = false;
	}

	let cards: Card[] = [];
	let loading = true;
	let searchTerm = '';
	let categoryFilter: string | null = null;
	let isPanelExpanded = true;

	const CATEGORIES = ['theory', 'practice', 'lens', 'mindset', 'method'];
	const CATEGORY_COLORS: Record<string, string> = {
		theory: 'text-purple-400 border-purple-400/40',
		practice: 'text-brand border-cyan-400/40',
		lens: 'text-pink-400 border-pink-400/40',
		mindset: 'text-lime-400 border-lime-400/40',
		method: 'text-brand border-blue-400/40'
	};

	onMount(async () => {
		try {
			cards = await fetchCards();
		} catch (err) {
			console.error('Failed to load cards:', err);
		} finally {
			loading = false;
		}
	});

	$: filteredCards = cards.filter((card) => {
		const matchesSearch =
			searchTerm === '' ||
			card.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			card.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			card.letter?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = !categoryFilter || card.category === categoryFilter;
		return matchesSearch && matchesCategory;
	});

	$: isCardSelected = (card: Card) => selectedCards.some((c) => c._id === card._id);
	$: canSelectMore = selectedCards.length < maxSelection;

	function handleCardClick(card: Card) {
		if (isCardSelected(card) || canSelectMore) {
			onCardToggle(card);
		}
	}

	function getCategoryColor(category?: string): string {
		return category
			? CATEGORY_COLORS[category] || 'text-ink-muted border-slate-400/40'
			: 'text-ink-muted border-slate-400/40';
	}
</script>

{#if isMobile}
	<!-- Mobile: Bottom Drawer -->
	<div
		class="fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 {isOpen
			? 'translate-y-0'
			: 'translate-y-full'}"
	>
		<!-- Backdrop -->
		{#if isOpen}
			<button
				class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40"
				on:click={closePanel}
				aria-label="Close card panel"
			/>
		{/if}

		<!-- Drawer Content -->
		<div
			class="relative max-h-[85vh] overflow-hidden rounded-t-3xl border-t border-cyan-400/30 bg-slate-900 shadow-2xl"
		>
			<!-- Handle -->
			<div class="flex justify-center pt-3 pb-2">
				<div class="h-1.5 w-12 rounded-full bg-slate-600" />
			</div>

			<!-- Header -->
			<div class="border-b border-slate-700 px-4 pb-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<IconCards class="h-5 w-5 text-brand" />
						<h3 class="text-lg font-semibold text-white">Design Cards</h3>
					</div>
					<button
						on:click={closePanel}
						class="rounded-lg p-2 text-ink-muted hover:bg-slate-800 hover:text-white"
					>
						<IconX class="h-5 w-5" />
					</button>
				</div>

				<p class="mt-2 text-xs text-ink-muted">
					Selected {selectedCards.length}/{maxSelection} cards
				</p>
			</div>

			<!-- Search & Filter -->
			<div class="border-b border-slate-700 p-4 space-y-3">
				<div class="relative">
					<IconSearch class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
					<input
						type="text"
						placeholder="Search cards..."
						bind:value={searchTerm}
						class="w-full rounded-lg border border-slate-600 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
					/>
				</div>

				<!-- Category Filter -->
				<div class="flex gap-2 overflow-x-auto pb-2">
					<button
						on:click={() => (categoryFilter = null)}
						class="whitespace-nowrap rounded-full border px-3 py-1 text-xs transition {categoryFilter ===
						null
							? 'border-cyan-400 bg-brand/10 text-brand'
							: 'border-slate-600 text-ink-muted hover:border-slate-500'}"
					>
						All
					</button>
					{#each CATEGORIES as category}
						<button
							on:click={() => (categoryFilter = category)}
							class="whitespace-nowrap rounded-full border px-3 py-1 text-xs capitalize transition {categoryFilter ===
							category
								? getCategoryColor(category) + ' bg-current/10'
								: 'border-slate-600 text-ink-muted hover:border-slate-500'}"
						>
							{category}
						</button>
					{/each}
				</div>
			</div>

			<!-- Card Grid -->
			<div class="max-h-[50vh] overflow-y-auto p-4">
				{#if loading}
					<div class="flex items-center justify-center py-12">
						<div
							class="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"
						/>
					</div>
				{:else if filteredCards.length === 0}
					<p class="py-12 text-center text-sm text-ink-muted">No cards found</p>
				{:else}
					<div class="grid grid-cols-2 gap-3">
						{#each filteredCards as card}
							{@const selected = isCardSelected(card)}
							{@const disabled = !selected && !canSelectMore}
							<button
								on:click={() => handleCardClick(card)}
								{disabled}
								class="group relative rounded-xl border p-3 text-left transition {selected
									? 'border-cyan-400 bg-brand/10 shadow-lg shadow-cyan-400/20'
									: disabled
										? 'border-slate-700 bg-slate-800/50 opacity-50'
										: 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'}"
							>
								{#if selected}
									<div
										class="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-ink"
									>
										<IconCheck class="h-4 w-4" />
									</div>
								{/if}

								<div class="mb-2 flex items-center justify-between">
									<span
										class="flex h-8 w-8 items-center justify-center rounded-lg border font-bold {getCategoryColor(
											card.category
										)}"
									>
										{card.letter || '?'}
									</span>
									{#if card.category}
										<span
											class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider {getCategoryColor(
												card.category
											)}"
										>
											{card.category}
										</span>
									{/if}
								</div>

								<h4 class="font-medium text-white text-sm line-clamp-2">{card.title}</h4>
								{#if card.description}
									<p class="mt-1 text-xs text-ink-muted line-clamp-2">{card.description}</p>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Selected Cards Quick View -->
			{#if selectedCards.length > 0}
				<div class="border-t border-slate-700 bg-slate-900/95 p-4">
					<p class="mb-2 text-xs font-medium uppercase tracking-wider text-brand">My Cards</p>
					<div class="flex flex-wrap gap-2">
						{#each selectedCards as card}
							<button
								on:click={() => onCardToggle(card)}
								class="group flex items-center gap-2 rounded-full border border-cyan-400/40 bg-brand/10 px-3 py-1.5 text-xs text-brand transition hover:bg-brand/20"
							>
								<span class="font-bold">{card.letter}</span>
								<span>{card.title}</span>
								<IconX class="h-3 w-3 opacity-60 group-hover:opacity-100" />
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- Desktop: Side Panel -->
	<div class="flex h-full w-full flex-col border-l border-slate-700 bg-slate-900">
		<!-- Header -->
		<button
			on:click={() => (isPanelExpanded = !isPanelExpanded)}
			class="flex items-center justify-between border-b border-slate-700 p-4 hover:bg-slate-800/50 transition"
		>
			<div class="flex items-center gap-2">
				<IconCards class="h-5 w-5 text-brand" />
				<h3 class="font-semibold text-white">Design Cards</h3>
			</div>
			{#if isPanelExpanded}
				<IconChevronDown class="h-5 w-5 text-ink-muted" />
			{:else}
				<IconChevronRight class="h-5 w-5 text-ink-muted" />
			{/if}
		</button>

		{#if isPanelExpanded}
			<!-- Search & Filter -->
			<div class="border-b border-slate-700 p-4 space-y-3">
				<div class="relative">
					<IconSearch class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
					<input
						type="text"
						placeholder="Search cards..."
						bind:value={searchTerm}
						class="w-full rounded-lg border border-slate-600 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
					/>
				</div>

				<p class="text-xs text-ink-muted">
					Selected {selectedCards.length}/{maxSelection}
				</p>

				<!-- Category Pills -->
				<div class="flex flex-wrap gap-2">
					<button
						on:click={() => (categoryFilter = null)}
						class="rounded-full border px-2.5 py-1 text-xs transition {categoryFilter === null
							? 'border-cyan-400 bg-brand/10 text-brand'
							: 'border-slate-600 text-ink-muted hover:border-slate-500'}"
					>
						All
					</button>
					{#each CATEGORIES as category}
						<button
							on:click={() => (categoryFilter = category)}
							class="rounded-full border px-2.5 py-1 text-xs capitalize transition {categoryFilter ===
							category
								? getCategoryColor(category) + ' bg-current/10'
								: 'border-slate-600 text-ink-muted hover:border-slate-500'}"
						>
							{category}
						</button>
					{/each}
				</div>
			</div>

			<!-- Card List -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if loading}
					<div class="flex items-center justify-center py-12">
						<div
							class="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"
						/>
					</div>
				{:else if filteredCards.length === 0}
					<p class="py-12 text-center text-sm text-ink-muted">No cards found</p>
				{:else}
					<div class="space-y-2">
						{#each filteredCards as card}
							{@const selected = isCardSelected(card)}
							{@const disabled = !selected && !canSelectMore}
							<button
								on:click={() => handleCardClick(card)}
								{disabled}
								class="group relative w-full rounded-lg border p-3 text-left transition {selected
									? 'border-cyan-400 bg-brand/10 shadow-lg shadow-cyan-400/20'
									: disabled
										? 'border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed'
										: 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'}"
							>
								{#if selected}
									<div
										class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-ink"
									>
										<IconCheck class="h-3 w-3" />
									</div>
								{/if}

								<div class="mb-2 flex items-center gap-2">
									<span
										class="flex h-7 w-7 items-center justify-center rounded border text-sm font-bold {getCategoryColor(
											card.category
										)}"
									>
										{card.letter || '?'}
									</span>
									<h4 class="flex-1 font-medium text-white text-sm">{card.title}</h4>
								</div>

								{#if card.description}
									<p class="text-xs text-ink-muted line-clamp-2">{card.description}</p>
								{/if}

								{#if card.category}
									<div class="mt-2">
										<span
											class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider {getCategoryColor(
												card.category
											)}"
										>
											{card.category}
										</span>
									</div>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Selected Cards Section -->
			{#if selectedCards.length > 0}
				<div class="border-t border-slate-700 bg-slate-900/95 p-4">
					<div class="mb-3 flex items-center gap-2">
						<IconStar class="h-4 w-4 text-brand" />
						<p class="text-xs font-medium uppercase tracking-wider text-brand">My Cards</p>
					</div>
					<div class="space-y-2">
						{#each selectedCards as card}
							<div
								class="group flex items-center justify-between rounded-lg border border-cyan-400/40 bg-brand/10 p-2"
							>
								<div class="flex items-center gap-2">
									<span
										class="flex h-6 w-6 items-center justify-center rounded border border-cyan-400 text-xs font-bold text-brand"
									>
										{card.letter}
									</span>
									<span class="text-sm text-brand">{card.title}</span>
								</div>
								<button
									on:click={() => onCardToggle(card)}
									class="rounded p-1 text-brand opacity-0 transition group-hover:opacity-100 hover:bg-brand/20"
								>
									<IconX class="h-4 w-4" />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
{/if}
