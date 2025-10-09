<script lang="ts">
  import { onMount } from 'svelte';

  export let title: string = '';
  export let ariaLabel: string = 'Interactive chart';
  export let margin = { top: 24, right: 24, bottom: 40, left: 56 };
  export let className = '';

  let container: HTMLDivElement | null = null;
  let width = 800;
  let height = 400;

  const ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver((entries) => {
        const r = entries[0]?.contentRect;
        if (r) {
          width = Math.max(0, r.width);
          height = Math.max(0, r.height);
        }
      })
    : null;

  onMount(() => {
    if (container && ro) ro.observe(container);
    return () => ro?.disconnect();
  });

  $: innerWidth = Math.max(0, width - margin.left - margin.right);
  $: innerHeight = Math.max(0, height - margin.top - margin.bottom);
</script>

<div bind:this={container} class={`w-full h-full ${className}`}>
  <svg
    role="img"
    aria-label={ariaLabel || title}
    viewBox={`0 0 ${Math.max(0, width)} ${Math.max(0, height)}`}
    width="100%"
    height="100%"
  >
    {#if title}
      <title>{title}</title>
    {/if}
    <g transform={`translate(${margin.left},${margin.top})`}>
      <slot {width} {height} {innerWidth} {innerHeight} {margin}></slot>
    </g>
  </svg>
  <slot name="tooltip" />
</div>

<style>
  svg { display: block; }
</style>

