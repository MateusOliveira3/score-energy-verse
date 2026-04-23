import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMascotGuidance } from '@/lib/mvpCoreFlow';
import { DEFAULT_MVP_STATE, resolveFullJourneyState } from '@/lib/mvpJourneyState';
import { AnalysisSummary, InvoiceData, MvpState, UserProfileData } from '@/types/mvp';

const completeProfile: UserProfileData = {
  consumerType: 'Residencial',
  location: 'Sao Paulo',
  propertySize: 82,
  peopleCount: 3,
  energyPreference: 'Solar',
};

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
  analysis: {
    ...DEFAULT_MVP_STATE.analysis,
    ...overrides.analysis,
    invoiceHistory:
      overrides.analysis?.invoiceHistory ?? DEFAULT_MVP_STATE.analysis.invoiceHistory,
  },
  actions: {
    ...DEFAULT_MVP_STATE.actions,
    ...overrides.actions,
    items: overrides.actions?.items ?? DEFAULT_MVP_STATE.actions.items,
    viewedActionIds:
      overrides.actions?.viewedActionIds ?? DEFAULT_MVP_STATE.actions.viewedActionIds,
  },
  scoreEvents: overrides.scoreEvents ?? DEFAULT_MVP_STATE.scoreEvents,
});

test('perfil incompleto resolve para onboarding', () => {
  const resolved = resolveFullJourneyState(makeState({ journeyStage: 'analysis-ready' }));

  assert.equal(resolved.journeyStage, 'onboarding');
  assert.ok(resolved.actions.items.length > 0);
  assert.equal(resolved.actions.items[0].id, 'complete-profile');
});

test('perfil suficientemente completo sem fatura resolve para before-upload', () => {
  const resolved = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      journeyStage: 'return-visit',
    })
  );

  assert.equal(resolved.journeyStage, 'before-upload');
  assert.ok(resolved.actions.items.length > 0);
  assert.equal(resolved.actions.items[0].title, 'Enviar a primeira fatura');
});

test('fatura enviada sem analise pronta resolve para invoice-uploaded', () => {
  const resolved = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'processing',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
      },
      journeyStage: 'onboarding',
    })
  );

  assert.equal(resolved.journeyStage, 'invoice-uploaded');
  assert.ok(resolved.actions.items.length > 0);
  assert.equal(resolved.actions.items[0].id, 'continue-after-analysis');
});

test('analise pronta resolve para analysis-ready', () => {
  const resolved = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
      journeyStage: 'before-upload',
    })
  );

  assert.equal(resolved.journeyStage, 'analysis-ready');
  assert.ok(resolved.actions.items.length > 0);
  assert.ok(resolved.actions.items.some((action) => action.source === 'analysis'));
});

test('retorno apos inatividade com contexto retornavel resolve para return-visit', () => {
  const resolved = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
      lastActiveAt: '2026-04-21T10:00:00.000Z',
      journeyStage: 'analysis-ready',
    })
  );

  assert.equal(resolved.journeyStage, 'return-visit');
  assert.ok(resolved.actions.items.length > 0);
});

test('nextActions nunca fica vazio em jornadas novas ou intermediarias', () => {
  const newJourney = resolveFullJourneyState(makeState());
  const intermediateJourney = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'processing',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
      },
    })
  );

  assert.ok(newJourney.actions.items.length > 0);
  assert.ok(intermediateJourney.actions.items.length > 0);
});

test('guidance fica coerente com o stage resolvido', () => {
  const resolved = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
    })
  );
  const guidance = buildMascotGuidance({
    stage: resolved.journeyStage,
    profile: resolved.profile,
    invoice: resolved.analysis.latestInvoice,
    analysis: resolved.analysis.summary,
  });

  assert.equal(guidance.stage, resolved.journeyStage);
  assert.equal(guidance.stage, 'analysis-ready');
});

test('resolveFullJourneyState e idempotente', () => {
  const once = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
      actions: {
        items: [],
        viewedActionIds: ['choose-one-cost-cut'],
      },
      journeyStage: 'onboarding',
    })
  );
  const twice = resolveFullJourneyState(once);

  assert.deepEqual(twice, once);
});
