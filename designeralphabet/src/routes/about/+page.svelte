<script lang="ts">
  import type { PageContent } from '$lib/pages';

  export let data: {
    page: PageContent | null;
    error?: string;
  };

  const page = data.page;
  const heroSubtitle =
    page?.heroSubtitle ?? page?.localizedHeroSubtitle?.en ?? page?.localizedHeroSubtitle?.fr ?? undefined;
  const summary =
    page?.summaryText ?? page?.localizedSummary?.en ?? page?.localizedSummary?.fr ?? undefined;
</script>

{#if !page}
  <section class="rounded-[2.5rem] border border-white/10 bg-midnight/80 p-10 text-center text-white/70">
    <h1 class="font-retro text-2xl uppercase tracking-[0.4em] text-neonPink">About</h1>
    <p class="mt-4 text-sm text-white/60">
      {data.error ?? "Content isn’t published yet. Add an About page in Sanity Studio to populate this view."}
    </p>
  </section>
{:else}
  <div class="space-y-12 text-white">
    <section class="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-midnight/80 px-6 py-12 shadow-[0_0_40px_rgba(0,255,247,0.12)] sm:px-12">
      <div class="absolute -left-24 top-10 h-64 w-64 rounded-full bg-neonPink/25 blur-3xl" aria-hidden="true" />
      <div class="absolute -right-12 bottom-0 h-72 w-72 rounded-full bg-neonCyan/25 blur-3xl" aria-hidden="true" />
      <div class="relative z-10 space-y-6">
        {#if page.eyebrow}
          <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
            {page.eyebrow}
          </span>
        {/if}
        <div class="space-y-4">
          <h1 class="font-retro text-3xl uppercase tracking-[0.45em] text-white sm:text-4xl">
            {page.heroTitle ?? page.title}
          </h1>
          {#if heroSubtitle}
            <p class="max-w-3xl text-sm text-white/75 sm:text-base">{heroSubtitle}</p>
          {/if}
        </div>
        {#if summary}
          <div class="max-w-4xl rounded-[2rem] border border-neonCyan/40 bg-neonCyan/10 px-6 py-4 text-sm text-white/85 shadow-neon-cyan">
            <p class="whitespace-pre-line">{summary}</p>
          </div>
        {/if}
        {#if page.cta?.label && page.cta?.href}
          <a
            class="inline-flex items-center gap-2 rounded-full border border-neonPink/50 bg-neonPink/20 px-5 py-3 text-xs uppercase tracking-[0.3em] text-neonPink shadow-neon-pink transition hover:bg-neonPink/30"
            href={page.cta.href}
          >
            {page.cta.label}
          </a>
        {/if}
      </div>
    </section>

    {#if page.sections?.length}
      <section class="space-y-8">
        {#each page.sections as section, index (section._key)}
          <div
            class="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-midnight/85 px-6 py-8 shadow-[0_0_30px_rgba(0,0,0,0.45)] transition hover:-translate-y-1 hover:shadow-[0_0_45px_rgba(0,255,247,0.18)] sm:px-10"
          >
            <div class="absolute inset-0 opacity-20" aria-hidden="true">
              <div
                class="absolute inset-y-0 right-0 w-1/2"
                style={`background: linear-gradient(270deg, ${section.accentColor ?? 'rgba(0,255,247,0.35)'} 0%, transparent 80%);`}
              ></div>
            </div>
            <div class="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div class="space-y-4">
                {#if section.eyebrow}
                  <p class="text-[0.6rem] uppercase tracking-[0.35em] text-white/50">{section.eyebrow}</p>
                {/if}
                {#if section.title}
                  <h2 class="font-retro text-xl uppercase tracking-[0.4em] text-neonCyan">{section.title}</h2>
                {/if}
                {#if section.bodyText}
                  <p class="whitespace-pre-line text-sm leading-relaxed text-white/75">{section.bodyText}</p>
                {/if}
              </div>
              {#if section.image?.url}
                <div class="flex items-center justify-center">
                  <div class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/60 shadow-[0_0_30px_rgba(0,255,247,0.15)]">
                    <img
                      src={section.image.url}
                      alt={section.image.alt ?? section.title ?? 'Section media'}
                      class="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <span class="pointer-events-none absolute inset-0 border border-white/10" aria-hidden="true" />
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </section>
    {/if}
  </div>
{/if}
