
import React from 'react';
import { Crown, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const LevelProgress = () => {
  const currentLevel = 7;
  const currentXP = 1247;
  const nextLevelXP = 1500;
  const progress = (currentXP / nextLevelXP) * 100;

  return (
    <Card className="border-2 border-blue-100 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-blue-700">
          <Crown className="h-5 w-5" />
          <span>Nível {currentLevel} - Eco Warrior</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{currentXP} / {nextLevelXP} pontos</span>
            <span>{nextLevelXP - currentXP} para próximo nível</span>
          </div>
          
          <Progress value={progress} className="h-3" />
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-1 text-yellow-600">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">Próximo: Eco Champion</span>
            </div>
            <div className="text-sm text-blue-600 font-medium">
              +{Math.round(progress)}% completo
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LevelProgress;
