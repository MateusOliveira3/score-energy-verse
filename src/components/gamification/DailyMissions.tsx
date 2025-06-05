
import React, { useState } from 'react';
import { CheckCircle, Clock, Gift, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  progress: number;
  target: number;
  reward: {
    points: number;
    coins: number;
    badge?: string;
  };
  completed: boolean;
  icon: React.ComponentType<any>;
}

const DailyMissions = () => {
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: 'daily-1',
      title: 'Envie uma fatura',
      description: 'Faça upload da sua conta de energia',
      type: 'daily',
      progress: 0,
      target: 1,
      reward: { points: 50, coins: 10 },
      completed: false,
      icon: Zap
    },
    {
      id: 'daily-2',
      title: 'Complete 2 ações',
      description: 'Registre duas ações sustentáveis',
      type: 'daily',
      progress: 1,
      target: 2,
      reward: { points: 75, coins: 15 },
      completed: false,
      icon: Target
    },
    {
      id: 'weekly-1',
      title: 'Acesse por 5 dias',
      description: 'Visite o Score Energy por 5 dias consecutivos',
      type: 'weekly',
      progress: 3,
      target: 5,
      reward: { points: 200, coins: 50, badge: 'Dedicado' },
      completed: false,
      icon: Clock
    },
    {
      id: 'monthly-1',
      title: 'Top 10 Ranking',
      description: 'Entre no top 10 do ranking mensal',
      type: 'monthly',
      progress: 0,
      target: 1,
      reward: { points: 500, coins: 100, badge: 'Campeão' },
      completed: false,
      icon: Gift
    }
  ]);

  const completeMission = (missionId: string) => {
    setMissions(prev => prev.map(mission => {
      if (mission.id === missionId && !mission.completed) {
        return { ...mission, completed: true, progress: mission.target };
      }
      return mission;
    }));
  };

  const getMissionsByType = (type: 'daily' | 'weekly' | 'monthly') => {
    return missions.filter(mission => mission.type === type);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'from-emerald-400 to-emerald-600';
      case 'weekly': return 'from-blue-400 to-blue-600';
      case 'monthly': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'Diárias';
      case 'weekly': return 'Semanais';
      case 'monthly': return 'Mensais';
      default: return 'Missões';
    }
  };

  const renderMissionGroup = (type: 'daily' | 'weekly' | 'monthly') => {
    const groupMissions = getMissionsByType(type);
    
    return (
      <div className="space-y-4">
        <h3 className={`text-lg font-bold bg-gradient-to-r ${getTypeColor(type)} bg-clip-text text-transparent`}>
          Missões {getTypeLabel(type)}
        </h3>
        <div className="space-y-3">
          {groupMissions.map((mission) => {
            const IconComponent = mission.icon;
            const progressPercentage = (mission.progress / mission.target) * 100;
            
            return (
              <Card key={mission.id} className={`border transition-all duration-300 ${
                mission.completed 
                  ? 'border-emerald-200 bg-emerald-50' 
                  : 'border-gray-200 hover:border-emerald-300'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getTypeColor(type)}`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{mission.title}</h4>
                        {mission.completed && (
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{mission.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Progresso: {mission.progress}/{mission.target}
                          </span>
                          <span className="font-medium text-emerald-600">
                            +{mission.reward.points} pts, +{mission.reward.coins} moedas
                          </span>
                        </div>
                        
                        <Progress value={progressPercentage} className="h-2" />
                        
                        {mission.reward.badge && (
                          <Badge variant="secondary" className="text-xs">
                            🏆 {mission.reward.badge}
                          </Badge>
                        )}
                      </div>
                      
                      {!mission.completed && mission.progress >= mission.target && (
                        <Button
                          size="sm"
                          className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => completeMission(mission.id)}
                        >
                          Concluir Missão
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-2 border-emerald-100">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-emerald-700">
          <Target className="h-5 w-5" />
          <span>Missões Ativas</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderMissionGroup('daily')}
        {renderMissionGroup('weekly')}
        {renderMissionGroup('monthly')}
      </CardContent>
    </Card>
  );
};

export default DailyMissions;
