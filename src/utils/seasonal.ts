export type Season = 'Verão' | 'Outono' | 'Inverno' | 'Primavera';
export type Region = 'Sul' | 'Sudeste' | 'Centro-Oeste' | 'Nordeste' | 'Norte';

const stateToRegion: Record<string, Region> = {
  RS: 'Sul', SC: 'Sul', PR: 'Sul',
  SP: 'Sudeste', RJ: 'Sudeste', MG: 'Sudeste', ES: 'Sudeste',
  MT: 'Centro-Oeste', MS: 'Centro-Oeste', GO: 'Centro-Oeste', DF: 'Centro-Oeste',
  BA: 'Nordeste', SE: 'Nordeste', AL: 'Nordeste', PE: 'Nordeste',
  PB: 'Nordeste', RN: 'Nordeste', CE: 'Nordeste', PI: 'Nordeste', MA: 'Nordeste',
  AM: 'Norte', RR: 'Norte', AP: 'Norte', PA: 'Norte', TO: 'Norte', RO: 'Norte', AC: 'Norte',
};

export function getSeason(month: number): Season {
  if ([12, 1, 2].includes(month)) return 'Verão';
  if ([3, 4, 5].includes(month)) return 'Outono';
  if ([6, 7, 8].includes(month)) return 'Inverno';
  return 'Primavera';
}

export function getSeasonalInsight(state: string, month: number) {
  const region = stateToRegion[state as keyof typeof stateToRegion] || 'Sudeste';
  const season = getSeason(month);

  const insights: Record<Region, Record<Season, string>> = {
    'Sul': {
      'Verão': 'Verões quentes e úmidos aumentam o uso de ar-condicionado.',
      'Outono': 'Clima ameno; chance de reduzir climatização.',
      'Inverno': 'Frio intenso eleva uso de aquecedores e chuveiros.',
      'Primavera': 'Temperaturas instáveis; oscilações de consumo.',
    },
    'Sudeste': {
      'Verão': 'Calor e chuvas elevam refrigeração.',
      'Outono': 'Ameno; possível queda no consumo de climatização.',
      'Inverno': 'Frio suave; aquecimento pontual.',
      'Primavera': 'Calor crescente; início do uso de refrigeração.',
    },
    'Centro-Oeste': {
      'Verão': 'Chuvoso e úmido; mais refrigeração.',
      'Outono': 'Seco e ameno; menos climatização.',
      'Inverno': 'Seco e noites frias; consumo tende a cair.',
      'Primavera': 'Quente e seca; volta da refrigeração.',
    },
    'Nordeste': {
      'Verão': 'Quente; alta demanda por refrigeração.',
      'Outono': 'Ainda quente; consumo elevado.',
      'Inverno': 'Quente; climatização segue ativa.',
      'Primavera': 'Quente e seca; demanda alta.',
    },
    'Norte': {
      'Verão': 'Quente e úmido; refrigeração constante.',
      'Outono': 'Mantém calor e umidade.',
      'Inverno': 'Pouca variação; calor e umidade.',
      'Primavera': 'Calor e umidade constantes.',
    },
  };

  return { region, season, insight: insights[region][season] };
}

