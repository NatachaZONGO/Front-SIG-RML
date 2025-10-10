// src/app/pages/auth/access.interceptor.ts
import { HttpEvent, HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { BackendURL, LocalStorageFields } from '../../Share/const';

const PUBLIC_PATHS = ['/login', '/register', '/forgot', '/reset']; // à ajuster

function isApiUrl(url: string): boolean {
  const base = String(BackendURL).replace(/\/+$/,''); // retire trailing slash
  return url.startsWith(base);
}

function getToken(auth: any): string | undefined {
  // 1) depuis le service
  const svc =
    (typeof auth.getToken === 'function' ? auth.getToken() : undefined) ??
    auth?.accessToken ?? auth?.token ?? undefined;
  if (svc) return svc;

  // 2) depuis le localStorage (plusieurs clés possibles)
  const keys = [
    LocalStorageFields?.accessToken ?? 'accessToken',
    'access_token',
    'ACCESS_TOKEN',
    'token',
    'AUTH_TOKEN'
  ];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return undefined;
}

export function accessInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService) as any;
  const router = inject(Router);

  // 1) Laisse passer tel quel si URL non API ou publique
  if (!isApiUrl(req.url) || PUBLIC_PATHS.some(p => req.url.includes(p))) {
    return next(req);
  }

  // 2) Récupère le token
  const token = getToken(authService);

  // 3) Si pas de token -> on ne tente pas l’appel protégé
  if (!token) {
    // évite les boucles si on est déjà sur /login
    if (!PUBLIC_PATHS.some(p => location.pathname.includes(p))) {
      router.navigateByUrl('/connexion'); // adapte à ta route de login Angular
    }
    return throwError(() => new Error('Aucun token trouvé'));
  }

  // 4) Clone avec Authorization + Accept JSON
  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  // 5) Gestion centralisée des erreurs
  return next(cloned).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          try { authService.logout?.(); } catch {}
          localStorage.removeItem(LocalStorageFields?.accessToken ?? 'accessToken');
          router.navigateByUrl('/connexion');
        } else if (error.status === 403) {
          router.navigate(['/notfound'], { queryParams: { code: '403' } });
        }
      }
      return throwError(() => error);
    })
  );
}
