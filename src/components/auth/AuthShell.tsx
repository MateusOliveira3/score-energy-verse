import { Leaf, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import LivingCore from '@/components/nucleo/LivingCore';

interface AuthShellProps {
  alternateCta: {
    href: string;
    label: string;
  };
  children: React.ReactNode;
  eyebrow: string;
  subtitle: string;
  title: string;
}

const AuthShell = ({
  alternateCta,
  children,
  eyebrow,
  subtitle,
  title,
}: AuthShellProps) => (
  <main className="score-shell min-h-screen px-4 py-8">
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl gap-6 lg:grid-cols-[0.98fr_1.02fr] lg:items-stretch">
      <section className="score-stage relative overflow-hidden rounded-[34px] px-6 py-8 text-white sm:px-8 sm:py-10">
        <div className="absolute inset-x-12 top-10 h-36 rounded-full bg-[radial-gradient(circle,rgba(43,194,116,0.24)_0%,transparent_72%)] blur-2xl" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-10">
          <div className="space-y-4">
            <span className="score-pill score-pill-green">
              <Sparkles className="h-3.5 w-3.5" />
              jornada energetica guiada
            </span>
            <div>
              <p className="score-caption text-[#7fe3ae]">Score Energy</p>
              <h1 className="score-display mt-2 max-w-[10ch] text-5xl font-bold leading-[0.95]">
                {title}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/72">{subtitle}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <LivingCore level={4} points={770} size={220} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Memoria
              </p>
              <p className="mt-2 text-sm leading-6 text-white/76">
                A Score lembra sinais reais da sua jornada e usa esse contexto no proximo ciclo.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Conhecimento
              </p>
              <p className="mt-2 text-sm leading-6 text-white/76">
                O mascote deixa de ser visual solto e passa a ensinar de forma acumulativa.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="score-card flex rounded-[34px] px-5 py-6 sm:px-8 sm:py-8">
        <div className="m-auto w-full max-w-md space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--score-green-soft)] text-[var(--score-green-deep)]">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <p className="score-caption">{eyebrow}</p>
                <p className="text-sm text-[var(--score-ink-soft)]">
                  Entre ou crie conta sem trocar o fluxo de autenticacao atual.
                </p>
              </div>
            </div>
          </div>

          {children}

          <div className="border-t border-[var(--score-line)] pt-4 text-sm text-[var(--score-ink-soft)]">
            <Link
              to={alternateCta.href}
              className="font-semibold text-[var(--score-green-deep)] transition hover:text-[var(--score-green)]"
            >
              {alternateCta.label}
            </Link>
          </div>
        </div>
      </section>
    </div>
  </main>
);

export default AuthShell;
