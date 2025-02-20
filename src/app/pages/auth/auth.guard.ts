import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UserService } from '../service/user.service';


@Injectable({
    providedIn: 'root',
})
export class RoleGuard implements CanActivate {
    constructor(private userService: UserService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        // Récupère les rôles autorisés depuis la configuration de la route
        const allowedRoles = route.data['roles'] as Array<'admin' | 'chef_lab' | 'reservant'>;

        // Récupère l'utilisateur courant
        const user = this.userService.getCurrentUser();

        // Vérifie si l'utilisateur est connecté et a un rôle autorisé
        if (user && allowedRoles.includes(user.role)) {
            return true; // Autorise l'accès
        } else {
            this.router.navigate(['/access-denied']); // Redirige vers la page d'accès refusé
            return false; // Refuse l'accès
        }
    }
}