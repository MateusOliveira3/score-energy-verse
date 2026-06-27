import { deriveInitialTemporalAuthority } from '@/lib/cognitive/temporalAuthority';
import type {
  CandidateKnowledge,
  KnowledgePersistenceBoundaryResult,
  KnowledgePersistibilityRejectionReason,
  PersistibleKnowledgeCandidate,
} from '@/lib/cognitive/types';

export interface EvaluateKnowledgePersistenceBoundaryInput {
  candidateKnowledge: CandidateKnowledge;
}

const unique = <T>(values: T[]) => Array.from(new Set(values));

const mediumOrHighEvidenceCount = (candidateKnowledge: CandidateKnowledge) =>
  candidateKnowledge.evidence.filter(
    (evidence) => evidence.confidence === 'medium' || evidence.confidence === 'high'
  ).length;

const evidenceSourceCount = (candidateKnowledge: CandidateKnowledge) =>
  new Set(candidateKnowledge.evidence.map((evidence) => evidence.source)).size;

const historyEvidenceCount = (candidateKnowledge: CandidateKnowledge) =>
  candidateKnowledge.evidence.filter((evidence) => evidence.source === 'history').length;

const hasObservedStability = (candidateKnowledge: CandidateKnowledge) =>
  historyEvidenceCount(candidateKnowledge) >= 1 || candidateKnowledge.evidence.length >= 4;

const buildRejectionResult = ({
  reason,
  rejectionReason,
  strengths,
  concerns,
}: {
  reason: string;
  rejectionReason: KnowledgePersistibilityRejectionReason;
  strengths: string[];
  concerns: string[];
}): KnowledgePersistenceBoundaryResult => ({
  status: 'not_persistible',
  reason,
  rejectionReason,
  strengths: unique(strengths),
  concerns: unique(concerns),
});

const buildPersistibleCandidate = (
  candidateKnowledge: CandidateKnowledge,
  result: Omit<KnowledgePersistenceBoundaryResult, 'persistibleKnowledgeCandidate'>
): PersistibleKnowledgeCandidate => ({
  ...candidateKnowledge,
  status: 'persistible_candidate',
  eligibleForFutureMemory: true,
  persistibility: {
    status: 'persistible',
    reason: result.reason,
    strengths: [...result.strengths],
    concerns: [...result.concerns],
  },
  temporalAuthority: result.temporalAuthority!,
});

export const evaluateKnowledgePersistenceBoundary = ({
  candidateKnowledge,
}: EvaluateKnowledgePersistenceBoundaryInput): KnowledgePersistenceBoundaryResult => {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const supportingEvidenceCount = mediumOrHighEvidenceCount(candidateKnowledge);
  const sources = evidenceSourceCount(candidateKnowledge);
  const stabilityObserved = hasObservedStability(candidateKnowledge);

  if (candidateKnowledge.evidence.length >= 3) {
    strengths.push('O conhecimento candidato ja possui massa minima de evidencias.');
  } else {
    concerns.push('A base de evidencias ainda e pequena para sobreviver alem da investigacao.');
  }

  if (supportingEvidenceCount >= 2) {
    strengths.push('Ha evidencias com autoridade cognitiva suficiente para futura permanencia.');
  } else {
    concerns.push('A qualidade das evidencias ainda e fraca para persistibilidade.');
  }

  if (sources >= 2) {
    strengths.push('A leitura nao depende de uma unica origem de evidencia.');
  } else {
    concerns.push('A diversidade de origem ainda e baixa para conhecimento persistivel.');
  }

  if (stabilityObserved) {
    strengths.push('Ja existe sinal minimo de estabilidade observada para a afirmacao.');
  } else {
    concerns.push('Ainda falta estabilidade observada para que o conhecimento sobreviva ao encerramento da trilha.');
  }

  if (
    candidateKnowledge.maturity.attemptCount >= 2 &&
    candidateKnowledge.maturity.repeatedAttemptCount <= 1
  ) {
    strengths.push('A trilha mostrou maturidade investigativa suficiente para consolidacao futura.');
  } else {
    concerns.push('A maturidade investigativa ainda e fraca para elegibilidade de persistencia.');
  }

  if (candidateKnowledge.limits.length <= 2) {
    strengths.push('Os limites explicitos ainda preservam prudencia sem bloquear a permanencia.');
  } else {
    concerns.push('Os limites explicitos ainda sao fortes demais para sustentacao persistivel.');
  }

  if (supportingEvidenceCount < 2 || candidateKnowledge.confidence === 'low') {
    return buildRejectionResult({
      reason:
        'O conhecimento candidato ainda nao possui qualidade suficiente de evidencia para tornar-se persistivel.',
      rejectionReason: 'insufficient_evidence_quality',
      strengths,
      concerns,
    });
  }

  if (sources < 2) {
    return buildRejectionResult({
      reason:
        'O conhecimento candidato ainda depende de diversidade insuficiente de origem para permanecer com seguranca.',
      rejectionReason: 'insufficient_evidence_diversity',
      strengths,
      concerns,
    });
  }

  if (!stabilityObserved) {
    return buildRejectionResult({
      reason:
        'O conhecimento candidato ainda nao demonstrou estabilidade observada minima para sobreviver ao encerramento da investigacao.',
      rejectionReason: 'insufficient_stability',
      strengths,
      concerns,
    });
  }

  if (
    candidateKnowledge.maturity.attemptCount < 2 ||
    candidateKnowledge.maturity.repeatedAttemptCount > 1
  ) {
    return buildRejectionResult({
      reason:
        'A trilha que gerou este conhecimento candidato ainda nao demonstrou maturidade investigativa suficiente para persistibilidade.',
      rejectionReason: 'insufficient_investigation_maturity',
      strengths,
      concerns,
    });
  }

  if (candidateKnowledge.limits.length > 2) {
    return buildRejectionResult({
      reason:
        'Os limites explicitos ainda bloqueiam a permanencia deste conhecimento alem da fase candidata.',
      rejectionReason: 'explicit_limits_block_persistence',
      strengths,
      concerns,
    });
  }

  const temporalAuthority = deriveInitialTemporalAuthority({ candidateKnowledge });
  const result: KnowledgePersistenceBoundaryResult = {
    status: 'persistible',
    reason:
      'O conhecimento candidato demonstrou qualidade, estabilidade e maturidade suficientes para tornar-se persistivel sem ainda virar memoria.',
    strengths: unique(strengths),
    concerns: unique(concerns),
    temporalAuthority,
  };

  return {
    ...result,
    persistibleKnowledgeCandidate: buildPersistibleCandidate(candidateKnowledge, result),
  };
};
