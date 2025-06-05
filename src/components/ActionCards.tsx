
import React from 'react';
import { Sun, Lightbulb, Droplets, FileText, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ActionCards = () => {
  const actions = [
    {
      id: 1,
      title: 'Energia Solar',
      description: 'Instale painéis solares',
      points: 200,
      icon: Sun,
      color: 'from-yellow-400 to-orange-500',
      completed: false,
    },
    {
      id: 2,
      title: 'Lâmpadas LED',
      description: 'Troque por LEDs',
      points: 50,
      icon: Lightbulb,
      color: 'from-blue-400 to-blue-600',
      completed: true,
    },
    {
      id: 3,
      title: 'Economia de Água',
      description: 'Reduza o consumo',
      points: 75,
      icon: Droplets,
      color: 'from-cyan-400 to-blue-500',
      completed: false,
    },
    {
      id: 4,
      title: 'Enviar Fatura',
      description: 'Compartilhe sua conta',
      points: 30,
      icon: FileText,
      color: 'from-green-400 to-green-600',
      completed: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800">Ações Sustentáveis</h3>
        <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
          <Plus className="h-4 w-4 mr-2" />
          Nova Ação
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Card
              key={action.id}
              className={`border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer ${
                action.completed 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color}`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{action.title}</h4>
                      <div className="flex items-center space-x-1">
                        <span className="text-lg font-bold text-green-600">+{action.points}</span>
                        <span className="text-sm text-gray-500">pts</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{action.description}</p>
                    
                    <Button
                      size="sm"
                      variant={action.completed ? "secondary" : "default"}
                      className={
                        action.completed
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      }
                    >
                      {action.completed ? 'Concluído ✓' : 'Registrar'}
                    </Button>
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

export default ActionCards;
