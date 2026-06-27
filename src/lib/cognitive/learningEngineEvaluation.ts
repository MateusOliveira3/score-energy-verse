import type {
  LearningEngineEvaluationResult,
  LearningEvaluationInput,
} from '@/lib/cognitive/types';

const unique = <T>(values: T[]) => Array.from(new Set(values));

const mediumOrHighEvidenceCount = (input: LearningEvaluationInput) =>
  input.evidence.filter(
    (evidence) => evidence.confidence === 'medium' || evidence.confidence === 'high'
  ).length;

const sourceDiversity = (input: LearningEvaluationInput) =>
  new Set(input.evidence.map((evidence) => evidence.source)).size;

const hasExplanatorySummary = (input: LearningEvaluationInput) => input.summary.trim().length >= 24;

export const evaluateLearningCandidate = (
  input: LearningEvaluationInput
): LearningEngineEvaluationResult => {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const supportingEvidenceCount = mediumOrHighEvidenceCount(input);
  const evidenceSourceCount = sourceDiversity(input);
  const explanatorySummary = hasExplanatorySummary(input);

  if (input.evidence.length >= 2) {
    strengths.push('A trilha reuniu mais de uma evidencia relevante.');
  } else {
    concerns.push('A trilha ainda nao reuniu evidencias suficientes para sustentar promocao.');
  }

  if (supportingEvidenceCount >= 2) {
    strengths.push('Ha evidencias com confianca suficiente para apoiar a hipotese.');
  } else {
    concerns.push('As evidencias ainda possuem autoridade cognitiva limitada.');
  }

  if (evidenceSourceCount >= 2) {
    strengths.push('As evidencias nao dependem de uma unica origem.');
  } else {
    concerns.push('A trilha ainda depende de baixa diversidade de origem das evidencias.');
  }

  if (input.preliminaryConfidence === 'high') {
    strengths.push('A confianca preliminar da trilha ja esta alta.');
  } else if (input.preliminaryConfidence === 'medium') {
    concerns.push('A confianca ainda e apenas moderada para promocao cognitiva.');
  } else {
    concerns.push('A confianca ainda e baixa e pede investigacao adicional.');
  }

  if (
    input.hypothesisStatus === 'strengthened' ||
    input.hypothesisStatus === 'confirmed'
  ) {
    strengths.push('A hipotese associada ganhou consistencia ao longo da trilha.');
  } else if (input.hypothesisStatus === 'investigating') {
    concerns.push('A hipotese ainda esta em fase de investigacao aberta.');
  }

  if (explanatorySummary) {
    strengths.push('A trilha ja possui poder explicativo minimo para julgamento.');
  } else {
    concerns.push('Ainda falta uma explicacao suficientemente clara do que a trilha explica.');
  }

  if (input.limits.length > 2) {
    concerns.push('Os limites explicitos ainda pesam contra uma promocao cognitiva imediata.');
  }

  if (input.evidence.length < 2 || supportingEvidenceCount === 0 || !explanatorySummary) {
    return {
      status: 'rejected_insufficient_evidence',
      reason:
        'O material ainda nao possui evidencia explicativa suficiente para seguir como candidato a conhecimento.',
      strengths: unique(strengths),
      concerns: unique(concerns),
      shouldPromoteToKnowledgeCandidate: false,
    };
  }

  if (
    input.preliminaryConfidence === 'high' &&
    (input.hypothesisStatus === 'strengthened' || input.hypothesisStatus === 'confirmed') &&
    input.evidence.length >= 3 &&
    supportingEvidenceCount >= 2 &&
    evidenceSourceCount >= 2 &&
    input.limits.length <= 2
  ) {
    return {
      status: 'accepted_as_knowledge_candidate',
      reason:
        'A trilha demonstrou qualidade suficiente para seguir como candidata a conhecimento, sem ainda virar conhecimento.',
      strengths: unique(strengths),
      concerns: unique(concerns),
      shouldPromoteToKnowledgeCandidate: true,
    };
  }

  if (
    input.preliminaryConfidence === 'low' ||
    input.hypothesisStatus === 'investigating' ||
    supportingEvidenceCount < 2
  ) {
    return {
      status: 'needs_more_investigation',
      reason:
        'A trilha ainda precisa de investigacao adicional antes de merecer promocao cognitiva.',
      strengths: unique(strengths),
      concerns: unique(concerns),
      shouldPromoteToKnowledgeCandidate: false,
    };
  }

  return {
    status: 'kept_as_open_hypothesis',
    reason:
      'A trilha ja e plausivel e coerente, mas ainda deve permanecer como hipotese aberta.',
    strengths: unique(strengths),
    concerns: unique(concerns),
    shouldPromoteToKnowledgeCandidate: false,
  };
};
