import {
  EnergyMapAssumption,
  EnergyMapBlock,
  EnergyMapEstimateConfidence,
} from './bathroom';

export interface RefrigerationEnergyMapInput {
  hasRefrigerator?: boolean | null;
  hasFreezer?: boolean | null;
  hasExtraFridge?: boolean | null;
  cycleDays?: number | null;
  averageTariffPerKwh?: number | null;
  invoiceTotalValue?: number | null;
  refrigeratorMonthlyKwh?: number | null;
  freezerMonthlyKwh?: number | null;
  extraFridgeMonthlyKwh?: number | null;
}

export interface RefrigerationEnergyMapEstimate extends EnergyMapBlock {
  room: 'refrigeration';
}

const DEFAULT_REFRIGERATOR_KWH = 45;
const DEFAULT_FREEZER_KWH = 50;
const DEFAULT_EXTRA_FRIDGE_KWH = 40;
const MONTH_REFERENCE_DAYS = 30;

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
  warnings,
  limitations,
}: Pick<RefrigerationEnergyMapEstimate, 'assumptions' | 'warnings' | 'limitations'>): RefrigerationEnergyMapEstimate => ({
  room: 'refrigeration',
  status: 'unavailable',
  confidence: 'low',
  assumptions,
  warnings,
  limitations,
  educationalInsight:
    'Ainda faltam pistas suficientes para explicar com honestidade o papel da refrigeracao nesta conta.',
  explanationForCore:
    'Ainda nao consigo estimar com honestidade o peso da refrigeracao porque nenhum equipamento recorrente dessa categoria foi confirmado.',
});

const scaleMonthlyKwhToCycle = (monthlyKwh: number, cycleDays: number) =>
  roundTo((monthlyKwh / MONTH_REFERENCE_DAYS) * cycleDays, 1);

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

export const estimateRefrigerationEnergyBlock = (
  input: RefrigerationEnergyMapInput
): RefrigerationEnergyMapEstimate => {
  const warnings: string[] = [];
  const limitations: string[] = [];
  const assumptions: EnergyMapAssumption[] = [];

  const hasRefrigerator = input.hasRefrigerator === true;
  const hasFreezer = input.hasFreezer === true;
  const hasExtraFridge = input.hasExtraFridge === true;

  if (!hasRefrigerator && !hasFreezer && !hasExtraFridge) {
    limitations.push('Nenhum equipamento de refrigeracao foi confirmado ate agora.');
    return buildUnavailableEstimate({ assumptions, warnings, limitations });
  }

  if (!isPositiveNumber(input.cycleDays)) {
    limitations.push('Os dias do ciclo precisam ser maiores que zero.');
    return buildUnavailableEstimate({ assumptions, warnings, limitations });
  }

  let estimatedKwh = 0;
  let usedDefaultConsumption = false;

  if (hasRefrigerator) {
    const monthlyKwh = isPositiveNumber(input.refrigeratorMonthlyKwh)
      ? input.refrigeratorMonthlyKwh
      : DEFAULT_REFRIGERATOR_KWH;
    const source = isPositiveNumber(input.refrigeratorMonthlyKwh) ? 'provided' : 'default';
    usedDefaultConsumption ||= source === 'default';
    estimatedKwh += scaleMonthlyKwhToCycle(monthlyKwh, input.cycleDays);
    pushAssumption(
      assumptions,
      'refrigeratorMonthlyKwh',
      'Geladeira principal (kWh/mes)',
      monthlyKwh,
      source
    );
  }

  if (hasFreezer) {
    const monthlyKwh = isPositiveNumber(input.freezerMonthlyKwh)
      ? input.freezerMonthlyKwh
      : DEFAULT_FREEZER_KWH;
    const source = isPositiveNumber(input.freezerMonthlyKwh) ? 'provided' : 'default';
    usedDefaultConsumption ||= source === 'default';
    estimatedKwh += scaleMonthlyKwhToCycle(monthlyKwh, input.cycleDays);
    pushAssumption(
      assumptions,
      'freezerMonthlyKwh',
      'Freezer separado (kWh/mes)',
      monthlyKwh,
      source
    );
  }

  if (hasExtraFridge) {
    const monthlyKwh = isPositiveNumber(input.extraFridgeMonthlyKwh)
      ? input.extraFridgeMonthlyKwh
      : DEFAULT_EXTRA_FRIDGE_KWH;
    const source = isPositiveNumber(input.extraFridgeMonthlyKwh) ? 'provided' : 'default';
    usedDefaultConsumption ||= source === 'default';
    estimatedKwh += scaleMonthlyKwhToCycle(monthlyKwh, input.cycleDays);
    pushAssumption(
      assumptions,
      'extraFridgeMonthlyKwh',
      'Geladeira extra ou cervejeira (kWh/mes)',
      monthlyKwh,
      source
    );
  }

  pushAssumption(assumptions, 'cycleDays', 'Dias do ciclo', input.cycleDays, 'provided');

  if (usedDefaultConsumption) {
    warnings.push(
      'Usei consumos mensais conservadores para os equipamentos de refrigeracao considerados nesta estimativa.'
    );
  }

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
    warnings.push('Nao foi possivel calcular o custo da refrigeracao porque a tarifa media nao foi informada.');
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
      : usedDefaultConsumption
        ? 'medium'
        : 'high';

  const equipmentLabels = [
    hasRefrigerator ? 'geladeira' : null,
    hasFreezer ? 'freezer' : null,
    hasExtraFridge ? 'refrigerador extra' : null,
  ].filter(Boolean);

  const equipmentLine =
    equipmentLabels.length === 1
      ? equipmentLabels[0]
      : equipmentLabels.length === 2
        ? `${equipmentLabels[0]} e ${equipmentLabels[1]}`
        : `${equipmentLabels.slice(0, -1).join(', ')} e ${equipmentLabels.at(-1)}`;

  const explanationForCore = [
    estimatedCost !== undefined
      ? `A refrigeracao pode representar cerca de ${formatCurrency(estimatedCost)} da sua conta`
      : `A refrigeracao pode representar cerca de ${estimatedKwh} kWh do seu ciclo`,
    estimatedShare !== undefined
      ? `, algo proximo de ${formatPercent(estimatedShare)} da fatura.`
      : '.',
    ` Usei uma estimativa conservadora para ${equipmentLine} funcionando todos os dias.`,
  ].join('');
  const educationalInsight =
    hasExtraFridge || hasFreezer
      ? 'Pode ganhar peso porque varios equipamentos ficam ligados continuamente, mesmo sem uso direto.'
      : 'Costuma pesar de forma constante porque a geladeira trabalha ao longo do dia inteiro.';

  return {
    room: 'refrigeration',
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
