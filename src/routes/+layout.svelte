<script lang="ts">
  import 'virtual:uno.css'
  import '../app.css'
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import Toast from '$lib/components/ui/Toast.svelte'

  let { children } = $props()
</script>

<svelte:head>
  <title>SpecFlow</title>
  <meta name="description" content="AI-powered spec-driven development" />
</svelte:head>

<div class="flex h-screen overflow-hidden bg-bg-primary">
  <Sidebar />
  <main class="flex-1 flex flex-col overflow-hidden">
    {@render children()}
  </main>
</div>

<!-- Global Toast Notifications -->
<Toast />
