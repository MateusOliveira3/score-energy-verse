import { InvoiceData, InvoiceParserResult } from '@/types/mvp';

const shouldDebugInvoiceFlow = () => {
  const viteDev = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

  if (viteDev) {
    return true;
  }

  return (
    typeof process !== 'undefined' &&
    process.release?.name === 'node' &&
    process.env.NODE_ENV !== 'production'
  );
};

type InvoiceFlowSnapshot = {
  fingerprint?: string;
  fileName?: string;
  month?: string;
  totalValue?: number;
  consumption?: number;
  referenceMonth?: string;
  dueDate?: string;
  parserTotalValue?: number;
  parserConsumptionKwh?: number;
  previousReading?: number;
  currentReading?: number;
};

const getParserFields = (parser?: InvoiceParserResult | null) => parser?.fields;

export const getInvoiceFlowSnapshot = (
  invoice?: Partial<InvoiceData> | null
): InvoiceFlowSnapshot | null => {
  if (!invoice) {
    return null;
  }

  const parserFields = getParserFields(invoice.parser);

  return {
    fingerprint: invoice.fingerprint,
    fileName: invoice.fileName,
    month: invoice.month,
    totalValue: invoice.totalValue,
    consumption: invoice.consumption,
    referenceMonth: parserFields?.referenceMonth.value,
    dueDate: parserFields?.dueDate.value,
    parserTotalValue: parserFields?.totalValue.value,
    parserConsumptionKwh: parserFields?.consumptionKwh.value,
    previousReading: parserFields?.previousReading.value,
    currentReading: parserFields?.currentReading.value,
  };
};

export const logInvoiceFlow = (stage: string, payload: unknown) => {
  if (!shouldDebugInvoiceFlow()) {
    return;
  }

  console.debug(`[invoice-flow] ${stage}`, payload);
};
