
import React, { useState } from 'react';
import { Coins, ShoppingBag, Star, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'mascot' | 'effects' | 'badges' | 'premium';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  preview?: string;
  owned: boolean;
}

const RewardsStore = () => {
  const [userCoins] = useState(245);
  const [items] = useState<StoreItem[]>([
    {
      id: 'mascot-crown',
      name: 'Coroa Dourada',
      description: 'Uma coroa brilhante para seu mascote',
      price: 150,
      category: 'mascot',
      rarity: 'rare',
      icon: '👑',
      owned: false
    },
    {
      id: 'glow-effect',
      name: 'Efeito Brilho',
      description: 'Adiciona um brilho mágico ao redor do mascote',
      price: 200,
      category: 'effects',
      rarity: 'epic',
      icon: '✨',
      owned: true
    },
    {
      id: 'eco-master-badge',
      name: 'Insígnia Eco Master',
      description: 'Mostre que você é um verdadeiro mestre sustentável',
      price: 300,
      category: 'badges',
      rarity: 'legendary',
      icon: '🌟',
      owned: false
    },
    {
      id: 'rainbow-trail',
      name: 'Rastro Arco-íris',
      description: 'Deixa um rastro colorido quando o mascote se move',
      price: 100,
      category: 'effects',
      rarity: 'common',
      icon: '🌈',
      owned: false
    },
    {
      id: 'solar-panel-hat',
      name: 'Chapéu Painel Solar',
      description: 'Chapéu ecológico com mini painel solar',
      price: 180,
      category: 'mascot',
      rarity: 'rare',
      icon: '☀️',
      owned: false
    },
    {
      id: 'premium-avatar',
      name: 'Avatar Premium',
      description: 'Desbloqueie avatares exclusivos e animações especiais',
      price: 500,
      category: 'premium',
      rarity: 'legendary',
      icon: '🚀',
      owned: false
    }
  ]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'Comum';
      case 'rare': return 'Raro';
      case 'epic': return 'Épico';
      case 'legendary': return 'Lendário';
      default: return 'Comum';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'mascot': return 'Personalização';
      case 'effects': return 'Efeitos';
      case 'badges': return 'Insígnias';
      case 'premium': return 'Premium';
      default: return 'Outros';
    }
  };

  const getItemsByCategory = (category: string) => {
    return items.filter(item => item.category === category);
  };

  const canAfford = (price: number) => userCoins >= price;

  return (
    <Card className="border-2 border-yellow-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-yellow-700">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5" />
            <span>Loja de Recompensas</span>
          </div>
          <div className="flex items-center space-x-2 bg-yellow-100 px-3 py-1 rounded-full">
            <Coins className="h-4 w-4 text-yellow-600" />
            <span className="font-bold text-yellow-700">{userCoins}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="mascot">Mascote</TabsTrigger>
            <TabsTrigger value="effects">Efeitos</TabsTrigger>
            <TabsTrigger value="badges">Insígnias</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    item.owned
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`text-3xl p-2 rounded-lg bg-gradient-to-r ${getRarityColor(item.rarity)}`}>
                      {item.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{item.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {getRarityText(item.rarity)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold text-yellow-600">{item.price}</span>
                        </div>
                        
                        {item.owned ? (
                          <Badge className="bg-emerald-500">
                            Possuído
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!canAfford(item.price)}
                            className={`${
                              canAfford(item.price)
                                ? 'bg-yellow-500 hover:bg-yellow-600'
                                : 'bg-gray-300 cursor-not-allowed'
                            }`}
                          >
                            Comprar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {['mascot', 'effects', 'badges', 'premium'].map(category => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getItemsByCategory(category).map(item => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      item.owned
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`text-3xl p-2 rounded-lg bg-gradient-to-r ${getRarityColor(item.rarity)}`}>
                        {item.icon}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-800">{item.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {getRarityText(item.rarity)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold text-yellow-600">{item.price}</span>
                          </div>
                          
                          {item.owned ? (
                            <Badge className="bg-emerald-500">
                              Possuído
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              disabled={!canAfford(item.price)}
                              className={`${
                                canAfford(item.price)
                                  ? 'bg-yellow-500 hover:bg-yellow-600'
                                  : 'bg-gray-300 cursor-not-allowed'
                              }`}
                            >
                              Comprar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Como ganhar moedas */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <Sparkles className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Como ganhar Moedas Verdes:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Complete missões diárias (+10-15 moedas)</li>
                <li>• Mantenha sua sequência de acesso (+5-20 moedas)</li>
                <li>• Participe de eventos sazonais (+50-100 moedas)</li>
                <li>• Desbloqueie conquistas (+25-75 moedas)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RewardsStore;
