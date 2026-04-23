import { CheckCircle2, ListChecks, ShieldCheck, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreExplanation } from '@/types/mvp';

interface ScoreExplanationCardProps {
  explanation: ScoreExplanation;
}

const ScoreExplanationCard = ({ explanation }: ScoreExplanationCardProps) => {
  const visibleEvents = explanation.events.slice(0, 4);
  const visibleAchievements = explanation.achievements.slice(0, 3);

  return (
    <Card className="border-2 border-slate-100 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-700">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span>Por que meu score e {explanation.score}?</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-slate-600">{explanation.summary}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-emerald-50 p-3">
            <div className="text-slate-500">Nivel atual</div>
            <div className="font-semibold text-emerald-800">{explanation.level}</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="text-slate-500">Proximo nivel</div>
            <div className="font-semibold text-blue-800">{explanation.nextLevelScore} pts</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ListChecks className="h-4 w-4 text-emerald-600" />
            <span>Contribuicoes validas</span>
          </div>

          {visibleEvents.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-600">
              Ainda nao ha eventos validos contando para o score.
            </p>
          ) : (
            visibleEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{event.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{event.reason}</p>
                  </div>
                  <Badge className="shrink-0 bg-emerald-600">+{event.points}</Badge>
                </div>
              </div>
            ))
          )}
        </div>

        {visibleAchievements.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Conquistas contabilizadas</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleAchievements.map((achievement) => (
                <Badge key={achievement} variant="outline" className="bg-white">
                  {achievement}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {explanation.nextGain && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Target className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-900">
                  Proximo ganho: {explanation.nextGain.title}
                </p>
                <p className="text-sm leading-5 text-blue-800">{explanation.nextGain.description}</p>
                <p className="text-xs leading-5 text-blue-700">{explanation.nextGain.reason}</p>
                {typeof explanation.nextGain.potentialPoints === 'number' && (
                  <Badge variant="secondary">Potencial +{explanation.nextGain.potentialPoints} pts</Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScoreExplanationCard;
