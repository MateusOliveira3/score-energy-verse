
import React, { useState } from 'react';
import { Palette, Type, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface MascotCustomization {
  name: string;
  emoji: string;
  colorPalette: string;
  borderEffect: string;
}

interface MascotCustomizationProps {
  onCustomizationUpdate: (customization: MascotCustomization) => void;
  currentScore: number;
}

const MascotCustomizationComponent = ({ onCustomizationUpdate, currentScore }: MascotCustomizationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customization, setCustomization] = useState<MascotCustomization>({
    name: 'EcoFriend',
    emoji: '🌱',
    colorPalette: 'emerald',
    borderEffect: 'none'
  });

  const emojis = ['🌱', '🌳', '🌿', '⚡', '🌞', '💧', '🔋', '♻️'];
  const colorPalettes = [
    { name: 'emerald', colors: 'from-emerald-400 to-green-500' },
    { name: 'blue', colors: 'from-blue-400 to-cyan-500' },
    { name: 'purple', colors: 'from-purple-400 to-indigo-500' },
    { name: 'orange', colors: 'from-orange-400 to-red-500' }
  ];

  const borderEffects = [
    { name: 'none', label: 'Simples', requiredScore: 0 },
    { name: 'glow', label: 'Brilho', requiredScore: 500 },
    { name: 'pulse', label: 'Pulsação', requiredScore: 1000 },
    { name: 'rainbow', label: 'Arco-íris', requiredScore: 2000 }
  ];

  const handleSave = () => {
    onCustomizationUpdate(customization);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-emerald-600 hover:text-emerald-700">
          <Palette className="h-4 w-4 mr-2" />
          Personalizar Mascote
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-emerald-700">Personalizar EcoMascot</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Nome do Mascote */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              <Type className="h-4 w-4 inline mr-1" />
              Nome do Mascote
            </label>
            <Input
              placeholder="Ex: EcoAmigo"
              value={customization.name}
              onChange={(e) => setCustomization(prev => ({...prev, name: e.target.value}))}
            />
          </div>

          {/* Emoji */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Escolha um Emoji
            </label>
            <div className="grid grid-cols-4 gap-2">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  className={`p-2 text-2xl rounded-lg border-2 transition-all ${
                    customization.emoji === emoji 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                  onClick={() => setCustomization(prev => ({...prev, emoji}))}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Paleta de Cores */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Paleta de Cores
            </label>
            <div className="grid grid-cols-2 gap-2">
              {colorPalettes.map(palette => (
                <button
                  key={palette.name}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    customization.colorPalette === palette.name 
                      ? 'border-emerald-500' 
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                  onClick={() => setCustomization(prev => ({...prev, colorPalette: palette.name}))}
                >
                  <div className={`w-full h-6 rounded bg-gradient-to-r ${palette.colors}`}></div>
                  <span className="text-xs mt-1 block capitalize">{palette.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Efeitos de Borda */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              <Sparkles className="h-4 w-4 inline mr-1" />
              Efeitos Especiais
            </label>
            <div className="space-y-2">
              {borderEffects.map(effect => {
                const isUnlocked = currentScore >= effect.requiredScore;
                return (
                  <button
                    key={effect.name}
                    disabled={!isUnlocked}
                    className={`w-full p-2 text-left rounded-lg border transition-all ${
                      customization.borderEffect === effect.name 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : isUnlocked 
                          ? 'border-gray-200 hover:border-emerald-300' 
                          : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={() => isUnlocked && setCustomization(prev => ({...prev, borderEffect: effect.name}))}
                  >
                    <div className="flex justify-between items-center">
                      <span>{effect.label}</span>
                      {!isUnlocked && (
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          {effect.requiredScore} pts
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700">
            Salvar Personalização
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MascotCustomizationComponent;
