import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptyHouseIdentity,
  createEmptyHouseKnowledge,
  createEmptyHouseMemory,
  createEnergyHypothesis,
  createHouseModel,
  createRoomModel,
  runCuriosityEngine,
  type HouseModel,
} from '@/lib/cognitive';

const NOW = '2026-06-15T12:00:00.000Z';

const makeHouse = (overrides?: {
  monthsUsed?: number;
  comfortQuestion?: boolean;
  recentMystery?: boolean;
  tariffGap?: boolean;
}): HouseModel =>
  createHouseModel({
    id: 'house-curiosity',
    ownerId: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    identity: createEmptyHouseIdentity(),
    understanding: {
      overallLevel: 20,
      explainedBillShare: 10,
      confidence: 'low',
      knownAreas: [],
      unknownAreas: overrides?.tariffGap ? ['pressao de custo medio'] : ['impacto do banho'],
    },
    rooms: [
      createRoomModel(
        {
          id: 'room-bathroom',
          type: 'bathroom',
          label: 'Banheiro',
          understandingLevel: overrides?.recentMystery ? 44 : 24,
          confidence: 'low',
          mainMystery: overrides?.recentMystery
            ? 'Ainda faltam evidencias confiaveis sobre banheiro.'
            : undefined,
          evidence: [
            {
              id: 'evidence-bathroom',
              source: 'user_answer',
              description: 'Uso frequente de banho.',
              confidence: 'low',
              createdAt: NOW,
              relatedRoomId: 'room-bathroom',
            },
          ],
        },
        'bathroom'
      ),
      createRoomModel(
        {
          id: 'room-comfort',
          type: 'comfort',
          label: 'Conforto termico',
          understandingLevel: 18,
          confidence: 'low',
          mainMystery: 'Ainda faltam evidencias confiaveis sobre climatizacao.',
          evidence: overrides?.comfortQuestion
            ? [
                {
                  id: 'evidence-comfort',
                  source: 'user_answer',
                  description: 'Desconforto termico relatado.',
                  confidence: 'low',
                  createdAt: NOW,
                  relatedRoomId: 'room-comfort',
                },
              ]
            : [],
        },
        'comfort'
      ),
    ],
    energyBaseline: {
      status: (overrides?.monthsUsed ?? 1) >= 3 ? 'established' : 'building',
      monthsUsed: overrides?.monthsUsed ?? 1,
    },
    activeHypotheses: [
      createEnergyHypothesis({
        id: 'hypothesis-bathroom',
        title: 'Impacto do banho no consumo',
        description: 'Se o banho pode explicar parcela relevante do consumo.',
        status: 'investigating',
        relatedRooms: ['room-bathroom'],
        evidenceIds: ['evidence-bathroom'],
        confidence: 'low',
        potentialImpact: 'high',
        nextQuestion: {
          id: 'question-electric-shower',
          question: 'Existe chuveiro eletrico nesta residencia?',
          reason: 'Confirmar essa presenca ajuda a calibrar melhor o peso do banho.',
          expectedGain: 'high',
          relatedRoomId: 'room-bathroom',
          relatedHypothesisId: 'hypothesis-bathroom',
          answerType: 'yes_no',
          options: ['Sim', 'Nao', 'Nao sei'],
          shouldAskNow: true,
        },
      }),
      ...(overrides?.comfortQuestion
        ? [
            createEnergyHypothesis({
              id: 'hypothesis-comfort',
              title: 'Peso da climatizacao',
              description: 'Se climatizacao deve ganhar peso maior nas proximas leituras.',
              status: 'investigating',
              relatedRooms: ['room-comfort'],
              evidenceIds: ['evidence-comfort'],
              confidence: 'low',
              potentialImpact: 'medium',
              nextQuestion: {
                id: 'question-air-conditioning',
                question: 'Ha ar-condicionado em uso frequente nesta residencia?',
                reason: 'Isso ajuda a estimar melhor o peso da climatizacao no consumo.',
                expectedGain: 'medium',
                relatedRoomId: 'room-comfort',
                relatedHypothesisId: 'hypothesis-comfort',
                answerType: 'yes_no',
                options: ['Sim', 'Nao', 'Nao sei'],
                shouldAskNow: true,
              },
            }),
          ]
        : []),
    ],
    discardedHypotheses: [],
    confirmedHypotheses: [],
    memory: createEmptyHouseMemory(),
    knowledge: createEmptyHouseKnowledge(),
    nextInvestigation: {
      focus: 'unknown',
      reason: '',
    },
  });

test('runCuriosityEngine prioriza pergunta de alto ganho quando existe lacuna clara', () => {
  const result = runCuriosityEngine({
    house: makeHouse(),
  });

  assert.equal(result.nextInvestigation.focus, 'bathroom');
  assert.equal(result.nextInvestigation.suggestedQuestion?.id, 'question-electric-shower');
  assert.equal(result.dominantSignal?.kind, 'question_gap');
});

test('runCuriosityEngine migra para outra lacuna apos responder a pergunta anterior', () => {
  const result = runCuriosityEngine({
    house: makeHouse({ comfortQuestion: true }),
    recentAnswer: {
      id: 'answer-bathroom',
      questionId: 'question-electric-shower',
      value: 'sim',
      label: 'Sim',
      createdAt: '2026-06-15T13:00:00.000Z',
      source: 'user_answer',
    },
    recentStatus: 'hypothesis_strengthened',
    recentRoomId: 'room-bathroom',
    recentHypothesisId: 'hypothesis-bathroom',
  });

  assert.equal(result.nextInvestigation.focus, 'comfort');
  assert.equal(result.nextInvestigation.suggestedQuestion?.id, 'question-air-conditioning');
});

test('runCuriosityEngine permanece no ambiente quando a pista foi enfraquecida e ainda ha misterio', () => {
  const house = makeHouse({ monthsUsed: 3, recentMystery: true });
  house.activeHypotheses[0] = createEnergyHypothesis({
    ...house.activeHypotheses[0],
    nextQuestion: undefined,
  });

  const result = runCuriosityEngine({
    house,
    recentAnswer: {
      id: 'answer-bathroom-no',
      questionId: 'question-electric-shower',
      value: 'nao',
      label: 'Nao',
      createdAt: '2026-06-15T13:00:00.000Z',
      source: 'user_answer',
    },
    recentStatus: 'hypothesis_weakened',
    recentRoomId: 'room-bathroom',
    recentHypothesisId: 'hypothesis-bathroom',
  });

  assert.equal(result.nextInvestigation.focus, 'bathroom');
  assert.equal(result.dominantSignal?.kind, 'room_gap');
});

test('runCuriosityEngine usa baseline quando ainda nao existe historico suficiente', () => {
  const house = makeHouse({ monthsUsed: 2 });
  house.activeHypotheses = [];
  house.rooms = house.rooms.map((room) => ({
    ...room,
    understandingLevel: 80,
    mainMystery: undefined,
    evidence: [],
  }));

  const result = runCuriosityEngine({
    house,
  });

  assert.equal(result.nextInvestigation.focus, 'seasonality');
  assert.equal(result.dominantSignal?.kind, 'baseline_gap');
});

test('runCuriosityEngine cai para custo quando perguntas e baseline deixam de liderar', () => {
  const house = makeHouse({ monthsUsed: 4, tariffGap: true });
  house.activeHypotheses = [];
  house.rooms = house.rooms.map((room) => ({ ...room, understandingLevel: 80, mainMystery: undefined }));

  const result = runCuriosityEngine({
    house,
  });

  assert.equal(result.nextInvestigation.focus, 'tariff');
  assert.equal(result.dominantSignal?.kind, 'tariff_gap');
});
