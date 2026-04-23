import {
  AnalysisSummary,
  InvoiceData,
  JourneyStage,
  MascotGuidance,
  NextAction,
  ScoreEvent,
  ScoreState,
  UserProfileData,
} from '@/types/mvp';

const SCORE_EVENT_POINTS = {
  profile_completed: 80,
  invoice_uploaded: 120,
  analysis_completed: 100,
  action_viewed: 30,
} as const;

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
  const observations: string[] = [];

  if (consumptionLevel === 'alto') {
    observations.push(
      `O consumo estimado ficou alto para um perfil ${resolvedProfile.consumerType.toLowerCase()}, o que sugere gasto concentrado ou uso pouco eficiente.`
    );
  } else if (consumptionLevel === 'moderado') {
    observations.push(
      'O consumo estimado esta em uma faixa intermediaria, com espaco claro para ajustes simples antes de pensar em investimentos maiores.'
    );
  } else {
    observations.push(
      'O consumo estimado ficou em uma faixa positiva para este perfil, indicando uma base eficiente para evoluir o score com consistencia.'
    );
  }

  if (costSignal === 'elevado') {
    observations.push(
      'O valor da conta pede atencao imediata porque o custo final esta alto mesmo para o contexto atual do usuario.'
    );
  } else if (invoice.peakHours.includes('18:00') || invoice.peakHours.includes('17:00')) {
    observations.push(
      'Os horarios de pico merecem foco porque parte importante do gasto pode estar concentrada no fim do dia.'
    );
  } else {
    observations.push(
      'O proximo ganho mais provavel vem de acompanhar rotina e uso de equipamentos antes de partir para uma mudanca estrutural.'
    );
  }

  if (resolvedProfile.energyPreference === 'Solar' && costSignal !== 'controlado') {
    observations[1] =
      'Como o perfil ja sinaliza interesse em energia solar, vale usar este ciclo para medir melhor padroes de uso antes de avaliar qualquer solucao maior.';
  }

  const whatMattersNext =
    consumptionLevel === 'alto'
      ? 'O que mais importa agora e reduzir desperdicios visiveis e observar quais usos acontecem no horario de maior impacto.'
      : costSignal === 'elevado'
        ? 'O que mais importa agora e controlar o custo da proxima fatura com uma mudanca simples e mensuravel.'
        : 'O que mais importa agora e manter a consistencia e registrar uma proxima fatura para comparar evolucao.';

  return {
    consumptionLevel,
    costSignal,
    headline: `Consumo ${consumptionLevel} e sinal de custo ${costSignal}.`,
    observations: observations.slice(0, 2),
    whatMattersNext,
    efficiencyLabel:
      consumptionLevel === 'baixo'
        ? 'Base eficiente'
        : consumptionLevel === 'moderado'
          ? 'Eficiencia em ajuste'
          : 'Eficiencia sob atencao',
  };
};

export const buildNextActions = (
  invoice: InvoiceData | undefined,
  analysis: AnalysisSummary | undefined,
  profile?: Partial<UserProfileData>
): NextAction[] => {
  const resolvedProfile = getResolvedProfile(profile);
  const actions: NextAction[] = [];

  if (invoice && !analysis) {
    actions.push({
      id: 'continue-after-analysis',
      title: 'Continuar quando o resumo estiver pronto',
      description:
        'A fatura ja foi enviada. O proximo passo valido agora e revisar o resumo assim que a analise for concluida.',
      value: 'Mantem a jornada coerente entre envio e leitura',
      priority: 'high',
      status: 'new',
      source: 'invoice',
    });

    return actions;
  }

  if (!invoice || !analysis) {
    actions.push({
      id: 'complete-profile',
      title: isProfileComplete(resolvedProfile) ? 'Enviar a primeira fatura' : 'Completar o perfil',
      description: isProfileComplete(resolvedProfile)
        ? 'Use sua conta de luz mais recente para desbloquear uma analise personalizada.'
        : 'Preencha local, tipo de consumidor e tamanho do imovel para tornar a analise mais justa.',
      value: isProfileComplete(resolvedProfile)
        ? 'Desbloqueia analise e score inicial'
        : 'Melhora personalizacao da jornada',
      priority: 'high',
      status: 'new',
      source: isProfileComplete(resolvedProfile) ? 'journey' : 'profile',
    });

    return actions;
  }

  if (analysis.consumptionLevel === 'alto') {
    actions.push({
      id: 'map-peak-usage',
      title: 'Mapear usos no horario de pico',
      description: `Liste os principais equipamentos usados entre ${invoice.peakHours} para identificar onde o consumo esta mais pesado.`,
      value: 'Ajuda a reduzir desperdicios logo no proximo ciclo',
      priority: 'high',
      status: 'new',
      source: 'analysis',
    });
  }

  if (analysis.costSignal !== 'controlado') {
    actions.push({
      id: 'choose-one-cost-cut',
      title: 'Testar uma acao de corte de custo',
      description:
        'Escolha uma mudanca simples para este mes, como reduzir uso simultaneo de aparelhos ou rever iluminacao recorrente.',
      value: 'Cria um teste claro para comparar a proxima fatura',
      priority: 'high',
      status: 'new',
      source: 'analysis',
    });
  }

  if (resolvedProfile.energyPreference === 'Solar' || resolvedProfile.energyPreference === 'Hibrido') {
    actions.push({
      id: 'record-demand-pattern',
      title: 'Registrar padrao de demanda do imovel',
      description:
        'Anote em quais periodos o consumo parece mais intenso antes de avaliar qualquer investimento maior.',
      value: 'Evita decisoes grandes sem contexto suficiente',
      priority: 'medium',
      status: 'new',
      source: 'profile',
    });
  }

  if (actions.length < 3) {
    actions.push({
      id: 'return-next-bill',
      title: 'Voltar com a proxima fatura',
      description: 'Repita o envio no proximo ciclo para acompanhar evolucao real do score e do consumo.',
      value: 'Transforma uma leitura isolada em progresso visivel',
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
}: {
  stage: JourneyStage;
  profile?: Partial<UserProfileData>;
  invoice?: InvoiceData;
  analysis?: AnalysisSummary;
}): MascotGuidance => {
  const resolvedProfile = getResolvedProfile(profile);
  const profileLabel = resolvedProfile.location
    ? `${resolvedProfile.consumerType.toLowerCase()} em ${resolvedProfile.location}`
    : resolvedProfile.consumerType.toLowerCase();

  if (stage === 'return-visit') {
    return {
      stage,
      title: 'Vamos retomar de onde voce parou',
      message: analysis
        ? `Ja existe uma leitura recente para o seu perfil ${profileLabel}. Podemos continuar pelo que mais importa agora: acompanhar a proxima acao e comparar a evolucao da fatura.`
        : `Que bom ver voce de volta. O proximo passo mais util continua sendo enviar uma fatura para transformar o perfil ${profileLabel} em orientacoes praticas.`,
    };
  }

  if (stage === 'invoice-uploaded') {
    return {
      stage,
      title: 'Recebi sua fatura',
      message: `Agora estou transformando esse envio em um resumo simples para o seu perfil ${profileLabel}. Vou destacar o que merece atencao primeiro e evitar termos tecnicos desnecessarios.`,
    };
  }

  if (stage === 'analysis-ready' && invoice && analysis) {
    return {
      stage,
      title: 'Resumo pronto para agir',
      message: `Na fatura de ${invoice.month}, o consumo ficou ${analysis.consumptionLevel} e o ponto principal agora e: ${analysis.whatMattersNext.toLowerCase()}`,
    };
  }

  if (isProfileComplete(resolvedProfile)) {
    return {
      stage: 'before-upload',
      title: 'Seu contexto ja ajuda',
      message: `Seu perfil ${profileLabel} ja esta pronto o suficiente para uma leitura mais justa. Envie a fatura mais recente e eu mostro os sinais principais de consumo e custo.`,
    };
  }

  return {
    stage: 'onboarding',
    title: 'Vamos montar sua base primeiro',
    message:
      'Complete um perfil simples e depois envie sua conta de luz. Assim a analise fica mais clara, o score fica explicavel e os proximos passos deixam de ser genericos.',
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

export const addScoreEvent = (events: ScoreEvent[], nextEvent: ScoreEvent) => {
  if (events.some((event) => event.id === nextEvent.id)) {
    return events;
  }

  return [nextEvent, ...events];
};

export const getScoreState = (events: ScoreEvent[]): ScoreState => {
  const score = events.reduce((total, event) => total + event.points, 0);
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
