<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchCards } from '$lib/Cards';
  import type { Card } from '$lib/Cards';

  let cards: Card[] = [];

  onMount(async () => {
    cards = await fetchCards();
  });

    let selectedCards: Card[] = [];

    function grabCard(card: Card) {
      if (!selectedCards.includes(card)) {
      selectedCards = [...selectedCards, card];
      cards = cards.filter(c => c !== card);
      }
    }
    function removeCard(card: Card) {
      selectedCards = selectedCards.filter(selectedCard => selectedCard !== card);
      cards = [...cards, card];
    }

    let showPrompt = false;

    $: if (selectedCards.length >= 5) {
      showPrompt = true;
    }
</script>

<main class="row">
  {#if cards.length > 0}
    <div class="grid-75">
      <h1>Cards</h1>
      <div class="grid">
        {#each cards.sort((a, b) => a.name.localeCompare(b.name)) as card}
          <article class="card" style="background-color: {card.color}">
            <header>
              <h3>{card.name}</h3>
            </header>
            <div>
              <p>Type: {card.type}</p>
              <p>Color: {card.color}</p>
              <p>Description: {card.description}</p>
              <p>Prompt: {card.prompt}</p>
              <button id="selectCard" on:click={() => grabCard(card)} disabled={selectedCards.includes(card) || selectedCards.length >= 5}>
                {selectedCards.includes(card) ? 'Added' : 'Grab'}
              </button>
            </div>
          </article>
        {/each}
      </div>
    </div>
    <div class="selected-cards grid-25">
      <h2>Selected Cards</h2>
      {#if selectedCards.length > 0}
        <div class="grid">
          {#each selectedCards as card}
            <article class="card" style="background-color: {card.color}">
              <header>
                <h2>{card.name}</h2>
              </header>
              <div>
                <p>Type: {card.type}</p>
                <p>Color: {card.color}</p>
                <p>Description: {card.description}</p>
                <p>Prompt: {card.prompt}</p>
                <button id="removeCard" on:click={() => removeCard(card)}>
                  Remove
                </button>
              </div>
            </article>
          {/each}
        </div>
      {:else}
        <p>No cards selected.</p>
      {/if}
    </div>
    {#if showPrompt}
      <div class="overlay">
      <div class="prompt">
        <p>Proceed to next step?</p>
        <button on:click={() => alert('Proceeding to next step...')}>Yes</button>
        <button on:click={() => showPrompt = false}>No</button>
      </div>
      </div>
    {/if}
  {/if}
</main>


<style>
  .card {
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: var(--card-color);
    box-shadow: 0 12px 12px rgba(0, 0, 0, 0.9);
  }

  .card header {
    background: #000;
  }

  .grid-75 {
  width: 75%;
}

.grid-25 {
  width: 25%;
}

.grid-75 .grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 equal-width columns */
  gap: 1rem; /* Optional: adds space between grid items */
}

.grid-25 .grid {
  display: grid;
  grid-template-columns: 1fr; /* 1 column */
  gap: 1rem; /* Optional: adds space between grid items */
}

  /* Adjustments for smaller screens */
  @media (max-width: 1200px) {
    .grid-75 .grid{
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 900px) {
    .grid-75 .grid{
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 600px) {
    .grid-75 .grid{
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 400px) {
    .grid-75 .grid{
      grid-template-columns: 1fr;
    }
  } 



.row {
  display: flex;
  gap: 1rem; /* Optional: adds space between the two main divs */
}

  .selected-cards h2{
    color: #008a17 !important;
    }

    .selected-cards .grid {
      grid-template-columns: 1fr;
    }

    .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .prompt {
    background: white;
    padding: 2rem;
    border-radius: 0.5rem;
    text-align: center;
  }

  .prompt button {
    margin: 0.5rem;
  }
</style>