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

export type EnergyBehaviorUsagePeriod =
  | 'pico'
  | 'fora_pico'
  | 'misto'
  | 'nao_informado';

export type EnergyBehaviorLaundryFrequency =
  | 'baixa'
  | 'media'
  | 'alta'
  | 'nao_informado';

export type EnergyBehaviorResidenceType =
  | 'casa'
  | 'apartamento'
  | 'sobrado'
  | 'studio'
  | 'nao_informado';

export type EnergyBehaviorRoomCountRange =
  | '1_3'
  | '4_6'
  | '7_ou_mais'
  | 'nao_informado';

export type EnergyBehaviorShowerHeatingType =
  | 'eletrico'
  | 'gas'
  | 'misto'
  | 'nao_sei'
  | 'nao_informado';

export type EnergyBehaviorCookingType =
  | 'gas'
  | 'eletrico'
  | 'misto'
  | 'nao_sei'
  | 'nao_informado';

export type EnergyBehaviorHouseholdRoutinePeriod =
  | 'manha'
  | 'tarde'
  | 'noite'
  | 'misto'
  | 'nao_informado';

export type EnergyBehaviorPeakWindowUsage =
  | 'sim'
  | 'nao'
  | 'as_vezes'
  | 'nao_informado';

export type EnergyBehaviorHouseholdPresence =
  | 'sim'
  | 'nao'
  | 'parcial'
  | 'nao_informado';

export type EnergyBehaviorClimateUsage =
  | 'sim'
  | 'nao'
  | 'sazonal'
  | 'nao_informado';

export type EnergyBehaviorThermalSensitivity =
  | 'sim'
  | 'nao'
  | 'nao_sei'
  | 'nao_informado';

export type EnergyBehaviorInterest =
  | 'sim'
  | 'talvez'
  | 'nao'
  | 'nao_informado';

export type EnergyBehaviorPrimaryObjective =
  | 'economia'
  | 'conforto'
  | 'sustentabilidade'
  | 'nao_informado';

export interface EnergyBehaviorPromptMemoryEntry {
  answer: string;
  answeredAt: string;
}

export interface EnergyBehaviorProfile {
  appliances: {
    bathrooms?: number;
    showers?: number;
    hasElectricShower?: boolean;
    showerHeatingType?: EnergyBehaviorShowerHeatingType;
    hasAirConditioning?: boolean;
    airConditioningCount?: number;
    hasExtraFridge?: boolean;
    cookingType?: EnergyBehaviorCookingType;
    hasElectricOven?: boolean;
    hasWashingMachine?: boolean;
    hasDryer?: boolean;
  };
  habits: {
    residenceType?: EnergyBehaviorResidenceType;
    roomCountRange?: EnergyBehaviorRoomCountRange;
    hasChildren?: boolean;
    hasElderly?: boolean;
    dominantUsagePeriod?: EnergyBehaviorUsagePeriod;
    usesHeavyLoadsAtNight?: boolean;
    laundryFrequency?: EnergyBehaviorLaundryFrequency;
    dominantUsageRoutine?: EnergyBehaviorHouseholdRoutinePeriod;
    peakWindowIntensity?: EnergyBehaviorPeakWindowUsage;
    householdPeakPresence?: EnergyBehaviorHouseholdPresence;
    climateUsageIntensity?: EnergyBehaviorClimateUsage;
    thermalSensitivity?: EnergyBehaviorThermalSensitivity;
  };
  intentions: {
    thermalComfortInterest?: EnergyBehaviorInterest;
    solarAnalysisInterest?: EnergyBehaviorInterest;
    consultantInterest?: EnergyBehaviorInterest;
    primaryObjective?: EnergyBehaviorPrimaryObjective;
  };
  qualification: {
    diagnosisLevel?: number;
    answeredDiagnosisCount?: number;
    qualifiedLead?: boolean;
  };
  actionMemory: {
    startedActionTitles?: string[];
    answeredActionPrompts?: Record<string, EnergyBehaviorPromptMemoryEntry>;
  };
  confidence: {
    applianceConfidence?: number;
    habitConfidence?: number;
    leadConfidence?: number;
  };
  updatedAt?: string;
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
  consultativeInsights?: string[];
  consultiveInsight?: ConsultiveInsight;
  evidenceItems?: InsightFactItem[];
  educationItems?: InsightEducationItem[];
  behaviorHighlights?: string[];
}

export type ConsultiveInsightDriver =
  | 'pico'
  | 'aumento_historico'
  | 'custo_medio'
  | 'bandeira'
  | 'consumo_total'
  | 'acompanhamento';

export type InsightSeason = 'verao' | 'inverno' | 'meia_estacao';

export type ActionInteractiveQuestionId =
  | 'residence_type'
  | 'room_count'
  | 'children_presence'
  | 'elderly_presence'
  | 'bathrooms_count'
  | 'showers_count'
  | 'electric_shower_presence'
  | 'shower_heating_type'
  | 'air_conditioning_presence'
  | 'air_conditioning_count'
  | 'cooking_type'
  | 'electric_oven_presence'
  | 'extra_fridge_presence'
  | 'washing_machine_presence'
  | 'dryer_presence'
  | 'heavy_loads_at_night'
  | 'laundry_frequency'
  | 'dominant_usage_period'
  | 'peak_window_intensity'
  | 'peak_household_presence'
  | 'climate_usage_intensity'
  | 'thermal_instability'
  | 'thermal_comfort_interest'
  | 'solar_analysis_interest'
  | 'consultant_interest'
  | 'primary_objective';

export type EnergyDiagnosisQuestionCategory =
  | 'estrutura'
  | 'ocupacao'
  | 'banheiro'
  | 'climatizacao'
  | 'cozinha'
  | 'lavanderia'
  | 'rotina'
  | 'intencao';

export type InvestigationQuestionRole =
  | 'initial'
  | 'confirmation'
  | 'refinement'
  | 'disambiguation';

export type InvestigationTargetArea =
  | 'bathroom'
  | 'refrigeration'
  | 'lighting'
  | 'occupancy'
  | 'residence_structure'
  | 'comfort'
  | 'kitchen'
  | 'laundry'
  | 'routine'
  | 'tariff'
  | 'seasonality'
  | 'unknown';

export type InvestigationQuestionPriorityHint = 'high' | 'medium' | 'low';

export interface InvestigationQuestionMetadata {
  hypothesisId?: string;
  targetArea: InvestigationTargetArea;
  energyMapBlock?: Array<'bathroom' | 'refrigeration' | 'lighting'>;
  evidenceProduced: string[];
  questionRole: InvestigationQuestionRole;
  unlocks?: ActionInteractiveQuestionId[];
  dependsOn?: ActionInteractiveQuestionId[];
  expectedBenefit: string;
  priorityHint: InvestigationQuestionPriorityHint;
}

export interface ActionInteractiveQuestionOption {
  value: string;
  label: string;
}

export interface EnergyDiagnosisQuestionDefinition {
  id: ActionInteractiveQuestionId;
  levelRange: {
    min: number;
    max?: number;
  };
  category: EnergyDiagnosisQuestionCategory;
  question: string;
  options: ActionInteractiveQuestionOption[];
  mapsToField: string;
  whyItMatters: string;
  followUpPriority: number;
  investigation: InvestigationQuestionMetadata;
}

export interface ActionInteractiveQuestion {
  id: ActionInteractiveQuestionId;
  prompt: string;
  options: ActionInteractiveQuestionOption[];
  helperText?: string;
  investigation?: InvestigationQuestionMetadata;
}

export interface NextActionPendingAnswer {
  questionId: ActionInteractiveQuestionId;
  answer: string;
  answeredAt?: string;
  persistOnly?: boolean;
}

export interface ActionDiagnosticProgress {
  current: number;
  total: number;
  level: number;
  completed: boolean;
}

export interface ConsultiveInsightAction {
  title: string;
  reason: string;
  evidence: string;
  ctaLabel: string;
  interactiveQuestions?: ActionInteractiveQuestion[];
  usedDataPoints?: string[];
}

export interface ConsultiveInsightEnvironmentContext {
  season: InsightSeason;
}

export interface ConsultiveInsightProfileContext {
  profileType?: string;
  locationLabel?: string;
  householdSize?: number;
  hasSolar: boolean;
  contextSentence?: string;
  warnings: string[];
}

export interface ConsultiveInsight {
  mainDriver: ConsultiveInsightDriver;
  headline: string;
  evidence: string;
  interpretation: string;
  conclusion: string;
  microEducation: string;
  primaryAction: ConsultiveInsightAction;
  secondaryAction?: ConsultiveInsightAction;
  warnings: string[];
  historyTrend?: string;
  environmentContext?: ConsultiveInsightEnvironmentContext;
  profileContext?: ConsultiveInsightProfileContext;
}

export interface InsightFactItem {
  label: string;
  value: string;
}

export interface InsightEducationItem {
  explanation: string;
  label: string;
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
  ctaLabel?: string;
  evidence?: string;
  reason?: string;
  impact?: string;
  validation?: string;
  interactiveQuestions?: ActionInteractiveQuestion[];
  usedDataPoints?: string[];
  knownBehaviorSummary?: string[];
  answeredQuestionSummaries?: string[];
  diagnosticProgress?: ActionDiagnosticProgress;
  pendingAnswer?: NextActionPendingAnswer;
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

export type EnergyKnowledgeCategory =
  | 'consumo'
  | 'conforto_termico'
  | 'climatizacao'
  | 'habitos'
  | 'sustentabilidade'
  | 'energia_solar';

export type EnergyKnowledgeId =
  | 'bill_comparison'
  | 'shower_efficiency'
  | 'standby_consumption'
  | 'thermal_comfort'
  | 'efficient_cooling'
  | 'peak_usage_habits'
  | 'sustainable_routine'
  | 'solar_potential';

export interface EnergyKnowledgeState {
  learned: Partial<Record<EnergyKnowledgeId, boolean>>;
  lastLearnedId?: EnergyKnowledgeId;
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
  knowledge: EnergyKnowledgeState;
  energyBehaviorProfile: EnergyBehaviorProfile;
  analysis: AnalysisState;
  scoreEvents: ScoreEvent[];
  actions: NextActionsState;
  journeyStage: JourneyStage;
  lastActiveAt?: string;
}

export type UserProfileData = Profile;
export type MascotCustomizationData = Mascot;
export type AnalysisSummary = Analysis;
