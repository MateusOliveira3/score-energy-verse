import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Zap, 
  DollarSign, 
  Calendar, 
  Trash2, 
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { Invoice } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const InvoiceHistory = () => {
  const { invoices, loading, deleteInvoice, getInvoiceStats } = useInvoices();

  const handleDelete = async (invoiceId: string) => {
    if (confirm('Tem certeza que deseja excluir esta fatura?')) {
      await deleteInvoice(invoiceId);
    }
  };

  const stats = getInvoiceStats();

  const getConsumptionColor = (consumption: number) => {
    if (consumption < 200) return 'text-green-600 bg-green-100';
    if (consumption < 300) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConsumptionIcon = (consumption: number) => {
    if (consumption < 200) return <TrendingDown className="h-4 w-4" />;
    if (consumption < 300) return <TrendingUp className="h-4 w-4" />;
    return <Zap className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <span className="ml-2">Carregando faturas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-emerald-700">
            <FileText className="h-5 w-5" />
            <span>Histórico de Faturas</span>
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
              <div className="text-2xl font-bold text-purple-600">{stats.averageConsumption}</div>
              <div className="text-sm text-purple-700">kWh Média</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">R$ {stats.averageValue}</div>
              <div className="text-sm text-orange-700">Valor Médio</div>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma fatura encontrada</h3>
              <p className="text-gray-500">Faça upload da sua primeira fatura para começar a acompanhar seu consumo.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice: Invoice) => (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">
                              Fatura - {invoice.month}
                            </h3>
                            <Badge 
                              variant="secondary" 
                              className={getConsumptionColor(invoice.consumption)}
                            >
                              {getConsumptionIcon(invoice.consumption)}
                              <span className="ml-1">{invoice.consumption} kWh</span>
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              R$ {invoice.total_value}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {invoice.peak_hours}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {invoice.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(invoice.file_url, '_blank')}
                          >
                            Ver PDF
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(invoice.id)}
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