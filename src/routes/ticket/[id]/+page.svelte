<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { tickets, sound, toast, PRIORITIES, STATUS_COLUMNS, DEFAULT_LABELS, LABEL_COLORS } from '$lib/stores'
  import type { TicketStatus, Priority, Label, Assignee, UserScenario, Requirement, Clarification, Task, QualityGate } from '$lib/stores'
  import Button from '$lib/components/ui/Button.svelte'

  const ticketId = $derived($page.params.id)
  const ticket = $derived(tickets.all.find(t => t.id === ticketId))
  const ticketNumber = $derived(ticket ? tickets.formatNumber(ticket.number) : '')

  let isEditing = $state(false)
  let editedTitle = $state('')
  let editedDescription = $state('')
  let editedSpec = $state('')

  // Form states for new sections
  let showScenarioForm = $state(false)
  let newScenario = $state({ priority: 'P1' as const, title: '', given: '', when: '', then: '' })

  let showRequirementForm = $state(false)
  let newRequirement = $state({ type: 'functional' as const, description: '' })

  let showClarificationForm = $state(false)
  let newClarification = $state({ question: '', context: '' })

  let showCriterionForm = $state(false)
  let newCriterion = $state({ description: '', metric: '' })

  let showTaskForm = $state(false)
  let newTask = $state({ name: '', files: '', action: '', verification: '', done: '', phase: 'core' as const, parallel: false, userScenarioId: '' })

  // Legacy forms
  let newSubtask = $state('')
  let showSubtaskInput = $state(false)
  let newAssigneeName = $state('')
  let showAssigneeInput = $state(false)
  let newComment = $state('')
  let showCommentInput = $state(false)

  $effect(() => {
    if (ticket) {
      editedTitle = ticket.title
      editedDescription = ticket.description
      editedSpec = ticket.spec
    }
  })

  function handleSave() {
    if (!ticket) return
    tickets.update(ticket.id, {
      title: editedTitle,
      description: editedDescription,
      spec: editedSpec
    })
    isEditing = false
    sound.play('success')
    toast.success('Ticket saved', 'Changes have been saved')
  }

  function handleStatusChange(e: Event) {
    const target = e.target as HTMLSelectElement
    const newStatus = target.value as TicketStatus
    if (ticket) {
      tickets.updateStatus(ticket.id, newStatus)
      sound.play('click')
      const statusLabel = STATUS_COLUMNS.find(s => s.id === newStatus)?.label
      toast.success(`Status updated`, `Now: ${statusLabel}`)
    }
  }

  function handlePriorityChange(e: Event) {
    const target = e.target as HTMLSelectElement
    const newPriority = target.value as Priority
    if (ticket) {
      tickets.update(ticket.id, { priority: newPriority })
      sound.play('click')
    }
  }

  function handleDelete() {
    if (!ticket) return
    if (confirm('Are you sure you want to delete this ticket?')) {
      tickets.delete(ticket.id)
      sound.play('click')
      toast.info('Ticket deleted')
      goto('/')
    }
  }

  // === USER SCENARIO HANDLERS ===
  function addScenario() {
    if (!ticket || !newScenario.title.trim()) return
    tickets.addUserScenario(ticket.id, {
      priority: newScenario.priority,
      title: newScenario.title.trim(),
      given: newScenario.given.trim(),
      when: newScenario.when.trim(),
      then: newScenario.then.trim()
    })
    newScenario = { priority: 'P1', title: '', given: '', when: '', then: '' }
    showScenarioForm = false
    sound.play('success')
    toast.success('User scenario added')
  }

  function deleteScenario(scenarioId: string) {
    if (!ticket) return
    tickets.deleteUserScenario(ticket.id, scenarioId)
    sound.play('click')
  }

  // === REQUIREMENT HANDLERS ===
  function addRequirement() {
    if (!ticket || !newRequirement.description.trim()) return
    tickets.addRequirement(ticket.id, {
      type: newRequirement.type,
      description: newRequirement.description.trim()
    })
    newRequirement = { type: 'functional', description: '' }
    showRequirementForm = false
    sound.play('success')
    toast.success('Requirement added')
  }

  function deleteRequirement(reqId: string) {
    if (!ticket) return
    tickets.deleteRequirement(ticket.id, reqId)
    sound.play('click')
  }

  function toggleRequirementVerified(reqId: string) {
    if (!ticket) return
    const req = ticket.requirements.find(r => r.id === reqId)
    if (req) {
      tickets.updateRequirement(ticket.id, reqId, { verified: !req.verified })
      sound.play('click')
    }
  }

  // === CLARIFICATION HANDLERS ===
  function addClarificationItem() {
    if (!ticket || !newClarification.question.trim()) return
    tickets.addClarification(ticket.id, newClarification.question.trim(), newClarification.context.trim() || undefined)
    newClarification = { question: '', context: '' }
    showClarificationForm = false
    sound.play('success')
    toast.success('Clarification added')
  }

  function resolveClarificationItem(clarificationId: string) {
    const answer = prompt('Enter the answer/resolution:')
    if (!ticket || !answer) return
    tickets.resolveClarification(ticket.id, clarificationId, answer)
    sound.play('success')
    toast.success('Clarification resolved')
  }

  function deleteClarification(clarificationId: string) {
    if (!ticket) return
    tickets.deleteClarification(ticket.id, clarificationId)
    sound.play('click')
  }

  // === SUCCESS CRITERIA HANDLERS ===
  function addCriterion() {
    if (!ticket || !newCriterion.description.trim()) return
    tickets.addSuccessCriterion(ticket.id, newCriterion.description.trim(), newCriterion.metric.trim() || undefined)
    newCriterion = { description: '', metric: '' }
    showCriterionForm = false
    sound.play('success')
    toast.success('Success criterion added')
  }

  function toggleCriterion(criterionId: string) {
    if (!ticket) return
    tickets.toggleSuccessCriterion(ticket.id, criterionId)
    sound.play('click')
  }

  function deleteCriterion(criterionId: string) {
    if (!ticket) return
    tickets.deleteSuccessCriterion(ticket.id, criterionId)
    sound.play('click')
  }

  // === TASK HANDLERS ===
  function addTaskItem() {
    if (!ticket || !newTask.name.trim()) return
    tickets.addTask(ticket.id, {
      name: newTask.name.trim(),
      files: newTask.files.split(',').map(f => f.trim()).filter(Boolean),
      action: newTask.action.trim(),
      verification: newTask.verification.trim(),
      done: newTask.done.trim(),
      phase: newTask.phase,
      parallel: newTask.parallel,
      userScenarioId: newTask.userScenarioId || undefined,
      isCheckpoint: false
    })
    newTask = { name: '', files: '', action: '', verification: '', done: '', phase: 'core', parallel: false, userScenarioId: '' }
    showTaskForm = false
    sound.play('success')
    toast.success('Task added')
  }

  function updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'complete' | 'blocked') {
    if (!ticket) return
    tickets.updateTaskStatus(ticket.id, taskId, status)
    sound.play('click')
    toast.success(`Task ${status === 'complete' ? 'completed' : 'updated'}`)
  }

  function deleteTask(taskId: string) {
    if (!ticket) return
    tickets.deleteTask(ticket.id, taskId)
    sound.play('click')
  }

  // Legacy handlers
  function addLabel(label: Label) {
    if (!ticket) return
    tickets.addLabel(ticket.id, label)
    sound.play('click')
    toast.success(`Label added`, label.name)
  }

  function removeLabel(labelId: string) {
    if (!ticket) return
    tickets.removeLabel(ticket.id, labelId)
    sound.play('click')
  }

  function addSubtask() {
    if (!ticket || !newSubtask.trim()) return
    tickets.addSubtask(ticket.id, newSubtask.trim())
    newSubtask = ''
    showSubtaskInput = false
    sound.play('click')
  }

  function toggleSubtask(subtaskId: string) {
    if (!ticket) return
    tickets.toggleSubtask(ticket.id, subtaskId)
    sound.play('click')
  }

  function deleteSubtask(subtaskId: string) {
    if (!ticket) return
    tickets.deleteSubtask(ticket.id, subtaskId)
    sound.play('click')
  }

  function addAssignee() {
    if (!ticket || !newAssigneeName.trim()) return
    const assignee = { id: `assignee_${Date.now()}`, name: newAssigneeName.trim(), color: 'purple' }
    tickets.addAssignee(ticket.id, assignee)
    newAssigneeName = ''
    showAssigneeInput = false
    sound.play('click')
    toast.success('Assignee added', assignee.name)
  }

  function removeAssignee(assigneeId: string) {
    if (!ticket) return
    tickets.removeAssignee(ticket.id, assigneeId)
    sound.play('click')
  }

  function addComment() {
    if (!ticket || !newComment.trim()) return
    tickets.addComment(ticket.id, 'You', newComment.trim())
    newComment = ''
    showCommentInput = false
    sound.play('click')
    toast.success('Comment added')
  }

  function getLabelColor(colorId: string) {
    return LABEL_COLORS.find(c => c.id === colorId) ?? LABEL_COLORS[0]
  }

  // Computed values
  const availableLabels = $derived(DEFAULT_LABELS.filter(l => !ticket?.labels.some(tl => tl.id === l.id)))

  const subtaskProgress = $derived(() => {
    if (!ticket || ticket.subtasks.length === 0) return null
    const completed = ticket.subtasks.filter(s => s.completed).length
    return { completed, total: ticket.subtasks.length, percent: Math.round((completed / ticket.subtasks.length) * 100) }
  })

  const taskProgress = $derived(() => {
    if (!ticket || ticket.tasks.length === 0) return null
    const completed = ticket.tasks.filter(t => t.status === 'complete').length
    return { completed, total: ticket.tasks.length, percent: Math.round((completed / ticket.tasks.length) * 100) }
  })

  const unresolvedClarifications = $derived(ticket?.clarifications.filter(c => !c.resolved) ?? [])
  const canShowTasks = $derived(ticket?.status === 'approved' || ticket?.status === 'in_development' || ticket?.status === 'completed')

  const statusColors: Record<TicketStatus, string> = {
    draft: 'bg-slate-500',
    in_review: 'bg-yellow-500',
    approved: 'bg-blue-500',
    in_development: 'bg-purple-500',
    completed: 'bg-green-500'
  }

  const qualityGateLabels: Record<QualityGate, { label: string; color: string; icon: string }> = {
    spec_incomplete: { label: 'Spec Incomplete', color: 'text-slate-500 bg-slate-500/10', icon: 'i-lucide-file-edit' },
    spec_complete: { label: 'Spec Complete', color: 'text-blue-500 bg-blue-500/10', icon: 'i-lucide-file-check' },
    clarifications_needed: { label: 'Clarifications Needed', color: 'text-yellow-500 bg-yellow-500/10', icon: 'i-lucide-help-circle' },
    ready_for_approval: { label: 'Ready for Approval', color: 'text-green-500 bg-green-500/10', icon: 'i-lucide-check-circle' },
    approved: { label: 'Approved', color: 'text-blue-500 bg-blue-500/10', icon: 'i-lucide-badge-check' },
    tasks_ready: { label: 'Tasks Ready', color: 'text-purple-500 bg-purple-500/10', icon: 'i-lucide-list-todo' },
    in_progress: { label: 'In Progress', color: 'text-purple-500 bg-purple-500/10', icon: 'i-lucide-loader' },
    verification_pending: { label: 'Verification Pending', color: 'text-orange-500 bg-orange-500/10', icon: 'i-lucide-shield-check' },
    complete: { label: 'Complete', color: 'text-green-500 bg-green-500/10', icon: 'i-lucide-check-circle-2' }
  }

  function renderMarkdown(text: string): string {
    return text
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-bg-tertiary text-accent text-sm font-mono">$1</code>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br/>')
  }

  const activityTimeline = $derived(() => {
    if (!ticket) return []
    const items = [
      ...ticket.chatHistory.map(m => ({ type: 'chat' as const, ...m })),
      ...ticket.comments.map(c => ({ type: 'comment' as const, ...c })),
    ]
    return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  })
</script>

{#if ticket}
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Header -->
    <header class="h-14 px-6 flex items-center justify-between border-b border-border-subtle bg-bg-primary">
      <div class="flex items-center gap-3">
        <a href="/" class="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
          <span class="i-lucide-chevron-left w-5 h-5"></span>
        </a>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full {statusColors[ticket.status]}"></div>
          <span class="text-sm font-mono text-text-tertiary">{ticketNumber}</span>
        </div>
        <span class="text-text-tertiary">/</span>
        {#if isEditing}
          <input bind:value={editedTitle} class="text-lg font-semibold bg-transparent border-b-2 border-accent focus:outline-none text-text-primary min-w-[200px]" />
        {:else}
          <h1 class="text-lg font-semibold text-text-primary">{ticket.title}</h1>
        {/if}
        {#if ticket.aiGenerated}
          <div class="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-400/30">
            <span class="i-lucide-sparkles w-3 h-3 text-violet-400"></span>
            <span class="text-[10px] font-semibold text-violet-400 uppercase">AI</span>
          </div>
        {/if}
        <!-- Quality Gate Badge -->
        {#if ticket.qualityGate}
          {@const gate = qualityGateLabels[ticket.qualityGate]}
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full {gate.color}">
            <span class="{gate.icon} w-3.5 h-3.5"></span>
            <span class="text-xs font-medium">{gate.label}</span>
          </div>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        {#if isEditing}
          <Button variant="ghost" onclick={() => isEditing = false}>Cancel</Button>
          <Button variant="primary" onclick={handleSave}>
            <span class="i-lucide-check w-4 h-4"></span>
            Save
          </Button>
        {:else}
          <Button variant="ghost" onclick={() => isEditing = true}>
            <span class="i-lucide-pencil w-4 h-4"></span>
            Edit
          </Button>
          <Button variant="ghost" onclick={handleDelete}>
            <span class="i-lucide-trash-2 w-4 h-4"></span>
          </Button>
        {/if}
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
      <!-- Main Content -->
      <div class="flex-1 overflow-y-auto p-6 bg-bg-primary">
        <div class="max-w-3xl">

          <!-- 1. Description -->
          <div class="mb-8">
            <h3 class="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span class="i-lucide-align-left w-4 h-4 text-text-tertiary"></span>
              Problem Statement
            </h3>
            {#if isEditing}
              <textarea bind:value={editedDescription} class="w-full p-4 rounded-xl bg-bg-secondary border border-border-subtle text-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent" rows="3" placeholder="What problem are we solving?"></textarea>
            {:else if ticket.description}
              <p class="text-sm text-text-primary leading-relaxed p-4 rounded-xl bg-bg-secondary/50">{ticket.description}</p>
            {:else}
              <button onclick={() => isEditing = true} class="w-full p-4 rounded-xl border-2 border-dashed border-border-subtle text-text-tertiary text-sm hover:border-accent/50 hover:text-accent hover:bg-accent/5 transition-all">
                <span class="i-lucide-plus w-4 h-4 inline-block mr-1"></span>
                Describe the problem
              </button>
            {/if}
          </div>

          <!-- 2. User Scenarios (Given/When/Then) - from Spec-Kit -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-text-primary flex items-center gap-2">
                <span class="i-lucide-users w-4 h-4 text-text-tertiary"></span>
                User Scenarios
                {#if ticket.userScenarios.length > 0}
                  <span class="text-text-tertiary font-normal text-xs bg-bg-tertiary px-2 py-0.5 rounded-full">{ticket.userScenarios.length}</span>
                {/if}
              </h3>
              <button onclick={() => showScenarioForm = !showScenarioForm} class="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1">
                <span class="i-lucide-plus w-3 h-3"></span>
                Add scenario
              </button>
            </div>

            {#if showScenarioForm}
              <div class="p-4 rounded-xl bg-bg-secondary border border-border-subtle mb-4">
                <div class="grid grid-cols-[auto_1fr] gap-3 mb-3">
                  <select bind:value={newScenario.priority} class="px-2 py-1.5 rounded-lg bg-bg-tertiary border border-border-subtle text-sm font-semibold">
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                    <option value="P3">P3</option>
                  </select>
                  <input bind:value={newScenario.title} placeholder="Scenario title..." class="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div class="space-y-2 mb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-green-500 w-12">Given</span>
                    <input bind:value={newScenario.given} placeholder="precondition or state..." class="flex-1 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-subtle text-sm focus:outline-none" />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-blue-500 w-12">When</span>
                    <input bind:value={newScenario.when} placeholder="action or trigger..." class="flex-1 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-subtle text-sm focus:outline-none" />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-purple-500 w-12">Then</span>
                    <input bind:value={newScenario.then} placeholder="expected outcome..." class="flex-1 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-subtle text-sm focus:outline-none" />
                  </div>
                </div>
                <div class="flex justify-end gap-2">
                  <button onclick={() => showScenarioForm = false} class="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary">Cancel</button>
                  <button onclick={addScenario} disabled={!newScenario.title.trim()} class="px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-md hover:bg-accent/90 disabled:opacity-50">Add</button>
                </div>
              </div>
            {/if}

            <div class="space-y-2">
              {#each ticket.userScenarios as scenario (scenario.id)}
                <div class="p-4 rounded-xl bg-bg-secondary/50 border border-border-subtle group">
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold px-2 py-0.5 rounded {scenario.priority === 'P1' ? 'bg-red-500/20 text-red-500' : scenario.priority === 'P2' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-slate-500/20 text-slate-400'}">{scenario.priority}</span>
                      <span class="text-sm font-medium text-text-primary">{scenario.id}: {scenario.title}</span>
                    </div>
                    <button onclick={() => deleteScenario(scenario.id)} class="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-red-500 transition-all">
                      <span class="i-lucide-x w-4 h-4"></span>
                    </button>
                  </div>
                  <div class="space-y-1 text-sm pl-2 border-l-2 border-border-subtle">
                    <p><span class="font-semibold text-green-500">Given</span> <span class="text-text-secondary">{scenario.given || '...'}</span></p>
                    <p><span class="font-semibold text-blue-500">When</span> <span class="text-text-secondary">{scenario.when || '...'}</span></p>
                    <p><span class="font-semibold text-purple-500">Then</span> <span class="text-text-secondary">{scenario.then || '...'}</span></p>
                  </div>
                </div>
              {/each}

              {#if ticket.userScenarios.length === 0 && !showScenarioForm}
                <button onclick={() => showScenarioForm = true} class="w-full p-4 rounded-xl border-2 border-dashed border-border-subtle text-text-tertiary text-sm hover:border-accent/50 hover:text-accent hover:bg-accent/5 transition-all">
                  <span class="i-lucide-users w-5 h-5 inline-block mr-2 opacity-50"></span>
                  Define user scenarios (Given/When/Then)
                </button>
              {/if}
            </div>
          </div>

          <!-- 3. Requirements (FR-001 format) - from Spec-Kit -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-text-primary flex items-center gap-2">
                <span class="i-lucide-list-checks w-4 h-4 text-text-tertiary"></span>
                Requirements
                {#if ticket.requirements.length > 0}
                  <span class="text-text-tertiary font-normal text-xs bg-bg-tertiary px-2 py-0.5 rounded-full">{ticket.requirements.length}</span>
                {/if}
              </h3>
              <button onclick={() => showRequirementForm = !showRequirementForm} class="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1">
                <span class="i-lucide-plus w-3 h-3"></span>
                Add requirement
              </button>
            </div>

            {#if showRequirementForm}
              <div class="p-4 rounded-xl bg-bg-secondary border border-border-subtle mb-4">
                <div class="flex gap-3 mb-3">
                  <select bind:value={newRequirement.type} class="px-2 py-1.5 rounded-lg bg-bg-tertiary border border-border-subtle text-sm">
                    <option value="functional">Functional</option>
                    <option value="non_functional">Non-Functional</option>
                  </select>
                </div>
                <textarea bind:value={newRequirement.description} placeholder="System MUST... or Users MUST be able to..." rows="2" class="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none mb-3"></textarea>
                <div class="flex justify-end gap-2">
                  <button onclick={() => showRequirementForm = false} class="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary">Cancel</button>
                  <button onclick={addRequirement} disabled={!newRequirement.description.trim()} class="px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-md hover:bg-accent/90 disabled:opacity-50">Add</button>
                </div>
              </div>
            {/if}

            <div class="space-y-2">
              {#each ticket.requirements as req (req.id)}
                <div class="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary/50 group hover:bg-bg-secondary transition-colors">
                  <button onclick={() => toggleRequirementVerified(req.id)} class="w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all {req.verified ? 'bg-green-500 border-green-500 text-white' : 'border-border-default hover:border-accent'}">
                    {#if req.verified}<span class="i-lucide-check w-3 h-3"></span>{/if}
                  </button>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs font-mono font-semibold {req.type === 'functional' ? 'text-blue-500' : 'text-purple-500'}">{req.id}</span>
                      <span class="text-xs px-1.5 py-0.5 rounded bg-bg-tertiary text-text-tertiary">{req.type === 'functional' ? 'Functional' : 'Non-Functional'}</span>
                    </div>
                    <p class="text-sm text-text-primary {req.verified ? 'line-through text-text-tertiary' : ''}">{req.description}</p>
                    {#if req.clarificationNeeded}
                      <p class="text-xs text-yellow-500 mt-1 flex items-center gap-1">
                        <span class="i-lucide-alert-circle w-3 h-3"></span>
                        {req.clarificationNeeded}
                      </p>
                    {/if}
                  </div>
                  <button onclick={() => deleteRequirement(req.id)} class="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-red-500 transition-all">
                    <span class="i-lucide-x w-4 h-4"></span>
                  </button>
                </div>
              {/each}

              {#if ticket.requirements.length === 0 && !showRequirementForm}
                <button onclick={() => showRequirementForm = true} class="w-full p-4 rounded-xl border-2 border-dashed border-border-subtle text-text-tertiary text-sm hover:border-accent/50 hover:text-accent hover:bg-accent/5 transition-all">
                  <span class="i-lucide-list-checks w-5 h-5 inline-block mr-2 opacity-50"></span>
                  Add functional requirements (FR-001, FR-002...)
                </button>
              {/if}
            </div>
          </div>

          <!-- 4. Clarifications - from Spec-Kit -->
          {#if unresolvedClarifications.length > 0 || ticket.clarifications.length > 0 || showClarificationForm}
            <div class="mb-8">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <span class="i-lucide-help-circle w-4 h-4 text-yellow-500"></span>
                  Clarifications Needed
                  {#if unresolvedClarifications.length > 0}
                    <span class="text-yellow-500 font-normal text-xs bg-yellow-500/10 px-2 py-0.5 rounded-full">{unresolvedClarifications.length} unresolved</span>
                  {/if}
                </h3>
                <button onclick={() => showClarificationForm = !showClarificationForm} class="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1">
                  <span class="i-lucide-plus w-3 h-3"></span>
                  Add question
                </button>
              </div>

              {#if showClarificationForm}
                <div class="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 mb-4">
                  <input bind:value={newClarification.question} placeholder="What needs clarification?" class="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-2" />
                  <input bind:value={newClarification.context} placeholder="Why does this matter? (optional)" class="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-sm focus:outline-none mb-3" />
                  <div class="flex justify-end gap-2">
                    <button onclick={() => showClarificationForm = false} class="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary">Cancel</button>
                    <button onclick={addClarificationItem} disabled={!newClarification.question.trim()} class="px-3 py-1.5 text-xs font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600 disabled:opacity-50">Add</button>
                  </div>
                </div>
              {/if}

              <div class="space-y-2">
                {#each ticket.clarifications as clarification (clarification.id)}
                  <div class="p-3 rounded-lg {clarification.resolved ? 'bg-green-500/5 border border-green-500/20' : 'bg-yellow-500/5 border border-yellow-500/20'} group">
                    <div class="flex items-start gap-3">
                      <span class="{clarification.resolved ? 'i-lucide-check-circle text-green-500' : 'i-lucide-help-circle text-yellow-500'} w-5 h-5 flex-shrink-0 mt-0.5"></span>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-text-primary mb-1">{clarification.question}</p>
                        {#if clarification.context}
                          <p class="text-xs text-text-tertiary mb-2">{clarification.context}</p>
                        {/if}
                        {#if clarification.resolved && clarification.answer}
                          <div class="p-2 rounded-lg bg-green-500/10 mt-2">
                            <p class="text-xs text-green-600 dark:text-green-400"><span class="font-semibold">Answer:</span> {clarification.answer}</p>
                          </div>
                        {:else}
                          <button onclick={() => resolveClarificationItem(clarification.id)} class="text-xs font-medium text-yellow-600 hover:text-yellow-500 flex items-center gap-1">
                            <span class="i-lucide-message-circle w-3 h-3"></span>
                            Resolve
                          </button>
                        {/if}
                      </div>
                      <button onclick={() => deleteClarification(clarification.id)} class="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-red-500 transition-all">
                        <span class="i-lucide-x w-4 h-4"></span>
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- 5. Specification (full markdown) -->
          <div class="mb-8">
            <h3 class="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span class="i-lucide-file-text w-4 h-4 text-text-tertiary"></span>
              Specification
            </h3>
            {#if isEditing}
              <textarea bind:value={editedSpec} class="w-full h-[400px] p-4 rounded-xl bg-bg-secondary border border-border-subtle text-text-primary font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Write your spec in Markdown..."></textarea>
              <p class="text-xs text-text-tertiary mt-2">Supports Markdown: **bold**, *italic*, `code`, # headings, - lists</p>
            {:else if ticket.spec}
              <div class="prose prose-sm dark:prose-invert max-w-none p-6 rounded-xl bg-bg-secondary border border-border-subtle">
                {@html renderMarkdown(ticket.spec)}
              </div>
            {:else}
              <button onclick={() => isEditing = true} class="w-full py-12 rounded-xl border-2 border-dashed border-border-subtle text-center hover:border-accent/50 hover:bg-accent/5 transition-all group">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-tertiary flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                  <span class="i-lucide-file-text w-8 h-8 text-text-tertiary group-hover:text-accent"></span>
                </div>
                <p class="text-text-secondary font-medium mb-1">No specification yet</p>
                <p class="text-text-tertiary text-sm mb-4">Define what needs to be built</p>
                <span class="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg">
                  <span class="i-lucide-pencil w-4 h-4"></span>
                  Start writing
                </span>
              </button>
            {/if}
          </div>

          <!-- 6. Success Criteria -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-text-primary flex items-center gap-2">
                <span class="i-lucide-target w-4 h-4 text-text-tertiary"></span>
                Success Criteria
                {#if ticket.successCriteria.length > 0}
                  <span class="text-text-tertiary font-normal text-xs bg-bg-tertiary px-2 py-0.5 rounded-full">{ticket.successCriteria.filter(c => c.met).length}/{ticket.successCriteria.length}</span>
                {/if}
              </h3>
              <button onclick={() => showCriterionForm = !showCriterionForm} class="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1">
                <span class="i-lucide-plus w-3 h-3"></span>
                Add criterion
              </button>
            </div>

            {#if showCriterionForm}
              <div class="p-4 rounded-xl bg-bg-secondary border border-border-subtle mb-4">
                <input bind:value={newCriterion.description} placeholder="What defines success?" class="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent mb-2" />
                <input bind:value={newCriterion.metric} placeholder="Measurable metric (optional, e.g., '< 200ms response time')" class="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border-subtle text-sm focus:outline-none mb-3" />
                <div class="flex justify-end gap-2">
                  <button onclick={() => showCriterionForm = false} class="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary">Cancel</button>
                  <button onclick={addCriterion} disabled={!newCriterion.description.trim()} class="px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-md hover:bg-accent/90 disabled:opacity-50">Add</button>
                </div>
              </div>
            {/if}

            <div class="space-y-1">
              {#each ticket.successCriteria as criterion (criterion.id)}
                <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-secondary transition-colors group">
                  <button onclick={() => toggleCriterion(criterion.id)} class="w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all {criterion.met ? 'bg-green-500 border-green-500 text-white' : 'border-border-default hover:border-accent'}">
                    {#if criterion.met}<span class="i-lucide-check w-3 h-3"></span>{/if}
                  </button>
                  <div class="flex-1 min-w-0">
                    <span class="text-xs font-mono text-text-tertiary mr-2">{criterion.id}</span>
                    <span class="text-sm {criterion.met ? 'text-text-tertiary line-through' : 'text-text-primary'}">{criterion.description}</span>
                    {#if criterion.metric}
                      <span class="text-xs text-accent ml-2">({criterion.metric})</span>
                    {/if}
                  </div>
                  <button onclick={() => deleteCriterion(criterion.id)} class="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-red-500 transition-all">
                    <span class="i-lucide-x w-4 h-4"></span>
                  </button>
                </div>
              {/each}

              {#if ticket.successCriteria.length === 0 && !showCriterionForm}
                <button onclick={() => showCriterionForm = true} class="w-full p-4 rounded-xl border-2 border-dashed border-border-subtle text-text-tertiary text-sm hover:border-accent/50 hover:text-accent hover:bg-accent/5 transition-all">
                  <span class="i-lucide-target w-5 h-5 inline-block mr-2 opacity-50"></span>
                  Define success criteria (SC-001, SC-002...)
                </button>
              {/if}
            </div>
          </div>

          <!-- 7. Tasks (only shown when approved or later) -->
          {#if canShowTasks}
            <div class="mb-8">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <span class="i-lucide-list-todo w-4 h-4 text-purple-500"></span>
                  Implementation Tasks
                  {#if taskProgress()}
                    <span class="text-text-tertiary font-normal text-xs bg-bg-tertiary px-2 py-0.5 rounded-full">{taskProgress()?.completed}/{taskProgress()?.total}</span>
                  {/if}
                </h3>
                <button onclick={() => showTaskForm = !showTaskForm} class="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1">
                  <span class="i-lucide-plus w-3 h-3"></span>
                  Add task
                </button>
              </div>

              {#if taskProgress()}
                <div class="h-2 bg-bg-tertiary rounded-full mb-4 overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-purple-500 to-green-500 transition-all duration-500 ease-out" style="width: {taskProgress()?.percent}%"></div>
                </div>
              {/if}

              {#if showTaskForm}
                <div class="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 mb-4">
                  <div class="grid grid-cols-2 gap-3 mb-3">
                    <input bind:value={newTask.name} placeholder="Task name..." class="col-span-2 px-3 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-sm focus:outline-none" />
                    <input bind:value={newTask.files} placeholder="Files (comma-separated)..." class="px-3 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-sm focus:outline-none" />
                    <select bind:value={newTask.phase} class="px-3 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-sm">
                      <option value="setup">Setup</option>
                      <option value="core">Core</option>
                      <option value="polish">Polish</option>
                      <option value="validation">Validation</option>
                    </select>
                  </div>
                  <textarea bind:value={newTask.action} placeholder="What to do..." rows="2" class="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-sm focus:outline-none resize-none mb-2"></textarea>
                  <div class="grid grid-cols-2 gap-3 mb-3">
                    <input bind:value={newTask.verification} placeholder="How to verify..." class="px-3 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-sm focus:outline-none" />
                    <input bind:value={newTask.done} placeholder="Done when..." class="px-3 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-sm focus:outline-none" />
                  </div>
                  <div class="flex items-center justify-between">
                    <label class="flex items-center gap-2 text-xs text-text-secondary">
                      <input type="checkbox" bind:checked={newTask.parallel} class="rounded" />
                      Can run in parallel [P]
                    </label>
                    <div class="flex gap-2">
                      <button onclick={() => showTaskForm = false} class="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary">Cancel</button>
                      <button onclick={addTaskItem} disabled={!newTask.name.trim()} class="px-3 py-1.5 text-xs font-medium text-white bg-purple-500 rounded-md hover:bg-purple-600 disabled:opacity-50">Add</button>
                    </div>
                  </div>
                </div>
              {/if}

              <div class="space-y-2">
                {#each ticket.tasks as task (task.id)}
                  <div class="p-3 rounded-lg bg-bg-secondary/50 border border-border-subtle group hover:border-purple-500/30 transition-colors">
                    <div class="flex items-start gap-3">
                      <select value={task.status} onchange={(e) => updateTaskStatus(task.id, (e.target as HTMLSelectElement).value as any)} class="w-8 h-8 rounded-lg border-2 flex-shrink-0 appearance-none text-center cursor-pointer {task.status === 'complete' ? 'bg-green-500 border-green-500 text-white' : task.status === 'in_progress' ? 'bg-purple-500 border-purple-500 text-white' : task.status === 'blocked' ? 'bg-red-500 border-red-500 text-white' : 'bg-bg-tertiary border-border-subtle'}">
                        <option value="pending">⬜</option>
                        <option value="in_progress">🔄</option>
                        <option value="complete">✅</option>
                        <option value="blocked">🚫</option>
                      </select>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-xs font-mono font-semibold text-purple-500">{task.id}</span>
                          {#if task.parallel}<span class="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500 font-semibold">[P]</span>{/if}
                          {#if task.userScenarioId}<span class="text-xs px-1.5 py-0.5 rounded bg-bg-tertiary text-text-tertiary">[{task.userScenarioId}]</span>{/if}
                          <span class="text-xs px-1.5 py-0.5 rounded bg-bg-tertiary text-text-tertiary capitalize">{task.phase}</span>
                        </div>
                        <p class="text-sm font-medium text-text-primary {task.status === 'complete' ? 'line-through text-text-tertiary' : ''}">{task.name}</p>
                        {#if task.files.length > 0}
                          <p class="text-xs text-text-tertiary mt-1 font-mono">{task.files.join(', ')}</p>
                        {/if}
                        {#if task.commitHash}
                          <p class="text-xs text-green-500 mt-1 font-mono">Commit: {task.commitHash.slice(0, 7)}</p>
                        {/if}
                      </div>
                      <button onclick={() => deleteTask(task.id)} class="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-red-500 transition-all">
                        <span class="i-lucide-x w-4 h-4"></span>
                      </button>
                    </div>
                  </div>
                {/each}

                {#if ticket.tasks.length === 0 && !showTaskForm}
                  <button onclick={() => showTaskForm = true} class="w-full p-4 rounded-xl border-2 border-dashed border-purple-500/30 text-purple-500 text-sm hover:bg-purple-500/5 transition-all">
                    <span class="i-lucide-list-todo w-5 h-5 inline-block mr-2 opacity-50"></span>
                    Add implementation tasks (T001, T002...)
                  </button>
                {/if}
              </div>
            </div>
          {:else}
            <!-- Locked tasks section -->
            <div class="mb-8 p-4 rounded-xl bg-bg-secondary/50 border border-border-subtle">
              <div class="flex items-center gap-3 text-text-tertiary">
                <span class="i-lucide-lock w-5 h-5"></span>
                <div>
                  <p class="text-sm font-medium">Implementation Tasks</p>
                  <p class="text-xs">Tasks will be available after the spec is approved</p>
                </div>
              </div>
            </div>
          {/if}

          <!-- Legacy Subtasks (for backwards compatibility) -->
          {#if ticket.subtasks.length > 0}
            <div class="mb-8">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <span class="i-lucide-check-square w-4 h-4 text-text-tertiary"></span>
                  Quick Tasks (Legacy)
                  {#if subtaskProgress()}
                    <span class="text-text-tertiary font-normal text-xs bg-bg-tertiary px-2 py-0.5 rounded-full">{subtaskProgress()?.completed}/{subtaskProgress()?.total}</span>
                  {/if}
                </h3>
              </div>
              <div class="space-y-1">
                {#each ticket.subtasks as subtask (subtask.id)}
                  <div class="flex items-center gap-3 group p-3 rounded-lg hover:bg-bg-secondary transition-colors">
                    <button onclick={() => toggleSubtask(subtask.id)} class="w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all {subtask.completed ? 'bg-green-500 border-green-500 text-white' : 'border-border-default hover:border-accent'}">
                      {#if subtask.completed}<span class="i-lucide-check w-3 h-3"></span>{/if}
                    </button>
                    <span class="flex-1 text-sm {subtask.completed ? 'text-text-tertiary line-through' : 'text-text-primary'}">{subtask.title}</span>
                    <button onclick={() => deleteSubtask(subtask.id)} class="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-red-500 transition-all">
                      <span class="i-lucide-x w-4 h-4"></span>
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Activity / Comments -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-text-primary flex items-center gap-2">
                <span class="i-lucide-message-circle w-4 h-4 text-text-tertiary"></span>
                Activity
                {#if activityTimeline().length > 0}
                  <span class="text-text-tertiary font-normal text-xs bg-bg-tertiary px-2 py-0.5 rounded-full">{activityTimeline().length}</span>
                {/if}
              </h3>
            </div>

            {#if activityTimeline().length > 0}
              <div class="space-y-3 mb-4">
                {#each activityTimeline() as item}
                  <div class="flex gap-3 p-3 rounded-lg bg-bg-secondary/50">
                    <div class="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                      {#if item.type === 'chat'}
                        {#if item.role === 'assistant'}
                          <span class="i-lucide-bot w-4 h-4 text-accent"></span>
                        {:else}
                          <span class="i-lucide-user w-4 h-4 text-text-tertiary"></span>
                        {/if}
                      {:else}
                        <span class="text-xs font-semibold text-text-secondary">{item.author?.charAt(0).toUpperCase() ?? 'U'}</span>
                      {/if}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-medium text-text-primary">{item.type === 'chat' ? (item.role === 'assistant' ? 'AI Assistant' : 'You') : item.author}</span>
                        <span class="text-xs text-text-tertiary">{new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                      <p class="text-sm text-text-secondary">{item.content}</p>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}

            {#if showCommentInput}
              <div class="p-3 rounded-xl bg-bg-secondary border border-border-subtle">
                <textarea bind:value={newComment} placeholder="Write a comment..." rows="3" class="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none resize-none"></textarea>
                <div class="flex justify-end gap-2 mt-2 pt-2 border-t border-border-subtle">
                  <button onclick={() => { showCommentInput = false; newComment = '' }} class="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary">Cancel</button>
                  <button onclick={addComment} disabled={!newComment.trim()} class="px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-md hover:bg-accent/90 disabled:opacity-50">Comment</button>
                </div>
              </div>
            {:else}
              <button onclick={() => showCommentInput = true} class="w-full p-3 rounded-xl border border-border-subtle text-text-tertiary text-sm hover:border-accent/50 hover:text-accent transition-all flex items-center gap-2">
                <span class="i-lucide-message-circle w-4 h-4"></span>
                Add a comment...
              </button>
            {/if}
          </div>

        </div>
      </div>

      <!-- Sidebar -->
      <aside class="w-80 border-l border-border-subtle p-5 overflow-y-auto bg-bg-primary">
        <h3 class="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Properties</h3>

        <div class="space-y-5">
          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">Status</label>
            <select value={ticket.status} onchange={handleStatusChange} class="w-full px-3 py-2.5 rounded-lg bg-bg-secondary border border-border-subtle text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent">
              {#each STATUS_COLUMNS as col}
                <option value={col.id}>{col.label}</option>
              {/each}
            </select>
          </div>

          <!-- Priority -->
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">Priority</label>
            <select value={ticket.priority} onchange={handlePriorityChange} class="w-full px-3 py-2.5 rounded-lg bg-bg-secondary border border-border-subtle text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent">
              {#each PRIORITIES as p}
                <option value={p.id}>{p.label}</option>
              {/each}
            </select>
          </div>

          <!-- Spec Completion -->
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">Spec Completion</label>
            <div class="flex items-center gap-3">
              <div class="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-accent to-green-500 transition-all" style="width: {ticket.specCompletion}%"></div>
              </div>
              <span class="text-sm font-semibold text-text-primary">{ticket.specCompletion}%</span>
            </div>
          </div>

          <!-- Assignees -->
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">Assignees</label>
            <div class="flex flex-wrap gap-2 mb-2">
              {#each ticket.assignees as assignee (assignee.id)}
                <button onclick={() => removeAssignee(assignee.id)} class="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg-tertiary hover:bg-red-500/10 transition-colors">
                  <div class="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-semibold text-white">{assignee.name.charAt(0).toUpperCase()}</div>
                  <span class="text-sm text-text-primary">{assignee.name}</span>
                  <span class="i-lucide-x w-3 h-3 text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:text-red-500"></span>
                </button>
              {/each}
            </div>
            {#if showAssigneeInput}
              <div class="flex gap-2">
                <input bind:value={newAssigneeName} onkeydown={(e) => e.key === 'Enter' && addAssignee()} placeholder="Name..." class="flex-1 px-3 py-2 text-sm rounded-lg bg-bg-secondary border border-border-subtle text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
                <button onclick={addAssignee} class="px-3 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90">Add</button>
              </div>
            {:else}
              <button onclick={() => showAssigneeInput = true} class="text-sm font-medium text-accent hover:text-accent/80 flex items-center gap-1">
                <span class="i-lucide-user-plus w-4 h-4"></span>
                Add assignee
              </button>
            {/if}
          </div>

          <!-- Labels -->
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">Labels</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              {#each ticket.labels as label (label.id)}
                {@const colorConfig = getLabelColor(label.color)}
                <button onclick={() => removeLabel(label.id)} class="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold {colorConfig.bg} {colorConfig.text} hover:opacity-80 transition-opacity">
                  {label.name}
                  <span class="i-lucide-x w-3 h-3 opacity-0 group-hover:opacity-100"></span>
                </button>
              {/each}
            </div>
            {#if availableLabels.length > 0}
              <div class="flex flex-wrap gap-1.5">
                {#each availableLabels as label (label.id)}
                  <button onclick={() => addLabel(label)} class="px-2.5 py-1 rounded-lg text-xs font-medium bg-bg-tertiary text-text-tertiary hover:bg-bg-secondary hover:text-text-secondary transition-colors">+ {label.name}</button>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Research Required Flag -->
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={ticket.researchRequired} onchange={() => tickets.update(ticket.id, { researchRequired: !ticket.researchRequired })} class="rounded border-border-subtle" />
              <span class="text-sm text-text-secondary">Research Required</span>
              <span class="i-lucide-search w-4 h-4 text-text-tertiary"></span>
            </label>
          </div>

          <!-- Dates -->
          <div class="pt-4 border-t border-border-subtle">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-text-tertiary mb-1">Created</label>
                <p class="text-sm font-medium text-text-primary">{ticket.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
              <div>
                <label class="block text-xs text-text-tertiary mb-1">Updated</label>
                <p class="text-sm font-medium text-text-primary">{ticket.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {#if ticket.chatHistory.length > 0}
          <div class="mt-6 pt-4 border-t border-border-subtle">
            <h3 class="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">AI Intake</h3>
            <div class="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
              <div class="flex items-center gap-2 mb-2">
                <span class="i-lucide-sparkles w-4 h-4 text-violet-400"></span>
                <span class="text-sm font-medium text-text-primary">{ticket.chatHistory.length} messages</span>
              </div>
              <a href="/ticket/{ticket.id}/chat" class="text-sm text-accent hover:underline flex items-center gap-1">
                View conversation
                <span class="i-lucide-arrow-right w-3 h-3"></span>
              </a>
            </div>
          </div>
        {/if}
      </aside>
    </div>
  </div>
{:else}
  <div class="flex-1 flex items-center justify-center">
    <div class="text-center">
      <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-bg-tertiary flex items-center justify-center">
        <span class="i-lucide-file-question w-10 h-10 text-text-tertiary"></span>
      </div>
      <h2 class="text-xl font-semibold text-text-primary mb-2">Ticket not found</h2>
      <p class="text-text-secondary mb-6">This ticket may have been deleted or doesn't exist.</p>
      <Button variant="primary" onclick={() => goto('/')}>
        <span class="i-lucide-arrow-left w-4 h-4"></span>
        Back to Board
      </Button>
    </div>
  </div>
{/if}
