<script lang="ts">
  import type { ChatMessage } from '$lib/stores'

  interface Props {
    message: ChatMessage
  }

  let { message }: Props = $props()

  const isAssistant = $derived(message.role === 'assistant')
</script>

<div class="flex gap-3 {isAssistant ? '' : 'flex-row-reverse'}">
  <!-- Avatar -->
  <div class="
    w-8 h-8 rounded-full flex-shrink-0 flex-center text-sm font-medium
    {isAssistant
      ? 'bg-accent/20 text-accent'
      : 'bg-bg-tertiary text-text-secondary'}
  ">
    {#if isAssistant}
      <span class="i-lucide-sparkles w-4 h-4" />
    {:else}
      <span class="i-lucide-user w-4 h-4" />
    {/if}
  </div>

  <!-- Message Content -->
  <div class="
    max-w-[80%] px-4 py-3 rounded-2xl
    {isAssistant
      ? 'bg-bg-secondary rounded-tl-sm'
      : 'bg-accent text-white rounded-tr-sm'}
  ">
    <div class="text-sm whitespace-pre-wrap leading-relaxed prose prose-sm {isAssistant ? '' : 'prose-invert'}">
      {@html message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}
    </div>
  </div>
</div>
