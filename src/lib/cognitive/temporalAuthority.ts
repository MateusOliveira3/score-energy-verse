import type {
  CandidateKnowledge,
  TemporalAuthority,
  TemporalAuthorityTrigger,
} from '@/lib/cognitive/types';

export interface DeriveInitialTemporalAuthorityInput {
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

const buildRevalidationTriggers = (
  candidateKnowledge: CandidateKnowledge
): TemporalAuthorityTrigger[] => {
  const triggers: TemporalAuthorityTrigger[] = [
    'contradictory_evidence',
    'occupancy_change',
    'baseline_shift',
  ];

  if (
    candidateKnowledge.focus === 'bathroom' ||
    candidateKnowledge.focus === 'kitchen' ||
    candidateKnowledge.focus === 'laundry' ||
    candidateKnowledge.focus === 'comfort' ||
    candidateKnowledge.focus === 'routine'
  ) {
    triggers.push('behavior_change', 'equipment_change');
  }

  if (candidateKnowledge.focus === 'seasonality') {
    triggers.push('seasonal_shift');
  }

  if (candidateKnowledge.focus === 'tariff') {
    triggers.push('tariff_change');
  }

  return unique(triggers);
};

export const deriveInitialTemporalAuthority = ({
  candidateKnowledge,
}: DeriveInitialTemporalAuthorityInput): TemporalAuthority => {
  const supportingEvidenceCount = mediumOrHighEvidenceCount(candidateKnowledge);
  const sources = evidenceSourceCount(candidateKnowledge);
  const historyEvidence = historyEvidenceCount(candidateKnowledge);

  if (
    candidateKnowledge.confidence === 'high' &&
    supportingEvidenceCount >= 3 &&
    sources >= 3 &&
    historyEvidence >= 1
  ) {
    return {
      level: 'stable',
      reason:
        'O conhecimento nasceu com sinais de estabilidade observada entre fontes e ao longo do tempo.',
      revalidationPriority: 'low',
      revalidationTriggers: buildRevalidationTriggers(candidateKnowledge),
    };
  }

  if (
    supportingEvidenceCount >= 2 &&
    sources >= 2 &&
    candidateKnowledge.confidence !== 'low'
  ) {
    return {
      level: 'contextual',
      reason:
        'O conhecimento possui base suficiente para permanecer, mas ainda depende do contexto atual da residencia.',
      revalidationPriority: 'medium',
      revalidationTriggers: buildRevalidationTriggers(candidateKnowledge),
    };
  }

  return {
    level: 'provisional',
    reason:
      'O conhecimento ainda nasce com autoridade temporal curta e pede revisita diante de novas mudancas.',
    revalidationPriority: 'high',
    revalidationTriggers: buildRevalidationTriggers(candidateKnowledge),
  };
};
