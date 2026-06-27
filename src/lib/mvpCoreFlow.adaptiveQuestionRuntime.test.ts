import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildInteractiveQuestionsForAction,
  buildNextActions,
  buildMemoryFeedback,
  describeAdaptiveAnswer,
} from '@/lib/mvpCoreFlow';
import {
  DEFAULT_MVP_STATE,
  resolveFullJourneyState,
  saveEnergyBehaviorAnswer,
} from '@/lib/mvpJourneyState';
import type {
  AnalysisSummary,
  EnergyBehaviorProfile,
  InvoiceData,
  InvoiceParserResult,
  MvpState,
  UserProfileData,
} from '@/types/mvp';
import { parseInvoiceText } from '@/lib/invoiceParser';

const completeProfile: UserProfileData = {
  consumerType: 'Residencial',
  location: 'Sao Paulo',
  propertySize: 82,
  peopleCount: 3,
  energyPreference: 'Solar',
};

const makeParser = (text = ''): InvoiceParserResult => parseInvoiceText(text);

const invoice: InvoiceData = {
  fingerprint: 'invoice-2026-04',
  fileName: 'fatura-abril.pdf',
  fileType: 'application/pdf',
  fileSize: 245000,
  consumption: 360,
  totalValue: 430,
  taxPercentage: 28,
  peakHours: '18:00-22:00',
  month: 'abril de 2026',
  parser: makeParser(`
    DISTRIBUIDORA: ENERGIA TESTE
    UNIDADE CONSUMIDORA: 1234567
    REFERENCIA: 04/2026
    VENCIMENTO: 22/04/2026
    TOTAL A PAGAR: R$ 430,00
    CONSUMO FATURADO: 360 kWh
  `),
  uploadedAt: '2026-04-22T12:00:00.000Z',
};

const analysis: AnalysisSummary = {
  consumptionLevel: 'moderado',
  costSignal: 'atencao',
  headline: 'Consumo moderado e sinal de custo atencao.',
  observations: [
    'O consumo estimado esta em uma faixa intermediaria.',
    'Os horarios de pico merecem foco.',
  ],
  whatMattersNext:
    'O que mais importa agora e controlar o custo da proxima fatura com uma mudanca simples e mensuravel.',
  efficiencyLabel: 'Eficiencia em ajuste',
};

const makeState = (overrides: Partial<MvpState> = {}): MvpState => ({
  ...DEFAULT_MVP_STATE,
  ...overrides,
  profile: overrides.profile ?? DEFAULT_MVP_STATE.profile,
  mascot: overrides.mascot ?? DEFAULT_MVP_STATE.mascot,
  userContext: {
    ...DEFAULT_MVP_STATE.userContext,
    ...overrides.userContext,
    questions: overrides.userContext?.questions ?? DEFAULT_MVP_STATE.userContext.questions,
  },
  analysis: {
    ...DEFAULT_MVP_STATE.analysis,
    ...overrides.analysis,
    invoiceHistory: overrides.analysis?.invoiceHistory ?? DEFAULT_MVP_STATE.analysis.invoiceHistory,
  },
  actions: {
    ...DEFAULT_MVP_STATE.actions,
    ...overrides.actions,
    items: overrides.actions?.items ?? DEFAULT_MVP_STATE.actions.items,
    viewedActionIds: overrides.actions?.viewedActionIds ?? DEFAULT_MVP_STATE.actions.viewedActionIds,
  },
  scoreEvents: overrides.scoreEvents ?? DEFAULT_MVP_STATE.scoreEvents,
});

const makeComfortFocusedProfile = (): EnergyBehaviorProfile => ({
  appliances: {
    hasAirConditioning: true,
  },
  habits: {
    residenceType: 'casa',
    roomCountRange: '4_6',
    hasChildren: false,
    hasElderly: false,
  },
  intentions: {
    thermalComfortInterest: 'sim',
  },
  qualification: {},
  actionMemory: {
    answeredActionPrompts: {
      bathrooms_count: {
        answer: '1',
        answeredAt: '2026-04-23T12:00:00.000Z',
      },
    },
  },
  confidence: {},
});

test('fallback preserva a primeira pergunta deterministica quando a investigacao ainda nao tem foco', () => {
  const questions = buildInteractiveQuestionsForAction({
    actionTitle: 'Continuar mapa da residencia',
    energyBehaviorProfile: {
      appliances: {},
      habits: {},
      intentions: {},
      qualification: {},
      actionMemory: {},
      confidence: {},
    },
  });

  assert.equal(questions?.[0]?.id, 'residence_type');
});

test('runtime adaptativo prioriza climatizacao quando essa frente fica dominante', () => {
  const actions = buildNextActions(
    invoice,
    analysis,
    completeProfile,
    undefined,
    makeComfortFocusedProfile()
  );
  const residenceMapAction = actions.find((action) => action.id === 'residence-cognitive-map');
  const questionIds = (residenceMapAction?.interactiveQuestions ?? []).map((question) => question.id);

  assert.equal(questionIds[0], 'air_conditioning_count');
  assert.ok(questionIds.includes('shower_heating_type'));
});

test('salvar resposta recalcula a proxima pergunta e nao reapresenta a pergunta respondida', () => {
  const comfortFocusedState = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
      energyBehaviorProfile: makeComfortFocusedProfile(),
    })
  );
  const residenceMapAction = comfortFocusedState.actions.items.find(
    (action) => action.id === 'residence-cognitive-map'
  );

  assert.equal(residenceMapAction?.interactiveQuestions?.[0]?.id, 'air_conditioning_count');

  const nextState = saveEnergyBehaviorAnswer(comfortFocusedState, {
    ...residenceMapAction!,
    pendingAnswer: {
      questionId: 'air_conditioning_count',
      answer: '2',
      answeredAt: '2026-04-23T12:10:00.000Z',
    },
  });
  const refreshedAction = nextState.actions.items.find(
    (action) => action.id === 'residence-cognitive-map'
  );
  const refreshedQuestionIds = (refreshedAction?.interactiveQuestions ?? []).map(
    (question) => question.id
  );

  assert.equal(nextState.energyBehaviorProfile.appliances.airConditioningCount, 2);
  assert.equal(refreshedQuestionIds[0], 'dominant_usage_period');
  assert.ok(!refreshedQuestionIds.includes('air_conditioning_count'));
});

test('pergunta adaptativa ganha motivo curto ligado ao bloco que sera refinado', () => {
  const actions = buildNextActions(
    invoice,
    analysis,
    completeProfile,
    undefined,
    makeComfortFocusedProfile()
  );
  const residenceMapAction = actions.find((action) => action.id === 'residence-cognitive-map');
  const firstQuestion = residenceMapAction?.interactiveQuestions?.[0];

  assert.equal(firstQuestion?.id, 'air_conditioning_count');
  assert.match(firstQuestion?.helperText ?? '', /climatizacao|conta/i);
  assert.equal(firstQuestion?.investigation?.targetArea, 'comfort');
});

test('devolutiva apos resposta usa linguagem humana e evita termos internos', () => {
  const feedback = buildMemoryFeedback('bathrooms_count', '2');
  const adaptiveAnswer = describeAdaptiveAnswer('electric_shower_presence', 'sim');
  const surfaceText = [
    feedback.message,
    adaptiveAnswer.evidence,
    adaptiveAnswer.hypothesis,
    adaptiveAnswer.insight,
    adaptiveAnswer.uncertainty,
  ]
    .join(' ')
    .toLowerCase();

  assert.equal(surfaceText.includes('score'), false);
  ['hipotese', 'evidencia', 'targetarea', 'confidence'].forEach((term) => {
    assert.equal(surfaceText.includes(term), false);
  });
  assert.match(adaptiveAnswer.evidence, /banho|conta|leitura/i);
});
