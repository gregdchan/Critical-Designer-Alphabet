<script>
  import { onMount } from 'svelte';
  import logo from '$lib/logo.png';

  let activePath = '';

  // Ensure this code only runs in the browser
  onMount(() => {
    activePath = window.location.pathname;

    // Update activePath whenever the URL changes
    const updatePath = () => {
      activePath = window.location.pathname;
    };

    window.addEventListener('popstate', updatePath);

    // Clean up the event listener when the component is destroyed
    return () => {
      window.removeEventListener('popstate', updatePath);
    };
  });

  // Function to update the active path when a link is clicked
  // @ts-ignore
  function handleLinkClick(event) {
    activePath = event.currentTarget.getAttribute('href');
  }
</script>


<nav>
  <ul>
    <li>
        <img src="{logo}" alt="Logo" class="logo"/> <span class="title">Designer's Critical Alphabet</span>
    </li>
  </ul>
  <ul>
    <li><a href="/" class="{activePath === '/' ? 'active' : ''}" on:click={handleLinkClick}>Home</a></li>
    <li><a href="/cards" class="{activePath === '/cards' ? 'active' : ''}" on:click={handleLinkClick}>Cards</a></li>
    <li><a href="/session" class="{activePath === '/session' ? 'active' : ''}" on:click={handleLinkClick}>Session</a></li>
    <li><a href="/about" class="{activePath === '/about' ? 'active' : ''}" on:click={handleLinkClick}>About</a></li>
  </ul>
</nav>

<style>
  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: var(--nav-background-color, #f0f0f0); /* Replace '#f0f0f0' with your desired background color */
  }

  ul {
    display: flex;
    list-style-type: none;
  }

  li {
    margin-right: 1rem;
  }

  a {
    text-decoration: none;
    color: var(--link-color, black); /* Replace 'black' with your desired link color */
  }

    /* Define the styles for the active link */
    .active {
    color: var(--active-color, red); /* Replace 'red' with your desired active color */
  }

  .logo {
    width: 50px;
    height: 50px;
  }

  .title {
    font-size: 1.5rem;
    font-weight: bold;
    color: black;
  }

</style>