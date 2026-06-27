import assert from 'node:assert/strict';
import test from 'node:test';

import type { InvestigationState } from '@/lib/investigation';
import {
  applyInvestigationPersistence,
  type ApplyInvestigationPersistenceInput,
  type NextBestQuestionCandidate,
  type NextQuestionResult,
} from '@/lib/investigation';

const makeState = (
  overrides: Partial<InvestigationState> = {}
): InvestigationState => ({
  hypotheses: [],
  knownFacts: [],
  unknownAreas: [],
  currentFocus: 'unknown',
  confidence: 'unknown',
  reasoning: [],
  ...overrides,
});

const makeQuestion = (
  overrides: Partial<NextBestQuestionCandidate> & Pick<NextBestQuestionCandidate, 'id' | 'question'>
): NextBestQuestionCandidate => ({
  id: overrides.id,
  question: overrides.question,
  answerType: overrides.answerType ?? 'yes_no',
  expectedGain: overrides.expectedGain ?? 'medium',
  shouldAskNow: overrides.shouldAskNow ?? true,
  deterministicOrder: overrides.deterministicOrder ?? 0,
  ...overrides,
});

const makeSuggested = (
  candidate: NextBestQuestionCandidate,
  overrides: Partial<NextQuestionResult> = {}
): NextQuestionResult => ({
  questionId: candidate.id,
  question: candidate.question,
  reason: candidate.reason ?? 'Suggested by Next Best Question.',
  targetArea: candidate.investigation?.targetArea ?? candidate.relatedArea,
  targetHypothesis:
    candidate.investigation?.hypothesisId ?? candidate.relatedHypothesisId,
  expectedBenefit:
    candidate.investigation?.expectedBenefit ??
    'Reduce a relevant open uncertainty in the current investigation.',
  ...overrides,
});

test('continua em bathroom quando a ultima pergunta foi bathroom e ainda ha follow-up util', () => {
  const bathroomFollowUp = makeQuestion({
    id: 'question-showers-count',
    question: 'Quantos chuveiros existem?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'bathroom',
      hypothesisId: 'hypothesis-bathroom',
      evidenceProduced: ['showers_count_signal'],
      questionRole: 'refinement',
      expectedBenefit: 'Refina o retrato do banho.',
      priorityHint: 'high',
    },
  });
  const kitchenQuestion = makeQuestion({
    id: 'question-cooking-type',
    question: 'O fogao e a gas ou eletrico?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'kitchen',
      evidenceProduced: ['cooking_type_signal'],
      questionRole: 'initial',
      expectedBenefit: 'Abre a frente da cozinha.',
      priorityHint: 'medium',
    },
  });
  const lastBathroomQuestion = makeQuestion({
    id: 'question-bathrooms-count',
    question: 'Quantos banheiros entram na rotina?',
    investigation: {
      targetArea: 'bathroom',
      hypothesisId: 'hypothesis-bathroom',
      evidenceProduced: ['bathroom_count_signal'],
      questionRole: 'initial',
      expectedBenefit: 'Dimensiona o ambiente de banho.',
      priorityHint: 'high',
    },
  });

  const result = applyInvestigationPersistence({
    investigation: makeState({
      currentFocus: 'bathroom',
      dominantHypothesis: {
        id: 'hypothesis-bathroom',
        title: 'Banheiro pode explicar parte relevante da conta',
        relatedRoom: 'bathroom',
        estimatedImpact: 32,
        confidence: 'medium',
        status: 'strengthened',
        reasoning: [],
      },
      hypotheses: [
        {
          id: 'hypothesis-bathroom',
          title: 'Banheiro pode explicar parte relevante da conta',
          relatedRoom: 'bathroom',
          estimatedImpact: 32,
          confidence: 'medium',
          status: 'strengthened',
          reasoning: [],
        },
      ],
    }),
    suggestedQuestion: makeSuggested(kitchenQuestion),
    questions: [bathroomFollowUp, kitchenQuestion],
    recentAnsweredQuestions: [lastBathroomQuestion],
    answeredQuestionIds: ['question-bathrooms-count'],
  });

  assert.equal(result.questionId, 'question-showers-count');
  assert.equal(result.targetArea, 'bathroom');
});

test('troca de area quando a area atual nao possui candidatas uteis restantes', () => {
  const kitchenQuestion = makeQuestion({
    id: 'question-cooking-type',
    question: 'O fogao e a gas ou eletrico?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'kitchen',
      evidenceProduced: ['cooking_type_signal'],
      questionRole: 'initial',
      expectedBenefit: 'Abre a frente da cozinha.',
      priorityHint: 'medium',
    },
  });
  const lastBathroomQuestion = makeQuestion({
    id: 'question-shower-heating',
    question: 'O banho depende de eletricidade?',
    investigation: {
      targetArea: 'bathroom',
      hypothesisId: 'hypothesis-bathroom',
      evidenceProduced: ['shower_heating_signal'],
      questionRole: 'confirmation',
      expectedBenefit: 'Confirma o aquecimento do banho.',
      priorityHint: 'high',
    },
  });

  const result = applyInvestigationPersistence({
    investigation: makeState({ currentFocus: 'bathroom' }),
    suggestedQuestion: makeSuggested(kitchenQuestion),
    questions: [kitchenQuestion],
    recentAnsweredQuestions: [lastBathroomQuestion],
    answeredQuestionIds: ['question-shower-heating'],
  });

  assert.equal(result.questionId, 'question-cooking-type');
  assert.match(result.persistenceReason, /no useful unanswered follow-up remained/i);
});

test('nao repete pergunta ja respondida', () => {
  const bathroomAnswered = makeQuestion({
    id: 'question-showers-count',
    question: 'Quantos chuveiros existem?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'bathroom',
      hypothesisId: 'hypothesis-bathroom',
      evidenceProduced: ['showers_count_signal'],
      questionRole: 'refinement',
      expectedBenefit: 'Refina o retrato do banho.',
      priorityHint: 'high',
    },
  });
  const bathroomNext = makeQuestion({
    id: 'question-shower-heating',
    question: 'O banho depende de eletricidade?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'bathroom',
      hypothesisId: 'hypothesis-bathroom',
      evidenceProduced: ['shower_heating_signal'],
      questionRole: 'confirmation',
      expectedBenefit: 'Confirma o aquecimento do banho.',
      priorityHint: 'high',
    },
  });
  const kitchenQuestion = makeQuestion({
    id: 'question-cooking-type',
    question: 'O fogao e a gas ou eletrico?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'kitchen',
      evidenceProduced: ['cooking_type_signal'],
      questionRole: 'initial',
      expectedBenefit: 'Abre a frente da cozinha.',
      priorityHint: 'medium',
    },
  });

  const result = applyInvestigationPersistence({
    investigation: makeState({ currentFocus: 'bathroom' }),
    suggestedQuestion: makeSuggested(kitchenQuestion),
    questions: [bathroomAnswered, bathroomNext, kitchenQuestion],
    recentAnsweredQuestions: [bathroomAnswered],
    answeredQuestionIds: ['question-showers-count'],
  });

  assert.equal(result.questionId, 'question-shower-heating');
});

test('permite troca quando a proxima area tem prioridade materialmente maior', () => {
  const bathroomFollowUp = makeQuestion({
    id: 'question-showers-count',
    question: 'Quantos chuveiros existem?',
    expectedGain: 'low',
    investigation: {
      targetArea: 'bathroom',
      hypothesisId: 'hypothesis-bathroom',
      evidenceProduced: ['showers_count_signal'],
      questionRole: 'refinement',
      expectedBenefit: 'Refina o retrato do banho.',
      priorityHint: 'medium',
    },
  });
  const requiredStructure = makeQuestion({
    id: 'question-residence-type',
    question: 'Sua residencia e casa ou apartamento?',
    expectedGain: 'high',
    isRequired: true,
    investigation: {
      targetArea: 'residence_structure',
      evidenceProduced: ['residence_type_signal'],
      questionRole: 'initial',
      expectedBenefit: 'Destrava a estrutura base da residencia.',
      priorityHint: 'high',
    },
  });

  const result = applyInvestigationPersistence({
    investigation: makeState({ currentFocus: 'bathroom' }),
    suggestedQuestion: makeSuggested(requiredStructure),
    questions: [bathroomFollowUp, requiredStructure],
    recentAnsweredQuestions: [
      makeQuestion({
        id: 'question-bathrooms-count',
        question: 'Quantos banheiros entram na rotina?',
        investigation: {
          targetArea: 'bathroom',
          hypothesisId: 'hypothesis-bathroom',
          evidenceProduced: ['bathroom_count_signal'],
          questionRole: 'initial',
          expectedBenefit: 'Dimensiona o ambiente de banho.',
          priorityHint: 'high',
        },
      }),
    ],
  });

  assert.equal(result.questionId, 'question-residence-type');
  assert.match(result.persistenceReason, /materially higher urgency/i);
});

test('nao escolhe pergunta da mesma area quando ela esta bloqueada por dependencia', () => {
  const blockedBathroom = makeQuestion({
    id: 'question-showers-count',
    question: 'Quantos chuveiros existem?',
    expectedGain: 'medium',
    shouldAskNow: false,
    investigation: {
      targetArea: 'bathroom',
      hypothesisId: 'hypothesis-bathroom',
      evidenceProduced: ['showers_count_signal'],
      questionRole: 'refinement',
      dependsOn: ['bathrooms_count'],
      expectedBenefit: 'Refina o retrato do banho.',
      priorityHint: 'high',
    },
  });
  const kitchenQuestion = makeQuestion({
    id: 'question-cooking-type',
    question: 'O fogao e a gas ou eletrico?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'kitchen',
      evidenceProduced: ['cooking_type_signal'],
      questionRole: 'initial',
      expectedBenefit: 'Abre a frente da cozinha.',
      priorityHint: 'medium',
    },
  });

  const result = applyInvestigationPersistence({
    investigation: makeState({ currentFocus: 'bathroom' }),
    suggestedQuestion: makeSuggested(kitchenQuestion),
    questions: [blockedBathroom, kitchenQuestion],
    recentAnsweredQuestions: [
      makeQuestion({
        id: 'question-bathrooms-count',
        question: 'Quantos banheiros entram na rotina?',
        investigation: {
          targetArea: 'bathroom',
          evidenceProduced: ['bathroom_count_signal'],
          questionRole: 'initial',
          expectedBenefit: 'Dimensiona o ambiente de banho.',
          priorityHint: 'high',
        },
      }),
    ],
  });

  assert.equal(result.questionId, 'question-cooking-type');
});

test('sequencia de banheiro consegue sustentar duas ou tres perguntas coerentes quando existem candidatas', () => {
  const bathroomOne = makeQuestion({
    id: 'question-shower-heating',
    question: 'O banho depende de eletricidade?',
    expectedGain: 'medium',
    deterministicOrder: 1,
    investigation: {
      targetArea: 'bathroom',
      hypothesisId: 'hypothesis-bathroom',
      evidenceProduced: ['shower_heating_signal'],
      questionRole: 'confirmation',
      expectedBenefit: 'Confirma o aquecimento do banho.',
      priorityHint: 'high',
    },
  });
  const bathroomTwo = makeQuestion({
    id: 'question-showers-count',
    question: 'Quantos chuveiros existem?',
    expectedGain: 'medium',
    deterministicOrder: 2,
    investigation: {
      targetArea: 'bathroom',
      hypothesisId: 'hypothesis-bathroom',
      evidenceProduced: ['showers_count_signal'],
      questionRole: 'refinement',
      expectedBenefit: 'Refina o retrato do banho.',
      priorityHint: 'high',
    },
  });
  const kitchenQuestion = makeQuestion({
    id: 'question-cooking-type',
    question: 'O fogao e a gas ou eletrico?',
    expectedGain: 'high',
    investigation: {
      targetArea: 'kitchen',
      evidenceProduced: ['cooking_type_signal'],
      questionRole: 'initial',
      expectedBenefit: 'Abre a frente da cozinha.',
      priorityHint: 'medium',
    },
  });

  const first = applyInvestigationPersistence({
    investigation: makeState({ currentFocus: 'bathroom' }),
    suggestedQuestion: makeSuggested(kitchenQuestion),
    questions: [bathroomOne, bathroomTwo, kitchenQuestion],
    recentAnsweredQuestions: [
      makeQuestion({
        id: 'question-bathrooms-count',
        question: 'Quantos banheiros entram na rotina?',
        investigation: {
          targetArea: 'bathroom',
          hypothesisId: 'hypothesis-bathroom',
          evidenceProduced: ['bathroom_count_signal'],
          questionRole: 'initial',
          expectedBenefit: 'Dimensiona o ambiente de banho.',
          priorityHint: 'high',
        },
      }),
    ],
    answeredQuestionIds: ['question-bathrooms-count'],
  });

  const second = applyInvestigationPersistence({
    investigation: makeState({ currentFocus: 'bathroom' }),
    suggestedQuestion: makeSuggested(kitchenQuestion),
    questions: [bathroomOne, bathroomTwo, kitchenQuestion],
    recentAnsweredQuestions: [bathroomOne],
    answeredQuestionIds: ['question-bathrooms-count', 'question-shower-heating'],
  });

  assert.equal(first.questionId, 'question-shower-heating');
  assert.equal(second.questionId, 'question-showers-count');
});

test('sequencia de climatizacao permanece por mais de um passo quando ha refinamento disponivel', () => {
  const comfortRefinement = makeQuestion({
    id: 'question-air-conditioning-count',
    question: 'Quantos aparelhos de ar-condicionado entram nessa rotina?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'comfort',
      hypothesisId: 'hypothesis-comfort',
      evidenceProduced: ['air_conditioning_count_signal'],
      questionRole: 'refinement',
      expectedBenefit: 'Refina a frente de climatizacao.',
      priorityHint: 'medium',
    },
  });
  const routineQuestion = makeQuestion({
    id: 'question-dominant-usage-period',
    question: 'Em qual periodo a casa fica mais ativa?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'routine',
      hypothesisId: 'hypothesis-routine',
      evidenceProduced: ['dominant_usage_period_signal'],
      questionRole: 'disambiguation',
      expectedBenefit: 'Liga a casa ao horario de maior intensidade.',
      priorityHint: 'medium',
    },
  });

  const result = applyInvestigationPersistence({
    investigation: makeState({ currentFocus: 'comfort' }),
    suggestedQuestion: makeSuggested(routineQuestion),
    questions: [comfortRefinement, routineQuestion],
    recentAnsweredQuestions: [
      makeQuestion({
        id: 'question-air-conditioning-presence',
        question: 'Tem ar-condicionado em uso nessa residencia?',
        investigation: {
          targetArea: 'comfort',
          hypothesisId: 'hypothesis-comfort',
          evidenceProduced: ['air_conditioning_presence_signal'],
          questionRole: 'confirmation',
          expectedBenefit: 'Confirma a frente de climatizacao.',
          priorityHint: 'medium',
        },
      }),
    ],
    answeredQuestionIds: ['question-air-conditioning-presence'],
  });

  assert.equal(result.questionId, 'question-air-conditioning-count');
  assert.equal(result.targetArea, 'comfort');
});

test('perguntas de occupancy nao interrompem uma frente energetica mais forte sem motivo claro', () => {
  const bathroomFollowUp = makeQuestion({
    id: 'question-shower-heating',
    question: 'O banho depende de eletricidade?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'bathroom',
      hypothesisId: 'hypothesis-bathroom',
      evidenceProduced: ['shower_heating_signal'],
      questionRole: 'confirmation',
      expectedBenefit: 'Confirma o aquecimento do banho.',
      priorityHint: 'high',
    },
  });
  const occupancyQuestion = makeQuestion({
    id: 'question-children-presence',
    question: 'Tem criancas morando ai?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'occupancy',
      evidenceProduced: ['children_presence_signal'],
      questionRole: 'initial',
      expectedBenefit: 'Refina a ocupacao da casa.',
      priorityHint: 'medium',
    },
  });

  const result = applyInvestigationPersistence({
    investigation: makeState({
      currentFocus: 'bathroom',
      dominantHypothesis: {
        id: 'hypothesis-bathroom',
        title: 'Banheiro pode explicar parte relevante da conta',
        relatedRoom: 'bathroom',
        estimatedImpact: 30,
        confidence: 'medium',
        status: 'strengthened',
        reasoning: [],
      },
      hypotheses: [
        {
          id: 'hypothesis-bathroom',
          title: 'Banheiro pode explicar parte relevante da conta',
          relatedRoom: 'bathroom',
          estimatedImpact: 30,
          confidence: 'medium',
          status: 'strengthened',
          reasoning: [],
        },
      ],
    }),
    suggestedQuestion: makeSuggested(occupancyQuestion),
    questions: [bathroomFollowUp, occupancyQuestion],
    recentAnsweredQuestions: [
      makeQuestion({
        id: 'question-bathrooms-count',
        question: 'Quantos banheiros entram na rotina?',
        investigation: {
          targetArea: 'bathroom',
          hypothesisId: 'hypothesis-bathroom',
          evidenceProduced: ['bathroom_count_signal'],
          questionRole: 'initial',
          expectedBenefit: 'Dimensiona o ambiente de banho.',
          priorityHint: 'high',
        },
      }),
    ],
  });

  assert.equal(result.questionId, 'question-shower-heating');
});

test('resultado inclui persistenceReason explicando manutencao ou troca de foco', () => {
  const bathroomFollowUp = makeQuestion({
    id: 'question-showers-count',
    question: 'Quantos chuveiros existem?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'bathroom',
      hypothesisId: 'hypothesis-bathroom',
      evidenceProduced: ['showers_count_signal'],
      questionRole: 'refinement',
      expectedBenefit: 'Refina o retrato do banho.',
      priorityHint: 'high',
    },
  });

  const result = applyInvestigationPersistence({
    investigation: makeState({ currentFocus: 'bathroom' }),
    suggestedQuestion: makeSuggested(bathroomFollowUp),
    questions: [bathroomFollowUp],
    recentAnsweredQuestions: [
      makeQuestion({
        id: 'question-bathrooms-count',
        question: 'Quantos banheiros entram na rotina?',
        investigation: {
          targetArea: 'bathroom',
          evidenceProduced: ['bathroom_count_signal'],
          questionRole: 'initial',
          expectedBenefit: 'Dimensiona o ambiente de banho.',
          priorityHint: 'high',
        },
      }),
    ],
  });

  assert.match(result.persistenceReason, /kept focus on bathroom/i);
});

test('implementacao permanece pura e deterministica', () => {
  const bathroomFollowUp = makeQuestion({
    id: 'question-showers-count',
    question: 'Quantos chuveiros existem?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'bathroom',
      hypothesisId: 'hypothesis-bathroom',
      evidenceProduced: ['showers_count_signal'],
      questionRole: 'refinement',
      expectedBenefit: 'Refina o retrato do banho.',
      priorityHint: 'high',
    },
  });
  const kitchenQuestion = makeQuestion({
    id: 'question-cooking-type',
    question: 'O fogao e a gas ou eletrico?',
    expectedGain: 'medium',
    investigation: {
      targetArea: 'kitchen',
      evidenceProduced: ['cooking_type_signal'],
      questionRole: 'initial',
      expectedBenefit: 'Abre a frente da cozinha.',
      priorityHint: 'medium',
    },
  });
  const input = {
    investigation: makeState({ currentFocus: 'bathroom' }),
    suggestedQuestion: makeSuggested(kitchenQuestion),
    questions: [bathroomFollowUp, kitchenQuestion],
    recentAnsweredQuestions: [
      makeQuestion({
        id: 'question-bathrooms-count',
        question: 'Quantos banheiros entram na rotina?',
        investigation: {
          targetArea: 'bathroom',
          evidenceProduced: ['bathroom_count_signal'],
          questionRole: 'initial',
          expectedBenefit: 'Dimensiona o ambiente de banho.',
          priorityHint: 'high',
        },
      }),
    ],
    answeredQuestionIds: ['question-bathrooms-count'],
  } satisfies ApplyInvestigationPersistenceInput;
  const original = JSON.parse(JSON.stringify(input));

  const first = applyInvestigationPersistence(input);
  const second = applyInvestigationPersistence(input);

  assert.deepEqual(first, second);
  assert.deepEqual(JSON.parse(JSON.stringify(input)), original);
});
