'use client';

import { loginSchema } from '@/lib/validations/auth';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthAlert, AuthPanelLeft, AuthFormWrapper } from '@/components/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AUTH } from '@/lib/config';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRegister = searchParams.get('registered') === '1';
  const callback = searchParams.get('callback');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('E-mail ou senha inválidos. Tente novamente.');
      } else {
        router.push(callback || '/dashboard');
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300 dark:bg-background">
      <AuthPanelLeft title={AUTH.panel.login.title} description={AUTH.panel.login.description} />

      <AuthFormWrapper
        title="Entrar"
        description="Use seu e-mail e senha para acessar"
        footer={
          <>
            Não tem conta?{' '}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 transition-colors hover:underline hover:text-primary/90"
            >
              Cadastre-se
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {(fromRegister || error) && (
            <div className="auth-form-enter auth-form-enter-delay-3 space-y-2">
              {fromRegister && (
                <AuthAlert variant="success">
                  Conta criada com sucesso. Faça login para continuar.
                </AuthAlert>
              )}
              {error && <AuthAlert variant="error">{error}</AuthAlert>}
            </div>
          )}

          <div className="auth-form-enter auth-form-enter-delay-4 space-y-2">
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
              autoFocus
            />
          </div>

          <div className="auth-form-enter auth-form-enter-delay-5 space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="h-11"
            />
          </div>

          <div className="auth-form-enter auth-form-enter-delay-6 pt-1">
            <Button
              type="submit"
              className="h-11 w-full font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:hover:scale-100 disabled:active:scale-100"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </form>
      </AuthFormWrapper>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-background items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
