import assert from 'node:assert/strict';
import test from 'node:test';

import { createHouseModel, createRoomModel } from '@/lib/cognitive';
import type { InvestigationState } from '@/lib/investigation';
import {
  selectNextBestQuestion,
  type NextBestQuestionCandidate,
} from '@/lib/investigation';

const NOW = '2026-06-19T13:00:00.000Z';

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

const makeHouse = () =>
  createHouseModel({
    id: 'house-next-question',
    ownerId: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    rooms: [
      createRoomModel(
        {
          id: 'room-bathroom',
          type: 'bathroom',
          label: 'Banheiro',
          understandingLevel: 30,
          confidence: 'low',
        },
        'bathroom'
      ),
      createRoomModel(
        {
          id: 'room-refrigeration',
          type: 'kitchen',
          label: 'Cozinha',
          understandingLevel: 24,
          confidence: 'low',
        },
        'kitchen'
      ),
      createRoomModel(
        {
          id: 'room-comfort',
          type: 'comfort',
          label: 'Conforto',
          understandingLevel: 18,
          confidence: 'low',
        },
        'comfort'
      ),
    ],
  });

const makeQuestion = (
  overrides: Partial<NextBestQuestionCandidate> & Pick<NextBestQuestionCandidate, 'id' | 'question'>
): NextBestQuestionCandidate => ({
  id: overrides.id,
  question: overrides.question,
  answerType: overrides.answerType ?? 'yes_no',
  expectedGain: overrides.expectedGain ?? 'medium',
  shouldAskNow: overrides.shouldAskNow ?? true,
  ...overrides,
});

test('sem hipoteses nao escolhe pergunta', () => {
  const result = selectNextBestQuestion({
    investigation: makeState(),
    questions: [
      makeQuestion({
        id: 'question-bathroom',
        question: 'Existe chuveiro eletrico?',
        relatedArea: 'bathroom',
      }),
    ],
  });

  assert.equal(result, undefined);
});

test('hipotese dominante de banheiro escolhe pergunta sobre banheiro', () => {
  const result = selectNextBestQuestion({
    investigation: makeState({
      dominantHypothesis: {
        id: 'hypothesis-bathroom',
        title: 'Banheiro pode explicar parte relevante da conta',
        relatedRoom: 'bathroom',
        estimatedImpact: 30,
        estimatedSharePercent: 30,
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
          estimatedSharePercent: 30,
          confidence: 'medium',
          status: 'strengthened',
          reasoning: [],
        },
      ],
      currentFocus: 'bathroom',
      confidence: 'medium',
    }),
    questions: [
      makeQuestion({
        id: 'question-bathroom',
        question: 'Existe chuveiro eletrico?',
        relatedArea: 'bathroom',
        relatedHypothesisId: 'hypothesis-bathroom',
        expectedGain: 'high',
      }),
      makeQuestion({
        id: 'question-comfort',
        question: 'Ha ar-condicionado em uso frequente?',
        relatedArea: 'comfort',
        expectedGain: 'high',
      }),
    ],
  });

  assert.equal(result?.questionId, 'question-bathroom');
  assert.equal(result?.targetArea, 'bathroom');
});

test('hipotese dominante de refrigeracao escolhe pergunta de refrigeracao', () => {
  const result = selectNextBestQuestion({
    investigation: makeState({
      dominantHypothesis: {
        id: 'hypothesis-refrigeration',
        title: 'Refrigeracao pode explicar custo recorrente',
        relatedRoom: 'refrigeration',
        estimatedImpact: 18,
        estimatedSharePercent: 18,
        confidence: 'medium',
        status: 'suspected',
        reasoning: [],
      },
      hypotheses: [
        {
          id: 'hypothesis-refrigeration',
          title: 'Refrigeracao pode explicar custo recorrente',
          relatedRoom: 'refrigeration',
          estimatedImpact: 18,
          estimatedSharePercent: 18,
          confidence: 'medium',
          status: 'suspected',
          reasoning: [],
        },
      ],
      currentFocus: 'refrigeration',
      confidence: 'medium',
    }),
    questions: [
      makeQuestion({
        id: 'question-shower',
        question: 'Quantos banhos por dia acontecem na casa?',
        relatedArea: 'bathroom',
        expectedGain: 'high',
      }),
      makeQuestion({
        id: 'question-fridge',
        question: 'Existe freezer separado ou geladeira extra?',
        relatedArea: 'refrigeration',
        relatedHypothesisId: 'hypothesis-refrigeration',
        expectedGain: 'high',
      }),
    ],
  });

  assert.equal(result?.questionId, 'question-fridge');
  assert.equal(result?.targetArea, 'refrigeration');
});

test('unknownAreas influenciam a selecao quando nao ha pergunta ligada a hipotese dominante', () => {
  const result = selectNextBestQuestion({
    investigation: makeState({
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
      unknownAreas: ['Ainda nao entendo o peso da refrigeracao.'],
      currentFocus: 'bathroom',
      confidence: 'medium',
    }),
    questions: [
      makeQuestion({
        id: 'question-kitchen',
        question: 'A cozinha tem uso intenso de forno eletrico?',
        relatedArea: 'kitchen',
        expectedGain: 'medium',
      }),
      makeQuestion({
        id: 'question-refrigeration',
        question: 'Existe freezer separado ou cervejeira?',
        relatedArea: 'refrigeration',
        expectedGain: 'medium',
      }),
    ],
  });

  assert.equal(result?.questionId, 'question-refrigeration');
  assert.match(result?.reason ?? '', /unknown area/i);
});

test('pergunta obrigatoria nao respondida tem prioridade', () => {
  const result = selectNextBestQuestion({
    investigation: makeState({
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
      currentFocus: 'bathroom',
      confidence: 'medium',
    }),
    questions: [
      makeQuestion({
        id: 'question-bathroom',
        question: 'Existe chuveiro eletrico?',
        relatedArea: 'bathroom',
        relatedHypothesisId: 'hypothesis-bathroom',
        expectedGain: 'high',
      }),
      makeQuestion({
        id: 'question-required',
        question: 'Qual tipo de residencia e essa?',
        relatedArea: 'routine',
        expectedGain: 'low',
        isRequired: true,
      }),
    ],
  });

  assert.equal(result?.questionId, 'question-required');
});

test('empate gera resultado deterministico', () => {
  const input = {
    investigation: makeState({
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
      currentFocus: 'bathroom',
      confidence: 'medium',
    }),
    questions: [
      makeQuestion({
        id: 'question-b',
        question: 'Pergunta B',
        relatedArea: 'bathroom',
        relatedHypothesisId: 'hypothesis-bathroom',
        expectedGain: 'high',
        deterministicOrder: 2,
      }),
      makeQuestion({
        id: 'question-a',
        question: 'Pergunta A',
        relatedArea: 'bathroom',
        relatedHypothesisId: 'hypothesis-bathroom',
        expectedGain: 'high',
        deterministicOrder: 1,
      }),
    ],
  };

  const first = selectNextBestQuestion(input);
  const second = selectNextBestQuestion(input);

  assert.equal(first?.questionId, 'question-a');
  assert.deepEqual(first, second);
});

test('pergunta respondida nunca volta', () => {
  const result = selectNextBestQuestion({
    investigation: makeState({
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
      currentFocus: 'bathroom',
      confidence: 'medium',
    }),
    questions: [
      makeQuestion({
        id: 'question-bathroom-primary',
        question: 'Existe chuveiro eletrico?',
        relatedArea: 'bathroom',
        relatedHypothesisId: 'hypothesis-bathroom',
        expectedGain: 'high',
      }),
      makeQuestion({
        id: 'question-bathroom-secondary',
        question: 'Qual o tempo medio de banho?',
        relatedArea: 'bathroom',
        relatedHypothesisId: 'hypothesis-bathroom',
        expectedGain: 'medium',
      }),
    ],
    answeredQuestionIds: ['question-bathroom-primary'],
  });

  assert.equal(result?.questionId, 'question-bathroom-secondary');
});

test('reason explica a decisao e expectedBenefit nunca fica vazio', () => {
  const result = selectNextBestQuestion({
    investigation: makeState({
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
      currentFocus: 'bathroom',
      confidence: 'medium',
    }),
    questions: [
      makeQuestion({
        id: 'question-bathroom',
        question: 'Existe chuveiro eletrico?',
        relatedArea: 'bathroom',
        relatedHypothesisId: 'hypothesis-bathroom',
        expectedGain: 'high',
        reason: 'Essa resposta muda bastante a leitura do banho.',
      }),
    ],
  });

  assert.match(result?.reason ?? '', /dominant hypothesis/i);
  assert.match(result?.reason ?? '', /expected benefit is high/i);
  assert.ok((result?.expectedBenefit ?? '').length > 0);
});

test('Next Best Question usa metadados investigativos quando disponiveis', () => {
  const result = selectNextBestQuestion({
    investigation: makeState({
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
      currentFocus: 'bathroom',
      confidence: 'medium',
    }),
    questions: [
      makeQuestion({
        id: 'question-metadata-bathroom',
        question: 'O banho ai depende mais de aquecimento eletrico, gas ou os dois?',
        expectedGain: 'medium',
        investigation: {
          hypothesisId: 'hypothesis-bathroom',
          targetArea: 'bathroom',
          evidenceProduced: ['shower_heating_signal'],
          questionRole: 'confirmation',
          expectedBenefit: 'Confirma se o banho depende de eletricidade.',
          priorityHint: 'high',
        },
      }),
      makeQuestion({
        id: 'question-generic-high',
        question: 'Ha ar-condicionado em uso frequente?',
        expectedGain: 'high',
        relatedArea: 'comfort',
      }),
    ],
  });

  assert.equal(result?.questionId, 'question-metadata-bathroom');
  assert.equal(result?.targetHypothesis, 'hypothesis-bathroom');
  assert.equal(result?.expectedBenefit, 'Confirma se o banho depende de eletricidade.');
});

test('fallback continua funcionando para perguntas sem metadados', () => {
  const result = selectNextBestQuestion({
    investigation: makeState({
      dominantHypothesis: {
        id: 'hypothesis-refrigeration',
        title: 'Refrigeracao pode explicar custo recorrente',
        relatedRoom: 'refrigeration',
        estimatedImpact: 18,
        confidence: 'medium',
        status: 'suspected',
        reasoning: [],
      },
      hypotheses: [
        {
          id: 'hypothesis-refrigeration',
          title: 'Refrigeracao pode explicar custo recorrente',
          relatedRoom: 'refrigeration',
          estimatedImpact: 18,
          confidence: 'medium',
          status: 'suspected',
          reasoning: [],
        },
      ],
      currentFocus: 'refrigeration',
      confidence: 'medium',
    }),
    questions: [
      makeQuestion({
        id: 'question-fridge-fallback',
        question: 'Existe freezer separado ou geladeira extra?',
        relatedArea: 'refrigeration',
        relatedHypothesisId: 'hypothesis-refrigeration',
        expectedGain: 'high',
      }),
    ],
  });

  assert.equal(result?.questionId, 'question-fridge-fallback');
  assert.equal(result?.targetArea, 'refrigeration');
});

test('engine e pura e consegue resolver area a partir do HouseModel', () => {
  const house = makeHouse();
  const questions = [
    makeQuestion({
      id: 'question-bathroom',
      question: 'Existe chuveiro eletrico?',
      relatedRoomId: 'room-bathroom',
      relatedHypothesisId: 'hypothesis-bathroom',
      expectedGain: 'high',
    }),
  ];
  const originalHouse = JSON.parse(JSON.stringify(house));
  const originalQuestions = JSON.parse(JSON.stringify(questions));

  const first = selectNextBestQuestion({
    investigation: makeState({
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
      currentFocus: 'bathroom',
      confidence: 'medium',
    }),
    questions,
    house,
  });
  const second = selectNextBestQuestion({
    investigation: makeState({
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
      currentFocus: 'bathroom',
      confidence: 'medium',
    }),
    questions,
    house,
  });

  assert.equal(first?.targetArea, 'bathroom');
  assert.deepEqual(first, second);
  assert.deepEqual(JSON.parse(JSON.stringify(house)), originalHouse);
  assert.deepEqual(JSON.parse(JSON.stringify(questions)), originalQuestions);
});
