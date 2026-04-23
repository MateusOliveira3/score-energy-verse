
import React, { useState } from 'react';
import { Sun, Lightbulb, Droplets, FileText, Plus, CheckCircle, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Action {
  id: number;
  title: string;
  description: string;
  points: number;
  icon: LucideIcon;
  color: string;
  completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

const ActionCards = () => {
  const { toast } = useToast();
  const [actions, setActions] = useState<Action[]>([
    {
      id: 1,
      title: 'Energia Solar',
      description: 'Instale painéis solares',
      points: 200,
      icon: Sun,
      color: 'from-yellow-400 to-orange-500',
      completed: false,
      difficulty: 'hard',
      category: 'Investimento'
    },
    {
      id: 2,
      title: 'Lâmpadas LED',
      description: 'Troque por LEDs',
      points: 50,
      icon: Lightbulb,
      color: 'from-blue-400 to-blue-600',
      completed: true,
      difficulty: 'easy',
      category: 'Eficiência'
    },
    {
      id: 3,
      title: 'Economia de Água',
      description: 'Reduza o consumo',
      points: 75,
      icon: Droplets,
      color: 'from-cyan-400 to-blue-500',
      completed: false,
      difficulty: 'medium',
      category: 'Conservação'
    },
    {
      id: 4,
      title: 'Enviar Fatura',
      description: 'Compartilhe sua conta',
      points: 30,
      icon: FileText,
      color: 'from-emerald-400 to-emerald-600',
      completed: true,
      difficulty: 'easy',
      category: 'Participação'
    },
  ]);

  const handleActionClick = (actionId: number) => {
    setActions(prev => prev.map(action => {
      if (action.id === actionId && !action.completed) {
        toast({
          title: `🎉 Ação concluída!`,
          description: `Você ganhou ${action.points} pontos com "${action.title}"`,
        });
        return { ...action, completed: true };
      }
      return action;
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      default: return 'Normal';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800">Ações Sustentáveis</h3>
        <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200">
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
              className={`border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer transform ${
                action.completed 
                  ? 'border-emerald-200 bg-emerald-50 shadow-lg scale-[0.98]' 
                  : 'border-gray-200 hover:border-emerald-300 hover:shadow-emerald-100'
              }`}
              onClick={() => handleActionClick(action.id)}
            >
              <CardContent className="p-6 relative overflow-hidden">
                {/* Efeito de brilho para ações concluídas */}
                {action.completed && (
                  <div className="absolute top-2 right-2 animate-pulse">
                    <Sparkles className="h-5 w-5 text-emerald-500" />
                  </div>
                )}
                
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} transform transition-transform duration-300 hover:scale-110 shadow-lg`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{action.title}</h4>
                      <div className="flex items-center space-x-1">
                        <span className="text-lg font-bold text-emerald-600">+{action.points}</span>
                        <span className="text-sm text-gray-500">pts</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{action.description}</p>
                    
                    {/* Tags de categoria e dificuldade */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {action.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(action.difficulty)}`}>
                        {getDifficultyText(action.difficulty)}
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      variant={action.completed ? "secondary" : "default"}
                      className={`w-full transform transition-all duration-200 ${
                        action.completed
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-default"
                          : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:scale-105 shadow-lg hover:shadow-emerald-200"
                      }`}
                      disabled={action.completed}
                    >
                      {action.completed ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Concluído</span>
                        </div>
                      ) : (
                        'Registrar'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Estatísticas das ações */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
          <div className="text-2xl font-bold text-emerald-600">
            {actions.filter(a => a.completed).length}
          </div>
          <div className="text-sm text-emerald-700">Concluídas</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {actions.reduce((sum, a) => a.completed ? sum + a.points : sum, 0)}
          </div>
          <div className="text-sm text-blue-700">Pontos Ganhos</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {actions.length - actions.filter(a => a.completed).length}
          </div>
          <div className="text-sm text-purple-700">Pendentes</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round((actions.filter(a => a.completed).length / actions.length) * 100)}%
          </div>
          <div className="text-sm text-orange-700">Progresso</div>
        </div>
      </div>
    </div>
  );
};

export default ActionCards;
