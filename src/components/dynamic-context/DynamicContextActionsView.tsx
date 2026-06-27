import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AnalysisSummary,
  InvoiceData,
  NextAction,
  NextActionStatus,
} from '@/types/mvp';
import {
  AdaptiveActionFeedbackState,
  buildActionReason,
  buildAnsweredSummaryLine,
  compactText,
  getActionInteractionConfig,
  getInvoiceReferenceLabel,
  mergeUniqueStrings,
  normalizeActionTitle,
  priorityLabels,
  supportsAdaptiveDiagnosis,
} from '@/lib/dynamicContextPanel';

interface DynamicContextActionsViewProps {
  contextAnalysis?: AnalysisSummary;
  focusedInvoice?: InvoiceData;
  localActionFeedback: Record<string, AdaptiveActionFeedbackState>;
  onActionStatusChange: (
    action: NextAction,
    status: Extract<NextActionStatus, 'in_progress' | 'completed'>
  ) => void;
  onAdaptiveActionAnswer: (action: NextAction, questionId: string, value: string) => void;
  prioritizedActions: NextAction[];
}

const DynamicContextActionsView = ({
  contextAnalysis,
  focusedInvoice,
  localActionFeedback,
  onActionStatusChange,
  onAdaptiveActionAnswer,
  prioritizedActions,
}: DynamicContextActionsViewProps) => (
  <div className="flex h-full flex-col gap-4">
    {prioritizedActions.length === 0 ? (
      <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
        <p className="text-xl font-semibold text-[#f5f8f3]">Sem proximo passo priorizado agora</p>
        <p className="mt-3 text-sm leading-6 text-[#c5d8c8]">
          Volte para a leitura atual ou envie uma nova fatura para gerar contexto.
        </p>
      </div>
    ) : (
      prioritizedActions.map((action, index) => {
        const status = action.status ?? 'new';
        const displayTitle = normalizeActionTitle(action, index);
        const displayReason = buildActionReason({
          action,
          latestAnalysis: contextAnalysis,
          focusedInvoice,
        });
        const supportingContext =
          action.context && action.context !== action.description
            ? compactText(action.context, 112)
            : null;
        const clearCta = action.ctaLabel ? compactText(action.ctaLabel, 84) : null;
        const interactionQuestions = action.interactiveQuestions ?? [];
        const statusFeedback = localActionFeedback[action.id];
        const optimisticAnsweredQuestions = statusFeedback?.answeredQuestions ?? [];
        const hasAnsweredThisSession = optimisticAnsweredQuestions.length > 0;
        const nextInteractionQuestion =
          hasAnsweredThisSession || interactionQuestions.length === 0
            ? undefined
            : interactionQuestions[0];
        const knownBehaviorSummary = action.knownBehaviorSummary ?? [];
        const answeredQuestionSummaries = action.answeredQuestionSummaries ?? [];
        const usedDataPoints = action.usedDataPoints ?? [];
        const hasAdaptiveDiagnosis =
          index === 0 &&
          supportsAdaptiveDiagnosis(displayTitle) &&
          (interactionQuestions.length > 0 ||
            answeredQuestionSummaries.length > 0 ||
            knownBehaviorSummary.length > 0 ||
            Boolean(statusFeedback) ||
            Boolean(action.diagnosticProgress));
        const mergedAnsweredSummaries = mergeUniqueStrings(
          answeredQuestionSummaries,
          optimisticAnsweredQuestions.map((question) => question.summary)
        );
        const answeredSummaryLine = buildAnsweredSummaryLine(
          mergedAnsweredSummaries.length > 0 ? mergedAnsweredSummaries : knownBehaviorSummary
        );
        const isDiagnosisUpdated =
          hasAdaptiveDiagnosis &&
          interactionQuestions.length === 0 &&
          !hasAnsweredThisSession;
        const answeredFeedbackMessage = hasAnsweredThisSession
          ? 'Informacao incorporada a sua Memoria Energetica.'
          : undefined;
        const hasMemoryFeedbackState = isDiagnosisUpdated || hasAnsweredThisSession;
        const interactionConfig = hasAdaptiveDiagnosis
          ? {
              title: hasMemoryFeedbackState ? 'Impacto na memoria' : 'Pergunta rapida',
              prompt: hasMemoryFeedbackState
                ? 'Sua resposta melhora a leitura da jornada sem mudar o fluxo principal.'
                : nextInteractionQuestion
                  ? 'Ajude a refinar sua Memoria Energetica em 1 toque.'
                  : answeredFeedbackMessage ?? 'Sua resposta melhora a leitura da jornada.',
            }
          : null;

        return (
          <div
            key={action.id}
            className={cn(
              'rounded-[18px] border p-4',
              index === 0 ? 'border-[#7eb77b] bg-[#163f39]' : 'border-[#365f58] bg-[#113731]'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                {index === 0 && (
                  <Badge className="border-none bg-[#8fd08e] text-[#14352f]">
                    Continuidade principal
                  </Badge>
                )}
                <p className="text-lg font-semibold leading-tight text-[#f5f8f3]">
                  {displayTitle}
                </p>
                <p className="text-sm leading-6 text-[#c5d8c8]">{displayReason}</p>
                {clearCta && (
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#bfe7bc]">
                    CTA: {clearCta}
                  </p>
                )}
                {supportingContext && (
                  <p className="text-xs leading-5 text-[#9dbfa6]">
                    Base da recomendacao: {supportingContext}
                  </p>
                )}
              </div>
              <Badge className="shrink-0 border border-[#365f58] bg-[#143d37] text-[#f5f8f3]">
                {priorityLabels[action.priority]}
              </Badge>
            </div>

            {interactionConfig && (
              <div className="mt-4 rounded-[16px] border border-[#365f58] bg-[#0f342f] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
                    {interactionConfig.title}
                  </p>
                  <span className="text-xs font-medium text-[#bfe7bc]">
                    {hasMemoryFeedbackState ? 'Memoria atualizada' : '1 pergunta por vez'}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-[#d9ead8]">{interactionConfig.prompt}</p>

                {(statusFeedback?.insight ||
                  answeredSummaryLine ||
                  isDiagnosisUpdated ||
                  answeredFeedbackMessage) && (
                  <div className="mt-3 min-h-[42px] space-y-1">
                    {answeredFeedbackMessage && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#c5d8c8]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#215147] px-2 py-1 font-semibold text-[#8fd08e]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Memoria atualizada
                        </span>
                        <span>{answeredFeedbackMessage}</span>
                      </div>
                    )}

                    {!answeredFeedbackMessage && statusFeedback?.insight && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#c5d8c8]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#215147] px-2 py-1 font-semibold text-[#8fd08e]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {statusFeedback.microFeedback}
                        </span>
                        <span>{statusFeedback.insight}</span>
                      </div>
                    )}

                    {answeredSummaryLine && (
                      <p className="text-xs leading-5 text-[#9dbfa6]">{answeredSummaryLine}</p>
                    )}

                    {(statusFeedback?.insight || answeredFeedbackMessage || isDiagnosisUpdated) && (
                      <a
                        href="#memory-panel"
                        className="inline-flex text-xs font-semibold text-[#bfe7bc] underline-offset-4 hover:underline"
                      >
                        Ver painel de memoria
                      </a>
                    )}
                  </div>
                )}

                {nextInteractionQuestion && (
                  <>
                    <p className="mt-3 text-sm leading-6 text-[#d9ead8]">
                      {nextInteractionQuestion.prompt}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {nextInteractionQuestion.options.map((option) => {
                        const isSelected =
                          statusFeedback?.questionId === nextInteractionQuestion.id &&
                          statusFeedback.answer === option.value;

                        return (
                          <Button
                            key={`${action.id}-${nextInteractionQuestion.id}-${option.value}`}
                            size="sm"
                            variant="outline"
                            disabled={isSelected}
                            className={cn(
                              'rounded-[12px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43]',
                              isSelected && 'border-[#8fd08e] bg-[#215147] text-[#dff4dd]'
                            )}
                            onClick={() =>
                              onAdaptiveActionAnswer(action, nextInteractionQuestion.id, option.value)
                            }
                          >
                            {isSelected ? `${option.label} - respondido` : option.label}
                          </Button>
                        );
                      })}
                    </div>

                    {nextInteractionQuestion.helperText && (
                      <p className="mt-3 text-xs leading-5 text-[#9dbfa6]">
                        {nextInteractionQuestion.helperText}
                      </p>
                    )}
                  </>
                )}

                {usedDataPoints.length > 0 && (
                  <div className="mt-3 rounded-[14px] border border-[#365f58] bg-[#163f39] px-3 py-3 text-sm leading-6 text-[#d9ead8]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
                      Dados usados
                    </p>
                    <div className="mt-2 space-y-1">
                      {usedDataPoints.slice(0, 4).map((point) => (
                        <p key={`${action.id}-${point}`}>- {point}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {!interactionConfig || isDiagnosisUpdated ? (
                status === 'completed' ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Acao ja testada na jornada
                  </div>
                ) : index === 0 ? (
                  <Button
                    onClick={() => {
                      onActionStatusChange(action, 'in_progress');
                    }}
                    className="rounded-[14px] bg-[#5f925c] text-white hover:bg-[#517d4f]"
                  >
                    Comecar acompanhamento
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onActionStatusChange(action, 'in_progress');
                    }}
                    className="rounded-[14px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43]"
                  >
                    Preparar acompanhamento
                  </Button>
                )
              ) : null}
            </div>
          </div>
        );
      })
    )}

    {focusedInvoice && (
      <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4 text-sm leading-6 text-[#c5d8c8]">
        Base atual: {getInvoiceReferenceLabel(focusedInvoice)}. Compare a proxima conta antes de ampliar a mudanca.
      </div>
    )}
  </div>
);

export default DynamicContextActionsView;
