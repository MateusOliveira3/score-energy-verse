import type {
  ScoreAssistantContextSnapshot,
  ScoreAssistantMessage,
  ScoreAssistantMode,
  ScoreAssistantUserContext,
} from './types';
import { buildScoreSystemPrompt } from './scoreSystemPrompt';

export interface HermesClientEnv {
  enabled: boolean;
  fallbackEnabled: boolean;
  apiKey?: string;
  maxTokens: number;
  model: string;
  webApiUrl?: string;
}

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const isHermesConfigured = (env: HermesClientEnv) =>
  Boolean(env.enabled && env.webApiUrl && env.apiKey);

export const resolveAssistantMode = (env: HermesClientEnv): ScoreAssistantMode =>
  isHermesConfigured(env) ? 'hermes' : 'fallback';

export const callHermesChat = async ({
  context,
  env,
  messages,
  skillNotes = [],
  user,
}: {
  context?: ScoreAssistantContextSnapshot;
  env: HermesClientEnv;
  messages: ScoreAssistantMessage[];
  skillNotes?: string[];
  user: ScoreAssistantUserContext;
}) => {
  if (!isHermesConfigured(env)) {
    throw new Error('Hermes nao configurado');
  }

  const response = await fetch(`${stripTrailingSlash(env.webApiUrl as string)}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      'Content-Type': 'application/json',
      'X-Hermes-Session-Key': `score:${user.userId}`,
    },
    body: JSON.stringify({
      model: env.model,
      stream: false,
      max_tokens: env.maxTokens,
      messages: [
        {
          role: 'system',
          content: buildScoreSystemPrompt({
            context,
            skillNotes,
            user,
          }),
        },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Hermes respondeu com status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const answer = payload.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error('Hermes respondeu sem conteudo');
  }

  return {
    answer,
    mode: 'hermes' as const,
  };
};
