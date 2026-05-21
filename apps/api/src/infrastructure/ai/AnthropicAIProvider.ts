import Anthropic from '@anthropic-ai/sdk';
import {
  DeadlineRecommendationSchema,
  ParsedTaskDraftSchema,
  TaskSummarySchema,
  TaskSuggestionSchema,
  type DeadlineRecommendation,
  type ParsedTaskDraft,
  type TaskSuggestion,
  type TaskSummary,
} from '@ai-task/shared';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { AIError } from '../../domain/errors/DomainError.js';
import type { IAIProvider } from '../../domain/services/IAIProvider.js';
import { logger } from '../logger/logger.js';
import { SYSTEM_PROMPTS } from './prompts/system-prompts.js';

// Strip ```json fences the model sometimes adds despite instructions.
function extractJSON(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  }
  return trimmed;
}

// Validate every LLM response against the schema. If parsing fails, throw an
// AIError — the use-case decides whether to retry or surface to the user.
// Generic over the schema (not its inferred T) so the caller gets the OUTPUT
// type back, including any Zod `.default()` substitutions.
function parseStructured<S extends z.ZodTypeAny>(
  raw: string,
  schema: S,
  operation: string,
): z.infer<S> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJSON(raw));
  } catch (err) {
    logger.warn({ err, raw, operation }, 'AI returned non-JSON');
    throw new AIError(`AI returned malformed JSON for ${operation}`);
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    logger.warn({ issues: result.error.issues, parsed, operation }, 'AI response schema mismatch');
    throw new AIError(`AI response failed validation for ${operation}`, result.error.issues);
  }
  return result.data;
}

export class AnthropicAIProvider implements IAIProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('AnthropicAIProvider requires ANTHROPIC_API_KEY');
    }
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    this.model = env.ANTHROPIC_MODEL;
  }

  private async callModel(system: string, userMessage: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userMessage }],
    });
    const block = response.content[0];
    if (!block || block.type !== 'text') {
      throw new AIError('AI returned a non-text content block');
    }
    return block.text;
  }

  async parseNaturalLanguageTask(input: { text: string; nowISO: string }): Promise<ParsedTaskDraft> {
    const userMessage = `Current date: ${input.nowISO}\n\nUser said: """${input.text}"""`;
    const raw = await this.callModel(SYSTEM_PROMPTS.parseNaturalLanguage, userMessage);
    return parseStructured(raw, ParsedTaskDraftSchema, 'parseNaturalLanguageTask');
  }

  async summarizeTask(input: {
    title: string;
    description: string;
    comments: string[];
  }): Promise<TaskSummary> {
    const userMessage = [
      `Title: ${input.title}`,
      `Description: ${input.description || '(none)'}`,
      input.comments.length
        ? `Comments:\n${input.comments.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
        : 'Comments: (none)',
    ].join('\n\n');
    const raw = await this.callModel(SYSTEM_PROMPTS.summarizeTask, userMessage);
    return parseStructured(raw, TaskSummarySchema, 'summarizeTask');
  }

  async recommendDeadline(input: {
    title: string;
    description?: string;
    priority?: string;
    nowISO: string;
  }): Promise<DeadlineRecommendation> {
    const userMessage = [
      `Current date: ${input.nowISO}`,
      `Title: ${input.title}`,
      `Priority: ${input.priority ?? 'medium'}`,
      `Description: ${input.description ?? '(none)'}`,
    ].join('\n');
    const raw = await this.callModel(SYSTEM_PROMPTS.recommendDeadline, userMessage);
    return parseStructured(raw, DeadlineRecommendationSchema, 'recommendDeadline');
  }

  async suggestTasks(input: {
    boardName: string;
    existingTitles: string[];
    intent?: string;
    count: number;
  }): Promise<TaskSuggestion[]> {
    const userMessage = [
      `Board: ${input.boardName}`,
      `User intent: ${input.intent ?? '(none — suggest sensible next tasks)'}`,
      `Existing tasks:\n${input.existingTitles.map((t) => `- ${t}`).join('\n') || '(none)'}`,
      `Suggest ${input.count} new tasks.`,
    ].join('\n\n');
    const raw = await this.callModel(SYSTEM_PROMPTS.suggestTasks, userMessage);
    return parseStructured(raw, z.array(TaskSuggestionSchema), 'suggestTasks');
  }
}
