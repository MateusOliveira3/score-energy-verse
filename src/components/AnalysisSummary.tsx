import React from 'react';
import { ChevronDown, ChevronRight, FileBarChart, ScanSearch, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buildAnalysisSummary } from '@/lib/mvpCoreFlow';
import {
  AnalysisSummary as AnalysisSummaryType,
  EnergyBehaviorProfile,
  InvoiceData,
  UserProfileData,
} from '@/types/mvp';

interface AnalysisSummaryProps {
  invoice?: InvoiceData;
  selectedInvoice?: InvoiceData;
  analysis?: AnalysisSummaryType;
  profile: UserProfileData;
  energyBehaviorProfile: EnergyBehaviorProfile;
  invoiceHistory?: InvoiceData[];
  isCurrentJourneyFocus?: boolean;
  onSelectInvoice?: (invoice: InvoiceData) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  showHeader?: boolean;
  showEducationalContent?: boolean;
}

const consumptionVariant = {
  baixo: 'bg-emerald-100 text-emerald-700',
  moderado: 'bg-yellow-100 text-yellow-700',
  alto: 'bg-red-100 text-red-700',
} as const;

const costVariant = {
  controlado: 'bg-emerald-100 text-emerald-700',
  atencao: 'bg-amber-100 text-amber-700',
  elevado: 'bg-rose-100 text-rose-700',
} as const;

const costLabel = {
  controlado: 'controlado',
  atencao: 'sob atencao',
  elevado: 'elevado',
} as const;

const formatCurrency = (value?: number) =>
  typeof value === 'number' ? `R$ ${value.toFixed(2)}` : 'Nao identificado';

const formatConsumption = (value?: number) =>
  typeof value === 'number' ? `${value} kWh` : 'Nao identificado';

const formatCurrencyPerKwh = (value?: number) =>
  typeof value === 'number' ? `R$ ${value.toFixed(2)}/kWh` : undefined;

const getInsightContextLines = (consultiveInsight?: AnalysisSummaryType['consultiveInsight']) => {
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

const getInvoiceReferenceLabel = (invoice: InvoiceData) => {
  const month = invoice.month?.trim();

  if (month) {
    return month;
  }

  const referenceMonth = invoice.parser.fields.referenceMonth.value?.trim();

  if (referenceMonth) {
    return referenceMonth;
  }

  return 'Referencia nao identificada';
};

const getAverageCostPerKwh = (invoice: InvoiceData) => {
  if (
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

const PT_BR_MONTH_INDEX: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
};

const normalizeDateText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getInvoiceCompetenceTime = (invoice: InvoiceData) => {
  const normalizedMonth = normalizeDateText(getInvoiceReferenceLabel(invoice));
  const numericMatch = normalizedMonth.match(/\b(0[1-9]|1[0-2])\/(\d{4})\b/);

  if (numericMatch) {
    return Date.UTC(Number(numericMatch[2]), Number(numericMatch[1]) - 1, 1);
  }

  const monthKey = Object.keys(PT_BR_MONTH_INDEX).find((month) =>
    normalizedMonth.includes(month)
  );
  const year = Number(normalizedMonth.match(/\b\d{4}\b/)?.[0]);

  if (!monthKey || !Number.isFinite(year)) {
    return undefined;
  }

  return Date.UTC(year, PT_BR_MONTH_INDEX[monthKey], 1);
};

const getInvoiceUploadTime = (invoice: InvoiceData) => {
  if (!invoice.uploadedAt) {
    return undefined;
  }

  const time = new Date(invoice.uploadedAt).getTime();
  return Number.isNaN(time) ? undefined : time;
};

const getInvoiceComparisonReference = (invoice: InvoiceData) => {
  const competenceTime = getInvoiceCompetenceTime(invoice);

  if (competenceTime !== undefined) {
    return {
      basis: 'competence' as const,
      time: competenceTime,
    };
  }

  const uploadTime = getInvoiceUploadTime(invoice);

  if (uploadTime !== undefined) {
    return {
      basis: 'upload' as const,
      time: uploadTime,
    };
  }

  return {
    basis: 'history' as const,
    time: undefined,
  };
};

const COMPARISON_REFERENCE_PRIORITY: Record<
  ReturnType<typeof getInvoiceComparisonReference>['basis'],
  number
> = {
  competence: 0,
  upload: 1,
  history: 2,
};

const sortInvoicesForUiComparison = (invoiceHistory: InvoiceData[]) =>
  [...invoiceHistory]
    .map((invoice, index) => ({
      index,
      invoice,
      reference: getInvoiceComparisonReference(invoice),
    }))
    .sort((left, right) => {
      const priorityDifference =
        COMPARISON_REFERENCE_PRIORITY[left.reference.basis] -
        COMPARISON_REFERENCE_PRIORITY[right.reference.basis];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      if (left.reference.time === undefined && right.reference.time === undefined) {
        return left.index - right.index;
      }

      if (left.reference.time === undefined) {
        return 1;
      }

      if (right.reference.time === undefined) {
        return -1;
      }

      return right.reference.time - left.reference.time;
    })
    .map(({ invoice }) => invoice);

const getPreviousChronologicalInvoice = (
  invoiceHistory: InvoiceData[],
  currentInvoice?: InvoiceData
) => {
  if (!currentInvoice) {
    return undefined;
  }

  const sortedInvoices = sortInvoicesForUiComparison(invoiceHistory);
  const currentIndex = sortedInvoices.findIndex(
    (invoice) => invoice.fingerprint === currentInvoice.fingerprint
  );

  if (currentIndex === -1) {
    return undefined;
  }

  return sortedInvoices[currentIndex + 1];
};

const buildConsumptionTrendMessage = (
  invoiceHistory: InvoiceData[],
  currentInvoice?: InvoiceData
) => {
  if (!currentInvoice || invoiceHistory.length < 2) {
    return undefined;
  }

  const previousInvoice = getPreviousChronologicalInvoice(invoiceHistory, currentInvoice);

  if (
    !previousInvoice ||
    typeof currentInvoice.consumption !== 'number' ||
    !Number.isFinite(currentInvoice.consumption) ||
    typeof previousInvoice.consumption !== 'number' ||
    !Number.isFinite(previousInvoice.consumption)
  ) {
    return 'Ainda nao ha dados suficientes para tendencia segura.';
  }

  if (currentInvoice.consumption > previousInvoice.consumption) {
    return 'Seu consumo esta em tendencia de alta.';
  }

  if (currentInvoice.consumption < previousInvoice.consumption) {
    return 'Seu consumo esta em tendencia de queda.';
  }

  return 'Seu consumo esta estavel.';
};

const buildHistoryAverageMessage = (
  invoiceHistory: InvoiceData[],
  currentInvoice?: InvoiceData
) => {
  if (!currentInvoice || typeof currentInvoice.consumption !== 'number') {
    return undefined;
  }

  const comparableConsumptions = invoiceHistory
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

  const variation = (currentInvoice.consumption - averageConsumption) / averageConsumption;

  if (Math.abs(variation) <= 0.05) {
    return 'Este ciclo ficou proximo da media do historico.';
  }

  return variation > 0
    ? 'Este ciclo ficou acima da media do historico.'
    : 'Este ciclo ficou abaixo da media do historico.';
};

const AnalysisSummary = ({
  invoice,
  selectedInvoice,
  analysis,
  profile,
  energyBehaviorProfile,
  invoiceHistory,
  isCurrentJourneyFocus = true,
  onSelectInvoice,
  isExpanded = false,
  onToggle,
  showHeader = true,
  showEducationalContent = true,
}: AnalysisSummaryProps) => {
  const expansionIcon = isExpanded ? ChevronDown : ChevronRight;
  const contextInvoice = selectedInvoice ?? invoice;
  const invoiceCount = invoiceHistory?.length ?? 0;
  const history = invoiceHistory ?? [];
  const showInvoiceSelector = Boolean(
    contextInvoice && invoiceHistory && invoiceHistory.length > 1 && onSelectInvoice
  );

  if (!invoice || !analysis || !contextInvoice) {
    return (
      <Card className="border-2 border-slate-100 shadow-lg">
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
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center space-x-2 text-slate-700">
                  <ScanSearch className="h-5 w-5" />
                  <span>Resumo da analise</span>
                </CardTitle>
                <p className="text-sm text-slate-500">Resumo consolidado da fatura em foco.</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <span>{isExpanded ? 'Fechar' : 'Ver mais'}</span>
                {React.createElement(expansionIcon, { className: 'h-4 w-4' })}
              </div>
            </div>
          </CardHeader>
        )}
        {isExpanded && (
          <CardContent className="space-y-3 text-sm text-slate-600">
            {showInvoiceSelector && contextInvoice && invoiceHistory && onSelectInvoice && (
              <div className="flex justify-end">
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Fatura em foco</span>
                  <select
                    aria-label="Selecionar fatura para resumir a analise"
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
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
            <p>
              A analise fica disponivel apos adicionar uma fatura ao historico. Ela organiza o
              arquivo em campos reais quando o resumo da conta e confiavel.
            </p>
            <p>
              O perfil {profile.consumerType.toLowerCase()} ajuda a interpretar o resumo, sem
              estimar numeros ausentes.
            </p>
          </CardContent>
        )}
      </Card>
    );
  }

  const referenceLabel = getInvoiceReferenceLabel(contextInvoice);
  const averageCostPerKwh = getAverageCostPerKwh(contextInvoice);
  const contextAnalysis = isCurrentJourneyFocus
    ? analysis
    : buildAnalysisSummary(contextInvoice, profile, history, energyBehaviorProfile);
  const consultativeInsights = contextAnalysis.consultativeInsights ?? [];
  const educationItems = contextAnalysis.educationItems ?? [];
  const evidenceItems = contextAnalysis.evidenceItems ?? [];
  const behaviorHighlights = contextAnalysis.behaviorHighlights ?? [];
  const consultiveInsight = contextAnalysis.consultiveInsight;
  const contextLines = getInsightContextLines(consultiveInsight);
  const consumptionTrendMessage = buildConsumptionTrendMessage(history, contextInvoice);
  const historyAverageMessage = buildHistoryAverageMessage(history, contextInvoice);
  const historyContextMessage =
    invoiceCount >= 3
      ? `Voce ja tem ${invoiceCount} meses de historico. Continue acompanhando para entender seu padrao.`
      : invoiceCount === 2
        ? 'No proximo ciclo, compare se esse padrao se mantem ou muda.'
        : invoiceCount === 1
          ? 'Adicione a proxima fatura para comecar a ver evolucao.'
          : undefined;

  return (
    <Card className="border-2 border-slate-100 shadow-lg">
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
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center space-x-2 text-slate-700">
                <FileBarChart className="h-5 w-5" />
                <span>Resumo da analise</span>
              </CardTitle>
              <p className="text-sm text-slate-500">
                {referenceLabel
                  ? `Fatura em foco: ${referenceLabel}.`
                  : 'Resumo consolidado da fatura em foco.'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <span>{isExpanded ? 'Fechar' : 'Ver mais'}</span>
              {React.createElement(expansionIcon, { className: 'h-4 w-4' })}
            </div>
          </div>
        </CardHeader>
      )}
      {isExpanded && (
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {contextAnalysis.consumptionLevel && (
                <Badge className={consumptionVariant[contextAnalysis.consumptionLevel]}>
                  Consumo {contextAnalysis.consumptionLevel}
                </Badge>
              )}
              {contextAnalysis.costSignal && (
                <Badge className={costVariant[contextAnalysis.costSignal]}>
                  Custo {costLabel[contextAnalysis.costSignal]}
                </Badge>
              )}
              <Badge variant="outline">{referenceLabel}</Badge>
              {contextInvoice.parser.fields.providerName.value && (
                <Badge variant="outline">{contextInvoice.parser.fields.providerName.value}</Badge>
              )}
            </div>

            {showInvoiceSelector && contextInvoice && invoiceHistory && onSelectInvoice && (
              <label className="flex w-full flex-col gap-1 text-sm text-slate-600 lg:w-auto lg:min-w-56">
                <span className="font-medium text-slate-700">Fatura em foco</span>
                <select
                  aria-label="Selecionar fatura para resumir a analise"
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
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
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 p-4">
              <div className="text-sm text-emerald-700">Consumo</div>
              <div className="text-3xl font-bold text-emerald-900">
                {formatConsumption(contextInvoice.consumption)}
              </div>
              <div className="text-sm text-emerald-700">
                Perfil {profile.consumerType.toLowerCase()}
              </div>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Wallet className="h-4 w-4" />
                Custo
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {formatCurrency(contextInvoice.totalValue)}
              </div>
              <div className="text-sm text-blue-700">
                {contextInvoice.parser.fields.dueDate.value
                  ? `Vencimento ${contextInvoice.parser.fields.dueDate.value}`
                  : 'Vencimento nao identificado'}
              </div>
              {averageCostPerKwh !== undefined && (
                <div className="mt-2 text-sm text-blue-700">
                  Custo por kWh: {formatCurrencyPerKwh(averageCostPerKwh)}
                </div>
              )}
            </div>
          </div>

          {evidenceItems.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-800">Resumo baseado em evidencia</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {evidenceItems.slice(0, 4).map((item) => (
                  <div
                    key={`${item.label}-${item.value}`}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {item.label}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-800">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {consultiveInsight && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-emerald-900">
              {consultiveInsight.evidence}
              {behaviorHighlights.length > 0 && (
                <p className="mt-2">
                  Contexto aprendido: {behaviorHighlights.slice(0, 3).join(', ')}.
                </p>
              )}
            </div>
          )}

          {consultiveInsight && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Conclusao
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-800">{consultiveInsight.conclusion}</p>
                {contextLines.map((line) => (
                  <p key={line} className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {line}
                  </p>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Evidencia
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-800">{consultiveInsight.evidence}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Acao recomendada
                </div>
                <p className="mt-2 text-sm font-semibold text-emerald-900">
                  {consultiveInsight.primaryAction.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  {consultiveInsight.primaryAction.reason}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  CTA: {consultiveInsight.primaryAction.ctaLabel}
                </p>
              </div>
            </div>
          )}

          {consultiveInsights.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Resumo consultivo
              </div>
              <div className="mt-3 space-y-2">
                {consultativeInsights.slice(0, 2).map((insight) => (
                  <div
                    key={insight}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                  >
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showEducationalContent && educationItems.length > 0 && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-4">
              <div className="text-sm font-semibold text-blue-900">Micro-educacao</div>
              <div className="mt-3 space-y-2">
                {educationItems.slice(0, 3).map((item) => (
                  <div key={item.label} className="text-sm leading-6 text-blue-900">
                    <span className="font-semibold">{item.label}:</span> {item.explanation}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <div className="text-sm font-semibold text-amber-800">Acao principal agora</div>
            <p className="mt-1 text-sm text-amber-900">{contextAnalysis.whatMattersNext}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            {consumptionTrendMessage && <p>{consumptionTrendMessage}</p>}
            {historyAverageMessage && (
              <p className={consumptionTrendMessage ? 'mt-2 text-slate-500' : 'text-slate-500'}>
                {historyAverageMessage}
              </p>
            )}
            {historyContextMessage && (
              <p
                className={
                  consumptionTrendMessage || historyAverageMessage
                    ? 'mt-2 text-slate-500'
                    : 'text-slate-500'
                }
              >
                {historyContextMessage}
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AnalysisSummary;
