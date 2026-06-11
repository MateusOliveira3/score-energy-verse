import {
  AnalysisSummary,
  EnergyBehaviorProfile,
  EnergyKnowledgeCategory,
  EnergyKnowledgeId,
  EnergyKnowledgeState,
  MascotGuidance,
  NextAction,
  UserProfileData,
} from '@/types/mvp';

export interface EnergyKnowledgeItem {
  category: EnergyKnowledgeCategory;
  id: EnergyKnowledgeId;
  message: string;
  title: string;
}

interface PickEnergyKnowledgeInput {
  activeObjective?: string;
  activeTip?: string;
  activeView?: 'mascot' | 'co2' | 'summary';
  analysis?: AnalysisSummary;
  dismissedKnowledgeIds?: EnergyKnowledgeId[];
  guidance?: MascotGuidance;
  knowledgeState?: EnergyKnowledgeState;
  nextAction?: NextAction;
  profile?: Partial<UserProfileData>;
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile>;
}

const ENERGY_KNOWLEDGE_CATALOG: EnergyKnowledgeItem[] = [
  {
    id: 'bill_comparison',
    category: 'consumo',
    title: 'Comparacao entre ciclos',
    message:
      'Comparar meses parecidos ajuda a perceber mudancas reais sem confundir clima, rotina e tarifa.',
  },
  {
    id: 'shower_efficiency',
    category: 'consumo',
    title: 'Chuveiro eficiente',
    message:
      'Banhos mais curtos podem reduzir significativamente o consumo associado ao aquecimento da agua.',
  },
  {
    id: 'standby_consumption',
    category: 'habitos',
    title: 'Consumo em stand-by',
    message:
      'Aparelhos em espera continuam consumindo energia ao longo do dia, mesmo sem uso ativo.',
  },
  {
    id: 'thermal_comfort',
    category: 'conforto_termico',
    title: 'Conforto termico',
    message:
      'Ventilacao, sombra e isolamento simples podem melhorar o conforto sem depender apenas de equipamentos.',
  },
  {
    id: 'efficient_cooling',
    category: 'climatizacao',
    title: 'Climatizacao eficiente',
    message:
      'Climatizacao costuma render mais quando a casa esta fechada e o tempo de uso fica sob controle.',
  },
  {
    id: 'peak_usage_habits',
    category: 'habitos',
    title: 'Horario de maior uso',
    message:
      'Concentrar varios usos intensos no mesmo horario tende a deixar o consumo mais pesado naquele periodo.',
  },
  {
    id: 'sustainable_routine',
    category: 'sustentabilidade',
    title: 'Rotina mais sustentavel',
    message:
      'Pequenos ajustes repetidos na rotina costumam gerar aprendizado energetico mais consistente do que mudancas bruscas.',
  },
  {
    id: 'solar_potential',
    category: 'energia_solar',
    title: 'Potencial solar',
    message:
      'Antes de avaliar energia solar, vale entender quando e como a casa mais consome energia ao longo do ciclo.',
  },
] as const;

const KNOWLEDGE_BY_ID = Object.fromEntries(
  ENERGY_KNOWLEDGE_CATALOG.map((knowledge) => [knowledge.id, knowledge] as const)
) as Record<EnergyKnowledgeId, EnergyKnowledgeItem>;

const normalizeForMatch = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const normalizeKnowledgeState = (
  knowledge?: Partial<EnergyKnowledgeState>
): EnergyKnowledgeState => {
  const learned = Object.fromEntries(
    Object.entries(knowledge?.learned ?? {}).filter(
      ([knowledgeId, isLearned]) =>
        knowledgeId in KNOWLEDGE_BY_ID && isLearned === true
    )
  ) as EnergyKnowledgeState['learned'];

  return {
    learned,
    lastLearnedId:
      typeof knowledge?.lastLearnedId === 'string' &&
      knowledge.lastLearnedId in KNOWLEDGE_BY_ID &&
      learned[knowledge.lastLearnedId as EnergyKnowledgeId] === true
        ? (knowledge.lastLearnedId as EnergyKnowledgeId)
        : undefined,
  };
};

export const getEnergyKnowledgeCatalog = () => ENERGY_KNOWLEDGE_CATALOG;

export const getEnergyKnowledgeById = (knowledgeId: EnergyKnowledgeId) =>
  KNOWLEDGE_BY_ID[knowledgeId];

export const isEnergyKnowledgeLearned = (
  knowledgeState: Partial<EnergyKnowledgeState> | undefined,
  knowledgeId: EnergyKnowledgeId
) => normalizeKnowledgeState(knowledgeState).learned[knowledgeId] === true;

export const getLearnedEnergyKnowledgeCount = (
  knowledgeState: Partial<EnergyKnowledgeState> | undefined
) =>
  ENERGY_KNOWLEDGE_CATALOG.filter((knowledge) =>
    isEnergyKnowledgeLearned(knowledgeState, knowledge.id)
  ).length;

export const getLearnedEnergyKnowledgeItems = (
  knowledgeState: Partial<EnergyKnowledgeState> | undefined
) =>
  ENERGY_KNOWLEDGE_CATALOG.filter((knowledge) =>
    isEnergyKnowledgeLearned(knowledgeState, knowledge.id)
  );

export const getUnlearnedEnergyKnowledgeItems = (
  knowledgeState: Partial<EnergyKnowledgeState> | undefined
) =>
  ENERGY_KNOWLEDGE_CATALOG.filter(
    (knowledge) => !isEnergyKnowledgeLearned(knowledgeState, knowledge.id)
  );

export const getLastLearnedEnergyKnowledge = (
  knowledgeState: Partial<EnergyKnowledgeState> | undefined
) => {
  const normalizedKnowledgeState = normalizeKnowledgeState(knowledgeState);

  if (normalizedKnowledgeState.lastLearnedId) {
    return getEnergyKnowledgeById(normalizedKnowledgeState.lastLearnedId);
  }

  return getLearnedEnergyKnowledgeItems(normalizedKnowledgeState).at(-1);
};

export const getNextEnergyKnowledge = (
  knowledgeState: Partial<EnergyKnowledgeState> | undefined
) => getUnlearnedEnergyKnowledgeItems(knowledgeState)[0];

const buildKnowledgePriority = ({
  activeObjective,
  activeTip,
  activeView,
  analysis,
  energyBehaviorProfile,
  guidance,
  nextAction,
  profile,
}: Omit<PickEnergyKnowledgeInput, 'dismissedKnowledgeIds' | 'knowledgeState'>) => {
  const textCorpus = normalizeForMatch(
    [
      activeTip,
      activeObjective,
      guidance?.title,
      guidance?.message,
      analysis?.headline,
      analysis?.whatMattersNext,
      ...(analysis?.educationItems ?? []).flatMap((item) => [item.label, item.explanation]),
      nextAction?.title,
      nextAction?.description,
      nextAction?.value,
    ]
      .filter(Boolean)
      .join(' ')
  );
  const priorities: EnergyKnowledgeId[] = [];

  if (
    energyBehaviorProfile?.appliances?.hasElectricShower === true ||
    /chuveiro|banho/.test(textCorpus)
  ) {
    priorities.push('shower_efficiency');
  }

  if (
    energyBehaviorProfile?.appliances?.hasAirConditioning === true ||
    energyBehaviorProfile?.habits?.climateUsageIntensity === 'sim' ||
    /climatizacao|ar-condicionado|ar condicionado|refrigeracao|conforto/.test(textCorpus)
  ) {
    priorities.push('efficient_cooling', 'thermal_comfort');
  }

  if (
    /pico|horario|noite|tarde|rotina/.test(textCorpus) ||
    energyBehaviorProfile?.habits?.usesHeavyLoadsAtNight === true
  ) {
    priorities.push('peak_usage_habits');
  }

  if (/compar|ciclo|fatura|historico/.test(textCorpus) || activeView === 'co2') {
    priorities.push('bill_comparison');
  }

  if (/sustentab|impacto|consistencia/.test(textCorpus) || activeView === 'mascot') {
    priorities.push('sustainable_routine');
  }

  if (
    profile?.energyPreference === 'Solar' ||
    profile?.energyPreference === 'Hibrido' ||
    energyBehaviorProfile?.intentions?.solarAnalysisInterest === 'sim' ||
    /solar|geracao propria|fotovolta/.test(textCorpus)
  ) {
    priorities.push('solar_potential');
  }

  if (/espera|standby|stand-by|sempre ligado/.test(textCorpus) || activeView === 'summary') {
    priorities.push('standby_consumption');
  }

  priorities.push(
    'standby_consumption',
    'peak_usage_habits',
    'sustainable_routine',
    'bill_comparison',
    'thermal_comfort',
    'efficient_cooling',
    'shower_efficiency',
    'solar_potential'
  );

  return priorities.filter(
    (knowledgeId, index, collection) => collection.indexOf(knowledgeId) === index
  );
};

export const pickEnergyKnowledge = ({
  activeObjective,
  activeTip,
  activeView,
  analysis,
  dismissedKnowledgeIds = [],
  guidance,
  knowledgeState,
  nextAction,
  profile,
  energyBehaviorProfile,
}: PickEnergyKnowledgeInput) => {
  const normalizedKnowledgeState = normalizeKnowledgeState(knowledgeState);
  const blockedKnowledgeIds = new Set(dismissedKnowledgeIds);
  const priority = buildKnowledgePriority({
    activeObjective,
    activeTip,
    activeView,
    analysis,
    energyBehaviorProfile,
    guidance,
    nextAction,
    profile,
  });

  return priority
    .map((knowledgeId) => KNOWLEDGE_BY_ID[knowledgeId])
    .find(
      (knowledge) =>
        !normalizedKnowledgeState.learned[knowledge.id] && !blockedKnowledgeIds.has(knowledge.id)
    );
};
