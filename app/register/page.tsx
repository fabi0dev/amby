'use client'

import { registerUser } from '@/app/actions/user'
import { registerSchema } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsed = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    })
    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      return
    }

    setLoading(true)
    try {
      const result = await registerUser(parsed.data)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      router.push('/login?registered=1')
      router.refresh()
    } catch {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo: branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div>
          <span className="text-2xl font-semibold tracking-tight">Amby</span>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold leading-tight">
            Comece a documentar em minutos
          </h2>
          <p className="max-w-md text-primary-foreground/85 text-lg">
            Crie sua conta, organize documentos em workspaces e colabore com sua equipe.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">
          Plataforma self-hosted · Privacidade e controle
        </p>
      </div>

      {/* Painel direito: formulário */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="lg:hidden text-center">
            <Link href="/" className="text-2xl font-semibold tracking-tight text-foreground">
              Amby
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Criar conta
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Preencha os dados para começar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
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

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
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

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
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

            <Button
              type="submit"
              className="h-11 w-full font-medium"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Cadastrar'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
