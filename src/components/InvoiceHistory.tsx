import React from 'react';
import { Trash2, Download, Eye, Calendar, Zap, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInvoices } from '@/hooks/useInvoices';
import { Invoice } from '@/lib/data-layer';
import { useAuth } from '@/contexts/AuthContext';
import { useDiagnosis } from '@/hooks/useDiagnosis';
import { useDiagnosisAnalytics } from '@/hooks/useDiagnosisAnalytics';
import { mergeInvoicesWithDiagnosis, type InvoiceLike } from '@/utils/mergeInvoicesWithDiagnosis';
import InvoiceAnalysisBadge from '@/components/InvoiceAnalysisBadge';
import InvoiceTips from '@/components/InvoiceTips';
import DiagnosisSummary from '@/components/DiagnosisSummary';
import SeasonalInsightCard from '@/components/SeasonalInsightCard';

const InvoiceHistory = () => {
  const { invoices, isLoading } = useInvoices();
  const { user } = useAuth();
  const { items: diagnosisItems, isLoading: diagLoading } = useDiagnosis(user?.id);
  const { analytics } = useDiagnosisAnalytics(user?.id);

  // Merge memoizado (acima do return):
  const merged = React.useMemo(() => {
    return mergeInvoicesWithDiagnosis(invoices as InvoiceLike[] || [], diagnosisItems || []);
  }, [invoices, diagnosisItems]);

  // Temporário: apenas log até desenharmos os cards/indicadores
  React.useEffect(() => {
    if (analytics) {
      console.log('[ANALYTICS]', analytics);
      /* analytics?.series -> timeline com deltas mês a mês
         analytics?.avgKwhLast3, avgRpkLast3
         analytics?.totalChangeKwh, totalChangeRpk
         analytics?.bestImprovementMonth
         analytics?.currentDownStreak
         analytics?.trend3vs3
         analytics?.flags
      */
    }
  }, [analytics]);

  // Helpers simples
  const fmtDate = (d?: string|null) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Funções auxiliares para análise consultiva
  const valuePerKwh = (total: number, kwh: number) => (kwh > 0 ? total / kwh : 0);

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando faturas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de Faturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Faturas</span>
            <Badge variant="outline">
              {merged.length} faturas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DiagnosisSummary userId={user?.id} />
          <SeasonalInsightCard userId={user?.id} userState={undefined} />
          {merged.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma fatura encontrada
              </h3>
              <p className="text-gray-600">
                Faça upload de sua primeira fatura para começar a acompanhar seu consumo.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {merged.map((f) => {
                const consumo = Number(f._consumption_kwh ?? 0);
                const total = Number(f._total_value_brl ?? 0);
                const vpk = Number(f._value_per_kwh ?? 0);
                const added = f._added_at;
                
                const consumptionBadge = getConsumptionBadge(consumo);
                const numConsumption = consumo;
                
                // Comparativo com fatura anterior (opcional)
                const prev = f._idx > 0 ? merged[f._idx - 1] : null;
                const prevVpk = prev ? Number(prev._value_per_kwh ?? 0) : 0;
                const diffKwh = prev ? consumo - Number(prev._consumption_kwh ?? 0) : 0;
                const diffVpk = prev ? (vpk - prevVpk) : 0;
                
                return (
                  <div
                    key={f.id ?? f._idx}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {f._month}
                          </h3>
                          <Badge variant={consumptionBadge.variant}>
                            {consumptionBadge.text}
                          </Badge>
                          {f.file_name && (
                            <Badge variant="outline" className="text-xs">
                              PDF
                            </Badge>
                          )}
                          {/* Badge de análise consultiva */}
                          <InvoiceAnalysisBadge score={typeof f._score_total === 'number' ? f._score_total : undefined} />
                        </div>
                       
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Consumo</p>
                            <p className={`font-medium ${getConsumptionColor(consumo)}`}>
                              {consumo.toFixed(0)} kWh
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Valor</p>
                            <p className="font-medium text-gray-900">
                              {r$(total)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Impostos</p>
                            <p className="font-medium text-gray-900">
                              {(f as any).tax_percentage || 0}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Pico</p>
                            <p className="font-medium text-gray-900">
                              {(f as any).peak_hours || 'N/A'}
                            </p>
                          </div>
                        </div>
                       
                        <div className="mt-2 text-xs text-gray-500">
                          Adicionado em {fmtDate(added ?? f.created_at)}
                        </div>
                       
                        {/* Indicador de carregamento das dicas */}
                        {diagLoading && <div className="text-xs text-gray-500">Carregando análises…</div>}
                       
                        {/* Dicas e recomendações */}
                        <InvoiceTips tips={Array.isArray(f._tips) ? f._tips : []} />
                       
                        {/* Comparativos com fatura anterior (opcional) */}
                        {prev && (
                          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                            <div className={`${diffKwh > 0 ? 'text-red-600' : diffKwh < 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                              Δ Consumo: {diffKwh > 0 ? '+' : ''}{diffKwh.toFixed(0)} kWh
                            </div>
                            <div className={`${diffVpk > 0 ? 'text-red-600' : diffVpk < 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                              Δ R$/kWh: {diffVpk > 0 ? '+' : ''}{diffVpk.toFixed(3)}
                            </div>
                          </div>
                        )}
                      </div>
                    
                      <div className="flex items-center space-x-2 ml-4">
                        {(f as any).file_url && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open((f as any).file_url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = (f as any).file_url!;
                                link.download = f.file_name || 'fatura.pdf';
                                link.click();
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceHistory; 