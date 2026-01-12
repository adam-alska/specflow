import { spawn, execSync, exec } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { RequestHandler } from './$types';

const SPECFLOW_DIR = '/Users/adam/GSD-Projects/specflow';

// Get Claude CLI path - resolved at startup
let CLAUDE_PATH = 'claude';
try {
	CLAUDE_PATH = execSync('which claude', { encoding: 'utf8' }).trim();
	console.log('Claude CLI found at:', CLAUDE_PATH);
} catch (e) {
	console.error('Claude CLI not found in PATH');
}

// Enhanced system prompt using SPARC Specification methodology
const SPARC_INTERVIEWER_PROMPT = `You are an AI interviewer helping users create feature specifications using SPARC methodology.

## YOUR ROLE: Requirements Interviewer + Spec Generator

You conduct conversational interviews to gather requirements, then generate structured specifications.

## CODEBASE CONTEXT (SpecFlow)
- SvelteKit + Svelte 5, TypeScript, UnoCSS
- SQLite persistence via better-sqlite3
- Ticket model: User Scenarios, Requirements, Clarifications, Tasks, Quality Gates
- Kanban: Backlog → Ready → In Progress → Review → Done

## INTERVIEW APPROACH

**Phase 1: Discovery (Questions 1-3)**
- What's the feature name?
- What problem does it solve?
- Who is the primary user?

**Phase 2: Flow (Questions 4-6)**
- What triggers the user to use this?
- Walk me through the happy path
- What's the expected outcome?

**Phase 3: Requirements (Questions 7-8)**
- What MUST this feature do? (functional requirements)
- Any constraints or things it must NOT do?

**Phase 4: Edge Cases (Question 9)**
- What could go wrong? Edge cases?

**Phase 5: Success (Questions 10-11)**
- How will we measure success?
- Priority level?

## CONVERSATION RULES
1. Ask ONE question at a time
2. Be friendly and conversational
3. Offer suggestion chips: [chip]Option A[/chip] [chip]Option B[/chip]
4. Acknowledge answers before asking the next question
5. After 8-11 questions, generate the spec

## SPEC OUTPUT FORMAT
When you have enough information, output:

---SPEC_START---
{
  "title": "Feature Name",
  "summary": "One-line description",
  "problem": "Problem being solved",
  "userScenarios": [
    {
      "id": "US-001",
      "title": "Primary user flow",
      "asA": "type of user",
      "iWant": "action/goal",
      "soThat": "benefit/outcome",
      "given": "precondition",
      "when": "trigger action",
      "then": "expected result"
    }
  ],
  "requirements": [
    {
      "id": "FR-001",
      "type": "functional",
      "description": "System MUST...",
      "priority": "must|should|could"
    }
  ],
  "constraints": [
    "System MUST NOT..."
  ],
  "edgeCases": [
    { "scenario": "description", "handling": "how to handle" }
  ],
  "successCriteria": [
    { "metric": "measurable criteria", "target": "specific target" }
  ],
  "priority": "critical|high|medium|low"
}
---SPEC_END---

Remember: You're a friendly interviewer, not a form. Have a conversation!`;

// Memory storage disabled - claude-flow has Node version mismatch
// Can be re-enabled once the module is rebuilt
async function storeInMemory(_key: string, _value: string): Promise<void> {
	// Disabled due to better-sqlite3 Node version mismatch
	// console.log('Memory store:', key);
}

async function getFromMemory(_key: string): Promise<string | null> {
	return null;
}

export const POST: RequestHandler = async ({ request }) => {
	const { messages, sessionId } = await request.json();

	// Build conversation history
	const conversationHistory = messages
		.map((m: { role: string; content: string }) =>
			`${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`
		)
		.join('\n\n');

	// Store conversation in memory for context persistence
	if (sessionId) {
		storeInMemory(`specflow/session/${sessionId}`, JSON.stringify(messages.slice(-4)));
	}

	const prompt = `${SPARC_INTERVIEWER_PROMPT}

## CURRENT CONVERSATION
${conversationHistory}

## YOUR TASK
Continue the interview naturally. If you have gathered enough information (usually after 8-11 exchanges), generate the structured spec. Otherwise, ask the next relevant question with suggestion chips.`;

	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			try {
				console.log('Starting Claude process with path:', CLAUDE_PATH);
				console.log('Prompt length:', prompt.length);

				// Write prompt to temp file to avoid shell escaping issues
				const tempPromptFile = join(tmpdir(), `specflow-prompt-${Date.now()}.txt`);
				writeFileSync(tempPromptFile, prompt);

				// Use Claude Code with SpecFlow codebase context
				// Read prompt from temp file using shell redirection
				const claudeProcess = spawn('sh', [
					'-c',
					`${CLAUDE_PATH} --print --dangerously-skip-permissions "$(cat ${tempPromptFile})"`
				], {
					cwd: SPECFLOW_DIR,
					env: process.env,
					stdio: ['ignore', 'pipe', 'pipe']
				});

				// Clean up temp file when process ends
				claudeProcess.on('close', () => {
					try { unlinkSync(tempPromptFile); } catch (e) { /* ignore */ }
				});

				// Send initial event to confirm connection
				const startChunk = `data: ${JSON.stringify({ type: 'start', status: 'connected' })}\n\n`;
				controller.enqueue(encoder.encode(startChunk));

				let buffer = '';

				claudeProcess.stdout.on('data', (data: Buffer) => {
					const text = data.toString();
					buffer += text;

					// Stream to client
					const chunk = `data: ${JSON.stringify({ type: 'text', content: text })}\n\n`;
					controller.enqueue(encoder.encode(chunk));
				});

				claudeProcess.stderr.on('data', (data: Buffer) => {
					const stderr = data.toString();
					console.error('Claude stderr:', stderr);
					// Send stderr to client as info
					const stderrChunk = `data: ${JSON.stringify({ type: 'info', content: stderr })}\n\n`;
					controller.enqueue(encoder.encode(stderrChunk));
				});

				// Handle process spawn event
				claudeProcess.on('spawn', () => {
					console.log('Claude process spawned successfully');
				});

				claudeProcess.on('close', (code) => {
					// Parse spec if present
					const specMatch = buffer.match(/---SPEC_START---([\s\S]*?)---SPEC_END---/);
					if (specMatch) {
						try {
							const spec = JSON.parse(specMatch[1].trim());

							// Store generated spec in memory
							if (sessionId) {
								storeInMemory(`specflow/specs/${sessionId}`, JSON.stringify(spec));
							}

							const specChunk = `data: ${JSON.stringify({ type: 'spec', content: spec })}\n\n`;
							controller.enqueue(encoder.encode(specChunk));
						} catch (e) {
							console.error('Failed to parse spec:', e);
						}
					}

					// Parse suggestion chips from response
					const chipMatches = buffer.match(/\[chip\](.*?)\[\/chip\]/g);
					if (chipMatches) {
						const suggestions = chipMatches.map(m => m.replace(/\[chip\]|\[\/chip\]/g, ''));
						const suggestionsChunk = `data: ${JSON.stringify({ type: 'suggestions', content: suggestions })}\n\n`;
						controller.enqueue(encoder.encode(suggestionsChunk));
					}

					const endChunk = `data: ${JSON.stringify({ type: 'done', code })}\n\n`;
					controller.enqueue(encoder.encode(endChunk));
					controller.close();
				});

				claudeProcess.on('error', (err) => {
					console.error('Claude process error:', err);
					const errorChunk = `data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`;
					controller.enqueue(encoder.encode(errorChunk));
					controller.close();
				});

			} catch (err) {
				const error = err as Error;
				console.error('Stream error:', error);
				const errorChunk = `data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`;
				controller.enqueue(encoder.encode(errorChunk));
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
};

// Test endpoint to verify spawn works
export const GET: RequestHandler = async () => {
	return new Promise((resolve) => {
		// Use shell: true to ensure proper environment
		const testProcess = spawn(CLAUDE_PATH, ['--print', '--dangerously-skip-permissions', 'Say OK'], {
			cwd: SPECFLOW_DIR,
			env: process.env,
			shell: true,
			stdio: ['ignore', 'pipe', 'pipe']
		});

		let output = '';
		let error = '';

		testProcess.stdout.on('data', (data: Buffer) => {
			output += data.toString();
			console.log('Test stdout:', data.toString());
		});

		testProcess.stderr.on('data', (data: Buffer) => {
			error += data.toString();
			console.log('Test stderr:', data.toString());
		});

		testProcess.on('close', (code) => {
			console.log('Test process closed with code:', code);
			resolve(new Response(JSON.stringify({ output, error, code }), {
				headers: { 'Content-Type': 'application/json' }
			}));
		});

		testProcess.on('error', (err) => {
			console.log('Test process error:', err);
			resolve(new Response(JSON.stringify({ error: err.message }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}));
		});

		// Timeout after 30s
		setTimeout(() => {
			testProcess.kill();
			resolve(new Response(JSON.stringify({ error: 'Timeout', output, stderr: error }), {
				status: 408,
				headers: { 'Content-Type': 'application/json' }
			}));
		}, 30000);
	});
};

// Fallback using Vercel AI SDK
export const PUT: RequestHandler = async ({ request }) => {
	const { messages } = await request.json();

	const { createAnthropic } = await import('@ai-sdk/anthropic');
	const { streamText } = await import('ai');

	const anthropic = createAnthropic();

	const result = streamText({
		model: anthropic('claude-sonnet-4-20250514'),
		system: SPARC_INTERVIEWER_PROMPT,
		messages
	});

	return result.toTextStreamResponse();
};
