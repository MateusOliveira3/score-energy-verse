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

const CONSUMER_BASELINE = {
  Residencial: 190,
  Comercial: 420,
  Restaurante: 560,
  Escola: 500,
  Industria: 920,
} as const;

const CONSUMER_THRESHOLDS = {
  Residencial: { low: 220, medium: 340 },
  Comercial: { low: 500, medium: 760 },
  Restaurante: { low: 650, medium: 900 },
  Escola: { low: 620, medium: 860 },
  Industria: { low: 1100, medium: 1500 },
} as const;

const CONSUMER_TARIFF = {
  Residencial: 0.92,
  Comercial: 1.04,
  Restaurante: 1.08,
  Escola: 0.95,
  Industria: 0.89,
} as const;

const PEAK_HOURS = {
  Residencial: '18:00-22:00',
  Comercial: '13:00-18:00',
  Restaurante: '17:00-22:00',
  Escola: '08:00-12:00',
  Industria: '14:00-20:00',
} as const;

const PREFERENCE_ADJUSTMENT = {
  Convencional: 0,
  Solar: -25,
  Hibrido: -12,
  Eolica: -18,
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

const hashString = (value: string) =>
  value.split('').reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0);

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

export const interpretInvoiceFile = (
  file: File,
  profile?: Partial<UserProfileData>
): InvoiceData => {
  const resolvedProfile = getResolvedProfile(profile);
  const consumerType =
    resolvedProfile.consumerType in CONSUMER_BASELINE
      ? (resolvedProfile.consumerType as keyof typeof CONSUMER_BASELINE)
      : 'Residencial';
  const fingerprint = `${file.name}-${file.size}-${file.lastModified}-${file.type || 'unknown'}`;
  const fileSignal = hashString(fingerprint);
  const locationSignal = hashString(resolvedProfile.location || 'sem-localidade');
  const baseConsumption = CONSUMER_BASELINE[consumerType];
  const propertySignal = clamp(Math.round(resolvedProfile.propertySize / 12), 0, 180);
  const peopleSignal = clamp(resolvedProfile.peopleCount * 11, 0, 120);
  const preferenceSignal =
    PREFERENCE_ADJUSTMENT[
      (resolvedProfile.energyPreference as keyof typeof PREFERENCE_ADJUSTMENT) || 'Convencional'
    ] ?? 0;
  const fileSizeSignal = clamp(Math.round(file.size / 15000), 0, 60);
  const hashSignal = fileSignal % 90;
  const regionSignal = locationSignal % 24;
  const consumption = clamp(
    baseConsumption + propertySignal + peopleSignal + fileSizeSignal + hashSignal + preferenceSignal,
    Math.round(baseConsumption * 0.7),
    Math.round(baseConsumption * 1.9)
  );
  const taxPercentage = 22 + (regionSignal % 11);
  const tariff = CONSUMER_TARIFF[consumerType];
  const subtotal = Math.round(consumption * tariff);
  const totalValue = Math.round(subtotal * (1 + taxPercentage / 100));
  const referenceDate = new Date(file.lastModified || Date.now());
  const month = referenceDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return {
    fingerprint,
    fileName: file.name,
    fileType: file.type || 'arquivo',
    fileSize: file.size,
    consumption,
    totalValue,
    taxPercentage,
    peakHours: PEAK_HOURS[consumerType],
    month,
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
  const consumptionLevel = getConsumptionLevel(invoice.consumption, resolvedProfile.consumerType);
  const costSignal = getCostSignal(invoice.totalValue);
  const costSignalLabel = costSignal === 'atencao' ? 'atenção' : costSignal;
  const observations: string[] = [];

  if (consumptionLevel === 'alto') {
    observations.push(
      `O consumo estimado ficou alto para um perfil ${resolvedProfile.consumerType.toLowerCase()}, o que sugere gasto concentrado ou uso pouco eficiente.`
    );
  } else if (consumptionLevel === 'moderado') {
    observations.push(
      'O consumo estimado está em uma faixa intermediária, com espaço para ajustes simples antes de pensar em investimentos maiores.'
    );
  } else {
    observations.push(
      'O consumo estimado ficou em uma faixa positiva para este perfil, indicando uma base eficiente para evoluir com consistência.'
    );
  }

  if (costSignal === 'elevado') {
    observations.push(
      'O valor da conta pede atenção porque o custo final está alto para o contexto atual do usuário.'
    );
  } else if (invoice.peakHours.includes('18:00') || invoice.peakHours.includes('17:00')) {
    observations.push(
      'Os horários de pico merecem foco porque parte do gasto pode estar concentrada nesse período.'
    );
  } else {
    observations.push(
      'O próximo ganho provável vem de acompanhar rotina e uso de equipamentos antes de uma mudança estrutural.'
    );
  }

  if (resolvedProfile.energyPreference === 'Solar' && costSignal !== 'controlado') {
    observations[1] =
      'Como o perfil já sinaliza interesse em energia solar, vale medir padrões de uso antes de avaliar uma solução maior.';
  }

  const whatMattersNext =
    consumptionLevel === 'alto'
      ? 'O que mais importa agora é reduzir desperdícios visíveis e observar usos no horário de maior impacto.'
      : costSignal === 'elevado'
        ? 'O que mais importa agora é controlar o custo da próxima fatura com uma mudança simples e mensurável.'
        : 'O que mais importa agora é manter consistência e enviar a próxima fatura para comparar evolução.';

  return {
    consumptionLevel,
    costSignal,
    headline: `Consumo ${consumptionLevel} e sinal de custo ${costSignalLabel}.`,
    observations: observations.slice(0, 2),
    whatMattersNext,
    efficiencyLabel:
      consumptionLevel === 'baixo'
        ? 'Base eficiente'
        : consumptionLevel === 'moderado'
          ? 'Eficiência em ajuste'
          : 'Eficiência sob atenção',
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

  if (invoice && !analysis) {
    actions.push({
      id: 'continue-after-analysis',
      title: 'Continuar quando o resumo estiver pronto',
      description:
        'Fatura enviada. Revise o resumo antes de mudar a rotina.',
      value: 'Mantém envio e leitura alinhados',
      context: `Use na fatura de ${invoice.month}, enquanto o resumo ainda não estiver pronto.`,
      suggestion:
        'Confira consumo, custo e horário de pico antes de iniciar uma ação.',
      impact: `Prepara a próxima ação revisada (+${actionReviewPoints} pontos ao revisar).`,
      validation: 'Resumo pronto antes de novas mudanças.',
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
      title: hasCompleteProfile ? 'Enviar a primeira fatura' : 'Completar perfil mínimo',
      description: hasCompleteProfile
        ? 'Envie a conta de luz mais recente para gerar uma leitura personalizada.'
        : 'Preencha local, tipo de consumidor, tamanho do imóvel e pessoas.',
      value: hasCompleteProfile
        ? 'Libera análise e score inicial'
        : 'Personaliza a jornada',
      context: hasCompleteProfile
        ? `Perfil ${profileLabel} já tem contexto; falta a fatura real.`
        : 'Use antes da primeira fatura, enquanto o contexto ainda é mínimo.',
      suggestion: hasCompleteProfile
        ? 'Separe a fatura mais recente em PDF, JPG ou PNG.'
        : 'Priorize cidade, tipo de consumidor, tamanho do imóvel e pessoas.',
      impact: hasCompleteProfile
        ? `Pode somar até ${invoiceCyclePoints} pontos com fatura e análise.`
        : `Pode liberar perfil completo (+${SCORE_EVENT_POINTS.profile_completed} pontos).`,
      validation: hasCompleteProfile
        ? 'Fatura aparece no histórico e gera resumo.'
        : 'Perfil com pelo menos 80% de completude.',
      priority: 'high',
      status: 'new',
      source: hasCompleteProfile ? 'journey' : 'profile',
    });

    return actions;
  }

  if (analysis.consumptionLevel === 'alto') {
    actions.push({
      id: 'map-peak-usage',
      title: 'Mapear uso no horário de pico',
      description: `Por 3 dias, liste os principais equipamentos usados entre ${invoice.peakHours} para descobrir onde o consumo pesa mais.`,
      value: 'Encontrar desperdícios visíveis',
      context: `Prioridade alta porque a fatura de ${invoice.month} mostrou consumo alto para um perfil ${profileLabel}.`,
      suggestion:
        electricShowerUsage === 'daily' || electricShowerUsage === 'sometimes'
          ? 'Anote chuveiro, ar-condicionado, forno e outros usos simultâneos.'
          : usagePeriod === 'night'
            ? 'Anote o que mais pesa no uso noturno e no horário de pico.'
            : primaryGoal === 'understand_consumption'
              ? 'Anote os usos para observar melhor o padrão de consumo.'
              : 'Anote chuveiro, ar-condicionado, forno, máquinas e usos simultâneos.',
      impact: `Ajuda a escolher um ajuste mais provável (+${actionReviewPoints} pontos ao revisar).`,
      validation: 'Liste os 2 ou 3 usos mais frequentes no pico.',
      priority: 'high',
      status: 'new',
      source: 'analysis',
    });
  }

  if (analysis.costSignal !== 'controlado') {
    actions.push({
      id: 'choose-one-cost-cut',
      title: 'Testar um corte de custo por 7 dias',
      description:
        `Escolha uma mudança simples para testar nesta semana, de preferência perto de ${invoice.peakHours}.`,
      value:
        primaryGoal === 'reduce_cost'
          ? 'Buscar impacto direto na fatura'
          : primaryGoal === 'understand_consumption'
            ? 'Observar padrão com um teste comparável'
            : primaryGoal === 'both'
              ? 'Reduzir custo sem perder leitura do padrão'
              : 'Criar um teste comparável',
      context: `O sinal de custo está ${analysis.costSignal}; comece por um teste pequeno.`,
      suggestion:
        'Reduza uso simultâneo, encurte um uso intenso ou revise luzes recorrentes.',
      impact: `Transforma recomendação em comportamento acompanhado (+${actionReviewPoints} pontos ao revisar).`,
      validation: 'Aplicar em pelo menos 5 dos 7 dias.',
      priority: 'high',
      status: 'new',
      source: 'analysis',
    });
  }

  if (resolvedProfile.energyPreference === 'Solar' || resolvedProfile.energyPreference === 'Hibrido') {
    actions.push({
      id: 'record-demand-pattern',
      title: 'Registrar padrão de demanda',
      description:
        'Anote quando o consumo parece mais intenso antes de avaliar energia solar, híbrida ou outro investimento.',
      value: 'Evitar decisão sem contexto',
      context: `O perfil indica preferência ${resolvedProfile.energyPreference}; antes de decidir, vale entender a rotina real do imóvel.`,
      suggestion:
        'Por uma semana, marque manhã, tarde ou noite como período de maior uso.',
      impact: `Melhora a decisão e mantém o score conectado a ações observáveis (+${actionReviewPoints} pontos ao revisar).`,
      validation: 'Ter pelo menos 5 dias anotados.',
      priority: 'medium',
      status: 'new',
      source: 'profile',
    });
  }

  if (actions.length < 3) {
    actions.push({
      id: 'return-next-bill',
      title: 'Enviar a próxima fatura',
      description:
        'No próximo ciclo, envie a nova fatura para comparar consumo e custo.',
      value: 'Transformar leitura em evolução',
      context: `A leitura atual é da fatura de ${invoice.month}; a comparação melhora com outro ciclo.`,
      suggestion:
        primaryGoal === 'reduce_cost'
          ? 'Guarde a próxima conta para ver se o custo responde ao ajuste.'
          : primaryGoal === 'understand_consumption'
            ? 'Guarde a próxima conta para observar se o padrão se repete.'
            : 'Guarde a próxima conta e volte quando ela estiver disponível.',
      impact: `Pode somar até ${invoiceCyclePoints} pontos em novo ciclo de fatura e análise.`,
      validation: 'Próxima fatura aparece no histórico.',
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
        ? `Já existe uma leitura recente para o perfil ${profileLabel}. O próximo foco é acompanhar a ação atual e comparar a próxima fatura.`
        : `Que bom ver você de volta. O passo mais útil agora é enviar uma fatura para gerar um resumo simples do perfil ${profileLabel}.`,
    };
  }

  if (stage === 'invoice-uploaded') {
    return {
      stage,
      title: 'Fatura recebida',
      message: `Agora o sistema gera um resumo simples para o perfil ${profileLabel}, destacando consumo, custo e próximo passo.`,
    };
  }

  if (stage === 'analysis-ready' && invoice && analysis) {
    return {
      stage,
      title: 'Resumo do momento',
      message: `Na fatura de ${invoice.month}, o consumo ficou ${analysis.consumptionLevel}${primaryGoal === 'reduce_cost' ? ', com foco em reduzir custo' : primaryGoal === 'understand_consumption' ? ', para entender melhor o consumo' : usagePeriod === 'night' ? ', com atenção ao uso noturno' : ''}. Próximo foco: ${analysis.whatMattersNext.toLowerCase()}`,
    };
  }

  if (isProfileComplete(resolvedProfile)) {
    return {
      stage: 'before-upload',
      title: 'Contexto suficiente',
      message: `O perfil ${profileLabel} já permite uma leitura mais justa. Envie a fatura mais recente para ver consumo, custo e próximo passo.`,
    };
  }

  return {
    stage: 'onboarding',
    title: 'Monte sua base primeiro',
    message:
      'Complete um perfil simples e depois envie sua conta de luz. Assim a análise fica mais clara, o score fica explicável e os próximos passos deixam de ser genéricos.',
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
