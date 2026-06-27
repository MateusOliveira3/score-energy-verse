import {
  EnergyMapAssumption,
  EnergyMapBlock,
  EnergyMapEstimateConfidence,
} from './bathroom';

export type LightingProfile = 'led' | 'mixed' | 'unknown';

export interface LightingEnergyMapInput {
  roomCount?: number | null;
  lightingProfile?: LightingProfile | null;
  cycleDays?: number | null;
  averageTariffPerKwh?: number | null;
  invoiceTotalValue?: number | null;
  averageLightingHoursPerDay?: number | null;
}

export interface LightingEnergyMapEstimate extends EnergyMapBlock {
  room: 'lighting';
}

const DEFAULT_LIGHT_POINTS_PER_ROOM = 1;
const DEFAULT_HOURS_PER_DAY = 4;
const DEFAULT_LED_WATTS = 10;
const DEFAULT_MIXED_WATTS = 18;
const DEFAULT_UNKNOWN_WATTS = 15;

const roundTo = (value: number, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const isPositiveNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const formatCurrency = (value: number) => {
  const rounded = roundTo(value, 2);
  const isIntegerAmount = Math.abs(rounded - Math.round(rounded)) < 0.0001;
  return `R$ ${isIntegerAmount ? Math.round(rounded).toString() : rounded.toFixed(2)}`;
};

const formatPercent = (value: number) => {
  const rounded = roundTo(value, 1);
  const isIntegerAmount = Math.abs(rounded - Math.round(rounded)) < 0.0001;
  return `${isIntegerAmount ? Math.round(rounded).toString() : rounded.toFixed(1)}%`;
};

const getProfileLabel = (profile: LightingProfile) => {
  if (profile === 'led') return 'LED';
  if (profile === 'mixed') return 'mista';
  return 'desconhecida';
};

const getProfileWatts = (profile: LightingProfile) => {
  if (profile === 'led') return DEFAULT_LED_WATTS;
  if (profile === 'mixed') return DEFAULT_MIXED_WATTS;
  return DEFAULT_UNKNOWN_WATTS;
};

const buildUnavailableEstimate = ({
  assumptions,
  warnings,
  limitations,
}: Pick<LightingEnergyMapEstimate, 'assumptions' | 'warnings' | 'limitations'>): LightingEnergyMapEstimate => ({
  room: 'lighting',
  status: 'unavailable',
  confidence: 'low',
  assumptions,
  warnings,
  limitations,
  educationalInsight:
    'Ainda faltam pistas suficientes para explicar com honestidade o papel da iluminacao nesta conta.',
  explanationForCore:
    'Ainda nao consigo estimar com honestidade o peso da iluminacao porque faltam sinais minimos sobre a residencia.',
});

const pushAssumption = (
  assumptions: EnergyMapAssumption[],
  key: string,
  label: string,
  value: number,
  source: 'provided' | 'default'
) => {
  assumptions.push({
    key,
    label,
    source,
    value,
  });
};

export const estimateLightingEnergyBlock = (
  input: LightingEnergyMapInput
): LightingEnergyMapEstimate => {
  const warnings: string[] = [];
  const limitations: string[] = [];
  const assumptions: EnergyMapAssumption[] = [];

  if (!isPositiveNumber(input.roomCount)) {
    limitations.push('A quantidade aproximada de comodos precisa ser maior que zero.');
    return buildUnavailableEstimate({ assumptions, warnings, limitations });
  }

  if (!isPositiveNumber(input.cycleDays)) {
    limitations.push('Os dias do ciclo precisam ser maiores que zero.');
    return buildUnavailableEstimate({ assumptions, warnings, limitations });
  }

  const lightingProfile: LightingProfile = input.lightingProfile ?? 'unknown';
  const pointsPerRoom = DEFAULT_LIGHT_POINTS_PER_ROOM;
  const averageHoursPerDay = isPositiveNumber(input.averageLightingHoursPerDay)
    ? input.averageLightingHoursPerDay
    : DEFAULT_HOURS_PER_DAY;
  const averageWatts = getProfileWatts(lightingProfile);
  const usedDefaultHours = !isPositiveNumber(input.averageLightingHoursPerDay);
  const usedUnknownProfile = lightingProfile === 'unknown';

  pushAssumption(
    assumptions,
    'roomCount',
    'Comodos considerados',
    input.roomCount,
    'provided'
  );
  pushAssumption(
    assumptions,
    'lightPointsPerRoom',
    'Pontos principais de iluminacao por comodo',
    pointsPerRoom,
    'default'
  );
  pushAssumption(
    assumptions,
    'averageLightingHoursPerDay',
    'Horas medias de iluminacao por dia',
    averageHoursPerDay,
    usedDefaultHours ? 'default' : 'provided'
  );
  pushAssumption(
    assumptions,
    'averageWattsPerLightPoint',
    `Potencia media por ponto (${getProfileLabel(lightingProfile)})`,
    averageWatts,
    'default'
  );
  pushAssumption(assumptions, 'cycleDays', 'Dias do ciclo', input.cycleDays, 'provided');

  if (usedDefaultHours) {
    warnings.push('Usei 4 horas medias por dia como aproximacao conservadora para iluminacao.');
  }

  if (usedUnknownProfile) {
    warnings.push('O tipo predominante de iluminacao nao foi informado. Usei uma media conservadora para perfil desconhecido.');
  }

  const estimatedKwh = roundTo(
    ((input.roomCount * pointsPerRoom * averageWatts) / 1000) *
      averageHoursPerDay *
      input.cycleDays,
    1
  );

  let estimatedCost: number | undefined;
  let estimatedInvoiceSharePercent: number | undefined;
  let estimatedShare: number | undefined;
  let coverageContribution: number | undefined;

  if (isPositiveNumber(input.averageTariffPerKwh)) {
    estimatedCost = roundTo(estimatedKwh * input.averageTariffPerKwh, 2);
    pushAssumption(
      assumptions,
      'averageTariffPerKwh',
      'Tarifa media por kWh',
      input.averageTariffPerKwh,
      'provided'
    );
  } else {
    warnings.push('Nao foi possivel calcular o custo da iluminacao porque a tarifa media nao foi informada.');
    limitations.push('O custo estimado ficou indisponivel sem tarifa media valida.');
  }

  if (estimatedCost !== undefined && isPositiveNumber(input.invoiceTotalValue)) {
    const share = roundTo((estimatedCost / input.invoiceTotalValue) * 100, 1);
    estimatedInvoiceSharePercent = share;
    estimatedShare = share;
    coverageContribution = share;
    pushAssumption(
      assumptions,
      'invoiceTotalValue',
      'Valor total da fatura',
      input.invoiceTotalValue,
      'provided'
    );
  } else if (estimatedCost !== undefined) {
    warnings.push(
      input.invoiceTotalValue === undefined || input.invoiceTotalValue === null
        ? 'Nao foi possivel calcular o percentual da fatura porque o valor total nao foi informado.'
        : 'Nao foi possivel calcular o percentual da fatura porque o valor total informado e invalido.'
    );
    limitations.push('O percentual da fatura ficou indisponivel sem um valor total valido.');
  }

  const confidence: EnergyMapEstimateConfidence =
    !estimatedCost || !estimatedShare
      ? 'low'
      : usedDefaultHours || usedUnknownProfile
        ? 'medium'
        : 'medium';

  const explanationForCore = [
    estimatedCost !== undefined
      ? `A iluminacao parece representar cerca de ${formatCurrency(estimatedCost)} da sua conta`
      : `A iluminacao parece representar cerca de ${estimatedKwh} kWh do seu ciclo`,
    estimatedShare !== undefined
      ? `, algo proximo de ${formatPercent(estimatedShare)} da fatura.`
      : '.',
    ` Considerei uma residencia com iluminacao predominantemente ${getProfileLabel(lightingProfile)} e uso medio diario.`,
  ].join('');
  const educationalInsight =
    lightingProfile === 'led'
      ? 'Costuma pesar menos quando a residencia ja usa LED na maior parte da iluminacao.'
      : lightingProfile === 'mixed'
        ? 'Pode ganhar peso quando varios comodos ficam acesos por horas ao longo do dia.'
        : 'Mesmo parecendo discreta, a iluminacao soma consumo quando se repete todos os dias.';

  return {
    room: 'lighting',
    status: 'estimated',
    estimatedKwh,
    estimatedCost,
    estimatedInvoiceSharePercent,
    estimatedShare,
    coverageContribution,
    confidence,
    assumptions,
    warnings,
    limitations,
    educationalInsight,
    explanationForCore,
  };
};
