import React from 'react';
import { CheckCircle2, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalysisSummary, InvoiceData, NextAction } from '@/types/mvp';

interface SmartRecommendationsProps {
  actions: NextAction[];
  viewedActionIds: string[];
  invoice?: InvoiceData;
  analysis?: AnalysisSummary;
  onActionViewed: (action: NextAction) => void;
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

const SmartRecommendations = ({
  actions,
  viewedActionIds,
  invoice,
  analysis,
  onActionViewed,
}: SmartRecommendationsProps) => {
  return (
    <Card className="border-2 border-blue-100 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-700">
          <Lightbulb className="h-5 w-5" />
          <span>Proximas Acoes Prioritarias</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.map((action) => {
            const isViewed = viewedActionIds.includes(action.id);

            return (
              <div
                key={action.id}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${priorityClasses[action.priority]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-800">{action.title}</h4>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/80 text-gray-700">
                        Prioridade {priorityLabels[action.priority]}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600">{action.description}</p>
                    <p className="text-sm font-medium text-emerald-700">{action.value}</p>
                  </div>

                  <Button
                    size="sm"
                    variant={isViewed ? 'outline' : 'default'}
                    className={isViewed ? 'border-emerald-300 text-emerald-700' : ''}
                    onClick={() => onActionViewed(action)}
                  >
                    {isViewed ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Revisada
                      </span>
                    ) : (
                      'Revisar'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {invoice && analysis && (
          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
            <div className="text-sm text-center">
              <p className="font-medium text-gray-700">Baseado na sua fatura de {invoice.month}</p>
              <p className="text-gray-600">
                {invoice.consumption} kWh • R$ {invoice.totalValue} • {analysis.efficiencyLabel}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartRecommendations;
