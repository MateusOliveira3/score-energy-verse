// server/lib/seasonal-insights.ts
export type Season = 'Verão' | 'Outono' | 'Inverno' | 'Primavera';
export type Region = 'Sul' | 'Sudeste' | 'Centro-Oeste' | 'Nordeste' | 'Norte';

const stateToRegion: Record<string, Region> = {
  'RS': 'Sul', 'SC': 'Sul', 'PR': 'Sul',
  'SP': 'Sudeste', 'RJ': 'Sudeste', 'MG': 'Sudeste', 'ES': 'Sudeste',
  'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste', 'GO': 'Centro-Oeste', 'DF': 'Centro-Oeste',
  'BA': 'Nordeste', 'SE': 'Nordeste', 'AL': 'Nordeste', 'PE': 'Nordeste',
  'PB': 'Nordeste', 'RN': 'Nordeste', 'CE': 'Nordeste', 'PI': 'Nordeste', 'MA': 'Nordeste',
  'AM': 'Norte', 'RR': 'Norte', 'AP': 'Norte', 'PA': 'Norte', 'TO': 'Norte', 'RO': 'Norte', 'AC': 'Norte'
};

function getSeason(month: number): Season {
  if ([12, 1, 2].includes(month)) return 'Verão';
  if ([3, 4, 5].includes(month)) return 'Outono';
  if ([6, 7, 8].includes(month)) return 'Inverno';
  return 'Primavera';
}

function getRegionalInsight(region: Region, season: Season): string {
  const insights: Record<Region, Record<Season, string>> = {
    'Sul': {
      'Verão': 'No verão do Sul, verões quentes e úmidos podem elevar o uso de ar-condicionado e ventiladores.',
      'Outono': 'Clima ameno no outono, ideal para reduzir o consumo de climatização.',
      'Inverno': 'Invernos rigorosos no Sul elevam o uso de aquecedores elétricos e chuveiros quentes.',
      'Primavera': 'Primavera instável no Sul, com picos de calor e frio que afetam o consumo.'
    },
    'Sudeste': {
      'Verão': 'Verões quentes e chuvosos aumentam o uso de refrigeração.',
      'Outono': 'Outono ameno, boa oportunidade para reduzir consumo elétrico.',
      'Inverno': 'Inverno suave, com aumento de aquecimento apenas em regiões serranas.',
      'Primavera': 'Primavera com calor crescente e pancadas de chuva, início de uso intenso de refrigeração.'
    },
    'Centro-Oeste': {
      'Verão': 'Verão chuvoso eleva a umidade, intensificando o uso de refrigeração.',
      'Outono': 'Clima seco e temperaturas amenas, menor uso de climatização.',
      'Inverno': 'Inverno seco, temperaturas mais baixas à noite, mas consumo tende a cair.',
      'Primavera': 'Primavera quente e seca, ar-condicionado começa a ser mais utilizado.'
    },
    'Nordeste': {
      'Verão': 'Verão quente mantém alta demanda por ventiladores e ar-condicionado.',
      'Outono': 'Outono ainda quente, consumo permanece elevado.',
      'Inverno': 'Inverno no Nordeste mantém temperaturas altas, climatização segue ativa.',
      'Primavera': 'Primavera quente e seca, demanda de refrigeração permanece alta.'
    },
    'Norte': {
      'Verão': 'Verão quente e úmido típico do Norte mantém alta demanda por climatização.',
      'Outono': 'Clima quente e úmido persiste, consumo não cai muito.',
      'Inverno': 'Inverno quente e úmido, pouca variação no consumo.',
      'Primavera': 'Primavera mantém calor e umidade, uso de refrigeração constante.'
    }
  };
  return insights[region][season];
}

export function getSeasonalInsight(state: string, month: number) {
  const region = stateToRegion[state] || 'Sudeste';
  const season = getSeason(month);
  const insight = getRegionalInsight(region, season);
  return { region, season, insight };
}
