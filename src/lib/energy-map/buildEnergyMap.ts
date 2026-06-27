import { EnergyMapBlock, EnergyMapEstimateConfidence } from './bathroom';

export interface EnergyMap {
  blocks: EnergyMapBlock[];
  blocksByEstimatedImpact: EnergyMapBlock[];
  estimatedCoveredCost: number;
  estimatedCoveredKwh: number;
  estimatedCoveragePercent: number;
  topBlock?: EnergyMapBlock;
  bestCoreInsight: string;
  openGaps: string[];
  warnings: string[];
  confidence: EnergyMapEstimateConfidence;
}

const roundTo = (value: number, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const isFinitePositive = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const uniqueStrings = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const confidenceRank: Record<EnergyMapEstimateConfidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const roomLabelById: Record<string, string> = {
  bathroom: 'o banheiro',
  kitchen: 'a cozinha',
  lighting: 'a iluminacao',
  refrigeration: 'a refrigeracao',
  laundry: 'a lavanderia',
  climatization: 'a climatizacao',
  others: 'outros usos',
};

const toRoomLabel = (room: string) => roomLabelById[room] ?? `o bloco ${room}`;

const getBlockImpact = (block: EnergyMapBlock) =>
  block.estimatedCost ?? block.estimatedShare ?? block.estimatedInvoiceSharePercent ?? 0;

const getIssueWeight = (block: EnergyMapBlock) =>
  (block.warnings?.length ?? 0) + (block.limitations?.length ?? 0);

const compareBlocksByImpact = (left: EnergyMapBlock, right: EnergyMapBlock) => {
  const impactDelta = getBlockImpact(right) - getBlockImpact(left);

  if (impactDelta !== 0) {
    return impactDelta;
  }

  const confidenceDelta = confidenceRank[right.confidence] - confidenceRank[left.confidence];

  if (confidenceDelta !== 0) {
    return confidenceDelta;
  }

  return getIssueWeight(left) - getIssueWeight(right);
};

export const buildEnergyMap = (blocks: EnergyMapBlock[]): EnergyMap => {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const validBlocks = safeBlocks.filter((block) => block.status === 'estimated');
  const blocksByEstimatedImpact = [...validBlocks].sort(compareBlocksByImpact);
  const estimatedCoveredCost = roundTo(
    validBlocks.reduce((sum, block) => sum + (block.estimatedCost ?? 0), 0),
    2
  );
  const estimatedCoveredKwh = roundTo(
    validBlocks.reduce((sum, block) => sum + (block.estimatedKwh ?? 0), 0),
    1
  );
  const aggregatedWarnings = uniqueStrings(
    safeBlocks.flatMap((block) => [...(block.warnings ?? []), ...(block.limitations ?? [])])
  );
  const rawCoveragePercent = roundTo(
    validBlocks.reduce((sum, block) => sum + (block.coverageContribution ?? 0), 0),
    1
  );
  const warnings = [...aggregatedWarnings];
  const estimatedCoveragePercent = Math.min(rawCoveragePercent, 100);

  if (rawCoveragePercent > 100) {
    warnings.push(
      'A cobertura estimada do mapa ultrapassou 100% e foi limitada para evitar falsa precisao.'
    );
  }

  const openGaps = uniqueStrings(
    safeBlocks.flatMap((block) => {
      const gaps = [...(block.warnings ?? []), ...(block.limitations ?? [])];

      if (!isFinitePositive(block.estimatedInvoiceSharePercent) && !isFinitePositive(block.estimatedShare)) {
        gaps.push(`Ainda falta cobertura percentual confiavel para ${toRoomLabel(block.room)}.`);
      }

      return gaps;
    })
  );

  const topBlock = blocksByEstimatedImpact[0];
  const bestCoreInsight = topBlock
    ? `Com o que sei ate agora, ${toRoomLabel(topBlock.room)} parece ser o bloco mais relevante da sua conta.`
    : 'Com o que sei ate agora, ainda nao consigo montar um mapa energetico confiavel da sua conta.';

  let confidence: EnergyMapEstimateConfidence = 'low';

  if (
    validBlocks.length > 1 &&
    estimatedCoveragePercent >= 60 &&
    warnings.length === 0 &&
    validBlocks.every((block) => block.confidence !== 'low')
  ) {
    confidence = 'high';
  } else if (
    validBlocks.length > 1 &&
    estimatedCoveragePercent >= 30 &&
    warnings.length <= 2 &&
    topBlock?.confidence !== 'low'
  ) {
    confidence = 'medium';
  }

  return {
    bestCoreInsight,
    blocks: safeBlocks,
    blocksByEstimatedImpact,
    confidence,
    estimatedCoveragePercent,
    estimatedCoveredCost,
    estimatedCoveredKwh,
    openGaps,
    topBlock,
    warnings: uniqueStrings(warnings),
  };
};

