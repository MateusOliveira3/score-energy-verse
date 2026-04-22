export type ConsumerType =
  | 'Residencial'
  | 'Comercial'
  | 'Restaurante'
  | 'Escola'
  | 'Industria'
  | string;

export type EnergyPreference = 'Convencional' | 'Solar' | 'Hibrido' | 'Eolica' | string;

export interface Profile {
  consumerType: ConsumerType;
  location: string;
  propertySize: number;
  peopleCount: number;
  energyPreference: EnergyPreference;
}

export interface Mascot {
  name: string;
  emoji: string;
  colorPalette: string;
  borderEffect: string;
}

export interface InvoiceData {
  fingerprint: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  consumption: number;
  totalValue: number;
  taxPercentage: number;
  peakHours: string;
  month: string;
  uploadedAt?: string;
}

export interface Analysis {
  consumptionLevel: 'baixo' | 'moderado' | 'alto';
  costSignal: 'controlado' | 'atencao' | 'elevado';
  headline: string;
  observations: string[];
  whatMattersNext: string;
  efficiencyLabel: string;
}

export type NextActionPriority = 'high' | 'medium' | 'low';
export type NextActionStatus = 'new' | 'viewed' | 'started' | 'completed';
export type NextActionSource = 'profile' | 'invoice' | 'analysis' | 'journey';

export interface NextAction {
  id: string;
  title: string;
  description: string;
  value: string;
  priority: NextActionPriority;
  status?: NextActionStatus;
  source?: NextActionSource;
}

export type JourneyStage =
  | 'onboarding'
  | 'before-upload'
  | 'invoice-uploaded'
  | 'analysis-ready'
  | 'return-visit';

export interface MascotGuidance {
  title: string;
  message: string;
  stage: JourneyStage;
}

export type ScoreEventType =
  | 'profile_completed'
  | 'invoice_uploaded'
  | 'analysis_completed'
  | 'action_viewed';

export interface ScoreEvent {
  id: string;
  type: ScoreEventType;
  label: string;
  points: number;
  occurredAt: string;
}

export interface ScoreState {
  score: number;
  level: number;
  nextLevelScore: number;
  progressToNextLevel: number;
}

export type AnalysisStatus = 'idle' | 'processing' | 'ready';

export interface AnalysisState {
  status: AnalysisStatus;
  latestInvoice?: InvoiceData;
  invoiceHistory: InvoiceData[];
  summary?: Analysis;
  lastCompletedAt?: string;
}

export interface NextActionsState {
  items: NextAction[];
  viewedActionIds: string[];
  lastUpdatedAt?: string;
}

export interface MvpState {
  profile: Profile;
  mascot: Mascot;
  analysis: AnalysisState;
  scoreEvents: ScoreEvent[];
  actions: NextActionsState;
  journeyStage: JourneyStage;
  lastActiveAt?: string;
}

export type UserProfileData = Profile;
export type MascotCustomizationData = Mascot;
export type AnalysisSummary = Analysis;
