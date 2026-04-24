import React from 'react';
import { FileBarChart, Wallet, ScanSearch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnalysisSummary as AnalysisSummaryType, InvoiceData, UserProfileData } from '@/types/mvp';

interface AnalysisSummaryProps {
  invoice?: InvoiceData;
  analysis?: AnalysisSummaryType;
  profile: UserProfileData;
}

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
  atencao: 'atencao',
  elevado: 'elevado',
} as const;

const formatCurrency = (value?: number) =>
  typeof value === 'number' ? `R$ ${value.toFixed(2)}` : 'Nao identificado';

const formatConsumption = (value?: number) =>
  typeof value === 'number' ? `${value} kWh` : 'Nao identificado';

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

const AnalysisSummary = ({ invoice, analysis, profile }: AnalysisSummaryProps) => {
  if (!invoice || !analysis) {
    return (
      <Card className="border-2 border-slate-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-slate-700">
            <ScanSearch className="h-5 w-5" />
            <span>Resumo da analise</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            A analise aparece logo apos adicionar uma fatura ao historico. Ela transforma o
            arquivo em campos reais quando o texto da conta permitir leitura segura.
          </p>
          <p>
            O contexto do perfil {profile.consumerType.toLowerCase()} continua sendo usado apenas
            para interpretar a leitura, nao para inventar numeros ausentes.
          </p>
        </CardContent>
      </Card>
    );
  }

  const referenceLabel = getInvoiceReferenceLabel(invoice);
  const averageCostPerKwh = getAverageCostPerKwh(invoice);

  return (
    <Card className="border-2 border-slate-100 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-slate-700">
          <FileBarChart className="h-5 w-5" />
          <span>Resumo da analise</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-emerald-50 p-4">
            <div className="text-sm text-emerald-700">Consumo extraido</div>
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
              Valor total extraido
            </div>
            <div className="text-3xl font-bold text-blue-900">{formatCurrency(invoice.totalValue)}</div>
            <div className="text-sm text-blue-700">
              {invoice.parser.fields.dueDate.value
                ? `Vencimento ${invoice.parser.fields.dueDate.value}`
                : 'Vencimento nao identificado'}
            </div>
            {averageCostPerKwh !== undefined && (
              <div className="mt-2 text-sm text-blue-700">
                Custo medio de {formatCurrencyPerKwh(averageCostPerKwh)}
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
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-800">O que importa agora</div>
          <p className="mt-1 text-sm text-amber-900">{analysis.whatMattersNext}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisSummary;
