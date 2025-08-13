import { useLastInvoice } from '@/hooks/useLastInvoice';
// import AnalysisTips if você já criou o componente de dicas

export default function AnalysisPanel({ userId }: { userId?: string }) {
  const { data: last, loading } = useLastInvoice(userId);

  // valores com fallback sem alterar HTML/CSS
  const kwh   = last?.consumption_kwh ?? 0;
  const total = last?.total_value_brl ?? 0;
  const vpk   = kwh > 0 ? total / kwh : 0;
  const score = last?.score_total ?? 0;

  return (
    <div className="rounded-xl border p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Análise da Última Fatura</h3>
        <button onClick={() => (window.location.href = '/history')} className="underline">
          Ver Histórico
        </button>
      </div>

      {!last && !loading ? (
        <div className="text-center py-10 opacity-70">
          Nenhuma fatura encontrada
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
          <div>
            <div className="text-sm opacity-70">Consumo</div>
            <div className="text-2xl font-semibold">{ kwh.toLocaleString('pt-BR') } kWh</div>
          </div>
          <div>
            <div className="text-sm opacity-70">Valor Total</div>
            <div className="text-2xl font-semibold">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-xs opacity-70">
              ({vpk.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} R$/kWh)
            </div>
          </div>
          <div>
            <div className="text-sm opacity-70">Score</div>
            <div className="text-2xl font-semibold">{score}</div>
          </div>
        </div>
      )}

      {/* E se quiser, logo abaixo do card: */}
      {/* {last?.tips?.length ? <AnalysisTips tips={last.tips} /> : null} */}
    </div>
  );
}
