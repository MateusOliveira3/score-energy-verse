import React from 'react';
import Header from '../components/Header';
import ScoreCard from '../components/ScoreCard';
import LevelProgress from '../components/LevelProgress';
import ScoreExplanationCard from '../components/ScoreExplanationCard';
import InvoiceUpload from '../components/InvoiceUpload';
import InvoiceHistory from '../components/InvoiceHistory';
import SmartRecommendations from '../components/SmartRecommendations';
import UserProfile from '../components/UserProfile';
import MascotCustomization from '../components/MascotCustomization';
import AnalysisSummary from '../components/AnalysisSummary';
import MascotGuidanceCard from '../components/MascotGuidanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMvpJourney } from '@/hooks/useMvpJourney';
import { NextAction, NextActionStatus } from '@/types/mvp';

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
    updateProfile,
    updateMascotCustomization,
    startInvoiceProcessing,
    completeInvoiceFlow,
    removeInvoiceFromHistory,
    updateActionStatus,
    answerMascotContextQuestion,
    ignoreMascotContextQuestion,
  } = useMvpJourney();

  const completedSteps = [
    isProfileComplete,
    Boolean(latestInvoice),
    Boolean(latestAnalysis),
  ].filter(Boolean).length;

  const efficiencyLabel = latestAnalysis?.efficiencyLabel || 'Aguardando primeira leitura';

  const handleInvoiceProcessed = (file: File) => {
    completeInvoiceFlow(file);
  };

  const handleActionStatusChange = (
    action: NextAction,
    status: Extract<NextActionStatus, 'in_progress' | 'completed'>
  ) => {
    updateActionStatus(action, status);

    toast({
      title: status === 'completed' ? 'Ação testada' : 'Ação iniciada',
      description:
        status === 'completed'
          ? `Você marcou "${action.title}" como testada na jornada.`
          : `Você começou "${action.title}" e registrou progresso real na jornada.`,
    });
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
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          <div className="xl:col-span-2">
            <Card className="border-2 border-emerald-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-emerald-700">Perfil e Score Energy</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                <div className="space-y-5 xl:col-span-3">
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
                </div>

                <div className="space-y-4 xl:col-span-2">
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
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <MascotGuidanceCard
              guidance={mascotGuidance}
              score={scoreState.score}
              level={scoreState.level}
              profile={profile}
              customization={mascotCustomization}
              contextQuestion={mascotContextQuestion}
              onContextQuestionAnswer={answerMascotContextQuestion}
              onContextQuestionIgnore={ignoreMascotContextQuestion}
            />
          </div>
        </div>

        <SmartRecommendations
          actions={nextActions}
          viewedActionIds={viewedActionIds}
          invoice={latestInvoice}
          analysis={latestAnalysis}
          onActionStatusChange={handleActionStatusChange}
        />

        <InvoiceUpload
          profile={profile}
          onUploadStarted={startInvoiceProcessing}
          onInvoiceProcessed={handleInvoiceProcessed}
        />

        <AnalysisSummary invoice={latestInvoice} analysis={latestAnalysis} profile={profile} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <InvoiceHistory invoices={invoiceHistory} onDeleteInvoice={handleInvoiceRemoved} />
          </div>
          <ScoreExplanationCard explanation={scoreExplanation} />
        </div>
      </main>
    </div>
  );
};

export default Index;
