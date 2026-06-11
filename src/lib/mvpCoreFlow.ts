import {
  ActionInteractiveQuestion,
  EnergyDiagnosisQuestionDefinition,
  AnalysisSummary,
  ConsultiveInsight,
  ConsultiveInsightAction,
  ConsultiveInsightDriver,
  ConsultiveInsightProfileContext,
  EnergyBehaviorProfile,
  InvoiceData,
  InsightSeason,
  InsightEducationItem,
  InsightFactItem,
  JourneyStage,
  MascotGuidance,
  NextAction,
  ScoreEvent,
  ScoreEventType,
  ScoreState,
  UserContextState,
  UserProfileData,
} from '@/types/mvp';
import {
  extractInvoiceDerivedEvidence,
  InvoiceDerivedEvidence,
  parseInvoiceFile,
} from '@/lib/invoiceParser';
import { getInvoiceFlowSnapshot, logInvoiceFlow } from '@/lib/invoiceFlowDebug';

type InvoiceSignalTrend = 'down' | 'up' | 'stable' | 'unknown';

interface InvoiceComparativeSignals {
  consumptionTrend: InvoiceSignalTrend;
  costTrend: InvoiceSignalTrend;
  costPerKwhTrend: InvoiceSignalTrend;
}

const SCORE_EVENT_POINTS = {
  profile_completed: 80,
  invoice_uploaded: 120,
  analysis_completed: 100,
  action_viewed: 30,
} as const;

const SCORE_EVENT_ID_PREFIX: Record<ScoreEventType, string> = {
  profile_completed: 'profile-completed',
  invoice_uploaded: 'invoice-uploaded:',
  analysis_completed: 'analysis-completed:',
  action_viewed: 'action-viewed:',
};

const CONSUMER_THRESHOLDS = {
  Residencial: { low: 220, medium: 340 },
  Comercial: { low: 500, medium: 760 },
  Restaurante: { low: 650, medium: 900 },
  Escola: { low: 620, medium: 860 },
  Industria: { low: 1100, medium: 1500 },
} as const;

const DEFAULT_PROFILE: UserProfileData = {
  consumerType: 'Residencial',
  location: '',
  propertySize: 0,
  peopleCount: 1,
  energyPreference: 'Convencional',
};

const DEFAULT_ENERGY_BEHAVIOR_PROFILE: EnergyBehaviorProfile = {
  appliances: {},
  habits: {},
  intentions: {},
  qualification: {},
  actionMemory: {},
  confidence: {},
};

let activeEnergyBehaviorProfile = DEFAULT_ENERGY_BEHAVIOR_PROFILE;

const BASIC_SIGNAL_TOLERANCE = 0.05;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const hasNumericValue = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const hasBooleanValue = (value: unknown): value is boolean => typeof value === 'boolean';

const normalizeForMatch = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const VALID_HOUSEHOLD_ROUTINE_PERIODS = ['manha', 'tarde', 'noite', 'misto', 'nao_informado'];
const VALID_PEAK_WINDOW_USAGES = ['sim', 'nao', 'as_vezes', 'nao_informado'];
const VALID_HOUSEHOLD_PRESENCES = ['sim', 'nao', 'parcial', 'nao_informado'];
const VALID_CLIMATE_USAGES = ['sim', 'nao', 'sazonal', 'nao_informado'];
const VALID_THERMAL_SENSITIVITIES = ['sim', 'nao', 'nao_sei', 'nao_informado'];
const VALID_INTEREST_LEVELS = ['sim', 'talvez', 'nao', 'nao_informado'];
const VALID_PRIMARY_OBJECTIVES = ['economia', 'conforto', 'sustentabilidade', 'nao_informado'];

export const normalizeEnergyBehaviorProfile = (
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile>
): EnergyBehaviorProfile => ({
  appliances: {
    showers:
      hasNumericValue(energyBehaviorProfile?.appliances?.showers) &&
      energyBehaviorProfile.appliances.showers >= 0
        ? Math.min(Math.round(energyBehaviorProfile.appliances.showers), 99)
        : undefined,
    hasElectricShower: hasBooleanValue(energyBehaviorProfile?.appliances?.hasElectricShower)
      ? energyBehaviorProfile.appliances.hasElectricShower
      : undefined,
    hasAirConditioning: hasBooleanValue(energyBehaviorProfile?.appliances?.hasAirConditioning)
      ? energyBehaviorProfile.appliances.hasAirConditioning
      : undefined,
    hasExtraFridge: hasBooleanValue(energyBehaviorProfile?.appliances?.hasExtraFridge)
      ? energyBehaviorProfile.appliances.hasExtraFridge
      : undefined,
  },
  habits: {
    dominantUsagePeriod:
      energyBehaviorProfile?.habits?.dominantUsagePeriod ?? undefined,
    usesHeavyLoadsAtNight: hasBooleanValue(energyBehaviorProfile?.habits?.usesHeavyLoadsAtNight)
      ? energyBehaviorProfile.habits.usesHeavyLoadsAtNight
      : undefined,
    laundryFrequency: energyBehaviorProfile?.habits?.laundryFrequency ?? undefined,
    dominantUsageRoutine:
      typeof energyBehaviorProfile?.habits?.dominantUsageRoutine === 'string' &&
      VALID_HOUSEHOLD_ROUTINE_PERIODS.includes(energyBehaviorProfile.habits.dominantUsageRoutine)
        ? energyBehaviorProfile.habits.dominantUsageRoutine
        : undefined,
    peakWindowIntensity:
      typeof energyBehaviorProfile?.habits?.peakWindowIntensity === 'string' &&
      VALID_PEAK_WINDOW_USAGES.includes(energyBehaviorProfile.habits.peakWindowIntensity)
        ? energyBehaviorProfile.habits.peakWindowIntensity
        : undefined,
    householdPeakPresence:
      typeof energyBehaviorProfile?.habits?.householdPeakPresence === 'string' &&
      VALID_HOUSEHOLD_PRESENCES.includes(energyBehaviorProfile.habits.householdPeakPresence)
        ? energyBehaviorProfile.habits.householdPeakPresence
        : undefined,
    climateUsageIntensity:
      typeof energyBehaviorProfile?.habits?.climateUsageIntensity === 'string' &&
      VALID_CLIMATE_USAGES.includes(energyBehaviorProfile.habits.climateUsageIntensity)
        ? energyBehaviorProfile.habits.climateUsageIntensity
        : undefined,
    thermalSensitivity:
      typeof energyBehaviorProfile?.habits?.thermalSensitivity === 'string' &&
      VALID_THERMAL_SENSITIVITIES.includes(energyBehaviorProfile.habits.thermalSensitivity)
        ? energyBehaviorProfile.habits.thermalSensitivity
        : undefined,
  },
  intentions: {
    thermalComfortInterest:
      typeof energyBehaviorProfile?.intentions?.thermalComfortInterest === 'string' &&
      VALID_INTEREST_LEVELS.includes(energyBehaviorProfile.intentions.thermalComfortInterest)
        ? energyBehaviorProfile.intentions.thermalComfortInterest
        : undefined,
    solarAnalysisInterest:
      typeof energyBehaviorProfile?.intentions?.solarAnalysisInterest === 'string' &&
      VALID_INTEREST_LEVELS.includes(energyBehaviorProfile.intentions.solarAnalysisInterest)
        ? energyBehaviorProfile.intentions.solarAnalysisInterest
        : undefined,
    consultantInterest:
      typeof energyBehaviorProfile?.intentions?.consultantInterest === 'string' &&
      VALID_INTEREST_LEVELS.includes(energyBehaviorProfile.intentions.consultantInterest)
        ? energyBehaviorProfile.intentions.consultantInterest
        : undefined,
    primaryObjective:
      typeof energyBehaviorProfile?.intentions?.primaryObjective === 'string' &&
      VALID_PRIMARY_OBJECTIVES.includes(energyBehaviorProfile.intentions.primaryObjective)
        ? energyBehaviorProfile.intentions.primaryObjective
        : undefined,
  },
  qualification: {
    diagnosisLevel:
      hasNumericValue(energyBehaviorProfile?.qualification?.diagnosisLevel) &&
      energyBehaviorProfile.qualification.diagnosisLevel >= 1
        ? Math.min(Math.round(energyBehaviorProfile.qualification.diagnosisLevel), 99)
        : undefined,
    answeredDiagnosisCount:
      hasNumericValue(energyBehaviorProfile?.qualification?.answeredDiagnosisCount) &&
      energyBehaviorProfile.qualification.answeredDiagnosisCount >= 0
        ? Math.min(Math.round(energyBehaviorProfile.qualification.answeredDiagnosisCount), 99)
        : undefined,
    qualifiedLead: hasBooleanValue(energyBehaviorProfile?.qualification?.qualifiedLead)
      ? energyBehaviorProfile.qualification.qualifiedLead
      : undefined,
  },
  actionMemory: {
    startedActionTitles: Array.isArray(energyBehaviorProfile?.actionMemory?.startedActionTitles)
      ? energyBehaviorProfile.actionMemory.startedActionTitles.filter(
          (title): title is string => typeof title === 'string' && title.trim().length > 0
        )
      : undefined,
    answeredActionPrompts:
      energyBehaviorProfile?.actionMemory?.answeredActionPrompts &&
      typeof energyBehaviorProfile.actionMemory.answeredActionPrompts === 'object'
        ? Object.fromEntries(
            Object.entries(energyBehaviorProfile.actionMemory.answeredActionPrompts).filter(
              ([questionId, entry]) =>
                typeof questionId === 'string' &&
                questionId.trim().length > 0 &&
                typeof entry?.answer === 'string' &&
                entry.answer.trim().length > 0 &&
                typeof entry.answeredAt === 'string' &&
                !Number.isNaN(new Date(entry.answeredAt).getTime())
            )
          )
        : undefined,
  },
  confidence: {
    applianceConfidence: hasNumericValue(energyBehaviorProfile?.confidence?.applianceConfidence)
      ? clamp(energyBehaviorProfile.confidence.applianceConfidence, 0, 1)
      : undefined,
    habitConfidence: hasNumericValue(energyBehaviorProfile?.confidence?.habitConfidence)
      ? clamp(energyBehaviorProfile.confidence.habitConfidence, 0, 1)
      : undefined,
    leadConfidence: hasNumericValue(energyBehaviorProfile?.confidence?.leadConfidence)
      ? clamp(energyBehaviorProfile.confidence.leadConfidence, 0, 1)
      : undefined,
  },
  updatedAt:
    typeof energyBehaviorProfile?.updatedAt === 'string' &&
    !Number.isNaN(new Date(energyBehaviorProfile.updatedAt).getTime())
      ? energyBehaviorProfile.updatedAt
      : undefined,
});

export const setActiveEnergyBehaviorProfile = (
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile>
) => {
  activeEnergyBehaviorProfile = normalizeEnergyBehaviorProfile(energyBehaviorProfile);
};

const getResolvedEnergyBehaviorProfile = (
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile>
) =>
  normalizeEnergyBehaviorProfile(
    energyBehaviorProfile ?? activeEnergyBehaviorProfile ?? DEFAULT_ENERGY_BEHAVIOR_PROFILE
  );

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

const getResolvedProfile = (profile?: Partial<UserProfileData>): UserProfileData => ({
  ...DEFAULT_PROFILE,
  ...profile,
});

const getAnsweredContextValue = (
  userContext: Partial<UserContextState> | undefined,
  questionId: 'usage_period' | 'electric_shower' | 'primary_goal'
) => {
  const answer = userContext?.questions?.[questionId];
  return answer?.status === 'answered' ? answer.value : undefined;
};

const getInvoiceMonthLabel = (invoice: Pick<InvoiceData, 'month'>) =>
  invoice.month || 'Referencia nao identificada';

const getUsageWindowLabel = (invoice: InvoiceData) =>
  invoice.peakHours?.trim() || 'a faixa de uso que merece mais atencao neste ciclo';

const formatCurrency = (value?: number) =>
  hasNumericValue(value) ? `R$ ${value.toFixed(2)}` : undefined;

const formatCurrencyPerKwh = (value?: number) =>
  hasNumericValue(value) ? `R$ ${value.toFixed(2)}/kWh` : undefined;

const formatKwhValue = (value?: number) =>
  hasNumericValue(value) ? `${value} kWh` : undefined;

const buildTariffEducation = (tariffFlag?: string) => {
  if (!tariffFlag) {
    return undefined;
  }

  if (tariffFlag.includes('VERDE')) {
    return 'Bandeira verde indica menor pressao tarifaria neste ciclo.';
  }

  if (tariffFlag.includes('AMARELA')) {
    return 'Bandeira amarela indica custo extra moderado por kWh.';
  }

  if (tariffFlag.includes('VERMELHA')) {
    return 'Bandeira vermelha indica energia mais cara neste ciclo.';
  }

  if (tariffFlag.includes('ESCASSEZ')) {
    return 'Escassez hidrica indica custo extra elevado para sustentar o sistema.';
  }

  return `A bandeira ${tariffFlag.toLowerCase()} mostra a condicao tarifaria deste ciclo.`;
};

const getInvoiceEvidence = (
  invoice: InvoiceData,
  fallbackCostPerKwh?: number
): InvoiceDerivedEvidence => {
  const evidence = extractInvoiceDerivedEvidence({
    ...invoice.parser,
    consumption: invoice.consumption,
    totalValue: invoice.totalValue,
  });

  return {
    ...evidence,
    averageCostPerKwh: evidence.averageCostPerKwh ?? fallbackCostPerKwh,
  };
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

const getMonthIndexFromReference = (referenceMonth?: string) => {
  if (!referenceMonth) {
    return undefined;
  }

  const normalizedMonth = normalizeDateText(referenceMonth);
  const numericMatch = normalizedMonth.match(/\b(0[1-9]|1[0-2])\/(\d{4})\b/);

  if (numericMatch) {
    return Number(numericMatch[1]) - 1;
  }

  const monthKey = Object.keys(PT_BR_MONTH_INDEX).find((month) =>
    normalizedMonth.includes(month)
  );

  return monthKey ? PT_BR_MONTH_INDEX[monthKey] : undefined;
};

export const getSeasonFromMonth = (referenceMonth?: string): InsightSeason => {
  const monthIndex = getMonthIndexFromReference(referenceMonth);

  if (monthIndex === 11 || monthIndex === 0 || monthIndex === 1) {
    return 'verao';
  }

  if (monthIndex === 5 || monthIndex === 6 || monthIndex === 7) {
    return 'inverno';
  }

  return 'meia_estacao';
};

const getSeasonalMicroEducation = (season: InsightSeason) => {
  if (season === 'inverno') {
    return 'No inverno, aquecimento costuma elevar o consumo em alguns perfis.';
  }

  if (season === 'verao') {
    return 'No verao, refrigeracao costuma elevar o consumo em alguns perfis.';
  }

  return 'Em meia estacao, o clima tende a pressionar menos o consumo termico.';
};

const getSeasonalConsumptionContext = (season: InsightSeason) => {
  if (season === 'inverno') {
    return 'Isso indica que aquecimento deve entrar primeiro na comparacao da rotina.';
  }

  if (season === 'verao') {
    return 'Isso indica que refrigeracao deve entrar primeiro na comparacao da rotina.';
  }

  return 'A estacao atual ajuda a contextualizar a variacao sem substituir a evidencia da fatura.';
};

const hasSolarPreference = (profile?: Partial<UserProfileData>) =>
  profile?.energyPreference === 'Solar' || profile?.energyPreference === 'Hibrido';

const buildProfileContextSentence = ({
  profileType,
  householdSize,
  hasSolar,
}: {
  profileType?: string;
  householdSize?: number;
  hasSolar: boolean;
}) => {
  if (hasSolar) {
    return 'Como ha indicacao de energia solar, a comparacao deve verificar se o consumo ainda fica fora dos horarios de geracao.';
  }

  if (profileType === 'Residencial' && householdSize) {
    return `Para uma residencia com ${householdSize} ${householdSize === 1 ? 'pessoa' : 'pessoas'}, a rotina diaria deve entrar primeiro na comparacao.`;
  }

  if (profileType === 'Comercial') {
    return 'Para um perfil comercial, cargas fixas podem pesar mais no consumo.';
  }

  if (profileType === 'Restaurante') {
    return 'Para um restaurante, equipamentos de uso continuo podem pesar mais no consumo.';
  }

  if (profileType === 'Escola') {
    return 'Para um perfil escolar, a rotina de ocupacao ajuda a contextualizar variacoes entre ciclos.';
  }

  if (profileType === 'Industria') {
    return 'Para um perfil industrial, cargas fixas e operacao concentrada podem pesar mais no consumo.';
  }

  if (profileType) {
    return `Considerando o perfil informado de ${profileType.toLowerCase()}, esse dado reforca a necessidade de comparar a rotina com a fatura.`;
  }

  return undefined;
};

export const buildProfileContext = (
  profile?: Partial<UserProfileData>
): ConsultiveInsightProfileContext => {
  const resolvedProfile = getResolvedProfile(profile);
  const profileCompletion = getProfileCompletion(profile);
  const locationLabel = resolvedProfile.location.trim() || undefined;
  const hasCompleteProfile = profileCompletion >= 80;
  const hasSolar = hasSolarPreference(profile);
  const householdSize =
    hasCompleteProfile && resolvedProfile.peopleCount > 0 ? resolvedProfile.peopleCount : undefined;
  const contextSentence = hasCompleteProfile
    ? buildProfileContextSentence({
        profileType: resolvedProfile.consumerType,
        householdSize,
        hasSolar,
      })
    : undefined;
  const warnings =
    hasCompleteProfile
      ? []
      : ['Complete o perfil para recomendacoes mais precisas'];

  return {
    profileType: resolvedProfile.consumerType || undefined,
    locationLabel,
    householdSize,
    hasSolar,
    contextSentence,
    warnings,
  };
};

const appendContextClause = (baseSentence: string, clause?: string) =>
  clause ? `${baseSentence} ${clause}` : baseSentence;

const normalizeSentenceClause = (value: string) => value.trim().replace(/[.;:\s]+$/g, '');

const joinMicroEducation = (baseConcept: string, extraClause?: string) => {
  if (!extraClause) {
    return baseConcept;
  }

  return `${normalizeSentenceClause(baseConcept)}; ${normalizeSentenceClause(extraClause)}.`;
};

const getProfileMicroEducationClause = (
  profileContext: ConsultiveInsightProfileContext
) => {
  if (profileContext.warnings.length > 0) {
    return 'complete o perfil para recomendacoes mais precisas';
  }

  if (profileContext.hasSolar) {
    return 'com indicacao de energia solar, observe os horarios fora da geracao';
  }

  if (profileContext.profileType === 'Residencial' && profileContext.householdSize) {
    return `para uma residencia com ${profileContext.householdSize} ${profileContext.householdSize === 1 ? 'pessoa' : 'pessoas'}, a rotina diaria pesa mais no resumo`;
  }

  if (profileContext.profileType === 'Comercial') {
    return 'para perfil comercial, cargas fixas merecem comparacao';
  }

  return undefined;
};

const getProfileActionReasonClause = (
  profileContext: ConsultiveInsightProfileContext
) => {
  if (profileContext.warnings.length > 0) {
    return undefined;
  }

  if (profileContext.hasSolar) {
    return 'Como ha indicacao de energia solar, a comparacao deve verificar se o uso segue concentrado fora da geracao.';
  }

  if (profileContext.profileType === 'Residencial' && profileContext.householdSize) {
    return `Para esse perfil residencial com ${profileContext.householdSize} ${profileContext.householdSize === 1 ? 'pessoa' : 'pessoas'}, a comparacao da rotina diaria deve vir primeiro.`;
  }

  if (profileContext.profileType === 'Comercial') {
    return 'Para esse perfil comercial, a revisao de cargas fixas deve vir primeiro.';
  }

  if (profileContext.profileType === 'Restaurante') {
    return 'Para esse perfil, a revisao de equipamentos de uso continuo deve vir primeiro.';
  }

  if (profileContext.profileType === 'Industria') {
    return 'Para esse perfil, a revisao de cargas fixas e concentracao operacional deve vir primeiro.';
  }

  return undefined;
};

export const getProfileCompletion = (profile?: Partial<UserProfileData>) => {
  const resolvedProfile = getResolvedProfile(profile);
  const checks = [
    Boolean(resolvedProfile.consumerType),
    Boolean(resolvedProfile.location.trim()),
    resolvedProfile.propertySize > 0,
    resolvedProfile.peopleCount > 0,
    Boolean(resolvedProfile.energyPreference),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
};

export const isProfileComplete = (profile?: Partial<UserProfileData>) =>
  getProfileCompletion(profile) >= 80;

export const interpretInvoiceFile = async (
  file: File,
  _profile?: Partial<UserProfileData>
): Promise<InvoiceData> => {
  const fingerprint = `${file.name}-${file.size}-${file.lastModified}-${file.type || 'unknown'}`;
  const parser = await parseInvoiceFile(file);
  logInvoiceFlow('after-parse', {
    fingerprint,
    fileName: file.name,
    referenceMonth: parser.fields.referenceMonth.value,
    dueDate: parser.fields.dueDate.value,
    totalValue: parser.fields.totalValue.value,
    consumptionKwh: parser.fields.consumptionKwh.value,
    previousReading: parser.fields.previousReading.value,
    currentReading: parser.fields.currentReading.value,
  });
  const totalValue = parser.fields.totalValue.value;
  const taxesTotal = parser.fields.taxesTotal.value;
  const evidence = extractInvoiceDerivedEvidence({
    ...parser,
    consumption: parser.fields.consumptionKwh.value,
    totalValue,
  });
  const taxPercentage =
    hasNumericValue(totalValue) && totalValue > 0 && hasNumericValue(taxesTotal)
      ? Math.round((taxesTotal / totalValue) * 100)
      : undefined;

  const invoice = {
    fingerprint,
    fileName: file.name,
    fileType: file.type || 'arquivo',
    fileSize: file.size,
    consumption: parser.fields.consumptionKwh.value,
    totalValue,
    taxPercentage,
    peakHours: evidence.peakWindowLabel,
    month: parser.fields.referenceMonth.value ?? 'Referencia nao identificada',
    parser,
  };

  logInvoiceFlow('interpret-invoice-file', getInvoiceFlowSnapshot(invoice));

  return invoice;
};

const getInvoiceCostPerKwh = (invoice: Pick<InvoiceData, 'totalValue' | 'consumption'>) => {
  if (
    !hasNumericValue(invoice.totalValue) ||
    !hasNumericValue(invoice.consumption) ||
    invoice.consumption <= 0
  ) {
    return undefined;
  }

  return invoice.totalValue / invoice.consumption;
};

const getBasicTrendSignal = (
  currentValue: number | undefined,
  previousValue: number | undefined
): InvoiceSignalTrend => {
  if (
    !hasNumericValue(currentValue) ||
    !hasNumericValue(previousValue) ||
    previousValue === 0
  ) {
    return 'unknown';
  }

  const relativeChange = (currentValue - previousValue) / previousValue;

  if (Math.abs(relativeChange) <= BASIC_SIGNAL_TOLERANCE) {
    return 'stable';
  }

  return relativeChange > 0 ? 'up' : 'down';
};

export const buildBasicInvoiceSignals = (
  currentInvoice: InvoiceData,
  previousInvoice: InvoiceData
): InvoiceComparativeSignals => ({
  consumptionTrend: getBasicTrendSignal(currentInvoice.consumption, previousInvoice.consumption),
  costTrend: getBasicTrendSignal(currentInvoice.totalValue, previousInvoice.totalValue),
  costPerKwhTrend: getBasicTrendSignal(
    getInvoiceCostPerKwh(currentInvoice),
    getInvoiceCostPerKwh(previousInvoice)
  ),
});

export const buildConsultativeInsights = (
  signals?: Partial<InvoiceComparativeSignals>
): string[] => {
  const resolvedSignals: InvoiceComparativeSignals = {
    consumptionTrend: signals?.consumptionTrend ?? 'unknown',
    costTrend: signals?.costTrend ?? 'unknown',
    costPerKwhTrend: signals?.costPerKwhTrend ?? 'unknown',
  };
  const insights: string[] = [];

  if (
    resolvedSignals.consumptionTrend === 'unknown' &&
    resolvedSignals.costTrend === 'unknown' &&
    resolvedSignals.costPerKwhTrend === 'unknown'
  ) {
    return ['Dados insuficientes para comparacao segura.'];
  }

  if (
    resolvedSignals.consumptionTrend === 'down' &&
    resolvedSignals.costTrend === 'up'
  ) {
    insights.push('Consumo caiu, mas o custo subiu. Sinal de atencao.');
  } else if (resolvedSignals.consumptionTrend === 'up') {
    insights.push('Consumo subiu. Vale observar o proximo ciclo.');
  } else if (resolvedSignals.consumptionTrend === 'down') {
    insights.push('Consumo caiu. Pode indicar um uso mais contido.');
  }

  if (resolvedSignals.costTrend === 'up') {
    insights.push('Custo subiu. Vale observar o proximo ciclo.');
  }

  if (resolvedSignals.costPerKwhTrend === 'up') {
    insights.push('Custo por kWh subiu. Sinal de atencao.');
  }

  return insights.length > 0 ? insights.slice(0, 3) : ['Dados insuficientes para comparacao segura.'];
};

const buildInsightAction = (
  title: ConsultiveInsightAction['title'],
  reason: string,
  evidence: string,
  ctaLabel = 'Comecar acao',
  interactiveQuestions?: ActionInteractiveQuestion[],
  usedDataPoints?: string[]
): ConsultiveInsightAction => ({
  ctaLabel,
  evidence,
  interactiveQuestions,
  usedDataPoints,
  reason: reason.trim(),
  title,
});

const buildHistoryTrendSummary = (
  currentInvoice: InvoiceData,
  previousInvoice?: InvoiceData,
  signals?: InvoiceComparativeSignals
) => {
  if (!previousInvoice || !signals) {
    return undefined;
  }

  const previousMonthLabel = getInvoiceMonthLabel(previousInvoice);

  if (
    signals.consumptionTrend === 'up' &&
    hasNumericValue(currentInvoice.consumption) &&
    hasNumericValue(previousInvoice.consumption)
  ) {
    return `O consumo deste ciclo ficou acima de ${formatKwhValue(previousInvoice.consumption)} em ${previousMonthLabel}.`;
  }

  if (
    signals.consumptionTrend === 'down' &&
    hasNumericValue(currentInvoice.consumption) &&
    hasNumericValue(previousInvoice.consumption)
  ) {
    return `O consumo deste ciclo ficou abaixo de ${formatKwhValue(previousInvoice.consumption)} em ${previousMonthLabel}.`;
  }

  if (signals.costPerKwhTrend === 'up') {
    return `O custo medio por kWh ficou acima do ciclo anterior em ${previousMonthLabel}.`;
  }

  if (signals.costTrend === 'up') {
    return `O custo total ficou acima do ciclo anterior em ${previousMonthLabel}.`;
  }

  return undefined;
};

const getComparableHistory = (invoice: InvoiceData, invoiceHistory: InvoiceData[]) =>
  sortInvoicesByCompetence(upsertInvoiceInHistory(invoice, invoiceHistory)).filter(
    (historyInvoice) => historyInvoice.fingerprint !== invoice.fingerprint
  );

const getAverageFromHistory = (
  values: Array<number | undefined>
) => {
  const numericValues = values.filter(hasNumericValue);

  if (numericValues.length === 0) {
    return undefined;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
};

const getHistoricalConsumptionAverage = (invoice: InvoiceData, invoiceHistory: InvoiceData[]) =>
  getAverageFromHistory(
    getComparableHistory(invoice, invoiceHistory).map((historyInvoice) => historyInvoice.consumption)
  );

const getHistoricalAverageCostPerKwh = (invoice: InvoiceData, invoiceHistory: InvoiceData[]) =>
  getAverageFromHistory(
    getComparableHistory(invoice, invoiceHistory).map((historyInvoice) =>
      getInvoiceCostPerKwh(historyInvoice)
    )
  );

const getPercentChange = (currentValue?: number, previousValue?: number) => {
  if (!hasNumericValue(currentValue) || !hasNumericValue(previousValue) || previousValue <= 0) {
    return undefined;
  }

  return ((currentValue - previousValue) / previousValue) * 100;
};

const BOOLEAN_INTERACTIVE_OPTIONS: ActionInteractiveQuestion['options'] = [
  { value: 'yes', label: 'Sim' },
  { value: 'no', label: 'Nao' },
];

const COUNT_INTERACTIVE_OPTIONS: ActionInteractiveQuestion['options'] = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2+', label: '2+' },
];

const LAUNDRY_INTERACTIVE_OPTIONS: ActionInteractiveQuestion['options'] = [
  { value: 'baixa', label: 'Pouca' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
];

const ROUTINE_PERIOD_OPTIONS: ActionInteractiveQuestion['options'] = [
  { value: 'manha', label: 'Manha' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
  { value: 'misto', label: 'Misto' },
];

const PEAK_INTENSITY_OPTIONS: ActionInteractiveQuestion['options'] = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Nao' },
  { value: 'as_vezes', label: 'As vezes' },
];

const HOUSEHOLD_PRESENCE_OPTIONS: ActionInteractiveQuestion['options'] = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Nao' },
  { value: 'parcial', label: 'Parcial' },
];

const CLIMATE_USAGE_OPTIONS: ActionInteractiveQuestion['options'] = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Nao' },
  { value: 'sazonal', label: 'Sazonal' },
];

const THERMAL_SENSITIVITY_OPTIONS: ActionInteractiveQuestion['options'] = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Nao' },
  { value: 'nao_sei', label: 'Nao sei' },
];

const INTEREST_OPTIONS: ActionInteractiveQuestion['options'] = [
  { value: 'sim', label: 'Sim' },
  { value: 'talvez', label: 'Talvez' },
  { value: 'nao', label: 'Nao' },
];

const PRIMARY_OBJECTIVE_OPTIONS: ActionInteractiveQuestion['options'] = [
  { value: 'economia', label: 'Economia' },
  { value: 'conforto', label: 'Conforto' },
  { value: 'sustentabilidade', label: 'Sustentabilidade' },
];

const ENERGY_DIAGNOSIS_QUESTIONS: EnergyDiagnosisQuestionDefinition[] = [
  {
    id: 'showers_count',
    levelRange: { min: 1, max: 5 },
    category: 'cargas',
    question: 'Quantos chuveiros eletricos entram na rotina?',
    options: COUNT_INTERACTIVE_OPTIONS,
    mapsToField: 'appliances.showers',
    whyItMatters: 'Banho eletrico costuma explicar uma parcela importante do consumo residencial.',
    followUpPriority: 1,
  },
  {
    id: 'air_conditioning_presence',
    levelRange: { min: 1, max: 5 },
    category: 'climatizacao',
    question: 'Tem ar-condicionado?',
    options: BOOLEAN_INTERACTIVE_OPTIONS,
    mapsToField: 'appliances.hasAirConditioning',
    whyItMatters: 'Climatizacao recorrente altera o custo medio e a leitura do consumo base.',
    followUpPriority: 2,
  },
  {
    id: 'extra_fridge_presence',
    levelRange: { min: 1, max: 5 },
    category: 'cargas',
    question: 'Tem segunda geladeira, freezer ou equipamento ligado 24h?',
    options: BOOLEAN_INTERACTIVE_OPTIONS,
    mapsToField: 'appliances.hasExtraFridge',
    whyItMatters: 'Carga continua ajuda a explicar consumo alto mesmo sem pico evidente.',
    followUpPriority: 3,
  },
  {
    id: 'laundry_frequency',
    levelRange: { min: 1, max: 5 },
    category: 'rotina',
    question: 'Usa maquina de lavar ou secar com frequencia?',
    options: LAUNDRY_INTERACTIVE_OPTIONS,
    mapsToField: 'habits.laundryFrequency',
    whyItMatters: 'Lavagem frequente pode deslocar consumo e ampliar custo por kWh.',
    followUpPriority: 4,
  },
  {
    id: 'electric_shower_presence',
    levelRange: { min: 1, max: 5 },
    category: 'cargas',
    question: 'Tem chuveiro eletrico?',
    options: BOOLEAN_INTERACTIVE_OPTIONS,
    mapsToField: 'appliances.hasElectricShower',
    whyItMatters: 'Confirma se a rotina de banho deve seguir como hipotese forte.',
    followUpPriority: 5,
  },
  {
    id: 'dominant_usage_period',
    levelRange: { min: 6, max: 10 },
    category: 'horarios',
    question: 'Em qual periodo a casa mais usa energia?',
    options: ROUTINE_PERIOD_OPTIONS,
    mapsToField: 'habits.dominantUsageRoutine',
    whyItMatters: 'Ajuda a localizar concentracao de uso sem inventar dado de fatura.',
    followUpPriority: 1,
  },
  {
    id: 'peak_window_intensity',
    levelRange: { min: 6, max: 10 },
    category: 'horarios',
    question: 'Entre 18h e 22h ha uso intenso de chuveiro, cozinha ou lavanderia?',
    options: PEAK_INTENSITY_OPTIONS,
    mapsToField: 'habits.peakWindowIntensity',
    whyItMatters: 'Sinaliza risco de concentracao no horario caro quando a fatura ainda nao prova isso.',
    followUpPriority: 2,
  },
  {
    id: 'peak_household_presence',
    levelRange: { min: 6, max: 10 },
    category: 'rotina',
    question: 'A maioria dos moradores fica em casa no fim da tarde/noite?',
    options: HOUSEHOLD_PRESENCE_OPTIONS,
    mapsToField: 'habits.householdPeakPresence',
    whyItMatters: 'Mostra se o padrao da casa favorece sobreposicao de cargas no mesmo horario.',
    followUpPriority: 3,
  },
  {
    id: 'heavy_loads_at_night',
    levelRange: { min: 6, max: 10 },
    category: 'perfil_de_consumo',
    question: 'Voce usa cargas fortes mais a noite?',
    options: BOOLEAN_INTERACTIVE_OPTIONS,
    mapsToField: 'habits.usesHeavyLoadsAtNight',
    whyItMatters: 'Complementa a leitura de pico com comportamento informado.',
    followUpPriority: 4,
  },
  {
    id: 'climate_usage_intensity',
    levelRange: { min: 11, max: 15 },
    category: 'climatizacao',
    question: 'Usa aquecimento ou ar-condicionado por muitas horas?',
    options: CLIMATE_USAGE_OPTIONS,
    mapsToField: 'habits.climateUsageIntensity',
    whyItMatters: 'Prepara recomendacoes de conforto e climatizacao com mais confianca.',
    followUpPriority: 1,
  },
  {
    id: 'thermal_instability',
    levelRange: { min: 11, max: 15 },
    category: 'climatizacao',
    question: 'O imovel esquenta ou esfria muito facil?',
    options: THERMAL_SENSITIVITY_OPTIONS,
    mapsToField: 'habits.thermalSensitivity',
    whyItMatters: 'Ajuda a separar consumo estrutural de simples uso de equipamento.',
    followUpPriority: 2,
  },
  {
    id: 'thermal_comfort_interest',
    levelRange: { min: 11, max: 15 },
    category: 'intencao',
    question: 'Ha interesse em melhorar conforto termico?',
    options: INTEREST_OPTIONS,
    mapsToField: 'intentions.thermalComfortInterest',
    whyItMatters: 'Qualifica recomendacoes de conforto sem parecer venda agressiva.',
    followUpPriority: 3,
  },
  {
    id: 'solar_analysis_interest',
    levelRange: { min: 16 },
    category: 'intencao',
    question: 'Voce teria interesse em analise solar?',
    options: INTEREST_OPTIONS,
    mapsToField: 'intentions.solarAnalysisInterest',
    whyItMatters: 'Qualifica interesse futuro em energia solar.',
    followUpPriority: 1,
  },
  {
    id: 'consultant_interest',
    levelRange: { min: 16 },
    category: 'intencao',
    question: 'Voce gostaria de receber indicacao de consultor?',
    options: INTEREST_OPTIONS,
    mapsToField: 'intentions.consultantInterest',
    whyItMatters: 'Mostra abertura para contato consultivo futuro.',
    followUpPriority: 2,
  },
  {
    id: 'primary_objective',
    levelRange: { min: 16 },
    category: 'intencao',
    question: 'Seu objetivo principal e economizar, conforto ou sustentabilidade?',
    options: PRIMARY_OBJECTIVE_OPTIONS,
    mapsToField: 'intentions.primaryObjective',
    whyItMatters: 'Direciona a linguagem e o proximo passo de valor.',
    followUpPriority: 3,
  },
];

const hasPromptBeenAnswered = (
  energyBehaviorProfile: EnergyBehaviorProfile,
  questionId: ActionInteractiveQuestion['id']
) =>
  Boolean(energyBehaviorProfile.actionMemory.answeredActionPrompts?.[questionId]);

const getDiagnosisQuestionById = (questionId: ActionInteractiveQuestion['id']) =>
  ENERGY_DIAGNOSIS_QUESTIONS.find((question) => question.id === questionId);

const getDiagnosisAnswerValue = (
  energyBehaviorProfile: EnergyBehaviorProfile,
  questionId: ActionInteractiveQuestion['id']
) => {
  if (questionId === 'showers_count') {
    if (!hasNumericValue(energyBehaviorProfile.appliances.showers)) {
      return undefined;
    }

    return energyBehaviorProfile.appliances.showers >= 2
      ? '2+'
      : energyBehaviorProfile.appliances.showers === 1
        ? '1'
        : '0';
  }

  if (questionId === 'electric_shower_presence') {
    return hasBooleanValue(energyBehaviorProfile.appliances.hasElectricShower)
      ? energyBehaviorProfile.appliances.hasElectricShower
        ? 'yes'
        : 'no'
      : undefined;
  }

  if (questionId === 'air_conditioning_presence') {
    return hasBooleanValue(energyBehaviorProfile.appliances.hasAirConditioning)
      ? energyBehaviorProfile.appliances.hasAirConditioning
        ? 'yes'
        : 'no'
      : undefined;
  }

  if (questionId === 'extra_fridge_presence') {
    return hasBooleanValue(energyBehaviorProfile.appliances.hasExtraFridge)
      ? energyBehaviorProfile.appliances.hasExtraFridge
        ? 'yes'
        : 'no'
      : undefined;
  }

  if (questionId === 'heavy_loads_at_night') {
    return hasBooleanValue(energyBehaviorProfile.habits.usesHeavyLoadsAtNight)
      ? energyBehaviorProfile.habits.usesHeavyLoadsAtNight
        ? 'yes'
        : 'no'
      : undefined;
  }

  if (questionId === 'laundry_frequency') {
    return energyBehaviorProfile.habits.laundryFrequency;
  }

  if (questionId === 'dominant_usage_period') {
    return energyBehaviorProfile.habits.dominantUsageRoutine;
  }

  if (questionId === 'peak_window_intensity') {
    return energyBehaviorProfile.habits.peakWindowIntensity;
  }

  if (questionId === 'peak_household_presence') {
    return energyBehaviorProfile.habits.householdPeakPresence;
  }

  if (questionId === 'climate_usage_intensity') {
    return energyBehaviorProfile.habits.climateUsageIntensity;
  }

  if (questionId === 'thermal_instability') {
    return energyBehaviorProfile.habits.thermalSensitivity;
  }

  if (questionId === 'thermal_comfort_interest') {
    return energyBehaviorProfile.intentions.thermalComfortInterest;
  }

  if (questionId === 'solar_analysis_interest') {
    return energyBehaviorProfile.intentions.solarAnalysisInterest;
  }

  if (questionId === 'consultant_interest') {
    return energyBehaviorProfile.intentions.consultantInterest;
  }

  if (questionId === 'primary_objective') {
    return energyBehaviorProfile.intentions.primaryObjective;
  }

  return undefined;
};

const isBehaviorQuestionSatisfied = (
  energyBehaviorProfile: EnergyBehaviorProfile,
  questionId: ActionInteractiveQuestion['id']
) =>
  Boolean(
    getDiagnosisAnswerValue(energyBehaviorProfile, questionId) ||
      hasPromptBeenAnswered(energyBehaviorProfile, questionId)
  );

const formatDiagnosisSummaryFromValue = (
  questionId: ActionInteractiveQuestion['id'],
  answer?: string
) => {
  if (!answer) {
    return undefined;
  }

  return formatAdaptiveAnswerValue(questionId, answer);
};

const buildBehaviorHighlights = (
  energyBehaviorProfile: EnergyBehaviorProfile
) => {
  const highlights: string[] = [];

  if (hasNumericValue(energyBehaviorProfile.appliances.showers)) {
    highlights.push(
      `${energyBehaviorProfile.appliances.showers} ${energyBehaviorProfile.appliances.showers === 1 ? 'chuveiro informado' : 'chuveiros informados'}`
    );
  }

  if (energyBehaviorProfile.appliances.hasElectricShower === true) {
    highlights.push('chuveiro eletrico informado');
  }

  if (energyBehaviorProfile.appliances.hasAirConditioning === true) {
    highlights.push('ar-condicionado informado');
  }

  if (energyBehaviorProfile.appliances.hasExtraFridge === true) {
    highlights.push('segunda geladeira ou freezer informado');
  }

  if (energyBehaviorProfile.habits.usesHeavyLoadsAtNight === true) {
    highlights.push('cargas fortes a noite informadas');
  }

  if (energyBehaviorProfile.habits.laundryFrequency) {
    const laundryLabel =
      energyBehaviorProfile.habits.laundryFrequency === 'baixa'
        ? 'lavagem com pouca frequencia'
        : energyBehaviorProfile.habits.laundryFrequency === 'media'
          ? 'lavagem com frequencia media'
          : energyBehaviorProfile.habits.laundryFrequency === 'alta'
            ? 'lavagem frequente'
            : undefined;

    if (laundryLabel) {
      highlights.push(laundryLabel);
    }
  }

  if (energyBehaviorProfile.habits.dominantUsageRoutine) {
    const routineLabel =
      energyBehaviorProfile.habits.dominantUsageRoutine === 'manha'
        ? 'uso concentrado pela manha'
        : energyBehaviorProfile.habits.dominantUsageRoutine === 'tarde'
          ? 'uso concentrado pela tarde'
          : energyBehaviorProfile.habits.dominantUsageRoutine === 'noite'
            ? 'uso concentrado pela noite'
            : energyBehaviorProfile.habits.dominantUsageRoutine === 'misto'
              ? 'uso distribuido ao longo do dia'
              : undefined;

    if (routineLabel) {
      highlights.push(routineLabel);
    }
  }

  if (energyBehaviorProfile.habits.peakWindowIntensity === 'sim') {
    highlights.push('uso intenso entre 18h e 22h informado');
  } else if (energyBehaviorProfile.habits.peakWindowIntensity === 'as_vezes') {
    highlights.push('uso parcial entre 18h e 22h informado');
  }

  if (energyBehaviorProfile.habits.climateUsageIntensity === 'sim') {
    highlights.push('climatizacao por muitas horas informada');
  } else if (energyBehaviorProfile.habits.climateUsageIntensity === 'sazonal') {
    highlights.push('climatizacao sazonal informada');
  }

  if (energyBehaviorProfile.intentions.solarAnalysisInterest === 'sim') {
    highlights.push('interesse em analise solar');
  }

  if (energyBehaviorProfile.intentions.primaryObjective) {
    const objectiveLabel =
      energyBehaviorProfile.intentions.primaryObjective === 'economia'
        ? 'objetivo principal: economia'
        : energyBehaviorProfile.intentions.primaryObjective === 'conforto'
          ? 'objetivo principal: conforto'
          : energyBehaviorProfile.intentions.primaryObjective === 'sustentabilidade'
            ? 'objetivo principal: sustentabilidade'
            : undefined;

    if (objectiveLabel) {
      highlights.push(objectiveLabel);
    }
  }

  return highlights.slice(0, 6);
};

const buildKnownBehaviorSummary = (
  energyBehaviorProfile: EnergyBehaviorProfile
) =>
  buildBehaviorHighlights(energyBehaviorProfile);

const getAnsweredDiagnosisCount = (energyBehaviorProfile: EnergyBehaviorProfile) =>
  ENERGY_DIAGNOSIS_QUESTIONS.filter((question) =>
    isBehaviorQuestionSatisfied(energyBehaviorProfile, question.id)
  ).length;

const getDiagnosisLevel = (energyBehaviorProfile: EnergyBehaviorProfile) => {
  const answeredCount = getAnsweredDiagnosisCount(energyBehaviorProfile);

  if (answeredCount >= 15) {
    return 16;
  }

  return answeredCount + 1;
};

const isQuestionInCurrentLevel = (
  question: EnergyDiagnosisQuestionDefinition,
  currentLevel: number
) =>
  currentLevel >= question.levelRange.min &&
  (question.levelRange.max === undefined || currentLevel <= question.levelRange.max);

const getActionDiagnosisCategories = (actionTitle: string) => {
  const normalizedTitle = normalizeForMatch(actionTitle);

  if (normalizedTitle.includes('deslocar uso fora do pico')) {
    return ['horarios', 'rotina', 'perfil_de_consumo'] as const;
  }

  if (normalizedTitle.includes('mapear chuveiro e climatizacao')) {
    return ['cargas', 'climatizacao'] as const;
  }

  if (normalizedTitle.includes('revisar cargas fixas')) {
    return ['cargas', 'perfil_de_consumo'] as const;
  }

  if (normalizedTitle.includes('testar economia por 7 dias')) {
    return ['cargas', 'horarios', 'rotina'] as const;
  }

  if (normalizedTitle.includes('completar diagnostico rapido')) {
    return ['cargas', 'horarios', 'climatizacao', 'rotina', 'perfil_de_consumo', 'intencao'] as const;
  }

  if (normalizedTitle.includes('comparar proxima fatura')) {
    return ['perfil_de_consumo', 'intencao'] as const;
  }

  return ['cargas', 'rotina'] as const;
};

const buildDiagnosisTrailForAction = (
  actionTitle: string,
  energyBehaviorProfile: EnergyBehaviorProfile
) => {
  const currentLevel = getDiagnosisLevel(energyBehaviorProfile);
  const normalizedActionTitle = normalizeForMatch(actionTitle);
  const preferredCategories = getActionDiagnosisCategories(actionTitle);
  const unansweredCurrentLevelQuestions = ENERGY_DIAGNOSIS_QUESTIONS.filter(
    (question) =>
      preferredCategories.includes(question.category) &&
      isQuestionInCurrentLevel(question, currentLevel) &&
      !isBehaviorQuestionSatisfied(energyBehaviorProfile, question.id)
  ).sort((left, right) => left.followUpPriority - right.followUpPriority);
  const unansweredPreferredQuestions = ENERGY_DIAGNOSIS_QUESTIONS.filter(
    (question) =>
      preferredCategories.includes(question.category) &&
      !isBehaviorQuestionSatisfied(energyBehaviorProfile, question.id)
  ).sort((left, right) => {
    const leftDistance = Math.abs(left.levelRange.min - currentLevel);
    const rightDistance = Math.abs(right.levelRange.min - currentLevel);

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }

    return left.followUpPriority - right.followUpPriority;
  });
  const fallbackCurrentLevelQuestions = normalizedActionTitle.includes('completar diagnostico rapido')
    ? ENERGY_DIAGNOSIS_QUESTIONS.filter(
        (question) =>
          isQuestionInCurrentLevel(question, currentLevel) &&
          !isBehaviorQuestionSatisfied(energyBehaviorProfile, question.id)
      ).sort((left, right) => left.followUpPriority - right.followUpPriority)
    : [];
  const rankedTrail = [
    ...unansweredCurrentLevelQuestions,
    ...unansweredPreferredQuestions,
    ...fallbackCurrentLevelQuestions,
  ].filter(
    (question, index, collection) =>
      collection.findIndex((currentQuestion) => currentQuestion.id === question.id) === index
  );
  const interactiveQuestions = rankedTrail.map((question) =>
    createInteractiveQuestion(question.id, question.question, question.options, question.whyItMatters)
  );
  const answeredQuestions = ENERGY_DIAGNOSIS_QUESTIONS.filter(
    (question) =>
      preferredCategories.includes(question.category) &&
      isBehaviorQuestionSatisfied(energyBehaviorProfile, question.id)
  )
    .sort((left, right) => left.followUpPriority - right.followUpPriority);
  const answeredQuestionSummaries = answeredQuestions
    .slice(0, 2)
    .map((question) =>
      formatDiagnosisSummaryFromValue(
        question.id,
        getDiagnosisAnswerValue(energyBehaviorProfile, question.id)
      )
    )
    .filter((summary): summary is string => Boolean(summary));
  const totalQuestionsForAction = answeredQuestions.length + interactiveQuestions.length;
  const diagnosticProgress =
    totalQuestionsForAction > 0
      ? {
          current: answeredQuestions.length,
          total: totalQuestionsForAction,
          level: currentLevel,
          completed: interactiveQuestions.length === 0,
        }
      : undefined;

  return {
    answeredQuestionSummaries,
    diagnosticProgress,
    interactiveQuestions,
  };
};

const buildRecommendationDataPoints = ({
  invoice,
  invoiceEvidence,
  resolvedProfile,
  energyBehaviorProfile,
}: {
  invoice?: InvoiceData;
  invoiceEvidence?: InvoiceDerivedEvidence;
  resolvedProfile: UserProfileData;
  energyBehaviorProfile: EnergyBehaviorProfile;
}) => {
  const points: string[] = [];

  if (invoice && hasNumericValue(invoice.consumption)) {
    points.push(
      invoiceEvidence?.daysBilled
        ? `${formatKwhValue(invoice.consumption)} em ${invoiceEvidence.daysBilled} dias`
        : `${formatKwhValue(invoice.consumption)}`
    );
  }

  if (hasNumericValue(invoiceEvidence?.averageCostPerKwh)) {
    points.push(`custo medio ${formatCurrencyPerKwh(invoiceEvidence.averageCostPerKwh)}`);
  }

  if (invoiceEvidence?.peakWindowLabel && hasNumericValue(invoiceEvidence.peakConsumptionKwh)) {
    points.push(
      `${formatKwhValue(invoiceEvidence.peakConsumptionKwh)} no pico${hasNumericValue(invoiceEvidence.offPeakConsumptionKwh) ? ` e ${formatKwhValue(invoiceEvidence.offPeakConsumptionKwh)} fora do pico` : ''}`
    );
  }

  points.push(
    `perfil: ${resolvedProfile.consumerType.toLowerCase()}, ${resolvedProfile.peopleCount} ${resolvedProfile.peopleCount === 1 ? 'pessoa' : 'pessoas'}`
  );

  buildBehaviorHighlights(energyBehaviorProfile).forEach((highlight) => {
    points.push(`informado: ${highlight}`);
  });

  return points.slice(0, 5);
};

const formatAdaptiveAnswerValue = (questionId: string, answer: string) => {
  if (questionId === 'showers_count') {
    return answer === '2+' ? '2+ chuveiros' : answer === '1' ? '1 chuveiro' : '0 chuveiros';
  }

  if (questionId === 'electric_shower_presence') {
    return answer === 'yes' ? 'chuveiro eletrico: sim' : 'chuveiro eletrico: nao';
  }

  if (questionId === 'air_conditioning_presence') {
    return answer === 'yes' ? 'ar-condicionado: sim' : 'ar-condicionado: nao';
  }

  if (questionId === 'extra_fridge_presence') {
    return answer === 'yes' ? 'segunda geladeira/freezer: sim' : 'segunda geladeira/freezer: nao';
  }

  if (questionId === 'heavy_loads_at_night') {
    return answer === 'yes' ? 'uso forte a noite: sim' : 'uso forte a noite: nao';
  }

  if (questionId === 'laundry_frequency') {
    return answer === 'alta'
      ? 'lavagem frequente: alta'
      : answer === 'media'
        ? 'lavagem frequente: media'
        : 'lavagem frequente: baixa';
  }

  if (questionId === 'dominant_usage_period') {
    return answer === 'manha'
      ? 'uso concentrado pela manha'
      : answer === 'tarde'
        ? 'uso concentrado pela tarde'
        : answer === 'noite'
          ? 'uso concentrado pela noite'
          : 'uso misto ao longo do dia';
  }

  if (questionId === 'peak_window_intensity') {
    return answer === 'sim'
      ? 'uso intenso entre 18h e 22h'
      : answer === 'as_vezes'
        ? 'uso parcial entre 18h e 22h'
        : 'sem uso intenso entre 18h e 22h';
  }

  if (questionId === 'peak_household_presence') {
    return answer === 'sim'
      ? 'moradores em casa no fim da tarde/noite: sim'
      : answer === 'parcial'
        ? 'moradores em casa no fim da tarde/noite: parcial'
        : 'moradores em casa no fim da tarde/noite: nao';
  }

  if (questionId === 'climate_usage_intensity') {
    return answer === 'sim'
      ? 'climatizacao por muitas horas'
      : answer === 'sazonal'
        ? 'climatizacao sazonal'
        : 'sem uso intenso de climatizacao';
  }

  if (questionId === 'thermal_instability') {
    return answer === 'sim'
      ? 'imovel com alta sensibilidade termica'
      : answer === 'nao_sei'
        ? 'sensibilidade termica: nao sei'
        : 'imovel sem alta sensibilidade termica';
  }

  if (questionId === 'thermal_comfort_interest') {
    return answer === 'sim'
      ? 'interesse em conforto termico: sim'
      : answer === 'talvez'
        ? 'interesse em conforto termico: talvez'
        : 'interesse em conforto termico: nao';
  }

  if (questionId === 'solar_analysis_interest') {
    return answer === 'sim'
      ? 'interesse em analise solar: sim'
      : answer === 'talvez'
        ? 'interesse em analise solar: talvez'
        : 'interesse em analise solar: nao';
  }

  if (questionId === 'consultant_interest') {
    return answer === 'sim'
      ? 'interesse em consultor: sim'
      : answer === 'talvez'
        ? 'interesse em consultor: talvez'
        : 'interesse em consultor: nao';
  }

  if (questionId === 'primary_objective') {
    return `objetivo principal: ${answer}`;
  }

  return answer;
};

const buildAdaptiveAnswerInsight = (questionId: string, answer: string) => {
  if (questionId === 'showers_count') {
    if (answer === '2+') {
      return 'Com 2+ chuveiros, banho vira hipotese principal.';
    }

    if (answer === '1') {
      return 'Com 1 chuveiro, banho segue no radar, mas nao explica sozinho todo o consumo.';
    }

    return 'Sem chuveiro nessa rotina, o foco volta para outras cargas da casa.';
  }

  if (questionId === 'electric_shower_presence') {
    return answer === 'yes'
      ? 'Com chuveiro eletrico informado, banho entra como hipotese relevante nas proximas acoes.'
      : 'Sem chuveiro eletrico informado, a leitura fica menos dependente da rotina de banho.';
  }

  if (questionId === 'air_conditioning_presence') {
    return answer === 'yes'
      ? 'Com ar-condicionado informado, climatizacao entra no radar.'
      : 'Sem ar-condicionado informado, o foco volta para padrao historico e custo por kWh.';
  }

  if (questionId === 'extra_fridge_presence') {
    return answer === 'yes'
      ? 'Com carga extra informada, revisaremos consumo base e uso continuo nas proximas acoes.'
      : 'Sem carga extra informada, o foco volta para padrao historico e custo por kWh.';
  }

  if (questionId === 'heavy_loads_at_night') {
    return answer === 'yes'
      ? 'Com uso forte a noite, horarios entram no foco da proxima recomendacao.'
      : 'Sem uso forte a noite informado, o foco sai do habito noturno e volta para outras rotinas.';
  }

  if (questionId === 'laundry_frequency') {
    if (answer === 'alta') {
      return 'Com lavagem frequente, a rotina da maquina entra como hipotese relevante.';
    }

    if (answer === 'media') {
      return 'Com lavagem em frequencia media, a maquina segue no radar sem virar causa principal sozinha.';
    }

    return 'Com lavagem baixa, o foco fica mais livre para outras cargas e horarios.';
  }

  if (questionId === 'dominant_usage_period') {
    return answer === 'noite'
      ? 'Com uso concentrado a noite, vamos tratar a faixa mais cara como ponto de atencao potencial.'
      : answer === 'misto'
        ? 'Com uso distribuido ao longo do dia, o diagnostico precisa olhar combinacao de cargas e custo medio.'
        : 'Com esse horario informado, vamos cruzar rotina com consumo antes de apontar uma causa.';
  }

  if (questionId === 'peak_window_intensity') {
    return answer === 'sim'
      ? 'Com uso intenso entre 18h e 22h, a rotina desse horario entra como hipotese relevante.'
      : answer === 'as_vezes'
        ? 'Com uso parcial entre 18h e 22h, o risco de concentracao existe, mas ainda precisa de contexto adicional.'
        : 'Sem uso intenso entre 18h e 22h, o foco volta para consumo base e custo medio.';
  }

  if (questionId === 'peak_household_presence') {
    return answer === 'sim'
      ? 'Com mais moradores em casa nesse horario, a sobreposicao de cargas ganha peso no diagnostico.'
      : answer === 'parcial'
        ? 'Com presenca parcial no fim da tarde/noite, a carga pode estar dividida entre rotina e equipamentos fixos.'
        : 'Sem concentracao de moradores nesse horario, o foco volta para cargas continuas e padrao historico.';
  }

  if (questionId === 'climate_usage_intensity') {
    return answer === 'sim'
      ? 'Com climatizacao por muitas horas, conforto termico passa a influenciar mais as proximas acoes.'
      : answer === 'sazonal'
        ? 'Com climatizacao sazonal, esse fator entra como contexto, mas nao como causa principal em todos os ciclos.'
        : 'Sem uso intenso de climatizacao, o foco volta para cargas principais e rotina.';
  }

  if (questionId === 'thermal_instability') {
    return answer === 'sim'
      ? 'Com sensibilidade termica informada, recomendacoes de conforto ganham prioridade consultiva.'
      : answer === 'nao_sei'
        ? 'Com esse ponto ainda indefinido, o sistema segue priorizando sinais de uso e custo.'
        : 'Sem sensibilidade termica marcante, a leitura fica mais centrada na rotina e nas cargas.';
  }

  if (questionId === 'thermal_comfort_interest') {
    return answer === 'sim'
      ? 'Com interesse em conforto termico, o diagnostico passa a abrir espaco para recomendacoes de conforto.'
      : answer === 'talvez'
        ? 'Com interesse parcial em conforto, podemos equilibrar economia e bem-estar nas proximas sugestoes.'
        : 'Sem foco em conforto termico agora, a prioridade segue em consumo e custo.';
  }

  if (questionId === 'solar_analysis_interest') {
    return answer === 'sim'
      ? 'Com interesse solar informado, energia solar entra no radar das proximas recomendacoes.'
      : answer === 'talvez'
        ? 'Com interesse solar em aberto, vale amadurecer o diagnostico antes de qualquer passo consultivo.'
        : 'Sem interesse solar por enquanto, o foco segue em ganho direto de rotina e custo.';
  }

  if (questionId === 'consultant_interest') {
    return answer === 'sim'
      ? 'Com abertura para consultor, o perfil ganha sinal claro de qualificacao futura.'
      : answer === 'talvez'
        ? 'Com abertura parcial para consultor, o sistema pode amadurecer mais contexto antes de sugerir contato.'
        : 'Sem interesse em consultor agora, o foco segue em autonomia e proximas acoes do app.';
  }

  if (questionId === 'primary_objective') {
    return answer === 'economia'
      ? 'Com foco em economia, as proximas recomendacoes vao priorizar reducao de custo.'
      : answer === 'conforto'
        ? 'Com foco em conforto, as proximas recomendacoes vao equilibrar bem-estar e eficiencia.'
        : 'Com foco em sustentabilidade, as proximas recomendacoes vao reforcar escolhas de menor impacto.';
  }

  return 'Usarei isso nas proximas recomendacoes.';
};

export interface MemoryFeedbackCopy {
  badgeLabel: string;
  ctaLabel?: string;
  message: string;
}

const DEFAULT_MEMORY_FEEDBACK_MESSAGE = 'Agora entendemos melhor sua rotina de consumo.';

export const buildMemoryFeedback = (
  questionId: string,
  answer: string,
  _energyBehaviorProfile?: Partial<EnergyBehaviorProfile>
): MemoryFeedbackCopy => {
  const normalizedAnswer = normalizeForMatch(answer);
  const sharedFeedback = {
    badgeLabel: 'Memoria atualizada',
    ctaLabel: 'Ver memoria',
  } as const;

  if (questionId === 'showers_count') {
    return {
      ...sharedFeedback,
      message:
        normalizedAnswer === '0'
          ? 'Agora conseguimos separar melhor o consumo da casa sem depender da rotina de banho.'
          : 'Agora conseguimos considerar melhor o impacto do banho no seu consumo.',
    };
  }

  if (questionId === 'electric_shower_presence' || questionId === 'electric_shower') {
    return {
      ...sharedFeedback,
      message:
        normalizedAnswer === 'no' || normalizedAnswer === 'none'
          ? 'Agora conseguimos separar melhor o consumo da casa sem depender da rotina de banho.'
          : 'Agora conseguimos considerar melhor o impacto do banho no seu consumo.',
    };
  }

  if (
    questionId === 'air_conditioning_presence' ||
    questionId === 'climate_usage_intensity'
  ) {
    return {
      ...sharedFeedback,
      message:
        normalizedAnswer === 'no' || normalizedAnswer === 'nao'
          ? 'Agora conseguimos calibrar melhor o peso da climatizacao no seu consumo.'
          : 'Agora conseguimos avaliar melhor o peso da climatizacao no seu consumo.',
    };
  }

  if (questionId === 'extra_fridge_presence') {
    return {
      ...sharedFeedback,
      message: 'Agora conseguimos avaliar melhor o peso das cargas continuas no consumo da casa.',
    };
  }

  if (questionId === 'heavy_loads_at_night') {
    return {
      ...sharedFeedback,
      message:
        normalizedAnswer === 'yes'
          ? 'Agora conseguimos cruzar melhor seu uso noturno com a leitura da conta.'
          : 'Agora conseguimos separar melhor o que pesa no consumo fora da noite.',
    };
  }

  if (questionId === 'laundry_frequency') {
    return {
      ...sharedFeedback,
      message: 'Agora conseguimos considerar melhor a rotina de lavagem no seu consumo.',
    };
  }

  if (questionId === 'dominant_usage_period' || questionId === 'usage_period') {
    return {
      ...sharedFeedback,
      message:
        normalizedAnswer === 'night' || normalizedAnswer === 'noite'
          ? 'Agora conseguimos cruzar melhor seu horario de maior uso com a leitura da conta.'
          : 'Agora conseguimos entender melhor quando sua rotina de consumo pesa mais.',
    };
  }

  if (questionId === 'peak_window_intensity' || questionId === 'peak_household_presence') {
    return {
      ...sharedFeedback,
      message: 'Agora conseguimos avaliar melhor a concentracao de uso no fim da tarde e a noite.',
    };
  }

  if (questionId === 'thermal_instability') {
    return {
      ...sharedFeedback,
      message: 'Agora conseguimos considerar melhor como temperatura e conforto entram na sua rotina.',
    };
  }

  if (questionId === 'thermal_comfort_interest') {
    return {
      ...sharedFeedback,
      message: 'Agora conseguimos equilibrar economia e conforto nas proximas recomendacoes.',
    };
  }

  if (questionId === 'solar_analysis_interest') {
    return {
      ...sharedFeedback,
      message: 'Agora conseguimos entender melhor sua abertura para solucoes de geracao propria.',
    };
  }

  if (questionId === 'consultant_interest') {
    return {
      ...sharedFeedback,
      message: 'Agora conseguimos entender melhor seu momento para apoio consultivo.',
    };
  }

  if (questionId === 'primary_objective' || questionId === 'primary_goal') {
    return {
      ...sharedFeedback,
      message: 'Agora conseguimos alinhar melhor as proximas recomendacoes com seu objetivo principal.',
    };
  }

  const adaptiveInsight = buildAdaptiveAnswerInsight(questionId, answer);

  return {
    ...sharedFeedback,
    message:
      adaptiveInsight === 'Usarei isso nas proximas recomendacoes.'
        ? DEFAULT_MEMORY_FEEDBACK_MESSAGE
        : adaptiveInsight,
  };
};

export const describeAdaptiveAnswer = (questionId: string, answer: string) => {
  const memoryFeedback = buildMemoryFeedback(questionId, answer);

  return {
    insight: memoryFeedback.message,
    microFeedback: memoryFeedback.badgeLabel,
    summary: formatAdaptiveAnswerValue(questionId, answer),
  };
};

const createInteractiveQuestion = (
  id: ActionInteractiveQuestion['id'],
  prompt: string,
  options: ActionInteractiveQuestion['options'],
  helperText?: string
): ActionInteractiveQuestion => ({
  id,
  prompt,
  options,
  helperText,
});

const buildInteractiveQuestionsForAction = ({
  actionTitle,
  energyBehaviorProfile,
}: {
  actionTitle: string;
  invoiceEvidence?: InvoiceDerivedEvidence;
  energyBehaviorProfile: EnergyBehaviorProfile;
}) => buildDiagnosisTrailForAction(actionTitle, energyBehaviorProfile).interactiveQuestions;

const shouldIncludeSecondaryAction = (
  primaryAction: ConsultiveInsightAction,
  secondaryAction?: ConsultiveInsightAction
) => {
  if (!secondaryAction) {
    return false;
  }

  const normalizedPrimaryTitle = normalizeForMatch(primaryAction.title);
  const normalizedSecondaryTitle = normalizeForMatch(secondaryAction.title);

  if (!normalizedSecondaryTitle || normalizedSecondaryTitle === normalizedPrimaryTitle) {
    return false;
  }

  const normalizedPrimaryReason = normalizeForMatch(primaryAction.reason);
  const normalizedSecondaryReason = normalizeForMatch(secondaryAction.reason);
  const normalizedPrimaryEvidence = normalizeForMatch(primaryAction.evidence);
  const normalizedSecondaryEvidence = normalizeForMatch(secondaryAction.evidence);
  const hasDistinctReason =
    normalizedSecondaryReason.length > 0 && normalizedSecondaryReason !== normalizedPrimaryReason;
  const hasDistinctEvidence =
    normalizedSecondaryEvidence.length > 0 &&
    normalizedSecondaryEvidence !== normalizedPrimaryEvidence;
  const isGenericComparisonFollowUp =
    normalizedSecondaryTitle === normalizeForMatch('Comparar proxima fatura');

  if (isGenericComparisonFollowUp && !hasDistinctReason && !hasDistinctEvidence) {
    return false;
  }

  return hasDistinctReason || hasDistinctEvidence;
};

const isFollowUpActionTitle = (title: string) =>
  [
    'comparar proxima fatura',
    'adicionar a proxima fatura',
  ].includes(normalizeForMatch(title));

const resolveActionCtaLabel = ({
  title,
  isPrimary,
  diagnosticProgress,
}: {
  title: string;
  isPrimary: boolean;
  diagnosticProgress?: ActionDiagnosticProgress;
}) => {
  if (isPrimary && diagnosticProgress) {
    return diagnosticProgress.completed ? 'Diagnostico atualizado' : 'Responder diagnostico';
  }

  return isFollowUpActionTitle(title) ? 'Preparar acompanhamento' : 'Comecar acao';
};

const buildConsumptionTotalConclusion = (
  currentConsumption: number,
  historyAverageConsumption: number
) => {
  const variation = (currentConsumption - historyAverageConsumption) / historyAverageConsumption;

  if (variation > 0.05) {
    return 'Este ciclo ficou acima da media do seu historico.';
  }

  if (variation < -0.05) {
    return 'Este ciclo ficou abaixo da media recente.';
  }

  return 'Este ciclo ficou proximo do seu padrao recente.';
};

const buildConsumptionTotalInterpretation = (
  currentConsumption: number,
  historyAverageConsumption: number
) => {
  const variation = (currentConsumption - historyAverageConsumption) / historyAverageConsumption;

  if (variation > 0.05) {
    return 'A comparacao com a media recente mostra um consumo acima do padrao.';
  }

  if (variation < -0.05) {
    return 'A comparacao com a media recente mostra um consumo abaixo do padrao.';
  }

  return 'A comparacao com a media recente mostra estabilidade no padrao de consumo.';
};

export const buildConsultiveInsight = (
  invoice: InvoiceData,
  invoiceHistory: InvoiceData[] = [],
  profile?: Partial<UserProfileData>,
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile>
): ConsultiveInsight => {
  const resolvedEnergyBehaviorProfile = getResolvedEnergyBehaviorProfile(energyBehaviorProfile);
  const averageCostPerKwh = getInvoiceCostPerKwh(invoice);
  const invoiceEvidence = getInvoiceEvidence(invoice, averageCostPerKwh);
  const previousInvoice = getPreviousInvoice(invoice, invoiceHistory);
  const comparisonSignals = previousInvoice
    ? buildBasicInvoiceSignals(invoice, previousInvoice)
    : undefined;
  const historyTrend = buildHistoryTrendSummary(invoice, previousInvoice, comparisonSignals);
  const historyAverageConsumption = getHistoricalConsumptionAverage(invoice, invoiceHistory);
  const historyAverageCostPerKwh = getHistoricalAverageCostPerKwh(invoice, invoiceHistory);
  const previousAverageCostPerKwh = previousInvoice ? getInvoiceCostPerKwh(previousInvoice) : undefined;
  const monthLabel = getInvoiceMonthLabel(invoice);
  const season = getSeasonFromMonth(monthLabel);
  const profileContext = buildProfileContext(profile);
  const behaviorHighlights = buildBehaviorHighlights(resolvedEnergyBehaviorProfile);
  const behaviorContextSentence =
    behaviorHighlights.length > 0
      ? `Contexto informado pelo usuario: ${behaviorHighlights.join('; ')}.`
      : undefined;
  const usedDataPoints = buildRecommendationDataPoints({
    invoice,
    invoiceEvidence,
    resolvedProfile: getResolvedProfile(profile),
    energyBehaviorProfile: resolvedEnergyBehaviorProfile,
  });
  const diagnosticQuestions = buildInteractiveQuestionsForAction({
    actionTitle: 'Completar diagnostico rapido',
    invoiceEvidence,
    energyBehaviorProfile: resolvedEnergyBehaviorProfile,
  });
  const warnings: string[] = [];

  if (!hasNumericValue(invoice.consumption)) {
    warnings.push('Consumo total indisponivel na fatura em foco.');
  }

  if (!previousInvoice) {
    warnings.push('Sem fatura anterior comparavel para tendencia imediata.');
  }

  if (!hasNumericValue(invoiceEvidence.averageCostPerKwh)) {
    warnings.push('Custo medio por kWh indisponivel nesta fatura.');
  }

  if (!hasNumericValue(invoiceEvidence.peakConsumptionKwh) && invoiceEvidence.peakWindowLabel) {
    warnings.push('Janela de pico identificada sem consumo confirmado no pico.');
  }

  if (!invoiceEvidence.tariffFlag) {
    warnings.push('Bandeira tarifaria ausente na fatura em foco.');
  }

  warnings.push(...profileContext.warnings);

  if (
    hasNumericValue(invoiceEvidence.peakConsumptionKwh) &&
    invoiceEvidence.peakConsumptionKwh > 0
  ) {
    const peakEvidence = `Encontramos ${formatKwhValue(invoiceEvidence.peakConsumptionKwh)} no horario de pico${hasNumericValue(invoiceEvidence.offPeakConsumptionKwh) ? ` e ${formatKwhValue(invoiceEvidence.offPeakConsumptionKwh)} fora do pico` : ''}.${invoiceEvidence.peakWindowLabel ? ` Horario de pico identificado: ${invoiceEvidence.peakWindowLabel}.` : ''}`;
    const hasPeakBehaviorContext =
      resolvedEnergyBehaviorProfile.appliances.hasElectricShower === true ||
      (resolvedEnergyBehaviorProfile.appliances.showers ?? 0) >= 1 ||
      resolvedEnergyBehaviorProfile.habits.usesHeavyLoadsAtNight === true ||
      resolvedEnergyBehaviorProfile.habits.dominantUsagePeriod === 'pico';
    const interpretation = invoiceEvidence.peakWindowLabel
      ? `Isso indica concentracao real de uso no pico, com janela ${invoiceEvidence.peakWindowLabel} confirmada pela propria fatura.`
      : 'Isso indica concentracao real de uso no pico confirmada pela propria fatura.';
    const conclusion = hasPeakBehaviorContext
      ? `A fatura registrou ${formatKwhValue(invoiceEvidence.peakConsumptionKwh)} no pico. Como habito informado, isso entra como hipotese para a proxima recomendacao.`
      : 'A melhor acao agora e refinar o diagnostico antes de apontar a principal causa.';
    const primaryTitle =
      diagnosticQuestions.length > 0 && !hasPeakBehaviorContext
        ? 'Completar diagnostico rapido'
        : 'Deslocar uso fora do pico';
    const reason =
      primaryTitle === 'Completar diagnostico rapido'
        ? 'Faltam alguns dados de rotina para explicar esse aumento no horario de pico.'
        : hasPeakBehaviorContext
          ? `A fatura registrou ${formatKwhValue(invoiceEvidence.peakConsumptionKwh)} no pico. Como habito informado, isso entra como hipotese para deslocar uso.`
          : `A fatura registrou ${formatKwhValue(invoiceEvidence.peakConsumptionKwh)} no pico, e a melhor acao agora e testar deslocamento de uso.`;

    return {
      environmentContext: { season },
      profileContext,
      mainDriver: 'pico',
      headline: conclusion,
      evidence: peakEvidence,
      interpretation: appendContextClause(
        appendContextClause(interpretation, behaviorContextSentence),
        profileContext.contextSentence
      ),
      conclusion,
      microEducation: invoiceEvidence.peakWindowLabel
        ? joinMicroEducation(
            `Horario de pico identificado: ${invoiceEvidence.peakWindowLabel}`,
            getProfileMicroEducationClause(profileContext)
          )
        : joinMicroEducation(
            'Horario de pico e a faixa em que cada kWh tende a custar mais.',
            getProfileMicroEducationClause(profileContext)
          ),
      primaryAction: buildInsightAction(
        primaryTitle,
        appendContextClause(reason, getProfileActionReasonClause(profileContext)),
        peakEvidence,
        primaryTitle === 'Completar diagnostico rapido'
          ? 'Responder diagnostico'
          : 'Comecar acao',
        buildInteractiveQuestionsForAction({
          actionTitle: primaryTitle,
          invoiceEvidence,
          energyBehaviorProfile: resolvedEnergyBehaviorProfile,
        }),
        usedDataPoints
      ),
      secondaryAction: buildInsightAction(
        'Comparar proxima fatura',
        appendContextClause(
          'Comparar a proxima fatura deve confirmar se a reducao no pico apareceu no ciclo seguinte.',
          profileContext.warnings[0]
        ),
        peakEvidence,
        'Preparar acompanhamento',
        buildInteractiveQuestionsForAction({
          actionTitle: 'Comparar proxima fatura',
          invoiceEvidence,
          energyBehaviorProfile: resolvedEnergyBehaviorProfile,
        }),
        usedDataPoints
      ),
      warnings,
      historyTrend,
    };
  }

  if (
    previousInvoice &&
    hasNumericValue(invoice.consumption) &&
    hasNumericValue(previousInvoice.consumption) &&
    invoice.consumption > previousInvoice.consumption * 1.1
  ) {
    const evidence = `O consumo subiu de ${formatKwhValue(previousInvoice.consumption)} para ${formatKwhValue(invoice.consumption)}.`;
    const showersAreRelevant = (resolvedEnergyBehaviorProfile.appliances.showers ?? 0) >= 2;
    const hasApplianceContext =
      showersAreRelevant ||
      resolvedEnergyBehaviorProfile.appliances.hasAirConditioning === true ||
      resolvedEnergyBehaviorProfile.appliances.hasElectricShower === true;
    const primaryTitle =
      diagnosticQuestions.length > 0 && !hasApplianceContext
        ? 'Completar diagnostico rapido'
        : showersAreRelevant || resolvedEnergyBehaviorProfile.appliances.hasAirConditioning === true
          ? 'Mapear chuveiro e climatizacao'
          : 'Revisar cargas fixas';

    return {
      environmentContext: { season },
      profileContext,
      mainDriver: 'aumento_historico',
      headline: 'O principal fator neste ciclo foi o aumento de consumo.',
      evidence,
      interpretation: appendContextClause(
        appendContextClause(
          `Isso indica uma mudanca concreta de rotina entre os dois ciclos. ${getSeasonalConsumptionContext(season)}`,
          showersAreRelevant
            ? 'Com 2 ou mais chuveiros informados, comparar a rotina de banho deve revelar parte da causa.'
            : behaviorContextSentence
        ),
        profileContext.contextSentence
      ),
      conclusion: showersAreRelevant
        ? 'O consumo ficou acima da media do historico. Com 2 ou mais chuveiros informados, comparar rotina de banho deve revelar parte da causa.'
        : 'O principal fator neste ciclo foi o aumento de consumo.',
      microEducation: joinMicroEducation(
        getSeasonalMicroEducation(season),
        getProfileMicroEducationClause(profileContext)
      ),
      primaryAction: buildInsightAction(
        primaryTitle,
        appendContextClause(
          primaryTitle === 'Completar diagnostico rapido'
            ? `O consumo subiu em ${monthLabel}. Faltam alguns dados de rotina para explicar esse aumento.`
            : primaryTitle === 'Mapear chuveiro e climatizacao'
              ? 'A melhor acao agora e mapear banho e climatizacao.'
              : 'A melhor acao agora e revisar as cargas fixas.',
          getProfileActionReasonClause(profileContext)
        ),
        evidence,
        primaryTitle === 'Completar diagnostico rapido'
          ? 'Responder diagnostico'
          : 'Comecar acao',
        buildInteractiveQuestionsForAction({
          actionTitle: primaryTitle,
          invoiceEvidence,
          energyBehaviorProfile: resolvedEnergyBehaviorProfile,
        }),
        usedDataPoints
      ),
      secondaryAction: buildInsightAction(
        'Comparar proxima fatura',
        appendContextClause(
          'Comparar a proxima fatura deve confirmar se o aumento foi pontual ou se virou tendencia.',
          profileContext.warnings[0]
        ),
        evidence,
        'Preparar acompanhamento',
        buildInteractiveQuestionsForAction({
          actionTitle: 'Comparar proxima fatura',
          invoiceEvidence,
          energyBehaviorProfile: resolvedEnergyBehaviorProfile,
        }),
        usedDataPoints
      ),
      warnings,
      historyTrend,
    };
  }

  const averageCostPerKwhIsRelevant =
    hasNumericValue(invoiceEvidence.averageCostPerKwh) &&
    (
      (hasNumericValue(previousAverageCostPerKwh) &&
        invoiceEvidence.averageCostPerKwh > previousAverageCostPerKwh * 1.08) ||
      (hasNumericValue(historyAverageCostPerKwh) &&
        invoiceEvidence.averageCostPerKwh > historyAverageCostPerKwh * 1.08) ||
      invoiceEvidence.averageCostPerKwh >= 1.1
    );

  if (averageCostPerKwhIsRelevant && hasNumericValue(invoiceEvidence.averageCostPerKwh)) {
    const evidence = `O custo medio ficou em ${formatCurrencyPerKwh(invoiceEvidence.averageCostPerKwh)}.`;
    const comparisonLine = hasNumericValue(historyAverageCostPerKwh)
      ? ` Ele ficou acima da media recente de ${formatCurrencyPerKwh(historyAverageCostPerKwh)}.`
      : hasNumericValue(previousAverageCostPerKwh)
        ? ` Ele ficou acima da fatura anterior, que estava em ${formatCurrencyPerKwh(previousAverageCostPerKwh)}.`
        : '';
    const hasCostContext =
      resolvedEnergyBehaviorProfile.appliances.hasAirConditioning === true ||
      resolvedEnergyBehaviorProfile.appliances.hasExtraFridge === true;
    const primaryTitle =
      diagnosticQuestions.length > 0 && !hasCostContext
        ? 'Completar diagnostico rapido'
        : 'Testar economia por 7 dias';

    return {
      environmentContext: { season },
      profileContext,
      mainDriver: 'custo_medio',
      headline: 'O principal fator neste ciclo foi o custo por kWh.',
      evidence: `${evidence}${comparisonLine}`.trim(),
      interpretation: appendContextClause(
        appendContextClause(
          'Isso indica que o custo por unidade consumida explica melhor a pressao desta conta.',
          hasCostContext
            ? 'Como voce informou ar-condicionado ou geladeira extra, vale testar reducao controlada desses usos por 7 dias.'
            : behaviorContextSentence
        ),
        profileContext.contextSentence
      ),
      conclusion: 'A prioridade agora e testar economia por 7 dias.',
      microEducation: joinMicroEducation(
        'Custo por kWh mostra quanto cada unidade consumida pesou no total da conta.',
        getProfileMicroEducationClause(profileContext)
      ),
      primaryAction: buildInsightAction(
        primaryTitle,
        appendContextClause(
          primaryTitle === 'Completar diagnostico rapido'
            ? `O custo por kWh ficou em ${formatCurrencyPerKwh(invoiceEvidence.averageCostPerKwh)}. Faltam alguns dados de rotina para explicar melhor essa pressao.`
            : hasCostContext
              ? 'Com esse custo por kWh e o equipamento informado, a melhor acao agora e testar economia por 7 dias.'
              : 'Com esse custo por kWh, a melhor acao agora e testar uma reducao simples por 7 dias.',
          getProfileActionReasonClause(profileContext)
        ),
        evidence,
        primaryTitle === 'Completar diagnostico rapido'
          ? 'Responder diagnostico'
          : 'Comecar acao',
        buildInteractiveQuestionsForAction({
          actionTitle: primaryTitle,
          invoiceEvidence,
          energyBehaviorProfile: resolvedEnergyBehaviorProfile,
        }),
        usedDataPoints
      ),
      secondaryAction: buildInsightAction(
        'Comparar proxima fatura',
        appendContextClause(
          'Comparar a proxima fatura deve mostrar se o teste mexeu no custo medio por kWh.',
          profileContext.warnings[0]
        ),
        evidence,
        'Preparar acompanhamento',
        buildInteractiveQuestionsForAction({
          actionTitle: 'Comparar proxima fatura',
          invoiceEvidence,
          energyBehaviorProfile: resolvedEnergyBehaviorProfile,
        }),
        usedDataPoints
      ),
      warnings,
      historyTrend,
    };
  }

  if (invoiceEvidence.tariffFlag) {
    const evidence = `A fatura em foco veio com bandeira ${invoiceEvidence.tariffFlag.toLowerCase()}.`;

    return {
      environmentContext: { season },
      profileContext,
      mainDriver: 'bandeira',
      headline: 'O principal fator neste ciclo foi o contexto tarifario.',
      evidence,
      interpretation: appendContextClause(
        appendContextClause(
          'Isso indica pressao tarifaria adicional neste ciclo, sem substituir a evidencia principal da fatura.',
          behaviorContextSentence
        ),
        profileContext.contextSentence
      ),
      conclusion: 'O principal fator neste ciclo foi o contexto tarifario.',
      microEducation: joinMicroEducation(
        'Bandeira tarifaria indica custo adicional na geracao de energia.',
        getProfileMicroEducationClause(profileContext)
      ),
      primaryAction: buildInsightAction(
        'Testar economia por 7 dias',
        appendContextClause(
          `A bandeira ${invoiceEvidence.tariffFlag.toLowerCase()} torna um teste curto de economia a melhor resposta deste ciclo.`,
          getProfileActionReasonClause(profileContext)
        ),
        evidence,
        'Comecar acao',
        buildInteractiveQuestionsForAction({
          actionTitle: 'Testar economia por 7 dias',
          invoiceEvidence,
          energyBehaviorProfile: resolvedEnergyBehaviorProfile,
        }),
        usedDataPoints
      ),
      secondaryAction: buildInsightAction(
        'Comparar proxima fatura',
        appendContextClause(
          'Comparar a proxima fatura deve mostrar se o contexto tarifario continua no ciclo seguinte.',
          profileContext.warnings[0]
        ),
        evidence,
        'Preparar acompanhamento',
        buildInteractiveQuestionsForAction({
          actionTitle: 'Comparar proxima fatura',
          invoiceEvidence,
          energyBehaviorProfile: resolvedEnergyBehaviorProfile,
        }),
        usedDataPoints
      ),
      warnings,
      historyTrend,
    };
  }

  if (
    hasNumericValue(invoice.consumption) &&
    hasNumericValue(historyAverageConsumption)
  ) {
    const evidence = `A media recente ficou em ${formatKwhValue(historyAverageConsumption)}, enquanto ${monthLabel} registrou ${formatKwhValue(invoice.consumption)}.`;
    const conclusion = buildConsumptionTotalConclusion(
      invoice.consumption,
      historyAverageConsumption
    );
    const interpretation = buildConsumptionTotalInterpretation(
      invoice.consumption,
      historyAverageConsumption
    );
    const primaryActionTitle =
      diagnosticQuestions.length > 0 &&
      !resolvedEnergyBehaviorProfile.appliances.hasExtraFridge &&
      !resolvedEnergyBehaviorProfile.appliances.hasAirConditioning &&
      (resolvedEnergyBehaviorProfile.appliances.showers ?? 0) === 0
        ? 'Completar diagnostico rapido'
        : invoice.consumption > historyAverageConsumption * 1.05 &&
            ((resolvedEnergyBehaviorProfile.appliances.showers ?? 0) >= 1 ||
              resolvedEnergyBehaviorProfile.appliances.hasAirConditioning === true)
          ? 'Mapear chuveiro e climatizacao'
          : invoice.consumption > historyAverageConsumption * 1.05
            ? 'Revisar cargas fixas'
            : 'Comparar proxima fatura';
    const secondaryActionTitle =
      primaryActionTitle === 'Comparar proxima fatura'
        ? 'Revisar cargas fixas'
        : 'Comparar proxima fatura';

    return {
      environmentContext: { season },
      profileContext,
      mainDriver: 'consumo_total',
      headline: conclusion,
      evidence,
      interpretation: appendContextClause(
        appendContextClause(interpretation, behaviorContextSentence),
        profileContext.contextSentence
      ),
      conclusion,
      microEducation: joinMicroEducation(
        'Media historica ajuda a comparar este ciclo com o seu padrao recente.',
        getProfileMicroEducationClause(profileContext)
      ),
      primaryAction: buildInsightAction(
        primaryActionTitle,
        appendContextClause(
          primaryActionTitle === 'Mapear cargas fixas'
            ? 'A melhor acao agora e revisar as cargas fixas para entender essa diferenca.'
            : primaryActionTitle === 'Mapear chuveiro e climatizacao'
              ? 'A melhor acao agora e mapear banho e climatizacao para entender essa diferenca.'
              : primaryActionTitle === 'Completar diagnostico rapido'
                ? 'A fatura mostra um desvio em relacao ao historico. Faltam alguns dados de rotina para explicar esse aumento.'
            : 'A melhor acao agora e acompanhar o proximo ciclo para confirmar se houve mudanca real.',
          getProfileActionReasonClause(profileContext)
        ),
        evidence,
        primaryActionTitle === 'Completar diagnostico rapido'
          ? 'Responder diagnostico'
          : 'Comecar acao',
        buildInteractiveQuestionsForAction({
          actionTitle: primaryActionTitle,
          invoiceEvidence,
          energyBehaviorProfile: resolvedEnergyBehaviorProfile,
        }),
        usedDataPoints
      ),
      secondaryAction: buildInsightAction(
        secondaryActionTitle,
        appendContextClause(
          secondaryActionTitle === 'Comparar proxima fatura'
            ? 'Comparar a proxima fatura deve confirmar se o ajuste fez diferenca.'
            : 'Revisar a rotina deve isolar a causa antes de ampliar qualquer mudanca.',
          profileContext.warnings[0]
        ),
        evidence,
        secondaryActionTitle === 'Comparar proxima fatura'
          ? 'Preparar acompanhamento'
          : 'Comecar acao',
        buildInteractiveQuestionsForAction({
          actionTitle: secondaryActionTitle,
          invoiceEvidence,
          energyBehaviorProfile: resolvedEnergyBehaviorProfile,
        }),
        usedDataPoints
      ),
      warnings,
      historyTrend,
    };
  }

  const evidence = invoice.parser.rawTextAvailable
    ? `A fatura de ${monthLabel} ainda nao reuniu ciclos suficientes ou campos comparaveis para uma conclusao forte.`
    : `A fatura de ${monthLabel} nao encontrou texto suficiente para comparacao segura.`;

  return {
    environmentContext: { season },
    profileContext,
    mainDriver: 'acompanhamento',
    headline: 'Ainda faltam ciclos suficientes para uma conclusao forte.',
    evidence,
    interpretation: appendContextClause(
      appendContextClause(
        'Sem historico comparavel ou sem campos essenciais, qualquer diagnostico mais forte agora seria inventado.',
        behaviorHighlights.length > 0
          ? 'Ja tenho algumas respostas suas, mas ainda preciso de mais ciclos de fatura para uma conclusao forte.'
          : undefined
      ),
      profileContext.contextSentence
    ),
    conclusion:
      behaviorHighlights.length > 0
        ? 'Ja tenho algumas respostas suas, mas ainda preciso de mais ciclos de fatura para uma conclusao forte.'
        : 'Ainda faltam ciclos suficientes para uma conclusao forte.',
    microEducation: joinMicroEducation(
      'Media historica so fica confiavel quando existe mais de um ciclo comparavel.',
      getProfileMicroEducationClause(profileContext)
    ),
    primaryAction: buildInsightAction(
      diagnosticQuestions.length > 0 ? 'Completar diagnostico rapido' : 'Comparar proxima fatura',
      appendContextClause(
        diagnosticQuestions.length > 0
          ? 'Faltam alguns dados de rotina para refinar o diagnostico antes do proximo ciclo.'
          : 'A melhor acao agora e preparar o proximo acompanhamento para destravar a comparacao.',
        profileContext.warnings[0]
      ),
      evidence,
      diagnosticQuestions.length > 0 ? 'Responder diagnostico' : 'Preparar acompanhamento',
      buildInteractiveQuestionsForAction({
        actionTitle: diagnosticQuestions.length > 0 ? 'Completar diagnostico rapido' : 'Comparar proxima fatura',
        invoiceEvidence,
        energyBehaviorProfile: resolvedEnergyBehaviorProfile,
      }),
      usedDataPoints
    ),
    warnings,
    historyTrend,
  };
};

const sortInvoicesByCompetence = (invoiceHistory: InvoiceData[]) =>
  [...invoiceHistory]
    .map((invoice, index) => ({
      index,
      invoice,
      competenceTime: getInvoiceCompetenceTime(invoice),
    }))
    .sort((left, right) => {
      if (left.competenceTime === undefined && right.competenceTime === undefined) {
        return left.index - right.index;
      }

      if (left.competenceTime === undefined) {
        return 1;
      }

      if (right.competenceTime === undefined) {
        return -1;
      }

      return left.competenceTime - right.competenceTime;
    })
    .map(({ invoice }) => invoice);

const upsertInvoiceInHistory = (invoice: InvoiceData, invoiceHistory: InvoiceData[]) => [
  invoice,
  ...invoiceHistory.filter((historyInvoice) => historyInvoice.fingerprint !== invoice.fingerprint),
];

export const getPreviousInvoice = (
  currentInvoice: InvoiceData,
  invoiceHistory: InvoiceData[]
) => {
  const orderedHistory = sortInvoicesByCompetence(
    upsertInvoiceInHistory(currentInvoice, invoiceHistory)
  );
  const currentInvoiceIndex = orderedHistory.findIndex(
    (invoice) => invoice.fingerprint === currentInvoice.fingerprint
  );

  if (currentInvoiceIndex <= 0) {
    return undefined;
  }

  return orderedHistory[currentInvoiceIndex - 1];
};

const getConsumptionLevel = (
  consumption: number,
  consumerType: string
): AnalysisSummary['consumptionLevel'] => {
  const thresholds =
    CONSUMER_THRESHOLDS[consumerType as keyof typeof CONSUMER_THRESHOLDS] ||
    CONSUMER_THRESHOLDS.Residencial;

  if (consumption <= thresholds.low) {
    return 'baixo';
  }

  if (consumption <= thresholds.medium) {
    return 'moderado';
  }

  return 'alto';
};

const getCostSignal = (totalValue: number): AnalysisSummary['costSignal'] => {
  if (totalValue < 220) {
    return 'controlado';
  }

  if (totalValue < 420) {
    return 'atencao';
  }

  return 'elevado';
};

export const buildAnalysisSummary = (
  invoice: InvoiceData,
  profile?: Partial<UserProfileData>,
  invoiceHistory: InvoiceData[] = [],
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile>
): AnalysisSummary => {
  const resolvedEnergyBehaviorProfile = getResolvedEnergyBehaviorProfile(energyBehaviorProfile);
  const previousInvoiceForInsights = getPreviousInvoice(invoice, invoiceHistory);
  const comparisonSignals = previousInvoiceForInsights
    ? buildBasicInvoiceSignals(invoice, previousInvoiceForInsights)
    : undefined;
  const consultativeInsights = previousInvoiceForInsights
    ? buildConsultativeInsights(comparisonSignals)
    : buildConsultativeInsights();
  const resolvedProfile = getResolvedProfile(profile);
  const averageCostPerKwh = getInvoiceCostPerKwh(invoice);
  const invoiceEvidence = getInvoiceEvidence(invoice, averageCostPerKwh);
  const consumptionLevel = hasNumericValue(invoice.consumption)
    ? getConsumptionLevel(invoice.consumption, resolvedProfile.consumerType)
    : undefined;
  const costSignal = hasNumericValue(invoice.totalValue)
    ? getCostSignal(invoice.totalValue)
    : undefined;
  const hasConsumption = Boolean(consumptionLevel);
  const hasCost = Boolean(costSignal);
  const observations: string[] = [];
  const providerName = invoice.parser.fields.providerName.value;
  const dueDate = invoice.parser.fields.dueDate.value;
  const evidenceItems: InsightFactItem[] = [];
  const educationItems: InsightEducationItem[] = [];
  const behaviorHighlights = buildBehaviorHighlights(resolvedEnergyBehaviorProfile);
  const consultiveInsight = buildConsultiveInsight(
    invoice,
    invoiceHistory,
    profile,
    resolvedEnergyBehaviorProfile
  );

  if (hasNumericValue(invoice.consumption)) {
    evidenceItems.push({
      label: 'Consumo total',
      value: invoiceEvidence.daysBilled
        ? `${formatKwhValue(invoice.consumption)} em ${invoiceEvidence.daysBilled} dias`
        : `${formatKwhValue(invoice.consumption)}`,
    });
  }

  if (hasNumericValue(invoiceEvidence.averageCostPerKwh)) {
    evidenceItems.push({
      label: 'Custo medio',
      value: formatCurrencyPerKwh(invoiceEvidence.averageCostPerKwh) || 'Indisponivel',
    });
  }

  if (invoiceEvidence.peakWindowLabel) {
    evidenceItems.push({
      label: 'Horario de pico identificado',
      value: invoiceEvidence.peakWindowLabel,
    });
  }

  if (hasNumericValue(invoiceEvidence.peakConsumptionKwh)) {
    evidenceItems.push({
      label: 'Consumo no pico',
      value: formatKwhValue(invoiceEvidence.peakConsumptionKwh) || 'Indisponivel',
    });
  }

  if (hasNumericValue(invoiceEvidence.offPeakConsumptionKwh)) {
    evidenceItems.push({
      label: 'Consumo fora do pico',
      value: formatKwhValue(invoiceEvidence.offPeakConsumptionKwh) || 'Indisponivel',
    });
  }

  if (invoiceEvidence.tariffFlag) {
    evidenceItems.push({
      label: 'Bandeira',
      value: invoiceEvidence.tariffFlag,
    });
  }

  if (consultiveInsight.mainDriver === 'bandeira' && invoiceEvidence.tariffFlag) {
    educationItems.push({
      label: 'Bandeira tarifaria',
      explanation: consultiveInsight.microEducation,
    });
  } else if (consultiveInsight.mainDriver === 'custo_medio') {
    educationItems.push({
      label: 'Custo por kWh',
      explanation: consultiveInsight.microEducation,
    });
  } else if (consultiveInsight.mainDriver === 'pico') {
    educationItems.push({
      label: 'Horario de pico',
      explanation: consultiveInsight.microEducation,
    });
  } else {
    educationItems.push({
      label: 'Resumo consultivo',
      explanation: consultiveInsight.microEducation,
    });
  }

  behaviorHighlights.forEach((highlight) => {
    evidenceItems.push({
      label: 'Contexto informado',
      value: highlight,
    });
  });

  observations.push(consultiveInsight.conclusion);
  observations.push(consultiveInsight.evidence);
  observations.push(consultiveInsight.interpretation);

  if (consultiveInsight.historyTrend) {
    observations.push(consultiveInsight.historyTrend);
  } else if (costSignal === 'controlado') {
    observations.push('O custo deste ciclo ficou mais controlado e deve servir como base para a proxima comparacao.');
  } else if (dueDate && !hasCost) {
    observations.push(`A conta trouxe vencimento em ${dueDate}, mas o valor total nao foi identificado com seguranca.`);
  } else if (!hasConsumption && !hasCost) {
    observations.push('Os campos economicos ainda estao parciais; o parser preservou ausencia segura.');
  }

  const primaryActionReason = consultiveInsight.primaryAction.reason.replace(/^Escolhida porque\s*/i, '');
  const whatMattersNext = `A melhor acao agora e ${consultiveInsight.primaryAction.title.toLowerCase()}. ${primaryActionReason}`;
  const readingHeadline = `${getInvoiceMonthLabel(invoice)}: ${consultiveInsight.headline}`;

  return {
    consumptionLevel,
    costSignal,
    consultativeInsights,
    headline: readingHeadline,
    observations: observations.slice(0, 3),
    whatMattersNext,
    efficiencyLabel:
      consumptionLevel === 'baixo'
        ? 'Base eficiente'
        : consumptionLevel === 'moderado'
          ? 'Eficiencia em ajuste'
          : consumptionLevel === 'alto'
            ? 'Eficiencia sob atencao'
            : providerName
              ? `Resumo parcial ${providerName}`
              : 'Resumo parcial',
    educationItems: educationItems.slice(0, 3),
    evidenceItems: evidenceItems.slice(0, 6),
    behaviorHighlights,
    consultiveInsight,
  };
};

export const buildNextActions = (
  invoice: InvoiceData | undefined,
  analysis: AnalysisSummary | undefined,
  profile?: Partial<UserProfileData>,
  userContext?: Partial<UserContextState>,
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile>
): NextAction[] => {
  const resolvedProfile = getResolvedProfile(profile);
  const resolvedEnergyBehaviorProfile = getResolvedEnergyBehaviorProfile(energyBehaviorProfile);
  const profileLabel = resolvedProfile.location
    ? `${resolvedProfile.consumerType.toLowerCase()} em ${resolvedProfile.location}`
    : resolvedProfile.consumerType.toLowerCase();
  const usagePeriod = getAnsweredContextValue(userContext, 'usage_period');
  const electricShowerUsage = getAnsweredContextValue(userContext, 'electric_shower');
  const primaryGoal = getAnsweredContextValue(userContext, 'primary_goal');
  const actionReviewPoints = SCORE_EVENT_POINTS.action_viewed;
  const invoiceCyclePoints =
    SCORE_EVENT_POINTS.invoice_uploaded + SCORE_EVENT_POINTS.analysis_completed;
  const actions: NextAction[] = [];
  const monthLabel = invoice ? getInvoiceMonthLabel(invoice) : 'referencia nao identificada';
  const usageWindowLabel = invoice ? getUsageWindowLabel(invoice) : 'os horarios de maior uso';
  const invoiceEvidence = invoice ? getInvoiceEvidence(invoice, getInvoiceCostPerKwh(invoice)) : undefined;
  const costPerKwhLabel = formatCurrencyPerKwh(invoiceEvidence?.averageCostPerKwh);
  const peakConsumptionLabel = formatKwhValue(invoiceEvidence?.peakConsumptionKwh);
  const offPeakConsumptionLabel = formatKwhValue(invoiceEvidence?.offPeakConsumptionKwh);
  const daysBilledLabel = invoiceEvidence?.daysBilled ? `${invoiceEvidence.daysBilled} dias` : undefined;
  const tariffLabel = invoiceEvidence?.tariffFlag;
  const consultiveInsight = analysis?.consultiveInsight;
  const knownBehaviorSummary = buildKnownBehaviorSummary(resolvedEnergyBehaviorProfile);
  const usedDataPoints = buildRecommendationDataPoints({
    invoice,
    invoiceEvidence,
    resolvedProfile,
    energyBehaviorProfile: resolvedEnergyBehaviorProfile,
  });
  const getActionDiagnosisState = (actionTitle: string) =>
    buildDiagnosisTrailForAction(actionTitle, resolvedEnergyBehaviorProfile);
  const pushUniqueAction = (nextAction: NextAction) => {
    const normalizedTitle = nextAction.title.trim().toLowerCase();

    if (actions.some((action) => action.title.trim().toLowerCase() === normalizedTitle)) {
      return;
    }

    actions.push(nextAction);
  };

  if (invoice && !analysis) {
    actions.push({
      id: 'continue-after-analysis',
      title: 'Continuar quando o resumo estiver pronto',
      description: 'Fatura adicionada ao historico. Revise o resumo antes de mudar a rotina.',
      value: 'Mantem envio e resumo alinhados',
      context: `Use na fatura de ${monthLabel}, enquanto o resumo ainda nao estiver pronto.`,
      suggestion: 'Confira consumo, custo e campos essenciais extraidos antes de iniciar uma acao.',
      impact: `Prepara a proxima acao revisada (+${actionReviewPoints} pontos ao revisar).`,
      validation: 'Resumo pronto antes de novas mudancas.',
      priority: 'high',
      status: 'new',
      source: 'invoice',
    });

    return actions;
  }

  if (!invoice || !analysis) {
    const hasCompleteProfile = isProfileComplete(resolvedProfile);

    actions.push({
      id: 'complete-profile',
      title: hasCompleteProfile ? 'Adicionar fatura ao historico' : 'Completar perfil minimo',
      description: hasCompleteProfile
        ? 'Adicione uma fatura para iniciar sua analise de consumo.'
        : 'Preencha local, tipo de consumidor, tamanho do imovel e pessoas.',
      value: hasCompleteProfile ? 'Inicia o resumo do seu consumo e evolucao' : 'Personaliza a jornada',
      context: hasCompleteProfile
        ? `Perfil ${profileLabel} ja tem contexto; falta adicionar uma fatura ao historico.`
        : 'Use antes de alimentar o historico, enquanto o contexto ainda e minimo.',
      suggestion: hasCompleteProfile
        ? 'Separe uma fatura em PDF, JPG ou PNG para alimentar o historico.'
        : 'Priorize cidade, tipo de consumidor, tamanho do imovel e pessoas.',
      impact: hasCompleteProfile
        ? `Pode somar ate ${invoiceCyclePoints} pontos com fatura e analise.`
        : `Pode liberar perfil completo (+${SCORE_EVENT_POINTS.profile_completed} pontos).`,
      validation: hasCompleteProfile
        ? 'Fatura aparece no historico e gera resumo.'
        : 'Perfil com pelo menos 80% de completude.',
      priority: 'high',
      status: 'new',
      source: hasCompleteProfile ? 'journey' : 'profile',
    });

    return actions;
  }

  if (consultiveInsight) {
    const startedActionTitles = resolvedEnergyBehaviorProfile.actionMemory.startedActionTitles ?? [];
    const shouldPrioritizeComparison = startedActionTitles.includes(
      consultiveInsight.primaryAction.title
    );
    const primaryAdaptiveAction = shouldPrioritizeComparison && consultiveInsight.secondaryAction
      ? consultiveInsight.secondaryAction
      : consultiveInsight.primaryAction;
    const followUpAdaptiveAction =
      shouldPrioritizeComparison
        ? undefined
        : consultiveInsight.secondaryAction;
    const primaryDiagnosisState = getActionDiagnosisState(primaryAdaptiveAction.title);

    pushUniqueAction({
      id: `driver-${consultiveInsight.mainDriver}`,
      title: primaryAdaptiveAction.title,
      description: consultiveInsight.conclusion,
      value: primaryAdaptiveAction.evidence,
      context: primaryAdaptiveAction.reason,
      suggestion: primaryAdaptiveAction.ctaLabel,
      ctaLabel: primaryAdaptiveAction.ctaLabel,
      evidence: primaryAdaptiveAction.evidence,
      reason: primaryAdaptiveAction.reason,
      impact: consultiveInsight.historyTrend || consultiveInsight.microEducation,
      validation: 'Compare o resultado na proxima fatura.',
      interactiveQuestions: primaryDiagnosisState.interactiveQuestions,
      usedDataPoints: primaryAdaptiveAction.usedDataPoints ?? usedDataPoints,
      knownBehaviorSummary,
      answeredQuestionSummaries: primaryDiagnosisState.answeredQuestionSummaries,
      diagnosticProgress: primaryDiagnosisState.diagnosticProgress,
      priority: 'high',
      status: 'new',
      source: 'analysis',
    });

    if (followUpAdaptiveAction && shouldIncludeSecondaryAction(primaryAdaptiveAction, followUpAdaptiveAction)) {
      const followUpDiagnosisState = getActionDiagnosisState(followUpAdaptiveAction.title);
      pushUniqueAction({
        id: `driver-${consultiveInsight.mainDriver}-follow-up`,
        title: followUpAdaptiveAction.title,
        description: followUpAdaptiveAction.reason,
        value: 'Confirmar se o ajuste aparece no proximo ciclo.',
        context: followUpAdaptiveAction.reason,
        suggestion: followUpAdaptiveAction.ctaLabel,
        ctaLabel: followUpAdaptiveAction.ctaLabel,
        evidence: followUpAdaptiveAction.evidence,
        reason: followUpAdaptiveAction.reason,
        impact: consultiveInsight.historyTrend || `Use a fatura de ${monthLabel} como base da comparacao.`,
        validation: 'A nova conta precisa entrar no historico para a comparacao.',
        interactiveQuestions: followUpDiagnosisState.interactiveQuestions,
        usedDataPoints: followUpAdaptiveAction.usedDataPoints ?? usedDataPoints,
        knownBehaviorSummary,
        answeredQuestionSummaries: followUpDiagnosisState.answeredQuestionSummaries,
        diagnosticProgress: followUpDiagnosisState.diagnosticProgress,
        priority: 'medium',
        status: 'new',
        source: 'journey',
      });
    }
  }

  if (actions.length === 0 && !analysis.consumptionLevel && !analysis.costSignal) {
    pushUniqueAction({
      id: 'confirm-core-fields',
      title: invoice.parser.rawTextAvailable
        ? 'Revisar campos essenciais extraidos'
        : 'Enviar PDF textual da fatura',
      description: invoice.parser.rawTextAvailable
        ? 'A fatura trouxe resumo parcial. Confirme referencia, vencimento, total e consumo antes de tirar conclusoes.'
        : 'O resumo nao encontrou texto aproveitavel. Para parser deterministico, priorize um PDF textual da conta.',
      value: 'Evitar resumo inventado',
      context: `O resumo atual da fatura ${monthLabel} esta parcial e foi preservado sem simulacao de numeros.`,
      suggestion: invoice.parser.rawTextAvailable
        ? 'Compare os campos essenciais com a propria conta e envie o proximo ciclo em PDF textual quando possivel.'
        : 'Se houver PDF exportado pela distribuidora, use esse arquivo no proximo envio em vez de imagem.',
      ctaLabel: invoice.parser.rawTextAvailable ? 'Revisar campos' : 'Enviar PDF textual',
      impact: `Mantem a jornada baseada em dados reais (+${actionReviewPoints} pontos ao revisar).`,
      validation: 'Campos essenciais confirmados ou nova fatura textual enviada.',
      usedDataPoints,
      knownBehaviorSummary,
      priority: 'high',
      status: 'new',
      source: 'analysis',
    });
  }

  if (actions.length === 0 && analysis.consumptionLevel === 'alto') {
    const highConsumptionActionTitle =
      (resolvedEnergyBehaviorProfile.appliances.showers ?? 0) > 0 ||
      resolvedEnergyBehaviorProfile.appliances.hasAirConditioning === true
        ? 'Mapear chuveiro e climatizacao'
        : peakConsumptionLabel
          ? 'Deslocar uso fora do pico'
          : 'Revisar cargas fixas';
    const highConsumptionDiagnosisState = getActionDiagnosisState(highConsumptionActionTitle);
    pushUniqueAction({
      id: 'map-peak-usage',
      title: highConsumptionActionTitle,
      description: peakConsumptionLabel
        ? `A fatura registrou ${peakConsumptionLabel} no pico${offPeakConsumptionLabel ? ` e ${offPeakConsumptionLabel} fora do pico` : ''}.`
        : daysBilledLabel
          ? `Voce consumiu ${formatKwhValue(invoice.consumption)} em ${daysBilledLabel}, com resumo de consumo alto para este perfil.`
          : `O consumo total de ${formatKwhValue(invoice.consumption)} ficou alto para este perfil.`,
      value: 'Encontrar desperdicios visiveis',
      context: peakConsumptionLabel
        ? `Evidencia: ${peakConsumptionLabel} apareceram em ${usageWindowLabel}.`
        : `Evidencia: a fatura de ${monthLabel} mostrou consumo alto para um perfil ${profileLabel}.`,
      suggestion:
        electricShowerUsage === 'daily' || electricShowerUsage === 'sometimes'
          ? 'Anote chuveiro, ar-condicionado, forno e outros usos simultaneos.'
          : usagePeriod === 'night'
            ? 'Anote o que mais pesa no uso noturno e no horario de maior uso.'
            : primaryGoal === 'understand_consumption'
              ? 'Anote os usos para observar melhor o padrao de consumo.'
              : 'Anote chuveiro, ar-condicionado, forno, maquinas e usos simultaneos.',
      ctaLabel: highConsumptionDiagnosisState.diagnosticProgress ? 'Responder diagnostico' : 'Comecar acao',
      impact: `Ajuda a escolher um ajuste mais provavel (+${actionReviewPoints} pontos ao revisar).`,
      validation: 'Liste os 2 ou 3 usos mais frequentes no pico.',
      interactiveQuestions: highConsumptionDiagnosisState.interactiveQuestions,
      usedDataPoints,
      knownBehaviorSummary,
      answeredQuestionSummaries: highConsumptionDiagnosisState.answeredQuestionSummaries,
      diagnosticProgress: highConsumptionDiagnosisState.diagnosticProgress,
      priority: 'high',
      status: 'new',
      source: 'analysis',
    });
  }

  if (actions.length < 2 && analysis.costSignal && analysis.costSignal !== 'controlado') {
    const costCutDiagnosisState = getActionDiagnosisState('Testar economia por 7 dias');
    pushUniqueAction({
      id: 'choose-one-cost-cut',
      title: 'Testar economia por 7 dias',
      description: costPerKwhLabel
        ? `Seu custo medio ficou em ${costPerKwhLabel}${tariffLabel ? ` sob bandeira ${tariffLabel}` : ''}${invoice.peakHours ? `, com atencao em ${invoice.peakHours}` : ''}.`
        : `O custo total da fatura de ${monthLabel} ficou em ${formatCurrency(invoice.totalValue)}${invoice.peakHours ? `, com atencao em ${invoice.peakHours}` : ''}.`,
      value:
        primaryGoal === 'reduce_cost'
          ? 'Buscar impacto direto na fatura'
          : primaryGoal === 'understand_consumption'
            ? 'Observar padrao com um teste comparavel'
            : primaryGoal === 'both'
              ? 'Reduzir custo sem perder a comparacao do padrao'
              : 'Criar um teste comparavel',
      context: costPerKwhLabel
        ? `Evidencia: ${costPerKwhLabel} por kWh${tariffLabel ? ` e bandeira ${tariffLabel}` : ''} neste ciclo.`
        : `Evidencia: o sinal de custo esta ${analysis.costSignal} nesta fatura.`,
      suggestion: 'Reduza uso simultaneo, encurte um uso intenso ou revise luzes recorrentes.',
      ctaLabel: costCutDiagnosisState.diagnosticProgress ? 'Responder diagnostico' : 'Comecar acao',
      impact: `Transforma recomendacao em comportamento acompanhado (+${actionReviewPoints} pontos ao revisar).`,
      validation: 'Aplicar em pelo menos 5 dos 7 dias.',
      interactiveQuestions: costCutDiagnosisState.interactiveQuestions,
      usedDataPoints,
      knownBehaviorSummary,
      answeredQuestionSummaries: costCutDiagnosisState.answeredQuestionSummaries,
      diagnosticProgress: costCutDiagnosisState.diagnosticProgress,
      priority: 'high',
      status: 'new',
      source: 'analysis',
    });
  }

  if (actions.length < 2) {
    const comparisonDiagnosisState = getActionDiagnosisState('Comparar proxima fatura');
    pushUniqueAction({
      id: 'return-next-bill',
      title: 'Adicionar a proxima fatura',
      description:
        tariffLabel || daysBilledLabel
          ? `Este resumo ja trouxe ${tariffLabel ? `bandeira ${tariffLabel.toLowerCase()}` : daysBilledLabel}. Compare esse sinal no proximo ciclo.`
          : 'No proximo ciclo, adicione a nova fatura para comparar consumo e custo quando esses campos estiverem disponiveis.',
      value: 'Transformar resumo em evolucao',
      context: `O resumo atual e da fatura de ${monthLabel}; a comparacao melhora com outro ciclo.`,
      suggestion:
        primaryGoal === 'reduce_cost'
          ? 'Adicione a proxima fatura para ver se o custo responde ao ajuste.'
          : primaryGoal === 'understand_consumption'
          ? 'Adicione a proxima fatura para observar se o padrao se repete.'
          : 'Adicione a proxima fatura quando ela estiver disponivel.',
      ctaLabel: comparisonDiagnosisState.diagnosticProgress ? 'Responder diagnostico' : 'Preparar acompanhamento',
      impact: `Pode somar ate ${invoiceCyclePoints} pontos em novo ciclo de fatura e analise.`,
      validation: 'Proxima fatura aparece no historico.',
      interactiveQuestions: comparisonDiagnosisState.interactiveQuestions,
      usedDataPoints,
      knownBehaviorSummary,
      answeredQuestionSummaries: comparisonDiagnosisState.answeredQuestionSummaries,
      diagnosticProgress: comparisonDiagnosisState.diagnosticProgress,
      priority: 'medium',
      status: 'new',
      source: 'journey',
    });
  }

  const filteredActions = actions.filter((action, index) => {
    if (index === 0) {
      return true;
    }

    const primaryAction = actions[0];
    const normalizedTitle = normalizeForMatch(action.title);
    const isGenericComparisonAction =
      normalizedTitle === normalizeForMatch('Comparar proxima fatura') ||
      normalizedTitle === normalizeForMatch('Adicionar a proxima fatura');
    const hasDistinctContext =
      normalizeForMatch(action.context) !== normalizeForMatch(primaryAction?.context) ||
      normalizeForMatch(action.evidence) !== normalizeForMatch(primaryAction?.evidence);

    if (isGenericComparisonAction && !hasDistinctContext) {
      return false;
    }

    return true;
  });

  return filteredActions.slice(0, 2).map((action, index) => {
    const isPrimary = index === 0;

    return {
      ...action,
      ctaLabel: resolveActionCtaLabel({
        title: action.title,
        isPrimary,
        diagnosticProgress: isPrimary ? action.diagnosticProgress : undefined,
      }),
      interactiveQuestions: isPrimary ? action.interactiveQuestions : undefined,
      answeredQuestionSummaries: isPrimary ? action.answeredQuestionSummaries : undefined,
      diagnosticProgress: isPrimary ? action.diagnosticProgress : undefined,
    };
  });
};

export const buildMascotGuidance = ({
  stage,
  profile,
  invoice,
  analysis,
  userContext,
}: {
  stage: JourneyStage;
  profile?: Partial<UserProfileData>;
  invoice?: InvoiceData;
  analysis?: AnalysisSummary;
  userContext?: Partial<UserContextState>;
}): MascotGuidance => {
  const resolvedProfile = getResolvedProfile(profile);
  const profileLabel = resolvedProfile.location
    ? `${resolvedProfile.consumerType.toLowerCase()} em ${resolvedProfile.location}`
    : resolvedProfile.consumerType.toLowerCase();
  const usagePeriod = getAnsweredContextValue(userContext, 'usage_period');
  const primaryGoal = getAnsweredContextValue(userContext, 'primary_goal');

  if (stage === 'return-visit') {
    return {
      stage,
      title: 'Retomando sua jornada',
      message: analysis
        ? `Ja existe um resumo recente para o perfil ${profileLabel}. O proximo foco e acompanhar a acao atual e comparar o proximo ciclo.`
        : `Que bom ver voce de volta. O passo mais util agora e adicionar uma fatura ao historico para construir um resumo simples do perfil ${profileLabel}.`,
    };
  }

  if (stage === 'invoice-uploaded') {
    return {
      stage,
      title: 'Fatura recebida',
      message: `Agora o sistema gera um resumo simples para o perfil ${profileLabel}, destacando apenas os campos da fatura que forem extraidos com confianca.`,
    };
  }

  if (stage === 'analysis-ready' && invoice && analysis) {
    const monthLabel = getInvoiceMonthLabel(invoice);
    const analysisFocus =
      analysis.consumptionLevel
        ? `o consumo ficou ${analysis.consumptionLevel}`
        : analysis.costSignal
          ? `o custo ficou ${analysis.costSignal}`
          : 'o resumo ficou parcial';

    return {
      stage,
      title: 'Resumo do momento',
      message: `Na fatura de ${monthLabel}, ${analysisFocus}${primaryGoal === 'reduce_cost' ? ', com foco em reduzir custo' : primaryGoal === 'understand_consumption' ? ', para entender melhor o consumo' : usagePeriod === 'night' ? ', com atencao ao uso noturno' : ''}. Proximo foco: ${analysis.whatMattersNext.toLowerCase()}`,
    };
  }

  if (isProfileComplete(resolvedProfile)) {
    return {
      stage: 'before-upload',
      title: 'Contexto suficiente',
      message: `O perfil ${profileLabel} ja permite um resumo mais justo. Adicione uma fatura ao historico para ver apenas dados reais extraidos da conta.`,
    };
  }

  return {
    stage: 'onboarding',
    title: 'Monte sua base primeiro',
    message:
      'Complete um perfil simples e depois adicione sua conta de luz ao historico. Assim a analise fica mais clara, o score fica explicavel e os proximos passos deixam de ser genericos.',
  };
};

export const createScoreEvent = (
  type: keyof typeof SCORE_EVENT_POINTS,
  id: string,
  label: string
): ScoreEvent => ({
  id,
  type,
  label,
  points: SCORE_EVENT_POINTS[type],
  occurredAt: new Date().toISOString(),
});

export const getScoreEventPoints = (type: ScoreEventType) => SCORE_EVENT_POINTS[type] ?? 0;

export const getScoreEventSubject = (event: Pick<ScoreEvent, 'id' | 'type'>) => {
  const prefix = SCORE_EVENT_ID_PREFIX[event.type];

  if (!prefix || !event.id.startsWith(prefix)) {
    return null;
  }

  if (event.type === 'profile_completed') {
    return event.id === prefix ? event.type : null;
  }

  const subject = event.id.slice(prefix.length).trim();
  return subject ? subject : null;
};

export const getScoreEventDedupeKey = (event: Pick<ScoreEvent, 'id' | 'type'>) => {
  const subject = getScoreEventSubject(event);
  return subject ? `${event.type}:${subject}` : null;
};

export const normalizeScoreEvents = (events?: Partial<ScoreEvent>[]): ScoreEvent[] => {
  if (!Array.isArray(events)) {
    return [];
  }

  const seenKeys = new Set<string>();
  const normalizedEvents: ScoreEvent[] = [];

  events.forEach((event) => {
    if (!event?.id || !event.type || !event.label || !event.occurredAt) {
      return;
    }

    const points = getScoreEventPoints(event.type);
    const dedupeKey = getScoreEventDedupeKey({
      id: event.id,
      type: event.type,
    });

    if (!points || !dedupeKey || seenKeys.has(dedupeKey)) {
      return;
    }

    const occurredAt = Number.isNaN(new Date(event.occurredAt).getTime())
      ? '1970-01-01T00:00:00.000Z'
      : event.occurredAt;

    seenKeys.add(dedupeKey);
    normalizedEvents.push({
      id: event.id,
      type: event.type,
      label: event.label,
      points,
      occurredAt,
    });
  });

  return normalizedEvents;
};

export const addScoreEvent = (events: ScoreEvent[], nextEvent: ScoreEvent) => {
  return normalizeScoreEvents([nextEvent, ...events]);
};

export const getScoreState = (events: ScoreEvent[]): ScoreState => {
  const normalizedEvents = normalizeScoreEvents(events);
  const score = normalizedEvents.reduce((total, event) => total + event.points, 0);
  const level = Math.max(1, Math.floor(score / 200) + 1);
  const currentLevelFloor = (level - 1) * 200;
  const nextLevelScore = level * 200;
  const progressToNextLevel =
    nextLevelScore === currentLevelFloor
      ? 100
      : Math.round(((score - currentLevelFloor) / (nextLevelScore - currentLevelFloor)) * 100);

  return {
    score,
    level,
    nextLevelScore,
    progressToNextLevel: clamp(progressToNextLevel, 0, 100),
  };
};
