<script lang="ts">
  import { injectAnalytics } from "@vercel/analytics/sveltekit";
  import { dev } from "$app/environment";
  import "../app.css";

  let { children } = $props();

  injectAnalytics({ mode: dev ? "development" : "production" });
</script>

<div class="layout">
  <main>
    {@render children()}
  </main>

  <footer>
    <a href="https://github.com/ngalaiko/goteborgfilmfestival">source code</a>
  </footer>
</div>

<style>
  .layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  footer {
    flex-shrink: 0;
    text-align: right;
    padding: 4px 8px;
    font-size: 0.875rem;
    color: #666;
  }

  footer a {
    color: #666;
  }
</style>
