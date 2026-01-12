<script lang="ts">
  import { page } from '$app/stores'
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte'
  import { sound } from '$lib/stores'

  const navItems = [
    { href: '/', icon: 'i-lucide-layout-kanban', label: 'Board' },
    { href: '/ticket/new', icon: 'i-lucide-plus-circle', label: 'New Ticket' },
  ]

  function handleNavClick() {
    sound.play('click')
  }
</script>

<aside class="
  w-16 h-screen flex flex-col items-center py-4 gap-2
  bg-bg-secondary border-r border-border-subtle
  flex-shrink-0
">
  <!-- Logo -->
  <a
    href="/"
    class="
      w-10 h-10 rounded-lg flex-center
      bg-accent text-white font-bold text-lg
      hover:scale-105 transition-transform
    "
    onclick={handleNavClick}
  >
    S
  </a>

  <div class="h-px w-8 bg-border-subtle my-2" />

  <!-- Navigation -->
  <nav class="flex flex-col gap-1 flex-1">
    {#each navItems as item}
      {@const isActive = $page.url.pathname === item.href ||
        (item.href !== '/' && $page.url.pathname.startsWith(item.href))}
      <a
        href={item.href}
        class="
          w-10 h-10 rounded-lg flex-center transition-all duration-150
          {isActive
            ? 'bg-accent/20 text-accent'
            : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}
        "
        title={item.label}
        onclick={handleNavClick}
      >
        <span class="{item.icon} w-5 h-5" />
      </a>
    {/each}
  </nav>

  <!-- Bottom actions -->
  <div class="flex flex-col gap-1">
    <ThemeToggle />
    <button
      class="
        w-10 h-10 rounded-lg flex-center transition-all duration-150
        text-text-secondary hover:bg-bg-tertiary hover:text-text-primary
      "
      title="Settings"
    >
      <span class="i-lucide-settings w-5 h-5" />
    </button>
  </div>
</aside>
