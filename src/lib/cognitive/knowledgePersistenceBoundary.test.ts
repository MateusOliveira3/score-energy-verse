import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateKnowledgePersistenceBoundary,
  type CandidateKnowledge,
} from '@/lib/cognitive';

const makeCandidateKnowledge = (
  overrides: Partial<CandidateKnowledge> = {}
): CandidateKnowledge => ({
  id: 'knowledge-candidate-1',
  status: 'candidate',
  claim: 'O banho eletrico explica parte relevante do consumo desta residencia.',
  focus: 'bathroom',
  confidence: 'high',
  potentialImpact: 'high',
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
      description: 'O usuario confirmou uso recorrente.',
      confidence: 'medium',
      createdAt: '2026-06-16T14:20:00.000Z',
      relatedRoomId: 'room-bathroom',
      relatedHypothesisId: 'hypothesis-bathroom',
    },
  ],
  limits: [
    'Este conhecimento ainda nao e memoria.',
    'Mudancas relevantes na residencia podem exigir reavaliacao futura.',
  ],
  strengths: ['Existe convergencia entre fontes diferentes.'],
  concerns: ['Ainda nao existe consolidacao em memoria.'],
  promotedAt: '2026-06-16T15:00:00.000Z',
  memoryStatus: 'not_consolidated',
  traceability: {
    investigationSessionId: 'session-1',
    originReason: 'A trilha de banho amadureceu.',
    originQuestionId: 'question-electric-shower',
    relatedRoomId: 'room-bathroom',
    relatedHypothesisId: 'hypothesis-bathroom',
    evaluationGeneratedAt: '2026-06-16T14:30:00.000Z',
  },
  maturity: {
    attemptCount: 2,
    repeatedAttemptCount: 0,
    hypothesisStatus: 'confirmed',
  },
  ...overrides,
});

test('evaluateKnowledgePersistenceBoundary aceita conhecimento candidato persistivel e gera artefato com autoridade temporal', () => {
  const result = evaluateKnowledgePersistenceBoundary({
    candidateKnowledge: makeCandidateKnowledge(),
  });

  assert.equal(result.status, 'persistible');
  assert.equal(result.persistibleKnowledgeCandidate?.status, 'persistible_candidate');
  assert.equal(result.persistibleKnowledgeCandidate?.eligibleForFutureMemory, true);
  assert.equal(result.persistibleKnowledgeCandidate?.temporalAuthority.level, 'stable');
});

test('evaluateKnowledgePersistenceBoundary rejeita conhecimento candidato sem estabilidade observada minima', () => {
  const result = evaluateKnowledgePersistenceBoundary({
    candidateKnowledge: makeCandidateKnowledge({
      evidence: [
        {
          id: 'evidence-1',
          source: 'invoice',
          description: 'A conta aponta concentracao relevante no banho.',
          confidence: 'high',
          createdAt: '2026-06-16T14:00:00.000Z',
        },
        {
          id: 'evidence-2',
          source: 'user_answer',
          description: 'O usuario confirmou uso recorrente.',
          confidence: 'high',
          createdAt: '2026-06-16T14:20:00.000Z',
        },
        {
          id: 'evidence-3',
          source: 'derived_analysis',
          description: 'A analise derivada converge com o mesmo eixo.',
          confidence: 'medium',
          createdAt: '2026-06-16T14:30:00.000Z',
        },
      ],
      evidenceIds: ['evidence-1', 'evidence-2', 'evidence-3'],
    }),
  });

  assert.equal(result.status, 'not_persistible');
  assert.equal(result.rejectionReason, 'insufficient_stability');
});

test('evaluateKnowledgePersistenceBoundary rejeita conhecimento candidato sem maturidade investigativa suficiente', () => {
  const result = evaluateKnowledgePersistenceBoundary({
    candidateKnowledge: makeCandidateKnowledge({
      maturity: {
        attemptCount: 1,
        repeatedAttemptCount: 0,
        hypothesisStatus: 'confirmed',
      },
    }),
  });

  assert.equal(result.status, 'not_persistible');
  assert.equal(result.rejectionReason, 'insufficient_investigation_maturity');
});

test('evaluateKnowledgePersistenceBoundary preserva limites explicitos no artefato persistivel', () => {
  const candidateKnowledge = makeCandidateKnowledge();
  const result = evaluateKnowledgePersistenceBoundary({
    candidateKnowledge,
  });

  assert.deepEqual(
    result.persistibleKnowledgeCandidate?.limits,
    candidateKnowledge.limits
  );
});
