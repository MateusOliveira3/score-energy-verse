import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildInteractiveQuestionsForAction,
  getEnergyDiagnosisQuestionCatalog,
} from '@/lib/mvpCoreFlow';
import type { EnergyBehaviorProfile } from '@/types/mvp';

const emptyEnergyBehaviorProfile: EnergyBehaviorProfile = {
  appliances: {},
  habits: {},
  intentions: {},
  qualification: {},
  actionMemory: {},
  confidence: {},
};

test('catalogo possui metadados investigativos minimos', () => {
  const catalog = getEnergyDiagnosisQuestionCatalog();

  assert.ok(catalog.length > 0);
  assert.ok(
    catalog.every(
      (question) =>
        Boolean(question.investigation?.targetArea) &&
        Boolean(question.investigation?.questionRole) &&
        Array.isArray(question.investigation?.evidenceProduced) &&
        question.investigation.evidenceProduced.length > 0 &&
        typeof question.investigation.expectedBenefit === 'string' &&
        question.investigation.expectedBenefit.length > 0 &&
        Boolean(question.investigation.priorityHint)
    )
  );
});

test('perguntas de banheiro apontam para bathroom', () => {
  const bathroomQuestions = getEnergyDiagnosisQuestionCatalog().filter(
    (question) => question.category === 'banheiro'
  );

  assert.ok(bathroomQuestions.length > 0);
  assert.ok(
    bathroomQuestions.every(
      (question) =>
        question.investigation.targetArea === 'bathroom' &&
        question.investigation.energyMapBlock?.includes('bathroom')
    )
  );
});

test('perguntas de refrigeracao apontam para refrigeration', () => {
  const refrigerationQuestions = getEnergyDiagnosisQuestionCatalog().filter(
    (question) => question.investigation.targetArea === 'refrigeration'
  );

  assert.ok(refrigerationQuestions.length > 0);
  assert.ok(
    refrigerationQuestions.every((question) =>
      question.investigation.energyMapBlock?.includes('refrigeration')
    )
  );
});

test('perguntas que alimentam iluminacao apontam para lighting', () => {
  const lightingQuestions = getEnergyDiagnosisQuestionCatalog().filter((question) =>
    question.investigation.energyMapBlock?.includes('lighting')
  );

  assert.ok(lightingQuestions.length > 0);
  assert.ok(
    lightingQuestions.some((question) => question.id === 'room_count')
  );
});

test('perguntas estruturais apontam para residence_structure', () => {
  const structuralQuestions = getEnergyDiagnosisQuestionCatalog().filter(
    (question) => question.category === 'estrutura'
  );

  assert.ok(structuralQuestions.length > 0);
  assert.ok(
    structuralQuestions.every(
      (question) => question.investigation.targetArea === 'residence_structure'
    )
  );
});

test('perguntas de ocupacao apontam para occupancy', () => {
  const occupancyQuestions = getEnergyDiagnosisQuestionCatalog().filter(
    (question) => question.category === 'ocupacao'
  );

  assert.ok(occupancyQuestions.length > 0);
  assert.ok(
    occupancyQuestions.every(
      (question) => question.investigation.targetArea === 'occupancy'
    )
  );
});

test('perguntas interativas reais da jornada preservam metadados investigativos', () => {
  const interactiveQuestions = buildInteractiveQuestionsForAction({
    actionTitle: 'Continuar mapa da residencia',
    energyBehaviorProfile: emptyEnergyBehaviorProfile,
  });

  assert.ok((interactiveQuestions ?? []).length > 0);
  assert.ok(
    (interactiveQuestions ?? []).every(
      (question) =>
        Boolean(question.investigation?.targetArea) &&
        typeof question.investigation?.expectedBenefit === 'string'
    )
  );
});

test('catalogo permanece deterministico e serializavel', () => {
  const first = getEnergyDiagnosisQuestionCatalog();
  const second = getEnergyDiagnosisQuestionCatalog();
  const serializedFirst = JSON.parse(JSON.stringify(first));
  const serializedSecond = JSON.parse(JSON.stringify(second));

  assert.deepEqual(first, second);
  assert.deepEqual(serializedFirst, serializedSecond);
  assert.deepEqual(serializedFirst, JSON.parse(JSON.stringify(serializedFirst)));
});
