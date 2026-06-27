import {
  buildEnergyMapFromJourney,
  type BuildEnergyMapFromJourneyInput,
} from './buildEnergyMapFromJourney';
import { buildEnergyStory, type EnergyStory } from './energyStory';

export type BuildEnergyStoryFromJourneyInput = BuildEnergyMapFromJourneyInput;

export const buildEnergyStoryFromJourney = (
  input: BuildEnergyStoryFromJourneyInput
): EnergyStory | undefined => {
  const map = buildEnergyMapFromJourney(input);

  if (!map) {
    return undefined;
  }

  if (map.estimatedCoveragePercent <= 0) {
    return undefined;
  }

  return buildEnergyStory(map);
};
