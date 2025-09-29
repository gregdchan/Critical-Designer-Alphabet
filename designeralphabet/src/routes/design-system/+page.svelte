<script lang="ts">
  // import { Button, Badge } from '@skeletonlabs/skeleton';
  import { IconMessage as MessageSquare, IconStar as Sparkles, IconBolt as Zap } from '@tabler/icons-svelte';

  const palette = [
    { name: 'Neon Pink', value: '#ff2aad', className: 'bg-neonPink', shadow: 'shadow-neon-pink' },
    { name: 'Neon Cyan', value: '#00fff7', className: 'bg-neonCyan', shadow: 'shadow-neon-cyan' },
    { name: 'Neon Lime', value: '#aaff00', className: 'bg-neonLime', shadow: 'shadow-neon-lime' },
    { name: 'Retro Purple', value: '#6c00ff', className: 'bg-retroPurple', shadow: 'shadow-neon-pink' },
    { name: 'Midnight', value: '#050505', className: 'bg-midnight', shadow: 'shadow-none' }
  ];

  const typography = [
    {
      label: 'Display / Retro',
      fontClass: 'font-retro',
      preview: 'CRITICAL DESIGN MODE',
      usage: 'Hero headings, counters, badge titles'
    },
    {
      label: 'Body / Techno',
      fontClass: 'font-techno',
      preview: 'Inclusive futures are co-designed.',
      usage: 'Body copy, form labels, descriptive text'
    }
  ];

  const badges = [
    {
      title: 'Neon Connector',
      description: 'Link three or more retro cards in one inclusive idea arc.',
      accent: 'text-neonCyan border-neonCyan/50'
    },
    {
      title: 'Critical Thinker',
      description: 'Complete Positionality + Justice steps without skipping.',
      accent: 'text-neonPink border-neonPink/50'
    },
    {
      title: 'Retro Hero',
      description: 'Stay active and present through all facilitation stages.',
      accent: 'text-neonLime border-neonLime/50'
    }
  ];
</script>

<div class="space-y-16">
  <header class="rounded-[2.5rem] border border-white/10 bg-midnight/70 px-6 py-12 shadow-[0_0_40px_rgba(0,255,247,0.08)] sm:px-10">
    <div class="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
      <div class="space-y-6">
        <p class="inline-flex items-center gap-2 rounded-full border border-neonCyan/50 bg-neonCyan/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-neonCyan shadow-neon-cyan">
          <Sparkles class="h-4 w-4" /> Retro Design System
        </p>
        <h1 class="max-w-3xl font-retro text-2xl uppercase tracking-[0.45em] text-white sm:text-3xl">
          Critical Designer Alphabet — Neon System Kit
        </h1>
        <p class="max-w-2xl text-sm text-white/70">
          Track every token, component, and motion primitive that powers the retro-tech experience. Drop new modules in as
          you build features, validate accessibility, and celebrate inclusive interaction patterns.
        </p>
      </div>
      <div class="rounded-3xl border border-white/10 bg-midnight/80 p-6 text-xs uppercase tracking-[0.3em] text-white/60 shadow-neon-cyan">
        <p>Version 0.2 — {new Date().toLocaleDateString()}</p>
        <p class="mt-2 text-white/50">Press Start 2P + Orbitron · Tailwind · Skeleton UI</p>
      </div>
    </div>
  </header>

  <section class="grid gap-8 rounded-[2.5rem] border border-white/10 bg-midnight/75 p-8 lg:grid-cols-2">
    <div>
      <h2 class="font-retro text-xl uppercase tracking-[0.4em] text-neonCyan">Color Tokens</h2>
      <p class="mt-3 text-sm text-white/65">All neon hues meet WCAG AA contrast on dark backgrounds. Apply sparingly with generous spacing to reduce visual fatigue.</p>
      <div class="mt-6 grid gap-4 md:grid-cols-2">
        {#each palette as swatch}
          <div class="rounded-2xl border border-white/10 bg-black/60 p-5 shadow-[0_0_25px_rgba(255,255,255,0.05)]">
            <div class={`h-16 rounded-xl ${swatch.className} ${swatch.shadow}`} />
            <p class="mt-4 text-sm text-white">{swatch.name}</p>
            <p class="text-xs text-white/50">{swatch.value}</p>
          </div>
        {/each}
      </div>
    </div>
    <div class="space-y-6">
      <h2 class="font-retro text-xl uppercase tracking-[0.4em] text-neonLime">Typography</h2>
      {#each typography as sample}
        <div class="rounded-2xl border border-white/10 bg-black/60 p-5 shadow-[0_0_25px_rgba(255,255,255,0.05)]">
          <p class="text-xs uppercase tracking-[0.3em] text-white/60">{sample.label}</p>
          <p class={`mt-3 text-xl text-white ${sample.fontClass}`}>{sample.preview}</p>
          <p class="mt-3 text-xs text-white/60">{sample.usage}</p>
        </div>
      {/each}
      <div class="rounded-2xl border border-neonCyan/40 bg-neonCyan/10 p-5 text-xs uppercase tracking-[0.3em] text-neonCyan shadow-neon-cyan">
        Import fonts once in <code class="code">src/app.html</code>. Use <span class="font-retro">retro</span> for display, <span class="font-techno">techno</span> for body.
      </div>
    </div>
  </section>

  <section class="grid gap-10 rounded-[2.5rem] border border-white/10 bg-midnight/80 p-8 lg:grid-cols-[0.9fr_1.1fr]">
    <div class="space-y-6">
      <h2 class="font-retro text-xl uppercase tracking-[0.4em] text-neonPink">Buttons</h2>
      <p class="text-sm text-white/65">Skeleton buttons inherit Tailwind tokens. Pair neon glow with generous padding and uppercase tracking for the arcade feel.</p>
      <div class="flex flex-wrap gap-4">
        <button class="rounded-full border border-neonPink/40 bg-neonPink/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-neonPink shadow-neon-pink hover:bg-neonPink/30 transition-all">
          Launch Session
        </button>
        <button class="rounded-full border border-neonCyan/40 bg-neonCyan/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-neonCyan shadow-neon-cyan hover:bg-neonCyan/30 transition-all">
          Random Draw
        </button>
        <button class="rounded-full border border-neonLime/40 bg-neonLime/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-neonLime shadow-neon-lime hover:bg-neonLime/30 transition-all">
          Give Kudos
        </button>
      </div>
      <div class="space-y-4 text-xs text-white/60">
        <p><strong class="text-neonCyan">Focus rings:</strong> rely on <code class="code">focus-visible</code> utilities and neon offsets for keyboard clarity.</p>
        <p><strong class="text-neonPink">Motion:</strong> limit to 200–300ms pulses, respect reduced motion flags.</p>
      </div>
    </div>
    <div class="space-y-6">
      <h2 class="font-retro text-xl uppercase tracking-[0.4em] text-neonCyan">Card Shell</h2>
      <div class="rounded-[2rem] border border-neonCyan/30 bg-black/60 p-6 shadow-neon-cyan">
        <div class="flex items-center justify-between">
          <span class="px-3 py-1 bg-neonCyan text-midnight rounded-full uppercase tracking-[0.25em] text-xs font-semibold">Lens</span>
          <span class="font-retro text-xs uppercase tracking-[0.3em] text-neonCyan">CARD-09</span>
        </div>
        <h3 class="mt-6 font-retro text-lg uppercase tracking-[0.4em] text-white">Representation</h3>
        <p class="mt-4 text-sm text-white/70">
          Examine who holds power in storytelling and ensure visibility for communities most impacted by design decisions.
        </p>
        <div class="mt-6 flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.25em] text-white/60">
          <span class="rounded-full border border-neonCyan/40 bg-neonCyan/10 px-3 py-1">Justice</span>
          <span class="rounded-full border border-neonPink/40 bg-neonPink/10 px-3 py-1">Asset-based</span>
          <span class="rounded-full border border-neonLime/40 bg-neonLime/10 px-3 py-1">Storywork</span>
        </div>
      </div>
    </div>
  </section>

  <section class="grid gap-8 rounded-[2.5rem] border border-white/10 bg-midnight/75 p-8 lg:grid-cols-[1.05fr_0.95fr]">
    <div class="space-y-6">
      <h2 class="font-retro text-xl uppercase tracking-[0.4em] text-neonCyan">Arcade Chat</h2>
      <div class="rounded-[2rem] border border-white/10 bg-black/70 p-6 shadow-[0_0_35px_rgba(0,255,247,0.12)]">
        <div class="space-y-4">
          <div class="flex gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-neonPink/50 bg-neonPink/20 shadow-neon-pink">
              <MessageSquare class="h-5 w-5 text-neonPink" />
            </div>
            <div class="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
              <p class="font-techno uppercase tracking-[0.25em] text-neonPink">Nova</p>
              <p class="mt-2">Reframe this prompt using community-generated metaphors in 90 seconds.</p>
            </div>
          </div>
          <div class="flex gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-neonCyan/50 bg-neonCyan/20 shadow-neon-cyan">
              <Zap class="h-5 w-5 text-neonCyan" />
            </div>
            <div class="rounded-xl border border-white/10 bg-neonCyan/10 p-4 text-xs text-white/80">
              <p class="font-techno uppercase tracking-[0.25em] text-neonCyan">Pulse Bot</p>
              <p class="mt-2">Challenge unlocked → "Justice Remix". Earn +30 neon if everyone contributes.</p>
            </div>
          </div>
        </div>
      </div>
      <p class="text-xs uppercase tracking-[0.3em] text-white/60">Use Supabase Realtime for streaming chat, presence colors, and read receipts.</p>
    </div>
    <div class="space-y-6">
      <h2 class="font-retro text-xl uppercase tracking-[0.4em] text-neonPink">Badge Library</h2>
      <div class="grid gap-4 md:grid-cols-3">
        {#each badges as badge}
          <div class={`rounded-xl border bg-black/60 p-4 text-xs text-white/65 shadow-[0_0_25px_rgba(255,255,255,0.06)] ${badge.accent}`}>
            <p class="font-retro text-[0.65rem] uppercase tracking-[0.35em]">{badge.title}</p>
            <p class="mt-3 leading-relaxed">{badge.description}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="rounded-[2.5rem] border border-white/10 bg-midnight/80 p-8">
    <h2 class="font-retro text-xl uppercase tracking-[0.4em] text-neonLime">Motion & Accessibility</h2>
    <div class="mt-6 grid gap-6 md:grid-cols-3">
      <div class="rounded-2xl border border-neonCyan/40 bg-neonCyan/10 p-6 text-xs uppercase tracking-[0.3em] text-neonCyan shadow-neon-cyan">
        Neon Pulse
        <div class="mt-4 h-32 rounded-xl border border-white/20 bg-black/60 shadow-neon-cyan animate-neon-pulse" />
      </div>
      <div class="rounded-2xl border border-neonPink/40 bg-neonPink/10 p-6 text-xs uppercase tracking-[0.3em] text-neonPink shadow-neon-pink">
        Scanline Flicker
        <div class="mt-4 h-32 rounded-xl border border-white/20 bg-black/60 animate-flicker" />
      </div>
      <div class="rounded-2xl border border-neonLime/40 bg-neonLime/10 p-6 text-xs uppercase tracking-[0.3em] text-neonLime shadow-neon-lime">
        Accessible Defaults
        <ul class="mt-4 space-y-2 text-[0.65rem] text-white/70">
          <li>Focus rings always visible</li>
          <li>Reduced motion utility toggles</li>
          <li>Typography scaled to maintain contrast ratio</li>
        </ul>
      </div>
    </div>
  </section>
</div>
