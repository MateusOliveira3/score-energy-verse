import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCoreExperienceFromJourney } from '@/lib/cognitive/coreExperienceComposer';

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

test('input vazio gera CoreExperience no_data ou building_baseline', () => {
  const experience = buildCoreExperienceFromJourney({
    userId: 'user-1',
  });

  assert.ok(['no_data', 'building_baseline'].includes(experience.status));
  assert.ok(experience.house);
  assert.ok(experience.primaryClue);
  assert.ok(experience.speech);
});

test('input com fatura gera house + clue + speech', () => {
  const experience = buildCoreExperienceFromJourney({
    userId: 'user-1',
    currentInvoice: makeInvoice('invoice-1', 'abril de 2026', '2026-04-22T12:00:00.000Z'),
  });

  assert.ok(experience.house.id.startsWith('house-'));
  assert.ok(experience.primaryClue.id.length > 0);
  assert.ok(experience.speech.id.length > 0);
});

test('pista com pergunta gera status question_ready e primaryAction apropriada', () => {
  const experience = buildCoreExperienceFromJourney({
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

  assert.equal(experience.status, 'question_ready');
  assert.equal(experience.primaryClue.shouldAskQuestion, true);
  assert.equal(experience.primaryAction.label, 'Responder');
  assert.equal(experience.speech.source, 'energy_story');
  assert.match(experience.speech.opening, /^Li sua conta de abril de 2026\./i);
  assert.match(experience.speech.opening, /saiu na frente|sinal mais claro/i);
  assert.match(experience.speech.clueLine, /maior parcela conhecida|primeiros sinais|peso/i);
});

test('quando a Energy Story existe a Core usa sua narrativa como voz principal', () => {
  const experience = buildCoreExperienceFromJourney({
    userId: 'user-1',
    profile: {
      peopleCount: 3,
      propertySize: 82,
    },
    currentInvoice: makeInvoice('invoice-1', 'abril de 2026', '2026-04-22T12:00:00.000Z'),
    energyBehaviorProfile: {
      habits: {
        roomCountRange: '4_6',
      },
      intentions: {
        thermalComfortInterest: 'sim',
      },
    },
  });

  assert.equal(experience.speech.source, 'energy_story');
  assert.match(experience.speech.opening, /^Li sua conta de abril de 2026\./i);
  assert.match(experience.speech.opening, /saiu na frente|sinal mais claro/i);
  assert.match(experience.speech.clueLine, /maior parcela conhecida|primeiros sinais|peso/i);
  assert.match(experience.primaryAction.reason, /climatizacao/i);
  assert.equal(experience.debug?.pipeline.includes('energy_story'), true);
});

test('sem Energy Story o fallback atual continua funcionando', () => {
  const experience = buildCoreExperienceFromJourney({
    userId: 'user-1',
  });

  assert.equal(experience.speech.source, 'house_clue');
  assert.match(experience.speech.opening, /Li sua conta deste ciclo\./i);
  assert.match(experience.speech.opening, /Ainda preciso de alguns sinais|Ja encontrei um primeiro sinal|misterio/i);
});

test('pista sem pergunta gera status clue_ready', () => {
  const experience = buildCoreExperienceFromJourney({
    userId: 'user-1',
    currentInvoice: makeInvoice('invoice-1', 'abril de 2026', '2026-04-22T12:00:00.000Z'),
    energyBehaviorProfile: {
      appliances: {
        hasAirConditioning: true,
      },
    },
  });

  assert.equal(experience.primaryClue.shouldAskQuestion, false);
  assert.equal(experience.status, 'clue_ready');
});

test('composer nunca retorna mais de uma pista principal', () => {
  const experience = buildCoreExperienceFromJourney({
    userId: 'user-1',
    currentInvoice: makeInvoice('invoice-1', 'abril de 2026', '2026-04-22T12:00:00.000Z'),
  });

  assert.equal(Array.isArray(experience.primaryClue), false);
  assert.equal(Array.isArray(experience.speech), false);
});

test('composer nao altera input original', () => {
  const input = {
    userId: 'user-1',
    currentInvoice: makeInvoice('invoice-1', 'abril de 2026', '2026-04-22T12:00:00.000Z'),
    strategicAnswers: {
      usage_period: {
        status: 'answered' as const,
        value: 'night' as const,
        label: 'Noite',
        updatedAt: '2026-04-22T12:00:00.000Z',
      },
    },
  };
  const before = JSON.parse(JSON.stringify(input));

  buildCoreExperienceFromJourney(input);

  assert.deepEqual(input, before);
});

test('composer preserva confianca conservadora', () => {
  const experience = buildCoreExperienceFromJourney({
    userId: 'user-1',
  });

  assert.notEqual(experience.primaryClue.confidence, 'high');
  assert.match(experience.speech.confidenceLabel, /nao tenho certeza|primeiras pistas/i);
});
