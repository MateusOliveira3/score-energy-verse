import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMascotGuidance,
  buildNextActions,
  getScoreEventPoints,
  getScoreState,
} from '@/lib/mvpCoreFlow';
import {
  buildActionResultLink,
  buildInvoiceComparison,
  buildNextCycleGuidance,
  captureActionSnapshotsForInvoice,
  DEFAULT_MVP_STATE,
  getScoreExplanation,
  resolveFullJourneyState,
  updateActionStatus,
} from '@/lib/mvpJourneyState';
import {
  buildRankingEntryFromSnapshot,
  buildRankingSnapshotFromState,
} from '@/services/ranking/helpers';
import { AnalysisSummary, InvoiceData, MvpState, NextAction, UserProfileData } from '@/types/mvp';

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

const makeInvoice = (overrides: Partial<InvoiceData>): InvoiceData => ({
  ...invoice,
  ...overrides,
  fingerprint: overrides.fingerprint ?? `invoice-${overrides.month ?? invoice.month}`,
  fileName: overrides.fileName ?? `fatura-${overrides.month ?? invoice.month}.pdf`,
});

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

test('nextActions de analise pronta incluem contexto, execucao e impacto no score', () => {
  const actions = buildNextActions(invoice, analysis, completeProfile);
  const costCutAction = actions.find((action) => action.id === 'choose-one-cost-cut');

  assert.ok(costCutAction);
  assert.ok(costCutAction.description.includes(invoice.peakHours));
  assert.ok(costCutAction.context);
  assert.ok(costCutAction.suggestion);
  assert.ok(costCutAction.validation);
  assert.ok(costCutAction.impact?.includes(`+${getScoreEventPoints('action_viewed')}`));
});

test('normalizacao preserva campos opcionais de nextActions enriquecidas', () => {
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
  const firstAction = resolved.actions.items[0];

  assert.ok(firstAction.context);
  assert.ok(firstAction.suggestion);
  assert.ok(firstAction.impact);
  assert.ok(firstAction.validation);
});

test('status de execucao da acao e preservado pela jornada resolvida', () => {
  const baseActions = buildNextActions(invoice, analysis, completeProfile);
  const resolved = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
      actions: {
        items: baseActions.map((action) =>
          action.id === 'choose-one-cost-cut'
            ? { ...action, status: 'in_progress' }
            : action
        ),
        viewedActionIds: ['choose-one-cost-cut'],
      },
    })
  );

  assert.equal(
    resolved.actions.items.find((action) => action.id === 'choose-one-cost-cut')?.status,
    'in_progress'
  );
  assert.ok(resolved.actions.viewedActionIds.includes('choose-one-cost-cut'));
});

test('status legado started e normalizado como in_progress', () => {
  const baseActions = buildNextActions(invoice, analysis, completeProfile);
  const legacyActions = baseActions.map((action) =>
    action.id === 'choose-one-cost-cut'
      ? { ...action, status: 'started' as unknown as NextAction['status'] }
      : action
  );
  const resolved = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
      actions: {
        items: legacyActions,
        viewedActionIds: [],
      },
    })
  );

  assert.equal(
    resolved.actions.items.find((action) => action.id === 'choose-one-cost-cut')?.status,
    'in_progress'
  );
  assert.ok(resolved.actions.viewedActionIds.includes('choose-one-cost-cut'));
});

test('updateActionStatus inicia e conclui acao sem criar estrutura paralela', () => {
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
  const targetActionId = resolved.actions.items[0].id;
  const inProgress = updateActionStatus(resolved, targetActionId, 'in_progress');
  const completed = updateActionStatus(inProgress, targetActionId, 'completed');

  assert.equal(
    inProgress.actions.items.find((action) => action.id === targetActionId)?.status,
    'in_progress'
  );
  assert.equal(
    completed.actions.items.find((action) => action.id === targetActionId)?.status,
    'completed'
  );
  assert.deepEqual(completed.actions.viewedActionIds, inProgress.actions.viewedActionIds);
  assert.ok(completed.actions.viewedActionIds.includes(targetActionId));
});

test('captura somente acoes em teste ou testadas para a proxima fatura', () => {
  const baseActions = buildNextActions(invoice, analysis, completeProfile);
  const snapshots = captureActionSnapshotsForInvoice({
    items: baseActions.map((action, index) => ({
      ...action,
      status: index === 0 ? 'completed' : index === 1 ? 'in_progress' : 'viewed',
    })),
    viewedActionIds: baseActions.map((action) => action.id),
  });

  assert.equal(snapshots.length, 2);
  assert.deepEqual(
    snapshots.map((snapshot) => snapshot.status),
    ['completed', 'in_progress']
  );
});

test('comparacao de faturas sem historico suficiente fica honesta', () => {
  const comparison = buildInvoiceComparison([invoice]);

  assert.equal(comparison.status, 'insufficient');
  assert.equal(comparison.previousInvoice, undefined);
  assert.equal(comparison.consumption, undefined);
  assert.ok(comparison.summary.includes('pelo menos duas faturas'));
});

test('guidance de proximo ciclo para historico insuficiente pede mais uma fatura', () => {
  const comparison = buildInvoiceComparison([invoice]);
  const guidance = buildNextCycleGuidance(comparison);

  assert.equal(guidance.title, 'Criar base de comparacao');
  assert.ok(guidance.suggestion.includes('mais uma fatura'));
});

test('comparacao identifica melhora observada entre duas faturas', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 310,
    totalValue: 390,
  });
  const comparison = buildInvoiceComparison([currentInvoice, invoice]);

  assert.equal(comparison.status, 'improved');
  assert.equal(comparison.consumption?.change, -50);
  assert.equal(comparison.totalValue?.change, -40);
  assert.equal(comparison.consumption?.trend, 'down');
  assert.equal(comparison.totalValue?.trend, 'down');
});

test('guidance de proximo ciclo para melhora sugere manter e confirmar', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 310,
    totalValue: 390,
  });
  const comparison = buildInvoiceComparison([currentInvoice, invoice]);
  const guidance = buildNextCycleGuidance(comparison);

  assert.equal(comparison.status, 'improved');
  assert.equal(guidance.title, 'Manter e confirmar');
  assert.ok(guidance.suggestion.includes('confirme'));
});

test('ligacao acao-resultado mostra acoes registradas antes da fatura comparada', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 310,
    totalValue: 390,
    actionSnapshots: [
      {
        id: 'choose-one-cost-cut',
        title: 'Testar um corte de custo por 7 dias',
        status: 'completed',
        value: 'Criar um teste comparavel',
      },
    ],
  });
  const comparison = buildInvoiceComparison([currentInvoice, invoice]);
  const link = buildActionResultLink(comparison);

  assert.equal(link.hasObservedComparison, true);
  assert.equal(link.actions.length, 1);
  assert.equal(link.actions[0].status, 'completed');
  assert.ok(link.message.includes('Antes desta fatura'));
  assert.ok(link.note.includes('nao prova'));
});

test('ligacao acao-resultado fica honesta quando nao ha acao testada', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 310,
    totalValue: 390,
  });
  const comparison = buildInvoiceComparison([currentInvoice, invoice]);
  const link = buildActionResultLink(comparison);

  assert.equal(link.hasObservedComparison, true);
  assert.equal(link.actions.length, 0);
  assert.equal(link.title, 'Sem acao testada registrada');
  assert.ok(link.message.includes('nao havia acao marcada'));
});

test('ligacao acao-resultado e conservadora para acao apenas em execucao', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 310,
    totalValue: 390,
    actionSnapshots: [
      {
        id: 'choose-one-cost-cut',
        title: 'Testar um corte de custo por 7 dias',
        status: 'in_progress',
      },
    ],
  });
  const comparison = buildInvoiceComparison([currentInvoice, invoice]);
  const link = buildActionResultLink(comparison);

  assert.equal(link.hasObservedComparison, true);
  assert.equal(link.actions[0].status, 'in_progress');
  assert.ok(link.message.includes('em execucao'));
  assert.ok(!link.note.includes('reduziu'));
});

test('comparacao usa competencia da fatura antes da ordem de envio', () => {
  const olderInvoiceUploadedLater = makeInvoice({
    fingerprint: 'invoice-2026-04-late-upload',
    month: 'abril de 2026',
    consumption: 360,
    totalValue: 430,
    uploadedAt: '2026-06-10T12:00:00.000Z',
  });
  const newerInvoiceUploadedEarlier = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 320,
    totalValue: 390,
    uploadedAt: '2026-05-10T12:00:00.000Z',
  });
  const comparison = buildInvoiceComparison([
    olderInvoiceUploadedLater,
    newerInvoiceUploadedEarlier,
  ]);

  assert.equal(comparison.basis, 'competence');
  assert.equal(comparison.currentInvoice?.fingerprint, newerInvoiceUploadedEarlier.fingerprint);
  assert.equal(comparison.previousInvoice?.fingerprint, olderInvoiceUploadedLater.fingerprint);
  assert.equal(comparison.status, 'improved');
});

test('comparacao usa data de envio quando competencia esta ambigua', () => {
  const previousInvoice = makeInvoice({
    fingerprint: 'invoice-ambiguous-previous',
    month: 'ciclo anterior',
    consumption: 360,
    totalValue: 430,
    uploadedAt: '2026-04-10T12:00:00.000Z',
  });
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-ambiguous-current',
    month: 'ciclo atual',
    consumption: 330,
    totalValue: 400,
    uploadedAt: '2026-05-10T12:00:00.000Z',
  });
  const comparison = buildInvoiceComparison([previousInvoice, currentInvoice]);

  assert.equal(comparison.basis, 'upload');
  assert.equal(comparison.currentInvoice?.fingerprint, currentInvoice.fingerprint);
  assert.equal(comparison.previousInvoice?.fingerprint, previousInvoice.fingerprint);
  assert.equal(comparison.status, 'improved');
});

test('comparacao identifica piora observada entre duas faturas', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 390,
    totalValue: 470,
  });
  const comparison = buildInvoiceComparison([currentInvoice, invoice]);

  assert.equal(comparison.status, 'worsened');
  assert.equal(comparison.consumption?.change, 30);
  assert.equal(comparison.totalValue?.change, 40);
  assert.equal(comparison.consumption?.trend, 'up');
  assert.equal(comparison.totalValue?.trend, 'up');
});

test('guidance de proximo ciclo para piora sugere acao mais focada', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 390,
    totalValue: 470,
  });
  const comparison = buildInvoiceComparison([currentInvoice, invoice]);
  const guidance = buildNextCycleGuidance(comparison);

  assert.equal(comparison.status, 'worsened');
  assert.equal(guidance.title, 'Ajustar o proximo teste');
  assert.ok(guidance.suggestion.includes('mais focada'));
});

test('comparacao identifica estabilidade quando variacao e pequena', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 364,
    totalValue: 434,
  });
  const comparison = buildInvoiceComparison([currentInvoice, invoice]);

  assert.equal(comparison.status, 'stable');
  assert.equal(comparison.consumption?.trend, 'stable');
  assert.equal(comparison.totalValue?.trend, 'stable');
});

test('guidance de proximo ciclo para estabilidade sugere observar mais um ciclo', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 364,
    totalValue: 434,
  });
  const comparison = buildInvoiceComparison([currentInvoice, invoice]);
  const guidance = buildNextCycleGuidance(comparison);

  assert.equal(comparison.status, 'stable');
  assert.equal(guidance.title, 'Observar mais um ciclo');
  assert.ok(guidance.suggestion.includes('antes de mudar'));
});

test('comparacao nao força conclusao quando consumo e custo divergem', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 320,
    totalValue: 470,
  });
  const comparison = buildInvoiceComparison([currentInvoice, invoice]);

  assert.equal(comparison.status, 'mixed');
  assert.equal(comparison.consumption?.trend, 'down');
  assert.equal(comparison.totalValue?.trend, 'up');
});

test('guidance de proximo ciclo para leitura mista foca no eixo de atencao', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 320,
    totalValue: 470,
  });
  const comparison = buildInvoiceComparison([currentInvoice, invoice]);
  const guidance = buildNextCycleGuidance(comparison);

  assert.equal(comparison.status, 'mixed');
  assert.equal(guidance.title, 'Focar em um eixo');
  assert.ok(guidance.suggestion.includes('custo'));
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
