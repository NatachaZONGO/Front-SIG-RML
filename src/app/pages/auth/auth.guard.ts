import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LocalStorageFields } from '../../const';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.accessToken || localStorage.getItem(LocalStorageFields.accessToken);
  if (!token) {
    router.navigateByUrl('/landing');
    return false;
  }
  return true;
};
