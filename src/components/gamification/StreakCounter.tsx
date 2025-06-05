
import React from 'react';
import { Flame, Calendar, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const StreakCounter = () => {
  const currentStreak = 7;
  const longestStreak = 15;
  const nextReward = 30;
  const progressToNext = (currentStreak / nextReward) * 100;

  const getStreakRewards = () => [
    { days: 3, reward: '30 pontos', completed: currentStreak >= 3 },
    { days: 7, reward: '100 pontos + efeito visual', completed: currentStreak >= 7 },
    { days: 15, reward: '250 pontos + medalha', completed: currentStreak >= 15 },
    { days: 30, reward: 'Medalha especial + 500 pontos', completed: currentStreak >= 30 }
  ];

  const getStreakLevel = () => {
    if (currentStreak >= 30) return { title: 'Lenda Verde', color: 'from-purple-500 to-purple-700', icon: '🌟' };
    if (currentStreak >= 15) return { title: 'Campeão Eco', color: 'from-yellow-500 to-yellow-600', icon: '🏆' };
    if (currentStreak >= 7) return { title: 'Guerreiro Sustentável', color: 'from-emerald-500 to-emerald-600', icon: '⚡' };
    if (currentStreak >= 3) return { title: 'Eco Dedicado', color: 'from-blue-500 to-blue-600', icon: '🔥' };
    return { title: 'Iniciante', color: 'from-gray-400 to-gray-600', icon: '🌱' };
  };

  const streakLevel = getStreakLevel();

  return (
    <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-red-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-700">
          <Flame className="h-5 w-5" />
          <span>Sequência de Acesso</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contador Principal */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r ${streakLevel.color} text-white shadow-lg mb-4`}>
            <div className="text-center">
              <div className="text-3xl font-bold">{currentStreak}</div>
              <div className="text-xs">dias</div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {streakLevel.icon} {streakLevel.title}
          </h3>
          <p className="text-sm text-gray-600">
            Recorde pessoal: {longestStreak} dias
          </p>
        </div>

        {/* Progresso para próxima recompensa */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Próxima recompensa em:</span>
            <span className="font-medium text-orange-600">
              {nextReward - currentStreak} dias
            </span>
          </div>
          <Progress value={progressToNext} className="h-3" />
        </div>

        {/* Lista de Recompensas */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 text-sm">Recompensas de Sequência:</h4>
          <div className="space-y-2">
            {getStreakRewards().map((reward, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  reward.completed
                    ? 'bg-emerald-100 border border-emerald-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  reward.completed ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  {reward.completed ? (
                    <Zap className="h-4 w-4 text-white" />
                  ) : (
                    <Calendar className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${
                      reward.completed ? 'text-emerald-700' : 'text-gray-600'
                    }`}>
                      {reward.days} dias
                    </span>
                    <span className={`text-sm ${
                      reward.completed ? 'text-emerald-600' : 'text-gray-500'
                    }`}>
                      {reward.reward}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dica motivacional */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-lg border border-amber-200">
          <div className="flex items-start space-x-2">
            <div className="text-lg">💡</div>
            <div>
              <p className="text-sm text-amber-800 font-medium">
                Dica: Acesse diariamente para manter sua sequência!
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {currentStreak < 3 
                  ? 'Você está começando bem! Continue assim.'
                  : currentStreak < 7
                  ? 'Ótimo progresso! Você está no caminho certo.'
                  : currentStreak < 15
                  ? 'Incrível dedicação! Você é um verdadeiro eco-warrior.'
                  : 'Você é uma inspiração sustentável! Parabéns!'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakCounter;
