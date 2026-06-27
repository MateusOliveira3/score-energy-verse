import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildGuidedAnswerFeedbackSurface,
  buildDiscoveryCandidates,
  buildGuidedConversationViewModel,
  buildPrimaryDiscovery,
  selectPrimaryDiscoveryCandidate,
} from '@/lib/guidedConversation';
import { parseInvoiceText } from '@/lib/invoiceParser';
import type { NucleoSessionViewModel } from '@/lib/nucleoSession';
import type {
  EnergyBehaviorProfile,
  EnergyKnowledgeState,
  InvoiceData,
  NextAction,
  UserProfileData,
} from '@/types/mvp';

const makeInvoice = (): InvoiceData => ({
  fingerprint: 'guided-reading-001',
  fileName: 'guided-reading.pdf',
  fileType: 'application/pdf',
  fileSize: 2048,
  consumption: 280,
  totalValue: 320,
  month: 'maio de 2026',
  parser: parseInvoiceText(`
    DISTRIBUIDORA: SCORE TESTE
    REFERENCIA: 05/2026
    TOTAL A PAGAR: R$ 320,00
    CONSUMO FATURADO: 280 kWh
    DIAS FATURADOS: 30
  `),
  uploadedAt: '2026-05-10T10:00:00.000Z',
});

const profile: UserProfileData = {
  consumerType: 'Residencial',
  energyPreference: 'Convencional',
  location: 'Sao Paulo, SP',
  peopleCount: 3,
  propertySize: 82,
};

const energyBehaviorProfile: EnergyBehaviorProfile = {
  appliances: {},
  habits: {
    roomCountRange: '4_6',
  },
  intentions: {},
  qualification: {},
  actionMemory: {},
  confidence: {},
};

const knowledgeState: EnergyKnowledgeState = {
  learned: {},
};

const primaryAction: NextAction = {
  id: 'residence-cognitive-map',
  title: 'Continuar mapa da residencia',
  description: 'Ainda posso refinar a leitura da sua casa.',
  value: 'Casa menos desconhecida',
  reason: 'Uma pergunta curta pode deixar essa leitura mais precisa.',
  interactiveQuestions: [
    {
      id: 'bathrooms_count',
      prompt: 'Quantos banheiros entram na rotina dessa residencia?',
      helperText: 'Isso me ajuda a deixar a leitura do banheiro menos abstrata.',
      options: [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
      ],
    },
  ],
  priority: 'high',
  status: 'new',
  source: 'analysis',
};

const memorySnapshotWithContinuity = {
  memoryProfile: {
    confirmedSignals: ['Chuveiro eletrico confirmado'],
  },
  memoryInsights: {
    confirmedContext: ['Objetivo principal: reduzir desperdicios'],
    observedBehavior: ['Banhos longos em dias de calor'],
  },
  memoryKnowledge: {
    learnedCount: 1,
    totalCount: 12,
  },
  memoryGaps: {
    items: [],
  },
};

const nucleoViewModel: NucleoSessionViewModel = {
  visualState: 'guided',
  activeBeatId: 'observa',
  beats: [],
  userName: 'Sao Paulo, SP',
  welcomeTitle: 'Vamos entender o ciclo juntos',
  welcomeMessage: 'Mensagem',
  scoreSummary: {
    level: 4,
    nextLevelScore: 1200,
    points: 770,
    progressPercent: 62,
  },
  cycleSummary: {
    invoices: 1,
    stage: 'analysis-ready',
    headline: 'Existe uma pista inicial.',
    support: 'Mensagem',
  },
  observe: {
    title: 'Observe',
    invoiceLabel: 'maio de 2026',
    facts: [],
    extractedSignals: [],
  },
  relate: {
    title: 'Relacione',
    summary: 'Resumo',
    support: 'Suporte',
    chips: [],
  },
  memorize: {
    title: 'Memorize',
    summary: 'Resumo',
    learnedCount: 0,
    totalKnowledge: 0,
    confirmedSignals: [],
  },
  orient: {
    title: 'Oriente',
    summary: 'Resumo',
    actionTitle: primaryAction.title,
    actionValue: primaryAction.value,
    evidence: [],
    followUp: primaryAction.reason,
    statusLabel: 'Acao pronta para comecar',
  },
};

const buildReadyViewModel = (overrides?: {
  memorySnapshot?: typeof memorySnapshotWithContinuity;
  primaryAction?: NextAction;
  visualState?: NucleoSessionViewModel['visualState'];
}) =>
  buildGuidedConversationViewModel({
    contextQuestion: undefined,
    energyBehaviorProfile,
    knowledgeState,
    latestAnalysis: undefined,
    latestInvoice: makeInvoice(),
    memorySnapshot: overrides?.memorySnapshot,
    profile,
    primaryAction: overrides?.primaryAction ?? primaryAction,
    viewModel: {
      ...nucleoViewModel,
      visualState: overrides?.visualState ?? nucleoViewModel.visualState,
    },
  });

test('primary discovery escolhe o principal impacto da leitura atual', () => {
  const viewModel = buildReadyViewModel();

  assert.equal(viewModel.currentQuestion?.id, 'bathrooms_count');
  assert.equal(viewModel.firstReading?.billValue, 'R$ 320.00');
  assert.equal(viewModel.firstReading?.consumption, '280 kWh');
  assert.equal(viewModel.firstReading?.primaryDiscovery.source, 'dominant_impact');
  assert.equal(viewModel.firstReading?.primaryDiscovery.subjectId, 'refrigeration');
  assert.match(viewModel.firstReading?.primaryDiscovery.headline ?? '', /principal peso|sinal mais forte/i);
  assert.match(viewModel.firstReading?.primaryDiscovery.meaning ?? '', /dia inteiro|mes apos mes/i);
  assert.match(viewModel.firstReading?.primaryDiscovery.support ?? '', /refrigeracao/i);
  assert.match(viewModel.firstReading?.primaryDiscovery.action ?? '', /geladeira|calor/i);
  assert.equal(viewModel.firstReading?.productRuntime.primaryDiscovery?.id, 'refrigeration');
  assert.equal(
    viewModel.firstReading?.productRuntime.experience.hermes.message,
    'Encontrei algo interessante na sua conta de maio de 2026.'
  );
  assert.equal(
    viewModel.firstReading?.productRuntime.experience.score.discovery?.headline,
    viewModel.firstReading?.primaryDiscovery.headline
  );
  assert.equal(
    viewModel.firstReading?.productRuntime.experience.score.action?.label,
    viewModel.firstReading?.primaryDiscovery.action
  );
  assert.deepEqual(viewModel.firstReading?.productRuntime.cta, {
    label: 'Refinar leitura',
    target: 'question',
  });
});

test('discovery layer gera multiplos candidatos e escolhe um vencedor deterministico', () => {
  const candidates = buildDiscoveryCandidates({
    impacts: [
      { id: 'refrigeration', label: 'Refrigeracao', shareLabel: '≈ 18%' },
      { id: 'lighting', label: 'Iluminacao', shareLabel: '≈ 6%' },
    ],
    invoiceLabel: 'maio de 2026',
    storySupport: 'A refrigeracao parece representar a maior parcela conhecida da sua conta.',
    storySummary: 'Consumos pequenos e recorrentes tambem ajudam a explicar a conta.',
    unexplainedShare: 52,
  });

  const winner = selectPrimaryDiscoveryCandidate(candidates);

  assert.ok(candidates.length >= 2);
  assert.equal(winner.id, 'dominant-impact:refrigeration');
  assert.equal(winner, candidates[0]);
  assert.equal(new Set(candidates.map((candidate) => candidate.id)).size, candidates.length);
});

test('discovery layer desempata de forma deterministica', () => {
  const winner = selectPrimaryDiscoveryCandidate([
    {
      action: 'Acao A.',
      confidence: 'medium',
      headline: 'Descoberta A.',
      id: 'candidate-a',
      meaning: 'Meaning A.',
      priority: 300,
      reason: 'Empate controlado A.',
      score: 180,
      source: 'useful_discovery',
      support: 'Suporte A.',
    },
    {
      action: 'Acao B.',
      confidence: 'medium',
      headline: 'Descoberta B.',
      id: 'candidate-b',
      meaning: 'Meaning B.',
      priority: 300,
      reason: 'Empate controlado B.',
      score: 180,
      source: 'useful_discovery',
      support: 'Suporte B.',
    },
  ]);

  assert.equal(winner.id, 'candidate-a');
});

test('primary discovery entrega apenas uma descoberta curta e uma unica acao', () => {
  const viewModel = buildReadyViewModel();
  const primaryDiscovery = viewModel.firstReading?.primaryDiscovery;

  assert.ok(primaryDiscovery);
  assert.equal(
    (primaryDiscovery?.headline ?? '')
      .split('.')
      .map((part) => part.trim())
      .filter(Boolean).length,
    1
  );
  assert.equal(
    (primaryDiscovery?.support ?? '')
      .split('.')
      .map((part) => part.trim())
      .filter(Boolean).length,
    1
  );
  assert.equal(
    (primaryDiscovery?.meaning ?? '')
      .split('.')
      .map((part) => part.trim())
      .filter(Boolean).length <= 2,
    true
  );
  assert.equal(
    (primaryDiscovery?.action ?? '')
      .split('.')
      .map((part) => part.trim())
      .filter(Boolean).length,
    1
  );
  assert.ok((primaryDiscovery?.headline.length ?? 0) <= 90);
  assert.ok((primaryDiscovery?.meaning.length ?? 0) <= 140);
  assert.ok((primaryDiscovery?.support.length ?? 0) <= 110);
  assert.ok((primaryDiscovery?.action.length ?? 0) <= 120);
});

test('meaning nunca fica vazio e explica consequencia sem termos proibidos', () => {
  const meanings = [
    buildReadyViewModel().firstReading?.primaryDiscovery.meaning,
    buildPrimaryDiscovery({
      impacts: [],
      invoiceLabel: 'maio de 2026',
      unexplainedShare: 100,
    }).meaning,
  ].filter((value): value is string => Boolean(value));

  assert.ok(meanings.length >= 2);

  meanings.forEach((meaning) => {
    assert.ok(meaning.trim().length > 0);
    [
      /\balgoritmo\b/i,
      /\binvestigacao\b/i,
      /\bhipotese\b/i,
      /\bconfidence\b/i,
      /\bestimativa\b/i,
      /\bmetodologia\b/i,
      /\bllm\b/i,
      /\bia\b/i,
    ].forEach((pattern) => {
      assert.equal(pattern.test(meaning), false);
    });
  });
});

test('surface principal evita termos internos e nao repete o mesmo protagonista', () => {
  const viewModel = buildReadyViewModel();
  const surfaceText = [
    viewModel.firstReading?.title,
    viewModel.firstReading?.conversationMemory,
    viewModel.firstReading?.intro,
    viewModel.firstReading?.primaryDiscovery.meaning,
    viewModel.firstReading?.primaryDiscovery.action,
    viewModel.currentQuestion?.heading,
    viewModel.currentQuestion?.helperText,
    viewModel.currentQuestion?.transitionText,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  [
    'hipotese',
    'evidencia',
    'targetarea',
    'confidence',
    'estimativas iniciais',
    'investigacao',
    'housemodel',
  ].forEach((term) => {
    assert.equal(surfaceText.includes(term), false);
  });

  assert.ok(
    viewModel.firstReading?.impacts.every((impact) => impact.id !== viewModel.firstReading?.primaryDiscovery.subjectId)
  );
  assert.notEqual(viewModel.firstReading?.title, viewModel.firstReading?.intro);
  assert.equal(
    viewModel.firstReading?.productRuntime.visibleSections.includes('secondary_signals'),
    true
  );
  assert.equal(
    viewModel.firstReading?.productRuntime.experience.hermes.question?.id,
    viewModel.currentQuestion?.id
  );
  assert.equal(
    viewModel.firstReading?.productRuntime.experience.hermes.question?.detailSection,
    'summary'
  );
});

test('sem impacto dominante a discovery layer ainda escolhe uma unica descoberta util', () => {
  const discovery = buildPrimaryDiscovery({
    impacts: [
      { id: 'lighting', label: 'Iluminacao', shareLabel: '≈ 6%' },
      { id: 'refrigeration', label: 'Refrigeracao', shareLabel: '≈ 5%' },
    ],
    invoiceLabel: 'maio de 2026',
    storySummary: 'Ainda nao existe um protagonista claro.',
    unexplainedShare: 82,
  });

  assert.equal(discovery.source, 'useful_discovery');
  assert.ok(['lighting', 'refrigeration'].includes(discovery.subjectId ?? ''));
  assert.match(discovery.headline, /sinal util/i);
  assert.match(discovery.meaning, /consumo|dia a dia|lampadas|invisivel/i);
  assert.equal(
    discovery.action
      .split('.')
      .map((part) => part.trim())
      .filter(Boolean).length,
    1
  );
});

test('ausencia de descobertas ainda produz apenas um fallback seguro', () => {
  const candidates = buildDiscoveryCandidates({
    impacts: [],
    invoiceLabel: 'maio de 2026',
    unexplainedShare: 100,
  });
  const winner = selectPrimaryDiscoveryCandidate(candidates);

  assert.equal(candidates.length, 1);
  assert.equal(winner.source, 'first_signal');
  assert.match(winner.headline, /primeira leitura util/i);
  assert.match(winner.meaning, /cada nova informacao/i);
});

test('jornada pronta sem pergunta ativa continua gerando descoberta sem crash', () => {
  const viewModel = buildReadyViewModel({
    primaryAction: {
      ...primaryAction,
      interactiveQuestions: [],
    },
  });

  assert.equal(viewModel.state, 'ready');
  assert.equal(viewModel.currentQuestion, undefined);
  assert.ok(viewModel.firstReading);
  assert.match(viewModel.firstReading?.title ?? '', /Encontrei/i);
  assert.equal(
    viewModel.firstReading?.nextRefinement,
    'Uma pergunta curta pode deixar essa leitura mais precisa.'
  );
});

test('hero continua recebendo apenas primary discovery na leitura pronta', () => {
  const viewModel = buildReadyViewModel();

  assert.ok(viewModel.firstReading?.primaryDiscovery);
  assert.equal(typeof viewModel.firstReading?.primaryDiscovery.headline, 'string');
  assert.equal(typeof viewModel.firstReading?.primaryDiscovery.meaning, 'string');
  assert.equal(typeof viewModel.firstReading?.primaryDiscovery.action, 'string');
  assert.match(
    viewModel.firstReading?.title ?? '',
    /Acabei de terminar a leitura inicial|Encontrei algo interessante/i
  );
  assert.notEqual(viewModel.firstReading?.title, viewModel.firstReading?.primaryDiscovery.headline);
  assert.equal(viewModel.firstReading?.intro, viewModel.firstReading?.primaryDiscovery.headline);
});

test('primeira abertura nao possui memoria conversacional', () => {
  const viewModel = buildReadyViewModel();

  assert.equal(viewModel.firstReading?.conversationMemory, undefined);
  assert.match(
    viewModel.firstReading?.title ?? '',
    /Acabei de terminar a leitura inicial|Encontrei algo interessante/i
  );
  assert.equal(viewModel.firstReading?.productRuntime.stage, 'refinement_reading');
});

test('segunda abertura pode transmitir continuidade sem repetir discovery', () => {
  const viewModel = buildReadyViewModel({
    memorySnapshot: memorySnapshotWithContinuity,
  });

  assert.equal(viewModel.firstReading?.conversationMemory, 'Com o que descobrimos ate aqui, consigo olhar esta conta com mais contexto.');
  assert.equal(viewModel.firstReading?.title, viewModel.firstReading?.conversationMemory);
  assert.notEqual(viewModel.firstReading?.conversationMemory, viewModel.firstReading?.primaryDiscovery.headline);
  assert.notEqual(viewModel.firstReading?.conversationMemory, viewModel.firstReading?.primaryDiscovery.meaning);
  assert.equal(viewModel.firstReading?.productRuntime.stage, 'memory_reading');
  assert.equal(
    viewModel.firstReading?.productRuntime.experience.hermes.line,
    viewModel.firstReading?.conversationMemory
  );
});

test('memoria conversacional reconhece progresso apos respostas recentes', () => {
  const progressedAction: NextAction = {
    ...primaryAction,
    answeredQuestionSummaries: ['Banheiro principal confirmado'],
  };
  const viewModel = buildReadyViewModel({
    memorySnapshot: memorySnapshotWithContinuity,
    primaryAction: progressedAction,
  });

  assert.equal(
    viewModel.firstReading?.conversationMemory,
    'Depois das ultimas respostas, a leitura ficou mais consistente.'
  );
  assert.equal(viewModel.firstReading?.productRuntime.conversationMemory, viewModel.firstReading?.conversationMemory);
  assert.equal(
    viewModel.firstReading?.productRuntime.experience.hermes.memory,
    viewModel.firstReading?.conversationMemory
  );
});

test('memoria conversacional permanece curta e sem termos internos', () => {
  const memoryLines = [
    buildReadyViewModel({
      memorySnapshot: memorySnapshotWithContinuity,
    }).firstReading?.conversationMemory,
    buildReadyViewModel({
      memorySnapshot: memorySnapshotWithContinuity,
      primaryAction: {
        ...primaryAction,
        answeredQuestionSummaries: ['Banheiro principal confirmado'],
      },
    }).firstReading?.conversationMemory,
  ].filter((value): value is string => Boolean(value));

  assert.ok(memoryLines.length >= 2);

  memoryLines.forEach((memoryLine) => {
    assert.ok(memoryLine.length <= 90);
    [
      /\balgoritmo\b/i,
      /\binvestigacao\b/i,
      /\bhipotese\b/i,
      /\bconfidence\b/i,
      /\bia\b/i,
      /\bhousemodel\b/i,
    ].forEach((pattern) => {
      assert.equal(pattern.test(memoryLine), false);
    });
  });
});

test('estados pre-ready passam pelo product runtime', () => {
  const uploadViewModel = buildReadyViewModel({
    visualState: 'upload',
  });

  assert.equal(uploadViewModel.state, 'upload');
  assert.equal(uploadViewModel.productRuntime.state, 'upload');
  assert.equal(
    uploadViewModel.productRuntime.experience.hermes.line,
    'Quando a conta entrar, eu sigo com voce.'
  );
  assert.equal(
    uploadViewModel.productRuntime.experience.score.discovery?.headline,
    'A primeira leitura comeca quando a fatura vira casa.'
  );
});

test('cada estado pre-ready mantem no maximo um cta', () => {
  const states: Array<NucleoSessionViewModel['visualState']> = [
    'loading',
    'profile',
    'upload',
    'processing',
  ];

  states.forEach((visualState) => {
    const viewModel = buildReadyViewModel({
      visualState,
    });

    assert.ok(viewModel.productRuntime.cta === null || typeof viewModel.productRuntime.cta.label === 'string');
  });
});

test('pos-resposta nao usa termos internos e nasce fora do react', () => {
  const surface = buildGuidedAnswerFeedbackSurface({
    question: {
      action: primaryAction,
      heading: 'Refinando o peso do banho',
      helperText: 'Isso me ajuda a deixar a leitura do banheiro menos abstrata.',
      id: 'bathrooms_count',
      kind: 'action',
      options: [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
      ],
      prompt: 'Quantos banheiros entram na rotina dessa residencia?',
    },
    value: '2',
  });

  const text = [
    surface.title,
    surface.message,
    surface.productRuntime.experience.hermes.line,
    surface.productRuntime.experience.score.discovery?.headline,
    surface.productRuntime.experience.score.support,
    surface.productRuntime.experience.score.action?.label,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  ['hipotese', 'evidencia', 'investigacao', 'confidence', 'pista', 'runtime', 'compreensao atualizada'].forEach(
    (term) => {
      assert.equal(text.includes(term), false);
    }
  );
});
