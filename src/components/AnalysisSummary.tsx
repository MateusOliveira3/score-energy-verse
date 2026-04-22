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

const AnalysisSummary = ({ invoice, analysis, profile }: AnalysisSummaryProps) => {
  if (!invoice || !analysis) {
    return (
      <Card className="border-2 border-slate-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-slate-700">
            <ScanSearch className="h-5 w-5" />
            <span>Resumo da Analise</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            A analise aparece logo apos o envio da fatura. Ela transforma o arquivo em sinais
            simples de consumo, custo e proximo passo.
          </p>
          <p>
            O contexto do perfil {profile.consumerType.toLowerCase()} sera usado para deixar essa
            leitura mais justa.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-slate-100 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-slate-700">
          <FileBarChart className="h-5 w-5" />
          <span>Resumo da Analise</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={consumptionVariant[analysis.consumptionLevel]}>
            Consumo {analysis.consumptionLevel}
          </Badge>
          <Badge className={costVariant[analysis.costSignal]}>Custo {analysis.costSignal}</Badge>
          <Badge variant="outline">{invoice.month}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-emerald-50 p-4">
            <div className="text-sm text-emerald-700">Consumo estimado</div>
            <div className="text-3xl font-bold text-emerald-900">{invoice.consumption} kWh</div>
            <div className="text-sm text-emerald-700">Perfil {profile.consumerType.toLowerCase()}</div>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <div className="text-sm text-blue-700 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Sinal de custo
            </div>
            <div className="text-3xl font-bold text-blue-900">R$ {invoice.totalValue}</div>
            <div className="text-sm text-blue-700">Pico estimado em {invoice.peakHours}</div>
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
