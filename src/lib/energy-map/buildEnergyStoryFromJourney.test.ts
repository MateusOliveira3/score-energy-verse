import assert from 'node:assert/strict';
import test from 'node:test';

import { buildEnergyStoryFromJourney } from '@/lib/energy-map';
import { parseInvoiceText } from '@/lib/invoiceParser';

const makeInvoice = () => ({
  fingerprint: 'invoice-story-runtime-001',
  fileName: 'story-runtime.pdf',
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

test('gera Energy Story a partir da jornada quando ha sinais suficientes', () => {
  const story = buildEnergyStoryFromJourney({
    currentInvoice: makeInvoice(),
    profile: {
      propertySize: 82,
    },
    energyBehaviorProfile: {
      habits: {
        roomCountRange: '4_6',
      },
    },
  });

  assert.ok(story);
  assert.match(story?.coreNarrative ?? '', /Comecei a montar um mapa da sua residencia/i);
  assert.match(story?.explainedCoverageText ?? '', /parte/i);
  assert.ok(story?.unknownAreas.includes('climatizacao'));
});

test('retorna undefined sem sinais suficientes para montar a historia', () => {
  const story = buildEnergyStoryFromJourney({
    currentInvoice: undefined,
    profile: undefined,
    energyBehaviorProfile: undefined,
  });

  assert.equal(story, undefined);
});
