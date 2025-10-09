<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let open = false;

	const dispatch = createEventDispatcher();

	function handleBackdropClick() {
		dispatch('backdrop');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			dispatch('backdrop');
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
		on:click={handleBackdropClick}
		role="button"
		tabindex="-1"
		on:keydown
	></div>

	<!-- Drawer -->
	<div
		class="fixed top-0 right-0 h-full w-full max-w-2xl bg-white border-l-4 border-slate-200 shadow-2xl z-50 overflow-y-auto"
	>
		<slot />
	</div>
{/if}
