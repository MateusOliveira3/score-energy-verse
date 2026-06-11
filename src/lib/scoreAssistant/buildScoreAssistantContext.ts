import { buildAnalysisSummary, getScoreState } from '../mvpCoreFlow';
import { buildMemorySnapshot } from '../memorySnapshot';
import { getCurrentJourneyInvoice } from '../mvpJourneyState';
import type { InvoiceData, MvpState } from '../types/mvp';
import type { ScoreAssistantContextSnapshot } from './types';

interface BuildScoreAssistantContextInput {
  activeView?: string;
  selectedInvoiceId?: string;
  state: MvpState;
}

const uniqueStrings = (values: Array<string | undefined | null>) =>
  Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim())
    )
  );

const getInvoiceLabel = (invoice?: InvoiceData) =>
  invoice?.month?.trim() || invoice?.parser.fields.referenceMonth.value?.trim() || undefined;

const findSelectedInvoice = (state: MvpState, selectedInvoiceId?: string) => {
  if (selectedInvoiceId) {
    const explicitInvoice = state.analysis.invoiceHistory.find(
      (invoice) => invoice.fingerprint === selectedInvoiceId
    );

    if (explicitInvoice) {
      return explicitInvoice;
    }
  }

  return getCurrentJourneyInvoice(state.analysis.invoiceHistory, state.analysis.latestInvoice);
};

export const buildScoreAssistantContext = ({
  activeView,
  selectedInvoiceId,
  state,
}: BuildScoreAssistantContextInput): ScoreAssistantContextSnapshot => {
  const selectedInvoice = findSelectedInvoice(state, selectedInvoiceId);
  const analysis =
    selectedInvoice &&
    selectedInvoice.fingerprint !== state.analysis.latestInvoice?.fingerprint
      ? buildAnalysisSummary(
          selectedInvoice,
          state.profile,
          state.analysis.invoiceHistory,
          state.energyBehaviorProfile
        )
      : state.analysis.summary;
  const scoreState = getScoreState(state.scoreEvents);
  const memorySnapshot = buildMemorySnapshot(state);
  const suggestedNextAction = state.actions.items.find((action) => action.status !== 'completed');
  const learnedKnowledge = memorySnapshot.memoryKnowledge.items
    .filter((item) => item.learned)
    .map((item) => item.title);
  const recentActions = state.actions.items
    .filter((action) => action.status && action.status !== 'new')
    .slice(0, 4)
    .map((action) => `${action.title} (${action.status})`);
  const loadHypotheses = uniqueStrings([
    ...(analysis?.behaviorHighlights ?? []),
    analysis?.whatMattersNext,
    analysis?.consultiveInsight?.headline,
    analysis?.consultiveInsight?.evidence,
  ]).slice(0, 4);
  const memorySignals = uniqueStrings([
    ...memorySnapshot.memoryProfile.confirmedSignals,
    ...memorySnapshot.memoryInsights.facts,
    ...memorySnapshot.memoryInsights.confirmedContext,
  ]).slice(0, 6);
  const energySignals = uniqueStrings([
    ...memorySnapshot.memoryInsights.observedBehavior,
    ...(analysis?.behaviorHighlights ?? []),
    analysis?.headline,
    analysis?.efficiencyLabel,
  ]).slice(0, 6);
  const knownGaps = uniqueStrings(memorySnapshot.memoryGaps.items).slice(0, 5);
  const invoiceHistorySummary = uniqueStrings([
    state.analysis.invoiceHistory.length > 0
      ? `${state.analysis.invoiceHistory.length} fatura(s) no historico`
      : 'Nenhuma fatura no historico ainda',
    selectedInvoice ? `Fatura em foco: ${getInvoiceLabel(selectedInvoice)}` : undefined,
    state.analysis.latestInvoice ? `Ultima fatura: ${getInvoiceLabel(state.analysis.latestInvoice)}` : undefined,
  ]);
  const comparisonSummary =
    state.analysis.invoiceHistory.length >= 2 && analysis
      ? `${analysis.headline}. ${analysis.whatMattersNext}`
      : analysis?.headline;
  const userProfileSummary = uniqueStrings([
    `Tipo de consumidor: ${state.profile.consumerType}`,
    state.profile.location ? `Localizacao: ${state.profile.location}` : undefined,
    state.profile.peopleCount > 0 ? `Pessoas no imovel: ${state.profile.peopleCount}` : undefined,
    state.profile.propertySize > 0 ? `Tamanho do imovel: ${state.profile.propertySize} m2` : undefined,
    state.profile.energyPreference ? `Preferencia energetica: ${state.profile.energyPreference}` : undefined,
  ]);
  const hasMemoryContext =
    memorySignals.length > 0 ||
    learnedKnowledge.length > 0 ||
    state.analysis.invoiceHistory.length > 0 ||
    recentActions.length > 0;

  return {
    activeView,
    selectedInvoiceId: selectedInvoice?.fingerprint ?? selectedInvoiceId,
    selectedInvoiceLabel: getInvoiceLabel(selectedInvoice),
    userProfileSummary,
    scoreSummary: `Score ${scoreState.score} no nivel ${scoreState.level}`,
    invoiceHistorySummary,
    comparisonSummary,
    energySignals,
    learnedKnowledge,
    recentActions,
    knownGaps,
    loadHypotheses,
    memorySignals,
    suggestedNextAction: suggestedNextAction?.title,
    hasMemoryContext,
  };
};
