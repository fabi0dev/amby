'use client'

import { loginSchema } from '@/lib/validations/auth'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromRegister = searchParams.get('registered') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      return
    }

    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('E-mail ou senha inválidos. Tente novamente.')
      } else {
        router.push('/home')
        router.refresh()
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300 dark:bg-[hsl(222.2,84%,4.5%)]">
      {/* Painel esquerdo: branding – otimizado para dark */}
      <div className="auth-panel-left hidden w-1/2 flex-col justify-between p-12 text-primary-foreground lg:flex bg-primary">
        <div className="auth-form-enter auth-form-enter-delay-1">
          <span className="text-2xl font-semibold tracking-tight">Amby</span>
        </div>
        <div className="space-y-5 auth-form-enter auth-form-enter-delay-2">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Documentação colaborativa para sua equipe
          </h2>
          <p className="max-w-md text-primary-foreground/90 text-lg leading-relaxed">
            Crie, edite e organize documentos em workspaces. Tudo em um só lugar, com controle total.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/75 auth-form-enter auth-form-enter-delay-3">
          Plataforma self-hosted · Privacidade e controle
        </p>
      </div>

      {/* Painel direito: formulário – fluido e moderno */}
      <div className="auth-panel-right flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="lg:hidden text-center auth-form-enter auth-form-enter-delay-1">
            <Link
              href="/"
              className="text-2xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90"
            >
              Amby
            </Link>
          </div>

          <div className="auth-form-enter auth-form-enter-delay-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Entrar
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Use seu e-mail e senha para acessar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {(fromRegister || error) && (
              <div className="auth-form-enter auth-form-enter-delay-3 space-y-2">
                {fromRegister && (
                  <div
                    className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary transition-opacity duration-200"
                    role="status"
                  >
                    Conta criada com sucesso. Faça login para continuar.
                  </div>
                )}
                {error && (
                  <div
                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive transition-opacity duration-200"
                    role="alert"
                  >
                    {error}
                  </div>
                )}
              </div>
            )}

            <div className="auth-form-enter auth-form-enter-delay-4 space-y-2">
              <Label htmlFor="email" className="text-foreground">E-mail</Label>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">Senha</Label>
              </div>
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

          <p className="auth-form-enter auth-form-enter-delay-7 text-center text-sm text-muted-foreground">
            Não tem conta?{' '}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 transition-colors hover:underline hover:text-primary/90"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
