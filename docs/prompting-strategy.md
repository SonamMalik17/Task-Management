# Prompting Strategy

Prompts are colocated and versioned in [`apps/api/src/infrastructure/ai/prompts/system-prompts.ts`](../apps/api/src/infrastructure/ai/prompts/system-prompts.ts). This document explains the recipe.

## 1. Principles we hold

1. **The schema is the spec.** Every prompt declares the exact JSON shape it must return. The same Zod schema then validates the response. If the model drifts, the gate catches it.
2. **Single-shot is fine here.** None of these tasks benefit from multi-turn reasoning or tool calls. We keep prompts focused and small (<500 tokens of system content).
3. **Anchor with the current date.** Anything time-sensitive (deadlines, relative dates) takes `nowISO` as part of the user message. The model never invents "today".
4. **Confidence is the API's job, not the model's.** Where the parse may be ambiguous (natural-language task input), we ask the model to self-report a `confidence` number, and the UI uses it to choose between commit and confirm.
5. **No prose around the JSON.** Every prompt ends with "Return ONLY the JSON object" and we strip stray ```` ``` ```` fences defensively.
6. **Prompt versions are explicit.** Each prompt is labeled `v1`. When we evolve a prompt we bump the comment and run the new one against the recorded test inputs.

## 2. Anatomy of a system prompt

Using `parseNaturalLanguage` as the example:

```
You convert natural-language task descriptions into structured task drafts
for a project management app.

Output strict JSON matching this schema:
{
  "title": string (concise, action-oriented, max 200 chars),
  "description": string (additional context, can be empty),
  "priority": "low" | "medium" | "high" | "urgent",
  "dueDate": ISO 8601 date string or null,
  "tags": string[] (lowercase, kebab-case, max 5),
  "confidence": number from 0 to 1 (your confidence the parse is correct)
}

Rules:
- Infer priority from urgency words: "ASAP/critical/blocker" → urgent;
  "important/soon" → high; "later/eventually" → low.
- Parse relative dates ("tomorrow", "next Friday") using the provided
  current date.
- If the user did not specify a date, set dueDate to null. Never invent dates.
- Return ONLY the JSON object. No markdown fences, no prose.
```

Notable choices:

- **Schema first, rules second.** The model sees the shape before the constraints; constraints fill the gaps the shape can't express.
- **Explicit handling of unknowns.** "Never invent dates" is a load-bearing line — without it, the model would happily guess.
- **Examples kept out of the system prompt** to save tokens. If we add few-shot examples later, they go in the user message so we can adjust them per call.

## 3. User-message conventions

Every user message includes only what the model needs:

| Capability | User message structure |
|---|---|
| `parseNaturalLanguage` | `Current date: <ISO>\n\nUser said: """<text>"""` |
| `summarizeTask` | `Title:\n\nDescription:\n\nComments: 1. ... 2. ...` |
| `recommendDeadline` | `Current date:\nTitle:\nPriority:\nDescription:` |
| `suggestTasks` | `Board:\nIntent:\nExisting tasks:\n- ...\n- ...\n\nSuggest N new tasks.` |

We deliberately avoid stuffing the entire board history into prompts — only what's relevant for the immediate decision.

## 4. Response handling pipeline

```
LLM text → extractJSON() → JSON.parse → schema.safeParse → use-case
                  │                            │
                  └─ strips ```json fences     └─ on failure → AIError(502)
```

If `safeParse` fails, we log `{ issues, parsed, operation }` at `warn` level. This is the single best signal for "the prompt drifted" — surfacing it loudly in dev means we catch regressions before users do.

## 5. When to update a prompt

- **The model returns wrong data on a class of inputs.** Add a rule explicitly addressing it, not a vague nudge.
- **A schema field changes.** Update the prompt's "Output strict JSON" block — the rule of thumb is to mirror exactly what the schema enforces.
- **You're tempted to add "please."** That's the time to instead state the rule as a constraint. Politeness is fine, but specificity wins.

## 6. Anti-patterns we avoid

- ❌ Mixing system + user content. The current date goes in the **user** message, not the system prompt, so it can change per-request without invalidating any prompt caches.
- ❌ Long preamble. "You are an expert assistant…" — adds tokens, adds nothing.
- ❌ Asking the model to "be confident". It will. The confidence number is calibrated by the explicit thresholds in the rules (e.g., "no date → null").
- ❌ Branching prompts. One prompt per capability. If we need branching, build two capabilities.

## 7. Evaluation hooks (room to grow)

The current scope doesn't include an offline eval harness, but the architecture is ready for one:

- Each prompt's input/output schema is already typed.
- The provider interface (`IAIProvider`) makes it trivial to wrap the production provider with a recording adapter that snapshots requests + responses.
- A future `apps/evals` package could replay snapshots against a candidate prompt and report a confusion matrix.
