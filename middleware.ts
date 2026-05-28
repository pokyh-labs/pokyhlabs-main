import { NextResponse, type NextRequest } from 'next/server'

const SUPPORTED = ['de', 'en', 'it'] as const
type SupportedLang = typeof SUPPORTED[number]
const DEFAULT_LANG: SupportedLang = 'de'

function pickLangFromHeader(accept: string | null): SupportedLang {
  if (!accept) return DEFAULT_LANG

  const entries = accept
    .split(',')
    .map((part) => {
      const [tag, qPart] = part.trim().split(';')
      const q = qPart ? parseFloat(qPart.replace(/^\s*q=/, '')) : 1
      const lang = tag.trim().split('-')[0].toLowerCase()
      return { lang, q: isNaN(q) ? 1 : q }
    })
    .sort((a, b) => b.q - a.q)

  for (const { lang } of entries) {
    if ((SUPPORTED as readonly string[]).includes(lang)) {
      return lang as SupportedLang
    }
  }

  return DEFAULT_LANG
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // If first path segment is already a supported lang, pass through
  const firstSegment = pathname.split('/')[1]
  if ((SUPPORTED as readonly string[]).includes(firstSegment)) {
    return NextResponse.next()
  }

  // 1. Try cookie
  const cookieLang = req.cookies.get('pokyh-lang')?.value
  let lang: SupportedLang
  if (cookieLang && (SUPPORTED as readonly string[]).includes(cookieLang)) {
    lang = cookieLang as SupportedLang
  } else {
    // 2. Fall back to Accept-Language header
    lang = pickLangFromHeader(req.headers.get('accept-language'))
  }

  const url = req.nextUrl.clone()
  url.pathname = `/${lang}${pathname}`

  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: [
    '/((?!api|_next|uploads|favicon\\.ico|robots\\.txt|sitemap\\.xml|opengraph-image|manifest\\.webmanifest|assets|.*\\.[a-zA-Z0-9]+$).*)',
  ],
}
