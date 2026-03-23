import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Se houve erro no OAuth (ex: usuário cancelou)
  if (error) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', errorDescription || error)
    return NextResponse.redirect(url)
  }

  if (code) {
    const supabase = await createServerSupabase()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      const url = new URL('/login', origin)
      url.searchParams.set('error', 'Erro ao autenticar. Tente novamente.')
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
