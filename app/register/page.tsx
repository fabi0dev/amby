'use client';

import { registerUser } from '@/app/actions/user';
import { registerSchema } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthAlert, AuthPanelLeft, AuthFormWrapper } from '@/components/auth';
import { AUTH } from '@/lib/config';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser(parsed.data);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      router.push('/login?registered=1');
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300 dark:bg-background">
      <AuthPanelLeft
        title={AUTH.panel.register.title}
        description={AUTH.panel.register.description}
      />

      <AuthFormWrapper
        title="Criar conta"
        description="Preencha os dados para começar"
        footer={
          <>
            Já tem conta?{' '}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 transition-colors hover:underline hover:text-primary/90"
            >
              Entrar
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="auth-form-enter auth-form-enter-delay-3">
              <AuthAlert variant="error">{error}</AuthAlert>
            </div>
          )}

          <div className="auth-form-enter auth-form-enter-delay-4 space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Nome
            </Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Seu nome"
              className="h-11"
            />
          </div>

          <div className="auth-form-enter auth-form-enter-delay-5 space-y-2">
            <Label htmlFor="email" className="text-foreground">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@exemplo.com"
              className="h-11"
            />
          </div>

          <div className="auth-form-enter auth-form-enter-delay-6 space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="h-11"
            />
          </div>

          <div className="auth-form-enter auth-form-enter-delay-7 space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">
              Confirmar senha
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repita a senha"
              className="h-11"
            />
          </div>

          <div className="auth-form-enter auth-form-enter-delay-8 pt-1">
            <Button
              type="submit"
              className="h-11 w-full font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:hover:scale-100 disabled:active:scale-100"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </AuthFormWrapper>
    </div>
  );
}
