import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMascotGuidance, getScoreState } from '@/lib/mvpCoreFlow';
import {
  DEFAULT_MVP_STATE,
  getScoreExplanation,
  resolveFullJourneyState,
} from '@/lib/mvpJourneyState';
import {
  buildRankingEntryFromSnapshot,
  buildRankingSnapshotFromState,
} from '@/services/ranking/helpers';
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

test('scoreEvents adulterados sao normalizados antes do calculo', () => {
  const resolved = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
      scoreEvents: [
        {
          id: 'invoice-uploaded:invoice-2026-04',
          type: 'invoice_uploaded',
          label: 'Fatura adulterada',
          points: 999999,
          occurredAt: '2026-04-22T12:00:00.000Z',
        },
        {
          id: 'invoice-uploaded:invoice-2026-04',
          type: 'invoice_uploaded',
          label: 'Fatura duplicada',
          points: 120,
          occurredAt: '2026-04-22T12:01:00.000Z',
        },
        {
          id: 'profile-completed',
          type: 'profile_completed',
          label: 'Perfil concluido',
          points: -500,
          occurredAt: '2026-04-22T11:00:00.000Z',
        },
      ],
    })
  );
  const scoreState = getScoreState(resolved.scoreEvents);

  assert.equal(resolved.scoreEvents.length, 2);
  assert.equal(
    resolved.scoreEvents.find((event) => event.type === 'invoice_uploaded')?.points,
    120
  );
  assert.equal(scoreState.score, 200);
});

test('scoreEvents inconsistentes com a jornada resolvida nao entram no score', () => {
  const resolved = resolveFullJourneyState(
    makeState({
      scoreEvents: [
        {
          id: 'profile-completed',
          type: 'profile_completed',
          label: 'Perfil concluido sem perfil real',
          points: 80,
          occurredAt: '2026-04-22T11:00:00.000Z',
        },
        {
          id: 'analysis-completed:invoice-fantasma',
          type: 'analysis_completed',
          label: 'Analise sem fatura real',
          points: 100,
          occurredAt: '2026-04-22T12:00:00.000Z',
        },
      ],
    })
  );

  assert.equal(resolved.scoreEvents.length, 0);
  assert.equal(getScoreState(resolved.scoreEvents).score, 0);
});

test('snapshot de ranking usa score canonico derivado dos eventos validos', () => {
  const snapshot = buildRankingSnapshotFromState({
    userId: 'user-123456',
    rawState: makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
      scoreEvents: [
        {
          id: 'profile-completed',
          type: 'profile_completed',
          label: 'Perfil concluido',
          points: 8000,
          occurredAt: '2026-04-22T11:00:00.000Z',
        },
        {
          id: 'invoice-uploaded:invoice-2026-04',
          type: 'invoice_uploaded',
          label: 'Fatura enviada',
          points: 12000,
          occurredAt: '2026-04-22T12:00:00.000Z',
        },
        {
          id: 'analysis-completed:invoice-2026-04',
          type: 'analysis_completed',
          label: 'Analise concluida',
          points: 10000,
          occurredAt: '2026-04-22T12:05:00.000Z',
        },
      ],
    }),
    updatedAt: '2026-04-22T13:00:00.000Z',
  });

  assert.ok(snapshot);
  assert.equal(snapshot.score, 300);
  assert.equal(snapshot.level, 2);
});

test('entrada de ranking deriva level do score recebido', () => {
  const entry = buildRankingEntryFromSnapshot({
    snapshot: {
      userId: 'user-123456',
      displayName: 'Residencial em Sao Paulo',
      subtitle: 'Residencial - Sao Paulo',
      score: 300,
      level: 99,
      consumerType: 'Residencial',
      updatedAt: '2026-04-22T13:00:00.000Z',
    },
    currentUserId: 'other-user',
  });

  assert.equal(entry.score, 300);
  assert.equal(entry.level, 2);
});

test('score explicado bate com score calculado', () => {
  const state = makeState({
    profile: completeProfile,
    analysis: {
      status: 'ready',
      latestInvoice: invoice,
      invoiceHistory: [invoice],
      summary: analysis,
    },
    scoreEvents: [
      {
        id: 'profile-completed',
        type: 'profile_completed',
        label: 'Perfil concluido',
        points: 80,
        occurredAt: '2026-04-22T11:00:00.000Z',
      },
      {
        id: 'invoice-uploaded:invoice-2026-04',
        type: 'invoice_uploaded',
        label: 'Fatura enviada',
        points: 120,
        occurredAt: '2026-04-22T12:00:00.000Z',
      },
      {
        id: 'analysis-completed:invoice-2026-04',
        type: 'analysis_completed',
        label: 'Analise concluida',
        points: 100,
        occurredAt: '2026-04-22T12:05:00.000Z',
      },
    ],
  });
  const resolved = resolveFullJourneyState(state);
  const explanation = getScoreExplanation(state);
  const scoreState = getScoreState(resolved.scoreEvents);

  assert.equal(explanation.score, scoreState.score);
  assert.equal(explanation.level, scoreState.level);
  assert.equal(
    explanation.events.reduce((total, event) => total + event.points, 0),
    explanation.score
  );
});

test('eventos invalidos ou descartados nao aparecem como ganhos validos na explicacao', () => {
  const explanation = getScoreExplanation(
    makeState({
      scoreEvents: [
        {
          id: 'profile-completed',
          type: 'profile_completed',
          label: 'Perfil concluido sem perfil real',
          points: 80,
          occurredAt: '2026-04-22T11:00:00.000Z',
        },
        {
          id: 'invoice-uploaded:invoice-fantasma',
          type: 'invoice_uploaded',
          label: 'Fatura sem historico real',
          points: 120,
          occurredAt: '2026-04-22T12:00:00.000Z',
        },
      ],
    })
  );

  assert.equal(explanation.score, 0);
  assert.equal(explanation.events.length, 0);
  assert.deepEqual(explanation.achievements, []);
});

test('explicacao respeita pontos canonicos dos eventos', () => {
  const explanation = getScoreExplanation(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
      scoreEvents: [
        {
          id: 'profile-completed',
          type: 'profile_completed',
          label: 'Perfil concluido adulterado',
          points: 8000,
          occurredAt: '2026-04-22T11:00:00.000Z',
        },
        {
          id: 'invoice-uploaded:invoice-2026-04',
          type: 'invoice_uploaded',
          label: 'Fatura enviada adulterada',
          points: 12000,
          occurredAt: '2026-04-22T12:00:00.000Z',
        },
      ],
    })
  );

  assert.equal(explanation.score, 200);
  assert.deepEqual(
    explanation.events.map((event) => event.points),
    [80, 120]
  );
});

test('explicacao fica coerente em jornada nova', () => {
  const explanation = getScoreExplanation(makeState());

  assert.equal(explanation.journeyStage, 'onboarding');
  assert.equal(explanation.score, 0);
  assert.equal(explanation.events.length, 0);
  assert.equal(explanation.nextGain?.title, 'Completar o perfil');
  assert.equal(explanation.nextGain?.potentialPoints, 80);
});

test('explicacao fica coerente com perfil completo sem fatura', () => {
  const explanation = getScoreExplanation(makeState({ profile: completeProfile }));

  assert.equal(explanation.journeyStage, 'before-upload');
  assert.equal(explanation.nextGain?.title, 'Enviar a primeira fatura');
  assert.equal(explanation.nextGain?.potentialPoints, 220);
});

test('explicacao fica coerente com analise pronta', () => {
  const explanation = getScoreExplanation(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
      scoreEvents: [
        {
          id: 'invoice-uploaded:invoice-2026-04',
          type: 'invoice_uploaded',
          label: 'Fatura enviada',
          points: 120,
          occurredAt: '2026-04-22T12:00:00.000Z',
        },
        {
          id: 'analysis-completed:invoice-2026-04',
          type: 'analysis_completed',
          label: 'Analise concluida',
          points: 100,
          occurredAt: '2026-04-22T12:05:00.000Z',
        },
      ],
    })
  );

  assert.equal(explanation.journeyStage, 'analysis-ready');
  assert.equal(explanation.score, 220);
  assert.equal(explanation.nextGain?.potentialPoints, 30);
  assert.ok(explanation.nextGain?.relatedActionId);
});

test('explicacao fica coerente em retorno com historico', () => {
  const explanation = getScoreExplanation(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
      lastActiveAt: '2026-04-21T10:00:00.000Z',
      scoreEvents: [
        {
          id: 'invoice-uploaded:invoice-2026-04',
          type: 'invoice_uploaded',
          label: 'Fatura enviada',
          points: 120,
          occurredAt: '2026-04-22T12:00:00.000Z',
        },
      ],
    })
  );

  assert.equal(explanation.journeyStage, 'return-visit');
  assert.equal(explanation.score, 120);
  assert.equal(explanation.nextGain?.potentialPoints, 30);
});

test('proximo ganho possivel nao contradiz a jornada resolvida', () => {
  const onboardingExplanation = getScoreExplanation(makeState());
  const beforeUploadExplanation = getScoreExplanation(makeState({ profile: completeProfile }));
  const invoiceUploadedExplanation = getScoreExplanation(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'processing',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
      },
    })
  );

  assert.equal(onboardingExplanation.journeyStage, 'onboarding');
  assert.equal(onboardingExplanation.nextGain?.relatedActionId, 'complete-profile');
  assert.equal(beforeUploadExplanation.journeyStage, 'before-upload');
  assert.equal(beforeUploadExplanation.nextGain?.relatedActionId, 'complete-profile');
  assert.equal(invoiceUploadedExplanation.journeyStage, 'invoice-uploaded');
  assert.equal(invoiceUploadedExplanation.nextGain?.relatedActionId, 'continue-after-analysis');
});
