import { env } from '../../config/env.js';
import type { IAIProvider } from '../../domain/services/IAIProvider.js';
import { logger } from '../logger/logger.js';
import { AnthropicAIProvider } from './AnthropicAIProvider.js';
import { MockAIProvider } from './MockAIProvider.js';

// Provider selection: real Anthropic when key is configured, mock otherwise.
// Logged at boot so it's never a mystery which is active in a given env.
export function createAIProvider(): IAIProvider {
  if (env.ANTHROPIC_API_KEY) {
    logger.info({ model: env.ANTHROPIC_MODEL }, 'AI provider: Anthropic');
    return new AnthropicAIProvider();
  }
  logger.warn('AI provider: MOCK (set ANTHROPIC_API_KEY to use real Claude)');
  return new MockAIProvider();
}
