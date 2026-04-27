import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  Crown,
  Lightbulb,
  MessageCircleHeart,
  Sparkles,
  UserRound,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  AnalysisSummary,
  InvoiceData,
  MascotContextQuestion,
  MascotContextQuestionValue,
  MascotGuidance,
  NextAction,
  ScoreExplanation,
  ScoreState,
  UserProfileData,
} from '@/types/mvp';

export type DynamicContextPanelView =
  | 'mascot'
  | 'co2'
  | 'history'
  | 'actions'
  | 'score'
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
  scoreState: ScoreState;
  scoreExplanation: ScoreExplanation;
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
  onOpenScoreDetails: () => void;
  onSelectInvoice?: (invoice: InvoiceData) => void;
}

const stageLabels = {
  onboarding: 'Comeco',
  'before-upload': 'Preparacao',
  'invoice-uploaded': 'Subindo leitura',
  'analysis-ready': 'Leitura pronta',
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
    label: 'Dica CO2',
    icon: Zap,
  },
  history: {
    title: 'Painel ativo',
    label: 'Historico',
    icon: BarChart3,
  },
  actions: {
    title: 'Painel ativo',
    label: 'Acao atual',
    icon: Lightbulb,
  },
  score: {
    title: 'Painel ativo',
    label: 'Score',
    icon: Crown,
  },
  summary: {
    title: 'Painel ativo',
    label: 'Leitura',
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
  scoreState,
  scoreExplanation,
  contextQuestion,
  onContextQuestionAnswer,
  onContextQuestionIgnore,
  onOpenActions,
  onOpenHistory,
  onOpenSummary,
  onOpenProfileDetails,
  onOpenScoreDetails,
  onSelectInvoice,
}: DynamicContextPanelProps) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const panelSignature = [
    activeView,
    activeTip,
    activeObjective,
    selectedInvoice?.fingerprint,
    nextAction?.id,
    scoreState.score,
    profileCompletion,
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
  const quickActions = actions.slice(0, 2);
  const panelConfig = panelMeta[activeView];
  const PanelIcon = panelConfig.icon;

  React.useEffect(() => {
    setIsVisible(false);

    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [panelSignature]);

  const renderPrimaryAction = (cta: string, onClick: () => void, icon: React.ReactNode) => (
    <Button
      onClick={onClick}
      className="mt-auto w-full justify-between rounded-[16px] border border-[#365f58] bg-[#0f342f] text-[#f5f8f3] hover:bg-[#18453f]"
    >
      {cta}
      {icon}
    </Button>
  );

  const renderHistoryBars = () => {
    if (sortedInvoices.length === 0) {
      return (
        <div className="rounded-[16px] border border-[#365f58] bg-[#163f39] px-4 py-5 text-sm text-[#c5d8c8]">
          O historico aparece quando houver mais de uma leitura.
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

          {renderPrimaryAction(
            nextAction ? 'Abrir acao atual' : latestAnalysis ? 'Abrir leitura' : 'Abrir perfil',
            () => {
              if (nextAction) {
                onOpenActions();
                return;
              }

              if (latestAnalysis) {
                onOpenSummary();
                return;
              }

              onOpenProfileDetails();
            },
            <Lightbulb className="h-4 w-4" />
          )}
        </div>
      );
    }

    if (activeView === 'co2') {
      return (
        <div className="flex h-full flex-col gap-4">
          <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
            <p className="text-xl font-semibold leading-tight text-[#f5f8f3]">
              {activeTip || 'Toque em um CO2 para ver a leitura do momento.'}
            </p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
              {activeObjective || 'Acompanhe o proximo passo da jornada'}
            </p>
          </div>

          <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-5 text-sm leading-6 text-[#c5d8c8]">
            {compactText(latestAnalysis?.whatMattersNext || guidance.message, 148)}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="rounded-[14px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43]"
              onClick={onOpenSummary}
            >
              Abrir leitura
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
          <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-4">
            {renderHistoryBars()}
          </div>

          {focusedInvoice && (
            <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
              <p className="text-lg font-semibold text-[#f5f8f3]">
                {getInvoiceReferenceLabel(focusedInvoice)}
              </p>
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
            </div>
          )}

          {renderPrimaryAction('Abrir historico', onOpenHistory, <BarChart3 className="h-4 w-4" />)}
        </div>
      );
    }

    if (activeView === 'actions') {
      return (
        <div className="flex h-full flex-col gap-4">
          <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xl font-semibold text-[#f5f8f3]">
                  {nextAction?.title || 'Nenhuma acao em foco'}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#c5d8c8]">
                  {compactText(nextAction?.value || nextAction?.description || guidance.message, 140)}
                </p>
              </div>
              {nextAction && (
                <Badge className="shrink-0 border-none bg-[#ffd15c] px-3 py-1 text-[#40320a]">
                  {priorityLabels[nextAction.priority]}
                </Badge>
              )}
            </div>
          </div>

          {quickActions[1] && (
            <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#f5f8f3]">
                <CheckCircle2 className="h-4 w-4 text-[#8fd08e]" />
                Frente seguinte
              </div>
              <p className="mt-2 text-sm leading-6 text-[#c5d8c8]">
                {compactText(quickActions[1].title, 84)}
              </p>
            </div>
          )}

          {renderPrimaryAction('Abrir recomendacoes', onOpenActions, <Lightbulb className="h-4 w-4" />)}
        </div>
      );
    }

    if (activeView === 'score') {
      return (
        <div className="flex h-full flex-col gap-4">
          <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
            <p className="text-xl font-semibold text-[#f5f8f3]">{scoreExplanation.summary}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-[14px] bg-[#113731] px-4 py-4">
                <div className="text-[#9dbfa6]">Nivel</div>
                <div className="mt-1 text-lg font-semibold text-[#f5f8f3]">{scoreState.level}</div>
              </div>
              <div className="rounded-[14px] bg-[#113731] px-4 py-4">
                <div className="text-[#9dbfa6]">Proximo ganho</div>
                <div className="mt-1 text-sm font-semibold leading-5 text-[#f5f8f3]">
                  {scoreExplanation.nextGain?.title || 'Continue a jornada'}
                </div>
              </div>
            </div>
          </div>

          {renderPrimaryAction('Entender score', onOpenScoreDetails, <Crown className="h-4 w-4" />)}
        </div>
      );
    }

    if (activeView === 'summary') {
      return (
        <div className="flex h-full flex-col gap-4">
          <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
            <p className="text-xl font-semibold text-[#f5f8f3]">
              {latestAnalysis?.whatMattersNext || guidance.title}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#c5d8c8]">
              {compactText(latestAnalysis?.headline || guidance.message, 148)}
            </p>
          </div>

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

          {renderPrimaryAction('Abrir leitura', onOpenSummary, <Sparkles className="h-4 w-4" />)}
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col gap-4">
        <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
          <p className="text-xl font-semibold text-[#f5f8f3]">{profile.consumerType}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[14px] bg-[#113731] px-4 py-4">
              <div className="text-[#9dbfa6]">Perfil</div>
              <div className="mt-1 font-semibold text-[#f5f8f3]">{profileCompletion}%</div>
            </div>
            <div className="rounded-[14px] bg-[#113731] px-4 py-4">
              <div className="text-[#9dbfa6]">Local</div>
              <div className="mt-1 font-semibold text-[#f5f8f3]">
                {profile.location || 'Nao informado'}
              </div>
            </div>
            <div className="rounded-[14px] bg-[#113731] px-4 py-4">
              <div className="text-[#9dbfa6]">Energia</div>
              <div className="mt-1 font-semibold text-[#f5f8f3]">{profile.energyPreference}</div>
            </div>
            <div className="rounded-[14px] bg-[#113731] px-4 py-4">
              <div className="text-[#9dbfa6]">Etapa</div>
              <div className="mt-1 font-semibold text-[#f5f8f3]">{stageLabels[guidance.stage]}</div>
            </div>
          </div>
        </div>

        {renderPrimaryAction('Abrir perfil', onOpenProfileDetails, <UserRound className="h-4 w-4" />)}
      </div>
    );
  };

  return (
    <Card className="min-h-[425px] overflow-hidden border border-[#2a5c56] bg-[#103a35] text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
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
