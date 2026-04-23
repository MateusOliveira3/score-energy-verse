import React from 'react';
import { MessageCircleHeart, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EcoMascot from './EcoMascot';
import { MascotGuidance, UserProfileData } from '@/types/mvp';

interface MascotGuidanceCardProps {
  guidance: MascotGuidance;
  score: number;
  level: number;
  profile: UserProfileData;
  customization?: {
    name: string;
    emoji: string;
    colorPalette: string;
    borderEffect: string;
  };
}

const stageLabels = {
  onboarding: 'Onboarding',
  'before-upload': 'Antes do upload',
  'invoice-uploaded': 'Upload concluído',
  'analysis-ready': 'Análise pronta',
  'return-visit': 'Retorno',
} as const;

const MascotGuidanceCard = ({
  guidance,
  score,
  level,
  profile,
  customization,
}: MascotGuidanceCardProps) => {
  return (
    <Card className="border-2 border-emerald-100 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-emerald-700">
          <MessageCircleHeart className="h-5 w-5" />
          <span>Resumo do Mascote</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-2xl bg-emerald-50 p-4">
            <EcoMascot
              score={score}
              level={level}
              consumerType={profile.consumerType}
              customization={customization}
            />
          </div>

          <div className="flex-1 space-y-3">
            <Badge variant="outline">{stageLabels[guidance.stage]}</Badge>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{guidance.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{guidance.message}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                O mascote resume o momento da jornada e reforça o próximo passo mais útil agora.
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MascotGuidanceCard;
