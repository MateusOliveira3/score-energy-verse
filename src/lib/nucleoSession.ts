import { MemorySnapshot } from '@/lib/memorySnapshot';
import { getLastLearnedEnergyKnowledge, getNextEnergyKnowledge } from '@/lib/energyKnowledge';
import { buildActionResultLink, buildInvoiceComparison } from '@/lib/mvpJourneyState';
import {
  AnalysisSummary,
  EnergyKnowledgeState,
  InvoiceData,
  JourneyStage,
  MascotGuidance,
  MvpState,
  NextAction,
  ScoreState,
  UserProfileData,
} from '@/types/mvp';

export type NucleoVisualState =
  | 'loading'
  | 'profile'
  | 'upload'
  | 'processing'
  | 'guided'
  | 'complete';

export type NucleoBeatId = 'observa' | 'relaciona' | 'memoriza' | 'orienta';

export interface NucleoBeat {
  id: NucleoBeatId;
  icon: 'scan' | 'link' | 'memory' | 'compass';
  tag: string;
  title: string;
}

export interface NucleoSessionViewModel {
  visualState: NucleoVisualState;
  activeBeatId: NucleoBeatId;
  beats: NucleoBeat[];
  userName: string;
  welcomeTitle: string;
  welcomeMessage: string;
  scoreSummary: {
    level: number;
    nextLevelScore: number;
    points: number;
    progressPercent: number;
  };
  cycleSummary: {
    invoices: number;
    stage: JourneyStage;
    headline: string;
    support: string;
  };
  observe: {
    title: string;
    invoiceLabel: string;
    facts: Array<{ label: string; value: string }>;
    extractedSignals: string[];
  };
  relate: {
    title: string;
    summary: string;
    support: string;
    chips: string[];
  };
  memorize: {
    title: string;
    summary: string;
    learnedCount: number;
    totalKnowledge: number;
    confirmedSignals: string[];
    latestKnowledge?: string;
    nextKnowledge?: string;
  };
  orient: {
    title: string;
    summary: string;
    actionTitle?: string;
    actionValue?: string;
    evidence: string[];
    followUp?: string;
    statusLabel: string;
  };
}

interface BuildNucleoSessionInput {
  isJourneyHydrated: boolean;
  isProfileComplete: boolean;
  journeyState: MvpState;
  profile: UserProfileData;
  scoreState: ScoreState;
  latestInvoice?: InvoiceData;
  invoiceHistory: InvoiceData[];
  latestAnalysis?: AnalysisSummary;
  nextActions: NextAction[];
  knowledgeState: EnergyKnowledgeState;
  mascotGuidance: MascotGuidance;
  memorySnapshot?: MemorySnapshot;
}

const BEATS: NucleoBeat[] = [
  { id: 'observa', icon: 'scan', tag: 'recebe a conta', title: 'Observa' },
  { id: 'relaciona', icon: 'link', tag: 'conecta sinais', title: 'Relaciona' },
  { id: 'memoriza', icon: 'memory', tag: 'guarda o que importa', title: 'Memoriza' },
  { id: 'orienta', icon: 'compass', tag: 'proxima decisao', title: 'Orienta' },
];

const formatCurrency = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? `R$ ${value.toFixed(2)}` : undefined;

const formatConsumption = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? `${value} kWh` : undefined;

const getInvoiceLabel = (invoice?: InvoiceData) => {
  if (!invoice) {
    return 'Primeira leitura pendente';
  }

  const month = invoice.month?.trim();

  if (month) {
    return month;
  }

  return invoice.parser.fields.referenceMonth.value?.trim() || 'Referencia nao identificada';
};

const getUserName = (profile: UserProfileData) => {
  const locationLabel = profile.location.trim();

  if (locationLabel) {
    return locationLabel;
  }

  return profile.consumerType || 'sua jornada';
};

const getPrimaryAction = (actions: NextAction[]) =>
  actions.find((action) => action.status !== 'completed') ?? actions[0];

const getActionStatusLabel = (action?: NextAction) => {
  switch (action?.status) {
    case 'completed':
      return 'Acao registrada como testada';
    case 'in_progress':
      return 'Acao em andamento';
    case 'viewed':
      return 'Acao priorizada para este ciclo';
    default:
      return 'Acao pronta para comecar';
  }
};

const buildObserveFacts = (invoice?: InvoiceData) => {
  if (!invoice) {
    return [];
  }

  const facts = [
    { label: 'Consumo lido', value: formatConsumption(invoice.consumption) },
    { label: 'Valor total', value: formatCurrency(invoice.totalValue) },
    { label: 'Distribuidora', value: invoice.parser.fields.providerName.value },
    { label: 'Bandeira', value: invoice.parser.fields.tariffFlag.value },
    { label: 'Vencimento', value: invoice.parser.fields.dueDate.value },
  ];

  return facts.filter((fact): fact is { label: string; value: string } => Boolean(fact.value));
};

const buildExtractedSignals = (invoice?: InvoiceData, analysis?: AnalysisSummary) => {
  const fields = [
    invoice?.parser.fields.referenceMonth.value,
    invoice?.parser.fields.providerName.value,
    invoice?.parser.fields.tariffFlag.value,
    analysis?.evidenceItems?.[0]?.value,
    analysis?.evidenceItems?.[1]?.value,
  ];

  return Array.from(
    new Set(fields.filter((field): field is string => typeof field === 'string' && field.length > 0))
  ).slice(0, 4);
};

const buildCycleSummary = ({
  isProfileComplete,
  isJourneyHydrated,
  invoiceHistory,
  journeyStage,
  latestAnalysis,
  mascotGuidance,
}: {
  isProfileComplete: boolean;
  isJourneyHydrated: boolean;
  invoiceHistory: InvoiceData[];
  journeyStage: JourneyStage;
  latestAnalysis?: AnalysisSummary;
  mascotGuidance: MascotGuidance;
}) => {
  if (!isJourneyHydrated) {
    return {
      headline: 'Carregando seu Nucleo atual',
      support: 'A jornada esta sendo recuperada para mostrar memoria, leitura e orientacao.',
    };
  }

  if (!isProfileComplete) {
    return {
      headline: 'Primeiro precisamos conhecer seu contexto',
      support: 'O Nucleo fica mais honesto quando perfil, tipo de consumo e rotina minima ja estao definidos.',
    };
  }

  if (invoiceHistory.length === 0) {
    return {
      headline: 'Tudo pronto para a primeira conta',
      support: 'Assim que a fatura entrar, o Nucleo passa a observar, relacionar, memorizar e orientar usando dados reais.',
    };
  }

  if (journeyStage === 'analysis-ready' && latestAnalysis) {
    return {
      headline: latestAnalysis.headline,
      support: mascotGuidance.message,
    };
  }

  return {
    headline: mascotGuidance.title,
    support: mascotGuidance.message,
  };
};

export const buildNucleoSessionViewModel = ({
  isJourneyHydrated,
  isProfileComplete,
  journeyState,
  profile,
  scoreState,
  latestInvoice,
  invoiceHistory,
  latestAnalysis,
  nextActions,
  knowledgeState,
  mascotGuidance,
  memorySnapshot,
}: BuildNucleoSessionInput): NucleoSessionViewModel => {
  const primaryAction = getPrimaryAction(nextActions);
  const comparison = buildInvoiceComparison(invoiceHistory);
  const actionResult = buildActionResultLink(comparison);
  const lastKnowledge = getLastLearnedEnergyKnowledge(knowledgeState);
  const nextKnowledge = getNextEnergyKnowledge(knowledgeState);
  const activeBeatId: NucleoBeatId =
    primaryAction?.status === 'completed'
      ? 'orienta'
      : latestAnalysis
        ? invoiceHistory.length > 1
          ? 'relaciona'
          : 'observa'
        : 'observa';

  const visualState: NucleoVisualState = !isJourneyHydrated
    ? 'loading'
    : !isProfileComplete
      ? 'profile'
      : journeyState.analysis.status === 'processing'
        ? 'processing'
        : !latestInvoice
          ? 'upload'
          : primaryAction?.status === 'completed'
            ? 'complete'
            : 'guided';

  const cycleSummary = buildCycleSummary({
    isProfileComplete,
    isJourneyHydrated,
    invoiceHistory,
    journeyStage: journeyState.journeyStage,
    latestAnalysis,
    mascotGuidance,
  });

  const relationChips = Array.from(
    new Set(
      [
        comparison.summary,
        latestAnalysis?.efficiencyLabel,
        latestAnalysis?.evidenceItems?.[0]?.value,
        latestAnalysis?.behaviorHighlights?.[0],
      ].filter((value): value is string => typeof value === 'string' && value.length > 0)
    )
  ).slice(0, 4);

  const memorySignals = [
    ...(memorySnapshot?.memoryProfile.confirmedSignals ?? []),
    ...(memorySnapshot?.memoryInsights.observedBehavior ?? []),
  ].slice(0, 4);

  return {
    visualState,
    activeBeatId,
    beats: BEATS,
    userName: getUserName(profile),
    welcomeTitle: latestInvoice
      ? `Vamos entender o ciclo ${getInvoiceLabel(latestInvoice)} juntos`
      : 'Seu Nucleo esta pronto para comecar',
    welcomeMessage:
      'A Score organiza a jornada em quatro movimentos simples: observar a conta, relacionar sinais, guardar memoria util e orientar a proxima decisao.',
    scoreSummary: {
      level: scoreState.level,
      nextLevelScore: scoreState.nextLevelScore,
      points: scoreState.score,
      progressPercent: scoreState.progressToNextLevel,
    },
    cycleSummary: {
      invoices: invoiceHistory.length,
      stage: journeyState.journeyStage,
      headline: cycleSummary.headline,
      support: cycleSummary.support,
    },
    observe: {
      title: latestInvoice
        ? `A conta ${getInvoiceLabel(latestInvoice)} ja virou leitura real`
        : 'Sua primeira conta ainda nao entrou na memoria',
      invoiceLabel: getInvoiceLabel(latestInvoice),
      facts: buildObserveFacts(latestInvoice),
      extractedSignals: buildExtractedSignals(latestInvoice, latestAnalysis),
    },
    relate: {
      title:
        invoiceHistory.length > 1
          ? 'Este ciclo ja pode ser comparado com o historico'
          : 'Ainda estamos no primeiro ciclo observado',
      summary: comparison.summary,
      support:
        invoiceHistory.length > 1
          ? actionResult.message
          : 'Com mais uma fatura, a Score ganha base para mostrar mudancas entre ciclos sem inventar causa.',
      chips: relationChips,
    },
    memorize: {
      title: 'A memoria agora esta mais organizada para o proximo ciclo',
      summary:
        memorySignals.length > 0
          ? 'Os sinais abaixo ja podem orientar proximas leituras e recomendacoes sem mexer no calculo central.'
          : 'Ainda estamos consolidando os primeiros sinais da sua jornada.',
      learnedCount: memorySnapshot?.memoryKnowledge.learnedCount ?? 0,
      totalKnowledge: memorySnapshot?.memoryKnowledge.totalCount ?? 0,
      confirmedSignals: memorySignals,
      latestKnowledge: lastKnowledge?.title,
      nextKnowledge: nextKnowledge?.title,
    },
    orient: {
      title: primaryAction
        ? 'Existe uma decisao clara para este momento'
        : 'O proximo passo fica mais claro com a proxima fatura',
      summary:
        primaryAction?.description ||
        latestAnalysis?.whatMattersNext ||
        'O Nucleo usa a leitura atual para priorizar o que observar depois.',
      actionTitle: primaryAction?.title,
      actionValue: primaryAction?.value,
      evidence: Array.from(
        new Set(
          [
            ...(primaryAction?.usedDataPoints ?? []),
            ...(primaryAction?.knownBehaviorSummary ?? []),
            ...(primaryAction?.answeredQuestionSummaries ?? []),
          ].filter((value) => value.trim().length > 0)
        )
      ).slice(0, 4),
      followUp: actionResult.note,
      statusLabel: getActionStatusLabel(primaryAction),
    },
  };
};
