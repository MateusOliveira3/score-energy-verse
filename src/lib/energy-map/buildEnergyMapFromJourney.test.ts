import assert from 'node:assert/strict';
import test from 'node:test';

import { buildEnergyMapFromJourney } from '@/lib/energy-map';
import { parseInvoiceText } from '@/lib/invoiceParser';

const makeInvoice = () => ({
  fingerprint: 'invoice-map-runtime-001',
  fileName: 'map-runtime.pdf',
  fileType: 'application/pdf',
  fileSize: 2048,
  consumption: 280,
  totalValue: 320,
  month: 'maio de 2026',
  parser: parseInvoiceText(`
    DISTRIBUIDORA: SCORE TESTE
    REFERENCIA: 05/2026
    TOTAL A PAGAR: R$ 320,00
    CONSUMO FATURADO: 280 kWh
    DIAS FATURADOS: 30
  `),
  uploadedAt: '2026-05-10T10:00:00.000Z',
});

test('gera Energy Map inicial com refrigeracao e iluminacao a partir da jornada', () => {
  const map = buildEnergyMapFromJourney({
    currentInvoice: makeInvoice(),
    profile: {
      propertySize: 82,
    },
    energyBehaviorProfile: {
      habits: {
        roomCountRange: '4_6',
      },
      appliances: {},
    },
  });

  assert.ok(map);
  assert.deepEqual(
    map?.blocksByEstimatedImpact.map((block) => block.room),
    ['refrigeration', 'lighting']
  );
  assert.equal(map?.estimatedCoveragePercent ? map.estimatedCoveragePercent > 0 : false, true);
});

test('mapa inicial continua funcionando mesmo sem roomCount explicito', () => {
  const map = buildEnergyMapFromJourney({
    currentInvoice: makeInvoice(),
    profile: {
      propertySize: 0,
    },
    energyBehaviorProfile: {
      habits: {},
      appliances: {},
    },
  });

  assert.ok(map);
  assert.deepEqual(map?.blocksByEstimatedImpact.map((block) => block.room), ['refrigeration']);
});
