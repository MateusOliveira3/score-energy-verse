import React from 'react';
import { Leaf, Trophy, User, LogIn, UserPlus, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Opcional: mostrar um toast de erro para o usuário
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Link para a Landing Page */}
            <Link to={user ? "/perfil" : "/"}>
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <Leaf className="h-6 w-6 text-white" />
              </div>
            </Link>
            <div>
              <Link to={user ? "/perfil" : "/"} className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Score Energy
              </Link>
              <p className="text-sm text-gray-600">Sustentabilidade Gamificada</p>
            </div>
          </div>

          <nav className="flex items-center space-x-2">
            {user ? (
              // Links para usuário logado
              <>
                <Link to="/ranking">
                  <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                    <Trophy className="h-4 w-4 mr-2" />
                    Ranking
                  </Button>
                </Link>
                <Link to="/perfil">
                  <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-red-600 hover:text-red-700">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              // Links para visitante
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link to="/registro">
                  <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Registrar
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
