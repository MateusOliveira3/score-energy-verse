import type { ConfidenceLevel } from '@/lib/cognitive/types';

export type InvestigationHypothesisStatus =
  | 'suspected'
  | 'strengthened'
  | 'confirmed'
  | 'discarded';

export interface InvestigationHypothesis {
  id: string;
  title: string;
  relatedRoom?: string;
  estimatedImpact: number;
  estimatedSharePercent?: number;
  confidence: ConfidenceLevel;
  status: InvestigationHypothesisStatus;
  reasoning: string[];
}

export interface InvestigationState {
  dominantHypothesis?: InvestigationHypothesis;
  hypotheses: InvestigationHypothesis[];
  knownFacts: string[];
  unknownAreas: string[];
  currentFocus: string;
  confidence: ConfidenceLevel;
  reasoning: string[];
}
