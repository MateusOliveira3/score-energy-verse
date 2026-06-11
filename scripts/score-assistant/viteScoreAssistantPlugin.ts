import { readFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { Plugin } from 'vite';
import { buildFallbackAssistantResponse } from '../../src/lib/scoreAssistant/fallback';
import {
  callHermesChat,
  resolveAssistantMode,
  type HermesClientEnv,
} from '../../src/lib/scoreAssistant/hermesClient';
import type {
  ScoreAssistantChatRequest,
  ScoreAssistantMessage,
  ScoreAssistantUserContext,
} from '../../src/lib/scoreAssistant/types';

interface ScoreAssistantPluginEnv extends HermesClientEnv {
  supabaseAnonKey?: string;
  supabaseUrl?: string;
}

const MAX_BODY_SIZE = 64 * 1024;

const assistantSkillFiles = [
  'energy-bill-reading.md',
  'residential-loads.md',
  'home-office-energy.md',
  'energy-memory.md',
  'energy-culture.md',
] as const;

const isReadableMessage = (message: unknown): message is ScoreAssistantMessage =>
  Boolean(
    message &&
      typeof message === 'object' &&
      'role' in message &&
      'content' in message &&
      (message as { role?: unknown }).role !== 'system' &&
      typeof (message as { role?: unknown }).role === 'string' &&
      typeof (message as { content?: unknown }).content === 'string'
  );

const writeJson = (res: ServerResponse, statusCode: number, payload: unknown) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const readJsonBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;

    if (size > MAX_BODY_SIZE) {
      throw new Error('Payload excedeu o limite permitido');
    }

    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
};

const readHeader = (req: IncomingMessage, headerName: string) => {
  const value = req.headers[headerName];
  return Array.isArray(value) ? value[0] : value;
};

const resolveFallbackUser = (req: IncomingMessage): ScoreAssistantUserContext | null => {
  const userId = readHeader(req, 'x-score-user-id');

  if (!userId) {
    return null;
  }

  return {
    userId,
    userName: readHeader(req, 'x-score-user-name') || 'Sessao ativa',
    role: readHeader(req, 'x-score-auth-mode') || 'local-auth-fallback',
  };
};

const resolveSupabaseUser = async (
  accessToken: string,
  env: ScoreAssistantPluginEnv
): Promise<ScoreAssistantUserContext | null> => {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return null;
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user?.id) {
    return null;
  }

  return {
    userId: data.user.id,
    userName: data.user.email ?? 'Sessao ativa',
    role: 'authenticated',
  };
};

const resolveAuthenticatedUser = async (
  req: IncomingMessage,
  env: ScoreAssistantPluginEnv
): Promise<ScoreAssistantUserContext | null> => {
  const authorization = readHeader(req, 'authorization');

  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice('Bearer '.length).trim();
    const user = await resolveSupabaseUser(token, env);

    if (user) {
      return user;
    }
  }

  return resolveFallbackUser(req);
};

const hasMemoryContextHeader = (req: IncomingMessage) =>
  readHeader(req, 'x-score-has-memory-context') === '1';

const normalizeChatRequest = (payload: Record<string, unknown>): ScoreAssistantChatRequest => {
  const messages = Array.isArray(payload.messages) ? payload.messages.filter(isReadableMessage) : [];
  const context =
    payload.context && typeof payload.context === 'object'
      ? (payload.context as ScoreAssistantChatRequest['context'])
      : undefined;

  return {
    messages,
    context,
  };
};

const selectSkillFiles = (question: string) => {
  const normalizedQuestion = question
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalizedQuestion.includes('memoria')) {
    return ['energy-memory.md', 'energy-culture.md'];
  }

  if (normalizedQuestion.includes('home office') || normalizedQuestion.includes('trabalho em casa')) {
    return ['home-office-energy.md', 'residential-loads.md'];
  }

  if (
    normalizedQuestion.includes('conta') ||
    normalizedQuestion.includes('fatura') ||
    normalizedQuestion.includes('subiu') ||
    normalizedQuestion.includes('aumentou')
  ) {
    return ['energy-bill-reading.md', 'residential-loads.md'];
  }

  if (normalizedQuestion.includes('solar')) {
    return ['energy-culture.md', 'energy-memory.md'];
  }

  return ['residential-loads.md', 'energy-culture.md'];
};

const loadSkillNotes = async (question: string) => {
  const files = selectSkillFiles(question);
  const loadedSkills = await Promise.all(
    files.map(async (fileName) => {
      const absolutePath = resolve(process.cwd(), 'docs', 'skills', 'score-energy', fileName);

      try {
        const content = await readFile(absolutePath, 'utf8');
        const compactContent = content
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .slice(0, 8)
          .join(' ')
          .trim();

        return `${fileName.replace('.md', '')}: ${compactContent.slice(0, 320)}`;
      } catch (_error) {
        return null;
      }
    })
  );

  return loadedSkills.filter((value): value is string => Boolean(value));
};

const logAssistantEvent = ({
  mode,
  questionLength,
  success,
  userId,
}: {
  mode: 'fallback' | 'hermes';
  questionLength: number;
  success: boolean;
  userId: string;
}) => {
  console.info('[score-assistant]', {
    mode,
    questionLength,
    success,
    timestamp: new Date().toISOString(),
    userId,
  });
};

const createScoreAssistantHandler = (env: ScoreAssistantPluginEnv) => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const requestUrl = req.url ? new URL(req.url, 'http://localhost') : null;

    if (!requestUrl || !requestUrl.pathname.startsWith('/api/score-assistant')) {
      next();
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/api/score-assistant/status') {
      try {
        const user = await resolveAuthenticatedUser(req, env);

        if (!user) {
          writeJson(res, 401, { error: 'Nao autenticado' });
          return;
        }

        writeJson(res, 200, {
          enabled: env.enabled,
          mode: resolveAssistantMode(env),
          userId: user.userId,
          userName: user.userName,
          hasMemoryContext: hasMemoryContextHeader(req),
        });
      } catch (_error) {
        writeJson(res, 500, { error: 'Nao foi possivel verificar o status do assistente.' });
      }

      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/api/score-assistant/chat') {
      try {
        const user = await resolveAuthenticatedUser(req, env);

        if (!user) {
          writeJson(res, 401, { error: 'Nao autenticado' });
          return;
        }

        const request = normalizeChatRequest(await readJsonBody(req));

        if (request.messages.length === 0) {
          writeJson(res, 400, { error: 'Envie pelo menos uma mensagem.' });
          return;
        }

        const latestQuestion = request.messages.at(-1)?.content ?? '';
        const skillNotes = await loadSkillNotes(latestQuestion);

        if (env.enabled && resolveAssistantMode(env) === 'hermes') {
          try {
            const hermesResponse = await callHermesChat({
              context: request.context?.scoreContext,
              env,
              messages: request.messages,
              skillNotes,
              user,
            });

            logAssistantEvent({
              mode: 'hermes',
              questionLength: latestQuestion.length,
              success: true,
              userId: user.userId,
            });

            writeJson(res, 200, {
              answer: hermesResponse.answer,
              memorySignalsUsed: (request.context?.scoreContext?.memorySignals ?? []).slice(0, 3),
              mode: hermesResponse.mode,
              suggestedNextAction: request.context?.scoreContext?.suggestedNextAction,
            });
            return;
          } catch (_error) {
            if (!env.fallbackEnabled) {
              logAssistantEvent({
                mode: 'hermes',
                questionLength: latestQuestion.length,
                success: false,
                userId: user.userId,
              });

              writeJson(res, 502, {
                error: 'O assistente nao conseguiu responder agora.',
              });
              return;
            }
          }
        }

        const fallbackResponse = buildFallbackAssistantResponse({
          context: request.context?.scoreContext,
          messages: request.messages,
        });

        logAssistantEvent({
          mode: 'fallback',
          questionLength: latestQuestion.length,
          success: true,
          userId: user.userId,
        });

        writeJson(res, 200, fallbackResponse);
      } catch (_error) {
        writeJson(res, 500, {
          error: 'O assistente nao conseguiu responder agora.',
        });
      }

      return;
    }

    writeJson(res, 404, { error: 'Rota do assistente nao encontrada.' });
  };
};

export const createScoreAssistantApiPlugin = (env: ScoreAssistantPluginEnv): Plugin => {
  const handler = createScoreAssistantHandler(env);

  return {
    name: 'score-assistant-api',
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
    configureServer(server) {
      server.middlewares.use(handler);
    },
  };
};

export const createScoreAssistantPluginEnv = (rawEnv: Record<string, string>): ScoreAssistantPluginEnv => ({
  apiKey: rawEnv.HERMES_WEB_API_KEY,
  enabled: rawEnv.SCORE_ASSISTANT_ENABLED !== 'false',
  fallbackEnabled: rawEnv.SCORE_ASSISTANT_FALLBACK_ENABLED !== 'false',
  maxTokens: Number.parseInt(rawEnv.HERMES_MAX_TOKENS || '1024', 10) || 1024,
  model: rawEnv.HERMES_MODEL || 'minimax/minimax-m3',
  supabaseAnonKey: rawEnv.VITE_SUPABASE_ANON_KEY,
  supabaseUrl: rawEnv.VITE_SUPABASE_URL,
  webApiUrl: rawEnv.HERMES_WEB_API_URL,
});
