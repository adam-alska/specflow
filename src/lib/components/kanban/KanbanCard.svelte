<script lang="ts">
  import type { Ticket } from '$lib/stores'
  import { tickets, PRIORITIES, LABEL_COLORS } from '$lib/stores'

  interface Props {
    ticket: Ticket
    isDragging?: boolean
    onDragStart?: () => void
    onDragEnd?: () => void
  }

  let {
    ticket,
    isDragging = false,
    onDragStart,
    onDragEnd
  }: Props = $props()

  const priorityConfig = $derived(PRIORITIES.find(p => p.id === ticket.priority))
  const ticketNumber = $derived(tickets.formatNumber(ticket.number))

  // Priority colors matching the reference design
  const priorityColors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    none: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
  }

  // Comments count
  const commentsCount = $derived(ticket.chatHistory.length + ticket.comments.length)

  // Subtask progress
  const subtaskProgress = $derived(() => {
    if (ticket.subtasks.length === 0) return null
    const completed = ticket.subtasks.filter(s => s.completed).length
    return { completed, total: ticket.subtasks.length }
  })

  // Due date status
  const dueDateStatus = $derived(() => {
    if (!ticket.dueDate) return null
    const now = new Date()
    const due = new Date(ticket.dueDate)
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { status: 'overdue', label: 'Overdue', class: 'text-red-500' }
    if (diffDays === 0) return { status: 'today', label: 'Today', class: 'text-orange-500' }
    if (diffDays <= 3) return { status: 'soon', label: `${diffDays}d`, class: 'text-yellow-500' }
    return { status: 'future', label: `${diffDays}d`, class: 'text-text-tertiary' }
  })

  function handleDragStart(e: DragEvent) {
    e.dataTransfer?.setData('text/plain', ticket.id)
    onDragStart?.()
  }

  function getLabelColor(colorId: string) {
    return LABEL_COLORS.find(c => c.id === colorId) ?? LABEL_COLORS[0]
  }

  // Avatar colors for assignees
  const avatarColors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500']
</script>

<a
  href="/ticket/{ticket.id}"
  draggable="true"
  ondragstart={handleDragStart}
  ondragend={onDragEnd}
  class="
    group block p-4 rounded-xl
    bg-white dark:bg-bg-secondary
    border border-slate-200 dark:border-border-subtle
    shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5
    transition-all duration-200 ease-out
    {isDragging ? 'opacity-60 scale-[1.02] shadow-xl rotate-1 ring-2 ring-accent/50' : ''}
  "
>
  <!-- Header Row: Ticket ID + AI Badge -->
  <div class="flex justify-between items-start mb-2">
    <span class="text-xs font-mono text-slate-400 dark:text-text-tertiary tracking-tight">
      {ticketNumber}
    </span>
    {#if ticket.aiGenerated}
      <div class="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-400/30">
        <span class="i-lucide-sparkles w-3 h-3 text-violet-400 animate-pulse"></span>
        <span class="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">AI</span>
      </div>
    {/if}
  </div>

  <!-- Title - Largest/boldest text -->
  <h3 class="text-sm font-semibold text-slate-800 dark:text-text-primary mb-2 leading-snug group-hover:text-accent transition-colors line-clamp-2">
    {ticket.title}
  </h3>

  <!-- AI Question Box (if present) -->
  {#if ticket.aiQuestion}
    <div class="mb-3 p-2.5 rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/10 border border-violet-200/50 dark:border-violet-500/20">
      <p class="text-xs text-violet-700 dark:text-violet-300">
        <span class="font-semibold">AI asks:</span> "{ticket.aiQuestion}"
      </p>
    </div>
  {/if}

  <!-- Description preview -->
  {#if ticket.description && !ticket.aiQuestion}
    <p class="text-xs text-slate-500 dark:text-text-secondary line-clamp-2 mb-3">
      {ticket.description}
    </p>
  {/if}

  <!-- Spec Completion Ring (always show outline, fill based on completion) -->
  <div class="flex items-center gap-3 mb-3">
    <svg class="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
      <!-- Background ring (always visible) -->
      <circle
        cx="18" cy="18" r="14"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        class="text-slate-100 dark:text-bg-tertiary"
      />
      <!-- Progress ring -->
      <circle
        cx="18" cy="18" r="14"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-dasharray="{ticket.specCompletion * 0.88} 88"
        stroke-linecap="round"
        class="{ticket.specCompletion > 0 ? 'text-accent' : 'text-transparent'}"
      />
    </svg>
    <div class="text-xs">
      <span class="text-lg font-bold text-slate-700 dark:text-text-primary">{ticket.specCompletion}%</span>
      <span class="text-slate-400 dark:text-text-tertiary block -mt-0.5">Spec</span>
    </div>
  </div>

  <!-- Footer: Priority, Tags, Meta -->
  <div class="flex items-center justify-between">
    <!-- Left: Priority + Labels -->
    <div class="flex flex-wrap gap-1.5">
      {#if ticket.priority !== 'none'}
        <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold {priorityColors[ticket.priority]}">
          {priorityConfig?.label}
        </span>
      {/if}
      {#each ticket.labels.slice(0, 1) as label}
        {@const colorConfig = getLabelColor(label.color)}
        <span class="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-bg-tertiary text-slate-600 dark:text-text-secondary">
          {label.name}
        </span>
      {/each}
      {#if ticket.labels.length > 1}
        <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-bg-tertiary text-slate-500 dark:text-text-tertiary">
          +{ticket.labels.length - 1}
        </span>
      {/if}
    </div>

    <!-- Right: Meta icons + Assignees -->
    <div class="flex items-center gap-2">
      <!-- Due date -->
      {#if dueDateStatus()}
        {@const dueStatus = dueDateStatus()}
        <div class="flex items-center gap-1 {dueStatus?.class}">
          <span class="i-lucide-calendar w-3.5 h-3.5"></span>
          <span class="text-[10px] font-medium">{dueStatus?.label}</span>
        </div>
      {/if}

      <!-- Comments -->
      {#if commentsCount > 0}
        <div class="flex items-center gap-1 text-slate-400 dark:text-text-tertiary hover:text-slate-600 dark:hover:text-text-secondary">
          <span class="i-lucide-message-square w-3.5 h-3.5"></span>
          <span class="text-[10px] font-medium">{commentsCount}</span>
        </div>
      {/if}

      <!-- Subtasks -->
      {#if subtaskProgress()}
        {@const progress = subtaskProgress()}
        <div class="flex items-center gap-1 {progress && progress.completed === progress.total ? 'text-green-500' : 'text-slate-400 dark:text-text-tertiary'}">
          <span class="i-lucide-check-square w-3.5 h-3.5"></span>
          <span class="text-[10px] font-medium">{progress?.completed}/{progress?.total}</span>
        </div>
      {/if}

      <!-- Assignees -->
      {#if ticket.assignees.length > 0}
        <div class="flex -space-x-1.5">
          {#each ticket.assignees.slice(0, 3) as assignee, i}
            {#if assignee.avatar}
              <img
                src={assignee.avatar}
                alt={assignee.name}
                class="w-6 h-6 rounded-full border-2 border-white dark:border-bg-secondary ring-1 ring-slate-200 dark:ring-border-subtle"
              />
            {:else}
              <div
                class="w-6 h-6 rounded-full border-2 border-white dark:border-bg-secondary flex items-center justify-center text-[10px] font-semibold text-white {avatarColors[i % avatarColors.length]} ring-1 ring-slate-200 dark:ring-border-subtle"
                title={assignee.name}
              >
                {assignee.name.charAt(0).toUpperCase()}
              </div>
            {/if}
          {/each}
          {#if ticket.assignees.length > 3}
            <div class="w-6 h-6 rounded-full border-2 border-white dark:border-bg-secondary bg-slate-200 dark:bg-bg-tertiary flex items-center justify-center text-[10px] font-semibold text-slate-600 dark:text-text-secondary ring-1 ring-slate-200 dark:ring-border-subtle">
              +{ticket.assignees.length - 3}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</a>
