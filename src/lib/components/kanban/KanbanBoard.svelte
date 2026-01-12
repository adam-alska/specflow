<script lang="ts">
  import { tickets, STATUS_COLUMNS, sound, toast } from '$lib/stores'
  import type { Ticket, TicketStatus } from '$lib/stores'
  import KanbanColumn from './KanbanColumn.svelte'
  import KanbanCard from './KanbanCard.svelte'

  // Drag state
  let draggedTicket = $state<Ticket | null>(null)
  let dragOverColumn = $state<TicketStatus | null>(null)

  function handleDragStart(ticket: Ticket) {
    draggedTicket = ticket
    sound.play('drag-start')
  }

  function handleDragEnd() {
    draggedTicket = null
    dragOverColumn = null
  }

  function handleDragOver(status: TicketStatus) {
    dragOverColumn = status
  }

  function handleDrop(status: TicketStatus) {
    if (draggedTicket && draggedTicket.status !== status) {
      const oldStatus = draggedTicket.status
      tickets.updateStatus(draggedTicket.id, status)
      sound.play('drop')

      // Show toast notification
      const statusLabel = STATUS_COLUMNS.find(s => s.id === status)?.label ?? status
      toast.success(`Moved to ${statusLabel}`, `${draggedTicket.title}`)
    }
    handleDragEnd()
  }

  const ticketsByStatus = $derived(tickets.byStatus)
</script>

<!-- Mobile: Horizontal scroll hint -->
<div class="md:hidden px-4 py-2 flex items-center gap-2 text-text-tertiary text-xs">
  <span class="i-lucide-arrow-left-right w-4 h-4"></span>
  <span>Scroll horizontally to see all columns</span>
</div>

<div class="flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-6 scroll-smooth">
  <div class="flex gap-4 h-full min-w-max pb-4">
    {#each STATUS_COLUMNS as column}
      {@const columnTickets = ticketsByStatus[column.id]}
      <KanbanColumn
        status={column.id}
        label={column.label}
        count={columnTickets.length}
        isDragOver={dragOverColumn === column.id}
        onDragOver={() => handleDragOver(column.id)}
        onDrop={() => handleDrop(column.id)}
      >
        {#each columnTickets as ticket (ticket.id)}
          <KanbanCard
            {ticket}
            isDragging={draggedTicket?.id === ticket.id}
            onDragStart={() => handleDragStart(ticket)}
            onDragEnd={handleDragEnd}
          />
        {/each}

        {#if columnTickets.length === 0 && column.id !== 'draft'}
          <div class="
            py-8 px-4 text-center text-text-tertiary text-sm
            border-2 border-dashed border-border-subtle rounded-xl
            {dragOverColumn === column.id ? 'border-accent bg-accent/5 scale-[1.02]' : ''}
            transition-all duration-200
          ">
            <span class="i-lucide-inbox w-8 h-8 mx-auto mb-2 opacity-40"></span>
            <p class="font-medium">Drop tickets here</p>
            <p class="text-xs mt-1 opacity-60">Drag cards to move them</p>
          </div>
        {/if}

        {#if columnTickets.length === 0 && column.id === 'draft'}
          <div class="
            py-8 px-4 text-center rounded-xl
            bg-gradient-to-b from-accent/5 to-transparent
            border-2 border-dashed border-accent/20
            {dragOverColumn === column.id ? 'border-accent bg-accent/10' : ''}
            transition-all duration-200
          ">
            <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-accent/10 flex items-center justify-center">
              <span class="i-lucide-lightbulb w-6 h-6 text-accent"></span>
            </div>
            <p class="font-semibold text-text-primary">Start here</p>
            <p class="text-xs mt-1 text-text-secondary">Create your first ticket</p>
            <a
              href="/ticket/new"
              class="
                inline-flex items-center gap-1.5 mt-3 px-4 py-2
                bg-accent text-white text-sm font-medium rounded-lg
                hover:bg-accent/90 transition-colors
              "
            >
              <span class="i-lucide-plus w-4 h-4"></span>
              New Ticket
            </a>
          </div>
        {/if}
      </KanbanColumn>
    {/each}
  </div>
</div>
