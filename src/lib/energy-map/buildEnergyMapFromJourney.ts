import type {
  EnergyBehaviorProfile,
  InvoiceData,
  Profile,
  UserContextState,
} from '@/types/mvp';

import type { EnergyMapBlock } from './bathroom';
import { buildEnergyMap, type EnergyMap } from './buildEnergyMap';
import { estimateLightingEnergyBlock } from './lighting';
import { estimateRefrigerationEnergyBlock } from './refrigeration';

export interface BuildEnergyMapFromJourneyInput {
  currentInvoice?: Partial<InvoiceData> | null;
  profile?: Partial<Profile> | null;
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile> | null;
  strategicAnswers?: Partial<UserContextState['questions']> | null;
}

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const deriveCycleDays = (invoice?: Partial<InvoiceData> | null) => {
  const parserDays = invoice?.parser?.fields?.daysBilled?.value;
  return isPositiveNumber(parserDays) ? parserDays : 30;
};

const deriveAverageTariffPerKwh = (invoice?: Partial<InvoiceData> | null) => {
  if (!isPositiveNumber(invoice?.totalValue) || !isPositiveNumber(invoice?.consumption)) {
    return undefined;
  }

  return Math.round((invoice.totalValue / invoice.consumption) * 1000) / 1000;
};

const deriveRoomCount = (
  profile?: Partial<Profile> | null,
  energyBehaviorProfile?: Partial<EnergyBehaviorProfile> | null
) => {
  const roomCountRange = energyBehaviorProfile?.habits?.roomCountRange;

  if (roomCountRange === '1_3') return 3;
  if (roomCountRange === '4_6') return 5;
  if (roomCountRange === '7_ou_mais') return 7;

  if (!isPositiveNumber(profile?.propertySize)) {
    return undefined;
  }

  if (profile.propertySize <= 55) return 3;
  if (profile.propertySize <= 120) return 5;
  return 7;
};

const buildLightingBlock = ({
  currentInvoice,
  energyBehaviorProfile,
  profile,
}: Pick<BuildEnergyMapFromJourneyInput, 'currentInvoice' | 'energyBehaviorProfile' | 'profile'>) => {
  const roomCount = deriveRoomCount(profile, energyBehaviorProfile);

  if (!isPositiveNumber(roomCount)) {
    return undefined;
  }

  return estimateLightingEnergyBlock({
    roomCount,
    lightingProfile: 'unknown',
    cycleDays: deriveCycleDays(currentInvoice),
    averageTariffPerKwh: deriveAverageTariffPerKwh(currentInvoice),
    invoiceTotalValue: currentInvoice?.totalValue,
  });
};

const buildRefrigerationBlock = ({
  currentInvoice,
  energyBehaviorProfile,
}: Pick<BuildEnergyMapFromJourneyInput, 'currentInvoice' | 'energyBehaviorProfile'>) =>
  estimateRefrigerationEnergyBlock({
    hasRefrigerator: true,
    hasExtraFridge: energyBehaviorProfile?.appliances?.hasExtraFridge === true,
    cycleDays: deriveCycleDays(currentInvoice),
    averageTariffPerKwh: deriveAverageTariffPerKwh(currentInvoice),
    invoiceTotalValue: currentInvoice?.totalValue,
  });

export const buildEnergyMapFromJourney = (
  input: BuildEnergyMapFromJourneyInput
): EnergyMap | undefined => {
  const blocks: EnergyMapBlock[] = [];
  const lighting = buildLightingBlock(input);
  const refrigeration = buildRefrigerationBlock(input);

  if (refrigeration.status === 'estimated') {
    blocks.push(refrigeration);
  }

  if (lighting) {
    blocks.push(lighting);
  }

  if (blocks.length === 0) {
    return undefined;
  }

  return buildEnergyMap(blocks);
};
