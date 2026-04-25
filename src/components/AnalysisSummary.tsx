import React from 'react';
import { ChevronDown, ChevronRight, FileBarChart, ScanSearch, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnalysisSummary as AnalysisSummaryType, InvoiceData, UserProfileData } from '@/types/mvp';

interface AnalysisSummaryProps {
  invoice?: InvoiceData;
  selectedInvoice?: InvoiceData;
  analysis?: AnalysisSummaryType;
  profile: UserProfileData;
  invoiceHistory?: InvoiceData[];
  onSelectInvoice?: (invoice: InvoiceData) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  showHeader?: boolean;
}

type AnalysisSummaryWithInsights = AnalysisSummaryType & {
  consultativeInsights?: string[];
};

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
  atencao: 'sob atenção',
  elevado: 'elevado',
} as const;

const formatCurrency = (value?: number) =>
  typeof value === 'number' ? `R$ ${value.toFixed(2)}` : 'Não identificado';

const formatConsumption = (value?: number) =>
  typeof value === 'number' ? `${value} kWh` : 'Não identificado';

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

const formatCurrencyPerKwh = (value?: number) =>
  typeof value === 'number' ? `R$ ${value.toFixed(2)}/kWh` : undefined;

const AnalysisSummary = ({
  invoice,
  selectedInvoice,
  analysis,
  profile,
  invoiceHistory,
  onSelectInvoice,
  isExpanded = true,
  onToggle,
  showHeader = true,
}: AnalysisSummaryProps) => {
  const ExpansionIcon = isExpanded ? ChevronDown : ChevronRight;
  const contextInvoice = selectedInvoice ?? invoice;
  const invoiceCount = invoiceHistory?.length ?? 0;
  const showInvoiceSelector = Boolean(
    contextInvoice && invoiceHistory && invoiceHistory.length > 1 && onSelectInvoice
  );

  if (!invoice || !analysis) {
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
                  <span>Resumo da análise</span>
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Leitura consolidada da fatura em foco.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <span>{isExpanded ? 'Aberto' : 'Fechado'}</span>
                <ExpansionIcon className="h-4 w-4" />
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
                    aria-label="Selecionar fatura para resumir a análise"
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
              A análise fica disponível após adicionar uma fatura ao histórico. Ela organiza o
              arquivo em campos reais quando a leitura da conta é confiável.
            </p>
            <p>
              O perfil {profile.consumerType.toLowerCase()} ajuda a interpretar a leitura, sem
              estimar números ausentes.
            </p>
          </CardContent>
        )}
      </Card>
    );
  }

  const referenceLabel = getInvoiceReferenceLabel(invoice);
  const averageCostPerKwh = getAverageCostPerKwh(invoice);
  const consultativeInsights = (analysis as AnalysisSummaryWithInsights).consultativeInsights ?? [];

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
                <span>Resumo da análise</span>
              </CardTitle>
              <p className="text-sm text-slate-500">
                {referenceLabel
                  ? `Fatura em foco: ${referenceLabel}.`
                  : 'Leitura consolidada da fatura em foco.'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <span>{isExpanded ? 'Aberto' : 'Fechado'}</span>
              <ExpansionIcon className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
      )}
      {isExpanded && (
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {analysis.consumptionLevel && (
                <Badge className={consumptionVariant[analysis.consumptionLevel]}>
                  Consumo {analysis.consumptionLevel}
                </Badge>
              )}
              {analysis.costSignal && (
                <Badge className={costVariant[analysis.costSignal]}>
                  Custo {costLabel[analysis.costSignal]}
                </Badge>
              )}
              <Badge variant="outline">{referenceLabel}</Badge>
              {invoice.parser.fields.providerName.value && (
                <Badge variant="outline">{invoice.parser.fields.providerName.value}</Badge>
              )}
            </div>

            {showInvoiceSelector && contextInvoice && invoiceHistory && onSelectInvoice && (
              <label className="flex w-full flex-col gap-1 text-sm text-slate-600 lg:w-auto lg:min-w-56">
                <span className="font-medium text-slate-700">Fatura em foco</span>
                <select
                  aria-label="Selecionar fatura para resumir a análise"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-emerald-50 p-4">
              <div className="text-sm text-emerald-700">Consumo</div>
              <div className="text-3xl font-bold text-emerald-900">
                {formatConsumption(invoice.consumption)}
              </div>
              <div className="text-sm text-emerald-700">
                Perfil {profile.consumerType.toLowerCase()}
              </div>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <div className="text-sm text-blue-700 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Custo
              </div>
              <div className="text-3xl font-bold text-blue-900">{formatCurrency(invoice.totalValue)}</div>
              <div className="text-sm text-blue-700">
                {invoice.parser.fields.dueDate.value
                  ? `Vencimento ${invoice.parser.fields.dueDate.value}`
                  : 'Vencimento não identificado'}
              </div>
              {averageCostPerKwh !== undefined && (
                <div className="mt-2 text-sm text-blue-700">
                  Custo por kWh: {formatCurrencyPerKwh(averageCostPerKwh)}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-base font-semibold text-slate-800">{analysis.headline}</p>
            <div className="space-y-2">
              {analysis.observations.map((observation) => (
                <div
                  key={observation}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700"
                >
                  {observation}
                </div>
              ))}
            </div>
            {consultativeInsights.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Leitura consultiva
                </div>
                {consultativeInsights.map((insight) => (
                  <div
                    key={insight}
                    className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-600"
                  >
                    {insight}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <div className="text-sm font-semibold text-amber-800">O que vale observar agora</div>
            <p className="mt-1 text-sm text-amber-900">{analysis.whatMattersNext}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <p>No próximo ciclo, vale observar se esse padrão se mantém ou muda.</p>
            {invoiceCount > 1 ? (
              <p className="mt-2 text-slate-500">
                Você já tem {invoiceCount} faturas. Continue acompanhando para entender seu padrão.
              </p>
            ) : invoiceCount === 1 ? (
              <p className="mt-2 text-slate-500">
                Adicione a próxima fatura para começar a ver evolução.
              </p>
            ) : null}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AnalysisSummary;
