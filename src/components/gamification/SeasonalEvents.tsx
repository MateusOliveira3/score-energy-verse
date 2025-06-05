
import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SeasonalEvent {
  id: string;
  title: string;
  description: string;
  theme: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  participants: number;
  userRank: number;
  userProgress: number;
  maxProgress: number;
  rewards: string[];
  icon: string;
}

const SeasonalEvents = () => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [events] = useState<SeasonalEvent[]>([
    {
      id: 'summer-economy',
      title: 'Desafio de Economia de Verão',
      description: 'Economize energia durante os meses mais quentes e ganhe recompensas especiais!',
      theme: 'Economia de Energia',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-31'),
      isActive: true,
      participants: 1247,
      userRank: 15,
      userProgress: 2450,
      maxProgress: 5000,
      rewards: ['Medalha de Verão', '1000 pontos', 'Avatar exclusivo'],
      icon: '☀️'
    },
    {
      id: 'green-revolution',
      title: 'Revolução Verde',
      description: 'Participe do maior movimento sustentável do ano!',
      theme: 'Sustentabilidade',
      startDate: new Date('2024-11-15'),
      endDate: new Date('2024-11-30'),
      isActive: false,
      participants: 892,
      userRank: 8,
      userProgress: 1800,
      maxProgress: 2000,
      rewards: ['Troféu Verde', '500 pontos', 'Efeito especial'],
      icon: '🌱'
    }
  ]);

  const activeEvent = events.find(event => event.isActive);

  useEffect(() => {
    if (activeEvent) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const eventEnd = activeEvent.endDate.getTime();
        const difference = eventEnd - now;

        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else {
          setTimeLeft('Evento encerrado');
        }
      };

      updateTimer();
      const timer = setInterval(updateTimer, 60000); // Update every minute

      return () => clearInterval(timer);
    }
  }, [activeEvent]);

  if (!activeEvent) {
    return (
      <Card className="border-2 border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-700">
            <Calendar className="h-5 w-5" />
            <span>Eventos Sazonais</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhum evento ativo
          </h3>
          <p className="text-gray-500 mb-4">
            Fique atento! Novos desafios sazonais chegam em breve.
          </p>
          <Button variant="outline">Ser Notificado</Button>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (activeEvent.userProgress / activeEvent.maxProgress) * 100;

  return (
    <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-purple-700">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Evento Sazonal</span>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Ativo
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header do Evento */}
        <div className="text-center">
          <div className="text-4xl mb-2">{activeEvent.icon}</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {activeEvent.title}
          </h3>
          <p className="text-gray-600 mb-4">
            {activeEvent.description}
          </p>
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            {activeEvent.theme}
          </Badge>
        </div>

        {/* Timer */}
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-600 font-medium">Tempo restante</span>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-700">{timeLeft}</div>
          </div>
        </div>

        {/* Progresso do Usuário */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-700">Seu Progresso</h4>
            <span className="text-sm font-medium text-purple-600">
              #{activeEvent.userRank} de {activeEvent.participants}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {activeEvent.userProgress.toLocaleString()} / {activeEvent.maxProgress.toLocaleString()} pontos
              </span>
              <span className="text-purple-600 font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </div>

        {/* Participantes */}
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <Users className="h-4 w-4" />
          <span className="text-sm">
            {activeEvent.participants.toLocaleString()} participantes
          </span>
        </div>

        {/* Recompensas */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span>Recompensas</span>
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {activeEvent.rewards.map((reward, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 p-2 bg-white/30 rounded-lg border border-white/20"
              >
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{reward}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Botão de Ação */}
        <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
          Ver Ranking Completo
        </Button>
      </CardContent>
    </Card>
  );
};

export default SeasonalEvents;
