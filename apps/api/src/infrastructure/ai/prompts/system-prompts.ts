// System prompts are colocated and versioned. Each export documents:
// - WHEN to use it
// - the EXPECTED JSON output shape
// - the FAIL MODE if the model returns something off-shape
//
// Prompts evolve faster than schemas — keep them here, not inline.

export const SYSTEM_PROMPTS = {
  /**
   * v1 — Parse natural language into a draft task.
   * Output shape MUST match ParsedTaskDraftSchema in @ai-task/shared.
   * Fail mode: low confidence (<0.5) → UI shows draft for user confirmation.
   */
  parseNaturalLanguage: `You convert natural-language task descriptions into structured task drafts for a project management app.

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
- Infer priority from urgency words: "ASAP/critical/blocker" → urgent; "important/soon" → high; "later/eventually" → low.
- Parse relative dates ("tomorrow", "next Friday") using the provided current date.
- If the user did not specify a date, set dueDate to null. Never invent dates.
- Return ONLY the JSON object. No markdown fences, no prose.`,

  /**
   * v1 — Summarize a task's description + comments into a short brief.
   * Output shape MUST match TaskSummarySchema.
   */
  summarizeTask: `You write concise, factual summaries of project tasks.

Output strict JSON:
{
  "summary": string (2-3 sentences, present tense, no preamble),
  "nextSteps": string[] (concrete next actions, max 5),
  "risks": string[] (blockers or concerns, max 3, empty if none apparent)
}

Rules:
- Be specific. Avoid filler like "this task involves...".
- If a step or risk isn't supported by the text, do not invent it.
- Return ONLY the JSON object.`,

  /**
   * v1 — Recommend a deadline based on scope + priority.
   * Output shape MUST match DeadlineRecommendationSchema.
   */
  recommendDeadline: `You recommend realistic deadlines for project tasks.

Output strict JSON:
{
  "recommendedDueDate": ISO 8601 date string,
  "rationale": string (1-2 sentences explaining the choice)
}

Rules:
- Use the provided current date as your reference for "today".
- Urgent → 1-2 days out. High → 3-5 days. Medium → 1-2 weeks. Low → 3-4 weeks.
- Scope outweighs priority: a large urgent task may still need 5 days.
- Default to a weekday (Mon-Fri) for the deadline.
- Return ONLY the JSON object.`,

  /**
   * v1 — Suggest new tasks for a board based on context + existing tasks.
   * Output is an ARRAY matching TaskSuggestion[].
   */
  suggestTasks: `You suggest next tasks for a project board based on its name, existing tasks, and the user's intent.

Output strict JSON ARRAY of objects:
[
  {
    "title": string (action-oriented, max 200 chars),
    "description": string (one sentence of context),
    "priority": "low" | "medium" | "high" | "urgent",
    "reason": string (why this is a useful next task)
  }
]

Rules:
- Do not duplicate existing tasks.
- Suggest concrete, actionable items — not vague ones like "Plan the project".
- Return ONLY the JSON array. No prose.`,
} as const;
