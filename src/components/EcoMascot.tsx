
import React from 'react';
import { Crown, Star, Sparkles } from 'lucide-react';

interface EcoMascotProps {
  score: number;
  level: number;
  consumerType?: string;
  customization?: {
    name: string;
    emoji: string;
    colorPalette: string;
    borderEffect: string;
  };
}

const EcoMascot = ({ score, level, consumerType = 'Residencial', customization }: EcoMascotProps) => {
  const getMascotData = (level: number, consumerType: string, customization?: any) => {
    // Nome baseado no tipo de consumidor
    const getNameByType = (type: string) => {
      const names = {
        'Residencial': 'EcoFamília',
        'Comercial': 'EcoBiz',
        'Restaurante': 'EcoChef',
        'Escola': 'EcoAluno',
        'Industria': 'EcoTech'
      };
      return names[type as keyof typeof names] || 'EcoFriend';
    };

    const baseName = customization?.name || getNameByType(consumerType);
    const emoji = customization?.emoji || '🌱';

    if (level >= 10) {
      return {
        name: `${baseName} Master`,
        emoji: emoji,
        size: 'text-8xl',
        color: getColorPalette(customization?.colorPalette || 'emerald', 'master'),
        effect: getBorderEffect(customization?.borderEffect || 'pulse'),
        description: 'Guardião da Sustentabilidade'
      };
    } else if (level >= 7) {
      return {
        name: `${baseName} Champion`,
        emoji: emoji,
        size: 'text-7xl',
        color: getColorPalette(customization?.colorPalette || 'emerald', 'champion'),
        effect: getBorderEffect(customization?.borderEffect || 'glow'),
        description: 'Campeão Ecológico'
      };
    } else if (level >= 4) {
      return {
        name: `${baseName} Warrior`,
        emoji: emoji,
        size: 'text-6xl',
        color: getColorPalette(customization?.colorPalette || 'emerald', 'warrior'),
        effect: getBorderEffect(customization?.borderEffect || 'hover:scale-105'),
        description: 'Guerreiro Verde'
      };
    } else {
      return {
        name: baseName,
        emoji: emoji,
        size: 'text-5xl',
        color: getColorPalette(customization?.colorPalette || 'emerald', 'basic'),
        effect: getBorderEffect(customization?.borderEffect || 'hover:scale-105'),
        description: 'Broto Sustentável'
      };
    }
  };

  const getColorPalette = (palette: string, tier: string) => {
    const palettes = {
      emerald: {
        basic: 'from-emerald-300 to-green-400',
        warrior: 'from-emerald-400 to-green-500',
        champion: 'from-emerald-500 to-green-600',
        master: 'from-emerald-600 to-green-700'
      },
      blue: {
        basic: 'from-blue-300 to-cyan-400',
        warrior: 'from-blue-400 to-cyan-500',
        champion: 'from-blue-500 to-cyan-600',
        master: 'from-blue-600 to-cyan-700'
      },
      purple: {
        basic: 'from-purple-300 to-indigo-400',
        warrior: 'from-purple-400 to-indigo-500',
        champion: 'from-purple-500 to-indigo-600',
        master: 'from-purple-600 to-indigo-700'
      },
      orange: {
        basic: 'from-orange-300 to-red-400',
        warrior: 'from-orange-400 to-red-500',
        champion: 'from-orange-500 to-red-600',
        master: 'from-orange-600 to-red-700'
      }
    };
    return palettes[palette as keyof typeof palettes]?.[tier as keyof typeof palettes.emerald] || palettes.emerald[tier as keyof typeof palettes.emerald];
  };

  const getBorderEffect = (effect: string) => {
    const effects = {
      none: 'hover:scale-110',
      glow: 'hover:scale-110 shadow-lg animate-glow',
      pulse: 'hover:scale-110 animate-pulse',
      rainbow: 'hover:scale-110 animate-pulse border-4 border-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500'
    };
    return effects[effect as keyof typeof effects] || effects.none;
  };

  const mascot = getMascotData(level, consumerType, customization);
  const progressToNext = Math.min(((score % 200) / 200) * 100, 100);

  return (
    <div className="text-center">
      <div className="relative inline-block">
        {/* Círculo de fundo com gradiente personalizado */}
        <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${mascot.color} flex items-center justify-center shadow-lg transition-all duration-500 ${mascot.effect}`}>
          <div className={`${mascot.size} transition-all duration-500`}>
            {mascot.emoji}
          </div>
        </div>
        
        {/* Efeitos especiais baseados no nível */}
        {level >= 7 && (
          <div className="absolute -top-2 -right-2 animate-bounce">
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>
        )}
        
        {level >= 10 && (
          <div className="absolute inset-0 animate-ping">
            <div className="w-32 h-32 rounded-full bg-emerald-400 opacity-20"></div>
          </div>
        )}
        
        {/* Estrelas flutuantes para níveis altos */}
        {level >= 5 && (
          <>
            <div className="absolute -top-1 left-2 animate-pulse delay-100">
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
            </div>
            <div className="absolute top-2 -right-1 animate-pulse delay-300">
              <Sparkles className="h-3 w-3 text-blue-400" />
            </div>
          </>
        )}
      </div>
      
      <div className="mt-4 space-y-2">
        <h3 className="text-xl font-bold text-gray-800">{mascot.name}</h3>
        <p className="text-sm text-gray-600">{mascot.description}</p>
        
        {/* Barra de progresso para o próximo nível */}
        <div className="max-w-xs mx-auto">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Nível {level}</span>
            <span>Nível {level + 1}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressToNext}%` }}
            ></div>
          </div>
          <div className="text-xs text-center text-gray-500 mt-1">
            {Math.round(progressToNext)}% para evoluir
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcoMascot;
