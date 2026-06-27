import assert from 'node:assert/strict';
import test from 'node:test';
import type { HouseClue } from '@/lib/cognitive/types';
import type { EnergyStory } from '@/lib/energy-map';
import { buildCoreSpeech } from '@/lib/cognitive/coreSpeechEngine';

const makeClue = (overrides: Partial<HouseClue> = {}): HouseClue => ({
  id: 'clue-1',
  kind: 'discovery',
  title: 'Ainda estou conhecendo sua casa.',
  shortMessage: 'Ainda estou conhecendo sua casa.',
  explanation: 'Ainda nao tenho pistas suficientes para apontar um foco principal.',
  confidence: 'low',
  evidenceIds: [],
  suggestedAction: {
    kind: 'wait_for_more_data',
    label: 'Esperar novas evidencias',
    reason: 'Sem evidencias reais, qualquer conclusao agora seria cedo demais.',
  },
  shouldAskQuestion: false,
  ...overrides,
});

const forbiddenTerms = [
  'analise concluida',
  'insight detectado',
  'modulo',
  'economia',
  'a causa foi identificada',
];

const collectSpeechText = (speech: ReturnType<typeof buildCoreSpeech>) =>
  [speech.opening, speech.clueLine, speech.optionalQuestionLine, speech.actionLabel, speech.evidenceLabel, speech.confidenceLabel]
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const makeEnergyStory = (overrides: Partial<EnergyStory> = {}): EnergyStory => ({
  explainedCoveragePercent: 24,
  explainedCoverageText: 'Ate agora consigo explicar uma parte inicial da sua conta. Ate agora isso representa algo proximo de 24% da fatura.',
  strongestFinding: 'A iluminacao parece representar a maior parcela conhecida da sua conta.',
  secondaryFindings: [],
  unknownAreas: ['climatizacao', 'lavanderia', 'cozinha'],
  nextInvestigation: 'Entender como funciona a climatizacao da residencia.',
  confidenceNarrative:
    'Minha compreensao ainda e parcial porque ainda preciso investigar climatizacao, lavanderia e cozinha.',
  coreNarrative:
    'Comecei a montar um mapa da sua residencia. Ate agora consigo explicar uma parte inicial da sua conta. A iluminacao parece representar a maior parcela conhecida da sua conta. Ainda preciso entender como funciona a climatizacao da residencia.',
  educationalInsight:
    'Consumos pequenos e recorrentes tambem ajudam a explicar a conta quando se repetem todos os dias.',
  ...overrides,
});

test('pista sem dados gera fala exploratoria', () => {
  const speech = buildCoreSpeech(makeClue());

  assert.equal(speech.tone, 'exploratory');
  assert.match(speech.opening, /Li sua conta deste ciclo\./i);
  assert.match(speech.opening, /Ainda preciso de alguns sinais|Ja encontrei os primeiros sinais/i);
  assert.match(speech.confidenceLabel, /nao tenho certeza|primeiras pistas/i);
});

test('pista com pergunta gera optionalQuestionLine', () => {
  const speech = buildCoreSpeech(
    makeClue({
      kind: 'question',
      confidence: 'medium',
      shouldAskQuestion: true,
      question: {
        id: 'question-1',
        question: 'Existe chuveiro eletrico nesta residencia?',
        reason: 'Isso ajuda a reduzir bastante a incerteza atual.',
        expectedGain: 'high',
        answerType: 'yes_no',
        shouldAskNow: true,
      },
    }),
    {
      currentInvoice: {
        month: '02/2026',
        consumption: 528,
        totalValue: 472.3,
      },
    }
  );

  assert.ok(speech.optionalQuestionLine);
  assert.match(speech.optionalQuestionLine ?? '', /chuveiro eletrico/i);
  assert.match(speech.opening, /Li sua conta de 02\/2026\./i);
  assert.match(speech.opening, /Ja encontrei um primeiro sinal/i);
  assert.match(speech.clueLine, /528 kWh/i);
  assert.match(speech.clueLine, /R\$ 472\.30/i);
});

test('quando existe Energy Story valida a fala principal nasce da narrativa pronta', () => {
  const speech = buildCoreSpeech(makeClue(), {
    energyStory: makeEnergyStory(),
    currentInvoice: {
      month: '04/2026',
    },
  });

  assert.equal(speech.source, 'energy_story');
  assert.match(speech.opening, /^Li sua conta de 04\/2026\./);
  assert.match(speech.opening, /saiu na frente|sinal mais claro/i);
  assert.match(speech.clueLine, /iluminacao parece representar a maior parcela conhecida/i);
  assert.match(speech.confidenceLabel, /compreensao ainda e parcial/i);
});

test('narrativa da Energy Story nao aparece duplicada', () => {
  const speech = buildCoreSpeech(makeClue(), {
    energyStory: makeEnergyStory(),
  });

  assert.equal(speech.clueLine.includes(speech.opening), false);
});

test('educationalInsight nao aparece repetidamente', () => {
  const speech = buildCoreSpeech(
    makeClue({
      kind: 'hypothesis',
      confidence: 'medium',
    }),
    {
      energyStory: makeEnergyStory(),
    }
  );
  const matches =
    speech.clueLine.match(/Consumos pequenos e recorrentes tambem ajudam a explicar a conta/gi) ?? [];

  assert.ok(matches.length <= 1);
});

test('pista com baixa confianca admite incerteza', () => {
  const speech = buildCoreSpeech(
    makeClue({
      kind: 'hypothesis',
      confidence: 'low',
    })
  );

  assert.match(speech.confidenceLabel, /nao tenho certeza/i);
});

test('abertura principal do speech fica em no maximo duas frases', () => {
  const speech = buildCoreSpeech(makeClue(), {
    currentInvoice: {
      month: '02/2026',
    },
  });

  const sentences = speech.opening
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);

  assert.ok(sentences.length <= 2);
});

test('fala nunca usa termos proibidos', () => {
  const speeches = [
    buildCoreSpeech(makeClue()),
    buildCoreSpeech(
      makeClue({
        kind: 'question',
        shouldAskQuestion: true,
        question: {
          id: 'question-1',
          question: 'Existe chuveiro eletrico nesta residencia?',
          reason: 'Confirmar isso ajuda bastante.',
          expectedGain: 'high',
          answerType: 'yes_no',
          shouldAskNow: true,
        },
      })
    ),
    buildCoreSpeech(
      makeClue({
        kind: 'room_mystery',
        shortMessage: 'A cozinha ainda e um misterio para mim.',
      })
    ),
  ];

  speeches.forEach((speech) => {
    const text = collectSpeechText(speech);
    forbiddenTerms.forEach((term) => {
      assert.equal(text.includes(term), false);
    });
  });
});

test('fala nunca promete economia', () => {
  const speech = buildCoreSpeech(
    makeClue({
      kind: 'baseline',
      confidence: 'medium',
    })
  );

  assert.equal(collectSpeechText(speech).includes('economia'), false);
});

test('evidenceLabel fica mais orientado a percepcao quando ha pista real', () => {
  const speech = buildCoreSpeech(
    makeClue({
      evidenceIds: ['evidence-1'],
      kind: 'question',
      shouldAskQuestion: true,
      question: {
        id: 'question-1',
        question: 'Existe chuveiro eletrico nesta residencia?',
        reason: 'Confirmar isso ajuda bastante.',
        expectedGain: 'high',
        answerType: 'yes_no',
        shouldAskNow: true,
      },
    })
  );

  assert.equal(speech.evidenceLabel, 'Ver o que ja percebi');
});

test('actionLabel deve ser curto', () => {
  const labels = [
    buildCoreSpeech(makeClue()).actionLabel,
    buildCoreSpeech(makeClue({ kind: 'question', shouldAskQuestion: true, question: {
      id: 'question-1',
      question: 'Existe chuveiro eletrico nesta residencia?',
      reason: 'Confirmar isso ajuda bastante.',
      expectedGain: 'high',
      answerType: 'yes_no',
      shouldAskNow: true,
    } })).actionLabel,
    buildCoreSpeech(makeClue({ kind: 'room_mystery' })).actionLabel,
  ];

  labels.forEach((label) => {
    assert.ok(['Ver', 'Continuar', 'Descobrir'].includes(label));
  });
});
