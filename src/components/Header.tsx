import React from 'react';
import { Bot, LogOut, Trophy, User } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ScoreEnergyLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M13 2L5 14h6l-2 8 10-12h-6z" fill="currentColor" stroke="none" />
  </svg>
);

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/registro';
  const isProtectedRoute =
    location.pathname === '/perfil' ||
    location.pathname === '/ranking' ||
    location.pathname === '/assistente';

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      navigate('/login', { replace: true });
      toast({
        title: 'Sessao encerrada',
        description: 'Agora voce pode entrar com outra conta.',
      });
    } catch (error) {
      console.error('Erro ao sair:', error);
      toast({
        title: 'Nao foi possivel sair',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--score-line)] bg-[rgba(246,249,242,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex w-[min(760px,calc(100vw-1.25rem))] flex-col gap-3 py-3 sm:w-[min(820px,92vw)] sm:gap-4 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link to={user ? '/perfil' : '/'} className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--score-green-soft)] text-[var(--score-green-deep)] sm:h-11 sm:w-11">
              <ScoreEnergyLogo className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="score-display truncate text-lg font-bold text-[var(--score-ink)] sm:text-xl">
                Score Energy
              </p>
              <p className="truncate text-[10px] uppercase tracking-[0.18em] text-[var(--score-ink-faint)] sm:text-xs">
                Nucleo energetico
              </p>
            </div>
          </Link>

          {user ? (
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden max-w-52 truncate text-sm text-[var(--score-ink-faint)] lg:inline">
                {user.email ?? 'Sessao ativa'}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSigningOut}
                className="rounded-full border-[var(--score-line)] bg-white text-[var(--score-ink-soft)] hover:bg-[var(--score-surface-soft)]"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? 'Saindo...' : 'Sair'}
              </Button>
            </div>
          ) : (
            <div className="md:hidden">
              <Link
                to={isAuthRoute ? '/' : '/registro'}
                className="inline-flex items-center rounded-full bg-[var(--score-green)] px-4 py-2 text-sm font-semibold text-white"
              >
                {isAuthRoute ? 'Voltar' : 'Criar conta'}
              </Link>
            </div>
          )}
        </div>

        {isProtectedRoute ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 score-scrollbar-none sm:justify-center">
            <NavLink
              to="/perfil"
              className={({ isActive }) =>
                cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition sm:px-4',
                  isActive
                    ? 'bg-[var(--score-green)] text-white'
                    : 'bg-white/72 text-[var(--score-ink-soft)] hover:bg-white'
                )
              }
            >
              <User className="h-4 w-4" />
              Nucleo
            </NavLink>
            <NavLink
              to="/ranking"
              className={({ isActive }) =>
                cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition sm:px-4',
                  isActive
                    ? 'bg-[var(--score-green)] text-white'
                    : 'bg-white/72 text-[var(--score-ink-soft)] hover:bg-white'
                )
              }
            >
              <Trophy className="h-4 w-4" />
              Ranking
            </NavLink>
            <NavLink
              to="/assistente"
              className={({ isActive }) =>
                cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition sm:px-4',
                  isActive
                    ? 'bg-[var(--score-green)] text-white'
                    : 'bg-white/72 text-[var(--score-ink-soft)] hover:bg-white'
                )
              }
            >
              <Bot className="h-4 w-4" />
              Assistente
            </NavLink>
          </div>
        ) : (
          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/"
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--score-ink-soft)] transition hover:bg-white"
            >
              Produto
            </Link>
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--score-ink-soft)] transition hover:bg-white"
            >
              Entrar
            </Link>
            {!isAuthRoute && (
              <Link
                to="/registro"
                className="inline-flex items-center rounded-full bg-[var(--score-green)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--score-green-deep)]"
              >
                Criar conta
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
