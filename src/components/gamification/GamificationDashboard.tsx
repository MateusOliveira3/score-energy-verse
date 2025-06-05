
import React from 'react';
import { Gamepad2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DailyMissions from './DailyMissions';
import Achievements from './Achievements';
import StreakCounter from './StreakCounter';
import SeasonalEvents from './SeasonalEvents';
import RewardsStore from './RewardsStore';

const GamificationDashboard = () => {
  return (
    <Card className="border-2 border-indigo-100 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-indigo-700">
          <Gamepad2 className="h-6 w-6" />
          <span>Central de Gamificação</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="missions" className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="missions">Missões</TabsTrigger>
            <TabsTrigger value="achievements">Conquistas</TabsTrigger>
            <TabsTrigger value="streak">Sequência</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="store">Loja</TabsTrigger>
          </TabsList>
          
          <TabsContent value="missions">
            <DailyMissions />
          </TabsContent>
          
          <TabsContent value="achievements">
            <Achievements />
          </TabsContent>
          
          <TabsContent value="streak">
            <StreakCounter />
          </TabsContent>
          
          <TabsContent value="events">
            <SeasonalEvents />
          </TabsContent>
          
          <TabsContent value="store">
            <RewardsStore />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GamificationDashboard;
