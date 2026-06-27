import { EnergyMapBlock, EnergyMapEstimateConfidence } from './bathroom';
import { EnergyMap } from './buildEnergyMap';

export interface EnergyStory {
  explainedCoveragePercent: number;
  explainedCoverageText: string;
  strongestFinding?: string;
  secondaryFindings: string[];
  unknownAreas: string[];
  nextInvestigation?: string;
  confidenceNarrative: string;
  coreNarrative: string;
  educationalInsight: string;
}

interface InvestigationSuggestion {
  label: string;
  narrative: string;
}

const INVESTIGATION_PRIORITY = [
  'climatization',
  'laundry',
  'kitchen',
  'refrigeration',
  'lighting',
  'bathroom',
] as const;

const ROOM_LABELS: Record<string, string> = {
  bathroom: 'banheiro',
  climatization: 'climatizacao',
  kitchen: 'cozinha',
  laundry: 'lavanderia',
  lighting: 'iluminacao',
  refrigeration: 'refrigeracao',
};

const ROOM_LABELS_WITH_ARTICLE: Record<string, string> = {
  bathroom: 'O banheiro',
  climatization: 'A climatizacao',
  kitchen: 'A cozinha',
  laundry: 'A lavanderia',
  lighting: 'A iluminacao',
  refrigeration: 'A refrigeracao',
};

const UNKNOWN_AREA_LABELS: Record<string, string> = {
  bathroom: 'banheiro',
  climatization: 'climatizacao',
  kitchen: 'cozinha',
  laundry: 'lavanderia',
  lighting: 'iluminacao',
  refrigeration: 'refrigeracao',
};

const CONFIDENCE_LABELS: Record<EnergyMapEstimateConfidence, string> = {
  high: 'alta',
  medium: 'parcial',
  low: 'inicial',
};

const formatPercent = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  const isIntegerAmount = Math.abs(rounded - Math.round(rounded)) < 0.0001;
  return `${isIntegerAmount ? Math.round(rounded).toString() : rounded.toFixed(1)}%`;
};

const listToNaturalLanguage = (items: string[]) => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} e ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`;
};

const toCoverageText = (coverage: number) => {
  if (coverage <= 0) {
    return 'Ainda nao consigo explicar uma parte relevante da sua conta com honestidade.';
  }

  if (coverage < 15) {
    return 'Ainda consigo explicar apenas uma pequena parte da sua conta.';
  }

  if (coverage < 35) {
    return 'Ate agora consigo explicar uma parte inicial da sua conta.';
  }

  if (coverage < 65) {
    return 'Ate agora consigo explicar aproximadamente metade da sua conta.';
  }

  if (coverage < 85) {
    return 'Ate agora consigo explicar boa parte da sua conta.';
  }

  return 'Ate agora consigo explicar quase toda a sua conta.';
};

const describeStrongestFinding = (block: EnergyMapBlock) => {
  const roomLabel = ROOM_LABELS_WITH_ARTICLE[block.room] ?? `O ${ROOM_LABELS[block.room] ?? block.room}`;
  return `${roomLabel} parece representar a maior parcela conhecida da sua conta.`;
};

const describeSecondaryFinding = (block: EnergyMapBlock) => {
  if (block.room === 'refrigeration') {
    return 'A refrigeracao parece manter uma parcela constante da conta ao longo do ciclo.';
  }

  if (block.room === 'lighting') {
    return 'A iluminacao parece representar uma parcela menor, mas recorrente, da conta.';
  }

  if (block.room === 'bathroom') {
    return 'O banheiro continua sendo uma pista importante quando existe uso intenso de banho.';
  }

  const roomLabel = ROOM_LABELS[block.room] ?? block.room;
  return `${roomLabel[0]?.toUpperCase() ?? ''}${roomLabel.slice(1)} ainda traz sinais uteis para explicar a conta.`;
};

const deriveUnknownAreas = (map: EnergyMap) => {
  const explainedRooms = new Set(
    map.blocks.filter((block) => block.status === 'estimated').map((block) => block.room)
  );

  return INVESTIGATION_PRIORITY
    .filter((room) => !explainedRooms.has(room))
    .map((room) => UNKNOWN_AREA_LABELS[room]);
};

const pickNextInvestigation = (unknownAreas: string[]): InvestigationSuggestion | undefined => {
  const preferred = unknownAreas[0];

  if (!preferred) {
    return undefined;
  }

  if (preferred === 'climatizacao') {
    return {
      label: preferred,
      narrative: 'Entender como funciona a climatizacao da residencia.',
    };
  }

  if (preferred === 'lavanderia') {
    return {
      label: preferred,
      narrative: 'Entender com que frequencia a lavanderia entra na rotina da casa.',
    };
  }

  if (preferred === 'cozinha') {
    return {
      label: preferred,
      narrative: 'Entender melhor os usos recorrentes da cozinha na residencia.',
    };
  }

  if (preferred === 'refrigeracao') {
    return {
      label: preferred,
      narrative: 'Entender melhor o peso da refrigeracao na residencia.',
    };
  }

  if (preferred === 'iluminacao') {
    return {
      label: preferred,
      narrative: 'Entender melhor o padrao de iluminacao da residencia.',
    };
  }

  return {
    label: preferred,
    narrative: `Entender melhor o papel do ${preferred} na residencia.`,
  };
};

const buildConfidenceNarrative = (
  confidence: EnergyMapEstimateConfidence,
  unknownAreas: string[],
  warnings: string[]
) => {
  if (unknownAreas.length === 0 && confidence === 'high' && warnings.length === 0) {
    return 'Minha compreensao ja cobre boa parte da residencia e esta mais consistente do que no inicio.';
  }

  if (unknownAreas.length > 0) {
    return `Minha compreensao ainda e ${CONFIDENCE_LABELS[confidence]} porque ainda preciso investigar ${listToNaturalLanguage(
      unknownAreas.slice(0, 3)
    )}.`;
  }

  if (warnings.length > 0) {
    return 'Minha compreensao ainda e parcial porque parte das estimativas depende de premissas conservadoras.';
  }

  return 'Minha compreensao ainda e parcial, mas ja comeca a mostrar um desenho mais confiavel da casa.';
};

const buildEducationalInsight = (map: EnergyMap) => {
  const rooms = new Set(map.blocksByEstimatedImpact.map((block) => block.room));

  if (rooms.has('bathroom') && rooms.has('refrigeration')) {
    return 'Nem sempre o uso mais intenso e o unico que pesa na conta: cargas de banho e equipamentos ligados continuamente podem dividir o protagonismo.';
  }

  if (rooms.has('lighting')) {
    return 'Consumos pequenos e recorrentes tambem ajudam a explicar a conta quando se repetem todos os dias.';
  }

  if (rooms.has('bathroom')) {
    return 'Uma unica rotina intensa, como o banho eletrico, ja pode explicar uma parcela relevante da conta.';
  }

  return 'Entender a conta comeca por ligar consumo a ambientes reais da casa, nao apenas a numeros soltos.';
};

const buildCoreNarrative = (
  coverageText: string,
  strongestFinding: string | undefined,
  secondaryFindings: string[],
  nextInvestigation: string | undefined
) => {
  const lines = ['Comecei a montar um mapa da sua residencia.', coverageText];

  if (strongestFinding) {
    lines.push(strongestFinding);
  }

  if (secondaryFindings.length > 0) {
    lines.push(secondaryFindings[0]);
  }

  if (nextInvestigation) {
    lines.push(`Ainda preciso ${nextInvestigation.slice(0, 1).toLowerCase()}${nextInvestigation.slice(1)}`);
  }

  return lines.join(' ');
};

export const buildEnergyStory = (map: EnergyMap): EnergyStory => {
  const explainedCoveragePercent = map.estimatedCoveragePercent;
  const explainedCoverageText = explainedCoveragePercent
    ? `${toCoverageText(explainedCoveragePercent)} Ate agora isso representa algo proximo de ${formatPercent(
        explainedCoveragePercent
      )} da fatura.`
    : toCoverageText(explainedCoveragePercent);
  const strongestFinding = map.topBlock ? describeStrongestFinding(map.topBlock) : undefined;
  const secondaryFindings = map.blocksByEstimatedImpact
    .slice(strongestFinding ? 1 : 0, 3)
    .map(describeSecondaryFinding);
  const unknownAreas = deriveUnknownAreas(map);
  const nextInvestigation = pickNextInvestigation(unknownAreas)?.narrative;
  const confidenceNarrative = buildConfidenceNarrative(map.confidence, unknownAreas, map.warnings);
  const educationalInsight = buildEducationalInsight(map);
  const coreNarrative = buildCoreNarrative(
    explainedCoverageText,
    strongestFinding,
    secondaryFindings,
    nextInvestigation
  );

  return {
    explainedCoveragePercent,
    explainedCoverageText,
    strongestFinding,
    secondaryFindings,
    unknownAreas,
    nextInvestigation,
    confidenceNarrative,
    coreNarrative,
    educationalInsight,
  };
};
