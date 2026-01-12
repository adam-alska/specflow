<script lang="ts">
  import Input from '$lib/components/ui/Input.svelte'
  import Button from '$lib/components/ui/Button.svelte'
  import { tickets } from '$lib/stores'

  interface Props {
    title?: string
    showSearch?: boolean
    showNewButton?: boolean
  }

  let {
    title = 'SpecFlow',
    showSearch = true,
    showNewButton = true
  }: Props = $props()

  let searchQuery = $state('')

  function handleSearch() {
    tickets.setFilter({ ...tickets.filter, search: searchQuery || undefined })
  }
</script>

<header class="
  h-14 px-6 flex items-center justify-between gap-4
  border-b border-border-subtle bg-bg-primary
">
  <h1 class="text-lg font-semibold text-text-primary">
    {title}
  </h1>

  <div class="flex items-center gap-3">
    {#if showSearch}
      <div class="relative">
        <span class="i-lucide-search absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <Input
          type="search"
          placeholder="Search tickets..."
          bind:value={searchQuery}
          oninput={handleSearch}
          class="pl-9 w-64"
        />
      </div>
    {/if}

    {#if showNewButton}
      <Button variant="primary" onclick={() => window.location.href = '/ticket/new'}>
        <span class="i-lucide-plus w-4 h-4" />
        New Ticket
      </Button>
    {/if}
  </div>
</header>
