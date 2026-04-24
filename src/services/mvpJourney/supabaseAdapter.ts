import {
  addScoreEvent,
  DEFAULT_MVP_STATE,
  normalizeState,
  setAnalysis,
  updateActions,
  updateMascot,
  updateProfile,
} from '@/lib/mvpJourneyState';
import { getInvoiceFlowSnapshot, logInvoiceFlow } from '@/lib/invoiceFlowDebug';
import {
  AppendScoreEventInput,
  JourneyStateContract,
  JourneyRequestContext,
  LoadJourneyStateInput,
  MvpJourneyService,
  SaveActionsInput,
  SaveAnalysisInput,
  SaveJourneyStateInput,
  SaveMascotInput,
  SaveProfileInput,
} from '@/services/mvpJourney/contracts';
import {
  createJourneySupabaseClient,
  isJourneySupabaseConfigured,
} from '@/services/mvpJourney/supabaseClient';
import { syncSupabaseRankingEntry } from '@/services/ranking/supabaseAdapter';
import { MvpState } from '@/types/mvp';

const JOURNEY_TABLE = 'mvp_journey_state';

type JourneyStateRow = {
  id: string;
  user_id: string;
  state: unknown;
  updated_at: string;
  created_at?: string;
};

const explainSecureModeIdentity = (context?: JourneyRequestContext) => {
  if (!context?.isFallbackIdentity) {
    return null;
  }

  if (context.identitySource === 'development-fallback') {
    return 'RLS-secured Supabase mode expects an authenticated Supabase user. The current request uses a development fallback identity, so secure policies based on auth.uid() will block reads and writes.';
  }

  if (context.identitySource === 'local-auth-fallback') {
    return 'RLS-secured Supabase mode expects a real Supabase auth session. The current request uses the local auth fallback mode, so auth.uid() will not match the stored journey user id.';
  }

  return null;
};

const getResolvedJourneyUserId = (context?: JourneyRequestContext) => {
  if (typeof context?.userId === 'string' && context.userId.trim()) {
    return context.userId;
  }

  console.warn(
    '[mvpJourney] Supabase adapter received no resolved user identity. Returning a graceful default state instead of inventing a mock id.'
  );
  return null;
};

const logRlsGuidance = (context: JourneyRequestContext | undefined, error: unknown) => {
  const fallbackExplanation = explainSecureModeIdentity(context);
  if (fallbackExplanation) {
    console.warn(`[mvpJourney] ${fallbackExplanation}`);
  }

  if (error) {
    console.warn(
      '[mvpJourney] If RLS is enabled for public.mvp_journey_state, the browser session must satisfy policies such as auth.uid()::text = user_id.',
      error
    );
  }
};

const coerceStatePayload = (statePayload: unknown): Partial<MvpState> | null => {
  if (!statePayload) {
    return null;
  }

  if (typeof statePayload === 'string') {
    try {
      return JSON.parse(statePayload) as Partial<MvpState>;
    } catch (_error) {
      return null;
    }
  }

  if (typeof statePayload === 'object') {
    return statePayload as Partial<MvpState>;
  }

  return null;
};

const createGracefulFallbackState = () => DEFAULT_MVP_STATE;

export const createSupabaseMvpJourneyService = (): MvpJourneyService => {
  const supabase = createJourneySupabaseClient();

  const loadStoredRow = async (context?: JourneyRequestContext): Promise<JourneyStateRow | null> => {
    if (!supabase || !isJourneySupabaseConfigured) {
      return null;
    }

    const resolvedUserId = getResolvedJourneyUserId(context);
    if (!resolvedUserId) {
      return null;
    }

    const { data, error } = await supabase
      .from(JOURNEY_TABLE)
      .select('id, user_id, state, updated_at, created_at')
      .eq('user_id', resolvedUserId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Nao foi possivel carregar o estado MVP no Supabase:', error);
      logRlsGuidance(context, error);
      return null;
    }

    return (data as JourneyStateRow | null) ?? null;
  };

  const persistState = async (
    context: JourneyRequestContext,
    state: JourneyStateContract
  ): Promise<JourneyStateContract> => {
    const normalizedState = normalizeState({
      ...state,
      lastActiveAt: new Date().toISOString(),
    });

    logInvoiceFlow('persist-supabase-journey-state', {
      userId: context.userId,
      identitySource: context.identitySource,
      invoiceHistoryLength: normalizedState.analysis.invoiceHistory.length,
      latestInvoice: getInvoiceFlowSnapshot(normalizedState.analysis.latestInvoice),
    });

    if (!supabase || !isJourneySupabaseConfigured) {
      return normalizedState;
    }

    const resolvedUserId = getResolvedJourneyUserId(context);
    if (!resolvedUserId) {
      return normalizedState;
    }

    const existingRow = await loadStoredRow({ ...context, userId: resolvedUserId });
    const payload = {
      user_id: resolvedUserId,
      state: normalizedState,
      updated_at: new Date().toISOString(),
    };

    if (existingRow?.id) {
      const { error } = await supabase.from(JOURNEY_TABLE).update(payload).eq('id', existingRow.id);

      if (error) {
        console.warn('Nao foi possivel atualizar o estado MVP no Supabase:', error);
        logRlsGuidance(context, error);
        return normalizedState;
      }

      await syncSupabaseRankingEntry({
        supabase,
        context: {
          ...context,
          userId: resolvedUserId,
        },
        state: normalizedState,
      });

      return normalizedState;
    }

    const { error } = await supabase.from(JOURNEY_TABLE).insert({
      ...payload,
      created_at: payload.updated_at,
    });

    if (error) {
      console.warn('Nao foi possivel criar o estado MVP no Supabase:', error);
      logRlsGuidance(context, error);
      return normalizedState;
    }

    await syncSupabaseRankingEntry({
      supabase,
      context: {
        ...context,
        userId: resolvedUserId,
      },
      state: normalizedState,
    });

    return normalizedState;
  };

  const resolveCurrentState = async (context: JourneyRequestContext) => {
    const storedState = await service.loadJourneyState(context);
    return normalizeState(storedState);
  };

  const service: MvpJourneyService = {
    loadJourneyState: async (input: LoadJourneyStateInput) => {
      const storedRow = await loadStoredRow(input);
      if (!storedRow) {
        return createGracefulFallbackState();
      }

      const statePayload = coerceStatePayload(storedRow.state);
      if (!statePayload) {
        return createGracefulFallbackState();
      }

      return normalizeState(statePayload);
    },

    saveJourneyState: async ({ state, ...context }: SaveJourneyStateInput) =>
      persistState(context, state),

    saveProfile: async ({ profile, ...context }: SaveProfileInput) => {
      const currentState = await resolveCurrentState(context);
      return persistState(context, updateProfile(currentState, profile));
    },

    saveMascot: async ({ mascot, ...context }: SaveMascotInput) => {
      const currentState = await resolveCurrentState(context);
      return persistState(context, updateMascot(currentState, mascot));
    },

    saveAnalysis: async ({ analysis, ...context }: SaveAnalysisInput) => {
      const currentState = await resolveCurrentState(context);
      return persistState(
        context,
        setAnalysis(currentState, {
          latestInvoice: analysis.latestInvoice,
          summary: analysis.summary,
          completedAt: analysis.lastCompletedAt,
        })
      );
    },

    appendScoreEvent: async ({ event, ...context }: AppendScoreEventInput) => {
      const currentState = await resolveCurrentState(context);
      return persistState(context, addScoreEvent(currentState, event));
    },

    saveActions: async ({ actions, ...context }: SaveActionsInput) => {
      const currentState = await resolveCurrentState(context);
      return persistState(
        context,
        updateActions(currentState, {
          items: actions.items,
          viewedActionIds: actions.viewedActionIds,
          updatedAt: actions.lastUpdatedAt,
        })
      );
    },
  };

  return service;
};
