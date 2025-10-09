<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    ariaLabel?: string;
    margin?: { top: number; right: number; bottom: number; left: number };
    className?: string;
    children: Snippet<[{ width: number; height: number; innerWidth: number; innerHeight: number; margin: { top: number; right: number; bottom: number; left: number } }]>;
    tooltip?: Snippet;
  }

  let { title = '', ariaLabel = 'Interactive chart', margin = { top: 24, right: 24, bottom: 40, left: 56 }, className = '', children, tooltip }: Props = $props();

  let container: HTMLDivElement | null = $state(null);
  let width = $state(800);
  let height = $state(400);

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

  const innerWidth = $derived(Math.max(0, width - margin.left - margin.right));
  const innerHeight = $derived(Math.max(0, height - margin.top - margin.bottom));
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
      {@render children({ width, height, innerWidth, innerHeight, margin })}
    </g>
  </svg>
  {#if tooltip}
    {@render tooltip()}
  {/if}
</div>

<style>
  svg { display: block; }
</style>

