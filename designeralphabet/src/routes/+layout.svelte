<script lang="ts">
	import { onMount } from 'svelte';
	import Header from './header.svelte';
	import Footer from './Footer.svelte';
	import '../app.css';

	onMount(() => {
		const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
		document.documentElement.classList.toggle('dark', !!prefersDark);
	});
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>
<div class="flex min-h-screen flex-col surface text-primary">
	<div class="flex min-h-screen flex-col">
		<Header />
		<main
			id="main-content"
			class="surface mx-auto w-full max-w-6xl flex-1 px-2 sm:px-6 md:px-8 pb-12 md:pb-16 pt-8 sm:pt-12 md:pt-16 text-primary focus:outline-none"
			tabindex="-1"
		>
			<slot />
		</main>
		<Footer />
	</div>
</div>
