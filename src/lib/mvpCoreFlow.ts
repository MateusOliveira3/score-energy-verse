import {
  AnalysisSummary,
  InvoiceData,
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

interface InsightFactItem {
  label: string;
  value: string;
}

interface InsightEducationItem {
  explanation: string;
  label: string;
}

type EnrichedAnalysisSummary = AnalysisSummary & {
  educationItems?: InsightEducationItem[];
  evidenceItems?: InsightFactItem[];
};

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
  invoice.peakHours?.trim() || 'os horarios de maior uso identificados na fatura';

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
  const consultativeInsights = previousInvoiceForInsights
    ? buildConsultativeInsights(buildBasicInvoiceSignals(invoice, previousInvoiceForInsights))
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
  const monthLabel = getInvoiceMonthLabel(invoice);
  const evidenceItems: InsightFactItem[] = [];
  const educationItems: InsightEducationItem[] = [];

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

  if (hasNumericValue(invoiceEvidence.peakConsumptionKwh)) {
    const offPeakLabel = formatKwhValue(invoiceEvidence.offPeakConsumptionKwh);

    evidenceItems.push({
      label: 'Horario de pico',
      value: offPeakLabel
        ? `${formatKwhValue(invoiceEvidence.peakConsumptionKwh)} no pico e ${offPeakLabel} fora do pico`
        : `${formatKwhValue(invoiceEvidence.peakConsumptionKwh)} no pico`,
    });
  }

  if (invoiceEvidence.tariffFlag) {
    evidenceItems.push({
      label: 'Bandeira',
      value: invoiceEvidence.tariffFlag,
    });
  }

  if (invoiceEvidence.tariffFlag) {
    educationItems.push({
      label: 'Bandeira tarifaria',
      explanation: buildTariffEducation(invoiceEvidence.tariffFlag) || '',
    });
  }

  if (hasNumericValue(invoiceEvidence.averageCostPerKwh)) {
    educationItems.push({
      label: 'Custo por kWh',
      explanation: 'Custo por kWh mostra quanto cada unidade consumida pesou no total da conta.',
    });
  }

  if (hasNumericValue(invoiceEvidence.peakConsumptionKwh)) {
    educationItems.push({
      label: 'Horario de pico',
      explanation:
        'Horario de pico e a faixa em que a energia tende a custar mais para esse tipo de medicao.',
    });
  }

  if (evidenceItems.length > 0) {
    observations.push(`${evidenceItems[0].label}: ${evidenceItems[0].value}.`);
  } else {
    observations.push(
      invoice.parser.rawTextAvailable
        ? 'A leitura encontrou texto na fatura, mas nao identificou consumo com confianca suficiente.'
        : 'A leitura nao encontrou texto aproveitavel na fatura; nenhum consumo foi assumido.'
    );
  }

  if (evidenceItems.length > 1) {
    observations.push(`${evidenceItems[1].label}: ${evidenceItems[1].value}.`);
  } else if (costSignal === 'elevado') {
    observations.push('O custo final ficou alto para este ciclo e pede comparacao no proximo fechamento.');
  } else if (costSignal === 'atencao') {
    observations.push('O custo final merece acompanhamento no proximo ciclo para confirmar tendencia.');
  } else if (costSignal === 'controlado') {
    observations.push('O custo final ficou mais controlado neste ciclo.');
  } else if (dueDate) {
    observations.push(`A conta trouxe vencimento em ${dueDate}, mas o valor total nao foi identificado com seguranca.`);
  } else {
    observations.push('Os campos economicos ainda estao parciais; o parser preservou ausencia segura.');
  }

  const whatMattersNext =
    hasNumericValue(invoiceEvidence.peakConsumptionKwh)
      ? 'Voce ja tem um sinal concreto de consumo no pico; escolha uma acao pequena para testar nesse horario.'
      : hasNumericValue(invoiceEvidence.averageCostPerKwh) && costSignal && costSignal !== 'controlado'
        ? 'Seu custo por kWh ja mostra pressao neste ciclo; vale testar um ajuste simples antes da proxima conta.'
        : consumptionLevel === 'alto'
          ? 'O que mais importa agora e reduzir desperdicios visiveis e observar os usos de maior impacto.'
          : costSignal === 'elevado'
            ? 'O que mais importa agora e controlar o custo no proximo ciclo com uma mudanca simples e mensuravel.'
            : hasConsumption || hasCost
              ? 'O que mais importa agora e manter consistencia e adicionar a proxima fatura para comparar evolucao.'
              : 'O que mais importa agora e enviar uma fatura textual legivel ou validar manualmente os campos essenciais que nao foram encontrados.';

  return {
    consumptionLevel,
    costSignal,
    consultativeInsights,
    headline:
      evidenceItems.length > 0
        ? `Leitura da fatura ${monthLabel}: ${evidenceItems[0].value}.`
        : hasConsumption && hasCost
          ? `Leitura real da fatura ${monthLabel}: consumo ${consumptionLevel} e sinal de custo ${costSignal}.`
          : hasConsumption
            ? `Leitura parcial da fatura ${monthLabel}: consumo ${consumptionLevel} identificado.`
            : hasCost
              ? `Leitura parcial da fatura ${monthLabel}: valor total ${costSignal} identificado.`
              : `Leitura parcial da fatura ${monthLabel}: faltam campos suficientes para uma analise economica completa.`,
    observations: observations.slice(0, 2),
    whatMattersNext,
    efficiencyLabel:
      consumptionLevel === 'baixo'
        ? 'Base eficiente'
        : consumptionLevel === 'moderado'
          ? 'Eficiencia em ajuste'
          : consumptionLevel === 'alto'
            ? 'Eficiencia sob atencao'
            : providerName
              ? `Leitura parcial ${providerName}`
              : 'Leitura parcial',
    educationItems: educationItems.slice(0, 3),
    evidenceItems: evidenceItems.slice(0, 4),
  } as EnrichedAnalysisSummary;
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

  if (invoice && !analysis) {
    actions.push({
      id: 'continue-after-analysis',
      title: 'Continuar quando o resumo estiver pronto',
      description: 'Fatura adicionada ao historico. Revise o resumo antes de mudar a rotina.',
      value: 'Mantem envio e leitura alinhados',
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
      value: hasCompleteProfile ? 'Inicia a leitura do seu consumo e evolucao' : 'Personaliza a jornada',
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

  if (!analysis.consumptionLevel && !analysis.costSignal) {
    actions.push({
      id: 'confirm-core-fields',
      title: invoice.parser.rawTextAvailable
        ? 'Revisar campos essenciais extraidos'
        : 'Enviar PDF textual da fatura',
      description: invoice.parser.rawTextAvailable
        ? 'A fatura trouxe leitura parcial. Confirme referencia, vencimento, total e consumo antes de tirar conclusoes.'
        : 'A leitura nao encontrou texto aproveitavel. Para parser deterministico, priorize um PDF textual da conta.',
      value: 'Evitar leitura inventada',
      context: `A leitura atual da fatura ${monthLabel} esta parcial e foi preservada sem simulacao de numeros.`,
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

  if (analysis.consumptionLevel === 'alto') {
    actions.push({
      id: 'map-peak-usage',
      title: peakConsumptionLabel ? 'Reduzir uso no horario de pico' : 'Mapear uso no horario de pico',
      description: peakConsumptionLabel
        ? `A fatura registrou ${peakConsumptionLabel} no pico${offPeakConsumptionLabel ? ` e ${offPeakConsumptionLabel} fora do pico` : ''}.`
        : daysBilledLabel
          ? `Voce consumiu ${formatKwhValue(invoice.consumption)} em ${daysBilledLabel}, com leitura alta para este perfil.`
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

  if (analysis.costSignal && analysis.costSignal !== 'controlado') {
    actions.push({
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
              ? 'Reduzir custo sem perder leitura do padrao'
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
    actions.push({
      id: 'return-next-bill',
      title: 'Adicionar a proxima fatura',
      description:
        tariffLabel || daysBilledLabel
          ? `Esta leitura ja trouxe ${tariffLabel ? `bandeira ${tariffLabel.toLowerCase()}` : daysBilledLabel}. Compare esse sinal no proximo ciclo.`
          : 'No proximo ciclo, adicione a nova fatura para comparar consumo e custo quando esses campos estiverem disponiveis.',
      value: 'Transformar leitura em evolucao',
      context: `A leitura atual e da fatura de ${monthLabel}; a comparacao melhora com outro ciclo.`,
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
        ? `Ja existe uma leitura recente para o perfil ${profileLabel}. O proximo foco e acompanhar a acao atual e comparar o proximo ciclo.`
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
          : 'a leitura ficou parcial';

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
      message: `O perfil ${profileLabel} ja permite uma leitura mais justa. Adicione uma fatura ao historico para ver apenas dados reais extraidos da conta.`,
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
