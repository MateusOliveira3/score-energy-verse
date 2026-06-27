import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptyHouseIdentity,
  createEmptyHouseKnowledge,
  createEmptyHouseMemory,
  createEnergyHypothesis,
  createHouseModel,
  createRoomModel,
  prepareLearningEngineHandoff,
  type HouseModel,
  type InvestigationSession,
} from '@/lib/cognitive';

const NOW = '2026-06-16T12:00:00.000Z';

const makeHouse = (): HouseModel =>
  createHouseModel({
    id: 'house-learning',
    ownerId: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    identity: createEmptyHouseIdentity(),
    understanding: {
      overallLevel: 32,
      explainedBillShare: 20,
      confidence: 'medium',
      knownAreas: ['banho'],
      unknownAreas: ['peso da climatizacao'],
      lastMeaningfulDiscoveryAt: NOW,
    },
    rooms: [
      createRoomModel(
        {
          id: 'room-bathroom',
          type: 'bathroom',
          label: 'Banheiro',
          understandingLevel: 48,
          confidence: 'medium',
          evidence: [
            {
              id: 'evidence-bathroom-initial',
              source: 'user_answer',
              description: 'Banhos frequentes foram relatados.',
              confidence: 'low',
              createdAt: '2026-06-16T11:00:00.000Z',
              relatedRoomId: 'room-bathroom',
              relatedHypothesisId: 'hypothesis-bathroom',
            },
            {
              id: 'evidence-answer-strong',
              source: 'user_answer',
              description: 'Chuveiro eletrico confirmado.',
              confidence: 'medium',
              createdAt: NOW,
              relatedRoomId: 'room-bathroom',
              relatedHypothesisId: 'hypothesis-bathroom',
            },
          ],
        },
        'bathroom'
      ),
    ],
    activeHypotheses: [
      createEnergyHypothesis({
        id: 'hypothesis-bathroom',
        title: 'Impacto do banho no consumo',
        description: 'O banho segue como hipotese forte, mas ainda nao confirmada.',
        status: 'strengthened',
        relatedRooms: ['room-bathroom'],
        evidenceIds: ['evidence-bathroom-initial', 'evidence-answer-strong'],
        confidence: 'medium',
        potentialImpact: 'high',
      }),
    ],
    discardedHypotheses: [],
    confirmedHypotheses: [],
    memory: createEmptyHouseMemory(),
    knowledge: createEmptyHouseKnowledge(),
    nextInvestigation: {
      focus: 'comfort',
      reason: 'A curiosidade agora migra para climatizacao.',
    },
  });

const makeSession = (
  overrides: Partial<InvestigationSession> = {}
): InvestigationSession => ({
  id: 'investigation-session:bathroom:hypothesis-bathroom:2026-06-16T11:00:00.000Z',
  focus: 'bathroom',
  originReason: 'A maior lacuna ainda esta ligada ao banho.',
  originQuestionId: 'question-electric-shower',
  relatedRoomId: 'room-bathroom',
  relatedHypothesisId: 'hypothesis-bathroom',
  status: 'ready_for_learning',
  attemptCount: 2,
  repeatedAttemptCount: 0,
  evidenceIds: ['evidence-bathroom-initial', 'evidence-answer-strong'],
  askedQuestionIds: ['question-electric-shower'],
  openedAt: '2026-06-16T11:00:00.000Z',
  lastUpdatedAt: NOW,
  lastMeaningfulProgressAt: NOW,
  closedAt: NOW,
  closureReason: 'handoff_candidate',
  handoffCandidate: {
    reason: 'A trilha reuniu material suficiente para avaliacao futura.',
    evidenceIds: ['evidence-bathroom-initial', 'evidence-answer-strong'],
    generatedAt: NOW,
  },
  ...overrides,
});

test('prepareLearningEngineHandoff aceita trilha madura e gera entrada limpa para avaliacao', () => {
  const result = prepareLearningEngineHandoff({
    house: makeHouse(),
    session: makeSession(),
  });

  assert.equal(result.status, 'ready_for_evaluation');
  assert.ok(result.evaluationInput);
  assert.equal(result.evaluationInput?.evidence.length, 2);
  assert.equal(result.evaluationInput?.preliminaryConfidence, 'medium');
  assert.ok(
    result.evaluationInput?.limits.some((limit) => limit.includes('nao confirma conhecimento'))
  );
});

test('prepareLearningEngineHandoff rejeita handoff vazio quando a sessao nao produziu candidato explicito', () => {
  const result = prepareLearningEngineHandoff({
    house: makeHouse(),
    session: makeSession({ handoffCandidate: undefined }),
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.rejectionReason, 'no_handoff_candidate');
});

test('prepareLearningEngineHandoff rejeita handoff fragil quando a trilha tem evidencia insuficiente', () => {
  const house = makeHouse();
  house.rooms[0].evidence = [house.rooms[0].evidence[1]];
  house.activeHypotheses[0].evidenceIds = ['evidence-answer-strong'];

  const result = prepareLearningEngineHandoff({
    house,
    session: makeSession({
      evidenceIds: ['evidence-answer-strong'],
      handoffCandidate: {
        reason: 'Material ainda curto.',
        evidenceIds: ['evidence-answer-strong'],
        generatedAt: NOW,
      },
    }),
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.rejectionReason, 'insufficient_evidence');
});

test('prepareLearningEngineHandoff rejeita sessao saturada sem promover avaliacao indevida', () => {
  const result = prepareLearningEngineHandoff({
    house: makeHouse(),
    session: makeSession({
      status: 'saturated',
      closureReason: 'repeated_without_progress',
      handoffCandidate: {
        reason: 'Nao deveria chegar pronta para avaliacao.',
        evidenceIds: ['evidence-bathroom-initial', 'evidence-answer-strong'],
        generatedAt: NOW,
      },
    }),
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.rejectionReason, 'session_not_ready');
});

test('prepareLearningEngineHandoff rejeita trilha pronta sem confianca preliminar minima', () => {
  const house = makeHouse();
  house.activeHypotheses[0].confidence = 'unknown';
  house.rooms[0].confidence = 'unknown';
  house.understanding.confidence = 'unknown';

  const result = prepareLearningEngineHandoff({
    house,
    session: makeSession(),
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.rejectionReason, 'weak_preliminary_confidence');
});
