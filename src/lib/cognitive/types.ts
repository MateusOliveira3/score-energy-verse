export type ConfidenceLevel = 'unknown' | 'low' | 'medium' | 'high';

export type HouseResidenceType = 'house' | 'apartment' | 'studio' | 'unknown';

export type HouseMainUsePeriod =
  | 'morning'
  | 'afternoon'
  | 'night'
  | 'mixed'
  | 'unknown';

export type SeasonalSensitivity = 'low' | 'medium' | 'high' | 'unknown';

export type RoomType =
  | 'bathroom'
  | 'kitchen'
  | 'laundry'
  | 'bedroom'
  | 'living_room'
  | 'garage'
  | 'outdoor'
  | 'comfort'
  | 'unknown';

export type EvidenceSource =
  | 'invoice'
  | 'user_answer'
  | 'history'
  | 'iot'
  | 'sensor'
  | 'derived_analysis';

export type HypothesisStatus =
  | 'new'
  | 'investigating'
  | 'strengthened'
  | 'confirmed'
  | 'discarded'
  | 'stale';

export type PotentialImpact = 'low' | 'medium' | 'high' | 'unknown';

export type NextQuestionAnswerType =
  | 'yes_no'
  | 'single_choice'
  | 'number'
  | 'text'
  | 'unknown';

export type ExpectedGain = 'low' | 'medium' | 'high';

export type MemoryFactCategory =
  | 'occupants'
  | 'routine'
  | 'room'
  | 'device'
  | 'tariff'
  | 'seasonality'
  | 'behavior';

export type KnowledgeStatus = 'introduced' | 'reinforced' | 'understood';

export type EnergyBaselineStatus =
  | 'not_started'
  | 'building'
  | 'established'
  | 'unstable';

export type HouseClueKind =
  | 'question'
  | 'hypothesis'
  | 'room_mystery'
  | 'baseline'
  | 'discovery';

export type HouseClueConfidence = ConfidenceLevel;

export type HouseClueActionKind =
  | 'ask_question'
  | 'review_clue'
  | 'observe_next_cycle'
  | 'collect_more_history'
  | 'wait_for_more_data';

export type CoreSpeechTone =
  | 'exploratory'
  | 'careful'
  | 'curious'
  | 'steady';

export type CoreExperienceStatus =
  | 'no_data'
  | 'building_baseline'
  | 'clue_ready'
  | 'question_ready'
  | 'needs_more_context'
  | 'stable_observation';

export type CoreExperienceSecondaryActionId =
  | 'mostrar_detalhes'
  | 'ver_memoria'
  | 'pedir_explicacao';

export type InvestigationFocus =
  | 'bathroom'
  | 'kitchen'
  | 'laundry'
  | 'comfort'
  | 'tariff'
  | 'seasonality'
  | 'routine'
  | 'unknown';

export type InvestigationRuntimeStatus =
  | 'answer_recorded'
  | 'hypothesis_strengthened'
  | 'hypothesis_weakened'
  | 'new_context_added'
  | 'needs_more_context'
  | 'no_effect';

export type InvestigationSessionStatus =
  | 'open'
  | 'in_progress'
  | 'saturated'
  | 'closed'
  | 'ready_for_learning';

export type InvestigationSessionClosureReason =
  | 'ongoing'
  | 'repeated_without_progress'
  | 'superseded'
  | 'handoff_candidate'
  | 'no_further_gain';

export type LearningHandoffStatus = 'ready_for_evaluation' | 'rejected';

export type LearningHandoffRejectionReason =
  | 'no_handoff_candidate'
  | 'session_not_ready'
  | 'insufficient_evidence'
  | 'weak_preliminary_confidence';

export type LearningEvaluationStatus =
  | 'accepted_as_knowledge_candidate'
  | 'needs_more_investigation'
  | 'kept_as_open_hypothesis'
  | 'rejected_insufficient_evidence';

export type KnowledgePromotionStatus = 'promoted_to_candidate' | 'not_promoted';

export type KnowledgePromotionRejectionReason =
  | 'needs_more_investigation'
  | 'kept_as_open_hypothesis'
  | 'rejected_insufficient_evidence'
  | 'missing_promotion_signal';

export type CandidateKnowledgeStatus = 'candidate';

export type CandidateKnowledgeMemoryStatus = 'not_consolidated';

export type KnowledgePersistibilityStatus = 'persistible' | 'not_persistible';

export type KnowledgePersistibilityRejectionReason =
  | 'insufficient_evidence_quality'
  | 'insufficient_evidence_diversity'
  | 'insufficient_stability'
  | 'insufficient_investigation_maturity'
  | 'explicit_limits_block_persistence';

export type PersistibleKnowledgeCandidateStatus = 'persistible_candidate';

export type TemporalAuthorityLevel = 'provisional' | 'contextual' | 'stable';

export type TemporalRevalidationPriority = 'high' | 'medium' | 'low';

export type TemporalAuthorityTrigger =
  | 'contradictory_evidence'
  | 'behavior_change'
  | 'equipment_change'
  | 'occupancy_change'
  | 'seasonal_shift'
  | 'tariff_change'
  | 'baseline_shift';

export type CuriositySignalKind =
  | 'question_gap'
  | 'room_gap'
  | 'baseline_gap'
  | 'tariff_gap'
  | 'unknown_gap';

export interface HouseModel {
  id: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  identity: HouseIdentity;
  understanding: HouseUnderstanding;
  rooms: RoomModel[];
  energyBaseline: EnergyBaseline;
  activeHypotheses: EnergyHypothesis[];
  discardedHypotheses: EnergyHypothesis[];
  confirmedHypotheses: EnergyHypothesis[];
  memory: HouseMemory;
  knowledge: HouseKnowledge;
  nextInvestigation: NextInvestigation;
}

export interface HouseIdentity {
  nickname?: string;
  residenceType: HouseResidenceType;
  occupants: {
    count?: number;
    confidence: ConfidenceLevel;
  };
  routineProfile: {
    mainUsePeriod?: HouseMainUsePeriod;
    homeOffice?: boolean;
    confidence: ConfidenceLevel;
  };
  climateContext?: {
    city?: string;
    region?: string;
    seasonalSensitivity: SeasonalSensitivity;
  };
}

export interface HouseUnderstanding {
  overallLevel: number;
  explainedBillShare: number;
  confidence: ConfidenceLevel;
  knownAreas: string[];
  unknownAreas: string[];
  mainKnownPattern?: string;
  mainMystery?: string;
  lastMeaningfulDiscoveryAt?: string;
}

export interface RoomModel {
  id: string;
  type: RoomType;
  label: string;
  understandingLevel: number;
  confidence: ConfidenceLevel;
  knownDevices: DeviceMemory[];
  knownBehaviors: BehaviorMemory[];
  estimatedBillShare?: number;
  estimatedConsumptionShare?: number;
  mainHypothesis?: string;
  mainMystery?: string;
  evidence: Evidence[];
}

export interface DeviceMemory {
  id: string;
  label: string;
  roomId?: string;
  usageNotes?: string;
  confidence: ConfidenceLevel;
  sourceEvidenceIds: string[];
  createdAt: string;
  lastConfirmedAt?: string;
}

export interface BehaviorMemory {
  id: string;
  label: string;
  roomId?: string;
  routineWindow?: HouseMainUsePeriod;
  confidence: ConfidenceLevel;
  sourceEvidenceIds: string[];
  createdAt: string;
  lastConfirmedAt?: string;
}

export interface Evidence {
  id: string;
  source: EvidenceSource;
  description: string;
  relatedRoomId?: string;
  relatedHypothesisId?: string;
  confidence: ConfidenceLevel;
  createdAt: string;
}

export interface EnergyHypothesis {
  id: string;
  title: string;
  description: string;
  status: HypothesisStatus;
  relatedRooms: string[];
  evidenceIds: string[];
  confidence: ConfidenceLevel;
  potentialImpact: PotentialImpact;
  nextQuestion?: NextBestQuestion;
}

export interface NextBestQuestion {
  id: string;
  question: string;
  reason: string;
  expectedGain: ExpectedGain;
  relatedRoomId?: string;
  relatedHypothesisId?: string;
  answerType: NextQuestionAnswerType;
  options?: string[];
  shouldAskNow: boolean;
}

export interface HouseMemory {
  facts: MemoryFact[];
  stablePatterns: MemoryPattern[];
  lastUpdatedAt: string;
}

export interface MemoryFact {
  id: string;
  statement: string;
  category: MemoryFactCategory;
  confidence: ConfidenceLevel;
  sourceEvidenceIds: string[];
  createdAt: string;
  lastConfirmedAt?: string;
}

export interface MemoryPattern {
  id: string;
  label: string;
  description: string;
  confidence: ConfidenceLevel;
  sourceEvidenceIds: string[];
  createdAt: string;
  lastConfirmedAt?: string;
}

export interface HouseKnowledge {
  learnedConcepts: KnowledgeConcept[];
}

export interface KnowledgeConcept {
  id: string;
  title: string;
  explanation: string;
  status: KnowledgeStatus;
  relatedRoomId?: string;
  firstIntroducedAt: string;
  lastReinforcedAt?: string;
}

export interface EnergyBaseline {
  status: EnergyBaselineStatus;
  monthsUsed: number;
  averageConsumptionKwh?: number;
  averageBillValue?: number;
  averageCostPerKwh?: number;
  seasonalPattern?: {
    summer?: BaselineSeason;
    winter?: BaselineSeason;
  };
}

export interface BaselineSeason {
  averageConsumptionKwh: number;
  confidence: ConfidenceLevel;
}

export interface NextInvestigation {
  focus: InvestigationFocus;
  reason: string;
  suggestedQuestion?: NextBestQuestion;
  expectedDiscovery?: string;
}

export interface InvestigationAnswer {
  id: string;
  questionId: string;
  value: string | number | boolean | null;
  label: string;
  createdAt: string;
  source: 'user_answer';
}

export interface ResultSpeechHint {
  tone: CoreSpeechTone;
  message: string;
  nextLine?: string;
}

export interface InvestigationRuntimeResult {
  updatedHouse: HouseModel;
  newEvidence: Evidence;
  affectedHypotheses: EnergyHypothesis[];
  nextInvestigation: NextInvestigation;
  investigationSession: InvestigationSession;
  learningHandoff?: LearningEngineHandoffResult;
  learningEvaluation?: LearningEngineEvaluationResult;
  knowledgePromotion?: KnowledgePromotionResult;
  knowledgePersistenceBoundary?: KnowledgePersistenceBoundaryResult;
  resultSpeechHint: ResultSpeechHint;
  status: InvestigationRuntimeStatus;
}

export interface CuriositySignal {
  id: string;
  kind: CuriositySignalKind;
  focus: InvestigationFocus;
  score: number;
  reason: string;
  expectedDiscovery?: string;
  relatedRoomId?: string;
  relatedHypothesisId?: string;
  suggestedQuestion?: NextBestQuestion;
}

export interface CuriosityEngineResult {
  nextInvestigation: NextInvestigation;
  dominantSignal?: CuriositySignal;
  signals: CuriositySignal[];
}

export interface InvestigationSessionHandoffCandidate {
  reason: string;
  evidenceIds: string[];
  generatedAt: string;
}

export interface InvestigationSession {
  id: string;
  focus: InvestigationFocus;
  originReason: string;
  originQuestionId?: string;
  relatedRoomId?: string;
  relatedHypothesisId?: string;
  status: InvestigationSessionStatus;
  attemptCount: number;
  repeatedAttemptCount: number;
  evidenceIds: string[];
  askedQuestionIds: string[];
  openedAt: string;
  lastUpdatedAt: string;
  lastMeaningfulProgressAt?: string;
  closedAt?: string;
  closureReason?: InvestigationSessionClosureReason;
  handoffCandidate?: InvestigationSessionHandoffCandidate;
}

export interface LearningEvaluationInput {
  sessionId: string;
  focus: InvestigationFocus;
  originReason: string;
  originQuestionId?: string;
  relatedRoomId?: string;
  relatedHypothesisId?: string;
  hypothesisStatus?: HypothesisStatus;
  potentialImpact?: PotentialImpact;
  closureReason?: InvestigationSessionClosureReason;
  generatedAt: string;
  attemptCount: number;
  repeatedAttemptCount: number;
  evidenceIds: string[];
  evidence: Evidence[];
  preliminaryConfidence: ConfidenceLevel;
  evaluationMode: 'investigation_review';
  summary: string;
  limits: string[];
}

export interface LearningEngineHandoffResult {
  status: LearningHandoffStatus;
  reason: string;
  rejectionReason?: LearningHandoffRejectionReason;
  evaluationInput?: LearningEvaluationInput;
}

export interface LearningEngineEvaluationResult {
  status: LearningEvaluationStatus;
  reason: string;
  strengths: string[];
  concerns: string[];
  shouldPromoteToKnowledgeCandidate: boolean;
}

export interface CandidateKnowledgeTraceability {
  investigationSessionId: string;
  originReason: string;
  originQuestionId?: string;
  relatedRoomId?: string;
  relatedHypothesisId?: string;
  evaluationGeneratedAt: string;
}

export interface CandidateKnowledge {
  id: string;
  status: CandidateKnowledgeStatus;
  claim: string;
  focus: InvestigationFocus;
  confidence: ConfidenceLevel;
  potentialImpact: PotentialImpact;
  evidenceIds: string[];
  evidence: Evidence[];
  limits: string[];
  strengths: string[];
  concerns: string[];
  promotedAt: string;
  memoryStatus: CandidateKnowledgeMemoryStatus;
  traceability: CandidateKnowledgeTraceability;
  maturity: CandidateKnowledgeMaturity;
}

export interface KnowledgePromotionResult {
  status: KnowledgePromotionStatus;
  reason: string;
  rejectionReason?: KnowledgePromotionRejectionReason;
  candidateKnowledge?: CandidateKnowledge;
}

export interface CandidateKnowledgeMaturity {
  attemptCount: number;
  repeatedAttemptCount: number;
  hypothesisStatus?: HypothesisStatus;
}

export interface TemporalAuthority {
  level: TemporalAuthorityLevel;
  reason: string;
  revalidationPriority: TemporalRevalidationPriority;
  revalidationTriggers: TemporalAuthorityTrigger[];
}

export interface PersistibilityAssessment {
  status: KnowledgePersistibilityStatus;
  reason: string;
  strengths: string[];
  concerns: string[];
}

export interface PersistibleKnowledgeCandidate extends CandidateKnowledge {
  status: PersistibleKnowledgeCandidateStatus;
  eligibleForFutureMemory: true;
  persistibility: PersistibilityAssessment;
  temporalAuthority: TemporalAuthority;
}

export interface KnowledgePersistenceBoundaryResult {
  status: KnowledgePersistibilityStatus;
  reason: string;
  rejectionReason?: KnowledgePersistibilityRejectionReason;
  strengths: string[];
  concerns: string[];
  temporalAuthority?: TemporalAuthority;
  persistibleKnowledgeCandidate?: PersistibleKnowledgeCandidate;
}

export interface HouseClueAction {
  kind: HouseClueActionKind;
  label: string;
  reason: string;
}

export interface HouseClue {
  id: string;
  kind: HouseClueKind;
  title: string;
  shortMessage: string;
  explanation: string;
  confidence: HouseClueConfidence;
  relatedRoomId?: string;
  relatedHypothesisId?: string;
  evidenceIds: string[];
  suggestedAction: HouseClueAction;
  shouldAskQuestion: boolean;
  question?: NextBestQuestion;
}

export interface CoreSpeechStep {
  id: string;
  label: string;
  description?: string;
}

export interface CoreSpeech {
  id: string;
  source: 'house_clue' | 'energy_story';
  tone: CoreSpeechTone;
  opening: string;
  clueLine: string;
  optionalQuestionLine?: string;
  actionLabel: string;
  evidenceLabel: string;
  confidenceLabel: string;
  steps?: CoreSpeechStep[];
}

export interface CoreExperiencePrimaryAction {
  id: string;
  label: string;
  reason: string;
}

export interface CoreExperienceDebugInfo {
  pipeline: Array<'house' | 'clue' | 'energy_story' | 'speech'>;
  evidenceCount: number;
  knownAreasCount: number;
  unknownAreasCount: number;
  statusReason: string;
}

export interface CoreExperience {
  id: string;
  status: CoreExperienceStatus;
  house: HouseModel;
  primaryClue: HouseClue;
  speech: CoreSpeech;
  primaryAction: CoreExperiencePrimaryAction;
  secondaryActions: CoreExperienceSecondaryActionId[];
  debug?: CoreExperienceDebugInfo;
}
