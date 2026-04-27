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
import MascotGuidanceCard from '../components/MascotGuidanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMvpJourney } from '@/hooks/useMvpJourney';
import { getInvoiceFlowSnapshot, logInvoiceFlow } from '@/lib/invoiceFlowDebug';
import { buildAnalysisSummary } from '@/lib/mvpCoreFlow';
import { InvoiceData, NextAction, NextActionStatus } from '@/types/mvp';

type DashboardSectionKey = 'summary' | 'actions' | 'history';
type InteractionFeedbackSource = 'action_started' | 'action_completed' | 'observation_saved';

interface InteractionFeedbackEvent {
  id: number;
  source: InteractionFeedbackSource;
}

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
  const [activeSection, setActiveSection] = React.useState<DashboardSectionKey | null>('summary');
  const [interactionFeedback, setInteractionFeedback] = React.useState<InteractionFeedbackEvent | null>(null);
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
  const historyPreviewMessage =
    invoiceHistory.length >= 3
      ? `Você já tem ${invoiceHistory.length} meses de histórico. Continue acompanhando para entender seu padrão.`
      : invoiceHistory.length === 1
        ? 'Adicione a próxima fatura para começar a ver evolução.'
        : undefined;

  const sectionCards = [
    {
      key: 'summary' as const,
      title: 'Resumo da analise',
      subtitle: selectedInvoice ? 'Leitura da fatura em foco' : 'Pronto para a primeira leitura',
    },
    {
      key: 'actions' as const,
      title: 'Acoes recomendadas',
      subtitle: 'Prioridades da jornada atual',
    },
    {
      key: 'history' as const,
      title: 'Historico de faturas',
      subtitle:
        invoiceHistory.length > 0
          ? `${invoiceHistory.length} fatura${invoiceHistory.length > 1 ? 's' : ''} na jornada`
          : 'Comparacao do historico enviado',
    },
  ];

  const handleSectionToggle = (section: DashboardSectionKey) => {
    setActiveSection((currentSection) => (currentSection === section ? null : section));
  };

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
      title: status === 'completed' ? 'Ação testada' : 'Ação iniciada',
      description:
        status === 'completed'
          ? `Você marcou "${action.title}" como testada na jornada.`
          : `Você começou "${action.title}" e registrou progresso real na jornada.`,
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
      description: 'O histórico da jornada MVP foi atualizado sem depender do fluxo legado.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          <div className="xl:col-span-2">
            <Card className="border-2 border-emerald-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-emerald-700">Perfil e Score Energy</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                <div id="section-profile" className="space-y-5 xl:col-span-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={isProfileComplete ? 'default' : 'secondary'}>
                      {isProfileComplete ? 'Perfil pronto para personalizar' : 'Perfil ainda parcial'}
                    </Badge>
                    <Badge variant="outline">{profile.consumerType}</Badge>
                    {profile.location && <Badge variant="outline">{profile.location}</Badge>}
                    {profile.energyPreference && <Badge variant="outline">{profile.energyPreference}</Badge>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Completação do perfil</span>
                      <span>{profileCompletion}%</span>
                    </div>
                    <Progress value={profileCompletion} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-slate-500">Tipo</div>
                      <div className="font-semibold text-slate-800">{profile.consumerType}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-slate-500">Local</div>
                      <div className="font-semibold text-slate-800">
                        {profile.location || 'Não informado'}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-slate-500">Imóvel</div>
                      <div className="font-semibold text-slate-800">
                        {profile.propertySize > 0 ? `${profile.propertySize} m2` : 'Não informado'}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-slate-500">Pessoas</div>
                      <div className="font-semibold text-slate-800">{profile.peopleCount}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-slate-500">Energia</div>
                      <div className="font-semibold text-slate-800">{profile.energyPreference}</div>
                    </div>
                  </div>

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

                  <div className="md:max-w-xl xl:max-w-none">
                    <ProfileMascotAmbient />
                  </div>
                </div>

                <div id="section-score" className="space-y-4 xl:col-span-2">
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
                  />
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
              </CardContent>
            </Card>
          </div>

          <div id="section-mascot" className="space-y-8">
            <MascotGuidanceCard
              guidance={mascotGuidance}
              score={scoreState.score}
              level={scoreState.level}
              profile={profile}
              customization={mascotCustomization}
              contextQuestion={mascotContextQuestion}
              onContextQuestionAnswer={handleContextQuestionAnswer}
              onContextQuestionIgnore={ignoreMascotContextQuestion}
            />
          </div>
        </div>

        <div id="section-mvp">
          <InvoiceUpload
            profile={profile}
            onUploadStarted={startInvoiceProcessing}
            onInvoiceProcessed={handleInvoiceProcessed}
          />
        </div>

        <section className="space-y-6">
          {historyPreviewMessage && (
            <Card className="border-slate-200 bg-white/80 shadow-sm">
              <CardContent className="p-4 text-sm text-slate-600">
                {historyPreviewMessage}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sectionCards.map((section) => {
              const isOpen = activeSection === section.key;

              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => handleSectionToggle(section.key)}
                  aria-pressed={isOpen}
                  aria-expanded={isOpen}
                  className="h-full text-left"
                >
                  <Card
                    className={`h-full border-2 transition-all duration-200 ${
                      isOpen
                        ? 'border-emerald-300 bg-white shadow-lg ring-2 ring-emerald-100'
                        : 'border-slate-200 bg-white/80 shadow-sm hover:border-emerald-200 hover:shadow-md'
                    }`}
                  >
                    <CardContent className="flex h-full flex-col gap-3 p-5">
                      <div className="space-y-1">
                        <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
                        <p className="text-sm text-slate-600">{section.subtitle}</p>
                      </div>
                      <div className="pt-1 text-sm font-medium text-slate-500">
                        {isOpen ? 'Aberto' : 'Fechado'}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>

          {activeSection === 'summary' && (
            <div id="section-summary">
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
            </div>
          )}

          {activeSection === 'actions' && (
            <div id="section-actions">
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
            </div>
          )}

          {activeSection === 'history' && (
            <div id="section-history">
              <InvoiceHistory
                invoices={invoiceHistory}
                selectedInvoice={selectedInvoice}
                onSelectInvoice={setSelectedInvoice}
                onDeleteInvoice={handleInvoiceRemoved}
                userContext={userContext}
                isExpanded
                showHeader={false}
              />
            </div>
          )}
        </section>

        <ScoreExplanationCard explanation={scoreExplanation} />
      </main>
    </div>
  );
};

export default Index;
