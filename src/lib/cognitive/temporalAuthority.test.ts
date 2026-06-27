import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deriveInitialTemporalAuthority,
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

test('deriveInitialTemporalAuthority atribui autoridade estavel quando ha estabilidade observada entre fontes e tempo', () => {
  const result = deriveInitialTemporalAuthority({
    candidateKnowledge: makeCandidateKnowledge(),
  });

  assert.equal(result.level, 'stable');
  assert.equal(result.revalidationPriority, 'low');
});

test('deriveInitialTemporalAuthority atribui autoridade contextual quando ha base suficiente mas sem estabilidade alta', () => {
  const result = deriveInitialTemporalAuthority({
    candidateKnowledge: makeCandidateKnowledge({
      evidence: makeCandidateKnowledge().evidence.filter((item) => item.source !== 'history'),
      evidenceIds: ['evidence-1', 'evidence-3'],
    }),
  });

  assert.equal(result.level, 'contextual');
  assert.equal(result.revalidationPriority, 'medium');
});

test('deriveInitialTemporalAuthority atribui autoridade provisional quando a base ainda e curta', () => {
  const result = deriveInitialTemporalAuthority({
    candidateKnowledge: makeCandidateKnowledge({
      confidence: 'medium',
      evidence: [
        {
          id: 'evidence-1',
          source: 'user_answer',
          description: 'Resposta isolada do usuario.',
          confidence: 'medium',
          createdAt: '2026-06-16T14:00:00.000Z',
        },
      ],
      evidenceIds: ['evidence-1'],
    }),
  });

  assert.equal(result.level, 'provisional');
  assert.equal(result.revalidationPriority, 'high');
});
