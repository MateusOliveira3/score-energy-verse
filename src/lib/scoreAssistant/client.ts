import type { User } from '@supabase/supabase-js';
import { resolveJourneyIdentity } from '../journeyIdentity';
import { isSupabaseConfigured, supabase } from '../supabase';
import type {
  ScoreAssistantChatRequest,
  ScoreAssistantChatResponse,
  ScoreAssistantStatusResponse,
} from './types';

const isLocalFallbackUser = (user: User | null) =>
  user?.app_metadata?.provider === 'local-fallback' || user?.user_metadata?.mode === 'local-fallback';

const buildBaseHeaders = async ({
  hasMemoryContext,
  user,
}: {
  hasMemoryContext: boolean;
  user: User | null;
}) => {
  const headers = new Headers();
  headers.set('x-score-has-memory-context', hasMemoryContext ? '1' : '0');

  if (!user?.id) {
    return headers;
  }

  if (!isLocalFallbackUser(user) && isSupabaseConfigured && supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
      return headers;
    }
  }

  const journeyIdentity = resolveJourneyIdentity(user);
  headers.set('x-score-auth-mode', journeyIdentity.source);
  headers.set('x-score-user-id', journeyIdentity.userId);
  headers.set('x-score-user-name', user.email ?? 'Sessao ativa');

  return headers;
};

export const getScoreAssistantStatus = async ({
  hasMemoryContext,
  user,
}: {
  hasMemoryContext: boolean;
  user: User | null;
}) => {
  const headers = await buildBaseHeaders({ hasMemoryContext, user });
  const response = await fetch('/api/score-assistant/status', {
    headers,
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Nao foi possivel consultar o status do assistente.');
  }

  return (await response.json()) as ScoreAssistantStatusResponse;
};

export const chatWithScoreAssistant = async ({
  hasMemoryContext,
  request,
  user,
}: {
  hasMemoryContext: boolean;
  request: ScoreAssistantChatRequest;
  user: User | null;
}) => {
  const headers = await buildBaseHeaders({ hasMemoryContext, user });
  headers.set('Content-Type', 'application/json');

  const response = await fetch('/api/score-assistant/chat', {
    body: JSON.stringify(request),
    headers,
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Nao foi possivel conversar com o assistente agora.');
  }

  return (await response.json()) as ScoreAssistantChatResponse;
};
