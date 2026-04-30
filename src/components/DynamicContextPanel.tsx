import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  Lightbulb,
  MessageCircleHeart,
  Sparkles,
  Upload,
  UserRound,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { buildAnalysisSummary, buildNextActions } from '@/lib/mvpCoreFlow';
import {
  AnalysisSummary,
  InvoiceData,
  MascotContextQuestion,
  MascotContextQuestionValue,
  MascotGuidance,
  NextAction,
  NextActionStatus,
  UserProfileData,
} from '@/types/mvp';
import UserProfile from './UserProfile';

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
  profileCompletion: number;
  profile: UserProfileData;
  isProfileComplete: boolean;
  contextQuestion?: MascotContextQuestion;
  onContextQuestionAnswer?: (
    questionId: MascotContextQuestion['id'],
    value: MascotContextQuestionValue
  ) => void;
  onContextQuestionIgnore?: (questionId: MascotContextQuestion['id']) => void;
  onOpenActions: () => void;
  onOpenHistory: () => void;
  onOpenSummary: () => void;
  onOpenProfileDetails: () => void;
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

const stageLabels = {
  onboarding: 'Comeco',
  'before-upload': 'Preparacao',
  'invoice-uploaded': 'Subindo resumo',
  'analysis-ready': 'Resumo pronto',
  'return-visit': 'Retomada',
} as const;

const priorityLabels = {
  high: 'Alta',
  medium: 'Media',
  low: 'Leve',
} as const;

const panelMeta = {
  mascot: {
    title: 'Painel ativo',
    label: 'Proximo passo',
    icon: MessageCircleHeart,
  },
  co2: {
    title: 'Painel ativo',
    label: 'Resumo ambiental',
    icon: Zap,
  },
  history: {
    title: 'Painel ativo',
    label: 'Historico',
    icon: BarChart3,
  },
  actions: {
    title: 'Painel ativo',
    label: 'Acoes',
    icon: Lightbulb,
  },
  summary: {
    title: 'Painel ativo',
    label: 'Resumo',
    icon: Sparkles,
  },
  profile: {
    title: 'Painel ativo',
    label: 'Perfil',
    icon: UserRound,
  },
} as const;

const compactText = (value: string, maxLength = 110) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength).trimEnd()}...`;

const getInvoiceReferenceLabel = (invoice: InvoiceData) => {
  const month = invoice.month?.trim();

  if (month) {
    return month;
  }

  const referenceMonth = invoice.parser.fields.referenceMonth.value?.trim();

  if (referenceMonth) {
    return referenceMonth;
  }

  return 'Sem referencia';
};

const getInvoiceSortTime = (invoice: InvoiceData) => {
  const referenceMonth = getInvoiceReferenceLabel(invoice);
  const numericMatch = referenceMonth.match(/\b(0[1-9]|1[0-2])\/(\d{4})\b/);

  if (numericMatch) {
    return Date.UTC(Number(numericMatch[2]), Number(numericMatch[1]) - 1, 1);
  }

  if (invoice.uploadedAt) {
    const uploadedAt = new Date(invoice.uploadedAt).getTime();

    if (!Number.isNaN(uploadedAt)) {
      return uploadedAt;
    }
  }

  return 0;
};

const formatCurrency = (value?: number) =>
  typeof value === 'number' ? `R$ ${value.toFixed(2)}` : 'Valor indisponivel';

const formatConsumption = (value?: number) =>
  typeof value === 'number' ? `${value} kWh` : 'Consumo indisponivel';

const getInsightContextLines = (consultiveInsight?: AnalysisSummary['consultiveInsight']) => {
  const contextLines: string[] = [];
  const season = consultiveInsight?.environmentContext?.season;
  const profileContext = consultiveInsight?.profileContext;

  if (profileContext?.warnings[0]) {
    contextLines.push(profileContext.warnings[0]);
  } else if (profileContext?.hasSolar) {
    contextLines.push('Perfil com energia solar indicada');
  } else if (profileContext?.profileType === 'Residencial' && profileContext.householdSize) {
    contextLines.push(`Perfil: residencia com ${profileContext.householdSize} ${profileContext.householdSize === 1 ? 'pessoa' : 'pessoas'}`);
  } else if (profileContext?.profileType) {
    contextLines.push(`Perfil: ${profileContext.profileType.toLowerCase()}`);
  }

  if (profileContext?.locationLabel) {
    contextLines.push(`Contexto local informado: ${profileContext.locationLabel}.`);
  } else if (season === 'inverno') {
    contextLines.push('Contexto: inverno na sua regiao');
  } else if (season === 'verao') {
    contextLines.push('Contexto: verao na sua regiao');
  } else if (season === 'meia_estacao') {
    contextLines.push('Contexto: meia estacao na sua regiao');
  }

  return contextLines.slice(0, 2);
};

const normalizeActionTitle = (action: NextAction, index: number) => {
  const rawTitle = action.title.trim();
  const searchableText = [action.title, action.description, action.value, action.context]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/(pico|horario|noite|tarde)/.test(searchableText)) {
    return 'Reduzir uso no horario de pico';
  }

  if (/(compar|acompanh|proxima fatura|proximo ciclo)/.test(searchableText)) {
    return 'Comparar proxima fatura';
  }

  if (/(7 dias|semana|test)/.test(searchableText)) {
    return 'Testar economia por 7 dias';
  }

  if (/(chuveiro|equipamento|geladeira|ar condicionado|lampada|motor|aparelho)/.test(searchableText)) {
    return 'Ajustar o equipamento mais usado';
  }

  if (rawTitle.length <= 40) {
    return rawTitle;
  }

  if (index === 0) {
    return 'Comecar pelo ajuste principal';
  }

  return 'Separar um teste simples';
};

const buildActionReason = ({
  action,
  latestAnalysis,
  focusedInvoice,
}: {
  action: NextAction;
  latestAnalysis?: AnalysisSummary;
  focusedInvoice?: InvoiceData;
}) => {
  const referenceLabel = focusedInvoice ? getInvoiceReferenceLabel(focusedInvoice) : 'o resumo atual';
  const explicitReason =
    action.context && action.context.trim().toLowerCase().startsWith('escolhida porque')
      ? action.context.trim()
      : undefined;
  const evidenceLead = explicitReason || action.description || action.context;

  if (evidenceLead) {
    return compactText(evidenceLead, 110);
  }

  if (latestAnalysis?.costSignal && latestAnalysis.costSignal !== 'controlado') {
    return `O resumo de ${referenceLabel} mostra pressao de custo neste ciclo.`;
  }

  if (latestAnalysis?.consumptionLevel === 'alto') {
    return `A fatura de ${referenceLabel} indica consumo acima do esperado neste momento.`;
  }

  return compactText(
    action.value || action.context || action.description || 'A proxima comparacao deve confirmar o efeito desta acao.',
    88
  );
};

const buildHistoryTrendLine = (
  history: InvoiceData[],
  focusedInvoice?: InvoiceData
) => {
  if (!focusedInvoice || history.length < 2 || typeof focusedInvoice.consumption !== 'number') {
    return undefined;
  }

  const comparableConsumptions = history
    .map((invoice) => invoice.consumption)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (comparableConsumptions.length < 2) {
    return undefined;
  }

  const averageConsumption =
    comparableConsumptions.reduce((sum, value) => sum + value, 0) / comparableConsumptions.length;

  if (!Number.isFinite(averageConsumption) || averageConsumption <= 0) {
    return undefined;
  }

  const variation = (focusedInvoice.consumption - averageConsumption) / averageConsumption;

  if (Math.abs(variation) <= 0.05) {
    return 'Este ciclo ficou proximo da media do historico.';
  }

  return variation > 0
    ? 'Este ciclo ficou acima da media do historico.'
    : 'Este ciclo ficou abaixo da media do historico.';
};

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
  profileCompletion,
  profile,
  isProfileComplete,
  contextQuestion,
  onContextQuestionAnswer,
  onContextQuestionIgnore,
  onOpenActions,
  onOpenHistory,
  onOpenSummary,
  onOpenProfileDetails,
  onSelectInvoice,
  onActionStatusChange,
  onProfileUpdate,
  isHistoryUploadVisible,
  onToggleHistoryUpload,
  historyUploadContent,
}: DynamicContextPanelProps) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const [localActionFeedback, setLocalActionFeedback] = React.useState<Record<string, string>>({});
  const [historyFeedback, setHistoryFeedback] = React.useState<string | null>(null);
  const previousInvoiceCountRef = React.useRef(invoiceHistory.length);
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
  const focusedInvoice =
    selectedInvoice ||
    sortedInvoices[sortedInvoices.length - 1] ||
    invoiceHistory[invoiceHistory.length - 1];
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

    return buildAnalysisSummary(focusedInvoice, profile, invoiceHistory);
  }, [focusedInvoice, invoiceHistory, latestAnalysis, profile]);
  const prioritizedActions = React.useMemo(() => {
    if (!focusedInvoice || !contextAnalysis) {
      return actions.slice(0, 2);
    }

    return buildNextActions(focusedInvoice, contextAnalysis, profile).slice(0, 2);
  }, [actions, contextAnalysis, focusedInvoice, profile]);
  const educationItems = contextAnalysis?.educationItems ?? [];
  const consultiveInsight = contextAnalysis?.consultiveInsight;
  const contextLines = getInsightContextLines(consultiveInsight);

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

  const renderHistoryBars = () => {
    if (sortedInvoices.length === 0) {
      return (
        <div className="rounded-[16px] border border-[#365f58] bg-[#163f39] px-4 py-5 text-sm text-[#c5d8c8]">
          Seu historico ainda esta vazio. Adicione a primeira fatura por aqui para iniciar o resumo.
        </div>
      );
    }

    return (
      <div className="flex items-end gap-2">
        {sortedInvoices.map((invoice) => {
          const height = Math.max(
            20,
            Math.round(
              (((typeof invoice.consumption === 'number' ? invoice.consumption : 0) || 0) /
                maxConsumption) *
                82
            )
          );
          const isFocused = focusedInvoice?.fingerprint === invoice.fingerprint;

          return (
            <button
              key={invoice.fingerprint}
              type="button"
              onClick={() => onSelectInvoice?.(invoice)}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-24 w-full items-end rounded-[14px] bg-[#163f39] px-1.5 py-1.5">
                <div
                  className={cn(
                    'w-full rounded-[10px] transition-all duration-300',
                    isFocused ? 'bg-[#8fd08e]' : 'bg-[#5a8f74]'
                  )}
                  style={{ height: `${height}px` }}
                />
              </div>
              <span
                className={cn(
                  'max-w-full truncate text-[11px] font-medium',
                  isFocused ? 'text-[#f5f8f3]' : 'text-[#9dbfa6]'
                )}
              >
                {getInvoiceReferenceLabel(invoice)}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    if (activeView === 'mascot') {
      return (
        <div className="flex h-full flex-col gap-4">
          <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#7bc683] text-[#0f342f]">
                <MessageCircleHeart className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold leading-tight text-[#f5f8f3]">
                  {nextAction?.title || guidance.title}
                </p>
                <p className="text-sm leading-6 text-[#c5d8c8]">
                  {compactText(nextAction?.value || nextAction?.description || guidance.message, 136)}
                </p>
              </div>
            </div>
          </div>

          {contextQuestion && (
            <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
                Pergunta do mascote
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-[#f5f8f3]">
                {contextQuestion.question}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {contextQuestion.options.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant="outline"
                    className="rounded-[12px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43]"
                    onClick={() => onContextQuestionAnswer?.(contextQuestion.id, option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[12px] text-[#c5d8c8] hover:bg-[#18453f] hover:text-[#f5f8f3]"
                  onClick={() => onContextQuestionIgnore?.(contextQuestion.id)}
                >
                  Agora nao
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[16px] border border-[#365f58] bg-[#113731] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9dbfa6]">
                Perfil
              </div>
              <div className="mt-2 text-xl font-semibold text-[#f5f8f3]">{profileCompletion}%</div>
            </div>
            <div className="rounded-[16px] border border-[#365f58] bg-[#113731] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9dbfa6]">
                Etapa
              </div>
              <div className="mt-2 text-base font-semibold text-[#f5f8f3]">
                {stageLabels[guidance.stage]}
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              if (nextAction) {
                onOpenActions();
                return;
              }

              if (latestAnalysis) {
                onOpenSummary();
                return;
              }

              onOpenProfileDetails();
            }}
            className="mt-auto w-full justify-between rounded-[16px] border border-[#365f58] bg-[#0f342f] text-[#f5f8f3] hover:bg-[#18453f]"
          >
            {nextAction ? 'Abrir acao atual' : latestAnalysis ? 'Abrir resumo' : 'Editar perfil'}
            <Lightbulb className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    if (activeView === 'co2') {
      return (
        <div className="flex h-full flex-col gap-4">
          <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
            <p className="text-xl font-semibold leading-tight text-[#f5f8f3]">
              {activeTip || 'Toque em um CO2 para ver o resumo do momento.'}
            </p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
              {activeObjective || 'Acompanhe o proximo passo da jornada'}
            </p>
          </div>

          <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-5 text-sm leading-6 text-[#c5d8c8]">
            {compactText(contextAnalysis?.whatMattersNext || guidance.message, 148)}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="rounded-[14px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43]"
              onClick={onOpenSummary}
            >
              Abrir resumo
            </Button>
            <Button
              className="rounded-[14px] bg-[#5f925c] text-white hover:bg-[#517d4f]"
              onClick={onOpenActions}
            >
              Ver acoes
            </Button>
          </div>
        </div>
      );
    }

    if (activeView === 'history') {
      return (
        <div className="flex h-full flex-col gap-4">
          {historyFeedback && (
            <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
              {historyFeedback}
            </div>
          )}

          <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-4">
            {renderHistoryBars()}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
              <div className="text-[#9dbfa6]">Faturas no historico</div>
              <div className="mt-1 text-xl font-semibold text-[#f5f8f3]">
                {invoiceHistory.length}
              </div>
            </div>
            <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
              <div className="text-[#9dbfa6]">Consumo medio</div>
              <div className="mt-1 text-xl font-semibold text-[#f5f8f3]">
                {historyAverageConsumption ? `${historyAverageConsumption} kWh` : '--'}
              </div>
            </div>
          </div>

          {focusedInvoice ? (
            <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
                    Fatura em foco
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[#f5f8f3]">
                    {getInvoiceReferenceLabel(focusedInvoice)}
                  </p>
                </div>
                <Badge className="border border-[#365f58] bg-[#143d37] text-[#f5f8f3]">
                  Historico ativo
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[#9dbfa6]">Consumo</div>
                  <div className="font-semibold text-[#f5f8f3]">
                    {formatConsumption(focusedInvoice.consumption)}
                  </div>
                </div>
                <div>
                  <div className="text-[#9dbfa6]">Custo</div>
                  <div className="font-semibold text-[#f5f8f3]">
                    {formatCurrency(focusedInvoice.totalValue)}
                  </div>
                </div>
              </div>
              {historyTrendLine && (
                <div className="mt-4 rounded-[14px] border border-[#365f58] bg-[#163f39] px-3 py-3 text-sm leading-6 text-[#d9ead8]">
                  {historyTrendLine}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4 text-sm leading-6 text-[#c5d8c8]">
              A primeira fatura enviada passa a ser o ponto de partida do resumo e das proximas acoes.
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              onClick={onToggleHistoryUpload}
              className="justify-between rounded-[14px] bg-[#5f925c] text-white hover:bg-[#517d4f]"
            >
              {isHistoryUploadVisible ? 'Ocultar upload' : 'Adicionar fatura'}
              <Upload className="h-4 w-4" />
            </Button>
            {focusedInvoice && (
              <Button
                variant="outline"
                onClick={onOpenSummary}
                className="justify-between rounded-[14px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43]"
              >
                Abrir resumo da fatura
                <Sparkles className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isHistoryUploadVisible && historyUploadContent}
        </div>
      );
    }

    if (activeView === 'actions') {
      return (
        <div className="flex h-full flex-col gap-4">
          {prioritizedActions.length === 0 ? (
            <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
              <p className="text-xl font-semibold text-[#f5f8f3]">Sem acao prioritaria agora</p>
              <p className="mt-3 text-sm leading-6 text-[#c5d8c8]">
                Volte para o resumo atual ou envie uma nova fatura para gerar contexto.
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
              const supportingContext = action.context && action.context !== action.description
                ? compactText(action.context, 112)
                : null;
              const clearCta = action.suggestion ? compactText(action.suggestion, 84) : null;

              return (
                <div
                  key={action.id}
                  className={cn(
                    'rounded-[18px] border p-4',
                    index === 0
                      ? 'border-[#7eb77b] bg-[#163f39]'
                      : 'border-[#365f58] bg-[#113731]'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      {index === 0 && (
                        <Badge className="border-none bg-[#8fd08e] text-[#14352f]">
                          Acao principal
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

                  <div className="mt-4 flex flex-wrap gap-2">
                    {status === 'completed' ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Acao ja testada na jornada
                      </div>
                    ) : index === 0 ? (
                      <Button
                        onClick={() => {
                          setLocalActionFeedback((currentFeedback) => ({
                            ...currentFeedback,
                            [action.id]: 'Acao iniciada',
                          }));
                          onActionStatusChange(action, 'in_progress');
                        }}
                        className="rounded-[14px] bg-[#5f925c] text-white hover:bg-[#517d4f]"
                      >
                        Comecar acao
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setLocalActionFeedback((currentFeedback) => ({
                            ...currentFeedback,
                            [action.id]: 'Acompanharemos no proximo ciclo',
                          }));
                          onActionStatusChange(action, 'in_progress');
                        }}
                        className="rounded-[14px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43]"
                      >
                        Preparar teste
                      </Button>
                    )}
                  </div>

                  {localActionFeedback[action.id] && (
                    <div className="mt-3 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium leading-6 text-emerald-900">
                      {localActionFeedback[action.id]}
                    </div>
                  )}
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
    }

    if (activeView === 'summary') {
      return (
        <div className="flex h-full flex-col gap-4">
          <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
              Resumo guiado
            </p>
            <p className="mt-2 text-xl font-semibold text-[#f5f8f3]">
              {consultiveInsight?.conclusion || contextAnalysis?.headline || guidance.title}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#c5d8c8]">
              {consultiveInsight?.evidence || contextAnalysis?.whatMattersNext || guidance.message}
            </p>
            {contextLines.map((line) => (
              <p
                key={line}
                className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-[#9dbfa6]"
              >
                {line}
              </p>
            ))}
          </div>

          {consultiveInsight && (
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-[18px] border border-[#7eb77b] bg-[#123f39] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#bfe7bc]">
                  Acao recomendada
                </div>
                <div className="mt-2 text-base font-semibold text-[#f5f8f3]">
                  {consultiveInsight.primaryAction.title}
                </div>
                <div className="mt-2 text-sm leading-6 text-[#d9ead8]">
                  {consultiveInsight.primaryAction.reason}
                </div>
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#bfe7bc]">
                  CTA: {consultiveInsight.primaryAction.ctaLabel}
                </div>
              </div>
            </div>
          )}

          {focusedInvoice && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
                <div className="text-[#9dbfa6]">Fatura</div>
                <div className="mt-1 font-semibold text-[#f5f8f3]">
                  {getInvoiceReferenceLabel(focusedInvoice)}
                </div>
              </div>
              <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
                <div className="text-[#9dbfa6]">Consumo</div>
                <div className="mt-1 font-semibold text-[#f5f8f3]">
                  {formatConsumption(focusedInvoice.consumption)}
                </div>
              </div>
            </div>
          )}

          {educationItems[0] && (
            <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
                Microeducacao
              </p>
              <p className="mt-2 text-sm leading-6 text-[#c5d8c8]">
                <span className="font-semibold text-[#f5f8f3]">{educationItems[0].label}:</span>{' '}
                {educationItems[0].explanation}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              onClick={onOpenActions}
              className="justify-between rounded-[14px] bg-[#5f925c] text-white hover:bg-[#517d4f]"
            >
              Abrir acao principal
              <Lightbulb className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={onOpenHistory}
              className="justify-between rounded-[14px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43]"
            >
              Voltar ao historico
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col gap-4">
        <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-semibold text-[#f5f8f3]">{profile.consumerType}</p>
              <p className="mt-2 text-sm leading-6 text-[#c5d8c8]">
                {isProfileComplete
                  ? 'Seu contexto ja apoia o resumo da fatura. Se quiser, voce pode editar esse perfil por aqui.'
                  : 'Complete o perfil para deixar resumo, historico e acoes mais coerentes com a sua realidade.'}
              </p>
            </div>
            <Badge className="border border-[#365f58] bg-[#143d37] text-[#f5f8f3]">
              {profileCompletion}%
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[14px] bg-[#113731] px-4 py-4">
              <div className="text-[#9dbfa6]">Local</div>
              <div className="mt-1 font-semibold text-[#f5f8f3]">
                {profile.location || 'Nao informado'}
              </div>
            </div>
            <div className="rounded-[14px] bg-[#113731] px-4 py-4">
              <div className="text-[#9dbfa6]">Energia</div>
              <div className="mt-1 font-semibold text-[#f5f8f3]">
                {profile.energyPreference}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#f5f8f3]">
                {isProfileComplete ? 'Editar perfil' : 'Completar perfil'}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#c5d8c8]">
                A edicao usa o fluxo existente da jornada e nao cria persistencia nova.
              </p>
            </div>
            <UserProfile
              value={profile}
              completionPercent={profileCompletion}
              isComplete={isProfileComplete}
              onProfileUpdate={onProfileUpdate}
              triggerLabel={isProfileComplete ? 'Editar perfil' : 'Completar perfil'}
              triggerClassName="rounded-[14px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43] hover:text-[#f5f8f3]"
            />
          </div>
        </div>
      </div>
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
            </div>
          </div>

          <Badge className="border border-[#365f58] bg-[#123f39] text-[#f5f8f3]">
            1 foco
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
