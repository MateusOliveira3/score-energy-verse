import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  buildAnalysisSummary,
  buildBasicInvoiceSignals,
  buildConsultativeInsights,
  buildMascotGuidance,
  buildNextActions,
  getPreviousInvoice,
  getScoreEventPoints,
  getScoreState,
  interpretInvoiceFile,
} from '@/lib/mvpCoreFlow';
import { parseInvoiceFile, parseInvoiceText } from '@/lib/invoiceParser';
import {
  buildActionResultLink,
  buildInvoiceComparison,
  buildMascotContextQuestion,
  buildNextCycleGuidance,
  captureActionSnapshotsForInvoice,
  DEFAULT_MVP_STATE,
  getScoreExplanation,
  normalizeState,
  answerMascotContextQuestion,
  ignoreMascotContextQuestion,
  resolveFullJourneyState,
  updateActionStatus,
} from '@/lib/mvpJourneyState';
import {
  buildRankingEntryFromSnapshot,
  buildRankingSnapshotFromState,
} from '@/services/ranking/helpers';
import {
  AnalysisSummary,
  InvoiceData,
  InvoiceParserResult,
  MvpState,
  NextAction,
  UserProfileData,
} from '@/types/mvp';

const completeProfile: UserProfileData = {
  consumerType: 'Residencial',
  location: 'Sao Paulo',
  propertySize: 82,
  peopleCount: 3,
  energyPreference: 'Solar',
};

const makeParser = (text = ''): InvoiceParserResult => parseInvoiceText(text);

const makePdfFile = (streamContent: string, fileName = 'fixture-celesc.pdf') => {
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Length ${streamContent.length} >>
stream
${streamContent}
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`;

  return new File([pdfContent], fileName, { type: 'application/pdf' });
};

const makeProjectPdfFile = async (fixturePath: string, fileName: string) => {
  const bytes = await readFile(resolve(process.cwd(), fixturePath));
  return new File([bytes], fileName, { type: 'application/pdf' });
};

const withDecompressionStreamDisabled = async <T>(run: () => Promise<T>) => {
  const original = globalThis.DecompressionStream;

  try {
    globalThis.DecompressionStream = undefined as typeof globalThis.DecompressionStream;
    return await run();
  } finally {
    globalThis.DecompressionStream = original;
  }
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
  userContext: {
    ...DEFAULT_MVP_STATE.userContext,
    ...overrides.userContext,
    questions:
      overrides.userContext?.questions ?? DEFAULT_MVP_STATE.userContext.questions,
  },
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
  assert.equal(resolved.actions.items[0].title, 'Adicionar fatura ao historico');
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

test('resolveFullJourneyState recompõe summary quando latestInvoice existe e summary está ausente', () => {
  const resolved = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: undefined,
      },
    })
  );

  assert.ok(resolved.analysis.latestInvoice);
  assert.ok(resolved.analysis.summary);
  assert.equal(resolved.analysis.summary?.headline.includes(invoice.month), true);
  assert.equal(resolved.analysis.latestInvoice?.fingerprint, invoice.fingerprint);
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

test('nextActions ajusta microcopy com contexto leve do usuario', () => {
  const actions = buildNextActions(
    invoice,
    {
      ...analysis,
      consumptionLevel: 'alto',
    },
    completeProfile,
    {
    questions: {
      usage_period: {
        status: 'answered',
        value: 'night',
        label: 'Noite',
        updatedAt: '2026-04-23T12:00:00.000Z',
      },
      electric_shower: {
        status: 'answered',
        value: 'daily',
        label: 'Todos os dias',
        updatedAt: '2026-04-23T12:05:00.000Z',
      },
      primary_goal: {
        status: 'answered',
        value: 'reduce_cost',
        label: 'Reduzir custo',
        updatedAt: '2026-04-23T12:10:00.000Z',
      },
    },
    }
  );
  const peakUsageAction = actions.find((action) => action.id === 'map-peak-usage');
  const costCutAction = actions.find((action) => action.id === 'choose-one-cost-cut');

  assert.ok(peakUsageAction?.suggestion?.includes('chuveiro'));
  assert.equal(costCutAction?.value, 'Buscar impacto direto na fatura');
});

test('nextActions ajusta o retorno do proximo ciclo com foco do usuario', () => {
  const actions = buildNextActions(invoice, analysis, completeProfile, {
    questions: {
      primary_goal: {
        status: 'answered',
        value: 'reduce_cost',
        label: 'Reduzir custo',
        updatedAt: '2026-04-23T12:10:00.000Z',
      },
    },
  });
  const nextBillAction = actions.find((action) => action.id === 'return-next-bill');

  assert.ok(nextBillAction?.suggestion?.includes('custo responde'));
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

  assert.equal(guidance.title, 'Construir base de comparacao');
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

test('sinais basicos identificam consumo subindo', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05-up',
    month: 'maio de 2026',
    consumption: 390,
    totalValue: 430,
  });
  const signals = buildBasicInvoiceSignals(currentInvoice, invoice);

  assert.equal(signals.consumptionTrend, 'up');
});

test('sinais basicos identificam custo por kWh subindo', () => {
  const previousInvoice = makeInvoice({
    fingerprint: 'invoice-2026-04-cost-per-kwh',
    month: 'abril de 2026',
    consumption: 360,
    totalValue: 360,
  });
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05-cost-per-kwh',
    month: 'maio de 2026',
    consumption: 300,
    totalValue: 450,
  });
  const signals = buildBasicInvoiceSignals(currentInvoice, previousInvoice);

  assert.equal(signals.costPerKwhTrend, 'up');
});

test('getPreviousInvoice usa a competencia real e atravessa a virada de ano', () => {
  const novemberInvoice = makeInvoice({
    fingerprint: 'invoice-2025-11',
    month: '11/2025',
    consumption: 290,
    totalValue: 380,
  });
  const decemberInvoice = makeInvoice({
    fingerprint: 'invoice-2025-12',
    month: '12/2025',
    consumption: 300,
    totalValue: 430,
  });
  const januaryInvoice = makeInvoice({
    fingerprint: 'invoice-2026-01',
    month: '01/2026',
    consumption: 340,
    totalValue: 470,
  });

  const previousInvoice = getPreviousInvoice(januaryInvoice, [
    novemberInvoice,
    januaryInvoice,
    decemberInvoice,
  ]);

  assert.equal(previousInvoice?.fingerprint, decemberInvoice.fingerprint);
});

test('getPreviousInvoice encontra a fatura imediatamente anterior por competencia', () => {
  const novemberInvoice = makeInvoice({
    fingerprint: 'invoice-2025-11',
    month: '11/2025',
    consumption: 290,
    totalValue: 380,
  });
  const decemberInvoice = makeInvoice({
    fingerprint: 'invoice-2025-12',
    month: '12/2025',
    consumption: 300,
    totalValue: 430,
  });
  const januaryInvoice = makeInvoice({
    fingerprint: 'invoice-2026-01',
    month: '01/2026',
    consumption: 340,
    totalValue: 470,
  });

  const previousInvoice = getPreviousInvoice(decemberInvoice, [
    novemberInvoice,
    januaryInvoice,
    decemberInvoice,
  ]);

  assert.equal(previousInvoice?.fingerprint, novemberInvoice.fingerprint);
});

test('buildAnalysisSummary compara sinais com a competencia anterior em historico fora de ordem', () => {
  const novemberInvoice = makeInvoice({
    fingerprint: 'invoice-2025-11-analysis',
    month: '11/2025',
    consumption: 360,
    totalValue: 410,
  });
  const decemberInvoice = makeInvoice({
    fingerprint: 'invoice-2025-12-analysis',
    month: '12/2025',
    consumption: 300,
    totalValue: 430,
  });
  const januaryInvoice = makeInvoice({
    fingerprint: 'invoice-2026-01-analysis',
    month: '01/2026',
    consumption: 340,
    totalValue: 470,
  });

  const summary = buildAnalysisSummary(januaryInvoice, completeProfile, [
    novemberInvoice,
    januaryInvoice,
    decemberInvoice,
  ]) as AnalysisSummary & { consultativeInsights?: string[] };

  assert.equal(summary.consultativeInsights?.[0], 'Consumo subiu. Vale observar o proximo ciclo.');
  assert.equal(summary.consultativeInsights?.[1], 'Custo subiu. Vale observar o proximo ciclo.');
});

test('buildAnalysisSummary usa o historico explicito ao selecionar fatura antiga', () => {
  const novemberInvoice = makeInvoice({
    fingerprint: 'invoice-2025-11-selected',
    month: '11/2025',
    consumption: 360,
    totalValue: 390,
  });
  const decemberInvoice = makeInvoice({
    fingerprint: 'invoice-2025-12-selected',
    month: '12/2025',
    consumption: 300,
    totalValue: 430,
  });
  const januaryInvoice = makeInvoice({
    fingerprint: 'invoice-2026-01-selected',
    month: '01/2026',
    consumption: 340,
    totalValue: 470,
  });

  buildAnalysisSummary(januaryInvoice, completeProfile, [
    novemberInvoice,
    januaryInvoice,
    decemberInvoice,
  ]);

  const selectedSummary = buildAnalysisSummary(decemberInvoice, completeProfile, [
    novemberInvoice,
    januaryInvoice,
    decemberInvoice,
  ]) as AnalysisSummary & { consultativeInsights?: string[] };

  assert.equal(
    selectedSummary.consultativeInsights?.[0],
    'Consumo caiu, mas o custo subiu. Sinal de atencao.'
  );
  assert.equal(selectedSummary.consultativeInsights?.[1], 'Custo subiu. Vale observar o proximo ciclo.');
});

test('insights consultivos priorizam consumo caindo com custo subindo', () => {
  const insights = buildConsultativeInsights({
    consumptionTrend: 'down',
    costTrend: 'up',
    costPerKwhTrend: 'up',
  });

  assert.equal(insights.length, 3);
  assert.equal(insights[0], 'Consumo caiu, mas o custo subiu. Sinal de atencao.');
  assert.equal(insights[1], 'Custo subiu. Vale observar o proximo ciclo.');
  assert.equal(insights[2], 'Custo por kWh subiu. Sinal de atencao.');
});

test('insights consultivos retornam dados insuficientes quando faltam sinais validos', () => {
  const insights = buildConsultativeInsights();

  assert.deepEqual(insights, ['Dados insuficientes para comparacao segura.']);
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

test('comparacao ignora competencia invalida quando existem competencias validas', () => {
  const invalidInvoice = makeInvoice({
    fingerprint: 'invoice-invalid-competence',
    month: 'ciclo especial',
    consumption: 410,
    totalValue: 520,
    uploadedAt: '2026-06-10T12:00:00.000Z',
  });
  const decemberInvoice = makeInvoice({
    fingerprint: 'invoice-2025-12-valid',
    month: '12/2025',
    consumption: 300,
    totalValue: 430,
  });
  const januaryInvoice = makeInvoice({
    fingerprint: 'invoice-2026-01-valid',
    month: '01/2026',
    consumption: 340,
    totalValue: 470,
  });
  const comparison = buildInvoiceComparison([invalidInvoice, decemberInvoice, januaryInvoice]);

  assert.equal(comparison.basis, 'competence');
  assert.equal(comparison.currentInvoice?.fingerprint, januaryInvoice.fingerprint);
  assert.equal(comparison.previousInvoice?.fingerprint, decemberInvoice.fingerprint);
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

test('guidance de proximo ciclo ajusta microcopy com objetivo principal', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 390,
    totalValue: 470,
  });
  const comparison = buildInvoiceComparison([currentInvoice, invoice]);
  const guidance = buildNextCycleGuidance(comparison, {
    questions: {
      primary_goal: {
        status: 'answered',
        value: 'reduce_cost',
        label: 'Reduzir custo',
        updatedAt: '2026-04-23T12:00:00.000Z',
      },
    },
  });

  assert.equal(comparison.status, 'worsened');
  assert.ok(guidance.suggestion.includes('reduzir custo'));
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

test('mascote ajusta microcopy com objetivo principal do usuario', () => {
  const guidance = buildMascotGuidance({
    stage: 'analysis-ready',
    profile: completeProfile,
    invoice,
    analysis,
    userContext: {
      questions: {
        primary_goal: {
          status: 'answered',
          value: 'understand_consumption',
          label: 'Entender consumo',
          updatedAt: '2026-04-23T12:00:00.000Z',
        },
      },
    },
  });

  assert.ok(guidance.message.includes('entender melhor o consumo'));
});

test('mascote pergunta sobre periodo de consumo apos primeira analise', () => {
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
  const question = buildMascotContextQuestion(resolved);

  assert.equal(question?.id, 'usage_period');
  assert.equal(question?.question, 'Seu consumo costuma ser maior em qual periodo?');
});

test('resposta do mascote e salva e a pergunta respondida nao reaparece', () => {
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
  const answered = answerMascotContextQuestion(
    resolved,
    'usage_period',
    'night',
    '2026-04-23T12:00:00.000Z'
  );

  assert.equal(answered.userContext.questions.usage_period?.status, 'answered');
  assert.equal(answered.userContext.questions.usage_period?.value, 'night');
  assert.equal(buildMascotContextQuestion(answered), undefined);
});

test('mascote pergunta sobre chuveiro apos acoes aparecerem e serem iniciadas', () => {
  const baseActions = buildNextActions(invoice, analysis, completeProfile);
  const resolved = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      userContext: {
        questions: {
          usage_period: {
            status: 'answered',
            value: 'night',
            label: 'Noite',
            updatedAt: '2026-04-23T12:00:00.000Z',
          },
        },
      },
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
      actions: {
        items: baseActions.map((action, index) =>
          index === 0 ? { ...action, status: 'in_progress' } : action
        ),
        viewedActionIds: [baseActions[0].id],
      },
    })
  );
  const question = buildMascotContextQuestion(resolved);

  assert.equal(question?.id, 'electric_shower');
  assert.equal(question?.question, 'Voce usa chuveiro eletrico com frequencia?');
});

test('pergunta ignorada pelo mascote nao reaparece', () => {
  const baseActions = buildNextActions(invoice, analysis, completeProfile);
  const resolved = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      userContext: {
        questions: {
          usage_period: {
            status: 'answered',
            value: 'night',
            label: 'Noite',
            updatedAt: '2026-04-23T12:00:00.000Z',
          },
        },
      },
      analysis: {
        status: 'ready',
        latestInvoice: invoice,
        invoiceHistory: [invoice],
        summary: analysis,
      },
      actions: {
        items: baseActions.map((action, index) =>
          index === 0 ? { ...action, status: 'in_progress' } : action
        ),
        viewedActionIds: [baseActions[0].id],
      },
    })
  );
  const ignored = ignoreMascotContextQuestion(
    resolved,
    'electric_shower',
    '2026-04-23T12:05:00.000Z'
  );

  assert.equal(ignored.userContext.questions.electric_shower?.status, 'ignored');
  assert.equal(buildMascotContextQuestion(ignored), undefined);
});

test('mascote pergunta objetivo principal apos comparacao de fatura', () => {
  const currentInvoice = makeInvoice({
    fingerprint: 'invoice-2026-05',
    month: 'maio de 2026',
    consumption: 320,
    totalValue: 400,
  });
  const resolved = resolveFullJourneyState(
    makeState({
      profile: completeProfile,
      userContext: {
        questions: {
          usage_period: {
            status: 'answered',
            value: 'night',
            label: 'Noite',
            updatedAt: '2026-04-23T12:00:00.000Z',
          },
          electric_shower: {
            status: 'ignored',
            updatedAt: '2026-04-23T12:05:00.000Z',
          },
        },
      },
      analysis: {
        status: 'ready',
        latestInvoice: currentInvoice,
        invoiceHistory: [currentInvoice, invoice],
        summary: analysis,
      },
    })
  );
  const question = buildMascotContextQuestion(resolved);
  const answered = answerMascotContextQuestion(
    resolved,
    'primary_goal',
    'both',
    '2026-04-23T12:10:00.000Z'
  );

  assert.equal(question?.id, 'primary_goal');
  assert.equal(question?.question, 'Seu objetivo principal agora e?');
  assert.equal(answered.userContext.questions.primary_goal?.value, 'both');
  assert.equal(buildMascotContextQuestion(answered), undefined);
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
  assert.equal(explanation.nextGain?.title, 'Adicionar fatura ao histórico');
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

test('parser extrai referencia, vencimento, total, consumo e leituras com confianca', () => {
  const parsed = parseInvoiceText(`
    DISTRIBUIDORA: ENERGIA TESTE SA
    UNIDADE CONSUMIDORA: 123456789
    REFERENCIA: 04/2026
    DATA DE EMISSAO: 10/04/2026
    VENCIMENTO: 25/04/2026
    TOTAL A PAGAR: R$ 321,45
    CONSUMO FATURADO: 250 kWh
    DIAS FATURADOS: 30
    LEITURA ANTERIOR: 1000
    LEITURA ATUAL: 1250
    CONSTANTE: 1
    BANDEIRA TARIFARIA: VERDE
    TE: R$ 120,00
    TUSD: R$ 88,30
    CIP: R$ 19,40
    TOTAL DE TRIBUTOS: R$ 52,10
  `);

  assert.equal(parsed.fields.referenceMonth.value, '04/2026');
  assert.equal(parsed.fields.referenceMonth.confidence, 'high');
  assert.equal(parsed.fields.dueDate.value, '25/04/2026');
  assert.equal(parsed.fields.totalValue.value, 321.45);
  assert.equal(parsed.fields.totalValue.confidence, 'high');
  assert.equal(parsed.fields.consumptionKwh.value, 250);
  assert.equal(parsed.fields.consumptionKwh.confidence, 'high');
  assert.equal(parsed.fields.previousReading.value, 1000);
  assert.equal(parsed.fields.currentReading.value, 1250);
  assert.equal(parsed.fields.daysBilled.value, 30);
  assert.equal(parsed.fields.tariffFlag.value, 'VERDE');
});

test('parser extrai campos essenciais de PDF textual com layout fragmentado', async () => {
  const parsed = await parseInvoiceFile(
    makePdfFile(`
BT
[(CELESC ) 420 (DISTRIBUICAO S.A.)] TJ
(UNIDADE) Tj
(CONSUMIDORA) Tj
(1234567890) Tj
(REFERENCIA) Tj
(04/2026) Tj
(VENCIMENTO) Tj
(25/04/2026) Tj
[(TOTAL) 500 (A) 500 (PAGAR)] TJ
(R$ 321,45) Tj
(CONSUMO) Tj
(FATURADO) Tj
(250 KWH) Tj
[(LEITURA ) 300 (ANTERIOR)] TJ
[(LEITURA ) 300 (ATUAL)] TJ
(1000 1250) Tj
(DIAS FATURADOS) Tj
(30) Tj
(BANDEIRA TARIFARIA) Tj
[(VERMELHA ) 350 (PATAMAR 1)] TJ
ET
  `)
  );

  assert.equal(parsed.textSource, 'pdf-text');
  assert.equal(parsed.fields.providerName.value, 'CELESC DISTRIBUICAO S.A.');
  assert.equal(parsed.fields.consumerUnit.value, '1234567890');
  assert.equal(parsed.fields.referenceMonth.value, '04/2026');
  assert.equal(parsed.fields.dueDate.value, '25/04/2026');
  assert.equal(parsed.fields.totalValue.value, 321.45);
  assert.equal(parsed.fields.consumptionKwh.value, 250);
  assert.equal(parsed.fields.previousReading.value, 1000);
  assert.equal(parsed.fields.currentReading.value, 1250);
  assert.equal(parsed.fields.daysBilled.value, 30);
  assert.equal(parsed.fields.tariffFlag.value, 'VERMELHA PATAMAR 1');
});

test('parser extrai referencia, vencimento, total e consumo do PDF real da Celesc', async () => {
  const parsed = await parseInvoiceFile(
    await makeProjectPdfFile('test-fixtures-invoices/celesc-sample-01.pdf', 'celesc-sample-01.pdf')
  );

  assert.equal(parsed.textSource, 'pdf-text');
  assert.equal(parsed.fields.providerName.value, 'CELESC DISTRIBUICAO SA');
  assert.equal(parsed.fields.consumerUnit.value, '21062553');
  assert.equal(parsed.fields.referenceMonth.value, '02/2026');
  assert.equal(parsed.fields.dueDate.value, '28/02/2026');
  assert.equal(parsed.fields.totalValue.value, 472.3);
  assert.equal(parsed.fields.consumptionKwh.value, 528);
  assert.equal(parsed.fields.previousReading.value, 17219);
  assert.equal(parsed.fields.currentReading.value, 17747);
  assert.equal(parsed.fields.meterConstant.value, 1);
  assert.equal(parsed.fields.daysBilled.value, 29);
});

test('parser extrai campos essenciais do PDF real mesmo sem DecompressionStream nativo', async () => {
  const parsed = await withDecompressionStreamDisabled(async () =>
    parseInvoiceFile(
      await makeProjectPdfFile('test-fixtures-invoices/celesc-sample-01.pdf', 'celesc-sample-01.pdf')
    )
  );

  assert.equal(parsed.textSource, 'pdf-text');
  assert.equal(parsed.fields.referenceMonth.value, '02/2026');
  assert.equal(parsed.fields.dueDate.value, '28/02/2026');
  assert.equal(parsed.fields.totalValue.value, 472.3);
  assert.equal(parsed.fields.consumptionKwh.value, 528);
});

test('parseInvoiceFile aceita File-like com arrayBuffer no mesmo formato do upload do navegador', async () => {
  const browserFile = await makeProjectPdfFile(
    'test-fixtures-invoices/celesc-sample-01.pdf',
    'celesc-sample-01.pdf'
  );
  const fileLike = {
    name: browserFile.name,
    type: browserFile.type,
    size: browserFile.size,
    arrayBuffer: () => browserFile.arrayBuffer(),
  };
  const parsed = await parseInvoiceFile(fileLike);

  assert.equal(parsed.textSource, 'pdf-text');
  assert.equal(parsed.fields.referenceMonth.value, '02/2026');
  assert.equal(parsed.fields.dueDate.value, '28/02/2026');
  assert.equal(parsed.fields.totalValue.value, 472.3);
  assert.equal(parsed.fields.consumptionKwh.value, 528);
});

test('interpretInvoiceFile preserva campos essenciais do PDF real no InvoiceData usado pela jornada', async () => {
  const interpreted = await interpretInvoiceFile(
    await makeProjectPdfFile('test-fixtures-invoices/celesc-sample-01.pdf', 'celesc-sample-01.pdf'),
    completeProfile
  );

  assert.equal(interpreted.month, '02/2026');
  assert.equal(interpreted.totalValue, 472.3);
  assert.equal(interpreted.consumption, 528);
  assert.equal(interpreted.parser.fields.dueDate.value, '28/02/2026');
  assert.equal(interpreted.parser.fields.previousReading.value, 17219);
  assert.equal(interpreted.parser.fields.currentReading.value, 17747);
});

test('normalizeState reidrata campos do InvoiceData a partir do parser quando o estado persistido chega parcial', async () => {
  const parser = await parseInvoiceFile(
    await makeProjectPdfFile('test-fixtures-invoices/celesc-sample-01.pdf', 'celesc-sample-01.pdf')
  );
  const persistedInvoice = {
    fingerprint: 'celesc-sample-01',
    fileName: 'celesc-sample-01.pdf',
    fileType: 'application/pdf',
    fileSize: 1,
    parser,
    uploadedAt: '2026-04-23T18:00:00.000Z',
  };
  const resolved = normalizeState(
    makeState({
      profile: completeProfile,
      analysis: {
        status: 'ready',
        latestInvoice: persistedInvoice as InvoiceData,
        invoiceHistory: [persistedInvoice as InvoiceData],
      },
    })
  );

  assert.equal(resolved.analysis.latestInvoice?.month, '02/2026');
  assert.equal(resolved.analysis.latestInvoice?.totalValue, 472.3);
  assert.equal(resolved.analysis.latestInvoice?.consumption, 528);
  assert.equal(resolved.analysis.latestInvoice?.parser.fields.dueDate.value, '28/02/2026');
  assert.equal(resolved.analysis.invoiceHistory[0]?.month, '02/2026');
  assert.equal(resolved.analysis.invoiceHistory[0]?.totalValue, 472.3);
  assert.equal(resolved.analysis.invoiceHistory[0]?.consumption, 528);
});

test('roundtrip de persistencia preserva os campos canonicos que a UI consome', async () => {
  const interpreted = await interpretInvoiceFile(
    await makeProjectPdfFile('test-fixtures-invoices/celesc-sample-01.pdf', 'celesc-sample-01.pdf'),
    completeProfile
  );
  const persistedState = JSON.parse(
    JSON.stringify(
      makeState({
        profile: completeProfile,
        analysis: {
          status: 'ready',
          latestInvoice: interpreted,
          invoiceHistory: [interpreted],
          summary: buildAnalysisSummary(interpreted, completeProfile),
        },
      })
    )
  );
  const resolved = normalizeState(persistedState);

  assert.equal(resolved.analysis.latestInvoice?.month, '02/2026');
  assert.equal(resolved.analysis.latestInvoice?.consumption, 528);
  assert.equal(resolved.analysis.latestInvoice?.totalValue, 472.3);
  assert.equal(resolved.analysis.latestInvoice?.parser.fields.dueDate.value, '28/02/2026');
  assert.equal(resolved.analysis.invoiceHistory[0]?.month, '02/2026');
  assert.equal(resolved.analysis.invoiceHistory[0]?.consumption, 528);
  assert.equal(resolved.analysis.invoiceHistory[0]?.totalValue, 472.3);
});

test('parser preserva ausencia segura quando campo nao existe', () => {
  const parsed = parseInvoiceText(`
    DISTRIBUIDORA: ENERGIA TESTE SA
    REFERENCIA: 04/2026
  `);

  assert.equal(parsed.fields.referenceMonth.value, '04/2026');
  assert.equal(parsed.fields.totalValue.value, undefined);
  assert.equal(parsed.fields.totalValue.confidence, 'missing');
  assert.equal(parsed.fields.consumptionKwh.value, undefined);
  assert.equal(parsed.fields.consumptionKwh.confidence, 'missing');
});
