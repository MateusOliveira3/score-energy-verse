import React from 'react';
import { Leaf, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EcoMascotProps {
  score: number;
  level: number;
  consumerType?: string;
  customization?: MascotCustomization;
  variant?: 'default' | 'compact';
  journeyState?: 'wake' | 'observe' | 'understand' | 'action';
}

interface MascotCustomization {
  name: string;
  emoji: string;
  colorPalette: string;
  borderEffect: string;
}

const getNameByType = (type: string) => {
  const names = {
    Residencial: 'EcoFamilia',
    Comercial: 'EcoBiz',
    Restaurante: 'EcoChef',
    Escola: 'EcoAluno',
    Industria: 'EcoTech',
  };

  return names[type as keyof typeof names] || 'EcoFriend';
};

const colorPalettes = {
  emerald: {
    basic: 'from-emerald-300 via-green-300 to-lime-300',
    warrior: 'from-emerald-400 via-green-400 to-lime-400',
    champion: 'from-emerald-500 via-green-400 to-teal-400',
    master: 'from-emerald-500 via-teal-400 to-cyan-400',
  },
  blue: {
    basic: 'from-sky-300 via-cyan-300 to-teal-300',
    warrior: 'from-sky-400 via-cyan-400 to-teal-400',
    champion: 'from-sky-500 via-cyan-400 to-teal-400',
    master: 'from-sky-500 via-cyan-400 to-indigo-400',
  },
  purple: {
    basic: 'from-fuchsia-300 via-violet-300 to-pink-300',
    warrior: 'from-violet-400 via-fuchsia-400 to-pink-400',
    champion: 'from-violet-500 via-fuchsia-400 to-pink-400',
    master: 'from-violet-500 via-pink-400 to-rose-400',
  },
  orange: {
    basic: 'from-amber-300 via-orange-300 to-lime-300',
    warrior: 'from-amber-400 via-orange-400 to-lime-400',
    champion: 'from-orange-500 via-amber-400 to-lime-400',
    master: 'from-orange-500 via-amber-400 to-yellow-400',
  },
} as const;

const getColorPalette = (
  palette: string,
  tier: keyof typeof colorPalettes.emerald
) => colorPalettes[palette as keyof typeof colorPalettes]?.[tier] || colorPalettes.emerald[tier];

const getBorderEffect = (effect: string) => {
  const effects = {
    none: 'hover:scale-[1.02]',
    glow: 'hover:scale-[1.02] shadow-lg shadow-emerald-400/20',
    pulse: 'hover:scale-[1.02] shadow-lg shadow-emerald-400/25',
    rainbow:
      'hover:scale-[1.02] shadow-lg shadow-cyan-300/25 ring-1 ring-cyan-200/40',
  };

  return effects[effect as keyof typeof effects] || effects.none;
};

const stageByLevel = (level: number) => {
  if (level >= 10) {
    return {
      key: 'floracao-plena',
      title: 'Floracao plena',
      description: 'Planta adulta com copa aberta e flor ativa.',
      leafCount: 6,
      stemHeight: 92,
      flowerScale: 'scale-100',
      rootSpread: 'w-28',
      accent: 'Alcance alto expandido',
    } as const;
  }

  if (level >= 7) {
    return {
      key: 'copa-formada',
      title: 'Copa formada',
      description: 'Planta alta com folhas largas e alcance alto.',
      leafCount: 5,
      stemHeight: 80,
      flowerScale: 'scale-90',
      rootSpread: 'w-24',
      accent: 'Alcance alto',
    } as const;
  }

  if (level >= 4) {
    return {
      key: 'folhas-ativas',
      title: 'Folhas ativas',
      description: 'Broto firme, com folhas visiveis e alcance medio.',
      leafCount: 4,
      stemHeight: 66,
      flowerScale: 'scale-75',
      rootSpread: 'w-20',
      accent: 'Alcance medio',
    } as const;
  }

  if (level >= 2) {
    return {
      key: 'broto-subindo',
      title: 'Broto subindo',
      description: 'Caule curto saindo do solo com as primeiras folhas.',
      leafCount: 2,
      stemHeight: 50,
      flowerScale: 'scale-50',
      rootSpread: 'w-16',
      accent: 'Alcance baixo',
    } as const;
  }

  return {
    key: 'raiz-inicial',
    title: 'Raiz inicial',
    description: 'Semente enraizada, pronta para crescer.',
    leafCount: 1,
    stemHeight: 38,
    flowerScale: 'scale-0',
    rootSpread: 'w-14',
    accent: 'Base enraizada',
  } as const;
};

const EcoMascot = ({
  score,
  level,
  consumerType = 'Residencial',
  customization,
  variant = 'default',
  journeyState = 'wake',
}: EcoMascotProps) => {
  const tier =
    level >= 10 ? 'master' : level >= 7 ? 'champion' : level >= 4 ? 'warrior' : 'basic';
  const baseName = customization?.name || getNameByType(consumerType);
  const progressToNext = Math.min(((score % 200) / 200) * 100, 100);
  const stage = stageByLevel(level);
  const mascot = {
    name: baseName,
    color: getColorPalette(customization?.colorPalette || 'emerald', tier),
    effect: getBorderEffect(customization?.borderEffect || (level >= 7 ? 'pulse' : 'glow')),
  };

  const frameSize =
    variant === 'compact' ? 'h-[170px] w-[132px]' : 'h-[220px] w-[180px] sm:h-[240px] sm:w-[196px]';
  const stemWidth = variant === 'compact' ? 'w-2.5' : 'w-3';
  const flowerSize = variant === 'compact' ? 'h-9 w-9' : 'h-12 w-12';
  const foliageSize = variant === 'compact' ? 'h-12 w-7' : 'h-14 w-9';
  const stateTone = {
    wake: 'ring-1 ring-white/15 shadow-slate-900/10',
    observe: 'ring-1 ring-cyan-200/35 shadow-cyan-300/20',
    understand: 'ring-1 ring-emerald-200/40 shadow-emerald-300/20',
    action: 'ring-1 ring-amber-200/45 shadow-amber-300/25',
  } as const;
  const stateBadge = {
    wake: 'Enraizada',
    observe: 'Crescendo',
    understand: 'Expandindo',
    action: 'Florescendo',
  } as const;
  const leaves = [
    'left-[31%] bottom-[34%] -rotate-[38deg]',
    'right-[29%] bottom-[40%] rotate-[34deg]',
    'left-[24%] bottom-[50%] -rotate-[52deg]',
    'right-[22%] bottom-[57%] rotate-[46deg]',
    'left-[38%] bottom-[67%] -rotate-[24deg]',
    'right-[37%] bottom-[72%] rotate-[22deg]',
  ];

  return (
    <div className="text-center">
      <div className="relative inline-flex items-end justify-center">
        <div
          className={cn(
            'relative overflow-hidden rounded-[34px] bg-gradient-to-b from-white/55 via-emerald-50/45 to-emerald-100/65 px-3 pb-3 pt-4 shadow-lg transition-all duration-500',
            mascot.effect,
            stateTone[journeyState],
            frameSize
          )}
        >
          <div className="pointer-events-none absolute inset-x-6 top-3 h-14 rounded-full bg-white/35 blur-2xl" />
          <div className="pointer-events-none absolute inset-x-2 bottom-1 h-10 rounded-full bg-emerald-950/18 blur-2xl" />

          <div className="absolute inset-x-4 bottom-3">
            <div className="relative h-10">
              <div className="absolute inset-x-0 bottom-0 h-7 rounded-[999px] bg-gradient-to-b from-emerald-900/75 via-emerald-950/90 to-slate-950" />
              <div className="absolute left-1/2 bottom-4 h-6 w-[75%] -translate-x-1/2 rounded-full bg-emerald-500/12 blur-xl" />
              <div
                className={cn(
                  'absolute left-1/2 bottom-[10px] -translate-x-1/2 rounded-full bg-amber-700/50 blur-sm',
                  stage.rootSpread
                )}
              />
            </div>
          </div>

          <div className="absolute bottom-[24px] left-1/2 h-11 w-16 -translate-x-1/2">
            <div className="absolute left-1/2 top-0 h-8 w-[2px] -translate-x-1/2 rotate-[18deg] rounded-full bg-amber-200/55" />
            <div className="absolute left-[22px] top-[10px] h-7 w-[2px] rotate-[48deg] rounded-full bg-amber-200/55" />
            <div className="absolute right-[22px] top-[10px] h-7 w-[2px] -rotate-[48deg] rounded-full bg-amber-200/55" />
            <div className="absolute left-[14px] top-[14px] h-6 w-[2px] rotate-[72deg] rounded-full bg-amber-100/45" />
            <div className="absolute right-[14px] top-[14px] h-6 w-[2px] -rotate-[72deg] rounded-full bg-amber-100/45" />
          </div>

          <div className="absolute bottom-[34px] left-1/2 flex h-[118px] w-[108px] -translate-x-1/2 items-end justify-center">
            <div className="absolute inset-x-0 top-0 mx-auto h-20 w-20 rounded-full bg-emerald-400/10 blur-2xl" />

            <div
              className={cn(
                'absolute bottom-0 rounded-full bg-gradient-to-t from-emerald-700 via-green-500 to-lime-300 shadow-[0_0_18px_rgba(74,222,128,0.28)] transition-all duration-700',
                stemWidth
              )}
              style={{ height: `${stage.stemHeight}px` }}
            />

            {leaves.slice(0, stage.leafCount).map((leafClassName, index) => (
              <div
                key={leafClassName}
                className={cn('absolute flex items-center justify-center', leafClassName)}
              >
                <div
                  className={cn(
                    'rounded-[999px] border border-white/35 bg-gradient-to-br shadow-sm',
                    mascot.color,
                    foliageSize,
                    index % 2 === 0 ? 'origin-bottom-right' : 'origin-bottom-left'
                  )}
                />
              </div>
            ))}

            <div
              className={cn(
                'absolute left-1/2 top-[6px] flex -translate-x-1/2 items-center justify-center rounded-full border border-white/40 bg-gradient-to-br shadow-md transition-transform duration-700',
                mascot.color,
                flowerSize,
                stage.flowerScale
              )}
            >
              <Sparkles className="h-4 w-4 text-white/90" />
            </div>
          </div>

          <div className="absolute right-3 top-3 rounded-full border border-white/30 bg-white/55 px-2 py-1 text-[10px] font-semibold text-emerald-900 shadow-sm">
            {variant === 'compact' ? stateBadge[journeyState] : `Nivel ${level}`}
          </div>

          {level >= 4 && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/25 bg-emerald-950/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-50">
              <Leaf className="h-3 w-3" />
              {stage.accent}
            </div>
          )}
        </div>
      </div>

      {variant === 'default' && (
        <div className="mt-4 space-y-2">
          <h3 className="text-xl font-bold text-slate-800">{mascot.name}</h3>
          <p className="text-sm text-slate-600">
            {stage.description} Em modo {stateBadge[journeyState].toLowerCase()}.
          </p>

          <div className="mx-auto max-w-xs rounded-2xl bg-white/75 p-3 shadow-sm ring-1 ring-slate-100">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Nivel {level}</span>
              <span>Nivel {level + 1}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-1000 ease-out"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-slate-500">{Math.round(progressToNext)}% para evoluir</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcoMascot;
