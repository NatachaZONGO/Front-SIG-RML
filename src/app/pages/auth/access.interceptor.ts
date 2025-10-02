import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { LocalStorageFields } from '../../const';

const PUBLIC_PATHS = ['/login', '/register']; // adapte si besoin

export function accessInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Ne pas injecter de token pour les routes publiques
  if (PUBLIC_PATHS.some((p) => req.url.includes(p))) {
    return next(req);
  }

  const token = authService.accessToken || localStorage.getItem(LocalStorageFields.accessToken);

  if (!token) {
    // Si l’endpoint est protégé et aucun token, on redirige
    router.navigateByUrl('/login');
    return throwError(() => new Error('Aucun token trouvé'));
  }

  const clonedReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(clonedReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout();
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    })
  );
}
