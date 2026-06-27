import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthShell from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Erro desconhecido';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('As senhas nao coincidem.');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password);
      setSuccess('Conta criada com sucesso. Agora confirme o email ou siga para o login.');
      window.setTimeout(() => {
        navigate('/login');
      }, 2200);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);

      if (errorMessage === 'User already registered') {
        setError('Este email ja esta cadastrado. Entre com sua conta atual.');
      } else {
        setError(`Nao foi possivel criar a conta: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Criar conta"
      title="Comece a sua jornada energetica."
      subtitle="Cadastro, login e fallback local continuam funcionando como antes. A diferenca agora e a experiencia de entrada."
      alternateCta={{
        href: '/login',
        label: 'Ja tem conta? Entrar agora',
      }}
    >
      <div className="space-y-2">
        <h2 className="score-display text-3xl font-bold text-[var(--score-ink)]">Criar novo acesso</h2>
        <p className="text-sm leading-6 text-[var(--score-ink-soft)]">
          Registre-se para ativar score, memoria, conhecimento e leitura da sua primeira conta.
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
            placeholder="Crie uma senha"
            required
            className="h-12 rounded-[16px] border-[var(--score-line)] bg-[var(--score-surface-soft)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--score-ink)]">Confirmar senha</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repita a senha"
            required
            className="h-12 rounded-[16px] border-[var(--score-line)] bg-[var(--score-surface-soft)]"
          />
        </div>

        {error && (
          <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-[16px] bg-[var(--score-green)] text-white hover:bg-[var(--score-green-deep)]"
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Register;
