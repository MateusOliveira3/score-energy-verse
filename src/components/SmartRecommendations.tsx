import { CheckCircle2, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalysisSummary, InvoiceData, NextAction, NextActionStatus } from '@/types/mvp';

interface SmartRecommendationsProps {
  actions: NextAction[];
  viewedActionIds: string[];
  invoice?: InvoiceData;
  analysis?: AnalysisSummary;
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
  new: 'Não iniciada',
  viewed: 'Revisada',
  in_progress: 'Em execução',
  completed: 'Testada',
};

const SmartRecommendations = ({
  actions,
  viewedActionIds,
  invoice,
  analysis,
  onActionStatusChange,
}: SmartRecommendationsProps) => {
  return (
    <Card className="border-2 border-blue-100 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-700">
          <Lightbulb className="h-5 w-5" />
          <span>Próximas ações</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                            Ação principal
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
                      <p className="text-sm font-semibold text-emerald-700">
                        Objetivo: {action.value}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={isCompleted ? 'outline' : 'default'}
                      className={`shrink-0 ${
                        isCompleted ? 'border-emerald-300 text-emerald-700' : ''
                      }`}
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
                        'Começar ação'
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

                  {action.impact && (
                    <p className="text-xs font-medium text-slate-500">{action.impact}</p>
                  )}

                  {isInProgress && (
                    <div className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                      Ação em execução. Quando testar na rotina, marque como testada.
                    </div>
                  )}

                  {isCompleted && (
                    <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Ação testada e registrada como progresso da jornada.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {invoice && analysis && (
          <div className="mt-6 rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 p-4">
            <div className="text-center text-sm">
              <p className="font-medium text-gray-700">Baseado na sua fatura de {invoice.month}</p>
              <p className="text-gray-600">
                {invoice.consumption} kWh - R$ {invoice.totalValue} - {analysis.efficiencyLabel}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartRecommendations;
