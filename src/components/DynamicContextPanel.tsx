import React from 'react';
import {
  BarChart3,
  Lightbulb,
  Sparkles,
  Sprout,
  UserRound,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  getEnergyKnowledgeCatalog,
  getLastLearnedEnergyKnowledge,
  getLearnedEnergyKnowledgeCount,
  getNextEnergyKnowledge,
  pickEnergyKnowledge,
} from '@/lib/energyKnowledge';
import {
  buildAnalysisSummary,
  buildMemoryFeedback,
  buildNextActions,
  describeAdaptiveAnswer,
} from '@/lib/mvpCoreFlow';
import {
  AnalysisSummary,
  EnergyBehaviorProfile,
  EnergyKnowledgeId,
  EnergyKnowledgeState,
  InvoiceData,
  MascotContextQuestion,
  MascotContextQuestionValue,
  MascotGuidance,
  NextAction,
  NextActionStatus,
  UserContextState,
  UserProfileData,
} from '@/types/mvp';
import DynamicContextActionsView from '@/components/dynamic-context/DynamicContextActionsView';
import DynamicContextHistoryView from '@/components/dynamic-context/DynamicContextHistoryView';
import DynamicContextKnowledgeView from '@/components/dynamic-context/DynamicContextKnowledgeView';
import DynamicContextProfileView from '@/components/dynamic-context/DynamicContextProfileView';
import DynamicContextSummaryView from '@/components/dynamic-context/DynamicContextSummaryView';
import {
  AdaptiveActionFeedbackState,
  buildHistoryTrendLine,
  getInsightContextLines,
  getInvoiceSortTime,
  InlineKnowledgeFeedbackState,
  InlineMemoryFeedbackState,
} from '@/lib/dynamicContextPanel';

export type DynamicContextPanelView =
  | 'mascot'
  | 'co2'
  | 'history'
  | 'actions'
  | 'summary'
  | 'profile';

interface DynamicContextPanelProps {
  activeView: DynamicContextPanelView;
  activeTip?: string;
  activeObjective?: string;
  guidance: MascotGuidance;
  nextAction?: NextAction;
  actions: NextAction[];
  latestAnalysis?: AnalysisSummary;
  invoiceHistory: InvoiceData[];
  selectedInvoice?: InvoiceData;
  isCurrentJourneyFocus?: boolean;
  profileCompletion: number;
  profile: UserProfileData;
  isProfileComplete: boolean;
  userContext?: Partial<UserContextState>;
  energyBehaviorProfile: EnergyBehaviorProfile;
  knowledgeState: EnergyKnowledgeState;
  contextQuestion?: MascotContextQuestion;
  onContextQuestionAnswer?: (
    questionId: MascotContextQuestion['id'],
    value: MascotContextQuestionValue
  ) => void;
  onContextQuestionIgnore?: (questionId: MascotContextQuestion['id']) => void;
  onKnowledgeLearned: (knowledgeId: EnergyKnowledgeId) => void;
  onOpenActions: () => void;
  onOpenHistory: () => void;
  onOpenSummary: () => void;
  onSelectInvoice?: (invoice: InvoiceData) => void;
  onActionStatusChange: (
    action: NextAction,
    status: Extract<NextActionStatus, 'in_progress' | 'completed'>
  ) => void;
  onProfileUpdate: (data: UserProfileData) => void;
  isHistoryUploadVisible: boolean;
  onToggleHistoryUpload: () => void;
  historyUploadContent?: React.ReactNode;
}

const panelMeta = {
  mascot: {
    title: 'Conhecimento Energetico',
    label: 'Aprendizado incorporado',
    description: 'O que voce aprendeu com a Score e ja faz parte da sua evolucao.',
    focusBadge: 'Conhecimento',
    icon: Sprout,
  },
  co2: {
    title: 'Canal educativo',
    label: 'Ponto educativo',
    description: 'Um conhecimento por vez, sem competir com leitura, memoria ou recomendacao.',
    focusBadge: 'Educacao',
    icon: Zap,
  },
  history: {
    title: 'Evolucao entre ciclos',
    label: 'Leitura acumulada',
    description: 'Como a jornada evoluiu entre contas, sem perder a fatura em foco.',
    focusBadge: 'Historico',
    icon: BarChart3,
  },
  actions: {
    title: 'Continuidade da jornada',
    label: 'Proximo passo guiado',
    description: 'A continuidade deste ciclo, com motivo, contexto e acompanhamento leve.',
    focusBadge: 'Acao',
    icon: Lightbulb,
  },
  summary: {
    title: 'Leitura do ciclo',
    label: 'Sintese atual',
    description: 'O que esta conta realmente mostra agora, com contexto e limites visiveis.',
    focusBadge: 'Resumo',
    icon: Sparkles,
  },
  profile: {
    title: 'Base da leitura',
    label: 'Contexto do usuario',
    description: 'A base que sustenta memoria, leitura e proximas continuidades da jornada.',
    focusBadge: 'Perfil',
    icon: UserRound,
  },
} as const;

const DynamicContextPanel = ({
  activeView,
  activeTip,
  activeObjective,
  guidance,
  nextAction,
  actions,
  latestAnalysis,
  invoiceHistory,
  selectedInvoice,
  isCurrentJourneyFocus = true,
  profileCompletion,
  profile,
  isProfileComplete,
  userContext,
  energyBehaviorProfile,
  knowledgeState,
  contextQuestion,
  onContextQuestionAnswer,
  onContextQuestionIgnore,
  onKnowledgeLearned,
  onOpenActions,
  onOpenHistory,
  onOpenSummary,
  onSelectInvoice,
  onActionStatusChange,
  onProfileUpdate,
  isHistoryUploadVisible,
  onToggleHistoryUpload,
  historyUploadContent,
}: DynamicContextPanelProps) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const [localActionFeedback, setLocalActionFeedback] = React.useState<
    Record<string, AdaptiveActionFeedbackState>
  >({});
  const [contextMemoryFeedback, setContextMemoryFeedback] =
    React.useState<InlineMemoryFeedbackState | null>(null);
  const [knowledgeFeedback, setKnowledgeFeedback] =
    React.useState<InlineKnowledgeFeedbackState | null>(null);
  const [dismissedKnowledgeIds, setDismissedKnowledgeIds] = React.useState<EnergyKnowledgeId[]>([]);
  const [historyFeedback, setHistoryFeedback] = React.useState<string | null>(null);
  const previousInvoiceCountRef = React.useRef(invoiceHistory.length);
  const previousActiveViewRef = React.useRef(activeView);
  const panelSignature = [
    activeView,
    activeTip,
    activeObjective,
    selectedInvoice?.fingerprint,
    nextAction?.id,
    profileCompletion,
    invoiceHistory.length,
    isHistoryUploadVisible ? 'upload-open' : 'upload-closed',
  ].join(':');

  const sortedInvoices = React.useMemo(
    () =>
      [...invoiceHistory]
        .sort((left, right) => getInvoiceSortTime(left) - getInvoiceSortTime(right))
        .slice(-5),
    [invoiceHistory]
  );
  const focusedInvoice = selectedInvoice;
  const maxConsumption = Math.max(
    ...sortedInvoices.map((invoice) =>
      typeof invoice.consumption === 'number' && Number.isFinite(invoice.consumption)
        ? invoice.consumption
        : 0
    ),
    1
  );
  const panelConfig = panelMeta[activeView];
  const PanelIcon = panelConfig.icon;
  const historyAverageConsumption =
    invoiceHistory.length > 0
      ? Math.round(
          invoiceHistory.reduce((sum, invoice) => sum + (invoice.consumption ?? 0), 0) /
            invoiceHistory.length
        )
      : undefined;
  const historyTrendLine = buildHistoryTrendLine(invoiceHistory, focusedInvoice);

  const contextAnalysis = React.useMemo(() => {
    if (!focusedInvoice) {
      return latestAnalysis;
    }

    if (isCurrentJourneyFocus) {
      return latestAnalysis;
    }

    return buildAnalysisSummary(focusedInvoice, profile, invoiceHistory, energyBehaviorProfile);
  }, [
    energyBehaviorProfile,
    focusedInvoice,
    invoiceHistory,
    isCurrentJourneyFocus,
    latestAnalysis,
    profile,
  ]);

  const prioritizedActions = React.useMemo(() => {
    if (isCurrentJourneyFocus) {
      return actions.slice(0, 2);
    }

    if (!focusedInvoice || !contextAnalysis) {
      return actions.slice(0, 2);
    }

    return buildNextActions(
      focusedInvoice,
      contextAnalysis,
      profile,
      userContext,
      energyBehaviorProfile
    ).slice(0, 2);
  }, [
    actions,
    contextAnalysis,
    energyBehaviorProfile,
    focusedInvoice,
    isCurrentJourneyFocus,
    profile,
    userContext,
  ]);

  const consultiveInsight = contextAnalysis?.consultiveInsight;
  const contextLines = getInsightContextLines(consultiveInsight);

  const activeKnowledge = React.useMemo(() => {
    if (activeView !== 'mascot' && activeView !== 'co2') {
      return null;
    }

    return pickEnergyKnowledge({
      activeObjective,
      activeTip,
      activeView,
      analysis: contextAnalysis,
      dismissedKnowledgeIds,
      energyBehaviorProfile,
      guidance,
      knowledgeState,
      nextAction,
      profile,
    });
  }, [
    activeObjective,
    activeTip,
    activeView,
    contextAnalysis,
    dismissedKnowledgeIds,
    energyBehaviorProfile,
    guidance,
    knowledgeState,
    nextAction,
    profile,
  ]);

  const knowledgeCatalog = React.useMemo(() => getEnergyKnowledgeCatalog(), []);
  const learnedKnowledgeCount = React.useMemo(
    () => getLearnedEnergyKnowledgeCount(knowledgeState),
    [knowledgeState]
  );
  const totalKnowledgeCount = knowledgeCatalog.length;
  const lastLearnedKnowledge = React.useMemo(
    () => getLastLearnedEnergyKnowledge(knowledgeState),
    [knowledgeState]
  );
  const nextKnowledge = React.useMemo(
    () => getNextEnergyKnowledge(knowledgeState) ?? activeKnowledge ?? undefined,
    [activeKnowledge, knowledgeState]
  );

  React.useEffect(() => {
    setIsVisible(false);

    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [panelSignature]);

  React.useEffect(() => {
    if (invoiceHistory.length > previousInvoiceCountRef.current) {
      setHistoryFeedback('Fatura adicionada ao historico');
    }

    previousInvoiceCountRef.current = invoiceHistory.length;
  }, [invoiceHistory.length]);

  React.useEffect(() => {
    if (!historyFeedback) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setHistoryFeedback(null);
    }, 3600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [historyFeedback]);

  React.useEffect(() => {
    setLocalActionFeedback({});
  }, [focusedInvoice?.fingerprint]);

  React.useEffect(() => {
    setDismissedKnowledgeIds([]);
    setKnowledgeFeedback(null);
  }, [panelSignature]);

  React.useEffect(() => {
    if (contextQuestion?.id) {
      setContextMemoryFeedback(null);
    }
  }, [contextQuestion?.id]);

  React.useEffect(() => {
    if (activeView === 'actions' && previousActiveViewRef.current !== 'actions') {
      setLocalActionFeedback({});
    }

    if (activeView !== 'mascot' && previousActiveViewRef.current === 'mascot') {
      setContextMemoryFeedback(null);
    }

    previousActiveViewRef.current = activeView;
  }, [activeView]);

  const handleKnowledgeLearned = React.useCallback(
    (knowledgeId: EnergyKnowledgeId, title: string) => {
      onKnowledgeLearned(knowledgeId);
      setDismissedKnowledgeIds((currentValue) =>
        currentValue.includes(knowledgeId) ? currentValue : [...currentValue, knowledgeId]
      );
      setKnowledgeFeedback({
        id: knowledgeId,
        message: 'Agora a Score sabe que este conteudo ja foi apresentado.',
        title,
      });
    },
    [onKnowledgeLearned]
  );

  const handleContextQuestionAnswer = React.useCallback(
    (
      questionId: MascotContextQuestion['id'],
      value: MascotContextQuestionValue
    ) => {
      const memoryFeedback = buildMemoryFeedback(questionId, value, energyBehaviorProfile);

      setContextMemoryFeedback({
        ctaLabel: memoryFeedback.ctaLabel,
        message: memoryFeedback.message,
        questionId,
        title: memoryFeedback.badgeLabel,
      });
      onContextQuestionAnswer?.(questionId, value);
    },
    [energyBehaviorProfile, onContextQuestionAnswer]
  );

  const handleAdaptiveActionAnswer = React.useCallback(
    (action: NextAction, questionId: string, value: string) => {
      const answeredAt = new Date().toISOString();
      const adaptiveAnswer = describeAdaptiveAnswer(questionId, value);

      setLocalActionFeedback((currentFeedback) => ({
        ...currentFeedback,
        [action.id]: {
          ...currentFeedback[action.id],
          answer: value,
          insight: adaptiveAnswer.insight,
          microFeedback: adaptiveAnswer.microFeedback,
          questionId,
          summary: adaptiveAnswer.summary,
          answeredQuestions: [
            ...(currentFeedback[action.id]?.answeredQuestions ?? []).filter(
              (question) => question.questionId !== questionId
            ),
            {
              answer: value,
              questionId,
              summary: adaptiveAnswer.summary,
            },
          ],
        },
      }));

      onActionStatusChange(
        {
          ...action,
          pendingAnswer: {
            questionId,
            answer: value,
            answeredAt,
            persistOnly: true,
          },
        },
        'in_progress'
      );
    },
    [onActionStatusChange]
  );

  const summaryHeadline =
    consultiveInsight?.conclusion || contextAnalysis?.headline || guidance.title;
  const summaryBody =
    consultiveInsight?.evidence || contextAnalysis?.whatMattersNext || guidance.message;

  const renderContent = () => {
    if (activeView === 'mascot' || activeView === 'co2') {
      return (
        <DynamicContextKnowledgeView
          variant={activeView}
          activeKnowledge={activeKnowledge}
          activeObjective={activeObjective}
          activeTip={activeTip}
          contextAnalysis={contextAnalysis}
          contextMemoryFeedback={contextMemoryFeedback}
          contextQuestion={contextQuestion}
          energyBehaviorProfile={energyBehaviorProfile}
          guidance={guidance}
          knowledgeCatalog={knowledgeCatalog}
          knowledgeFeedback={knowledgeFeedback}
          knowledgeState={knowledgeState}
          lastLearnedKnowledge={lastLearnedKnowledge}
          learnedKnowledgeCount={learnedKnowledgeCount}
          nextKnowledge={nextKnowledge}
          totalKnowledgeCount={totalKnowledgeCount}
          onContextQuestionAnswer={handleContextQuestionAnswer}
          onContextQuestionIgnore={onContextQuestionIgnore}
          onKnowledgeLearned={handleKnowledgeLearned}
          onOpenActions={onOpenActions}
          onOpenSummary={onOpenSummary}
        />
      );
    }

    if (activeView === 'history') {
      return (
        <DynamicContextHistoryView
          focusedInvoice={focusedInvoice}
          historyAverageConsumption={historyAverageConsumption}
          historyFeedback={historyFeedback}
          historyTrendLine={historyTrendLine}
          historyUploadContent={historyUploadContent}
          invoiceHistory={invoiceHistory}
          isHistoryUploadVisible={isHistoryUploadVisible}
          maxConsumption={maxConsumption}
          onOpenSummary={onOpenSummary}
          onSelectInvoice={onSelectInvoice}
          onToggleHistoryUpload={onToggleHistoryUpload}
          sortedInvoices={sortedInvoices}
        />
      );
    }

    if (activeView === 'actions') {
      return (
        <DynamicContextActionsView
          contextAnalysis={contextAnalysis}
          focusedInvoice={focusedInvoice}
          localActionFeedback={localActionFeedback}
          prioritizedActions={prioritizedActions}
          onActionStatusChange={onActionStatusChange}
          onAdaptiveActionAnswer={handleAdaptiveActionAnswer}
        />
      );
    }

    if (activeView === 'summary') {
      return (
        <DynamicContextSummaryView
          contextLines={contextLines}
          consultiveInsight={consultiveInsight}
          focusedInvoice={focusedInvoice}
          headline={summaryHeadline}
          summary={summaryBody}
          onOpenActions={onOpenActions}
          onOpenHistory={onOpenHistory}
        />
      );
    }

    return (
      <DynamicContextProfileView
        isProfileComplete={isProfileComplete}
        profile={profile}
        profileCompletion={profileCompletion}
        onProfileUpdate={onProfileUpdate}
      />
    );
  };

  return (
    <Card className="min-h-[425px] overflow-hidden rounded-[30px] border border-[#2a5c56] bg-[#103a35] text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#7bc683] text-[#0f342f]">
              <PanelIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
                {panelConfig.title}
              </p>
              <p className="text-lg font-semibold text-[#f5f8f3]">{panelConfig.label}</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#c5d8c8]">
                {panelConfig.description}
              </p>
            </div>
          </div>

          <Badge className="border border-[#365f58] bg-[#123f39] text-[#f5f8f3]">
            {panelConfig.focusBadge}
          </Badge>
        </div>

        <div
          className={cn(
            'mt-5 flex-1 transition-all duration-300',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          )}
        >
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicContextPanel;
