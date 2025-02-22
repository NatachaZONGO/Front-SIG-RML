import { HttpEvent, HttpHandler, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";
import { AuthService } from "./auth.service";
import { Router } from "@angular/router";
import { LocalStorageFields } from "../../const";

export function accessInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Ne pas ajouter l'en-tête Authorization pour la route de connexion
    if (req.url.includes('/account/login')) {
        console.log("Requête de connexion détectée, pas besoin de token.");
        return next(req);
    }

    // Récupère le token depuis le service ou le localStorage
    const token = authService.accessToken || localStorage.getItem(LocalStorageFields.accessToken);
    console.log("Token utilisé dans l'intercepteur :", token); // Log du token

    if (!token) {
        console.warn("Accès refusé : aucun token trouvé. Redirection vers la page de connexion.");
        router.navigateByUrl('/login');
        return throwError(() => new Error("Aucun token trouvé"));
    }

    // Ajoute l'en-tête Authorization aux autres requêtes
    const clonedReq = req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`,
        },
    });

    console.log("Requête modifiée avec le token :", clonedReq.headers.get('Authorization')); // Log de la requête modifiée

    // Gère les erreurs 401 (token expiré ou invalide)
    return next(clonedReq).pipe(
        catchError((error) => {
            if (error.status === 401) {
                console.warn("Token expiré ou invalide. Redirection vers la page de connexion.");
                console.log("Token avant déconnexion :", authService.accessToken || localStorage.getItem(LocalStorageFields.accessToken)); // Log du token avant déconnexion
                authService.logout(); // Déconnecte l'utilisateur
                console.log("Token après déconnexion :", authService.accessToken || localStorage.getItem(LocalStorageFields.accessToken)); // Log du token après déconnexion
                router.navigateByUrl('/login'); // Redirige vers la page de connexion
            }
            return throwError(() => error); // Propager l'erreur
        })
    );
}