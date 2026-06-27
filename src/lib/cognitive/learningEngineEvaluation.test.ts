import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateLearningCandidate,
  type LearningEvaluationInput,
} from '@/lib/cognitive';

const NOW = '2026-06-16T12:30:00.000Z';

const makeInput = (
  overrides: Partial<LearningEvaluationInput> = {}
): LearningEvaluationInput => ({
  sessionId: 'session-1',
  focus: 'bathroom',
  originReason: 'A maior lacuna ainda esta ligada ao banho.',
  originQuestionId: 'question-electric-shower',
  relatedRoomId: 'room-bathroom',
  relatedHypothesisId: 'hypothesis-bathroom',
  hypothesisStatus: 'strengthened',
  potentialImpact: 'high',
  closureReason: 'handoff_candidate',
  generatedAt: NOW,
  attemptCount: 2,
  repeatedAttemptCount: 0,
  evidenceIds: ['evidence-1', 'evidence-2'],
  evidence: [
    {
      id: 'evidence-1',
      source: 'invoice',
      description: 'A conta indica concentracao relevante no banho.',
      confidence: 'medium',
      createdAt: '2026-06-16T11:00:00.000Z',
      relatedRoomId: 'room-bathroom',
      relatedHypothesisId: 'hypothesis-bathroom',
    },
    {
      id: 'evidence-2',
      source: 'user_answer',
      description: 'O usuario confirmou chuveiro eletrico em uso recorrente.',
      confidence: 'high',
      createdAt: NOW,
      relatedRoomId: 'room-bathroom',
      relatedHypothesisId: 'hypothesis-bathroom',
    },
  ],
  preliminaryConfidence: 'medium',
  evaluationMode: 'investigation_review',
  summary:
    'A trilha sugere que o banho explica parte relevante do consumo e possui base razoavel para avaliacao.',
  limits: [
    'Este material ainda nao confirma conhecimento automaticamente.',
    'A hipotese associada ainda nao pode ser tratada como conhecimento confirmado.',
  ],
  ...overrides,
});

test('evaluateLearningCandidate aceita como candidato quando a trilha demonstra forca cognitiva suficiente', () => {
  const result = evaluateLearningCandidate(
    makeInput({
      hypothesisStatus: 'confirmed',
      preliminaryConfidence: 'high',
      evidenceIds: ['evidence-1', 'evidence-2', 'evidence-3'],
      evidence: [
        ...makeInput().evidence,
        {
          id: 'evidence-3',
          source: 'history',
          description: 'O historico reforca repeticao do mesmo padrao.',
          confidence: 'high',
          createdAt: NOW,
          relatedRoomId: 'room-bathroom',
          relatedHypothesisId: 'hypothesis-bathroom',
        },
      ],
    })
  );

  assert.equal(result.status, 'accepted_as_knowledge_candidate');
  assert.equal(result.shouldPromoteToKnowledgeCandidate, true);
});

test('evaluateLearningCandidate pede mais investigacao quando a confianca ainda e baixa', () => {
  const result = evaluateLearningCandidate(
    makeInput({
      preliminaryConfidence: 'low',
      hypothesisStatus: 'investigating',
    })
  );

  assert.equal(result.status, 'needs_more_investigation');
  assert.equal(result.shouldPromoteToKnowledgeCandidate, false);
});

test('evaluateLearningCandidate mantem como hipotese aberta quando a trilha e plausivel mas ainda moderada', () => {
  const result = evaluateLearningCandidate(makeInput());

  assert.equal(result.status, 'kept_as_open_hypothesis');
  assert.equal(result.shouldPromoteToKnowledgeCandidate, false);
});

test('evaluateLearningCandidate rejeita material insuficiente quando a base explicativa e fraca', () => {
  const result = evaluateLearningCandidate(
    makeInput({
      evidenceIds: ['evidence-2'],
      evidence: [
        {
          id: 'evidence-2',
          source: 'user_answer',
          description: 'Resposta ainda fraca.',
          confidence: 'low',
          createdAt: NOW,
          relatedRoomId: 'room-bathroom',
          relatedHypothesisId: 'hypothesis-bathroom',
        },
      ],
      summary: 'Fraco.',
    })
  );

  assert.equal(result.status, 'rejected_insufficient_evidence');
  assert.equal(result.shouldPromoteToKnowledgeCandidate, false);
});
