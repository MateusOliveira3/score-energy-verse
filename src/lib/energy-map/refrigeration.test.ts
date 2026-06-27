import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildEnergyMap,
  estimateBathroomEnergyBlock,
  estimateRefrigerationEnergyBlock,
} from '@/lib/energy-map';

test('estima geladeira principal com default', () => {
  const estimate = estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.status, 'estimated');
  assert.equal(estimate.estimatedKwh, 45);
});

test('estima geladeira + freezer', () => {
  const estimate = estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    hasFreezer: true,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.estimatedKwh, 95);
});

test('estima geladeira + freezer + geladeira extra', () => {
  const estimate = estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    hasFreezer: true,
    hasExtraFridge: true,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.estimatedKwh, 135);
});

test('calcula custo com tarifa media', () => {
  const estimate = estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.estimatedCost, 49.5);
});

test('calcula percentual da fatura', () => {
  const estimate = estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.estimatedInvoiceSharePercent, 11.3);
  assert.equal(estimate.estimatedShare, 11.3);
  assert.equal(estimate.coverageContribution, 11.3);
});

test('nao calcula percentual com fatura zero ou ausente', () => {
  const withoutInvoice = estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
  });
  const withZeroInvoice = estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 0,
  });

  assert.equal(withoutInvoice.estimatedInvoiceSharePercent, undefined);
  assert.equal(withZeroInvoice.estimatedInvoiceSharePercent, undefined);
});

test('registra premissas usadas', () => {
  const estimate = estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    hasFreezer: true,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(
    estimate.assumptions.find((item) => item.key === 'refrigeratorMonthlyKwh')?.value,
    45
  );
  assert.equal(
    estimate.assumptions.find((item) => item.key === 'freezerMonthlyKwh')?.value,
    50
  );
});

test('rebaixa confianca quando usa defaults', () => {
  const estimate = estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.confidence, 'medium');
});

test('gera frase explicavel para Core', () => {
  const estimate = estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.match(estimate.explanationForCore, /a refrigeracao pode representar cerca de R\$ 49\.50/i);
  assert.match(estimate.explanationForCore, /estimativa conservadora/i);
});

test('gera insight coerente para refrigeracao sem afirmar certeza', () => {
  const estimate = estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    hasFreezer: true,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.match(estimate.educationalInsight, /equipamentos ficam ligados continuamente/i);
  assert.doesNotMatch(estimate.educationalInsight, /11\.3%|49\.5|certeza|sempre/i);
});

test('retorna comportamento seguro quando nao ha equipamentos de refrigeracao', () => {
  const estimate = estimateRefrigerationEnergyBlock({
    hasRefrigerator: false,
    hasFreezer: false,
    hasExtraFridge: false,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.status, 'unavailable');
  assert.equal(estimate.confidence, 'low');
});

test('funciona com buildEnergyMap junto ao banheiro', () => {
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
  const map = buildEnergyMap([refrigeration, bathroom]);

  assert.deepEqual(
    map.blocksByEstimatedImpact.map((block) => block.room),
    ['bathroom', 'refrigeration']
  );
  assert.equal(map.topBlock?.room, 'bathroom');
});
