import React from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AnalysisSummary,
  InvoiceData,
  NextAction,
  NextActionStatus,
  UserContextState,
  UserProfileData,
} from '@/types/mvp';

interface SmartRecommendationsProps {
  actions: NextAction[];
  viewedActionIds: string[];
  analysis?: AnalysisSummary;
  invoiceHistory?: InvoiceData[];
  selectedInvoice?: InvoiceData;
  profile: UserProfileData;
  userContext?: Partial<UserContextState>;
  onSelectInvoice?: (invoice: InvoiceData) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  showHeader?: boolean;
  onActionStatusChange: (
    action: NextAction,
    status: Extract<NextActionStatus, 'in_progress' | 'completed'>
  ) => void;
}

type ActionEngagementChoice = 'start' | 'done' | 'try';
type ActionCategory = 'habito' | 'equipamento' | 'tarifa' | 'solar' | 'monitoramento';

interface ContextHints {
  averageCostPerKwh?: number;
  costPerKwhHigh: boolean;
  consumptionHigh: boolean;
  insufficientData: boolean;
  hasSolarPreference: boolean;
}

interface FeedbackContext {
  hints: ContextHints;
  primaryGoal?: ReturnType<typeof getAnsweredContextValue>;
  usagePeriod?: ReturnType<typeof getAnsweredContextValue>;
  electricShowerUsage?: ReturnType<typeof getAnsweredContextValue>;
}

const priorityClasses = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-yellow-200 bg-yellow-50',
  low: 'border-blue-200 bg-blue-50',
} as const;

const priorityLabels = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
} as const;

const statusLabels: Record<NextActionStatus, string> = {
  new: 'Não iniciada',
  viewed: 'Revisada',
  in_progress: 'Em andamento',
  completed: 'Testada',
};

const actionEngagementOptions: Array<{
  value: ActionEngagementChoice;
  label: string;
}> = [
  { value: 'start', label: 'Começar' },
  { value: 'done', label: 'Já fiz' },
  { value: 'try', label: 'Vou tentar' },
];

const formatCurrency = (value?: number) =>
  typeof value === 'number' ? `R$ ${value.toFixed(2)}` : 'Custo não identificado';

const formatConsumption = (value?: number) =>
  typeof value === 'number' ? `${value} kWh` : 'Consumo não identificado';

const formatCurrencyPerKwh = (value?: number) =>
  typeof value === 'number' ? `R$ ${value.toFixed(2)}/kWh` : undefined;

const getCompactText = (value: string, maxLength = 120) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
};

const getInvoiceReferenceLabel = (invoice: InvoiceData) => {
  const month = invoice.month?.trim();

  if (month) {
    return month;
  }

  const referenceMonth = invoice.parser.fields.referenceMonth.value?.trim();

  if (referenceMonth) {
    return referenceMonth;
  }

  return invoice.month || 'Referência não identificada';
};

const getAverageCostPerKwh = (invoice?: InvoiceData) => {
  if (
    !invoice ||
    typeof invoice.totalValue !== 'number' ||
    !Number.isFinite(invoice.totalValue) ||
    typeof invoice.consumption !== 'number' ||
    !Number.isFinite(invoice.consumption) ||
    invoice.consumption <= 0
  ) {
    return undefined;
  }

  return invoice.totalValue / invoice.consumption;
};

const getAnsweredContextValue = (
  userContext: Partial<UserContextState> | undefined,
  questionId: 'usage_period' | 'electric_shower' | 'primary_goal'
) => {
  const answer = userContext?.questions?.[questionId];
  return answer?.status === 'answered' ? answer.value : undefined;
};

const normalizeForMatch = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const hasSolarInterest = (profile: UserProfileData) =>
  profile.energyPreference === 'Solar' || profile.energyPreference === 'Hibrido';

const buildBlockOrientation = ({
  analysis,
  invoice,
  profile,
  userContext,
}: {
  analysis?: AnalysisSummary;
  invoice?: InvoiceData;
  profile: UserProfileData;
  userContext?: Partial<UserContextState>;
}) => {
  const averageCostPerKwh = getAverageCostPerKwh(invoice);
  const primaryGoal = getAnsweredContextValue(userContext, 'primary_goal');

  if (profile.consumerType === 'Residencial' && analysis?.consumptionLevel === 'alto') {
    return 'Para este perfil residencial, vale priorizar hábitos de maior impacto antes de trocar equipamentos.';
  }

  if (averageCostPerKwh !== undefined && analysis?.costSignal && analysis.costSignal !== 'controlado') {
    return 'O custo por kWh desta fatura é um sinal de atenção antes de avaliar qualquer investimento.';
  }

  if (hasSolarInterest(profile)) {
    return 'Antes de simular energia solar, vale consolidar uma leitura confiável dos usos que mais pesam.';
  }

  if (primaryGoal === 'reduce_cost') {
    return 'Priorize ajustes simples e acompanhe o próximo ciclo antes de ampliar a ação.';
  }

  if (primaryGoal === 'understand_consumption') {
    return 'Use esta fatura em foco como referência e compare o próximo ciclo antes de concluir uma causa.';
  }

  if (analysis?.consumptionLevel === 'baixo') {
    return 'O consumo desta fatura parece mais contido; vale manter uma leitura neutra e acompanhar o próximo ciclo.';
  }

  return 'Use esta fatura em foco como referência e valide o próximo ciclo.';
};

const buildActionContextLine = ({
  action,
  analysis,
  invoice,
  profile,
  userContext,
}: {
  action: NextAction;
  analysis?: AnalysisSummary;
  invoice?: InvoiceData;
  profile: UserProfileData;
  userContext?: Partial<UserContextState>;
}) => {
  const averageCostPerKwh = getAverageCostPerKwh(invoice);
  const primaryGoal = getAnsweredContextValue(userContext, 'primary_goal');

  if (analysis?.consumptionLevel === 'alto' && profile.consumerType === 'Residencial') {
    return action.priority === 'high'
      ? 'Neste perfil residencial, esta frente pode indicar hábitos que estão puxando o consumo.'
      : 'Neste perfil residencial, use esta frente como apoio para reduzir desperdícios mais visíveis.';
  }

  if (averageCostPerKwh !== undefined && analysis?.costSignal && analysis.costSignal !== 'controlado') {
    return 'Nesta fatura, vale relacionar esta ação ao custo por kWh antes de considerar novos gastos.';
  }

  if (hasSolarInterest(profile)) {
    return 'Mesmo com interesse em energia solar, comece pelos sinais mais visíveis da rotina atual.';
  }

  if (primaryGoal === 'reduce_cost') {
    return 'Priorize esta ação se ela permitir testar um ajuste simples antes do próximo vencimento.';
  }

  if (primaryGoal === 'understand_consumption') {
    return 'Use esta ação para separar percepção do que a fatura em foco mostra.';
  }

  if (action.priority === 'high') {
    return 'Priorize esta frente primeiro e acompanhe um sinal observável no próximo ciclo.';
  }

  if (action.priority === 'medium') {
    return 'Vale observar esta frente depois da principal, sem mudar muitas variáveis ao mesmo tempo.';
  }

  return 'Trate esta frente como ajuste complementar e acompanhe se o sinal se repete.';
};

const buildActionQuickTip = ({
  analysis,
  userContext,
}: {
  analysis?: AnalysisSummary;
  userContext?: Partial<UserContextState>;
}) => {
  const usagePeriod = getAnsweredContextValue(userContext, 'usage_period');
  const electricShowerUsage = getAnsweredContextValue(userContext, 'electric_shower');
  const primaryGoal = getAnsweredContextValue(userContext, 'primary_goal');

  if (usagePeriod === 'night') {
    return 'Se o pico costuma acontecer à noite, observe banho, climatização e cargas acumuladas nesse período.';
  }

  if (usagePeriod === 'afternoon') {
    return 'Se o uso pesa mais à tarde, compare esta ação com equipamentos que ficam ligados por mais tempo nesse período.';
  }

  if (electricShowerUsage === 'daily') {
    return 'Se o chuveiro entra todos os dias, acompanhe tempo e temperatura antes de pensar em troca.';
  }

  if (primaryGoal === 'both') {
    return 'Registre uma mudança por vez para entender consumo e custo sem confundir os sinais.';
  }

  if (!analysis) {
    return 'Use esta fatura em foco como referência e valide o próximo ciclo.';
  }

  return undefined;
};

const buildActionFeedbackMessage = ({
  choice,
  action,
  analysis,
  invoice,
  userContext,
}: {
  choice: ActionEngagementChoice;
  action: NextAction;
  analysis?: AnalysisSummary;
  invoice?: InvoiceData;
  userContext?: Partial<UserContextState>;
}) => {
  const averageCostPerKwh = getAverageCostPerKwh(invoice);
  const primaryGoal = getAnsweredContextValue(userContext, 'primary_goal');

  if (choice === 'start') {
    if (action.priority === 'high') {
      return 'Boa. Comece por este ponto e acompanhe o reflexo no próximo ciclo.';
    }

    if (analysis?.costSignal && analysis.costSignal !== 'controlado') {
      return 'Boa. Vale acompanhar isso na próxima fatura.';
    }

    return 'Boa. Teste isso agora e veja se o sinal muda no próximo ciclo.';
  }

  if (choice === 'done') {
    if (averageCostPerKwh !== undefined) {
      return 'Perfeito. Veja se isso impacta seu consumo no próximo ciclo.';
    }

    return 'Perfeito. Compare a próxima fatura para entender se esse ajuste fez diferença.';
  }

  if (primaryGoal === 'understand_consumption') {
    return 'Boa escolha. Tente uma mudança por vez para comparar melhor os sinais.';
  }

  return 'Boa. Vale tentar isso agora e conferir o reflexo na próxima fatura.';
};

const deriveActionCategory = (action: NextAction): ActionCategory => {
  const actionWithTags = action as NextAction & { tags?: string[] };
  const combinedText = normalizeForMatch(
    [
      action.title,
      action.description,
      action.value,
      action.context,
      action.suggestion,
      action.validation,
      action.impact,
      ...(Array.isArray(actionWithTags.tags) ? actionWithTags.tags : []),
    ]
      .filter(Boolean)
      .join(' ')
  );

  if (/(solar|fotovolta|placa|painel|geracao)/.test(combinedText)) {
    return 'solar';
  }

  if (/(tarifa|bandeira|kwh|custo|preco|demanda|contrato)/.test(combinedText)) {
    return 'tarifa';
  }

  if (/(chuveiro|banho|rotina|tempo de uso|tempo|habito|uso diario|desligar|horario)/.test(combinedText)) {
    return 'habito';
  }

  if (/(equipamento|aparelho|geladeira|ar-condicionado|ar condicionado|lampada|motor|eficiencia|manutencao)/.test(combinedText)) {
    return 'equipamento';
  }

  return 'monitoramento';
};

const getContextHints = (
  selectedInvoice: InvoiceData | undefined,
  selectedAnalysis: AnalysisSummary | undefined,
  profile: UserProfileData
): ContextHints => {
  const averageCostPerKwh = getAverageCostPerKwh(selectedInvoice);
  const costPerKwhHigh =
    averageCostPerKwh !== undefined &&
    Boolean(selectedAnalysis?.costSignal && selectedAnalysis.costSignal !== 'controlado');
  const consumptionHigh = selectedAnalysis?.consumptionLevel === 'alto';
  const insufficientData =
    !selectedInvoice || !selectedAnalysis || (!costPerKwhHigh && !consumptionHigh && averageCostPerKwh === undefined);

  return {
    averageCostPerKwh,
    costPerKwhHigh,
    consumptionHigh,
    insufficientData,
    hasSolarPreference: hasSolarInterest(profile),
  };
};

const buildFeedbackMessage = (
  action: NextAction,
  intent: ActionEngagementChoice,
  context: FeedbackContext
) => {
  const category = deriveActionCategory(action);

  const leadByIntent: Record<ActionEngagementChoice, Record<NextAction['priority'], string>> = {
    start: {
      high: 'Boa. Comece por este ponto.',
      medium: 'Boa. Vale começar por aqui.',
      low: 'Bom passo. Comece quando fizer sentido.',
    },
    done: {
      high: 'Perfeito. Se já aplicou, vale atenção agora.',
      medium: 'Perfeito. Se já aplicou, acompanhe o próximo ciclo.',
      low: 'Bom passo. Se já aplicou, acompanhe quando possível.',
    },
    try: {
      high: 'Ótimo começo. Vale testar logo.',
      medium: 'Ótimo começo. Vale testar por alguns dias.',
      low: 'Bom caminho. Teste com calma quando puder.',
    },
  };

  const habitFollowUp =
    context.electricShowerUsage === 'daily' || context.usagePeriod === 'night'
      ? 'Se envolve hábito diário, ajuste tempo e uso antes de comparar.'
      : 'Se envolve hábito diário, ajuste a rotina e compare no próximo ciclo.';

  const categoryFollowUp: Record<ActionCategory, string> = {
    habito: habitFollowUp,
    equipamento: 'Se envolve equipamento, verifique uso e eficiência antes de concluir algo.',
    tarifa: context.hints.costPerKwhHigh
      ? 'Olhe o custo por kWh desta fatura antes de concluir qualquer ganho.'
      : 'Vale acompanhar custo por kWh e bandeira no próximo ciclo.',
    solar: context.hints.costPerKwhHigh
      ? 'Antes de investir, observe o custo por kWh desta fatura.'
      : 'Antes de investir, confirme primeiro o que mais pesa nesta fatura.',
    monitoramento: 'Acompanhe a próxima fatura para ver se o sinal se repete.',
  };

  let followUp = categoryFollowUp[category];

  if (context.hints.consumptionHigh && category !== 'solar' && category !== 'tarifa') {
    followUp = 'Acompanhe os hábitos de maior impacto no próximo ciclo.';
  } else if (context.hints.costPerKwhHigh && category !== 'solar' && category !== 'tarifa') {
    followUp = 'Vale olhar o custo por kWh desta fatura antes de tirar conclusões.';
  } else if (context.hints.insufficientData) {
    followUp = 'Use esta fatura como referência e compare o próximo ciclo.';
  } else if (context.primaryGoal === 'understand_consumption' && category === 'monitoramento') {
    followUp = 'Observe uma mudança por vez para comparar melhor os sinais.';
  } else if (context.hints.hasSolarPreference && category === 'solar') {
    followUp = 'Antes de investir, compare este sinal com os usos que mais pesam.';
  }

  return `${leadByIntent[intent][action.priority]} ${followUp}`;
};

const buildContextFooter = ({
  analysis,
  invoice,
  profile,
  userContext,
}: {
  analysis?: AnalysisSummary;
  invoice?: InvoiceData;
  profile: UserProfileData;
  userContext?: Partial<UserContextState>;
}) => {
  const averageCostPerKwh = getAverageCostPerKwh(invoice);
  const primaryGoal = getAnsweredContextValue(userContext, 'primary_goal');

  if (averageCostPerKwh !== undefined && analysis?.costSignal && analysis.costSignal !== 'controlado') {
    return `O custo por kWh observado ficou em ${formatCurrencyPerKwh(averageCostPerKwh)}; compare o próximo ciclo antes de concluir uma causa.`;
  }

  if (hasSolarInterest(profile)) {
    return 'Com preferência por energia solar, vale primeiro confirmar quais usos realmente pesam nesta fatura.';
  }

  if (primaryGoal === 'both') {
    return 'Como o objetivo atual mistura custo e consumo, priorize uma mudança por vez para comparar melhor.';
  }

  if (analysis?.consumptionLevel === 'baixo') {
    return 'A leitura atual parece mais neutra; mantenha esta fatura em foco como referência para a próxima comparação.';
  }

  return 'Use esta leitura como base e acompanhe o próximo ciclo antes de ampliar qualquer decisão.';
};

const SmartRecommendations = ({
  actions,
  viewedActionIds,
  analysis,
  invoiceHistory,
  selectedInvoice,
  profile,
  userContext,
  onSelectInvoice,
  isExpanded = true,
  onToggle,
  showHeader = true,
  onActionStatusChange: _onActionStatusChange,
}: SmartRecommendationsProps) => {
  const [expandedDetailIds, setExpandedDetailIds] = React.useState<string[]>([]);
  const [actionFeedbackById, setActionFeedbackById] = React.useState<
    Record<string, { choice: ActionEngagementChoice; message: string }>
  >({});
  const contextInvoice = selectedInvoice;
  const contextInvoiceLabel = contextInvoice ? getInvoiceReferenceLabel(contextInvoice) : undefined;
  const showInvoiceSelector = Boolean(contextInvoice && invoiceHistory && invoiceHistory.length > 1 && onSelectInvoice);
  const ExpansionIcon = isExpanded ? ChevronDown : ChevronRight;
  const blockOrientation = buildBlockOrientation({
    analysis,
    invoice: contextInvoice,
    profile,
    userContext,
  });
  const footerContext = buildContextFooter({
    analysis,
    invoice: contextInvoice,
    profile,
    userContext,
  });
  const contextHints = getContextHints(contextInvoice, analysis, profile);
  const feedbackContext: FeedbackContext = {
    hints: contextHints,
    primaryGoal: getAnsweredContextValue(userContext, 'primary_goal'),
    usagePeriod: getAnsweredContextValue(userContext, 'usage_period'),
    electricShowerUsage: getAnsweredContextValue(userContext, 'electric_shower'),
  };

  React.useEffect(() => {
    setActionFeedbackById({});
  }, [contextInvoice?.fingerprint]);

  const toggleActionDetails = (actionId: string) => {
    setExpandedDetailIds((currentIds) =>
      currentIds.includes(actionId)
        ? currentIds.filter((id) => id !== actionId)
        : [...currentIds, actionId]
    );
  };
  const handleActionFeedback = (action: NextAction, choice: ActionEngagementChoice) => {
    setActionFeedbackById((currentFeedback) => ({
      ...currentFeedback,
      [action.id]: {
        choice,
        message: buildFeedbackMessage(action, choice, feedbackContext),
      },
    }));
  };

  return (
    <Card className="border-2 border-blue-100 shadow-lg">
      {showHeader && (
        <CardHeader
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onToggle?.();
            }
          }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center space-x-2 text-blue-700">
                <Lightbulb className="h-5 w-5" />
                <span>Ações recomendadas</span>
              </CardTitle>
              <p className="text-sm text-slate-600">
                {contextInvoiceLabel
                  ? `Fatura em foco: ${contextInvoiceLabel}. ${blockOrientation}`
                  : 'As ações seguem a lista global da jornada, sem recálculo local.'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 md:self-center">
              <span>{isExpanded ? 'Aberto' : 'Fechado'}</span>
              <ExpansionIcon className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
      )}
      {isExpanded && (
        <CardContent>
          {showInvoiceSelector && contextInvoice && invoiceHistory && onSelectInvoice && (
            <div className="mb-6 flex justify-end">
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                <span className="font-medium text-slate-700">Fatura em foco</span>
                <select
                  aria-label="Selecionar fatura para contextualizar as ações"
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  value={contextInvoice.fingerprint}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    const nextInvoice = invoiceHistory.find(
                      (historyInvoice) => historyInvoice.fingerprint === event.target.value
                    );

                    if (nextInvoice) {
                      onSelectInvoice(nextInvoice);
                    }
                  }}
                >
                  {invoiceHistory.map((historyInvoice) => (
                    <option key={historyInvoice.fingerprint} value={historyInvoice.fingerprint}>
                      {getInvoiceReferenceLabel(historyInvoice)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50/70 p-4">
            <p className="text-sm font-medium text-blue-900">{blockOrientation}</p>
          </div>
          <div className="space-y-4">
            {actions.map((action, index) => {
              const status = action.status ?? (viewedActionIds.includes(action.id) ? 'viewed' : 'new');
              const isCompleted = status === 'completed';
              const isInProgress = status === 'in_progress';
              const isDetailsExpanded = expandedDetailIds.includes(action.id);
              const actionContextLine = buildActionContextLine({
                action,
                analysis,
                invoice: contextInvoice,
                profile,
                userContext,
              });
              const actionQuickTip = buildActionQuickTip({
                analysis,
                userContext,
              });
              const actionFeedback = actionFeedbackById[action.id];
              const details = [
                { label: 'Como fazer', value: action.suggestion },
                { label: 'Como validar', value: action.validation },
              ].filter((detail) => Boolean(detail.value));
              const compactDescription = getCompactText(action.description, 110);
              const hasExpandableDetails = Boolean(
                action.description ||
                actionContextLine ||
                action.value ||
                action.impact ||
                details.length > 0
              );

              return (
                <div
                  key={action.id}
                  className={`rounded-lg border-2 p-4 transition-all duration-300 ${
                    priorityClasses[action.priority]
                  } ${index === 0 ? 'ring-2 ring-emerald-200' : ''} sm:p-5`}
                >
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {index === 0 && (
                            <span className="rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
                              Ação principal
                            </span>
                          )}
                          <h4 className="min-w-0 break-words font-semibold text-gray-800">
                            {action.title}
                          </h4>
                          <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-gray-700">
                            Prioridade {priorityLabels[action.priority]}
                          </span>
                          <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-slate-700">
                            {statusLabels[status]}
                          </span>
                        </div>

                        <p className="break-words text-sm leading-relaxed text-gray-700">
                          {compactDescription}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                        {actionEngagementOptions.map((option) => {
                          const isSelected = actionFeedback?.choice === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={`inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-sm font-medium leading-snug transition sm:w-auto ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-white/80 bg-white/85 text-slate-700 hover:border-blue-200 hover:text-blue-700'
                              }`}
                              onClick={() => handleActionFeedback(action, option.value)}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>

                      {actionFeedback && (
                        <div className="w-full break-words rounded-md border border-emerald-100 bg-emerald-50/90 px-3 py-2 text-sm leading-relaxed text-emerald-800">
                          {actionFeedback.message}
                        </div>
                      )}
                    </div>

                    {actionQuickTip && (
                      <div className="break-words rounded-md border border-blue-100 bg-blue-50/80 px-3 py-2 text-sm leading-relaxed text-blue-800">
                        <span className="font-medium">Dica rápida:</span> {actionQuickTip}
                      </div>
                    )}

                    {hasExpandableDetails && (
                      <div className="space-y-3">
                        <button
                          type="button"
                          className="text-sm font-medium text-blue-700 transition hover:text-blue-800"
                          onClick={() => toggleActionDetails(action.id)}
                        >
                          {isDetailsExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                        </button>

                        {isDetailsExpanded && (
                          <div className="space-y-3 rounded-md bg-white/75 p-3">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Descrição completa
                              </span>
                              <p className="break-words text-sm leading-relaxed text-slate-700">
                                {action.description}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Leitura contextual
                              </span>
                              <p className="break-words text-sm leading-relaxed text-slate-700">
                                {actionContextLine}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Objetivo
                              </span>
                              <p className="text-sm font-semibold text-emerald-700">{action.value}</p>
                            </div>

                            {details.length > 0 && (
                              <div className="grid grid-cols-1 gap-3">
                                {details.map((detail) => (
                                  <div key={detail.label} className="space-y-1">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      {detail.label}
                                    </span>
                                    <p className="break-words text-sm leading-relaxed text-slate-700">
                                      {detail.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {action.impact && (
                              <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Impacto observado
                                </span>
                                <p className="text-xs font-medium text-slate-500">{action.impact}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {isInProgress && (
                      <div className="break-words rounded-md bg-blue-50 px-3 py-2 text-sm font-medium leading-relaxed text-blue-700">
                        Ação em andamento. Quando testar na rotina, marque como testada.
                      </div>
                    )}

                    {isCompleted && (
                      <div className="flex items-start gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium leading-relaxed text-emerald-700 sm:items-center">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
                        Ação testada e registrada no progresso da jornada.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Acompanhe estas ações na próxima fatura para validar o impacto.
          </p>

          {contextInvoice && (
            <div className="mt-6 rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 p-4">
              <div className="text-center text-sm">
                <p className="font-medium text-gray-700">
                  Fatura em foco: {contextInvoiceLabel}
                </p>
                {analysis && (
                  <p className="text-gray-600">
                    Consumo: {formatConsumption(contextInvoice.consumption)} • Custo:{' '}
                    {formatCurrency(contextInvoice.totalValue)} • {analysis.efficiencyLabel}
                  </p>
                )}
                <p className="mt-2 text-gray-600">{footerContext}</p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default SmartRecommendations;
