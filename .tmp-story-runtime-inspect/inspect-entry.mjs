// src/lib/cognitive/curiosityEngine.ts
var confidenceRank = {
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3
};
var questionGainRank = {
  low: 1,
  medium: 2,
  high: 3
};
var impactRank = {
  low: 1,
  medium: 2,
  high: 3,
  unknown: 0
};
var focusByRoomType = {
  bathroom: "bathroom",
  kitchen: "kitchen",
  laundry: "laundry",
  bedroom: "unknown",
  living_room: "routine",
  garage: "unknown",
  outdoor: "unknown",
  comfort: "comfort",
  unknown: "unknown"
};
var cloneQuestion = (question) => question ? {
  ...question,
  options: question.options ? [...question.options] : void 0
} : void 0;
var getRoomById = (house, roomId) => roomId ? house.rooms.find((room) => room.id === roomId) : void 0;
var getQuestionFocus = (house, hypothesis) => {
  const room = getRoomById(house, hypothesis.nextQuestion?.relatedRoomId ?? hypothesis.relatedRooms[0]);
  return focusByRoomType[room?.type ?? "unknown"];
};
var scoreQuestionHypothesis = (hypothesis) => questionGainRank[hypothesis.nextQuestion?.expectedGain ?? "low"] * 30 + impactRank[hypothesis.potentialImpact] * 16 + confidenceRank[hypothesis.confidence] * 10 + hypothesis.evidenceIds.length + (hypothesis.status === "strengthened" ? 6 : hypothesis.status === "investigating" ? 3 : 0);
var scoreRoomGap = (room, input) => Math.max(0, 60 - room.understandingLevel) + (room.mainMystery ? 12 : 0) + (room.id === input.recentRoomId ? 12 : 0) + (input.recentStatus === "hypothesis_weakened" && room.id === input.recentRoomId ? 10 : 0) + (input.recentStatus === "needs_more_context" && room.id === input.recentRoomId ? 8 : 0) + Math.max(0, 3 - confidenceRank[room.confidence]) * 4;
var buildQuestionSignals = (input) => input.house.activeHypotheses.filter(
  (hypothesis) => hypothesis.nextQuestion?.shouldAskNow && hypothesis.nextQuestion.id !== input.recentAnswer?.questionId
).map((hypothesis) => {
  const question = hypothesis.nextQuestion;
  const room = getRoomById(input.house, question.relatedRoomId ?? hypothesis.relatedRooms[0]);
  return {
    id: `curiosity-question-${hypothesis.id}`,
    kind: "question_gap",
    focus: getQuestionFocus(input.house, hypothesis),
    score: scoreQuestionHypothesis(hypothesis),
    reason: input.recentAnswer && input.recentHypothesisId !== hypothesis.id ? "A curiosidade agora migra para outra lacuna ainda aberta e informativamente valiosa." : question.reason,
    expectedDiscovery: hypothesis.description,
    relatedRoomId: room?.id,
    relatedHypothesisId: hypothesis.id,
    suggestedQuestion: cloneQuestion(question)
  };
});
var buildRoomGapSignals = (input) => input.house.rooms.filter(
  (room) => (room.evidence.length > 0 || room.id === input.recentRoomId) && Boolean(room.mainMystery) || (room.evidence.length > 0 || room.id === input.recentRoomId) && room.understandingLevel < 55 || room.id === input.recentRoomId && input.recentStatus === "hypothesis_weakened"
).map((room) => ({
  id: `curiosity-room-${room.id}`,
  kind: "room_gap",
  focus: focusByRoomType[room.type],
  score: scoreRoomGap(room, input),
  reason: input.recentStatus === "hypothesis_weakened" && room.id === input.recentRoomId ? `Essa resposta mudou a leitura, mas ${room.label.toLowerCase()} continua aberta como fronteira real de entendimento.` : input.recentStatus === "needs_more_context" && room.id === input.recentRoomId ? `A resposta ainda nao fecha ${room.label.toLowerCase()}, entao a curiosidade permanece nesse ambiente.` : `Ainda existe incerteza relevante em ${room.label.toLowerCase()}.`,
  expectedDiscovery: room.mainMystery ?? `O que ainda pesa em ${room.label.toLowerCase()} neste ciclo.`,
  relatedRoomId: room.id
}));
var buildBaselineSignals = (input) => {
  if (input.house.energyBaseline.monthsUsed === 0) {
    return [
      {
        id: "curiosity-baseline-not-started",
        kind: "baseline_gap",
        focus: "unknown",
        score: 15,
        reason: "A leitura cognitiva ainda nao comecou porque nenhuma fatura valida foi incorporada.",
        expectedDiscovery: "Primeira referencia real de consumo e custo."
      }
    ];
  }
  if (input.house.energyBaseline.monthsUsed < 3) {
    return [
      {
        id: "curiosity-baseline-building",
        kind: "baseline_gap",
        focus: "seasonality",
        score: 26 - input.house.energyBaseline.monthsUsed,
        reason: "O historico ainda esta em construcao e a curiosidade precisa de mais ciclos antes de leituras sazonais fortes.",
        expectedDiscovery: "Como o padrao muda entre ciclos sucessivos."
      }
    ];
  }
  return [];
};
var buildTariffSignals = (input) => {
  const hasTariffGap = input.house.understanding.unknownAreas.some((item) => {
    const normalized = item.toLowerCase();
    return normalized.includes("custo") || normalized.includes("tarif");
  });
  if (!hasTariffGap) {
    return [];
  }
  return [
    {
      id: "curiosity-tariff-gap",
      kind: "tariff_gap",
      focus: "tariff",
      score: 21,
      reason: "Custo medio e concentracao de uso ainda parecem ser a principal fronteira de entendimento.",
      expectedDiscovery: "Se o custo esta mais ligado ao horario de uso do que ao volume absoluto."
    }
  ];
};
var buildUnknownSignal = (house) => ({
  id: "curiosity-unknown",
  kind: "unknown_gap",
  focus: house.nextInvestigation.focus,
  score: 0,
  reason: house.nextInvestigation.reason || "A casa ganhou mais uma pista e aguarda o proximo sinal confiavel.",
  expectedDiscovery: house.nextInvestigation.expectedDiscovery
});
var toNextInvestigation = (signal) => ({
  focus: signal.focus,
  reason: signal.reason,
  suggestedQuestion: cloneQuestion(signal.suggestedQuestion),
  expectedDiscovery: signal.expectedDiscovery
});
var runCuriosityEngine = (input) => {
  const signals = [
    ...buildQuestionSignals(input),
    ...buildRoomGapSignals(input),
    ...buildBaselineSignals(input),
    ...buildTariffSignals(input)
  ].sort((left, right) => right.score - left.score);
  const dominantSignal = signals[0] ?? buildUnknownSignal(input.house);
  return {
    nextInvestigation: toNextInvestigation(dominantSignal),
    dominantSignal,
    signals
  };
};

// src/lib/energyKnowledge.ts
var ENERGY_KNOWLEDGE_CATALOG = [
  {
    id: "bill_comparison",
    category: "consumo",
    title: "Comparacao entre ciclos",
    message: "Comparar meses parecidos ajuda a perceber mudancas reais sem confundir clima, rotina e tarifa."
  },
  {
    id: "shower_efficiency",
    category: "consumo",
    title: "Chuveiro eficiente",
    message: "Banhos mais curtos podem reduzir significativamente o consumo associado ao aquecimento da agua."
  },
  {
    id: "standby_consumption",
    category: "habitos",
    title: "Consumo em stand-by",
    message: "Aparelhos em espera continuam consumindo energia ao longo do dia, mesmo sem uso ativo."
  },
  {
    id: "thermal_comfort",
    category: "conforto_termico",
    title: "Conforto termico",
    message: "Ventilacao, sombra e isolamento simples podem melhorar o conforto sem depender apenas de equipamentos."
  },
  {
    id: "efficient_cooling",
    category: "climatizacao",
    title: "Climatizacao eficiente",
    message: "Climatizacao costuma render mais quando a casa esta fechada e o tempo de uso fica sob controle."
  },
  {
    id: "peak_usage_habits",
    category: "habitos",
    title: "Horario de maior uso",
    message: "Concentrar varios usos intensos no mesmo horario tende a deixar o consumo mais pesado naquele periodo."
  },
  {
    id: "sustainable_routine",
    category: "sustentabilidade",
    title: "Rotina mais sustentavel",
    message: "Pequenos ajustes repetidos na rotina costumam gerar aprendizado energetico mais consistente do que mudancas bruscas."
  },
  {
    id: "solar_potential",
    category: "energia_solar",
    title: "Potencial solar",
    message: "Antes de avaliar energia solar, vale entender quando e como a casa mais consome energia ao longo do ciclo."
  }
];
var KNOWLEDGE_BY_ID = Object.fromEntries(
  ENERGY_KNOWLEDGE_CATALOG.map((knowledge) => [knowledge.id, knowledge])
);
var normalizeKnowledgeState = (knowledge) => {
  const learned = Object.fromEntries(
    Object.entries(knowledge?.learned ?? {}).filter(
      ([knowledgeId, isLearned]) => knowledgeId in KNOWLEDGE_BY_ID && isLearned === true
    )
  );
  return {
    learned,
    lastLearnedId: typeof knowledge?.lastLearnedId === "string" && knowledge.lastLearnedId in KNOWLEDGE_BY_ID && learned[knowledge.lastLearnedId] === true ? knowledge.lastLearnedId : void 0
  };
};
var getEnergyKnowledgeById = (knowledgeId) => KNOWLEDGE_BY_ID[knowledgeId];
var isEnergyKnowledgeLearned = (knowledgeState, knowledgeId) => normalizeKnowledgeState(knowledgeState).learned[knowledgeId] === true;
var getLearnedEnergyKnowledgeItems = (knowledgeState) => ENERGY_KNOWLEDGE_CATALOG.filter(
  (knowledge) => isEnergyKnowledgeLearned(knowledgeState, knowledge.id)
);

// src/lib/cognitive/buildHouseModelFromJourney.ts
var ROOM_DRAFTS = [
  { id: "room-bathroom", type: "bathroom", label: "Banheiro" },
  { id: "room-kitchen", type: "kitchen", label: "Cozinha" },
  { id: "room-laundry", type: "laundry", label: "Lavanderia" },
  { id: "room-bedroom", type: "bedroom", label: "Quarto" },
  { id: "room-living-room", type: "living_room", label: "Sala" },
  { id: "room-comfort", type: "comfort", label: "Conforto termico" },
  { id: "room-garage", type: "garage", label: "Garagem" }
];
var EMPTY_TIMESTAMP = "1970-01-01T00:00:00.000Z";
var sanitizeId = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
var unique = (values) => Array.from(new Set(values));
var clampPercent = (value) => Math.min(Math.max(Math.round(value), 0), 100);
var isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var normalizeInvoice = (invoice) => {
  if (!invoice?.fingerprint || !isNonEmptyString(invoice.month) || !invoice.parser?.fields) {
    return null;
  }
  return {
    fingerprint: invoice.fingerprint,
    month: invoice.month,
    consumption: isFiniteNumber(invoice.consumption) ? invoice.consumption : void 0,
    totalValue: isFiniteNumber(invoice.totalValue) ? invoice.totalValue : void 0,
    uploadedAt: isNonEmptyString(invoice.uploadedAt) ? invoice.uploadedAt : void 0,
    parser: invoice.parser
  };
};
var normalizeInvoices = (currentInvoice2, invoiceHistory) => {
  const invoices = [normalizeInvoice(currentInvoice2), ...(invoiceHistory ?? []).map(normalizeInvoice)].filter((invoice) => Boolean(invoice));
  const seen = /* @__PURE__ */ new Set();
  return invoices.filter((invoice) => {
    if (seen.has(invoice.fingerprint)) {
      return false;
    }
    seen.add(invoice.fingerprint);
    return true;
  });
};
var resolveTimestamp = (input, invoices) => {
  const candidates = [
    input.updatedAt,
    input.createdAt,
    input.energyBehaviorProfile?.updatedAt,
    ...invoices.map((invoice) => invoice.uploadedAt),
    input.strategicAnswers?.usage_period?.updatedAt,
    input.strategicAnswers?.electric_shower?.updatedAt,
    input.strategicAnswers?.primary_goal?.updatedAt
  ].filter(isNonEmptyString);
  return candidates[0] ?? EMPTY_TIMESTAMP;
};
var mapUsagePeriod = (strategicAnswers, energyBehaviorProfile) => {
  const direct = strategicAnswers?.usage_period;
  if (direct?.status === "answered") {
    if (direct.value === "morning" || direct.value === "afternoon" || direct.value === "night") {
      return direct.value;
    }
    if (direct.value === "unknown") {
      return "unknown";
    }
  }
  const routine = energyBehaviorProfile?.habits?.dominantUsageRoutine;
  if (routine === "manha") return "morning";
  if (routine === "tarde") return "afternoon";
  if (routine === "noite") return "night";
  if (routine === "misto") return "mixed";
  const period = energyBehaviorProfile?.habits?.dominantUsagePeriod;
  if (period === "misto") return "mixed";
  return void 0;
};
var mapSeasonalSensitivity = (energyBehaviorProfile) => {
  const thermal = energyBehaviorProfile?.habits?.thermalSensitivity;
  const climateUsage = energyBehaviorProfile?.habits?.climateUsageIntensity;
  if (thermal === "sim" || climateUsage === "sim") return "high";
  if (thermal === "nao_sei" || climateUsage === "sazonal") return "medium";
  if (thermal === "nao") return "low";
  return "unknown";
};
var mapResidenceType = (energyBehaviorProfile) => {
  const residenceType = energyBehaviorProfile?.habits?.residenceType;
  if (residenceType === "casa" || residenceType === "apartamento" || residenceType === "sobrado") {
    return residenceType;
  }
  return "unknown";
};
var toConfidence = (count, thresholds) => {
  if (count >= thresholds.high) return "high";
  if (count >= thresholds.medium) return "medium";
  if (count >= thresholds.low) return "low";
  return "unknown";
};
var roomConfidence = (count) => count === 0 ? "unknown" : toConfidence(count, { low: 1, medium: 2, high: 4 });
var understandingConfidence = (count) => count === 0 ? "low" : toConfidence(count, { low: 1, medium: 4, high: 8 });
var inferFactCategory = (statement) => {
  const normalized = statement.toLowerCase();
  if (normalized.includes("pessoa") || normalized.includes("morador")) return "occupants";
  if (normalized.includes("tarifa") || normalized.includes("custo")) return "tariff";
  if (normalized.includes("inverno") || normalized.includes("verao") || normalized.includes("estacao") || normalized.includes("sazon")) {
    return "seasonality";
  }
  if (normalized.includes("banho") || normalized.includes("chuveiro") || normalized.includes("cozinha") || normalized.includes("lavanderia") || normalized.includes("quarto") || normalized.includes("sala")) {
    return "room";
  }
  if (normalized.includes("ar-condicionado") || normalized.includes("geladeira") || normalized.includes("equipamento")) {
    return "device";
  }
  if (normalized.includes("rotina") || normalized.includes("periodo") || normalized.includes("manha") || normalized.includes("tarde") || normalized.includes("noite")) {
    return "routine";
  }
  return "behavior";
};
var roomIdByType = (roomType) => ROOM_DRAFTS.find((room) => room.type === roomType)?.id ?? void 0;
var buildEvidence = (input, invoices, now) => {
  const evidence = [];
  const pushEvidence = (item) => {
    if (!evidence.some((entry) => entry.id === item.id)) {
      evidence.push(item);
    }
  };
  const currentInvoice2 = invoices[0];
  if (currentInvoice2) {
    pushEvidence({
      id: "evidence-invoice-current",
      source: "invoice",
      description: `Fatura ${currentInvoice2.month} carregada${isFiniteNumber(currentInvoice2.consumption) ? ` com ${currentInvoice2.consumption} kWh` : ""}${isFiniteNumber(currentInvoice2.totalValue) ? ` e total de R$ ${currentInvoice2.totalValue}` : ""}.`,
      confidence: "medium",
      createdAt: currentInvoice2.uploadedAt ?? now
    });
  }
  if (invoices.length > 1) {
    pushEvidence({
      id: "evidence-history-invoices",
      source: "history",
      description: `Historico com ${invoices.length} faturas registradas para comparacao inicial.`,
      confidence: invoices.length >= 3 ? "medium" : "low",
      createdAt: invoices[0]?.uploadedAt ?? now
    });
  }
  const usagePeriodAnswer = input.strategicAnswers?.usage_period;
  if (usagePeriodAnswer?.status === "answered" && isNonEmptyString(usagePeriodAnswer.label)) {
    pushEvidence({
      id: "evidence-answer-usage-period",
      source: "user_answer",
      description: `Usuario informou periodo de uso predominante: ${usagePeriodAnswer.label}.`,
      confidence: "medium",
      createdAt: usagePeriodAnswer.updatedAt,
      relatedRoomId: roomIdByType("living_room")
    });
  }
  const electricShowerAnswer = input.strategicAnswers?.electric_shower;
  if (electricShowerAnswer?.status === "answered" && isNonEmptyString(electricShowerAnswer.label)) {
    pushEvidence({
      id: "evidence-answer-electric-shower",
      source: "user_answer",
      description: `Usuario informou frequencia de uso de chuveiro eletrico: ${electricShowerAnswer.label}.`,
      confidence: "medium",
      createdAt: electricShowerAnswer.updatedAt,
      relatedRoomId: roomIdByType("bathroom")
    });
  }
  const primaryGoalAnswer = input.strategicAnswers?.primary_goal;
  if (primaryGoalAnswer?.status === "answered" && isNonEmptyString(primaryGoalAnswer.label)) {
    pushEvidence({
      id: "evidence-answer-primary-goal",
      source: "user_answer",
      description: `Usuario informou objetivo principal atual: ${primaryGoalAnswer.label}.`,
      confidence: "medium",
      createdAt: primaryGoalAnswer.updatedAt
    });
  }
  const showers = input.energyBehaviorProfile?.appliances?.showers;
  if (isFiniteNumber(showers) && showers > 0) {
    pushEvidence({
      id: "evidence-answer-showers-count",
      source: "user_answer",
      description: `Perfil energetico registra ${showers} chuveiro(s) associado(s) a residencia.`,
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("bathroom")
    });
  }
  if (input.energyBehaviorProfile?.appliances?.hasElectricShower === true) {
    pushEvidence({
      id: "evidence-answer-has-electric-shower",
      source: "user_answer",
      description: "Perfil energetico confirma presenca de chuveiro eletrico.",
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("bathroom")
    });
  }
  if (input.energyBehaviorProfile?.appliances?.hasAirConditioning === true) {
    pushEvidence({
      id: "evidence-answer-air-conditioning",
      source: "user_answer",
      description: "Perfil energetico confirma uso de ar-condicionado.",
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("comfort")
    });
  }
  if (input.energyBehaviorProfile?.appliances?.hasExtraFridge === true) {
    pushEvidence({
      id: "evidence-answer-extra-fridge",
      source: "user_answer",
      description: "Perfil energetico indica geladeira extra em operacao.",
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("kitchen")
    });
  }
  if (isNonEmptyString(input.energyBehaviorProfile?.habits?.residenceType)) {
    pushEvidence({
      id: "evidence-answer-residence-type",
      source: "user_answer",
      description: `Perfil energetico registra residencia do tipo ${input.energyBehaviorProfile.habits.residenceType}.`,
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("living_room")
    });
  }
  if (isNonEmptyString(input.energyBehaviorProfile?.habits?.roomCountRange)) {
    pushEvidence({
      id: "evidence-answer-room-count",
      source: "user_answer",
      description: `Perfil energetico registra faixa de comodos principais: ${input.energyBehaviorProfile.habits.roomCountRange}.`,
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("living_room")
    });
  }
  if (input.energyBehaviorProfile?.habits?.hasChildren === true) {
    pushEvidence({
      id: "evidence-answer-children",
      source: "user_answer",
      description: "Perfil energetico registra presenca de criancas na residencia.",
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("living_room")
    });
  }
  if (input.energyBehaviorProfile?.habits?.hasElderly === true) {
    pushEvidence({
      id: "evidence-answer-elderly",
      source: "user_answer",
      description: "Perfil energetico registra presenca de idosos na residencia.",
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("living_room")
    });
  }
  if (isFiniteNumber(input.energyBehaviorProfile?.appliances?.bathrooms)) {
    pushEvidence({
      id: "evidence-answer-bathrooms-count",
      source: "user_answer",
      description: `Perfil energetico registra ${input.energyBehaviorProfile.appliances.bathrooms} banheiro(s) na residencia.`,
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("bathroom")
    });
  }
  if (isNonEmptyString(input.energyBehaviorProfile?.appliances?.showerHeatingType)) {
    pushEvidence({
      id: "evidence-answer-shower-heating",
      source: "user_answer",
      description: `Perfil energetico registra aquecimento de banho: ${input.energyBehaviorProfile.appliances.showerHeatingType}.`,
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("bathroom")
    });
  }
  if (isFiniteNumber(input.energyBehaviorProfile?.appliances?.airConditioningCount) && input.energyBehaviorProfile.appliances.airConditioningCount > 0) {
    pushEvidence({
      id: "evidence-answer-air-conditioning-count",
      source: "user_answer",
      description: `Perfil energetico registra aproximadamente ${input.energyBehaviorProfile.appliances.airConditioningCount} aparelho(s) de ar-condicionado.`,
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("comfort")
    });
  }
  if (isNonEmptyString(input.energyBehaviorProfile?.appliances?.cookingType)) {
    pushEvidence({
      id: "evidence-answer-cooking-type",
      source: "user_answer",
      description: `Perfil energetico registra cozinha com uso principal ${input.energyBehaviorProfile.appliances.cookingType}.`,
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("kitchen")
    });
  }
  if (input.energyBehaviorProfile?.appliances?.hasElectricOven === true) {
    pushEvidence({
      id: "evidence-answer-electric-oven",
      source: "user_answer",
      description: "Perfil energetico indica forno eletrico na cozinha.",
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("kitchen")
    });
  }
  if (input.energyBehaviorProfile?.appliances?.hasWashingMachine === true) {
    pushEvidence({
      id: "evidence-answer-washing-machine",
      source: "user_answer",
      description: "Perfil energetico indica maquina de lavar na lavanderia.",
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("laundry")
    });
  }
  if (input.energyBehaviorProfile?.appliances?.hasDryer === true) {
    pushEvidence({
      id: "evidence-answer-dryer",
      source: "user_answer",
      description: "Perfil energetico indica secadora na lavanderia.",
      confidence: "medium",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("laundry")
    });
  }
  if (input.energyBehaviorProfile?.habits?.usesHeavyLoadsAtNight === true) {
    pushEvidence({
      id: "evidence-answer-heavy-loads-night",
      source: "user_answer",
      description: "Perfil energetico indica cargas pesadas durante a noite.",
      confidence: "low",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("laundry")
    });
  }
  if (input.energyBehaviorProfile?.habits?.laundryFrequency && input.energyBehaviorProfile.habits.laundryFrequency !== "nao_informado") {
    pushEvidence({
      id: "evidence-answer-laundry-frequency",
      source: "user_answer",
      description: `Perfil energetico registra frequencia de lavanderia: ${input.energyBehaviorProfile.habits.laundryFrequency}.`,
      confidence: "low",
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType("laundry")
    });
  }
  if (isNonEmptyString(input.analysisSummary?.headline)) {
    pushEvidence({
      id: "evidence-analysis-headline",
      source: "derived_analysis",
      description: `Analise derivada do ciclo: ${input.analysisSummary.headline}.`,
      confidence: "low",
      createdAt: now
    });
  }
  input.analysisSummary?.evidenceItems?.slice(0, 2).forEach((item, index) => {
    if (!isNonEmptyString(item.label) || !isNonEmptyString(item.value)) {
      return;
    }
    pushEvidence({
      id: `evidence-analysis-item-${index + 1}`,
      source: "derived_analysis",
      description: `${item.label}: ${item.value}.`,
      confidence: "low",
      createdAt: now
    });
  });
  input.analysisSummary?.behaviorHighlights?.slice(0, 2).forEach((item, index) => {
    if (!isNonEmptyString(item)) {
      return;
    }
    pushEvidence({
      id: `evidence-analysis-behavior-${index + 1}`,
      source: "derived_analysis",
      description: item,
      confidence: "low",
      createdAt: now
    });
  });
  return evidence;
};
var buildIdentity = (input) => {
  const mainUsePeriod = mapUsagePeriod(input.strategicAnswers, input.energyBehaviorProfile);
  const occupantsCount = isFiniteNumber(input.profile?.peopleCount) && input.profile.peopleCount > 0 ? input.profile.peopleCount : void 0;
  return {
    residenceType: mapResidenceType(input.energyBehaviorProfile),
    occupants: {
      count: occupantsCount,
      confidence: occupantsCount ? "medium" : "unknown"
    },
    routineProfile: {
      mainUsePeriod,
      confidence: mainUsePeriod && mainUsePeriod !== "unknown" ? "medium" : "unknown"
    },
    climateContext: isNonEmptyString(input.profile?.location) || input.energyBehaviorProfile ? {
      city: isNonEmptyString(input.profile?.location) ? input.profile.location : void 0,
      seasonalSensitivity: mapSeasonalSensitivity(input.energyBehaviorProfile)
    } : void 0
  };
};
var buildRooms = (input, evidence, now) => ROOM_DRAFTS.map((draft) => {
  const roomEvidence = evidence.filter((item) => item.relatedRoomId === draft.id);
  const roomKeywords = roomEvidence.map((item) => item.description.toLowerCase()).join(" ");
  const devices = draft.type === "bathroom" && input.energyBehaviorProfile?.appliances?.hasElectricShower === true ? [
    {
      id: "device-electric-shower",
      label: "Chuveiro eletrico",
      roomId: draft.id,
      confidence: "medium",
      sourceEvidenceIds: roomEvidence.map((item) => item.id),
      createdAt: now
    }
  ] : draft.type === "kitchen" && input.energyBehaviorProfile?.appliances?.hasElectricOven === true ? [
    {
      id: "device-electric-oven",
      label: "Forno eletrico",
      roomId: draft.id,
      confidence: "medium",
      sourceEvidenceIds: roomEvidence.map((item) => item.id),
      createdAt: now
    }
  ] : draft.type === "comfort" && input.energyBehaviorProfile?.appliances?.hasAirConditioning === true ? [
    {
      id: "device-air-conditioning",
      label: "Ar-condicionado",
      roomId: draft.id,
      confidence: "medium",
      sourceEvidenceIds: roomEvidence.map((item) => item.id),
      createdAt: now
    }
  ] : draft.type === "laundry" && input.energyBehaviorProfile?.appliances?.hasWashingMachine === true ? [
    {
      id: "device-washing-machine",
      label: "Maquina de lavar",
      roomId: draft.id,
      confidence: "medium",
      sourceEvidenceIds: roomEvidence.map((item) => item.id),
      createdAt: now
    },
    ...input.energyBehaviorProfile?.appliances?.hasDryer === true ? [
      {
        id: "device-dryer",
        label: "Secadora",
        roomId: draft.id,
        confidence: "medium",
        sourceEvidenceIds: roomEvidence.map((item) => item.id),
        createdAt: now
      }
    ] : []
  ] : draft.type === "kitchen" && input.energyBehaviorProfile?.appliances?.hasExtraFridge === true ? [
    {
      id: "device-extra-fridge",
      label: "Geladeira extra",
      roomId: draft.id,
      confidence: "medium",
      sourceEvidenceIds: roomEvidence.map((item) => item.id),
      createdAt: now
    }
  ] : [];
  const behaviors = draft.type === "living_room" && mapUsagePeriod(input.strategicAnswers, input.energyBehaviorProfile) ? [
    {
      id: "behavior-main-use-period",
      label: "Periodo principal de uso",
      roomId: draft.id,
      routineWindow: mapUsagePeriod(input.strategicAnswers, input.energyBehaviorProfile),
      confidence: "medium",
      sourceEvidenceIds: roomEvidence.map((item) => item.id),
      createdAt: now
    }
  ] : draft.type === "laundry" && input.energyBehaviorProfile?.habits?.laundryFrequency && input.energyBehaviorProfile.habits.laundryFrequency !== "nao_informado" ? [
    {
      id: "behavior-laundry-frequency",
      label: `Frequencia de lavanderia: ${input.energyBehaviorProfile.habits.laundryFrequency}`,
      roomId: draft.id,
      confidence: "low",
      sourceEvidenceIds: roomEvidence.map((item) => item.id),
      createdAt: now
    }
  ] : [];
  return {
    id: draft.id,
    type: draft.type,
    label: draft.label,
    understandingLevel: clampPercent(roomEvidence.length * 18),
    confidence: roomConfidence(roomEvidence.length),
    knownDevices: devices,
    knownBehaviors: behaviors,
    mainHypothesis: draft.type === "bathroom" && roomKeywords.includes("chuveiro") ? "Peso do banho no consumo ainda precisa ser calibrado." : draft.type === "comfort" && roomKeywords.includes("ar-condicionado") ? "Climatizacao pode explicar parte relevante do consumo." : void 0,
    mainMystery: roomEvidence.length === 0 ? `Ainda faltam evidencias confiaveis sobre ${draft.label.toLowerCase()}.` : void 0,
    evidence: roomEvidence
  };
});
var buildHypotheses = (input, evidence) => {
  const activeHypotheses = [];
  const bathroomEvidence = evidence.filter((item) => item.relatedRoomId === roomIdByType("bathroom"));
  if (bathroomEvidence.length > 0) {
    activeHypotheses.push({
      id: "hypothesis-bathroom-shower",
      title: "Impacto do banho no consumo",
      description: "Ha sinais de que o uso de chuveiro eletrico influencia o consumo, mas a participacao exata ainda nao foi confirmada.",
      status: bathroomEvidence.length >= 2 ? "strengthened" : "investigating",
      relatedRooms: [roomIdByType("bathroom") ?? "room-bathroom"],
      evidenceIds: bathroomEvidence.map((item) => item.id),
      confidence: bathroomEvidence.length >= 2 ? "medium" : "low",
      potentialImpact: input.energyBehaviorProfile?.appliances?.hasElectricShower === true ? "high" : "medium",
      nextQuestion: input.energyBehaviorProfile?.appliances?.hasElectricShower === true ? void 0 : {
        id: "next-question-bathroom",
        question: "Existe chuveiro eletrico nesta residencia?",
        reason: "Confirmar essa presenca ajuda a calibrar melhor o peso do banho no ciclo.",
        expectedGain: "high",
        relatedRoomId: roomIdByType("bathroom"),
        relatedHypothesisId: "hypothesis-bathroom-shower",
        answerType: "yes_no",
        options: ["Sim", "Nao", "Nao sei"],
        shouldAskNow: true
      }
    });
  }
  const comfortEvidence = evidence.filter((item) => item.relatedRoomId === roomIdByType("comfort"));
  if (comfortEvidence.length > 0 || input.energyBehaviorProfile?.intentions?.thermalComfortInterest === "sim") {
    activeHypotheses.push({
      id: "hypothesis-comfort-climatization",
      title: "Peso da climatizacao",
      description: "Ha sinais de climatizacao ou sensibilidade termica, mas a relevancia desse fator ainda e conservadora.",
      status: comfortEvidence.length >= 2 ? "strengthened" : "investigating",
      relatedRooms: [roomIdByType("comfort") ?? "room-comfort"],
      evidenceIds: comfortEvidence.map((item) => item.id),
      confidence: comfortEvidence.length >= 2 ? "medium" : "low",
      potentialImpact: input.energyBehaviorProfile?.appliances?.hasAirConditioning === true ? "high" : "medium",
      nextQuestion: input.energyBehaviorProfile?.appliances?.hasAirConditioning === true ? void 0 : {
        id: "next-question-comfort",
        question: "Ha ar-condicionado em uso frequente nesta residencia?",
        reason: "Isso ajuda a estimar melhor o peso da climatizacao no consumo.",
        expectedGain: "medium",
        relatedRoomId: roomIdByType("comfort"),
        relatedHypothesisId: "hypothesis-comfort-climatization",
        answerType: "yes_no",
        options: ["Sim", "Nao", "Nao sei"],
        shouldAskNow: true
      }
    });
  }
  const routineEvidence = evidence.filter(
    (item) => item.id === "evidence-answer-usage-period" || item.id === "evidence-answer-heavy-loads-night" || item.id === "evidence-answer-laundry-frequency"
  );
  if (routineEvidence.length > 0) {
    activeHypotheses.push({
      id: "hypothesis-routine-usage",
      title: "Rotina de consumo concentrado",
      description: "A distribuicao do uso ao longo do dia pode explicar parte do custo, mas ainda precisa de mais contexto.",
      status: routineEvidence.length >= 2 ? "strengthened" : "investigating",
      relatedRooms: [roomIdByType("living_room") ?? "room-living-room"],
      evidenceIds: routineEvidence.map((item) => item.id),
      confidence: routineEvidence.length >= 2 ? "medium" : "low",
      potentialImpact: "medium",
      nextQuestion: input.strategicAnswers?.usage_period?.status === "answered" ? void 0 : {
        id: "next-question-routine",
        question: "Seu consumo costuma ser maior de manha, tarde ou noite?",
        reason: "Essa resposta ajuda a reduzir incerteza sem criar fadiga.",
        expectedGain: "medium",
        relatedRoomId: roomIdByType("living_room"),
        relatedHypothesisId: "hypothesis-routine-usage",
        answerType: "single_choice",
        options: ["Manha", "Tarde", "Noite", "Nao sei"],
        shouldAskNow: true
      }
    });
  }
  const tariffEvidence = evidence.filter(
    (item) => item.id === "evidence-invoice-current" || item.id.startsWith("evidence-analysis-item-")
  );
  if (tariffEvidence.length > 0) {
    activeHypotheses.push({
      id: "hypothesis-tariff-cost",
      title: "Pressao de custo medio",
      description: "A fatura sugere que custo medio por kWh ou concentracao de uso pode merecer investigacao adicional.",
      status: tariffEvidence.length >= 3 ? "strengthened" : "investigating",
      relatedRooms: [],
      evidenceIds: tariffEvidence.map((item) => item.id),
      confidence: tariffEvidence.length >= 3 ? "medium" : "low",
      potentialImpact: "medium"
    });
  }
  const seasonalityEvidence = evidence.filter(
    (item) => item.id === "evidence-history-invoices" || item.description.toLowerCase().includes("estacao")
  );
  if (seasonalityEvidence.length > 0) {
    activeHypotheses.push({
      id: "hypothesis-seasonality",
      title: "Influencias sazonais do ciclo",
      description: "O historico ja permite observar variacao temporal, mas ainda nao ha base suficiente para conclusao forte.",
      status: seasonalityEvidence.length >= 2 ? "strengthened" : "investigating",
      relatedRooms: [],
      evidenceIds: seasonalityEvidence.map((item) => item.id),
      confidence: seasonalityEvidence.length >= 2 ? "medium" : "low",
      potentialImpact: "medium"
    });
  }
  return {
    activeHypotheses,
    discardedHypotheses: [],
    confirmedHypotheses: []
  };
};
var buildMemory = (snapshot, evidence, now) => {
  const invoiceEvidenceIds = evidence.filter((item) => item.source === "invoice").map((item) => item.id);
  const userAnswerEvidenceIds = evidence.filter((item) => item.source === "user_answer").map((item) => item.id);
  const derivedEvidenceIds = evidence.filter((item) => item.source === "derived_analysis" || item.source === "history").map((item) => item.id);
  const facts = [];
  const patterns = [];
  const factStatements = unique([
    ...(snapshot?.memoryProfile?.items ?? []).map((item) => `${item.label}: ${item.value}`),
    ...snapshot?.memoryInsights?.facts ?? [],
    ...snapshot?.memoryInsights?.confirmedContext ?? []
  ]).filter(isNonEmptyString);
  const patternStatements = unique([
    ...snapshot?.memoryProfile?.confirmedSignals ?? [],
    ...snapshot?.memoryInsights?.observedBehavior ?? []
  ]).filter(isNonEmptyString);
  factStatements.forEach((statement, index) => {
    facts.push({
      id: `memory-fact-${index + 1}`,
      statement,
      category: inferFactCategory(statement),
      confidence: "medium",
      sourceEvidenceIds: inferFactCategory(statement) === "behavior" ? derivedEvidenceIds : inferFactCategory(statement) === "routine" ? userAnswerEvidenceIds : invoiceEvidenceIds.length > 0 ? invoiceEvidenceIds : userAnswerEvidenceIds,
      createdAt: now,
      lastConfirmedAt: now
    });
  });
  patternStatements.forEach((statement, index) => {
    patterns.push({
      id: `memory-pattern-${index + 1}`,
      label: statement,
      description: statement,
      confidence: "medium",
      sourceEvidenceIds: userAnswerEvidenceIds.length > 0 ? userAnswerEvidenceIds : derivedEvidenceIds,
      createdAt: now,
      lastConfirmedAt: now
    });
  });
  return {
    facts,
    stablePatterns: patterns,
    lastUpdatedAt: now
  };
};
var mapKnowledgeRoom = (knowledgeId) => {
  if (knowledgeId === "shower_efficiency") return roomIdByType("bathroom");
  if (knowledgeId === "thermal_comfort" || knowledgeId === "efficient_cooling") {
    return roomIdByType("comfort");
  }
  if (knowledgeId === "standby_consumption" || knowledgeId === "peak_usage_habits") {
    return roomIdByType("living_room");
  }
  return void 0;
};
var buildKnowledge = (knowledgeState, snapshot, now) => {
  const learnedConcepts = [];
  const explicitItems = knowledgeState ? getLearnedEnergyKnowledgeItems({
    learned: knowledgeState.learned ?? {},
    lastLearnedId: knowledgeState.lastLearnedId
  }) : [];
  const fallbackItems = explicitItems.length > 0 ? [] : (snapshot?.memoryKnowledge?.items ?? []).filter((item) => item.learned);
  const catalogItems = explicitItems.length > 0 ? explicitItems : fallbackItems;
  catalogItems.forEach((item) => {
    const catalog = "message" in item ? item : getEnergyKnowledgeById(item.id);
    if (!catalog) {
      return;
    }
    learnedConcepts.push({
      id: `knowledge-${catalog.id}`,
      title: catalog.title,
      explanation: catalog.message,
      status: "understood",
      relatedRoomId: mapKnowledgeRoom(catalog.id),
      firstIntroducedAt: now,
      lastReinforcedAt: now
    });
  });
  return { learnedConcepts };
};
var buildBaseline = (invoices) => {
  if (invoices.length === 0) {
    return {
      status: "not_started",
      monthsUsed: 0
    };
  }
  const numericConsumptions = invoices.map((invoice) => invoice.consumption).filter(isFiniteNumber);
  const numericValues = invoices.map((invoice) => invoice.totalValue).filter(isFiniteNumber);
  const costPerKwh = invoices.filter(
    (invoice) => isFiniteNumber(invoice.totalValue) && isFiniteNumber(invoice.consumption) && invoice.consumption > 0
  ).map((invoice) => invoice.totalValue / invoice.consumption);
  const average = (values) => values.length > 0 ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : void 0;
  return {
    status: invoices.length >= 3 ? "established" : "building",
    monthsUsed: invoices.length,
    averageConsumptionKwh: average(numericConsumptions),
    averageBillValue: average(numericValues),
    averageCostPerKwh: average(costPerKwh)
  };
};
var buildUnderstanding = (input, invoices, evidence, memory, knowledge, hypotheses) => {
  const knownAreas = unique([
    invoices.length > 0 ? "fatura atual" : "",
    invoices.length > 1 ? "historico de consumo" : "",
    input.energyBehaviorProfile?.habits?.residenceType ? "estrutura da residencia" : "",
    input.energyBehaviorProfile?.habits?.hasChildren === true || input.energyBehaviorProfile?.habits?.hasElderly === true ? "ocupacao" : "",
    input.energyBehaviorProfile?.appliances?.hasElectricShower === true || isNonEmptyString(input.energyBehaviorProfile?.appliances?.showerHeatingType) || input.strategicAnswers?.electric_shower?.status === "answered" ? "banho" : "",
    input.energyBehaviorProfile?.appliances?.hasAirConditioning === true ? "climatizacao" : "",
    input.energyBehaviorProfile?.appliances?.cookingType ? "cozinha" : "",
    input.energyBehaviorProfile?.appliances?.hasWashingMachine === true ? "lavanderia" : "",
    input.strategicAnswers?.usage_period?.status === "answered" ? "rotina" : "",
    knowledge.learnedConcepts.length > 0 ? "conhecimento energetico" : ""
  ].filter(isNonEmptyString));
  const unknownAreas = unique([
    !input.energyBehaviorProfile?.habits?.residenceType ? "tipo de residencia" : "",
    !input.energyBehaviorProfile?.habits?.roomCountRange ? "porte da casa" : "",
    input.energyBehaviorProfile?.appliances?.hasElectricShower !== true && !isNonEmptyString(input.energyBehaviorProfile?.appliances?.showerHeatingType) && input.strategicAnswers?.electric_shower?.status !== "answered" ? "como o banho funciona" : "",
    input.energyBehaviorProfile?.appliances?.hasAirConditioning !== true && input.energyBehaviorProfile?.intentions?.thermalComfortInterest !== "sim" ? "peso da climatizacao" : "",
    !input.energyBehaviorProfile?.appliances?.cookingType ? "como a cozinha funciona" : "",
    input.energyBehaviorProfile?.appliances?.hasWashingMachine !== true ? "rotina de lavanderia" : "",
    input.strategicAnswers?.usage_period?.status !== "answered" ? "rotina de maior uso" : "",
    invoices.length < 2 ? "sazonalidade" : "",
    isNonEmptyString(input.analysisSummary?.whatMattersNext) ? input.analysisSummary?.whatMattersNext ?? "" : "",
    ...input.memorySnapshot?.memoryGaps?.items ?? []
  ].filter(isNonEmptyString));
  const evidenceStrength = evidence.length + memory.facts.length + memory.stablePatterns.length + knowledge.learnedConcepts.length + hypotheses.length;
  const overallLevel = clampPercent(
    (invoices.length > 0 ? 18 : 0) + Math.min(16, evidence.length * 4) + Math.min(12, memory.facts.length * 3) + Math.min(8, knowledge.learnedConcepts.length * 2) + (invoices.length > 1 ? 8 : 0)
  );
  const explainedBillShare = clampPercent(
    invoices.length === 0 ? 0 : 10 + Math.min(12, hypotheses.length * 4) + Math.min(10, evidence.filter((item) => item.source === "user_answer").length * 3) + (invoices.length > 1 ? 8 : 0)
  );
  return {
    overallLevel,
    explainedBillShare,
    confidence: understandingConfidence(evidenceStrength),
    knownAreas,
    unknownAreas,
    mainKnownPattern: input.memorySnapshot?.memoryInsights?.observedBehavior?.[0] ?? input.analysisSummary?.behaviorHighlights?.[0] ?? memory.stablePatterns[0]?.label,
    mainMystery: input.memorySnapshot?.memoryGaps?.items?.[0] ?? input.analysisSummary?.whatMattersNext ?? (invoices.length === 0 ? "Ainda nao existe fatura suficiente para localizar o principal fator de consumo." : void 0),
    lastMeaningfulDiscoveryAt: evidence.length > 0 ? evidence[0].createdAt : void 0
  };
};
var buildHouseModelFromJourney = (input) => {
  const invoices = normalizeInvoices(input.currentInvoice, input.invoiceHistory);
  const now = resolveTimestamp(input, invoices);
  const evidence = buildEvidence(input, invoices, now);
  const identity = buildIdentity(input);
  const memory = buildMemory(input.memorySnapshot, evidence, now);
  const knowledge = buildKnowledge(input.knowledgeState, input.memorySnapshot, now);
  const { activeHypotheses, discardedHypotheses, confirmedHypotheses } = buildHypotheses(
    input,
    evidence
  );
  const understanding = buildUnderstanding(
    input,
    invoices,
    evidence,
    memory,
    knowledge,
    activeHypotheses
  );
  const rooms = buildRooms(input, evidence, now);
  const energyBaseline = buildBaseline(invoices);
  const draftHouse = {
    id: `house-${sanitizeId(input.userId)}`,
    ownerId: input.userId,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    identity,
    understanding,
    rooms,
    energyBaseline,
    activeHypotheses,
    discardedHypotheses,
    confirmedHypotheses,
    memory,
    knowledge,
    nextInvestigation: {
      focus: "unknown",
      reason: ""
    }
  };
  const nextInvestigation = runCuriosityEngine({
    house: draftHouse
  }).nextInvestigation;
  return {
    ...draftHouse,
    nextInvestigation
  };
};

// src/lib/cognitive/coreSpeechEngine.ts
var FORBIDDEN_TERMS = [
  "analise concluida",
  "insight detectado",
  "modulo",
  "diagnostico energetico realizado",
  "padrao de consumo indica otimizacao",
  "a causa foi identificada",
  "economia"
];
var normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
var ensureSafeCopy = (value) => {
  const normalized = normalize(value);
  if (FORBIDDEN_TERMS.some((term) => normalized.includes(term))) {
    throw new Error(`Unsafe Core speech copy: ${value}`);
  }
  return value;
};
var confidenceLabelMap = {
  unknown: "Ainda estou juntando as primeiras pistas.",
  low: "Ainda nao tenho certeza, mas isso vale olhar.",
  medium: "Ja tenho uma pista razoavel daqui.",
  high: "Essa pista esta bem consistente."
};
var toneByKind = (kind, confidence) => {
  if (kind === "question") return "curious";
  if (kind === "baseline" || kind === "discovery") return "exploratory";
  if (confidence === "low" || confidence === "unknown") return "careful";
  return "steady";
};
var buildOpening = (clue) => {
  if (clue.kind === "question" || clue.kind === "hypothesis") {
    return "Sua conta ja me deu uma pista.";
  }
  if (clue.kind === "room_mystery") return clue.shortMessage;
  if (clue.kind === "baseline" || clue.kind === "discovery") {
    return "Ainda estou conhecendo sua casa.";
  }
  return clue.shortMessage;
};
var splitNarrative = (value) => {
  const normalized = value.trim();
  const separatorMatch = normalized.match(/^(.+?\.)\s+(.+)$/);
  if (!separatorMatch) {
    return {
      opening: normalized,
      remainder: ""
    };
  }
  return {
    opening: separatorMatch[1].trim(),
    remainder: separatorMatch[2].trim()
  };
};
var shouldUseEnergyStory = (story) => Boolean(story?.coreNarrative?.trim().length);
var buildStoryOpening = (story) => splitNarrative(story.coreNarrative).opening;
var formatCurrency = (value) => typeof value === "number" && Number.isFinite(value) ? `R$ ${value.toFixed(2)}` : void 0;
var formatInvoiceSignal = (currentInvoice2) => {
  if (!currentInvoice2) {
    return void 0;
  }
  const month = typeof currentInvoice2.month === "string" && currentInvoice2.month.trim().length > 0 ? currentInvoice2.month.trim() : void 0;
  const consumption = typeof currentInvoice2.consumption === "number" && Number.isFinite(currentInvoice2.consumption) ? `${currentInvoice2.consumption} kWh` : void 0;
  const totalValue = formatCurrency(currentInvoice2.totalValue);
  if (month && consumption && totalValue) {
    return `Na sua conta de ${month}, vi ${consumption} com total de ${totalValue}.`;
  }
  if (month && consumption) {
    return `Na sua conta de ${month}, vi ${consumption}.`;
  }
  if (month && totalValue) {
    return `Na sua conta de ${month}, vi total de ${totalValue}.`;
  }
  if (consumption && totalValue) {
    return `Neste ciclo, vi ${consumption} com total de ${totalValue}.`;
  }
  if (month) {
    return `Na sua conta de ${month}, ja apareceu uma pista concreta.`;
  }
  return void 0;
};
var buildStoryClueLine = (story, clue) => {
  const { remainder } = splitNarrative(story.coreNarrative);
  const baseLine = remainder || story.strongestFinding || story.explainedCoverageText || story.confidenceNarrative;
  if (!clue.shouldAskQuestion && story.educationalInsight && !normalize(baseLine).includes(normalize(story.educationalInsight))) {
    return `${baseLine} ${story.educationalInsight}`.trim();
  }
  return baseLine;
};
var buildClueLine = (clue, {
  currentInvoice: currentInvoice2,
  energyStory
}) => {
  if (shouldUseEnergyStory(energyStory)) {
    return buildStoryClueLine(energyStory, clue);
  }
  const invoiceSignal = formatInvoiceSignal(currentInvoice2);
  if (clue.kind === "question") {
    if (invoiceSignal) {
      return `${invoiceSignal} Ainda nao trato isso como causa, mas ja sei onde vale investigar primeiro.`;
    }
    return "Antes de tirar conclusoes, quero confirmar um detalhe simples.";
  }
  if (clue.kind === "hypothesis") {
    if (invoiceSignal) {
      return `${invoiceSignal} Ainda nao trato isso como certeza, mas essa pista merece ser acompanhada.`;
    }
    return "Ainda nao trato isso como certeza, mas essa pista merece ser acompanhada.";
  }
  if (clue.kind === "room_mystery") {
    return clue.shortMessage;
  }
  if (clue.kind === "baseline") {
    return "Ja vi alguns sinais, mas ainda preciso de mais continuidade para entender melhor.";
  }
  return "Por enquanto, prefiro ser honesta e seguir com calma.";
};
var buildOptionalQuestionLine = (clue) => {
  if (!clue.shouldAskQuestion || !clue.question) {
    return void 0;
  }
  return ensureSafeCopy(`Posso te mostrar? ${clue.question.question}`);
};
var buildActionLabel = (clue) => {
  if (clue.kind === "question") return "Descobrir";
  if (clue.kind === "room_mystery") return "Ver";
  if (clue.kind === "baseline" || clue.kind === "discovery") return "Continuar";
  return "Ver";
};
var buildEvidenceLabel = (clue) => {
  if (clue.evidenceIds.length > 0) {
    return "Ver o que ja percebi";
  }
  return "Ver contexto";
};
var buildConfidenceLabel = (clue) => confidenceLabelMap[clue.confidence];
var buildSteps = (clue) => {
  if (clue.kind === "question" && clue.question) {
    return [
      {
        id: `step-${clue.id}-1`,
        label: "Confirmar um detalhe",
        description: clue.question.reason
      }
    ];
  }
  if (clue.kind === "room_mystery") {
    return [
      {
        id: `step-${clue.id}-1`,
        label: "Olhar esse ambiente com mais calma",
        description: clue.explanation
      }
    ];
  }
  return void 0;
};
var buildCoreSpeech = (clue, context = {}) => {
  const storyDriven = shouldUseEnergyStory(context.energyStory);
  const speech = {
    id: `core-speech-${clue.id}`,
    source: storyDriven ? "energy_story" : "house_clue",
    tone: toneByKind(clue.kind, clue.confidence),
    opening: ensureSafeCopy(
      storyDriven && context.energyStory ? buildStoryOpening(context.energyStory) : buildOpening(clue)
    ),
    clueLine: ensureSafeCopy(buildClueLine(clue, context)),
    optionalQuestionLine: buildOptionalQuestionLine(clue),
    actionLabel: ensureSafeCopy(buildActionLabel(clue)),
    evidenceLabel: ensureSafeCopy(buildEvidenceLabel(clue)),
    confidenceLabel: ensureSafeCopy(
      storyDriven && context.energyStory ? context.energyStory.confidenceNarrative : buildConfidenceLabel(clue)
    ),
    steps: buildSteps(clue)
  };
  return speech;
};

// src/lib/cognitive/houseClueEngine.ts
var confidenceRank2 = {
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3
};
var roomLabelMap = {
  bathroom: "banheiro",
  kitchen: "cozinha",
  laundry: "lavanderia",
  bedroom: "quarto",
  living_room: "sala",
  comfort: "conforto da casa",
  garage: "garagem",
  outdoor: "area externa",
  unknown: "casa"
};
var unique2 = (values) => Array.from(new Set(values));
var getRoomById2 = (house, roomId) => roomId ? house.rooms.find((room) => room.id === roomId) : void 0;
var getReadableRoomLabel = (room) => room ? roomLabelMap[room.type] ?? room.label.toLowerCase() : "casa";
var capClueConfidence = (desired, evidenceCount) => {
  if (evidenceCount <= 0) {
    return desired === "unknown" ? "unknown" : "low";
  }
  if (evidenceCount === 1 && desired === "high") {
    return "medium";
  }
  return desired;
};
var buildQuestionAction = (question) => ({
  kind: "ask_question",
  label: "Confirmar esse detalhe",
  reason: question.reason
});
var buildQuestionClue = (house) => {
  const question = house.nextInvestigation.suggestedQuestion;
  if (!question || !question.shouldAskNow || question.expectedGain !== "high") {
    return null;
  }
  const relatedHypothesis = question.relatedHypothesisId ? house.activeHypotheses.find((item) => item.id === question.relatedHypothesisId) : void 0;
  const room = getRoomById2(house, question.relatedRoomId ?? relatedHypothesis?.relatedRooms[0]);
  const evidenceIds = unique2([
    ...relatedHypothesis?.evidenceIds ?? [],
    ...room?.evidence.map((item) => item.id) ?? []
  ]);
  const roomLabel = getReadableRoomLabel(room);
  return {
    id: `house-clue-question-${question.id}`,
    kind: "question",
    title: room && room.type !== "unknown" ? `Achei uma pista no ${roomLabel}.` : "Tem uma pergunta que pode clarear esta casa.",
    shortMessage: room && room.type !== "unknown" ? `Achei uma pista no ${roomLabel}.` : "Tem uma mudanca neste ciclo que vale atencao.",
    explanation: house.nextInvestigation.expectedDiscovery ? `${question.reason} ${house.nextInvestigation.expectedDiscovery}` : question.reason,
    confidence: capClueConfidence(
      relatedHypothesis?.confidence ?? room?.confidence ?? "low",
      evidenceIds.length
    ),
    relatedRoomId: room?.id,
    relatedHypothesisId: relatedHypothesis?.id,
    evidenceIds,
    suggestedAction: buildQuestionAction(question),
    shouldAskQuestion: true,
    question
  };
};
var scoreHypothesis = (hypothesis) => confidenceRank2[hypothesis.confidence] * 10 + (hypothesis.status === "strengthened" ? 6 : hypothesis.status === "investigating" ? 3 : 0) + hypothesis.evidenceIds.length;
var buildHypothesisClue = (house) => {
  const candidate = [...house.activeHypotheses].filter(
    (hypothesis) => confidenceRank2[hypothesis.confidence] >= confidenceRank2.medium || hypothesis.status === "strengthened"
  ).sort((left, right) => scoreHypothesis(right) - scoreHypothesis(left))[0];
  if (!candidate) {
    return null;
  }
  const room = getRoomById2(house, candidate.relatedRooms[0]);
  const roomLabel = getReadableRoomLabel(room);
  const evidenceIds = unique2(candidate.evidenceIds);
  return {
    id: `house-clue-hypothesis-${candidate.id}`,
    kind: "hypothesis",
    title: room && room.type !== "unknown" ? `Achei uma pista no ${roomLabel}.` : "Tem uma mudanca neste ciclo que vale atencao.",
    shortMessage: room && room.type !== "unknown" ? `Achei uma pista no ${roomLabel}.` : "Tem uma mudanca neste ciclo que vale atencao.",
    explanation: candidate.description,
    confidence: capClueConfidence(candidate.confidence, evidenceIds.length),
    relatedRoomId: room?.id,
    relatedHypothesisId: candidate.id,
    evidenceIds,
    suggestedAction: {
      kind: "review_clue",
      label: "Acompanhar essa pista",
      reason: "Ainda preciso de mais contexto antes de transformar essa pista em certeza."
    },
    shouldAskQuestion: false
  };
};
var scoreMysteryRoom = (room) => (room.mainMystery ? 10 : 0) + (100 - room.understandingLevel) + (3 - confidenceRank2[room.confidence]);
var buildRoomMysteryClue = (house) => {
  const room = [...house.rooms].filter((item) => item.mainMystery).sort((left, right) => scoreMysteryRoom(right) - scoreMysteryRoom(left))[0];
  if (!room?.mainMystery) {
    return null;
  }
  const roomLabel = getReadableRoomLabel(room);
  const evidenceIds = unique2(room.evidence.map((item) => item.id));
  return {
    id: `house-clue-room-${room.id}`,
    kind: "room_mystery",
    title: `A ${roomLabel} ainda e um misterio para mim.`,
    shortMessage: `A ${roomLabel} ainda e um misterio para mim.`,
    explanation: room.mainMystery,
    confidence: capClueConfidence(room.confidence, evidenceIds.length),
    relatedRoomId: room.id,
    evidenceIds,
    suggestedAction: {
      kind: "review_clue",
      label: "Explorar esse ponto",
      reason: "Entender melhor esse ambiente tende a reduzir uma lacuna importante da casa."
    },
    shouldAskQuestion: false
  };
};
var buildBaselineClue = (house) => {
  if (house.energyBaseline.status !== "building" && house.energyBaseline.status !== "not_started") {
    return null;
  }
  const hasAnyEvidence = house.rooms.some((room) => room.evidence.length > 0) || house.activeHypotheses.some((hypothesis) => hypothesis.evidenceIds.length > 0);
  if (house.energyBaseline.status === "building") {
    return {
      id: "house-clue-baseline-building",
      kind: "baseline",
      title: "Ainda estou conhecendo sua casa.",
      shortMessage: "Ainda estou conhecendo sua casa.",
      explanation: "Ja existem sinais suficientes para comecar a leitura, mas ainda faltam alguns ciclos para entender o comportamento da casa com mais estabilidade.",
      confidence: capClueConfidence("medium", hasAnyEvidence ? 1 : 0),
      evidenceIds: [],
      suggestedAction: {
        kind: "collect_more_history",
        label: "Continuar observando os proximos ciclos",
        reason: "Mais historico ajuda a separar melhor padrao, mudanca e sazonalidade."
      },
      shouldAskQuestion: false
    };
  }
  if (!hasAnyEvidence) {
    return {
      id: "house-clue-discovery-initial",
      kind: "discovery",
      title: "Ainda estou conhecendo sua casa.",
      shortMessage: "Ainda estou conhecendo sua casa.",
      explanation: "Ainda nao tenho pistas suficientes para apontar uma causa com seguranca. Primeiro preciso observar mais sinais reais da residencia.",
      confidence: "low",
      evidenceIds: [],
      suggestedAction: {
        kind: "wait_for_more_data",
        label: "Trazer mais sinais da casa",
        reason: "Sem evidencias reais, qualquer conclusao agora seria cedo demais."
      },
      shouldAskQuestion: false
    };
  }
  return {
    id: "house-clue-baseline-early",
    kind: "baseline",
    title: "Ainda estou conhecendo sua casa.",
    shortMessage: "Ainda estou conhecendo sua casa.",
    explanation: "Ja existem algumas pistas, mas a linha de base ainda esta em construcao e pede mais observacao antes de conclusoes fortes.",
    confidence: "low",
    evidenceIds: [],
    suggestedAction: {
      kind: "observe_next_cycle",
      label: "Observar mais um ciclo",
      reason: "Mais continuidade ajuda a transformar sinais iniciais em entendimento confiavel."
    },
    shouldAskQuestion: false
  };
};
var buildFallbackClue = (house) => ({
  id: "house-clue-fallback",
  kind: "discovery",
  title: "Ainda estou juntando as primeiras pistas.",
  shortMessage: "Ainda estou conhecendo sua casa.",
  explanation: house.understanding.mainMystery ?? "Ainda nao encontrei uma pista forte o suficiente para apontar um foco principal sem correr o risco de forcar a leitura.",
  confidence: "low",
  evidenceIds: [],
  suggestedAction: {
    kind: "wait_for_more_data",
    label: "Esperar novas evidencias",
    reason: "Prefiro manter a leitura honesta antes de sugerir uma causa sem base suficiente."
  },
  shouldAskQuestion: false
});
var selectPrimaryHouseClue = (house) => buildQuestionClue(house) ?? buildHypothesisClue(house) ?? buildRoomMysteryClue(house) ?? buildBaselineClue(house) ?? buildFallbackClue(house);

// src/lib/energy-map/buildEnergyMap.ts
var roundTo = (value, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
var isFinitePositive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
var uniqueStrings = (values) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
var confidenceRank3 = {
  high: 3,
  medium: 2,
  low: 1
};
var roomLabelById = {
  bathroom: "o banheiro",
  kitchen: "a cozinha",
  lighting: "a iluminacao",
  refrigeration: "a refrigeracao",
  laundry: "a lavanderia",
  climatization: "a climatizacao",
  others: "outros usos"
};
var toRoomLabel = (room) => roomLabelById[room] ?? `o bloco ${room}`;
var getBlockImpact = (block) => block.estimatedCost ?? block.estimatedShare ?? block.estimatedInvoiceSharePercent ?? 0;
var getIssueWeight = (block) => (block.warnings?.length ?? 0) + (block.limitations?.length ?? 0);
var compareBlocksByImpact = (left, right) => {
  const impactDelta = getBlockImpact(right) - getBlockImpact(left);
  if (impactDelta !== 0) {
    return impactDelta;
  }
  const confidenceDelta = confidenceRank3[right.confidence] - confidenceRank3[left.confidence];
  if (confidenceDelta !== 0) {
    return confidenceDelta;
  }
  return getIssueWeight(left) - getIssueWeight(right);
};
var buildEnergyMap = (blocks) => {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const validBlocks = safeBlocks.filter((block) => block.status === "estimated");
  const blocksByEstimatedImpact = [...validBlocks].sort(compareBlocksByImpact);
  const estimatedCoveredCost = roundTo(
    validBlocks.reduce((sum, block) => sum + (block.estimatedCost ?? 0), 0),
    2
  );
  const estimatedCoveredKwh = roundTo(
    validBlocks.reduce((sum, block) => sum + (block.estimatedKwh ?? 0), 0),
    1
  );
  const aggregatedWarnings = uniqueStrings(
    safeBlocks.flatMap((block) => [...block.warnings ?? [], ...block.limitations ?? []])
  );
  const rawCoveragePercent = roundTo(
    validBlocks.reduce((sum, block) => sum + (block.coverageContribution ?? 0), 0),
    1
  );
  const warnings = [...aggregatedWarnings];
  const estimatedCoveragePercent = Math.min(rawCoveragePercent, 100);
  if (rawCoveragePercent > 100) {
    warnings.push(
      "A cobertura estimada do mapa ultrapassou 100% e foi limitada para evitar falsa precisao."
    );
  }
  const openGaps = uniqueStrings(
    safeBlocks.flatMap((block) => {
      const gaps = [...block.warnings ?? [], ...block.limitations ?? []];
      if (!isFinitePositive(block.estimatedInvoiceSharePercent) && !isFinitePositive(block.estimatedShare)) {
        gaps.push(`Ainda falta cobertura percentual confiavel para ${toRoomLabel(block.room)}.`);
      }
      return gaps;
    })
  );
  const topBlock = blocksByEstimatedImpact[0];
  const bestCoreInsight = topBlock ? `Com o que sei ate agora, ${toRoomLabel(topBlock.room)} parece ser o bloco mais relevante da sua conta.` : "Com o que sei ate agora, ainda nao consigo montar um mapa energetico confiavel da sua conta.";
  let confidence = "low";
  if (validBlocks.length > 1 && estimatedCoveragePercent >= 60 && warnings.length === 0 && validBlocks.every((block) => block.confidence !== "low")) {
    confidence = "high";
  } else if (validBlocks.length > 1 && estimatedCoveragePercent >= 30 && warnings.length <= 2 && topBlock?.confidence !== "low") {
    confidence = "medium";
  }
  return {
    bestCoreInsight,
    blocks: safeBlocks,
    blocksByEstimatedImpact,
    confidence,
    estimatedCoveragePercent,
    estimatedCoveredCost,
    estimatedCoveredKwh,
    openGaps,
    topBlock,
    warnings: uniqueStrings(warnings)
  };
};

// src/lib/energy-map/energyStory.ts
var INVESTIGATION_PRIORITY = [
  "climatization",
  "laundry",
  "kitchen",
  "refrigeration",
  "lighting",
  "bathroom"
];
var ROOM_LABELS = {
  bathroom: "banheiro",
  climatization: "climatizacao",
  kitchen: "cozinha",
  laundry: "lavanderia",
  lighting: "iluminacao",
  refrigeration: "refrigeracao"
};
var UNKNOWN_AREA_LABELS = {
  bathroom: "banheiro",
  climatization: "climatizacao",
  kitchen: "cozinha",
  laundry: "lavanderia",
  lighting: "iluminacao",
  refrigeration: "refrigeracao"
};
var CONFIDENCE_LABELS = {
  high: "alta",
  medium: "parcial",
  low: "inicial"
};
var formatPercent = (value) => {
  const rounded = Math.round(value * 10) / 10;
  const isIntegerAmount = Math.abs(rounded - Math.round(rounded)) < 1e-4;
  return `${isIntegerAmount ? Math.round(rounded).toString() : rounded.toFixed(1)}%`;
};
var listToNaturalLanguage = (items) => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} e ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`;
};
var toCoverageText = (coverage) => {
  if (coverage <= 0) {
    return "Ainda nao consigo explicar uma parte relevante da sua conta com honestidade.";
  }
  if (coverage < 15) {
    return "Ainda consigo explicar apenas uma pequena parte da sua conta.";
  }
  if (coverage < 35) {
    return "Ate agora consigo explicar uma parte inicial da sua conta.";
  }
  if (coverage < 65) {
    return "Ate agora consigo explicar aproximadamente metade da sua conta.";
  }
  if (coverage < 85) {
    return "Ate agora consigo explicar boa parte da sua conta.";
  }
  return "Ate agora consigo explicar quase toda a sua conta.";
};
var describeStrongestFinding = (block) => {
  const roomLabel = ROOM_LABELS[block.room] ?? block.room;
  return `O ${roomLabel} parece representar a maior parcela conhecida da sua conta.`;
};
var describeSecondaryFinding = (block) => {
  if (block.room === "refrigeration") {
    return "A refrigeracao parece manter uma parcela constante da conta ao longo do ciclo.";
  }
  if (block.room === "lighting") {
    return "A iluminacao parece representar uma parcela menor, mas recorrente, da conta.";
  }
  if (block.room === "bathroom") {
    return "O banheiro continua sendo uma pista importante quando existe uso intenso de banho.";
  }
  const roomLabel = ROOM_LABELS[block.room] ?? block.room;
  return `${roomLabel[0]?.toUpperCase() ?? ""}${roomLabel.slice(1)} ainda traz sinais uteis para explicar a conta.`;
};
var deriveUnknownAreas = (map) => {
  const explainedRooms = new Set(
    map.blocks.filter((block) => block.status === "estimated").map((block) => block.room)
  );
  return INVESTIGATION_PRIORITY.filter((room) => !explainedRooms.has(room)).map((room) => UNKNOWN_AREA_LABELS[room]);
};
var pickNextInvestigation = (unknownAreas) => {
  const preferred = unknownAreas[0];
  if (!preferred) {
    return void 0;
  }
  if (preferred === "climatizacao") {
    return {
      label: preferred,
      narrative: "Entender como funciona a climatizacao da residencia."
    };
  }
  if (preferred === "lavanderia") {
    return {
      label: preferred,
      narrative: "Entender com que frequencia a lavanderia entra na rotina da casa."
    };
  }
  if (preferred === "cozinha") {
    return {
      label: preferred,
      narrative: "Entender melhor os usos recorrentes da cozinha na residencia."
    };
  }
  if (preferred === "refrigeracao") {
    return {
      label: preferred,
      narrative: "Entender melhor o peso da refrigeracao na residencia."
    };
  }
  if (preferred === "iluminacao") {
    return {
      label: preferred,
      narrative: "Entender melhor o padrao de iluminacao da residencia."
    };
  }
  return {
    label: preferred,
    narrative: `Entender melhor o papel do ${preferred} na residencia.`
  };
};
var buildConfidenceNarrative = (confidence, unknownAreas, warnings) => {
  if (unknownAreas.length === 0 && confidence === "high" && warnings.length === 0) {
    return "Minha compreensao ja cobre boa parte da residencia e esta mais consistente do que no inicio.";
  }
  if (unknownAreas.length > 0) {
    return `Minha compreensao ainda e ${CONFIDENCE_LABELS[confidence]} porque ainda preciso investigar ${listToNaturalLanguage(
      unknownAreas.slice(0, 3)
    )}.`;
  }
  if (warnings.length > 0) {
    return "Minha compreensao ainda e parcial porque parte das estimativas depende de premissas conservadoras.";
  }
  return "Minha compreensao ainda e parcial, mas ja comeca a mostrar um desenho mais confiavel da casa.";
};
var buildEducationalInsight = (map) => {
  const rooms = new Set(map.blocksByEstimatedImpact.map((block) => block.room));
  if (rooms.has("bathroom") && rooms.has("refrigeration")) {
    return "Nem sempre o uso mais intenso e o unico que pesa na conta: cargas de banho e equipamentos ligados continuamente podem dividir o protagonismo.";
  }
  if (rooms.has("lighting")) {
    return "Consumos pequenos e recorrentes tambem ajudam a explicar a conta quando se repetem todos os dias.";
  }
  if (rooms.has("bathroom")) {
    return "Uma unica rotina intensa, como o banho eletrico, ja pode explicar uma parcela relevante da conta.";
  }
  return "Entender a conta comeca por ligar consumo a ambientes reais da casa, nao apenas a numeros soltos.";
};
var buildCoreNarrative = (coverageText, strongestFinding, secondaryFindings, nextInvestigation) => {
  const lines = ["Comecei a montar um mapa da sua residencia.", coverageText];
  if (strongestFinding) {
    lines.push(strongestFinding);
  }
  if (secondaryFindings.length > 0) {
    lines.push(secondaryFindings[0]);
  }
  if (nextInvestigation) {
    lines.push(`Ainda preciso ${nextInvestigation.slice(0, 1).toLowerCase()}${nextInvestigation.slice(1)}`);
  }
  return lines.join(" ");
};
var buildEnergyStory = (map) => {
  const explainedCoveragePercent = map.estimatedCoveragePercent;
  const explainedCoverageText = explainedCoveragePercent ? `${toCoverageText(explainedCoveragePercent)} Ate agora isso representa algo proximo de ${formatPercent(
    explainedCoveragePercent
  )} da fatura.` : toCoverageText(explainedCoveragePercent);
  const strongestFinding = map.topBlock ? describeStrongestFinding(map.topBlock) : void 0;
  const secondaryFindings = map.blocksByEstimatedImpact.slice(strongestFinding ? 1 : 0, 3).map(describeSecondaryFinding);
  const unknownAreas = deriveUnknownAreas(map);
  const nextInvestigation = pickNextInvestigation(unknownAreas)?.narrative;
  const confidenceNarrative = buildConfidenceNarrative(map.confidence, unknownAreas, map.warnings);
  const educationalInsight = buildEducationalInsight(map);
  const coreNarrative = buildCoreNarrative(
    explainedCoverageText,
    strongestFinding,
    secondaryFindings,
    nextInvestigation
  );
  return {
    explainedCoveragePercent,
    explainedCoverageText,
    strongestFinding,
    secondaryFindings,
    unknownAreas,
    nextInvestigation,
    confidenceNarrative,
    coreNarrative,
    educationalInsight
  };
};

// src/lib/energy-map/lighting.ts
var DEFAULT_LIGHT_POINTS_PER_ROOM = 1;
var DEFAULT_HOURS_PER_DAY = 4;
var DEFAULT_LED_WATTS = 10;
var DEFAULT_MIXED_WATTS = 18;
var DEFAULT_UNKNOWN_WATTS = 15;
var roundTo2 = (value, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
var isPositiveNumber = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
var formatCurrency2 = (value) => {
  const rounded = roundTo2(value, 2);
  const isIntegerAmount = Math.abs(rounded - Math.round(rounded)) < 1e-4;
  return `R$ ${isIntegerAmount ? Math.round(rounded).toString() : rounded.toFixed(2)}`;
};
var formatPercent2 = (value) => {
  const rounded = roundTo2(value, 1);
  const isIntegerAmount = Math.abs(rounded - Math.round(rounded)) < 1e-4;
  return `${isIntegerAmount ? Math.round(rounded).toString() : rounded.toFixed(1)}%`;
};
var getProfileLabel = (profile) => {
  if (profile === "led") return "LED";
  if (profile === "mixed") return "mista";
  return "desconhecida";
};
var getProfileWatts = (profile) => {
  if (profile === "led") return DEFAULT_LED_WATTS;
  if (profile === "mixed") return DEFAULT_MIXED_WATTS;
  return DEFAULT_UNKNOWN_WATTS;
};
var buildUnavailableEstimate = ({
  assumptions,
  warnings,
  limitations
}) => ({
  room: "lighting",
  status: "unavailable",
  confidence: "low",
  assumptions,
  warnings,
  limitations,
  explanationForCore: "Ainda nao consigo estimar com honestidade o peso da iluminacao porque faltam sinais minimos sobre a residencia."
});
var pushAssumption = (assumptions, key, label, value, source) => {
  assumptions.push({
    key,
    label,
    source,
    value
  });
};
var estimateLightingEnergyBlock = (input) => {
  const warnings = [];
  const limitations = [];
  const assumptions = [];
  if (!isPositiveNumber(input.roomCount)) {
    limitations.push("A quantidade aproximada de comodos precisa ser maior que zero.");
    return buildUnavailableEstimate({ assumptions, warnings, limitations });
  }
  if (!isPositiveNumber(input.cycleDays)) {
    limitations.push("Os dias do ciclo precisam ser maiores que zero.");
    return buildUnavailableEstimate({ assumptions, warnings, limitations });
  }
  const lightingProfile = input.lightingProfile ?? "unknown";
  const pointsPerRoom = DEFAULT_LIGHT_POINTS_PER_ROOM;
  const averageHoursPerDay = isPositiveNumber(input.averageLightingHoursPerDay) ? input.averageLightingHoursPerDay : DEFAULT_HOURS_PER_DAY;
  const averageWatts = getProfileWatts(lightingProfile);
  const usedDefaultHours = !isPositiveNumber(input.averageLightingHoursPerDay);
  const usedUnknownProfile = lightingProfile === "unknown";
  pushAssumption(
    assumptions,
    "roomCount",
    "Comodos considerados",
    input.roomCount,
    "provided"
  );
  pushAssumption(
    assumptions,
    "lightPointsPerRoom",
    "Pontos principais de iluminacao por comodo",
    pointsPerRoom,
    "default"
  );
  pushAssumption(
    assumptions,
    "averageLightingHoursPerDay",
    "Horas medias de iluminacao por dia",
    averageHoursPerDay,
    usedDefaultHours ? "default" : "provided"
  );
  pushAssumption(
    assumptions,
    "averageWattsPerLightPoint",
    `Potencia media por ponto (${getProfileLabel(lightingProfile)})`,
    averageWatts,
    "default"
  );
  pushAssumption(assumptions, "cycleDays", "Dias do ciclo", input.cycleDays, "provided");
  if (usedDefaultHours) {
    warnings.push("Usei 4 horas medias por dia como aproximacao conservadora para iluminacao.");
  }
  if (usedUnknownProfile) {
    warnings.push("O tipo predominante de iluminacao nao foi informado. Usei uma media conservadora para perfil desconhecido.");
  }
  const estimatedKwh = roundTo2(
    input.roomCount * pointsPerRoom * averageWatts / 1e3 * averageHoursPerDay * input.cycleDays,
    1
  );
  let estimatedCost;
  let estimatedInvoiceSharePercent;
  let estimatedShare;
  let coverageContribution;
  if (isPositiveNumber(input.averageTariffPerKwh)) {
    estimatedCost = roundTo2(estimatedKwh * input.averageTariffPerKwh, 2);
    pushAssumption(
      assumptions,
      "averageTariffPerKwh",
      "Tarifa media por kWh",
      input.averageTariffPerKwh,
      "provided"
    );
  } else {
    warnings.push("Nao foi possivel calcular o custo da iluminacao porque a tarifa media nao foi informada.");
    limitations.push("O custo estimado ficou indisponivel sem tarifa media valida.");
  }
  if (estimatedCost !== void 0 && isPositiveNumber(input.invoiceTotalValue)) {
    const share = roundTo2(estimatedCost / input.invoiceTotalValue * 100, 1);
    estimatedInvoiceSharePercent = share;
    estimatedShare = share;
    coverageContribution = share;
    pushAssumption(
      assumptions,
      "invoiceTotalValue",
      "Valor total da fatura",
      input.invoiceTotalValue,
      "provided"
    );
  } else if (estimatedCost !== void 0) {
    warnings.push(
      input.invoiceTotalValue === void 0 || input.invoiceTotalValue === null ? "Nao foi possivel calcular o percentual da fatura porque o valor total nao foi informado." : "Nao foi possivel calcular o percentual da fatura porque o valor total informado e invalido."
    );
    limitations.push("O percentual da fatura ficou indisponivel sem um valor total valido.");
  }
  const confidence = !estimatedCost || !estimatedShare ? "low" : usedDefaultHours || usedUnknownProfile ? "medium" : "medium";
  const explanationForCore = [
    estimatedCost !== void 0 ? `A iluminacao parece representar cerca de ${formatCurrency2(estimatedCost)} da sua conta` : `A iluminacao parece representar cerca de ${estimatedKwh} kWh do seu ciclo`,
    estimatedShare !== void 0 ? `, algo proximo de ${formatPercent2(estimatedShare)} da fatura.` : ".",
    ` Considerei uma residencia com iluminacao predominantemente ${getProfileLabel(lightingProfile)} e uso medio diario.`
  ].join("");
  return {
    room: "lighting",
    status: "estimated",
    estimatedKwh,
    estimatedCost,
    estimatedInvoiceSharePercent,
    estimatedShare,
    coverageContribution,
    confidence,
    assumptions,
    warnings,
    limitations,
    explanationForCore
  };
};

// src/lib/energy-map/refrigeration.ts
var DEFAULT_REFRIGERATOR_KWH = 45;
var DEFAULT_FREEZER_KWH = 50;
var DEFAULT_EXTRA_FRIDGE_KWH = 40;
var MONTH_REFERENCE_DAYS = 30;
var roundTo3 = (value, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
var isPositiveNumber2 = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
var formatCurrency3 = (value) => {
  const rounded = roundTo3(value, 2);
  const isIntegerAmount = Math.abs(rounded - Math.round(rounded)) < 1e-4;
  return `R$ ${isIntegerAmount ? Math.round(rounded).toString() : rounded.toFixed(2)}`;
};
var formatPercent3 = (value) => {
  const rounded = roundTo3(value, 1);
  const isIntegerAmount = Math.abs(rounded - Math.round(rounded)) < 1e-4;
  return `${isIntegerAmount ? Math.round(rounded).toString() : rounded.toFixed(1)}%`;
};
var buildUnavailableEstimate2 = ({
  assumptions,
  warnings,
  limitations
}) => ({
  room: "refrigeration",
  status: "unavailable",
  confidence: "low",
  assumptions,
  warnings,
  limitations,
  explanationForCore: "Ainda nao consigo estimar com honestidade o peso da refrigeracao porque nenhum equipamento recorrente dessa categoria foi confirmado."
});
var scaleMonthlyKwhToCycle = (monthlyKwh, cycleDays) => roundTo3(monthlyKwh / MONTH_REFERENCE_DAYS * cycleDays, 1);
var pushAssumption2 = (assumptions, key, label, value, source) => {
  assumptions.push({
    key,
    label,
    source,
    value
  });
};
var estimateRefrigerationEnergyBlock = (input) => {
  const warnings = [];
  const limitations = [];
  const assumptions = [];
  const hasRefrigerator = input.hasRefrigerator === true;
  const hasFreezer = input.hasFreezer === true;
  const hasExtraFridge = input.hasExtraFridge === true;
  if (!hasRefrigerator && !hasFreezer && !hasExtraFridge) {
    limitations.push("Nenhum equipamento de refrigeracao foi confirmado ate agora.");
    return buildUnavailableEstimate2({ assumptions, warnings, limitations });
  }
  if (!isPositiveNumber2(input.cycleDays)) {
    limitations.push("Os dias do ciclo precisam ser maiores que zero.");
    return buildUnavailableEstimate2({ assumptions, warnings, limitations });
  }
  let estimatedKwh = 0;
  let usedDefaultConsumption = false;
  if (hasRefrigerator) {
    const monthlyKwh = isPositiveNumber2(input.refrigeratorMonthlyKwh) ? input.refrigeratorMonthlyKwh : DEFAULT_REFRIGERATOR_KWH;
    const source = isPositiveNumber2(input.refrigeratorMonthlyKwh) ? "provided" : "default";
    usedDefaultConsumption ||= source === "default";
    estimatedKwh += scaleMonthlyKwhToCycle(monthlyKwh, input.cycleDays);
    pushAssumption2(
      assumptions,
      "refrigeratorMonthlyKwh",
      "Geladeira principal (kWh/mes)",
      monthlyKwh,
      source
    );
  }
  if (hasFreezer) {
    const monthlyKwh = isPositiveNumber2(input.freezerMonthlyKwh) ? input.freezerMonthlyKwh : DEFAULT_FREEZER_KWH;
    const source = isPositiveNumber2(input.freezerMonthlyKwh) ? "provided" : "default";
    usedDefaultConsumption ||= source === "default";
    estimatedKwh += scaleMonthlyKwhToCycle(monthlyKwh, input.cycleDays);
    pushAssumption2(
      assumptions,
      "freezerMonthlyKwh",
      "Freezer separado (kWh/mes)",
      monthlyKwh,
      source
    );
  }
  if (hasExtraFridge) {
    const monthlyKwh = isPositiveNumber2(input.extraFridgeMonthlyKwh) ? input.extraFridgeMonthlyKwh : DEFAULT_EXTRA_FRIDGE_KWH;
    const source = isPositiveNumber2(input.extraFridgeMonthlyKwh) ? "provided" : "default";
    usedDefaultConsumption ||= source === "default";
    estimatedKwh += scaleMonthlyKwhToCycle(monthlyKwh, input.cycleDays);
    pushAssumption2(
      assumptions,
      "extraFridgeMonthlyKwh",
      "Geladeira extra ou cervejeira (kWh/mes)",
      monthlyKwh,
      source
    );
  }
  pushAssumption2(assumptions, "cycleDays", "Dias do ciclo", input.cycleDays, "provided");
  if (usedDefaultConsumption) {
    warnings.push(
      "Usei consumos mensais conservadores para os equipamentos de refrigeracao confirmados."
    );
  }
  let estimatedCost;
  let estimatedInvoiceSharePercent;
  let estimatedShare;
  let coverageContribution;
  if (isPositiveNumber2(input.averageTariffPerKwh)) {
    estimatedCost = roundTo3(estimatedKwh * input.averageTariffPerKwh, 2);
    pushAssumption2(
      assumptions,
      "averageTariffPerKwh",
      "Tarifa media por kWh",
      input.averageTariffPerKwh,
      "provided"
    );
  } else {
    warnings.push("Nao foi possivel calcular o custo da refrigeracao porque a tarifa media nao foi informada.");
    limitations.push("O custo estimado ficou indisponivel sem tarifa media valida.");
  }
  if (estimatedCost !== void 0 && isPositiveNumber2(input.invoiceTotalValue)) {
    const share = roundTo3(estimatedCost / input.invoiceTotalValue * 100, 1);
    estimatedInvoiceSharePercent = share;
    estimatedShare = share;
    coverageContribution = share;
    pushAssumption2(
      assumptions,
      "invoiceTotalValue",
      "Valor total da fatura",
      input.invoiceTotalValue,
      "provided"
    );
  } else if (estimatedCost !== void 0) {
    warnings.push(
      input.invoiceTotalValue === void 0 || input.invoiceTotalValue === null ? "Nao foi possivel calcular o percentual da fatura porque o valor total nao foi informado." : "Nao foi possivel calcular o percentual da fatura porque o valor total informado e invalido."
    );
    limitations.push("O percentual da fatura ficou indisponivel sem um valor total valido.");
  }
  const confidence = !estimatedCost || !estimatedShare ? "low" : usedDefaultConsumption ? "medium" : "high";
  const equipmentLabels = [
    hasRefrigerator ? "geladeira" : null,
    hasFreezer ? "freezer" : null,
    hasExtraFridge ? "refrigerador extra" : null
  ].filter(Boolean);
  const equipmentLine = equipmentLabels.length === 1 ? equipmentLabels[0] : equipmentLabels.length === 2 ? `${equipmentLabels[0]} e ${equipmentLabels[1]}` : `${equipmentLabels.slice(0, -1).join(", ")} e ${equipmentLabels.at(-1)}`;
  const explanationForCore = [
    estimatedCost !== void 0 ? `A refrigeracao pode representar cerca de ${formatCurrency3(estimatedCost)} da sua conta` : `A refrigeracao pode representar cerca de ${estimatedKwh} kWh do seu ciclo`,
    estimatedShare !== void 0 ? `, algo proximo de ${formatPercent3(estimatedShare)} da fatura.` : ".",
    ` Usei uma estimativa conservadora para ${equipmentLine} funcionando todos os dias.`
  ].join("");
  return {
    room: "refrigeration",
    status: "estimated",
    estimatedKwh,
    estimatedCost,
    estimatedInvoiceSharePercent,
    estimatedShare,
    coverageContribution,
    confidence,
    assumptions,
    warnings,
    limitations,
    explanationForCore
  };
};

// src/lib/energy-map/buildEnergyStoryFromJourney.ts
var isPositiveNumber3 = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
var deriveCycleDays = (invoice) => {
  const parserDays = invoice?.parser?.fields?.daysBilled?.value;
  return isPositiveNumber3(parserDays) ? parserDays : 30;
};
var deriveAverageTariffPerKwh = (invoice) => {
  if (!isPositiveNumber3(invoice?.totalValue) || !isPositiveNumber3(invoice?.consumption)) {
    return void 0;
  }
  return Math.round(invoice.totalValue / invoice.consumption * 1e3) / 1e3;
};
var deriveRoomCount = (profile, energyBehaviorProfile) => {
  const roomCountRange = energyBehaviorProfile?.habits?.roomCountRange;
  if (roomCountRange === "1_3") return 3;
  if (roomCountRange === "4_6") return 5;
  if (roomCountRange === "7_ou_mais") return 7;
  if (!isPositiveNumber3(profile?.propertySize)) {
    return void 0;
  }
  if (profile.propertySize <= 55) return 3;
  if (profile.propertySize <= 120) return 5;
  return 7;
};
var buildLightingBlock = ({
  currentInvoice: currentInvoice2,
  energyBehaviorProfile,
  profile
}) => {
  const roomCount = deriveRoomCount(profile, energyBehaviorProfile);
  if (!isPositiveNumber3(roomCount)) {
    return void 0;
  }
  return estimateLightingEnergyBlock({
    roomCount,
    lightingProfile: "unknown",
    cycleDays: deriveCycleDays(currentInvoice2),
    averageTariffPerKwh: deriveAverageTariffPerKwh(currentInvoice2),
    invoiceTotalValue: currentInvoice2?.totalValue
  });
};
var buildRefrigerationBlock = ({
  currentInvoice: currentInvoice2,
  energyBehaviorProfile
}) => {
  const hasExtraFridge = energyBehaviorProfile?.appliances?.hasExtraFridge === true;
  if (!hasExtraFridge) {
    return void 0;
  }
  return estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    hasExtraFridge: true,
    cycleDays: deriveCycleDays(currentInvoice2),
    averageTariffPerKwh: deriveAverageTariffPerKwh(currentInvoice2),
    invoiceTotalValue: currentInvoice2?.totalValue
  });
};
var buildEnergyStoryFromJourney = (input) => {
  const blocks = [];
  const lighting = buildLightingBlock(input);
  const refrigeration = buildRefrigerationBlock(input);
  if (lighting) {
    blocks.push(lighting);
  }
  if (refrigeration) {
    blocks.push(refrigeration);
  }
  if (blocks.length === 0) {
    return void 0;
  }
  const map = buildEnergyMap(blocks);
  if (map.estimatedCoveragePercent <= 0) {
    return void 0;
  }
  return buildEnergyStory(map);
};

// src/lib/cognitive/coreExperienceComposer.ts
var buildStatus = (house, clue) => {
  const hasEvidence = clue.evidenceIds.length > 0;
  if (clue.shouldAskQuestion) {
    return {
      status: "question_ready",
      reason: "A pista principal depende de uma confirmacao simples do usuario."
    };
  }
  if (house.energyBaseline.status === "not_started" && !hasEvidence && house.understanding.overallLevel === 0) {
    return {
      status: "no_data",
      reason: "Ainda nao existem sinais suficientes para uma pista mais concreta."
    };
  }
  if (clue.kind === "baseline") {
    return {
      status: "building_baseline",
      reason: "A casa ja comecou a ser observada, mas a linha de base ainda esta em construcao."
    };
  }
  if (clue.kind === "room_mystery" && house.energyBaseline.status === "established" && !hasEvidence && (clue.confidence === "low" || clue.confidence === "unknown")) {
    return {
      status: "needs_more_context",
      reason: "Existe um misterio relevante, mas ainda faltam evidencias para uma leitura mais firme."
    };
  }
  if (house.energyBaseline.status === "established" && clue.kind !== "question" && clue.confidence !== "low" && clue.confidence !== "unknown") {
    return {
      status: "stable_observation",
      reason: "A casa ja possui linha de base suficiente para uma observacao mais estavel."
    };
  }
  return {
    status: "clue_ready",
    reason: "Ja existe uma pista util pronta para ser revelada sem precisar abrir uma pergunta."
  };
};
var buildPrimaryAction = (status, clue, energyStory) => {
  if (status === "question_ready") {
    return {
      id: "responder",
      label: "Responder",
      reason: energyStory?.nextInvestigation ?? clue.question?.reason ?? "Uma resposta curta ajuda a reduzir a principal incerteza da casa."
    };
  }
  if (status === "no_data") {
    return {
      id: "continuar",
      label: "Continuar",
      reason: "A experiencia ainda esta reunindo os primeiros sinais reais da residencia."
    };
  }
  if (status === "building_baseline") {
    return {
      id: "continuar",
      label: "Continuar",
      reason: "Mais continuidade ajuda a formar a linha de base da casa."
    };
  }
  if (status === "needs_more_context") {
    return {
      id: "descobrir",
      label: "Descobrir",
      reason: energyStory?.confidenceNarrative ?? "Ainda vale explorar um pouco mais antes de concluir qualquer coisa."
    };
  }
  if (status === "stable_observation") {
    return {
      id: "entender",
      label: "Entender",
      reason: energyStory?.confidenceNarrative ?? "Agora ja da para olhar a pista com um pouco mais de profundidade."
    };
  }
  return {
    id: "ver",
    label: "Ver",
    reason: energyStory?.confidenceNarrative ?? "Ja existe uma pista clara o bastante para ser mostrada."
  };
};
var buildSecondaryActions = (house) => {
  const actions = ["mostrar_detalhes"];
  if (house.memory.facts.length > 0 || house.memory.stablePatterns.length > 0) {
    actions.push("ver_memoria");
  }
  if (house.activeHypotheses.length > 0 || house.understanding.mainMystery || house.understanding.mainKnownPattern) {
    actions.push("pedir_explicacao");
  }
  return Array.from(new Set(actions));
};
var buildCoreExperienceFromJourney = (input) => {
  const house = buildHouseModelFromJourney(input);
  const primaryClue = selectPrimaryHouseClue(house);
  const energyStory = buildEnergyStoryFromJourney(input);
  const speech = buildCoreSpeech(primaryClue, {
    currentInvoice: input.currentInvoice,
    energyStory
  });
  const { status, reason } = buildStatus(house, primaryClue);
  const primaryAction = buildPrimaryAction(status, primaryClue, energyStory);
  const secondaryActions = buildSecondaryActions(house);
  return {
    id: `core-experience-${house.id}`,
    status,
    house,
    primaryClue,
    speech,
    primaryAction,
    secondaryActions,
    debug: {
      pipeline: energyStory ? ["house", "clue", "energy_story", "speech"] : ["house", "clue", "speech"],
      evidenceCount: primaryClue.evidenceIds.length,
      knownAreasCount: house.understanding.knownAreas.length,
      unknownAreasCount: house.understanding.unknownAreas.length,
      statusReason: reason
    }
  };
};

// src/lib/cognitive/buildRuntimeCoreExperience.ts
var buildRuntimeCoreExperience = ({
  isJourneyHydrated,
  userId,
  journeyState,
  memorySnapshot,
  scoreState
}) => {
  if (!isJourneyHydrated || !userId) {
    return void 0;
  }
  return buildCoreExperienceFromJourney({
    userId,
    updatedAt: journeyState.lastActiveAt,
    profile: journeyState.profile,
    currentInvoice: journeyState.analysis.latestInvoice,
    invoiceHistory: journeyState.analysis.invoiceHistory,
    analysisSummary: journeyState.analysis.summary,
    memorySnapshot,
    strategicAnswers: journeyState.userContext.questions,
    energyBehaviorProfile: journeyState.energyBehaviorProfile,
    knowledgeState: journeyState.knowledge,
    score: scoreState ? {
      value: scoreState.score,
      level: scoreState.level
    } : void 0
  });
};

// src/lib/invoiceParser.ts
var PT_BR_MONTHS = {
  JAN: "01",
  JANEIRO: "01",
  FEV: "02",
  FEVEREIRO: "02",
  MAR: "03",
  MARCO: "03",
  ABR: "04",
  ABRIL: "04",
  MAI: "05",
  MAIO: "05",
  JUN: "06",
  JUNHO: "06",
  JUL: "07",
  JULHO: "07",
  AGO: "08",
  AGOSTO: "08",
  SET: "09",
  SETEMBRO: "09",
  OUT: "10",
  OUTUBRO: "10",
  NOV: "11",
  NOVEMBRO: "11",
  DEZ: "12",
  DEZEMBRO: "12"
};
var EMPTY_FIELD = () => ({
  confidence: "missing"
});
var buildEmptyFields = () => ({
  providerName: EMPTY_FIELD(),
  consumerUnit: EMPTY_FIELD(),
  referenceMonth: EMPTY_FIELD(),
  issueDate: EMPTY_FIELD(),
  dueDate: EMPTY_FIELD(),
  totalValue: EMPTY_FIELD(),
  consumptionKwh: EMPTY_FIELD(),
  daysBilled: EMPTY_FIELD(),
  previousReading: EMPTY_FIELD(),
  currentReading: EMPTY_FIELD(),
  meterConstant: EMPTY_FIELD(),
  tariffFlag: EMPTY_FIELD(),
  teValue: EMPTY_FIELD(),
  tusdValue: EMPTY_FIELD(),
  publicLightingFee: EMPTY_FIELD(),
  taxesTotal: EMPTY_FIELD()
});
var confidenceRank4 = {
  missing: 0,
  low: 1,
  medium: 2,
  high: 3
};
var downgradeConfidence = (confidence) => {
  if (confidence === "high") {
    return "medium";
  }
  return "low";
};
var upgradeConfidence = (confidence) => {
  if (confidence === "low") {
    return "medium";
  }
  return "high";
};
var isFiniteNumber2 = (value) => typeof value === "number" && Number.isFinite(value);
var normalizeAscii = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u00a0/g, " ").replace(/\r/g, "\n");
var normalizeInvoiceText = (value) => normalizeAscii(value).replace(/\0/g, " ").replace(/[^\x20-\x7E\n]/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").toUpperCase().trim();
var normalizeInlineWhitespace = (value) => value.replace(/\s+/g, " ").trim();
var buildSearchText = (normalizedText) => {
  const lines = normalizedText.split("\n").map((line) => normalizeInlineWhitespace(line)).filter(Boolean);
  if (lines.length === 0) {
    return normalizedText;
  }
  const windows = /* @__PURE__ */ new Set();
  const windowSize = 6;
  for (let start = 0; start < lines.length; start += 1) {
    let combined = "";
    for (let offset = 0; offset < windowSize && start + offset < lines.length; offset += 1) {
      combined = combined ? `${combined} ${lines[start + offset]}` : lines[start + offset];
      windows.add(combined);
    }
  }
  return [normalizedText, lines.join(" "), ...windows].join("\n");
};
var parseBrazilianNumber = (value) => {
  const compact = value.replace(/[^\d,.-]/g, "");
  if (!compact) {
    return void 0;
  }
  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  let normalized = compact;
  if (lastComma > -1 && lastDot > -1) {
    normalized = lastComma > lastDot ? compact.replace(/\./g, "").replace(",", ".") : compact.replace(/,/g, "");
  } else if (lastComma > -1) {
    normalized = compact.replace(/\./g, "").replace(",", ".");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : void 0;
};
var parseIntegerValue = (value) => {
  const parsed = parseBrazilianNumber(value);
  if (!isFiniteNumber2(parsed)) {
    return void 0;
  }
  return Math.round(parsed);
};
var parseReadingNumber = (value) => {
  const compact = value.replace(/[^\d,.-]/g, "");
  if (!compact) {
    return void 0;
  }
  if (!compact.includes(",") && compact.includes(".")) {
    const normalized = compact.replace(/\./g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : void 0;
  }
  return parseBrazilianNumber(compact);
};
var normalizeDateValue = (value) => {
  const match = value.match(/\b(\d{2})\/(\d{2})\/(\d{2,4})\b/);
  if (!match) {
    return void 0;
  }
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText.length === 2 ? `20${yearText}` : yearText);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return void 0;
  }
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2e3 || year > 2100) {
    return void 0;
  }
  return `${dayText}/${monthText}/${year.toString().padStart(4, "0")}`;
};
var normalizeReferenceMonth = (value) => {
  const compactMatch = value.match(/\b(0[1-9]|1[0-2])\/(\d{4})\b/);
  if (compactMatch) {
    return `${compactMatch[1]}/${compactMatch[2]}`;
  }
  const monthNameMatch = value.match(
    /\b(JAN(?:EIRO)?|FEV(?:EREIRO)?|MAR(?:CO)?|ABR(?:IL)?|MAI(?:O)?|JUN(?:HO)?|JUL(?:HO)?|AGO(?:STO)?|SET(?:EMBRO)?|OUT(?:UBRO)?|NOV(?:EMBRO)?|DEZ(?:EMBRO)?)\b(?:\s+DE)?\s*[\/-]?\s*(\d{4})\b/
  );
  if (!monthNameMatch) {
    return void 0;
  }
  const month = PT_BR_MONTHS[monthNameMatch[1]];
  if (!month) {
    return void 0;
  }
  return `${month}/${monthNameMatch[2]}`;
};
var sanitizeProviderName = (value) => {
  const cleaned = value.replace(/\b(CNPJ|IE|CPF|ENDERECO|RUA|AVENIDA|CEP)\b[\s\S]*$/g, "").replace(/\s{2,}/g, " ").trim();
  return cleaned.length >= 4 ? cleaned : void 0;
};
var sanitizeConsumerUnit = (value) => {
  const cleaned = value.replace(/[^\dA-Z./-]/g, "").trim();
  return cleaned.length >= 4 ? cleaned : void 0;
};
var sanitizeTariffFlag = (value) => {
  const cleaned = value.replace(/\s{2,}/g, " ").replace(/[.;]+$/g, "").trim();
  if (!cleaned) {
    return void 0;
  }
  const knownFlag = cleaned.match(
    /\b(ESCASSEZ HIDRICA|SEM BANDEIRA|VERMELHA PATAMAR ?[12]|VERMELHA|AMARELA|VERDE)\b/
  );
  return knownFlag?.[0];
};
var pushCandidate = (candidates, value, confidence, index, validate) => {
  if (value === void 0) {
    return;
  }
  if (validate && !validate(value)) {
    return;
  }
  candidates.push({ value, confidence, index });
};
var collectCandidates = (normalizedText, rules) => {
  const candidates = [];
  rules.forEach((rule) => {
    for (const match of normalizedText.matchAll(rule.pattern)) {
      pushCandidate(
        candidates,
        rule.parse(match),
        rule.confidence,
        match.index ?? Number.MAX_SAFE_INTEGER,
        rule.validate
      );
    }
  });
  return candidates;
};
var resolveField = (candidates) => {
  if (candidates.length === 0) {
    return EMPTY_FIELD();
  }
  const sorted = [...candidates].sort((left, right) => {
    const confidenceDelta = confidenceRank4[right.confidence] - confidenceRank4[left.confidence];
    if (confidenceDelta !== 0) {
      return confidenceDelta;
    }
    return left.index - right.index;
  });
  const best = sorted[0];
  const bestValueKey = JSON.stringify(best.value);
  const conflictingBest = sorted.some(
    (candidate) => candidate !== best && confidenceRank4[candidate.confidence] === confidenceRank4[best.confidence] && JSON.stringify(candidate.value) !== bestValueKey
  );
  return {
    value: best.value,
    confidence: conflictingBest ? downgradeConfidence(best.confidence) : best.confidence
  };
};
var validateCurrency = (value) => value > 0 && value < 1e6;
var validateConsumption = (value) => value >= 0 && value < 1e7;
var validateDays = (value) => value >= 1 && value <= 90;
var validateReading = (value) => value >= 0 && value < 1e8;
var validateConstant = (value) => value > 0 && value <= 1e3;
var extractHeaderProviderName = (normalizedText) => {
  const lines = normalizedText.split("\n").map((line) => normalizeInlineWhitespace(line)).filter(Boolean).slice(0, 18);
  for (const line of lines) {
    if (/\b(ENERGIA|ELETRICA|DISTRIBUIDORA|COMPANHIA|CELESC|ENEL|COELBA|EQUATORIAL|LIGHT|CPFL)\b/.test(
      line
    ) && !/\d{4,}/.test(line)) {
      const value = sanitizeProviderName(line);
      if (value) {
        return value;
      }
    }
  }
  return void 0;
};
var collectReadingPairCandidates = (searchText) => {
  const previousCandidates = [];
  const currentCandidates = [];
  const pairRules = [
    /LEITURA\s+ANTERIOR\s+LEITURA\s+ATUAL\s+([\d.,]+)\s+([\d.,]+)/g,
    /LEITURA\s+ANTERIOR\s*[:\-]?\s*([\d.,]+)\s+(?:LEITURA\s+ATUAL\s*[:\-]?\s*)?([\d.,]+)/g,
    /LEITURA\s+ANT\s*[:\-]?\s*([\d.,]+)\s+(?:LEITURA\s+AT(?:UAL)?\s*[:\-]?\s*)?([\d.,]+)/g
  ];
  pairRules.forEach((pattern) => {
    for (const match of searchText.matchAll(pattern)) {
      const currentValue = parseReadingNumber(match[2]);
      const normalizedPreviousValue = parseReadingNumber(match[1]);
      const index = match.index ?? Number.MAX_SAFE_INTEGER;
      pushCandidate(previousCandidates, normalizedPreviousValue, "high", index, validateReading);
      pushCandidate(currentCandidates, currentValue, "high", index, validateReading);
    }
  });
  return {
    previousCandidates,
    currentCandidates
  };
};
var collectClientHeaderCandidates = (searchText) => {
  const consumerUnitCandidates = [];
  const referenceMonthCandidates = [];
  const dueDateCandidates = [];
  const totalValueCandidates = [];
  const clientHeaderPattern = /(\d{6,})\s+(\d{6,})\s+CLIENTE:\s+((?:0[1-9]|1[0-2])\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+([\d.]+,\d{2})\s+R\$/g;
  for (const match of searchText.matchAll(clientHeaderPattern)) {
    const index = match.index ?? Number.MAX_SAFE_INTEGER;
    pushCandidate(
      consumerUnitCandidates,
      sanitizeConsumerUnit(match[1]),
      "high",
      index
    );
    pushCandidate(
      referenceMonthCandidates,
      normalizeReferenceMonth(match[3]),
      "high",
      index
    );
    pushCandidate(
      dueDateCandidates,
      normalizeDateValue(match[4]),
      "high",
      index
    );
    pushCandidate(
      totalValueCandidates,
      parseBrazilianNumber(match[5]),
      "high",
      index,
      validateCurrency
    );
  }
  return {
    consumerUnitCandidates,
    referenceMonthCandidates,
    dueDateCandidates,
    totalValueCandidates
  };
};
var collectMeterSequenceCandidates = (searchText) => {
  const consumptionCandidates = [];
  const previousCandidates = [];
  const currentCandidates = [];
  const constantCandidates = [];
  const meterPattern = /LIDA\s+\d{4,}\s+ENERGIA\s+[A-Z]+\s+([\d.]+)\s+([\d.]+)\s+([\d.,]+)\s+([\d.,]+)\s+(\d+)\s+(?:LEGENDA|BENEFICIARIO)/g;
  for (const match of searchText.matchAll(meterPattern)) {
    const index = match.index ?? Number.MAX_SAFE_INTEGER;
    pushCandidate(
      previousCandidates,
      parseReadingNumber(match[1]),
      "high",
      index,
      validateReading
    );
    pushCandidate(
      currentCandidates,
      parseReadingNumber(match[2]),
      "high",
      index,
      validateReading
    );
    pushCandidate(
      constantCandidates,
      parseBrazilianNumber(match[3]),
      "high",
      index,
      validateConstant
    );
    pushCandidate(
      consumptionCandidates,
      parseBrazilianNumber(match[5]),
      "high",
      index,
      validateConsumption
    );
  }
  return {
    consumptionCandidates,
    previousCandidates,
    currentCandidates,
    constantCandidates
  };
};
var extractFieldsFromText = (normalizedText) => {
  const fields = buildEmptyFields();
  const searchText = buildSearchText(normalizedText);
  const { previousCandidates, currentCandidates } = collectReadingPairCandidates(searchText);
  const {
    consumerUnitCandidates,
    referenceMonthCandidates,
    dueDateCandidates,
    totalValueCandidates
  } = collectClientHeaderCandidates(searchText);
  const {
    consumptionCandidates,
    previousCandidates: meterPreviousCandidates,
    currentCandidates: meterCurrentCandidates,
    constantCandidates
  } = collectMeterSequenceCandidates(searchText);
  fields.providerName = resolveField([
    ...collectCandidates(searchText, [
      {
        pattern: /(?:DISTRIBUIDORA|CONCESSIONARIA|CONCESSIONARIA RESPONSAVEL|FORNECEDORA|RAZAO SOCIAL)\s*[:\-]?\s*([A-Z][A-Z\s.&/-]{3,80})/g,
        confidence: "high",
        parse: (match) => sanitizeProviderName(match[1])
      },
      {
        pattern: /BENEFICIARIO\s*:\s*([A-Z][A-Z\s.&/-]{4,80})\s*-\s*CNPJ/g,
        confidence: "high",
        parse: (match) => sanitizeProviderName(match[1])
      }
    ]),
    ...(() => {
      const provider = extractHeaderProviderName(normalizedText);
      return provider ? [{ value: provider, confidence: "low", index: 0 }] : [];
    })()
  ]);
  fields.consumerUnit = resolveField(
    [
      ...consumerUnitCandidates,
      ...collectCandidates(searchText, [
        {
          pattern: /(?:UNIDADE\s+CONSUMIDORA|UNIDADE\s+CLIENTE|NUMERO\s+DA\s+UC|NUMERO\s+UC|N[OU]\s+DA\s+UC|INSTALACAO)\s*[:\-]?\s*([A-Z0-9./-]{4,25})/g,
          confidence: "high",
          parse: (match) => sanitizeConsumerUnit(match[1])
        },
        {
          pattern: /\bUC\s*[:\-]?\s*([A-Z0-9./-]{4,25})/g,
          confidence: "medium",
          parse: (match) => sanitizeConsumerUnit(match[1])
        }
      ])
    ]
  );
  fields.referenceMonth = resolveField(
    [
      ...referenceMonthCandidates,
      ...collectCandidates(searchText, [
        {
          pattern: /(?:REFERENCIA|MES\/ANO|MES ANO|COMPETENCIA|PERIODO DE REFERENCIA)\s*[:\-]?\s*([A-Z0-9/ -]{4,20})/g,
          confidence: "high",
          parse: (match) => normalizeReferenceMonth(match[1])
        }
      ])
    ]
  );
  fields.issueDate = resolveField(
    collectCandidates(searchText, [
      {
        pattern: /(?:DATA\s+DE\s+EMISSAO|EMISSAO|EMITIDA\s+EM)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{2,4})/g,
        confidence: "high",
        parse: (match) => normalizeDateValue(match[1])
      }
    ])
  );
  fields.dueDate = resolveField(
    [
      ...dueDateCandidates,
      ...collectCandidates(searchText, [
        {
          pattern: /(?:VENCIMENTO|VCTO|VENCTO|PAGAR\s+ATE|DATA\s+DE\s+VENCIMENTO)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{2,4})/g,
          confidence: "high",
          parse: (match) => normalizeDateValue(match[1])
        }
      ])
    ]
  );
  fields.totalValue = resolveField(
    [
      ...totalValueCandidates,
      ...collectCandidates(searchText, [
        {
          pattern: /(?:TOTAL\s+A\s+PAGAR|VALOR\s+A\s+PAGAR|VALOR\s+TOTAL(?:\s+DA\s+FATURA)?|TOTAL\s+DA\s+FATURA)\s*[:\-]?\s*(R?\$?\s*[\d.,]+)/g,
          confidence: "high",
          parse: (match) => parseBrazilianNumber(match[1]),
          validate: validateCurrency
        },
        {
          pattern: /\bTOTAL\b\s*[:\-]?\s*(R?\$?\s*[\d.,]+)/g,
          confidence: "medium",
          parse: (match) => parseBrazilianNumber(match[1]),
          validate: validateCurrency
        }
      ])
    ]
  );
  fields.consumptionKwh = resolveField(
    [
      ...consumptionCandidates,
      ...collectCandidates(searchText, [
        {
          pattern: /(?:CONSUMO\s+FATURADO|CONSUMO\s+TOTAL|TOTAL\s+APURADO|ENERGIA\s+ATIVA(?:\s+TOTAL)?)\s*[:\-]?\s*([\d.,]+)\s*KWH\b/g,
          confidence: "high",
          parse: (match) => parseBrazilianNumber(match[1]),
          validate: validateConsumption
        },
        {
          pattern: /\bCONSUMO\b\s*[:\-]?\s*([\d.,]+)\s*KWH\b/g,
          confidence: "medium",
          parse: (match) => parseBrazilianNumber(match[1]),
          validate: validateConsumption
        }
      ])
    ]
  );
  fields.daysBilled = resolveField(
    collectCandidates(searchText, [
      {
        pattern: /(?:DIAS\s+FATURADOS|DIAS\s+DE\s+FATURAMENTO|DIAS\s+DE\s+CONSUMO)\s*[:\-]?\s*(\d{1,3})/g,
        confidence: "high",
        parse: (match) => parseIntegerValue(match[1]),
        validate: validateDays
      },
      {
        pattern: /\bDIAS\b\s*[:\-]?\s*(\d{1,3})/g,
        confidence: "low",
        parse: (match) => parseIntegerValue(match[1]),
        validate: validateDays
      }
    ])
  );
  fields.previousReading = resolveField(
    [
      ...previousCandidates,
      ...meterPreviousCandidates,
      ...collectCandidates(searchText, [
        {
          pattern: /(?:LEITURA\s+ANTERIOR|LEITURA\s+ANT)\s*[:\-]?\s*([\d.,]+)/g,
          confidence: "high",
          parse: (match) => parseReadingNumber(match[1]),
          validate: validateReading
        }
      ])
    ]
  );
  fields.currentReading = resolveField(
    [
      ...currentCandidates,
      ...meterCurrentCandidates,
      ...collectCandidates(searchText, [
        {
          pattern: /(?:LEITURA\s+ATUAL|LEITURA\s+AT)\s*[:\-]?\s*([\d.,]+)/g,
          confidence: "high",
          parse: (match) => parseReadingNumber(match[1]),
          validate: validateReading
        }
      ])
    ]
  );
  fields.meterConstant = resolveField(
    [
      ...constantCandidates,
      ...collectCandidates(searchText, [
        {
          pattern: /(?:CONSTANTE(?:\s+DO\s+MEDIDOR)?|MULTIPLICADOR)\s*[:\-]?\s*([\d.,]+)/g,
          confidence: "high",
          parse: (match) => parseBrazilianNumber(match[1]),
          validate: validateConstant
        }
      ])
    ]
  );
  fields.tariffFlag = resolveField(
    collectCandidates(searchText, [
      {
        pattern: /(?:BANDEIRA(?:\s+TARIFARIA)?)\s*[:\-]?\s*([A-Z0-9 ]{4,40})/g,
        confidence: "high",
        parse: (match) => sanitizeTariffFlag(match[1])
      }
    ])
  );
  fields.teValue = resolveField(
    collectCandidates(searchText, [
      {
        pattern: /\bTE\b[^\dR$]{0,15}(R?\$?\s*[\d.,]+)/g,
        confidence: "medium",
        parse: (match) => parseBrazilianNumber(match[1]),
        validate: validateCurrency
      }
    ])
  );
  fields.tusdValue = resolveField(
    collectCandidates(searchText, [
      {
        pattern: /\bTUSD\b[^\dR$]{0,15}(R?\$?\s*[\d.,]+)/g,
        confidence: "medium",
        parse: (match) => parseBrazilianNumber(match[1]),
        validate: validateCurrency
      }
    ])
  );
  fields.publicLightingFee = resolveField(
    collectCandidates(searchText, [
      {
        pattern: /(?:CIP|COSIP|CONTRIBUICAO\s+ILUMINACAO\s+PUBLICA)\s*[:\-]?\s*(R?\$?\s*[\d.,]+)/g,
        confidence: "high",
        parse: (match) => parseBrazilianNumber(match[1]),
        validate: validateCurrency
      }
    ])
  );
  fields.taxesTotal = resolveField(
    collectCandidates(searchText, [
      {
        pattern: /(?:TOTAL\s+DE\s+TRIBUTOS|TRIBUTOS|IMPOSTOS)\s*[:\-]?\s*(R?\$?\s*[\d.,]+)/g,
        confidence: "high",
        parse: (match) => parseBrazilianNumber(match[1]),
        validate: validateCurrency
      }
    ])
  );
  return applyCrossValidation(fields);
};
var applyCrossValidation = (fields) => {
  const adjusted = { ...fields };
  const consumption = adjusted.consumptionKwh.value;
  const previousReading = adjusted.previousReading.value;
  const currentReading = adjusted.currentReading.value;
  const meterConstant = adjusted.meterConstant.value ?? 1;
  if (isFiniteNumber2(consumption) && isFiniteNumber2(previousReading) && isFiniteNumber2(currentReading) && currentReading >= previousReading) {
    const computedConsumption = (currentReading - previousReading) * meterConstant;
    const tolerance = Math.max(3, computedConsumption * 0.08);
    const isCoherent = Math.abs(computedConsumption - consumption) <= tolerance;
    if (isCoherent) {
      adjusted.consumptionKwh = {
        value: consumption,
        confidence: upgradeConfidence(adjusted.consumptionKwh.confidence)
      };
      adjusted.previousReading = {
        value: previousReading,
        confidence: upgradeConfidence(adjusted.previousReading.confidence)
      };
      adjusted.currentReading = {
        value: currentReading,
        confidence: upgradeConfidence(adjusted.currentReading.confidence)
      };
    } else {
      adjusted.previousReading = {
        value: previousReading,
        confidence: downgradeConfidence(adjusted.previousReading.confidence)
      };
      adjusted.currentReading = {
        value: currentReading,
        confidence: downgradeConfidence(adjusted.currentReading.confidence)
      };
    }
  }
  if (isFiniteNumber2(adjusted.totalValue.value) && isFiniteNumber2(adjusted.taxesTotal.value) && adjusted.taxesTotal.value > adjusted.totalValue.value) {
    adjusted.taxesTotal = {
      value: adjusted.taxesTotal.value,
      confidence: "low"
    };
  }
  return adjusted;
};
var createAuditSample = (value) => value.replace(/\r/g, "\n").replace(/[^\x20-\x7E\n]/g, " ").replace(/[ \t]+/g, " ").trim().slice(0, 500);
var getKeywordPresenceSnapshot = (value) => {
  const normalizedValue = value.toUpperCase();
  return {
    REFERENCIA: normalizedValue.includes("REFERENCIA"),
    VENCIMENTO: normalizedValue.includes("VENCIMENTO"),
    CONSUMO: normalizedValue.includes("CONSUMO"),
    KWH: normalizedValue.includes("KWH"),
    "R$": value.includes("R$") || normalizedValue.includes("R$")
  };
};
var shouldLogParserAudit = () => {
  const viteDev = Boolean(import.meta.env?.DEV);
  if (viteDev) {
    return true;
  }
  return typeof process !== "undefined" && process.release?.name === "node" && process.env.NODE_ENV !== "production";
};
var logParserDebugStage = (stage, payload) => {
  if (!shouldLogParserAudit()) {
    return;
  }
  console.debug(`[invoice-parser] ${stage}`, payload);
};
var parseInvoiceText = (rawText) => {
  const normalizedText = normalizeInvoiceText(rawText);
  logParserDebugStage("raw-text", {
    rawTextLength: rawText.length,
    rawTextSample: createAuditSample(rawText),
    keywordPresence: getKeywordPresenceSnapshot(rawText)
  });
  logParserDebugStage("normalized-text", {
    normalizedTextLength: normalizedText.length,
    normalizedTextSample: createAuditSample(normalizedText),
    keywordPresence: getKeywordPresenceSnapshot(normalizedText)
  });
  if (!normalizedText) {
    return {
      rawTextAvailable: false,
      textSource: "empty",
      normalizedText,
      fields: buildEmptyFields()
    };
  }
  return {
    rawTextAvailable: true,
    textSource: "plain-text",
    normalizedText,
    fields: extractFieldsFromText(normalizedText)
  };
};

// src/lib/mvpJourneyState.ts
var RETURN_VISIT_MS = 1e3 * 60 * 30;
var DEFAULT_PROFILE = {
  consumerType: "Residencial",
  location: "",
  propertySize: 0,
  peopleCount: 1,
  energyPreference: "Convencional"
};
var DEFAULT_MASCOT = {
  name: "EcoFriend",
  emoji: "\u{1F331}",
  colorPalette: "emerald",
  borderEffect: "none"
};
var DEFAULT_ANALYSIS_STATE = {
  status: "idle",
  invoiceHistory: []
};
var DEFAULT_ACTIONS_STATE = {
  items: [],
  viewedActionIds: []
};
var DEFAULT_USER_CONTEXT_STATE = {
  questions: {}
};
var DEFAULT_KNOWLEDGE_STATE = {
  learned: {},
  lastLearnedId: void 0
};
var DEFAULT_ENERGY_BEHAVIOR_PROFILE = {
  appliances: {},
  habits: {},
  intentions: {},
  qualification: {},
  actionMemory: {},
  confidence: {}
};
var DEFAULT_MVP_STATE = {
  profile: DEFAULT_PROFILE,
  mascot: DEFAULT_MASCOT,
  userContext: DEFAULT_USER_CONTEXT_STATE,
  knowledge: DEFAULT_KNOWLEDGE_STATE,
  energyBehaviorProfile: DEFAULT_ENERGY_BEHAVIOR_PROFILE,
  analysis: DEFAULT_ANALYSIS_STATE,
  scoreEvents: [],
  actions: DEFAULT_ACTIONS_STATE,
  journeyStage: "onboarding"
};

// .tmp-story-runtime-inspect/inspect-entry.ts
var currentInvoice = {
  fingerprint: "invoice-runtime-001",
  fileName: "runtime.pdf",
  fileType: "application/pdf",
  fileSize: 2048,
  consumption: 280,
  totalValue: 320,
  month: "maio de 2026",
  parser: parseInvoiceText(`
      DISTRIBUIDORA: SCORE TESTE
      REFERENCIA: 05/2026
      TOTAL A PAGAR: R$ 320,00
      CONSUMO FATURADO: 280 kWh
    `),
  uploadedAt: "2026-05-10T10:00:00.000Z"
};
var state = {
  ...DEFAULT_MVP_STATE,
  profile: {
    ...DEFAULT_MVP_STATE.profile,
    propertySize: 82
  },
  analysis: {
    ...DEFAULT_MVP_STATE.analysis,
    latestInvoice: currentInvoice,
    invoiceHistory: [currentInvoice]
  },
  energyBehaviorProfile: {
    ...DEFAULT_MVP_STATE.energyBehaviorProfile,
    habits: {
      ...DEFAULT_MVP_STATE.energyBehaviorProfile.habits,
      roomCountRange: "4_6"
    },
    intentions: {
      ...DEFAULT_MVP_STATE.energyBehaviorProfile.intentions,
      thermalComfortInterest: "sim"
    }
  }
};
var experience = buildRuntimeCoreExperience({
  isJourneyHydrated: true,
  userId: "user-bridge-2",
  journeyState: state
});
console.log(JSON.stringify({
  speechSource: experience?.speech.source,
  opening: experience?.speech.opening,
  clueLine: experience?.speech.clueLine,
  primaryReason: experience?.primaryAction.reason,
  question: experience?.primaryClue.question?.question,
  status: experience?.status,
  clueKind: experience?.primaryClue.kind
}, null, 2));
