<script lang="ts">
  import { toast } from '$lib/stores/toast.svelte'
  import { fly, fade } from 'svelte/transition'

  const typeStyles = {
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  }

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  }
</script>

{#if toast.all.length > 0}
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
    {#each toast.all as t (t.id)}
      <div
        in:fly={{ x: 100, duration: 300 }}
        out:fade={{ duration: 200 }}
        class="
          flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm
          shadow-lg {typeStyles[t.type]}
        "
      >
        {#if t.icon}
          <span class="{t.icon} w-5 h-5 flex-shrink-0 {iconColors[t.type]}"></span>
        {/if}
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-text-primary">{t.message}</p>
          {#if t.description}
            <p class="text-xs text-text-secondary mt-0.5">{t.description}</p>
          {/if}
        </div>
        <button
          onclick={() => toast.remove(t.id)}
          class="p-1 rounded hover:bg-white/10 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <span class="i-lucide-x w-4 h-4"></span>
        </button>
      </div>
    {/each}
  </div>
{/if}
