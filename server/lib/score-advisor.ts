// server/lib/score-advisor.ts
import { InvoiceParsed, ConsultativeScore, asNumberOrZero } from './types.js';

/**
 * Função pura que calcula um score consultivo a partir de um InvoiceParsed.
 * - Não lança exceções (sempre retorna total e breakdown).
 * - Limiar e pesos fáceis de ajustar.
 * - Sem I/O; pronta para uso no backend e testes unitários.
 */

// Limiar configuráveis
const LIMITS = {
  consumoAtencao: 200,   // kWh
  consumoRisco: 300,     // kWh
  kwhCaro: 1.00,         // R$/kWh
  kwhBarato: 0.80,       // R$/kWh (informativo)
  cipAlta: 50            // R$
};

// Pesos de pontuação (positivos e negativos)
const WEIGHTS = {
  // consumo
  consumo_ok: 10,         // < 200
  consumo_muito_alto: -10,// >= 300

  // energia reativa
  sem_reativo: 10,
  com_reativo: -15,

  // GD
  com_gd: 10,

  // custo por kWh
  kwh_caro: -5,
  kwh_bom: 5,

  // CIP alta (se disponível)
  cip_alta: -5
};

export function computeConsultativeScore(inv: InvoiceParsed): ConsultativeScore {
  let total = 0;
  const breakdown: Record<string, number> = {};

  const c   = asNumberOrZero(inv.consumption_kwh);
  const vpk = asNumberOrZero(inv.value_per_kwh);
  const cip = asNumberOrZero(inv.publicLightingContribution);

  // 1) Consumo
  if (c < LIMITS.consumoAtencao) {
    total += WEIGHTS.consumo_ok;
    breakdown.consumo = (breakdown.consumo ?? 0) + WEIGHTS.consumo_ok;
  } else if (c >= LIMITS.consumoRisco) {
    total += WEIGHTS.consumo_muito_alto;
    breakdown.consumo = (breakdown.consumo ?? 0) + WEIGHTS.consumo_muito_alto;
  }
  // (entre 200 e 300: neutro)

  // 2) Energia reativa
  if (inv.has_reactive) {
    total += WEIGHTS.com_reativo;
    breakdown.reativo = (breakdown.reativo ?? 0) + WEIGHTS.com_reativo;
  } else {
    total += WEIGHTS.sem_reativo;
    breakdown.reativo = (breakdown.reativo ?? 0) + WEIGHTS.sem_reativo;
  }

  // 3) GD
  if (inv.has_gd) {
    total += WEIGHTS.com_gd;
    breakdown.gd = (breakdown.gd ?? 0) + WEIGHTS.com_gd;
  }

  // 4) Valor por kWh
  if (vpk >= LIMITS.kwhCaro) {
    total += WEIGHTS.kwh_caro;
    breakdown.kwh = (breakdown.kwh ?? 0) + WEIGHTS.kwh_caro;
  } else if (vpk > 0 && vpk <= LIMITS.kwhBarato) {
    total += WEIGHTS.kwh_bom;
    breakdown.kwh = (breakdown.kwh ?? 0) + WEIGHTS.kwh_bom;
  }

  // 5) CIP (opcional)
  if (cip > LIMITS.cipAlta) {
    total += WEIGHTS.cip_alta;
    breakdown.cip = (breakdown.cip ?? 0) + WEIGHTS.cip_alta;
  }

  // 6) Coerência básica (não pontua, mas poderia futuramente)
  // exemplo: c === 0 && inv.total_value_brl > 0 → sem alteração no score

  // Sanitização final
  if (!Number.isFinite(total)) total = 0;

  return { total, breakdown };
}

export default computeConsultativeScore;
