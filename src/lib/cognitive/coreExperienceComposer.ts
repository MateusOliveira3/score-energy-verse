import { buildHouseModelFromJourney, type BuildHouseModelFromJourneyInput } from '@/lib/cognitive/buildHouseModelFromJourney';
import { buildCoreSpeech } from '@/lib/cognitive/coreSpeechEngine';
import { selectPrimaryHouseClue } from '@/lib/cognitive/houseClueEngine';
import { buildEnergyStoryFromJourney, type EnergyStory } from '@/lib/energy-map';
import type {
  CoreExperience,
  CoreExperiencePrimaryAction,
  CoreExperienceSecondaryActionId,
  CoreExperienceStatus,
  HouseClue,
  HouseModel,
} from '@/lib/cognitive/types';

export type BuildCoreExperienceFromJourneyInput = BuildHouseModelFromJourneyInput;

const buildStatus = (
  house: HouseModel,
  clue: HouseClue
): { status: CoreExperienceStatus; reason: string } => {
  const hasEvidence = clue.evidenceIds.length > 0;

  if (clue.shouldAskQuestion) {
    return {
      status: 'question_ready',
      reason: 'A pista principal depende de uma confirmacao simples do usuario.',
    };
  }

  if (
    house.energyBaseline.status === 'not_started' &&
    !hasEvidence &&
    house.understanding.overallLevel === 0
  ) {
    return {
      status: 'no_data',
      reason: 'Ainda nao existem sinais suficientes para uma pista mais concreta.',
    };
  }

  if (clue.kind === 'baseline') {
    return {
      status: 'building_baseline',
      reason: 'A casa ja comecou a ser observada, mas a linha de base ainda esta em construcao.',
    };
  }

  if (
    clue.kind === 'room_mystery' &&
    house.energyBaseline.status === 'established' &&
    !hasEvidence &&
    (clue.confidence === 'low' || clue.confidence === 'unknown')
  ) {
    return {
      status: 'needs_more_context',
      reason: 'Existe um misterio relevante, mas ainda faltam evidencias para uma leitura mais firme.',
    };
  }

  if (
    house.energyBaseline.status === 'established' &&
    clue.kind !== 'question' &&
    clue.confidence !== 'low' &&
    clue.confidence !== 'unknown'
  ) {
    return {
      status: 'stable_observation',
      reason: 'A casa ja possui linha de base suficiente para uma observacao mais estavel.',
    };
  }

  return {
    status: 'clue_ready',
    reason: 'Ja existe uma pista util pronta para ser revelada sem precisar abrir uma pergunta.',
  };
};

const buildPrimaryAction = (
  status: CoreExperienceStatus,
  clue: HouseClue,
  energyStory?: EnergyStory
): CoreExperiencePrimaryAction => {
  if (status === 'question_ready') {
    return {
      id: 'responder',
      label: 'Responder',
      reason:
        energyStory?.nextInvestigation ??
        clue.question?.reason ??
        'Uma resposta curta ajuda a reduzir a principal incerteza da casa.',
    };
  }

  if (status === 'no_data') {
    return {
      id: 'continuar',
      label: 'Continuar',
      reason: 'A experiencia ainda esta reunindo os primeiros sinais reais da residencia.',
    };
  }

  if (status === 'building_baseline') {
    return {
      id: 'continuar',
      label: 'Continuar',
      reason: 'Mais continuidade ajuda a formar a linha de base da casa.',
    };
  }

  if (status === 'needs_more_context') {
    return {
      id: 'descobrir',
      label: 'Descobrir',
      reason:
        energyStory?.confidenceNarrative ??
        'Ainda vale explorar um pouco mais antes de concluir qualquer coisa.',
    };
  }

  if (status === 'stable_observation') {
    return {
      id: 'entender',
      label: 'Entender',
      reason:
        energyStory?.confidenceNarrative ??
        'Agora ja da para olhar a pista com um pouco mais de profundidade.',
    };
  }

  return {
    id: 'ver',
    label: 'Ver',
    reason:
      energyStory?.confidenceNarrative ?? 'Ja existe uma pista clara o bastante para ser mostrada.',
  };
};

const buildSecondaryActions = (house: HouseModel): CoreExperienceSecondaryActionId[] => {
  const actions: CoreExperienceSecondaryActionId[] = ['mostrar_detalhes'];

  if (house.memory.facts.length > 0 || house.memory.stablePatterns.length > 0) {
    actions.push('ver_memoria');
  }

  if (
    house.activeHypotheses.length > 0 ||
    house.understanding.mainMystery ||
    house.understanding.mainKnownPattern
  ) {
    actions.push('pedir_explicacao');
  }

  return Array.from(new Set(actions));
};

export const buildCoreExperienceFromJourney = (
  input: BuildCoreExperienceFromJourneyInput
): CoreExperience => {
  const house = buildHouseModelFromJourney(input);
  const primaryClue = selectPrimaryHouseClue(house);
  const energyStory = buildEnergyStoryFromJourney(input);
  const speech = buildCoreSpeech(primaryClue, {
    currentInvoice: input.currentInvoice,
    energyStory,
  });
  const { status, reason } = buildStatus(house, primaryClue);
  const primaryAction = buildPrimaryAction(status, primaryClue, energyStory);
  const secondaryActions = buildSecondaryActions(house);

  return {
    id: `core-experience-${house.id}`,
    status,
    house,
    primaryClue,
    speech,
    primaryAction,
    secondaryActions,
    debug: {
      pipeline: energyStory ? ['house', 'clue', 'energy_story', 'speech'] : ['house', 'clue', 'speech'],
      evidenceCount: primaryClue.evidenceIds.length,
      knownAreasCount: house.understanding.knownAreas.length,
      unknownAreasCount: house.understanding.unknownAreas.length,
      statusReason: reason,
    },
  };
};
