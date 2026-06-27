import { getLastLearnedEnergyKnowledge, getNextEnergyKnowledge } from '@/lib/energyKnowledge';
import { buildEnergyMapFromJourney } from '@/lib/energy-map';
import { buildEnergyStoryFromJourney } from '@/lib/energy-map/buildEnergyStoryFromJourney';
import { MemorySnapshot } from '@/lib/memorySnapshot';
import { NucleoSessionViewModel } from '@/lib/nucleoSession';
import {
  buildPreReadyProductRuntime,
  buildProductRuntime,
  buildResponseProductRuntime,
  ProductRuntime,
  ProductRuntimeQuestion,
} from '@/lib/productRuntime';
import { buildMemoryFeedback, describeAdaptiveAnswer } from '@/lib/mvpCoreFlow';
import {
  AnalysisSummary,
  EnergyBehaviorProfile,
  MascotContextQuestion,
  NextAction,
  ActionInteractiveQuestion,
  EnergyKnowledgeState,
  InvoiceData,
  UserProfileData,
} from '@/types/mvp';

type GuidedConversationState = 'loading' | 'profile' | 'upload' | 'processing' | 'ready';

interface GuidedConversationQuestionBase {
  heading?: string;
  helperText?: string;
  options: ActionInteractiveQuestion['options'];
  prompt: string;
  transitionText?: string;
}

export interface GuidedConversationContextQuestion extends GuidedConversationQuestionBase {
  id: MascotContextQuestion['id'];
  invite: string;
  kind: 'context';
}

export interface GuidedConversationActionQuestion extends GuidedConversationQuestionBase {
  action: NextAction;
  id: ActionInteractiveQuestion['id'];
  investigation?: ActionInteractiveQuestion['investigation'];
  kind: 'action';
}

export type GuidedConversationQuestion =
  | GuidedConversationContextQuestion
  | GuidedConversationActionQuestion;

export interface GuidedConversationOpening {
  body: string;
  buttonLabel: string;
  eyebrow: string;
  title: string;
}

export interface GuidedConversationReading {
  caution: string;
  knownSignals: string[];
  mainGap?: string;
  primaryFactor?: string;
  support: string;
  title: string;
}

export interface GuidedFirstReadingImpact {
  costLabel?: string;
  id: string;
  insight?: string;
  isResidual?: boolean;
  label: string;
  shareLabel?: string;
}

export interface GuidedPrimaryDiscovery {
  action: string;
  confidence: 'high' | 'medium' | 'low';
  headline: string;
  meaning: string;
  reason: string;
  source:
    | 'change_relevant'
    | 'dominant_impact'
    | 'useful_discovery'
    | 'educational_opportunity'
    | 'first_signal';
  support: string;
  subjectId?: string;
}

export interface GuidedDiscoveryCandidate {
  action: string;
  confidence: GuidedPrimaryDiscovery['confidence'];
  headline: string;
  id: string;
  meaning: string;
  priority: number;
  reason: string;
  score: number;
  source: GuidedPrimaryDiscovery['source'];
  subjectId?: string;
  support: string;
}

export interface GuidedFirstReading {
  billValue?: string;
  conversationMemory?: string;
  consumption?: string;
  impacts: GuidedFirstReadingImpact[];
  primaryDiscovery: GuidedPrimaryDiscovery;
  intro: string;
  nextRefinement?: string;
  productRuntime: ProductRuntime;
  support?: string;
  title: string;
  uncertainty: string;
}

export interface GuidedConversationConclusion {
  evidence: string[];
  identifiedFactors: string[];
  lastKnowledge?: string;
  message: string;
  nextKnowledge?: string;
  nextStepDetail?: string;
  nextStepTitle?: string;
  title: string;
  unknowns: string[];
}

export interface GuidedConversationMetric {
  label: string;
  value: string;
}

export interface GuidedConversationSummary {
  cycleLabel: string;
  knowledgeLabel: string;
  lastKnowledge?: string;
  mainGap?: string;
  memorySummary: string;
  metrics: GuidedConversationMetric[];
  nextDecision: string;
  nextKnowledge?: string;
  primaryFactor?: string;
}

export type GuidedUnderstandingLevel =
  | 'baixa_compreensao'
  | 'compreensao_inicial'
  | 'hipotese_fortalecida'
  | 'boa_compreensao'
  | 'alta_confianca';

export interface GuidedUnderstandingCategory {
  id:
    | 'banhos'
    | 'cozinha'
    | 'refrigeracao'
    | 'iluminacao'
    | 'climatizacao'
    | 'lavanderia'
    | 'outros';
  isOpenQuestion: boolean;
  label: string;
  level: GuidedUnderstandingLevel;
  levelLabel: string;
  openPoint?: string;
  reason: string;
  supportCount: number;
}

export interface GuidedAccountUnderstandingPanel {
  categories: GuidedUnderstandingCategory[];
  intro: string;
  title: string;
}

export interface GuidedCorePresence {
  cue: string;
  detail?: string;
  idleLine: string;
  memoryLine?: string;
  questionIntro?: string;
}

export interface GuidedConversationViewModel {
  accountUnderstanding: GuidedAccountUnderstandingPanel;
  conclusion: GuidedConversationConclusion;
  corePresence: GuidedCorePresence;
  currentQuestion?: GuidedConversationQuestion;
  firstReading?: GuidedFirstReading;
  opening: GuidedConversationOpening;
  reading: GuidedConversationReading;
  scoreSummary: {
    level: number;
    points: number;
  };
  summary: GuidedConversationSummary;
  productRuntime: ProductRuntime;
  sessionKey: string;
  state: GuidedConversationState;
}

interface BuildGuidedConversationInput {
  contextQuestion?: MascotContextQuestion;
  energyBehaviorProfile: EnergyBehaviorProfile;
  knowledgeState: EnergyKnowledgeState;
  latestAnalysis?: AnalysisSummary;
  latestInvoice?: InvoiceData;
  memorySnapshot?: MemorySnapshot;
  profile: UserProfileData;
  primaryAction?: NextAction;
  viewModel: NucleoSessionViewModel;
}

const normalizeForCategoryMatch = (value?: string) =>
  typeof value === 'string'
    ? value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
    : '';

const UNDERSTANDING_LEVEL_LABEL: Record<GuidedUnderstandingLevel, string> = {
  baixa_compreensao: 'Baixa compreensao',
  compreensao_inicial: 'Compreensao inicial',
  hipotese_fortalecida: 'Hipotese fortalecida',
  boa_compreensao: 'Boa compreensao',
  alta_confianca: 'Alta confianca',
};

const ACCOUNT_UNDERSTANDING_CATEGORIES: Array<{
  id: GuidedUnderstandingCategory['id'];
  label: GuidedUnderstandingCategory['label'];
  keywords: string[];
}> = [
  { id: 'banhos', label: 'Banhos', keywords: ['banho', 'chuveiro', 'banheiro', 'aquecimento do banho'] },
  { id: 'cozinha', label: 'Cozinha', keywords: ['cozinha', 'fogao', 'forno'] },
  { id: 'refrigeracao', label: 'Refrigeracao', keywords: ['geladeira', 'freezer', 'refriger'] },
  { id: 'iluminacao', label: 'Iluminacao', keywords: ['ilumin', 'lampada', 'luz'] },
  { id: 'climatizacao', label: 'Climatizacao', keywords: ['climatizacao', 'ar-condicionado', 'termic', 'temperatura'] },
  { id: 'lavanderia', label: 'Lavanderia', keywords: ['lavanderia', 'maquina de lavar', 'secadora', 'lavagem'] },
  { id: 'outros', label: 'Outros', keywords: [] },
];

const QUESTION_CATEGORY_BY_ID: Partial<
  Record<ActionInteractiveQuestion['id'] | MascotContextQuestion['id'], GuidedUnderstandingCategory['id']>
> = {
  residence_type: 'outros',
  room_count: 'outros',
  children_presence: 'outros',
  elderly_presence: 'outros',
  bathrooms_count: 'banhos',
  showers_count: 'banhos',
  electric_shower_presence: 'banhos',
  shower_heating_type: 'banhos',
  air_conditioning_presence: 'climatizacao',
  air_conditioning_count: 'climatizacao',
  cooking_type: 'cozinha',
  electric_oven_presence: 'cozinha',
  extra_fridge_presence: 'refrigeracao',
  washing_machine_presence: 'lavanderia',
  dryer_presence: 'lavanderia',
  dominant_usage_period: 'outros',
  usage_period: 'outros',
  primary_goal: 'outros',
};

const uniqueStrings = (values: Array<string | undefined | null>) =>
  Array.from(
    new Set(
      values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    )
  );

const getConversationState = (
  visualState: NucleoSessionViewModel['visualState']
): GuidedConversationState => {
  if (visualState === 'loading') {
    return 'loading';
  }

  if (visualState === 'profile') {
    return 'profile';
  }

  if (visualState === 'upload') {
    return 'upload';
  }

  if (visualState === 'processing') {
    return 'processing';
  }

  return 'ready';
};

const getInvoiceLabel = (invoice?: InvoiceData) =>
  invoice?.month?.trim() ||
  invoice?.parser.fields.referenceMonth.value?.trim() ||
  'este ciclo';

const formatCurrency = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? `R$ ${value.toFixed(2)}` : undefined;

const formatAverageCost = (invoice?: InvoiceData) => {
  if (
    !invoice ||
    typeof invoice.totalValue !== 'number' ||
    !Number.isFinite(invoice.totalValue) ||
    typeof invoice.consumption !== 'number' ||
    !Number.isFinite(invoice.consumption) ||
    invoice.consumption <= 0
  ) {
    return undefined;
  }

  return `R$ ${(invoice.totalValue / invoice.consumption).toFixed(2)}/kWh`;
};

const formatConsumption = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? `${value} kWh` : undefined;

const formatPercent = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  const rounded = Math.round(value * 10) / 10;
  const isIntegerAmount = Math.abs(rounded - Math.round(rounded)) < 0.0001;

  return `≈ ${isIntegerAmount ? Math.round(rounded).toString() : rounded.toFixed(1)}%`;
};

const formatCurrencyEstimate = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? `≈ R$ ${value.toFixed(2)}`
    : undefined;

const stripTrailingPeriod = (value?: string) =>
  value?.trim().replace(/\.*$/, '');

const parseShareLabel = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number(value.replace('≈', '').replace('%', '').trim());
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const ENERGY_IMPACT_LABELS: Record<string, string> = {
  bathroom: 'Banho',
  climatization: 'Climatizacao',
  kitchen: 'Cozinha',
  laundry: 'Lavanderia',
  lighting: 'Iluminacao',
  refrigeration: 'Refrigeracao',
};

const QUESTION_TARGET_COPY: Record<
  string,
  {
    heading: string;
    helperText: string;
    transitionText: string;
  }
> = {
  bathroom: {
    heading: 'Refinando o peso do banho',
    helperText: 'Para medir melhor o peso do banho nesta conta.',
    transitionText:
      'Ja consigo ver o banho nesta leitura, mas ainda falta um detalhe para medir melhor esse impacto.',
  },
  refrigeration: {
    heading: 'Refinando o peso da refrigeracao',
    helperText: 'Para medir melhor o peso da refrigeracao nesta conta.',
    transitionText:
      'A refrigeracao ja apareceu nesta leitura, mas ainda falta um detalhe para ajustar esse peso.',
  },
  lighting: {
    heading: 'Refinando o peso da iluminacao',
    helperText: 'Para medir melhor o peso da iluminacao nesta conta.',
    transitionText:
      'A iluminacao ja entrou no mapa inicial, mas ainda falta um detalhe para ajustar esse impacto.',
  },
  comfort: {
    heading: 'Refinando o peso da climatizacao',
    helperText: 'Para medir melhor o peso da climatizacao nesta conta.',
    transitionText:
      'A climatizacao ja apareceu nesta leitura, mas ainda falta um detalhe para saber quanto isso pesa de verdade.',
  },
  climatization: {
    heading: 'Refinando o peso da climatizacao',
    helperText: 'Para medir melhor o peso da climatizacao nesta conta.',
    transitionText:
      'A climatizacao ja apareceu nesta leitura, mas ainda falta um detalhe para saber quanto isso pesa de verdade.',
  },
  kitchen: {
    heading: 'Refinando o peso da cozinha',
    helperText: 'Para medir melhor o peso da cozinha nesta conta.',
    transitionText:
      'A cozinha ja entrou nesta leitura, mas ainda falta um detalhe para distribuir melhor esse consumo.',
  },
  laundry: {
    heading: 'Refinando o peso da lavanderia',
    helperText: 'Para medir melhor o peso da lavanderia nesta conta.',
    transitionText:
      'A lavanderia pode entrar nesta leitura, mas ainda falta um detalhe para saber o tamanho desse peso.',
  },
  occupancy: {
    heading: 'Refinando a rotina da casa',
    helperText: 'Para ligar melhor a conta ao jeito como a casa funciona.',
    transitionText:
      'Ja existe uma leitura inicial da conta, mas a rotina da casa ainda pode mudar bastante esse retrato.',
  },
  routine: {
    heading: 'Refinando a rotina da casa',
    helperText: 'Para ligar melhor a conta ao horario em que a casa ganha mais movimento.',
    transitionText:
      'Ja existe uma leitura inicial da conta, mas ainda falta entender melhor em que horario a casa ganha mais movimento.',
  },
  residence_structure: {
    heading: 'Refinando a estrutura da casa',
    helperText: 'Para dividir a conta por ambiente com mais honestidade.',
    transitionText:
      'Ja li a conta, mas ainda preciso entender melhor a estrutura da casa para distribuir esse valor com mais criterio.',
  },
  other: {
    heading: 'Refinando esta leitura',
    helperText: 'Para deixar esta leitura mais precisa antes da proxima conclusao.',
    transitionText:
      'Ja existe uma leitura inicial desta conta, mas ainda falta um detalhe para ela ficar menos generica.',
  },
};

const humanizeMemorySignal = (signal?: string) => {
  if (!signal) {
    return undefined;
  }

  if (signal.includes('chuveiro(s) informado(s)')) {
    return `Ainda lembro que ${signal.toLowerCase().replace('informado(s)', 'informados na sua casa')}.`;
  }

  if (signal.startsWith('Objetivo principal:')) {
    return `Ainda lembro que seu foco principal agora e ${signal.replace('Objetivo principal:', '').trim().toLowerCase()}.`;
  }

  if (signal.startsWith('Consumo mais forte em')) {
    return `Ainda lembro que ${signal.toLowerCase()}.`;
  }

  if (signal.startsWith('Uso de chuveiro eletrico:')) {
    return signal.toLowerCase().includes('sim')
      ? 'Ainda lembro que existe chuveiro eletrico na sua rotina.'
      : 'Ainda lembro que voce nao confirmou chuveiro eletrico na sua rotina.';
  }

  if (signal === 'Chuveiro eletrico confirmado') {
    return 'Ainda lembro que existe chuveiro eletrico na sua rotina.';
  }

  if (signal === 'Ar-condicionado presente na rotina') {
    return 'Ainda lembro que a climatizacao ja aparece como parte da sua rotina.';
  }

  return `Ainda lembro de um sinal importante da sua rotina: ${signal.toLowerCase()}.`;
};

const getQuestionTargetKey = (
  question?:
    | GuidedConversationQuestion
    | Pick<GuidedConversationActionQuestion, 'id' | 'investigation'>
    | Pick<GuidedConversationContextQuestion, 'id'>
) => {
  if (!question) {
    return 'other';
  }

  if ('investigation' in question && question.investigation?.energyMapBlock?.[0]) {
    return question.investigation.energyMapBlock[0];
  }

  if ('investigation' in question && question.investigation?.targetArea) {
    return question.investigation.targetArea;
  }

  const mappedCategory = QUESTION_CATEGORY_BY_ID[question.id];

  if (mappedCategory === 'banhos') {
    return 'bathroom';
  }

  if (mappedCategory === 'refrigeracao') {
    return 'refrigeration';
  }

  if (mappedCategory === 'iluminacao') {
    return 'lighting';
  }

  if (mappedCategory === 'climatizacao') {
    return 'climatization';
  }

  if (mappedCategory === 'cozinha') {
    return 'kitchen';
  }

  if (mappedCategory === 'lavanderia') {
    return 'laundry';
  }

  if (mappedCategory === 'outros') {
    return question.id === 'children_presence' || question.id === 'elderly_presence'
      ? 'occupancy'
      : 'residence_structure';
  }

  return 'other';
};

const buildQuestionContinuityCopy = (
  question?:
    | GuidedConversationQuestion
    | Pick<GuidedConversationActionQuestion, 'id' | 'investigation'>
    | Pick<GuidedConversationContextQuestion, 'id'>
) => QUESTION_TARGET_COPY[getQuestionTargetKey(question)] ?? QUESTION_TARGET_COPY.other;

const buildRuntimeQuestion = (
  question?: GuidedConversationQuestion
): ProductRuntimeQuestion | undefined => {
  if (!question) {
    return undefined;
  }

  return {
    detailSection: question.kind === 'context' ? 'memory' : 'summary',
    heading: question.heading,
    helperText: question.helperText,
    id: question.id,
    kind: question.kind,
    options: question.options.map((option) => ({
      label: option.label,
      value: option.value,
    })),
    prompt: question.prompt,
    transitionText: question.transitionText,
  };
};

export interface GuidedConversationFeedbackSurface {
  continueLabel?: string;
  message: string;
  productRuntime: ProductRuntime;
  reading?: GuidedFirstReading;
  title: string;
}

const getDominantImpactSummary = (
  impact?: GuidedFirstReadingImpact,
  options?: { conservative?: boolean }
) => {
  if (!impact || impact.isResidual) {
    return 'Ja encontrei os primeiros sinais desta conta.';
  }

  const conservative = options?.conservative ?? false;

  if (impact.label === 'Banho') {
    return conservative
      ? 'Por enquanto, o banho e o sinal mais claro desta conta.'
      : 'O banho parece ser o maior peso desta conta.';
  }

  if (impact.label === 'Refrigeracao') {
    return conservative
      ? 'Por enquanto, a refrigeracao e o sinal mais claro desta conta.'
      : 'A refrigeracao parece ser o maior peso desta conta.';
  }

  if (impact.label === 'Iluminacao') {
    return conservative
      ? 'Por enquanto, a iluminacao e o sinal mais claro desta conta.'
      : 'A iluminacao parece ser o maior peso desta conta.';
  }

  return conservative
    ? `Por enquanto, ${impact.label.toLowerCase()} e o sinal mais claro desta conta.`
    : `${impact.label} parece pesar mais nesta conta.`;
};

const getDiscoveryAction = (impactId?: string) => {
  if (impactId === 'bathroom') {
    return 'Banhos dois minutos menores ja podem aliviar esse peso.';
  }

  if (impactId === 'refrigeration') {
    return 'Vale observar se a geladeira esta muito cheia ou perto de fontes de calor.';
  }

  if (impactId === 'lighting') {
    return 'Vale observar se as luzes ficam acesas em comodos vazios por mais tempo do que deveriam.';
  }

  if (impactId === 'climatization') {
    return 'Vale observar se a climatizacao esta ligada por mais tempo do que a casa realmente precisa.';
  }

  if (impactId === 'laundry') {
    return 'Vale concentrar lavagens em ciclos cheios para reduzir esse peso sem perder rotina.';
  }

  if (impactId === 'kitchen') {
    return 'Vale observar quais usos da cozinha se repetem todos os dias e puxam a conta sem chamar atencao.';
  }

  return 'Vale observar qual ambiente fica mais tempo em uso ao longo do dia.';
};

const buildHermesOpeningLine = ({
  invoiceLabel,
  primaryDiscovery,
}: {
  invoiceLabel: string;
  primaryDiscovery: GuidedPrimaryDiscovery;
}) => {
  if (primaryDiscovery.source === 'first_signal') {
    return `Acabei de terminar a leitura inicial da sua conta de ${invoiceLabel}.`;
  }

  return `Encontrei algo interessante na sua conta de ${invoiceLabel}.`;
};

const buildConversationMemory = ({
  latestAnalysis,
  memorySnapshot,
  primaryAction,
}: {
  latestAnalysis?: AnalysisSummary;
  memorySnapshot?: MemorySnapshot;
  primaryAction?: NextAction;
}) => {
  const answeredCount = primaryAction?.answeredQuestionSummaries?.length ?? 0;
  const confirmedCount =
    (memorySnapshot?.memoryProfile.confirmedSignals?.length ?? 0) +
    (memorySnapshot?.memoryInsights.confirmedContext?.length ?? 0);
  const observedCount =
    (memorySnapshot?.memoryInsights.observedBehavior?.length ?? 0) +
    (latestAnalysis?.behaviorHighlights?.length ?? 0);
  const learnedCount = memorySnapshot?.memoryKnowledge.learnedCount ?? 0;

  if (answeredCount > 0) {
    return 'Depois das ultimas respostas, a leitura ficou mais consistente.';
  }

  if (confirmedCount > 0 && observedCount > 0) {
    return 'Com o que descobrimos ate aqui, consigo olhar esta conta com mais contexto.';
  }

  if (confirmedCount > 0 || observedCount > 0 || learnedCount > 0) {
    return 'Agora conheco um pouco melhor sua casa.';
  }

  return undefined;
};

const compareDiscoveryCandidates = (
  left: GuidedDiscoveryCandidate,
  right: GuidedDiscoveryCandidate
) => {
  if (right.priority !== left.priority) {
    return right.priority - left.priority;
  }

  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return left.id.localeCompare(right.id);
};

const buildDiscoveryMeaning = (candidate: {
  source: GuidedPrimaryDiscovery['source'];
  subjectId?: string;
}): string => {
  if (candidate.subjectId === 'bathroom') {
    return 'Poucos minutos por banho fazem diferenca porque essa e uma das cargas mais potentes da casa.';
  }

  if (candidate.subjectId === 'refrigeration') {
    return 'Ela trabalha o dia inteiro. Pequenos ajustes costumam aparecer mes apos mes.';
  }

  if (candidate.subjectId === 'lighting') {
    return 'Isso normalmente indica que suas lampadas ja sao eficientes ou ficam pouco tempo acesas.';
  }

  if (candidate.subjectId === 'climatization') {
    return 'Quando a climatizacao pesa, pequenos ajustes de tempo de uso costumam aparecer na conta inteira.';
  }

  if (candidate.subjectId === 'laundry') {
    return 'Esse tipo de uso costuma importar mais pela repeticao da rotina do que por um unico ciclo isolado.';
  }

  if (candidate.subjectId === 'kitchen') {
    return 'Usos curtos da cozinha podem ganhar peso quando se repetem todos os dias.';
  }

  if (candidate.source === 'first_signal') {
    return 'Cada nova informacao ajuda a separar habitos permanentes de mudancas pontuais.';
  }

  if (candidate.source === 'educational_opportunity') {
    return 'Mesmo um sinal pequeno pode ensinar onde o consumo deixa de ser invisivel no dia a dia.';
  }

  return 'Esse sinal ajuda a entender por onde a conta ganha peso antes mesmo de qualquer ajuste fino.';
};

const toPrimaryDiscovery = (
  candidate: GuidedDiscoveryCandidate
): GuidedPrimaryDiscovery => ({
  action: candidate.action,
  confidence: candidate.confidence,
  headline: candidate.headline,
  meaning: candidate.meaning,
  reason: candidate.reason,
  source: candidate.source,
  subjectId: candidate.subjectId,
  support: candidate.support,
});

export const buildDiscoveryCandidates = ({
  impacts,
  invoiceLabel,
  storySupport,
  storySummary,
  unexplainedShare,
}: {
  impacts: GuidedFirstReadingImpact[];
  invoiceLabel: string;
  storySupport?: string;
  storySummary?: string;
  unexplainedShare: number;
}): GuidedDiscoveryCandidate[] => {
  const topImpact = impacts[0];
  const secondImpact = impacts[1];
  const topShareValue = parseShareLabel(topImpact?.shareLabel);
  const secondShareValue = parseShareLabel(secondImpact?.shareLabel);
  const hasDominantImpact =
    Boolean(topImpact && !topImpact.isResidual) &&
    ( 
      (typeof topShareValue === 'number' && Number.isFinite(topShareValue) && topShareValue >= 12) ||
      (typeof topShareValue === 'number' &&
        Number.isFinite(topShareValue) &&
        typeof secondShareValue === 'number' &&
        Number.isFinite(secondShareValue) &&
        topShareValue - secondShareValue >= 4) ||
      impacts.filter((impact) => !impact.isResidual).length === 1
    );
  const candidates: GuidedDiscoveryCandidate[] = [];

  if (topImpact && !topImpact.isResidual && hasDominantImpact) {
    const cautious = unexplainedShare >= 75;
    const roomLabel = topImpact.label.toLowerCase();

    candidates.push({
      action: getDiscoveryAction(topImpact.id),
      confidence: cautious ? 'low' : unexplainedShare >= 45 ? 'medium' : 'high',
      headline: cautious
        ? `Encontrei o sinal mais forte da sua conta de ${invoiceLabel}.`
        : `Encontrei o principal peso da sua conta de ${invoiceLabel}.`,
      id: `dominant-impact:${topImpact.id}`,
      meaning: buildDiscoveryMeaning({
        source: 'dominant_impact',
        subjectId: topImpact.id,
      }),
      priority: 400,
      reason: `O bloco ${topImpact.id} apareceu como protagonista desta leitura.`,
      score: Math.round((topShareValue ?? 0) * 10) - unexplainedShare,
      source: 'dominant_impact',
      subjectId: topImpact.id,
      support:
        stripTrailingPeriod(storySupport) ||
        (cautious
          ? `${roomLabel} e o sinal mais claro nesta leitura por enquanto`
          : `${topImpact.label} parece ser quem mais pesa nesta conta`),
    });
  }

  if (topImpact && !topImpact.isResidual && typeof topShareValue === 'number' && topShareValue > 0) {
    candidates.push({
      action: getDiscoveryAction(topImpact.id),
      confidence: unexplainedShare >= 60 ? 'low' : 'medium',
      headline: `Encontrei um sinal util na sua conta de ${invoiceLabel}.`,
      id: `useful-discovery:${topImpact.id}`,
      meaning: buildDiscoveryMeaning({
        source: 'useful_discovery',
        subjectId: topImpact.id,
      }),
      priority: 300,
      reason: `O bloco ${topImpact.id} ja ajuda a orientar a proxima leitura, mesmo sem dominar a conta.`,
      score: Math.round(topShareValue * 10),
      source: 'useful_discovery',
      subjectId: topImpact.id,
      support:
        stripTrailingPeriod(storySupport) ||
        `${topImpact.label} ja entrou no mapa e ajuda a orientar a proxima explicacao.`,
    });
  }

  if (
    topImpact &&
    !topImpact.isResidual &&
    typeof topShareValue === 'number' &&
    topShareValue <= 10 &&
    storySummary
  ) {
    candidates.push({
      action: getDiscoveryAction(topImpact.id),
      confidence: 'medium',
      headline: `Encontrei um sinal que ajuda a explicar sua conta de ${invoiceLabel}.`,
      id: `educational-opportunity:${topImpact.id}`,
      meaning: buildDiscoveryMeaning({
        source: 'educational_opportunity',
        subjectId: topImpact.id,
      }),
      priority: 200,
      reason: `Existe uma oportunidade educativa util em ${topImpact.id}, mesmo sem lideranca clara.`,
      score: Math.round(topShareValue * 10) + Math.max(0, 100 - unexplainedShare),
      source: 'educational_opportunity',
      subjectId: topImpact.id,
      support: stripTrailingPeriod(storySummary),
    });
  }

  if (unexplainedShare >= 65) {
    candidates.push({
      action: 'Vale observar qual ambiente fica mais tempo em uso antes do proximo refinamento.',
      confidence: 'low',
      headline: `Encontrei a primeira leitura util da sua conta de ${invoiceLabel}.`,
      id: 'first-signal:coverage-gap',
      meaning: buildDiscoveryMeaning({
        source: 'first_signal',
      }),
      priority: 100,
      reason: 'Ainda nao existe um protagonista claro nesta leitura inicial.',
      score: Math.round(unexplainedShare * 10),
      source: 'first_signal',
      support:
        stripTrailingPeriod(storySummary) ||
        'Ainda nao existe um peso dominante claro, mas os primeiros sinais ja comecaram a aparecer.',
    });
  }

  if (candidates.length === 0) {
    candidates.push({
      action: 'Vale observar qual ambiente fica mais tempo em uso antes do proximo refinamento.',
      confidence: unexplainedShare >= 70 ? 'low' : 'medium',
      headline: `Encontrei a primeira leitura util da sua conta de ${invoiceLabel}.`,
      id: 'first-signal:fallback',
      meaning: buildDiscoveryMeaning({
        source: 'first_signal',
      }),
      priority: 0,
      reason: 'Ainda nao existe um protagonista claro nesta leitura inicial.',
      source: 'first_signal',
      score: 0,
      support:
        stripTrailingPeriod(storySummary) ||
        'Ainda nao existe um peso dominante claro, mas os primeiros sinais ja comecaram a aparecer.',
    });
  }

  return [...candidates].sort(compareDiscoveryCandidates);
};

export const selectPrimaryDiscoveryCandidate = (
  candidates: GuidedDiscoveryCandidate[]
): GuidedDiscoveryCandidate => {
  const [winner] = [...candidates].sort(compareDiscoveryCandidates);

  return (
    winner ?? {
      action: 'Vale observar qual ambiente fica mais tempo em uso antes do proximo refinamento.',
      confidence: 'low',
      headline: 'Encontrei a primeira leitura util da sua conta.',
      id: 'first-signal:empty',
      meaning: buildDiscoveryMeaning({
        source: 'first_signal',
      }),
      priority: 0,
      reason: 'Nenhuma descoberta candidata foi gerada.',
      score: 0,
      source: 'first_signal',
      support: 'Ainda nao existe um peso dominante claro, mas os primeiros sinais ja comecaram a aparecer.',
    }
  );
};

export const buildPrimaryDiscovery = (input: {
  impacts: GuidedFirstReadingImpact[];
  invoiceLabel: string;
  storySupport?: string;
  storySummary?: string;
  unexplainedShare: number;
}): GuidedPrimaryDiscovery => {
  const discoveryCandidates = buildDiscoveryCandidates(input);
  return toPrimaryDiscovery(selectPrimaryDiscoveryCandidate(discoveryCandidates));
};

const matchesUnderstandingCategory = (
  categoryId: GuidedUnderstandingCategory['id'],
  value?: string
) => {
  const normalized = normalizeForCategoryMatch(value);

  if (!normalized) {
    return false;
  }

  const category = ACCOUNT_UNDERSTANDING_CATEGORIES.find((item) => item.id === categoryId);

  if (!category) {
    return false;
  }

  if (categoryId === 'outros') {
    return !ACCOUNT_UNDERSTANDING_CATEGORIES.some(
      (item) =>
        item.id !== 'outros' && item.keywords.some((keyword) => normalized.includes(keyword))
    );
  }

  return category.keywords.some((keyword) => normalized.includes(keyword));
};

const buildUnderstandingReason = (
  category: GuidedUnderstandingCategory['label'],
  level: GuidedUnderstandingLevel
) => {
  if (level === 'alta_confianca') {
    return `A Score ja possui sustentacao mais estavel sobre como ${category.toLowerCase()} entra nesta conta.`;
  }

  if (level === 'boa_compreensao') {
    return `A Score ja reuniu bons sinais sobre ${category.toLowerCase()} sem tratar isso como resposta final.`;
  }

  if (level === 'hipotese_fortalecida') {
    return `Os sinais desta conta deixaram ${category.toLowerCase()} mais presente na leitura.`;
  }

  if (level === 'compreensao_inicial') {
    return `Ja existe uma primeira leitura sobre ${category.toLowerCase()}, mas ela ainda precisa amadurecer.`;
  }

  return `Ainda faltam detalhes suficientes para a Score explicar ${category.toLowerCase()} com seguranca.`;
};

const resolveUnderstandingLevel = ({
  confirmedCount,
  evidenceCount,
  gapCount,
  observedCount,
  questionFocused,
}: {
  confirmedCount: number;
  evidenceCount: number;
  gapCount: number;
  observedCount: number;
  questionFocused: boolean;
}): GuidedUnderstandingLevel => {
  if (
    confirmedCount >= 2 &&
    observedCount > 0 &&
    evidenceCount > 0 &&
    gapCount === 0 &&
    !questionFocused
  ) {
    return 'alta_confianca';
  }

  if (confirmedCount > 0 && (observedCount > 0 || evidenceCount > 0)) {
    return gapCount === 0 ? 'boa_compreensao' : 'hipotese_fortalecida';
  }

  if (observedCount > 0 && evidenceCount > 0) {
    return 'hipotese_fortalecida';
  }

  if (confirmedCount > 0 || observedCount > 0 || evidenceCount > 0) {
    return 'compreensao_inicial';
  }

  if (questionFocused || gapCount > 0) {
    return 'baixa_compreensao';
  }

  return 'baixa_compreensao';
};

export const buildAccountUnderstandingPanel = ({
  currentQuestion,
  latestAnalysis,
  memorySnapshot,
  primaryAction,
}: {
  currentQuestion?: GuidedConversationQuestion;
  latestAnalysis?: AnalysisSummary;
  memorySnapshot?: MemorySnapshot;
  primaryAction?: NextAction;
}): GuidedAccountUnderstandingPanel => {
  const confirmedSignals = uniqueStrings([
    ...(memorySnapshot?.memoryProfile.confirmedSignals ?? []),
    ...(memorySnapshot?.memoryInsights.confirmedContext ?? []),
  ]);
  const observedSignals = uniqueStrings([
    ...(memorySnapshot?.memoryInsights.observedBehavior ?? []),
    ...(latestAnalysis?.behaviorHighlights ?? []),
    ...(primaryAction?.answeredQuestionSummaries ?? []),
  ]);
  const evidenceSignals = uniqueStrings([
    ...(latestAnalysis?.evidenceItems ?? []).map((item) => `${item.label}: ${item.value}`),
    latestAnalysis?.consultiveInsight?.evidence,
    latestAnalysis?.consultiveInsight?.headline,
    primaryAction?.evidence,
    ...(primaryAction?.usedDataPoints ?? []),
  ]);
  const gapSignals = uniqueStrings(memorySnapshot?.memoryGaps.items ?? []);

  const categories = ACCOUNT_UNDERSTANDING_CATEGORIES.map((category) => {
    const confirmedMatches = confirmedSignals.filter((item) =>
      matchesUnderstandingCategory(category.id, item)
    );
    const observedMatches = observedSignals.filter((item) =>
      matchesUnderstandingCategory(category.id, item)
    );
    const evidenceMatches = evidenceSignals.filter((item) =>
      matchesUnderstandingCategory(category.id, item)
    );
    const gapMatches = gapSignals.filter((item) => matchesUnderstandingCategory(category.id, item));
    const questionFocused =
      currentQuestion?.id
        ? QUESTION_CATEGORY_BY_ID[currentQuestion.id] === category.id
        : false;
    const level = resolveUnderstandingLevel({
      confirmedCount: confirmedMatches.length,
      evidenceCount: evidenceMatches.length,
      gapCount: gapMatches.length,
      observedCount: observedMatches.length,
      questionFocused,
    });

    return {
      id: category.id,
      isOpenQuestion: questionFocused || gapMatches.length > 0,
      label: category.label,
      level,
      levelLabel: UNDERSTANDING_LEVEL_LABEL[level],
      openPoint: questionFocused
        ? currentQuestion?.prompt
        : gapMatches[0],
      reason: buildUnderstandingReason(category.label, level),
      supportCount:
        confirmedMatches.length + observedMatches.length + evidenceMatches.length,
    } satisfies GuidedUnderstandingCategory;
  });

  return {
    categories,
    intro:
      'Aqui esta o que ja consigo ligar aos ambientes da sua casa e o que ainda vale observar melhor.',
    title: 'Detalhes da leitura por ambiente',
  };
};

const buildOpening = ({
  latestInvoice,
  state,
}: {
  latestInvoice?: InvoiceData;
  state: GuidedConversationState;
}): GuidedConversationOpening => {
  if (state === 'loading') {
    return {
      eyebrow: 'Sessao atual',
      title: 'Estou recuperando o que ja sabemos sobre sua energia.',
      body: 'Memoria, leitura e continuidade da jornada estao sendo carregadas.',
      buttonLabel: 'Continuar',
    };
  }

  if (state === 'profile') {
    return {
      eyebrow: 'Abertura',
      title: 'Antes de analisar sua energia, preciso entender o contexto minimo da sua unidade.',
      body: 'Com essa base, a leitura deixa de ser generica e a memoria passa a fazer sentido.',
      buttonLabel: 'Continuar',
    };
  }

  if (state === 'upload') {
    return {
      eyebrow: 'Abertura',
      title: 'Ainda nao analisei nenhuma conta sua.',
      body: 'A primeira conversa de verdade comeca quando a fatura entra e vira leitura do ciclo.',
      buttonLabel: 'Continuar',
    };
  }

  if (state === 'processing') {
    return {
      eyebrow: 'Sessao atual',
      title: 'Estou lendo sua conta deste ciclo.',
      body: 'Assim que a analise terminar, eu mostro o que mais merece atencao agora.',
      buttonLabel: 'Continuar',
    };
  }

  const invoiceLabel = getInvoiceLabel(latestInvoice);

  return {
    eyebrow: 'Abertura',
    title: `Analisei sua conta de ${invoiceLabel}.`,
    body:
      'Ja encontrei alguns sinais uteis. Antes de recomendar qualquer coisa, quero te mostrar o que faz sentido agora.',
    buttonLabel: 'Continuar',
  };
};

const buildQuestion = ({
  contextQuestion,
  primaryAction,
}: {
  contextQuestion?: MascotContextQuestion;
  primaryAction?: NextAction;
}): GuidedConversationQuestion | undefined => {
  if (contextQuestion) {
    const continuity = buildQuestionContinuityCopy({
      id: contextQuestion.id,
    });

    return {
      heading: continuity.heading,
      helperText: continuity.helperText,
      id: contextQuestion.id,
      invite: contextQuestion.invite,
      kind: 'context',
      options: contextQuestion.options,
      prompt: contextQuestion.question,
      transitionText: continuity.transitionText,
    };
  }

  const actionQuestion = primaryAction?.interactiveQuestions?.[0];

  if (!actionQuestion || !primaryAction) {
    return undefined;
  }

  const continuity = buildQuestionContinuityCopy({
    id: actionQuestion.id,
    investigation: actionQuestion.investigation,
  });

  return {
    action: primaryAction,
    heading: continuity.heading,
    helperText: continuity.helperText || actionQuestion.helperText,
    id: actionQuestion.id,
    investigation: actionQuestion.investigation,
    kind: 'action',
    options: actionQuestion.options,
    prompt: actionQuestion.prompt,
    transitionText: continuity.transitionText,
  };
};

const buildPreReadyRuntime = ({
  latestInvoice,
  state,
}: {
  latestInvoice?: InvoiceData;
  state: GuidedConversationState;
}) => {
  if (state === 'loading') {
    return buildPreReadyProductRuntime({
      hermesLine: 'Continuando de onde paramos.',
      scoreHeadline: 'Estou trazendo sua leitura de volta.',
      scoreSupport: 'Memoria e leitura estao voltando para a superficie.',
      state: 'loading',
    });
  }

  if (state === 'profile') {
    return buildPreReadyProductRuntime({
      cta: {
        label: 'Continuar',
        target: 'question',
      },
      hermesLine: 'Antes da primeira leitura, preciso de um pouco de contexto.',
      scoreHeadline: 'Com essa base, a conta deixa de parecer generica.',
      scoreSupport: 'Assim a leitura ja nasce mais ligada a sua casa.',
      state: 'profile',
    });
  }

  if (state === 'upload') {
    return buildPreReadyProductRuntime({
      cta: {
        label: 'Enviar conta',
        target: 'question',
      },
      hermesLine: 'Quando a conta entrar, eu sigo com voce.',
      scoreHeadline: 'A primeira leitura comeca quando a fatura vira casa.',
      scoreSupport: 'Primeiro vem a leitura. Depois vem qualquer pergunta.',
      state: 'upload',
    });
  }

  if (state === 'processing') {
    return buildPreReadyProductRuntime({
      hermesLine: 'Estou olhando sua conta agora.',
      scoreHeadline: `Ja estou organizando a leitura de ${getInvoiceLabel(latestInvoice)}.`,
      scoreSupport: 'Assim que terminar, eu mostro o que mais merece atencao.',
      state: 'processing',
    });
  }

  return buildPreReadyProductRuntime({
    hermesLine: 'Estou por aqui quando voce quiser continuar.',
    scoreHeadline: 'Ainda nao existe uma leitura pronta para mostrar.',
    scoreSupport: 'Quando a jornada avancar, eu volto com algo mais util.',
    state: 'empty',
  });
};

const buildSummary = ({
  knowledgeState,
  latestAnalysis,
  latestInvoice,
  memorySnapshot,
  primaryAction,
  viewModel,
}: {
  knowledgeState: EnergyKnowledgeState;
  latestAnalysis?: AnalysisSummary;
  latestInvoice?: InvoiceData;
  memorySnapshot?: MemorySnapshot;
  primaryAction?: NextAction;
  viewModel: NucleoSessionViewModel;
}): GuidedConversationSummary => {
  const lastKnowledge = getLastLearnedEnergyKnowledge(knowledgeState);
  const nextKnowledge = getNextEnergyKnowledge(knowledgeState);

  return {
    cycleLabel: getInvoiceLabel(latestInvoice),
    knowledgeLabel: `${memorySnapshot?.memoryKnowledge.learnedCount ?? 0} de ${memorySnapshot?.memoryKnowledge.totalCount ?? 0} conhecimentos adquiridos`,
    lastKnowledge: lastKnowledge?.title,
    mainGap: memorySnapshot?.memoryGaps.items?.[0],
    memorySummary:
      memorySnapshot?.memoryProfile.confirmedSignals?.[0] ||
      memorySnapshot?.memoryInsights.confirmedContext?.[0] ||
      memorySnapshot?.memoryInsights.observedBehavior?.[0] ||
      'A Score continua guardando contexto para deixar a proxima leitura menos generica.',
    metrics: [
      { label: 'Valor total', value: formatCurrency(latestInvoice?.totalValue) },
      { label: 'Consumo', value: formatConsumption(latestInvoice?.consumption) },
      { label: 'Custo medio', value: formatAverageCost(latestInvoice) },
    ].filter((metric): metric is GuidedConversationMetric => Boolean(metric.value)),
    nextDecision:
      primaryAction?.title ||
      primaryAction?.reason ||
      viewModel.orient.actionTitle ||
      viewModel.orient.followUp,
    nextKnowledge: nextKnowledge?.title,
    primaryFactor:
      latestAnalysis?.consultiveInsight?.headline ||
      latestAnalysis?.headline ||
      primaryAction?.title,
  };
};

const buildCorePresence = ({
  currentQuestion,
  latestAnalysis,
  memorySnapshot,
  primaryAction,
  state,
}: {
  currentQuestion?: GuidedConversationQuestion;
  latestAnalysis?: AnalysisSummary;
  memorySnapshot?: MemorySnapshot;
  primaryAction?: NextAction;
  state: GuidedConversationState;
}): GuidedCorePresence => {
  if (state === 'profile') {
    return {
      cue: 'Antes de qualquer leitura, quero conhecer o minimo da sua realidade.',
      detail: 'Com esse contexto, a Score deixa de interpretar sua energia no escuro.',
      idleLine: 'Estou por aqui enquanto sua jornada ganha base.',
    };
  }

  if (state === 'upload') {
    return {
      cue: 'Sua primeira conta vai me dar o primeiro retrato real desta jornada.',
      detail: 'A fatura continua sendo o ponto de partida para uma leitura confiavel.',
      idleLine: 'Estou por aqui enquanto a primeira leitura ainda nao comeca.',
    };
  }

  if (state === 'processing') {
    return {
      cue: 'Acho que a sua conta esta prestes a revelar algo importante.',
      detail: 'Assim que a leitura terminar, eu te mostro o que vale observar primeiro.',
      idleLine: 'Estou observando este ciclo enquanto a leitura se organiza.',
    };
  }

  const memoryLine = humanizeMemorySignal(memorySnapshot?.memoryProfile.confirmedSignals?.[0]);
  const detail =
    latestAnalysis?.consultiveInsight?.headline ||
    latestAnalysis?.headline ||
    primaryAction?.title;

  return {
    cue: detail
      ? 'Acho que encontrei uma mudanca interessante.'
      : 'Estou observando este ciclo com voce.',
    detail,
    idleLine: 'Sigo observando este ciclo com voce, mesmo quando ainda falta um detalhe melhor.',
    memoryLine,
    questionIntro: currentQuestion ? 'Posso confirmar uma coisa?' : undefined,
  };
};

const buildReading = ({
  latestAnalysis,
  memorySnapshot,
  primaryAction,
  viewModel,
}: {
  latestAnalysis?: AnalysisSummary;
  memorySnapshot?: MemorySnapshot;
  primaryAction?: NextAction;
  viewModel: NucleoSessionViewModel;
}): GuidedConversationReading => {
  const knownSignals = uniqueStrings([
    ...(memorySnapshot?.memoryProfile.confirmedSignals ?? []),
    ...(memorySnapshot?.memoryInsights.confirmedContext ?? []),
    ...(memorySnapshot?.memoryInsights.observedBehavior ?? []),
    ...(latestAnalysis?.behaviorHighlights ?? []),
  ]).slice(0, 3);

  return {
    caution: 'Isso nao prova uma causa sozinho, mas indica onde vale olhar primeiro.',
    knownSignals,
    mainGap: memorySnapshot?.memoryGaps.items?.[0],
    primaryFactor:
      latestAnalysis?.consultiveInsight?.headline ||
      latestAnalysis?.headline ||
      primaryAction?.title,
    support:
      latestAnalysis?.consultiveInsight?.evidence ||
      latestAnalysis?.whatMattersNext ||
      viewModel.relate.support,
    title: 'Ja encontrei alguns sinais uteis. Antes de recomendar qualquer coisa, quero te mostrar o que faz sentido agora.',
  };
};

const buildFirstReading = ({
  currentQuestion,
  energyBehaviorProfile,
  latestAnalysis,
  latestInvoice,
  memorySnapshot,
  primaryAction,
  profile,
}: {
  currentQuestion?: GuidedConversationQuestion;
  energyBehaviorProfile: EnergyBehaviorProfile;
  latestAnalysis?: AnalysisSummary;
  latestInvoice?: InvoiceData;
  memorySnapshot?: MemorySnapshot;
  primaryAction?: NextAction;
  profile: UserProfileData;
}): GuidedFirstReading | undefined => {
  if (!latestInvoice) {
    return undefined;
  }

  const map = buildEnergyMapFromJourney({
    currentInvoice: latestInvoice,
    energyBehaviorProfile,
    profile,
  });
  const story = buildEnergyStoryFromJourney({
    currentInvoice: latestInvoice,
    energyBehaviorProfile,
    profile,
  });
  const topImpacts =
    map?.blocksByEstimatedImpact.slice(0, 3).map((block) => ({
      costLabel: formatCurrencyEstimate(block.estimatedCost),
      id: block.room,
      insight: block.educationalInsight,
      label: ENERGY_IMPACT_LABELS[block.room] ?? block.room,
      shareLabel: formatPercent(
        block.estimatedInvoiceSharePercent ??
          block.estimatedShare ??
          block.coverageContribution
      ),
    })) ?? [];
  const unexplainedShare =
    typeof map?.estimatedCoveragePercent === 'number'
      ? Math.max(0, Math.round((100 - map.estimatedCoveragePercent) * 10) / 10)
      : 100;
  const impacts =
    topImpacts.length > 0
      ? [
          ...topImpacts,
          ...(unexplainedShare > 0
            ? [
                {
                  id: 'unexplained',
                  insight:
                    'Ainda existem habitos e equipamentos fora deste mapa inicial que podem mudar essa leitura.',
                  isResidual: true,
                  label: 'Ainda nao explicado',
                  shareLabel: formatPercent(unexplainedShare),
                } satisfies GuidedFirstReadingImpact,
              ]
            : []),
        ]
      : [
          {
            id: 'unexplained',
            insight:
              'Ainda faltam detalhes suficientes para transformar a conta em um mapa mais explicavel.',
            isResidual: true,
            label: 'Ainda nao explicado',
            shareLabel: formatPercent(100),
          },
        ];
  const hasEstimatedImpacts = topImpacts.length > 0;
  const hasResidualGap = unexplainedShare > 0;
  const invoiceLabel = getInvoiceLabel(latestInvoice);
  const primaryDiscovery = buildPrimaryDiscovery({
    impacts: topImpacts,
    invoiceLabel,
    storySupport: topImpacts[0]?.isResidual
      ? story?.coreNarrative
      : story?.strongestFinding ||
        getDominantImpactSummary(topImpacts[0], { conservative: hasResidualGap }),
    storySummary: story?.educationalInsight || story?.explainedCoverageText,
    unexplainedShare,
  });
  const detailImpacts = impacts.filter((impact) => impact.id !== primaryDiscovery.subjectId);
  const conversationMemory = buildConversationMemory({
    latestAnalysis,
    memorySnapshot,
    primaryAction,
  });
  const deepReadingPreview =
    hasEstimatedImpacts && hasResidualGap
      ? 'Parte do consumo ainda depende de habitos e equipamentos que ainda nao entraram com clareza no mapa.'
      : latestAnalysis?.consultiveInsight?.evidence ||
        story?.educationalInsight ||
        latestAnalysis?.headline ||
        (hasEstimatedImpacts
          ? 'Esse e o primeiro peso que apareceu com mais clareza nesta conta.'
          : undefined);
  const uncertainty =
    hasEstimatedImpacts
      ? 'Ainda tem uma parte da conta que eu preciso confirmar.'
      : 'Ainda preciso de alguns sinais para separar melhor os pesos.';
  const deepReadingAvailable =
    detailImpacts.length > 0 ||
    Boolean(deepReadingPreview);
  const hermesOpening = buildHermesOpeningLine({
    invoiceLabel,
    primaryDiscovery,
  });
  const productRuntime = buildProductRuntime({
    billValue: formatCurrency(latestInvoice.totalValue),
    consumption: formatConsumption(latestInvoice.consumption),
    conversationMemory,
    ctaLabel: currentQuestion ? 'Refinar leitura' : undefined,
    deepReadingAvailable,
    deepReadingPreview,
    deepReadingTarget: currentQuestion?.kind === 'context' ? 'memory' : 'summary',
    hermesMessage: hermesOpening,
    nextQuestionAvailable: Boolean(currentQuestion),
    primaryActionLabel:
      primaryDiscovery.action ||
      currentQuestion?.helperText ||
      primaryAction?.reason ||
      latestAnalysis?.whatMattersNext,
    primaryDiscovery: {
      headline: primaryDiscovery.headline,
      id: primaryDiscovery.subjectId,
      meaning: primaryDiscovery.meaning,
    },
    question: buildRuntimeQuestion(currentQuestion),
    scoreSupport: deepReadingPreview,
    secondarySignals: detailImpacts.map((impact) => ({
      costLabel: impact.costLabel,
      id: impact.id,
      insight: impact.insight,
      isResidual: impact.isResidual,
      label: impact.label,
      shareLabel: impact.shareLabel,
    })),
    uncertainty,
  });

  return {
    billValue: formatCurrency(latestInvoice.totalValue),
    conversationMemory,
    consumption: formatConsumption(latestInvoice.consumption),
    impacts: detailImpacts,
    primaryDiscovery,
    intro: primaryDiscovery.headline,
    nextRefinement:
      currentQuestion?.helperText ||
      primaryAction?.reason ||
      latestAnalysis?.whatMattersNext,
    productRuntime,
    support: deepReadingPreview,
    title: conversationMemory || hermesOpening,
    uncertainty,
  };
};

export const buildGuidedAnswerFeedbackSurface = ({
  question,
  value,
}: {
  question: GuidedConversationActionQuestion | GuidedConversationContextQuestion;
  value: string;
}): GuidedConversationFeedbackSurface => {
  if (question.kind === 'context') {
    const memoryFeedback = buildMemoryFeedback(question.id, value);
    const productRuntime = buildResponseProductRuntime({
      cta: {
        label: 'Continuar leitura',
        target: 'question',
      },
      deepReadingTarget: 'memory',
      hermesLine: 'Anotei isso para continuar com mais contexto.',
      scoreActionLabel:
        question.helperText || 'Continuar leitura',
      scoreHeadline: memoryFeedback.message,
      scoreSupport:
        question.helperText || 'Isso deixa a leitura mais ligada a sua rotina.',
      uncertainty:
        'Ainda quero cruzar isso com o restante da conta antes de concluir algo maior.',
    });

    return {
      continueLabel: productRuntime.cta?.label,
      message: productRuntime.experience.score.discovery?.headline || memoryFeedback.message,
      productRuntime,
      title: productRuntime.experience.hermes.line || 'Anotei sua resposta.',
    };
  }

  const adaptiveAnswer = describeAdaptiveAnswer(question.id, value);
  const productRuntime = buildResponseProductRuntime({
    cta: {
      label: 'Continuar leitura',
      target: 'question',
    },
    deepReadingTarget: question.investigation?.targetArea === 'occupancy' ? 'memory' : 'summary',
    hermesLine: 'Recebi sua resposta e segui com a leitura.',
    scoreActionLabel:
      question.helperText || 'Continuar leitura',
    scoreHeadline: adaptiveAnswer.insight,
    scoreSupport:
      question.helperText || 'Isso ajuda a deixar a proxima leitura menos generica.',
    uncertainty:
      'Ainda existe uma parte da conta que eu quero confirmar antes da proxima conclusao.',
  });

  return {
    continueLabel: productRuntime.cta?.label,
    message: productRuntime.experience.score.discovery?.headline || adaptiveAnswer.insight,
    productRuntime,
    title: productRuntime.experience.hermes.line || 'Recebi sua resposta.',
  };
};

const buildConclusion = ({
  knowledgeState,
  latestAnalysis,
  memorySnapshot,
  primaryAction,
  viewModel,
}: {
  knowledgeState: EnergyKnowledgeState;
  latestAnalysis?: AnalysisSummary;
  memorySnapshot?: MemorySnapshot;
  primaryAction?: NextAction;
  viewModel: NucleoSessionViewModel;
}): GuidedConversationConclusion => {
  const lastKnowledge = getLastLearnedEnergyKnowledge(knowledgeState);
  const nextKnowledge = getNextEnergyKnowledge(knowledgeState);
  const identifiedFactors = uniqueStrings([
    ...(latestAnalysis?.behaviorHighlights ?? []),
    ...(primaryAction?.answeredQuestionSummaries ?? []),
    ...(primaryAction?.knownBehaviorSummary ?? []),
    ...(memorySnapshot?.memoryInsights.observedBehavior ?? []),
  ]).slice(0, 4);
  const unknowns = uniqueStrings(memorySnapshot?.memoryGaps.items ?? []).slice(0, 4);
  const evidence = uniqueStrings([
    ...(primaryAction?.usedDataPoints ?? []),
    ...(latestAnalysis?.evidenceItems ?? []).map((item) => `${item.label}: ${item.value}`),
    latestAnalysis?.consultiveInsight?.evidence,
  ]).slice(0, 5);

  return {
    evidence,
    identifiedFactors,
    lastKnowledge: lastKnowledge?.title,
    message:
      latestAnalysis?.whatMattersNext ||
      primaryAction?.description ||
      viewModel.cycleSummary.support,
    nextKnowledge: nextKnowledge?.title,
    nextStepDetail: primaryAction?.reason || viewModel.orient.followUp,
    nextStepTitle: primaryAction?.title || viewModel.orient.actionTitle,
    title:
      primaryAction?.status === 'completed'
        ? 'Esta sessao ja foi incorporada a sua jornada.'
        : 'Fechamos a leitura principal deste ciclo.',
    unknowns,
  };
};

export const buildGuidedConversationViewModel = ({
  contextQuestion,
  energyBehaviorProfile,
  knowledgeState,
  latestAnalysis,
  latestInvoice,
  memorySnapshot,
  profile,
  primaryAction,
  viewModel,
}: BuildGuidedConversationInput): GuidedConversationViewModel => {
  const state = getConversationState(viewModel.visualState);
  const invoiceLabel = getInvoiceLabel(latestInvoice);
  const currentQuestion =
    state === 'ready' ? buildQuestion({ contextQuestion, primaryAction }) : undefined;
  const accountUnderstanding = buildAccountUnderstandingPanel({
    currentQuestion,
    latestAnalysis,
    memorySnapshot,
    primaryAction,
  });
  const firstReading =
    state === 'ready'
      ? buildFirstReading({
          currentQuestion,
          energyBehaviorProfile,
          latestAnalysis,
          latestInvoice,
          memorySnapshot,
          primaryAction,
          profile,
        })
      : undefined;
  const productRuntime =
    firstReading?.productRuntime ||
    buildPreReadyRuntime({
      latestInvoice,
      state,
    });

  return {
    accountUnderstanding,
    conclusion: buildConclusion({
      knowledgeState,
      latestAnalysis,
      memorySnapshot,
      primaryAction,
      viewModel,
    }),
    corePresence: buildCorePresence({
      currentQuestion,
      latestAnalysis,
      memorySnapshot,
      primaryAction,
      state,
    }),
    currentQuestion,
    firstReading,
    opening: buildOpening({
      latestInvoice,
      state,
    }),
    reading: buildReading({
      latestAnalysis,
      memorySnapshot,
      primaryAction,
      viewModel,
    }),
    scoreSummary: {
      level: viewModel.scoreSummary.level,
      points: viewModel.scoreSummary.points,
    },
    summary: buildSummary({
      knowledgeState,
      latestAnalysis,
      latestInvoice,
      memorySnapshot,
      primaryAction,
      viewModel,
    }),
    productRuntime,
    sessionKey: `${state}:${invoiceLabel}:${latestAnalysis?.headline ?? 'sem-analise'}`,
    state,
  };
};
