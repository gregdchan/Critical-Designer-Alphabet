<script lang="ts">
	import Header from './header.svelte';
	import Footer from './Footer.svelte';
  import '../app.scss';
  // import { page } from '$app/stores';
  //   let path;

  //   $: path = $page.url.pathname;
</script>

  <Header/>
  <div class="container">
  <slot />
  <Footer/>
  </div>
