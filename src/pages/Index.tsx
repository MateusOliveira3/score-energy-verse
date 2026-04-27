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
  JourneyShortcut,
  JourneyShortcutId,
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

const hubShortcuts: JourneyShortcut[] = [
  {
    id: 'score',
    label: 'Score',
    hint: 'Ver pontuacao, nivel e proximo marco.',
  },
  {
    id: 'history',
    label: 'Historico',
    hint: 'Trocar a leitura para a linha do tempo.',
  },
  {
    id: 'actions',
    label: 'Acoes',
    hint: 'Abrir as recomendacoes prioritarias.',
  },
  {
    id: 'summary',
    label: 'Leitura',
    hint: 'Retomar o que a ultima fatura mostrou.',
  },
  {
    id: 'profile',
    label: 'Perfil',
    hint: 'Revisar o contexto que sustenta o score.',
  },
];

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
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceData | undefined>(latestInvoice);
  const [activeSection, setActiveSection] = React.useState<DashboardSectionKey | null>(null);
  const [interactionFeedback, setInteractionFeedback] = React.useState<InteractionFeedbackEvent | null>(null);
  const [contextPanel, setContextPanel] = React.useState<ContextPanelState>({
    view: 'mascot',
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

  const openDetailedSection = React.useCallback(
    (section: DashboardSectionKey, view?: DynamicContextPanelView) => {
      setActiveSection(section);

      if (view) {
        focusContextPanel(view);
      }

      window.setTimeout(() => {
        document.getElementById('section-detail-hub')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 120);
    },
    [focusContextPanel]
  );

  const handleHubShortcutSelect = React.useCallback(
    (shortcutId: JourneyShortcutId) => {
      const nextView: Record<JourneyShortcutId, DynamicContextPanelView> = {
        score: 'score',
        history: 'history',
        actions: 'actions',
        summary: 'summary',
        profile: 'profile',
      };

      focusContextPanel(nextView[shortcutId]);
    },
    [focusContextPanel]
  );

  const focusJourneyTarget = React.useCallback(
    (target: JourneyTarget) => {
      const sectionTargets: Record<
        JourneyTarget,
        { id: string; section?: DashboardSectionKey; view?: DynamicContextPanelView }
      > = {
        profile: { id: 'section-detail-hub', section: 'profile', view: 'profile' },
        upload: { id: 'section-mvp' },
        summary: { id: 'section-detail-hub', section: 'summary', view: 'summary' },
        actions: { id: 'section-detail-hub', section: 'actions', view: 'actions' },
        history: { id: 'section-detail-hub', section: 'history', view: 'history' },
      };
      const nextTarget = sectionTargets[target];

      if (nextTarget.section) {
        setActiveSection(nextTarget.section);
      }

      if (nextTarget.view) {
        focusContextPanel(nextTarget.view);
      }

      window.setTimeout(() => {
        document.getElementById(nextTarget.id)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, nextTarget.section ? 140 : 0);
    },
    [focusContextPanel]
  );

  const activeShortcutId = React.useMemo<JourneyShortcutId | null>(() => {
    if (contextPanel.view === 'score') {
      return 'score';
    }

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

    return null;
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50">
      <main className="container mx-auto space-y-8 px-4 py-8">
        <LiveMascotJourney
          guidance={mascotGuidance}
          nextActions={nextActions}
          invoiceCount={invoiceHistory.length}
          profileCompletion={profileCompletion}
          isProfileComplete={isProfileComplete}
          latestAnalysis={latestAnalysis}
          customization={mascotCustomization}
          profile={profile}
          onNavigate={focusJourneyTarget}
          onMascotInteract={() => focusContextPanel('mascot')}
          onCo2Interact={(payload) => focusContextPanel('co2', payload)}
          shortcuts={hubShortcuts}
          activeShortcutId={activeShortcutId}
          onShortcutSelect={handleHubShortcutSelect}
          scorePanel={
            <div className="space-y-3">
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
              onOpenActions={() => openDetailedSection('actions', 'actions')}
              onOpenHistory={() => openDetailedSection('history', 'history')}
              onOpenSummary={() => openDetailedSection('summary', 'summary')}
              onOpenProfileDetails={() => openDetailedSection('profile', 'profile')}
              onOpenScoreDetails={() => openDetailedSection('score', 'score')}
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

        <div id="section-mvp">
          <InvoiceUpload
            profile={profile}
            onUploadStarted={startInvoiceProcessing}
            onInvoiceProcessed={handleInvoiceProcessed}
          />
        </div>

        {activeSection && (
          <section id="section-detail-hub">
            <Card className="overflow-hidden border border-slate-200 bg-white/85 shadow-lg">
              <CardHeader className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-slate-900">
                      {detailSectionMeta[activeSection].title}
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      {detailSectionMeta[activeSection].description}
                    </p>
                  </div>

                  <Button variant="ghost" onClick={() => setActiveSection(null)}>
                    Fechar painel detalhado
                  </Button>
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
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;
