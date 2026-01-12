<script lang="ts">
  import { injectAnalytics } from '@vercel/analytics/sveltekit'
  import { dev } from '$app/environment';
  import "../app.css";

  let { children } = $props();
  
  injectAnalytics({ mode: dev ? 'development' : 'production' });
</script>

{@render children()}
