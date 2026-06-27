import { ArrowRight, BrainCircuit, Compass, Leaf, ScanSearch, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LivingCore from '@/components/nucleo/LivingCore';

const pillars = [
  {
    icon: ScanSearch,
    title: 'Diagnostico Adaptativo',
    text: 'Sua fatura deixa de ser um PDF parado e vira leitura energetica com contexto real.',
  },
  {
    icon: BrainCircuit,
    title: 'Memoria Energetica',
    text: 'A Score guarda sinais da sua rotina para orientar o proximo ciclo sem reinventar a jornada.',
  },
  {
    icon: Compass,
    title: 'Acao orientada',
    text: 'A plataforma transforma leitura em proximo passo claro, sem prometer milagres nem inventar causalidade.',
  },
];

const journey = [
  {
    step: '01',
    title: 'Observe',
    text: 'Envie a conta e deixe a Score organizar os campos essenciais.',
  },
  {
    step: '02',
    title: 'Relacione',
    text: 'Compare ciclos, sinais e contexto para entender o que realmente mudou.',
  },
  {
    step: '03',
    title: 'Memorize',
    text: 'A Memoria Energetica guarda o que importa sobre a sua jornada.',
  },
  {
    step: '04',
    title: 'Oriente',
    text: 'Receba uma direcao pratica para o proximo ciclo, sem trocar a regra de negocio.',
  },
];

const culturePoints = [
  'Score mede sua evolucao ao longo da jornada.',
  'Memoria lembra quem voce e energeticamente.',
  'Mascote ensina sem virar chatbot ou ruina visual.',
  'Conhecimento mostra o que voce ja aprendeu com a Score.',
];

const LandingPage = () => {
  const { user } = useAuth();
  const primaryCta = user ? '/perfil' : '/registro';

  return (
    <main className="score-shell min-h-screen">
      <section className="mx-auto grid w-[min(1200px,92vw)] gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <span className="score-pill score-pill-green">
            Score Energy
            <Sparkles className="h-3.5 w-3.5" />
            cultura energetica visivel
          </span>

          <div className="space-y-4">
            <h1 className="score-display max-w-[12ch] text-5xl font-bold leading-[0.95] text-[var(--score-ink)] sm:text-6xl">
              Sua energia precisa de contexto, nao de adivinhacao.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--score-ink-soft)]">
              A Score Energy transforma leitura de fatura, memoria, diagnostico e conhecimento em
              uma jornada unica. O resultado nao e um dashboard frio: e um sistema que observa,
              lembra, ensina e orienta.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to={primaryCta}
              className="inline-flex items-center gap-2 rounded-[16px] bg-[var(--score-green)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--score-shadow-pop)] transition hover:bg-[var(--score-green-deep)]"
            >
              {user ? 'Entrar no Nucleo' : 'Comecar a jornada'}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-[16px] border border-[var(--score-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--score-ink-soft)] transition hover:bg-[var(--score-surface-soft)]"
            >
              Acessar minha conta
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="score-card rounded-[22px] px-4 py-4">
              <p className="score-caption">Problema</p>
              <p className="mt-2 text-sm leading-6 text-[var(--score-ink-soft)]">
                Contas parecem opacas e o usuario nao entende o que mudou entre ciclos.
              </p>
            </div>
            <div className="score-card rounded-[22px] px-4 py-4">
              <p className="score-caption">Proposta</p>
              <p className="mt-2 text-sm leading-6 text-[var(--score-ink-soft)]">
                A Score organiza leitura, historico, memoria e recomendacao numa experiencia unica.
              </p>
            </div>
            <div className="score-card rounded-[22px] px-4 py-4">
              <p className="score-caption">Resultado</p>
              <p className="mt-2 text-sm leading-6 text-[var(--score-ink-soft)]">
                Mais clareza para decidir, aprender e acompanhar a propria evolucao energetica.
              </p>
            </div>
          </div>
        </div>

        <div className="score-stage relative overflow-hidden rounded-[34px] px-6 py-8 text-white">
          <div className="absolute inset-x-10 top-10 h-36 rounded-full bg-[radial-gradient(circle,rgba(43,194,116,0.26)_0%,transparent_72%)] blur-2xl" />
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <LivingCore level={4} points={770} size={236} />
            <div className="space-y-3">
              <p className="score-caption text-[#7fe3ae]">Nucleo oficial da jornada</p>
              <h2 className="score-display text-4xl font-bold">A Score observa, relaciona, memoriza e orienta.</h2>
              <p className="mx-auto max-w-xl text-sm leading-6 text-white/72">
                O conceito Nucleo deixa visivel o valor que ja existe no produto: leitura real da
                conta, memoria energetica persistida, conhecimento adquirido e acao orientada.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Score
                </p>
                <p className="score-display mt-2 text-3xl font-bold text-white">770</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Historico
                </p>
                <p className="score-display mt-2 text-3xl font-bold text-white">3 ciclos</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Conhecimento
                </p>
                <p className="score-display mt-2 text-3xl font-bold text-white">6/8</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1200px,92vw)] py-6">
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text }) => (
            <article key={title} className="score-card rounded-[26px] px-5 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--score-green-soft)] text-[var(--score-green-deep)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-[var(--score-ink)]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--score-ink-soft)]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-[min(1200px,92vw)] gap-5 py-8 lg:grid-cols-[1fr_1fr]">
        <article className="score-card rounded-[28px] px-6 py-6">
          <p className="score-caption">Memoria Energetica</p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--score-ink)]">
            O que a Score aprende sobre voce
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--score-ink-soft)]">
            Cada resposta, cada fatura e cada comparacao ajudam a Score a entender melhor sua
            rotina. Essa memoria nao e IA magica: e contexto real acumulado ao longo da jornada.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-[18px] bg-[var(--score-surface-soft)] px-4 py-3 text-sm text-[var(--score-ink-soft)]">
              Perfil, localizacao e tipo de consumo viram base de leitura.
            </div>
            <div className="rounded-[18px] bg-[var(--score-surface-soft)] px-4 py-3 text-sm text-[var(--score-ink-soft)]">
              Historico entre ciclos revela padroes antes invisiveis.
            </div>
            <div className="rounded-[18px] bg-[var(--score-surface-soft)] px-4 py-3 text-sm text-[var(--score-ink-soft)]">
              Memoria organiza o proximo passo sem trocar a regra central do produto.
            </div>
          </div>
        </article>

        <article className="score-card rounded-[28px] px-6 py-6">
          <p className="score-caption">Conhecimento Energetico</p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--score-ink)]">
            O que voce aprende com a Score
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--score-ink-soft)]">
            O mascote deixa de ser decoracao e passa a ensinar. Cada conteudo compreendido deixa de
            reaparecer como ruido e passa a compor sua evolucao.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] bg-[var(--score-green-soft)] px-4 py-3 text-sm font-medium text-[var(--score-green-deep)]">
              Chuveiro eficiente
            </div>
            <div className="rounded-[18px] bg-[var(--score-green-soft)] px-4 py-3 text-sm font-medium text-[var(--score-green-deep)]">
              Comparacao entre ciclos
            </div>
            <div className="rounded-[18px] bg-[var(--score-surface-soft)] px-4 py-3 text-sm text-[var(--score-ink-soft)]">
              Consumo em standby
            </div>
            <div className="rounded-[18px] bg-[var(--score-surface-soft)] px-4 py-3 text-sm text-[var(--score-ink-soft)]">
              Climatizacao eficiente
            </div>
          </div>
        </article>
      </section>

      <section className="mx-auto w-[min(1200px,92vw)] py-8">
        <div className="mb-6 max-w-3xl">
          <p className="score-caption">Jornada</p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--score-ink)]">
            Uma experiencia unica para leitura, memoria e acao
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--score-ink-soft)]">
            A Score nao separa aprendizado, diagnostico e acompanhamento em blocos sem conversa.
            O fluxo inteiro foi desenhado para uma relacao mais clara com a energia.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {journey.map((item) => (
            <article key={item.step} className="score-card rounded-[24px] px-5 py-5">
              <div className="score-display text-4xl font-bold text-[var(--score-green)]">{item.step}</div>
              <h3 className="mt-3 text-xl font-semibold text-[var(--score-ink)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--score-ink-soft)]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-[min(1200px,92vw)] gap-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="score-stage overflow-hidden rounded-[30px] px-6 py-6 text-white">
          <div className="space-y-4">
            <p className="score-caption text-[#7fe3ae]">Cultura energetica</p>
            <h2 className="score-display max-w-[14ch] text-4xl font-bold">
              A jornada individual tambem constri inteligencia coletiva.
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-white/72">
              Score, ranking e historico continuam funcionando como antes. O que muda aqui e a
              legibilidade do valor: o usuario entende por que esta evoluindo.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {culturePoints.map((point) => (
            <div
              key={point}
              className="score-card flex items-start gap-3 rounded-[22px] px-5 py-4"
            >
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--score-green-soft)] text-[var(--score-green-deep)]">
                <Leaf className="h-4 w-4" />
              </div>
              <p className="text-sm leading-6 text-[var(--score-ink-soft)]">{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-[min(1200px,92vw)] py-10">
        <div className="score-card rounded-[34px] px-6 py-8 text-center sm:px-10 sm:py-10">
          <p className="score-caption">Proximo passo</p>
          <h2 className="score-display mt-2 text-4xl font-bold text-[var(--score-ink)]">
            Tornar o valor da Score visivel comecando pelo proximo ciclo.
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-[var(--score-ink-soft)]">
            O produto ja possui parser, score, historico, recomendacoes, memoria e conhecimento.
            Agora a experiencia tambem faz tudo isso parecer claro para o usuario.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={primaryCta}
              className="inline-flex items-center gap-2 rounded-[16px] bg-[var(--score-green)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--score-shadow-pop)] transition hover:bg-[var(--score-green-deep)]"
            >
              <Target className="h-4 w-4" />
              {user ? 'Abrir meu Nucleo' : 'Criar conta'}
            </Link>
            <Link
              to="/ranking"
              className="inline-flex items-center gap-2 rounded-[16px] border border-[var(--score-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--score-ink-soft)] transition hover:bg-[var(--score-surface-soft)]"
            >
              Ver ranking
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
