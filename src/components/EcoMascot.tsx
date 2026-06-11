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
      ? 'h-[106px] w-[88px]'
      : variant === 'compact'
        ? 'h-[148px] w-[114px]'
        : 'h-[192px] w-[152px] sm:h-[208px] sm:w-[164px]';
  const stemWidth = variant === 'scene' ? 'w-[6px]' : variant === 'compact' ? 'w-[9px]' : 'w-[10px]';
  const leafSize = variant === 'scene' ? 'h-[24px] w-[12px]' : variant === 'compact' ? 'h-8 w-4' : 'h-10 w-5';
  const budSize = variant === 'scene' ? 'h-[11px] w-[11px]' : variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5';
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
  const soilWidth =
    variant === 'scene' ? 'w-[68px]' : variant === 'compact' ? 'w-[88px]' : 'w-[104px]';
  const rootZoneBottom = variant === 'scene' ? 'bottom-[-2px]' : 'bottom-[20px]';
  const stemZoneHeight = variant === 'scene' ? 74 : 76;
  const showSoilBase = variant !== 'scene';

  const plantArt = (
    <div className={cn('relative', frameSize)}>
      {showSoilBase && (
        <>
          <div className={cn('absolute bottom-[2px] left-1/2 -translate-x-1/2', soilWidth)}>
            <div className="absolute inset-x-[10px] bottom-[-3px] h-[8px] rounded-full bg-[#1f332d]/22 blur-[3px]" />
            <div className="absolute inset-x-0 bottom-0 h-[12px] rounded-[10px] border border-[#5d452f]/35 bg-[#715136]" />
            <div className="absolute inset-x-[5px] bottom-[6px] h-[8px] rounded-[8px] bg-[#8c6643]" />
            <div className="absolute inset-x-[14px] bottom-[10px] h-[4px] rounded-[6px] bg-[#a98156]/60" />
          </div>

          <div className="absolute bottom-[12px] left-1/2 h-4 w-8 -translate-x-1/2">
            <div className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-[#7f5635]/28" />
            <div className="absolute left-[9px] top-[3px] h-2.5 w-px rotate-[38deg] bg-[#7f5635]/24" />
            <div className="absolute right-[9px] top-[3px] h-2.5 w-px -rotate-[38deg] bg-[#7f5635]/24" />
          </div>
        </>
      )}

      {variant === 'scene' && (
        <div className="pointer-events-none absolute bottom-[1px] left-1/2 h-3 w-9 -translate-x-1/2">
          <div className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-[#7f5635]/14" />
          <div className="absolute left-[11px] top-[4px] h-2 w-px rotate-[34deg] bg-[#7f5635]/10" />
          <div className="absolute right-[11px] top-[4px] h-2 w-px -rotate-[34deg] bg-[#7f5635]/10" />
        </div>
      )}

      <div
        className={cn('absolute left-1/2 flex w-[52px] -translate-x-1/2 items-end justify-center', rootZoneBottom)}
        style={{ height: `${stemZoneHeight}px` }}
      >
        <div
          className={cn('absolute bottom-0 rounded-[3px]', palette.stem, stemWidth)}
          style={{ height: `${Math.max(stage.stemHeight - 14, 22)}px` }}
        />

        {leaves.slice(0, stage.leafCount).map((leafClassName, index) => (
          <div key={leafClassName} className={cn('absolute', leafClassName)}>
            <div
              className={cn(
                'relative rounded-[3px]',
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
              'absolute left-1/2 top-[8px] -translate-x-1/2 rotate-45 rounded-[2px] border border-white/45',
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
            'relative overflow-hidden rounded-[16px] border px-3 pb-2 pt-3',
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
