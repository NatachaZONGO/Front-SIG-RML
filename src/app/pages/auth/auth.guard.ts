import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "./auth.service";

export const authGuard: CanActivateFn = (
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Vérifiez à la fois le token dans le service et dans le localStorage
    const token = authService.accessToken || localStorage.getItem('accessToken');

    if (!token) {
        console.warn("Accès refusé : aucun token trouvé. Redirection vers la page de connexion.");
        router.navigateByUrl('/login');
        return false; 
    }

    return true; 
};