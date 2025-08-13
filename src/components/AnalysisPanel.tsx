import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInvoices } from '@/hooks/useInvoices';
import { useDiagnosis } from '@/hooks/useDiagnosis';
import { useDiagnosisAnalytics } from '@/hooks/useDiagnosisAnalytics';
import { mergeInvoicesWithDiagnosis, type InvoiceLike } from '@/utils/mergeInvoicesWithDiagnosis';
import InvoiceAnalysisBadge from '@/components/InvoiceAnalysisBadge';
import InvoiceTips from '@/components/InvoiceTips';
import DiagnosisSummary from '@/components/DiagnosisSummary';
import { Calendar, Zap, DollarSign, TrendingUp, History } from 'lucide-react';

interface AnalysisPanelProps {
  userId?: string;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { invoices, isLoading } = useInvoices();
  // onde você carrega a análise
  const { data, loading, error } = useDiagnosis(userId, { limit: 1 });

  // pegue a última (itens já vêm ordenados por created_at desc)
  const last = Array.isArray(data)
    ? data[0]
    : Array.isArray((data as any)?.items)
      ? (data as any).items[0]
      : null;

  const { analytics } = useDiagnosisAnalytics(userId);

  // Helpers
  const fmtDate = (d?: string | null) => {
    if (!d) return '—';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('pt-BR');
  };

  const r$ = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatCurrency = (value: number | string | undefined) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const getConsumptionColor = (consumption: number | string | undefined) => {
    const numConsumption = typeof consumption === 'string' ? parseFloat(consumption) || 0 : consumption || 0;
    if (numConsumption < 150) return 'text-green-600';
    if (numConsumption < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConsumptionBadge = (consumption: number | string | undefined) => {
    const numConsumption = typeof consumption === 'string' ? parseFloat(consumption) || 0 : consumption || 0;
    if (numConsumption < 150) return { text: 'Baixo', variant: 'default' as const };
    if (numConsumption < 300) return { text: 'Médio', variant: 'secondary' as const };
    return { text: 'Alto', variant: 'destructive' as const };
  };

  if (isLoading || diagLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise da Última Fatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando análise...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestInvoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise da Última Fatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Nenhuma fatura encontrada</p>
            <p className="text-sm text-gray-500">Faça upload da sua primeira fatura para começar a análise</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const consumption = last?.consumption_kwh ?? 0;
  const totalValue  = last?.total_value_brl ?? 0;
  const vpk         = last?.value_per_kwh ?? (consumption > 0 ? totalValue / consumption : 0);
  const score       = last?.score_total ?? 0;

  const month = last?.month || '';
  const year = last?.year || '';

  return (
    <div className="space-y-6">
      {/* Cabeçalho com botão de histórico */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Análise da Última Fatura</h2>
        <Button 
          variant="outline" 
          onClick={() => navigate('/historico')}
          className="flex items-center gap-2"
        >
          <History className="h-4 w-4" />
          Ver Histórico
        </Button>
      </div>

      {/* Resumo da última fatura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fatura de {month}/{year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Consumo */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-600">Consumo</span>
              </div>
              <div className={`text-2xl font-bold ${getConsumptionColor(consumption)}`}>
                {consumption > 0
                  ? `${consumption.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} kWh`
                  : '— kWh'}
              </div>
              <Badge variant={getConsumptionBadge(consumption).variant} className="mt-2">
                {getConsumptionBadge(consumption).text}
              </Badge>
            </div>

            {/* Valor */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">Valor Total</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                                 {vpk > 0
                   ? `${vpk.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} R$/kWh`
                   : '— /kWh'}
              </div>
            </div>

            {/* Score */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-gray-600">Score</span>
              </div>
                             <div className="text-2xl font-bold text-emerald-600">
                 {score}
               </div>
              <div className="text-sm text-gray-500 mt-1">
                Pontos ganhos
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

             {/* Análise e Recomendações */}
       {last?.recommendations_json && (
         <Card>
           <CardHeader>
             <CardTitle>Análise Energética</CardTitle>
           </CardHeader>
           <CardContent>
             <InvoiceTips tips={JSON.parse(last.recommendations_json)} />
           </CardContent>
         </Card>
       )}

       {/* Badge de Análise */}
       <InvoiceAnalysisBadge invoice={last} />

      {/* Resumo de Desempenho */}
      <DiagnosisSummary userId={userId} />
    </div>
  );
};

export default AnalysisPanel;
