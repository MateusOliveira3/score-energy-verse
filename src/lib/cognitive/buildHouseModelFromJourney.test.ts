import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHouseModelFromJourney } from '@/lib/cognitive/buildHouseModelFromJourney';

const makeParser = () => ({
  rawTextAvailable: true,
  textSource: 'plain-text' as const,
  normalizedText: 'FATURA TESTE',
  fields: {
    providerName: { confidence: 'missing' as const },
    consumerUnit: { confidence: 'missing' as const },
    referenceMonth: { confidence: 'medium' as const, value: '04/2026' },
    issueDate: { confidence: 'missing' as const },
    dueDate: { confidence: 'missing' as const },
    totalValue: { confidence: 'medium' as const, value: 420 },
    consumptionKwh: { confidence: 'medium' as const, value: 320 },
    daysBilled: { confidence: 'missing' as const },
    previousReading: { confidence: 'missing' as const },
    currentReading: { confidence: 'missing' as const },
    meterConstant: { confidence: 'missing' as const },
    tariffFlag: { confidence: 'missing' as const },
    teValue: { confidence: 'missing' as const },
    tusdValue: { confidence: 'missing' as const },
    publicLightingFee: { confidence: 'missing' as const },
    taxesTotal: { confidence: 'missing' as const },
  },
});

const makeInvoice = (fingerprint: string, month: string, uploadedAt: string) => ({
  fingerprint,
  month,
  fileName: `${fingerprint}.pdf`,
  fileType: 'application/pdf',
  fileSize: 1024,
  consumption: 320,
  totalValue: 420,
  parser: makeParser(),
  uploadedAt,
});

test('buildHouseModelFromJourney sem fatura cria baseline not_started e baixa confianca', () => {
  const model = buildHouseModelFromJourney({
    userId: 'user-1',
  });

  assert.equal(model.energyBaseline.status, 'not_started');
  assert.equal(model.understanding.confidence, 'low');
  assert.equal(model.understanding.explainedBillShare, 0);
});

test('buildHouseModelFromJourney com fatura cria evidencia invoice', () => {
  const model = buildHouseModelFromJourney({
    userId: 'user-1',
    currentInvoice: makeInvoice('invoice-1', 'abril de 2026', '2026-04-22T12:00:00.000Z'),
  });

  assert.ok(model.understanding.knownAreas.includes('fatura atual'));
  assert.ok(
    model.activeHypotheses.some((hypothesis) =>
      hypothesis.evidenceIds.includes('evidence-invoice-current')
    )
  );
});

test('buildHouseModelFromJourney com resposta de chuveiro cria evidencia user_answer e melhora bathroom', () => {
  const model = buildHouseModelFromJourney({
    userId: 'user-1',
    strategicAnswers: {
      electric_shower: {
        status: 'answered',
        value: 'daily',
        label: 'Todos os dias',
        updatedAt: '2026-04-22T12:00:00.000Z',
      },
    },
  });

  const bathroom = model.rooms.find((room) => room.type === 'bathroom');

  assert.ok(
    bathroom?.evidence.some((item) => item.source === 'user_answer' && item.id === 'evidence-answer-electric-shower')
  );
  assert.ok((bathroom?.understandingLevel ?? 0) > 0);
  assert.equal(bathroom?.confidence, 'low');
});

test('buildHouseModelFromJourney com historico cria baseline building', () => {
  const model = buildHouseModelFromJourney({
    userId: 'user-1',
    invoiceHistory: [
      makeInvoice('invoice-1', 'marco de 2026', '2026-03-22T12:00:00.000Z'),
      makeInvoice('invoice-2', 'abril de 2026', '2026-04-22T12:00:00.000Z'),
    ],
  });

  assert.equal(model.energyBaseline.status, 'building');
  assert.equal(model.energyBaseline.monthsUsed, 2);
});

test('buildHouseModelFromJourney incorpora sinais estruturais da residencia ao identity e entendimento', () => {
  const model = buildHouseModelFromJourney({
    userId: 'user-1',
    energyBehaviorProfile: {
      appliances: {
        bathrooms: 2,
        showers: 2,
        showerHeatingType: 'eletrico',
      },
      habits: {
        residenceType: 'casa',
        roomCountRange: '4_6',
        hasChildren: true,
      },
    },
  });

  assert.equal(model.identity.residenceType, 'casa');
  assert.ok(model.understanding.knownAreas.includes('estrutura da residencia'));
  assert.ok(model.rooms.find((room) => room.type === 'bathroom')?.evidence.length);
});

test('buildHouseModelFromJourney nunca confirma hipotese sem evidencia forte', () => {
  const model = buildHouseModelFromJourney({
    userId: 'user-1',
    currentInvoice: makeInvoice('invoice-1', 'abril de 2026', '2026-04-22T12:00:00.000Z'),
    strategicAnswers: {
      electric_shower: {
        status: 'answered',
        value: 'daily',
        label: 'Todos os dias',
        updatedAt: '2026-04-22T12:00:00.000Z',
      },
    },
  });

  assert.equal(model.confirmedHypotheses.length, 0);
  assert.ok(model.activeHypotheses.every((hypothesis) => hypothesis.status !== 'confirmed'));
});
