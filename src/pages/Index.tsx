import React from 'react';
import DynamicContextPanel, {
  DynamicContextPanelView,
} from '@/components/DynamicContextPanel';
import InvoiceUpload from '@/components/InvoiceUpload';
import MascotCustomization from '@/components/MascotCustomization';
import MemoryPanel from '@/components/MemoryPanel';
import GuidedConversationSession from '@/components/nucleo/GuidedConversationSession';
import { Button } from '@/components/ui/button';
import { useJourneyIdentity } from '@/hooks/useJourneyIdentity';
import { buildRuntimeCoreExperience } from '@/lib/cognitive';
import { useMvpJourney } from '@/hooks/useMvpJourney';
import {
  buildGuidedConversationViewModel,
  GuidedConversationActionQuestion,
  GuidedConversationContextQuestion,
} from '@/lib/guidedConversation';
import { buildMemorySnapshot } from '@/lib/memorySnapshot';
import { buildNucleoSessionViewModel } from '@/lib/nucleoSession';
import { buildAnalysisSummary, buildNextActions } from '@/lib/mvpCoreFlow';
import { getCurrentJourneyInvoice, isCurrentJourneyInvoice } from '@/lib/mvpJourneyState';
import {
  InvoiceData,
  NextAction,
  NextActionStatus,
} from '@/types/mvp';

type DetailSectionKey = 'profile' | 'summary' | 'actions' | 'history' | 'memory';

const detailMeta: Record<
  DetailSectionKey,
  {
    description: string;
    title: string;
  }
> = {
  profile: {
    title: 'Base da jornada',
    description: 'O contexto que ajuda a conta a parecer mais sua desde o comeco.',
  },
  summary: {
    title: 'Leitura do ciclo',
    description: 'O que esta conta ja me permite mostrar com honestidade.',
  },
  actions: {
    title: 'Continuidade do ciclo',
    description: 'O que vale observar agora para a proxima leitura ficar melhor.',
  },
  history: {
    title: 'Evolucao entre contas',
    description: 'Como a leitura muda quando uma conta encontra a outra.',
  },
  memory: {
    title: 'O que permanece com a Score',
    description: 'O que a Score continua lembrando da sua casa ao longo do tempo.',
  },
};

const panelViewBySection: Record<
  Exclude<DetailSectionKey, 'memory'>,
  DynamicContextPanelView
> = {
  profile: 'profile',
  summary: 'summary',
  actions: 'actions',
  history: 'history',
};

const resolveInitialDetailSection = ({
  hasAnalysis,
  hasInvoice,
  hasNextActions,
  isProfileComplete,
}: {
  hasAnalysis: boolean;
  hasInvoice: boolean;
  hasNextActions: boolean;
  isProfileComplete: boolean;
}): DetailSectionKey => {
  if (!isProfileComplete) {
    return 'profile';
  }

  if (hasNextActions) {
    return 'actions';
  }

  if (hasAnalysis) {
    return 'summary';
  }

  if (hasInvoice) {
    return 'history';
  }

  return 'summary';
};

const Index = () => {
  const { journeyIdentity } = useJourneyIdentity();
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
    scoreState,
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
  const [detailSection, setDetailSection] = React.useState<DetailSectionKey>('summary');
  const [isDetailPanelVisible, setIsDetailPanelVisible] = React.useState(false);
  const [isHistoryUploadVisible, setIsHistoryUploadVisible] = React.useState(false);
  const wasJourneyHydratedRef = React.useRef(false);
  const detailPanelRef = React.useRef<HTMLElement | null>(null);

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

  React.useEffect(() => {
    if (!isJourneyHydrated) {
      wasJourneyHydratedRef.current = false;
      setSelectedInvoice(undefined);
      setIsHistoryUploadVisible(false);
      return;
    }

    setSelectedInvoice((currentSelection) => {
      if (!currentJourneyInvoice) {
        return undefined;
      }

      if (!currentSelection) {
        return currentJourneyInvoice;
      }

      const preservedSelection = hydratedInvoiceHistory.find(
        (invoice) => invoice.fingerprint === currentSelection.fingerprint
      );

      return preservedSelection ?? currentJourneyInvoice;
    });

    if (!wasJourneyHydratedRef.current) {
      setDetailSection(
        resolveInitialDetailSection({
          hasAnalysis: Boolean(hydratedLatestAnalysis),
          hasInvoice: Boolean(hydratedLatestInvoice),
          hasNextActions: hydratedNextActions.length > 0,
          isProfileComplete,
        })
      );
      setIsHistoryUploadVisible(hydratedInvoiceHistory.length === 0);
      wasJourneyHydratedRef.current = true;
    }
  }, [
    currentJourneyInvoice,
    hydratedInvoiceHistory,
    hydratedLatestAnalysis,
    hydratedLatestInvoice,
    hydratedNextActions.length,
    isJourneyHydrated,
    isProfileComplete,
  ]);

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

  const detailPrimaryAction =
    activeNextActions.find((action) => action.status !== 'completed') || activeNextActions[0];
  const conversationPrimaryAction =
    hydratedNextActions.find((action) => action.status !== 'completed') || hydratedNextActions[0];

  const detailMemorySnapshot = React.useMemo(
    () =>
      isJourneyHydrated
        ? buildMemorySnapshot(journeyState, focusedInvoice)
        : undefined,
    [focusedInvoice, isJourneyHydrated, journeyState]
  );
  const conversationMemorySnapshot = React.useMemo(
    () =>
      isJourneyHydrated
        ? buildMemorySnapshot(journeyState, hydratedLatestInvoice)
        : undefined,
    [hydratedLatestInvoice, isJourneyHydrated, journeyState]
  );

  const nucleoViewModel = React.useMemo(
    () =>
      buildNucleoSessionViewModel({
        isJourneyHydrated,
        isProfileComplete,
        journeyState,
        profile,
        scoreState,
        latestInvoice: hydratedLatestInvoice,
        invoiceHistory: hydratedInvoiceHistory,
        latestAnalysis: hydratedLatestAnalysis,
        nextActions: hydratedNextActions,
        knowledgeState,
        mascotGuidance,
        memorySnapshot: conversationMemorySnapshot,
      }),
    [
      conversationMemorySnapshot,
      hydratedInvoiceHistory,
      hydratedLatestAnalysis,
      hydratedLatestInvoice,
      hydratedNextActions,
      isJourneyHydrated,
      isProfileComplete,
      journeyState,
      knowledgeState,
      mascotGuidance,
      profile,
      scoreState,
    ]
  );
  const guidedConversationViewModel = React.useMemo(
    () =>
      buildGuidedConversationViewModel({
        contextQuestion: isJourneyHydrated ? mascotContextQuestion : undefined,
        energyBehaviorProfile,
        knowledgeState,
        latestAnalysis: hydratedLatestAnalysis,
        latestInvoice: hydratedLatestInvoice,
        memorySnapshot: conversationMemorySnapshot,
        profile,
        primaryAction: conversationPrimaryAction,
        viewModel: nucleoViewModel,
      }),
    [
      energyBehaviorProfile,
      conversationMemorySnapshot,
      conversationPrimaryAction,
      hydratedLatestAnalysis,
      hydratedLatestInvoice,
      isJourneyHydrated,
      knowledgeState,
      mascotContextQuestion,
      nucleoViewModel,
      profile,
    ]
  );
  const runtimeCoreExperience = React.useMemo(
    () =>
      buildRuntimeCoreExperience({
        isJourneyHydrated,
        userId: journeyIdentity?.userId,
        journeyState,
        memorySnapshot: conversationMemorySnapshot,
        scoreState,
      }),
    [
      conversationMemorySnapshot,
      isJourneyHydrated,
      journeyIdentity?.userId,
      journeyState,
      scoreState,
    ]
  );

  const handleOpenDetail = React.useCallback((section: DetailSectionKey) => {
    setDetailSection(section);
    setIsDetailPanelVisible(true);

    if (section === 'history' && hydratedInvoiceHistory.length === 0) {
      setIsHistoryUploadVisible(true);
    } else if (section !== 'history') {
      setIsHistoryUploadVisible(false);
    }
    window.requestAnimationFrame(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [hydratedInvoiceHistory.length]);

  const handleInvoiceProcessed = async (file: File) => {
    const processedInvoice = await completeInvoiceFlow(file);

    if (processedInvoice) {
      setSelectedInvoice(processedInvoice);
      setIsHistoryUploadVisible(false);
      setIsDetailPanelVisible(false);
    }

    return processedInvoice;
  };

  const handleActionStatusChange = React.useCallback(
    (action: NextAction, status: Extract<NextActionStatus, 'in_progress' | 'completed'>) => {
      updateActionStatus(action, status);
    },
    [updateActionStatus]
  );
  const handleGuidedActionAnswer = React.useCallback(
    (question: GuidedConversationActionQuestion, value: string) => {
      handleActionStatusChange(
        {
          ...question.action,
          pendingAnswer: {
            answer: value,
            answeredAt: new Date().toISOString(),
            persistOnly: true,
            questionId: question.id,
          },
        },
        'in_progress'
      );
    },
    [handleActionStatusChange]
  );

  const handleContextQuestionAnswer = React.useCallback(
    (
      questionId: Parameters<typeof answerMascotContextQuestion>[0],
      value: Parameters<typeof answerMascotContextQuestion>[1]
    ) => {
      answerMascotContextQuestion(questionId, value);
    },
    [answerMascotContextQuestion]
  );
  const handleGuidedContextQuestionAnswer = React.useCallback(
    (question: GuidedConversationContextQuestion, value: Parameters<typeof answerMascotContextQuestion>[1]) => {
      handleContextQuestionAnswer(question.id, value);
    },
    [handleContextQuestionAnswer]
  );
  const handleGuidedContextQuestionIgnore = React.useCallback(
    (question: GuidedConversationContextQuestion) => {
      ignoreMascotContextQuestion(question.id);
    },
    [ignoreMascotContextQuestion]
  );

  const renderAccountUnderstandingDetailPanel = () => {
    if (guidedConversationViewModel.state !== 'ready') {
      return null;
    }

    return (
      <section
        data-account-understanding-panel="true"
        className="score-card rounded-[24px] p-5 sm:p-6"
      >
        <div className="space-y-2">
          <p className="score-caption">Detalhes da leitura</p>
          <h3 className="score-display max-w-[16ch] text-2xl font-bold leading-[1.02] text-[var(--score-ink)] sm:text-[2rem]">
            {guidedConversationViewModel.accountUnderstanding.title}
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-[var(--score-ink-soft)]">
            {guidedConversationViewModel.accountUnderstanding.intro}
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {guidedConversationViewModel.accountUnderstanding.categories.map((category) => (
            <article
              key={category.id}
              data-understanding-category={category.id}
              data-understanding-level={category.level}
              data-understanding-open={category.isOpenQuestion ? 'true' : 'false'}
              data-understanding-open-point={category.openPoint ?? ''}
              data-understanding-support-count={category.supportCount}
              className="rounded-[20px] border border-[var(--score-line)] bg-[var(--score-surface-soft)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--score-ink)]">
                    {category.label}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--score-line)] bg-white px-2 py-1 text-[11px] text-[var(--score-ink-soft)]">
                  {category.supportCount} referencia{category.supportCount === 1 ? '' : 's'}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-[var(--score-ink)]">{category.reason}</p>

              <p className="mt-3 text-xs leading-5 text-[var(--score-ink-soft)]">
                {category.openPoint
                  ? `Ainda falta entender: ${category.openPoint}`
                  : 'Nada importante ficou pendente aqui por enquanto.'}
              </p>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderDetailContent = () => {
    if (detailSection === 'memory') {
      if (!detailMemorySnapshot) {
        return (
          <div className="rounded-[24px] border border-[var(--score-line)] bg-[var(--score-surface)] px-5 py-6 text-sm text-[var(--score-ink-soft)]">
            A memoria completa aparece assim que a jornada carrega perfil, faturas e sinais da leitura.
          </div>
        );
      }

      return <MemoryPanel snapshot={detailMemorySnapshot} />;
    }

    return (
      <div className="space-y-5">
        {detailSection === 'summary' && renderAccountUnderstandingDetailPanel()}

        <DynamicContextPanel
          activeView={panelViewBySection[detailSection]}
          guidance={mascotGuidance}
          nextAction={detailPrimaryAction}
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
          onOpenActions={() => handleOpenDetail('actions')}
          onOpenHistory={() => handleOpenDetail('history')}
          onOpenSummary={() => handleOpenDetail('summary')}
          onKnowledgeLearned={markKnowledgeLearned}
          onSelectInvoice={(invoice) => {
            setSelectedInvoice(invoice);
            setDetailSection('summary');
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

        {detailSection === 'profile' && (
          <div className="score-card rounded-[24px] p-5">
            <p className="score-caption">Mascote</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--score-ink)]">
              Personalizacao permanece disponivel
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--score-ink-soft)]">
              A identidade visual do mascote continua editavel sem voltar ao shell antigo.
            </p>
            <div className="mt-5">
              <MascotCustomization
                value={mascotCustomization}
                onCustomizationUpdate={updateMascotCustomization}
                currentScore={scoreState.score}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="score-shell min-h-screen">
      <main className="mx-auto flex w-[min(760px,calc(100vw-1.25rem))] flex-col gap-5 py-4 sm:w-[min(820px,92vw)] sm:gap-6 sm:py-6 lg:py-8">
        <GuidedConversationSession
          experience={runtimeCoreExperience}
          viewModel={guidedConversationViewModel}
          profileTask={
            <div className="score-card rounded-[26px] p-5">
              <DynamicContextPanel
                activeView="profile"
                guidance={mascotGuidance}
                nextAction={conversationPrimaryAction}
                actions={hydratedNextActions}
                latestAnalysis={hydratedLatestAnalysis}
                invoiceHistory={hydratedInvoiceHistory}
                selectedInvoice={hydratedLatestInvoice}
                isCurrentJourneyFocus
                profileCompletion={profileCompletion}
                profile={profile}
                isProfileComplete={isProfileComplete}
                userContext={userContext}
                energyBehaviorProfile={energyBehaviorProfile}
                knowledgeState={knowledgeState}
                onOpenActions={() => handleOpenDetail('actions')}
                onOpenHistory={() => handleOpenDetail('history')}
                onOpenSummary={() => handleOpenDetail('summary')}
                onKnowledgeLearned={markKnowledgeLearned}
                onSelectInvoice={(invoice) => setSelectedInvoice(invoice)}
                onActionStatusChange={handleActionStatusChange}
                onProfileUpdate={updateProfile}
                isHistoryUploadVisible={false}
                onToggleHistoryUpload={() => undefined}
              />
            </div>
          }
          uploadTask={
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-4">
              <InvoiceUpload
                profile={profile}
                variant="embedded"
                onUploadStarted={startInvoiceProcessing}
                onInvoiceProcessed={handleInvoiceProcessed}
                onUploadCompleted={(invoice) => {
                  if (invoice) {
                    setSelectedInvoice(invoice);
                  }
                }}
              />
            </div>
          }
          onActionQuestionAnswer={handleGuidedActionAnswer}
          onContextQuestionAnswer={handleGuidedContextQuestionAnswer}
          onContextQuestionIgnore={handleGuidedContextQuestionIgnore}
          onOpenDetails={handleOpenDetail}
        />

        <section ref={detailPanelRef} className={isDetailPanelVisible ? 'space-y-4' : 'pt-1'}>
          {!isDetailPanelVisible && (
            <div className="flex justify-center">
              <button
                type="button"
                className="text-sm text-[var(--score-ink-soft)] underline-offset-4 transition hover:text-[var(--score-ink)] hover:underline"
                onClick={() => handleOpenDetail('summary')}
              >
                Ver mais sobre esta conta
              </button>
            </div>
          )}

          {isDetailPanelVisible && (
            <>
              <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="score-caption">Detalhes da leitura</p>
                  <h2 className="score-display mt-2 text-2xl font-bold text-[var(--score-ink)] sm:text-[2rem]">
                    Ver mais sobre esta conta
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--score-ink-soft)]">
                    Se quiser, voce pode abrir detalhes complementares sem tirar o foco do que mais importa agora.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="rounded-full border-[var(--score-line)] bg-white text-[var(--score-ink-soft)] hover:bg-[var(--score-surface-soft)]"
                  onClick={() => setIsDetailPanelVisible(false)}
                >
                  Fechar detalhes
                </Button>
              </div>

              <div className="score-card overflow-hidden rounded-[28px]">
              <div className="border-b border-[var(--score-line)] bg-[var(--score-surface-soft)] px-5 py-5">
                <p className="score-caption">{detailMeta[detailSection].title}</p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--score-ink-soft)]">
                  {detailMeta[detailSection].description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(Object.keys(detailMeta) as DetailSectionKey[]).map((section) => (
                    <Button
                      key={section}
                      variant={detailSection === section ? 'default' : 'outline'}
                      className={
                        detailSection === section
                          ? 'rounded-full bg-[var(--score-green)] text-white hover:bg-[var(--score-green-deep)]'
                          : 'rounded-full border-[var(--score-line)] bg-white text-[var(--score-ink-soft)] hover:bg-[var(--score-surface-soft)]'
                      }
                      onClick={() => handleOpenDetail(section)}
                    >
                      {detailMeta[section].title}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="p-4 sm:p-5">{renderDetailContent()}</div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
