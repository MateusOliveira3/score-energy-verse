import React from 'react';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EcoMascotProps {
  score: number;
  level: number;
  consumerType?: string;
  customization?: MascotCustomization;
  variant?: 'default' | 'compact' | 'scene';
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
    stem: 'bg-[#3d7f3b]',
    leaf: 'bg-[#68b545]',
    leafDark: 'bg-[#4d903a]',
    bud: 'bg-[#bde97b]',
  },
  blue: {
    stem: 'bg-sky-600',
    leaf: 'bg-cyan-500',
    leafDark: 'bg-sky-500',
    bud: 'bg-sky-200',
  },
  purple: {
    stem: 'bg-violet-600',
    leaf: 'bg-fuchsia-500',
    leafDark: 'bg-violet-500',
    bud: 'bg-pink-200',
  },
  orange: {
    stem: 'bg-orange-600',
    leaf: 'bg-amber-500',
    leafDark: 'bg-orange-500',
    bud: 'bg-yellow-200',
  },
} as const;

const getPalette = (palette?: string) =>
  colorPalettes[palette as keyof typeof colorPalettes] || colorPalettes.emerald;

const getBorderEffect = (effect: string) => {
  const effects = {
    none: 'border-slate-200',
    glow: 'border-emerald-200',
    pulse: 'border-emerald-200',
    rainbow: 'border-cyan-200',
  };

  return effects[effect as keyof typeof effects] || effects.none;
};

const stageByLevel = (level: number) => {
  if (level >= 10) {
    return {
      description: 'Planta adulta com copa aberta e flor simples.',
      leafCount: 4,
      stemHeight: 74,
      budVisible: true,
      rootWidth: 'w-14',
    } as const;
  }

  if (level >= 7) {
    return {
      description: 'Planta alta com folhas abertas.',
      leafCount: 4,
      stemHeight: 66,
      budVisible: true,
      rootWidth: 'w-12',
    } as const;
  }

  if (level >= 4) {
    return {
      description: 'Broto firme com folhas visiveis.',
      leafCount: 3,
      stemHeight: 56,
      budVisible: true,
      rootWidth: 'w-11',
    } as const;
  }

  if (level >= 2) {
    return {
      description: 'Broto curto saindo do solo.',
      leafCount: 2,
      stemHeight: 44,
      budVisible: false,
      rootWidth: 'w-10',
    } as const;
  }

  return {
    description: 'Semente enraizada pronta para crescer.',
    leafCount: 1,
    stemHeight: 34,
    budVisible: false,
    rootWidth: 'w-9',
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
  const baseName = customization?.name || getNameByType(consumerType);
  const progressToNext = Math.min(((score % 200) / 200) * 100, 100);
  const stage = stageByLevel(level);
  const palette = getPalette(customization?.colorPalette);
  const frameSize =
    variant === 'scene'
      ? 'h-[114px] w-[94px]'
      : variant === 'compact'
        ? 'h-[148px] w-[114px]'
        : 'h-[192px] w-[152px] sm:h-[208px] sm:w-[164px]';
  const stemWidth = variant === 'scene' ? 'w-[7px]' : variant === 'compact' ? 'w-[9px]' : 'w-[10px]';
  const leafSize = variant === 'scene' ? 'h-7 w-4' : variant === 'compact' ? 'h-8 w-4' : 'h-10 w-5';
  const budSize = variant === 'scene' ? 'h-3.5 w-3.5' : variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5';
  const stateBadge = {
    wake: 'Base',
    observe: 'Broto',
    understand: 'Folhas',
    action: 'Flor',
  } as const;
  const stateTone = {
    wake: 'bg-slate-50',
    observe: 'bg-cyan-50',
    understand: 'bg-emerald-50',
    action: 'bg-amber-50',
  } as const;
  const leaves = [
    'left-[30%] bottom-[31%] -rotate-[34deg]',
    'right-[29%] bottom-[39%] rotate-[34deg]',
    'left-[27%] bottom-[53%] -rotate-[46deg]',
    'right-[26%] bottom-[58%] rotate-[44deg]',
  ];

  const plantArt = (
    <div className={cn('relative', frameSize)}>
      <div className="absolute bottom-0 left-1/2 h-5 w-[74px] -translate-x-1/2">
        <div className="absolute inset-x-0 bottom-0 h-[7px] rounded-[2px] bg-[#6e4527]" />
        <div className="absolute inset-x-2 bottom-[6px] h-[6px] rounded-[2px] bg-[#895430]" />
        <div className="absolute inset-x-5 bottom-[11px] h-[5px] rounded-[2px] bg-[#a86c3b]" />
        <div className="absolute inset-x-[18px] bottom-[15px] h-[2px] rounded-[2px] bg-[#c7925c]/50" />
      </div>

      <div className="absolute bottom-[11px] left-1/2 h-6 w-10 -translate-x-1/2">
        <div className="absolute left-1/2 top-1 h-4 w-px -translate-x-1/2 rotate-[18deg] bg-[#9e6439]/26" />
        <div className="absolute left-[12px] top-[8px] h-3 w-px rotate-[48deg] bg-[#9e6439]/22" />
        <div className="absolute right-[12px] top-[8px] h-3 w-px -rotate-[48deg] bg-[#9e6439]/22" />
      </div>

      <div className="absolute bottom-[14px] left-1/2 flex h-[76px] w-[58px] -translate-x-1/2 items-end justify-center">
        <div
          className={cn('absolute bottom-0 rounded-[3px] transition-all duration-500', palette.stem, stemWidth)}
          style={{ height: `${Math.max(stage.stemHeight - 12, 24)}px` }}
        />

        {leaves.slice(0, stage.leafCount).map((leafClassName, index) => (
          <div key={leafClassName} className={cn('absolute', leafClassName)}>
            <div
              className={cn(
                'relative rounded-[3px] transition-all duration-500',
                index % 2 === 0 ? palette.leaf : palette.leafDark,
                leafSize,
                index % 2 === 0 ? 'origin-bottom-right' : 'origin-bottom-left'
              )}
            >
              <div className="absolute inset-y-[15%] left-1/2 w-px -translate-x-1/2 bg-white/25" />
            </div>
          </div>
        ))}

        {stage.budVisible && (
          <div
            className={cn(
              'absolute left-1/2 top-[10px] -translate-x-1/2 rotate-45 rounded-[2px] border border-white/60 transition-transform duration-500',
              palette.bud,
              budSize
            )}
          />
        )}
      </div>
    </div>
  );

  if (variant === 'scene') {
    return plantArt;
  }

  return (
    <div className="text-center">
      <div className="relative inline-flex items-end justify-center">
        <div
          className={cn(
            'relative overflow-hidden rounded-[16px] border px-3 pb-2 pt-3 transition-all duration-300',
            stateTone[journeyState],
            getBorderEffect(customization?.borderEffect || 'none')
          )}
        >
          <div className="absolute inset-x-4 top-3 h-12 rounded-full bg-white/50 blur-xl" />
          {plantArt}
          <div className="absolute right-3 top-3 rounded-[6px] border border-slate-200 bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-500">
            {variant === 'compact' ? stateBadge[journeyState] : `Nivel ${level}`}
          </div>
        </div>
      </div>

      {variant === 'default' && (
        <div className="mt-4 space-y-2">
          <h3 className="text-lg font-semibold text-slate-800">{baseName}</h3>
          <p className="text-sm text-slate-600">{stage.description}</p>

          <div className="mx-auto max-w-xs rounded-[14px] border border-slate-200 bg-white p-3">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Nivel {level}</span>
              <span className="inline-flex items-center gap-1">
                <Leaf className="h-3 w-3" />
                {Math.round(progressToNext)}%
              </span>
            </div>
            <div className="h-2 rounded-[4px] bg-slate-100">
              <div
                className="h-2 rounded-[4px] bg-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcoMascot;
