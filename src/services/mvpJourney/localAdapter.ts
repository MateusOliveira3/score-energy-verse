import { loadState, saveState } from '@/lib/mvpPersistence';
import {
  addScoreEvent,
  normalizeState,
  setAnalysis,
  updateActions,
  updateMascot,
  updateProfile,
} from '@/lib/mvpJourneyState';
import {
  AppendScoreEventInput,
  LoadJourneyStateInput,
  MvpJourneyService,
  SaveActionsInput,
  SaveAnalysisInput,
  SaveJourneyStateInput,
  SaveMascotInput,
  SaveProfileInput,
} from '@/services/mvpJourney/contracts';

const resolveAndSave = <TInput extends { userId?: string }>(
  input: TInput,
  updater: (currentState: ReturnType<typeof loadState>) => ReturnType<typeof loadState>
) => {
  const currentState = loadState(input.userId);
  return Promise.resolve(saveState(input.userId, updater(currentState)));
};

export const createLocalMvpJourneyService = (): MvpJourneyService => ({
  loadJourneyState: async ({ userId }: LoadJourneyStateInput) => loadState(userId),

  saveJourneyState: async ({ userId, state }: SaveJourneyStateInput) =>
    saveState(userId, normalizeState(state)),

  saveProfile: async ({ userId, profile }: SaveProfileInput) =>
    resolveAndSave({ userId }, (currentState) => updateProfile(currentState, profile)),

  saveMascot: async ({ userId, mascot }: SaveMascotInput) =>
    resolveAndSave({ userId }, (currentState) => updateMascot(currentState, mascot)),

  saveAnalysis: async ({ userId, analysis }: SaveAnalysisInput) =>
    resolveAndSave({ userId }, (currentState) =>
      setAnalysis(currentState, {
        latestInvoice: analysis.latestInvoice,
        summary: analysis.summary,
        completedAt: analysis.lastCompletedAt,
      })
    ),

  appendScoreEvent: async ({ userId, event }: AppendScoreEventInput) =>
    resolveAndSave({ userId }, (currentState) => addScoreEvent(currentState, event)),

  saveActions: async ({ userId, actions }: SaveActionsInput) =>
    resolveAndSave({ userId }, (currentState) =>
      updateActions(currentState, {
        items: actions.items,
        viewedActionIds: actions.viewedActionIds,
        updatedAt: actions.lastUpdatedAt,
      })
    ),
});
