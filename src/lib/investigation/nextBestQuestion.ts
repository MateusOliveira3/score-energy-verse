import type {
  ExpectedGain,
  HouseModel,
  NextQuestionAnswerType,
} from '@/lib/cognitive/types';
import type {
  InvestigationQuestionPriorityHint,
  InvestigationQuestionRole,
} from '@/types/mvp';
import type { InvestigationState } from './investigationState';

export interface NextBestQuestionCandidate {
  id: string;
  question: string;
  answerType: NextQuestionAnswerType;
  expectedGain: ExpectedGain;
  reason?: string;
  relatedHypothesisId?: string;
  relatedRoomId?: string;
  relatedArea?: string;
  options?: string[];
  shouldAskNow?: boolean;
  isRequired?: boolean;
  deterministicOrder?: number;
  investigation?: {
    hypothesisId?: string;
    targetArea?: string;
    energyMapBlock?: string[];
    evidenceProduced?: string[];
    questionRole?: InvestigationQuestionRole;
    unlocks?: string[];
    dependsOn?: string[];
    expectedBenefit?: string;
    priorityHint?: InvestigationQuestionPriorityHint;
  };
}

export interface NextQuestionResult {
  questionId: string;
  question: string;
  reason: string;
  targetHypothesis?: string;
  targetArea?: string;
  expectedBenefit: string;
}

export interface SelectNextBestQuestionInput {
  investigation: InvestigationState;
  questions: NextBestQuestionCandidate[];
  house?: HouseModel;
  answeredQuestionIds?: string[];
}

const expectedGainRank: Record<ExpectedGain, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const priorityHintRank: Record<InvestigationQuestionPriorityHint, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const questionRoleRank: Record<InvestigationQuestionRole, number> = {
  initial: 1,
  disambiguation: 2,
  refinement: 3,
  confirmation: 4,
};

const normalizeText = (value: string | undefined) =>
  value?.trim().toLowerCase() ?? '';

const uniqueStrings = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const areaKeywords: Record<string, string[]> = {
  bathroom: ['bathroom', 'banheiro', 'banho', 'chuveiro'],
  refrigeration: ['refrigeration', 'refrigeracao', 'geladeira', 'freezer', 'cervejeira'],
  comfort: ['comfort', 'conforto', 'climatizacao', 'ar-condicionado', 'climatization'],
  kitchen: ['kitchen', 'cozinha'],
  laundry: ['laundry', 'lavanderia'],
  lighting: ['lighting', 'iluminacao', 'iluminação', 'lampada', 'luminaria'],
  routine: ['routine', 'rotina', 'horario', 'horário', 'uso'],
  tariff: ['tariff', 'tarifa', 'custo'],
  seasonality: ['seasonality', 'sazonalidade', 'estacao', 'estação', 'ciclo'],
};

const resolveAreaFromRoomId = (house: HouseModel | undefined, roomId: string | undefined) =>
  roomId ? house?.rooms.find((room) => room.id === roomId)?.type : undefined;

const resolveQuestionArea = (
  question: NextBestQuestionCandidate,
  house: HouseModel | undefined
) =>
  question.investigation?.targetArea ??
  question.relatedArea ??
  resolveAreaFromRoomId(house, question.relatedRoomId);

const resolveQuestionHypothesisId = (question: NextBestQuestionCandidate) =>
  question.investigation?.hypothesisId ?? question.relatedHypothesisId;

const areaMatchesUnknowns = (area: string | undefined, unknownAreas: string[]) => {
  if (!area) {
    return false;
  }

  const keywords = areaKeywords[area] ?? [area];
  const normalizedUnknownAreas = unknownAreas.map((item) => normalizeText(item));

  return keywords.some((keyword) =>
    normalizedUnknownAreas.some((unknownArea) => unknownArea.includes(normalizeText(keyword)))
  );
};

const compareQuestionsDeterministically = (
  left: NextBestQuestionCandidate,
  right: NextBestQuestionCandidate
) => {
  const orderDelta = (left.deterministicOrder ?? Number.MAX_SAFE_INTEGER) -
    (right.deterministicOrder ?? Number.MAX_SAFE_INTEGER);

  if (orderDelta !== 0) {
    return orderDelta;
  }

  return left.id.localeCompare(right.id);
};

const buildExpectedBenefit = (
  candidate: NextBestQuestionCandidate,
  area: string | undefined,
  hypothesisTitle: string | undefined
) => {
  if (candidate.investigation?.expectedBenefit) {
    return candidate.investigation.expectedBenefit;
  }

  if (hypothesisTitle) {
    return `Reduce uncertainty around "${hypothesisTitle}" with one high-value answer.`;
  }

  if (area) {
    return `Reduce uncertainty around ${area} and explain a larger share of the bill.`;
  }

  return 'Reduce a relevant open uncertainty in the current investigation.';
};

const buildReason = ({
  candidate,
  targetArea,
  targetHypothesisTitle,
  matchesDominantHypothesis,
  matchesCurrentFocus,
  matchesUnknownAreas,
}: {
  candidate: NextBestQuestionCandidate;
  targetArea: string | undefined;
  targetHypothesisTitle: string | undefined;
  matchesDominantHypothesis: boolean;
  matchesCurrentFocus: boolean;
  matchesUnknownAreas: boolean;
}) => {
  const reasons: string[] = [];

  if (candidate.isRequired) {
    reasons.push('This unanswered question is marked as required.');
  }

  if (candidate.investigation?.questionRole) {
    reasons.push(`It is classified as a ${candidate.investigation.questionRole} question.`);
  }

  if (matchesDominantHypothesis && targetHypothesisTitle) {
    reasons.push(`It directly tests the dominant hypothesis "${targetHypothesisTitle}".`);
  } else if (matchesCurrentFocus && targetArea) {
    reasons.push(`It stays aligned with the current investigation focus on ${targetArea}.`);
  }

  if (matchesUnknownAreas && targetArea) {
    reasons.push(`It addresses an explicit unknown area around ${targetArea}.`);
  }

  reasons.push(
    `Its expected benefit is ${candidate.expectedGain}, so it can reduce uncertainty efficiently.`
  );

  if (candidate.reason) {
    reasons.push(candidate.reason);
  }

  return uniqueStrings(reasons).join(' ');
};

interface ScoredQuestion {
  candidate: NextBestQuestionCandidate;
  score: number;
  targetArea?: string;
  targetHypothesisTitle?: string;
  matchesDominantHypothesis: boolean;
  matchesCurrentFocus: boolean;
  matchesUnknownAreas: boolean;
}

const scoreQuestion = (
  candidate: NextBestQuestionCandidate,
  input: SelectNextBestQuestionInput
): ScoredQuestion => {
  const targetArea = resolveQuestionArea(candidate, input.house);
  const targetHypothesis = input.investigation.hypotheses.find(
    (hypothesis) => hypothesis.id === resolveQuestionHypothesisId(candidate)
  );
  const targetHypothesisTitle = targetHypothesis?.title;
  const dominantHypothesis = input.investigation.dominantHypothesis;
  const matchesDominantHypothesis =
    Boolean(dominantHypothesis) &&
    (resolveQuestionHypothesisId(candidate) === dominantHypothesis?.id ||
      (targetArea !== undefined && targetArea === dominantHypothesis?.relatedRoom));
  const matchesCurrentFocus =
    targetArea !== undefined && targetArea === input.investigation.currentFocus;
  const matchesUnknownAreas = areaMatchesUnknowns(
    targetArea,
    input.investigation.unknownAreas
  );

  const score =
    (candidate.isRequired ? 1000 : 0) +
    (matchesDominantHypothesis ? 250 : 0) +
    (matchesCurrentFocus ? 120 : 0) +
    (matchesUnknownAreas ? 110 : 0) +
    expectedGainRank[candidate.expectedGain] * 25 +
    (candidate.investigation?.priorityHint
      ? priorityHintRank[candidate.investigation.priorityHint] * 10
      : 0) +
    (candidate.investigation?.questionRole
      ? questionRoleRank[candidate.investigation.questionRole] * 5
      : 0);

  return {
    candidate,
    score,
    targetArea,
    targetHypothesisTitle,
    matchesDominantHypothesis,
    matchesCurrentFocus,
    matchesUnknownAreas,
  };
};

export const selectNextBestQuestion = ({
  investigation,
  questions,
  house,
  answeredQuestionIds = [],
}: SelectNextBestQuestionInput): NextQuestionResult | undefined => {
  if (
    !investigation.dominantHypothesis &&
    investigation.hypotheses.length === 0 &&
    investigation.currentFocus === 'unknown'
  ) {
    return undefined;
  }

  const answeredIds = new Set(answeredQuestionIds);
  const availableQuestions = questions
    .filter((question) => question.shouldAskNow !== false)
    .filter((question) => !answeredIds.has(question.id));

  if (availableQuestions.length === 0) {
    return undefined;
  }

  const [selected] = availableQuestions
    .map((candidate) => scoreQuestion(candidate, { investigation, questions, house, answeredQuestionIds }))
    .sort((left, right) => {
      const scoreDelta = right.score - left.score;

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return compareQuestionsDeterministically(left.candidate, right.candidate);
    });

  if (!selected) {
    return undefined;
  }

  return {
    questionId: selected.candidate.id,
    question: selected.candidate.question,
    reason: buildReason({
      candidate: selected.candidate,
      targetArea: selected.targetArea,
      targetHypothesisTitle:
        selected.targetHypothesisTitle ?? investigation.dominantHypothesis?.title,
      matchesDominantHypothesis: selected.matchesDominantHypothesis,
      matchesCurrentFocus: selected.matchesCurrentFocus,
      matchesUnknownAreas: selected.matchesUnknownAreas,
    }),
    targetHypothesis:
      resolveQuestionHypothesisId(selected.candidate) ??
      (selected.matchesDominantHypothesis ? investigation.dominantHypothesis?.id : undefined),
    targetArea: selected.targetArea,
    expectedBenefit: buildExpectedBenefit(
      selected.candidate,
      selected.targetArea,
      selected.targetHypothesisTitle
    ),
  };
};
