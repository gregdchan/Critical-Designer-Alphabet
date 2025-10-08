<script lang="ts">
	import Header from './header.svelte';
	import Footer from './Footer.svelte';
	import '../app.css';
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>
<div class="flex min-h-screen flex-col bg-slate-100 text-slate-900">
	<div class="flex min-h-screen flex-col">
		<Header />
		<main
			id="main-content"
			class="surface mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 focus:outline-none sm:px-8"
			tabindex="-1"
		>
			<slot />
		</main>
		<Footer />
	</div>
</div>
