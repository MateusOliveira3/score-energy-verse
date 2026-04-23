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
import { NextAction } from '@/types/mvp';

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
    updateProfile,
    updateMascotCustomization,
    startInvoiceProcessing,
    completeInvoiceFlow,
    removeInvoiceFromHistory,
    markActionViewed,
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

  const handleActionViewed = (action: NextAction) => {
    const alreadyViewed = viewedActionIds.includes(action.id);
    markActionViewed(action);

    if (!alreadyViewed) {
      toast({
        title: 'Acao revisada',
        description: `Voce ganhou visibilidade sobre "${action.title}" e registrou esse passo no score.`,
      });
    }
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
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          <div className="xl:col-span-2 space-y-8">
            <Card className="border-2 border-emerald-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-emerald-700">Contexto do Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
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
                    <span>Completacao do perfil</span>
                    <span>{profileCompletion}%</span>
                  </div>
                  <Progress value={profileCompletion} className="h-3" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-slate-500">Tipo</div>
                    <div className="font-semibold text-slate-800">{profile.consumerType}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-slate-500">Local</div>
                    <div className="font-semibold text-slate-800">
                      {profile.location || 'Nao informado'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-slate-500">Imovel</div>
                    <div className="font-semibold text-slate-800">
                      {profile.propertySize > 0 ? `${profile.propertySize} m2` : 'Nao informado'}
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
              </CardContent>
            </Card>

            <InvoiceUpload
              profile={profile}
              onUploadStarted={startInvoiceProcessing}
              onInvoiceProcessed={handleInvoiceProcessed}
            />

            <AnalysisSummary invoice={latestInvoice} analysis={latestAnalysis} profile={profile} />
          </div>

          <div className="space-y-8">
            <MascotGuidanceCard
              guidance={mascotGuidance}
              score={scoreState.score}
              level={scoreState.level}
              profile={profile}
              customization={mascotCustomization}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 space-y-8">
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

          <div className="xl:col-span-1">
            <SmartRecommendations
              actions={nextActions}
              viewedActionIds={viewedActionIds}
              invoice={latestInvoice}
              analysis={latestAnalysis}
              onActionViewed={handleActionViewed}
            />
          </div>
        </div>

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
