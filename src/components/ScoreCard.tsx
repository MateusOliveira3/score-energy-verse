
import React from 'react';
import { Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ScoreCard = () => {
  const currentScore = 1247;
  const weeklyGain = 156;

  return (
    <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Seu Score Energy</h2>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-bold">{currentScore.toLocaleString()}</span>
              <span className="text-green-100">pontos</span>
            </div>
          </div>
          <div className="p-4 bg-white/20 rounded-full">
            <Zap className="h-8 w-8" />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-green-100">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm">+{weeklyGain} pontos esta semana</span>
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-green-100">Ações</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">5</div>
            <div className="text-xs text-green-100">Dias</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">84%</div>
            <div className="text-xs text-green-100">Eficiência</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreCard;
