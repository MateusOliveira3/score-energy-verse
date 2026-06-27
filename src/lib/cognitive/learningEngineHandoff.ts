import type {
  ConfidenceLevel,
  EnergyHypothesis,
  Evidence,
  HouseModel,
  InvestigationSession,
  LearningEngineHandoffResult,
  LearningEvaluationInput,
  RoomModel,
} from '@/lib/cognitive/types';

export interface PrepareLearningEngineHandoffInput {
  house: HouseModel;
  session: InvestigationSession;
}

const unique = <T>(values: T[]) => Array.from(new Set(values));

const buildRejectedResult = (
  reason: string,
  rejectionReason: LearningEngineHandoffResult['rejectionReason']
): LearningEngineHandoffResult => ({
  status: 'rejected',
  reason,
  rejectionReason,
});

const getAllEvidence = (house: HouseModel): Evidence[] =>
  house.rooms.flatMap((room) => room.evidence).map((evidence) => ({
    ...evidence,
  }));

const getRelatedHypothesis = ({
  house,
  session,
}: PrepareLearningEngineHandoffInput) =>
  session.relatedHypothesisId
    ? house.activeHypotheses.find((item) => item.id === session.relatedHypothesisId) ??
      house.confirmedHypotheses.find((item) => item.id === session.relatedHypothesisId) ??
      house.discardedHypotheses.find((item) => item.id === session.relatedHypothesisId)
    : undefined;

const getRelatedRoom = ({
  house,
  session,
}: PrepareLearningEngineHandoffInput) =>
  session.relatedRoomId ? house.rooms.find((item) => item.id === session.relatedRoomId) : undefined;

const resolvePreliminaryConfidence = ({
  house,
  session,
}: PrepareLearningEngineHandoffInput): ConfidenceLevel => {
  const hypothesis = getRelatedHypothesis({ house, session });
  const room = getRelatedRoom({ house, session });

  return hypothesis?.confidence ?? room?.confidence ?? house.understanding.confidence;
};

const resolveSummary = ({
  session,
  hypothesis,
  room,
}: {
  session: InvestigationSession;
  hypothesis?: EnergyHypothesis;
  room?: RoomModel;
}) => {
  if (hypothesis) {
    return hypothesis.description;
  }

  if (room?.mainHypothesis) {
    return room.mainHypothesis;
  }

  if (room?.mainMystery) {
    return room.mainMystery;
  }

  return session.originReason;
};

const buildLimits = ({
  session,
  preliminaryConfidence,
  hypothesis,
}: {
  session: InvestigationSession;
  preliminaryConfidence: ConfidenceLevel;
  hypothesis?: EnergyHypothesis;
}) => {
  const limits = [
    'Este handoff apenas entrega material para avaliacao e nao confirma conhecimento automaticamente.',
  ];

  if (preliminaryConfidence !== 'high') {
    limits.push(
      'A confianca ainda e preliminar e pode mudar quando novas evidencias aparecerem.'
    );
  }

  if (!hypothesis || hypothesis.status !== 'confirmed') {
    limits.push(
      'A hipotese associada ainda nao pode ser tratada como conhecimento confirmado.'
    );
  }

  if (session.closureReason === 'handoff_candidate') {
    limits.push(
      'A trilha mostrou progresso real, mas ainda precisa de avaliacao explicita antes de qualquer consolidacao.'
    );
  }

  return unique(limits);
};

export const prepareLearningEngineHandoff = ({
  house,
  session,
}: PrepareLearningEngineHandoffInput): LearningEngineHandoffResult => {
  if (!session.handoffCandidate) {
    return buildRejectedResult(
      'A trilha ainda nao produziu um handoffCandidate explicito para avaliacao.',
      'no_handoff_candidate'
    );
  }

  if (session.status !== 'ready_for_learning') {
    return buildRejectedResult(
      'A trilha ainda nao esta em estado cognitivo apropriado para avaliacao pelo LearningEngine.',
      'session_not_ready'
    );
  }

  const availableEvidence = getAllEvidence(house);
  const hypothesis = getRelatedHypothesis({ house, session });
  const room = getRelatedRoom({ house, session });
  const evidenceIds = unique([
    ...session.handoffCandidate.evidenceIds,
    ...session.evidenceIds,
    ...(hypothesis?.evidenceIds ?? []),
    ...((room?.evidence ?? [])
      .filter(
        (item) =>
          !session.relatedHypothesisId || item.relatedHypothesisId === session.relatedHypothesisId
      )
      .map((item) => item.id)),
  ]);
  const evidence = evidenceIds
    .map((evidenceId) => availableEvidence.find((item) => item.id === evidenceId))
    .filter((item): item is Evidence => Boolean(item));

  if (evidence.length < 2) {
    return buildRejectedResult(
      'A trilha ainda nao reuniu evidencia suficiente para uma avaliacao honesta.',
      'insufficient_evidence'
    );
  }

  const preliminaryConfidence = resolvePreliminaryConfidence({ house, session });

  if (preliminaryConfidence === 'unknown') {
    return buildRejectedResult(
      'A trilha ainda nao possui confianca preliminar minima para avaliacao.',
      'weak_preliminary_confidence'
    );
  }

  const evaluationInput: LearningEvaluationInput = {
    sessionId: session.id,
    focus: session.focus,
    originReason: session.originReason,
    originQuestionId: session.originQuestionId,
    relatedRoomId: session.relatedRoomId,
    relatedHypothesisId: session.relatedHypothesisId,
    hypothesisStatus: hypothesis?.status,
    potentialImpact: hypothesis?.potentialImpact,
    closureReason: session.closureReason,
    generatedAt: session.handoffCandidate.generatedAt,
    attemptCount: session.attemptCount,
    repeatedAttemptCount: session.repeatedAttemptCount,
    evidenceIds,
    evidence,
    preliminaryConfidence,
    evaluationMode: 'investigation_review',
    summary: resolveSummary({ session, hypothesis, room }),
    limits: buildLimits({ session, preliminaryConfidence, hypothesis }),
  };

  return {
    status: 'ready_for_evaluation',
    reason:
      'A trilha entregou material minimo para avaliacao pelo LearningEngine sem promover conhecimento automaticamente.',
    evaluationInput,
  };
};
