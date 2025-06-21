import React from 'react';
import { Trash2, Download, Eye, Calendar, Zap, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInvoices } from '@/hooks/useInvoices';
import { Invoice } from '@/lib/data-layer';

const InvoiceHistory = () => {
  const { invoices, isLoading } = useInvoices();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getConsumptionColor = (consumption: number) => {
    if (consumption < 150) return 'text-green-600';
    if (consumption < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConsumptionBadge = (consumption: number) => {
    if (consumption < 150) return { text: 'Baixo', variant: 'default' as const };
    if (consumption < 300) return { text: 'Médio', variant: 'secondary' as const };
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
              {invoices.length} faturas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
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
              {invoices.map((invoice: Invoice) => {
                const consumptionBadge = getConsumptionBadge(invoice.consumption);
                return (
                  <div
                    key={invoice.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {invoice.month}
                          </h3>
                          <Badge variant={consumptionBadge.variant}>
                            {consumptionBadge.text}
                          </Badge>
                          {invoice.file_name && (
                            <Badge variant="outline" className="text-xs">
                              PDF
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Consumo</p>
                            <p className={`font-medium ${getConsumptionColor(invoice.consumption)}`}>
                              {invoice.consumption.toLocaleString()} kWh
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Valor</p>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(invoice.total_value)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Impostos</p>
                            <p className="font-medium text-gray-900">
                              {invoice.tax_percentage}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Pico</p>
                            <p className="font-medium text-gray-900">
                              {invoice.peak_hours}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          Adicionado em {formatDate(invoice.created_at)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {invoice.file_url && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(invoice.file_url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = invoice.file_url!;
                                link.download = invoice.file_name || 'fatura.pdf';
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