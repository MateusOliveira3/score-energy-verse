import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  Lightbulb,
  Minus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buildActionResultLink,
  buildInvoiceComparison,
  buildNextCycleGuidance,
} from '@/lib/mvpJourneyState';
import {
  InvoiceActionSnapshot,
  InvoiceComparison,
  InvoiceComparisonTrend,
  InvoiceData,
  UserContextState,
} from '@/types/mvp';

interface InvoiceHistoryProps {
  invoices: InvoiceData[];
  onDeleteInvoice: (fingerprint: string) => void;
  userContext?: Partial<UserContextState>;
}

const getInvoiceStats = (invoices: InvoiceData[]) => {
  const invoicesWithConsumption = invoices.filter((invoice) => typeof invoice.consumption === 'number');
  const invoicesWithValue = invoices.filter((invoice) => typeof invoice.totalValue === 'number');
  const totalConsumption = invoicesWithConsumption.reduce(
    (sum, invoice) => sum + (invoice.consumption ?? 0),
    0
  );
  const totalValue = invoicesWithValue.reduce((sum, invoice) => sum + (invoice.totalValue ?? 0), 0);

  return {
    totalConsumption,
    averageConsumption:
      invoicesWithConsumption.length > 0
        ? Math.round(totalConsumption / invoicesWithConsumption.length)
        : undefined,
    totalValue,
    averageValue:
      invoicesWithValue.length > 0 ? Math.round(totalValue / invoicesWithValue.length) : undefined,
    totalInvoices: invoices.length,
  };
};

const getConsumptionColor = (consumption?: number) => {
  if (typeof consumption !== 'number') return 'text-slate-600 bg-slate-100';
  if (consumption < 200) return 'text-green-600 bg-green-100';
  if (consumption < 300) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

const getConsumptionIcon = (consumption?: number) => {
  if (typeof consumption !== 'number') return <Minus className="h-4 w-4" />;
  if (consumption < 200) return <TrendingDown className="h-4 w-4" />;
  if (consumption < 300) return <TrendingUp className="h-4 w-4" />;
  return <Zap className="h-4 w-4" />;
};

const formatInvoiceDate = (invoice: InvoiceData) => {
  const dateValue = invoice.uploadedAt;

  if (!dateValue) {
    return 'Momento nao registrado';
  }

  return format(new Date(dateValue), 'dd/MM/yyyy', { locale: ptBR });
};

const formatCurrency = (value?: number) =>
  typeof value === 'number' ? `R$ ${value.toFixed(2)}` : 'Nao identificado';

const formatConsumption = (value?: number) =>
  typeof value === 'number' ? `${value} kWh` : 'Nao identificado';

const comparisonVariant: Record<InvoiceComparison['status'], string> = {
  insufficient: 'border-slate-100 bg-slate-50 text-slate-700',
  improved: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  worsened: 'border-rose-100 bg-rose-50 text-rose-800',
  stable: 'border-blue-100 bg-blue-50 text-blue-800',
  mixed: 'border-amber-100 bg-amber-50 text-amber-800',
};

const comparisonBasisLabel: Record<InvoiceComparison['basis'], string> = {
  competence: 'Ordem pela competencia da fatura',
  upload: 'Ordem pela data de envio',
  history: 'Ordem do historico atual',
};

const trendLabel: Record<InvoiceComparisonTrend, string> = {
  down: 'reduziu',
  up: 'aumentou',
  stable: 'manteve',
};

const trendIcon = {
  down: <TrendingDown className="h-4 w-4" />,
  up: <TrendingUp className="h-4 w-4" />,
  stable: <Minus className="h-4 w-4" />,
} as const;

const actionSnapshotLabel: Record<InvoiceActionSnapshot['status'], string> = {
  in_progress: 'Em teste',
  completed: 'Testada',
};

const actionSnapshotIcon = {
  in_progress: <Clock3 className="h-4 w-4" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
} as const;

const formatMetricChange = (change: number, unit: string) => {
  if (change === 0) {
    return `0 ${unit}`;
  }

  return `${change > 0 ? '+' : ''}${change} ${unit}`;
};

const ComparisonMetric = ({
  label,
  unit,
  metric,
}: {
  label: string;
  unit: string;
  metric: NonNullable<InvoiceComparison['consumption']>;
}) => (
  <div className="rounded-lg bg-white/70 p-3">
    <div className="flex items-center justify-between gap-3 text-sm font-medium">
      <span>{label}</span>
      <span className="flex items-center gap-1">
        {trendIcon[metric.trend]}
        {trendLabel[metric.trend]}
      </span>
    </div>
    <div className="mt-2 text-sm">
      <span className="font-semibold">{metric.current}</span>
      <span className="text-slate-500"> vs {metric.previous}</span>
      <span className="ml-2 text-slate-600">
        ({formatMetricChange(metric.change, unit)}
        {metric.percentChange !== undefined
          ? `, ${metric.percentChange > 0 ? '+' : ''}${metric.percentChange}%`
          : ''}
        )
      </span>
    </div>
  </div>
);

const InvoiceHistory = ({ invoices, onDeleteInvoice, userContext }: InvoiceHistoryProps) => {
  const stats = getInvoiceStats(invoices);
  const comparison = buildInvoiceComparison(invoices);
  const actionResultLink = buildActionResultLink(comparison);
  const guidance = buildNextCycleGuidance(comparison, userContext);

  return (
    <div className="space-y-6">
      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-emerald-700">
            <FileText className="h-5 w-5" />
            <span>Historico de Faturas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{stats.totalInvoices}</div>
              <div className="text-sm text-emerald-700">Total de Faturas</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalConsumption}</div>
              <div className="text-sm text-blue-700">kWh Total</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.averageConsumption ?? '-'}
              </div>
              <div className="text-sm text-purple-700">kWh Medio</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {stats.averageValue !== undefined ? `R$ ${stats.averageValue}` : '-'}
              </div>
              <div className="text-sm text-orange-700">Valor Medio</div>
            </div>
          </div>

          <div className={`mb-6 rounded-xl border p-4 ${comparisonVariant[comparison.status]}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide">
                  Comparacao com a fatura anterior
                </div>
                <h3 className="mt-1 text-lg font-bold">{comparison.title}</h3>
                <p className="mt-1 text-sm">{comparison.summary}</p>
                {comparison.currentInvoice && comparison.previousInvoice && (
                  <p className="mt-2 text-xs opacity-80">
                    Comparando {comparison.currentInvoice.month} com {comparison.previousInvoice.month}.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Badge variant="outline" className="w-fit bg-white/70">
                  {comparisonBasisLabel[comparison.basis]}
                </Badge>
                {comparison.status !== 'insufficient' && (
                  <Badge variant="outline" className="w-fit bg-white/70">
                    Leitura observada
                  </Badge>
                )}
              </div>
            </div>

            {comparison.consumption && comparison.totalValue && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <ComparisonMetric label="Consumo" unit="kWh" metric={comparison.consumption} />
                <ComparisonMetric label="Custo" unit="R$" metric={comparison.totalValue} />
              </div>
            )}
          </div>

          {actionResultLink.hasObservedComparison && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Acoes antes desta fatura
              </div>
              <h3 className="mt-1 text-base font-bold text-slate-900">{actionResultLink.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{actionResultLink.message}</p>

              {actionResultLink.actions.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {actionResultLink.actions.map((action) => (
                    <div key={action.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-800">{action.title}</span>
                        <Badge variant="outline" className="shrink-0 bg-white">
                          <span className="mr-1">{actionSnapshotIcon[action.status]}</span>
                          {actionSnapshotLabel[action.status]}
                        </Badge>
                      </div>
                      {action.value && (
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          Objetivo: {action.value}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                {actionResultLink.note}
              </p>
            </div>
          )}

          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Proximo passo sugerido
                </div>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{guidance.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{guidance.message}</p>
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                  {guidance.suggestion}
                </p>
              </div>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Seu historico ainda esta vazio</h3>
              <p className="text-gray-500">
                Adicione uma fatura ao historico para iniciar sua leitura de consumo.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.fingerprint} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">Fatura - {invoice.month}</h3>
                            <Badge variant="secondary" className={getConsumptionColor(invoice.consumption)}>
                              {getConsumptionIcon(invoice.consumption)}
                              <span className="ml-1">{formatConsumption(invoice.consumption)}</span>
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {formatCurrency(invoice.totalValue)}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatInvoiceDate(invoice)}
                            </div>
                            {invoice.parser.fields.consumerUnit.value && (
                              <div className="flex items-center">
                                <Zap className="h-3 w-3 mr-1" />
                                UC {invoice.parser.fields.consumerUnit.value}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-2">Arquivo base: {invoice.fileName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta fatura do historico MVP?')) {
                              onDeleteInvoice(invoice.fingerprint);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceHistory;
