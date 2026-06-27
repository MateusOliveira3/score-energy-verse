import type { HouseModel, EnergyHypothesis, ConfidenceLevel } from '@/lib/cognitive/types';
import type { EnergyMap, EnergyMapBlock } from '@/lib/energy-map';
import type {
  InvestigationHypothesis,
  InvestigationHypothesisStatus,
  InvestigationState,
} from './investigationState';

export interface BuildInvestigationStateInput {
  energyMap?: EnergyMap;
  house?: HouseModel;
}

const confidenceRank: Record<ConfidenceLevel, number> = {
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const roomLabelById: Record<string, string> = {
  bathroom: 'Bathroom',
  comfort: 'Comfort',
  kitchen: 'Kitchen',
  laundry: 'Laundry',
  lighting: 'Lighting',
  refrigeration: 'Refrigeration',
  routine: 'Routine',
  seasonality: 'Seasonality',
  tariff: 'Tariff',
  unknown: 'Unknown',
};

const roomLabelForSentence: Record<string, string> = {
  bathroom: 'bathroom',
  comfort: 'comfort',
  kitchen: 'kitchen',
  laundry: 'laundry',
  lighting: 'lighting',
  refrigeration: 'refrigeration',
  routine: 'routine',
  seasonality: 'seasonality',
  tariff: 'tariff',
  unknown: 'unknown area',
};

const uniqueStrings = (values: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = value.trim();

    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(normalized);
  });

  return result;
};

const normalizeIdentityKey = (value: string | undefined) =>
  value?.trim().toLowerCase() ?? '';

const getBlockImpact = (block: EnergyMapBlock) =>
  block.estimatedInvoiceSharePercent ??
  block.estimatedShare ??
  block.coverageContribution ??
  block.estimatedCost ??
  block.estimatedKwh ??
  0;

const getImpactFromPotential = (potentialImpact?: EnergyHypothesis['potentialImpact']) => {
  if (potentialImpact === 'high') {
    return 70;
  }

  if (potentialImpact === 'medium') {
    return 40;
  }

  if (potentialImpact === 'low') {
    return 15;
  }

  return 5;
};

const getRoomTypeMatches = (house: HouseModel | undefined, room: string) => {
  if (!house) {
    return [];
  }

  return house.rooms.filter(
    (candidate) => candidate.type === room || candidate.id === room
  );
};

const hypothesisMatchesRoom = (
  hypothesis: EnergyHypothesis,
  room: string,
  house: HouseModel | undefined
) => {
  const matchingRoomIds = getRoomTypeMatches(house, room).map((candidate) => candidate.id);

  return hypothesis.relatedRooms.some(
    (relatedRoom) => relatedRoom === room || matchingRoomIds.includes(relatedRoom)
  );
};

const resolveHypothesisStatus = (
  block: EnergyMapBlock,
  relatedHouseHypothesis?: EnergyHypothesis,
  hasConfirmedEvidence = false
): InvestigationHypothesisStatus => {
  if (relatedHouseHypothesis?.status === 'discarded' || relatedHouseHypothesis?.status === 'stale') {
    return 'discarded';
  }

  if (
    hasConfirmedEvidence &&
    (relatedHouseHypothesis?.status === 'confirmed' || block.confidence === 'high')
  ) {
    return 'confirmed';
  }

  if (
    relatedHouseHypothesis?.status === 'strengthened' ||
    relatedHouseHypothesis?.status === 'investigating'
  ) {
    return 'strengthened';
  }

  return 'suspected';
};

const getStatusRank = (status: InvestigationHypothesisStatus) => {
  if (status === 'confirmed') {
    return 4;
  }

  if (status === 'strengthened') {
    return 3;
  }

  if (status === 'suspected') {
    return 2;
  }

  return 1;
};

const compareInvestigationHypotheses = (
  left: InvestigationHypothesis,
  right: InvestigationHypothesis
) => {
  const statusDelta = getStatusRank(right.status) - getStatusRank(left.status);

  if (statusDelta !== 0) {
    return statusDelta;
  }

  const impactDelta = right.estimatedImpact - left.estimatedImpact;

  if (impactDelta !== 0) {
    return impactDelta;
  }

  const confidenceDelta =
    confidenceRank[right.confidence] - confidenceRank[left.confidence];

  if (confidenceDelta !== 0) {
    return confidenceDelta;
  }

  return left.id.localeCompare(right.id);
};

const dedupeHypotheses = (hypotheses: InvestigationHypothesis[]) => {
  const seenById = new Set<string>();
  const seenByIdentity = new Set<string>();

  return hypotheses.filter((hypothesis) => {
    if (seenById.has(hypothesis.id)) {
      return false;
    }

    const identityKey = `${normalizeIdentityKey(hypothesis.relatedRoom)}::${normalizeIdentityKey(
      hypothesis.title
    )}`;

    if (identityKey !== '::' && seenByIdentity.has(identityKey)) {
      return false;
    }

    seenById.add(hypothesis.id);

    if (identityKey !== '::') {
      seenByIdentity.add(identityKey);
    }

    return true;
  });
};

const toDisplayRoomLabel = (room?: string) =>
  room ? roomLabelById[room] ?? room : roomLabelById.unknown;

const toSentenceRoomLabel = (room?: string) =>
  room ? roomLabelForSentence[room] ?? room : roomLabelForSentence.unknown;

const buildBlockReasoning = (
  block: EnergyMapBlock,
  status: InvestigationHypothesisStatus
) => {
  const reasoning = [
    `${toDisplayRoomLabel(block.room)} is represented in the current energy map.`,
  ];

  if (typeof block.estimatedInvoiceSharePercent === 'number') {
    reasoning.push(
      `${toDisplayRoomLabel(block.room)} currently explains about ${block.estimatedInvoiceSharePercent}% of the bill.`
    );
  }

  if (status === 'suspected') {
    reasoning.push('The current evidence is enough to suspect an explanation, not to confirm it.');
  }

  if (status === 'strengthened') {
    reasoning.push('The current house evidence already reinforces this hypothesis.');
  }

  if (status === 'confirmed') {
    reasoning.push('This hypothesis is already backed by confirmed house evidence.');
  }

  if (status === 'discarded') {
    reasoning.push('This hypothesis was previously weakened enough to be treated as discarded.');
  }

  return reasoning;
};

const buildMapHypothesis = ({
  block,
  house,
}: {
  block: EnergyMapBlock;
  house?: HouseModel;
}): InvestigationHypothesis => {
  const relatedHypotheses = [
    ...(house?.activeHypotheses ?? []),
    ...(house?.confirmedHypotheses ?? []),
    ...(house?.discardedHypotheses ?? []),
  ].filter((hypothesis) => hypothesisMatchesRoom(hypothesis, block.room, house));

  const relatedHouseHypothesis = [...relatedHypotheses].sort((left, right) => {
    const statusDelta =
      confidenceRank[right.confidence] - confidenceRank[left.confidence];

    if (statusDelta !== 0) {
      return statusDelta;
    }

    return left.id.localeCompare(right.id);
  })[0];

  const hasConfirmedEvidence = (house?.confirmedHypotheses ?? []).some((hypothesis) =>
    hypothesisMatchesRoom(hypothesis, block.room, house)
  );

  const status = resolveHypothesisStatus(block, relatedHouseHypothesis, hasConfirmedEvidence);

  return {
    id: relatedHouseHypothesis?.id ?? `investigation:${block.room}`,
    title:
      relatedHouseHypothesis?.title ??
      `${toDisplayRoomLabel(block.room)} may explain part of the bill`,
    relatedRoom: block.room,
    estimatedImpact: getBlockImpact(block),
    estimatedSharePercent:
      block.estimatedInvoiceSharePercent ?? block.estimatedShare ?? block.coverageContribution,
    confidence: block.confidence === 'low' ? 'low' : block.confidence,
    status,
    reasoning: buildBlockReasoning(block, status),
  };
};

const buildHouseOnlyHypothesis = (hypothesis: EnergyHypothesis): InvestigationHypothesis => {
  const status: InvestigationHypothesisStatus =
    hypothesis.status === 'confirmed'
      ? 'confirmed'
      : hypothesis.status === 'strengthened'
        ? 'strengthened'
      : hypothesis.status === 'discarded' || hypothesis.status === 'stale'
          ? 'discarded'
          : 'suspected';

  return {
    id: hypothesis.id,
    title: hypothesis.title,
    relatedRoom: hypothesis.relatedRooms[0],
    estimatedImpact: getImpactFromPotential(hypothesis.potentialImpact),
    confidence: hypothesis.confidence,
    status,
    reasoning: uniqueStrings([
      'This hypothesis already exists in the current house model.',
      hypothesis.description,
      status === 'confirmed'
        ? 'The house model already treats this explanation as confirmed.'
        : 'The house model already tracks this explanation as an open investigation.',
    ]),
  };
};

const deriveKnownFacts = (
  energyMap: EnergyMap | undefined,
  house: HouseModel | undefined,
  hypotheses: InvestigationHypothesis[]
) => {
  const facts: string[] = [];

  if (house?.identity.residenceType && house.identity.residenceType !== 'unknown') {
    facts.push(`Residence type identified as ${house.identity.residenceType}.`);
  }

  if (typeof house?.identity.occupants.count === 'number') {
    facts.push(`Known occupancy currently points to ${house.identity.occupants.count} resident(s).`);
  }

  if (
    house?.identity.routineProfile.mainUsePeriod &&
    house.identity.routineProfile.mainUsePeriod !== 'unknown'
  ) {
    facts.push(
      `Main usage period currently looks like ${house.identity.routineProfile.mainUsePeriod}.`
    );
  }

  if (typeof house?.understanding.explainedBillShare === 'number' && house.understanding.explainedBillShare > 0) {
    facts.push(
      `House understanding already explains about ${house.understanding.explainedBillShare}% of the bill.`
    );
  }

  if (typeof energyMap?.estimatedCoveragePercent === 'number' && energyMap.estimatedCoveragePercent > 0) {
    facts.push(
      `Energy map currently covers about ${energyMap.estimatedCoveragePercent}% of the bill.`
    );
  }

  hypotheses
    .filter((hypothesis) => typeof hypothesis.estimatedSharePercent === 'number')
    .slice(0, 3)
    .forEach((hypothesis) => {
      facts.push(
        `${toDisplayRoomLabel(hypothesis.relatedRoom)} currently accounts for about ${hypothesis.estimatedSharePercent}% of the bill.`
      );
    });

  if (house?.understanding.mainKnownPattern) {
    facts.push(house.understanding.mainKnownPattern);
  }

  return uniqueStrings(facts);
};

const deriveUnknownAreas = (
  energyMap: EnergyMap | undefined,
  house: HouseModel | undefined
) => {
  const unknownAreas = [
    ...(house?.understanding.unknownAreas ?? []),
    ...(energyMap?.openGaps ?? []),
    ...(house?.rooms
      .filter((room) => Boolean(room.mainMystery))
      .map((room) => room.mainMystery as string) ?? []),
  ];

  const uniqueUnknownAreas = uniqueStrings(unknownAreas);

  if (uniqueUnknownAreas.length > 0) {
    return uniqueUnknownAreas;
  }

  return ['The investigation still lacks a dominant unknown area.'];
};

const deriveCurrentFocus = (
  house: HouseModel | undefined,
  dominantHypothesis: InvestigationHypothesis | undefined
) => {
  if (house?.nextInvestigation.focus && house.nextInvestigation.focus !== 'unknown') {
    return house.nextInvestigation.focus;
  }

  if (dominantHypothesis?.relatedRoom) {
    return dominantHypothesis.relatedRoom;
  }

  return 'unknown';
};

const deriveStateConfidence = (
  dominantHypothesis: InvestigationHypothesis | undefined,
  hypotheses: InvestigationHypothesis[],
  house: HouseModel | undefined
): ConfidenceLevel => {
  if (!dominantHypothesis) {
    return house?.understanding.confidence ?? 'unknown';
  }

  if (dominantHypothesis.status === 'confirmed') {
    return dominantHypothesis.confidence;
  }

  if (dominantHypothesis.status === 'strengthened') {
    return dominantHypothesis.confidence;
  }

  if (dominantHypothesis.status === 'discarded') {
    return 'low';
  }

  if (hypotheses.length > 1 && confidenceRank[dominantHypothesis.confidence] >= 2) {
    return 'medium';
  }

  return dominantHypothesis.confidence === 'unknown' ? 'low' : dominantHypothesis.confidence;
};

const buildStateReasoning = ({
  dominantHypothesis,
  currentFocus,
  hypotheses,
  knownFacts,
  unknownAreas,
}: Omit<InvestigationState, 'confidence'>) => {
  const reasoning = [
    dominantHypothesis
      ? `Dominant hypothesis selected as ${dominantHypothesis.title}.`
      : 'No dominant hypothesis could be selected yet.',
    `Current focus is ${currentFocus}.`,
    `${knownFacts.length} known fact(s) are already available to the investigation.`,
    `${unknownAreas.length} unknown area(s) still need clarification.`,
  ];

  if (hypotheses.length > 1) {
    reasoning.push('Multiple hypotheses are now competing for the next investigation step.');
  }

  return reasoning;
};

export const buildInvestigationState = ({
  energyMap,
  house,
}: BuildInvestigationStateInput): InvestigationState => {
  const mapHypotheses = (energyMap?.blocksByEstimatedImpact ?? []).map((block) =>
    buildMapHypothesis({ block, house })
  );

  const mappedIds = new Set(mapHypotheses.map((hypothesis) => hypothesis.id));
  const mappedRooms = new Set(
    mapHypotheses
      .map((hypothesis) => hypothesis.relatedRoom)
      .filter((room): room is string => Boolean(room))
  );
  const houseOnlyHypotheses = [
    ...(house?.activeHypotheses ?? []),
    ...(house?.confirmedHypotheses ?? []),
    ...(house?.discardedHypotheses ?? []),
  ]
    .filter(
      (hypothesis) =>
        !mappedIds.has(hypothesis.id) &&
        !hypothesis.relatedRooms.some((relatedRoom) => mappedRooms.has(relatedRoom))
    )
    .map((hypothesis) => buildHouseOnlyHypothesis(hypothesis));

  const hypotheses = dedupeHypotheses([...mapHypotheses, ...houseOnlyHypotheses]).sort(
    compareInvestigationHypotheses
  );
  const dominantHypothesis = hypotheses[0];
  const knownFacts = deriveKnownFacts(energyMap, house, hypotheses);
  const unknownAreas = deriveUnknownAreas(energyMap, house);
  const currentFocus = deriveCurrentFocus(house, dominantHypothesis);
  const reasoning = buildStateReasoning({
    dominantHypothesis,
    hypotheses,
    knownFacts,
    unknownAreas,
    currentFocus,
  });

  return {
    ...(dominantHypothesis ? { dominantHypothesis } : {}),
    hypotheses,
    knownFacts,
    unknownAreas,
    currentFocus,
    confidence: deriveStateConfidence(dominantHypothesis, hypotheses, house),
    reasoning,
  };
};
