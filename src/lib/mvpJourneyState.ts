import {
  ActionInteractiveQuestion,
  AnalysisState,
  AnalysisStatus,
  ActionResultLink,
  EnergyBehaviorLaundryFrequency,
  EnergyKnowledgeId,
  EnergyBehaviorProfile,
  EnergyBehaviorUsagePeriod,
  InvoiceComparisonBasis,
  InvoiceComparison,
  InvoiceActionSnapshot,
  InvoiceComparisonTrend,
  InvoiceData,
  JourneyStage,
  Mascot,
  MascotContextQuestion,
  MascotContextQuestionId,
  MascotContextQuestionValue,
  MvpState,
  NextCycleGuidance,
  NextAction,
  NextActionsState,
  Profile,
  ScoreEvent,
  ScoreEventType,
  ScoreExplanation,
  ScoreExplanationEvent,
  ScoreExplanationNextGain,
  ScoreExplanationSubtotal,
  UserContextState,
} from '@/types/mvp';
import {
  buildAnalysisSummary,
  buildNextActions,
  getScoreEventPoints,
  getScoreEventSubject,
  getScoreState,
  isProfileComplete,
  normalizeScoreEvents,
} from '@/lib/mvpCoreFlow';
import { normalizeKnowledgeState } from '@/lib/energyKnowledge';
import { getInvoiceFlowSnapshot, logInvoiceFlow } from '@/lib/invoiceFlowDebug';

const RETURN_VISIT_MS = 1000 * 60 * 30;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const clampConfidence = (value: number) => Math.min(Math.max(value, 0), 1);

const createEmptyParser = (): InvoiceData['parser'] => ({
  rawTextAvailable: false,
  textSource: 'unsupported',
  normalizedText: '',
  fields: {
    providerName: { confidence: 'missing' },
    consumerUnit: { confidence: 'missing' },
    referenceMonth: { confidence: 'missing' },
    issueDate: { confidence: 'missing' },
    dueDate: { confidence: 'missing' },
    totalValue: { confidence: 'missing' },
    consumptionKwh: { confidence: 'missing' },
    daysBilled: { confidence: 'missing' },
    previousReading: { confidence: 'missing' },
    currentReading: { confidence: 'missing' },
    meterConstant: { confidence: 'missing' },
    tariffFlag: { confidence: 'missing' },
    teValue: { confidence: 'missing' },
    tusdValue: { confidence: 'missing' },
    publicLightingFee: { confidence: 'missing' },
    taxesTotal: { confidence: 'missing' },
  },
});

const normalizeInvoiceData = (invoice?: Partial<InvoiceData>): InvoiceData | null => {
  if (!invoice?.fingerprint || !invoice.fileName) {
    return null;
  }

  const parser =
    typeof invoice.parser?.rawTextAvailable === 'boolean' && invoice.parser.fields
      ? invoice.parser
      : undefined;
  const parserMonth = parser?.fields.referenceMonth.value;
  const parserConsumption = parser?.fields.consumptionKwh.value;
  const parserTotalValue = parser?.fields.totalValue.value;
  const resolvedMonth =
    typeof invoice.month === 'string' && invoice.month.trim()
      ? invoice.month
      : typeof parserMonth === 'string' && parserMonth.trim()
        ? parserMonth
        : 'Referencia nao identificada';
  const resolvedConsumption = isFiniteNumber(invoice.consumption)
    ? invoice.consumption
    : isFiniteNumber(parserConsumption)
      ? parserConsumption
      : undefined;
  const resolvedTotalValue = isFiniteNumber(invoice.totalValue)
    ? invoice.totalValue
    : isFiniteNumber(parserTotalValue)
      ? parserTotalValue
      : undefined;

  if (
    parser &&
    (resolvedMonth !== invoice.month ||
      resolvedConsumption !== invoice.consumption ||
      resolvedTotalValue !== invoice.totalValue)
  ) {
    logInvoiceFlow('normalize-invoice-data-hydrated-from-parser', {
      before: getInvoiceFlowSnapshot(invoice),
      after: {
        ...getInvoiceFlowSnapshot(invoice),
        month: resolvedMonth,
        consumption: resolvedConsumption,
        totalValue: resolvedTotalValue,
      },
    });
  }

  return {
    fingerprint: invoice.fingerprint,
    fileName: invoice.fileName,
    fileType: typeof invoice.fileType === 'string' ? invoice.fileType : 'arquivo',
    fileSize: isFiniteNumber(invoice.fileSize) ? invoice.fileSize : 0,
    consumption: resolvedConsumption,
    totalValue: resolvedTotalValue,
    taxPercentage:
      parser && isFiniteNumber(invoice.taxPercentage) ? invoice.taxPercentage : undefined,
    peakHours: parser && typeof invoice.peakHours === 'string' ? invoice.peakHours : undefined,
    month: resolvedMonth,
    parser: parser ?? createEmptyParser(),
    uploadedAt: typeof invoice.uploadedAt === 'string' ? invoice.uploadedAt : undefined,
    actionSnapshots: Array.isArray(invoice.actionSnapshots) ? invoice.actionSnapshots : undefined,
  };
};

const normalizeActionStatus = (
  status: unknown,
  actionId: string,
  viewedActionIds: string[]
): NextAction['status'] => {
  if (status === 'completed') {
    return 'completed';
  }

  if (status === 'in_progress' || status === 'started') {
    return 'in_progress';
  }

  if (status === 'viewed') {
    return 'viewed';
  }

  return viewedActionIds.includes(actionId) ? 'viewed' : 'new';
};

const SCORE_EVENT_EXPLANATION: Record<ScoreEventType, { label: string; reason: string }> = {
  profile_completed: {
    label: 'Perfil completo',
    reason: 'Conta porque o perfil tem contexto suficiente para personalizar a jornada.',
  },
  invoice_uploaded: {
    label: 'Fatura enviada',
    reason: 'Conta porque uma fatura real da jornada foi enviada e ficou registrada no histórico.',
  },
  analysis_completed: {
    label: 'Análise concluída',
    reason: 'Conta porque existe uma análise pronta vinculada a uma fatura válida da jornada.',
  },
  action_viewed: {
    label: 'Ação revisada',
    reason: 'Conta porque uma próxima ação válida foi revisada pelo usuário.',
  },
};

const MASCOT_CONTEXT_QUESTIONS: Record<MascotContextQuestionId, MascotContextQuestion> = {
  usage_period: {
    id: 'usage_period',
    invite: 'Posso te fazer uma pergunta rapida pra melhorar suas dicas?',
    question: 'Seu consumo costuma ser maior em qual periodo?',
    options: [
      { value: 'morning', label: 'Manha' },
      { value: 'afternoon', label: 'Tarde' },
      { value: 'night', label: 'Noite' },
      { value: 'unknown', label: 'Nao sei' },
    ],
  },
  electric_shower: {
    id: 'electric_shower',
    invite: 'Posso entender melhor um detalhe da sua rotina?',
    question: 'Voce usa chuveiro eletrico com frequencia?',
    options: [
      { value: 'daily', label: 'Todos os dias' },
      { value: 'sometimes', label: 'As vezes' },
      { value: 'rarely', label: 'Raramente' },
      { value: 'none', label: 'Nao uso' },
    ],
  },
  primary_goal: {
    id: 'primary_goal',
    invite: 'Uma pergunta rapida ajuda a deixar o proximo ciclo mais claro.',
    question: 'Seu objetivo principal agora e?',
    options: [
      { value: 'reduce_cost', label: 'Reduzir custo' },
      { value: 'understand_consumption', label: 'Entender consumo' },
      { value: 'both', label: 'Os dois' },
    ],
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

export const DEFAULT_USER_CONTEXT_STATE: UserContextState = {
  questions: {},
};

export const DEFAULT_KNOWLEDGE_STATE = {
  learned: {},
  lastLearnedId: undefined,
} as const;

export const DEFAULT_ENERGY_BEHAVIOR_PROFILE: EnergyBehaviorProfile = {
  appliances: {},
  habits: {},
  intentions: {},
  qualification: {},
  actionMemory: {},
  confidence: {},
};

const mergeEnergyBehaviorProfile = (
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile>
): Partial<EnergyBehaviorProfile> => ({
  ...DEFAULT_ENERGY_BEHAVIOR_PROFILE,
  ...energyBehaviorProfile,
  appliances: {
    ...DEFAULT_ENERGY_BEHAVIOR_PROFILE.appliances,
    ...(energyBehaviorProfile?.appliances ?? {}),
  },
  habits: {
    ...DEFAULT_ENERGY_BEHAVIOR_PROFILE.habits,
    ...(energyBehaviorProfile?.habits ?? {}),
  },
  intentions: {
    ...DEFAULT_ENERGY_BEHAVIOR_PROFILE.intentions,
    ...(energyBehaviorProfile?.intentions ?? {}),
  },
  qualification: {
    ...DEFAULT_ENERGY_BEHAVIOR_PROFILE.qualification,
    ...(energyBehaviorProfile?.qualification ?? {}),
  },
  actionMemory: {
    ...DEFAULT_ENERGY_BEHAVIOR_PROFILE.actionMemory,
    ...(energyBehaviorProfile?.actionMemory ?? {}),
  },
  confidence: {
    ...DEFAULT_ENERGY_BEHAVIOR_PROFILE.confidence,
    ...(energyBehaviorProfile?.confidence ?? {}),
  },
});

const VALID_USAGE_PERIODS: EnergyBehaviorUsagePeriod[] = [
  'pico',
  'fora_pico',
  'misto',
  'nao_informado',
];

const VALID_LAUNDRY_FREQUENCIES: EnergyBehaviorLaundryFrequency[] = [
  'baixa',
  'media',
  'alta',
  'nao_informado',
];

const VALID_HOUSEHOLD_ROUTINE_PERIODS = ['manha', 'tarde', 'noite', 'misto', 'nao_informado'];
const VALID_PEAK_WINDOW_USAGES = ['sim', 'nao', 'as_vezes', 'nao_informado'];
const VALID_HOUSEHOLD_PRESENCES = ['sim', 'nao', 'parcial', 'nao_informado'];
const VALID_CLIMATE_USAGES = ['sim', 'nao', 'sazonal', 'nao_informado'];
const VALID_THERMAL_SENSITIVITIES = ['sim', 'nao', 'nao_sei', 'nao_informado'];
const VALID_INTEREST_LEVELS = ['sim', 'talvez', 'nao', 'nao_informado'];
const VALID_PRIMARY_OBJECTIVES = ['economia', 'conforto', 'sustentabilidade', 'nao_informado'];

const normalizeActionQuestionOptions = (
  options: ActionInteractiveQuestion['options']
) =>
  options.filter(
    (option) =>
      Boolean(option) &&
      typeof option.label === 'string' &&
      option.label.trim() &&
      typeof option.value === 'string' &&
      option.value.trim()
  );

const normalizeInteractiveQuestions = (
  questions?: NextAction['interactiveQuestions']
): NextAction['interactiveQuestions'] => {
  if (!Array.isArray(questions)) {
    return undefined;
  }

  const normalizedQuestions = questions
    .filter(
      (question) =>
        Boolean(question) &&
        typeof question.id === 'string' &&
        typeof question.prompt === 'string' &&
        question.prompt.trim()
    )
    .map((question) => ({
      id: question.id,
      prompt: question.prompt,
      helperText:
        typeof question.helperText === 'string' && question.helperText.trim()
          ? question.helperText
          : undefined,
      options: normalizeActionQuestionOptions(question.options),
    }))
    .filter((question) => question.options.length > 0);

  return normalizedQuestions.length > 0 ? normalizedQuestions : undefined;
};

const normalizeConfidenceRatio = (answeredCount: number, totalCount: number) => {
  if (answeredCount <= 0 || totalCount <= 0) {
    return undefined;
  }

  return clampConfidence(Number((answeredCount / totalCount).toFixed(2)));
};

export const normalizeEnergyBehaviorProfile = (
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile>
): EnergyBehaviorProfile => {
  const mergedEnergyBehaviorProfile = mergeEnergyBehaviorProfile(energyBehaviorProfile);
  const appliances = mergedEnergyBehaviorProfile.appliances ?? {};
  const habits = mergedEnergyBehaviorProfile.habits ?? {};
  const intentions = mergedEnergyBehaviorProfile.intentions ?? {};
  const qualification = mergedEnergyBehaviorProfile.qualification ?? {};
  const answeredActionPrompts = mergedEnergyBehaviorProfile.actionMemory?.answeredActionPrompts ?? {};
  const startedActionTitles = mergedEnergyBehaviorProfile.actionMemory?.startedActionTitles ?? [];
  const normalizedShowers =
    isFiniteNumber(appliances.showers) && appliances.showers >= 0
      ? Math.min(Math.round(appliances.showers), 99)
      : undefined;
  const normalizedDominantUsagePeriod =
    typeof habits.dominantUsagePeriod === 'string' &&
    VALID_USAGE_PERIODS.includes(habits.dominantUsagePeriod)
      ? habits.dominantUsagePeriod
      : undefined;
  const normalizedLaundryFrequency =
    typeof habits.laundryFrequency === 'string' &&
    VALID_LAUNDRY_FREQUENCIES.includes(habits.laundryFrequency)
      ? habits.laundryFrequency
      : undefined;
  const normalizedDominantUsageRoutine =
    typeof habits.dominantUsageRoutine === 'string' &&
    VALID_HOUSEHOLD_ROUTINE_PERIODS.includes(habits.dominantUsageRoutine)
      ? habits.dominantUsageRoutine
      : undefined;
  const normalizedPeakWindowIntensity =
    typeof habits.peakWindowIntensity === 'string' &&
    VALID_PEAK_WINDOW_USAGES.includes(habits.peakWindowIntensity)
      ? habits.peakWindowIntensity
      : undefined;
  const normalizedHouseholdPeakPresence =
    typeof habits.householdPeakPresence === 'string' &&
    VALID_HOUSEHOLD_PRESENCES.includes(habits.householdPeakPresence)
      ? habits.householdPeakPresence
      : undefined;
  const normalizedClimateUsageIntensity =
    typeof habits.climateUsageIntensity === 'string' &&
    VALID_CLIMATE_USAGES.includes(habits.climateUsageIntensity)
      ? habits.climateUsageIntensity
      : undefined;
  const normalizedThermalSensitivity =
    typeof habits.thermalSensitivity === 'string' &&
    VALID_THERMAL_SENSITIVITIES.includes(habits.thermalSensitivity)
      ? habits.thermalSensitivity
      : undefined;
  const normalizedThermalComfortInterest =
    typeof intentions.thermalComfortInterest === 'string' &&
    VALID_INTEREST_LEVELS.includes(intentions.thermalComfortInterest)
      ? intentions.thermalComfortInterest
      : undefined;
  const normalizedSolarAnalysisInterest =
    typeof intentions.solarAnalysisInterest === 'string' &&
    VALID_INTEREST_LEVELS.includes(intentions.solarAnalysisInterest)
      ? intentions.solarAnalysisInterest
      : undefined;
  const normalizedConsultantInterest =
    typeof intentions.consultantInterest === 'string' &&
    VALID_INTEREST_LEVELS.includes(intentions.consultantInterest)
      ? intentions.consultantInterest
      : undefined;
  const normalizedPrimaryObjective =
    typeof intentions.primaryObjective === 'string' &&
    VALID_PRIMARY_OBJECTIVES.includes(intentions.primaryObjective)
      ? intentions.primaryObjective
      : undefined;
  const normalizedAnsweredActionPrompts = Object.fromEntries(
    Object.entries(answeredActionPrompts).filter(
      ([promptId, entry]) =>
        typeof promptId === 'string' &&
        promptId.trim() &&
        typeof entry?.answer === 'string' &&
        entry.answer.trim() &&
        typeof entry.answeredAt === 'string' &&
        !Number.isNaN(new Date(entry.answeredAt).getTime())
    )
  );
  const normalizedStartedActionTitles = Array.from(
    new Set(
      startedActionTitles.filter(
        (title): title is string => typeof title === 'string' && title.trim().length > 0
      )
    )
  );
  const applianceAnsweredCount = [
    normalizedShowers !== undefined,
    isBoolean(appliances.hasElectricShower),
    isBoolean(appliances.hasAirConditioning),
    isBoolean(appliances.hasExtraFridge),
  ].filter(Boolean).length;
  const habitAnsweredCount = [
    normalizedDominantUsagePeriod !== undefined,
    isBoolean(habits.usesHeavyLoadsAtNight),
    normalizedLaundryFrequency !== undefined,
    normalizedDominantUsageRoutine !== undefined,
    normalizedPeakWindowIntensity !== undefined,
    normalizedHouseholdPeakPresence !== undefined,
    normalizedClimateUsageIntensity !== undefined,
    normalizedThermalSensitivity !== undefined,
  ].filter(Boolean).length;
  const leadAnsweredCount = [
    normalizedThermalComfortInterest !== undefined,
    normalizedSolarAnalysisInterest !== undefined,
    normalizedConsultantInterest !== undefined,
    normalizedPrimaryObjective !== undefined,
  ].filter(Boolean).length;
  const answeredDiagnosisCount = Object.keys(normalizedAnsweredActionPrompts).length;
  const diagnosisLevel =
    answeredDiagnosisCount >= 15 ? 16 : answeredDiagnosisCount > 0 ? answeredDiagnosisCount + 1 : 1;
  const qualifiedLead =
    normalizedSolarAnalysisInterest === 'sim' ||
    normalizedConsultantInterest === 'sim' ||
    normalizedPrimaryObjective === 'sustentabilidade';

  return {
    appliances: {
      showers: normalizedShowers,
      hasElectricShower: isBoolean(appliances.hasElectricShower)
        ? appliances.hasElectricShower
        : undefined,
      hasAirConditioning: isBoolean(appliances.hasAirConditioning)
        ? appliances.hasAirConditioning
        : undefined,
      hasExtraFridge: isBoolean(appliances.hasExtraFridge)
        ? appliances.hasExtraFridge
        : undefined,
    },
    habits: {
      dominantUsagePeriod: normalizedDominantUsagePeriod,
      usesHeavyLoadsAtNight: isBoolean(habits.usesHeavyLoadsAtNight)
        ? habits.usesHeavyLoadsAtNight
        : undefined,
      laundryFrequency: normalizedLaundryFrequency,
      dominantUsageRoutine: normalizedDominantUsageRoutine,
      peakWindowIntensity: normalizedPeakWindowIntensity,
      householdPeakPresence: normalizedHouseholdPeakPresence,
      climateUsageIntensity: normalizedClimateUsageIntensity,
      thermalSensitivity: normalizedThermalSensitivity,
    },
    intentions: {
      thermalComfortInterest: normalizedThermalComfortInterest,
      solarAnalysisInterest: normalizedSolarAnalysisInterest,
      consultantInterest: normalizedConsultantInterest,
      primaryObjective: normalizedPrimaryObjective,
    },
    qualification: {
      diagnosisLevel:
        isFiniteNumber(qualification.diagnosisLevel) && qualification.diagnosisLevel >= 1
          ? Math.min(Math.round(qualification.diagnosisLevel), 99)
          : diagnosisLevel,
      answeredDiagnosisCount:
        isFiniteNumber(qualification.answeredDiagnosisCount) && qualification.answeredDiagnosisCount >= 0
          ? Math.min(Math.round(qualification.answeredDiagnosisCount), 99)
          : answeredDiagnosisCount,
      qualifiedLead: isBoolean(qualification.qualifiedLead)
        ? qualification.qualifiedLead
        : qualifiedLead,
    },
    actionMemory: {
      startedActionTitles:
        normalizedStartedActionTitles.length > 0 ? normalizedStartedActionTitles : undefined,
      answeredActionPrompts:
        Object.keys(normalizedAnsweredActionPrompts).length > 0
          ? normalizedAnsweredActionPrompts
          : undefined,
    },
    confidence: {
      applianceConfidence: isFiniteNumber(mergedEnergyBehaviorProfile.confidence?.applianceConfidence)
        ? clampConfidence(mergedEnergyBehaviorProfile.confidence.applianceConfidence)
        : normalizeConfidenceRatio(applianceAnsweredCount, 4),
      habitConfidence: isFiniteNumber(mergedEnergyBehaviorProfile.confidence?.habitConfidence)
        ? clampConfidence(mergedEnergyBehaviorProfile.confidence.habitConfidence)
        : normalizeConfidenceRatio(habitAnsweredCount, 8),
      leadConfidence: isFiniteNumber(mergedEnergyBehaviorProfile.confidence?.leadConfidence)
        ? clampConfidence(mergedEnergyBehaviorProfile.confidence.leadConfidence)
        : normalizeConfidenceRatio(leadAnsweredCount, 4),
    },
    updatedAt:
      typeof mergedEnergyBehaviorProfile.updatedAt === 'string' &&
      !Number.isNaN(new Date(mergedEnergyBehaviorProfile.updatedAt).getTime())
        ? mergedEnergyBehaviorProfile.updatedAt
        : undefined,
  };
};

export const DEFAULT_MVP_STATE: MvpState = {
  profile: DEFAULT_PROFILE,
  mascot: DEFAULT_MASCOT,
  userContext: DEFAULT_USER_CONTEXT_STATE,
  knowledge: DEFAULT_KNOWLEDGE_STATE,
  energyBehaviorProfile: DEFAULT_ENERGY_BEHAVIOR_PROFILE,
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

const getMascotQuestionOption = (
  questionId: MascotContextQuestionId,
  value: MascotContextQuestionValue
) => MASCOT_CONTEXT_QUESTIONS[questionId].options.find((option) => option.value === value);

export const normalizeUserContext = (
  userContext?: Partial<UserContextState>
): UserContextState => {
  const rawQuestions = userContext?.questions ?? {};
  const questions: UserContextState['questions'] = {};

  (Object.keys(MASCOT_CONTEXT_QUESTIONS) as MascotContextQuestionId[]).forEach((questionId) => {
    const answer = rawQuestions[questionId];

    if (!answer || (answer.status !== 'answered' && answer.status !== 'ignored')) {
      return;
    }

    const updatedAt = typeof answer.updatedAt === 'string' ? answer.updatedAt : undefined;

    if (answer.status === 'ignored') {
      questions[questionId] = {
        status: 'ignored',
        updatedAt: updatedAt ?? '1970-01-01T00:00:00.000Z',
      };
      return;
    }

    const option =
      typeof answer.value === 'string'
        ? getMascotQuestionOption(questionId, answer.value)
        : undefined;

    if (!option) {
      return;
    }

    questions[questionId] = {
      status: 'answered',
      value: option.value,
      label: option.label,
      updatedAt: updatedAt ?? '1970-01-01T00:00:00.000Z',
    };
  });

  return { questions };
};

const normalizeAction = (
  action: Partial<NextAction> | undefined,
  viewedActionIds: string[]
): NextAction | null => {
  if (!action?.id || !action.title || !action.description || !action.value || !action.priority) {
    return null;
  }

  const status = normalizeActionStatus(action.status, action.id, viewedActionIds);
  return {
    id: action.id,
    title: action.title,
    description: action.description,
    value: action.value,
    context: typeof action.context === 'string' ? action.context : undefined,
    suggestion: typeof action.suggestion === 'string' ? action.suggestion : undefined,
    ctaLabel: typeof action.ctaLabel === 'string' ? action.ctaLabel : undefined,
    evidence: typeof action.evidence === 'string' ? action.evidence : undefined,
    reason: typeof action.reason === 'string' ? action.reason : undefined,
    impact: typeof action.impact === 'string' ? action.impact : undefined,
    validation: typeof action.validation === 'string' ? action.validation : undefined,
    interactiveQuestions: normalizeInteractiveQuestions(action.interactiveQuestions),
    usedDataPoints: isStringArray(action.usedDataPoints) ? action.usedDataPoints : undefined,
    knownBehaviorSummary: isStringArray(action.knownBehaviorSummary)
      ? action.knownBehaviorSummary
      : undefined,
    answeredQuestionSummaries: isStringArray(action.answeredQuestionSummaries)
      ? action.answeredQuestionSummaries
      : undefined,
    diagnosticProgress:
      action.diagnosticProgress &&
      isFiniteNumber(action.diagnosticProgress.current) &&
      isFiniteNumber(action.diagnosticProgress.total) &&
      isFiniteNumber(action.diagnosticProgress.level)
        ? {
            current: Math.max(0, Math.round(action.diagnosticProgress.current)),
            total: Math.max(1, Math.round(action.diagnosticProgress.total)),
            level: Math.max(1, Math.round(action.diagnosticProgress.level)),
            completed: action.diagnosticProgress.completed === true,
          }
        : undefined,
    pendingAnswer:
      action.pendingAnswer &&
      typeof action.pendingAnswer.questionId === 'string' &&
      typeof action.pendingAnswer.answer === 'string' &&
      action.pendingAnswer.answer.trim()
        ? {
            questionId: action.pendingAnswer.questionId,
            answer: action.pendingAnswer.answer,
            answeredAt:
              typeof action.pendingAnswer.answeredAt === 'string'
                ? action.pendingAnswer.answeredAt
                : undefined,
            persistOnly: action.pendingAnswer.persistOnly === true,
          }
        : undefined,
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
  legacySummary?: AnalysisState['summary'],
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile>
): AnalysisState => {
  const requestedStatus = analysis?.status;
  const latestInvoice = analysis?.latestInvoice ?? legacyLatestInvoice;
  const rawInvoiceHistory = Array.isArray(analysis?.invoiceHistory)
    ? analysis.invoiceHistory
    : latestInvoice
      ? [latestInvoice]
      : DEFAULT_ANALYSIS_STATE.invoiceHistory;
  const invoiceHistory = rawInvoiceHistory
    .map((invoice) => normalizeInvoiceData(invoice))
    .filter((invoice): invoice is InvoiceData => Boolean(invoice));
  const resolvedLatestInvoice = normalizeInvoiceData(latestInvoice) ?? invoiceHistory[0];
  const summary =
    analysis?.summary ??
    legacySummary ??
    (requestedStatus === 'processing' || !resolvedLatestInvoice
      ? undefined
      : buildAnalysisSummary(
          resolvedLatestInvoice,
          undefined,
          invoiceHistory,
          energyBehaviorProfile
        ));
  const status =
    requestedStatus ??
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
  state: Pick<MvpState, 'profile' | 'analysis' | 'actions' | 'userContext' | 'energyBehaviorProfile'>
): NextActionsState => {
  const normalizedActions = normalizeActionsState(state.actions);
  const nextItems = buildNextActions(
    state.analysis.latestInvoice,
    state.analysis.summary,
    state.profile,
    state.userContext,
    state.energyBehaviorProfile
  );
  const nextItemIds = new Set(nextItems.map((action) => action.id));
  const persistedActionMap = new Map(
    normalizedActions.items.map((action) => [action.id, action] as const)
  );
  const viewedActionIds = Array.from(
    new Set([
      ...normalizedActions.viewedActionIds,
      ...normalizedActions.items
        .filter((action) => action.status && action.status !== 'new')
        .map((action) => action.id),
    ])
  ).filter((actionId) => nextItemIds.has(actionId));

  const items = nextItems
    .map((action) =>
      normalizeAction(
        {
          ...action,
          status: persistedActionMap.get(action.id)?.status ?? action.status,
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
  const userContext = normalizeUserContext(state.userContext);
  const energyBehaviorProfile = normalizeEnergyBehaviorProfile(state.energyBehaviorProfile);
  const analysis = normalizeAnalysisState(
    state.analysis,
    undefined,
    undefined,
    energyBehaviorProfile
  );
  const actions = resolveActionsState({
    profile,
    analysis,
    actions: state.actions,
    userContext,
    energyBehaviorProfile,
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
    userContext,
    energyBehaviorProfile,
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
      description: 'Finalize o contexto mínimo para liberar uma análise mais justa.',
      reason: 'O próximo ganho claro é o evento de perfil completo.',
      potentialPoints: getScoreEventPoints('profile_completed'),
      relatedActionId: state.actions.items[0]?.id,
    };
  }

  if (state.journeyStage === 'before-upload') {
    return {
      title: 'Adicionar fatura ao histórico',
      description: 'Adicione uma fatura para iniciar a leitura da jornada.',
      reason: 'A entrada de uma fatura pode gerar os eventos de fatura enviada e análise concluída.',
      potentialPoints:
        getScoreEventPoints('invoice_uploaded') + getScoreEventPoints('analysis_completed'),
      relatedActionId: state.actions.items[0]?.id,
    };
  }

  if (state.journeyStage === 'invoice-uploaded') {
    return {
      title: 'Continuar após a análise',
      description: 'Revise o resumo assim que a análise da fatura estiver pronta.',
      reason: 'A próxima evolução esperada é concluir a análise da fatura enviada.',
      potentialPoints: getScoreEventPoints('analysis_completed'),
      relatedActionId: state.actions.items[0]?.id,
    };
  }

  const nextAction = getFirstUnviewedAction(state);

  if (nextAction) {
    return {
      title: nextAction.title,
      description: nextAction.description,
      reason: 'A próxima evolução vem de revisar uma ação sugerida ainda não vista.',
      potentialPoints: getScoreEventPoints('action_viewed'),
      relatedActionId: nextAction.id,
    };
  }

  return {
    title: 'Adicionar nova fatura ao histórico',
    description: 'Adicione a próxima conta de luz ao histórico para comparar a evolução com o ciclo atual.',
    reason: 'Com as ações atuais já revisadas, o próximo ganho claro vem de continuar o histórico em um novo ciclo de fatura.',
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
        : 'O score ainda não tem eventos válidos contabilizados.',
    nextGain: buildScoreNextGain(resolvedState),
  };
};

export const normalizeState = (
  state?: Partial<MvpState>,
  legacyState?: LegacyStoredJourneyState
): MvpState => {
  const energyBehaviorProfile = normalizeEnergyBehaviorProfile(state?.energyBehaviorProfile);
  const analysis = normalizeAnalysisState(
    state?.analysis,
    legacyState?.latestInvoice,
    legacyState?.latestAnalysis,
    energyBehaviorProfile
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
    userContext: normalizeUserContext(state?.userContext),
    knowledge: normalizeKnowledgeState(state?.knowledge),
    energyBehaviorProfile,
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

export const markKnowledgeLearned = (
  state: MvpState,
  knowledgeId: EnergyKnowledgeId
): MvpState => {
  if (state.knowledge.learned[knowledgeId] === true) {
    return state;
  }

  return {
    ...state,
    knowledge: normalizeKnowledgeState({
      learned: {
        ...state.knowledge.learned,
        [knowledgeId]: true,
      },
      lastLearnedId: knowledgeId,
    }),
  };
};

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
  }, undefined, undefined, state.energyBehaviorProfile),
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

export const getCurrentJourneyInvoice = (
  invoiceHistory: InvoiceData[],
  latestInvoice?: InvoiceData
) => invoiceHistory[0] ?? latestInvoice;

export const isCurrentJourneyInvoice = (
  invoiceHistory: InvoiceData[],
  invoice?: InvoiceData,
  latestInvoice?: InvoiceData
) => {
  if (!invoice) {
    return true;
  }

  const currentJourneyInvoice = getCurrentJourneyInvoice(invoiceHistory, latestInvoice);
  if (!currentJourneyInvoice) {
    return false;
  }

  return currentJourneyInvoice.fingerprint === invoice.fingerprint;
};

export const getLatestInvoiceHistoryEntry = (invoiceHistory: InvoiceData[]) =>
  getCurrentJourneyInvoice(invoiceHistory);

const PT_BR_MONTH_INDEX: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
};

const normalizeDateText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getInvoiceCompetenceTime = (invoice: InvoiceData) => {
  const normalizedMonth = normalizeDateText(invoice.month);
  const numericMatch = normalizedMonth.match(/\b(0[1-9]|1[0-2])\/(\d{4})\b/);

  if (numericMatch) {
    return Date.UTC(Number(numericMatch[2]), Number(numericMatch[1]) - 1, 1);
  }

  const monthKey = Object.keys(PT_BR_MONTH_INDEX).find((month) =>
    normalizedMonth.includes(month)
  );
  const year = Number(normalizedMonth.match(/\b\d{4}\b/)?.[0]);

  if (!monthKey || !Number.isFinite(year)) {
    return undefined;
  }

  return Date.UTC(year, PT_BR_MONTH_INDEX[monthKey], 1);
};

const getInvoiceUploadTime = (invoice: InvoiceData) => {
  if (!invoice.uploadedAt) {
    return undefined;
  }

  const time = new Date(invoice.uploadedAt).getTime();
  return Number.isNaN(time) ? undefined : time;
};

const getInvoiceReference = (invoice: InvoiceData) => {
  const competenceTime = getInvoiceCompetenceTime(invoice);

  if (competenceTime !== undefined) {
    return {
      basis: 'competence' as const,
      time: competenceTime,
    };
  }

  const uploadTime = getInvoiceUploadTime(invoice);

  if (uploadTime !== undefined) {
    return {
      basis: 'upload' as const,
      time: uploadTime,
    };
  }

  return {
    basis: 'history' as const,
    time: undefined,
  };
};

const getComparisonBasis = (
  currentInvoice: InvoiceData,
  previousInvoice: InvoiceData
): InvoiceComparisonBasis => {
  const currentReference = getInvoiceReference(currentInvoice);
  const previousReference = getInvoiceReference(previousInvoice);

  if (currentReference.basis === 'competence' && previousReference.basis === 'competence') {
    return 'competence';
  }

  if (currentReference.basis === 'upload' || previousReference.basis === 'upload') {
    return 'upload';
  }

  return 'history';
};

const COMPARISON_REFERENCE_PRIORITY: Record<
  ReturnType<typeof getInvoiceReference>['basis'],
  number
> = {
  competence: 0,
  upload: 1,
  history: 2,
};

const sortInvoicesForComparison = (invoiceHistory: InvoiceData[]) =>
  [...invoiceHistory]
    .map((invoice, index) => ({
      index,
      invoice,
      reference: getInvoiceReference(invoice),
    }))
    .sort((left, right) => {
      const priorityDifference =
        COMPARISON_REFERENCE_PRIORITY[left.reference.basis] -
        COMPARISON_REFERENCE_PRIORITY[right.reference.basis];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      if (left.reference.time === undefined && right.reference.time === undefined) {
        return left.index - right.index;
      }

      if (left.reference.time === undefined) {
        return 1;
      }

      if (right.reference.time === undefined) {
        return -1;
      }

      return right.reference.time - left.reference.time;
    })
    .map(({ invoice }) => invoice);

const getMetricTrend = (
  change: number,
  percentChange: number | undefined,
  stableAbsoluteThreshold: number
): InvoiceComparisonTrend => {
  const isStableByAbsoluteChange = Math.abs(change) <= stableAbsoluteThreshold;
  const isStableByPercentage = percentChange !== undefined && Math.abs(percentChange) <= 2;

  if (isStableByAbsoluteChange || isStableByPercentage) {
    return 'stable';
  }

  return change < 0 ? 'down' : 'up';
};

const buildMetricComparison = (
  current: number,
  previous: number,
  stableAbsoluteThreshold: number
) => {
  const change = current - previous;
  const percentChange = previous > 0 ? Math.round((change / previous) * 100) : undefined;

  return {
    current,
    previous,
    change,
    percentChange,
    trend: getMetricTrend(change, percentChange, stableAbsoluteThreshold),
  };
};

const normalizeInvoiceActionSnapshots = (
  snapshots?: InvoiceActionSnapshot[]
): InvoiceActionSnapshot[] => {
  if (!Array.isArray(snapshots)) {
    return [];
  }

  return snapshots
    .filter(
      (snapshot) =>
        Boolean(snapshot?.id && snapshot.title) &&
        (snapshot.status === 'in_progress' || snapshot.status === 'completed')
    )
    .map((snapshot) => ({
      id: snapshot.id,
      title: snapshot.title,
      status: snapshot.status,
      value: typeof snapshot.value === 'string' ? snapshot.value : undefined,
    }));
};

export const buildInvoiceComparison = (invoiceHistory: InvoiceData[]): InvoiceComparison => {
  const [currentInvoice, previousInvoice] = sortInvoicesForComparison(invoiceHistory);

  if (!currentInvoice || !previousInvoice) {
    return {
      status: 'insufficient',
      basis: 'history',
      title: 'Ainda não há comparação suficiente no histórico',
      summary:
        'Adicione pelo menos duas faturas ao histórico para observar se consumo e custo melhoraram, pioraram ou ficaram estaveis.',
      currentInvoice,
    };
  }

  const canCompareConsumption =
    typeof currentInvoice.consumption === 'number' && typeof previousInvoice.consumption === 'number';
  const canCompareTotalValue =
    typeof currentInvoice.totalValue === 'number' && typeof previousInvoice.totalValue === 'number';

  if (!canCompareConsumption || !canCompareTotalValue) {
    return {
      status: 'insufficient',
      basis: getComparisonBasis(currentInvoice, previousInvoice),
      title: 'Leitura parcial entre faturas',
      summary:
        'Uma ou mais faturas do historico nao tem consumo e valor total extraidos com seguranca suficiente para comparacao.',
      currentInvoice,
      previousInvoice,
    };
  }

  const consumption = buildMetricComparison(
    currentInvoice.consumption,
    previousInvoice.consumption,
    5
  );
  const totalValue = buildMetricComparison(currentInvoice.totalValue, previousInvoice.totalValue, 5);
  const consumptionImproved = consumption.trend === 'down';
  const consumptionWorsened = consumption.trend === 'up';
  const costImproved = totalValue.trend === 'down';
  const costWorsened = totalValue.trend === 'up';
  const basis = getComparisonBasis(currentInvoice, previousInvoice);

  if (consumption.trend === 'stable' && totalValue.trend === 'stable') {
    return {
      status: 'stable',
      basis,
      title: 'Fatura estável em relação à anterior',
      summary:
        'Consumo e custo ficaram próximos da fatura anterior. Acompanhe o próximo ciclo antes de concluir tendência.',
      currentInvoice,
      previousInvoice,
      consumption,
      totalValue,
    };
  }

  if ((consumptionImproved || consumption.trend === 'stable') && (costImproved || totalValue.trend === 'stable')) {
    return {
      status: 'improved',
      basis,
      title: 'Redução observada nesta fatura',
      summary:
        'A fatura atual melhorou em pelo menos um sinal sem piorar o outro. É evolução observada, sem atribuir causa direta.',
      currentInvoice,
      previousInvoice,
      consumption,
      totalValue,
    };
  }

  if ((consumptionWorsened || consumption.trend === 'stable') && (costWorsened || totalValue.trend === 'stable')) {
    return {
      status: 'worsened',
      basis,
      title: 'Aumento observado nesta fatura',
      summary:
        'A fatura atual piorou em pelo menos um sinal sem melhora compensatória no outro. Revise a rotina e acompanhe o próximo ciclo.',
      currentInvoice,
      previousInvoice,
      consumption,
      totalValue,
    };
  }

  return {
    status: 'mixed',
    basis,
    title: 'Leitura mista entre consumo e custo',
    summary:
      'Consumo e custo apontaram em direções diferentes. Acompanhe mais um ciclo antes de concluir tendência.',
    currentInvoice,
    previousInvoice,
    consumption,
    totalValue,
  };
};

export const captureActionSnapshotsForInvoice = (
  actions: NextActionsState
): InvoiceActionSnapshot[] => {
  const seenActionIds = new Set<string>();

  return actions.items
    .filter((action) => action.status === 'in_progress' || action.status === 'completed')
    .filter((action) => {
      if (seenActionIds.has(action.id)) {
        return false;
      }

      seenActionIds.add(action.id);
      return true;
    })
    .map((action) => ({
      id: action.id,
      title: action.title,
      status: action.status as InvoiceActionSnapshot['status'],
      value: action.value,
    }));
};

export const buildActionResultLink = (comparison: InvoiceComparison): ActionResultLink => {
  const actions = normalizeInvoiceActionSnapshots(comparison.currentInvoice?.actionSnapshots);

  if (comparison.status === 'insufficient' || !comparison.previousInvoice) {
    return {
      title: 'Sem ciclo comparavel',
      message:
        'A ligacao com acoes fica limitada ate existir comparacao entre duas faturas.',
      actions: [],
      note: 'Adicione a proxima fatura ao historico para observar o contexto com mais seguranca.',
      hasObservedComparison: false,
    };
  }

  if (actions.length === 0) {
    return {
      title: 'Sem acao testada registrada',
      message:
        'A comparacao existe, mas nao havia acao marcada como em execucao ou testada antes desta fatura.',
      actions,
      note: 'Isso evita atribuir resultado a uma rotina que nao foi registrada.',
      hasObservedComparison: true,
    };
  }

  const hasCompletedAction = actions.some((action) => action.status === 'completed');

  return {
    title: 'Acoes observadas no ciclo',
    message: hasCompletedAction
      ? 'Antes desta fatura, voce tinha acoes marcadas como testadas ou em execucao.'
      : 'Antes desta fatura, voce tinha acoes marcadas como em execucao.',
    actions,
    note: 'Isso e memoria contextual, nao prova que a acao causou o resultado.',
    hasObservedComparison: true,
  };
};

export const buildNextCycleGuidance = (
  comparison: InvoiceComparison,
  userContext?: Partial<UserContextState>
): NextCycleGuidance => {
  const hasCurrentInvoice = Boolean(comparison.currentInvoice);
  const normalizedUserContext = normalizeUserContext(userContext);
  const primaryGoal = normalizedUserContext.questions.primary_goal?.status === 'answered'
    ? normalizedUserContext.questions.primary_goal.value
    : undefined;

  if (comparison.status === 'improved') {
    return {
      title: 'Manter e confirmar',
      message: 'A fatura atual trouxe um sinal melhor que a anterior.',
      suggestion:
        primaryGoal === 'reduce_cost'
          ? 'Mantenha o ajuste e confirme se o custo responde no proximo ciclo.'
          : primaryGoal === 'understand_consumption'
            ? 'Mantenha o ajuste e observe se o padrao se repete no proximo ciclo.'
            : 'Mantenha o comportamento observado e confirme no proximo ciclo.',
    };
  }

  if (comparison.status === 'worsened') {
    return {
      title: 'Ajustar o proximo teste',
      message: 'A fatura atual trouxe um sinal de aumento.',
      suggestion:
        primaryGoal === 'reduce_cost'
          ? 'Escolha um ajuste mais focado em reduzir custo e acompanhe por um ciclo.'
          : primaryGoal === 'understand_consumption'
            ? 'Escolha um ajuste mais focado em observar o padrao e acompanhe por um ciclo.'
            : 'Escolha uma acao mais focada e acompanhe por um ciclo.',
    };
  }

  if (comparison.status === 'stable') {
    return {
      title: 'Observar mais um ciclo',
      message: 'Consumo e custo ficaram proximos da fatura anterior.',
      suggestion:
        primaryGoal === 'understand_consumption'
          ? 'Continue observando o padrao antes de mudar a estrategia.'
          : 'Continue acompanhando antes de mudar a estrategia.',
    };
  }

  if (comparison.status === 'mixed') {
    const focus =
      comparison.consumption?.trend === 'up'
        ? 'consumo'
        : comparison.totalValue?.trend === 'up'
          ? 'custo'
          : 'um eixo por vez';

    return {
      title: 'Focar em um eixo',
      message: 'Consumo e custo nao caminharam na mesma direcao.',
      suggestion:
        primaryGoal === 'reduce_cost'
          ? 'No proximo ciclo, acompanhe primeiro o custo.'
          : primaryGoal === 'understand_consumption'
            ? 'No proximo ciclo, observe primeiro o padrao de consumo.'
            : focus === 'um eixo por vez'
          ? 'Observe um eixo por vez no proximo ciclo.'
          : `No proximo ciclo, acompanhe primeiro o ${focus}.`,
    };
  }

  return {
    title: 'Construir base de comparacao',
    message: 'Ainda falta historico para orientar o proximo ciclo.',
    suggestion: hasCurrentInvoice
      ? 'Adicione mais uma fatura ao historico para comparar consumo e custo.'
      : 'Adicione uma fatura ao historico para iniciar a base de comparacao.',
  };
};

const hasHandledMascotQuestion = (
  userContext: UserContextState,
  questionId: MascotContextQuestionId
) => Boolean(userContext.questions[questionId]);

export const buildMascotContextQuestion = (
  state: Pick<MvpState, 'analysis' | 'actions' | 'userContext'>
): MascotContextQuestion | undefined => {
  const userContext = normalizeUserContext(state.userContext);
  const comparison = buildInvoiceComparison(state.analysis.invoiceHistory);
  const hasObservedComparison =
    comparison.status !== 'insufficient' && Boolean(comparison.previousInvoice);

  if (hasObservedComparison && !hasHandledMascotQuestion(userContext, 'primary_goal')) {
    return MASCOT_CONTEXT_QUESTIONS.primary_goal;
  }

  return undefined;
};

export const answerMascotContextQuestion = (
  state: MvpState,
  questionId: MascotContextQuestionId,
  value: MascotContextQuestionValue,
  updatedAt = new Date().toISOString()
): MvpState => {
  const option = getMascotQuestionOption(questionId, value);

  if (!option) {
    return state;
  }

  const userContext = normalizeUserContext(state.userContext);

  return {
    ...state,
    userContext: {
      questions: {
        ...userContext.questions,
        [questionId]: {
          status: 'answered',
          value: option.value,
          label: option.label,
          updatedAt,
        },
      },
    },
  };
};

export const ignoreMascotContextQuestion = (
  state: MvpState,
  questionId: MascotContextQuestionId,
  updatedAt = new Date().toISOString()
): MvpState => {
  if (!MASCOT_CONTEXT_QUESTIONS[questionId]) {
    return state;
  }

  const userContext = normalizeUserContext(state.userContext);

  return {
    ...state,
    userContext: {
      questions: {
        ...userContext.questions,
        [questionId]: {
          status: 'ignored',
          updatedAt,
        },
      },
    },
  };
};

const getBehaviorAnswerValue = (answer: string) => answer.trim().toLowerCase();

const updateStartedActionMemory = (
  energyBehaviorProfile: EnergyBehaviorProfile,
  actionTitle: string,
  updatedAt: string
) =>
  normalizeEnergyBehaviorProfile({
    ...energyBehaviorProfile,
    actionMemory: {
      ...energyBehaviorProfile.actionMemory,
      startedActionTitles: Array.from(
        new Set([
          ...(energyBehaviorProfile.actionMemory.startedActionTitles ?? []),
          actionTitle,
        ])
      ),
      answeredActionPrompts: energyBehaviorProfile.actionMemory.answeredActionPrompts,
    },
    updatedAt,
  });

const applyBehaviorAnswerToProfile = (
  energyBehaviorProfile: EnergyBehaviorProfile,
  questionId: NonNullable<NextAction['pendingAnswer']>['questionId'],
  answer: string,
  answeredAt: string
) => {
  const normalizedAnswer = getBehaviorAnswerValue(answer);
  const nextProfile: Partial<EnergyBehaviorProfile> = {
    ...energyBehaviorProfile,
    appliances: { ...energyBehaviorProfile.appliances },
    habits: { ...energyBehaviorProfile.habits },
    intentions: { ...energyBehaviorProfile.intentions },
    qualification: { ...energyBehaviorProfile.qualification },
    actionMemory: {
      ...energyBehaviorProfile.actionMemory,
      answeredActionPrompts: {
        ...(energyBehaviorProfile.actionMemory.answeredActionPrompts ?? {}),
        [questionId]: {
          answer,
          answeredAt,
        },
      },
      startedActionTitles: energyBehaviorProfile.actionMemory.startedActionTitles,
    },
    updatedAt: answeredAt,
  };

  if (questionId === 'showers_count') {
    nextProfile.appliances = {
      ...nextProfile.appliances,
      showers:
        normalizedAnswer === '0'
          ? 0
          : normalizedAnswer === '1'
            ? 1
            : normalizedAnswer === '2+'
              ? 2
              : nextProfile.appliances?.showers,
    };
  }

  if (questionId === 'electric_shower_presence') {
    nextProfile.appliances = {
      ...nextProfile.appliances,
      hasElectricShower:
        normalizedAnswer === 'yes'
          ? true
          : normalizedAnswer === 'no'
            ? false
            : nextProfile.appliances?.hasElectricShower,
    };
  }

  if (questionId === 'air_conditioning_presence') {
    nextProfile.appliances = {
      ...nextProfile.appliances,
      hasAirConditioning:
        normalizedAnswer === 'yes'
          ? true
          : normalizedAnswer === 'no'
            ? false
            : nextProfile.appliances?.hasAirConditioning,
    };
  }

  if (questionId === 'extra_fridge_presence') {
    nextProfile.appliances = {
      ...nextProfile.appliances,
      hasExtraFridge:
        normalizedAnswer === 'yes'
          ? true
          : normalizedAnswer === 'no'
            ? false
            : nextProfile.appliances?.hasExtraFridge,
    };
  }

  if (questionId === 'heavy_loads_at_night') {
    nextProfile.habits = {
      ...nextProfile.habits,
      usesHeavyLoadsAtNight:
        normalizedAnswer === 'yes'
          ? true
          : normalizedAnswer === 'no'
            ? false
            : nextProfile.habits?.usesHeavyLoadsAtNight,
      dominantUsagePeriod:
        normalizedAnswer === 'yes'
          ? 'pico'
          : nextProfile.habits?.dominantUsagePeriod,
    };
  }

  if (questionId === 'laundry_frequency') {
    nextProfile.habits = {
      ...nextProfile.habits,
      laundryFrequency:
        normalizedAnswer === 'baixa' ||
        normalizedAnswer === 'media' ||
        normalizedAnswer === 'alta'
          ? normalizedAnswer
          : nextProfile.habits?.laundryFrequency,
    };
  }

  if (questionId === 'dominant_usage_period') {
    nextProfile.habits = {
      ...nextProfile.habits,
      dominantUsageRoutine:
        normalizedAnswer === 'manha' ||
        normalizedAnswer === 'tarde' ||
        normalizedAnswer === 'noite' ||
        normalizedAnswer === 'misto'
          ? normalizedAnswer
          : nextProfile.habits?.dominantUsageRoutine,
    };
  }

  if (questionId === 'peak_window_intensity') {
    nextProfile.habits = {
      ...nextProfile.habits,
      peakWindowIntensity:
        normalizedAnswer === 'sim' ||
        normalizedAnswer === 'nao' ||
        normalizedAnswer === 'as_vezes'
          ? normalizedAnswer
          : nextProfile.habits?.peakWindowIntensity,
    };
  }

  if (questionId === 'peak_household_presence') {
    nextProfile.habits = {
      ...nextProfile.habits,
      householdPeakPresence:
        normalizedAnswer === 'sim' ||
        normalizedAnswer === 'nao' ||
        normalizedAnswer === 'parcial'
          ? normalizedAnswer
          : nextProfile.habits?.householdPeakPresence,
    };
  }

  if (questionId === 'climate_usage_intensity') {
    nextProfile.habits = {
      ...nextProfile.habits,
      climateUsageIntensity:
        normalizedAnswer === 'sim' ||
        normalizedAnswer === 'nao' ||
        normalizedAnswer === 'sazonal'
          ? normalizedAnswer
          : nextProfile.habits?.climateUsageIntensity,
    };
  }

  if (questionId === 'thermal_instability') {
    nextProfile.habits = {
      ...nextProfile.habits,
      thermalSensitivity:
        normalizedAnswer === 'sim' ||
        normalizedAnswer === 'nao' ||
        normalizedAnswer === 'nao_sei'
          ? normalizedAnswer
          : nextProfile.habits?.thermalSensitivity,
    };
  }

  if (questionId === 'thermal_comfort_interest') {
    nextProfile.intentions = {
      ...nextProfile.intentions,
      thermalComfortInterest:
        normalizedAnswer === 'sim' ||
        normalizedAnswer === 'talvez' ||
        normalizedAnswer === 'nao'
          ? normalizedAnswer
          : nextProfile.intentions?.thermalComfortInterest,
    };
  }

  if (questionId === 'solar_analysis_interest') {
    nextProfile.intentions = {
      ...nextProfile.intentions,
      solarAnalysisInterest:
        normalizedAnswer === 'sim' ||
        normalizedAnswer === 'talvez' ||
        normalizedAnswer === 'nao'
          ? normalizedAnswer
          : nextProfile.intentions?.solarAnalysisInterest,
    };
  }

  if (questionId === 'consultant_interest') {
    nextProfile.intentions = {
      ...nextProfile.intentions,
      consultantInterest:
        normalizedAnswer === 'sim' ||
        normalizedAnswer === 'talvez' ||
        normalizedAnswer === 'nao'
          ? normalizedAnswer
          : nextProfile.intentions?.consultantInterest,
    };
  }

  if (questionId === 'primary_objective') {
    nextProfile.intentions = {
      ...nextProfile.intentions,
      primaryObjective:
        normalizedAnswer === 'economia' ||
        normalizedAnswer === 'conforto' ||
        normalizedAnswer === 'sustentabilidade'
          ? normalizedAnswer
          : nextProfile.intentions?.primaryObjective,
    };
  }

  return normalizeEnergyBehaviorProfile(nextProfile);
};

const refreshAdaptiveJourneyState = (
  state: MvpState,
  nextEnergyBehaviorProfile: EnergyBehaviorProfile,
  updatedAt: string,
  recomputeAnalysis = false
) => {
  const latestInvoice = state.analysis.latestInvoice;
  const invoiceHistory = state.analysis.invoiceHistory;
  const summary =
    latestInvoice &&
    state.analysis.status !== 'processing' &&
    (recomputeAnalysis || !state.analysis.summary)
      ? buildAnalysisSummary(
          latestInvoice,
          state.profile,
          invoiceHistory,
          nextEnergyBehaviorProfile
        )
      : state.analysis.summary;
  const nextAnalysis = normalizeAnalysisState(
    {
      ...state.analysis,
      summary,
      lastCompletedAt: state.analysis.lastCompletedAt,
    },
    undefined,
    undefined,
    nextEnergyBehaviorProfile
  );
  const nextActions = buildNextActions(
    nextAnalysis.latestInvoice,
    nextAnalysis.summary,
    state.profile,
    state.userContext,
    nextEnergyBehaviorProfile
  );
  const persistedActionMap = new Map(
    state.actions.items.map((currentAction) => [currentAction.id, currentAction] as const)
  );
  const hydratedNextActions = nextActions.map((nextAction) => ({
    ...nextAction,
    status: persistedActionMap.get(nextAction.id)?.status ?? nextAction.status,
    source: nextAction.source ?? persistedActionMap.get(nextAction.id)?.source,
  }));

  return {
    ...state,
    energyBehaviorProfile: nextEnergyBehaviorProfile,
    analysis: nextAnalysis,
    actions: normalizeActionsState({
      items: hydratedNextActions,
      viewedActionIds: state.actions.viewedActionIds,
      lastUpdatedAt: updatedAt,
    }),
  };
};

export const saveEnergyBehaviorAnswer = (
  state: MvpState,
  action: NextAction,
  answeredAt = new Date().toISOString()
): MvpState => {
  const pendingAnswer = action.pendingAnswer;

  if (!pendingAnswer?.questionId || !pendingAnswer.answer.trim()) {
    return state;
  }

  const nextEnergyBehaviorProfile = applyBehaviorAnswerToProfile(
    normalizeEnergyBehaviorProfile(state.energyBehaviorProfile),
    pendingAnswer.questionId,
    pendingAnswer.answer,
    pendingAnswer.answeredAt ?? answeredAt
  );

  return refreshAdaptiveJourneyState(
    state,
    nextEnergyBehaviorProfile,
    pendingAnswer.answeredAt ?? answeredAt,
    true
  );
};

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

export const updateActionStatus = (
  state: MvpState,
  actionOrId: NextAction | string,
  status: Extract<NextAction['status'], 'in_progress' | 'completed'>
): MvpState => {
  const actionId = typeof actionOrId === 'string' ? actionOrId : actionOrId.id;
  const actionTitle =
    typeof actionOrId === 'string'
      ? state.actions.items.find((action) => action.id === actionId)?.title ?? actionId
      : actionOrId.title;

  if (!state.actions.items.some((action) => action.id === actionId)) {
    return state;
  }

  const answeredAt =
    typeof actionOrId === 'string'
      ? new Date().toISOString()
      : actionOrId.pendingAnswer?.answeredAt ?? new Date().toISOString();
  const shouldPersistAnswer =
    typeof actionOrId === 'string' ? false : Boolean(actionOrId.pendingAnswer?.persistOnly);
  const baseState = shouldPersistAnswer
    ? saveEnergyBehaviorAnswer(state, actionOrId, answeredAt)
    : state;

  if (shouldPersistAnswer) {
    return baseState;
  }

  const viewedActionIds = state.actions.viewedActionIds.includes(actionId)
    ? state.actions.viewedActionIds
    : [...state.actions.viewedActionIds, actionId];
  const items = baseState.actions.items.map((currentAction) =>
    currentAction.id === actionId ? { ...currentAction, status } : currentAction
  );
  const nextEnergyBehaviorProfile = updateStartedActionMemory(
    normalizeEnergyBehaviorProfile(baseState.energyBehaviorProfile),
    actionTitle,
    answeredAt
  );

  return refreshAdaptiveJourneyState(
    updateActions(
      {
        ...baseState,
        energyBehaviorProfile: nextEnergyBehaviorProfile,
      },
      {
        items,
        viewedActionIds,
        updatedAt: answeredAt,
      }
    ),
    nextEnergyBehaviorProfile,
    answeredAt
  );
};
