import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Users, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface RankingUser {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  level: number;
  rank: number;
  weeklyChange: number;
  achievements: number;
  streak: number;
  efficiency: number;
  consumerType: string;
}

const RankingPage = () => {
  const [activeTab, setActiveTab] = useState('global');
  const [currentUser, setCurrentUser] = useState<RankingUser | null>(null);
  const [rankingData, setRankingData] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Dados mockados para demonstração
  useEffect(() => {
    const mockData: RankingUser[] = [
      {
        id: '1',
        name: 'Maria Silva',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
        score: 2847,
        level: 12,
        rank: 1,
        weeklyChange: 0,
        achievements: 15,
        streak: 28,
        efficiency: 94,
        consumerType: 'Residencial'
      },
      {
        id: '2',
        name: 'João Santos',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao',
        score: 2654,
        level: 11,
        rank: 2,
        weeklyChange: 1,
        achievements: 12,
        streak: 21,
        efficiency: 89,
        consumerType: 'Comercial'
      },
      {
        id: '3',
        name: 'Ana Costa',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
        score: 2489,
        level: 10,
        rank: 3,
        weeklyChange: -1,
        achievements: 10,
        streak: 15,
        efficiency: 87,
        consumerType: 'Residencial'
      },
      {
        id: '4',
        name: 'Pedro Oliveira',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro',
        score: 2247,
        level: 9,
        rank: 4,
        weeklyChange: 2,
        achievements: 8,
        streak: 12,
        efficiency: 82,
        consumerType: 'Residencial'
      },
      {
        id: '5',
        name: 'Carla Ferreira',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carla',
        score: 1987,
        level: 8,
        rank: 5,
        weeklyChange: 0,
        achievements: 7,
        streak: 8,
        efficiency: 78,
        consumerType: 'Comercial'
      },
      {
        id: '6',
        name: 'Lucas Mendes',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas',
        score: 1847,
        level: 7,
        rank: 6,
        weeklyChange: 3,
        achievements: 6,
        streak: 5,
        efficiency: 75,
        consumerType: 'Residencial'
      },
      {
        id: '7',
        name: 'Fernanda Lima',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fernanda',
        score: 1654,
        level: 6,
        rank: 7,
        weeklyChange: -2,
        achievements: 5,
        streak: 3,
        efficiency: 72,
        consumerType: 'Residencial'
      },
      {
        id: '8',
        name: 'Roberto Alves',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto',
        score: 1547,
        level: 6,
        rank: 8,
        weeklyChange: 1,
        achievements: 4,
        streak: 2,
        efficiency: 68,
        consumerType: 'Comercial'
      }
    ];

    // Simular usuário atual (você pode integrar com o contexto de autenticação)
    const currentUserData: RankingUser = {
      id: 'current',
      name: 'Você',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Current',
      score: 1247,
      level: 7,
      rank: 12,
      weeklyChange: 2,
      achievements: 3,
      streak: 7,
      efficiency: 65,
      consumerType: 'Residencial'
    };

    setRankingData(mockData);
    setCurrentUser(currentUserData);
    setLoading(false);
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Trophy className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank <= 3) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank <= 10) return 'bg-gradient-to-r from-purple-400 to-purple-600';
    if (rank <= 25) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    return 'bg-gradient-to-r from-gray-400 to-gray-600';
  };

  const getWeeklyChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
    return <div className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <Trophy className="h-10 w-10 text-yellow-500 mr-3" />
            Ranking Energy Score
          </h1>
          <p className="text-gray-600">Compare seu desempenho com outros usuários</p>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Total de Usuários</p>
                  <p className="text-2xl font-bold">1,247</p>
                </div>
                <Users className="h-8 w-8 text-emerald-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Sua Posição</p>
                  <p className="text-2xl font-bold">#{currentUser?.rank}</p>
                </div>
                <Target className="h-8 w-8 text-blue-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Seu Score</p>
                  <p className="text-2xl font-bold">{currentUser?.score.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Eficiência</p>
                  <p className="text-2xl font-bold">{currentUser?.efficiency}%</p>
                </div>
                <div className="h-8 w-8 text-orange-100 flex items-center justify-center">
                  ⚡
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Ranking */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Classificação</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="global">Global</TabsTrigger>
                <TabsTrigger value="weekly">Semanal</TabsTrigger>
                <TabsTrigger value="monthly">Mensal</TabsTrigger>
              </TabsList>

              <TabsContent value="global" className="space-y-4">
                {/* Top 3 Podium */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {rankingData.slice(0, 3).map((user, index) => (
                    <Card key={user.id} className={`relative overflow-hidden ${
                      index === 0 ? 'bg-gradient-to-b from-yellow-100 to-yellow-200 border-yellow-300' :
                      index === 1 ? 'bg-gradient-to-b from-gray-100 to-gray-200 border-gray-300' :
                      'bg-gradient-to-b from-amber-100 to-amber-200 border-amber-300'
                    }`}>
                      <CardContent className="p-6 text-center">
                        <div className="flex justify-center mb-4">
                          {getRankIcon(user.rank)}
                        </div>
                        <Avatar className="h-16 w-16 mx-auto mb-4">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-lg mb-2">{user.name}</h3>
                        <p className="text-2xl font-bold text-gray-800 mb-2">
                          {user.score.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Nível {user.level}</p>
                        <Badge className="mt-2">
                          {user.consumerType}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Lista Completa */}
                <div className="space-y-3">
                  {rankingData.map((user) => (
                    <Card key={user.id} className={`hover:shadow-md transition-shadow ${
                      user.id === 'current' ? 'ring-2 ring-emerald-500 bg-emerald-50' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getRankBadgeColor(user.rank)}`}>
                                {user.rank}
                              </div>
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            </div>
                            <div>
                              <h4 className="font-semibold">{user.name}</h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>Nível {user.level}</span>
                                <span>•</span>
                                <span>{user.consumerType}</span>
                                <span>•</span>
                                <span>{user.achievements} conquistas</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-bold text-lg">{user.score.toLocaleString()}</p>
                              <div className="flex items-center space-x-1">
                                {getWeeklyChangeIcon(user.weeklyChange)}
                                <span className={`text-xs ${user.weeklyChange > 0 ? 'text-green-500' : user.weeklyChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                  {user.weeklyChange > 0 ? '+' : ''}{user.weeklyChange}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{user.efficiency}%</p>
                              <p className="text-xs text-gray-500">eficiência</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="weekly" className="text-center py-8">
                <div className="text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Ranking semanal em desenvolvimento</p>
                </div>
              </TabsContent>

              <TabsContent value="monthly" className="text-center py-8">
                <div className="text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Ranking mensal em desenvolvimento</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dicas para subir no ranking */}
        <Card className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-800">💡 Como subir no ranking?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-semibold mb-2">Envie suas faturas</h4>
                <p className="text-sm text-gray-600">Mantenha seu consumo atualizado para ganhar pontos</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-semibold mb-2">Complete missões</h4>
                <p className="text-sm text-gray-600">Desafios diários e semanais valem pontos extras</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl mb-2">🔥</div>
                <h4 className="font-semibold mb-2">Mantenha a sequência</h4>
                <p className="text-sm text-gray-600">Logins consecutivos multiplicam seus pontos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RankingPage; 