<script lang="ts">
  import { theme, sound } from '$lib/stores'

  function toggle() {
    sound.play('toggle')
    theme.toggle()
  }
</script>

<button
  onclick={toggle}
  class="
    p-2 rounded-md transition-all duration-150
    bg-transparent text-text-secondary
    hover:bg-bg-tertiary hover:text-text-primary
    focus-ring
  "
  aria-label={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
  {#if theme.isDark}
    <span class="i-lucide-sun w-5 h-5 block" />
  {:else}
    <span class="i-lucide-moon w-5 h-5 block" />
  {/if}
</button>
