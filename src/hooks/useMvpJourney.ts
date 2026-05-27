import { useEffect, useMemo, useState } from 'react';
import {
  buildAnalysisSummary,
  buildMascotGuidance,
  buildNextActions,
  createScoreEvent,
  getProfileCompletion,
  getScoreState,
  interpretInvoiceFile,
  isProfileComplete,
  setActiveEnergyBehaviorProfile,
} from '@/lib/mvpCoreFlow';
import {
  addScoreEvent,
  answerMascotContextQuestion as applyMascotContextAnswer,
  buildMascotContextQuestion,
  buildInvoiceHistory,
  captureActionSnapshotsForInvoice,
  DEFAULT_MVP_STATE,
  getLatestInvoiceHistoryEntry,
  getScoreExplanation,
  ignoreMascotContextQuestion as applyMascotContextIgnore,
  pruneInvoiceHistory,
  resolveFullJourneyState,
  setAnalysis,
  setAnalysisProcessing,
  updateActions,
  updateActionStatus as applyActionStatus,
  updateMascot,
  updateProfile as applyProfileUpdate,
  markActionViewed as applyActionViewed,
} from '@/lib/mvpJourneyState';
import { getInvoiceFlowSnapshot, logInvoiceFlow } from '@/lib/invoiceFlowDebug';
import { useJourneyIdentity } from '@/hooks/useJourneyIdentity';
import { getMvpJourneyService } from '@/services/mvpJourney';
import {
  AnalysisSummary,
  MascotGuidance,
  MascotContextQuestionId,
  MascotContextQuestionValue,
  MvpState,
  NextAction,
  NextActionStatus,
  UserProfileData,
  MascotCustomizationData,
} from '@/types/mvp';

export const useMvpJourney = () => {
  const { journeyIdentity, loading: identityLoading } = useJourneyIdentity();
  const resolveAndSyncJourneyState = (nextState: MvpState) => {
    const resolvedState = resolveFullJourneyState(nextState);
    setActiveEnergyBehaviorProfile(resolvedState.energyBehaviorProfile);
    return resolvedState;
  };
  const [state, setState] = useState<MvpState>(() => resolveAndSyncJourneyState(DEFAULT_MVP_STATE));
  const [storageLoaded, setStorageLoaded] = useState(false);
  const journeyService = getMvpJourneyService();

  useEffect(() => {
    let isActive = true;

    if (identityLoading || !journeyIdentity) {
      setStorageLoaded(false);
      return () => {
        isActive = false;
      };
    }

    setStorageLoaded(false);
    void journeyService
      .loadJourneyState({
        userId: journeyIdentity.userId,
        identitySource: journeyIdentity.source,
        isFallbackIdentity: journeyIdentity.isFallback,
      })
      .then((loadedState) => {
        if (!isActive) {
          return;
        }

        setState(resolveAndSyncJourneyState(loadedState));
      })
      .finally(() => {
        if (isActive) {
          setStorageLoaded(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, [identityLoading, journeyIdentity, journeyService]);

  useEffect(() => {
    if (!storageLoaded || !journeyIdentity) {
      return;
    }

    logInvoiceFlow('journey-save-requested', {
      providerUserId: journeyIdentity.userId,
      journeyStage: state.journeyStage,
      invoiceHistoryLength: state.analysis.invoiceHistory.length,
      latestInvoice: getInvoiceFlowSnapshot(state.analysis.latestInvoice),
    });

    void journeyService.saveJourneyState({
      userId: journeyIdentity.userId,
      identitySource: journeyIdentity.source,
      isFallbackIdentity: journeyIdentity.isFallback,
      state,
    });
  }, [journeyIdentity, journeyService, state, storageLoaded]);

  const handleStateUpdate = (updater: (currentState: MvpState) => MvpState) => {
    setState((currentState) => resolveAndSyncJourneyState(updater(currentState)));
  };

  const updateProfile = (profile: UserProfileData) => {
    handleStateUpdate((currentState) => {
      let nextState = applyProfileUpdate(currentState, profile);

      if (isProfileComplete(nextState.profile)) {
        nextState = addScoreEvent(
          nextState,
          createScoreEvent(
            'profile_completed',
            'profile-completed',
            'Perfil concluido com contexto suficiente para personalizar a jornada'
          )
        );
      }

      return {
        ...nextState,
        journeyStage: nextState.analysis.summary ? nextState.journeyStage : 'before-upload',
      };
    });
  };

  const updateMascotCustomization = (customization: MascotCustomizationData) => {
    handleStateUpdate((currentState) => updateMascot(currentState, customization));
  };

  const startInvoiceProcessing = () => {
    handleStateUpdate((currentState) => setAnalysisProcessing(currentState));
  };

  const completeInvoiceFlow = async (file: File) => {
    const currentState = resolveFullJourneyState(state);
    const completedAt = new Date().toISOString();
    const actionSnapshots = captureActionSnapshotsForInvoice(currentState.actions);
    const parsedInvoice = await interpretInvoiceFile(file, currentState.profile);
    const invoice = {
      ...parsedInvoice,
      uploadedAt: completedAt,
      actionSnapshots: actionSnapshots.length > 0 ? actionSnapshots : undefined,
    };

    logInvoiceFlow('final-invoice-before-save', {
      completedAt,
      latestInvoice: getInvoiceFlowSnapshot(invoice),
    });

    handleStateUpdate((latestState) => {
      const analysis = buildAnalysisSummary(
        invoice,
        latestState.profile,
        latestState.analysis.invoiceHistory,
        latestState.energyBehaviorProfile
      );
      const nextActions = buildNextActions(
        invoice,
        analysis,
        latestState.profile,
        latestState.userContext,
        latestState.energyBehaviorProfile
      );
      const nextInvoiceHistory = buildInvoiceHistory(latestState.analysis.invoiceHistory, invoice);

      let nextState = setAnalysis(latestState, {
        latestInvoice: invoice,
        invoiceHistory: nextInvoiceHistory,
        summary: analysis,
        status: 'ready',
        completedAt,
      });

      nextState = updateActions(nextState, {
        items: nextActions,
        viewedActionIds: [],
      });

      nextState = addScoreEvent(
        nextState,
        createScoreEvent(
          'invoice_uploaded',
          `invoice-uploaded:${invoice.fingerprint}`,
          `Fatura ${invoice.month} enviada para interpretacao`
        )
      );

      nextState = addScoreEvent(
        nextState,
        createScoreEvent(
          'analysis_completed',
          `analysis-completed:${invoice.fingerprint}`,
          `Resumo da fatura ${invoice.month} concluido`
        )
      );

      return {
        ...nextState,
        journeyStage: 'analysis-ready',
      };
    });

    return invoice;
  };

  const removeInvoiceFromHistory = (fingerprint: string) => {
    handleStateUpdate((currentState) => {
      const nextInvoiceHistory = pruneInvoiceHistory(currentState.analysis.invoiceHistory, fingerprint);

      if (nextInvoiceHistory.length === currentState.analysis.invoiceHistory.length) {
        return currentState;
      }

      const latestHistoryInvoice = getLatestInvoiceHistoryEntry(nextInvoiceHistory);

      if (!latestHistoryInvoice) {
        let nextState = setAnalysis(currentState, {
          latestInvoice: undefined,
          invoiceHistory: [],
          summary: undefined,
          status: 'idle',
          completedAt: undefined,
        });

        nextState = updateActions(nextState, {
          items: buildNextActions(
            undefined,
            undefined,
            currentState.profile,
            currentState.userContext,
            currentState.energyBehaviorProfile
          ),
          viewedActionIds: [],
        });

        return {
          ...nextState,
          journeyStage: isProfileComplete(currentState.profile) ? 'before-upload' : 'onboarding',
        };
      }

      const fallbackAnalysis = buildAnalysisSummary(
        latestHistoryInvoice,
        currentState.profile,
        nextInvoiceHistory,
        currentState.energyBehaviorProfile
      );
      const fallbackActions = buildNextActions(
        latestHistoryInvoice,
        fallbackAnalysis,
        currentState.profile,
        currentState.userContext,
        currentState.energyBehaviorProfile
      );
      const viewedFallbackActionIds = currentState.actions.viewedActionIds.filter((viewedActionId) =>
        fallbackActions.some((action) => action.id === viewedActionId)
      );

      let nextState = setAnalysis(currentState, {
        latestInvoice: latestHistoryInvoice,
        invoiceHistory: nextInvoiceHistory,
        summary: fallbackAnalysis,
        status: 'ready',
        completedAt:
          latestHistoryInvoice.uploadedAt ??
          currentState.analysis.lastCompletedAt ??
          new Date().toISOString(),
      });

      nextState = updateActions(nextState, {
        items: fallbackActions,
        viewedActionIds: viewedFallbackActionIds,
      });

      return {
        ...nextState,
        journeyStage: 'analysis-ready',
      };
    });
  };

  const markActionViewed = (action: NextAction) => {
    handleStateUpdate((currentState) => {
      if (currentState.actions.viewedActionIds.includes(action.id)) {
        return currentState;
      }

      let nextState = applyActionViewed(currentState, action.id);
      nextState = addScoreEvent(
        nextState,
        createScoreEvent(
          'action_viewed',
          `action-viewed:${action.id}`,
          `Acao priorizada revisada: ${action.title}`
        )
      );

      return nextState;
    });
  };

  const updateActionStatus = (
    action: NextAction,
    status: Extract<NextActionStatus, 'in_progress' | 'completed'>
  ) => {
    handleStateUpdate((currentState) => {
      if (action.pendingAnswer?.persistOnly) {
        return applyActionStatus(currentState, action, status);
      }

      const wasAlreadyViewed = currentState.actions.viewedActionIds.includes(action.id);
      let nextState = applyActionStatus(currentState, action, status);
      const isNowViewed = nextState.actions.viewedActionIds.includes(action.id);

      if (!wasAlreadyViewed && isNowViewed) {
        nextState = addScoreEvent(
          nextState,
          createScoreEvent(
            'action_viewed',
            `action-viewed:${action.id}`,
            `Acao priorizada iniciada: ${action.title}`
          )
        );
      }

      return nextState;
    });
  };

  const answerMascotContextQuestion = (
    questionId: MascotContextQuestionId,
    value: MascotContextQuestionValue
  ) => {
    handleStateUpdate((currentState) =>
      applyMascotContextAnswer(currentState, questionId, value)
    );
  };

  const ignoreMascotContextQuestion = (questionId: MascotContextQuestionId) => {
    handleStateUpdate((currentState) => applyMascotContextIgnore(currentState, questionId));
  };

  const profileCompletion = useMemo(() => getProfileCompletion(state.profile), [state.profile]);
  const scoreState = useMemo(() => getScoreState(state.scoreEvents), [state.scoreEvents]);
  const scoreExplanation = useMemo(() => getScoreExplanation(state), [state]);
  const mascotContextQuestion = useMemo(
    () =>
      buildMascotContextQuestion({
        analysis: state.analysis,
        actions: state.actions,
        userContext: state.userContext,
      }),
    [state.actions, state.analysis, state.userContext]
  );
  const mascotGuidance: MascotGuidance = useMemo(
    () =>
      buildMascotGuidance({
        stage: state.journeyStage,
        profile: state.profile,
        invoice: state.analysis.latestInvoice,
        analysis: state.analysis.summary,
        userContext: state.userContext,
      }),
    [
      state.analysis.latestInvoice,
      state.analysis.summary,
      state.journeyStage,
      state.profile,
      state.userContext,
    ]
  );

  return {
    profile: state.profile,
    mascotCustomization: state.mascot,
    profileCompletion,
    isProfileComplete: isProfileComplete(state.profile),
    isJourneyHydrated: storageLoaded,
    energyBehaviorProfile: state.energyBehaviorProfile,
    latestInvoice: state.analysis.latestInvoice,
    invoiceHistory: state.analysis.invoiceHistory,
    latestAnalysis: state.analysis.summary as AnalysisSummary | undefined,
    nextActions: state.actions.items,
    viewedActionIds: state.actions.viewedActionIds,
    scoreEvents: state.scoreEvents,
    scoreState,
    scoreExplanation,
    journeyStage: state.journeyStage,
    mascotGuidance,
    mascotContextQuestion,
    userContext: state.userContext,
    updateProfile,
    updateMascotCustomization,
    startInvoiceProcessing,
    completeInvoiceFlow,
    removeInvoiceFromHistory,
    markActionViewed,
    updateActionStatus,
    answerMascotContextQuestion,
    ignoreMascotContextQuestion,
  };
};
