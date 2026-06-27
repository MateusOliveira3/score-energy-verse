import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createEnergyHypothesis,
  createHouseModel,
  createRoomModel,
} from '@/lib/cognitive';
import {
  buildEnergyMap,
  estimateBathroomEnergyBlock,
  estimateRefrigerationEnergyBlock,
  type EnergyMap,
} from '@/lib/energy-map';
import { buildInvestigationState } from '@/lib/investigation';

const NOW = '2026-06-19T12:00:00.000Z';

const makeEnergyMap = (): EnergyMap =>
  buildEnergyMap([
    estimateBathroomEnergyBlock({
      powerWatts: 5500,
      residents: 3,
      minutesPerShower: 10,
      showersPerResidentPerDay: 1,
      cycleDays: 30,
      averageTariffPerKwh: 1.1,
      invoiceTotalValue: 440,
    }),
    estimateRefrigerationEnergyBlock({
      hasRefrigerator: true,
      hasFreezer: true,
      cycleDays: 30,
      averageTariffPerKwh: 1.1,
      invoiceTotalValue: 440,
    }),
  ]);

const makeHouse = () =>
  createHouseModel({
    id: 'house-1',
    ownerId: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    identity: {
      residenceType: 'apartment',
      occupants: {
        count: 3,
        confidence: 'medium',
      },
      routineProfile: {
        mainUsePeriod: 'night',
        confidence: 'medium',
      },
    },
    understanding: {
      overallLevel: 36,
      explainedBillShare: 43,
      confidence: 'medium',
      knownAreas: ['bathroom', 'refrigeration'],
      unknownAreas: ['Ainda nao sei o peso da iluminacao.'],
      mainKnownPattern: 'O banho e a refrigeracao concentram boa parte da conta conhecida.',
    },
    rooms: [
      createRoomModel(
        {
          id: 'room-bathroom',
          type: 'bathroom',
          label: 'Banheiro',
          understandingLevel: 52,
          confidence: 'medium',
          mainHypothesis: 'Banhos eletricos sustentam uma parcela importante da conta.',
          mainMystery: 'Ainda falta entender a iluminacao em detalhes.',
          evidence: [
            {
              id: 'evidence-bathroom-1',
              source: 'user_answer',
              description: 'A casa usa chuveiro eletrico todos os dias.',
              confidence: 'medium',
              createdAt: NOW,
              relatedRoomId: 'room-bathroom',
              relatedHypothesisId: 'hypothesis-bathroom',
            },
          ],
        },
        'bathroom'
      ),
      createRoomModel(
        {
          id: 'room-kitchen',
          type: 'kitchen',
          label: 'Cozinha',
          understandingLevel: 28,
          confidence: 'low',
          mainMystery: 'Ainda faltam dados sobre o uso de equipamentos da cozinha.',
        },
        'kitchen'
      ),
    ],
    activeHypotheses: [
      createEnergyHypothesis({
        id: 'hypothesis-bathroom',
        title: 'Banheiro pode explicar parte relevante da conta',
        description: 'Os banhos aparecem como principal explicacao atual.',
        status: 'strengthened',
        relatedRooms: ['bathroom', 'room-bathroom'],
        evidenceIds: ['evidence-bathroom-1'],
        confidence: 'medium',
        potentialImpact: 'high',
      }),
      createEnergyHypothesis({
        id: 'hypothesis-lighting',
        title: 'Iluminacao ainda pode esconder consumo recorrente',
        description: 'Ainda falta entender melhor a iluminacao da residencia.',
        status: 'investigating',
        relatedRooms: ['lighting'],
        evidenceIds: [],
        confidence: 'low',
        potentialImpact: 'medium',
      }),
    ],
    discardedHypotheses: [],
    confirmedHypotheses: [],
    nextInvestigation: {
      focus: 'bathroom',
      reason: 'O banheiro ainda concentra a maior hipotese aberta.',
    },
  });

test('retorna estado vazio e serializavel quando ainda nao ha mapa nem casa', () => {
  const state = buildInvestigationState({});

  assert.equal(state.dominantHypothesis, undefined);
  assert.deepEqual(state.hypotheses, []);
  assert.deepEqual(state.knownFacts, []);
  assert.equal(state.currentFocus, 'unknown');
  assert.equal(state.confidence, 'unknown');
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
});

test('seleciona banheiro como hipotese dominante quando o mapa contem apenas banheiro', () => {
  const energyMap = buildEnergyMap([
    estimateBathroomEnergyBlock({
      powerWatts: 5500,
      residents: 3,
      minutesPerShower: 10,
      showersPerResidentPerDay: 1,
      cycleDays: 30,
      averageTariffPerKwh: 1.1,
      invoiceTotalValue: 440,
    }),
  ]);

  const state = buildInvestigationState({ energyMap });

  assert.equal(state.dominantHypothesis?.relatedRoom, 'bathroom');
  assert.equal(state.hypotheses.length, 1);
  assert.notEqual(state.dominantHypothesis?.status, 'confirmed');
});

test('ordena corretamente banheiro acima de refrigeracao quando o impacto estimado e maior', () => {
  const state = buildInvestigationState({
    energyMap: makeEnergyMap(),
    house: makeHouse(),
  });

  assert.equal(state.dominantHypothesis?.relatedRoom, 'bathroom');
  assert.ok(
    state.hypotheses.some((hypothesis) => hypothesis.relatedRoom === 'refrigeration')
  );
  assert.equal(state.currentFocus, 'bathroom');
});

test('preenche knownFacts e unknownAreas com base nos dados existentes', () => {
  const state = buildInvestigationState({
    energyMap: makeEnergyMap(),
    house: makeHouse(),
  });

  assert.ok(
    state.knownFacts.includes('Residence type identified as apartment.')
  );
  assert.ok(
    state.knownFacts.includes('Known occupancy currently points to 3 resident(s).')
  );
  assert.ok(
    state.knownFacts.some((fact) => fact.includes('Energy map currently covers about'))
  );
  assert.ok(
    state.unknownAreas.includes('Ainda nao sei o peso da iluminacao.')
  );
  assert.ok(
    state.unknownAreas.includes('Ainda falta entender a iluminacao em detalhes.')
  );
});

test('mantem confianca coerente com hipotese dominante fortalecida', () => {
  const state = buildInvestigationState({
    energyMap: makeEnergyMap(),
    house: makeHouse(),
  });

  assert.equal(state.dominantHypothesis?.status, 'strengthened');
  assert.ok(['medium', 'high'].includes(state.confidence));
});

test('nao confirma hipotese sem evidencia suficiente', () => {
  const state = buildInvestigationState({
    energyMap: buildEnergyMap([
      estimateRefrigerationEnergyBlock({
        hasRefrigerator: true,
        cycleDays: 30,
        averageTariffPerKwh: 1.1,
        invoiceTotalValue: 440,
      }),
    ]),
  });

  assert.equal(state.dominantHypothesis?.relatedRoom, 'refrigeration');
  assert.notEqual(state.dominantHypothesis?.status, 'confirmed');
});

test('evita hipoteses duplicadas entre Energy Map e HouseModel', () => {
  const energyMap = buildEnergyMap([
    estimateBathroomEnergyBlock({
      powerWatts: 5500,
      residents: 3,
      minutesPerShower: 10,
      showersPerResidentPerDay: 1,
      cycleDays: 30,
      averageTariffPerKwh: 1.1,
      invoiceTotalValue: 440,
    }),
  ]);
  const house = createHouseModel({
    id: 'house-duplicates',
    ownerId: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    rooms: [
      createRoomModel(
        {
          id: 'room-bathroom',
          type: 'bathroom',
          label: 'Banheiro',
          understandingLevel: 40,
          confidence: 'medium',
        },
        'bathroom'
      ),
    ],
    activeHypotheses: [
      createEnergyHypothesis({
        id: 'hypothesis-bathroom-a',
        title: 'Banheiro pode explicar parte relevante da conta',
        description: 'Primeira leitura do banheiro.',
        status: 'strengthened',
        relatedRooms: ['bathroom', 'room-bathroom'],
        evidenceIds: ['evidence-bathroom-a'],
        confidence: 'medium',
        potentialImpact: 'high',
      }),
      createEnergyHypothesis({
        id: 'hypothesis-bathroom-b',
        title: 'Banheiro pode explicar parte relevante da conta',
        description: 'Mesma explicacao duplicada em outra estrutura.',
        status: 'investigating',
        relatedRooms: ['bathroom'],
        evidenceIds: [],
        confidence: 'low',
        potentialImpact: 'medium',
      }),
    ],
  });

  const state = buildInvestigationState({ energyMap, house });

  assert.equal(
    state.hypotheses.filter((hypothesis) => hypothesis.relatedRoom === 'bathroom').length,
    1
  );
});

test('resultado e deterministico e nao muta as entradas', () => {
  const energyMap = makeEnergyMap();
  const house = makeHouse();
  const originalEnergyMap = JSON.parse(JSON.stringify(energyMap));
  const originalHouse = JSON.parse(JSON.stringify(house));

  const first = buildInvestigationState({ energyMap, house });
  const second = buildInvestigationState({ energyMap, house });

  assert.deepEqual(first, second);
  assert.deepEqual(JSON.parse(JSON.stringify(energyMap)), originalEnergyMap);
  assert.deepEqual(JSON.parse(JSON.stringify(house)), originalHouse);
});
