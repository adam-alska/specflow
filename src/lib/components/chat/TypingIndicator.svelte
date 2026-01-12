<script lang="ts">
  // Simple typing indicator with animated dots
</script>

<div class="flex gap-3">
  <!-- Avatar -->
  <div class="w-8 h-8 rounded-full flex-shrink-0 flex-center bg-accent/20 text-accent">
    <span class="i-lucide-sparkles w-4 h-4" />
  </div>

  <!-- Typing dots -->
  <div class="px-4 py-3 rounded-2xl rounded-tl-sm bg-bg-secondary">
    <div class="typing-indicator flex gap-1">
      <span class="w-2 h-2 rounded-full bg-text-tertiary" />
      <span class="w-2 h-2 rounded-full bg-text-tertiary" />
      <span class="w-2 h-2 rounded-full bg-text-tertiary" />
    </div>
  </div>
</div>
