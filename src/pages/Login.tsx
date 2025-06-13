import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf } from 'lucide-react';
import { SupabaseTest } from '../components/SupabaseTest';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/perfil');
    } catch (err: any) {
      console.error('Erro de login:', err);
      if (err.message === 'Invalid login credentials') {
        setError('Email ou senha incorretos. Por favor, verifique suas credenciais.');
      } else if (err.message === 'Email not confirmed') {
        setError('Por favor, confirme seu email antes de fazer login.');
      } else {
        setError(`Erro ao fazer login: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50">
      <div className="w-full max-w-md space-y-4">
        <SupabaseTest />
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <Leaf className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Bem-vindo ao Score Energy</CardTitle>
            <CardDescription className="text-center">
              Entre com sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-500 text-center p-2 bg-red-50 rounded-md">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
              <div className="text-center text-sm">
                <a href="/registro" className="text-green-600 hover:text-green-700">
                  Não tem uma conta? Registre-se
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login; 