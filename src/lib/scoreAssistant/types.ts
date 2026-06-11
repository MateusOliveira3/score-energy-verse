export type ScoreAssistantMode = 'hermes' | 'fallback';

export interface ScoreAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ScoreAssistantUserContext {
  userId: string;
  userName: string;
  role: 'authenticated' | 'local-auth-fallback' | 'development-fallback' | string;
}

export interface ScoreAssistantContextSnapshot {
  activeView?: string;
  selectedInvoiceId?: string;
  selectedInvoiceLabel?: string;
  userProfileSummary: string[];
  scoreSummary?: string;
  invoiceHistorySummary: string[];
  comparisonSummary?: string;
  energySignals: string[];
  learnedKnowledge: string[];
  recentActions: string[];
  knownGaps: string[];
  loadHypotheses: string[];
  memorySignals: string[];
  suggestedNextAction?: string;
  hasMemoryContext: boolean;
}

export interface ScoreAssistantRequestContext {
  activeView?: string;
  selectedInvoiceId?: string;
  scoreContext?: ScoreAssistantContextSnapshot;
}

export interface ScoreAssistantChatRequest {
  messages: ScoreAssistantMessage[];
  context?: ScoreAssistantRequestContext;
}

export interface ScoreAssistantStatusResponse {
  enabled: boolean;
  mode: ScoreAssistantMode;
  userId: string;
  userName: string;
  hasMemoryContext: boolean;
}

export interface ScoreAssistantChatResponse {
  answer: string;
  mode: ScoreAssistantMode;
  memorySignalsUsed: string[];
  suggestedNextAction?: string;
}
