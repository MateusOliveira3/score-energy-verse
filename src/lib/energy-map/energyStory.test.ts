import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildEnergyMap,
  buildEnergyStory,
  estimateBathroomEnergyBlock,
  estimateLightingEnergyBlock,
  estimateRefrigerationEnergyBlock,
} from '@/lib/energy-map';

test('gera narrativa coerente com mapa contendo apenas banheiro', () => {
  const map = buildEnergyMap([
    estimateBathroomEnergyBlock({
      powerWatts: 5000,
      residents: 4,
      minutesPerShower: 12,
      showersPerResidentPerDay: 1,
      cycleDays: 30,
      averageTariffPerKwh: 1.1,
      invoiceTotalValue: 440,
    }),
  ]);
  const story = buildEnergyStory(map);

  assert.equal(story.explainedCoveragePercent, 30);
  assert.match(story.explainedCoverageText, /parte inicial|aproximadamente/i);
  assert.match(story.strongestFinding ?? '', /banheiro/i);
  assert.equal(story.secondaryFindings.length, 0);
  assert.ok(story.unknownAreas.includes('climatizacao'));
  assert.equal(story.unknownAreas.includes('banheiro'), false);
});

test('aumenta cobertura e atualiza narrativa com banheiro e refrigeracao', () => {
  const bathroom = estimateBathroomEnergyBlock({
    powerWatts: 5000,
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });
  const refrigeration = estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });
  const story = buildEnergyStory(buildEnergyMap([bathroom, refrigeration]));

  assert.equal(story.explainedCoveragePercent > 30, true);
  assert.match(story.strongestFinding ?? '', /banheiro/i);
  assert.ok(story.secondaryFindings.some((item) => /refrigeracao/i.test(item)));
  assert.match(story.coreNarrative, /Comecei a montar um mapa da sua residencia/i);
});

test('gera narrativa completa com banheiro, refrigeracao e iluminacao', () => {
  const bathroom = estimateBathroomEnergyBlock({
    powerWatts: 5000,
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });
  const refrigeration = estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });
  const lighting = estimateLightingEnergyBlock({
    roomCount: 5,
    lightingProfile: 'led',
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });
  const story = buildEnergyStory(buildEnergyMap([bathroom, refrigeration, lighting]));

  assert.equal(story.unknownAreas.includes('iluminacao'), false);
  assert.ok(story.unknownAreas.includes('climatizacao'));
  assert.ok(story.secondaryFindings.length >= 1);
  assert.ok(story.educationalInsight.length > 0);
});

test('sem blocos gera narrativa segura sem inventar conclusoes', () => {
  const story = buildEnergyStory(buildEnergyMap([]));

  assert.equal(story.explainedCoveragePercent, 0);
  assert.equal(story.strongestFinding, undefined);
  assert.equal(story.secondaryFindings.length, 0);
  assert.ok(story.unknownAreas.includes('climatizacao'));
  assert.match(story.explainedCoverageText, /ainda nao consigo explicar/i);
});

test('escolhe strongestFinding corretamente', () => {
  const story = buildEnergyStory(
    buildEnergyMap([
      estimateLightingEnergyBlock({
        roomCount: 5,
        lightingProfile: 'mixed',
        cycleDays: 30,
        averageTariffPerKwh: 1.1,
        invoiceTotalValue: 440,
      }),
      estimateBathroomEnergyBlock({
        powerWatts: 5000,
        residents: 4,
        minutesPerShower: 12,
        showersPerResidentPerDay: 1,
        cycleDays: 30,
        averageTariffPerKwh: 1.1,
        invoiceTotalValue: 440,
      }),
    ])
  );

  assert.match(story.strongestFinding ?? '', /banheiro/i);
});

test('escolhe a proxima investigacao corretamente', () => {
  const story = buildEnergyStory(
    buildEnergyMap([
      estimateBathroomEnergyBlock({
        powerWatts: 5000,
        residents: 4,
        minutesPerShower: 12,
        showersPerResidentPerDay: 1,
        cycleDays: 30,
        averageTariffPerKwh: 1.1,
        invoiceTotalValue: 440,
      }),
    ])
  );

  assert.equal(story.nextInvestigation, 'Entender como funciona a climatizacao da residencia.');
});

test('gera cobertura textual coerente', () => {
  const story = buildEnergyStory(
    buildEnergyMap([
      estimateBathroomEnergyBlock({
        powerWatts: 5000,
        residents: 4,
        minutesPerShower: 12,
        showersPerResidentPerDay: 1,
        cycleDays: 30,
        averageTariffPerKwh: 1.1,
        invoiceTotalValue: 440,
      }),
      estimateRefrigerationEnergyBlock({
        hasRefrigerator: true,
        cycleDays: 30,
        averageTariffPerKwh: 1.1,
        invoiceTotalValue: 440,
      }),
    ])
  );

  assert.match(story.explainedCoverageText, /aproximadamente metade|parte inicial/i);
  assert.match(story.explainedCoverageText, /da fatura/i);
});

test('sempre gera educationalInsight', () => {
  const story = buildEnergyStory(
    buildEnergyMap([
      estimateRefrigerationEnergyBlock({
        hasRefrigerator: true,
        cycleDays: 30,
        averageTariffPerKwh: 1.1,
        invoiceTotalValue: 440,
      }),
    ])
  );

  assert.ok(story.educationalInsight.length > 0);
});

test('coreNarrative nunca usa linguagem absoluta', () => {
  const story = buildEnergyStory(
    buildEnergyMap([
      estimateBathroomEnergyBlock({
        powerWatts: 5000,
        residents: 4,
        minutesPerShower: 12,
        showersPerResidentPerDay: 1,
        cycleDays: 30,
        averageTariffPerKwh: 1.1,
        invoiceTotalValue: 440,
      }),
    ])
  );

  assert.equal(/\bsempre\b|\bcerteza\b|\bexatamente\b/i.test(story.coreNarrative), false);
});

test('unknownAreas nao lista ambientes ja explicados', () => {
  const story = buildEnergyStory(
    buildEnergyMap([
      estimateBathroomEnergyBlock({
        powerWatts: 5000,
        residents: 4,
        minutesPerShower: 12,
        showersPerResidentPerDay: 1,
        cycleDays: 30,
        averageTariffPerKwh: 1.1,
        invoiceTotalValue: 440,
      }),
      estimateRefrigerationEnergyBlock({
        hasRefrigerator: true,
        cycleDays: 30,
        averageTariffPerKwh: 1.1,
        invoiceTotalValue: 440,
      }),
      estimateLightingEnergyBlock({
        roomCount: 5,
        lightingProfile: 'led',
        cycleDays: 30,
        averageTariffPerKwh: 1.1,
        invoiceTotalValue: 440,
      }),
    ])
  );

  assert.equal(story.unknownAreas.includes('banheiro'), false);
  assert.equal(story.unknownAreas.includes('refrigeracao'), false);
  assert.equal(story.unknownAreas.includes('iluminacao'), false);
});
