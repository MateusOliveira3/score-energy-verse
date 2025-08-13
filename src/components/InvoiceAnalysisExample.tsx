import React from 'react';
import InvoiceAnalysisBadge from '@/components/InvoiceAnalysisBadge';
import InvoiceTips from '@/components/InvoiceTips';
import { useDiagnosis } from '@/hooks/useDiagnosis';
import { pickLatestForMonthYear } from '@/services/diagnosis';

// Exemplo de uso dos componentes de análise consultiva
export default function InvoiceAnalysisExample({ userId, month, year }: { 
  userId: string; 
  month: string; 
  year: string; 
}) {
  const { data: diagnosis, loading, error } = useDiagnosis(userId);
  
  // Busca a análise mais recente para o mês/ano específico
  const latestAnalysis = pickLatestForMonthYear(diagnosis, month, year);
  
  if (loading) {
    return <div className="text-sm text-gray-500">Carregando análise...</div>;
  }
  
  if (error) {
    return <div className="text-sm text-red-500">Erro ao carregar análise: {error}</div>;
  }
  
  if (!latestAnalysis) {
    return <div className="text-sm text-gray-400">Nenhuma análise disponível</div>;
  }
  
  return (
    <div className="space-y-2">
      {/* Badge do score consultivo */}
      <InvoiceAnalysisBadge score={latestAnalysis.score_total} />
      
      {/* Dicas e recomendações */}
      <InvoiceTips tips={latestAnalysis.tips} />
      
      {/* Informações adicionais (opcional) */}
      <div className="text-xs text-gray-600">
        <div>Consumo: {latestAnalysis.consumption_kwh} kWh</div>
        <div>Valor: R$ {latestAnalysis.total_value_brl.toFixed(2)}</div>
        <div>Análise em: {new Date(latestAnalysis.created_at).toLocaleDateString('pt-BR')}</div>
      </div>
    </div>
  );
}

// Exemplo de uso direto dos componentes
export function SimpleUsageExample() {
  return (
    <div className="space-y-4">
      {/* Badge com score válido */}
      <InvoiceAnalysisBadge score={18} />
      
      {/* Badge sem score */}
      <InvoiceAnalysisBadge />
      
      {/* Dicas com conteúdo */}
      <InvoiceTips tips={[
        "🟢 Bom controle de consumo. Continue assim!",
        "🟡 Consumo acima da média. Ajuste hábitos e eficiência.",
        "🔴 Multa por energia reativa detectada. Instale banco de capacitores."
      ]} />
      
      {/* Dicas vazias */}
      <InvoiceTips tips={[]} />
    </div>
  );
}
