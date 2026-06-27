export type EnergyMapEstimateConfidence = 'high' | 'medium' | 'low';
export type EnergyMapEstimateStatus = 'estimated' | 'unavailable';
export type EnergyMapBlockRoom = 'bathroom' | string;

export interface EnergyMapAssumption {
  key: string;
  label: string;
  source: 'provided' | 'default';
  value: number;
}

export interface BathroomEnergyMapInput {
  powerWatts?: number | null;
  residents?: number | null;
  minutesPerShower?: number | null;
  showersPerResidentPerDay?: number | null;
  cycleDays?: number | null;
  averageTariffPerKwh?: number | null;
  invoiceTotalValue?: number | null;
}

export interface EnergyMapBlock {
  room: EnergyMapBlockRoom;
  status: EnergyMapEstimateStatus;
  estimatedKwh?: number;
  estimatedCost?: number;
  estimatedInvoiceSharePercent?: number;
  estimatedShare?: number;
  coverageContribution?: number;
  confidence: EnergyMapEstimateConfidence;
  assumptions: EnergyMapAssumption[];
  educationalInsight: string;
  explanationForCore: string;
  warnings: string[];
  limitations: string[];
}

export interface BathroomEnergyMapEstimate extends EnergyMapBlock {
  room: 'bathroom';
}

const DEFAULT_POWER_WATTS = 5000;

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

const buildUnavailableEstimate = ({
  assumptions,
  limitations,
  warnings,
}: Pick<BathroomEnergyMapEstimate, 'assumptions' | 'limitations' | 'warnings'>): BathroomEnergyMapEstimate => ({
  room: 'bathroom',
  status: 'unavailable',
  confidence: 'low',
  assumptions,
  educationalInsight:
    'Ainda faltam pistas suficientes para explicar com honestidade por que o banho pesa nesta conta.',
  explanationForCore:
    'Ainda nao consigo estimar com honestidade quanto o banheiro pesa na conta porque faltam dados essenciais da rotina de banho.',
  limitations,
  warnings,
});

export const estimateBathroomEnergyBlock = (
  input: BathroomEnergyMapInput
): BathroomEnergyMapEstimate => {
  const warnings: string[] = [];
  const limitations: string[] = [];
  const assumptions: EnergyMapAssumption[] = [];

  const hasExplicitPower =
    input.powerWatts !== undefined && input.powerWatts !== null && !Number.isNaN(input.powerWatts);

  if (hasExplicitPower && !isPositiveNumber(input.powerWatts)) {
    limitations.push('A potencia do chuveiro informada e invalida.');
  }

  if (!isPositiveNumber(input.residents)) {
    limitations.push('A quantidade de moradores precisa ser maior que zero.');
  }

  if (!isPositiveNumber(input.minutesPerShower)) {
    limitations.push('Os minutos por banho precisam ser maiores que zero.');
  }

  if (!isPositiveNumber(input.showersPerResidentPerDay)) {
    limitations.push('A frequencia diaria de banhos precisa ser maior que zero.');
  }

  if (!isPositiveNumber(input.cycleDays)) {
    limitations.push('Os dias do ciclo precisam ser maiores que zero.');
  }

  if (!isPositiveNumber(input.averageTariffPerKwh)) {
    limitations.push('A tarifa media por kWh precisa ser maior que zero.');
  }

  const powerWatts = hasExplicitPower ? input.powerWatts ?? undefined : DEFAULT_POWER_WATTS;
  const usedDefaultPower = !hasExplicitPower;

  if (usedDefaultPower) {
    warnings.push('A potencia do chuveiro nao foi informada. Usei o default conservador de 5000 W.');
  }

  if (!limitations.length) {
    assumptions.push({
      key: 'powerWatts',
      label: 'Potencia do chuveiro',
      source: usedDefaultPower ? 'default' : 'provided',
      value: powerWatts,
    });
    assumptions.push({
      key: 'residents',
      label: 'Moradores',
      source: 'provided',
      value: input.residents!,
    });
    assumptions.push({
      key: 'minutesPerShower',
      label: 'Minutos por banho',
      source: 'provided',
      value: input.minutesPerShower!,
    });
    assumptions.push({
      key: 'showersPerResidentPerDay',
      label: 'Banhos por morador por dia',
      source: 'provided',
      value: input.showersPerResidentPerDay!,
    });
    assumptions.push({
      key: 'cycleDays',
      label: 'Dias do ciclo',
      source: 'provided',
      value: input.cycleDays!,
    });
    assumptions.push({
      key: 'averageTariffPerKwh',
      label: 'Tarifa media por kWh',
      source: 'provided',
      value: input.averageTariffPerKwh!,
    });
    if (isPositiveNumber(input.invoiceTotalValue)) {
      assumptions.push({
        key: 'invoiceTotalValue',
        label: 'Valor total da fatura',
        source: 'provided',
        value: input.invoiceTotalValue,
      });
    }
  }

  if (limitations.length > 0 || !isPositiveNumber(powerWatts)) {
    return buildUnavailableEstimate({
      assumptions,
      limitations,
      warnings,
    });
  }

  const powerKw = powerWatts / 1000;
  const usageHoursPerDay =
    (input.residents! * input.showersPerResidentPerDay! * input.minutesPerShower!) / 60;
  const estimatedKwh = roundTo(powerKw * usageHoursPerDay * input.cycleDays!, 1);
  const estimatedCost = roundTo(estimatedKwh * input.averageTariffPerKwh!, 2);

  let estimatedInvoiceSharePercent: number | undefined;
  let estimatedShare: number | undefined;
  let coverageContribution: number | undefined;

  if (isPositiveNumber(input.invoiceTotalValue)) {
    const share = roundTo((estimatedCost / input.invoiceTotalValue) * 100, 1);
    estimatedInvoiceSharePercent = share;
    estimatedShare = share;
    coverageContribution = share;
  } else if (input.invoiceTotalValue !== undefined && input.invoiceTotalValue !== null) {
    warnings.push('Nao foi possivel calcular o percentual da fatura porque o valor total informado e invalido.');
  } else {
    warnings.push('Nao foi possivel calcular o percentual da fatura porque o valor total nao foi informado.');
  }

  const confidence: EnergyMapEstimateConfidence =
    !isPositiveNumber(input.invoiceTotalValue)
      ? 'low'
      : usedDefaultPower
        ? 'medium'
        : 'high';

  if (!isPositiveNumber(input.invoiceTotalValue)) {
    limitations.push('O percentual da fatura ficou indisponivel sem um valor total valido.');
  }

  const explanationForCore = [
    `O banheiro pode representar cerca de ${formatCurrency(estimatedCost)} da sua conta`,
    estimatedShare !== undefined
      ? `, algo proximo de ${formatPercent(estimatedShare)} da fatura.`
      : '.',
    ` Usei como base ${input.residents} ${input.residents === 1 ? 'morador' : 'moradores'},`,
    ` banhos de ${input.minutesPerShower} minutos e chuveiro de ${powerWatts.toLocaleString('en-US')} W.`,
  ].join('');
  const educationalInsight =
    input.residents! >= 3 || input.showersPerResidentPerDay! > 1
      ? 'Pode ganhar muito peso quando o chuveiro eletrico se repete varias vezes ao longo do dia.'
      : 'Mesmo poucos minutos por dia podem pesar quando o banho depende de chuveiro eletrico.';

  return {
    room: 'bathroom',
    status: 'estimated',
    estimatedCost,
    estimatedInvoiceSharePercent,
    estimatedKwh,
    estimatedShare,
    coverageContribution,
    confidence,
    assumptions,
    educationalInsight,
    explanationForCore,
    limitations,
    warnings,
  };
};
