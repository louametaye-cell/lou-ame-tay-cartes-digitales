import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware Next.js : Protection stricte de l'espace commercial terrain
 * Tout conseiller dont hasSignedContract === false est bloqué et redirigé vers le Wizard d'Onboarding
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chemins exemptés de redirection (ressources statiques, API, login, onboarding)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/css') ||
    pathname.startsWith('/js') ||
    pathname === '/login' ||
    pathname === '/login.html' ||
    pathname === '/agent/onboarding' ||
    pathname.includes('onboarding')
  ) {
    return NextResponse.next();
  }

  // Vérification de la session commerciale pour les routes protégées
  if (pathname.startsWith('/agent') || pathname.startsWith('/commercial')) {
    const sessionCookie = request.cookies.get('louametay_session')?.value;
    const contractCookie = request.cookies.get('louametay_contract_signed')?.value;

    // Si non connecté, redirection vers la page de login
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Si le contrat n'est pas signé, verrouillage bloquant vers le Wizard d'onboarding
    if (contractCookie !== 'true') {
      const onboardingUrl = new URL('/agent/onboarding', request.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/agent/:path*', '/commercial/:path*'],
};
