import type {
  ConfidenceLevel,
  EnergyHypothesis,
  ExpectedGain,
  HouseClue,
  HouseClueAction,
  HouseClueConfidence,
  HouseModel,
  NextBestQuestion,
  RoomModel,
} from '@/lib/cognitive/types';

const confidenceRank: Record<ConfidenceLevel, number> = {
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const roomLabelMap: Record<string, string> = {
  bathroom: 'banheiro',
  kitchen: 'cozinha',
  laundry: 'lavanderia',
  bedroom: 'quarto',
  living_room: 'sala',
  comfort: 'conforto da casa',
  garage: 'garagem',
  outdoor: 'area externa',
  unknown: 'casa',
};

const questionValueRank: Record<ExpectedGain, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const unique = <T>(values: T[]) => Array.from(new Set(values));

const getRoomById = (house: HouseModel, roomId?: string) =>
  roomId ? house.rooms.find((room) => room.id === roomId) : undefined;

const getReadableRoomLabel = (room?: RoomModel) =>
  room ? roomLabelMap[room.type] ?? room.label.toLowerCase() : 'casa';

const capClueConfidence = (
  desired: HouseClueConfidence,
  evidenceCount: number
): HouseClueConfidence => {
  if (evidenceCount <= 0) {
    return desired === 'unknown' ? 'unknown' : 'low';
  }

  if (evidenceCount === 1 && desired === 'high') {
    return 'medium';
  }

  return desired;
};

const buildQuestionAction = (question: NextBestQuestion): HouseClueAction => ({
  kind: 'ask_question',
  label: 'Confirmar esse detalhe',
  reason: question.reason,
});

const buildQuestionClue = (house: HouseModel): HouseClue | null => {
  const question = house.nextInvestigation.suggestedQuestion;
  if (!question || !question.shouldAskNow || question.expectedGain !== 'high') {
    return null;
  }

  const relatedHypothesis = question.relatedHypothesisId
    ? house.activeHypotheses.find((item) => item.id === question.relatedHypothesisId)
    : undefined;
  const room = getRoomById(house, question.relatedRoomId ?? relatedHypothesis?.relatedRooms[0]);
  const evidenceIds = unique([
    ...(relatedHypothesis?.evidenceIds ?? []),
    ...(room?.evidence.map((item) => item.id) ?? []),
  ]);
  const roomLabel = getReadableRoomLabel(room);

  return {
    id: `house-clue-question-${question.id}`,
    kind: 'question',
    title:
      room && room.type !== 'unknown'
        ? `Achei uma pista no ${roomLabel}.`
        : 'Tem uma pergunta que pode clarear esta casa.',
    shortMessage:
      room && room.type !== 'unknown'
        ? `Achei uma pista no ${roomLabel}.`
        : 'Tem uma mudanca neste ciclo que vale atencao.',
    explanation: house.nextInvestigation.expectedDiscovery
      ? `${question.reason} ${house.nextInvestigation.expectedDiscovery}`
      : question.reason,
    confidence: capClueConfidence(
      relatedHypothesis?.confidence ?? room?.confidence ?? 'low',
      evidenceIds.length
    ),
    relatedRoomId: room?.id,
    relatedHypothesisId: relatedHypothesis?.id,
    evidenceIds,
    suggestedAction: buildQuestionAction(question),
    shouldAskQuestion: true,
    question,
  };
};

const scoreHypothesis = (hypothesis: EnergyHypothesis) =>
  confidenceRank[hypothesis.confidence] * 10 +
  (hypothesis.status === 'strengthened' ? 6 : hypothesis.status === 'investigating' ? 3 : 0) +
  hypothesis.evidenceIds.length;

const buildHypothesisClue = (house: HouseModel): HouseClue | null => {
  const candidate = [...house.activeHypotheses]
    .filter(
      (hypothesis) =>
        confidenceRank[hypothesis.confidence] >= confidenceRank.medium ||
        hypothesis.status === 'strengthened'
    )
    .sort((left, right) => scoreHypothesis(right) - scoreHypothesis(left))[0];

  if (!candidate) {
    return null;
  }

  const room = getRoomById(house, candidate.relatedRooms[0]);
  const roomLabel = getReadableRoomLabel(room);
  const evidenceIds = unique(candidate.evidenceIds);

  return {
    id: `house-clue-hypothesis-${candidate.id}`,
    kind: 'hypothesis',
    title:
      room && room.type !== 'unknown'
        ? `Achei uma pista no ${roomLabel}.`
        : 'Tem uma mudanca neste ciclo que vale atencao.',
    shortMessage:
      room && room.type !== 'unknown'
        ? `Achei uma pista no ${roomLabel}.`
        : 'Tem uma mudanca neste ciclo que vale atencao.',
    explanation: candidate.description,
    confidence: capClueConfidence(candidate.confidence, evidenceIds.length),
    relatedRoomId: room?.id,
    relatedHypothesisId: candidate.id,
    evidenceIds,
    suggestedAction: {
      kind: 'review_clue',
      label: 'Acompanhar essa pista',
      reason: 'Ainda preciso de mais contexto antes de transformar essa pista em certeza.',
    },
    shouldAskQuestion: false,
  };
};

const scoreMysteryRoom = (room: RoomModel) =>
  (room.mainMystery ? 10 : 0) + (100 - room.understandingLevel) + (3 - confidenceRank[room.confidence]);

const buildRoomMysteryClue = (house: HouseModel): HouseClue | null => {
  const room = [...house.rooms]
    .filter((item) => item.mainMystery)
    .sort((left, right) => scoreMysteryRoom(right) - scoreMysteryRoom(left))[0];

  if (!room?.mainMystery) {
    return null;
  }

  const roomLabel = getReadableRoomLabel(room);
  const evidenceIds = unique(room.evidence.map((item) => item.id));

  return {
    id: `house-clue-room-${room.id}`,
    kind: 'room_mystery',
    title: `A ${roomLabel} ainda e um misterio para mim.`,
    shortMessage: `A ${roomLabel} ainda e um misterio para mim.`,
    explanation: room.mainMystery,
    confidence: capClueConfidence(room.confidence, evidenceIds.length),
    relatedRoomId: room.id,
    evidenceIds,
    suggestedAction: {
      kind: 'review_clue',
      label: 'Explorar esse ponto',
      reason: 'Entender melhor esse ambiente tende a reduzir uma lacuna importante da casa.',
    },
    shouldAskQuestion: false,
  };
};

const buildBaselineClue = (house: HouseModel): HouseClue | null => {
  if (house.energyBaseline.status !== 'building' && house.energyBaseline.status !== 'not_started') {
    return null;
  }

  const hasAnyEvidence =
    house.rooms.some((room) => room.evidence.length > 0) ||
    house.activeHypotheses.some((hypothesis) => hypothesis.evidenceIds.length > 0);

  if (house.energyBaseline.status === 'building') {
    return {
      id: 'house-clue-baseline-building',
      kind: 'baseline',
      title: 'Ainda estou conhecendo sua casa.',
      shortMessage: 'Ainda estou conhecendo sua casa.',
      explanation:
        'Ja existem sinais suficientes para comecar a leitura, mas ainda faltam alguns ciclos para entender o comportamento da casa com mais estabilidade.',
      confidence: capClueConfidence('medium', hasAnyEvidence ? 1 : 0),
      evidenceIds: [],
      suggestedAction: {
        kind: 'collect_more_history',
        label: 'Continuar observando os proximos ciclos',
        reason: 'Mais historico ajuda a separar melhor padrao, mudanca e sazonalidade.',
      },
      shouldAskQuestion: false,
    };
  }

  if (!hasAnyEvidence) {
    return {
      id: 'house-clue-discovery-initial',
      kind: 'discovery',
      title: 'Ainda estou conhecendo sua casa.',
      shortMessage: 'Ainda estou conhecendo sua casa.',
      explanation:
        'Ainda nao tenho pistas suficientes para apontar uma causa com seguranca. Primeiro preciso observar mais sinais reais da residencia.',
      confidence: 'low',
      evidenceIds: [],
      suggestedAction: {
        kind: 'wait_for_more_data',
        label: 'Trazer mais sinais da casa',
        reason: 'Sem evidencias reais, qualquer conclusao agora seria cedo demais.',
      },
      shouldAskQuestion: false,
    };
  }

  return {
    id: 'house-clue-baseline-early',
    kind: 'baseline',
    title: 'Ainda estou conhecendo sua casa.',
    shortMessage: 'Ainda estou conhecendo sua casa.',
    explanation:
      'Ja existem algumas pistas, mas a linha de base ainda esta em construcao e pede mais observacao antes de conclusoes fortes.',
    confidence: 'low',
    evidenceIds: [],
    suggestedAction: {
      kind: 'observe_next_cycle',
      label: 'Observar mais um ciclo',
      reason: 'Mais continuidade ajuda a transformar sinais iniciais em entendimento confiavel.',
    },
    shouldAskQuestion: false,
  };
};

const buildFallbackClue = (house: HouseModel): HouseClue => ({
  id: 'house-clue-fallback',
  kind: 'discovery',
  title: 'Ainda estou juntando as primeiras pistas.',
  shortMessage: 'Ainda estou conhecendo sua casa.',
  explanation:
    house.understanding.mainMystery ??
    'Ainda nao encontrei uma pista forte o suficiente para apontar um foco principal sem correr o risco de forcar a leitura.',
  confidence: 'low',
  evidenceIds: [],
  suggestedAction: {
    kind: 'wait_for_more_data',
    label: 'Esperar novas evidencias',
    reason: 'Prefiro manter a leitura honesta antes de sugerir uma causa sem base suficiente.',
  },
  shouldAskQuestion: false,
});

export const selectPrimaryHouseClue = (house: HouseModel): HouseClue =>
  buildQuestionClue(house) ??
  buildHypothesisClue(house) ??
  buildRoomMysteryClue(house) ??
  buildBaselineClue(house) ??
  buildFallbackClue(house);
