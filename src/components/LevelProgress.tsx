import React from 'react';
import { Crown, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LevelProgressProps {
  score: number;
  level: number;
  nextLevelScore: number;
  progress: number;
  variant?: 'default' | 'compact';
}

const LevelProgress = ({
  score,
  level,
  nextLevelScore,
  progress,
  variant = 'default',
}: LevelProgressProps) => {
  const pointsToNextLevel = Math.max(nextLevelScore - score, 0);

  if (variant === 'compact') {
    return (
      <div className="border-t border-white/12 px-5 pb-5 pt-4 text-white">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-emerald-50/90">
              {score} / {nextLevelScore}
            </span>
            <span className="text-emerald-50/70">{pointsToNextLevel} para o proximo nivel</span>
          </div>

          <Progress
            value={progress}
            className="[&>div]:bg-[#bde97b] h-2 bg-emerald-950/35"
          />

          <div className="flex items-center justify-between gap-3 text-xs text-emerald-50/75">
            <span className="inline-flex items-center gap-1">
              <Crown className="h-3.5 w-3.5 text-amber-200" />
              Nivel {level}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-current text-amber-200" />
              {progress}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-2 border-blue-100 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-blue-700">
          <Crown className="h-5 w-5" />
          <span>Nivel {level} - Jornada em Evolucao</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {score} / {nextLevelScore} pontos
            </span>
            <span>{pointsToNextLevel} para o proximo nivel</span>
          </div>

          <Progress value={progress} className="h-3" />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-1 text-yellow-600">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">Proximo marco de progresso</span>
            </div>
            <div className="text-sm font-medium text-blue-600">+{progress}% completo</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LevelProgress;
