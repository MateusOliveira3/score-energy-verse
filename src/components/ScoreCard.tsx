
import React from 'react';
import { Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import EcoMascot from './EcoMascot';

interface ScoreCardProps {
  score?: number;
  level?: number;
  consumerType?: string;
  mascotCustomization?: {
    name: string;
    emoji: string;
    colorPalette: string;
    borderEffect: string;
  };
}

const ScoreCard = ({ 
  score = 1247, 
  level = 7, 
  consumerType = 'Residencial',
  mascotCustomization 
}: ScoreCardProps) => {
  const weeklyGain = 156;

  return (
    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl overflow-hidden relative">
      {/* Efeito de fundo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-500/20 animate-pulse"></div>
      
      <CardContent className="p-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Seção do Score */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Seu Score Energy</h2>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-5xl font-bold animate-pulse">{score.toLocaleString()}</span>
              <span className="text-emerald-100">pontos</span>
            </div>
            
            <div className="flex items-center space-x-2 text-emerald-100 mb-6">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">+{weeklyGain} pontos esta semana</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold">12</div>
                <div className="text-xs text-emerald-100">Ações</div>
              </div>
              <div className="text-center bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold">5</div>
                <div className="text-xs text-emerald-100">Dias</div>
              </div>
              <div className="text-center bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold">84%</div>
                <div className="text-xs text-emerald-100">Eficiência</div>
              </div>
            </div>
          </div>
          
          {/* Seção do Mascote */}
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
        </div>

        {/* Ícone decorativo */}
        <div className="absolute top-4 right-4 p-4 bg-white/20 rounded-full">
          <Zap className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreCard;
