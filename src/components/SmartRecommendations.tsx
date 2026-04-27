import React from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Sparkles,
  Target,
} from 'lucide-react';
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
  high: 'border-red-200 bg-red-50/90',
  medium: 'border-amber-200 bg-amber-50/90',
  low: 'border-blue-200 bg-blue-50/90',
} as const;

const priorityLabels = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baixa',
} as const;

const statusLabels: Record<NextActionStatus, string> = {
  new: 'Nao iniciada',
  viewed: 'Vista',
  in_progress: 'Em andamento',
  completed: 'Testada',
};

const actionCategoryLabels: Record<ActionCategory, string> = {
  habito: 'Habito',
  equipamento: 'Equipamento',
  tarifa: 'Tarifa',
  solar: 'Solar',
  monitoramento: 'Monitoramento',
};

const actionEngagementOptions: Array<{
  value: ActionEngagementChoice;
  label: string;
}> = [
  { value: 'start', label: 'Comecar' },
  { value: 'done', label: 'Ja fiz' },
  { value: 'try', label: 'Vou testar' },
];

const formatCurrency = (value?: number) =>
  typeof value === 'number' ? `R$ ${value.toFixed(2)}` : 'Custo nao identificado';

const formatConsumption = (value?: number) =>
  typeof value === 'number' ? `${value} kWh` : 'Consumo nao identificado';

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

  return invoice.month || 'Referencia nao identificada';
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
    return 'Neste perfil, vale priorizar habitos de maior impacto antes de pensar em troca de equipamento.';
  }

  if (averageCostPerKwh !== undefined && analysis?.costSignal && analysis.costSignal !== 'controlado') {
    return 'O custo por kWh desta fatura pede atencao antes de ampliar qualquer decisao.';
  }

  if (hasSolarInterest(profile)) {
    return 'Antes de simular energia solar, vale firmar uma leitura melhor do uso atual.';
  }

  if (primaryGoal === 'reduce_cost') {
    return 'Priorize ajustes simples e compare o proximo ciclo antes de ampliar a acao.';
  }

  if (primaryGoal === 'understand_consumption') {
    return 'Use esta fatura em foco como base e compare o proximo ciclo antes de concluir uma causa.';
  }

  if (analysis?.consumptionLevel === 'baixo') {
    return 'O consumo parece mais contido; mantenha a leitura leve e acompanhe o proximo ciclo.';
  }

  return 'Use esta fatura como referencia e observe uma mudanca por vez.';
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
      ? 'Neste perfil residencial, esta frente pode revelar habitos que puxam o consumo.'
      : 'Neste perfil residencial, use esta frente como apoio para reduzir desperdicios mais visiveis.';
  }

  if (averageCostPerKwh !== undefined && analysis?.costSignal && analysis.costSignal !== 'controlado') {
    return 'Nesta fatura, relacione esta acao ao custo por kWh antes de considerar novos gastos.';
  }

  if (hasSolarInterest(profile)) {
    return 'Mesmo com interesse em energia solar, comece pelos sinais mais visiveis da rotina atual.';
  }

  if (primaryGoal === 'reduce_cost') {
    return 'Priorize esta acao se ela permitir um teste simples antes do proximo vencimento.';
  }

  if (primaryGoal === 'understand_consumption') {
    return 'Use esta acao para separar percepcao do que a fatura em foco realmente mostra.';
  }

  if (action.priority === 'high') {
    return 'Priorize esta frente primeiro e acompanhe um sinal observavel no proximo ciclo.';
  }

  if (action.priority === 'medium') {
    return 'Vale observar esta frente depois da principal, sem mudar muitas variaveis ao mesmo tempo.';
  }

  return 'Trate esta frente como ajuste complementar e veja se o sinal se repete.';
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
    return 'Se o pico costuma acontecer a noite, observe banho, climatizacao e cargas acumuladas nesse periodo.';
  }

  if (usagePeriod === 'afternoon') {
    return 'Se o uso pesa mais a tarde, compare esta acao com equipamentos ligados por mais tempo nesse periodo.';
  }

  if (electricShowerUsage === 'daily') {
    return 'Se o chuveiro entra todos os dias, acompanhe tempo e temperatura antes de pensar em troca.';
  }

  if (primaryGoal === 'both') {
    return 'Registre uma mudanca por vez para entender consumo e custo sem confundir os sinais.';
  }

  if (!analysis) {
    return 'Use esta fatura em foco como referencia e valide o proximo ciclo.';
  }

  return undefined;
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
      medium: 'Boa. Vale comecar por aqui.',
      low: 'Bom passo. Comece quando fizer sentido.',
    },
    done: {
      high: 'Perfeito. Se ja aplicou, vale atencao agora.',
      medium: 'Perfeito. Se ja aplicou, acompanhe o proximo ciclo.',
      low: 'Bom passo. Se ja aplicou, acompanhe quando possivel.',
    },
    try: {
      high: 'Otimo comeco. Vale testar logo.',
      medium: 'Otimo comeco. Vale testar por alguns dias.',
      low: 'Bom caminho. Teste com calma quando puder.',
    },
  };

  const habitFollowUp =
    context.electricShowerUsage === 'daily' || context.usagePeriod === 'night'
      ? 'Se envolve habito diario, ajuste tempo e uso antes de comparar.'
      : 'Se envolve habito diario, ajuste a rotina e compare no proximo ciclo.';

  const categoryFollowUp: Record<ActionCategory, string> = {
    habito: habitFollowUp,
    equipamento: 'Se envolve equipamento, verifique uso e eficiencia antes de concluir algo.',
    tarifa: context.hints.costPerKwhHigh
      ? 'Olhe o custo por kWh desta fatura antes de concluir qualquer ganho.'
      : 'Vale acompanhar custo por kWh e bandeira no proximo ciclo.',
    solar: context.hints.costPerKwhHigh
      ? 'Antes de investir, observe o custo por kWh desta fatura.'
      : 'Antes de investir, confirme primeiro o que mais pesa nesta fatura.',
    monitoramento: 'Acompanhe a proxima fatura para ver se o sinal se repete.',
  };

  let followUp = categoryFollowUp[category];

  if (context.hints.consumptionHigh && category !== 'solar' && category !== 'tarifa') {
    followUp = 'Acompanhe os habitos de maior impacto no proximo ciclo.';
  } else if (context.hints.costPerKwhHigh && category !== 'solar' && category !== 'tarifa') {
    followUp = 'Vale olhar o custo por kWh desta fatura antes de tirar conclusoes.';
  } else if (context.hints.insufficientData) {
    followUp = 'Use esta fatura como referencia e compare o proximo ciclo.';
  } else if (context.primaryGoal === 'understand_consumption' && category === 'monitoramento') {
    followUp = 'Observe uma mudanca por vez para comparar melhor os sinais.';
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
    return `O custo por kWh observado ficou em ${formatCurrencyPerKwh(averageCostPerKwh)}; compare o proximo ciclo antes de concluir uma causa.`;
  }

  if (hasSolarInterest(profile)) {
    return 'Com preferencia por energia solar, vale primeiro confirmar quais usos realmente pesam nesta fatura.';
  }

  if (primaryGoal === 'both') {
    return 'Como o objetivo mistura custo e consumo, priorize uma mudanca por vez para comparar melhor.';
  }

  if (analysis?.consumptionLevel === 'baixo') {
    return 'A leitura atual parece mais neutra; mantenha esta fatura em foco como referencia para a proxima comparacao.';
  }

  return 'Use esta leitura como base e acompanhe o proximo ciclo antes de ampliar qualquer decisao.';
};

const buildActionPreview = (action: NextAction, actionContextLine: string) => {
  return getCompactText(action.context || action.description || actionContextLine, 88);
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
  isExpanded = false,
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
    <Card className="overflow-hidden border border-blue-100 bg-gradient-to-br from-white via-blue-50/55 to-cyan-50/40 shadow-lg">
      {showHeader && (
        <CardHeader
          className="cursor-pointer border-b border-blue-100/80 bg-white/70 backdrop-blur"
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
            <div className="space-y-2">
              <CardTitle className="flex items-center space-x-2 text-blue-700">
                <Lightbulb className="h-5 w-5" />
                <span>Acoes recomendadas</span>
              </CardTitle>
              <p className="text-sm text-slate-600">
                {contextInvoiceLabel
                  ? `Fatura em foco: ${contextInvoiceLabel}`
                  : 'As acoes seguem a lista global da jornada, sem recalculo local.'}
              </p>
              <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="truncate">{blockOrientation}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 md:self-center">
              <span>{isExpanded ? 'Fechar' : 'Explorar'}</span>
              <ExpansionIcon className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
      )}

      {isExpanded && (
        <CardContent className="space-y-5 p-5">
          {showInvoiceSelector && contextInvoice && invoiceHistory && onSelectInvoice && (
            <div className="flex justify-end">
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                <span className="font-medium text-slate-700">Fatura em foco</span>
                <select
                  aria-label="Selecionar fatura para contextualizar as acoes"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
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

          <div className="rounded-[24px] border border-blue-100 bg-white/85 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Target className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Leitura da vez
                </p>
                <p className="text-sm font-medium leading-6 text-slate-800">{blockOrientation}</p>
              </div>
            </div>
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
              const category = deriveActionCategory(action);
              const summaryLine = buildActionPreview(action, actionContextLine);
              const compactGoal = getCompactText(action.value, 52);
              const compactImpact = action.impact ? getCompactText(action.impact, 64) : undefined;
              const hasExpandableDetails = Boolean(
                action.description ||
                actionContextLine ||
                action.value ||
                action.impact ||
                actionQuickTip ||
                details.length > 0
              );

              return (
                <div
                  key={action.id}
                  className={`rounded-[26px] border-2 p-4 transition-all duration-300 ${
                    priorityClasses[action.priority]
                  } ${index === 0 ? 'ring-2 ring-emerald-200' : ''} sm:p-5`}
                >
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {index === 0 && (
                          <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                            Mais promissora
                          </span>
                        )}
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700">
                          Prioridade {priorityLabels[action.priority]}
                        </span>
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {statusLabels[status]}
                        </span>
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {actionCategoryLabels[category]}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h4 className="min-w-0 break-words text-base font-semibold text-slate-900">
                          {action.title}
                        </h4>
                        <p className="break-words text-sm leading-6 text-slate-700">{summaryLine}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/90 bg-white/80 px-3 py-1 text-xs font-medium text-emerald-700">
                          Objetivo: {compactGoal}
                        </span>
                        {compactImpact && (
                          <span className="rounded-full border border-white/90 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600">
                            Impacto: {compactImpact}
                          </span>
                        )}
                      </div>
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
                                : 'border-white/90 bg-white/90 text-slate-700 hover:border-blue-200 hover:text-blue-700'
                            }`}
                            onClick={() => handleActionFeedback(action, option.value)}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>

                    {actionFeedback && (
                      <div className="w-full break-words rounded-2xl border border-emerald-100 bg-emerald-50/95 px-3 py-2 text-sm leading-relaxed text-emerald-800">
                        {actionFeedback.message}
                      </div>
                    )}

                    {hasExpandableDetails && (
                      <div className="space-y-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition hover:text-blue-800"
                          onClick={() => toggleActionDetails(action.id)}
                        >
                          {isDetailsExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                          {isDetailsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>

                        {isDetailsExpanded && (
                          <div className="space-y-4 rounded-[22px] bg-white/80 p-4 shadow-sm">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Descricao completa
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

                            {actionQuickTip && (
                              <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-3 py-2 text-sm leading-relaxed text-blue-800">
                                <span className="font-medium">Dica rapida:</span> {actionQuickTip}
                              </div>
                            )}

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
                                <p className="text-sm leading-relaxed text-slate-600">{action.impact}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {isInProgress && (
                      <div className="break-words rounded-2xl bg-blue-50 px-3 py-2 text-sm font-medium leading-relaxed text-blue-700">
                        Acao em andamento. Quando testar na rotina, marque como testada.
                      </div>
                    )}

                    {isCompleted && (
                      <div className="flex items-start gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-medium leading-relaxed text-emerald-700 sm:items-center">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
                        Acao testada e registrada no progresso da jornada.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-slate-500">
            Guarde o detalhe para quando precisar. No dia a dia, acompanhe estas acoes pela proxima fatura.
          </p>

          {contextInvoice && (
            <div className="rounded-[24px] bg-gradient-to-r from-emerald-50 via-white to-blue-50 p-4">
              <div className="space-y-2 text-sm">
                <p className="font-medium text-slate-800">Fatura em foco: {contextInvoiceLabel}</p>
                {analysis && (
                  <div className="flex flex-wrap gap-2 text-slate-600">
                    <span className="rounded-full bg-white/80 px-3 py-1">
                      Consumo: {formatConsumption(contextInvoice.consumption)}
                    </span>
                    <span className="rounded-full bg-white/80 px-3 py-1">
                      Custo: {formatCurrency(contextInvoice.totalValue)}
                    </span>
                    <span className="rounded-full bg-white/80 px-3 py-1">{analysis.efficiencyLabel}</span>
                  </div>
                )}
                <p className="leading-6 text-slate-600">{footerContext}</p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default SmartRecommendations;
