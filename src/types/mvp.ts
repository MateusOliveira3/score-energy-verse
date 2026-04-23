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

export type InvoiceActionSnapshotStatus = 'in_progress' | 'completed';

export interface InvoiceActionSnapshot {
  id: string;
  title: string;
  status: InvoiceActionSnapshotStatus;
  value?: string;
}

export type InvoiceFieldConfidence = 'high' | 'medium' | 'low' | 'missing';

export interface InvoiceParsedField<T> {
  value?: T;
  confidence: InvoiceFieldConfidence;
}

export interface InvoiceParsedFields {
  providerName: InvoiceParsedField<string>;
  consumerUnit: InvoiceParsedField<string>;
  referenceMonth: InvoiceParsedField<string>;
  issueDate: InvoiceParsedField<string>;
  dueDate: InvoiceParsedField<string>;
  totalValue: InvoiceParsedField<number>;
  consumptionKwh: InvoiceParsedField<number>;
  daysBilled: InvoiceParsedField<number>;
  previousReading: InvoiceParsedField<number>;
  currentReading: InvoiceParsedField<number>;
  meterConstant: InvoiceParsedField<number>;
  tariffFlag: InvoiceParsedField<string>;
  teValue: InvoiceParsedField<number>;
  tusdValue: InvoiceParsedField<number>;
  publicLightingFee: InvoiceParsedField<number>;
  taxesTotal: InvoiceParsedField<number>;
}

export interface InvoiceParserResult {
  rawTextAvailable: boolean;
  textSource: 'pdf-text' | 'plain-text' | 'unsupported' | 'empty';
  normalizedText: string;
  fields: InvoiceParsedFields;
}

export interface InvoiceData {
  fingerprint: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  consumption?: number;
  totalValue?: number;
  taxPercentage?: number;
  peakHours?: string;
  month: string;
  parser: InvoiceParserResult;
  uploadedAt?: string;
  actionSnapshots?: InvoiceActionSnapshot[];
}

export type InvoiceComparisonStatus =
  | 'insufficient'
  | 'improved'
  | 'worsened'
  | 'stable'
  | 'mixed';

export type InvoiceComparisonTrend = 'down' | 'up' | 'stable';
export type InvoiceComparisonBasis = 'competence' | 'upload' | 'history';

export interface InvoiceMetricComparison {
  current: number;
  previous: number;
  change: number;
  percentChange?: number;
  trend: InvoiceComparisonTrend;
}

export interface InvoiceComparison {
  status: InvoiceComparisonStatus;
  basis: InvoiceComparisonBasis;
  title: string;
  summary: string;
  currentInvoice?: InvoiceData;
  previousInvoice?: InvoiceData;
  consumption?: InvoiceMetricComparison;
  totalValue?: InvoiceMetricComparison;
}

export interface NextCycleGuidance {
  title: string;
  message: string;
  suggestion: string;
}

export interface ActionResultLink {
  title: string;
  message: string;
  actions: InvoiceActionSnapshot[];
  note: string;
  hasObservedComparison: boolean;
}

export interface Analysis {
  consumptionLevel?: 'baixo' | 'moderado' | 'alto';
  costSignal?: 'controlado' | 'atencao' | 'elevado';
  headline: string;
  observations: string[];
  whatMattersNext: string;
  efficiencyLabel: string;
}

export type NextActionPriority = 'high' | 'medium' | 'low';
export type NextActionStatus = 'new' | 'viewed' | 'in_progress' | 'completed';
export type NextActionSource = 'profile' | 'invoice' | 'analysis' | 'journey';

export interface NextAction {
  id: string;
  title: string;
  description: string;
  value: string;
  context?: string;
  suggestion?: string;
  impact?: string;
  validation?: string;
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

export type MascotContextQuestionId =
  | 'usage_period'
  | 'electric_shower'
  | 'primary_goal';

export type MascotContextQuestionValue =
  | 'morning'
  | 'afternoon'
  | 'night'
  | 'unknown'
  | 'daily'
  | 'sometimes'
  | 'rarely'
  | 'none'
  | 'reduce_cost'
  | 'understand_consumption'
  | 'both';

export interface MascotContextQuestionOption {
  value: MascotContextQuestionValue;
  label: string;
}

export interface MascotContextQuestion {
  id: MascotContextQuestionId;
  invite: string;
  question: string;
  options: MascotContextQuestionOption[];
}

export interface MascotContextAnswer {
  status: 'answered' | 'ignored';
  value?: MascotContextQuestionValue;
  label?: string;
  updatedAt: string;
}

export interface UserContextState {
  questions: Partial<Record<MascotContextQuestionId, MascotContextAnswer>>;
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

export interface ScoreExplanationEvent {
  id: string;
  type: ScoreEventType;
  label: string;
  points: number;
  occurredAt: string;
  reason: string;
  subject?: string;
}

export interface ScoreExplanationSubtotal {
  type: ScoreEventType;
  label: string;
  points: number;
  count: number;
}

export interface ScoreExplanationNextGain {
  title: string;
  description: string;
  reason: string;
  potentialPoints?: number;
  relatedActionId?: string;
}

export interface ScoreExplanation {
  score: number;
  level: number;
  nextLevelScore: number;
  progressToNextLevel: number;
  journeyStage: JourneyStage;
  events: ScoreExplanationEvent[];
  subtotals: ScoreExplanationSubtotal[];
  achievements: string[];
  summary: string;
  nextGain?: ScoreExplanationNextGain;
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
  userContext: UserContextState;
  analysis: AnalysisState;
  scoreEvents: ScoreEvent[];
  actions: NextActionsState;
  journeyStage: JourneyStage;
  lastActiveAt?: string;
}

export type UserProfileData = Profile;
export type MascotCustomizationData = Mascot;
export type AnalysisSummary = Analysis;
