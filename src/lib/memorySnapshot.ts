import {
  getEnergyKnowledgeCatalog,
  getLearnedEnergyKnowledgeCount,
  isEnergyKnowledgeLearned,
} from '@/lib/energyKnowledge';
import {
  MvpState,
  InvoiceData,
  ScoreEvent,
  NextAction,
  EnergyKnowledgeCategory,
  EnergyKnowledgeId,
} from '@/types/mvp';

export interface MemoryProfileItem {
  label: string;
  value: string;
  source: string;
}

export interface MemoryTimelineItem {
  id: string;
  title: string;
  description: string;
  occurredAt?: string;
}

export interface MemoryEvidenceItem {
  label: string;
  detail: string;
}

export interface MemoryKnowledgeItem {
  category: EnergyKnowledgeCategory;
  id: EnergyKnowledgeId;
  learned: boolean;
  title: string;
}

export interface MemorySnapshot {
  focusedInvoiceLabel?: string;
  memoryProfile: {
    items: MemoryProfileItem[];
    confirmedSignals: string[];
  };
  memoryTimeline: {
    items: MemoryTimelineItem[];
  };
  memoryInsights: {
    facts: string[];
    confirmedContext: string[];
    observedBehavior: string[];
  };
  memoryGaps: {
    items: string[];
  };
  memoryEvidence: {
    dataUsed: MemoryEvidenceItem[];
    recommendationEvidence: string[];
  };
  memoryKnowledge: {
    items: MemoryKnowledgeItem[];
    learnedCount: number;
    totalCount: number;
  };
}

const formatCurrency = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? `R$ ${value.toFixed(2)}` : undefined;

const formatKwh = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? `${value} kWh` : undefined;

const getInvoiceLabel = (invoice?: InvoiceData) => {
  if (!invoice) {
    return undefined;
  }

  const month = invoice.month?.trim();
  if (month) {
    return month;
  }

  const referenceMonth = invoice.parser.fields.referenceMonth.value?.trim();
  return referenceMonth || 'Referencia nao identificada';
};

const getEventTimestamp = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? undefined : timestamp;
};

const uniqueStrings = (values: Array<string | undefined | null>) =>
  Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim())
    )
  );

const getFirstEventByType = (events: ScoreEvent[], type: ScoreEvent['type']) =>
  [...events]
    .filter((event) => event.type === type)
    .sort((left, right) => {
      const leftTime = getEventTimestamp(left.occurredAt) ?? 0;
      const rightTime = getEventTimestamp(right.occurredAt) ?? 0;
      return leftTime - rightTime;
    })[0];

const getLatestEventByType = (events: ScoreEvent[], type: ScoreEvent['type']) =>
  [...events]
    .filter((event) => event.type === type)
    .sort((left, right) => {
      const leftTime = getEventTimestamp(left.occurredAt) ?? 0;
      const rightTime = getEventTimestamp(right.occurredAt) ?? 0;
      return rightTime - leftTime;
    })[0];

const getOldestInvoice = (invoiceHistory: InvoiceData[]) =>
  [...invoiceHistory].sort((left, right) => {
    const leftTime = getEventTimestamp(left.uploadedAt) ?? 0;
    const rightTime = getEventTimestamp(right.uploadedAt) ?? 0;
    return leftTime - rightTime;
  })[0];

const getLatestPrimaryAction = (actions: NextAction[]) =>
  actions.find((action) => action.status !== 'completed') ?? actions[0];

const getAnsweredContextCount = (state: MvpState) =>
  Object.values(state.userContext.questions).filter((answer) => answer?.status === 'answered').length;

const getBehaviorAnsweredCount = (state: MvpState) =>
  state.energyBehaviorProfile.qualification.answeredDiagnosisCount ??
  Object.keys(state.energyBehaviorProfile.actionMemory.answeredActionPrompts ?? {}).length;

const buildProfileItems = (state: MvpState): MemoryProfileItem[] => {
  const items: MemoryProfileItem[] = [
    {
      label: 'Tipo de consumidor',
      value: state.profile.consumerType,
      source: 'Perfil',
    },
  ];

  if (state.profile.location.trim()) {
    items.push({
      label: 'Localizacao',
      value: state.profile.location.trim(),
      source: 'Perfil',
    });
  }

  if (state.profile.peopleCount > 0) {
    items.push({
      label: 'Moradores',
      value: `${state.profile.peopleCount}`,
      source: 'Perfil',
    });
  }

  if (state.profile.propertySize > 0) {
    items.push({
      label: 'Tamanho do imovel',
      value: `${state.profile.propertySize} m2`,
      source: 'Perfil',
    });
  }

  if (state.profile.energyPreference.trim()) {
    items.push({
      label: 'Perfil energetico',
      value: state.profile.energyPreference,
      source: 'Perfil',
    });
  }

  return items;
};

const buildConfirmedSignals = (state: MvpState) =>
  uniqueStrings([
    state.energyBehaviorProfile.habits.residenceType
      ? `Tipo de residencia: ${state.energyBehaviorProfile.habits.residenceType}`
      : undefined,
    state.energyBehaviorProfile.habits.roomCountRange
      ? `Comodos principais: ${state.energyBehaviorProfile.habits.roomCountRange}`
      : undefined,
    state.energyBehaviorProfile.habits.hasChildren === true
      ? 'Criancas na residencia'
      : undefined,
    state.energyBehaviorProfile.habits.hasElderly === true
      ? 'Idosos na residencia'
      : undefined,
    typeof state.energyBehaviorProfile.appliances.bathrooms === 'number'
      ? `${state.energyBehaviorProfile.appliances.bathrooms} banheiro(s) informado(s)`
      : undefined,
    state.userContext.questions.primary_goal?.status === 'answered'
      ? `Objetivo principal: ${state.userContext.questions.primary_goal.label}`
      : undefined,
    state.userContext.questions.usage_period?.status === 'answered'
      ? `Consumo mais forte em ${state.userContext.questions.usage_period.label?.toLowerCase()}`
      : undefined,
    state.userContext.questions.electric_shower?.status === 'answered'
      ? `Uso de chuveiro eletrico: ${state.userContext.questions.electric_shower.label?.toLowerCase()}`
      : undefined,
    state.energyBehaviorProfile.appliances.hasAirConditioning === true
      ? 'Ar-condicionado presente na rotina'
      : undefined,
    state.energyBehaviorProfile.appliances.hasElectricShower === true
      ? 'Chuveiro eletrico confirmado'
      : undefined,
    state.energyBehaviorProfile.appliances.hasExtraFridge === true
      ? 'Geladeira ou freezer extra confirmado'
      : undefined,
    typeof state.energyBehaviorProfile.appliances.showers === 'number'
      ? `${state.energyBehaviorProfile.appliances.showers} chuveiro(s) informado(s)`
      : undefined,
    state.energyBehaviorProfile.appliances.showerHeatingType
      ? `Aquecimento do banho: ${state.energyBehaviorProfile.appliances.showerHeatingType}`
      : undefined,
    state.energyBehaviorProfile.habits.usesHeavyLoadsAtNight === true
      ? 'Cargas pesadas entram a noite'
      : undefined,
    typeof state.energyBehaviorProfile.appliances.airConditioningCount === 'number' &&
    state.energyBehaviorProfile.appliances.airConditioningCount > 0
      ? `${state.energyBehaviorProfile.appliances.airConditioningCount} ar-condicionado(s) informado(s)`
      : undefined,
    state.energyBehaviorProfile.appliances.cookingType
      ? `Fogao principal: ${state.energyBehaviorProfile.appliances.cookingType}`
      : undefined,
    state.energyBehaviorProfile.appliances.hasElectricOven === true
      ? 'Forno eletrico presente'
      : undefined,
    state.energyBehaviorProfile.intentions.thermalComfortInterest === 'sim'
      ? 'Interesse em conforto termico'
      : undefined,
    state.energyBehaviorProfile.intentions.solarAnalysisInterest === 'sim'
      ? 'Interesse em analise solar'
      : undefined,
    state.energyBehaviorProfile.intentions.consultantInterest === 'sim'
      ? 'Interesse em apoio consultivo'
      : undefined,
    state.analysis.summary?.behaviorHighlights?.[0],
    state.analysis.summary?.behaviorHighlights?.[1],
    state.analysis.summary?.behaviorHighlights?.[2],
  ]);

const buildTimelineItems = (state: MvpState): MemoryTimelineItem[] => {
  const items: MemoryTimelineItem[] = [];
  const profileCompletedEvent = getFirstEventByType(state.scoreEvents, 'profile_completed');
  const firstInvoice = getOldestInvoice(state.analysis.invoiceHistory);
  const firstAnalysisEvent = getFirstEventByType(state.scoreEvents, 'analysis_completed');
  const latestAnalysisEvent = getLatestEventByType(state.scoreEvents, 'analysis_completed');
  const firstActionEvent = getFirstEventByType(state.scoreEvents, 'action_viewed');

  if (profileCompletedEvent) {
    items.push({
      id: profileCompletedEvent.id,
      title: 'Perfil pronto para personalizacao',
      description: profileCompletedEvent.label,
      occurredAt: profileCompletedEvent.occurredAt,
    });
  }

  if (firstInvoice) {
    items.push({
      id: `first-invoice:${firstInvoice.fingerprint}`,
      title: 'Primeira fatura enviada',
      description: getInvoiceLabel(firstInvoice)
        ? `A jornada passou a guardar o ciclo ${getInvoiceLabel(firstInvoice)} no historico.`
        : 'A jornada passou a guardar a primeira fatura no historico.',
      occurredAt: firstInvoice.uploadedAt,
    });
  }

  if (firstAnalysisEvent) {
    items.push({
      id: firstAnalysisEvent.id,
      title: 'Primeira analise concluida',
      description: firstAnalysisEvent.label,
      occurredAt: firstAnalysisEvent.occurredAt,
    });
  }

  if (latestAnalysisEvent && state.analysis.invoiceHistory.length > 1) {
    items.push({
      id: `analysis-history:${latestAnalysisEvent.id}`,
      title: 'Historico entre ciclos ativo',
      description: `${state.analysis.invoiceHistory.length} faturas ja alimentam a memoria da jornada.`,
      occurredAt: latestAnalysisEvent.occurredAt,
    });
  }

  if (firstActionEvent) {
    items.push({
      id: firstActionEvent.id,
      title: 'Primeira acao acompanhada',
      description: firstActionEvent.label,
      occurredAt: firstActionEvent.occurredAt,
    });
  }

  if (state.lastActiveAt && state.journeyStage === 'return-visit') {
    items.push({
      id: 'return-visit',
      title: 'Jornada retomada',
      description: 'A memoria da jornada permaneceu disponivel entre visitas.',
      occurredAt: state.lastActiveAt,
    });
  }

  return items.sort((left, right) => {
    const leftTime = getEventTimestamp(left.occurredAt) ?? 0;
    const rightTime = getEventTimestamp(right.occurredAt) ?? 0;
    return leftTime - rightTime;
  });
};

const buildInsightFacts = (state: MvpState, focusedInvoice?: InvoiceData) =>
  uniqueStrings([
    focusedInvoice ? `Fatura em foco: ${getInvoiceLabel(focusedInvoice)}` : undefined,
    formatKwh(focusedInvoice?.consumption)
      ? `Consumo identificado: ${formatKwh(focusedInvoice?.consumption)}`
      : undefined,
    formatCurrency(focusedInvoice?.totalValue)
      ? `Valor total identificado: ${formatCurrency(focusedInvoice?.totalValue)}`
      : undefined,
    focusedInvoice?.parser.fields.providerName.value
      ? `Distribuidora lida: ${focusedInvoice.parser.fields.providerName.value}`
      : undefined,
    focusedInvoice?.parser.fields.tariffFlag.value
      ? `Bandeira identificada: ${focusedInvoice.parser.fields.tariffFlag.value}`
      : undefined,
    state.analysis.summary?.evidenceItems?.[0]
      ? `${state.analysis.summary.evidenceItems[0].label}: ${state.analysis.summary.evidenceItems[0].value}`
      : undefined,
    state.analysis.summary?.evidenceItems?.[1]
      ? `${state.analysis.summary.evidenceItems[1].label}: ${state.analysis.summary.evidenceItems[1].value}`
      : undefined,
    state.analysis.summary?.evidenceItems?.[2]
      ? `${state.analysis.summary.evidenceItems[2].label}: ${state.analysis.summary.evidenceItems[2].value}`
      : undefined,
  ]);

const buildConfirmedContext = (state: MvpState) =>
  uniqueStrings([
    state.analysis.summary?.consultiveInsight?.profileContext?.contextSentence,
    state.analysis.summary?.observations?.[0],
    state.analysis.summary?.observations?.[1],
    state.userContext.questions.primary_goal?.status === 'answered'
      ? `Objetivo informado: ${state.userContext.questions.primary_goal.label}`
      : undefined,
    state.userContext.questions.usage_period?.status === 'answered'
      ? `Periodo informado: ${state.userContext.questions.usage_period.label}`
      : undefined,
  ]);

const buildObservedBehavior = (state: MvpState) =>
  uniqueStrings([
    ...(state.analysis.summary?.behaviorHighlights ?? []),
    ...(state.energyBehaviorProfile.actionMemory.startedActionTitles ?? []).map(
      (title) => `Acao registrada: ${title}`
    ),
  ]);

const buildMemoryGaps = (state: MvpState) => {
  const items = uniqueStrings([
    !state.energyBehaviorProfile.habits.residenceType
      ? 'Se a residencia e casa, apartamento, sobrado ou studio'
      : undefined,
    !state.energyBehaviorProfile.habits.roomCountRange
      ? 'Quantos comodos principais a casa tem'
      : undefined,
    typeof state.energyBehaviorProfile.habits.hasChildren !== 'boolean'
      ? 'Se existem criancas morando na residencia'
      : undefined,
    typeof state.energyBehaviorProfile.habits.hasElderly !== 'boolean'
      ? 'Se existem idosos morando na residencia'
      : undefined,
    typeof state.energyBehaviorProfile.appliances.bathrooms !== 'number'
      ? 'Quantos banheiros entram na rotina'
      : undefined,
    typeof state.energyBehaviorProfile.appliances.showers !== 'number'
      ? 'Quantos chuveiros entram na rotina'
      : undefined,
    !state.energyBehaviorProfile.appliances.showerHeatingType
      ? 'Se o banho depende mais de aquecimento eletrico ou gas'
      : undefined,
    typeof state.energyBehaviorProfile.appliances.hasAirConditioning !== 'boolean'
      ? 'Se existe ar-condicionado'
      : undefined,
    state.energyBehaviorProfile.appliances.hasAirConditioning === true &&
    typeof state.energyBehaviorProfile.appliances.airConditioningCount !== 'number'
      ? 'Quantos aparelhos de ar-condicionado entram na rotina'
      : undefined,
    !state.energyBehaviorProfile.appliances.cookingType
      ? 'Se a cozinha usa fogao a gas, eletrico ou misto'
      : undefined,
    typeof state.energyBehaviorProfile.appliances.hasElectricOven !== 'boolean'
      ? 'Se existe forno eletrico'
      : undefined,
    typeof state.energyBehaviorProfile.appliances.hasExtraFridge !== 'boolean'
      ? 'Se existe geladeira ou freezer extra'
      : undefined,
    typeof state.energyBehaviorProfile.appliances.hasWashingMachine !== 'boolean'
      ? 'Se existe maquina de lavar'
      : undefined,
    typeof state.energyBehaviorProfile.appliances.hasDryer !== 'boolean'
      ? 'Se existe secadora'
      : undefined,
    typeof state.energyBehaviorProfile.habits.usesHeavyLoadsAtNight !== 'boolean'
      ? 'Se cargas pesadas entram a noite'
      : undefined,
    !state.energyBehaviorProfile.habits.dominantUsageRoutine
      ? 'Em que periodo a rotina consome mais'
      : undefined,
    !state.energyBehaviorProfile.habits.laundryFrequency
      ? 'Qual a frequencia de lavanderia'
      : undefined,
    !state.energyBehaviorProfile.intentions.thermalComfortInterest
      ? 'Se existe interesse em conforto termico'
      : undefined,
    !state.energyBehaviorProfile.intentions.solarAnalysisInterest
      ? 'Se existe interesse em analise solar'
      : undefined,
    !state.energyBehaviorProfile.intentions.primaryObjective
      ? 'Qual objetivo principal vem primeiro'
      : undefined,
    !state.userContext.questions.usage_period
      ? 'Em qual periodo o consumo costuma ser maior'
      : undefined,
    !state.userContext.questions.primary_goal
      ? 'Qual objetivo principal da jornada'
      : undefined,
  ]);

  return items.slice(0, 6);
};

const buildDataUsed = (state: MvpState, focusedInvoice?: InvoiceData): MemoryEvidenceItem[] => {
  const profileFieldsCount = [
    Boolean(state.profile.consumerType),
    Boolean(state.profile.location.trim()),
    state.profile.propertySize > 0,
    state.profile.peopleCount > 0,
    Boolean(state.profile.energyPreference.trim()),
  ].filter(Boolean).length;
  const answeredContextCount = getAnsweredContextCount(state);
  const behaviorAnsweredCount = getBehaviorAnsweredCount(state);
  const items: MemoryEvidenceItem[] = [];

  if (profileFieldsCount > 0) {
    items.push({
      label: 'Perfil',
      detail: `${profileFieldsCount} campo(s) de contexto preenchido(s)`,
    });
  }

  if (focusedInvoice) {
    items.push({
      label: 'Fatura em foco',
      detail: getInvoiceLabel(focusedInvoice) || 'Fatura atual da jornada',
    });
  }

  if (state.analysis.invoiceHistory.length > 0) {
    items.push({
      label: 'Historico',
      detail: `${state.analysis.invoiceHistory.length} fatura(s) registrada(s)`,
    });
  }

  if (state.analysis.summary) {
    items.push({
      label: 'Resumo atual',
      detail: state.analysis.summary.efficiencyLabel,
    });
  }

  if (answeredContextCount > 0) {
    items.push({
      label: 'Respostas contextuais',
      detail: `${answeredContextCount} resposta(s) ja fornecida(s)`,
    });
  }

  if (behaviorAnsweredCount > 0) {
    items.push({
      label: 'Comportamento energetico',
      detail: `${behaviorAnsweredCount} sinal(is) salvo(s) na memoria`,
    });
  }

  if (state.actions.viewedActionIds.length > 0) {
    items.push({
      label: 'Acoes acompanhadas',
      detail: `${state.actions.viewedActionIds.length} acao(oes) ja revisada(s)`,
    });
  }

  return items;
};

const buildRecommendationEvidence = (state: MvpState) => {
  const currentAction = getLatestPrimaryAction(state.actions.items);

  return uniqueStrings([
    ...(currentAction?.usedDataPoints ?? []),
    ...(currentAction?.knownBehaviorSummary ?? []),
    ...(currentAction?.answeredQuestionSummaries ?? []),
    ...(state.analysis.summary?.evidenceItems ?? []).map(
      (item) => `${item.label}: ${item.value}`
    ),
  ]).slice(0, 6);
};

const buildKnowledgeItems = (state: MvpState): MemoryKnowledgeItem[] =>
  getEnergyKnowledgeCatalog().map((knowledge) => ({
    category: knowledge.category,
    id: knowledge.id,
    learned: isEnergyKnowledgeLearned(state.knowledge, knowledge.id),
    title: knowledge.title,
  }));

export const buildMemorySnapshot = (
  state: MvpState,
  selectedInvoice?: InvoiceData
): MemorySnapshot => {
  const focusedInvoice = selectedInvoice ?? state.analysis.latestInvoice;
  const knowledgeItems = buildKnowledgeItems(state);

  return {
    focusedInvoiceLabel: getInvoiceLabel(focusedInvoice),
    memoryProfile: {
      items: buildProfileItems(state),
      confirmedSignals: buildConfirmedSignals(state),
    },
    memoryTimeline: {
      items: buildTimelineItems(state),
    },
    memoryInsights: {
      facts: buildInsightFacts(state, focusedInvoice),
      confirmedContext: buildConfirmedContext(state),
      observedBehavior: buildObservedBehavior(state),
    },
    memoryGaps: {
      items: buildMemoryGaps(state),
    },
    memoryEvidence: {
      dataUsed: buildDataUsed(state, focusedInvoice),
      recommendationEvidence: buildRecommendationEvidence(state),
    },
    memoryKnowledge: {
      items: knowledgeItems,
      learnedCount: getLearnedEnergyKnowledgeCount(state.knowledge),
      totalCount: knowledgeItems.length,
    },
  };
};
