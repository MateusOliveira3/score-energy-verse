import type {
  CuriosityEngineResult,
  CuriositySignal,
  HouseClue,
  HouseModel,
  InvestigationAnswer,
  InvestigationRuntimeStatus,
  InvestigationSession,
  InvestigationSessionClosureReason,
  InvestigationSessionStatus,
  NextInvestigation,
} from '@/lib/cognitive/types';

export interface CreateInvestigationSessionInput {
  nextInvestigation: NextInvestigation;
  clue?: HouseClue;
  openedAt: string;
}

export interface UpdateInvestigationSessionInput {
  session: InvestigationSession;
  previousHouse: HouseModel;
  updatedHouse: HouseModel;
  answer: InvestigationAnswer;
  newEvidenceId: string;
  runtimeStatus: InvestigationRuntimeStatus;
  curiosity: CuriosityEngineResult;
}

export interface InvestigationSessionUpdateResult {
  session: InvestigationSession;
  selectedNextInvestigation: NextInvestigation;
  shouldBlockContinuation: boolean;
}

const cloneQuestion = (question?: NextInvestigation['suggestedQuestion']) =>
  question
    ? {
        ...question,
        options: question.options ? [...question.options] : undefined,
      }
    : undefined;

const unique = <T>(values: T[]) => Array.from(new Set(values));

const cloneHandoffCandidate = (candidate?: InvestigationSession['handoffCandidate']) =>
  candidate
    ? {
        ...candidate,
        evidenceIds: [...candidate.evidenceIds],
      }
    : undefined;

const cloneSession = (session: InvestigationSession): InvestigationSession => ({
  ...session,
  evidenceIds: [...session.evidenceIds],
  askedQuestionIds: [...session.askedQuestionIds],
  handoffCandidate: cloneHandoffCandidate(session.handoffCandidate),
});

const buildSessionId = ({
  focus,
  relatedHypothesisId,
  relatedRoomId,
  openedAt,
}: Pick<
  InvestigationSession,
  'focus' | 'relatedHypothesisId' | 'relatedRoomId' | 'openedAt'
>) => `investigation-session:${focus}:${relatedHypothesisId ?? relatedRoomId ?? 'general'}:${openedAt}`;

const toNextInvestigation = (signal: CuriositySignal): NextInvestigation => ({
  focus: signal.focus,
  reason: signal.reason,
  suggestedQuestion: cloneQuestion(signal.suggestedQuestion),
  expectedDiscovery: signal.expectedDiscovery,
});

const getRoomUnderstanding = (house: HouseModel, roomId?: string) =>
  roomId ? house.rooms.find((room) => room.id === roomId)?.understandingLevel ?? 0 : 0;

const isSameTrailSignal = (session: InvestigationSession, signal?: CuriositySignal) => {
  if (!signal) {
    return false;
  }

  if (session.relatedHypothesisId && signal.relatedHypothesisId === session.relatedHypothesisId) {
    return true;
  }

  if (session.relatedRoomId && signal.relatedRoomId === session.relatedRoomId) {
    return true;
  }

  if (session.originQuestionId && signal.suggestedQuestion?.id === session.originQuestionId) {
    return true;
  }

  return signal.focus === session.focus && session.focus !== 'unknown';
};

const buildSaturationFallback = (): NextInvestigation => ({
  focus: 'unknown',
  reason:
    'Essa trilha nao ganhou compreensao suficiente para justificar insistencia agora.',
  expectedDiscovery: 'Novas evidencias reais antes de reabrir essa investigacao.',
});

const toMeaningfulProgress = ({
  previousHouse,
  updatedHouse,
  session,
  runtimeStatus,
}: Pick<
  UpdateInvestigationSessionInput,
  'previousHouse' | 'updatedHouse' | 'runtimeStatus'
> & { session: InvestigationSession }) => {
  const overallDelta =
    updatedHouse.understanding.overallLevel - previousHouse.understanding.overallLevel;
  const explainedDelta =
    updatedHouse.understanding.explainedBillShare -
    previousHouse.understanding.explainedBillShare;
  const roomDelta =
    getRoomUnderstanding(updatedHouse, session.relatedRoomId) -
    getRoomUnderstanding(previousHouse, session.relatedRoomId);

  if (runtimeStatus === 'hypothesis_strengthened' || runtimeStatus === 'hypothesis_weakened') {
    return true;
  }

  if (runtimeStatus === 'needs_more_context') {
    return false;
  }

  return overallDelta >= 5 || explainedDelta >= 4 || roomDelta >= 8;
};

const selectNextInvestigation = ({
  session,
  curiosity,
  shouldBlockContinuation,
}: {
  session: InvestigationSession;
  curiosity: CuriosityEngineResult;
  shouldBlockContinuation: boolean;
}): NextInvestigation => {
  if (!shouldBlockContinuation) {
    return {
      ...curiosity.nextInvestigation,
      suggestedQuestion: cloneQuestion(curiosity.nextInvestigation.suggestedQuestion),
    };
  }

  const alternative = curiosity.signals.find((signal) => !isSameTrailSignal(session, signal));

  return alternative ? toNextInvestigation(alternative) : buildSaturationFallback();
};

export const createInvestigationSession = ({
  nextInvestigation,
  clue,
  openedAt,
}: CreateInvestigationSessionInput): InvestigationSession => {
  const relatedRoomId =
    nextInvestigation.suggestedQuestion?.relatedRoomId ??
    clue?.question?.relatedRoomId ??
    clue?.relatedRoomId;
  const relatedHypothesisId =
    nextInvestigation.suggestedQuestion?.relatedHypothesisId ??
    clue?.question?.relatedHypothesisId ??
    clue?.relatedHypothesisId;
  const originQuestionId =
    nextInvestigation.suggestedQuestion?.id ?? clue?.question?.id;

  const session: InvestigationSession = {
    id: buildSessionId({
      focus: nextInvestigation.focus,
      relatedHypothesisId,
      relatedRoomId,
      openedAt,
    }),
    focus: nextInvestigation.focus,
    originReason: nextInvestigation.reason,
    originQuestionId,
    relatedRoomId,
    relatedHypothesisId,
    status: 'open',
    attemptCount: 0,
    repeatedAttemptCount: 0,
    evidenceIds: [],
    askedQuestionIds: originQuestionId ? [originQuestionId] : [],
    openedAt,
    lastUpdatedAt: openedAt,
    closureReason: 'ongoing',
  };

  return session;
};

export const updateInvestigationSession = ({
  session,
  previousHouse,
  updatedHouse,
  answer,
  newEvidenceId,
  runtimeStatus,
  curiosity,
}: UpdateInvestigationSessionInput): InvestigationSessionUpdateResult => {
  const nextSession = cloneSession(session);
  const meaningfulProgress = toMeaningfulProgress({
    previousHouse,
    updatedHouse,
    session: nextSession,
    runtimeStatus,
  });
  const dominantSameTrail = isSameTrailSignal(nextSession, curiosity.dominantSignal);
  const stalledWithoutProgress =
    !meaningfulProgress && runtimeStatus === 'needs_more_context';

  nextSession.attemptCount += 1;
  nextSession.evidenceIds = unique([...nextSession.evidenceIds, newEvidenceId]);
  nextSession.askedQuestionIds = unique([...nextSession.askedQuestionIds, answer.questionId]);
  nextSession.lastUpdatedAt = answer.createdAt;

  if (meaningfulProgress) {
    nextSession.lastMeaningfulProgressAt = answer.createdAt;
  } else {
    nextSession.repeatedAttemptCount += 1;
  }

  let status: InvestigationSessionStatus = nextSession.status;
  let closureReason: InvestigationSessionClosureReason = nextSession.closureReason ?? 'ongoing';
  let shouldBlockContinuation = false;

  if (stalledWithoutProgress) {
    status = 'saturated';
    closureReason = dominantSameTrail ? 'repeated_without_progress' : 'no_further_gain';
    shouldBlockContinuation = dominantSameTrail;
    nextSession.closedAt = answer.createdAt;
  } else if (
    meaningfulProgress &&
    runtimeStatus === 'hypothesis_strengthened' &&
    !dominantSameTrail
  ) {
    status = 'ready_for_learning';
    closureReason = 'handoff_candidate';
    nextSession.closedAt = answer.createdAt;
    nextSession.handoffCandidate = {
      reason:
        'A trilha produziu evidencia suficiente para futuro handoff ao LearningEngine sem reabrir a mesma incerteza agora.',
      evidenceIds: [...nextSession.evidenceIds],
      generatedAt: answer.createdAt,
    };
  } else if (!dominantSameTrail && runtimeStatus === 'hypothesis_weakened') {
    status = 'closed';
    closureReason = 'superseded';
    nextSession.closedAt = answer.createdAt;
  } else if (!dominantSameTrail && !meaningfulProgress) {
    status = 'closed';
    closureReason = 'no_further_gain';
    nextSession.closedAt = answer.createdAt;
  } else if (meaningfulProgress || runtimeStatus === 'new_context_added') {
    status = 'in_progress';
    closureReason = 'ongoing';
  } else {
    status = 'open';
    closureReason = 'ongoing';
  }

  nextSession.status = status;
  nextSession.closureReason = closureReason;

  const selectedNextInvestigation = selectNextInvestigation({
    session: nextSession,
    curiosity,
    shouldBlockContinuation,
  });

  return {
    session: nextSession,
    selectedNextInvestigation,
    shouldBlockContinuation,
  };
};
