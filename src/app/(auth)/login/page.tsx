'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Carregando...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient()

  // Capturar erros do callback OAuth
  useEffect(() => {
    const callbackError = searchParams.get('error')
    if (callbackError) {
      setError(callbackError)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email.trim()) {
      setError('Informe seu e-mail.')
      return
    }

    // --- RECUPERAR SENHA ---
    if (mode === 'forgot') {
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      setLoading(false)
      if (error) {
        setError('Erro ao enviar e-mail. Verifique o endereço e tente novamente.')
      } else {
        setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada (e spam).')
      }
      return
    }

    if (!password.trim()) {
      setError('Informe sua senha.')
      return
    }

    // --- LOGIN ---
    if (mode === 'login') {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      setLoading(false)
      if (error) {
        if (error.message.includes('Invalid login')) {
          setError('E-mail ou senha incorretos.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('E-mail não confirmado. Verifique sua caixa de entrada.')
        } else {
          setError(`Erro ao entrar: ${error.message}`)
        }
      } else {
        router.push('/dashboard')
        router.refresh()
      }
      return
    }

    // --- CRIAR CONTA ---
    if (mode === 'signup') {
      if (password.length < 8) {
        setError('A senha deve ter pelo menos 8 caracteres.')
        return
      }
      if (!/\d/.test(password)) {
        setError('A senha deve conter pelo menos um numero.')
        return
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.')
        return
      }

      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      setLoading(false)

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Este e-mail já está cadastrado. Tente fazer login.')
        } else if (error.message.includes('valid email')) {
          setError('E-mail inválido. Verifique e tente novamente.')
        } else if (error.message.includes('password')) {
          setError('Senha fraca. Use pelo menos 8 caracteres com numeros.')
        } else {
          setError(`Erro ao criar conta: ${error.message}`)
        }
      } else {
        setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
      }
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center">
            <svg width="56" height="56" viewBox="0 0 50 50" fill="none">
              <circle cx="25" cy="25" r="23" fill="#2D6A4F" stroke="#52B788" strokeWidth="0.8"/>
              <path d="M 11 37 L 11 14 L 25 26 L 39 14 L 39 37" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M 25 26 L 39 14 L 46 7" stroke="#F4A261" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Meu Sócio</h1>
          <p className="mt-1 text-sm text-gray-400">Gestão para autônomos e MEI</p>
        </div>

        {/* Tabs (login/signup only) */}
        {mode !== 'forgot' && (
          <div className="mb-4 flex rounded-xl border border-gray-200 bg-gray-100 p-1">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Criar conta
            </button>
          </div>
        )}

        {/* Forgot password header */}
        {mode === 'forgot' && (
          <div className="mb-4 text-center">
            <div className="mb-2 text-3xl">🔑</div>
            <h2 className="text-base font-semibold">Recuperar senha</h2>
            <p className="mt-1 text-xs text-gray-400">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-900"
                autoFocus
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-900"
                  minLength={8}
                  required
                />
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-900"
                  minLength={8}
                  required
                />
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Sucesso */}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-900 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            >
              {loading
                ? mode === 'login'
                  ? 'Entrando...'
                  : mode === 'signup'
                    ? 'Criando conta...'
                    : 'Enviando...'
                : mode === 'login'
                  ? 'Entrar'
                  : mode === 'signup'
                    ? 'Criar conta'
                    : 'Enviar link de recuperação'}
            </button>

            {/* Esqueci a senha / Voltar */}
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="w-full text-center text-xs font-medium text-brand-900 hover:underline"
              >
                Esqueci minha senha
              </button>
            )}
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-center text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                ← Voltar para o login
              </button>
            )}
          </form>

        </div>

        <div className="mt-6 text-center">
          <p className="text-[10px] text-gray-400">
            Ao criar sua conta, você concorda com nossos{' '}
            <a href="/terms" className="font-semibold text-brand-900 hover:underline">Termos de Uso</a>
            {' '}e{' '}
            <a href="/privacy" className="font-semibold text-brand-900 hover:underline">Política de Privacidade</a>.
          </p>
          <p className="mt-2 text-[10px] text-gray-400">
            Meu Sócio v1.0 · © 2026
          </p>
        </div>
      </div>
    </div>
  )
}
