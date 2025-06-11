import React from 'react';
import { Leaf, Trophy, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Link para a Landing Page */}
            <Link to="/">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <Leaf className="h-6 w-6 text-white" />
              </div>
            </Link>
            <div>
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Score Energy
              </Link>
              <p className="text-sm text-gray-600">Sustentabilidade Gamificada</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Link para a página de Ranking */}
            <Link to="/ranking">
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                <Trophy className="h-4 w-4 mr-2" />
                Ranking
              </Button>
            </Link>
            {/* Link para a página de Perfil */}
            <Link to="/perfil">
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                <User className="h-4 w-4 mr-2" />
                Perfil
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
