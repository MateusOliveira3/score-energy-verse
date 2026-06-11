import {
  AnalysisState,
  Mascot,
  MvpState,
  NextActionsState,
  Profile,
  ScoreEvent,
} from '@/types/mvp';

export type JourneyProfileContract = Profile;
export type JourneyMascotContract = Mascot;
export type JourneyAnalysisContract = AnalysisState;
export type JourneyScoreEventContract = ScoreEvent;
export type JourneyActionsContract = NextActionsState;
export type JourneyStateContract = MvpState;

export interface JourneyRequestContext {
  userId?: string;
  identitySource?: 'authenticated' | 'local-auth-fallback' | 'development-fallback';
  isFallbackIdentity?: boolean;
}

export type LoadJourneyStateInput = JourneyRequestContext;

export interface SaveJourneyStateInput extends JourneyRequestContext {
  state: JourneyStateContract;
}

export interface SaveProfileInput extends JourneyRequestContext {
  profile: JourneyProfileContract;
}

export interface SaveMascotInput extends JourneyRequestContext {
  mascot: JourneyMascotContract;
}

export interface SaveAnalysisInput extends JourneyRequestContext {
  analysis: JourneyAnalysisContract;
}

export interface AppendScoreEventInput extends JourneyRequestContext {
  event: JourneyScoreEventContract;
}

export interface SaveActionsInput extends JourneyRequestContext {
  actions: JourneyActionsContract;
}

export interface MvpJourneyService {
  loadJourneyState(input: LoadJourneyStateInput): Promise<JourneyStateContract>;
  saveJourneyState(input: SaveJourneyStateInput): Promise<JourneyStateContract>;
  saveProfile(input: SaveProfileInput): Promise<JourneyStateContract>;
  saveMascot(input: SaveMascotInput): Promise<JourneyStateContract>;
  saveAnalysis(input: SaveAnalysisInput): Promise<JourneyStateContract>;
  appendScoreEvent(input: AppendScoreEventInput): Promise<JourneyStateContract>;
  saveActions(input: SaveActionsInput): Promise<JourneyStateContract>;
}
