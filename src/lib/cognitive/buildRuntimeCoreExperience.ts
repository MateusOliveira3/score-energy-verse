import { buildCoreExperienceFromJourney } from '@/lib/cognitive/coreExperienceComposer';
import type { CoreExperience } from '@/lib/cognitive/types';
import type { MemorySnapshot } from '@/lib/memorySnapshot';
import type { MvpState, ScoreState } from '@/types/mvp';

export interface BuildRuntimeCoreExperienceInput {
  isJourneyHydrated: boolean;
  userId?: string | null;
  journeyState: MvpState;
  memorySnapshot?: MemorySnapshot;
  scoreState?: ScoreState;
}

export const buildRuntimeCoreExperience = ({
  isJourneyHydrated,
  userId,
  journeyState,
  memorySnapshot,
  scoreState,
}: BuildRuntimeCoreExperienceInput): CoreExperience | undefined => {
  if (!isJourneyHydrated || !userId) {
    return undefined;
  }

  return buildCoreExperienceFromJourney({
    userId,
    updatedAt: journeyState.lastActiveAt,
    profile: journeyState.profile,
    currentInvoice: journeyState.analysis.latestInvoice,
    invoiceHistory: journeyState.analysis.invoiceHistory,
    analysisSummary: journeyState.analysis.summary,
    memorySnapshot,
    strategicAnswers: journeyState.userContext.questions,
    energyBehaviorProfile: journeyState.energyBehaviorProfile,
    knowledgeState: journeyState.knowledge,
    score: scoreState
      ? {
          value: scoreState.score,
          level: scoreState.level,
        }
      : undefined,
  });
};
