// server/lib/season.ts
export type Season = 'summer' | 'autumn' | 'winter' | 'spring';

const SOUTH = ['RS', 'SC', 'PR'];
const NORTH = ['AM','RR','AP','PA','RO','AC','TO']; // usado só se precisar diferenciar futuramente

// Brasil (hemisfério sul) — estações pelo mês
const SEASONS: Record<Season, number[]> = {
  summer: [12, 1, 2],
  autumn: [3, 4, 5],
  winter: [6, 7, 8],
  spring: [9, 10, 11],
};

export function monthToSeason(month: number): Season {
  for (const s of Object.keys(SEASONS) as Season[]) {
    if (SEASONS[s].includes(month)) return s;
  }
  return 'summer';
}

export function seasonPt(season: Season): string {
  return ({summer:'Verão', autumn:'Outono', winter:'Inverno', spring:'Primavera'})[season];
}

export function regionFromUF(uf?: string): string {
  if (!uf) return 'Indefinido';
  const s = uf.toUpperCase();
  if (SOUTH.includes(s)) return 'Sul';
  // mapeamento simples suficiente para agora
  const SUDESTE = ['SP','RJ','MG','ES'];
  const CENTRO = ['DF','GO','MT','MS'];
  const NORDESTE = ['BA','SE','AL','PE','PB','RN','CE','PI','MA'];
  const NORTE = NORTH;
  if (SUDESTE.includes(s)) return 'Sudeste';
  if (CENTRO.includes(s)) return 'Centro-Oeste';
  if (NORDESTE.includes(s)) return 'Nordeste';
  if (NORTE.includes(s)) return 'Norte';
  return 'Indefinido';
}
