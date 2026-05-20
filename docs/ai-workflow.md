# AI Workflow

Where AI sits, how it's invoked, and how we keep it trustworthy.

## 1. Four AI capabilities

| Capability | Endpoint | Use-case | Output schema |
|---|---|---|---|
| Natural-language task drafting | `POST /api/ai/parse-task` | [`ParseNaturalLanguageUseCase`](../apps/api/src/application/use-cases/ai/ParseNaturalLanguageUseCase.ts) | `ParsedTaskDraftSchema` |
| Task summarization | `POST /api/ai/summarize-task/:id` | [`SummarizeTaskUseCase`](../apps/api/src/application/use-cases/ai/SummarizeTaskUseCase.ts) | `TaskSummarySchema` |
| Deadline recommendation | `POST /api/ai/recommend-deadline` | [`RecommendDeadlineUseCase`](../apps/api/src/application/use-cases/ai/RecommendDeadlineUseCase.ts) | `DeadlineRecommendationSchema` |
| Suggest new tasks for a board | `POST /api/ai/suggest-tasks` | [`SuggestTasksUseCase`](../apps/api/src/application/use-cases/ai/SuggestTasksUseCase.ts) | `TaskSuggestion[]` |

## 2. Provider abstraction

The domain layer defines `IAIProvider` ([file](../apps/api/src/domain/services/IAIProvider.ts)). Two implementations live in `infrastructure/ai/`:

- **`AnthropicAIProvider`** — uses `@anthropic-ai/sdk` against `claude-opus-4-7` (configurable via `ANTHROPIC_MODEL`).
- **`MockAIProvider`** — deterministic, network-free. Used automatically when `ANTHROPIC_API_KEY` is empty.

Provider selection at boot ([`infrastructure/ai/index.ts`](../apps/api/src/infrastructure/ai/index.ts)):

```ts
if (env.ANTHROPIC_API_KEY) return new AnthropicAIProvider();
return new MockAIProvider();
```

This means CI, local dev, and demos all work end-to-end without a paid API key — important for an honest test pyramid.

## 3. Request lifecycle for an AI call

Taking `parse-task` as the canonical flow:

```
[Web]  NLTaskInput
        ├─ user types "urgent: ship docs by Friday"
        ├─ useParseTaskMutation()
        └─ POST /api/ai/parse-task { boardId, text }

[API]  ai.routes.ts
        ├─ requireAuth        (JWT)
        ├─ aiLimiter          (20/min)
        ├─ validateBody(...)  (zod, fail fast on malformed input)
        └─ ParseNaturalLanguageUseCase.execute(userId, input)
              ├─ boards.findById(input.boardId) + canEdit check
              └─ ai.parseNaturalLanguageTask({ text, nowISO })
                    └─ AnthropicAIProvider.callModel(...)
                          ├─ system prompt = SYSTEM_PROMPTS.parseNaturalLanguage
                          ├─ user message includes today's date
                          ├─ response.content[0].text
                          ├─ extractJSON() strips ```json fences
                          ├─ JSON.parse
                          ├─ ParsedTaskDraftSchema.safeParse
                          └─ return validated draft  OR  throw AIError(502)

[Web]  draft returned to UI
        ├─ low confidence (<0.5) → amber warning
        ├─ user clicks "Create task" → POST /api/tasks  (normal flow)
        └─ AI never auto-commits — the user is the gate
```

The "draft → confirm" pattern matters: at low confidence the human stays in the loop, and at high confidence the cost of confirming is one click.

## 4. Why every response is schema-validated

Even with explicit instructions, LLMs occasionally return:

- JSON wrapped in ```` ```json ``` ```` fences → handled by `extractJSON()`.
- A field renamed or omitted.
- A priority of `"super-urgent"` not in our enum.

Every response is validated with the same Zod schema the web client uses. If validation fails:

1. We log the raw output + schema issues at `warn`.
2. We throw `AIError` (502).
3. The UI shows a graceful failure, not corrupt data flowing into the DB.

This invariant — *no model output reaches persistence without passing the schema gate* — is the most important property of the AI layer.

## 5. Cost & latency posture

- **Caching summaries on the task.** `SummarizeTaskUseCase` writes the result to `task.aiSummary`. Re-summarization is only triggered when the user explicitly clicks the button. (Known follow-up: invalidate on description/comment change.)
- **No streaming.** Responses are small (<1KB) and infrequent; the UX gain of streaming isn't worth the protocol complexity here. Worth revisiting if we add long-form generation.
- **Rate limits.** `aiLimiter` caps a runaway client at 20/min before the bill explodes.
- **Mock fallback.** No accidental burn when env is misconfigured — we land in the mock path instead.

## 6. Failure modes & UX

| Failure | Server | Client UX |
|---|---|---|
| API key missing | Mock provider used | Works, with mock outputs |
| Model returns malformed JSON | Logged + `AIError 502` | Toast: "AI parse failed" |
| Model rate-limit upstream | SDK throws → caught by errorHandler → 502 | Same toast |
| Schema mismatch (e.g. invalid priority) | `AIError 502` with details | Same toast |
| Network timeout | Express/axios timeout → 500 | Same toast, no draft shown |

## 7. Extending to a new provider

1. Create `infrastructure/ai/OpenAIProvider.ts` implementing `IAIProvider`.
2. Update `createAIProvider()` to select based on a new env var (e.g., `AI_PROVIDER=openai|anthropic`).
3. No use-case or schema changes required.

That's the payoff of the abstraction.

## 8. What we explicitly chose **not** to do

- **No agentic loops / tool-use.** Each capability is one prompt → one response. Predictable cost, predictable behavior.
- **No fine-tuning.** Prompt-engineering against a frontier model is cheaper to maintain.
- **No vector DB / RAG.** Board context is small enough to fit in a single prompt. Revisit if we add long-form docs.
