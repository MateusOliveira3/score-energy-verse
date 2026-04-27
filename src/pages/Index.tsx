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
import DynamicContextPanel, {
  DynamicContextPanelView,
} from '../components/DynamicContextPanel';
import LiveMascotJourney, {
  JourneyQuickAccessId,
  JourneyTarget,
} from '../components/LiveMascotJourney';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMvpJourney } from '@/hooks/useMvpJourney';
import { getInvoiceFlowSnapshot, logInvoiceFlow } from '@/lib/invoiceFlowDebug';
import { buildAnalysisSummary } from '@/lib/mvpCoreFlow';
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
  score: 'score',
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

const Index = () => {
  const { toast } = useToast();
  const {
    profile,
    mascotCustomization,
    profileCompletion,
    isProfileComplete,
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
  } = useMvpJourney();
  const initialPanelView: DynamicContextPanelView = !isProfileComplete
    ? 'profile'
    : nextActions.length > 0
      ? 'actions'
      : latestAnalysis
        ? 'summary'
        : 'score';
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceData | undefined>(latestInvoice);
  const [activeSection, setActiveSection] = React.useState<DashboardSectionKey>('score');
  const [showLegacyDetails, setShowLegacyDetails] = React.useState(false);
  const [interactionFeedback, setInteractionFeedback] = React.useState<InteractionFeedbackEvent | null>(null);
  const [contextPanel, setContextPanel] = React.useState<ContextPanelState>({
    view: initialPanelView,
  });
  const feedbackTimeoutRef = React.useRef<number | null>(null);

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
    setSelectedInvoice((currentSelection) => {
      if (!latestInvoice) {
        return undefined;
      }

      if (!currentSelection) {
        return latestInvoice;
      }

      const preservedSelection = invoiceHistory.find(
        (invoice) => invoice.fingerprint === currentSelection.fingerprint
      );

      return preservedSelection ?? latestInvoice;
    });
  }, [invoiceHistory, latestInvoice]);

  const completedSteps = [
    isProfileComplete,
    Boolean(latestInvoice),
    Boolean(latestAnalysis),
  ].filter(Boolean).length;

  const efficiencyLabel = latestAnalysis?.efficiencyLabel || 'Aguardando primeira leitura';
  const selectedAnalysis = React.useMemo(() => {
    if (!selectedInvoice) {
      return undefined;
    }

    return buildAnalysisSummary(selectedInvoice, profile, invoiceHistory);
  }, [invoiceHistory, profile, selectedInvoice]);
  const primaryJourneyAction =
    nextActions.find((action) => action.status !== 'completed') || nextActions[0];

  const focusContextPanel = React.useCallback(
    (view: DynamicContextPanelView, payload?: Omit<ContextPanelState, 'view'>) => {
      setContextPanel({
        view,
        ...payload,
      });
    },
    []
  );

  const handleQuickAccessSelect = React.useCallback(
    (shortcutId: JourneyQuickAccessId) => {
      focusContextPanel(panelViewByShortcut[shortcutId]);
    },
    [focusContextPanel]
  );

  const focusJourneyTarget = React.useCallback(
    (target: JourneyTarget) => {
      if (target === 'upload') {
        document.getElementById('section-mvp')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        return;
      }

      const nextView = panelViewByTarget[target];

      if (nextView) {
        focusContextPanel(nextView);
      }
    },
    [focusContextPanel]
  );

  const activeQuickAccessId = React.useMemo<JourneyQuickAccessId>(() => {
    if (contextPanel.view === 'history') {
      return 'history';
    }

    if (contextPanel.view === 'actions') {
      return 'actions';
    }

    if (contextPanel.view === 'summary' || contextPanel.view === 'co2') {
      return 'summary';
    }

    if (contextPanel.view === 'profile') {
      return 'profile';
    }

    return 'score';
  }, [contextPanel.view]);

  const handleInvoiceProcessed = async (file: File) => {
    return completeInvoiceFlow(file);
  };

  const handleActionStatusChange = (
    action: NextAction,
    status: Extract<NextActionStatus, 'in_progress' | 'completed'>
  ) => {
    triggerInteractionFeedback(status === 'completed' ? 'action_completed' : 'action_started');
    updateActionStatus(action, status);

    toast({
      title: status === 'completed' ? 'Acao testada' : 'Acao iniciada',
      description:
        status === 'completed'
          ? `Voce marcou "${action.title}" como testada na jornada.`
          : `Voce comecou "${action.title}" e registrou progresso real na jornada.`,
    });
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
    toast({
      title: 'Fatura removida',
      description: 'O historico da jornada MVP foi atualizado sem depender do fluxo legado.',
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#124640_0%,#0c332f_28%,#082c28_58%,#072521_100%)]">
      <main className="mx-auto flex w-[93vw] max-w-[1460px] flex-col gap-7 px-0 py-8">
        <LiveMascotJourney
          guidance={mascotGuidance}
          nextActions={nextActions}
          invoiceCount={invoiceHistory.length}
          isProfileComplete={isProfileComplete}
          latestAnalysis={latestAnalysis}
          customization={mascotCustomization}
          profile={profile}
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
                activeActionsCount={nextActions.length}
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
            <DynamicContextPanel
              activeView={contextPanel.view}
              activeTip={contextPanel.tip}
              activeObjective={contextPanel.objective}
              guidance={mascotGuidance}
              nextAction={primaryJourneyAction}
              actions={nextActions}
              latestAnalysis={latestAnalysis}
              invoiceHistory={invoiceHistory}
              selectedInvoice={selectedInvoice}
              profileCompletion={profileCompletion}
              profile={profile}
              scoreState={scoreState}
              scoreExplanation={scoreExplanation}
              onOpenActions={() => focusContextPanel('actions')}
              onOpenHistory={() => focusContextPanel('history')}
              onOpenSummary={() => focusContextPanel('summary')}
              onOpenProfileDetails={() => focusContextPanel('profile')}
              onOpenScoreDetails={() => focusContextPanel('score')}
              onSelectInvoice={(invoice) => {
                setSelectedInvoice(invoice);
                focusContextPanel('history');
              }}
              contextQuestion={mascotContextQuestion}
              onContextQuestionAnswer={handleContextQuestionAnswer}
              onContextQuestionIgnore={ignoreMascotContextQuestion}
            />
          }
        />

        <section
          id="section-mvp"
          className="rounded-[24px] border border-[#264c46] bg-[#0d332f]/90 p-5 text-white shadow-[0_14px_34px_rgba(0,0,0,0.16)]"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
                Fluxo complementar
              </p>
              <h2 className="text-xl font-semibold text-[#f5f8f3]">Enviar fatura</h2>
            </div>
            <div className="text-sm text-[#c5d8c8]">
              O hub continua sendo o destino principal; o upload fica abaixo como etapa operacional.
            </div>
          </div>

          <InvoiceUpload
            profile={profile}
            onUploadStarted={startInvoiceProcessing}
            onInvoiceProcessed={handleInvoiceProcessed}
          />
        </section>

        <section className="rounded-[24px] border border-[#264c46] bg-[#0a2c28]/85 p-5 text-white">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
                Ferramentas complementares
              </p>
              <h2 className="text-xl font-semibold text-[#f5f8f3]">Detalhes completos abaixo do hub</h2>
              <p className="mt-1 text-sm text-[#c5d8c8]">
                Estes paineis continuam disponiveis, mas foram rebaixados para nao competir com a macroestrutura principal.
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
                          invoiceCount={invoiceHistory.length}
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
                      invoice={selectedInvoice}
                      selectedInvoice={selectedInvoice}
                      analysis={selectedAnalysis}
                      profile={profile}
                      invoiceHistory={invoiceHistory}
                      onSelectInvoice={setSelectedInvoice}
                      isExpanded
                      showHeader={false}
                    />
                  )}

                  {activeSection === 'actions' && (
                    <SmartRecommendations
                      actions={nextActions}
                      viewedActionIds={viewedActionIds}
                      analysis={selectedAnalysis}
                      invoiceHistory={invoiceHistory}
                      selectedInvoice={selectedInvoice}
                      profile={profile}
                      userContext={userContext}
                      onSelectInvoice={setSelectedInvoice}
                      onActionStatusChange={handleActionStatusChange}
                      isExpanded
                      showHeader={false}
                    />
                  )}

                  {activeSection === 'history' && (
                    <InvoiceHistory
                      invoices={invoiceHistory}
                      selectedInvoice={selectedInvoice}
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
