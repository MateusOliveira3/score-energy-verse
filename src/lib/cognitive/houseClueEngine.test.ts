import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEnergyHypothesis,
  createHouseModel,
  createRoomModel,
} from '@/lib/cognitive/defaults';
import { selectPrimaryHouseClue } from '@/lib/cognitive/houseClueEngine';

test('house sem dados retorna pista de descoberta inicial', () => {
  const house = createHouseModel({ ownerId: 'user-1' });

  const clue = selectPrimaryHouseClue(house);

  assert.equal(clue.kind, 'discovery');
  assert.equal(clue.confidence, 'low');
  assert.equal(clue.shouldAskQuestion, false);
  assert.match(clue.shortMessage, /conhecendo sua casa/i);
});

test('nextInvestigation com pergunta de alto ganho gera pista com shouldAskQuestion true', () => {
  const house = createHouseModel({
    ownerId: 'user-1',
    rooms: [
      createRoomModel(
        {
          id: 'room-bathroom',
          type: 'bathroom',
          label: 'Banheiro',
          confidence: 'medium',
          evidence: [{ id: 'ev-1', source: 'user_answer', description: 'Sinal de chuveiro', confidence: 'medium', createdAt: '2026-06-13T00:00:00.000Z' }],
        },
        'bathroom'
      ),
    ],
    activeHypotheses: [
      createEnergyHypothesis({
        id: 'hyp-bathroom',
        confidence: 'medium',
        status: 'investigating',
        evidenceIds: ['ev-1'],
        relatedRooms: ['room-bathroom'],
      }),
    ],
    nextInvestigation: {
      focus: 'bathroom',
      reason: 'Confirmar o chuveiro melhora bastante a leitura.',
      expectedDiscovery: 'Isso ajuda a medir melhor o peso do banho.',
      suggestedQuestion: {
        id: 'question-bathroom',
        question: 'Existe chuveiro eletrico nesta residencia?',
        reason: 'Essa confirmacao reduz bastante a incerteza atual.',
        expectedGain: 'high',
        answerType: 'yes_no',
        shouldAskNow: true,
        relatedRoomId: 'room-bathroom',
        relatedHypothesisId: 'hyp-bathroom',
        options: ['Sim', 'Nao', 'Nao sei'],
      },
    },
  });

  const clue = selectPrimaryHouseClue(house);

  assert.equal(clue.kind, 'question');
  assert.equal(clue.shouldAskQuestion, true);
  assert.equal(clue.relatedRoomId, 'room-bathroom');
  assert.equal(clue.relatedHypothesisId, 'hyp-bathroom');
  assert.equal(clue.question?.id, 'question-bathroom');
});

test('hipotese ativa gera pista relacionada a hipotese', () => {
  const house = createHouseModel({
    ownerId: 'user-1',
    activeHypotheses: [
      createEnergyHypothesis({
        id: 'hyp-comfort',
        title: 'Peso da climatizacao',
        description: 'Ha sinais de climatizacao que merecem atencao.',
        confidence: 'medium',
        status: 'strengthened',
        evidenceIds: ['ev-1', 'ev-2'],
        relatedRooms: ['room-comfort'],
      }),
    ],
    rooms: [
      createRoomModel(
        {
          id: 'room-comfort',
          type: 'comfort',
          label: 'Conforto termico',
          confidence: 'medium',
          evidence: [
            { id: 'ev-1', source: 'user_answer', description: 'Ha ar-condicionado', confidence: 'medium', createdAt: '2026-06-13T00:00:00.000Z' },
            { id: 'ev-2', source: 'derived_analysis', description: 'Clima pesa neste ciclo', confidence: 'low', createdAt: '2026-06-13T00:00:00.000Z' },
          ],
        },
        'comfort'
      ),
    ],
  });

  const clue = selectPrimaryHouseClue(house);

  assert.equal(clue.kind, 'hypothesis');
  assert.equal(clue.relatedHypothesisId, 'hyp-comfort');
  assert.equal(clue.relatedRoomId, 'room-comfort');
  assert.match(clue.explanation, /climatizacao/i);
});

test('comodo com mainMystery gera pista relacionada ao comodo', () => {
  const house = createHouseModel({
    ownerId: 'user-1',
    rooms: [
      createRoomModel(
        {
          id: 'room-kitchen',
          type: 'kitchen',
          label: 'Cozinha',
          confidence: 'unknown',
          understandingLevel: 5,
          mainMystery: 'Ainda nao entendi se a cozinha carrega equipamentos relevantes.',
          evidence: [],
        },
        'kitchen'
      ),
    ],
    energyBaseline: {
      status: 'established',
      monthsUsed: 4,
    },
  });

  const clue = selectPrimaryHouseClue(house);

  assert.equal(clue.kind, 'room_mystery');
  assert.equal(clue.relatedRoomId, 'room-kitchen');
  assert.match(clue.shortMessage, /cozinha/i);
});

test('baseline building gera pista de linha de base', () => {
  const house = createHouseModel({
    ownerId: 'user-1',
    energyBaseline: {
      status: 'building',
      monthsUsed: 2,
    },
  });

  const clue = selectPrimaryHouseClue(house);

  assert.equal(clue.kind, 'baseline');
  assert.match(clue.shortMessage, /conhecendo sua casa/i);
});

test('pista nunca deve conter confianca alta sem evidencia', () => {
  const house = createHouseModel({
    ownerId: 'user-1',
    activeHypotheses: [
      createEnergyHypothesis({
        id: 'hyp-no-evidence',
        title: 'Hipotese forte demais',
        description: 'Ha uma suspeita, mas sem evidencias registradas.',
        confidence: 'high',
        status: 'strengthened',
        evidenceIds: [],
      }),
    ],
    energyBaseline: {
      status: 'established',
      monthsUsed: 4,
    },
  });

  const clue = selectPrimaryHouseClue(house);

  assert.notEqual(clue.confidence, 'high');
});
