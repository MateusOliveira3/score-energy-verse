import {
  AnalysisSummary,
  ConsultiveInsight,
  ConsultiveInsightAction,
  ConsultiveInsightDriver,
  ConsultiveInsightProfileContext,
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

const BASIC_SIGNAL_TOLERANCE = 0.05;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const hasNumericValue = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

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
  ctaLabel = 'Abrir acao principal'
): ConsultiveInsightAction => ({
  ctaLabel,
  evidence,
  reason: reason.trim().toLowerCase().startsWith('escolhida porque')
    ? reason
    : `Escolhida porque ${reason}`,
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
  profile?: Partial<UserProfileData>
): ConsultiveInsight => {
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
    const peakEvidence = `A fatura registrou ${formatKwhValue(invoiceEvidence.peakConsumptionKwh)} no pico.`;
    const interpretation = invoiceEvidence.peakWindowLabel
      ? `Isso indica concentracao real de uso no pico, com janela ${invoiceEvidence.peakWindowLabel} confirmada pela propria fatura.`
      : 'Isso indica concentracao real de uso no pico confirmada pela propria fatura.';
    const conclusion = 'O principal fator neste ciclo foi o consumo no horario de pico.';
    const reason = invoiceEvidence.peakWindowLabel
      ? `${formatKwhValue(invoiceEvidence.peakConsumptionKwh)} no pico tornam o deslocamento de uso a acao mais direta deste ciclo.`
      : `${formatKwhValue(invoiceEvidence.peakConsumptionKwh)} no pico tornam o deslocamento de uso a acao mais direta deste ciclo.`;

    return {
      environmentContext: { season },
      profileContext,
      mainDriver: 'pico',
      headline: conclusion,
      evidence: peakEvidence,
      interpretation: appendContextClause(interpretation, profileContext.contextSentence),
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
        'Deslocar uso fora do pico',
        appendContextClause(reason, getProfileActionReasonClause(profileContext)),
        peakEvidence
      ),
      secondaryAction: buildInsightAction(
        'Comparar proxima fatura',
        appendContextClause(
          'Comparar a proxima fatura deve confirmar se a reducao no pico apareceu no ciclo seguinte.',
          profileContext.warnings[0]
        ),
        peakEvidence,
        'Comparar no proximo ciclo'
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

    return {
      environmentContext: { season },
      profileContext,
      mainDriver: 'aumento_historico',
      headline: 'O principal fator neste ciclo foi o aumento de consumo.',
      evidence,
      interpretation: appendContextClause(
        `Isso indica uma mudanca concreta de rotina entre os dois ciclos. ${getSeasonalConsumptionContext(season)}`,
        profileContext.contextSentence
      ),
      conclusion: 'O principal fator neste ciclo foi o aumento de consumo.',
      microEducation: joinMicroEducation(
        getSeasonalMicroEducation(season),
        getProfileMicroEducationClause(profileContext)
      ),
      primaryAction: buildInsightAction(
        'Revisar rotina de consumo',
        appendContextClause(
          `Comparar este ciclo com o anterior deve revelar a causa mais provavel do aumento em ${monthLabel}.`,
          getProfileActionReasonClause(profileContext)
        ),
        evidence
      ),
      secondaryAction: buildInsightAction(
        'Comparar proxima fatura',
        appendContextClause(
          'Comparar a proxima fatura deve confirmar se o aumento foi pontual ou se virou tendencia.',
          profileContext.warnings[0]
        ),
        evidence,
        'Comparar no proximo ciclo'
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

    return {
      environmentContext: { season },
      profileContext,
      mainDriver: 'custo_medio',
      headline: 'O principal fator neste ciclo foi o custo por kWh.',
      evidence: `${evidence}${comparisonLine}`.trim(),
      interpretation: appendContextClause(
        'Isso indica que o custo por unidade consumida explica melhor a pressao desta conta.',
        profileContext.contextSentence
      ),
      conclusion: 'A prioridade agora e testar economia por 7 dias.',
      microEducation: joinMicroEducation(
        'Custo por kWh mostra quanto cada unidade consumida pesou no total da conta.',
        getProfileMicroEducationClause(profileContext)
      ),
      primaryAction: buildInsightAction(
        'Testar economia por 7 dias',
        appendContextClause(
          `O custo por kWh em ${formatCurrencyPerKwh(invoiceEvidence.averageCostPerKwh)} torna um teste curto de economia a resposta mais util deste ciclo.`,
          getProfileActionReasonClause(profileContext)
        ),
        evidence
      ),
      secondaryAction: buildInsightAction(
        'Comparar proxima fatura',
        appendContextClause(
          'Comparar a proxima fatura deve mostrar se o teste mexeu no custo medio por kWh.',
          profileContext.warnings[0]
        ),
        evidence,
        'Comparar no proximo ciclo'
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
        'Isso indica pressao tarifaria adicional neste ciclo, sem substituir a evidencia principal da fatura.',
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
        evidence
      ),
      secondaryAction: buildInsightAction(
        'Comparar proxima fatura',
        appendContextClause(
          'Comparar a proxima fatura deve mostrar se o contexto tarifario continua no ciclo seguinte.',
          profileContext.warnings[0]
        ),
        evidence,
        'Comparar no proximo ciclo'
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
      invoice.consumption > historyAverageConsumption * 1.05
        ? 'Mapear cargas fixas'
        : 'Comparar proxima fatura';
    const secondaryActionTitle =
      primaryActionTitle === 'Mapear cargas fixas'
        ? 'Revisar rotina de consumo'
        : 'Revisar rotina de consumo';

    return {
      environmentContext: { season },
      profileContext,
      mainDriver: 'consumo_total',
      headline: conclusion,
      evidence,
      interpretation: appendContextClause(interpretation, profileContext.contextSentence),
      conclusion,
      microEducation: joinMicroEducation(
        'Media historica ajuda a comparar este ciclo com o seu padrao recente.',
        getProfileMicroEducationClause(profileContext)
      ),
      primaryAction: buildInsightAction(
        primaryActionTitle,
        appendContextClause(
          primaryActionTitle === 'Mapear cargas fixas'
            ? 'O consumo atual ficou acima da media recente e mapear cargas fixas deve revelar a principal fonte dessa diferenca.'
            : 'Comparar a proxima fatura deve confirmar se este ciclo representa mudanca real de padrao.',
          getProfileActionReasonClause(profileContext)
        ),
        evidence
      ),
      secondaryAction: buildInsightAction(
        secondaryActionTitle,
        appendContextClause(
          'Revisar a rotina deve isolar a causa antes de ampliar qualquer mudanca.',
          profileContext.warnings[0]
        ),
        evidence,
        'Abrir acao secundaria'
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
      'Sem historico comparavel ou sem campos essenciais, qualquer diagnostico mais forte agora seria inventado.',
      profileContext.contextSentence
    ),
    conclusion: 'Ainda faltam ciclos suficientes para uma conclusao forte.',
    microEducation: joinMicroEducation(
      'Media historica so fica confiavel quando existe mais de um ciclo comparavel.',
      getProfileMicroEducationClause(profileContext)
    ),
    primaryAction: buildInsightAction(
      'Adicionar proxima fatura',
      appendContextClause(
        'Adicionar a proxima fatura deve liberar a comparacao que falta para decidir o proximo passo.',
        profileContext.warnings[0]
      ),
      evidence
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
  invoiceHistory: InvoiceData[] = []
): AnalysisSummary => {
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
  const consultiveInsight = buildConsultiveInsight(invoice, invoiceHistory, profile);

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
    evidenceItems: evidenceItems.slice(0, 4),
    consultiveInsight,
  };
};

export const buildNextActions = (
  invoice: InvoiceData | undefined,
  analysis: AnalysisSummary | undefined,
  profile?: Partial<UserProfileData>,
  userContext?: Partial<UserContextState>
): NextAction[] => {
  const resolvedProfile = getResolvedProfile(profile);
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
    pushUniqueAction({
      id: `driver-${consultiveInsight.mainDriver}`,
      title: consultiveInsight.primaryAction.title,
      description: consultiveInsight.conclusion,
      value: consultiveInsight.primaryAction.evidence,
      context: consultiveInsight.primaryAction.reason,
      suggestion: consultiveInsight.primaryAction.ctaLabel,
      impact: consultiveInsight.historyTrend || consultiveInsight.microEducation,
      validation: 'Compare o resultado na proxima fatura.',
      priority: 'high',
      status: 'new',
      source: 'analysis',
    });

    if (consultiveInsight.secondaryAction) {
      pushUniqueAction({
        id: `driver-${consultiveInsight.mainDriver}-follow-up`,
        title: consultiveInsight.secondaryAction.title,
        description: consultiveInsight.secondaryAction.reason,
        value: 'Confirmar se o ajuste aparece no proximo ciclo.',
        context: consultiveInsight.secondaryAction.reason,
        suggestion: consultiveInsight.secondaryAction.ctaLabel,
        impact: consultiveInsight.historyTrend || `Use a fatura de ${monthLabel} como base da comparacao.`,
        validation: 'A nova conta precisa entrar no historico para a comparacao.',
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
      impact: `Mantem a jornada baseada em dados reais (+${actionReviewPoints} pontos ao revisar).`,
      validation: 'Campos essenciais confirmados ou nova fatura textual enviada.',
      priority: 'high',
      status: 'new',
      source: 'analysis',
    });
  }

  if (actions.length === 0 && analysis.consumptionLevel === 'alto') {
    pushUniqueAction({
      id: 'map-peak-usage',
      title: peakConsumptionLabel ? 'Reduzir uso no horario de pico' : 'Mapear cargas fixas',
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
      impact: `Ajuda a escolher um ajuste mais provavel (+${actionReviewPoints} pontos ao revisar).`,
      validation: 'Liste os 2 ou 3 usos mais frequentes no pico.',
      priority: 'high',
      status: 'new',
      source: 'analysis',
    });
  }

  if (actions.length < 2 && analysis.costSignal && analysis.costSignal !== 'controlado') {
    pushUniqueAction({
      id: 'choose-one-cost-cut',
      title: 'Testar um corte de custo por 7 dias',
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
      impact: `Transforma recomendacao em comportamento acompanhado (+${actionReviewPoints} pontos ao revisar).`,
      validation: 'Aplicar em pelo menos 5 dos 7 dias.',
      priority: 'high',
      status: 'new',
      source: 'analysis',
    });
  }

  if (actions.length < 2) {
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
      impact: `Pode somar ate ${invoiceCyclePoints} pontos em novo ciclo de fatura e analise.`,
      validation: 'Proxima fatura aparece no historico.',
      priority: 'medium',
      status: 'new',
      source: 'journey',
    });
  }

  return actions.slice(0, 2);
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
