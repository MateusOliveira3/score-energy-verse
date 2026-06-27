import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRuntimeCoreExperience } from '@/lib/cognitive/buildRuntimeCoreExperience';
import { DEFAULT_MVP_STATE } from '@/lib/mvpJourneyState';
import { parseInvoiceText } from '@/lib/invoiceParser';
import type { InvoiceData, MvpState } from '@/types/mvp';

const makeInvoice = (overrides: Partial<InvoiceData> = {}): InvoiceData => ({
  fingerprint: overrides.fingerprint ?? 'invoice-runtime-001',
  fileName: overrides.fileName ?? 'runtime.pdf',
  fileType: overrides.fileType ?? 'application/pdf',
  fileSize: overrides.fileSize ?? 2048,
  consumption: overrides.consumption ?? 280,
  totalValue: overrides.totalValue ?? 320,
  month: overrides.month ?? 'maio de 2026',
  parser:
    overrides.parser ??
    parseInvoiceText(`
      DISTRIBUIDORA: SCORE TESTE
      REFERENCIA: 05/2026
      TOTAL A PAGAR: R$ 320,00
      CONSUMO FATURADO: 280 kWh
    `),
  uploadedAt: overrides.uploadedAt ?? '2026-05-10T10:00:00.000Z',
  ...overrides,
});

const makeState = (overrides: Partial<MvpState> = {}): MvpState => ({
  ...DEFAULT_MVP_STATE,
  ...overrides,
  profile: {
    ...DEFAULT_MVP_STATE.profile,
    ...overrides.profile,
  },
  userContext: {
    ...DEFAULT_MVP_STATE.userContext,
    ...overrides.userContext,
    questions: overrides.userContext?.questions ?? DEFAULT_MVP_STATE.userContext.questions,
  },
  knowledge: overrides.knowledge ?? DEFAULT_MVP_STATE.knowledge,
  energyBehaviorProfile: {
    ...DEFAULT_MVP_STATE.energyBehaviorProfile,
    ...overrides.energyBehaviorProfile,
  },
  analysis: {
    ...DEFAULT_MVP_STATE.analysis,
    ...overrides.analysis,
    invoiceHistory:
      overrides.analysis?.invoiceHistory ?? DEFAULT_MVP_STATE.analysis.invoiceHistory,
  },
});

test('runtime bridge retorna undefined sem hidratacao ou sem userId', () => {
  const state = makeState();

  assert.equal(
    buildRuntimeCoreExperience({
      isJourneyHydrated: false,
      userId: 'user-1',
      journeyState: state,
    }),
    undefined
  );

  assert.equal(
    buildRuntimeCoreExperience({
      isJourneyHydrated: true,
      userId: undefined,
      journeyState: state,
    }),
    undefined
  );
});

test('runtime bridge adapta a jornada atual para CoreExperience', () => {
  const currentInvoice = makeInvoice();
  const state = makeState({
    analysis: {
      ...DEFAULT_MVP_STATE.analysis,
      latestInvoice: currentInvoice,
      invoiceHistory: [currentInvoice],
      summary: {
        headline: 'Existe uma pista de custo medio neste ciclo.',
        observations: [],
        whatMattersNext: 'Confirmar o principal fator de uso.',
        efficiencyLabel: 'Em observacao',
      },
    },
    userContext: {
      ...DEFAULT_MVP_STATE.userContext,
      questions: {
        ...DEFAULT_MVP_STATE.userContext.questions,
        electric_shower: {
          ...DEFAULT_MVP_STATE.userContext.questions.electric_shower,
          status: 'answered',
          value: 'daily',
          label: 'Todos os dias',
          updatedAt: '2026-05-10T11:00:00.000Z',
        },
      },
    },
  });

  const experience = buildRuntimeCoreExperience({
    isJourneyHydrated: true,
    userId: 'user-bridge-1',
    journeyState: state,
    scoreState: {
      score: 200,
      level: 3,
      nextLevelScore: 300,
      progressToNextLevel: 0.4,
    },
  });

  assert.ok(experience);
  assert.equal(experience?.house.ownerId, 'user-bridge-1');
  assert.ok(experience?.speech.opening.length);
  assert.ok(experience?.primaryClue.evidenceIds.length);
  assert.ok(
    experience?.house.rooms.find((room) => room.type === 'bathroom')?.evidence.some((item) =>
      item.id.includes('electric-shower')
    )
  );
});

test('runtime bridge mantem a investigacao coerente quando a Story aponta climatizacao como proxima frente', () => {
  const currentInvoice = makeInvoice();
  const state = makeState({
    profile: {
      ...DEFAULT_MVP_STATE.profile,
      propertySize: 82,
    },
    analysis: {
      ...DEFAULT_MVP_STATE.analysis,
      latestInvoice: currentInvoice,
      invoiceHistory: [currentInvoice],
    },
    energyBehaviorProfile: {
      ...DEFAULT_MVP_STATE.energyBehaviorProfile,
      habits: {
        ...DEFAULT_MVP_STATE.energyBehaviorProfile.habits,
        roomCountRange: '4_6',
      },
      intentions: {
        ...DEFAULT_MVP_STATE.energyBehaviorProfile.intentions,
        thermalComfortInterest: 'sim',
      },
    },
  });

  const experience = buildRuntimeCoreExperience({
    isJourneyHydrated: true,
    userId: 'user-bridge-2',
    journeyState: state,
  });

  assert.equal(experience?.speech.source, 'energy_story');
  assert.match(experience?.speech.opening ?? '', /^Li sua conta de maio de 2026\./i);
  assert.match(experience?.speech.opening ?? '', /saiu na frente|sinal mais claro/i);
  assert.match(experience?.speech.clueLine ?? '', /maior parcela conhecida|primeiros sinais|peso/i);
  assert.match(experience?.primaryAction.reason ?? '', /climatizacao/i);
  assert.equal(experience?.status, 'clue_ready');
  assert.equal(experience?.primaryClue.shouldAskQuestion, false);
});

test('runtime bridge nao altera a jornada original', () => {
  const currentInvoice = makeInvoice();
  const state = makeState({
    analysis: {
      ...DEFAULT_MVP_STATE.analysis,
      latestInvoice: currentInvoice,
      invoiceHistory: [currentInvoice],
    },
  });
  const before = JSON.stringify(state);

  void buildRuntimeCoreExperience({
    isJourneyHydrated: true,
    userId: 'user-immutable',
    journeyState: state,
  });

  assert.equal(JSON.stringify(state), before);
});
