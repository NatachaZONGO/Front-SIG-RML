import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "./auth.service";

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
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

  // Récupérer les rôles autorisés pour cette route
  const requiredRoles = route.data['roles'] as Array<string>; // Rôles requis pour accéder à la route

  // Si aucun rôle n'est requis, autoriser l'accès
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Récupérer le rôle de l'utilisateur
  const userRole = authService.getUserRole();

  // Vérifier si l'utilisateur a l'un des rôles requis
  if (userRole !== undefined && requiredRoles.includes(userRole)) {
    return true;
  } else {
    console.warn("Accès refusé : rôle non autorisé. Redirection vers la page de non-autorisation.");
    router.navigateByUrl('/notfound'); // Rediriger vers une page d'erreur ou de non-autorisation
    return false;
  }
};