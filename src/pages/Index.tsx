import React from 'react';
import ScoreCard from '../components/ScoreCard';
import LevelProgress from '../components/LevelProgress';
import EnergyProgressVisual from '../components/EnergyProgressVisual';
import ScoreExplanationCard from '../components/ScoreExplanationCard';
import InvoiceUpload from '../components/InvoiceUpload';
import InvoiceHistory from '../components/InvoiceHistory';
import SmartRecommendations from '../components/SmartRecommendations';
import UserProfile from '../components/UserProfile';
import MascotCustomization from '../components/MascotCustomization';
import ProfileMascotAmbient from '../components/ProfileMascotAmbient';
import AnalysisSummary from '../components/AnalysisSummary';
import MemoryPanel from '../components/MemoryPanel';
import DynamicContextPanel, {
  DynamicContextPanelView,
} from '../components/DynamicContextPanel';
import LiveMascotJourney, {
  JourneyQuickAccessId,
  JourneyTarget,
} from '../components/LiveMascotJourney';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMvpJourney } from '@/hooks/useMvpJourney';
import { getInvoiceFlowSnapshot, logInvoiceFlow } from '@/lib/invoiceFlowDebug';
import { buildAnalysisSummary, buildNextActions } from '@/lib/mvpCoreFlow';
import { buildMemorySnapshot } from '@/lib/memorySnapshot';
import { getCurrentJourneyInvoice, isCurrentJourneyInvoice } from '@/lib/mvpJourneyState';
import { InvoiceData, NextAction, NextActionStatus } from '@/types/mvp';

type DashboardSectionKey = 'profile' | 'score' | 'summary' | 'actions' | 'history';
type InteractionFeedbackSource = 'action_started' | 'action_completed' | 'observation_saved';

interface InteractionFeedbackEvent {
  id: number;
  source: InteractionFeedbackSource;
}

interface ContextPanelState {
  objective?: string;
  tip?: string;
  view: DynamicContextPanelView;
}

const detailSectionMeta: Record<
  DashboardSectionKey,
  {
    description: string;
    title: string;
  }
> = {
  profile: {
    title: 'Perfil e personalizacao',
    description: 'Edicao do perfil e ajustes de identidade do mascote.',
  },
  score: {
    title: 'Leitura detalhada do score',
    description: 'Explicacao do score, progresso e sinais de evolucao.',
  },
  summary: {
    title: 'Leitura da fatura',
    description: 'Analise expandida da fatura em foco.',
  },
  actions: {
    title: 'Recomendacoes',
    description: 'Acoes orientadas pela leitura atual.',
  },
  history: {
    title: 'Historico',
    description: 'Linha do tempo das faturas ja enviadas.',
  },
};

const panelViewByShortcut: Record<JourneyQuickAccessId, DynamicContextPanelView> = {
  history: 'history',
  actions: 'actions',
  summary: 'summary',
  profile: 'profile',
};

const panelViewByTarget: Partial<Record<JourneyTarget, DynamicContextPanelView>> = {
  profile: 'profile',
  summary: 'summary',
  actions: 'actions',
  history: 'history',
};

const detailButtons: Array<{ id: DashboardSectionKey; label: string }> = [
  { id: 'score', label: 'Score' },
  { id: 'profile', label: 'Perfil' },
  { id: 'summary', label: 'Leitura' },
  { id: 'actions', label: 'Acoes' },
  { id: 'history', label: 'Historico' },
];

const resolveInitialPanelView = ({
  isProfileComplete,
  latestAnalysis,
  nextActions,
}: {
  isProfileComplete: boolean;
  latestAnalysis?: ReturnType<typeof buildAnalysisSummary>;
  nextActions: NextAction[];
}): DynamicContextPanelView => {
  if (!isProfileComplete) {
    return 'profile';
  }

  if (nextActions.length > 0) {
    return 'actions';
  }

  if (latestAnalysis) {
    return 'summary';
  }

  return 'history';
};

const Index = () => {
  const {
    journeyState,
    profile,
    mascotCustomization,
    profileCompletion,
    isProfileComplete,
    isJourneyHydrated,
    energyBehaviorProfile,
    knowledgeState,
    latestInvoice,
    invoiceHistory,
    latestAnalysis,
    nextActions,
    viewedActionIds,
    scoreState,
    scoreExplanation,
    mascotGuidance,
    mascotContextQuestion,
    userContext,
    updateProfile,
    updateMascotCustomization,
    startInvoiceProcessing,
    completeInvoiceFlow,
    removeInvoiceFromHistory,
    updateActionStatus,
    answerMascotContextQuestion,
    ignoreMascotContextQuestion,
    markKnowledgeLearned,
  } = useMvpJourney();
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceData | undefined>(undefined);
  const [activeSection, setActiveSection] = React.useState<DashboardSectionKey>('summary');
  const [showLegacyDetails, setShowLegacyDetails] = React.useState(false);
  const [isHistoryUploadVisible, setIsHistoryUploadVisible] = React.useState(false);
  const [interactionFeedback, setInteractionFeedback] = React.useState<InteractionFeedbackEvent | null>(null);
  const [contextPanel, setContextPanel] = React.useState<ContextPanelState | null>(null);
  const feedbackTimeoutRef = React.useRef<number | null>(null);
  const wasJourneyHydratedRef = React.useRef(false);
  const hydratedInvoiceHistory = React.useMemo(
    () => (isJourneyHydrated ? invoiceHistory : []),
    [invoiceHistory, isJourneyHydrated]
  );
  const hydratedLatestInvoice = React.useMemo(
    () => (isJourneyHydrated ? latestInvoice : undefined),
    [isJourneyHydrated, latestInvoice]
  );
  const hydratedLatestAnalysis = React.useMemo(
    () => (isJourneyHydrated ? latestAnalysis : undefined),
    [isJourneyHydrated, latestAnalysis]
  );
  const hydratedNextActions = React.useMemo(
    () => (isJourneyHydrated ? nextActions : []),
    [isJourneyHydrated, nextActions]
  );
  const currentJourneyInvoice = getCurrentJourneyInvoice(
    hydratedInvoiceHistory,
    hydratedLatestInvoice
  );

  const triggerInteractionFeedback = React.useCallback((source: InteractionFeedbackSource) => {
    const nextEvent = {
      id: Date.now(),
      source,
    };

    setInteractionFeedback(nextEvent);

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setInteractionFeedback((currentEvent) =>
        currentEvent?.id === nextEvent.id ? null : currentEvent
      );
      feedbackTimeoutRef.current = null;
    }, 1400);
  }, []);

  React.useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    logInvoiceFlow('ui-received-invoice-data', {
      invoiceHistoryLength: invoiceHistory.length,
      latestInvoice: getInvoiceFlowSnapshot(latestInvoice),
    });
  }, [invoiceHistory.length, latestInvoice]);

  React.useEffect(() => {
    if (!isJourneyHydrated) {
      wasJourneyHydratedRef.current = false;
      setSelectedInvoice(undefined);
      setIsHistoryUploadVisible(false);
      setContextPanel(null);
      return;
    }

    setSelectedInvoice((currentSelection) => {
      if (!currentJourneyInvoice) {
        return undefined;
      }

      if (!currentSelection) {
        return currentJourneyInvoice;
      }

      const preservedSelection = invoiceHistory.find(
        (invoice) => invoice.fingerprint === currentSelection.fingerprint
      );

      return preservedSelection ?? currentJourneyInvoice;
    });

    if (!wasJourneyHydratedRef.current) {
      setIsHistoryUploadVisible(invoiceHistory.length === 0);
      setContextPanel({
        view: resolveInitialPanelView({
          isProfileComplete,
          latestAnalysis,
          nextActions,
        }),
      });
    }

    wasJourneyHydratedRef.current = true;
  }, [
    currentJourneyInvoice,
    invoiceHistory,
    isJourneyHydrated,
    isProfileComplete,
    latestAnalysis,
    nextActions,
  ]);

  const completedSteps = [
    isProfileComplete,
    Boolean(hydratedLatestInvoice),
    Boolean(hydratedLatestAnalysis),
  ].filter(Boolean).length;

  const efficiencyLabel = hydratedLatestAnalysis?.efficiencyLabel || 'Aguardando primeira leitura';
  const focusedInvoice = selectedInvoice ?? currentJourneyInvoice;
  const isCurrentJourneyFocus = isCurrentJourneyInvoice(
    hydratedInvoiceHistory,
    focusedInvoice,
    hydratedLatestInvoice
  );
  const selectedAnalysis = React.useMemo(() => {
    if (!isJourneyHydrated || !focusedInvoice) {
      return undefined;
    }

    if (isCurrentJourneyFocus) {
      return hydratedLatestAnalysis;
    }

    return buildAnalysisSummary(
      focusedInvoice,
      profile,
      hydratedInvoiceHistory,
      energyBehaviorProfile
    );
  }, [
    energyBehaviorProfile,
    focusedInvoice,
    hydratedInvoiceHistory,
    hydratedLatestAnalysis,
    isCurrentJourneyFocus,
    isJourneyHydrated,
    profile,
  ]);
  const activeNextActions = isJourneyHydrated
    ? isCurrentJourneyFocus
      ? hydratedNextActions
      : focusedInvoice && selectedAnalysis
        ? buildNextActions(
            focusedInvoice,
            selectedAnalysis,
            profile,
            userContext,
            energyBehaviorProfile
          )
        : []
    : [];
  const primaryJourneyAction =
    activeNextActions.find((action) => action.status !== 'completed') || activeNextActions[0];
  const memorySnapshot = React.useMemo(
    () =>
      isJourneyHydrated
        ? buildMemorySnapshot(journeyState, focusedInvoice)
        : undefined,
    [focusedInvoice, isJourneyHydrated, journeyState]
  );

  const focusContextPanel = React.useCallback(
    (view: DynamicContextPanelView, payload?: Omit<ContextPanelState, 'view'>) => {
      if (view !== 'history') {
        setIsHistoryUploadVisible(false);
      }

      setContextPanel({
        view,
        ...payload,
      });
    },
    []
  );

  const handleQuickAccessSelect = React.useCallback(
    (shortcutId: JourneyQuickAccessId) => {
      if (shortcutId === 'history') {
        setIsHistoryUploadVisible(hydratedInvoiceHistory.length === 0);
      }

      focusContextPanel(panelViewByShortcut[shortcutId]);
    },
    [focusContextPanel, hydratedInvoiceHistory.length]
  );

  const focusJourneyTarget = React.useCallback(
    (target: JourneyTarget) => {
      if (target === 'upload') {
        setIsHistoryUploadVisible(true);
        focusContextPanel('history');
        return;
      }

      const nextView = panelViewByTarget[target];

      if (nextView) {
        if (nextView === 'history') {
          setIsHistoryUploadVisible(hydratedInvoiceHistory.length === 0);
        }

        focusContextPanel(nextView);
      }
    },
    [focusContextPanel, hydratedInvoiceHistory.length]
  );

  const contextPanelView = contextPanel?.view;

  const activeQuickAccessId = React.useMemo<JourneyQuickAccessId>(() => {
    if (!contextPanelView) {
      return 'history';
    }

    if (contextPanelView === 'history') {
      return 'history';
    }

    if (contextPanelView === 'actions') {
      return 'actions';
    }

    if (contextPanelView === 'summary' || contextPanelView === 'co2') {
      return 'summary';
    }

    if (contextPanelView === 'profile') {
      return 'profile';
    }

    return 'history';
  }, [contextPanelView]);

  const handleInvoiceProcessed = async (file: File) => {
    const processedInvoice = await completeInvoiceFlow(file);

    if (processedInvoice) {
      setSelectedInvoice(processedInvoice);
      setIsHistoryUploadVisible(false);
      focusContextPanel('history');
    }

    return processedInvoice;
  };

  const handleActionStatusChange = (
    action: NextAction,
    status: Extract<NextActionStatus, 'in_progress' | 'completed'>
  ) => {
    updateActionStatus(action, status);
  };

  const handleContextQuestionAnswer = (
    questionId: Parameters<typeof answerMascotContextQuestion>[0],
    value: Parameters<typeof answerMascotContextQuestion>[1]
  ) => {
    triggerInteractionFeedback('observation_saved');
    answerMascotContextQuestion(questionId, value);
  };

  const handleInvoiceRemoved = (fingerprint: string) => {
    removeInvoiceFromHistory(fingerprint);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#124640_0%,#0c332f_28%,#082c28_58%,#072521_100%)]">
      <main className="mx-auto flex w-[93vw] max-w-[1460px] flex-col gap-7 px-0 py-8">
        <LiveMascotJourney
          guidance={mascotGuidance}
          nextActions={activeNextActions}
          invoiceCount={hydratedInvoiceHistory.length}
          isProfileComplete={isProfileComplete}
          currentScore={scoreState.score}
          latestAnalysis={hydratedLatestAnalysis}
          customization={mascotCustomization}
          profile={profile}
          knowledgeState={knowledgeState}
          onNavigate={focusJourneyTarget}
          onMascotInteract={() => focusContextPanel('mascot')}
          onCo2Interact={(payload) => focusContextPanel('co2', payload)}
          activeQuickAccessId={activeQuickAccessId}
          onQuickAccessChange={handleQuickAccessSelect}
          scorePanel={
            <div className="min-h-[430px] overflow-hidden rounded-[28px] border border-[#2a5c56] bg-[#3f7959] text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <ScoreCard
                score={scoreState.score}
                level={scoreState.level}
                consumerType={profile.consumerType}
                mascotCustomization={mascotCustomization}
                latestScoreLabel={scoreExplanation.summary}
                completedSteps={completedSteps}
                activeActionsCount={activeNextActions.length}
                efficiencyLabel={efficiencyLabel}
                showMascot={false}
                variant="compact"
              />
              <LevelProgress
                score={scoreState.score}
                level={scoreState.level}
                nextLevelScore={scoreState.nextLevelScore}
                progress={scoreState.progressToNextLevel}
                variant="compact"
              />
            </div>
          }
          contextPanel={
            contextPanel ? (
              <DynamicContextPanel
                activeView={contextPanel.view}
                activeTip={contextPanel.tip}
                activeObjective={contextPanel.objective}
                guidance={mascotGuidance}
                nextAction={primaryJourneyAction}
                actions={activeNextActions}
                latestAnalysis={hydratedLatestAnalysis}
                invoiceHistory={hydratedInvoiceHistory}
                selectedInvoice={focusedInvoice}
                isCurrentJourneyFocus={isCurrentJourneyFocus}
                profileCompletion={profileCompletion}
                profile={profile}
                isProfileComplete={isProfileComplete}
                userContext={userContext}
                energyBehaviorProfile={energyBehaviorProfile}
                knowledgeState={knowledgeState}
                onOpenActions={() => focusContextPanel('actions')}
                onOpenHistory={() => focusContextPanel('history')}
                onOpenSummary={() => focusContextPanel('summary')}
                onOpenProfileDetails={() => focusContextPanel('profile')}
                onKnowledgeLearned={markKnowledgeLearned}
                onSelectInvoice={(invoice) => {
                  setSelectedInvoice(invoice);
                  focusContextPanel('history');
                }}
                onActionStatusChange={handleActionStatusChange}
                onProfileUpdate={updateProfile}
                isHistoryUploadVisible={isHistoryUploadVisible}
                onToggleHistoryUpload={() =>
                  setIsHistoryUploadVisible((currentValue) => !currentValue)
                }
                historyUploadContent={
                  <InvoiceUpload
                    profile={profile}
                    onUploadStarted={startInvoiceProcessing}
                    onInvoiceProcessed={handleInvoiceProcessed}
                    onUploadCompleted={(invoice) => {
                      if (invoice) {
                        setSelectedInvoice(invoice);
                      }
                    }}
                    variant="embedded"
                  />
                }
                contextQuestion={isJourneyHydrated ? mascotContextQuestion : undefined}
                onContextQuestionAnswer={handleContextQuestionAnswer}
                onContextQuestionIgnore={ignoreMascotContextQuestion}
              />
            ) : null
          }
        />

        {memorySnapshot && <MemoryPanel snapshot={memorySnapshot} />}

        <section className="rounded-[24px] border border-[#264c46] bg-[#0a2c28]/85 p-5 text-white">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
                Ferramentas complementares
              </p>
              <h2 className="text-xl font-semibold text-[#f5f8f3]">Detalhes completos abaixo do hub</h2>
              <p className="mt-1 text-sm text-[#c5d8c8]">
                O hub agora concentra historico, leitura, acoes e perfil. Estes paineis ficam abaixo apenas como leitura complementar.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowLegacyDetails((currentValue) => !currentValue)}
              className="rounded-[14px] border-[#365f58] bg-[#103a35] text-[#f5f8f3] hover:bg-[#18453f]"
            >
              {showLegacyDetails ? 'Ocultar detalhes' : 'Mostrar detalhes'}
            </Button>
          </div>

          {showLegacyDetails && (
            <div className="mt-5 space-y-5">
              <div className="flex flex-wrap gap-2">
                {detailButtons.map((button) => (
                  <Button
                    key={button.id}
                    variant={activeSection === button.id ? 'default' : 'outline'}
                    onClick={() => setActiveSection(button.id)}
                    className={
                      activeSection === button.id
                        ? 'rounded-[12px] bg-[#5f925c] hover:bg-[#517d4f]'
                        : 'rounded-[12px] border-[#365f58] bg-[#103a35] text-[#f5f8f3] hover:bg-[#18453f]'
                    }
                  >
                    {button.label}
                  </Button>
                ))}
              </div>

              <Card className="overflow-hidden border border-[#365f58] bg-[#0d332f] text-white shadow-none">
                <CardHeader className="border-b border-[#264c46] bg-[#103a35]">
                  <div className="space-y-1">
                    <CardTitle className="text-[#f5f8f3]">
                      {detailSectionMeta[activeSection].title}
                    </CardTitle>
                    <p className="text-sm text-[#c5d8c8]">
                      {detailSectionMeta[activeSection].description}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6">
                  {activeSection === 'score' && (
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1fr)]">
                      <div className="space-y-4">
                        <LevelProgress
                          score={scoreState.score}
                          level={scoreState.level}
                          nextLevelScore={scoreState.nextLevelScore}
                          progress={scoreState.progressToNextLevel}
                        />
                        <EnergyProgressVisual
                          invoiceCount={hydratedInvoiceHistory.length}
                          interactionEvent={interactionFeedback}
                        />
                      </div>

                      <ScoreExplanationCard explanation={scoreExplanation} />
                    </div>
                  )}

                  {activeSection === 'profile' && (
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.6fr)]">
                      <div className="space-y-5">
                        <div className="flex flex-wrap gap-3">
                          <UserProfile
                            value={profile}
                            completionPercent={profileCompletion}
                            isComplete={isProfileComplete}
                            onProfileUpdate={updateProfile}
                          />
                          <MascotCustomization
                            value={mascotCustomization}
                            onCustomizationUpdate={updateMascotCustomization}
                            currentScore={scoreState.score}
                          />
                        </div>
                      </div>

                      <ProfileMascotAmbient />
                    </div>
                  )}

                  {activeSection === 'summary' && (
                    <AnalysisSummary
                      invoice={focusedInvoice}
                      selectedInvoice={focusedInvoice}
                      analysis={selectedAnalysis}
                      profile={profile}
                      energyBehaviorProfile={energyBehaviorProfile}
                      invoiceHistory={hydratedInvoiceHistory}
                      isCurrentJourneyFocus={isCurrentJourneyFocus}
                      onSelectInvoice={setSelectedInvoice}
                      isExpanded
                      showHeader={false}
                      showEducationalContent={false}
                    />
                  )}

                  {activeSection === 'actions' && (
                    <SmartRecommendations
                      actions={activeNextActions}
                      viewedActionIds={viewedActionIds}
                      analysis={selectedAnalysis}
                      invoiceHistory={hydratedInvoiceHistory}
                      selectedInvoice={focusedInvoice}
                      isCurrentJourneyFocus={isCurrentJourneyFocus}
                      profile={profile}
                      userContext={userContext}
                      energyBehaviorProfile={energyBehaviorProfile}
                      onSelectInvoice={setSelectedInvoice}
                      onActionStatusChange={handleActionStatusChange}
                      isExpanded
                      showHeader={false}
                      showEducationalContent={false}
                    />
                  )}

                  {activeSection === 'history' && (
                    <InvoiceHistory
                      invoices={hydratedInvoiceHistory}
                      selectedInvoice={focusedInvoice}
                      onSelectInvoice={setSelectedInvoice}
                      onDeleteInvoice={handleInvoiceRemoved}
                      userContext={userContext}
                      isExpanded
                      showHeader={false}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
