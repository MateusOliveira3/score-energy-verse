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
} from '@/lib/mvpCoreFlow';
import {
  addScoreEvent,
  buildInvoiceHistory,
  DEFAULT_MVP_STATE,
  getLatestInvoiceHistoryEntry,
  pruneInvoiceHistory,
  resolveFullJourneyState,
  setAnalysis,
  setAnalysisProcessing,
  updateActions,
  updateMascot,
  updateProfile as applyProfileUpdate,
  markActionViewed as applyActionViewed,
} from '@/lib/mvpJourneyState';
import { useJourneyIdentity } from '@/hooks/useJourneyIdentity';
import { getMvpJourneyService } from '@/services/mvpJourney';
import {
  AnalysisSummary,
  MascotGuidance,
  MvpState,
  NextAction,
  UserProfileData,
  MascotCustomizationData,
} from '@/types/mvp';

export const useMvpJourney = () => {
  const { journeyIdentity, loading: identityLoading } = useJourneyIdentity();
  const [state, setState] = useState<MvpState>(() => resolveFullJourneyState(DEFAULT_MVP_STATE));
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

        setState(resolveFullJourneyState(loadedState));
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

    void journeyService.saveJourneyState({
      userId: journeyIdentity.userId,
      identitySource: journeyIdentity.source,
      isFallbackIdentity: journeyIdentity.isFallback,
      state,
    });
  }, [journeyIdentity, journeyService, state, storageLoaded]);

  const handleStateUpdate = (updater: (currentState: MvpState) => MvpState) => {
    setState((currentState) => resolveFullJourneyState(updater(currentState)));
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

  const completeInvoiceFlow = (file: File) => {
    handleStateUpdate((currentState) => {
      const completedAt = new Date().toISOString();
      const invoice = {
        ...interpretInvoiceFile(file, currentState.profile),
        uploadedAt: completedAt,
      };
      const analysis = buildAnalysisSummary(invoice, currentState.profile);
      const nextActions = buildNextActions(invoice, analysis, currentState.profile);
      const nextInvoiceHistory = buildInvoiceHistory(currentState.analysis.invoiceHistory, invoice);

      let nextState = setAnalysis(currentState, {
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
          items: buildNextActions(undefined, undefined, currentState.profile),
          viewedActionIds: [],
        });

        return {
          ...nextState,
          journeyStage: isProfileComplete(currentState.profile) ? 'before-upload' : 'onboarding',
        };
      }

      const fallbackAnalysis = buildAnalysisSummary(latestHistoryInvoice, currentState.profile);
      const fallbackActions = buildNextActions(
        latestHistoryInvoice,
        fallbackAnalysis,
        currentState.profile
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

  const profileCompletion = useMemo(() => getProfileCompletion(state.profile), [state.profile]);
  const scoreState = useMemo(() => getScoreState(state.scoreEvents), [state.scoreEvents]);
  const mascotGuidance: MascotGuidance = useMemo(
    () =>
      buildMascotGuidance({
        stage: state.journeyStage,
        profile: state.profile,
        invoice: state.analysis.latestInvoice,
        analysis: state.analysis.summary,
      }),
    [state.analysis.latestInvoice, state.analysis.summary, state.journeyStage, state.profile]
  );

  return {
    profile: state.profile,
    mascotCustomization: state.mascot,
    profileCompletion,
    isProfileComplete: isProfileComplete(state.profile),
    latestInvoice: state.analysis.latestInvoice,
    invoiceHistory: state.analysis.invoiceHistory,
    latestAnalysis: state.analysis.summary as AnalysisSummary | undefined,
    nextActions: state.actions.items,
    viewedActionIds: state.actions.viewedActionIds,
    scoreEvents: state.scoreEvents,
    scoreState,
    journeyStage: state.journeyStage,
    mascotGuidance,
    updateProfile,
    updateMascotCustomization,
    startInvoiceProcessing,
    completeInvoiceFlow,
    removeInvoiceFromHistory,
    markActionViewed,
  };
};
