import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyInvestigationAnswer,
  createInvestigationSession,
  createEmptyHouseIdentity,
  createEmptyHouseKnowledge,
  createEmptyHouseMemory,
  createEnergyHypothesis,
  createHouseModel,
  createRoomModel,
  type HouseClue,
  type HouseModel,
  type InvestigationAnswer,
} from '@/lib/cognitive';

const NOW = '2026-06-15T12:00:00.000Z';

const makeHouse = (overrides?: {
  bathroomUnderstandingLevel?: number;
  withSecondQuestion?: boolean;
}): HouseModel => {
  const bathroomHypothesis = createEnergyHypothesis({
    id: 'hypothesis-bathroom-shower',
    title: 'Impacto do banho no consumo',
    description: 'O banho pode explicar parte relevante do consumo, mas ainda sem certeza.',
    status: 'investigating',
    relatedRooms: ['room-bathroom'],
    evidenceIds: ['evidence-bathroom-initial'],
    confidence: 'low',
    potentialImpact: 'high',
    nextQuestion: {
      id: 'question-electric-shower',
      question: 'Existe chuveiro eletrico nesta residencia?',
      reason: 'Isso ajuda a calibrar melhor o peso do banho.',
      expectedGain: 'high',
      relatedRoomId: 'room-bathroom',
      relatedHypothesisId: 'hypothesis-bathroom-shower',
      answerType: 'yes_no',
      options: ['Sim', 'Nao', 'Nao sei'],
      shouldAskNow: true,
    },
  });

  const hypotheses = overrides?.withSecondQuestion
    ? [
        bathroomHypothesis,
        createEnergyHypothesis({
          id: 'hypothesis-comfort-climatization',
          title: 'Peso da climatizacao',
          description: 'A climatizacao ainda precisa de uma confirmacao simples.',
          status: 'investigating',
          relatedRooms: ['room-comfort'],
          evidenceIds: ['evidence-comfort-initial'],
          confidence: 'low',
          potentialImpact: 'medium',
          nextQuestion: {
            id: 'question-air-conditioning',
            question: 'Ha ar-condicionado em uso frequente nesta residencia?',
            reason: 'Isso ajuda a priorizar a climatizacao.',
            expectedGain: 'medium',
            relatedRoomId: 'room-comfort',
            relatedHypothesisId: 'hypothesis-comfort-climatization',
            answerType: 'yes_no',
            options: ['Sim', 'Nao', 'Nao sei'],
            shouldAskNow: true,
          },
        }),
      ]
    : [bathroomHypothesis];

  return createHouseModel({
    id: 'house-1',
    ownerId: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    identity: createEmptyHouseIdentity(),
    understanding: {
      overallLevel: 22,
      explainedBillShare: 12,
      confidence: 'low',
      knownAreas: [],
      unknownAreas: ['impacto do banho', 'peso da climatizacao'],
    },
    rooms: [
      createRoomModel(
        {
          id: 'room-bathroom',
          type: 'bathroom',
          label: 'Banheiro',
          understandingLevel: overrides?.bathroomUnderstandingLevel ?? 24,
          confidence: 'low',
          mainMystery: 'Ainda faltam evidencias confiaveis sobre banheiro.',
          evidence: [
            {
              id: 'evidence-bathroom-initial',
              source: 'user_answer',
              description: 'Usuario relatou banhos frequentes.',
              relatedRoomId: 'room-bathroom',
              relatedHypothesisId: 'hypothesis-bathroom-shower',
              confidence: 'low',
              createdAt: NOW,
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
          understandingLevel: 12,
          confidence: 'low',
          mainMystery: 'Ainda faltam evidencias confiaveis sobre climatizacao.',
          evidence: [
            {
              id: 'evidence-comfort-initial',
              source: 'user_answer',
              description: 'Usuario relatou desconforto termico.',
              relatedRoomId: 'room-comfort',
              relatedHypothesisId: 'hypothesis-comfort-climatization',
              confidence: 'low',
              createdAt: NOW,
            },
          ],
        },
        'comfort'
      ),
    ],
    activeHypotheses: hypotheses,
    discardedHypotheses: [],
    confirmedHypotheses: [],
    memory: createEmptyHouseMemory(),
    knowledge: createEmptyHouseKnowledge(),
    nextInvestigation: {
      focus: 'bathroom',
      reason: 'A maior lacuna com potencial imediato ainda esta ligada ao banho.',
      suggestedQuestion: bathroomHypothesis.nextQuestion,
      expectedDiscovery: 'Se o banho pode explicar uma parcela relevante do consumo.',
    },
  });
};

const makeQuestionClue = (): HouseClue => ({
  id: 'clue-bathroom-question',
  kind: 'question',
  title: 'Achei uma pista no banheiro.',
  shortMessage: 'Achei uma pista no banheiro.',
  explanation: 'Confirmar essa presenca ajuda a calibrar o peso do banho.',
  confidence: 'low',
  relatedRoomId: 'room-bathroom',
  relatedHypothesisId: 'hypothesis-bathroom-shower',
  evidenceIds: ['evidence-bathroom-initial'],
  suggestedAction: {
    kind: 'ask_question',
    label: 'Confirmar esse detalhe',
    reason: 'Isso reduz a incerteza da leitura.',
  },
  shouldAskQuestion: true,
  question: {
    id: 'question-electric-shower',
    question: 'Existe chuveiro eletrico nesta residencia?',
    reason: 'Isso ajuda a calibrar melhor o peso do banho.',
    expectedGain: 'high',
    relatedRoomId: 'room-bathroom',
    relatedHypothesisId: 'hypothesis-bathroom-shower',
    answerType: 'yes_no',
    options: ['Sim', 'Nao', 'Nao sei'],
    shouldAskNow: true,
  },
});

const makeContextClue = (): HouseClue => ({
  id: 'clue-laundry-context',
  kind: 'room_mystery',
  title: 'A lavanderia ainda e um misterio para mim.',
  shortMessage: 'A lavanderia ainda e um misterio para mim.',
  explanation: 'Entender melhor essa parte da casa ajuda a reduzir uma lacuna real.',
  confidence: 'low',
  relatedRoomId: 'room-comfort',
  evidenceIds: ['evidence-comfort-initial'],
  suggestedAction: {
    kind: 'review_clue',
    label: 'Explorar esse ponto',
    reason: 'Ainda falta contexto local.',
  },
  shouldAskQuestion: false,
});

const makeAnswer = (label: string, value: InvestigationAnswer['value']): InvestigationAnswer => ({
  id: 'answer-1',
  questionId: 'question-electric-shower',
  value,
  label,
  createdAt: '2026-06-15T13:00:00.000Z',
  source: 'user_answer',
});

test('applyInvestigationAnswer aplica resposta sem mutar house original', () => {
  const house = makeHouse();
  const snapshot = structuredClone(house);

  applyInvestigationAnswer({
    house,
    clue: makeQuestionClue(),
    answer: makeAnswer('Sim', 'sim'),
  });

  assert.deepEqual(house, snapshot);
});

test('applyInvestigationAnswer toda resposta gera Evidence source user_answer', () => {
  const result = applyInvestigationAnswer({
    house: makeHouse(),
    clue: makeQuestionClue(),
    answer: makeAnswer('Sim', 'sim'),
  });

  assert.equal(result.newEvidence.source, 'user_answer');
  assert.equal(result.newEvidence.id, 'evidence-answer-answer-1');
});

test('applyInvestigationAnswer resposta positiva ligada a hipotese fortalece hipotese conservadoramente', () => {
  const result = applyInvestigationAnswer({
    house: makeHouse(),
    clue: makeQuestionClue(),
    answer: makeAnswer('Sim', 'sim'),
  });

  assert.equal(result.status, 'hypothesis_strengthened');
  assert.equal(result.affectedHypotheses[0]?.confidence, 'medium');
  assert.notEqual(result.affectedHypotheses[0]?.confidence, 'high');
});

test('applyInvestigationAnswer resposta negativa nao descarta hipotese automaticamente', () => {
  const result = applyInvestigationAnswer({
    house: makeHouse(),
    clue: makeQuestionClue(),
    answer: makeAnswer('Nao', 'nao'),
  });

  assert.equal(result.status, 'hypothesis_weakened');
  assert.equal(result.updatedHouse.discardedHypotheses.length, 0);
  assert.ok(
    result.updatedHouse.activeHypotheses.some((hypothesis) => hypothesis.id === 'hypothesis-bathroom-shower')
  );
  assert.notEqual(result.affectedHypotheses[0]?.status, 'discarded');
});

test('applyInvestigationAnswer resposta ligada a room aumenta entendimento do room sem passar de 100', () => {
  const result = applyInvestigationAnswer({
    house: makeHouse({ bathroomUnderstandingLevel: 95 }),
    clue: makeQuestionClue(),
    answer: makeAnswer('Sim', 'sim'),
  });

  const room = result.updatedHouse.rooms.find((item) => item.id === 'room-bathroom');

  assert.ok((room?.understandingLevel ?? 0) > 95);
  assert.ok((room?.understandingLevel ?? 0) <= 100);
});

test('applyInvestigationAnswer retorna nextInvestigation unico', () => {
  const result = applyInvestigationAnswer({
    house: makeHouse({ withSecondQuestion: true }),
    clue: makeQuestionClue(),
    answer: makeAnswer('Sim', 'sim'),
  });

  assert.equal(result.nextInvestigation.suggestedQuestion?.id, 'question-air-conditioning');
  assert.equal(result.nextInvestigation.focus, 'comfort');
});

test('applyInvestigationAnswer retorna resultSpeechHint curto', () => {
  const result = applyInvestigationAnswer({
    house: makeHouse(),
    clue: makeQuestionClue(),
    answer: makeAnswer('Sim', 'sim'),
  });

  assert.ok(result.resultSpeechHint.message.length <= 32);
  assert.ok((result.resultSpeechHint.nextLine?.length ?? 0) <= 48);
});

test('applyInvestigationAnswer nao confirma hipotese com uma unica resposta', () => {
  const result = applyInvestigationAnswer({
    house: makeHouse(),
    clue: makeQuestionClue(),
    answer: makeAnswer('Sim', 'sim'),
  });

  assert.equal(result.updatedHouse.confirmedHypotheses.length, 0);
  assert.ok(result.affectedHypotheses.every((hypothesis) => hypothesis.status !== 'confirmed'));
});

test('applyInvestigationAnswer input sem hipotese relacionada ainda registra contexto', () => {
  const result = applyInvestigationAnswer({
    house: makeHouse(),
    clue: makeContextClue(),
    answer: {
      id: 'answer-context',
      questionId: 'question-comfort-context',
      value: 'uso frequente',
      label: 'Uso frequente a noite',
      createdAt: '2026-06-15T13:10:00.000Z',
      source: 'user_answer',
    },
  });

  assert.equal(result.status, 'new_context_added');
  assert.equal(result.affectedHypotheses.length, 0);
  assert.ok(result.updatedHouse.memory.facts.some((fact) => fact.id === 'memory-fact-answer-answer-context'));
});

test('applyInvestigationAnswer e deterministica para o mesmo input', () => {
  const house = makeHouse({ withSecondQuestion: true });
  const clue = makeQuestionClue();
  const answer = makeAnswer('Sim', 'sim');

  const first = applyInvestigationAnswer({ house, clue, answer });
  const second = applyInvestigationAnswer({ house, clue, answer });

  assert.deepEqual(first, second);
});

test('applyInvestigationAnswer prepara handoff explicito quando a trilha amadurece para avaliacao', () => {
  const house = makeHouse({ withSecondQuestion: true });
  const clue = makeQuestionClue();
  const session = {
    ...createInvestigationSession({
      nextInvestigation: house.nextInvestigation,
      clue,
      openedAt: NOW,
    }),
    attemptCount: 1,
    evidenceIds: ['evidence-bathroom-history'],
  };

  const result = applyInvestigationAnswer({
    house,
    clue,
    session,
    answer: makeAnswer('Sim', 'sim'),
  });

  assert.equal(result.investigationSession.status, 'ready_for_learning');
  assert.equal(result.learningHandoff?.status, 'ready_for_evaluation');
  assert.equal(result.learningEvaluation?.status, 'needs_more_investigation');
  assert.equal(result.learningHandoff?.evaluationInput?.focus, 'bathroom');
  assert.equal(result.nextInvestigation.focus, 'comfort');
});

test('applyInvestigationAnswer promove conhecimento candidato quando a trilha ja chega forte o bastante', () => {
  const house = makeHouse({ withSecondQuestion: true });
  const clue = makeQuestionClue();
  const session = {
    ...createInvestigationSession({
      nextInvestigation: house.nextInvestigation,
      clue,
      openedAt: NOW,
    }),
    attemptCount: 1,
    evidenceIds: ['evidence-bathroom-history'],
  };

  house.activeHypotheses = house.activeHypotheses.map((hypothesis) =>
    hypothesis.id === 'hypothesis-bathroom-shower'
      ? {
          ...hypothesis,
          status: 'confirmed',
          confidence: 'high',
          evidenceIds: [
            'evidence-bathroom-initial',
            'evidence-bathroom-history',
            'evidence-bathroom-invoice',
          ],
        }
      : hypothesis
  );

  house.rooms = house.rooms.map((room) =>
    room.id === 'room-bathroom'
      ? {
          ...room,
          confidence: 'high',
          evidence: [
            ...room.evidence,
            {
              id: 'evidence-bathroom-history',
              source: 'history',
              description: 'O historico reforca repeticao do mesmo padrao de banho.',
              relatedRoomId: 'room-bathroom',
              relatedHypothesisId: 'hypothesis-bathroom-shower',
              confidence: 'high',
              createdAt: NOW,
            },
            {
              id: 'evidence-bathroom-invoice',
              source: 'invoice',
              description: 'A conta atual aponta concentracao relevante no banho.',
              relatedRoomId: 'room-bathroom',
              relatedHypothesisId: 'hypothesis-bathroom-shower',
              confidence: 'high',
              createdAt: NOW,
            },
          ],
        }
      : room
  );

  house.understanding = {
    ...house.understanding,
    confidence: 'high',
  };

  const result = applyInvestigationAnswer({
    house,
    clue,
    session,
    answer: makeAnswer('Sim', 'sim'),
  });

  assert.equal(result.learningEvaluation?.status, 'accepted_as_knowledge_candidate');
  assert.equal(result.knowledgePromotion?.status, 'promoted_to_candidate');
  assert.equal(result.knowledgePersistenceBoundary?.status, 'persistible');
  assert.equal(result.knowledgePromotion?.candidateKnowledge?.memoryStatus, 'not_consolidated');
  assert.equal(
    result.knowledgePersistenceBoundary?.persistibleKnowledgeCandidate?.temporalAuthority.level,
    'stable'
  );
  assert.equal(
    result.knowledgePromotion?.candidateKnowledge?.traceability.relatedHypothesisId,
    'hypothesis-bathroom-shower'
  );
});

test('applyInvestigationAnswer pode promover conhecimento candidato sem ainda tornalo persistivel', () => {
  const house = makeHouse({ withSecondQuestion: true });
  const clue = makeQuestionClue();
  const session = createInvestigationSession({
    nextInvestigation: house.nextInvestigation,
    clue,
    openedAt: NOW,
  });

  house.activeHypotheses = house.activeHypotheses.map((hypothesis) =>
    hypothesis.id === 'hypothesis-bathroom-shower'
      ? {
          ...hypothesis,
          status: 'confirmed',
          confidence: 'high',
          evidenceIds: [
            'evidence-bathroom-initial',
            'evidence-bathroom-invoice',
            'evidence-bathroom-derived',
          ],
        }
      : hypothesis
  );

  house.rooms = house.rooms.map((room) =>
    room.id === 'room-bathroom'
      ? {
          ...room,
          confidence: 'high',
          evidence: [
            {
              id: 'evidence-bathroom-invoice',
              source: 'invoice',
              description: 'A conta atual aponta concentracao relevante no banho.',
              relatedRoomId: 'room-bathroom',
              relatedHypothesisId: 'hypothesis-bathroom-shower',
              confidence: 'high',
              createdAt: NOW,
            },
            {
              id: 'evidence-bathroom-derived',
              source: 'derived_analysis',
              description: 'A analise derivada converge com o mesmo eixo explicativo.',
              relatedRoomId: 'room-bathroom',
              relatedHypothesisId: 'hypothesis-bathroom-shower',
              confidence: 'medium',
              createdAt: NOW,
            },
          ],
        }
      : room
  );

  house.understanding = {
    ...house.understanding,
    confidence: 'high',
  };

  const result = applyInvestigationAnswer({
    house,
    clue,
    session,
    answer: makeAnswer('Sim', 'sim'),
  });

  assert.equal(result.learningEvaluation?.status, 'accepted_as_knowledge_candidate');
  assert.equal(result.knowledgePromotion?.status, 'promoted_to_candidate');
  assert.equal(result.knowledgePersistenceBoundary?.status, 'not_persistible');
  assert.equal(result.knowledgePersistenceBoundary?.rejectionReason, 'insufficient_stability');
});

test('applyInvestigationAnswer usa InvestigationSession para evitar reabertura prematura da mesma trilha sem ganho', () => {
  const house = makeHouse();
  const clue = makeQuestionClue();
  const session = createInvestigationSession({
    nextInvestigation: house.nextInvestigation,
    clue,
    openedAt: NOW,
  });

  const result = applyInvestigationAnswer({
    house,
    clue,
    session,
    answer: makeAnswer('Nao sei', 'nao sei'),
  });

  assert.equal(result.investigationSession.status, 'saturated');
  assert.equal(result.nextInvestigation.focus, 'comfort');
  assert.equal(result.nextInvestigation.suggestedQuestion, undefined);
});
