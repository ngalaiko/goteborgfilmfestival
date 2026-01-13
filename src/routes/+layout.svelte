<script lang="ts">
  import { injectAnalytics } from "@vercel/analytics/sveltekit";
  import { dev } from "$app/environment";
  import "../app.css";

  let { children } = $props();

  injectAnalytics({ mode: dev ? "development" : "production" });
</script>

<main>
  {@render children()}
</main>

<footer>
  <a href="https://github.com/ngalaiko/goteborgfilmfestival">source code</a>
</footer>

<style>
  footer {
    text-align: right;
    height: 1rem;
    font-size: 0.875rem;
    color: #666;
  }

  footer a {
    color: #666;
  }
</style>
