import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildEnergyMap,
  EnergyMapBlock,
  estimateBathroomEnergyBlock,
} from '@/lib/energy-map';

const makeBlock = (overrides: Partial<EnergyMapBlock> = {}): EnergyMapBlock => ({
  room: 'bathroom',
  status: 'estimated',
  estimatedKwh: 120,
  estimatedCost: 132,
  estimatedInvoiceSharePercent: 30,
  estimatedShare: 30,
  coverageContribution: 30,
  confidence: 'medium',
  assumptions: [],
  educationalInsight: 'Banhos com chuveiro eletrico podem concentrar bastante consumo.',
  explanationForCore: 'O banheiro pode representar parte relevante da conta.',
  warnings: [],
  limitations: [],
  ...overrides,
});

test('retorna mapa valido com um unico bloco', () => {
  const block = estimateBathroomEnergyBlock({
    powerWatts: 5000,
    residents: 4,
    minutesPerShower: 12,
    showersPerResidentPerDay: 1,
    cycleDays: 30,
    averageTariffPerKwh: 1.1,
    invoiceTotalValue: 440,
  });
  const map = buildEnergyMap([block]);

  assert.equal(map.blocks.length, 1);
  assert.equal(map.topBlock?.room, 'bathroom');
  assert.equal(map.estimatedCoveredCost, 132);
});

test('ordena blocos por impacto estimado', () => {
  const map = buildEnergyMap([
    makeBlock({ room: 'lighting', estimatedCost: 24, estimatedShare: 5, coverageContribution: 5 }),
    makeBlock({ room: 'bathroom', estimatedCost: 132, estimatedShare: 30, coverageContribution: 30 }),
    makeBlock({ room: 'refrigeration', estimatedCost: 58, estimatedShare: 13, coverageContribution: 13 }),
  ]);

  assert.deepEqual(
    map.blocksByEstimatedImpact.map((block) => block.room),
    ['bathroom', 'refrigeration', 'lighting']
  );
});

test('soma custo estimado corretamente', () => {
  const map = buildEnergyMap([
    makeBlock({ estimatedCost: 132 }),
    makeBlock({ room: 'lighting', estimatedCost: 24 }),
  ]);

  assert.equal(map.estimatedCoveredCost, 156);
});

test('soma kWh estimado corretamente', () => {
  const map = buildEnergyMap([
    makeBlock({ estimatedKwh: 120 }),
    makeBlock({ room: 'lighting', estimatedKwh: 22 }),
  ]);

  assert.equal(map.estimatedCoveredKwh, 142);
});

test('calcula cobertura estimada da fatura', () => {
  const map = buildEnergyMap([
    makeBlock({ coverageContribution: 30 }),
    makeBlock({ room: 'lighting', coverageContribution: 5 }),
  ]);

  assert.equal(map.estimatedCoveragePercent, 35);
});

test('limita cobertura acima de 100%', () => {
  const map = buildEnergyMap([
    makeBlock({ coverageContribution: 70 }),
    makeBlock({ room: 'lighting', coverageContribution: 45 }),
  ]);

  assert.equal(map.estimatedCoveragePercent, 100);
});

test('registra warning quando cobertura ultrapassa 100%', () => {
  const map = buildEnergyMap([
    makeBlock({ coverageContribution: 70 }),
    makeBlock({ room: 'lighting', coverageContribution: 45 }),
  ]);

  assert.match(map.warnings.join(' '), /ultrapassou 100%/i);
});

test('escolhe topBlock corretamente', () => {
  const map = buildEnergyMap([
    makeBlock({ room: 'lighting', estimatedCost: 24, estimatedShare: 5, coverageContribution: 5 }),
    makeBlock({ room: 'bathroom', estimatedCost: 132, estimatedShare: 30, coverageContribution: 30 }),
  ]);

  assert.equal(map.topBlock?.room, 'bathroom');
});

test('gera bestCoreInsight explicavel e nao absoluto', () => {
  const map = buildEnergyMap([makeBlock()]);

  assert.match(map.bestCoreInsight, /com o que sei ate agora/i);
  assert.match(map.bestCoreInsight, /parece ser o bloco mais relevante/i);
});

test('consolida lacunas abertas', () => {
  const map = buildEnergyMap([
    makeBlock({
      warnings: ['A potencia do chuveiro nao foi informada. Usei o default conservador de 5000 W.'],
      limitations: ['O percentual da fatura ficou indisponivel sem um valor total valido.'],
      estimatedInvoiceSharePercent: undefined,
      estimatedShare: undefined,
      coverageContribution: undefined,
    }),
  ]);

  assert.match(map.openGaps.join(' '), /default conservador de 5000 W/i);
  assert.match(map.openGaps.join(' '), /percentual da fatura ficou indisponivel/i);
});

test('rebaixa confianca geral quando existe apenas um bloco', () => {
  const map = buildEnergyMap([
    makeBlock({ confidence: 'high', coverageContribution: 80, estimatedShare: 80, estimatedCost: 300 }),
  ]);

  assert.equal(map.confidence, 'low');
});

test('nao quebra com lista vazia', () => {
  const map = buildEnergyMap([]);

  assert.equal(map.blocks.length, 0);
  assert.equal(map.blocksByEstimatedImpact.length, 0);
  assert.equal(map.estimatedCoveredCost, 0);
  assert.equal(map.estimatedCoveredKwh, 0);
  assert.equal(map.estimatedCoveragePercent, 0);
  assert.equal(map.topBlock, undefined);
  assert.match(map.bestCoreInsight, /ainda nao consigo montar/i);
});
