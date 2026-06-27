import type {
  CoreSpeech,
  CoreSpeechStep,
  CoreSpeechTone,
  HouseClue,
  HouseClueKind,
} from '@/lib/cognitive/types';
import type { EnergyStory } from '@/lib/energy-map';
import type { InvoiceData } from '@/types/mvp';

const FORBIDDEN_TERMS = [
  'analise concluida',
  'insight detectado',
  'modulo',
  'diagnostico energetico realizado',
  'padrao de consumo indica otimizacao',
  'a causa foi identificada',
  'economia',
];

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const ensureSafeCopy = (value: string) => {
  const normalized = normalize(value);
  if (FORBIDDEN_TERMS.some((term) => normalized.includes(term))) {
    throw new Error(`Unsafe Core speech copy: ${value}`);
  }

  return value;
};

const confidenceLabelMap = {
  unknown: 'Ainda estou juntando as primeiras pistas.',
  low: 'Ainda nao tenho certeza, mas isso vale olhar.',
  medium: 'Ja tenho uma pista razoavel daqui.',
  high: 'Essa pista esta bem consistente.',
} as const;

const toneByKind = (
  kind: HouseClueKind,
  confidence: HouseClue['confidence']
): CoreSpeechTone => {
  if (kind === 'question') return 'curious';
  if (kind === 'baseline' || kind === 'discovery') return 'exploratory';
  if (confidence === 'low' || confidence === 'unknown') return 'careful';
  return 'steady';
};

const getInvoiceLabel = (currentInvoice?: Partial<InvoiceData> | null) => {
  const rawMonth =
    typeof currentInvoice?.month === 'string' && currentInvoice.month.trim().length > 0
      ? currentInvoice.month.trim()
      : undefined;

  return rawMonth ? rawMonth : 'este ciclo';
};

const buildInvoiceLead = (currentInvoice?: Partial<InvoiceData> | null) => {
  const invoiceLabel = getInvoiceLabel(currentInvoice);

  if (invoiceLabel === 'este ciclo') {
    return 'Li sua conta deste ciclo.';
  }

  return `Li sua conta de ${invoiceLabel}.`;
};

const extractDominantImpactSentence = ({
  clue,
  currentInvoice,
  story,
}: {
  clue: HouseClue;
  currentInvoice?: Partial<InvoiceData> | null;
  story?: EnergyStory | null;
}) => {
  const normalizedSources = normalize(
    [story?.strongestFinding, clue.shortMessage, clue.title].filter(Boolean).join(' ')
  );
  const conservative = clue.confidence === 'low' || clue.confidence === 'unknown';

  const byKeyword = (keyword: string, emphatic: string, careful: string) =>
    normalizedSources.includes(keyword) ? (conservative ? careful : emphatic) : undefined;

  return (
    byKeyword('banho', 'O banho saiu na frente.', 'Por enquanto, o banho e o sinal mais claro.') ||
    byKeyword(
      'refriger',
      'A refrigeracao saiu na frente.',
      'Por enquanto, a refrigeracao e o sinal mais claro.'
    ) ||
    byKeyword(
      'ilumin',
      'A iluminacao saiu na frente.',
      'Por enquanto, a iluminacao e o sinal mais claro.'
    ) ||
    byKeyword(
      'climatiz',
      'A climatizacao saiu na frente.',
      'Por enquanto, a climatizacao e o sinal mais claro.'
    ) ||
    byKeyword('cozinha', 'A cozinha saiu na frente.', 'Por enquanto, a cozinha e o sinal mais claro.') ||
    byKeyword(
      'lavander',
      'A lavanderia saiu na frente.',
      'Por enquanto, a lavanderia e o sinal mais claro.'
    ) ||
    (clue.kind === 'baseline' || clue.kind === 'discovery'
      ? 'Ja encontrei os primeiros sinais.'
      : currentInvoice
        ? 'Ja encontrei o primeiro peso mais claro.'
        : 'Ainda preciso de alguns sinais para separar melhor os pesos.')
  );
};

const buildOpening = (clue: HouseClue, currentInvoice?: Partial<InvoiceData> | null) => {
  if (clue.kind === 'question' || clue.kind === 'hypothesis') {
    return `${buildInvoiceLead(currentInvoice)} Ja encontrei um primeiro sinal.`;
  }

  if (clue.kind === 'room_mystery') {
    return `${buildInvoiceLead(currentInvoice)} ${clue.shortMessage}`;
  }

  if (clue.kind === 'baseline' || clue.kind === 'discovery') {
    return `${buildInvoiceLead(currentInvoice)} Ainda preciso de alguns sinais para separar melhor os pesos.`;
  }

  return `${buildInvoiceLead(currentInvoice)} ${clue.shortMessage}`;
};

const splitNarrative = (value: string) => {
  const normalized = value.trim();
  const separatorMatch = normalized.match(/^(.+?\.)\s+(.+)$/);

  if (!separatorMatch) {
    return {
      opening: normalized,
      remainder: '',
    };
  }

  return {
    opening: separatorMatch[1].trim(),
    remainder: separatorMatch[2].trim(),
  };
};

const shouldUseEnergyStory = (story?: EnergyStory | null) =>
  Boolean(story?.coreNarrative?.trim().length);

const buildStoryOpening = (
  clue: HouseClue,
  currentInvoice?: Partial<InvoiceData> | null,
  story?: EnergyStory | null
) => `${buildInvoiceLead(currentInvoice)} ${extractDominantImpactSentence({
  clue,
  currentInvoice,
  story,
})}`;

const formatCurrency = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? `R$ ${value.toFixed(2)}` : undefined;

const formatInvoiceSignal = (currentInvoice?: Partial<InvoiceData> | null) => {
  if (!currentInvoice) {
    return undefined;
  }

  const month =
    typeof currentInvoice.month === 'string' && currentInvoice.month.trim().length > 0
      ? currentInvoice.month.trim()
      : undefined;
  const consumption =
    typeof currentInvoice.consumption === 'number' && Number.isFinite(currentInvoice.consumption)
      ? `${currentInvoice.consumption} kWh`
      : undefined;
  const totalValue = formatCurrency(currentInvoice.totalValue);

  if (month && consumption && totalValue) {
    return `Na sua conta de ${month}, vi ${consumption} com total de ${totalValue}.`;
  }

  if (month && consumption) {
    return `Na sua conta de ${month}, vi ${consumption}.`;
  }

  if (month && totalValue) {
    return `Na sua conta de ${month}, vi total de ${totalValue}.`;
  }

  if (consumption && totalValue) {
    return `Neste ciclo, vi ${consumption} com total de ${totalValue}.`;
  }

  if (month) {
    return `Na sua conta de ${month}, ja apareceu uma pista concreta.`;
  }

  return undefined;
};

const buildStoryClueLine = (story: EnergyStory, clue: HouseClue) => {
  if (clue.shouldAskQuestion) {
    return 'Agora quero medir melhor esse peso na sua conta.';
  }

  if (story.strongestFinding) {
    return story.strongestFinding;
  }

  if (clue.confidence === 'low' || clue.confidence === 'unknown') {
    return 'Ainda tem uma parte da conta que eu preciso confirmar.';
  }

  if (story.nextInvestigation) {
    return 'Ja encontrei os primeiros sinais. Agora quero deixar essa leitura mais nitida.';
  }

  return 'Ja encontrei o primeiro peso que apareceu com mais clareza nesta conta.';
};

const buildClueLine = (
  clue: HouseClue,
  {
    currentInvoice,
    energyStory,
  }: { currentInvoice?: Partial<InvoiceData> | null; energyStory?: EnergyStory | null }
) => {
  if (shouldUseEnergyStory(energyStory)) {
    return buildStoryClueLine(energyStory, clue);
  }

  const invoiceSignal = formatInvoiceSignal(currentInvoice);

  if (clue.kind === 'question') {
    if (invoiceSignal) {
      return `${invoiceSignal} Agora quero medir melhor esse peso na sua conta.`;
    }

    return 'Agora quero confirmar um detalhe simples da sua conta.';
  }

  if (clue.kind === 'hypothesis') {
    if (invoiceSignal) {
      return `${invoiceSignal} Por enquanto, esse e o sinal mais claro da conta.`;
    }

    return 'Por enquanto, esse e o sinal mais claro da conta.';
  }

  if (clue.kind === 'room_mystery') {
    return clue.shortMessage;
  }

  if (clue.kind === 'baseline') {
    return 'Ainda preciso de alguns sinais para separar melhor os pesos.';
  }

  return 'Ainda tem uma parte da conta que eu preciso confirmar.';
};

const buildOptionalQuestionLine = (clue: HouseClue) => {
  if (!clue.shouldAskQuestion || !clue.question) {
    return undefined;
  }

  return ensureSafeCopy(`Posso te mostrar? ${clue.question.question}`);
};

const buildActionLabel = (clue: HouseClue) => {
  if (clue.kind === 'question') return 'Descobrir';
  if (clue.kind === 'room_mystery') return 'Ver';
  if (clue.kind === 'baseline' || clue.kind === 'discovery') return 'Continuar';
  return 'Ver';
};

const buildEvidenceLabel = (clue: HouseClue) => {
  if (clue.evidenceIds.length > 0) {
    return 'Ver o que ja percebi';
  }

  return 'Ver contexto';
};

const buildConfidenceLabel = (clue: HouseClue) => confidenceLabelMap[clue.confidence];

const buildSteps = (clue: HouseClue): CoreSpeechStep[] | undefined => {
  if (clue.kind === 'question' && clue.question) {
    return [
      {
        id: `step-${clue.id}-1`,
        label: 'Confirmar um detalhe',
        description: clue.question.reason,
      },
    ];
  }

  if (clue.kind === 'room_mystery') {
    return [
      {
        id: `step-${clue.id}-1`,
        label: 'Olhar esse ambiente com mais calma',
        description: clue.explanation,
      },
    ];
  }

  return undefined;
};

export const buildCoreSpeech = (
  clue: HouseClue,
  context: {
    currentInvoice?: Partial<InvoiceData> | null;
    energyStory?: EnergyStory | null;
  } = {}
): CoreSpeech => {
  const storyDriven = shouldUseEnergyStory(context.energyStory);

  const speech: CoreSpeech = {
    id: `core-speech-${clue.id}`,
    source: storyDriven ? 'energy_story' : 'house_clue',
    tone: toneByKind(clue.kind, clue.confidence),
    opening: ensureSafeCopy(
      storyDriven && context.energyStory
        ? buildStoryOpening(clue, context.currentInvoice, context.energyStory)
        : buildOpening(clue, context.currentInvoice)
    ),
    clueLine: ensureSafeCopy(buildClueLine(clue, context)),
    optionalQuestionLine: buildOptionalQuestionLine(clue),
    actionLabel: ensureSafeCopy(buildActionLabel(clue)),
    evidenceLabel: ensureSafeCopy(buildEvidenceLabel(clue)),
    confidenceLabel: ensureSafeCopy(
      storyDriven && context.energyStory
        ? context.energyStory.confidenceNarrative
        : buildConfidenceLabel(clue)
    ),
    steps: buildSteps(clue),
  };

  return speech;
};
