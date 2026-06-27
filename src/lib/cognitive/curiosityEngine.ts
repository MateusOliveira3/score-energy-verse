import type {
  ConfidenceLevel,
  CuriosityEngineResult,
  CuriositySignal,
  EnergyHypothesis,
  ExpectedGain,
  HouseModel,
  InvestigationAnswer,
  InvestigationFocus,
  InvestigationRuntimeStatus,
  NextBestQuestion,
  NextInvestigation,
  PotentialImpact,
  RoomModel,
  RoomType,
} from '@/lib/cognitive/types';

export interface RunCuriosityEngineInput {
  house: HouseModel;
  recentAnswer?: InvestigationAnswer;
  recentStatus?: InvestigationRuntimeStatus;
  recentRoomId?: string;
  recentHypothesisId?: string;
}

const confidenceRank: Record<ConfidenceLevel, number> = {
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const questionGainRank: Record<ExpectedGain, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const impactRank: Record<PotentialImpact, number> = {
  low: 1,
  medium: 2,
  high: 3,
  unknown: 0,
};

const focusByRoomType: Record<RoomType, InvestigationFocus> = {
  bathroom: 'bathroom',
  kitchen: 'kitchen',
  laundry: 'laundry',
  bedroom: 'unknown',
  living_room: 'routine',
  garage: 'unknown',
  outdoor: 'unknown',
  comfort: 'comfort',
  unknown: 'unknown',
};

const cloneQuestion = (question?: NextBestQuestion): NextBestQuestion | undefined =>
  question
    ? {
        ...question,
        options: question.options ? [...question.options] : undefined,
      }
    : undefined;

const getRoomById = (house: HouseModel, roomId?: string) =>
  roomId ? house.rooms.find((room) => room.id === roomId) : undefined;

const getQuestionFocus = (house: HouseModel, hypothesis: EnergyHypothesis) => {
  const room = getRoomById(house, hypothesis.nextQuestion?.relatedRoomId ?? hypothesis.relatedRooms[0]);
  return focusByRoomType[room?.type ?? 'unknown'];
};

const scoreQuestionHypothesis = (hypothesis: EnergyHypothesis) =>
  questionGainRank[hypothesis.nextQuestion?.expectedGain ?? 'low'] * 30 +
  impactRank[hypothesis.potentialImpact] * 16 +
  confidenceRank[hypothesis.confidence] * 10 +
  hypothesis.evidenceIds.length +
  (hypothesis.status === 'strengthened' ? 6 : hypothesis.status === 'investigating' ? 3 : 0);

const scoreRoomGap = (
  room: RoomModel,
  input: RunCuriosityEngineInput
) =>
  Math.max(0, 60 - room.understandingLevel) +
  (room.mainMystery ? 12 : 0) +
  (room.id === input.recentRoomId ? 12 : 0) +
  (input.recentStatus === 'hypothesis_weakened' && room.id === input.recentRoomId ? 10 : 0) +
  (input.recentStatus === 'needs_more_context' && room.id === input.recentRoomId ? 8 : 0) +
  Math.max(0, 3 - confidenceRank[room.confidence]) * 4;

const buildQuestionSignals = (input: RunCuriosityEngineInput): CuriositySignal[] =>
  input.house.activeHypotheses
    .filter(
      (hypothesis) =>
        hypothesis.nextQuestion?.shouldAskNow &&
        hypothesis.nextQuestion.id !== input.recentAnswer?.questionId
    )
    .map((hypothesis) => {
      const question = hypothesis.nextQuestion!;
      const room = getRoomById(input.house, question.relatedRoomId ?? hypothesis.relatedRooms[0]);

      return {
        id: `curiosity-question-${hypothesis.id}`,
        kind: 'question_gap',
        focus: getQuestionFocus(input.house, hypothesis),
        score: scoreQuestionHypothesis(hypothesis),
        reason:
          input.recentAnswer && input.recentHypothesisId !== hypothesis.id
            ? 'A curiosidade agora migra para outra lacuna ainda aberta e informativamente valiosa.'
            : question.reason,
        expectedDiscovery: hypothesis.description,
        relatedRoomId: room?.id,
        relatedHypothesisId: hypothesis.id,
        suggestedQuestion: cloneQuestion(question),
      };
    });

const buildRoomGapSignals = (input: RunCuriosityEngineInput): CuriositySignal[] =>
  input.house.rooms
    .filter(
      (room) =>
        (room.evidence.length > 0 || room.id === input.recentRoomId) &&
        Boolean(room.mainMystery) ||
        ((room.evidence.length > 0 || room.id === input.recentRoomId) &&
          room.understandingLevel < 55) ||
        (room.id === input.recentRoomId && input.recentStatus === 'hypothesis_weakened')
    )
    .map((room) => ({
      id: `curiosity-room-${room.id}`,
      kind: 'room_gap',
      focus: focusByRoomType[room.type],
      score: scoreRoomGap(room, input),
      reason:
        input.recentStatus === 'hypothesis_weakened' && room.id === input.recentRoomId
          ? `Essa resposta mudou a leitura, mas ${room.label.toLowerCase()} continua aberta como fronteira real de entendimento.`
          : input.recentStatus === 'needs_more_context' && room.id === input.recentRoomId
            ? `A resposta ainda nao fecha ${room.label.toLowerCase()}, entao a curiosidade permanece nesse ambiente.`
            : `Ainda existe incerteza relevante em ${room.label.toLowerCase()}.`,
      expectedDiscovery:
        room.mainMystery ?? `O que ainda pesa em ${room.label.toLowerCase()} neste ciclo.`,
      relatedRoomId: room.id,
    }));

const buildBaselineSignals = (input: RunCuriosityEngineInput): CuriositySignal[] => {
  if (input.house.energyBaseline.monthsUsed === 0) {
    return [
      {
        id: 'curiosity-baseline-not-started',
        kind: 'baseline_gap',
        focus: 'unknown',
        score: 15,
        reason: 'A leitura cognitiva ainda nao comecou porque nenhuma fatura valida foi incorporada.',
        expectedDiscovery: 'Primeira referencia real de consumo e custo.',
      },
    ];
  }

  if (input.house.energyBaseline.monthsUsed < 3) {
    return [
      {
        id: 'curiosity-baseline-building',
        kind: 'baseline_gap',
        focus: 'seasonality',
        score: 26 - input.house.energyBaseline.monthsUsed,
        reason:
          'O historico ainda esta em construcao e a curiosidade precisa de mais ciclos antes de leituras sazonais fortes.',
        expectedDiscovery: 'Como o padrao muda entre ciclos sucessivos.',
      },
    ];
  }

  return [];
};

const buildTariffSignals = (input: RunCuriosityEngineInput): CuriositySignal[] => {
  const hasTariffGap = input.house.understanding.unknownAreas.some((item) => {
    const normalized = item.toLowerCase();
    return normalized.includes('custo') || normalized.includes('tarif');
  });

  if (!hasTariffGap) {
    return [];
  }

  return [
    {
      id: 'curiosity-tariff-gap',
      kind: 'tariff_gap',
      focus: 'tariff',
      score: 21,
      reason:
        'Custo medio e concentracao de uso ainda parecem ser a principal fronteira de entendimento.',
      expectedDiscovery: 'Se o custo esta mais ligado ao horario de uso do que ao volume absoluto.',
    },
  ];
};

const buildUnknownSignal = (house: HouseModel): CuriositySignal => ({
  id: 'curiosity-unknown',
  kind: 'unknown_gap',
  focus: house.nextInvestigation.focus,
  score: 0,
  reason:
    house.nextInvestigation.reason ||
    'A casa ganhou mais uma pista e aguarda o proximo sinal confiavel.',
  expectedDiscovery: house.nextInvestigation.expectedDiscovery,
});

const toNextInvestigation = (signal: CuriositySignal): NextInvestigation => ({
  focus: signal.focus,
  reason: signal.reason,
  suggestedQuestion: cloneQuestion(signal.suggestedQuestion),
  expectedDiscovery: signal.expectedDiscovery,
});

export const runCuriosityEngine = (
  input: RunCuriosityEngineInput
): CuriosityEngineResult => {
  const signals = [
    ...buildQuestionSignals(input),
    ...buildRoomGapSignals(input),
    ...buildBaselineSignals(input),
    ...buildTariffSignals(input),
  ].sort((left, right) => right.score - left.score);

  const dominantSignal = signals[0] ?? buildUnknownSignal(input.house);

  return {
    nextInvestigation: toNextInvestigation(dominantSignal),
    dominantSignal,
    signals,
  };
};
