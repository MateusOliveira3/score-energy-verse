
import React from 'react';
import { Crown, Star, Sparkles } from 'lucide-react';

interface EcoMascotProps {
  score: number;
  level: number;
}

const EcoMascot = ({ score, level }: EcoMascotProps) => {
  const getMascotData = (level: number) => {
    if (level >= 10) {
      return {
        name: 'Eco Master',
        emoji: '🌳',
        size: 'text-8xl',
        color: 'from-emerald-600 to-green-700',
        effect: 'animate-pulse',
        description: 'Guardião da Sustentabilidade'
      };
    } else if (level >= 7) {
      return {
        name: 'Eco Champion',
        emoji: '🌲',
        size: 'text-7xl',
        color: 'from-emerald-500 to-green-600',
        effect: 'hover:scale-110',
        description: 'Campeão Ecológico'
      };
    } else if (level >= 4) {
      return {
        name: 'Eco Warrior',
        emoji: '🌿',
        size: 'text-6xl',
        color: 'from-emerald-400 to-green-500',
        effect: 'hover:scale-105',
        description: 'Guerreiro Verde'
      };
    } else {
      return {
        name: 'Eco Sprout',
        emoji: '🌱',
        size: 'text-5xl',
        color: 'from-emerald-300 to-green-400',
        effect: 'hover:scale-105',
        description: 'Broto Sustentável'
      };
    }
  };

  const mascot = getMascotData(level);
  const nextLevelScore = level * 200;
  const progressToNext = Math.min(((score % 200) / 200) * 100, 100);

  return (
    <div className="text-center">
      <div className="relative inline-block">
        {/* Círculo de fundo com gradiente */}
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
