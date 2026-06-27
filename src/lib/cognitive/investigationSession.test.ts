import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptyHouseIdentity,
  createEmptyHouseKnowledge,
  createEmptyHouseMemory,
  createHouseModel,
  createInvestigationSession,
  createRoomModel,
  type CuriosityEngineResult,
  type HouseModel,
  updateInvestigationSession,
} from '@/lib/cognitive';

const NOW = '2026-06-16T10:00:00.000Z';

const makeHouse = (overrides?: {
  overallLevel?: number;
  explainedBillShare?: number;
  bathroomUnderstandingLevel?: number;
  comfortUnderstandingLevel?: number;
}): HouseModel =>
  createHouseModel({
    id: 'house-session',
    ownerId: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    identity: createEmptyHouseIdentity(),
    understanding: {
      overallLevel: overrides?.overallLevel ?? 20,
      explainedBillShare: overrides?.explainedBillShare ?? 10,
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
              description: 'Banhos frequentes.',
              confidence: 'low',
              createdAt: NOW,
              relatedRoomId: 'room-bathroom',
              relatedHypothesisId: 'hypothesis-bathroom',
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
          understandingLevel: overrides?.comfortUnderstandingLevel ?? 18,
          confidence: 'low',
          mainMystery: 'Ainda faltam evidencias confiaveis sobre climatizacao.',
          evidence: [
            {
              id: 'evidence-comfort-initial',
              source: 'user_answer',
              description: 'Desconforto termico.',
              confidence: 'low',
              createdAt: NOW,
              relatedRoomId: 'room-comfort',
              relatedHypothesisId: 'hypothesis-comfort',
            },
          ],
        },
        'comfort'
      ),
    ],
    activeHypotheses: [],
    discardedHypotheses: [],
    confirmedHypotheses: [],
    memory: createEmptyHouseMemory(),
    knowledge: createEmptyHouseKnowledge(),
    nextInvestigation: {
      focus: 'bathroom',
      reason: 'A maior lacuna ainda esta ligada ao banho.',
      suggestedQuestion: {
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
      expectedDiscovery: 'Se o banho pode explicar parcela relevante do consumo.',
    },
  });

const makeCuriosity = (overrides?: {
  dominantFocus?: CuriosityEngineResult['nextInvestigation']['focus'];
  dominantRoomId?: string;
  dominantHypothesisId?: string;
  dominantQuestionId?: string;
  includeAlternative?: boolean;
}): CuriosityEngineResult => ({
  nextInvestigation: {
    focus: overrides?.dominantFocus ?? 'bathroom',
    reason: 'Ainda existe incerteza relevante em banheiro.',
    suggestedQuestion: overrides?.dominantQuestionId
      ? {
          id: overrides.dominantQuestionId,
          question: 'Pergunta de continuidade',
          reason: 'Ainda falta confirmar.',
          expectedGain: 'medium',
          relatedRoomId: overrides.dominantRoomId,
          relatedHypothesisId: overrides.dominantHypothesisId,
          answerType: 'yes_no',
          options: ['Sim', 'Nao', 'Nao sei'],
          shouldAskNow: true,
        }
      : undefined,
  },
  dominantSignal: {
    id: 'signal-dominant',
    kind: overrides?.dominantQuestionId ? 'question_gap' : 'room_gap',
    focus: overrides?.dominantFocus ?? 'bathroom',
    score: 40,
    reason: 'Sinal dominante.',
    relatedRoomId: overrides?.dominantRoomId ?? 'room-bathroom',
    relatedHypothesisId: overrides?.dominantHypothesisId ?? 'hypothesis-bathroom',
    suggestedQuestion: overrides?.dominantQuestionId
      ? {
          id: overrides.dominantQuestionId,
          question: 'Pergunta de continuidade',
          reason: 'Ainda falta confirmar.',
          expectedGain: 'medium',
          relatedRoomId: overrides.dominantRoomId,
          relatedHypothesisId: overrides.dominantHypothesisId,
          answerType: 'yes_no',
          options: ['Sim', 'Nao', 'Nao sei'],
          shouldAskNow: true,
        }
      : undefined,
  },
  signals: [
    {
      id: 'signal-dominant',
      kind: overrides?.dominantQuestionId ? 'question_gap' : 'room_gap',
      focus: overrides?.dominantFocus ?? 'bathroom',
      score: 40,
      reason: 'Sinal dominante.',
      relatedRoomId: overrides?.dominantRoomId ?? 'room-bathroom',
      relatedHypothesisId: overrides?.dominantHypothesisId ?? 'hypothesis-bathroom',
      suggestedQuestion: overrides?.dominantQuestionId
        ? {
            id: overrides.dominantQuestionId,
            question: 'Pergunta de continuidade',
            reason: 'Ainda falta confirmar.',
            expectedGain: 'medium',
            relatedRoomId: overrides.dominantRoomId,
            relatedHypothesisId: overrides.dominantHypothesisId,
            answerType: 'yes_no',
            options: ['Sim', 'Nao', 'Nao sei'],
            shouldAskNow: true,
          }
        : undefined,
    },
    ...(overrides?.includeAlternative
      ? [
          {
            id: 'signal-alternative',
            kind: 'question_gap' as const,
            focus: 'comfort' as const,
            score: 30,
            reason: 'Migrar para climatizacao.',
            relatedRoomId: 'room-comfort',
            relatedHypothesisId: 'hypothesis-comfort',
            suggestedQuestion: {
              id: 'question-air-conditioning',
              question: 'Ha ar-condicionado em uso frequente nesta residencia?',
              reason: 'Isso ajuda a estimar melhor o peso da climatizacao.',
              expectedGain: 'medium',
              relatedRoomId: 'room-comfort',
              relatedHypothesisId: 'hypothesis-comfort',
              answerType: 'yes_no',
              options: ['Sim', 'Nao', 'Nao sei'],
              shouldAskNow: true,
            },
          },
        ]
      : []),
  ],
});

test('createInvestigationSession abre trilha a partir da nextInvestigation atual', () => {
  const house = makeHouse();

  const session = createInvestigationSession({
    nextInvestigation: house.nextInvestigation,
    openedAt: NOW,
  });

  assert.equal(session.status, 'open');
  assert.equal(session.focus, 'bathroom');
  assert.equal(session.originQuestionId, 'question-electric-shower');
});

test('updateInvestigationSession marca trilha como em andamento quando ha progresso e o foco permanece', () => {
  const house = makeHouse();
  const session = createInvestigationSession({
    nextInvestigation: house.nextInvestigation,
    openedAt: NOW,
  });

  const result = updateInvestigationSession({
    session,
    previousHouse: house,
    updatedHouse: makeHouse({
      overallLevel: 28,
      explainedBillShare: 15,
      bathroomUnderstandingLevel: 38,
    }),
    answer: {
      id: 'answer-progress',
      questionId: 'question-electric-shower',
      value: 'sim',
      label: 'Sim',
      createdAt: '2026-06-16T11:00:00.000Z',
      source: 'user_answer',
    },
    newEvidenceId: 'evidence-answer-progress',
    runtimeStatus: 'new_context_added',
    curiosity: makeCuriosity(),
  });

  assert.equal(result.session.status, 'in_progress');
  assert.equal(result.shouldBlockContinuation, false);
  assert.equal(result.selectedNextInvestigation.focus, 'bathroom');
});

test('updateInvestigationSession satura a trilha quando nao ha ganho e a curiosidade insiste no mesmo foco', () => {
  const house = makeHouse();
  const session = createInvestigationSession({
    nextInvestigation: house.nextInvestigation,
    openedAt: NOW,
  });

  const result = updateInvestigationSession({
    session,
    previousHouse: house,
    updatedHouse: makeHouse(),
    answer: {
      id: 'answer-stalled',
      questionId: 'question-electric-shower',
      value: 'nao sei',
      label: 'Nao sei',
      createdAt: '2026-06-16T11:05:00.000Z',
      source: 'user_answer',
    },
    newEvidenceId: 'evidence-answer-stalled',
    runtimeStatus: 'needs_more_context',
    curiosity: makeCuriosity({ includeAlternative: true }),
  });

  assert.equal(result.session.status, 'saturated');
  assert.equal(result.session.closureReason, 'repeated_without_progress');
  assert.equal(result.shouldBlockContinuation, true);
  assert.equal(result.selectedNextInvestigation.focus, 'comfort');
});

test('updateInvestigationSession prepara handoff futuro quando a trilha entrega progresso suficiente e o foco muda', () => {
  const house = makeHouse();
  const session = createInvestigationSession({
    nextInvestigation: house.nextInvestigation,
    openedAt: NOW,
  });

  const result = updateInvestigationSession({
    session,
    previousHouse: house,
    updatedHouse: makeHouse({
      overallLevel: 30,
      explainedBillShare: 18,
      bathroomUnderstandingLevel: 40,
    }),
    answer: {
      id: 'answer-strong',
      questionId: 'question-electric-shower',
      value: 'sim',
      label: 'Sim',
      createdAt: '2026-06-16T11:10:00.000Z',
      source: 'user_answer',
    },
    newEvidenceId: 'evidence-answer-strong',
    runtimeStatus: 'hypothesis_strengthened',
    curiosity: makeCuriosity({
      dominantFocus: 'comfort',
      dominantRoomId: 'room-comfort',
      dominantHypothesisId: 'hypothesis-comfort',
      dominantQuestionId: 'question-air-conditioning',
      includeAlternative: true,
    }),
  });

  assert.equal(result.session.status, 'ready_for_learning');
  assert.equal(result.session.closureReason, 'handoff_candidate');
  assert.ok(result.session.handoffCandidate);
  assert.equal(result.selectedNextInvestigation.focus, 'comfort');
});

test('updateInvestigationSession encerra trilha quando a hipotese perde forca e outra assume a vez', () => {
  const house = makeHouse();
  const session = createInvestigationSession({
    nextInvestigation: house.nextInvestigation,
    openedAt: NOW,
  });

  const result = updateInvestigationSession({
    session,
    previousHouse: house,
    updatedHouse: makeHouse({
      overallLevel: 26,
      explainedBillShare: 14,
      bathroomUnderstandingLevel: 34,
    }),
    answer: {
      id: 'answer-weakened',
      questionId: 'question-electric-shower',
      value: 'nao',
      label: 'Nao',
      createdAt: '2026-06-16T11:15:00.000Z',
      source: 'user_answer',
    },
    newEvidenceId: 'evidence-answer-weakened',
    runtimeStatus: 'hypothesis_weakened',
    curiosity: makeCuriosity({
      dominantFocus: 'comfort',
      dominantRoomId: 'room-comfort',
      dominantHypothesisId: 'hypothesis-comfort',
      dominantQuestionId: 'question-air-conditioning',
      includeAlternative: true,
    }),
  });

  assert.equal(result.session.status, 'closed');
  assert.equal(result.session.closureReason, 'superseded');
  assert.equal(result.selectedNextInvestigation.focus, 'comfort');
});
