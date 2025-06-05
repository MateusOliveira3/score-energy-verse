
import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Leaderboard = () => {
  const users = [
    { id: 1, name: 'Ana Silva', score: 2456, position: 1, avatar: 'AS' },
    { id: 2, name: 'Carlos Santos', score: 2234, position: 2, avatar: 'CS' },
    { id: 3, name: 'Maria Costa', score: 1998, position: 3, avatar: 'MC' },
    { id: 4, name: 'Você', score: 1247, position: 4, avatar: 'EU', isCurrentUser: true },
    { id: 5, name: 'João Lima', score: 1156, position: 5, avatar: 'JL' },
    { id: 6, name: 'Lucia Rocha', score: 1089, position: 6, avatar: 'LR' },
  ];

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{position}</span>;
    }
  };

  return (
    <Card className="border-2 border-purple-100 shadow-lg h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-purple-700">
          <Trophy className="h-5 w-5" />
          <span>Ranking Semanal</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                user.isCurrentUser 
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center w-8">
                {getPositionIcon(user.position)}
              </div>
              
              <Avatar className="h-10 w-10">
                <AvatarFallback className={
                  user.isCurrentUser 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }>
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  {user.name}
                  {user.isCurrentUser && (
                    <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                      Você
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {user.score.toLocaleString()} pontos
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="text-sm text-center text-gray-600">
            <span className="font-medium">Próxima atualização:</span>
            <div className="text-lg font-bold text-purple-600 mt-1">2 dias</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
