import React, { useEffect, useState } from 'react';
import { ChevronDown, MessageCircleHeart, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EcoMascot from './EcoMascot';
import {
  MascotContextQuestion,
  MascotContextQuestionValue,
  MascotGuidance,
  NextAction,
  UserProfileData,
} from '@/types/mvp';

interface MascotGuidanceCardProps {
  guidance: MascotGuidance;
  score: number;
  level: number;
  profile: UserProfileData;
  nextAction?: NextAction;
  contextQuestion?: MascotContextQuestion;
  customization?: {
    name: string;
    emoji: string;
    colorPalette: string;
    borderEffect: string;
  };
  onContextQuestionAnswer?: (
    questionId: MascotContextQuestion['id'],
    value: MascotContextQuestionValue
  ) => void;
  onContextQuestionIgnore?: (questionId: MascotContextQuestion['id']) => void;
}

const stageLabels = {
  onboarding: 'Comeco',
  'before-upload': 'Preparacao',
  'invoice-uploaded': 'Subindo leitura',
  'analysis-ready': 'Leitura pronta',
  'return-visit': 'Retomada',
} as const;

const compactCopy = (value: string, maxLength = 96) => {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  const sentenceBreakIndex = normalizedValue.lastIndexOf('.', maxLength);

  if (sentenceBreakIndex >= 60) {
    return normalizedValue.slice(0, sentenceBreakIndex + 1);
  }

  return `${normalizedValue.slice(0, maxLength).trimEnd()}...`;
};

const MascotGuidanceCard = ({
  guidance,
  score,
  level,
  profile,
  nextAction,
  contextQuestion,
  customization,
  onContextQuestionAnswer,
  onContextQuestionIgnore,
}: MascotGuidanceCardProps) => {
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    setIsAnswering(false);
  }, [contextQuestion?.id]);

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white/72 shadow-sm backdrop-blur">
      <CardHeader className="space-y-3 border-b border-slate-100 bg-white/75">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <MessageCircleHeart className="h-4 w-4 text-emerald-600" />
            <span>Apoio do mascote</span>
          </CardTitle>
          <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
            {stageLabels[guidance.stage]}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">Contexto leve para quem quiser confirmar a trilha.</p>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-[22px] bg-slate-50 p-2.5 shadow-sm ring-1 ring-slate-100">
            <EcoMascot
              score={score}
              level={level}
              consumerType={profile.consumerType}
              customization={customization}
              variant="compact"
              journeyState={nextAction ? 'action' : guidance.stage === 'analysis-ready' ? 'understand' : 'observe'}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              {nextAction && (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  {nextAction.priority === 'high'
                    ? 'Foco alto'
                    : nextAction.priority === 'medium'
                      ? 'Foco medio'
                      : 'Foco leve'}
                </Badge>
              )}
              <Badge variant="outline" className="border-slate-200 bg-white text-slate-500">
                Perfil {profile.consumerType}
              </Badge>
            </div>

            <div className="rounded-[20px] border border-slate-100 bg-white p-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Se precisar de contexto
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {nextAction?.title || guidance.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {compactCopy(nextAction?.value || guidance.message)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-[18px] bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>O comando principal agora nasce da trilha; este card so reforca a leitura.</span>
        </div>

        <details className="group rounded-[20px] border border-slate-100 bg-white p-3 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-slate-700">
            <span>Ver contexto completo</span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>

          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Leitura atual
              </p>
              <p className="mt-1">{guidance.title}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Motivo
              </p>
              <p className="mt-1">{guidance.message.trim()}</p>
            </div>

            {nextAction && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Acao em foco
                </p>
                <p className="mt-1">{nextAction.description}</p>
              </div>
            )}
          </div>
        </details>

        {contextQuestion && (
          <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm">
            {!isAnswering ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Ajuste opcional
                  </p>
                  <p className="text-sm font-medium text-slate-800">{contextQuestion.invite}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setIsAnswering(true)}>
                    Responder
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onContextQuestionIgnore?.(contextQuestion.id)}
                  >
                    Agora nao
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Pergunta do mascote
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{contextQuestion.question}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contextQuestion.options.map((option) => (
                    <Button
                      key={option.value}
                      size="sm"
                      variant="outline"
                      onClick={() => onContextQuestionAnswer?.(contextQuestion.id, option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MascotGuidanceCard;
