import {
  AnalysisState,
  AnalysisStatus,
  InvoiceData,
  JourneyStage,
  Mascot,
  MvpState,
  NextAction,
  NextActionsState,
  Profile,
  ScoreEvent,
  ScoreEventType,
  ScoreExplanation,
  ScoreExplanationEvent,
  ScoreExplanationNextGain,
  ScoreExplanationSubtotal,
} from '@/types/mvp';
import {
  buildNextActions,
  getScoreEventPoints,
  getScoreEventSubject,
  getScoreState,
  isProfileComplete,
  normalizeScoreEvents,
} from '@/lib/mvpCoreFlow';

const RETURN_VISIT_MS = 1000 * 60 * 30;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const SCORE_EVENT_EXPLANATION: Record<ScoreEventType, { label: string; reason: string }> = {
  profile_completed: {
    label: 'Perfil completo',
    reason: 'Conta porque o perfil tem contexto suficiente para personalizar a jornada.',
  },
  invoice_uploaded: {
    label: 'Fatura enviada',
    reason: 'Conta porque uma fatura real da jornada foi enviada e ficou registrada no historico.',
  },
  analysis_completed: {
    label: 'Analise concluida',
    reason: 'Conta porque existe uma analise pronta vinculada a uma fatura valida da jornada.',
  },
  action_viewed: {
    label: 'Acao revisada',
    reason: 'Conta porque uma proxima acao valida foi revisada pelo usuario.',
  },
};

export interface LegacyStoredJourneyState {
  profile?: Partial<Profile>;
  mascotCustomization?: Partial<Mascot>;
  latestInvoice?: AnalysisState['latestInvoice'];
  latestAnalysis?: AnalysisState['summary'];
  nextActions?: NextAction[];
  scoreEvents?: ScoreEvent[];
  journeyStage?: JourneyStage;
  viewedActionIds?: string[];
  lastActiveAt?: string;
}

export const DEFAULT_PROFILE: Profile = {
  consumerType: 'Residencial',
  location: '',
  propertySize: 0,
  peopleCount: 1,
  energyPreference: 'Convencional',
};

export const DEFAULT_MASCOT: Mascot = {
  name: 'EcoFriend',
  emoji: '🌱',
  colorPalette: 'emerald',
  borderEffect: 'none',
};

export const DEFAULT_ANALYSIS_STATE: AnalysisState = {
  status: 'idle',
  invoiceHistory: [],
};

export const DEFAULT_ACTIONS_STATE: NextActionsState = {
  items: [],
  viewedActionIds: [],
};

export const DEFAULT_MVP_STATE: MvpState = {
  profile: DEFAULT_PROFILE,
  mascot: DEFAULT_MASCOT,
  analysis: DEFAULT_ANALYSIS_STATE,
  scoreEvents: [],
  actions: DEFAULT_ACTIONS_STATE,
  journeyStage: 'onboarding',
};

export const normalizeProfile = (profile?: Partial<Profile>): Profile => ({
  ...DEFAULT_PROFILE,
  ...profile,
  location: typeof profile?.location === 'string' ? profile.location : DEFAULT_PROFILE.location,
  propertySize: isFiniteNumber(profile?.propertySize)
    ? profile.propertySize
    : DEFAULT_PROFILE.propertySize,
  peopleCount: isFiniteNumber(profile?.peopleCount)
    ? profile.peopleCount
    : DEFAULT_PROFILE.peopleCount,
});

export const normalizeMascot = (mascot?: Partial<Mascot>): Mascot => ({
  ...DEFAULT_MASCOT,
  ...mascot,
  name: typeof mascot?.name === 'string' && mascot.name.trim() ? mascot.name : DEFAULT_MASCOT.name,
  emoji:
    typeof mascot?.emoji === 'string' && mascot.emoji.trim() ? mascot.emoji : DEFAULT_MASCOT.emoji,
  colorPalette:
    typeof mascot?.colorPalette === 'string' && mascot.colorPalette.trim()
      ? mascot.colorPalette
      : DEFAULT_MASCOT.colorPalette,
  borderEffect:
    typeof mascot?.borderEffect === 'string' && mascot.borderEffect.trim()
      ? mascot.borderEffect
      : DEFAULT_MASCOT.borderEffect,
});

const normalizeAction = (
  action: Partial<NextAction> | undefined,
  viewedActionIds: string[]
): NextAction | null => {
  if (!action?.id || !action.title || !action.description || !action.value || !action.priority) {
    return null;
  }

  const status = action.status ?? (viewedActionIds.includes(action.id) ? 'viewed' : 'new');
  return {
    id: action.id,
    title: action.title,
    description: action.description,
    value: action.value,
    priority: action.priority,
    status,
    source: action.source ?? 'journey',
  };
};

export const normalizeActionsState = (
  actions?: Partial<NextActionsState>,
  legacyActions?: NextAction[],
  legacyViewedIds?: string[]
): NextActionsState => {
  const viewedActionIds = isStringArray(actions?.viewedActionIds)
    ? actions.viewedActionIds
    : isStringArray(legacyViewedIds)
      ? legacyViewedIds
      : DEFAULT_ACTIONS_STATE.viewedActionIds;
  const rawItems = Array.isArray(actions?.items)
    ? actions.items
    : Array.isArray(legacyActions)
      ? legacyActions
      : DEFAULT_ACTIONS_STATE.items;
  const items = rawItems
    .map((action) => normalizeAction(action, viewedActionIds))
    .filter((action): action is NextAction => Boolean(action));

  return {
    items,
    viewedActionIds,
    lastUpdatedAt:
      typeof actions?.lastUpdatedAt === 'string' ? actions.lastUpdatedAt : undefined,
  };
};

export const normalizeAnalysisState = (
  analysis?: Partial<AnalysisState>,
  legacyLatestInvoice?: AnalysisState['latestInvoice'],
  legacySummary?: AnalysisState['summary']
): AnalysisState => {
  const latestInvoice = analysis?.latestInvoice ?? legacyLatestInvoice;
  const rawInvoiceHistory = Array.isArray(analysis?.invoiceHistory)
    ? analysis.invoiceHistory
    : latestInvoice
      ? [latestInvoice]
      : DEFAULT_ANALYSIS_STATE.invoiceHistory;
  const invoiceHistory = rawInvoiceHistory.filter(
    (invoice): invoice is InvoiceData =>
      Boolean(invoice?.fingerprint && invoice.fileName && invoice.month)
  );
  const resolvedLatestInvoice = latestInvoice ?? invoiceHistory[0];
  const summary = analysis?.summary ?? legacySummary;
  const status =
    analysis?.status ??
    (resolvedLatestInvoice || summary ? 'ready' : DEFAULT_ANALYSIS_STATE.status);

  return {
    status,
    latestInvoice: resolvedLatestInvoice,
    invoiceHistory,
    summary,
    lastCompletedAt:
      typeof analysis?.lastCompletedAt === 'string'
        ? analysis.lastCompletedAt
        : typeof resolvedLatestInvoice?.uploadedAt === 'string'
          ? resolvedLatestInvoice.uploadedAt
          : undefined,
  };
};

export const resolveJourneyStage = (
  state: Pick<MvpState, 'profile' | 'analysis' | 'lastActiveAt'>
): JourneyStage => {
  const hasReturnableJourney =
    Boolean(state.lastActiveAt) &&
    Date.now() - new Date(state.lastActiveAt as string).getTime() > RETURN_VISIT_MS &&
    (Boolean(state.analysis.latestInvoice) || Boolean(state.analysis.summary));

  if (hasReturnableJourney) {
    return 'return-visit';
  }

  if (state.analysis.status === 'processing' || (state.analysis.latestInvoice && !state.analysis.summary)) {
    return 'invoice-uploaded';
  }

  if (state.analysis.latestInvoice && state.analysis.summary) {
    return 'analysis-ready';
  }

  if (isProfileComplete(state.profile)) {
    return 'before-upload';
  }

  return DEFAULT_MVP_STATE.journeyStage;
};

const resolveActionsState = (
  state: Pick<MvpState, 'profile' | 'analysis' | 'actions'>
): NextActionsState => {
  const normalizedActions = normalizeActionsState(state.actions);
  const nextItems = buildNextActions(
    state.analysis.latestInvoice,
    state.analysis.summary,
    state.profile
  );
  const nextItemIds = new Set(nextItems.map((action) => action.id));
  const viewedActionIds = normalizedActions.viewedActionIds.filter((actionId) =>
    nextItemIds.has(actionId)
  );
  const persistedActionMap = new Map(
    normalizedActions.items.map((action) => [action.id, action] as const)
  );

  const items = nextItems
    .map((action) =>
      normalizeAction(
        {
          ...action,
          status: viewedActionIds.includes(action.id)
            ? 'viewed'
            : persistedActionMap.get(action.id)?.status === 'started' ||
                persistedActionMap.get(action.id)?.status === 'completed'
              ? persistedActionMap.get(action.id)?.status
              : action.status,
          source: action.source ?? persistedActionMap.get(action.id)?.source,
        },
        viewedActionIds
      )
    )
    .filter((action): action is NextAction => Boolean(action));

  return normalizeActionsState({
    items,
    viewedActionIds,
    lastUpdatedAt: normalizedActions.lastUpdatedAt,
  });
};

const resolveScoreEventsState = (
  state: Pick<MvpState, 'profile' | 'analysis' | 'actions' | 'scoreEvents'>
): ScoreEvent[] => {
  const invoiceFingerprints = new Set(
    [
      state.analysis.latestInvoice?.fingerprint,
      ...state.analysis.invoiceHistory.map((invoice) => invoice.fingerprint),
    ].filter((fingerprint): fingerprint is string => Boolean(fingerprint))
  );
  const viewedActionIds = new Set(state.actions.viewedActionIds);

  return normalizeScoreEvents(state.scoreEvents).filter((event) => {
    const subject = getScoreEventSubject(event);

    if (!subject) {
      return false;
    }

    if (event.type === 'profile_completed') {
      return isProfileComplete(state.profile);
    }

    if (event.type === 'invoice_uploaded') {
      return invoiceFingerprints.has(subject);
    }

    if (event.type === 'analysis_completed') {
      return Boolean(state.analysis.summary) && invoiceFingerprints.has(subject);
    }

    if (event.type === 'action_viewed') {
      return viewedActionIds.has(subject);
    }

    return false;
  });
};

export const resolveFullJourneyState = (state: MvpState): MvpState => {
  const profile = normalizeProfile(state.profile);
  const mascot = normalizeMascot(state.mascot);
  const analysis = normalizeAnalysisState(state.analysis);
  const actions = resolveActionsState({
    profile,
    analysis,
    actions: state.actions,
  });
  const scoreEvents = resolveScoreEventsState({
    profile,
    analysis,
    actions,
    scoreEvents: state.scoreEvents,
  });
  const lastActiveAt = typeof state.lastActiveAt === 'string' ? state.lastActiveAt : undefined;

  return {
    ...DEFAULT_MVP_STATE,
    ...state,
    profile,
    mascot,
    analysis,
    scoreEvents,
    actions,
    lastActiveAt,
    journeyStage: resolveJourneyStage({
      profile,
      analysis,
      lastActiveAt,
    }),
  };
};

const buildScoreExplanationEvent = (event: ScoreEvent): ScoreExplanationEvent => {
  const eventExplanation = SCORE_EVENT_EXPLANATION[event.type];

  return {
    id: event.id,
    type: event.type,
    label: event.label,
    points: getScoreEventPoints(event.type),
    occurredAt: event.occurredAt,
    reason: eventExplanation.reason,
    subject: getScoreEventSubject(event) ?? undefined,
  };
};

const buildScoreExplanationSubtotals = (
  events: ScoreExplanationEvent[]
): ScoreExplanationSubtotal[] => {
  const subtotals = new Map<ScoreEventType, ScoreExplanationSubtotal>();

  events.forEach((event) => {
    const currentSubtotal = subtotals.get(event.type);

    if (currentSubtotal) {
      currentSubtotal.points += event.points;
      currentSubtotal.count += 1;
      return;
    }

    subtotals.set(event.type, {
      type: event.type,
      label: SCORE_EVENT_EXPLANATION[event.type].label,
      points: event.points,
      count: 1,
    });
  });

  return Array.from(subtotals.values());
};

const buildScoreAchievements = (events: ScoreExplanationEvent[]) =>
  buildScoreExplanationSubtotals(events).map((subtotal) =>
    subtotal.count === 1
      ? `${subtotal.label}: ${subtotal.points} pontos`
      : `${subtotal.label}: ${subtotal.points} pontos em ${subtotal.count} eventos`
  );

const getFirstUnviewedAction = (state: MvpState) =>
  state.actions.items.find((action) => !state.actions.viewedActionIds.includes(action.id));

const buildScoreNextGain = (state: MvpState): ScoreExplanationNextGain | undefined => {
  if (state.journeyStage === 'onboarding') {
    return {
      title: 'Completar o perfil',
      description: 'Finalize o contexto minimo para liberar uma analise mais justa.',
      reason: 'O proximo ganho claro e o evento de perfil completo.',
      potentialPoints: getScoreEventPoints('profile_completed'),
      relatedActionId: state.actions.items[0]?.id,
    };
  }

  if (state.journeyStage === 'before-upload') {
    return {
      title: 'Enviar a primeira fatura',
      description: 'Use a fatura mais recente para gerar envio e analise da jornada.',
      reason: 'O envio da fatura pode gerar os eventos de fatura enviada e analise concluida.',
      potentialPoints:
        getScoreEventPoints('invoice_uploaded') + getScoreEventPoints('analysis_completed'),
      relatedActionId: state.actions.items[0]?.id,
    };
  }

  if (state.journeyStage === 'invoice-uploaded') {
    return {
      title: 'Continuar apos a analise',
      description: 'Revise o resumo assim que a analise da fatura estiver pronta.',
      reason: 'A proxima evolucao esperada e concluir a analise da fatura enviada.',
      potentialPoints: getScoreEventPoints('analysis_completed'),
      relatedActionId: state.actions.items[0]?.id,
    };
  }

  const nextAction = getFirstUnviewedAction(state);

  if (nextAction) {
    return {
      title: nextAction.title,
      description: nextAction.description,
      reason: 'A proxima evolucao vem de revisar uma acao sugerida ainda nao vista.',
      potentialPoints: getScoreEventPoints('action_viewed'),
      relatedActionId: nextAction.id,
    };
  }

  return {
    title: 'Voltar com uma nova fatura',
    description: 'Traga a proxima conta de luz para comparar a evolucao com o ciclo atual.',
    reason: 'Com as acoes atuais ja revisadas, o proximo ganho claro vem de um novo ciclo de fatura.',
    potentialPoints:
      getScoreEventPoints('invoice_uploaded') + getScoreEventPoints('analysis_completed'),
  };
};

export const getScoreExplanation = (state: MvpState): ScoreExplanation => {
  const resolvedState = resolveFullJourneyState(state);
  const scoreState = getScoreState(resolvedState.scoreEvents);
  const events = resolvedState.scoreEvents.map(buildScoreExplanationEvent);
  const achievements = buildScoreAchievements(events);

  return {
    score: scoreState.score,
    level: scoreState.level,
    nextLevelScore: scoreState.nextLevelScore,
    progressToNextLevel: scoreState.progressToNextLevel,
    journeyStage: resolvedState.journeyStage,
    events,
    subtotals: buildScoreExplanationSubtotals(events),
    achievements,
    summary:
      events.length > 0
        ? `Score explicado por ${events.length} evento(s) valido(s) da jornada.`
        : 'O score ainda nao tem eventos validos contabilizados.',
    nextGain: buildScoreNextGain(resolvedState),
  };
};

export const normalizeState = (
  state?: Partial<MvpState>,
  legacyState?: LegacyStoredJourneyState
): MvpState => {
  const analysis = normalizeAnalysisState(
    state?.analysis,
    legacyState?.latestInvoice,
    legacyState?.latestAnalysis
  );
  const actions = normalizeActionsState(
    state?.actions,
    legacyState?.nextActions,
    legacyState?.viewedActionIds
  );
  const normalizedState: MvpState = {
    ...DEFAULT_MVP_STATE,
    ...state,
    profile: normalizeProfile(state?.profile ?? legacyState?.profile),
    mascot: normalizeMascot(state?.mascot ?? legacyState?.mascotCustomization),
    analysis,
    scoreEvents: normalizeScoreEvents(
      Array.isArray(state?.scoreEvents)
        ? state.scoreEvents
        : Array.isArray(legacyState?.scoreEvents)
          ? legacyState.scoreEvents
          : DEFAULT_MVP_STATE.scoreEvents
    ),
    actions,
    lastActiveAt:
      typeof state?.lastActiveAt === 'string'
        ? state.lastActiveAt
        : typeof legacyState?.lastActiveAt === 'string'
          ? legacyState.lastActiveAt
          : undefined,
    journeyStage: DEFAULT_MVP_STATE.journeyStage,
  };

  normalizedState.journeyStage = resolveJourneyStage(normalizedState);

  return resolveFullJourneyState(normalizedState);
};

export const updateProfile = (state: MvpState, profile: Profile): MvpState => ({
  ...state,
  profile: normalizeProfile(profile),
});

export const updateMascot = (state: MvpState, mascot: Mascot): MvpState => ({
  ...state,
  mascot: normalizeMascot(mascot),
});

export const setJourneyStage = (state: MvpState, journeyStage: JourneyStage): MvpState => ({
  ...state,
  journeyStage,
});

export const setAnalysisProcessing = (state: MvpState): MvpState => ({
  ...state,
  analysis: {
    ...state.analysis,
    status: 'processing',
  },
  journeyStage: 'invoice-uploaded',
});

export const setAnalysis = (
  state: MvpState,
  {
    latestInvoice,
    invoiceHistory,
    summary,
    status,
    completedAt = new Date().toISOString(),
  }: {
    latestInvoice?: AnalysisState['latestInvoice'];
    invoiceHistory?: InvoiceData[];
    summary: AnalysisState['summary'];
    status?: AnalysisStatus;
    completedAt?: string;
  }
): MvpState => ({
  ...state,
  analysis: normalizeAnalysisState({
    status: status ?? (latestInvoice && summary ? 'ready' : DEFAULT_ANALYSIS_STATE.status),
    latestInvoice,
    invoiceHistory: invoiceHistory ?? state.analysis.invoiceHistory,
    summary,
    lastCompletedAt: completedAt,
  }),
});

export const buildInvoiceHistory = (
  invoiceHistory: InvoiceData[],
  nextInvoice: InvoiceData
): InvoiceData[] => [
  nextInvoice,
  ...invoiceHistory.filter((invoice) => invoice.fingerprint !== nextInvoice.fingerprint),
];

export const pruneInvoiceHistory = (
  invoiceHistory: InvoiceData[],
  fingerprint: string
): InvoiceData[] => invoiceHistory.filter((invoice) => invoice.fingerprint !== fingerprint);

export const getLatestInvoiceHistoryEntry = (invoiceHistory: InvoiceData[]) => invoiceHistory[0];

export const updateActions = (
  state: MvpState,
  {
    items,
    viewedActionIds,
    updatedAt = new Date().toISOString(),
  }: {
    items?: NextAction[];
    viewedActionIds?: string[];
    updatedAt?: string;
  }
): MvpState => ({
  ...state,
  actions: normalizeActionsState({
    items: items ?? state.actions.items,
    viewedActionIds: viewedActionIds ?? state.actions.viewedActionIds,
    lastUpdatedAt: updatedAt,
  }),
});

export const addScoreEvent = (state: MvpState, nextEvent: ScoreEvent): MvpState => {
  const currentScoreEvents = normalizeScoreEvents(state.scoreEvents);
  const scoreEvents = normalizeScoreEvents([nextEvent, ...currentScoreEvents]);

  if (
    scoreEvents.length === currentScoreEvents.length &&
    scoreEvents.every((event, index) => event.id === currentScoreEvents[index]?.id)
  ) {
    return state;
  }

  return {
    ...state,
    scoreEvents,
  };
};

export const markActionViewed = (state: MvpState, actionId: string): MvpState => {
  if (state.actions.viewedActionIds.includes(actionId)) {
    return state;
  }

  const viewedActionIds = [...state.actions.viewedActionIds, actionId];
  const items = state.actions.items.map((action) =>
    action.id === actionId ? { ...action, status: 'viewed' } : action
  );

  return updateActions(state, {
    items,
    viewedActionIds,
  });
};
