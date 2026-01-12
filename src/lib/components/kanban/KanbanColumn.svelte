<script lang="ts">
  import type { TicketStatus } from '$lib/stores'
  import { tickets, sound, STATUS_COLUMNS } from '$lib/stores'
  import type { Snippet } from 'svelte'

  interface Props {
    status: TicketStatus
    label: string
    count: number
    isDragOver?: boolean
    onDragOver?: () => void
    onDrop?: () => void
    children?: Snippet
  }

  let {
    status,
    label,
    count,
    isDragOver = false,
    onDragOver,
    onDrop,
    children
  }: Props = $props()

  const statusConfig = $derived(STATUS_COLUMNS.find(s => s.id === status))

  // Column color accents
  const columnColors: Record<TicketStatus, { dot: string; bg: string; border: string }> = {
    draft: { dot: 'bg-slate-400', bg: 'bg-slate-500/5', border: 'border-slate-400/30' },
    in_review: { dot: 'bg-yellow-500', bg: 'bg-yellow-500/5', border: 'border-yellow-500/30' },
    approved: { dot: 'bg-blue-500', bg: 'bg-blue-500/5', border: 'border-blue-500/30' },
    in_development: { dot: 'bg-purple-500', bg: 'bg-purple-500/5', border: 'border-purple-500/30' },
    completed: { dot: 'bg-green-500', bg: 'bg-green-500/5', border: 'border-green-500/30' }
  }

  const colorConfig = $derived(columnColors[status])

  let isAddingCard = $state(false)
  let newCardTitle = $state('')
  let inputRef = $state<HTMLInputElement | null>(null)
  let isCollapsed = $state(false)

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    onDragOver?.()
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    onDrop?.()
  }

  function startAddCard() {
    isAddingCard = true
    newCardTitle = ''
    requestAnimationFrame(() => {
      inputRef?.focus()
    })
  }

  function cancelAddCard() {
    isAddingCard = false
    newCardTitle = ''
  }

  function submitCard() {
    if (!newCardTitle.trim()) {
      cancelAddCard()
      return
    }

    tickets.create({
      title: newCardTitle.trim(),
      status
    })
    sound.play('success')
    newCardTitle = ''
    inputRef?.focus()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitCard()
    } else if (e.key === 'Escape') {
      cancelAddCard()
    }
  }

  function toggleCollapse() {
    isCollapsed = !isCollapsed
    sound.play('click')
  }
</script>

<div
  class="kanban-column flex flex-col h-full {isCollapsed ? 'w-12' : 'w-72'} flex-shrink-0 transition-all duration-200"
  ondragover={handleDragOver}
  ondrop={handleDrop}
  role="region"
  aria-label="{label} column"
>
  <!-- Column Header -->
  <div class="flex items-center justify-between mb-3 px-1 {isCollapsed ? 'flex-col gap-2' : ''}">
    <button
      onclick={toggleCollapse}
      class="flex items-center gap-2 hover:opacity-80 transition-opacity {isCollapsed ? 'writing-mode-vertical rotate-180' : ''}"
    >
      <div class="w-2.5 h-2.5 rounded-full {colorConfig.dot} ring-2 ring-offset-2 ring-offset-bg-primary {colorConfig.border}"></div>
      <h3 class="text-sm font-semibold text-text-primary {isCollapsed ? 'text-xs' : ''}">{label}</h3>
      <span class="
        px-1.5 py-0.5 rounded-md text-xs font-semibold
        {colorConfig.bg} text-text-secondary
      ">
        {count}
      </span>
    </button>

    {#if !isCollapsed}
      <div class="flex items-center gap-1">
        <button
          onclick={startAddCard}
          class="
            p-1.5 rounded-md text-text-tertiary
            hover:bg-bg-tertiary hover:text-text-secondary
            transition-colors
          "
          title="Add card"
        >
          <span class="i-lucide-plus w-4 h-4"></span>
        </button>
        <button class="
          p-1.5 rounded-md text-text-tertiary
          hover:bg-bg-tertiary hover:text-text-secondary
          transition-colors
        ">
          <span class="i-lucide-more-horizontal w-4 h-4"></span>
        </button>
      </div>
    {/if}
  </div>

  {#if !isCollapsed}
    <!-- Column Content -->
    <div class="
      flex flex-col gap-2.5 flex-1 overflow-y-auto
      p-2 -m-2 rounded-xl transition-all duration-200
      {isDragOver
        ? `${colorConfig.bg} ring-2 ${colorConfig.border} ring-inset`
        : ''}
    ">
      <!-- Drop zone indicator at top when dragging -->
      {#if isDragOver}
        <div class="h-1 rounded-full {colorConfig.dot} opacity-50 animate-pulse mb-1"></div>
      {/if}

      {#if children}
        {@render children()}
      {/if}

      <!-- Quick Add Card Form -->
      {#if isAddingCard}
        <div class="p-3 rounded-xl bg-white dark:bg-bg-secondary border-2 border-accent/50 shadow-lg">
          <input
            bind:this={inputRef}
            bind:value={newCardTitle}
            onkeydown={handleKeydown}
            onblur={() => {
              if (!newCardTitle.trim()) cancelAddCard()
            }}
            placeholder="Enter title..."
            class="
              w-full px-0 py-1 bg-transparent border-0
              text-sm font-medium text-text-primary placeholder:text-text-tertiary
              focus:outline-none focus:ring-0
            "
          />
          <div class="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle">
            <span class="text-[10px] text-text-tertiary">
              ↵ Add · Esc Cancel
            </span>
            <div class="flex gap-1">
              <button
                onclick={cancelAddCard}
                class="px-2 py-1 text-xs text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-tertiary"
              >
                Cancel
              </button>
              <button
                onclick={submitCard}
                disabled={!newCardTitle.trim()}
                class="
                  px-3 py-1 text-xs rounded-md font-medium
                  bg-accent text-white
                  hover:bg-accent/90
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Add
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Add Card Button (when not adding) -->
    {#if !isAddingCard && count === 0}
      <button
        onclick={startAddCard}
        class="
          w-full py-10 mt-2 rounded-xl border-2 border-dashed
          {isDragOver ? colorConfig.border : 'border-border-subtle'}
          text-text-tertiary text-sm font-medium
          hover:border-accent/50 hover:text-accent hover:bg-accent/5
          transition-all duration-200
          flex flex-col items-center justify-center gap-2
        "
      >
        <span class="i-lucide-plus w-6 h-6 p-1 rounded-lg bg-bg-tertiary"></span>
        <span>Add a card</span>
      </button>
    {:else if !isAddingCard}
      <button
        onclick={startAddCard}
        class="
          w-full py-2.5 mt-2 rounded-lg
          text-text-tertiary text-sm font-medium
          hover:bg-bg-tertiary hover:text-text-secondary
          transition-colors flex items-center justify-center gap-1.5
        "
      >
        <span class="i-lucide-plus w-4 h-4"></span>
        <span>Add card</span>
      </button>
    {/if}
  {:else}
    <!-- Collapsed state: show count vertically -->
    <div class="flex-1 flex items-center justify-center">
      <span class="writing-mode-vertical text-text-tertiary text-xs font-medium rotate-180">
        {count} {count === 1 ? 'ticket' : 'tickets'}
      </span>
    </div>
  {/if}
</div>

<style>
  .writing-mode-vertical {
    writing-mode: vertical-rl;
  }
</style>
