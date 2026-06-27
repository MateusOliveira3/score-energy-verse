import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthShell from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Erro desconhecido';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/perfil');
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);

      if (errorMessage === 'Invalid login credentials') {
        setError('Email ou senha incorretos. Verifique os dados e tente novamente.');
      } else if (errorMessage === 'Email not confirmed') {
        setError('Confirme seu email antes de entrar na plataforma.');
      } else {
        setError(`Nao foi possivel entrar: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Entrar"
      title="Entre no Nucleo da sua jornada."
      subtitle="A autenticacao continua a mesma. O que muda aqui e a forma como a Score apresenta valor desde o primeiro contato."
      alternateCta={{
        href: '/registro',
        label: 'Nao tem conta ainda? Criar cadastro',
      }}
    >
      <div className="space-y-2">
        <h2 className="score-display text-3xl font-bold text-[var(--score-ink)]">Bem-vindo de volta</h2>
        <p className="text-sm leading-6 text-[var(--score-ink-soft)]">
          Entre para continuar sua leitura energetica, memoria acumulada e proximos passos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--score-ink)]">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            required
            className="h-12 rounded-[16px] border-[var(--score-line)] bg-[var(--score-surface-soft)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--score-ink)]">Senha</label>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha"
            required
            className="h-12 rounded-[16px] border-[var(--score-line)] bg-[var(--score-surface-soft)]"
          />
        </div>

        {error && (
          <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-[16px] bg-[var(--score-green)] text-white hover:bg-[var(--score-green-deep)]"
        >
          {loading ? 'Entrando...' : 'Entrar no Nucleo'}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Login;
