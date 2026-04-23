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
import { parseInvoiceFile } from '@/lib/invoiceParser';

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

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const hasNumericValue = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

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
  const totalValue = parser.fields.totalValue.value;
  const taxesTotal = parser.fields.taxesTotal.value;
  const taxPercentage =
    hasNumericValue(totalValue) && totalValue > 0 && hasNumericValue(taxesTotal)
      ? Math.round((taxesTotal / totalValue) * 100)
      : undefined;

  return {
    fingerprint,
    fileName: file.name,
    fileType: file.type || 'arquivo',
    fileSize: file.size,
    consumption: parser.fields.consumptionKwh.value,
    totalValue,
    taxPercentage,
    peakHours: undefined,
    month: parser.fields.referenceMonth.value ?? 'Referencia nao identificada',
    parser,
  };
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
  profile?: Partial<UserProfileData>
): AnalysisSummary => {
  const resolvedProfile = getResolvedProfile(profile);
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

  if (consumptionLevel === 'alto') {
    observations.push(
      `O consumo extraido ficou alto para um perfil ${resolvedProfile.consumerType.toLowerCase()}, o que pede revisao de rotina e cargas mais pesadas.`
    );
  } else if (consumptionLevel === 'moderado') {
    observations.push(
      'O consumo extraido ficou em faixa intermediaria, com espaco para ajustes simples antes de qualquer decisao maior.'
    );
  } else if (consumptionLevel === 'baixo') {
    observations.push(
      'O consumo extraido ficou em faixa mais contida para este perfil, o que ajuda a comparar os proximos ciclos com mais clareza.'
    );
  } else {
    observations.push(
      invoice.parser.rawTextAvailable
        ? 'A leitura encontrou texto na fatura, mas nao identificou consumo com confianca suficiente.'
        : 'A leitura nao encontrou texto aproveitavel na fatura; nenhum consumo foi assumido.'
    );
  }

  if (costSignal === 'elevado') {
    observations.push(
      'O valor total extraido pede atencao porque o custo final ficou alto para o contexto atual do usuario.'
    );
  } else if (costSignal === 'atencao') {
    observations.push(
      'O valor total extraido merece acompanhamento no proximo ciclo para confirmar tendencia de custo.'
    );
  } else if (costSignal === 'controlado') {
    observations.push(
      'O valor total extraido ficou mais controlado, entao a proxima leitura deve focar consistencia e comparacao entre ciclos.'
    );
  } else if (dueDate) {
    observations.push(
      `A conta trouxe vencimento em ${dueDate}, mas o valor total nao foi identificado com seguranca.`
    );
  } else {
    observations.push(
      'Os campos economicos ainda estao parciais; o parser preservou ausencia segura em vez de assumir valores.'
    );
  }

  if (resolvedProfile.energyPreference === 'Solar' && costSignal && costSignal !== 'controlado') {
    observations[1] =
      'Como o perfil ja sinaliza interesse em energia solar, vale primeiro consolidar uma leitura confiavel do consumo antes de avaliar qualquer solucao maior.';
  }

  const whatMattersNext =
    consumptionLevel === 'alto'
      ? 'O que mais importa agora e reduzir desperdicios visiveis e observar os usos de maior impacto.'
      : costSignal === 'elevado'
        ? 'O que mais importa agora e controlar o custo no proximo ciclo com uma mudanca simples e mensuravel.'
        : hasConsumption || hasCost
          ? 'O que mais importa agora e manter consistencia e adicionar a proxima fatura para comparar evolucao.'
          : 'O que mais importa agora e enviar uma fatura textual legivel ou validar manualmente os campos essenciais que nao foram encontrados.';

  return {
    consumptionLevel,
    costSignal,
    headline:
      hasConsumption && hasCost
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
      title: 'Mapear uso no horario de pico',
      description: `Por 3 dias, liste os principais equipamentos usados em ${usageWindowLabel} para descobrir onde o consumo pesa mais.`,
      value: 'Encontrar desperdicios visiveis',
      context: `Prioridade alta porque a fatura de ${monthLabel} mostrou consumo alto para um perfil ${profileLabel}.`,
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
      description: `Escolha uma mudanca simples para testar nesta semana, de preferencia perto de ${usageWindowLabel}.`,
      value:
        primaryGoal === 'reduce_cost'
          ? 'Buscar impacto direto na fatura'
          : primaryGoal === 'understand_consumption'
            ? 'Observar padrao com um teste comparavel'
            : primaryGoal === 'both'
              ? 'Reduzir custo sem perder leitura do padrao'
              : 'Criar um teste comparavel',
      context: `O sinal de custo esta ${analysis.costSignal}; comece por um teste pequeno.`,
      suggestion: 'Reduza uso simultaneo, encurte um uso intenso ou revise luzes recorrentes.',
      impact: `Transforma recomendacao em comportamento acompanhado (+${actionReviewPoints} pontos ao revisar).`,
      validation: 'Aplicar em pelo menos 5 dos 7 dias.',
      priority: 'high',
      status: 'new',
      source: 'analysis',
    });
  }

  if (
    resolvedProfile.energyPreference === 'Solar' ||
    resolvedProfile.energyPreference === 'Hibrido'
  ) {
    actions.push({
      id: 'record-demand-pattern',
      title: 'Registrar padrao de demanda',
      description:
        'Anote quando o consumo parece mais intenso antes de avaliar energia solar, hibrida ou outro investimento.',
      value: 'Evitar decisao sem contexto',
      context: `O perfil indica preferencia ${resolvedProfile.energyPreference}; antes de decidir, vale entender a rotina real do imovel.`,
      suggestion: 'Por uma semana, marque manha, tarde ou noite como periodo de maior uso.',
      impact: `Melhora a decisao e mantem o score conectado a acoes observaveis (+${actionReviewPoints} pontos ao revisar).`,
      validation: 'Ter pelo menos 5 dias anotados.',
      priority: 'medium',
      status: 'new',
      source: 'profile',
    });
  }

  if (actions.length < 3) {
    actions.push({
      id: 'return-next-bill',
      title: 'Adicionar a proxima fatura',
      description:
        'No proximo ciclo, adicione a nova fatura para comparar consumo e custo quando esses campos estiverem disponiveis.',
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

  return actions.slice(0, 3);
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
