import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { LocalStorageFields } from '../../Share/const';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier si l'utilisateur est connecté
  const token = authService.accessToken || localStorage.getItem(LocalStorageFields.accessToken);
  if (!token) {
    router.navigate(['/notfound'], { 
      queryParams: { code: '401' }
    });
    return false;
  }

  // Vérifier les rôles requis
  const requiredRoles = route.data['roles'] as string[] | undefined;
  
  if (requiredRoles && requiredRoles.length > 0) {
    if (!authService.hasAnyRole(requiredRoles)) {
      // Passer les rôles requis dans les query params
      router.navigate(['/notfound'], { 
        queryParams: { 
          code: '403',
          role: requiredRoles.join(',') // Envoyer les rôles requis
        }
      });
      return false;
    }
  }

  return true;
};