import React, { useEffect, useState } from 'react';
import { Palette, Type, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MascotCustomizationData } from '@/types/mvp';

interface MascotCustomizationProps {
  value: MascotCustomizationData;
  onCustomizationUpdate: (customization: MascotCustomizationData) => void;
  currentScore: number;
}

const MascotCustomizationComponent = ({
  value,
  onCustomizationUpdate,
  currentScore,
}: MascotCustomizationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customization, setCustomization] = useState<MascotCustomizationData>(value);
  const sectionLabelClassName =
    'mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800';

  useEffect(() => {
    setCustomization(value);
  }, [value]);

  const emojis = ['🌱', '🌳', '🌿', '⚡', '🌞', '💧', '🔋', '♻️'];
  const colorPalettes = [
    { name: 'emerald', colors: 'from-emerald-400 to-green-500' },
    { name: 'blue', colors: 'from-blue-400 to-cyan-500' },
    { name: 'purple', colors: 'from-purple-400 to-indigo-500' },
    { name: 'orange', colors: 'from-orange-400 to-red-500' },
  ];

  const borderEffects = [
    { name: 'none', label: 'Simples', requiredScore: 0 },
    { name: 'glow', label: 'Brilho', requiredScore: 500 },
    { name: 'pulse', label: 'Pulsacao', requiredScore: 1000 },
    { name: 'rainbow', label: 'Arco-iris', requiredScore: 2000 },
  ];

  const handleSave = () => {
    onCustomizationUpdate({
      name: customization.name,
      emoji: customization.emoji,
      colorPalette: customization.colorPalette,
      borderEffect: customization.borderEffect,
    });
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

      <DialogContent className="max-w-md border border-emerald-100 bg-white shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-emerald-700">Personalizar EcoMascot</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Selecao atual
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-white text-2xl shadow-sm">
                {customization.emoji}
              </div>
              <div>
                <div className="font-semibold text-slate-800">{customization.name || 'EcoFriend'}</div>
                <div className="text-sm text-slate-600">
                  Paleta {customization.colorPalette} • Efeito {customization.borderEffect}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className={sectionLabelClassName}>
              <Type className="h-4 w-4 text-emerald-600" />
              Nome do Mascote
            </label>
            <Input
              className="h-11 border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="Ex: EcoAmigo"
              value={customization.name}
              onChange={(event) =>
                setCustomization((currentCustomization) => ({
                  ...currentCustomization,
                  name: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className={sectionLabelClassName}>Escolha um Emoji</label>
            <div className="grid grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  className={`p-2 text-2xl rounded-lg border-2 transition-all ${
                    customization.emoji === emoji
                      ? 'border-emerald-500 bg-white shadow-sm ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                  onClick={() =>
                    setCustomization((currentCustomization) => ({
                      ...currentCustomization,
                      emoji,
                    }))
                  }
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={sectionLabelClassName}>Paleta de Cores</label>
            <div className="grid grid-cols-2 gap-2">
              {colorPalettes.map((palette) => (
                <button
                  key={palette.name}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    customization.colorPalette === palette.name
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                  onClick={() =>
                    setCustomization((currentCustomization) => ({
                      ...currentCustomization,
                      colorPalette: palette.name,
                    }))
                  }
                >
                  <div className={`w-full h-6 rounded bg-gradient-to-r ${palette.colors}`}></div>
                  <span className="mt-2 block text-xs font-medium capitalize text-slate-700">
                    {palette.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={sectionLabelClassName}>
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Efeitos Especiais
            </label>
            <div className="space-y-2">
              {borderEffects.map((effect) => {
                const isUnlocked = currentScore >= effect.requiredScore;
                return (
                  <button
                    key={effect.name}
                    disabled={!isUnlocked}
                    className={`w-full p-2 text-left rounded-lg border transition-all ${
                      customization.borderEffect === effect.name
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                        : isUnlocked
                          ? 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50'
                          : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    onClick={() =>
                      isUnlocked &&
                      setCustomization((currentCustomization) => ({
                        ...currentCustomization,
                        borderEffect: effect.name,
                      }))
                    }
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{effect.label}</span>
                      {!isUnlocked && (
                        <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">
                          {effect.requiredScore} pts
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={handleSave} className="h-11 w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm">
            Salvar Personalizacao
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MascotCustomizationComponent;
