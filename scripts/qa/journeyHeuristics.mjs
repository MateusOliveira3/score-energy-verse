const PRIMARY_GOAL_CONTEXT_QUESTION = {
  id: 'primary_goal',
  prompt: 'Seu objetivo principal agora e?',
  optionLabels: ['Reduzir custo', 'Entender consumo', 'Os dois'],
  source: 'context',
};

const QUESTION_DOMAIN_BY_ID = {
  residence_type: 'estrutura',
  room_count: 'estrutura',
  children_presence: 'ocupacao',
  elderly_presence: 'ocupacao',
  bathrooms_count: 'banheiro',
  showers_count: 'banheiro',
  shower_heating_type: 'banheiro',
  air_conditioning_presence: 'climatizacao',
  air_conditioning_count: 'climatizacao',
  cooking_type: 'cozinha',
  electric_oven_presence: 'cozinha',
  extra_fridge_presence: 'cozinha',
  washing_machine_presence: 'lavanderia',
  dryer_presence: 'lavanderia',
  dominant_usage_period: 'rotina',
};

const QUESTION_ORDER = [
  'residence_type',
  'room_count',
  'children_presence',
  'elderly_presence',
  'bathrooms_count',
  'showers_count',
  'shower_heating_type',
  'air_conditioning_presence',
  'air_conditioning_count',
  'cooking_type',
  'electric_oven_presence',
  'extra_fridge_presence',
  'washing_machine_presence',
  'dryer_presence',
  'dominant_usage_period',
];

const normalizeLabel = (value) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';

const unique = (values) => Array.from(new Set(values.filter(Boolean)));

const isDetailLikeLabel = (label) => {
  const normalized = normalizeLabel(label).toLowerCase();
  return (
    /detalh/i.test(normalized) ||
    normalized.includes('ver o que ja percebi') ||
    normalized.includes('ver pistas') ||
    normalized.includes('ver contexto')
  );
};

export const deriveJourneyStateSignals = (state) => {
  const actions = Array.isArray(state?.actions?.items) ? state.actions.items : [];
  const invoiceHistory = Array.isArray(state?.analysis?.invoiceHistory)
    ? state.analysis.invoiceHistory
    : [];
  const answeredActionPrompts = state?.energyBehaviorProfile?.actionMemory?.answeredActionPrompts;
  const answeredQuestionIds = new Set(
    answeredActionPrompts && typeof answeredActionPrompts === 'object'
      ? Object.keys(answeredActionPrompts)
      : []
  );
  const primaryAction = actions[0];
  const pendingActionQuestion =
    actions
      .flatMap((action) =>
        (Array.isArray(action?.interactiveQuestions) ? action.interactiveQuestions : []).map(
          (question) => ({
            action,
            question,
          })
        )
      )
      .find(
        ({ question }) =>
          question &&
          typeof question.id === 'string' &&
          !answeredQuestionIds.has(question.id) &&
          Array.isArray(question.options) &&
          question.options.length > 0
      ) ?? null;

  const primaryGoalAnswerStatus = state?.userContext?.questions?.primary_goal?.status;
  const pendingContextQuestion =
    !pendingActionQuestion &&
    invoiceHistory.length > 1 &&
    primaryGoalAnswerStatus !== 'answered' &&
    primaryGoalAnswerStatus !== 'ignored'
      ? PRIMARY_GOAL_CONTEXT_QUESTION
      : undefined;

  const pendingQuestion = pendingActionQuestion
    ? {
        id: pendingActionQuestion.question.id,
        prompt: pendingActionQuestion.question.prompt,
        helperText: pendingActionQuestion.question.helperText,
        optionLabels: pendingActionQuestion.question.options.map((option) => option.label),
        domain: QUESTION_DOMAIN_BY_ID[pendingActionQuestion.question.id] ?? 'desconhecido',
        source: 'action',
        actionTitle: pendingActionQuestion.action?.title,
      }
    : pendingContextQuestion;

  const residenceKnowledgeCount = [
    Boolean(state?.energyBehaviorProfile?.habits?.residenceType),
    Boolean(state?.energyBehaviorProfile?.habits?.roomCountRange),
    typeof state?.energyBehaviorProfile?.habits?.hasChildren === 'boolean',
    typeof state?.energyBehaviorProfile?.habits?.hasElderly === 'boolean',
    typeof state?.energyBehaviorProfile?.appliances?.bathrooms === 'number',
    typeof state?.energyBehaviorProfile?.appliances?.showers === 'number',
    Boolean(state?.energyBehaviorProfile?.appliances?.showerHeatingType),
    typeof state?.energyBehaviorProfile?.appliances?.hasAirConditioning === 'boolean',
    typeof state?.energyBehaviorProfile?.appliances?.airConditioningCount === 'number' ||
      state?.energyBehaviorProfile?.appliances?.hasAirConditioning === false,
    Boolean(state?.energyBehaviorProfile?.appliances?.cookingType),
    typeof state?.energyBehaviorProfile?.appliances?.hasElectricOven === 'boolean',
    typeof state?.energyBehaviorProfile?.appliances?.hasExtraFridge === 'boolean',
    typeof state?.energyBehaviorProfile?.appliances?.hasWashingMachine === 'boolean',
    typeof state?.energyBehaviorProfile?.appliances?.hasDryer === 'boolean',
    Boolean(state?.energyBehaviorProfile?.habits?.dominantUsageRoutine),
  ].filter(Boolean).length;

  return {
    analysisStatus: state?.analysis?.status,
    hasReadyAnalysis:
      state?.analysis?.status === 'ready' && state?.journeyStage === 'analysis-ready',
    invoiceHistoryLength: invoiceHistory.length,
    journeyStage: state?.journeyStage,
    pendingQuestion,
    primaryActionLabel: primaryAction?.title,
    primaryActionCtaLabel: primaryAction?.ctaLabel,
    primaryActionStatus: primaryAction?.status,
    unansweredActionQuestionCount: actions.reduce((count, action) => {
      const questions = Array.isArray(action?.interactiveQuestions) ? action.interactiveQuestions : [];
      return (
        count +
        questions.filter(
          (question) => question?.id && !answeredQuestionIds.has(question.id)
        ).length
      );
    }, 0),
    residenceKnowledgeCount,
  };
};

export const assessQuestionHeuristics = ({
  pendingQuestion,
  heroInteractiveLabels,
  promptVisible,
  helperVisible,
}) => {
  const expectedOptionLabels = pendingQuestion?.optionLabels?.map(normalizeLabel) ?? [];
  const visibleLabels = unique(heroInteractiveLabels.map(normalizeLabel));
  const matchedOptionLabels = expectedOptionLabels.filter((label) => visibleLabels.includes(label));
  const responseAreaVisible =
    expectedOptionLabels.length > 0 && matchedOptionLabels.length === expectedOptionLabels.length;
  const explicitQuestionVisible = Boolean(pendingQuestion && promptVisible && responseAreaVisible);
  const contextBeforeOptionsVisible = Boolean(
    pendingQuestion &&
      promptVisible &&
      (helperVisible || !normalizeLabel(pendingQuestion.helperText))
  );
  const belongsToCognitiveState = Boolean(
    pendingQuestion && (responseAreaVisible || promptVisible || matchedOptionLabels.length > 0)
  );

  return {
    belongsToCognitiveState,
    contextBeforeOptionsVisible,
    explicitQuestionVisible,
    matchedOptionLabels,
    responseAreaVisible,
  };
};

export const assessAuthorityHeuristics = ({
  questionAssessment,
  heroActionLabels,
  detailTriggerCount,
}) => {
  const normalizedLabels = unique(heroActionLabels.map(normalizeLabel));
  const optionLabels = unique((questionAssessment?.matchedOptionLabels ?? []).map(normalizeLabel));
  const detailLabels = normalizedLabels.filter((label) => isDetailLikeLabel(label));
  const nonDetailActionLabels = normalizedLabels.filter(
    (label) => !isDetailLikeLabel(label) && !optionLabels.includes(label)
  );
  const questionDrivenPrimary =
    questionAssessment.belongsToCognitiveState &&
    questionAssessment.explicitQuestionVisible &&
    questionAssessment.responseAreaVisible;
  const competingPrimaryLabels = questionDrivenPrimary
    ? nonDetailActionLabels
    : nonDetailActionLabels.slice(1);
  const competingCtas =
    detailTriggerCount > 1 ||
    (questionDrivenPrimary ? nonDetailActionLabels.length > 0 : nonDetailActionLabels.length > 1);
  const hasSinglePrimaryAction = questionDrivenPrimary
    ? !competingCtas
    : nonDetailActionLabels.length === 1 && detailTriggerCount <= 1;
  const dominantActionLabel = questionDrivenPrimary
    ? 'Responder pergunta ativa'
    : nonDetailActionLabels[0];
  const clearNextStep = questionDrivenPrimary || nonDetailActionLabels.length === 1;
  const nextStepJustification = questionDrivenPrimary
    ? 'A pergunta ativa concentra a atencao e as respostas estao no mesmo bloco do Hero.'
    : nonDetailActionLabels.length === 1
      ? `A Hero oferece uma continuidade dominante sem competir com outras acoes: "${nonDetailActionLabels[0]}".`
      : detailTriggerCount > 1
        ? 'A Hero ainda divide a atencao entre mais de um atalho para detalhes.'
        : nonDetailActionLabels.length > 1
          ? `A Hero expoe mais de uma acao principal ao mesmo tempo: ${nonDetailActionLabels.join(', ')}.`
          : 'A Hero nao deixa um unico proximo passo dominante acima dos atalhos secundarios.';

  return {
    clearNextStep,
    competingCtas,
    competingPrimaryLabels,
    detailLabels,
    detailTriggerCount,
    dominantActionLabel,
    hasSinglePrimaryAction,
    nextStepJustification,
    nonDetailActionLabels,
    questionDrivenPrimary,
  };
};

export const assessResidenceMappingHeuristics = ({
  beforeCount,
  afterCount,
}) => {
  const delta = afterCount - beforeCount;
  const residenceFeelsKnown = delta >= 2 || afterCount >= 3;
  const justification =
    delta > 0
      ? `O estado cognitivo passou de ${beforeCount} para ${afterCount} sinais estruturais da residencia.`
      : `O estado cognitivo permaneceu em ${afterCount} sinais estruturais da residencia.`;

  return {
    afterCount,
    beforeCount,
    delta,
    justification,
    residenceFeelsKnown,
  };
};

export const assessQuestionContinuityHeuristics = (snapshots) => {
  const transitions = [];

  for (let index = 0; index < snapshots.length - 1; index += 1) {
    const current = snapshots[index];
    const next = snapshots[index + 1];
    const currentOrder = QUESTION_ORDER.indexOf(current?.pendingQuestion?.id);
    const nextOrder = QUESTION_ORDER.indexOf(next?.pendingQuestion?.id);
    const advanced =
      currentOrder >= 0 &&
      nextOrder >= 0 &&
      nextOrder > currentOrder;
    const helperVisible = next?.helperVisible === true;
    const sameOrAdjacentDomain =
      current?.pendingQuestion?.domain === next?.pendingQuestion?.domain ||
      (current?.pendingQuestion?.domain && next?.pendingQuestion?.domain && advanced);

    transitions.push({
      advanced,
      from: current?.pendingQuestion?.id,
      helperVisible,
      sameOrAdjacentDomain,
      to: next?.pendingQuestion?.id,
    });
  }

  const validTransitions = transitions.filter((transition) => transition.from && transition.to);
  const continuityVisible =
    validTransitions.length > 0 &&
    validTransitions.every(
      (transition) =>
        transition.advanced &&
        transition.helperVisible &&
        transition.sameOrAdjacentDomain
    );
  const investigationTone = continuityVisible;
  const justification =
    validTransitions.length === 0
      ? 'A auditoria nao conseguiu observar mais de uma pergunta para medir continuidade.'
      : continuityVisible
        ? 'As perguntas avancam em ordem coerente e a proxima aparece com contexto visivel.'
        : 'A troca entre perguntas ainda parece mecanica ou sem contexto suficiente.';

  return {
    continuityVisible,
    investigationTone,
    justification,
    transitions: validTransitions,
  };
};

export const assessValueReturnHeuristics = ({
  initialSnapshot,
  transitionSnapshots,
}) => {
  const betweenQuestions = Array.isArray(transitionSnapshots)
    ? transitionSnapshots.filter(Boolean)
    : [];
  const initialValueDelivered = Boolean(
    initialSnapshot?.valueReturnVisible &&
      initialSnapshot?.continueVisible &&
      initialSnapshot?.feedbackLineCount >= 3
  );
  const valueBeforeNextQuestion =
    betweenQuestions.length > 0 &&
    betweenQuestions.every(
      (snapshot) =>
        snapshot.valueReturnVisible &&
        snapshot.continueVisible &&
        snapshot.nextQuestionHidden
    );
  const understandingCompounds =
    betweenQuestions.length > 0 &&
    betweenQuestions.every((snapshot) => snapshot.feedbackLineCount >= 3);
  const scoreWorksBetweenQuestions =
    betweenQuestions.length > 0 &&
    betweenQuestions.every((snapshot) => snapshot.feedbackLineCount >= 4);
  const conversationNotForm = valueBeforeNextQuestion && understandingCompounds;
  const justification =
    betweenQuestions.length === 0
      ? 'A auditoria nao conseguiu observar uma resposta completa seguida de devolucao de valor.'
      : valueBeforeNextQuestion
        ? 'Depois de cada resposta, a Hero entregou uma devolucao observavel antes de revelar a pergunta seguinte.'
        : 'A troca entre respostas e perguntas ainda passou rapido demais para parecer uma conversa interpretativa.';

  return {
    conversationNotForm,
    initialValueDelivered,
    justification,
    scoreWorksBetweenQuestions,
    understandingCompounds,
    valueBeforeNextQuestion,
  };
};

const UNDERSTANDING_LEVEL_ORDER = [
  'baixa_compreensao',
  'compreensao_inicial',
  'hipotese_fortalecida',
  'boa_compreensao',
  'alta_confianca',
];

const getUnderstandingLevelRank = (level) =>
  Math.max(0, UNDERSTANDING_LEVEL_ORDER.indexOf(level));

export const assessAccountUnderstandingHeuristics = ({
  beforePanel,
  progression,
}) => {
  const beforeCategories = Array.isArray(beforePanel?.categories) ? beforePanel.categories : [];
  const progressionEntries = Array.isArray(progression) ? progression.filter(Boolean) : [];
  const visible = Boolean(beforePanel?.visible && beforeCategories.length >= 7);
  const hasOpenFronts = beforeCategories.some((category) => category.isOpenQuestion);
  const hasSupportedCategory = beforeCategories.some(
    (category) => getUnderstandingLevelRank(category.level) >= 1
  );
  const perceivesUnderstanding = visible && hasOpenFronts && hasSupportedCategory;

  const changes = progressionEntries
    .map((entry) => {
      const relevantCategoryId = entry.relevantCategoryId;
      const beforeCategory = entry.before?.categories?.find(
        (category) => category.id === relevantCategoryId
      );
      const afterCategory = entry.after?.categories?.find(
        (category) => category.id === relevantCategoryId
      );

      if (!beforeCategory || !afterCategory) {
        return null;
      }

      const levelBeforeRank = getUnderstandingLevelRank(beforeCategory.level);
      const levelAfterRank = getUnderstandingLevelRank(afterCategory.level);
      const supportIncreased = (afterCategory.supportCount ?? 0) > (beforeCategory.supportCount ?? 0);
      const openPointChanged =
        (beforeCategory.openPoint ?? '') !== (afterCategory.openPoint ?? '');

      return {
        changed: levelAfterRank > levelBeforeRank || supportIncreased || openPointChanged,
        regressed: levelAfterRank < levelBeforeRank,
        relevantCategoryId,
      };
    })
    .filter(Boolean);

  const categoriesEvolveCoherently =
    changes.length > 0 &&
    changes.every((change) => change.changed && !change.regressed);
  const responseDrivenChanges = categoriesEvolveCoherently;
  const confidenceWithoutFinality =
    visible &&
    beforeCategories.some((category) => getUnderstandingLevelRank(category.level) >= 2) &&
    hasOpenFronts;
  const openUnknownsVisible = hasOpenFronts;
  const justification =
    !visible
      ? 'O painel de entendimento da conta nao apareceu de forma clara para a auditoria.'
      : categoriesEvolveCoherently
        ? 'As categorias evoluiram de forma coerente conforme a investigacao avancou.'
        : 'O painel apareceu, mas a evolucao das categorias ainda nao ficou suficientemente ligada as respostas observadas.';

  return {
    categoriesEvolveCoherently,
    confidenceWithoutFinality,
    justification,
    openUnknownsVisible,
    perceivesUnderstanding,
    responseDrivenChanges,
  };
};

export const extractAuditSnapshot = (markdown) => {
  if (!markdown || typeof markdown !== 'string') {
    return {};
  }

  const readMatch = (pattern) => markdown.match(pattern)?.[1];
  const detailTriggerValue = readMatch(/quantidade de gatilhos `Mostrar detalhes` na hero = `([^`]+)`/i);
  const detailTriggerCount =
    detailTriggerValue && !Number.isNaN(Number(detailTriggerValue))
      ? Number(detailTriggerValue)
      : undefined;

  return {
    activeQuestionVisible: readMatch(/pergunta explicita visivel = `([^`]+)`/i),
    accountUnderstandingVisible: readMatch(
      /- O usuario consegue perceber que a Score esta compreendendo sua conta\? (Sim|Nao)\./i
    ),
    detailTriggerCount,
    nextStepClear: readMatch(/- Proximo Passo Claro: (Sim|Nao)\./),
    valueBeforeNextQuestion: readMatch(
      /- O usuario recebeu algum valor antes da proxima pergunta\? (Sim|Nao)\./i
    ),
    uploadWorth: readMatch(/- O upload valeu a pena\? (Sim|Parcialmente|Nao)\./i),
    responseAreaVisible: readMatch(/Existe um local claro para responder\? (Sim|Nao)/i),
    residenceFeelsKnown: readMatch(/- A residencia parece estar ficando conhecida\? (Sim|Nao)\./i),
  };
};

export const compareAuditSnapshots = (previousSnapshot, currentSnapshot) => {
  const improved = [];
  const unchanged = [];
  const worsened = [];
  const firstValueRank = {
    Nao: 0,
    Parcialmente: 1,
    Sim: 2,
  };

  if (previousSnapshot?.activeQuestionVisible && currentSnapshot.activeQuestionVisible) {
    if (
      previousSnapshot.activeQuestionVisible.toLowerCase() !== 'sim' &&
      currentSnapshot.activeQuestionVisible.toLowerCase() === 'sim'
    ) {
      improved.push('A auditoria passou a reconhecer a pergunta ativa explicitamente no Hero.');
    } else if (
      previousSnapshot.activeQuestionVisible.toLowerCase() ===
      currentSnapshot.activeQuestionVisible.toLowerCase()
    ) {
      unchanged.push('A leitura sobre a visibilidade da pergunta permaneceu estavel entre as auditorias.');
    } else if (
      previousSnapshot.activeQuestionVisible.toLowerCase() === 'sim' &&
      currentSnapshot.activeQuestionVisible.toLowerCase() !== 'sim'
    ) {
      worsened.push('A auditoria deixou de reconhecer uma pergunta que antes aparecia como visivel.');
    }
  }

  if (
    typeof previousSnapshot?.detailTriggerCount === 'number' &&
    typeof currentSnapshot.detailTriggerCount === 'number'
  ) {
    if (currentSnapshot.detailTriggerCount < previousSnapshot.detailTriggerCount) {
      improved.push(
        `A auditoria registrou menos concorrencia de detalhes na Hero (${previousSnapshot.detailTriggerCount} -> ${currentSnapshot.detailTriggerCount}).`
      );
    } else if (currentSnapshot.detailTriggerCount === previousSnapshot.detailTriggerCount) {
      unchanged.push(
        `A contagem de gatilhos de detalhe na Hero permaneceu igual (${currentSnapshot.detailTriggerCount}).`
      );
    } else {
      worsened.push(
        `A auditoria encontrou mais gatilhos de detalhe na Hero (${previousSnapshot.detailTriggerCount} -> ${currentSnapshot.detailTriggerCount}).`
      );
    }
  }

  if (previousSnapshot?.nextStepClear && currentSnapshot.nextStepClear) {
    if (
      previousSnapshot.nextStepClear.toLowerCase() !== 'sim' &&
      currentSnapshot.nextStepClear.toLowerCase() === 'sim'
    ) {
      improved.push('O QA agora reconhece um proximo passo dominante sem depender de abrir detalhes.');
    } else if (
      previousSnapshot.nextStepClear.toLowerCase() ===
      currentSnapshot.nextStepClear.toLowerCase()
    ) {
      unchanged.push('A leitura sobre clareza do proximo passo permaneceu no mesmo patamar.');
    } else if (
      previousSnapshot.nextStepClear.toLowerCase() === 'sim' &&
      currentSnapshot.nextStepClear.toLowerCase() !== 'sim'
    ) {
      worsened.push('O QA perdeu a percepcao de um proximo passo claro que antes estava reconhecido.');
    }
  }

  if (previousSnapshot?.uploadWorth && currentSnapshot.uploadWorth) {
    const previousRank = firstValueRank[previousSnapshot.uploadWorth] ?? -1;
    const currentRank = firstValueRank[currentSnapshot.uploadWorth] ?? -1;

    if (currentRank > previousRank) {
      improved.push('O QA passou a registrar um Primeiro Valor mais convincente logo apos o upload.');
    } else if (currentRank === previousRank) {
      unchanged.push('A leitura sobre o valor entregue logo apos o upload permaneceu no mesmo patamar.');
    } else if (currentRank < previousRank) {
      worsened.push('O QA passou a perceber menos valor logo apos o upload do que na auditoria anterior.');
    }
  }

  if (previousSnapshot?.residenceFeelsKnown && currentSnapshot.residenceFeelsKnown) {
    if (
      previousSnapshot.residenceFeelsKnown.toLowerCase() !== 'sim' &&
      currentSnapshot.residenceFeelsKnown.toLowerCase() === 'sim'
    ) {
      improved.push('O QA passou a reconhecer que a residencia esta ficando conhecida ao longo da conversa.');
    } else if (
      previousSnapshot.residenceFeelsKnown.toLowerCase() ===
      currentSnapshot.residenceFeelsKnown.toLowerCase()
    ) {
      unchanged.push('A leitura sobre conhecimento progressivo da residencia permaneceu no mesmo patamar.');
    } else if (
      previousSnapshot.residenceFeelsKnown.toLowerCase() === 'sim' &&
      currentSnapshot.residenceFeelsKnown.toLowerCase() !== 'sim'
    ) {
      worsened.push('O QA deixou de reconhecer progresso no conhecimento da residencia.');
    }
  }

  if (previousSnapshot?.valueBeforeNextQuestion && currentSnapshot.valueBeforeNextQuestion) {
    if (
      previousSnapshot.valueBeforeNextQuestion.toLowerCase() !== 'sim' &&
      currentSnapshot.valueBeforeNextQuestion.toLowerCase() === 'sim'
    ) {
      improved.push('O QA passou a reconhecer devolucao de valor antes da pergunta seguinte.');
    } else if (
      previousSnapshot.valueBeforeNextQuestion.toLowerCase() ===
      currentSnapshot.valueBeforeNextQuestion.toLowerCase()
    ) {
      unchanged.push('A leitura sobre devolucao entre perguntas permaneceu no mesmo patamar.');
    } else if (
      previousSnapshot.valueBeforeNextQuestion.toLowerCase() === 'sim' &&
      currentSnapshot.valueBeforeNextQuestion.toLowerCase() !== 'sim'
    ) {
      worsened.push('O QA deixou de reconhecer devolucao de valor antes da pergunta seguinte.');
    }
  }

  if (!previousSnapshot?.accountUnderstandingVisible && currentSnapshot.accountUnderstandingVisible) {
    improved.push('O QA passou a registrar explicitamente a compreensao da conta como parte da experiencia observada.');
  } else if (
    previousSnapshot?.accountUnderstandingVisible &&
    currentSnapshot.accountUnderstandingVisible
  ) {
    if (
      previousSnapshot.accountUnderstandingVisible.toLowerCase() !== 'sim' &&
      currentSnapshot.accountUnderstandingVisible.toLowerCase() === 'sim'
    ) {
      improved.push('O QA passou a reconhecer a compreensao da conta como algo visivel para o usuario.');
    } else if (
      previousSnapshot.accountUnderstandingVisible.toLowerCase() ===
      currentSnapshot.accountUnderstandingVisible.toLowerCase()
    ) {
      unchanged.push('A leitura sobre visibilidade da compreensao da conta permaneceu no mesmo patamar.');
    } else if (
      previousSnapshot.accountUnderstandingVisible.toLowerCase() === 'sim' &&
      currentSnapshot.accountUnderstandingVisible.toLowerCase() !== 'sim'
    ) {
      worsened.push('O QA deixou de reconhecer a compreensao da conta como algo visivel para o usuario.');
    }
  }

  return {
    improved,
    unchanged,
    worsened,
  };
};
