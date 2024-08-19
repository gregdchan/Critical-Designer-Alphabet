<!-- <script lang="ts">
  import client from '$lib/sanity';
  import { onMount } from 'svelte';

  interface Card {
    name: string;
    type: string;
    color: string;
    description: string;
    prompt: string;
    _id: string;
  }

  let cards: Card[] = [];

  onMount(async () => {
    const query = '*[_type == "cards"]';
    cards = await client.fetch(query);
  });

</script> -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchCards } from '$lib/Cards';
  import type { Card } from '$lib/Cards';

  let cards: Card[] = [];

  onMount(async () => {
    cards = await fetchCards();
  });
</script>

<main class="container">
  <h1>Cards</h1>
  {#if cards.length > 0}
  <div class="container">
    <div class="grid">
      {#each cards.sort((a, b) => a._id.localeCompare(b._id)) as card}
        <article class="card" style="background-color: {card.color}">
          <header>
        <h2>{card.name}</h2>
          </header>
          <p>Type: {card.type}</p>
          <p>Color: {card.color}</p>
          <p>Description: {card.description}</p>
          <p>Prompt: {card.prompt}</p>
          <!-- <p>ID: {card._id}</p> -->
        </article>
      {/each}
    </div>
  </div>
{:else}
  <p>Loading...</p>
{/if}
</main>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    list-style: none;
    padding: 0;;
  }

  .card {
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: var(--card-color);
    box-shadow: 0 12px 12px rgba(0, 0, 0, 0.9);
  }

  .card header {
    background: #000;
  }

  /* Adjustments for smaller screens */
  @media (max-width: 1200px) {
    .grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (max-width: 900px) {
    .grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 600px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 400px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>