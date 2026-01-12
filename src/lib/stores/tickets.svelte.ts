// Tickets store using Svelte 5 runes - Linear/Trello style
// Hybrid model: Spec-Kit + GSD + SPARC + BMAD
import { browser } from '$app/environment'

export type TicketStatus = 'draft' | 'in_review' | 'approved' | 'in_development' | 'completed'
export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none'
export type ScenarioPriority = 'P1' | 'P2' | 'P3'
export type RequirementType = 'functional' | 'non_functional'
export type TaskPhase = 'setup' | 'core' | 'polish' | 'validation'
export type TaskStatus = 'pending' | 'in_progress' | 'complete' | 'blocked'

export interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

export interface Label {
  id: string
  name: string
  color: LabelColor
}

export type LabelColor =
  | 'gray' | 'red' | 'orange' | 'yellow' | 'green'
  | 'blue' | 'purple' | 'pink'

// === USER SCENARIO (from Spec-Kit) ===
// Given/When/Then format for testable acceptance criteria
export interface UserScenario {
  id: string
  priority: ScenarioPriority  // P1 = must have, P2 = should have, P3 = nice to have
  title: string
  given: string    // Given [precondition/state]
  when: string     // When [action/trigger]
  then: string     // Then [expected outcome]
}

// === REQUIREMENT (from Spec-Kit) ===
// FR-001 format for formal requirements
export interface Requirement {
  id: string          // FR-001, FR-002, NFR-001
  type: RequirementType
  description: string // "System MUST..." or "Users MUST be able to..."
  clarificationNeeded?: string  // [NEEDS CLARIFICATION: ...]
  verified: boolean
}

// === CLARIFICATION (from Spec-Kit) ===
// Questions that need answers before implementation
export interface Clarification {
  id: string
  question: string
  context?: string   // Why this matters
  resolved: boolean
  answer?: string
  resolvedAt?: Date
}

// === SUCCESS CRITERIA (from Spec-Kit) ===
export interface SuccessCriterion {
  id: string         // SC-001, SC-002
  description: string
  metric?: string    // Measurable outcome
  met: boolean
}

// === TASK (execution phase - from Spec-Kit + GSD) ===
// Only visible/editable after spec is approved
export interface Task {
  id: string              // T001, T002
  userScenarioId?: string // Links to US (e.g., "US1")
  parallel: boolean       // [P] marker - can run in parallel
  phase: TaskPhase        // setup, core, polish, validation

  // From GSD task structure
  name: string
  files: string[]         // File paths involved
  action: string          // What to do
  verification: string    // How to verify it worked
  done: string            // Acceptance criteria

  status: TaskStatus
  commitHash?: string     // Git commit after completion

  // Checkpoint support
  isCheckpoint: boolean
  checkpointType?: 'verify' | 'decision'
  checkpointResolved?: boolean
}

// Legacy subtask (kept for backwards compatibility, maps to Task)
export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface Comment {
  id: string
  author: string
  content: string
  timestamp: Date
}

export interface Assignee {
  id: string
  name: string
  avatar?: string  // URL or initials
  color?: string   // Avatar background color
}

export interface Ticket {
  id: string
  number: number  // SF-001 style
  title: string
  description: string  // Problem statement / context
  status: TicketStatus
  priority: Priority

  // === SPECIFICATION (the core of spec-driven development) ===
  userScenarios: UserScenario[]     // Given/When/Then (from Spec-Kit)
  requirements: Requirement[]        // FR-001 format (from Spec-Kit)
  clarifications: Clarification[]    // [NEEDS CLARIFICATION] (from Spec-Kit)
  successCriteria: SuccessCriterion[] // SC-001 format (from Spec-Kit)
  spec: string                       // Full markdown spec content
  research?: string                  // Research notes (from GSD)
  dataModel?: string                 // Entity definitions
  apiContract?: string               // API spec

  // === EXECUTION (hidden until approved) ===
  tasks: Task[]                      // Generated from spec (from Spec-Kit + GSD)
  subtasks: Subtask[]                // Legacy - maps to simple tasks

  // === METADATA ===
  chatHistory: ChatMessage[]
  labels: Label[]
  comments: Comment[]
  assignees: Assignee[]
  dueDate?: Date
  estimate?: number
  researchRequired: boolean          // Flag for needing investigation (from GSD)

  // === AI FEATURES ===
  aiGenerated: boolean
  aiQuestion?: string

  // === PROGRESS ===
  specCompletion: number             // 0-100 percentage
  qualityGate: QualityGate           // Current gate status (from SPARC)

  createdAt: Date
  updatedAt: Date
}

// === QUALITY GATES (from SPARC) ===
export type QualityGate =
  | 'spec_incomplete'      // Still drafting spec
  | 'spec_complete'        // Spec ready for review
  | 'clarifications_needed' // Has unresolved clarifications
  | 'ready_for_approval'   // All clarifications resolved
  | 'approved'             // Spec approved, can generate tasks
  | 'tasks_ready'          // Tasks generated
  | 'in_progress'          // Development started
  | 'verification_pending' // Needs testing/verification
  | 'complete'             // All done

// Status column configuration with colors
export const STATUS_COLUMNS: { id: TicketStatus; label: string; color: string }[] = [
  { id: 'draft', label: 'Draft', color: 'text-text-tertiary' },
  { id: 'in_review', label: 'In Review', color: 'text-yellow-500' },
  { id: 'approved', label: 'Approved', color: 'text-blue-500' },
  { id: 'in_development', label: 'In Development', color: 'text-purple-500' },
  { id: 'completed', label: 'Completed', color: 'text-green-500' },
]

// Priority configuration with icons and colors
export const PRIORITIES: { id: Priority; label: string; color: string; icon: string }[] = [
  { id: 'urgent', label: 'Urgent', color: 'text-red-500 bg-red-500/10', icon: 'i-lucide-alert-circle' },
  { id: 'high', label: 'High', color: 'text-orange-500 bg-orange-500/10', icon: 'i-lucide-signal-high' },
  { id: 'medium', label: 'Medium', color: 'text-yellow-500 bg-yellow-500/10', icon: 'i-lucide-signal-medium' },
  { id: 'low', label: 'Low', color: 'text-blue-500 bg-blue-500/10', icon: 'i-lucide-signal-low' },
  { id: 'none', label: 'No priority', color: 'text-text-tertiary bg-bg-tertiary', icon: 'i-lucide-minus' },
]

// Label color presets
export const LABEL_COLORS: { id: LabelColor; bg: string; text: string }[] = [
  { id: 'gray', bg: 'bg-gray-500/20', text: 'text-gray-400' },
  { id: 'red', bg: 'bg-red-500/20', text: 'text-red-400' },
  { id: 'orange', bg: 'bg-orange-500/20', text: 'text-orange-400' },
  { id: 'yellow', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  { id: 'green', bg: 'bg-green-500/20', text: 'text-green-400' },
  { id: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  { id: 'purple', bg: 'bg-purple-500/20', text: 'text-purple-400' },
  { id: 'pink', bg: 'bg-pink-500/20', text: 'text-pink-400' },
]

// Default labels
export const DEFAULT_LABELS: Label[] = [
  { id: 'bug', name: 'Bug', color: 'red' },
  { id: 'feature', name: 'Feature', color: 'purple' },
  { id: 'improvement', name: 'Improvement', color: 'blue' },
  { id: 'docs', name: 'Documentation', color: 'yellow' },
  { id: 'design', name: 'Design', color: 'pink' },
  { id: 'tech-debt', name: 'Tech Debt', color: 'orange' },
]

// Filter type for ticket queries
export interface TicketFilter {
  status?: TicketStatus[]
  priority?: Priority[]
  search?: string
  assignee?: string
  labels?: string[]
}

class TicketsStore {
  #tickets = $state<Ticket[]>([])
  #activeTicketId = $state<string | null>(null)
  #nextNumber = $state(1)
  #filter = $state<TicketFilter>({})

  constructor() {
    if (browser) {
      // Load from localStorage for now (will be SQLite later)
      const saved = localStorage.getItem('specflow-tickets')
      const savedNumber = localStorage.getItem('specflow-next-number')

      if (savedNumber) {
        this.#nextNumber = parseInt(savedNumber, 10)
      }

      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          this.#tickets = parsed.map((t: any) => ({
            ...t,
            number: t.number ?? 0,
            description: t.description ?? t.problemStatement ?? '',
            labels: t.labels ?? [],

            // New spec-driven fields (with backwards compatibility)
            userScenarios: t.userScenarios ?? [],
            requirements: t.requirements ?? [],
            clarifications: (t.clarifications ?? []).map((c: any) => ({
              ...c,
              resolvedAt: c.resolvedAt ? new Date(c.resolvedAt) : undefined
            })),
            successCriteria: t.successCriteria ?? [],
            research: t.research ?? '',
            dataModel: t.dataModel ?? '',
            apiContract: t.apiContract ?? '',
            tasks: t.tasks ?? [],
            researchRequired: t.researchRequired ?? false,
            qualityGate: t.qualityGate ?? this.#computeQualityGate(t),

            // Legacy fields
            subtasks: t.subtasks ?? [],
            comments: (t.comments ?? []).map((c: any) => ({
              ...c,
              timestamp: new Date(c.timestamp)
            })),
            assignees: t.assignees ?? (t.assignee ? [{ id: t.assignee, name: t.assignee, color: 'purple' }] : []),
            aiGenerated: t.aiGenerated ?? false,
            aiQuestion: t.aiQuestion,
            specCompletion: t.specCompletion ?? 0,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
            chatHistory: (t.chatHistory ?? []).map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            })),
          }))
        } catch (e) {
          console.error('Failed to load tickets:', e)
        }
      }
    }
  }

  get all() {
    return this.#tickets
  }

  get active() {
    return this.#tickets.find(t => t.id === this.#activeTicketId) ?? null
  }

  get activeId() {
    return this.#activeTicketId
  }

  get filter() {
    return this.#filter
  }

  // Format ticket number as SF-001
  formatNumber(num: number): string {
    return `SF-${num.toString().padStart(3, '0')}`
  }

  // Filtered tickets based on current filter
  get filtered() {
    return this.#tickets.filter(ticket => {
      if (this.#filter.status?.length && !this.#filter.status.includes(ticket.status)) {
        return false
      }
      if (this.#filter.priority?.length && !this.#filter.priority.includes(ticket.priority)) {
        return false
      }
      if (this.#filter.assignee && !ticket.assignees.some(a => a.id === this.#filter.assignee)) {
        return false
      }
      if (this.#filter.labels?.length) {
        const ticketLabelIds = ticket.labels.map(l => l.id)
        if (!this.#filter.labels.some(id => ticketLabelIds.includes(id))) {
          return false
        }
      }
      if (this.#filter.search) {
        const search = this.#filter.search.toLowerCase()
        const numberMatch = this.formatNumber(ticket.number).toLowerCase().includes(search)
        return (
          numberMatch ||
          ticket.title.toLowerCase().includes(search) ||
          ticket.description.toLowerCase().includes(search) ||
          ticket.spec.toLowerCase().includes(search)
        )
      }
      return true
    })
  }

  // Get tickets grouped by status for kanban view
  get byStatus() {
    const groups: Record<TicketStatus, Ticket[]> = {
      draft: [],
      in_review: [],
      approved: [],
      in_development: [],
      completed: [],
    }

    for (const ticket of this.filtered) {
      groups[ticket.status].push(ticket)
    }

    // Sort by priority within each column
    const priorityOrder: Priority[] = ['urgent', 'high', 'medium', 'low', 'none']
    for (const status of Object.keys(groups) as TicketStatus[]) {
      groups[status].sort((a, b) => {
        return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
      })
    }

    return groups
  }

  setActive(id: string | null) {
    this.#activeTicketId = id
  }

  setFilter(filter: TicketFilter) {
    this.#filter = filter
  }

  clearFilter() {
    this.#filter = {}
  }

  create(initial?: Partial<Ticket>): Ticket {
    const now = new Date()
    const number = this.#nextNumber++

    const ticket: Ticket = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      number,
      title: initial?.title ?? 'Untitled',
      description: initial?.description ?? '',
      status: 'draft',
      priority: 'none',

      // Spec-driven fields
      userScenarios: [],
      requirements: [],
      clarifications: [],
      successCriteria: [],
      spec: '',
      research: '',
      dataModel: '',
      apiContract: '',
      tasks: [],
      researchRequired: false,
      qualityGate: 'spec_incomplete',

      // Legacy & metadata
      subtasks: [],
      chatHistory: [],
      labels: [],
      comments: [],
      assignees: [],
      aiGenerated: false,
      specCompletion: 0,
      createdAt: now,
      updatedAt: now,
      ...initial,
    }

    this.#tickets = [...this.#tickets, ticket]
    this.#persist()
    return ticket
  }

  // Compute quality gate based on ticket state (from SPARC)
  #computeQualityGate(t: any): QualityGate {
    if (t.status === 'completed') return 'complete'
    if (t.status === 'in_development') {
      const tasks = t.tasks ?? []
      const pendingVerification = tasks.some((task: any) =>
        task.isCheckpoint && task.checkpointType === 'verify' && !task.checkpointResolved
      )
      return pendingVerification ? 'verification_pending' : 'in_progress'
    }
    if (t.status === 'approved') {
      return (t.tasks?.length ?? 0) > 0 ? 'tasks_ready' : 'approved'
    }
    if (t.status === 'in_review') {
      const unresolvedClarifications = (t.clarifications ?? []).filter((c: any) => !c.resolved)
      if (unresolvedClarifications.length > 0) return 'clarifications_needed'
      return 'ready_for_approval'
    }
    // Draft status
    const hasScenarios = (t.userScenarios?.length ?? 0) > 0
    const hasRequirements = (t.requirements?.length ?? 0) > 0
    const hasSpec = (t.spec?.length ?? 0) > 50
    return (hasScenarios || hasRequirements || hasSpec) ? 'spec_complete' : 'spec_incomplete'
  }

  // Update quality gate when ticket changes
  #updateQualityGate(id: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    const newGate = this.#computeQualityGate(ticket)
    if (ticket.qualityGate !== newGate) {
      this.update(id, { qualityGate: newGate })
    }
  }

  update(id: string, updates: Partial<Omit<Ticket, 'id' | 'number' | 'createdAt'>>) {
    this.#tickets = this.#tickets.map(t =>
      t.id === id
        ? { ...t, ...updates, updatedAt: new Date() }
        : t
    )
    this.#persist()
  }

  updateStatus(id: string, status: TicketStatus) {
    this.update(id, { status })
  }

  // Label management
  addLabel(id: string, label: Label) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    if (ticket.labels.some(l => l.id === label.id)) return // Already has label
    this.update(id, { labels: [...ticket.labels, label] })
  }

  removeLabel(id: string, labelId: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, { labels: ticket.labels.filter(l => l.id !== labelId) })
  }

  // Subtask management
  addSubtask(id: string, title: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    const subtask: Subtask = {
      id: `subtask_${Date.now()}`,
      title,
      completed: false
    }
    this.update(id, { subtasks: [...ticket.subtasks, subtask] })
  }

  toggleSubtask(id: string, subtaskId: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, {
      subtasks: ticket.subtasks.map(s =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      )
    })
  }

  deleteSubtask(id: string, subtaskId: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, {
      subtasks: ticket.subtasks.filter(s => s.id !== subtaskId)
    })
  }

  // === USER SCENARIO MANAGEMENT (from Spec-Kit) ===
  addUserScenario(id: string, scenario: Omit<UserScenario, 'id'>) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    const newScenario: UserScenario = {
      ...scenario,
      id: `US${ticket.userScenarios.length + 1}`
    }
    this.update(id, { userScenarios: [...ticket.userScenarios, newScenario] })
    this.#updateQualityGate(id)
  }

  updateUserScenario(id: string, scenarioId: string, updates: Partial<UserScenario>) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, {
      userScenarios: ticket.userScenarios.map(s =>
        s.id === scenarioId ? { ...s, ...updates } : s
      )
    })
  }

  deleteUserScenario(id: string, scenarioId: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, {
      userScenarios: ticket.userScenarios.filter(s => s.id !== scenarioId)
    })
    this.#updateQualityGate(id)
  }

  // === REQUIREMENT MANAGEMENT (from Spec-Kit) ===
  addRequirement(id: string, req: Omit<Requirement, 'id' | 'verified'>) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    const prefix = req.type === 'functional' ? 'FR' : 'NFR'
    const count = ticket.requirements.filter(r => r.type === req.type).length + 1
    const newReq: Requirement = {
      ...req,
      id: `${prefix}-${count.toString().padStart(3, '0')}`,
      verified: false
    }
    this.update(id, { requirements: [...ticket.requirements, newReq] })
    this.#updateQualityGate(id)
  }

  updateRequirement(id: string, reqId: string, updates: Partial<Requirement>) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, {
      requirements: ticket.requirements.map(r =>
        r.id === reqId ? { ...r, ...updates } : r
      )
    })
    this.#updateQualityGate(id)
  }

  deleteRequirement(id: string, reqId: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, {
      requirements: ticket.requirements.filter(r => r.id !== reqId)
    })
    this.#updateQualityGate(id)
  }

  // === CLARIFICATION MANAGEMENT (from Spec-Kit) ===
  addClarification(id: string, question: string, context?: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    const clarification: Clarification = {
      id: `CLR-${Date.now()}`,
      question,
      context,
      resolved: false
    }
    this.update(id, { clarifications: [...ticket.clarifications, clarification] })
    this.#updateQualityGate(id)
  }

  resolveClarification(id: string, clarificationId: string, answer: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, {
      clarifications: ticket.clarifications.map(c =>
        c.id === clarificationId
          ? { ...c, resolved: true, answer, resolvedAt: new Date() }
          : c
      )
    })
    this.#updateQualityGate(id)
  }

  deleteClarification(id: string, clarificationId: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, {
      clarifications: ticket.clarifications.filter(c => c.id !== clarificationId)
    })
    this.#updateQualityGate(id)
  }

  // === SUCCESS CRITERIA MANAGEMENT (from Spec-Kit) ===
  addSuccessCriterion(id: string, description: string, metric?: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    const criterion: SuccessCriterion = {
      id: `SC-${(ticket.successCriteria.length + 1).toString().padStart(3, '0')}`,
      description,
      metric,
      met: false
    }
    this.update(id, { successCriteria: [...ticket.successCriteria, criterion] })
  }

  toggleSuccessCriterion(id: string, criterionId: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, {
      successCriteria: ticket.successCriteria.map(c =>
        c.id === criterionId ? { ...c, met: !c.met } : c
      )
    })
  }

  deleteSuccessCriterion(id: string, criterionId: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, {
      successCriteria: ticket.successCriteria.filter(c => c.id !== criterionId)
    })
  }

  // === TASK MANAGEMENT (from Spec-Kit + GSD) ===
  addTask(id: string, task: Omit<Task, 'id' | 'status' | 'commitHash'>) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    const taskNum = ticket.tasks.length + 1
    const newTask: Task = {
      ...task,
      id: `T${taskNum.toString().padStart(3, '0')}`,
      status: 'pending'
    }
    this.update(id, { tasks: [...ticket.tasks, newTask] })
    this.#updateQualityGate(id)
  }

  updateTask(id: string, taskId: string, updates: Partial<Task>) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, {
      tasks: ticket.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      )
    })
    this.#updateQualityGate(id)
  }

  updateTaskStatus(id: string, taskId: string, status: TaskStatus, commitHash?: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, {
      tasks: ticket.tasks.map(t =>
        t.id === taskId ? { ...t, status, commitHash: commitHash ?? t.commitHash } : t
      )
    })
    this.#updateQualityGate(id)
  }

  deleteTask(id: string, taskId: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, {
      tasks: ticket.tasks.filter(t => t.id !== taskId)
    })
    this.#updateQualityGate(id)
  }

  // Generate tasks from spec (AI would call this)
  generateTasksFromSpec(id: string, tasks: Omit<Task, 'id' | 'status' | 'commitHash'>[]) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return

    const newTasks: Task[] = tasks.map((task, index) => ({
      ...task,
      id: `T${(index + 1).toString().padStart(3, '0')}`,
      status: 'pending' as TaskStatus
    }))

    this.update(id, { tasks: newTasks })
    this.#updateQualityGate(id)
  }

  // === TASK PROGRESS HELPERS ===
  get taskProgress() {
    return (id: string) => {
      const ticket = this.#tickets.find(t => t.id === id)
      if (!ticket || ticket.tasks.length === 0) return null
      const completed = ticket.tasks.filter(t => t.status === 'complete').length
      return {
        completed,
        total: ticket.tasks.length,
        percent: Math.round((completed / ticket.tasks.length) * 100)
      }
    }
  }

  // Comment management
  addComment(id: string, author: string, content: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    const comment: Comment = {
      id: `comment_${Date.now()}`,
      author,
      content,
      timestamp: new Date()
    }
    this.update(id, { comments: [...ticket.comments, comment] })
  }

  // Assignee management
  addAssignee(id: string, assignee: Assignee) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    if (ticket.assignees.some(a => a.id === assignee.id)) return // Already assigned
    this.update(id, { assignees: [...ticket.assignees, assignee] })
  }

  removeAssignee(id: string, assigneeId: string) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return
    this.update(id, { assignees: ticket.assignees.filter(a => a.id !== assigneeId) })
  }

  addChatMessage(id: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const ticket = this.#tickets.find(t => t.id === id)
    if (!ticket) return

    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      timestamp: new Date()
    }

    this.update(id, {
      chatHistory: [...ticket.chatHistory, newMessage]
    })
  }

  delete(id: string) {
    this.#tickets = this.#tickets.filter(t => t.id !== id)
    if (this.#activeTicketId === id) {
      this.#activeTicketId = null
    }
    this.#persist()
  }

  reorder(ticketId: string, newStatus: TicketStatus, newIndex: number) {
    // For now, just update the status
    // Full reorder logic will come with drag-drop
    this.updateStatus(ticketId, newStatus)
  }

  // Get overdue tickets
  get overdue() {
    const now = new Date()
    return this.#tickets.filter(t =>
      t.dueDate && t.dueDate < now && t.status !== 'completed'
    )
  }

  // Get due soon tickets (within 3 days)
  get dueSoon() {
    const now = new Date()
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    return this.#tickets.filter(t =>
      t.dueDate &&
      t.dueDate >= now &&
      t.dueDate <= threeDays &&
      t.status !== 'completed'
    )
  }

  #persist() {
    if (browser) {
      localStorage.setItem('specflow-tickets', JSON.stringify(this.#tickets))
      localStorage.setItem('specflow-next-number', this.#nextNumber.toString())
    }
  }
}

export const tickets = new TicketsStore()
