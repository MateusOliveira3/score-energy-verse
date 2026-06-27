import { BarChart3, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AnalysisSummary,
  InvoiceData,
} from '@/types/mvp';
import {
  formatConsumption,
  getInvoiceReferenceLabel,
} from '@/lib/dynamicContextPanel';

interface DynamicContextSummaryViewProps {
  contextLines: string[];
  focusedInvoice?: InvoiceData;
  headline: string;
  summary: string;
  consultiveInsight?: AnalysisSummary['consultiveInsight'];
  onOpenActions: () => void;
  onOpenHistory: () => void;
}

const DynamicContextSummaryView = ({
  contextLines,
  focusedInvoice,
  headline,
  summary,
  consultiveInsight,
  onOpenActions,
  onOpenHistory,
}: DynamicContextSummaryViewProps) => (
  <div className="flex h-full flex-col gap-4">
    <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
        Leitura sintetizada
      </p>
      <p className="mt-2 text-xl font-semibold text-[#f5f8f3]">{headline}</p>
      <p className="mt-3 text-sm leading-6 text-[#c5d8c8]">{summary}</p>
      {contextLines.map((line) => (
        <p
          key={line}
          className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-[#9dbfa6]"
        >
          {line}
        </p>
      ))}
    </div>

    {consultiveInsight && (
      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-[18px] border border-[#7eb77b] bg-[#123f39] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#bfe7bc]">
            Continuidade sugerida
          </div>
          <div className="mt-2 text-base font-semibold text-[#f5f8f3]">
            {consultiveInsight.primaryAction.title}
          </div>
          <div className="mt-2 text-sm leading-6 text-[#d9ead8]">
            {consultiveInsight.primaryAction.reason}
          </div>
          <div className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#bfe7bc]">
            CTA: {consultiveInsight.primaryAction.ctaLabel}
          </div>
        </div>
      </div>
    )}

    {focusedInvoice && (
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
          <div className="text-[#9dbfa6]">Fatura</div>
          <div className="mt-1 font-semibold text-[#f5f8f3]">
            {getInvoiceReferenceLabel(focusedInvoice)}
          </div>
        </div>
        <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
          <div className="text-[#9dbfa6]">Consumo</div>
          <div className="mt-1 font-semibold text-[#f5f8f3]">
            {formatConsumption(focusedInvoice.consumption)}
          </div>
        </div>
      </div>
    )}

    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Button
        onClick={onOpenActions}
        className="justify-between rounded-[14px] bg-[#5f925c] text-white hover:bg-[#517d4f]"
      >
        Ver continuidade do ciclo
        <Lightbulb className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        onClick={onOpenHistory}
        className="justify-between rounded-[14px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43]"
      >
        Rever evolucao
        <BarChart3 className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export default DynamicContextSummaryView;
