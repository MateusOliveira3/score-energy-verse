
import React, { useState } from 'react';
import { Trophy, Medal, Award, Star, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: string;
  unlockedAt?: Date;
  isUnlocked: boolean;
}

const Achievements = () => {
  const [achievements] = useState<Achievement[]>([
    {
      id: 'first-invoice',
      name: 'Economizador Iniciante',
      description: 'Enviou a primeira fatura',
      icon: Trophy,
      tier: 'bronze',
      category: 'Primeiros Passos',
      unlockedAt: new Date('2024-01-15'),
      isUnlocked: true
    },
    {
      id: 'eco-warrior',
      name: 'EcoWarrior',
      description: 'Concluiu 10 ações sustentáveis',
      icon: Medal,
      tier: 'silver',
      category: 'Sustentabilidade',
      unlockedAt: new Date('2024-02-20'),
      isUnlocked: true
    },
    {
      id: 'top-rank',
      name: 'Top Rank',
      description: 'Entrou no top 3 do ranking semanal',
      icon: Award,
      tier: 'gold',
      category: 'Competitivo',
      isUnlocked: false
    },
    {
      id: 'score-legend',
      name: 'Score Lendário',
      description: 'Atingiu 5.000 pontos',
      icon: Star,
      tier: 'platinum',
      category: 'Pontuação',
      isUnlocked: false
    },
    {
      id: 'consistency',
      name: 'Dedicação Total',
      description: 'Acessou por 30 dias consecutivos',
      icon: Calendar,
      tier: 'gold',
      category: 'Consistência',
      isUnlocked: false
    }
  ]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-amber-600 to-amber-800';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-purple-500 to-purple-700';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '🌟';
      default: return '🏆';
    }
  };

  const getCategories = () => {
    return [...new Set(achievements.map(a => a.category))];
  };

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  return (
    <Card className="border-2 border-purple-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-purple-700">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Conquistas</span>
          </div>
          <Badge variant="secondary">
            {unlockedCount}/{totalCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unlocked">Desbloqueadas</TabsTrigger>
            <TabsTrigger value="locked">Bloqueadas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {getCategories().map(category => (
              <div key={category} className="space-y-3">
                <h3 className="font-semibold text-gray-700 border-b pb-1">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {achievements
                    .filter(achievement => achievement.category === category)
                    .map(achievement => {
                      const IconComponent = achievement.icon;
                      return (
                        <div
                          key={achievement.id}
                          className={`p-4 rounded-lg border transition-all duration-300 ${
                            achievement.isUnlocked
                              ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                              : 'border-gray-200 bg-gray-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${getTierColor(achievement.tier)} ${
                              achievement.isUnlocked ? '' : 'grayscale'
                            }`}>
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-gray-800">
                                  {achievement.name}
                                </h4>
                                <span className="text-lg">
                                  {getTierIcon(achievement.tier)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {achievement.description}
                              </p>
                              {achievement.unlockedAt && (
                                <p className="text-xs text-emerald-600">
                                  Desbloqueado em {achievement.unlockedAt.toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="unlocked" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements
                .filter(achievement => achievement.isUnlocked)
                .map(achievement => {
                  const IconComponent = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className="p-4 rounded-lg border border-emerald-200 bg-emerald-50"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${getTierColor(achievement.tier)}`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-800">
                              {achievement.name}
                            </h4>
                            <span className="text-lg">
                              {getTierIcon(achievement.tier)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {achievement.description}
                          </p>
                          {achievement.unlockedAt && (
                            <p className="text-xs text-emerald-600">
                              {achievement.unlockedAt.toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </TabsContent>
          
          <TabsContent value="locked" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements
                .filter(achievement => !achievement.isUnlocked)
                .map(achievement => {
                  const IconComponent = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className="p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-60"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${getTierColor(achievement.tier)} grayscale`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-800">
                              {achievement.name}
                            </h4>
                            <span className="text-lg grayscale">
                              {getTierIcon(achievement.tier)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Achievements;
