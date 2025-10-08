<script lang="ts">
	import { derived, get } from 'svelte/store';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import logo from '$lib/logo.png';
	import {
		IconStar as Sparkles,
		IconMenu2 as Menu,
		IconX as X,
		IconHome as Home
	} from '@tabler/icons-svelte';
	import { currentUser } from '$lib/stores/user';
	import { clearParticipantProfile } from '$lib/realtime';

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/dashboard', label: 'Dashboard' },
		// { href: '/cards', label: 'Card Library' }, // Temporarily hidden - not usable with current exercise
		{ href: '/session', label: 'Live Session' },
		{ href: '/about', label: 'About' }
	];

	const activePath = derived(page, ($page) => $page.url.pathname);
	let menuOpen = false;

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	function emergencyExit() {
		if (confirm('Leave session and return to home?')) {
			if (browser) {
				const active = get(currentUser);
				if (active?.sessionCode) {
					clearParticipantProfile(active.sessionCode);
				} else {
					clearParticipantProfile('');
				}
				currentUser.set(null);
			}
			goto('/');
		}
	}

	$: isInSession = $activePath.includes('/session/');
</script>

<header class="sticky top-0 z-40 border-b border-slate-700 bg-slate-800/95 backdrop-blur-sm">
	<div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
		<a
			href="/"
			class="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-100 transition hover:bg-slate-700"
			aria-label="Designer's Critical Alphabet home"
			on:click={closeMenu}
		>
			<span class="flex h-8 w-8 items-center justify-center rounded bg-slate-700">
				<img src={logo} alt="Designer's Critical Alphabet" class="h-6 w-6" />
			</span>
			<div class="flex flex-col text-left">
				<span class="text-sm font-semibold">Critical Alphabet</span>
				<span class="text-xs text-slate-400">Inclusive Planning</span>
			</div>
		</a>

		<nav aria-label="Primary navigation" class="hidden items-center gap-1 md:flex">
			{#each links as link}
				<a
					href={link.href}
					class={`rounded-md px-3 py-2 text-sm font-medium transition ${
						$activePath === link.href
							? 'bg-blue-600 text-white'
							: 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
					}`}
					aria-current={$activePath === link.href ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="flex items-center gap-3">
			{#if isInSession}
				<button
					class="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
					on:click={emergencyExit}
					title="Emergency exit from session"
				>
					<Home class="h-4 w-4" />
					<span class="hidden sm:inline">Exit Session</span>
				</button>
			{:else}
				<a
					class="hidden items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 sm:flex"
					href="/session"
				>
					<Sparkles class="h-4 w-4" />
					Start Session
				</a>
			{/if}
			<button
				class="rounded-md bg-slate-700 p-2 text-slate-300 transition hover:bg-slate-600 md:hidden"
				type="button"
				aria-expanded={menuOpen}
				aria-label="Toggle navigation"
				on:click={toggleMenu}
			>
				{#if menuOpen}
					<X class="h-5 w-5" />
				{:else}
					<Menu class="h-5 w-5" />
				{/if}
			</button>
		</div>
	</div>

	{#if menuOpen}
		<div class="border-t border-slate-700 bg-slate-800 px-4 py-4 md:hidden">
			<nav class="flex flex-col gap-2" aria-label="Mobile navigation">
				{#each links as link}
					<a
						href={link.href}
						class={`rounded-md px-3 py-2 text-sm font-medium transition ${
							$activePath === link.href
								? 'bg-blue-600 text-white'
								: 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
						}`}
						aria-current={$activePath === link.href ? 'page' : undefined}
						on:click={closeMenu}
					>
						{link.label}
					</a>
				{/each}
				{#if isInSession}
					<button
						class="flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white mt-2"
						on:click={() => {
							closeMenu();
							emergencyExit();
						}}
					>
						<Home class="h-4 w-4" />
						Exit Session
					</button>
				{:else}
					<a
						class="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white mt-2"
						href="/session"
						on:click={closeMenu}
					>
						<Sparkles class="h-4 w-4" />
						Start Session
					</a>
				{/if}
			</nav>
		</div>
	{/if}
</header>
