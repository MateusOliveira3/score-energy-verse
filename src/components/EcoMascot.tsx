import React from 'react';
import { Crown, Sparkles, Star } from 'lucide-react';
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

const getColorPalette = (palette: string, tier: keyof typeof colorPalettes.emerald) =>
  colorPalettes[palette as keyof typeof colorPalettes]?.[tier] || colorPalettes.emerald[tier];

const getBorderEffect = (effect: string) => {
  const effects = {
    none: 'hover:scale-[1.03]',
    glow: 'hover:scale-[1.03] shadow-lg shadow-emerald-200/70',
    pulse: 'hover:scale-[1.03] animate-pulse',
    rainbow:
      'hover:scale-[1.03] ring-2 ring-amber-200 shadow-lg shadow-cyan-200/60',
  };

  return effects[effect as keyof typeof effects] || effects.none;
};

const colorPalettes = {
  emerald: {
    basic: 'from-emerald-300 to-green-400',
    warrior: 'from-emerald-400 to-green-500',
    champion: 'from-emerald-500 to-green-600',
    master: 'from-emerald-600 to-green-700',
  },
  blue: {
    basic: 'from-blue-300 to-cyan-400',
    warrior: 'from-blue-400 to-cyan-500',
    champion: 'from-blue-500 to-cyan-600',
    master: 'from-blue-600 to-cyan-700',
  },
  purple: {
    basic: 'from-purple-300 to-indigo-400',
    warrior: 'from-purple-400 to-indigo-500',
    champion: 'from-purple-500 to-indigo-600',
    master: 'from-purple-600 to-indigo-700',
  },
  orange: {
    basic: 'from-orange-300 to-red-400',
    warrior: 'from-orange-400 to-red-500',
    champion: 'from-orange-500 to-red-600',
    master: 'from-orange-600 to-red-700',
  },
} as const;

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
  const emoji = customization?.emoji || '\u{1F331}';
  const progressToNext = Math.min(((score % 200) / 200) * 100, 100);
  const mascot = {
    name: level >= 10 ? `${baseName} Master` : level >= 7 ? `${baseName} Champion` : level >= 4 ? `${baseName} Warrior` : baseName,
    emoji,
    color: getColorPalette(customization?.colorPalette || 'emerald', tier),
    effect: getBorderEffect(customization?.borderEffect || (level >= 10 ? 'pulse' : 'glow')),
    description:
      level >= 10
        ? 'Guardiao da Sustentabilidade'
        : level >= 7
          ? 'Campeao Ecologico'
          : level >= 4
            ? 'Guerreiro Verde'
            : 'Broto Sustentavel',
  };

  const orbSize = variant === 'compact' ? 'h-20 w-20 text-4xl' : 'h-32 w-32 text-6xl';
  const stateTone = {
    wake: 'ring-4 ring-white/10',
    observe: 'ring-4 ring-cyan-200/25 shadow-cyan-200/25',
    understand: 'ring-4 ring-emerald-200/30 shadow-emerald-200/30',
    action: 'ring-4 ring-amber-200/35 shadow-amber-200/30 scale-[1.03]',
  } as const;
  const stateBadge = {
    wake: 'Acordando',
    observe: 'Olhando',
    understand: 'Entendendo',
    action: 'Agindo',
  } as const;

  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center">
        <div
          className={cn(
            'relative flex items-center justify-center rounded-full bg-gradient-to-br shadow-lg transition-all duration-500',
            mascot.color,
            mascot.effect,
            stateTone[journeyState],
            orbSize
          )}
        >
          <span className="absolute inset-1 rounded-full bg-white/15" aria-hidden="true" />
          <span className="relative drop-shadow-sm" aria-hidden="true">
            {mascot.emoji}
          </span>
        </div>

        <div className="absolute -bottom-1 -right-1 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
          {variant === 'compact' ? stateBadge[journeyState] : `Lv ${level}`}
        </div>

        {level >= 7 && (
          <div className="absolute -right-2 -top-2 rounded-full bg-white/85 p-1 shadow-sm">
            <Crown className="h-4 w-4 text-amber-500" />
          </div>
        )}

        {level >= 5 && variant === 'default' && (
          <>
            <div className="absolute -left-2 top-2 rounded-full bg-white/75 p-1 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
            </div>
            <div className="absolute right-1 top-8 rounded-full bg-white/75 p-1 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
            </div>
          </>
        )}
      </div>

      {variant === 'default' && (
        <div className="mt-4 space-y-2">
          <h3 className="text-xl font-bold text-slate-800">{mascot.name}</h3>
          <p className="text-sm text-slate-600">
            {mascot.description} em modo {stateBadge[journeyState].toLowerCase()}.
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
