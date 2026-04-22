import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceData } from '@/types/mvp';

interface InvoiceHistoryProps {
  invoices: InvoiceData[];
  onDeleteInvoice: (fingerprint: string) => void;
}

const getInvoiceStats = (invoices: InvoiceData[]) => {
  if (invoices.length === 0) {
    return {
      totalConsumption: 0,
      averageConsumption: 0,
      totalValue: 0,
      averageValue: 0,
      totalInvoices: 0,
    };
  }

  const totalConsumption = invoices.reduce((sum, invoice) => sum + invoice.consumption, 0);
  const totalValue = invoices.reduce((sum, invoice) => sum + invoice.totalValue, 0);

  return {
    totalConsumption,
    averageConsumption: Math.round(totalConsumption / invoices.length),
    totalValue,
    averageValue: Math.round(totalValue / invoices.length),
    totalInvoices: invoices.length,
  };
};

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

const formatInvoiceDate = (invoice: InvoiceData) => {
  const dateValue = invoice.uploadedAt;

  if (!dateValue) {
    return 'Momento nao registrado';
  }

  return format(new Date(dateValue), 'dd/MM/yyyy', { locale: ptBR });
};

const InvoiceHistory = ({ invoices, onDeleteInvoice }: InvoiceHistoryProps) => {
  const stats = getInvoiceStats(invoices);

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
              <div className="text-2xl font-bold text-purple-600">{stats.averageConsumption}</div>
              <div className="text-sm text-purple-700">kWh Media</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">R$ {stats.averageValue}</div>
              <div className="text-sm text-orange-700">Valor Medio</div>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma fatura encontrada</h3>
              <p className="text-gray-500">
                Faca upload da sua primeira fatura para comecar a acompanhar seu consumo.
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
                              <span className="ml-1">{invoice.consumption} kWh</span>
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              R$ {invoice.totalValue}
                            </div>
                            <div className="flex items-center">
                              <Zap className="h-3 w-3 mr-1" />
                              {invoice.peakHours}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatInvoiceDate(invoice)}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            Arquivo base: {invoice.fileName}
                          </p>
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
