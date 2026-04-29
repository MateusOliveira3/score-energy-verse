import React from 'react';
import { ClipboardList, Flag, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import EcoMascot from './EcoMascot';

interface ScoreCardProps {
  score: number;
  level: number;
  consumerType: string;
  mascotCustomization?: {
    name: string;
    emoji: string;
    colorPalette: string;
    borderEffect: string;
  };
  latestScoreLabel?: string;
  completedSteps: number;
  activeActionsCount: number;
  efficiencyLabel: string;
  showMascot?: boolean;
  variant?: 'default' | 'compact';
}

const compactText = (value: string, maxLength = 110) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength).trimEnd()}...`;

const ScoreCard = ({
  score,
  level,
  consumerType,
  mascotCustomization,
  latestScoreLabel,
  completedSteps,
  activeActionsCount,
  efficiencyLabel,
  showMascot = true,
  variant = 'default',
}: ScoreCardProps) => {
  if (variant === 'compact') {
    return (
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-50/72">
              Score Energy
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-bold leading-none text-white">
                {score.toLocaleString()}
              </span>
              <span className="pb-1 text-sm text-emerald-50/72">pontos</span>
            </div>
          </div>

          <div className="rounded-[16px] border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/92">
            Nivel {level}
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm leading-5 text-emerald-50/80">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {compactText(latestScoreLabel || 'O score acompanha eventos reais da jornada.', 120)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-white">
          <div className="rounded-[20px] border border-white/10 bg-white/[0.08] p-3">
            <div className="text-2xl font-semibold leading-none">{completedSteps}</div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-emerald-50/62">
              Etapas
            </div>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-white/[0.08] p-3">
            <div className="text-2xl font-semibold leading-none">{activeActionsCount}</div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-emerald-50/62">
              Acoes
            </div>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-white/[0.08] p-3">
            <div className="text-sm font-semibold leading-5">{efficiencyLabel}</div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-emerald-50/62">
              Eficiencia
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-emerald-50/90">
          <div className="flex items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.08] px-3 py-1.5">
            <Flag className="h-4 w-4 shrink-0" />
            <span>{consumerType}</span>
          </div>
          <div className="flex items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.08] px-3 py-1.5">
            <ClipboardList className="h-4 w-4 shrink-0" />
            <span>{activeActionsCount} frentes ativas</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-500/20 animate-pulse" />

      <CardContent className="relative z-10 p-8">
        <div
          className={`grid items-center gap-8 ${showMascot ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}
        >
          <div>
            <h2 className="mb-2 text-xl font-semibold">Seu Score Energy</h2>
            <div className="mb-4 flex items-baseline space-x-2">
              <span className="text-5xl font-bold">{score.toLocaleString()}</span>
              <span className="text-emerald-100">pontos</span>
            </div>

            <div className="mb-6 flex items-center space-x-2 text-emerald-100">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">
                {latestScoreLabel || 'O score cresce por eventos claros da jornada MVP.'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-white/10 p-3 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold">{completedSteps}</div>
                <div className="text-xs text-emerald-100">Etapas</div>
              </div>
              <div className="rounded-lg bg-white/10 p-3 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold">{activeActionsCount}</div>
                <div className="text-xs text-emerald-100">Acoes</div>
              </div>
              <div className="rounded-lg bg-white/10 p-3 text-center backdrop-blur-sm">
                <div className="text-sm font-bold leading-tight">{efficiencyLabel}</div>
                <div className="text-xs text-emerald-100">Eficiencia</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 p-3">
                <Flag className="h-4 w-4 shrink-0" />
                <span>Nivel atual {level}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 p-3">
                <ClipboardList className="h-4 w-4 shrink-0" />
                <span>Perfil {consumerType}</span>
              </div>
            </div>
          </div>

          {showMascot && (
            <div className="flex justify-center">
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                <EcoMascot
                  score={score}
                  level={level}
                  consumerType={consumerType}
                  customization={mascotCustomization}
                />
              </div>
            </div>
          )}
        </div>

        <div className="absolute right-4 top-4 rounded-full bg-white/20 p-4">
          <Zap className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreCard;
