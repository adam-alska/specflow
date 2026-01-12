<script lang="ts">
  import { goto } from '$app/navigation'
  import { tickets, sound } from '$lib/stores'
  import ChatIntake from '$lib/components/chat/ChatIntake.svelte'
  import type { Ticket } from '$lib/stores'

  // Create a new ticket immediately
  let ticket = $state<Ticket>(tickets.create({ title: 'New Feature' }))

  function handleSpecGenerated(spec: { title: string; description: string; content: string }) {
    tickets.update(ticket.id, {
      title: spec.title,
      description: spec.description,
      spec: spec.content
    })
    sound.play('success')
    goto(`/ticket/${ticket.id}`)
  }

  function handleCancel() {
    tickets.delete(ticket.id)
    goto('/')
  }
</script>

<div class="flex-1 flex flex-col overflow-hidden bg-bg-primary">
  <!-- Header -->
  <header class="h-14 px-6 flex items-center justify-between border-b border-border-subtle">
    <div class="flex items-center gap-3">
      <button
        onclick={handleCancel}
        class="p-2 rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
      >
        <span class="i-lucide-x w-5 h-5" />
      </button>
      <h1 class="text-lg font-semibold text-text-primary">New Ticket</h1>
    </div>
    <span class="text-sm text-text-tertiary">
      Press <kbd class="px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary text-xs">Esc</kbd> to cancel
    </span>
  </header>

  <!-- Chat Interface -->
  <ChatIntake
    ticketId={ticket.id}
    onComplete={handleSpecGenerated}
    onCancel={handleCancel}
  />
</div>
