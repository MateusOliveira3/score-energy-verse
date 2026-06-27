import assert from 'node:assert/strict';
import test from 'node:test';
import {
  promoteKnowledgeCandidate,
  type LearningEngineEvaluationResult,
  type LearningEvaluationInput,
} from '@/lib/cognitive';

const NOW = '2026-06-16T15:00:00.000Z';

const makeEvaluationInput = (
  overrides: Partial<LearningEvaluationInput> = {}
): LearningEvaluationInput => ({
  sessionId: 'session-knowledge',
  focus: 'bathroom',
  originReason: 'A trilha de banho passou a explicar uma parcela relevante da conta.',
  originQuestionId: 'question-electric-shower',
  relatedRoomId: 'room-bathroom',
  relatedHypothesisId: 'hypothesis-bathroom',
  hypothesisStatus: 'confirmed',
  potentialImpact: 'high',
  closureReason: 'handoff_candidate',
  generatedAt: '2026-06-16T14:30:00.000Z',
  attemptCount: 2,
  repeatedAttemptCount: 0,
  evidenceIds: ['evidence-1', 'evidence-2', 'evidence-3'],
  evidence: [
    {
      id: 'evidence-1',
      source: 'invoice',
      description: 'A conta aponta concentracao relevante no banho.',
      confidence: 'high',
      createdAt: '2026-06-16T14:00:00.000Z',
      relatedRoomId: 'room-bathroom',
      relatedHypothesisId: 'hypothesis-bathroom',
    },
    {
      id: 'evidence-2',
      source: 'history',
      description: 'O historico reforca repeticao do mesmo padrao.',
      confidence: 'high',
      createdAt: '2026-06-16T14:10:00.000Z',
      relatedRoomId: 'room-bathroom',
      relatedHypothesisId: 'hypothesis-bathroom',
    },
    {
      id: 'evidence-3',
      source: 'user_answer',
      description: 'O usuario confirmou chuveiro eletrico em uso recorrente.',
      confidence: 'medium',
      createdAt: '2026-06-16T14:20:00.000Z',
      relatedRoomId: 'room-bathroom',
      relatedHypothesisId: 'hypothesis-bathroom',
    },
  ],
  preliminaryConfidence: 'high',
  evaluationMode: 'investigation_review',
  summary:
    'O banho eletrico, reforcado por historico e resposta do usuario, explica parte relevante do consumo desta residencia.',
  limits: [
    'Este material ainda nao confirma memoria automaticamente.',
    'O conhecimento candidato ainda precisa de futura consolidacao temporal.',
  ],
  ...overrides,
});

const makeEvaluation = (
  overrides: Partial<LearningEngineEvaluationResult> = {}
): LearningEngineEvaluationResult => ({
  status: 'accepted_as_knowledge_candidate',
  reason:
    'A trilha demonstrou qualidade suficiente para seguir como candidata a conhecimento, sem ainda virar conhecimento.',
  strengths: [
    'Ha evidencia convergente entre conta, historico e resposta do usuario.',
    'A hipotese ja possui poder explicativo suficiente.',
  ],
  concerns: ['O material ainda nao deve ser tratado como memoria consolidada.'],
  shouldPromoteToKnowledgeCandidate: true,
  ...overrides,
});

test('promoteKnowledgeCandidate promove avaliacao aceita para conhecimento candidato explicito', () => {
  const result = promoteKnowledgeCandidate({
    evaluation: makeEvaluation(),
    evaluationInput: makeEvaluationInput(),
    promotedAt: NOW,
  });

  assert.equal(result.status, 'promoted_to_candidate');
  assert.equal(result.candidateKnowledge?.status, 'candidate');
  assert.equal(result.candidateKnowledge?.memoryStatus, 'not_consolidated');
  assert.equal(result.candidateKnowledge?.promotedAt, NOW);
});

test('promoteKnowledgeCandidate rejeita avaliacao ainda insuficiente', () => {
  const result = promoteKnowledgeCandidate({
    evaluation: makeEvaluation({
      status: 'rejected_insufficient_evidence',
      shouldPromoteToKnowledgeCandidate: false,
    }),
    evaluationInput: makeEvaluationInput(),
    promotedAt: NOW,
  });

  assert.equal(result.status, 'not_promoted');
  assert.equal(result.rejectionReason, 'rejected_insufficient_evidence');
});

test('promoteKnowledgeCandidate rejeita hipotese mantida aberta', () => {
  const result = promoteKnowledgeCandidate({
    evaluation: makeEvaluation({
      status: 'kept_as_open_hypothesis',
      shouldPromoteToKnowledgeCandidate: false,
    }),
    evaluationInput: makeEvaluationInput(),
    promotedAt: NOW,
  });

  assert.equal(result.status, 'not_promoted');
  assert.equal(result.rejectionReason, 'kept_as_open_hypothesis');
});

test('promoteKnowledgeCandidate rejeita quando ainda falta investigacao', () => {
  const result = promoteKnowledgeCandidate({
    evaluation: makeEvaluation({
      status: 'needs_more_investigation',
      shouldPromoteToKnowledgeCandidate: false,
    }),
    evaluationInput: makeEvaluationInput(),
    promotedAt: NOW,
  });

  assert.equal(result.status, 'not_promoted');
  assert.equal(result.rejectionReason, 'needs_more_investigation');
});

test('promoteKnowledgeCandidate preserva rastreabilidade da origem', () => {
  const result = promoteKnowledgeCandidate({
    evaluation: makeEvaluation(),
    evaluationInput: makeEvaluationInput(),
    promotedAt: NOW,
  });

  assert.equal(
    result.candidateKnowledge?.traceability.investigationSessionId,
    'session-knowledge'
  );
  assert.equal(
    result.candidateKnowledge?.traceability.relatedHypothesisId,
    'hypothesis-bathroom'
  );
  assert.equal(
    result.candidateKnowledge?.traceability.evaluationGeneratedAt,
    '2026-06-16T14:30:00.000Z'
  );
});

test('promoteKnowledgeCandidate preserva limites explicitos da afirmacao', () => {
  const result = promoteKnowledgeCandidate({
    evaluation: makeEvaluation(),
    evaluationInput: makeEvaluationInput(),
    promotedAt: NOW,
  });

  assert.deepEqual(result.candidateKnowledge?.limits, makeEvaluationInput().limits);
});
