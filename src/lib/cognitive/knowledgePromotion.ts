import type {
  CandidateKnowledge,
  KnowledgePromotionRejectionReason,
  KnowledgePromotionResult,
  LearningEngineEvaluationResult,
  LearningEvaluationInput,
} from '@/lib/cognitive/types';

export interface PromoteKnowledgeCandidateInput {
  evaluation: LearningEngineEvaluationResult;
  evaluationInput: LearningEvaluationInput;
  promotedAt: string;
}

const buildCandidateKnowledgeId = ({
  evaluationInput,
  promotedAt,
}: PromoteKnowledgeCandidateInput) =>
  `knowledge-candidate:${evaluationInput.sessionId}:${promotedAt}`;

const buildRejectionReason = (
  evaluation: LearningEngineEvaluationResult
): KnowledgePromotionRejectionReason =>
  evaluation.status === 'accepted_as_knowledge_candidate'
    ? 'missing_promotion_signal'
    : evaluation.status;

const buildCandidateKnowledge = ({
  evaluation,
  evaluationInput,
  promotedAt,
}: PromoteKnowledgeCandidateInput): CandidateKnowledge => ({
  id: buildCandidateKnowledgeId({ evaluation, evaluationInput, promotedAt }),
  status: 'candidate',
  claim: evaluationInput.summary,
  focus: evaluationInput.focus,
  confidence: evaluationInput.preliminaryConfidence,
  potentialImpact: evaluationInput.potentialImpact ?? 'unknown',
  evidenceIds: [...evaluationInput.evidenceIds],
  evidence: evaluationInput.evidence.map((item) => ({
    ...item,
  })),
  limits: [...evaluationInput.limits],
  strengths: [...evaluation.strengths],
  concerns: [...evaluation.concerns],
  promotedAt,
  memoryStatus: 'not_consolidated',
  traceability: {
    investigationSessionId: evaluationInput.sessionId,
    originReason: evaluationInput.originReason,
    originQuestionId: evaluationInput.originQuestionId,
    relatedRoomId: evaluationInput.relatedRoomId,
    relatedHypothesisId: evaluationInput.relatedHypothesisId,
    evaluationGeneratedAt: evaluationInput.generatedAt,
  },
  maturity: {
    attemptCount: evaluationInput.attemptCount,
    repeatedAttemptCount: evaluationInput.repeatedAttemptCount,
    hypothesisStatus: evaluationInput.hypothesisStatus,
  },
});

export const promoteKnowledgeCandidate = ({
  evaluation,
  evaluationInput,
  promotedAt,
}: PromoteKnowledgeCandidateInput): KnowledgePromotionResult => {
  if (
    evaluation.status !== 'accepted_as_knowledge_candidate' ||
    !evaluation.shouldPromoteToKnowledgeCandidate
  ) {
    return {
      status: 'not_promoted',
      reason:
        'A avaliacao ainda nao autorizou a passagem de hipotese avaliada para conhecimento candidato.',
      rejectionReason: buildRejectionReason(evaluation),
    };
  }

  return {
    status: 'promoted_to_candidate',
    reason:
      'A hipotese avaliada foi promovida para conhecimento candidato sem consolidacao em memoria.',
    candidateKnowledge: buildCandidateKnowledge({
      evaluation,
      evaluationInput,
      promotedAt,
    }),
  };
};
