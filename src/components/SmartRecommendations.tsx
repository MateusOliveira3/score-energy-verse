import { CheckCircle2, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalysisSummary, InvoiceData, NextAction, NextActionStatus } from '@/types/mvp';

interface SmartRecommendationsProps {
  actions: NextAction[];
  viewedActionIds: string[];
  analysis?: AnalysisSummary;
  invoiceHistory?: InvoiceData[];
  selectedInvoice?: InvoiceData;
  onSelectInvoice?: (invoice: InvoiceData) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  showHeader?: boolean;
  onActionStatusChange: (
    action: NextAction,
    status: Extract<NextActionStatus, 'in_progress' | 'completed'>
  ) => void;
}

const priorityClasses = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-yellow-200 bg-yellow-50',
  low: 'border-blue-200 bg-blue-50',
} as const;

const priorityLabels = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baixa',
} as const;

const statusLabels: Record<NextActionStatus, string> = {
  new: 'Nao iniciada',
  viewed: 'Revisada',
  in_progress: 'Em execucao',
  completed: 'Testada',
};

const formatCurrency = (value?: number) =>
  typeof value === 'number' ? `R$ ${value.toFixed(2)}` : 'valor nao identificado';

const formatConsumption = (value?: number) =>
  typeof value === 'number' ? `${value} kWh` : 'consumo nao identificado';

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

const SmartRecommendations = ({
  actions,
  viewedActionIds,
  analysis,
  invoiceHistory,
  selectedInvoice,
  onSelectInvoice,
  isExpanded = true,
  onToggle,
  showHeader = true,
  onActionStatusChange,
}: SmartRecommendationsProps) => {
  const contextInvoice = selectedInvoice;
  const contextInvoiceLabel = contextInvoice ? getInvoiceReferenceLabel(contextInvoice) : undefined;
  const showInvoiceSelector = Boolean(contextInvoice && invoiceHistory && invoiceHistory.length > 1 && onSelectInvoice);
  const ExpansionIcon = isExpanded ? ChevronDown : ChevronRight;

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
                <span>Acoes recomendadas</span>
              </CardTitle>
              <p className="text-sm text-slate-600">
                {contextInvoiceLabel
                  ? `Fatura em foco: ${contextInvoiceLabel}.`
                  : 'As acoes seguem a lista global da jornada, sem recalculo local.'}
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
                  aria-label="Selecionar fatura para contextualizar as acoes"
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
          <div className="space-y-4">
            {actions.map((action, index) => {
              const status = action.status ?? (viewedActionIds.includes(action.id) ? 'viewed' : 'new');
              const isCompleted = status === 'completed';
              const isInProgress = status === 'in_progress';
              const details = [
                { label: 'Como fazer', value: action.suggestion },
                { label: 'Como validar', value: action.validation },
              ].filter((detail) => Boolean(detail.value));

              return (
                <div
                  key={action.id}
                  className={`rounded-lg border-2 p-4 transition-all duration-300 ${
                    priorityClasses[action.priority]
                  } ${index === 0 ? 'ring-2 ring-emerald-200' : ''}`}
                >
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {index === 0 && (
                            <span className="rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
                              Acao principal
                            </span>
                          )}
                          <h4 className="font-semibold text-gray-800">{action.title}</h4>
                          <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-gray-700">
                            Prioridade {priorityLabels[action.priority]}
                          </span>
                          <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-slate-700">
                            {statusLabels[status]}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700">{action.description}</p>
                        <p className="text-sm font-semibold text-emerald-700">Objetivo: {action.value}</p>
                      </div>

                      <Button
                        size="sm"
                        variant={isCompleted ? 'outline' : 'default'}
                        className={`shrink-0 ${isCompleted ? 'border-emerald-300 text-emerald-700' : ''}`}
                        disabled={isCompleted}
                        onClick={() =>
                          onActionStatusChange(action, isInProgress ? 'completed' : 'in_progress')
                        }
                      >
                        {isCompleted ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Testada
                          </span>
                        ) : isInProgress ? (
                          'Marcar testada'
                        ) : (
                          'Comecar acao'
                        )}
                      </Button>
                    </div>

                    {details.length > 0 && (
                      <div className="grid grid-cols-1 gap-3 rounded-md bg-white/75 p-3">
                        {details.map((detail) => (
                          <div key={detail.label} className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {detail.label}
                            </span>
                            <p className="text-sm text-slate-700">{detail.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {action.impact && <p className="text-xs font-medium text-slate-500">{action.impact}</p>}

                    {isInProgress && (
                      <div className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                        Acao em execucao. Quando testar na rotina, marque como testada.
                      </div>
                    )}

                    {isCompleted && (
                      <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Acao testada e registrada como progresso da jornada.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {contextInvoice && analysis && (
            <div className="mt-6 rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 p-4">
              <div className="text-center text-sm">
                <p className="font-medium text-gray-700">
                  Contexto visual atual: {contextInvoiceLabel}
                </p>
                <p className="text-gray-600">
                  {formatConsumption(contextInvoice.consumption)} -{' '}
                  {formatCurrency(contextInvoice.totalValue)} -{' '}
                  {analysis.efficiencyLabel}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default SmartRecommendations;
