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
} from '@/types/mvp';

const RETURN_VISIT_MS = 1000 * 60 * 30;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

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
  const summary = analysis?.summary ?? legacySummary;
  const status =
    analysis?.status ??
    (latestInvoice || summary ? 'ready' : DEFAULT_ANALYSIS_STATE.status);

  return {
    status,
    latestInvoice,
    invoiceHistory,
    summary,
    lastCompletedAt:
      typeof analysis?.lastCompletedAt === 'string'
        ? analysis.lastCompletedAt
        : summary
          ? new Date().toISOString()
          : undefined,
  };
};

export const resolveJourneyStage = (
  requestedStage: JourneyStage | undefined,
  state: Pick<MvpState, 'analysis' | 'lastActiveAt'>
): JourneyStage => {
  const hasReturnableJourney =
    Boolean(state.lastActiveAt) &&
    Date.now() - new Date(state.lastActiveAt as string).getTime() > RETURN_VISIT_MS &&
    (Boolean(state.analysis.latestInvoice) || Boolean(state.analysis.summary));

  if (hasReturnableJourney) {
    return 'return-visit';
  }

  return requestedStage ?? DEFAULT_MVP_STATE.journeyStage;
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
    scoreEvents: Array.isArray(state?.scoreEvents)
      ? state.scoreEvents
      : Array.isArray(legacyState?.scoreEvents)
        ? legacyState.scoreEvents
        : DEFAULT_MVP_STATE.scoreEvents,
    actions,
    lastActiveAt:
      typeof state?.lastActiveAt === 'string'
        ? state.lastActiveAt
        : typeof legacyState?.lastActiveAt === 'string'
          ? legacyState.lastActiveAt
          : undefined,
    journeyStage: DEFAULT_MVP_STATE.journeyStage,
  };

  normalizedState.journeyStage = resolveJourneyStage(
    state?.journeyStage ?? legacyState?.journeyStage,
    normalizedState
  );

  return normalizedState;
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
  if (state.scoreEvents.some((event) => event.id === nextEvent.id)) {
    return state;
  }

  return {
    ...state,
    scoreEvents: [nextEvent, ...state.scoreEvents],
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
