/**
 * Representa os campos normalizados da fatura após o parsing de texto.
 * Estes campos serão usados pelos módulos de diagnóstico e score consultivo.
 */
export interface InvoiceParsed {
  /** ex.: "08" */
  month: string;
  /** ex.: "2025" */
  year: string;

  /** Consumo total do mês em kWh (ex.: eletricityKWh + sceeeKWh). */
  consumption_kwh: number;

  /** Valor total (R$) da fatura do mês. */
  total_value_brl: number;

  /** Há multa/penalidade por energia reativa no período? */
  has_reactive: boolean;

  /** O usuário possui geração distribuída (GD) no período? (ex.: gdiKWh > 0) */
  has_gd: boolean;

  /**
   * Tarifa identificada, se presente no texto (ex.: "B1 Convencional", "B1 Branca", "Grupo A").
   * Se não houver detecção confiável, usar string vazia.
   */
  tariff: string;

  /** Valor médio por kWh (R$/kWh). Se consumo for 0, usar 0. */
  value_per_kwh: number;

  /** Campo opcional: CIP/Contribuição de iluminação pública (R$), se disponível. */
  publicLightingContribution?: number;
}

/**
 * Score consultivo (camada adicional ao score já existente no sistema).
 * O breakdown mapeia a origem de cada ponto (ex.: consumo, reativo, gd, kwh, etc.).
 */
export interface ConsultativeScore {
  total: number;
  breakdown: Record<string, number>;
}

/**
 * Resultado do diagnóstico consultivo (texto para UI e tags para lógica).
 */
export interface DiagnosisResult {
  tips: string[];  // mensagens em linguagem simples para o usuário
  tags: string[];  // marcadores técnicos (ex.: "consumo_alto", "reativo", "sem_gd")
}

//////////////////////////////////////////////////////////////////
// (Opcional) Helpers de tipo para maior segurança nos próximos passos
//////////////////////////////////////////////////////////////////

/** Narrowing básico para verificar se um valor é número finito. */
export function isFiniteNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

/** Normaliza números potencialmente nulos/undefined para número seguro (default 0). */
export function asNumberOrZero(x: unknown): number {
  return isFiniteNumber(x) ? x : 0;
}

// --- Diagnosis types ---
export interface DiagnosisItem {
  id: string;
  user_id: string;
  month: string;
  year: string;
  consumption_kwh: number;
  total_value_brl: number;
  score_total: number;
  breakdown: Record<string, number>;
  tips: string[];
  created_at: string;
}

export interface DiagnosisListOptions {
  limit?: number;       // número de itens por página
  cursor?: string | null; // created_at do último item da página anterior
}

export interface DiagnosisListResponse {
  items: DiagnosisItem[];
  nextCursor: string | null; // created_at do último item retornado (use como cursor na próxima página)
}
