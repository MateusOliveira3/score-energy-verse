import type {
  NextBestQuestionCandidate,
  NextQuestionResult,
} from './nextBestQuestion';
import type { InvestigationState } from './investigationState';

export interface ApplyInvestigationPersistenceInput {
  investigation: InvestigationState;
  suggestedQuestion: NextQuestionResult;
  questions: NextBestQuestionCandidate[];
  recentAnsweredQuestions?: NextBestQuestionCandidate[];
  answeredQuestionIds?: string[];
}

export interface InvestigationPersistenceResult extends NextQuestionResult {
  persistenceReason: string;
}

const expectedGainRank = {
  low: 1,
  medium: 2,
  high: 3,
} as const;

const priorityHintRank = {
  low: 1,
  medium: 2,
  high: 3,
} as const;

const questionRoleRank = {
  initial: 1,
  disambiguation: 2,
  refinement: 3,
  confirmation: 4,
} as const;

const MAX_PERSISTENCE_STREAK = 3;

const resolveQuestionArea = (question: NextBestQuestionCandidate) =>
  question.investigation?.targetArea ?? question.relatedArea;

const resolveQuestionHypothesisId = (question: NextBestQuestionCandidate) =>
  question.investigation?.hypothesisId ?? question.relatedHypothesisId;

const buildExpectedBenefit = (
  candidate: NextBestQuestionCandidate,
  fallback: NextQuestionResult
) =>
  candidate.investigation?.expectedBenefit ??
  fallback.expectedBenefit ??
  'Reduce a relevant open uncertainty in the current investigation.';

const buildQuestionResult = ({
  candidate,
  fallback,
  persistenceReason,
}: {
  candidate: NextBestQuestionCandidate;
  fallback: NextQuestionResult;
  persistenceReason: string;
}): InvestigationPersistenceResult => ({
  questionId: candidate.id,
  question: candidate.question,
  reason: candidate.reason ?? fallback.reason,
  targetHypothesis: resolveQuestionHypothesisId(candidate) ?? fallback.targetHypothesis,
  targetArea: resolveQuestionArea(candidate) ?? fallback.targetArea,
  expectedBenefit: buildExpectedBenefit(candidate, fallback),
  persistenceReason,
});

const compareQuestionsDeterministically = (
  left: NextBestQuestionCandidate,
  right: NextBestQuestionCandidate
) => {
  const orderDelta =
    (left.deterministicOrder ?? Number.MAX_SAFE_INTEGER) -
    (right.deterministicOrder ?? Number.MAX_SAFE_INTEGER);

  if (orderDelta !== 0) {
    return orderDelta;
  }

  return left.id.localeCompare(right.id);
};

const countRecentAreaStreak = (
  recentAnsweredQuestions: NextBestQuestionCandidate[],
  area: string
) => {
  let streak = 0;

  for (const question of recentAnsweredQuestions) {
    if (resolveQuestionArea(question) !== area) {
      break;
    }

    streak += 1;
  }

  return streak;
};

const hasUsefulMetadata = (candidate: NextBestQuestionCandidate) =>
  Boolean(candidate.investigation?.targetArea) &&
  Boolean(candidate.investigation?.expectedBenefit?.trim()) &&
  candidate.investigation?.priorityHint !== 'low';

const isUsefulPersistenceCandidate = (
  candidate: NextBestQuestionCandidate,
  answeredIds: Set<string>
) =>
  candidate.shouldAskNow !== false &&
  !answeredIds.has(candidate.id) &&
  hasUsefulMetadata(candidate);

const matchesDominantHypothesis = (
  candidate: NextBestQuestionCandidate,
  investigation: InvestigationState
) => {
  const dominantHypothesis = investigation.dominantHypothesis;
  const candidateArea = resolveQuestionArea(candidate);

  return (
    Boolean(dominantHypothesis) &&
    (resolveQuestionHypothesisId(candidate) === dominantHypothesis?.id ||
      candidateArea === dominantHypothesis?.relatedRoom)
  );
};

const scorePersistenceCandidate = (
  candidate: NextBestQuestionCandidate,
  lastAnsweredQuestion: NextBestQuestionCandidate,
  investigation: InvestigationState
) => {
  const sameHypothesis =
    resolveQuestionHypothesisId(candidate) !== undefined &&
    resolveQuestionHypothesisId(candidate) ===
      resolveQuestionHypothesisId(lastAnsweredQuestion);

  return (
    (sameHypothesis ? 80 : 0) +
    (matchesDominantHypothesis(candidate, investigation) ? 60 : 0) +
    priorityHintRank[candidate.investigation?.priorityHint ?? 'low'] * 20 +
    expectedGainRank[candidate.expectedGain] * 15 +
    questionRoleRank[candidate.investigation?.questionRole ?? 'initial'] * 8
  );
};

const pickPersistentCandidate = ({
  area,
  questions,
  answeredIds,
  lastAnsweredQuestion,
  investigation,
}: {
  area: string;
  questions: NextBestQuestionCandidate[];
  answeredIds: Set<string>;
  lastAnsweredQuestion: NextBestQuestionCandidate;
  investigation: InvestigationState;
}) =>
  questions
    .filter((candidate) => resolveQuestionArea(candidate) === area)
    .filter((candidate) => isUsefulPersistenceCandidate(candidate, answeredIds))
    .sort((left, right) => {
      const scoreDelta =
        scorePersistenceCandidate(right, lastAnsweredQuestion, investigation) -
        scorePersistenceCandidate(left, lastAnsweredQuestion, investigation);

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return compareQuestionsDeterministically(left, right);
    })[0];

const shouldSwitchForStrongerSuggestion = ({
  suggestedCandidate,
  persistentCandidate,
  investigation,
  lastArea,
  recentAreaStreak,
}: {
  suggestedCandidate: NextBestQuestionCandidate;
  persistentCandidate: NextBestQuestionCandidate;
  investigation: InvestigationState;
  lastArea: string;
  recentAreaStreak: number;
}) => {
  if (suggestedCandidate.isRequired) {
    return true;
  }

  const suggestedPriority = priorityHintRank[suggestedCandidate.investigation?.priorityHint ?? 'low'];
  const persistentPriority =
    priorityHintRank[persistentCandidate.investigation?.priorityHint ?? 'low'];
  const suggestedGain = expectedGainRank[suggestedCandidate.expectedGain];
  const persistentGain = expectedGainRank[persistentCandidate.expectedGain];
  const priorityDelta = suggestedPriority - persistentPriority;
  const gainDelta = suggestedGain - persistentGain;
  const suggestedMatchesDominant = matchesDominantHypothesis(suggestedCandidate, investigation);
  const persistentMatchesDominant = matchesDominantHypothesis(persistentCandidate, investigation);
  const suggestedArea = resolveQuestionArea(suggestedCandidate);

  if (priorityDelta >= 2 || (priorityDelta >= 1 && gainDelta >= 1)) {
    return true;
  }

  if (
    suggestedMatchesDominant &&
    !persistentMatchesDominant &&
    suggestedArea === investigation.currentFocus
  ) {
    return true;
  }

  if (
    recentAreaStreak >= MAX_PERSISTENCE_STREAK &&
    suggestedArea !== lastArea &&
    priorityDelta >= 0
  ) {
    return true;
  }

  if (
    investigation.currentFocus !== 'unknown' &&
    suggestedArea === investigation.currentFocus &&
    suggestedArea !== lastArea &&
    priorityDelta >= 0 &&
    gainDelta >= 0
  ) {
    return true;
  }

  return false;
};

export const applyInvestigationPersistence = ({
  investigation,
  suggestedQuestion,
  questions,
  recentAnsweredQuestions = [],
  answeredQuestionIds = [],
}: ApplyInvestigationPersistenceInput): InvestigationPersistenceResult => {
  const answeredIds = new Set(answeredQuestionIds);
  const suggestedCandidate = questions.find(
    (candidate) => candidate.id === suggestedQuestion.questionId
  );
  const lastAnsweredQuestion = recentAnsweredQuestions.find((question) =>
    Boolean(resolveQuestionArea(question))
  );

  if (!suggestedCandidate || !lastAnsweredQuestion) {
    return {
      ...suggestedQuestion,
      persistenceReason:
        'No recent investigation focus was available, so the regular Next Best Question result was kept.',
    };
  }

  const lastArea = resolveQuestionArea(lastAnsweredQuestion);

  if (!lastArea) {
    return {
      ...suggestedQuestion,
      persistenceReason:
        'The recent question history had no valid targetArea, so the regular Next Best Question result was kept.',
    };
  }

  const persistentCandidate = pickPersistentCandidate({
    area: lastArea,
    questions,
    answeredIds,
    lastAnsweredQuestion,
    investigation,
  });

  if (!persistentCandidate) {
    return {
      ...suggestedQuestion,
      persistenceReason: `The Score switched away from ${lastArea} because no useful unanswered follow-up remained in that investigation area.`,
    };
  }

  const suggestedArea = resolveQuestionArea(suggestedCandidate);
  const recentAreaStreak = countRecentAreaStreak(recentAnsweredQuestions, lastArea);

  if (suggestedArea === lastArea) {
    return {
      ...suggestedQuestion,
      persistenceReason: `The Score kept focus on ${lastArea} because the last answered question belongs to the same area and useful follow-up questions still exist there.`,
    };
  }

  if (
    shouldSwitchForStrongerSuggestion({
      suggestedCandidate,
      persistentCandidate,
      investigation,
      lastArea,
      recentAreaStreak,
    })
  ) {
    return {
      ...suggestedQuestion,
      persistenceReason: `The Score switched from ${lastArea} to ${suggestedArea ?? 'another area'} because that next question has materially higher urgency than the remaining follow-up in ${lastArea}.`,
    };
  }

  return buildQuestionResult({
    candidate: persistentCandidate,
    fallback: suggestedQuestion,
    persistenceReason: `The Score kept focus on ${lastArea} instead of switching early because there is still unanswered follow-up with comparable benefit in the same investigation front.`,
  });
};
