import assert from 'node:assert/strict';
import test from 'node:test';

import { estimateBathroomEnergyBlock } from '@/lib/energy-map';

test('calcula kWh mensal do banheiro via chuveiro corretamente', () => {
  const estimate = estimateBathroomEnergyBlock({
    powerWatts: 5000,
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.status, 'estimated');
  assert.equal(estimate.estimatedKwh, 120);
});

test('calcula custo estimado usando tarifa media', () => {
  const estimate = estimateBathroomEnergyBlock({
    powerWatts: 5000,
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.estimatedCost, 132);
});

test('calcula percentual estimado da fatura e cobertura do mapa', () => {
  const estimate = estimateBathroomEnergyBlock({
    powerWatts: 5000,
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.estimatedInvoiceSharePercent, 30);
  assert.equal(estimate.estimatedShare, 30);
  assert.equal(estimate.coverageContribution, 30);
});

test('usa default de potencia quando potencia nao for informada', () => {
  const estimate = estimateBathroomEnergyBlock({
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.status, 'estimated');
  assert.equal(estimate.assumptions.find((item) => item.key === 'powerWatts')?.value, 5000);
});

test('registra nas premissas quando usou default', () => {
  const estimate = estimateBathroomEnergyBlock({
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(
    estimate.assumptions.find((item) => item.key === 'powerWatts')?.source,
    'default'
  );
  assert.match(estimate.warnings.join(' '), /default conservador de 5000 W/i);
});

test('nao retorna confianca alta quando usa defaults', () => {
  const estimate = estimateBathroomEnergyBlock({
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.confidence, 'medium');
});

test('gera frase explicavel para a Core', () => {
  const estimate = estimateBathroomEnergyBlock({
    powerWatts: 5000,
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.match(estimate.explanationForCore, /banheiro pode representar cerca de R\$ 132/i);
  assert.match(estimate.explanationForCore, /30% da fatura/i);
});

test('gera insight educativo curto e probabilistico para banheiro', () => {
  const estimate = estimateBathroomEnergyBlock({
    powerWatts: 5000,
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.match(estimate.educationalInsight, /pode ganhar muito peso/i);
  assert.doesNotMatch(estimate.educationalInsight, /30%|132|certeza|sempre/i);
});

test('nao quebra com fatura ausente', () => {
  const estimate = estimateBathroomEnergyBlock({
    powerWatts: 5000,
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
  });

  assert.equal(estimate.status, 'estimated');
  assert.equal(estimate.estimatedCost, 132);
  assert.equal(estimate.estimatedInvoiceSharePercent, undefined);
  assert.equal(estimate.confidence, 'low');
});

test('nao calcula percentual com valor total da fatura zero', () => {
  const estimate = estimateBathroomEnergyBlock({
    powerWatts: 5000,
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 0,
  });

  assert.equal(estimate.status, 'estimated');
  assert.equal(estimate.estimatedInvoiceSharePercent, undefined);
  assert.match(estimate.warnings.join(' '), /nao foi possivel calcular o percentual/i);
});

test('retorna estimativa indisponivel quando dados essenciais forem invalidos', () => {
  const estimate = estimateBathroomEnergyBlock({
    powerWatts: 5000,
    residents: 0,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.status, 'unavailable');
  assert.equal(estimate.confidence, 'low');
  assert.match(estimate.explanationForCore, /ainda nao consigo estimar com honestidade/i);
});

test('retorna shape compativel com futura composicao do mapa', () => {
  const estimate = estimateBathroomEnergyBlock({
    powerWatts: 5000,
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });

  assert.equal(estimate.room, 'bathroom');
  assert.equal(estimate.coverageContribution, estimate.estimatedShare);
});
