<script lang="ts">
  import { injectAnalytics } from '@vercel/analytics/sveltekit'
  import { dev } from '$app/environment';
  import "../app.css";

  let { children } = $props();
  
  injectAnalytics({ mode: dev ? 'development' : 'production' });
</script>

{@render children()}

<footer>
  <a href="https://github.com/ngalaiko/goteborgfilmfestival">Source code</a>
</footer>

<style>
  footer {
    text-align: right;
    padding: 8px;
    font-size: 12px;
    color: #666;
  }

  footer a {
    color: #666;
  }
</style>
