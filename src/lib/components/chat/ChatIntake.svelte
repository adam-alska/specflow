<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { tickets, sound } from '$lib/stores'
  import type { ChatMessage, UserScenario, Requirement, SuccessCriterion } from '$lib/stores'
  import ChatMessageBubble from './ChatMessage.svelte'
  import TypingIndicator from './TypingIndicator.svelte'
  import Button from '$lib/components/ui/Button.svelte'

  interface Props {
    ticketId: string
    onComplete: (spec: { title: string; description: string; content: string }) => void
    onCancel: () => void
    useAI?: boolean  // Enable real Claude Code integration
  }

  let { ticketId, onComplete, onCancel, useAI = true }: Props = $props()

  // AI mode state
  let aiMessages = $state<{ role: 'user' | 'assistant'; content: string }[]>([])
  let isStreaming = $state(false)
  let streamingContent = $state('')
  let currentSuggestions = $state<string[]>([])

  // Helper to strip [chip]...[/chip] tags from displayed text
  function stripChipTags(text: string): string {
    return text.replace(/\[chip\].*?\[\/chip\]/g, '').replace(/\s{2,}/g, ' ').trim()
  }

  // Interview phases - more granular for better UX
  type Phase = 'greeting' | 'problem' | 'user' | 'flow' | 'requirements' | 'edge-cases' | 'success' | 'priority' | 'review' | 'generating'

  interface Question {
    id: string
    phase: Phase
    question: string
    followUp?: string
    required: boolean
    suggestions?: string[]
    inputType?: 'text' | 'select' | 'multi'
  }

  const QUESTIONS: Question[] = [
    {
      id: 'name',
      phase: 'problem',
      question: "What should we call this feature?",
      followUp: "Pick a name your team would recognize in a sprint board.",
      required: true,
      suggestions: ['User Dashboard', 'Export Tool', 'Settings Page', 'Notification System']
    },
    {
      id: 'problem',
      phase: 'problem',
      question: "What problem are we solving?",
      followUp: "Who experiences this problem and how painful is it?",
      required: true,
      suggestions: ["Users can't...", "It takes too long to...", "There's no way to..."]
    },
    {
      id: 'user',
      phase: 'user',
      question: "Who is the primary user of this feature?",
      followUp: "Think about their role, not their name.",
      required: true,
      suggestions: ['End user', 'Admin', 'Developer', 'Manager', 'Guest visitor']
    },
    {
      id: 'trigger',
      phase: 'flow',
      question: "What triggers a user to use this feature?",
      followUp: "What situation or need brings them here?",
      required: true,
      suggestions: ['They want to...', 'They need to...', 'They received a notification...']
    },
    {
      id: 'happy-path',
      phase: 'flow',
      question: "Describe the ideal flow: what does the user do, step by step?",
      followUp: "Just the happy path - we'll cover edge cases later.",
      required: true,
    },
    {
      id: 'outcome',
      phase: 'flow',
      question: "What's the outcome when they're done?",
      followUp: "What do they see or what changes in the system?",
      required: true,
      suggestions: ['A success message', 'Updated data', 'A new item created', 'An email sent']
    },
    {
      id: 'must-have',
      phase: 'requirements',
      question: "What are the MUST-HAVE capabilities?",
      followUp: "Without these, the feature is useless.",
      required: true,
    },
    {
      id: 'must-not',
      phase: 'requirements',
      question: "What should this feature explicitly NOT do?",
      followUp: "Boundaries help prevent scope creep.",
      required: false,
      suggestions: ['No admin override', 'No bulk operations', 'No public access', "Skip this"]
    },
    {
      id: 'edge-cases',
      phase: 'edge-cases',
      question: "What could go wrong? Any edge cases to handle?",
      followUp: "Think about errors, empty states, permissions...",
      required: false,
      suggestions: ['User has no data', 'Network fails', 'Invalid input', 'Permission denied', "Skip this"]
    },
    {
      id: 'success-metric',
      phase: 'success',
      question: "How will we know this feature is successful?",
      followUp: "What's measurable?",
      required: true,
      suggestions: ['Task completion time < 30s', 'Error rate < 1%', 'User satisfaction > 4/5', 'Adoption > 50%']
    },
    {
      id: 'priority',
      phase: 'priority',
      question: "How urgent is this?",
      followUp: "Is there a deadline or event driving the timeline?",
      required: true,
      suggestions: ['Critical - blocking', 'High - this sprint', 'Medium - this quarter', 'Low - nice to have']
    },
  ]

  // State
  let messages = $state<ChatMessage[]>([])
  let inputValue = $state('')
  let currentQuestionIndex = $state(0)
  let isTyping = $state(false)
  let isGenerating = $state(false)
  let showPreview = $state(false)
  let messagesContainer: HTMLDivElement
  let answers = $state<Record<string, string>>({})

  // Derived state
  const currentQuestion = $derived(QUESTIONS[currentQuestionIndex])
  const currentPhase = $derived(currentQuestion?.phase ?? 'review')
  const progress = $derived(Math.round((currentQuestionIndex / QUESTIONS.length) * 100))

  const phases = ['problem', 'user', 'flow', 'requirements', 'edge-cases', 'success', 'priority'] as const
  const phaseLabels: Record<string, string> = {
    'problem': 'Problem',
    'user': 'User',
    'flow': 'Flow',
    'requirements': 'Requirements',
    'edge-cases': 'Edge Cases',
    'success': 'Success',
    'priority': 'Priority'
  }

  // Live preview data
  const previewSpec = $derived({
    title: answers['name'] || 'Untitled Feature',
    problem: answers['problem'] || '',
    user: answers['user'] || '',
    trigger: answers['trigger'] || '',
    happyPath: answers['happy-path'] || '',
    outcome: answers['outcome'] || '',
    mustHave: answers['must-have'] || '',
    mustNot: answers['must-not'] || '',
    edgeCases: answers['edge-cases'] || '',
    successMetric: answers['success-metric'] || '',
    priority: answers['priority'] || '',
  })

  onMount(() => {
    if (useAI) {
      // AI Mode - Start with Claude Code
      startAIConversation()
    } else {
      // Scripted Mode - Use predefined questions
      addAssistantMessage("👋 Hi! Let's spec out your feature together.\n\nI'll ask a few focused questions, and build the specification as we go. You can see the spec forming in real-time.")
      setTimeout(() => askNextQuestion(), 1200)
    }
  })

  // ==================== AI Mode Functions ====================

  async function startAIConversation() {
    isStreaming = true
    streamingContent = ''

    const systemMessage = {
      role: 'assistant' as const,
      content: "👋 Hi! I'm here to help you spec out your feature. I have full context of the SpecFlow codebase, so I can help you create specifications that fit perfectly with the existing architecture.\n\nWhat feature would you like to build?"
    }

    aiMessages = [systemMessage]
    messages = [{
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: systemMessage.content,
      timestamp: new Date()
    }]
    tickets.addChatMessage(ticketId, { role: 'assistant', content: systemMessage.content })
    sound.play('receive')

    // Set initial suggestions
    currentSuggestions = ['New board feature', 'Ticket enhancement', 'Integration', 'UI improvement']
    isStreaming = false
  }

  async function sendToClaudeAPI(userMessage: string) {
    isStreaming = true
    streamingContent = ''

    // Add user message to AI history
    aiMessages = [...aiMessages, { role: 'user', content: userMessage }]

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: aiMessages,
          sessionId: ticketId  // Use ticketId as session for memory persistence
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let assistantContent = ''

      // Create placeholder message for streaming
      const streamingMsgId = `msg_${Date.now()}`
      messages = [...messages, {
        id: streamingMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'text') {
              assistantContent += data.content
              streamingContent = stripChipTags(assistantContent)

              // Update the streaming message (strip chip tags for display)
              messages = messages.map(m =>
                m.id === streamingMsgId
                  ? { ...m, content: stripChipTags(assistantContent) }
                  : m
              )
              await scrollToBottom()
            }

            if (data.type === 'spec') {
              // Claude generated a complete spec
              handleGeneratedSpec(data.content)
            }

            if (data.type === 'suggestions') {
              // Suggestions parsed by server from [chip] tags
              currentSuggestions = data.content
            }

            if (data.type === 'done') {
              // Stream complete - store clean content without chip tags
              const cleanContent = stripChipTags(assistantContent)
              aiMessages = [...aiMessages, { role: 'assistant', content: cleanContent }]
              tickets.addChatMessage(ticketId, { role: 'assistant', content: cleanContent })
              sound.play('receive')

              // Also try to parse suggestions from response text (fallback)
              if (currentSuggestions.length === 0) {
                parseSuggestions(assistantContent)
              }
            }

            if (data.type === 'error') {
              console.error('Claude error:', data.message)
              // Fall back to scripted mode
              messages = messages.filter(m => m.id !== streamingMsgId)
              messages = [...messages, {
                id: `msg_${Date.now()}`,
                role: 'assistant',
                content: "I'm having trouble connecting to Claude Code. Let me switch to guided mode.\n\n" + QUESTIONS[0].question,
                timestamp: new Date()
              }]
              // Disable AI mode for this session
              // useAI = false
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }

    } catch (err) {
      console.error('Failed to call Claude API:', err)
      // Add error message
      messages = [...messages, {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: "I couldn't reach Claude Code. Using the guided interview instead.\n\n**" + QUESTIONS[0].question + "**\n\n" + (QUESTIONS[0].followUp || ''),
        timestamp: new Date()
      }]
      currentQuestionIndex = 0
      currentSuggestions = QUESTIONS[0].suggestions || []
    } finally {
      isStreaming = false
      streamingContent = ''
    }
  }

  function parseSuggestions(content: string) {
    // Look for [chip]...[/chip] patterns
    const chipMatches = content.match(/\[chip\](.*?)\[\/chip\]/g)
    if (chipMatches) {
      currentSuggestions = chipMatches.map(m => m.replace(/\[chip\]|\[\/chip\]/g, ''))
    } else {
      // Default suggestions based on content
      currentSuggestions = []
    }
  }

  function handleGeneratedSpec(spec: {
    title: string
    summary: string
    problem?: string
    userScenarios?: { id: string; title: string; asA: string; iWant: string; soThat: string; given?: string; when?: string; then?: string }[]
    requirements?: { id: string; type: string; title?: string; description: string; priority: string }[]
    constraints?: string[]
    edgeCases?: { scenario: string; handling: string }[]
    successCriteria?: (string | { metric: string; target?: string })[]
    priority?: string
  }) {
    isGenerating = true

    // Add user scenarios to ticket
    if (spec.userScenarios) {
      spec.userScenarios.forEach(scenario => {
        tickets.addUserScenario(ticketId, {
          priority: 'P1',
          title: scenario.title,
          given: scenario.given || scenario.asA,
          when: scenario.when || scenario.iWant,
          then: scenario.then || scenario.soThat
        })
      })
    }

    // Add requirements to ticket
    if (spec.requirements) {
      spec.requirements.forEach(req => {
        tickets.addRequirement(ticketId, {
          type: req.type === 'functional' ? 'functional' : 'non_functional',
          description: req.description
        })
      })
    }

    // Add constraints as non-functional requirements
    if (spec.constraints) {
      spec.constraints.forEach(constraint => {
        tickets.addRequirement(ticketId, {
          type: 'non_functional',
          description: constraint
        })
      })
    }

    // Add success criteria
    if (spec.successCriteria) {
      spec.successCriteria.forEach(criterion => {
        if (typeof criterion === 'string') {
          tickets.addSuccessCriterion(ticketId, criterion)
        } else {
          tickets.addSuccessCriterion(ticketId, criterion.metric, criterion.target)
        }
      })
    }

    sound.play('success')
    onComplete({
      title: spec.title,
      description: spec.problem || spec.summary,
      content: `# ${spec.title}\n\n${spec.summary}\n\n## Problem\n${spec.problem || ''}`
    })
  }

  // ==================== End AI Mode Functions ====================

  async function addAssistantMessage(content: string) {
    isTyping = true
    await new Promise(r => setTimeout(r, 400 + Math.random() * 400))
    isTyping = false

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date()
    }
    messages = [...messages, message]
    tickets.addChatMessage(ticketId, { role: 'assistant', content })
    sound.play('receive')
    await scrollToBottom()
  }

  function askNextQuestion() {
    if (currentQuestionIndex < QUESTIONS.length) {
      const q = QUESTIONS[currentQuestionIndex]
      const questionText = q.followUp
        ? `**${q.question}**\n\n${q.followUp}`
        : `**${q.question}**`
      addAssistantMessage(questionText)
    } else {
      showReview()
    }
  }

  async function showReview() {
    await addAssistantMessage(
      "✨ **Great!** I have everything I need.\n\n" +
      "I'll now generate a complete specification with:\n" +
      "• User Scenarios (Given/When/Then)\n" +
      "• Functional Requirements (FR-001...)\n" +
      "• Success Criteria (SC-001...)\n\n" +
      "Type **'generate'** or click the button below to create the spec."
    )
  }

  async function handleSend() {
    if (!inputValue.trim()) return

    const content = inputValue.trim()
    inputValue = ''

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    }
    messages = [...messages, userMessage]
    tickets.addChatMessage(ticketId, { role: 'user', content })
    sound.play('send')
    await scrollToBottom()

    // Route based on mode
    if (useAI) {
      // AI Mode - Send to Claude
      await sendToClaudeAPI(content)
    } else {
      // Scripted Mode
      // Store answer
      if (currentQuestion) {
        answers[currentQuestion.id] = content
      }

      if (currentQuestionIndex >= QUESTIONS.length) {
        // User confirmed, generate spec
        if (content.toLowerCase().includes('generate') || content.toLowerCase() === 'yes' || content.toLowerCase() === 'y') {
          await generateSpec()
        }
      } else {
        // Move to next question
        currentQuestionIndex++
        setTimeout(() => askNextQuestion(), 600)
      }
    }
  }

  function handleSuggestionClick(suggestion: string) {
    if (suggestion === "Skip this") {
      handleSkip()
    } else {
      inputValue = suggestion
      handleSend()
    }
  }

  function handleSkip() {
    if (currentQuestion && !currentQuestion.required) {
      answers[currentQuestion.id] = ''

      const skipMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: '(skipped)',
        timestamp: new Date()
      }
      messages = [...messages, skipMessage]

      currentQuestionIndex++
      setTimeout(() => askNextQuestion(), 400)
    }
  }

  async function generateSpec() {
    isGenerating = true
    await addAssistantMessage("🚀 Generating your specification...")

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 1500))

    // Generate structured data
    const userScenarios = generateUserScenarios()
    const requirements = generateRequirements()
    const successCriteria = generateSuccessCriteria()

    // Add to ticket
    userScenarios.forEach(scenario => {
      tickets.addUserScenario(ticketId, scenario)
    })
    requirements.forEach(req => {
      tickets.addRequirement(ticketId, req)
    })
    successCriteria.forEach(criterion => {
      tickets.addSuccessCriterion(ticketId, criterion.description, criterion.metric)
    })

    const spec = {
      title: previewSpec.title,
      description: previewSpec.problem,
      content: generateMarkdownSpec()
    }

    isGenerating = false
    sound.play('success')
    onComplete(spec)
  }

  function generateUserScenarios(): Omit<UserScenario, 'id'>[] {
    const scenarios: Omit<UserScenario, 'id'>[] = []

    // Primary scenario from happy path
    if (previewSpec.happyPath) {
      scenarios.push({
        priority: 'P1',
        title: `${previewSpec.user} completes primary task`,
        given: previewSpec.trigger || `${previewSpec.user} needs to use the feature`,
        when: previewSpec.happyPath.split('.')[0] || 'they perform the main action',
        then: previewSpec.outcome || 'the expected result occurs'
      })
    }

    // Error scenario from edge cases
    if (previewSpec.edgeCases && previewSpec.edgeCases !== '(skipped)') {
      const edgeCases = previewSpec.edgeCases.split(/[,\n]/).filter(Boolean)
      edgeCases.slice(0, 2).forEach((ec, i) => {
        scenarios.push({
          priority: 'P2',
          title: `Handle: ${ec.trim().substring(0, 50)}`,
          given: `${previewSpec.user} encounters an edge case`,
          when: ec.trim(),
          then: 'the system handles it gracefully'
        })
      })
    }

    return scenarios
  }

  function generateRequirements(): Omit<Requirement, 'id'>[] {
    const requirements: Omit<Requirement, 'id'>[] = []

    // Parse must-haves
    if (previewSpec.mustHave) {
      const mustHaves = previewSpec.mustHave.split(/[,\n•\-]/).filter(s => s.trim())
      mustHaves.forEach(mh => {
        requirements.push({
          type: 'functional',
          description: `System MUST ${mh.trim().toLowerCase().startsWith('must') ? mh.trim().substring(5) : mh.trim()}`,
          verified: false
        })
      })
    }

    // Parse must-nots as constraints
    if (previewSpec.mustNot && previewSpec.mustNot !== '(skipped)') {
      const mustNots = previewSpec.mustNot.split(/[,\n•\-]/).filter(s => s.trim())
      mustNots.forEach(mn => {
        requirements.push({
          type: 'non_functional',
          description: `System MUST NOT ${mn.trim().toLowerCase().startsWith('not') ? mn.trim().substring(4) : mn.trim()}`,
          verified: false
        })
      })
    }

    return requirements
  }

  function generateSuccessCriteria(): { description: string; metric?: string }[] {
    const criteria: { description: string; metric?: string }[] = []

    if (previewSpec.successMetric) {
      // Try to parse metric
      const metricMatch = previewSpec.successMetric.match(/([<>]=?\s*\d+[%\w]*)/i)
      criteria.push({
        description: `Feature achieves target performance`,
        metric: metricMatch ? metricMatch[1] : previewSpec.successMetric
      })
    }

    // Add standard criteria
    criteria.push({
      description: `${previewSpec.user} can complete the primary flow without assistance`,
    })

    if (previewSpec.outcome) {
      criteria.push({
        description: previewSpec.outcome.includes('.')
          ? previewSpec.outcome.split('.')[0].trim()
          : previewSpec.outcome
      })
    }

    return criteria
  }

  function generateMarkdownSpec(): string {
    return `# ${previewSpec.title}

## Overview

**Problem:** ${previewSpec.problem}

**Primary User:** ${previewSpec.user}

**Priority:** ${previewSpec.priority}

## User Journey

### Trigger
${previewSpec.trigger}

### Happy Path
${previewSpec.happyPath}

### Expected Outcome
${previewSpec.outcome}

## Constraints

${previewSpec.mustNot && previewSpec.mustNot !== '(skipped)'
  ? previewSpec.mustNot.split(/[,\n]/).filter(Boolean).map(m => `- ❌ ${m.trim()}`).join('\n')
  : '- No specific constraints defined'}

## Edge Cases

${previewSpec.edgeCases && previewSpec.edgeCases !== '(skipped)'
  ? previewSpec.edgeCases.split(/[,\n]/).filter(Boolean).map(e => `- ⚠️ ${e.trim()}`).join('\n')
  : '- To be identified during implementation'}

## Success Metrics

${previewSpec.successMetric}
`
  }

  async function scrollToBottom() {
    await tick()
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }
</script>

<div class="flex-1 flex overflow-hidden">
  <!-- Main Chat Panel -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Progress Bar / Mode Indicator -->
    <div class="px-6 py-3 border-b border-border-subtle bg-bg-secondary/50">
      {#if useAI}
        <!-- AI Mode Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span class="text-xs font-medium text-text-secondary">
              Claude Code connected • Codebase-aware
            </span>
          </div>
          <button
            onclick={() => showPreview = !showPreview}
            class="flex items-center gap-1 text-accent hover:text-accent/80 transition-colors text-xs"
          >
            <span class="i-lucide-eye w-3.5 h-3.5"></span>
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
        </div>
      {:else}
        <!-- Scripted Mode Progress -->
        <div class="flex items-center gap-1 mb-2">
          {#each phases as phase, i}
            {@const isActive = currentPhase === phase}
            {@const isPast = phases.indexOf(currentPhase as typeof phases[number]) > i}
            <div class="flex-1 h-1.5 rounded-full transition-all duration-300 {isPast ? 'bg-green-500' : isActive ? 'bg-accent' : 'bg-bg-tertiary'}"></div>
          {/each}
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-text-secondary">
            {phaseLabels[currentPhase] || 'Review'} • Question {Math.min(currentQuestionIndex + 1, QUESTIONS.length)} of {QUESTIONS.length}
          </span>
          <button
            onclick={() => showPreview = !showPreview}
            class="flex items-center gap-1 text-accent hover:text-accent/80 transition-colors"
          >
            <span class="i-lucide-eye w-3.5 h-3.5"></span>
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
        </div>
      {/if}
    </div>

    <!-- Messages -->
    <div
      bind:this={messagesContainer}
      class="flex-1 overflow-y-auto px-6 py-4"
    >
      <div class="max-w-2xl mx-auto space-y-4">
        {#each messages as message (message.id)}
          <ChatMessageBubble {message} />
        {/each}

        {#if isTyping || isStreaming}
          <TypingIndicator />
        {/if}

        {#if isGenerating}
          <div class="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
            <div class="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
              <span class="i-lucide-sparkles w-4 h-4 text-violet-400 animate-pulse"></span>
            </div>
            <div>
              <p class="text-sm font-medium text-text-primary">Generating specification...</p>
              <p class="text-xs text-text-tertiary">Creating user scenarios, requirements, and success criteria</p>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Suggestion Chips -->
    {#if !isGenerating && !isStreaming}
      {@const suggestions = useAI ? currentSuggestions : currentQuestion?.suggestions}
      {#if suggestions && suggestions.length > 0}
      <div class="px-6 py-2 border-t border-border-subtle bg-bg-secondary/30">
        <div class="max-w-2xl mx-auto flex flex-wrap gap-2">
          {#each suggestions as suggestion}
            <button
              onclick={() => handleSuggestionClick(suggestion)}
              class="px-3 py-1.5 text-sm rounded-full border transition-all
                {suggestion === 'Skip this'
                  ? 'border-border-subtle text-text-tertiary hover:border-text-tertiary hover:text-text-secondary'
                  : 'border-accent/30 text-accent hover:bg-accent/10 hover:border-accent'}"
            >
              {#if suggestion === 'Skip this'}
                <span class="i-lucide-skip-forward w-3 h-3 inline-block mr-1"></span>
              {/if}
              {suggestion}
            </button>
          {/each}
        </div>
      </div>
      {/if}
    {/if}

    <!-- Generate Button (when in review) -->
    {#if currentQuestionIndex >= QUESTIONS.length && !isGenerating}
      <div class="px-6 py-3 border-t border-border-subtle bg-bg-secondary/30">
        <div class="max-w-2xl mx-auto">
          <button
            onclick={() => generateSpec()}
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-medium
              hover:from-violet-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2"
          >
            <span class="i-lucide-sparkles w-5 h-5"></span>
            Generate Specification
          </button>
        </div>
      </div>
    {/if}

    <!-- Input -->
    <div class="px-6 py-4 border-t border-border-subtle">
      <div class="max-w-2xl mx-auto">
        <div class="flex gap-3">
          <div class="relative flex-1">
            <textarea
              bind:value={inputValue}
              onkeydown={handleKeydown}
              placeholder={useAI
                ? 'Describe what you want to build...'
                : (currentQuestionIndex >= QUESTIONS.length ? 'Type "generate" to create the spec...' : 'Type your answer...')}
              disabled={isGenerating || isStreaming}
              rows="2"
              class="
                w-full px-4 py-3 pr-12 rounded-xl resize-none
                bg-bg-secondary border border-border-subtle
                text-text-primary placeholder:text-text-tertiary
                focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                disabled:opacity-50
              "
            ></textarea>
            {#if currentQuestion && !currentQuestion.required && currentQuestionIndex < QUESTIONS.length}
              <button
                onclick={handleSkip}
                class="absolute right-3 top-3 p-1.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
                title="Skip this question"
              >
                <span class="i-lucide-skip-forward w-4 h-4"></span>
              </button>
            {/if}
          </div>
          <Button
            variant="primary"
            onclick={handleSend}
            disabled={!inputValue.trim() || isGenerating || isStreaming}
            class="self-end"
          >
            <span class="i-lucide-send w-4 h-4"></span>
          </Button>
        </div>
      </div>
    </div>
  </div>

  <!-- Live Preview Panel -->
  {#if showPreview}
    <aside class="w-80 border-l border-border-subtle bg-bg-secondary/50 overflow-y-auto">
      <div class="p-4 border-b border-border-subtle">
        <h3 class="text-sm font-semibold text-text-primary flex items-center gap-2">
          <span class="i-lucide-file-text w-4 h-4 text-accent"></span>
          Live Preview
        </h3>
        <p class="text-xs text-text-tertiary mt-1">Spec builds as you answer</p>
      </div>

      <div class="p-4 space-y-4 text-sm">
        <!-- Title -->
        <div>
          <label class="text-xs font-medium text-text-tertiary uppercase tracking-wider">Title</label>
          <p class="mt-1 font-medium text-text-primary {!previewSpec.title || previewSpec.title === 'Untitled Feature' ? 'opacity-40 italic' : ''}">
            {previewSpec.title || 'Waiting for input...'}
          </p>
        </div>

        <!-- Problem -->
        <div>
          <label class="text-xs font-medium text-text-tertiary uppercase tracking-wider">Problem</label>
          <p class="mt-1 text-text-secondary {!previewSpec.problem ? 'opacity-40 italic' : ''}">
            {previewSpec.problem || 'Not yet defined'}
          </p>
        </div>

        <!-- User Scenario Preview -->
        {#if previewSpec.user || previewSpec.trigger || previewSpec.outcome}
          <div class="p-3 rounded-lg bg-bg-tertiary/50 border border-border-subtle">
            <label class="text-xs font-medium text-accent uppercase tracking-wider">User Scenario</label>
            <div class="mt-2 space-y-1 text-xs">
              <p><span class="font-semibold text-green-500">Given</span> <span class="text-text-secondary">{previewSpec.trigger || '...'}</span></p>
              <p><span class="font-semibold text-blue-500">When</span> <span class="text-text-secondary">{previewSpec.happyPath?.split('.')[0] || '...'}</span></p>
              <p><span class="font-semibold text-purple-500">Then</span> <span class="text-text-secondary">{previewSpec.outcome || '...'}</span></p>
            </div>
          </div>
        {/if}

        <!-- Requirements Preview -->
        {#if previewSpec.mustHave}
          <div>
            <label class="text-xs font-medium text-text-tertiary uppercase tracking-wider">Requirements</label>
            <ul class="mt-1 space-y-1">
              {#each previewSpec.mustHave.split(/[,\n]/).filter(Boolean).slice(0, 3) as req, i}
                <li class="flex items-start gap-2 text-text-secondary">
                  <span class="text-xs font-mono text-blue-500 mt-0.5">FR-{String(i + 1).padStart(3, '0')}</span>
                  <span class="text-xs">{req.trim()}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Success Criteria Preview -->
        {#if previewSpec.successMetric}
          <div>
            <label class="text-xs font-medium text-text-tertiary uppercase tracking-wider">Success Criteria</label>
            <div class="mt-1 flex items-center gap-2">
              <span class="text-xs font-mono text-green-500">SC-001</span>
              <span class="text-xs text-text-secondary">{previewSpec.successMetric}</span>
            </div>
          </div>
        {/if}

        <!-- Priority -->
        {#if previewSpec.priority}
          <div class="pt-2 border-t border-border-subtle">
            <label class="text-xs font-medium text-text-tertiary uppercase tracking-wider">Priority</label>
            <p class="mt-1 text-text-primary font-medium">{previewSpec.priority}</p>
          </div>
        {/if}
      </div>
    </aside>
  {/if}
</div>
