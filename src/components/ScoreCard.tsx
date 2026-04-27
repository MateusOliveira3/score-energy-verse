import React from 'react';
import { Zap, TrendingUp, ClipboardList, Flag } from 'lucide-react';
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
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-xl">
        <CardContent className="relative p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_58%)]" />

          <div className="relative space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-50/80">
                  Score Energy
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-4xl font-bold leading-none">{score.toLocaleString()}</span>
                  <span className="pb-1 text-sm text-emerald-50/80">pontos</span>
                </div>
              </div>

              <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90">
                Nivel {level}
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm text-emerald-50/85">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{latestScoreLabel || 'O score acompanha eventos reais da jornada.'}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <div className="text-lg font-semibold">{completedSteps}</div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-emerald-50/70">
                  Etapas
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <div className="text-lg font-semibold">{activeActionsCount}</div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-emerald-50/70">
                  Acoes
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <div className="text-sm font-semibold leading-5">{efficiencyLabel}</div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-emerald-50/70">
                  Eficiencia
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <Flag className="h-4 w-4 shrink-0" />
                <span>{consumerType}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <ClipboardList className="h-4 w-4 shrink-0" />
                <span>{activeActionsCount} frentes ativas</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0 shadow-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-500/20 animate-pulse"></div>

      <CardContent className="p-8 relative z-10">
        <div
          className={`grid gap-8 items-center ${showMascot ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}
        >
          <div>
            <h2 className="text-xl font-semibold mb-2">Seu Score Energy</h2>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-5xl font-bold">{score.toLocaleString()}</span>
              <span className="text-emerald-100">pontos</span>
            </div>

            <div className="flex items-center space-x-2 text-emerald-100 mb-6">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">
                {latestScoreLabel || 'O score cresce por eventos claros da jornada MVP.'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold">{completedSteps}</div>
                <div className="text-xs text-emerald-100">Etapas</div>
              </div>
              <div className="text-center bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold">{activeActionsCount}</div>
                <div className="text-xs text-emerald-100">Acoes</div>
              </div>
              <div className="text-center bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-sm font-bold leading-tight">{efficiencyLabel}</div>
                <div className="text-xs text-emerald-100">Eficiencia</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-white/10 p-3 flex items-center gap-2">
                <Flag className="h-4 w-4 shrink-0" />
                <span>Nivel atual {level}</span>
              </div>
              <div className="rounded-lg bg-white/10 p-3 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 shrink-0" />
                <span>Perfil {consumerType}</span>
              </div>
            </div>
          </div>

          {showMascot && (
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
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

        <div className="absolute top-4 right-4 p-4 bg-white/20 rounded-full">
          <Zap className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreCard;
