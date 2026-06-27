import { runCuriosityEngine } from '@/lib/cognitive/curiosityEngine';
import type { MemorySnapshot } from '@/lib/memorySnapshot';
import { getEnergyKnowledgeById, getLearnedEnergyKnowledgeItems } from '@/lib/energyKnowledge';
import type {
  ConfidenceLevel,
  EnergyBaseline,
  EnergyHypothesis,
  Evidence,
  HouseIdentity,
  HouseKnowledge,
  HouseMainUsePeriod,
  HouseMemory,
  HouseModel,
  HouseUnderstanding,
  KnowledgeConcept,
  MemoryFact,
  MemoryFactCategory,
  MemoryPattern,
  NextInvestigation,
  RoomModel,
  RoomType,
  SeasonalSensitivity,
} from '@/lib/cognitive/types';
import type {
  Analysis,
  EnergyBehaviorProfile,
  EnergyKnowledgeState,
  InvoiceData,
  Profile,
  UserContextState,
} from '@/types/mvp';

export interface BuildHouseModelFromJourneyInput {
  userId: string;
  createdAt?: string;
  updatedAt?: string;
  profile?: Partial<Profile>;
  currentInvoice?: Partial<InvoiceData> | null;
  invoiceHistory?: Array<Partial<InvoiceData> | null | undefined> | null;
  analysisSummary?: Partial<Analysis> | null;
  memorySnapshot?: Partial<MemorySnapshot> | null;
  strategicAnswers?: Partial<UserContextState['questions']> | null;
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile> | null;
  knowledgeState?: Partial<EnergyKnowledgeState> | null;
  score?: {
    value?: number;
    level?: number;
    stageLabel?: string;
  };
}

type RoomDraft = {
  id: string;
  type: RoomType;
  label: string;
};

type NormalizedInvoice = Pick<
  InvoiceData,
  'fingerprint' | 'month' | 'consumption' | 'totalValue' | 'uploadedAt' | 'parser'
>;

const ROOM_DRAFTS: RoomDraft[] = [
  { id: 'room-bathroom', type: 'bathroom', label: 'Banheiro' },
  { id: 'room-kitchen', type: 'kitchen', label: 'Cozinha' },
  { id: 'room-laundry', type: 'laundry', label: 'Lavanderia' },
  { id: 'room-bedroom', type: 'bedroom', label: 'Quarto' },
  { id: 'room-living-room', type: 'living_room', label: 'Sala' },
  { id: 'room-comfort', type: 'comfort', label: 'Conforto termico' },
  { id: 'room-garage', type: 'garage', label: 'Garagem' },
];

const EMPTY_TIMESTAMP = '1970-01-01T00:00:00.000Z';

const sanitizeId = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

const unique = <T>(values: T[]) => Array.from(new Set(values));

const clampPercent = (value: number) => Math.min(Math.max(Math.round(value), 0), 100);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const normalizeInvoice = (invoice?: Partial<InvoiceData> | null): NormalizedInvoice | null => {
  if (!invoice?.fingerprint || !isNonEmptyString(invoice.month) || !invoice.parser?.fields) {
    return null;
  }

  return {
    fingerprint: invoice.fingerprint,
    month: invoice.month,
    consumption: isFiniteNumber(invoice.consumption) ? invoice.consumption : undefined,
    totalValue: isFiniteNumber(invoice.totalValue) ? invoice.totalValue : undefined,
    uploadedAt: isNonEmptyString(invoice.uploadedAt) ? invoice.uploadedAt : undefined,
    parser: invoice.parser,
  };
};

const normalizeInvoices = (
  currentInvoice?: Partial<InvoiceData> | null,
  invoiceHistory?: Array<Partial<InvoiceData> | null | undefined> | null
) => {
  const invoices = [normalizeInvoice(currentInvoice), ...(invoiceHistory ?? []).map(normalizeInvoice)]
    .filter((invoice): invoice is NormalizedInvoice => Boolean(invoice));
  const seen = new Set<string>();

  return invoices.filter((invoice) => {
    if (seen.has(invoice.fingerprint)) {
      return false;
    }

    seen.add(invoice.fingerprint);
    return true;
  });
};

const resolveTimestamp = (input: BuildHouseModelFromJourneyInput, invoices: NormalizedInvoice[]) => {
  const candidates = [
    input.updatedAt,
    input.createdAt,
    input.energyBehaviorProfile?.updatedAt,
    ...invoices.map((invoice) => invoice.uploadedAt),
    input.strategicAnswers?.usage_period?.updatedAt,
    input.strategicAnswers?.electric_shower?.updatedAt,
    input.strategicAnswers?.primary_goal?.updatedAt,
  ].filter(isNonEmptyString);

  return candidates[0] ?? EMPTY_TIMESTAMP;
};

const mapUsagePeriod = (
  strategicAnswers?: Partial<UserContextState['questions']> | null,
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile> | null
): HouseMainUsePeriod | undefined => {
  const direct = strategicAnswers?.usage_period;
  if (direct?.status === 'answered') {
    if (direct.value === 'morning' || direct.value === 'afternoon' || direct.value === 'night') {
      return direct.value;
    }

    if (direct.value === 'unknown') {
      return 'unknown';
    }
  }

  const routine = energyBehaviorProfile?.habits?.dominantUsageRoutine;
  if (routine === 'manha') return 'morning';
  if (routine === 'tarde') return 'afternoon';
  if (routine === 'noite') return 'night';
  if (routine === 'misto') return 'mixed';

  const period = energyBehaviorProfile?.habits?.dominantUsagePeriod;
  if (period === 'misto') return 'mixed';

  return undefined;
};

const mapSeasonalSensitivity = (
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile> | null
): SeasonalSensitivity => {
  const thermal = energyBehaviorProfile?.habits?.thermalSensitivity;
  const climateUsage = energyBehaviorProfile?.habits?.climateUsageIntensity;

  if (thermal === 'sim' || climateUsage === 'sim') return 'high';
  if (thermal === 'nao_sei' || climateUsage === 'sazonal') return 'medium';
  if (thermal === 'nao') return 'low';

  return 'unknown';
};

const mapResidenceType = (
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile> | null
): HouseIdentity['residenceType'] => {
  const residenceType = energyBehaviorProfile?.habits?.residenceType;

  if (residenceType === 'casa' || residenceType === 'apartamento' || residenceType === 'sobrado') {
    return residenceType;
  }

  return 'unknown';
};

const toConfidence = (
  count: number,
  thresholds: { low: number; medium: number; high: number }
): ConfidenceLevel => {
  if (count >= thresholds.high) return 'high';
  if (count >= thresholds.medium) return 'medium';
  if (count >= thresholds.low) return 'low';
  return 'unknown';
};

const roomConfidence = (count: number): ConfidenceLevel =>
  count === 0 ? 'unknown' : toConfidence(count, { low: 1, medium: 2, high: 4 });

const understandingConfidence = (count: number): ConfidenceLevel =>
  count === 0 ? 'low' : toConfidence(count, { low: 1, medium: 4, high: 8 });

const inferFactCategory = (statement: string): MemoryFactCategory => {
  const normalized = statement.toLowerCase();

  if (normalized.includes('pessoa') || normalized.includes('morador')) return 'occupants';
  if (normalized.includes('tarifa') || normalized.includes('custo')) return 'tariff';
  if (
    normalized.includes('inverno') ||
    normalized.includes('verao') ||
    normalized.includes('estacao') ||
    normalized.includes('sazon')
  ) {
    return 'seasonality';
  }

  if (
    normalized.includes('banho') ||
    normalized.includes('chuveiro') ||
    normalized.includes('cozinha') ||
    normalized.includes('lavanderia') ||
    normalized.includes('quarto') ||
    normalized.includes('sala')
  ) {
    return 'room';
  }

  if (
    normalized.includes('ar-condicionado') ||
    normalized.includes('geladeira') ||
    normalized.includes('equipamento')
  ) {
    return 'device';
  }

  if (
    normalized.includes('rotina') ||
    normalized.includes('periodo') ||
    normalized.includes('manha') ||
    normalized.includes('tarde') ||
    normalized.includes('noite')
  ) {
    return 'routine';
  }

  return 'behavior';
};

const roomIdByType = (roomType: RoomType) =>
  ROOM_DRAFTS.find((room) => room.type === roomType)?.id ?? undefined;

const buildEvidence = (
  input: BuildHouseModelFromJourneyInput,
  invoices: NormalizedInvoice[],
  now: string
) => {
  const evidence: Evidence[] = [];
  const pushEvidence = (item: Evidence) => {
    if (!evidence.some((entry) => entry.id === item.id)) {
      evidence.push(item);
    }
  };

  const currentInvoice = invoices[0];
  if (currentInvoice) {
    pushEvidence({
      id: 'evidence-invoice-current',
      source: 'invoice',
      description: `Fatura ${currentInvoice.month} carregada${
        isFiniteNumber(currentInvoice.consumption) ? ` com ${currentInvoice.consumption} kWh` : ''
      }${isFiniteNumber(currentInvoice.totalValue) ? ` e total de R$ ${currentInvoice.totalValue}` : ''}.`,
      confidence: 'medium',
      createdAt: currentInvoice.uploadedAt ?? now,
    });
  }

  if (invoices.length > 1) {
    pushEvidence({
      id: 'evidence-history-invoices',
      source: 'history',
      description: `Historico com ${invoices.length} faturas registradas para comparacao inicial.`,
      confidence: invoices.length >= 3 ? 'medium' : 'low',
      createdAt: invoices[0]?.uploadedAt ?? now,
    });
  }

  const usagePeriodAnswer = input.strategicAnswers?.usage_period;
  if (usagePeriodAnswer?.status === 'answered' && isNonEmptyString(usagePeriodAnswer.label)) {
    pushEvidence({
      id: 'evidence-answer-usage-period',
      source: 'user_answer',
      description: `Usuario informou periodo de uso predominante: ${usagePeriodAnswer.label}.`,
      confidence: 'medium',
      createdAt: usagePeriodAnswer.updatedAt,
      relatedRoomId: roomIdByType('living_room'),
    });
  }

  const electricShowerAnswer = input.strategicAnswers?.electric_shower;
  if (electricShowerAnswer?.status === 'answered' && isNonEmptyString(electricShowerAnswer.label)) {
    pushEvidence({
      id: 'evidence-answer-electric-shower',
      source: 'user_answer',
      description: `Usuario informou frequencia de uso de chuveiro eletrico: ${electricShowerAnswer.label}.`,
      confidence: 'medium',
      createdAt: electricShowerAnswer.updatedAt,
      relatedRoomId: roomIdByType('bathroom'),
    });
  }

  const primaryGoalAnswer = input.strategicAnswers?.primary_goal;
  if (primaryGoalAnswer?.status === 'answered' && isNonEmptyString(primaryGoalAnswer.label)) {
    pushEvidence({
      id: 'evidence-answer-primary-goal',
      source: 'user_answer',
      description: `Usuario informou objetivo principal atual: ${primaryGoalAnswer.label}.`,
      confidence: 'medium',
      createdAt: primaryGoalAnswer.updatedAt,
    });
  }

  const showers = input.energyBehaviorProfile?.appliances?.showers;
  if (isFiniteNumber(showers) && showers > 0) {
    pushEvidence({
      id: 'evidence-answer-showers-count',
      source: 'user_answer',
      description: `Perfil energetico registra ${showers} chuveiro(s) associado(s) a residencia.`,
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('bathroom'),
    });
  }

  if (input.energyBehaviorProfile?.appliances?.hasElectricShower === true) {
    pushEvidence({
      id: 'evidence-answer-has-electric-shower',
      source: 'user_answer',
      description: 'Perfil energetico confirma presenca de chuveiro eletrico.',
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('bathroom'),
    });
  }

  if (input.energyBehaviorProfile?.appliances?.hasAirConditioning === true) {
    pushEvidence({
      id: 'evidence-answer-air-conditioning',
      source: 'user_answer',
      description: 'Perfil energetico confirma uso de ar-condicionado.',
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('comfort'),
    });
  }

  if (input.energyBehaviorProfile?.appliances?.hasExtraFridge === true) {
    pushEvidence({
      id: 'evidence-answer-extra-fridge',
      source: 'user_answer',
      description: 'Perfil energetico indica geladeira extra em operacao.',
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('kitchen'),
    });
  }

  if (isNonEmptyString(input.energyBehaviorProfile?.habits?.residenceType)) {
    pushEvidence({
      id: 'evidence-answer-residence-type',
      source: 'user_answer',
      description: `Perfil energetico registra residencia do tipo ${input.energyBehaviorProfile.habits.residenceType}.`,
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('living_room'),
    });
  }

  if (isNonEmptyString(input.energyBehaviorProfile?.habits?.roomCountRange)) {
    pushEvidence({
      id: 'evidence-answer-room-count',
      source: 'user_answer',
      description: `Perfil energetico registra faixa de comodos principais: ${input.energyBehaviorProfile.habits.roomCountRange}.`,
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('living_room'),
    });
  }

  if (input.energyBehaviorProfile?.habits?.hasChildren === true) {
    pushEvidence({
      id: 'evidence-answer-children',
      source: 'user_answer',
      description: 'Perfil energetico registra presenca de criancas na residencia.',
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('living_room'),
    });
  }

  if (input.energyBehaviorProfile?.habits?.hasElderly === true) {
    pushEvidence({
      id: 'evidence-answer-elderly',
      source: 'user_answer',
      description: 'Perfil energetico registra presenca de idosos na residencia.',
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('living_room'),
    });
  }

  if (isFiniteNumber(input.energyBehaviorProfile?.appliances?.bathrooms)) {
    pushEvidence({
      id: 'evidence-answer-bathrooms-count',
      source: 'user_answer',
      description: `Perfil energetico registra ${input.energyBehaviorProfile.appliances.bathrooms} banheiro(s) na residencia.`,
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('bathroom'),
    });
  }

  if (isNonEmptyString(input.energyBehaviorProfile?.appliances?.showerHeatingType)) {
    pushEvidence({
      id: 'evidence-answer-shower-heating',
      source: 'user_answer',
      description: `Perfil energetico registra aquecimento de banho: ${input.energyBehaviorProfile.appliances.showerHeatingType}.`,
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('bathroom'),
    });
  }

  if (
    isFiniteNumber(input.energyBehaviorProfile?.appliances?.airConditioningCount) &&
    input.energyBehaviorProfile.appliances.airConditioningCount > 0
  ) {
    pushEvidence({
      id: 'evidence-answer-air-conditioning-count',
      source: 'user_answer',
      description: `Perfil energetico registra aproximadamente ${input.energyBehaviorProfile.appliances.airConditioningCount} aparelho(s) de ar-condicionado.`,
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('comfort'),
    });
  }

  if (isNonEmptyString(input.energyBehaviorProfile?.appliances?.cookingType)) {
    pushEvidence({
      id: 'evidence-answer-cooking-type',
      source: 'user_answer',
      description: `Perfil energetico registra cozinha com uso principal ${input.energyBehaviorProfile.appliances.cookingType}.`,
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('kitchen'),
    });
  }

  if (input.energyBehaviorProfile?.appliances?.hasElectricOven === true) {
    pushEvidence({
      id: 'evidence-answer-electric-oven',
      source: 'user_answer',
      description: 'Perfil energetico indica forno eletrico na cozinha.',
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('kitchen'),
    });
  }

  if (input.energyBehaviorProfile?.appliances?.hasWashingMachine === true) {
    pushEvidence({
      id: 'evidence-answer-washing-machine',
      source: 'user_answer',
      description: 'Perfil energetico indica maquina de lavar na lavanderia.',
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('laundry'),
    });
  }

  if (input.energyBehaviorProfile?.appliances?.hasDryer === true) {
    pushEvidence({
      id: 'evidence-answer-dryer',
      source: 'user_answer',
      description: 'Perfil energetico indica secadora na lavanderia.',
      confidence: 'medium',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('laundry'),
    });
  }

  if (input.energyBehaviorProfile?.habits?.usesHeavyLoadsAtNight === true) {
    pushEvidence({
      id: 'evidence-answer-heavy-loads-night',
      source: 'user_answer',
      description: 'Perfil energetico indica cargas pesadas durante a noite.',
      confidence: 'low',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('laundry'),
    });
  }

  if (input.energyBehaviorProfile?.habits?.laundryFrequency && input.energyBehaviorProfile.habits.laundryFrequency !== 'nao_informado') {
    pushEvidence({
      id: 'evidence-answer-laundry-frequency',
      source: 'user_answer',
      description: `Perfil energetico registra frequencia de lavanderia: ${input.energyBehaviorProfile.habits.laundryFrequency}.`,
      confidence: 'low',
      createdAt: input.energyBehaviorProfile?.updatedAt ?? now,
      relatedRoomId: roomIdByType('laundry'),
    });
  }

  if (
    isNonEmptyString(input.analysisSummary?.headline)
  ) {
    pushEvidence({
      id: 'evidence-analysis-headline',
      source: 'derived_analysis',
      description: `Analise derivada do ciclo: ${input.analysisSummary.headline}.`,
      confidence: 'low',
      createdAt: now,
    });
  }

  input.analysisSummary?.evidenceItems?.slice(0, 2).forEach((item, index) => {
    if (!isNonEmptyString(item.label) || !isNonEmptyString(item.value)) {
      return;
    }

    pushEvidence({
      id: `evidence-analysis-item-${index + 1}`,
      source: 'derived_analysis',
      description: `${item.label}: ${item.value}.`,
      confidence: 'low',
      createdAt: now,
    });
  });

  input.analysisSummary?.behaviorHighlights?.slice(0, 2).forEach((item, index) => {
    if (!isNonEmptyString(item)) {
      return;
    }

    pushEvidence({
      id: `evidence-analysis-behavior-${index + 1}`,
      source: 'derived_analysis',
      description: item,
      confidence: 'low',
      createdAt: now,
    });
  });

  return evidence;
};

const buildIdentity = (
  input: BuildHouseModelFromJourneyInput
): HouseIdentity => {
  const mainUsePeriod = mapUsagePeriod(input.strategicAnswers, input.energyBehaviorProfile);
  const occupantsCount = isFiniteNumber(input.profile?.peopleCount) && input.profile.peopleCount > 0
    ? input.profile.peopleCount
    : undefined;

  return {
    residenceType: mapResidenceType(input.energyBehaviorProfile),
    occupants: {
      count: occupantsCount,
      confidence: occupantsCount ? 'medium' : 'unknown',
    },
    routineProfile: {
      mainUsePeriod,
      confidence: mainUsePeriod && mainUsePeriod !== 'unknown' ? 'medium' : 'unknown',
    },
    climateContext: isNonEmptyString(input.profile?.location) || input.energyBehaviorProfile
      ? {
          city: isNonEmptyString(input.profile?.location) ? input.profile.location : undefined,
          seasonalSensitivity: mapSeasonalSensitivity(input.energyBehaviorProfile),
        }
      : undefined,
  };
};

const buildRooms = (
  input: BuildHouseModelFromJourneyInput,
  evidence: Evidence[],
  now: string
): RoomModel[] =>
  ROOM_DRAFTS.map((draft) => {
    const roomEvidence = evidence.filter((item) => item.relatedRoomId === draft.id);
    const roomKeywords = roomEvidence.map((item) => item.description.toLowerCase()).join(' ');
    const devices =
      draft.type === 'bathroom' && input.energyBehaviorProfile?.appliances?.hasElectricShower === true
        ? [
            {
              id: 'device-electric-shower',
              label: 'Chuveiro eletrico',
              roomId: draft.id,
              confidence: 'medium' as ConfidenceLevel,
              sourceEvidenceIds: roomEvidence.map((item) => item.id),
              createdAt: now,
            },
          ]
        : draft.type === 'kitchen' && input.energyBehaviorProfile?.appliances?.hasElectricOven === true
          ? [
              {
                id: 'device-electric-oven',
                label: 'Forno eletrico',
                roomId: draft.id,
                confidence: 'medium' as ConfidenceLevel,
                sourceEvidenceIds: roomEvidence.map((item) => item.id),
                createdAt: now,
              },
            ]
        : draft.type === 'comfort' && input.energyBehaviorProfile?.appliances?.hasAirConditioning === true
          ? [
              {
                id: 'device-air-conditioning',
                label: 'Ar-condicionado',
                roomId: draft.id,
                confidence: 'medium' as ConfidenceLevel,
                sourceEvidenceIds: roomEvidence.map((item) => item.id),
                createdAt: now,
              },
            ]
          : draft.type === 'laundry' && input.energyBehaviorProfile?.appliances?.hasWashingMachine === true
            ? [
                {
                  id: 'device-washing-machine',
                  label: 'Maquina de lavar',
                  roomId: draft.id,
                  confidence: 'medium' as ConfidenceLevel,
                  sourceEvidenceIds: roomEvidence.map((item) => item.id),
                  createdAt: now,
                },
                ...(input.energyBehaviorProfile?.appliances?.hasDryer === true
                  ? [
                      {
                        id: 'device-dryer',
                        label: 'Secadora',
                        roomId: draft.id,
                        confidence: 'medium' as ConfidenceLevel,
                        sourceEvidenceIds: roomEvidence.map((item) => item.id),
                        createdAt: now,
                      },
                    ]
                  : []),
              ]
          : draft.type === 'kitchen' && input.energyBehaviorProfile?.appliances?.hasExtraFridge === true
            ? [
                {
                  id: 'device-extra-fridge',
                  label: 'Geladeira extra',
                  roomId: draft.id,
                  confidence: 'medium' as ConfidenceLevel,
                  sourceEvidenceIds: roomEvidence.map((item) => item.id),
                  createdAt: now,
                },
              ]
            : [];
    const behaviors =
      draft.type === 'living_room' && mapUsagePeriod(input.strategicAnswers, input.energyBehaviorProfile)
        ? [
            {
              id: 'behavior-main-use-period',
              label: 'Periodo principal de uso',
              roomId: draft.id,
              routineWindow: mapUsagePeriod(input.strategicAnswers, input.energyBehaviorProfile),
              confidence: 'medium' as ConfidenceLevel,
              sourceEvidenceIds: roomEvidence.map((item) => item.id),
              createdAt: now,
            },
          ]
        : draft.type === 'laundry' &&
            input.energyBehaviorProfile?.habits?.laundryFrequency &&
            input.energyBehaviorProfile.habits.laundryFrequency !== 'nao_informado'
          ? [
              {
                id: 'behavior-laundry-frequency',
                label: `Frequencia de lavanderia: ${input.energyBehaviorProfile.habits.laundryFrequency}`,
                roomId: draft.id,
                confidence: 'low' as ConfidenceLevel,
                sourceEvidenceIds: roomEvidence.map((item) => item.id),
                createdAt: now,
              },
            ]
          : [];

    return {
      id: draft.id,
      type: draft.type,
      label: draft.label,
      understandingLevel: clampPercent(roomEvidence.length * 18),
      confidence: roomConfidence(roomEvidence.length),
      knownDevices: devices,
      knownBehaviors: behaviors,
      mainHypothesis:
        draft.type === 'bathroom' && roomKeywords.includes('chuveiro')
          ? 'Peso do banho no consumo ainda precisa ser calibrado.'
          : draft.type === 'comfort' && roomKeywords.includes('ar-condicionado')
            ? 'Climatizacao pode explicar parte relevante do consumo.'
            : undefined,
      mainMystery:
        roomEvidence.length === 0
          ? `Ainda faltam evidencias confiaveis sobre ${draft.label.toLowerCase()}.`
          : undefined,
      evidence: roomEvidence,
    };
  });

const buildHypotheses = (
  input: BuildHouseModelFromJourneyInput,
  evidence: Evidence[]
) => {
  const activeHypotheses: EnergyHypothesis[] = [];

  const bathroomEvidence = evidence.filter((item) => item.relatedRoomId === roomIdByType('bathroom'));
  if (bathroomEvidence.length > 0) {
    activeHypotheses.push({
      id: 'hypothesis-bathroom-shower',
      title: 'Impacto do banho no consumo',
      description:
        'Ha sinais de que o uso de chuveiro eletrico influencia o consumo, mas a participacao exata ainda nao foi confirmada.',
      status: bathroomEvidence.length >= 2 ? 'strengthened' : 'investigating',
      relatedRooms: [roomIdByType('bathroom') ?? 'room-bathroom'],
      evidenceIds: bathroomEvidence.map((item) => item.id),
      confidence: bathroomEvidence.length >= 2 ? 'medium' : 'low',
      potentialImpact: input.energyBehaviorProfile?.appliances?.hasElectricShower === true ? 'high' : 'medium',
      nextQuestion:
        input.energyBehaviorProfile?.appliances?.hasElectricShower === true
          ? undefined
          : {
              id: 'next-question-bathroom',
              question: 'Existe chuveiro eletrico nesta residencia?',
              reason: 'Confirmar essa presenca ajuda a calibrar melhor o peso do banho no ciclo.',
              expectedGain: 'high',
              relatedRoomId: roomIdByType('bathroom'),
              relatedHypothesisId: 'hypothesis-bathroom-shower',
              answerType: 'yes_no',
              options: ['Sim', 'Nao', 'Nao sei'],
              shouldAskNow: true,
            },
    });
  }

  const comfortEvidence = evidence.filter((item) => item.relatedRoomId === roomIdByType('comfort'));
  if (
    comfortEvidence.length > 0 ||
    input.energyBehaviorProfile?.intentions?.thermalComfortInterest === 'sim'
  ) {
    activeHypotheses.push({
      id: 'hypothesis-comfort-climatization',
      title: 'Peso da climatizacao',
      description:
        'Ha sinais de climatizacao ou sensibilidade termica, mas a relevancia desse fator ainda e conservadora.',
      status: comfortEvidence.length >= 2 ? 'strengthened' : 'investigating',
      relatedRooms: [roomIdByType('comfort') ?? 'room-comfort'],
      evidenceIds: comfortEvidence.map((item) => item.id),
      confidence: comfortEvidence.length >= 2 ? 'medium' : 'low',
      potentialImpact: input.energyBehaviorProfile?.appliances?.hasAirConditioning === true ? 'high' : 'medium',
      nextQuestion:
        input.energyBehaviorProfile?.appliances?.hasAirConditioning === true
          ? undefined
          : {
              id: 'next-question-comfort',
              question: 'Ha ar-condicionado em uso frequente nesta residencia?',
              reason: 'Isso ajuda a estimar melhor o peso da climatizacao no consumo.',
              expectedGain: 'medium',
              relatedRoomId: roomIdByType('comfort'),
              relatedHypothesisId: 'hypothesis-comfort-climatization',
              answerType: 'yes_no',
              options: ['Sim', 'Nao', 'Nao sei'],
              shouldAskNow: true,
            },
    });
  }

  const routineEvidence = evidence.filter(
    (item) =>
      item.id === 'evidence-answer-usage-period' ||
      item.id === 'evidence-answer-heavy-loads-night' ||
      item.id === 'evidence-answer-laundry-frequency'
  );
  if (routineEvidence.length > 0) {
    activeHypotheses.push({
      id: 'hypothesis-routine-usage',
      title: 'Rotina de consumo concentrado',
      description:
        'A distribuicao do uso ao longo do dia pode explicar parte do custo, mas ainda precisa de mais contexto.',
      status: routineEvidence.length >= 2 ? 'strengthened' : 'investigating',
      relatedRooms: [roomIdByType('living_room') ?? 'room-living-room'],
      evidenceIds: routineEvidence.map((item) => item.id),
      confidence: routineEvidence.length >= 2 ? 'medium' : 'low',
      potentialImpact: 'medium',
      nextQuestion:
        input.strategicAnswers?.usage_period?.status === 'answered'
          ? undefined
          : {
              id: 'next-question-routine',
              question: 'Seu consumo costuma ser maior de manha, tarde ou noite?',
              reason: 'Essa resposta ajuda a reduzir incerteza sem criar fadiga.',
              expectedGain: 'medium',
              relatedRoomId: roomIdByType('living_room'),
              relatedHypothesisId: 'hypothesis-routine-usage',
              answerType: 'single_choice',
              options: ['Manha', 'Tarde', 'Noite', 'Nao sei'],
              shouldAskNow: true,
            },
    });
  }

  const tariffEvidence = evidence.filter(
    (item) => item.id === 'evidence-invoice-current' || item.id.startsWith('evidence-analysis-item-')
  );
  if (tariffEvidence.length > 0) {
    activeHypotheses.push({
      id: 'hypothesis-tariff-cost',
      title: 'Pressao de custo medio',
      description:
        'A fatura sugere que custo medio por kWh ou concentracao de uso pode merecer investigacao adicional.',
      status: tariffEvidence.length >= 3 ? 'strengthened' : 'investigating',
      relatedRooms: [],
      evidenceIds: tariffEvidence.map((item) => item.id),
      confidence: tariffEvidence.length >= 3 ? 'medium' : 'low',
      potentialImpact: 'medium',
    });
  }

  const seasonalityEvidence = evidence.filter(
    (item) => item.id === 'evidence-history-invoices' || item.description.toLowerCase().includes('estacao')
  );
  if (seasonalityEvidence.length > 0) {
    activeHypotheses.push({
      id: 'hypothesis-seasonality',
      title: 'Influencias sazonais do ciclo',
      description:
        'O historico ja permite observar variacao temporal, mas ainda nao ha base suficiente para conclusao forte.',
      status: seasonalityEvidence.length >= 2 ? 'strengthened' : 'investigating',
      relatedRooms: [],
      evidenceIds: seasonalityEvidence.map((item) => item.id),
      confidence: seasonalityEvidence.length >= 2 ? 'medium' : 'low',
      potentialImpact: 'medium',
    });
  }

  return {
    activeHypotheses,
    discardedHypotheses: [] as EnergyHypothesis[],
    confirmedHypotheses: [] as EnergyHypothesis[],
  };
};

const buildMemory = (
  snapshot: Partial<MemorySnapshot> | null | undefined,
  evidence: Evidence[],
  now: string
): HouseMemory => {
  const invoiceEvidenceIds = evidence.filter((item) => item.source === 'invoice').map((item) => item.id);
  const userAnswerEvidenceIds = evidence
    .filter((item) => item.source === 'user_answer')
    .map((item) => item.id);
  const derivedEvidenceIds = evidence
    .filter((item) => item.source === 'derived_analysis' || item.source === 'history')
    .map((item) => item.id);
  const facts: MemoryFact[] = [];
  const patterns: MemoryPattern[] = [];
  const factStatements = unique([
    ...(snapshot?.memoryProfile?.items ?? []).map((item) => `${item.label}: ${item.value}`),
    ...(snapshot?.memoryInsights?.facts ?? []),
    ...(snapshot?.memoryInsights?.confirmedContext ?? []),
  ]).filter(isNonEmptyString);
  const patternStatements = unique([
    ...(snapshot?.memoryProfile?.confirmedSignals ?? []),
    ...(snapshot?.memoryInsights?.observedBehavior ?? []),
  ]).filter(isNonEmptyString);

  factStatements.forEach((statement, index) => {
    facts.push({
      id: `memory-fact-${index + 1}`,
      statement,
      category: inferFactCategory(statement),
      confidence: 'medium',
      sourceEvidenceIds:
        inferFactCategory(statement) === 'behavior'
          ? derivedEvidenceIds
          : inferFactCategory(statement) === 'routine'
            ? userAnswerEvidenceIds
            : invoiceEvidenceIds.length > 0
              ? invoiceEvidenceIds
              : userAnswerEvidenceIds,
      createdAt: now,
      lastConfirmedAt: now,
    });
  });

  patternStatements.forEach((statement, index) => {
    patterns.push({
      id: `memory-pattern-${index + 1}`,
      label: statement,
      description: statement,
      confidence: 'medium',
      sourceEvidenceIds: userAnswerEvidenceIds.length > 0 ? userAnswerEvidenceIds : derivedEvidenceIds,
      createdAt: now,
      lastConfirmedAt: now,
    });
  });

  return {
    facts,
    stablePatterns: patterns,
    lastUpdatedAt: now,
  };
};

const mapKnowledgeRoom = (knowledgeId: string): string | undefined => {
  if (knowledgeId === 'shower_efficiency') return roomIdByType('bathroom');
  if (knowledgeId === 'thermal_comfort' || knowledgeId === 'efficient_cooling') {
    return roomIdByType('comfort');
  }
  if (knowledgeId === 'standby_consumption' || knowledgeId === 'peak_usage_habits') {
    return roomIdByType('living_room');
  }
  return undefined;
};

const buildKnowledge = (
  knowledgeState: Partial<EnergyKnowledgeState> | null | undefined,
  snapshot: Partial<MemorySnapshot> | null | undefined,
  now: string
): HouseKnowledge => {
  const learnedConcepts: KnowledgeConcept[] = [];
  const explicitItems = knowledgeState
    ? getLearnedEnergyKnowledgeItems({
        learned: knowledgeState.learned ?? {},
        lastLearnedId: knowledgeState.lastLearnedId,
      })
    : [];
  const fallbackItems =
    explicitItems.length > 0
      ? []
      : (snapshot?.memoryKnowledge?.items ?? []).filter((item) => item.learned);
  const catalogItems = explicitItems.length > 0 ? explicitItems : fallbackItems;

  catalogItems.forEach((item) => {
    const catalog = 'message' in item ? item : getEnergyKnowledgeById(item.id);
    if (!catalog) {
      return;
    }

    learnedConcepts.push({
      id: `knowledge-${catalog.id}`,
      title: catalog.title,
      explanation: catalog.message,
      status: 'understood',
      relatedRoomId: mapKnowledgeRoom(catalog.id),
      firstIntroducedAt: now,
      lastReinforcedAt: now,
    });
  });

  return { learnedConcepts };
};

const buildBaseline = (invoices: NormalizedInvoice[]): EnergyBaseline => {
  if (invoices.length === 0) {
    return {
      status: 'not_started',
      monthsUsed: 0,
    };
  }

  const numericConsumptions = invoices
    .map((invoice) => invoice.consumption)
    .filter(isFiniteNumber);
  const numericValues = invoices.map((invoice) => invoice.totalValue).filter(isFiniteNumber);
  const costPerKwh = invoices
    .filter(
      (invoice) => isFiniteNumber(invoice.totalValue) && isFiniteNumber(invoice.consumption) && invoice.consumption > 0
    )
    .map((invoice) => invoice.totalValue! / invoice.consumption!);

  const average = (values: number[]) =>
    values.length > 0 ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : undefined;

  return {
    status: invoices.length >= 3 ? 'established' : 'building',
    monthsUsed: invoices.length,
    averageConsumptionKwh: average(numericConsumptions),
    averageBillValue: average(numericValues),
    averageCostPerKwh: average(costPerKwh),
  };
};

const buildUnderstanding = (
  input: BuildHouseModelFromJourneyInput,
  invoices: NormalizedInvoice[],
  evidence: Evidence[],
  memory: HouseMemory,
  knowledge: HouseKnowledge,
  hypotheses: EnergyHypothesis[]
): HouseUnderstanding => {
  const knownAreas = unique([
    invoices.length > 0 ? 'fatura atual' : '',
    invoices.length > 1 ? 'historico de consumo' : '',
    input.energyBehaviorProfile?.habits?.residenceType ? 'estrutura da residencia' : '',
    input.energyBehaviorProfile?.habits?.hasChildren === true ||
    input.energyBehaviorProfile?.habits?.hasElderly === true
      ? 'ocupacao'
      : '',
    input.energyBehaviorProfile?.appliances?.hasElectricShower === true ||
    isNonEmptyString(input.energyBehaviorProfile?.appliances?.showerHeatingType) ||
    input.strategicAnswers?.electric_shower?.status === 'answered'
      ? 'banho'
      : '',
    input.energyBehaviorProfile?.appliances?.hasAirConditioning === true ? 'climatizacao' : '',
    input.energyBehaviorProfile?.appliances?.cookingType ? 'cozinha' : '',
    input.energyBehaviorProfile?.appliances?.hasWashingMachine === true ? 'lavanderia' : '',
    input.strategicAnswers?.usage_period?.status === 'answered' ? 'rotina' : '',
    knowledge.learnedConcepts.length > 0 ? 'conhecimento energetico' : '',
  ].filter(isNonEmptyString));

  const unknownAreas = unique([
    !input.energyBehaviorProfile?.habits?.residenceType ? 'tipo de residencia' : '',
    !input.energyBehaviorProfile?.habits?.roomCountRange ? 'porte da casa' : '',
    input.energyBehaviorProfile?.appliances?.hasElectricShower !== true &&
    !isNonEmptyString(input.energyBehaviorProfile?.appliances?.showerHeatingType) &&
    input.strategicAnswers?.electric_shower?.status !== 'answered'
      ? 'como o banho funciona'
      : '',
    input.energyBehaviorProfile?.appliances?.hasAirConditioning !== true &&
    input.energyBehaviorProfile?.intentions?.thermalComfortInterest !== 'sim'
      ? 'peso da climatizacao'
      : '',
    !input.energyBehaviorProfile?.appliances?.cookingType ? 'como a cozinha funciona' : '',
    input.energyBehaviorProfile?.appliances?.hasWashingMachine !== true ? 'rotina de lavanderia' : '',
    input.strategicAnswers?.usage_period?.status !== 'answered' ? 'rotina de maior uso' : '',
    invoices.length < 2 ? 'sazonalidade' : '',
    isNonEmptyString(input.analysisSummary?.whatMattersNext) ? input.analysisSummary?.whatMattersNext ?? '' : '',
    ...(input.memorySnapshot?.memoryGaps?.items ?? []),
  ].filter(isNonEmptyString));

  const evidenceStrength =
    evidence.length +
    memory.facts.length +
    memory.stablePatterns.length +
    knowledge.learnedConcepts.length +
    hypotheses.length;

  const overallLevel = clampPercent(
    (invoices.length > 0 ? 18 : 0) +
      Math.min(16, evidence.length * 4) +
      Math.min(12, memory.facts.length * 3) +
      Math.min(8, knowledge.learnedConcepts.length * 2) +
      (invoices.length > 1 ? 8 : 0)
  );

  const explainedBillShare = clampPercent(
    invoices.length === 0
      ? 0
      : 10 +
          Math.min(12, hypotheses.length * 4) +
          Math.min(10, evidence.filter((item) => item.source === 'user_answer').length * 3) +
          (invoices.length > 1 ? 8 : 0)
  );

  return {
    overallLevel,
    explainedBillShare,
    confidence: understandingConfidence(evidenceStrength),
    knownAreas,
    unknownAreas,
    mainKnownPattern:
      input.memorySnapshot?.memoryInsights?.observedBehavior?.[0] ??
      input.analysisSummary?.behaviorHighlights?.[0] ??
      memory.stablePatterns[0]?.label,
    mainMystery:
      input.memorySnapshot?.memoryGaps?.items?.[0] ??
      input.analysisSummary?.whatMattersNext ??
      (invoices.length === 0
        ? 'Ainda nao existe fatura suficiente para localizar o principal fator de consumo.'
        : undefined),
    lastMeaningfulDiscoveryAt: evidence.length > 0 ? evidence[0].createdAt : undefined,
  };
};

export const buildHouseModelFromJourney = (
  input: BuildHouseModelFromJourneyInput
): HouseModel => {
  const invoices = normalizeInvoices(input.currentInvoice, input.invoiceHistory);
  const now = resolveTimestamp(input, invoices);
  const evidence = buildEvidence(input, invoices, now);
  const identity = buildIdentity(input);
  const memory = buildMemory(input.memorySnapshot, evidence, now);
  const knowledge = buildKnowledge(input.knowledgeState, input.memorySnapshot, now);
  const { activeHypotheses, discardedHypotheses, confirmedHypotheses } = buildHypotheses(
    input,
    evidence
  );
  const understanding = buildUnderstanding(
    input,
    invoices,
    evidence,
    memory,
    knowledge,
    activeHypotheses
  );
  const rooms = buildRooms(input, evidence, now);
  const energyBaseline = buildBaseline(invoices);
  const draftHouse: HouseModel = {
    id: `house-${sanitizeId(input.userId)}`,
    ownerId: input.userId,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    identity,
    understanding,
    rooms,
    energyBaseline,
    activeHypotheses,
    discardedHypotheses,
    confirmedHypotheses,
    memory,
    knowledge,
    nextInvestigation: {
      focus: 'unknown',
      reason: '',
    },
  };
  const nextInvestigation = runCuriosityEngine({
    house: draftHouse,
  }).nextInvestigation;

  return {
    ...draftHouse,
    nextInvestigation,
  };
};
