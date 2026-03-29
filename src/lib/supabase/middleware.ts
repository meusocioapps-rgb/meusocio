import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// In-memory rate limiting for API routes
const rateLimitMap = new Map<string, { count: number; reset: number }>()

function checkApiRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 60 // 60 requests per minute per IP
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + windowMs })
    return true
  }
  entry.count++

  // Clean up old entries periodically
  if (rateLimitMap.size > 10000) {
    rateLimitMap.forEach((val, key) => {
      if (now > val.reset) rateLimitMap.delete(key)
    })
  }

  return entry.count <= maxRequests
}

export async function updateSession(request: NextRequest) {
  // Rate limit API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkApiRateLimit(ip)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  // Allow public routes without auth
  const isPublicApiRoute = request.nextUrl.pathname.startsWith('/api/stripe/webhook')
  if (isPublicApiRoute) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow unauthenticated access to privacy/terms pages
  const isPublicPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/privacy') ||
    request.nextUrl.pathname.startsWith('/terms')

  // Redirecionar para login se nao autenticado
  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirecionar para dashboard se ja autenticado e acessando login
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
