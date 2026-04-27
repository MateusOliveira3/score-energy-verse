import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  Crown,
  Lightbulb,
  MessageCircleHeart,
  Sparkles,
  TrendingUp,
  UserRound,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
    title: 'Proximo passo',
    icon: MessageCircleHeart,
    tone: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  },
  co2: {
    title: 'Dica capturada',
    icon: Zap,
    tone: 'text-cyan-700 bg-cyan-50 border-cyan-100',
  },
  history: {
    title: 'Historico em foco',
    icon: BarChart3,
    tone: 'text-blue-700 bg-blue-50 border-blue-100',
  },
  actions: {
    title: 'Recomendacoes',
    icon: Lightbulb,
    tone: 'text-amber-700 bg-amber-50 border-amber-100',
  },
  score: {
    title: 'Score atual',
    icon: Crown,
    tone: 'text-violet-700 bg-violet-50 border-violet-100',
  },
  summary: {
    title: 'Leitura atual',
    icon: Sparkles,
    tone: 'text-teal-700 bg-teal-50 border-teal-100',
  },
  profile: {
    title: 'Perfil ativo',
    icon: UserRound,
    tone: 'text-slate-700 bg-slate-50 border-slate-200',
  },
} as const;

const compactText = (value: string, maxLength = 120) => {
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
  const mascotPrimaryLabel = nextAction
    ? 'Abrir acao atual'
    : latestAnalysis
      ? 'Abrir leitura'
      : 'Abrir perfil';

  React.useEffect(() => {
    setIsVisible(false);

    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [panelSignature]);

  const handleMascotPrimaryAction = () => {
    if (nextAction) {
      onOpenActions();
      return;
    }

    if (latestAnalysis) {
      onOpenSummary();
      return;
    }

    onOpenProfileDetails();
  };

  const renderMascotPanel = () => (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              {nextAction?.title || guidance.title}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              {compactText(nextAction?.value || nextAction?.description || guidance.message, 132)}
            </p>
            {nextAction && (
              <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">
                Prioridade {priorityLabels[nextAction.priority]}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {contextQuestion && (
        <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Pergunta do mascote
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
            {contextQuestion.question}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {contextQuestion.options.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant="outline"
                onClick={() => onContextQuestionAnswer?.(contextQuestion.id, option.value)}
              >
                {option.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-500"
              onClick={() => onContextQuestionIgnore?.(contextQuestion.id)}
            >
              Agora nao
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[22px] border border-slate-200 bg-white/80 p-3 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Perfil
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{profileCompletion}%</div>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-white/80 p-3 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Etapa
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900">
            {stageLabels[guidance.stage]}
          </div>
        </div>
      </div>

      <Button onClick={handleMascotPrimaryAction} className="w-full justify-between rounded-[20px]">
        {mascotPrimaryLabel}
        <Lightbulb className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderCo2Panel = () => (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-cyan-100 bg-cyan-50/75 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
            <Zap className="h-4 w-4" />
          </div>
          <div className="space-y-2">
            <p className="text-base font-semibold leading-7 text-slate-900">
              {activeTip || 'Toque em um CO2 para ver a leitura do momento.'}
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
              {activeObjective || 'Acompanhe o proximo passo da jornada'}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Leitura atual
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {compactText(latestAnalysis?.whatMattersNext || guidance.message, 128)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="rounded-[18px]" onClick={onOpenSummary}>
          Abrir leitura
        </Button>
        <Button className="rounded-[18px]" onClick={onOpenActions}>
          Ver acoes
        </Button>
      </div>
    </div>
  );

  const renderHistoryPanel = () => (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex items-end gap-2">
          {sortedInvoices.length > 0 ? (
            sortedInvoices.map((invoice) => {
              const isFocused = focusedInvoice?.fingerprint === invoice.fingerprint;
              const height = Math.max(
                22,
                Math.round(
                  (((typeof invoice.consumption === 'number' ? invoice.consumption : 0) || 0) /
                    maxConsumption) *
                    100
                )
              );

              return (
                <button
                  key={invoice.fingerprint}
                  type="button"
                  onClick={() => onSelectInvoice?.(invoice)}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-28 w-full items-end rounded-[18px] bg-white/70 px-1.5 py-1.5 shadow-inner">
                    <div
                      className={cn(
                        'w-full rounded-[14px] transition-all duration-300',
                        isFocused ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-blue-300'
                      )}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      'max-w-full truncate text-[11px] font-semibold',
                      isFocused ? 'text-blue-700' : 'text-slate-500'
                    )}
                  >
                    {getInvoiceReferenceLabel(invoice)}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="w-full rounded-[22px] bg-white/80 p-4 text-sm text-slate-500">
              O grafico aparece quando houver historico suficiente.
            </div>
          )}
        </div>
      </div>

      {focusedInvoice && (
        <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <TrendingUp className="h-3.5 w-3.5" />
            Fatura em foco
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {getInvoiceReferenceLabel(focusedInvoice)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-slate-500">Consumo</div>
              <div className="font-semibold text-slate-900">
                {formatConsumption(focusedInvoice.consumption)}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Custo</div>
              <div className="font-semibold text-slate-900">
                {formatCurrency(focusedInvoice.totalValue)}
              </div>
            </div>
          </div>
        </div>
      )}

      <Button onClick={onOpenHistory} className="w-full justify-between rounded-[20px]">
        Abrir historico
        <BarChart3 className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderActionsPanel = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        {quickActions.map((action, index) => (
          <div
            key={action.id}
            className={cn(
              'rounded-[24px] border p-4 shadow-sm transition-colors',
              index === 0 ? 'border-amber-200 bg-amber-50/80' : 'border-slate-200 bg-white/80'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {compactText(action.value || action.description, 118)}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 bg-white">
                {priorityLabels[action.priority]}
              </Badge>
            </div>
            {action.impact && (
              <div className="mt-3 flex items-start gap-2 rounded-[18px] bg-white/80 px-3 py-2 text-xs text-slate-500">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{compactText(action.impact, 84)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Em foco
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {compactText(latestAnalysis?.whatMattersNext || guidance.message, 118)}
        </p>
      </div>

      <Button onClick={onOpenActions} className="w-full justify-between rounded-[20px]">
        Abrir recomendacoes
        <Lightbulb className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderScorePanel = () => (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-violet-100 bg-violet-50/75 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
              Score atual
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-bold leading-none text-slate-900">
                {scoreState.score.toLocaleString()}
              </span>
              <span className="pb-1 text-sm text-violet-700">pontos</span>
            </div>
          </div>
          <Badge variant="outline" className="border-violet-200 bg-white text-violet-700">
            Nivel {scoreState.level}
          </Badge>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">{scoreExplanation.summary}</p>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>{scoreState.score} pontos</span>
            <span>{scoreState.nextLevelScore} proximo marco</span>
          </div>
          <Progress value={scoreState.progressToNextLevel} className="h-2.5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[22px] border border-slate-200 bg-white/80 p-3 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Proximo ganho
          </div>
          <div className="mt-2 text-sm font-semibold leading-5 text-slate-900">
            {scoreExplanation.nextGain?.title || 'Continue a jornada atual'}
          </div>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-white/80 p-3 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Perfil
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900">{profile.consumerType}</div>
        </div>
      </div>

      <Button onClick={onOpenScoreDetails} className="w-full justify-between rounded-[20px]">
        Entender score
        <Crown className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderSummaryPanel = () => (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-teal-100 bg-teal-50/75 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          Leitura em foco
        </p>
        <p className="mt-2 text-base font-semibold leading-7 text-slate-900">
          {latestAnalysis?.whatMattersNext || guidance.title}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {compactText(latestAnalysis?.headline || guidance.message, 138)}
        </p>
      </div>

      {focusedInvoice && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[22px] border border-slate-200 bg-white/80 p-3 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Fatura
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              {getInvoiceReferenceLabel(focusedInvoice)}
            </div>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white/80 p-3 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Consumo
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              {formatConsumption(focusedInvoice.consumption)}
            </div>
          </div>
        </div>
      )}

      <Button onClick={onOpenSummary} className="w-full justify-between rounded-[20px]">
        Abrir leitura detalhada
        <BarChart3 className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderProfilePanel = () => (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Perfil ativo
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">{profile.consumerType}</p>
          </div>
          <Badge variant="outline" className="bg-white text-slate-600">
            {profileCompletion}%
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-[18px] bg-white px-3 py-3">
            <div className="text-slate-500">Local</div>
            <div className="mt-1 font-semibold text-slate-900">
              {profile.location || 'Nao informado'}
            </div>
          </div>
          <div className="rounded-[18px] bg-white px-3 py-3">
            <div className="text-slate-500">Energia</div>
            <div className="mt-1 font-semibold text-slate-900">{profile.energyPreference}</div>
          </div>
          <div className="rounded-[18px] bg-white px-3 py-3">
            <div className="text-slate-500">Pessoas</div>
            <div className="mt-1 font-semibold text-slate-900">{profile.peopleCount}</div>
          </div>
          <div className="rounded-[18px] bg-white px-3 py-3">
            <div className="text-slate-500">Imovel</div>
            <div className="mt-1 font-semibold text-slate-900">
              {profile.propertySize > 0 ? `${profile.propertySize} m2` : 'Nao informado'}
            </div>
          </div>
        </div>
      </div>

      <Button onClick={onOpenProfileDetails} className="w-full justify-between rounded-[20px]">
        Abrir perfil
        <UserRound className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white/85 shadow-lg backdrop-blur">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl border',
                panelConfig.tone
              )}
            >
              <PanelIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Painel dinamico
              </p>
              <p className="text-sm font-semibold text-slate-900">{panelConfig.title}</p>
            </div>
          </div>

          <Badge variant="outline" className="bg-white text-slate-500">
            1 foco
          </Badge>
        </div>

        <div
          className={cn(
            'mt-5 transition-all duration-300',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          )}
        >
          {activeView === 'mascot' && renderMascotPanel()}
          {activeView === 'co2' && renderCo2Panel()}
          {activeView === 'history' && renderHistoryPanel()}
          {activeView === 'actions' && renderActionsPanel()}
          {activeView === 'score' && renderScorePanel()}
          {activeView === 'summary' && renderSummaryPanel()}
          {activeView === 'profile' && renderProfilePanel()}
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicContextPanel;
