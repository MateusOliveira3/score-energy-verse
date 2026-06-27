import { runCuriosityEngine } from '@/lib/cognitive/curiosityEngine';
import {
  createInvestigationSession,
  updateInvestigationSession,
} from '@/lib/cognitive/investigationSession';
import { evaluateLearningCandidate } from '@/lib/cognitive/learningEngineEvaluation';
import { prepareLearningEngineHandoff } from '@/lib/cognitive/learningEngineHandoff';
import { evaluateKnowledgePersistenceBoundary } from '@/lib/cognitive/knowledgePersistenceBoundary';
import { promoteKnowledgeCandidate } from '@/lib/cognitive/knowledgePromotion';
import type {
  ConfidenceLevel,
  EnergyHypothesis,
  Evidence,
  HouseClue,
  HouseModel,
  InvestigationAnswer,
  InvestigationRuntimeResult,
  InvestigationRuntimeStatus,
  InvestigationSession,
  NextBestQuestion,
  ResultSpeechHint,
  RoomModel,
  RoomType,
} from '@/lib/cognitive/types';

export interface ApplyInvestigationAnswerInput {
  house: HouseModel;
  clue: HouseClue;
  answer: InvestigationAnswer;
  session?: InvestigationSession;
}

type AnswerPolarity = 'positive' | 'negative' | 'unknown';

const confidenceRank: Record<ConfidenceLevel, number> = {
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const roomAreaByType: Record<RoomType, string> = {
  bathroom: 'banho',
  kitchen: 'cozinha',
  laundry: 'lavanderia',
  bedroom: 'quarto',
  living_room: 'rotina',
  garage: 'garagem',
  outdoor: 'area externa',
  comfort: 'climatizacao',
  unknown: 'casa',
};

const clampPercent = (value: number) => Math.min(Math.max(Math.round(value), 0), 100);

const unique = <T>(values: T[]) => Array.from(new Set(values));

const cloneQuestion = (question?: NextBestQuestion): NextBestQuestion | undefined =>
  question
    ? {
        ...question,
        options: question.options ? [...question.options] : undefined,
      }
    : undefined;

const cloneEvidence = (evidence: Evidence): Evidence => ({
  ...evidence,
});

const cloneHypothesis = (hypothesis: EnergyHypothesis): EnergyHypothesis => ({
  ...hypothesis,
  relatedRooms: [...hypothesis.relatedRooms],
  evidenceIds: [...hypothesis.evidenceIds],
  nextQuestion: cloneQuestion(hypothesis.nextQuestion),
});

const cloneRoom = (room: RoomModel): RoomModel => ({
  ...room,
  knownDevices: room.knownDevices.map((item) => ({
    ...item,
    sourceEvidenceIds: [...item.sourceEvidenceIds],
  })),
  knownBehaviors: room.knownBehaviors.map((item) => ({
    ...item,
    sourceEvidenceIds: [...item.sourceEvidenceIds],
  })),
  evidence: room.evidence.map(cloneEvidence),
});

const cloneHouse = (house: HouseModel): HouseModel => ({
  ...house,
  identity: {
    ...house.identity,
    occupants: { ...house.identity.occupants },
    routineProfile: { ...house.identity.routineProfile },
    climateContext: house.identity.climateContext
      ? { ...house.identity.climateContext }
      : undefined,
  },
  understanding: {
    ...house.understanding,
    knownAreas: [...house.understanding.knownAreas],
    unknownAreas: [...house.understanding.unknownAreas],
  },
  rooms: house.rooms.map(cloneRoom),
  energyBaseline: house.energyBaseline.seasonalPattern
    ? {
        ...house.energyBaseline,
        seasonalPattern: {
          summer: house.energyBaseline.seasonalPattern.summer
            ? { ...house.energyBaseline.seasonalPattern.summer }
            : undefined,
          winter: house.energyBaseline.seasonalPattern.winter
            ? { ...house.energyBaseline.seasonalPattern.winter }
            : undefined,
        },
      }
    : { ...house.energyBaseline },
  activeHypotheses: house.activeHypotheses.map(cloneHypothesis),
  discardedHypotheses: house.discardedHypotheses.map(cloneHypothesis),
  confirmedHypotheses: house.confirmedHypotheses.map(cloneHypothesis),
  memory: {
    facts: house.memory.facts.map((item) => ({
      ...item,
      sourceEvidenceIds: [...item.sourceEvidenceIds],
    })),
    stablePatterns: house.memory.stablePatterns.map((item) => ({
      ...item,
      sourceEvidenceIds: [...item.sourceEvidenceIds],
    })),
    lastUpdatedAt: house.memory.lastUpdatedAt,
  },
  knowledge: {
    learnedConcepts: house.knowledge.learnedConcepts.map((item) => ({
      ...item,
    })),
  },
  nextInvestigation: {
    ...house.nextInvestigation,
    suggestedQuestion: cloneQuestion(house.nextInvestigation.suggestedQuestion),
  },
});

const inferPolarity = (answer: InvestigationAnswer): AnswerPolarity => {
  if (typeof answer.value === 'boolean') {
    return answer.value ? 'positive' : 'negative';
  }

  if (typeof answer.value === 'number') {
    if (answer.value > 0) return 'positive';
    if (answer.value === 0) return 'negative';
  }

  const normalized = `${answer.label} ${answer.value ?? ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (
    normalized.includes('nao sei') ||
    normalized.includes('não sei') ||
    normalized.includes('unknown')
  ) {
    return 'unknown';
  }

  if (
    normalized === 'sim' ||
    normalized.startsWith('sim ') ||
    normalized.includes(' todos os dias') ||
    normalized.includes('diario') ||
    normalized.includes('presente')
  ) {
    return 'positive';
  }

  if (
    normalized === 'nao' ||
    normalized.startsWith('nao ') ||
    normalized.startsWith('não ') ||
    normalized.includes('ausente')
  ) {
    return 'negative';
  }

  return 'unknown';
};

const isExplicitUnknownAnswer = (answer: InvestigationAnswer) =>
  `${answer.label} ${answer.value ?? ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .includes('nao sei');

const upgradeConfidenceConservatively = (confidence: ConfidenceLevel): ConfidenceLevel => {
  if (confidence === 'unknown') return 'low';
  if (confidence === 'low') return 'medium';
  return confidence;
};

const downgradeConfidenceConservatively = (confidence: ConfidenceLevel): ConfidenceLevel => {
  if (confidence === 'high') return 'medium';
  if (confidence === 'medium') return 'low';
  return confidence;
};

const confidenceFromUnderstanding = (room: RoomModel): ConfidenceLevel => {
  if (room.understandingLevel >= 70) return 'medium';
  if (room.understandingLevel > 0) return room.confidence === 'unknown' ? 'low' : room.confidence;
  return room.confidence;
};

const buildEvidenceDescription = (clue: HouseClue, answer: InvestigationAnswer) => {
  const prompt = clue.question?.question?.trim() || clue.title.trim() || answer.questionId;
  return `Resposta para "${prompt}": ${answer.label}.`;
};

const resolveRelatedHypothesisId = (house: HouseModel, clue: HouseClue, answer: InvestigationAnswer) =>
  clue.relatedHypothesisId ??
  clue.question?.relatedHypothesisId ??
  house.activeHypotheses.find((item) => item.nextQuestion?.id === answer.questionId)?.id;

const resolveRelatedRoomId = (
  house: HouseModel,
  clue: HouseClue,
  hypothesisId?: string
) => {
  const hypothesis = hypothesisId
    ? house.activeHypotheses.find((item) => item.id === hypothesisId)
    : undefined;

  return clue.relatedRoomId ?? clue.question?.relatedRoomId ?? hypothesis?.relatedRooms[0];
};

const appendEvidenceIfMissing = (room: RoomModel, evidence: Evidence) => {
  if (!room.evidence.some((item) => item.id === evidence.id)) {
    room.evidence.push(evidence);
  }
};

const upsertMemoryFact = (
  house: HouseModel,
  clue: HouseClue,
  answer: InvestigationAnswer,
  evidenceId: string,
  room?: RoomModel
) => {
  const factId = `memory-fact-answer-${answer.id}`;
  const statement = room
    ? `${room.label}: ${answer.label}.`
    : clue.question?.question
      ? `${clue.question.question} ${answer.label}.`
      : answer.label;
  const existingIndex = house.memory.facts.findIndex((item) => item.id === factId);
  const fact = {
    id: factId,
    statement,
    category: room ? 'room' : 'behavior',
    confidence: 'low' as ConfidenceLevel,
    sourceEvidenceIds: [evidenceId],
    createdAt: answer.createdAt,
    lastConfirmedAt: answer.createdAt,
  };

  if (existingIndex >= 0) {
    house.memory.facts[existingIndex] = fact;
  } else {
    house.memory.facts.push(fact);
  }

  house.memory.lastUpdatedAt = answer.createdAt;
};

const buildSpeechHint = (
  status: InvestigationRuntimeStatus,
  nextFocus: HouseModel['nextInvestigation']['focus']
): ResultSpeechHint => {
  switch (status) {
    case 'hypothesis_strengthened':
      return {
        tone: 'steady',
        message: 'Entendi. Isso ajuda bastante.',
        nextLine: 'Agora essa pista ficou um pouco mais forte.',
      };
    case 'hypothesis_weakened':
      return {
        tone: 'careful',
        message: 'Entendi.',
        nextLine: 'Entao talvez o caminho seja outro.',
      };
    case 'new_context_added':
      return {
        tone: 'curious',
        message: 'Entendi.',
        nextLine: 'Ja conheco melhor essa parte da casa.',
      };
    case 'needs_more_context':
      return {
        tone: 'careful',
        message: 'Entendi.',
        nextLine: 'Ainda falta contexto para fechar essa pista.',
      };
    case 'answer_recorded':
      return {
        tone: 'steady',
        message: 'Entendi.',
        nextLine:
          nextFocus !== 'unknown'
            ? 'Vou seguir por essa direcao.'
            : undefined,
      };
    default:
      return {
        tone: 'exploratory',
        message: 'Entendi.',
      };
  }
};

export const applyInvestigationAnswer = (
  input: ApplyInvestigationAnswerInput
): InvestigationRuntimeResult => {
  const { clue, answer } = input;
  const updatedHouse = cloneHouse(input.house);
  const relatedHypothesisId = resolveRelatedHypothesisId(updatedHouse, clue, answer);
  const relatedRoomId = resolveRelatedRoomId(updatedHouse, clue, relatedHypothesisId);
  const relatedRoom = relatedRoomId
    ? updatedHouse.rooms.find((room) => room.id === relatedRoomId)
    : undefined;
  const relatedHypothesis = relatedHypothesisId
    ? updatedHouse.activeHypotheses.find((item) => item.id === relatedHypothesisId)
    : undefined;
  const polarity = inferPolarity(answer);
  const newEvidence: Evidence = {
    id: `evidence-answer-${answer.id}`,
    source: 'user_answer',
    description: buildEvidenceDescription(clue, answer),
    relatedRoomId: relatedRoom?.id,
    relatedHypothesisId: relatedHypothesis?.id,
    confidence: polarity === 'unknown' ? 'low' : 'medium',
    createdAt: answer.createdAt,
  };

  if (relatedRoom) {
    appendEvidenceIfMissing(relatedRoom, newEvidence);
    relatedRoom.understandingLevel = clampPercent(relatedRoom.understandingLevel + 12);
    relatedRoom.confidence = confidenceFromUnderstanding({
      ...relatedRoom,
      confidence: upgradeConfidenceConservatively(relatedRoom.confidence),
    });
    relatedRoom.mainMystery =
      relatedRoom.understandingLevel >= 60 ? undefined : relatedRoom.mainMystery;
  }

  upsertMemoryFact(updatedHouse, clue, answer, newEvidence.id, relatedRoom);

  let status: InvestigationRuntimeStatus = 'answer_recorded';
  let affectedHypotheses: EnergyHypothesis[] = [];

  if (relatedHypothesis) {
    relatedHypothesis.evidenceIds = unique([...relatedHypothesis.evidenceIds, newEvidence.id]);

    if (polarity === 'positive') {
      relatedHypothesis.confidence = upgradeConfidenceConservatively(relatedHypothesis.confidence);
      relatedHypothesis.status =
        relatedHypothesis.status === 'confirmed' ? 'confirmed' : 'strengthened';
      status = 'hypothesis_strengthened';
    } else if (polarity === 'negative') {
      relatedHypothesis.confidence = downgradeConfidenceConservatively(relatedHypothesis.confidence);
      relatedHypothesis.status = 'investigating';
      status = 'hypothesis_weakened';
    } else {
      relatedHypothesis.status = relatedHypothesis.status === 'new' ? 'investigating' : relatedHypothesis.status;
      status = 'needs_more_context';
    }

    affectedHypotheses = [cloneHypothesis(relatedHypothesis)];
  } else if (relatedRoom) {
    status = polarity === 'unknown' && isExplicitUnknownAnswer(answer)
      ? 'needs_more_context'
      : 'new_context_added';
  } else if (polarity === 'unknown') {
    status = 'needs_more_context';
  }

  const areaLabel = relatedRoom ? roomAreaByType[relatedRoom.type] : undefined;
  updatedHouse.understanding = {
    ...updatedHouse.understanding,
    overallLevel: clampPercent(
      updatedHouse.understanding.overallLevel +
        (relatedRoom ? 6 : 3) +
        (relatedHypothesis && polarity === 'positive' ? 4 : 0)
    ),
    explainedBillShare: clampPercent(
      updatedHouse.understanding.explainedBillShare + (relatedHypothesis ? 5 : relatedRoom ? 2 : 1)
    ),
    confidence:
      status === 'hypothesis_strengthened'
        ? upgradeConfidenceConservatively(updatedHouse.understanding.confidence)
        : updatedHouse.understanding.confidence === 'unknown'
          ? 'low'
          : updatedHouse.understanding.confidence,
    knownAreas: unique(
      areaLabel
        ? [...updatedHouse.understanding.knownAreas, areaLabel]
        : [...updatedHouse.understanding.knownAreas]
    ),
    unknownAreas: updatedHouse.understanding.unknownAreas.filter((item) => {
      if (!areaLabel) return true;
      return !item.toLowerCase().includes(areaLabel);
    }),
    lastMeaningfulDiscoveryAt: answer.createdAt,
  };

  updatedHouse.updatedAt = answer.createdAt;
  const curiosity = runCuriosityEngine({
    house: updatedHouse,
    recentAnswer: answer,
    recentStatus: status,
    recentRoomId: relatedRoom?.id,
    recentHypothesisId: relatedHypothesis?.id,
  });
  const baseSession =
    input.session ??
    createInvestigationSession({
      nextInvestigation: input.house.nextInvestigation,
      clue,
      openedAt: input.house.updatedAt,
    });
  const sessionResult = updateInvestigationSession({
    session: baseSession,
    previousHouse: input.house,
    updatedHouse,
    answer,
    newEvidenceId: newEvidence.id,
    runtimeStatus: status,
    curiosity,
  });
  const nextInvestigation = sessionResult.selectedNextInvestigation;
  updatedHouse.nextInvestigation = {
    ...nextInvestigation,
    suggestedQuestion: cloneQuestion(nextInvestigation.suggestedQuestion),
  };
  const learningHandoff = sessionResult.session.handoffCandidate
    ? prepareLearningEngineHandoff({
        house: updatedHouse,
        session: sessionResult.session,
      })
    : undefined;
  const learningEvaluation =
    learningHandoff?.status === 'ready_for_evaluation' && learningHandoff.evaluationInput
      ? evaluateLearningCandidate(learningHandoff.evaluationInput)
      : undefined;
  const knowledgePromotion =
    learningHandoff?.status === 'ready_for_evaluation' &&
    learningHandoff.evaluationInput &&
    learningEvaluation?.status === 'accepted_as_knowledge_candidate'
      ? promoteKnowledgeCandidate({
          evaluation: learningEvaluation,
          evaluationInput: learningHandoff.evaluationInput,
          promotedAt: updatedHouse.updatedAt,
        })
      : undefined;
  const knowledgePersistenceBoundary =
    knowledgePromotion?.status === 'promoted_to_candidate' && knowledgePromotion.candidateKnowledge
      ? evaluateKnowledgePersistenceBoundary({
          candidateKnowledge: knowledgePromotion.candidateKnowledge,
        })
      : undefined;

  return {
    updatedHouse,
    newEvidence,
    affectedHypotheses,
    nextInvestigation,
    investigationSession: sessionResult.session,
    learningHandoff,
    learningEvaluation,
    knowledgePromotion,
    knowledgePersistenceBoundary,
    resultSpeechHint: buildSpeechHint(status, nextInvestigation.focus),
    status,
  };
};
