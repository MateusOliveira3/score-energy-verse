import { Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { InvoiceData } from '@/types/mvp';
import {
  formatConsumption,
  formatCurrency,
  getInvoiceReferenceLabel,
} from '@/lib/dynamicContextPanel';

interface DynamicContextHistoryViewProps {
  focusedInvoice?: InvoiceData;
  historyAverageConsumption?: number;
  historyFeedback: string | null;
  historyTrendLine?: string;
  historyUploadContent?: React.ReactNode;
  invoiceHistory: InvoiceData[];
  isHistoryUploadVisible: boolean;
  maxConsumption: number;
  onOpenSummary: () => void;
  onSelectInvoice?: (invoice: InvoiceData) => void;
  onToggleHistoryUpload: () => void;
  sortedInvoices: InvoiceData[];
}

const DynamicContextHistoryView = ({
  focusedInvoice,
  historyAverageConsumption,
  historyFeedback,
  historyTrendLine,
  historyUploadContent,
  invoiceHistory,
  isHistoryUploadVisible,
  maxConsumption,
  onOpenSummary,
  onSelectInvoice,
  onToggleHistoryUpload,
  sortedInvoices,
}: DynamicContextHistoryViewProps) => {
  const renderHistoryBars = () => {
    if (sortedInvoices.length === 0) {
      return (
        <div className="rounded-[16px] border border-[#365f58] bg-[#163f39] px-4 py-5 text-sm text-[#c5d8c8]">
          Seu historico ainda esta vazio. Adicione a primeira fatura por aqui para iniciar a leitura.
        </div>
      );
    }

    return (
      <div className="flex items-end gap-2">
        {sortedInvoices.map((invoice) => {
          const height = Math.max(
            20,
            Math.round(
              (((typeof invoice.consumption === 'number' ? invoice.consumption : 0) || 0) /
                maxConsumption) *
                82
            )
          );
          const isFocused = focusedInvoice?.fingerprint === invoice.fingerprint;

          return (
            <button
              key={invoice.fingerprint}
              type="button"
              onClick={() => onSelectInvoice?.(invoice)}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-24 w-full items-end rounded-[14px] bg-[#163f39] px-1.5 py-1.5">
                <div
                  className={cn(
                    'w-full rounded-[10px] transition-all duration-300',
                    isFocused ? 'bg-[#8fd08e]' : 'bg-[#5a8f74]'
                  )}
                  style={{ height: `${height}px` }}
                />
              </div>
              <span
                className={cn(
                  'max-w-full truncate text-[11px] font-medium',
                  isFocused ? 'text-[#f5f8f3]' : 'text-[#9dbfa6]'
                )}
              >
                {getInvoiceReferenceLabel(invoice)}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {historyFeedback && (
        <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {historyFeedback}
        </div>
      )}

      <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-4">
        {renderHistoryBars()}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
          <div className="text-[#9dbfa6]">Ciclos observados</div>
          <div className="mt-1 text-xl font-semibold text-[#f5f8f3]">
            {invoiceHistory.length}
          </div>
        </div>
        <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
          <div className="text-[#9dbfa6]">Consumo medio</div>
          <div className="mt-1 text-xl font-semibold text-[#f5f8f3]">
            {historyAverageConsumption ? `${historyAverageConsumption} kWh` : '--'}
          </div>
        </div>
      </div>

      {focusedInvoice ? (
        <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
                Leitura em foco
              </p>
              <p className="mt-1 text-lg font-semibold text-[#f5f8f3]">
                {getInvoiceReferenceLabel(focusedInvoice)}
              </p>
            </div>
            <Badge className="border border-[#365f58] bg-[#143d37] text-[#f5f8f3]">
              Historico ativo
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[#9dbfa6]">Consumo</div>
              <div className="font-semibold text-[#f5f8f3]">
                {formatConsumption(focusedInvoice.consumption)}
              </div>
            </div>
            <div>
              <div className="text-[#9dbfa6]">Custo</div>
              <div className="font-semibold text-[#f5f8f3]">
                {formatCurrency(focusedInvoice.totalValue)}
              </div>
            </div>
          </div>
          {historyTrendLine && (
            <div className="mt-4 rounded-[14px] border border-[#365f58] bg-[#163f39] px-3 py-3 text-sm leading-6 text-[#d9ead8]">
              {historyTrendLine}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4 text-sm leading-6 text-[#c5d8c8]">
          A primeira fatura enviada passa a ser o ponto de partida da leitura e das proximas continuidades.
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          onClick={onToggleHistoryUpload}
          className="justify-between rounded-[14px] bg-[#5f925c] text-white hover:bg-[#517d4f]"
        >
          {isHistoryUploadVisible ? 'Ocultar upload' : 'Adicionar fatura'}
          <Upload className="h-4 w-4" />
        </Button>
        {focusedInvoice && (
          <Button
            variant="outline"
            onClick={onOpenSummary}
            className="justify-between rounded-[14px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43]"
          >
            Voltar para a leitura
            <Sparkles className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isHistoryUploadVisible && historyUploadContent}
    </div>
  );
};

export default DynamicContextHistoryView;
