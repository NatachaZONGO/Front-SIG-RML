// src/app/pages/auth/access.interceptor.ts
import { HttpEvent, HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, throwError, timeout, TimeoutError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { BackendURL, LocalStorageFields } from '../../Share/const';
import { EntrepriseService } from '../crud/entreprise/entreprise.service';

// ===== ENDPOINTS PUBLICS (SANS TOKEN) =====
const PUBLIC_API_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/register-candidat',
  '/auth/register-recruteur',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-reset-token',
  '/categories',
  '/pays',       
  '/conseils',    
];


function isApiUrl(url: string): boolean {
  const base = String(BackendURL).replace(/\/+$/, '');
  return url.startsWith(base);
}

function isPublicOffreEndpoint(path: string): boolean {
  if (path === '/offres' || path === '/offres/') {
    return true;
  }
  if (/^\/offres\/\d+\/?$/.test(path)) {
    return true;
  }
  return false;
}

function isPublicEndpoint(url: string): boolean {
  const base = String(BackendURL).replace(/\/+$/, '');
  const path = url.replace(base, '');
  
  const isStandardPublic = PUBLIC_API_ENDPOINTS.some(endpoint => {
    return path === endpoint || path.startsWith(endpoint);
  });
  
  if (isStandardPublic) {
    return true;
  }
  
  return isPublicOffreEndpoint(path);
}

function getToken(auth: any): string | undefined {
  const svc =
    (typeof auth.getToken === 'function' ? auth.getToken() : undefined) ??
    auth?.accessToken ?? 
    auth?.token ?? 
    undefined;
  if (svc) return svc;

  const keys = [
    LocalStorageFields?.accessToken ?? 'accessToken',
    'access_token',
    'AUTH_TOKEN',
    'token',
  ];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return undefined;
}

function shouldAddEntrepriseId(url: string, method: string): boolean {
  const base = String(BackendURL).replace(/\/+$/, '');
  const path = url.replace(base, '');
  
  const excludedPaths = [
    '/auth/',
    '/categories',
    '/pays',
    '/conseils',
    '/community/entreprises',
    '/profile',
    '/users/'
  ];
  
  if (excludedPaths.some(excluded => path.startsWith(excluded))) {
    return false;
  }
  
  const needsEntrepriseId = [
    '/offres',
    '/candidatures',
    '/publicites',
    '/mon-entreprise'
  ];
  
  return needsEntrepriseId.some(endpoint => path.startsWith(endpoint));
}

export function accessInterceptor(
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService) as any;
  const entrepriseService = inject(EntrepriseService);
  const router = inject(Router);

  console.log('🔄 Interceptor - URL:', req.url);

  // 1) Si URL non-API, laisser passer
  if (!isApiUrl(req.url)) {
    console.log('  ✅ Non-API, laisse passer');
    return next(req);
  }

  // 2) Détecter FormData dès le début
  const isFormData = req.body instanceof FormData;
  console.log('  📦 Type de contenu:', isFormData ? 'FormData' : 'JSON');

  // 3) Si endpoint PUBLIC
  if (isPublicEndpoint(req.url)) {
    console.log('  ✅ Endpoint public, laisse passer sans token');
    
    const headers: any = {
      Accept: 'application/json'
    };
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    const publicReq = req.clone({ setHeaders: headers });
    return next(publicReq);
  }

  // 4) Endpoint PROTÉGÉ : récupérer le token
  const token = getToken(authService);
  console.log('  🔐 Endpoint protégé - Token présent:', !!token);

  if (!token) {
    console.warn('  ⚠️ Pas de token pour endpoint protégé');
    
    const currentPath = router.url;
    const publicPaths = ['/', '/connexion', '/register', '/offres', '/suivre-candidature'];
    
    if (!publicPaths.some(p => currentPath.startsWith(p))) {
      console.log('  ↪️ Redirection vers /connexion');
      router.navigateByUrl('/connexion');
    }
    
    return throwError(() => new Error('Token requis pour cette requête'));
  }

  // 5) Ajouter entreprise_id si nécessaire
  let modifiedReq = req;
  const selectedEntrepriseId = entrepriseService.getSelectedEntrepriseId();
  const userRole = authService.getCurrentUserRole();
  const needsEntrepriseId = userRole && (
    userRole.toLowerCase() === 'community_manager' || 
    userRole.toLowerCase() === 'recruteur'
  );
  
  if (needsEntrepriseId && selectedEntrepriseId && shouldAddEntrepriseId(req.url, req.method)) {
    console.log('  🏢 Ajout entreprise_id:', selectedEntrepriseId);
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      if (!url.searchParams.has('entreprise_id')) {
        url.searchParams.set('entreprise_id', selectedEntrepriseId.toString());
        modifiedReq = req.clone({ url: url.toString() });
        console.log('    ✅ Ajouté dans query params');
      }
    } 
    else if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (req.body instanceof FormData) {
        const formData = new FormData();
        (req.body as FormData).forEach((value, key) => {
          formData.append(key, value);
        });
        if (!formData.has('entreprise_id')) {
          formData.append('entreprise_id', selectedEntrepriseId.toString());
          modifiedReq = req.clone({ body: formData });
          console.log('    ✅ Ajouté dans FormData');
        }
      } else if (typeof req.body === 'object' && req.body !== null) {
        const body = { ...req.body } as any;
        if (!body.hasOwnProperty('entreprise_id')) {
          body['entreprise_id'] = selectedEntrepriseId;
          modifiedReq = req.clone({ body });
          console.log('    ✅ Ajouté dans body JSON');
        }
      }
    }
  }

  // 6) Recalculer isFormData après modification
  const finalIsFormData = modifiedReq.body instanceof FormData;

  // 7) Construire les headers selon le type
  const headers: any = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  };

  if (!finalIsFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const cloned = modifiedReq.clone({ setHeaders: headers });

  // ✅ 7.5) DÉFINIR LE TIMEOUT SELON LE TYPE DE REQUÊTE
  const timeoutDuration = finalIsFormData ? 180000 : 30000; // 180s pour FormData, 30s pour JSON
  
  console.log('  ✅ Requête avec token envoyée');
  if (finalIsFormData) {
    console.log('  🎯 FormData détecté - Timeout:', timeoutDuration / 1000, 'secondes');
  }

  // 8) Gestion centralisée des erreurs AVEC TIMEOUT
  return next(cloned).pipe(
    timeout(timeoutDuration), // ✅ TIMEOUT AJOUTÉ
    catchError((error: any) => {
      // ✅ GESTION SPÉCIFIQUE DU TIMEOUT
      if (error instanceof TimeoutError || error.name === 'TimeoutError') {
        console.error('⏱️ TIMEOUT : La requête a pris trop de temps');
        return throwError(() => ({
          name: 'TimeoutError',
          message: 'La requête a expiré. Le fichier est peut-être trop volumineux ou la connexion trop lente.',
          status: 0,
          error: 'Timeout'
        }));
      }
      
      // ✅ GESTION DES ERREURS HTTP
      if (error instanceof HttpErrorResponse) {
        console.error('❌ Erreur HTTP:', error.status, error.message);
        
        // Erreur réseau (status 0)
        if (error.status === 0) {
          console.error('🚨 Erreur réseau ou serveur inaccessible');
          return throwError(() => ({
            name: 'NetworkError',
            message: 'Impossible de joindre le serveur. Vérifiez la taille du fichier et votre connexion.',
            status: 0,
            error: error
          }));
        }
        
        // Erreur 401 - Non authentifié
        if (error.status === 401) {
          console.log('  🚪 401 - Déconnexion et redirection');
          try { 
            authService.logout?.(); 
          } catch (e) {
            console.error('Erreur lors du logout:', e);
          }
          localStorage.clear();
          router.navigateByUrl('/connexion');
        } 
        // Erreur 403 - Accès refusé
        else if (error.status === 403) {
          console.log('  🚫 403 - Accès refusé');
          router.navigate(['/acces-refuse']);
        }
        // Erreur 413 - Payload trop large
        else if (error.status === 413) {
          console.error('📦 413 - Fichier trop volumineux');
          return throwError(() => ({
            name: 'PayloadTooLarge',
            message: 'Le fichier est trop volumineux. Maximum : 100 Mo',
            status: 413,
            error: error
          }));
        }
      }
      
      return throwError(() => error);
    })
  );
}