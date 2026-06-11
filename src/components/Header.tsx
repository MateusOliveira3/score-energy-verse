import React, { useState } from 'react';
import { Bot, LogOut, Trophy, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/Button';

const ScoreEnergyLogo: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M13 2 L5 14 h6 l-2 8 10-12 h-6 z" fill="currentColor" stroke="none" />
  </svg>
);

const Header = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    <header className="sticky top-0 z-50 border-b border-green-100 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link to="/">
              <div className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 p-2">
                <ScoreEnergyLogo className="h-6 w-6 text-white" />
              </div>
            </Link>
            <div>
              <Link
                to="/"
                className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-2xl font-bold text-transparent"
              >
                Score Energy
              </Link>
              <p className="text-sm text-gray-600">Sustentabilidade Gamificada</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/ranking">
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                <Trophy className="mr-2 h-4 w-4" />
                Ranking
              </Button>
            </Link>
            <Link to="/perfil">
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </Button>
            </Link>
            {user ? (
              <Link to="/assistente">
                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                  <Bot className="mr-2 h-4 w-4" />
                  Assistente
                </Button>
              </Link>
            ) : null}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden max-w-48 truncate text-sm text-gray-600 md:inline">
                  {user.email ?? 'Sessao ativa'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-slate-800"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isSigningOut ? 'Saindo...' : 'Sair'}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
