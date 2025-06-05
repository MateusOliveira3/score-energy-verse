import React from 'react';
import { Lightbulb, TrendingUp, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InvoiceData {
  consumption: number;
  totalValue: number;
  taxPercentage: number;
  peakHours: string;
  month: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  category: 'energy' | 'cost' | 'behavior' | 'investment';
  potentialSavings: number;
  points: number;
  icon: React.ComponentType<any>;
}

interface SmartRecommendationsProps {
  invoiceData?: InvoiceData;
  currentScore: number;
  userLevel: number;
  userProfile?: {
    consumerType: string;
    location: string;
    propertySize: number;
    peopleCount: number;
    energyPreference: string;
  };
}

const SmartRecommendations = ({ 
  invoiceData, 
  currentScore, 
  userLevel,
  userProfile 
}: SmartRecommendationsProps) => {
  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    
    if (!invoiceData) {
      // Recomendações gerais quando não há dados da fatura
      return [
        {
          id: '1',
          title: 'Envie sua fatura',
          description: 'Upload sua conta de energia para recomendações personalizadas',
          impact: 'Desbloqueie análises detalhadas',
          priority: 'high',
          category: 'behavior',
          potentialSavings: 0,
          points: 100,
          icon: Zap
        }
      ];
    }

    // Recomendações baseadas no consumo
    if (invoiceData.consumption > 200) {
      recommendations.push({
        id: '2',
        title: 'Troque por lâmpadas LED',
        description: 'Seu alto consumo indica oportunidade com iluminação eficiente',
        impact: 'Redução de até 80% no consumo de iluminação',
        priority: 'high',
        category: 'energy',
        potentialSavings: 25,
        points: 150,
        icon: Lightbulb
      });
    }

    // Recomendações baseadas no valor da conta
    if (invoiceData.totalValue > 150) {
      recommendations.push({
        id: '3',
        title: 'Considere energia solar',
        description: 'Com contas altas, painéis solares têm retorno mais rápido',
        impact: 'Economia de até 90% na conta de luz',
        priority: 'high',
        category: 'investment',
        potentialSavings: 70,
        points: 500,
        icon: TrendingUp
      });
    }

    // Recomendações baseadas no horário de pico
    if (invoiceData.peakHours.includes('18:00')) {
      recommendations.push({
        id: '4',
        title: 'Evite horário de pico',
        description: 'Use aparelhos fora do horário 18:00-22:00',
        impact: 'Redução de até 30% nos custos de energia',
        priority: 'medium',
        category: 'behavior',
        potentialSavings: 20,
        points: 75,
        icon: Target
      });
    }

    // Recomendações baseadas no nível do usuário
    if (userLevel < 3) {
      recommendations.push({
        id: '5',
        title: 'Complete ações básicas',
        description: 'Finalize ações simples para subir de nível rapidamente',
        impact: 'Acelere sua evolução no Score Energy',
        priority: 'medium',
        category: 'behavior',
        potentialSavings: 10,
        points: 100,
        icon: Target
      });
    }

    return recommendations.slice(0, 3); // Máximo 3 recomendações
  };

  const generateContextualRecommendations = () => {
    if (!invoiceData || !userProfile) return [];

    const recommendations = [];
    const { consumerType, propertySize, peopleCount, energyPreference } = userProfile;

    // Recomendações específicas por tipo de consumidor
    if (consumerType === 'Restaurante') {
      recommendations.push({
        id: 'restaurant-led',
        title: 'LEDs para Cozinha Comercial',
        description: 'Substitua lâmpadas da cozinha por LEDs de alta potência específicos para área comercial.',
        impact: '25% redução no consumo de iluminação',
        difficulty: 'Médio',
        points: 150,
        icon: '💡'
      });
    } else if (consumerType === 'Escola') {
      recommendations.push({
        id: 'school-solar',
        title: 'Painel Solar Educativo',
        description: 'Instale sistema fotovoltaico que serve como ferramenta educativa para alunos.',
        impact: '40% redução na conta de energia',
        difficulty: 'Alto',
        points: 300,
        icon: '☀️'
      });
    }

    // Recomendações baseadas no tamanho do imóvel
    if (propertySize > 200) {
      recommendations.push({
        id: 'large-property-automation',
        title: 'Automação Residencial',
        description: 'Sistema inteligente para gerenciar iluminação e climatização automaticamente.',
        impact: '30% economia energética',
        difficulty: 'Alto',
        points: 250,
        icon: '🏠'
      });
    }

    return recommendations.slice(0, 3);
  };

  const contextualRecommendations = generateContextualRecommendations();
  const baseRecommendations = generateRecommendations();
  const allRecommendations = [...contextualRecommendations, ...baseRecommendations].slice(0, 4);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="border-2 border-blue-100 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-700">
          <Lightbulb className="h-5 w-5" />
          <span>Recomendações Inteligentes</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allRecommendations.map((rec) => {
            const IconComponent = rec.icon;
            return (
              <div
                key={rec.id}
                className={`p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800">{rec.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(rec.priority)}`}>
                        {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600">{rec.description}</p>
                    <p className="text-sm font-medium text-emerald-600">{rec.impact}</p>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-600 font-medium">
                          💰 {rec.potentialSavings}% economia
                        </span>
                        <span className="text-blue-600 font-medium">
                          ⚡ +{rec.points} pontos
                        </span>
                      </div>
                      
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {invoiceData && (
          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
            <div className="text-sm text-center">
              <p className="font-medium text-gray-700">
                Baseado na sua fatura de {invoiceData.month}
              </p>
              <p className="text-gray-600">
                {invoiceData.consumption} kWh • R$ {invoiceData.totalValue}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartRecommendations;
