import type {
  ConfidenceLevel,
  DeviceMemory,
  EnergyBaseline,
  EnergyHypothesis,
  Evidence,
  HouseIdentity,
  HouseKnowledge,
  HouseMemory,
  HouseModel,
  HouseUnderstanding,
  InvestigationFocus,
  KnowledgeConcept,
  MemoryFact,
  MemoryPattern,
  NextBestQuestion,
  NextInvestigation,
  RoomModel,
  RoomType,
  BehaviorMemory,
} from '@/lib/cognitive/types';

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100);

const createId = (prefix: string) =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const DEFAULT_CONFIDENCE_LEVEL: ConfidenceLevel = 'unknown';

export const DEFAULT_INVESTIGATION_FOCUS: InvestigationFocus = 'unknown';

export const createEmptyHouseIdentity = (): HouseIdentity => ({
  residenceType: 'unknown',
  occupants: {
    confidence: DEFAULT_CONFIDENCE_LEVEL,
  },
  routineProfile: {
    confidence: DEFAULT_CONFIDENCE_LEVEL,
  },
});

export const createEmptyHouseUnderstanding = (): HouseUnderstanding => ({
  overallLevel: 0,
  explainedBillShare: 0,
  confidence: DEFAULT_CONFIDENCE_LEVEL,
  knownAreas: [],
  unknownAreas: [],
});

export const createEmptyDeviceMemory = (
  partial: Partial<DeviceMemory> = {}
): DeviceMemory => {
  const now = partial.createdAt ?? new Date().toISOString();

  return {
    id: partial.id ?? createId('device'),
    label: partial.label ?? 'Unknown device',
    roomId: partial.roomId,
    usageNotes: partial.usageNotes,
    confidence: partial.confidence ?? DEFAULT_CONFIDENCE_LEVEL,
    sourceEvidenceIds: partial.sourceEvidenceIds ?? [],
    createdAt: now,
    lastConfirmedAt: partial.lastConfirmedAt,
  };
};

export const createEmptyBehaviorMemory = (
  partial: Partial<BehaviorMemory> = {}
): BehaviorMemory => {
  const now = partial.createdAt ?? new Date().toISOString();

  return {
    id: partial.id ?? createId('behavior'),
    label: partial.label ?? 'Unknown behavior',
    roomId: partial.roomId,
    routineWindow: partial.routineWindow,
    confidence: partial.confidence ?? DEFAULT_CONFIDENCE_LEVEL,
    sourceEvidenceIds: partial.sourceEvidenceIds ?? [],
    createdAt: now,
    lastConfirmedAt: partial.lastConfirmedAt,
  };
};

export const createEvidence = (partial: Partial<Evidence> = {}): Evidence => ({
  id: partial.id ?? createId('evidence'),
  source: partial.source ?? 'derived_analysis',
  description: partial.description ?? '',
  relatedRoomId: partial.relatedRoomId,
  relatedHypothesisId: partial.relatedHypothesisId,
  confidence: partial.confidence ?? DEFAULT_CONFIDENCE_LEVEL,
  createdAt: partial.createdAt ?? new Date().toISOString(),
});

export const createNextBestQuestion = (
  partial: Partial<NextBestQuestion> = {}
): NextBestQuestion => ({
  id: partial.id ?? createId('question'),
  question: partial.question ?? '',
  reason: partial.reason ?? '',
  expectedGain: partial.expectedGain ?? 'low',
  relatedRoomId: partial.relatedRoomId,
  relatedHypothesisId: partial.relatedHypothesisId,
  answerType: partial.answerType ?? 'unknown',
  options: partial.options,
  shouldAskNow: partial.shouldAskNow ?? false,
});

export const createEnergyHypothesis = (
  partial: Partial<EnergyHypothesis> = {}
): EnergyHypothesis => ({
  id: partial.id ?? createId('hypothesis'),
  title: partial.title ?? 'Untitled hypothesis',
  description: partial.description ?? '',
  status: partial.status ?? 'new',
  relatedRooms: partial.relatedRooms ?? [],
  evidenceIds: partial.evidenceIds ?? [],
  confidence: partial.confidence ?? DEFAULT_CONFIDENCE_LEVEL,
  potentialImpact: partial.potentialImpact ?? 'unknown',
  nextQuestion: partial.nextQuestion
    ? createNextBestQuestion(partial.nextQuestion)
    : undefined,
});

export const createRoomModel = (
  partial: Partial<RoomModel> & Pick<RoomModel, 'label'>,
  roomType: RoomType = 'unknown'
): RoomModel => ({
  id: partial.id ?? createId('room'),
  type: partial.type ?? roomType,
  label: partial.label,
  understandingLevel: clampPercent(partial.understandingLevel ?? 0),
  confidence: partial.confidence ?? DEFAULT_CONFIDENCE_LEVEL,
  knownDevices: (partial.knownDevices ?? []).map((item) => createEmptyDeviceMemory(item)),
  knownBehaviors: (partial.knownBehaviors ?? []).map((item) =>
    createEmptyBehaviorMemory(item)
  ),
  estimatedBillShare: partial.estimatedBillShare,
  estimatedConsumptionShare: partial.estimatedConsumptionShare,
  mainHypothesis: partial.mainHypothesis,
  mainMystery: partial.mainMystery,
  evidence: (partial.evidence ?? []).map((item) => createEvidence(item)),
});

export const createMemoryFact = (partial: Partial<MemoryFact> = {}): MemoryFact => ({
  id: partial.id ?? createId('fact'),
  statement: partial.statement ?? '',
  category: partial.category ?? 'behavior',
  confidence: partial.confidence ?? DEFAULT_CONFIDENCE_LEVEL,
  sourceEvidenceIds: partial.sourceEvidenceIds ?? [],
  createdAt: partial.createdAt ?? new Date().toISOString(),
  lastConfirmedAt: partial.lastConfirmedAt,
});

export const createMemoryPattern = (
  partial: Partial<MemoryPattern> = {}
): MemoryPattern => ({
  id: partial.id ?? createId('pattern'),
  label: partial.label ?? 'Unnamed pattern',
  description: partial.description ?? '',
  confidence: partial.confidence ?? DEFAULT_CONFIDENCE_LEVEL,
  sourceEvidenceIds: partial.sourceEvidenceIds ?? [],
  createdAt: partial.createdAt ?? new Date().toISOString(),
  lastConfirmedAt: partial.lastConfirmedAt,
});

export const createEmptyHouseMemory = (): HouseMemory => ({
  facts: [],
  stablePatterns: [],
  lastUpdatedAt: new Date().toISOString(),
});

export const createKnowledgeConcept = (
  partial: Partial<KnowledgeConcept> = {}
): KnowledgeConcept => ({
  id: partial.id ?? createId('knowledge'),
  title: partial.title ?? 'Untitled concept',
  explanation: partial.explanation ?? '',
  status: partial.status ?? 'introduced',
  relatedRoomId: partial.relatedRoomId,
  firstIntroducedAt: partial.firstIntroducedAt ?? new Date().toISOString(),
  lastReinforcedAt: partial.lastReinforcedAt,
});

export const createEmptyHouseKnowledge = (): HouseKnowledge => ({
  learnedConcepts: [],
});

export const createEmptyEnergyBaseline = (): EnergyBaseline => ({
  status: 'not_started',
  monthsUsed: 0,
});

export const createEmptyNextInvestigation = (): NextInvestigation => ({
  focus: DEFAULT_INVESTIGATION_FOCUS,
  reason: '',
});

export const createHouseModel = ({
  id,
  ownerId,
  createdAt,
  updatedAt,
  identity,
  understanding,
  rooms,
  energyBaseline,
  activeHypotheses,
  discardedHypotheses,
  confirmedHypotheses,
  memory,
  knowledge,
  nextInvestigation,
}: Partial<HouseModel> & Pick<HouseModel, 'ownerId'>): HouseModel => {
  const now = createdAt ?? new Date().toISOString();

  return {
    id: id ?? createId('house'),
    ownerId,
    createdAt: now,
    updatedAt: updatedAt ?? now,
    identity: identity ?? createEmptyHouseIdentity(),
    understanding: understanding ?? createEmptyHouseUnderstanding(),
    rooms: (rooms ?? []).map((room) =>
      createRoomModel({
        ...room,
        label: room.label,
      })
    ),
    energyBaseline: energyBaseline ?? createEmptyEnergyBaseline(),
    activeHypotheses: (activeHypotheses ?? []).map((item) => createEnergyHypothesis(item)),
    discardedHypotheses: (discardedHypotheses ?? []).map((item) =>
      createEnergyHypothesis(item)
    ),
    confirmedHypotheses: (confirmedHypotheses ?? []).map((item) =>
      createEnergyHypothesis(item)
    ),
    memory: memory
      ? {
          facts: (memory.facts ?? []).map((item) => createMemoryFact(item)),
          stablePatterns: (memory.stablePatterns ?? []).map((item) =>
            createMemoryPattern(item)
          ),
          lastUpdatedAt: memory.lastUpdatedAt ?? now,
        }
      : createEmptyHouseMemory(),
    knowledge: knowledge
      ? {
          learnedConcepts: (knowledge.learnedConcepts ?? []).map((item) =>
            createKnowledgeConcept(item)
          ),
        }
      : createEmptyHouseKnowledge(),
    nextInvestigation: nextInvestigation
      ? {
          focus: nextInvestigation.focus ?? DEFAULT_INVESTIGATION_FOCUS,
          reason: nextInvestigation.reason ?? '',
          suggestedQuestion: nextInvestigation.suggestedQuestion
            ? createNextBestQuestion(nextInvestigation.suggestedQuestion)
            : undefined,
          expectedDiscovery: nextInvestigation.expectedDiscovery,
        }
      : createEmptyNextInvestigation(),
  };
};
