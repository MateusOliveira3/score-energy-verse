import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildEnergyMap,
  estimateBathroomEnergyBlock,
  estimateLightingEnergyBlock,
  estimateRefrigerationEnergyBlock,
} from '@/lib/energy-map';

test('estima residencia LED', () => {
  const estimate = estimateLightingEnergyBlock({
    roomCount: 5,
    lightingProfile: 'led',
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.status, 'estimated');
  assert.equal(estimate.estimatedKwh, 6);
});

test('estima residencia com iluminacao mista', () => {
  const estimate = estimateLightingEnergyBlock({
    roomCount: 5,
    lightingProfile: 'mixed',
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.estimatedKwh, 10.8);
});

test('tipo desconhecido usa default conservador', () => {
  const estimate = estimateLightingEnergyBlock({
    roomCount: 5,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.estimatedKwh, 9);
  assert.match(estimate.warnings.join(' '), /perfil desconhecido/i);
});

test('calcula consumo corretamente', () => {
  const estimate = estimateLightingEnergyBlock({
    roomCount: 6,
    lightingProfile: 'led',
    cycleDays: 30,
    averageLightingHoursPerDay: 5,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.estimatedKwh, 9);
});

test('calcula custo corretamente', () => {
  const estimate = estimateLightingEnergyBlock({
    roomCount: 5,
    lightingProfile: 'mixed',
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.estimatedCost, 11.88);
});

test('calcula percentual corretamente', () => {
  const estimate = estimateLightingEnergyBlock({
    roomCount: 5,
    lightingProfile: 'mixed',
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.estimatedInvoiceSharePercent, 2.7);
  assert.equal(estimate.estimatedShare, 2.7);
});

test('nao calcula custo sem tarifa', () => {
  const estimate = estimateLightingEnergyBlock({
    roomCount: 5,
    lightingProfile: 'led',
    cycleDays: 30,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.estimatedCost, undefined);
  assert.match(estimate.warnings.join(' '), /tarifa media nao foi informada/i);
});

test('nao calcula percentual sem valor da fatura', () => {
  const estimate = estimateLightingEnergyBlock({
    roomCount: 5,
    lightingProfile: 'led',
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
  });

  assert.equal(estimate.estimatedInvoiceSharePercent, undefined);
  assert.match(estimate.warnings.join(' '), /valor total nao foi informado/i);
});

test('confianca reduzida quando usa defaults', () => {
  const estimate = estimateLightingEnergyBlock({
    roomCount: 5,
    lightingProfile: 'unknown',
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.confidence, 'medium');
});

test('gera frase explicavel para a Core', () => {
  const estimate = estimateLightingEnergyBlock({
    roomCount: 5,
    lightingProfile: 'led',
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.match(estimate.explanationForCore, /a iluminacao parece representar cerca de R\$ 6\.60/i);
  assert.match(estimate.explanationForCore, /uso medio diario/i);
});

test('gera insight coerente para iluminacao e mantem linguagem probabilistica', () => {
  const estimate = estimateLightingEnergyBlock({
    roomCount: 5,
    lightingProfile: 'led',
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.match(estimate.educationalInsight, /costuma pesar menos/i);
  assert.doesNotMatch(estimate.educationalInsight, /2\.7%|6\.60|certeza|sempre/i);
});

test('fallback honesto aparece quando faltam dados minimos de iluminacao', () => {
  const estimate = estimateLightingEnergyBlock({
    roomCount: 0,
    cycleDays: 30,
  });

  assert.equal(estimate.status, 'unavailable');
  assert.match(estimate.educationalInsight, /ainda faltam pistas suficientes/i);
});

test('integra com buildEnergyMap e ordena banheiro, refrigeracao e iluminacao', () => {
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
    lightingProfile: 'mixed',
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });
  const map = buildEnergyMap([lighting, bathroom, refrigeration]);

  assert.deepEqual(
    map.blocksByEstimatedImpact.map((block) => block.room),
    ['bathroom', 'refrigeration', 'lighting']
  );
});
