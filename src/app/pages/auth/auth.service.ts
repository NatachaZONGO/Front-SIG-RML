import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, firstValueFrom, last, Observable, tap, throwError } from 'rxjs';
import { UserConnexion } from './connexion/userconnexion.model';
import { BackendURL, LocalStorageFields } from '../../const';
import { RegisterUser } from './register/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    accessToken?: string;
    role?: string; // Déclaration explicite du rôle comme étant une chaîne de caractères ou undefined

    private utilisateurConnecteSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    utilisateurConnecte$: Observable<any> = this.utilisateurConnecteSubject.asObservable();

    constructor(private http: HttpClient) {
        // Récupérer le token d'accès depuis le localStorage
        this.accessToken = localStorage.getItem(LocalStorageFields.accessToken) ?? undefined;

        // Récupérer le rôle unique de l'utilisateur
        const role = localStorage.getItem(LocalStorageFields.userRole);
        if (role) {
            this.role = role; // Assigner directement le rôle unique
        } else {
            console.warn('Aucun rôle trouvé dans le localStorage');
            this.role = undefined; // Aucun rôle trouvé
        }

        // Récupérer les informations de l'utilisateur
        const utilisateur = localStorage.getItem('utilisateur');
        if (utilisateur) {
            try {
                const user = JSON.parse(utilisateur);
                this.utilisateurConnecteSubject.next(user);
                console.log('Utilisateur récupéré du localStorage:', user);
            } catch (e) {
                console.error('Erreur lors du parsing de l\'utilisateur:', e);
                this.utilisateurConnecteSubject.next(null);
            }
        } else {
            console.warn('Aucun utilisateur trouvé dans le localStorage');
            this.utilisateurConnecteSubject.next(null);
        }
    }

    //-----------------------------Inscription-------------------------------------------
     // Méthode pour l'inscription (utilisable par l'admin et l'utilisateur)
  register(registerData: RegisterUser, isAdmin: boolean = false): Promise<any> {
    const formData = {
      firstname: registerData.firstname,
      lastname: registerData.lastname,
      email: registerData.email,
      password: registerData.password,
      phone: registerData.phone,
      address: registerData.address,
      scope: isAdmin ? registerData.role : 'reservant', 
      
    };

    return firstValueFrom(
      this.http.post( `${BackendURL}register`, formData).pipe(
        catchError((error) => {
          console.error("Erreur lors de l'inscription:", error);
          return throwError(() => new Error("Erreur lors de l'inscription"));
        })
      )
    );
  }

    //-----------------------------Connexion-------------------------------------------
    connexion(userConnexion: UserConnexion): Promise<any> {
        return firstValueFrom(
            this.http.post<{ message: string, user: any, token: string }>(
                BackendURL + "login",
                userConnexion,
                {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                    }),
                }
            ).pipe(
                tap((result) => {
                    console.log("Réponse API:", result);

                    if (result.token) {
                        this.accessToken = result.token;
                        localStorage.setItem(LocalStorageFields.accessToken, this.accessToken);
                        localStorage.setItem('utilisateur', JSON.stringify(result.user));
                        this.utilisateurConnecteSubject.next(result.user);

                        // Stocker le rôle sous forme de chaîne dans le localStorage
                        localStorage.setItem(LocalStorageFields.userRole, result.user.role);
                        this.role = result.user.role; // Mise à jour du rôle dans l'attribut 'role'
                        console.log("Rôle utilisateur:", this.role);
                    } else {
                        console.error("Token d'accès manquant dans la réponse de connexion");
                    }
                }),
                catchError((error) => {
                    console.error("Erreur lors de la connexion :", error);
                    return throwError(() => new Error("Erreur lors de la connexion"));
                })
            )
        );
    }

    //-----------------------------Déconnexion-------------------------------------------
    logout(): void {
        this.accessToken = undefined;
        this.role = undefined; // Réinitialiser le rôle lors de la déconnexion
        localStorage.removeItem(LocalStorageFields.accessToken);
        localStorage.removeItem(LocalStorageFields.userRole);
        localStorage.removeItem('utilisateur');
        this.utilisateurConnecteSubject.next(null);
    }

    //-----------------------------Récupération des informations de l'utilisateur-------------------------------------------
    getCurrentUserInfos(): Observable<any> {
        const token = localStorage.getItem(LocalStorageFields.accessToken);
        if (!token) {
            console.error("Aucun token trouvé. L'utilisateur doit se reconnecter.");
            return throwError(() => new Error("Aucun token trouvé"));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        });

        return this.http.get(`${BackendURL}/account/user`, { headers }).pipe(
            catchError(error => {
                console.error("Erreur lors de la récupération de l'utilisateur:", error);
                return throwError(() => new Error("Erreur API"));
            })
        );
    }

    //-----------------------------Récupération de l'ID de l'utilisateur-------------------------------------------
    getCurrentUserId(): number | null {
        const user = localStorage.getItem('utilisateur');
        if (user) {
            try {
                const parsedUser = JSON.parse(user);
                return parsedUser?.id ?? null;
            } catch (e) {
                console.error('Erreur lors du parsing de l\'utilisateur:', e);
                return null;
            }
        }
        return null;
    }

    //-----------------------------Récupération de l'utilisateur-------------------------------------------
    getCurrentUser(): any {
        const userString = localStorage.getItem('utilisateur');
        if (userString) {
            try {
                const user = JSON.parse(userString);
                console.log(user);
                return user && user.id ? user : null;
            } catch (e) {
                console.error('Erreur lors du parsing de l\'utilisateur:', e);
                return null;
            }
        }
        return null;
    }

    //-----------------------------Vérification de la connexion-------------------------------------------
    isLoggedIn(): boolean {
        const token = localStorage.getItem(LocalStorageFields.accessToken);
        return !!token;
    }

    //-----------------------------Récupération du rôle de l'utilisateur-------------------------------------------
    getUserRole(): string | undefined {
        return this.role;
    }

     //-----------------------------Récupération du token d'accès-------------------------------------------
     getToken(): string | null {
        return localStorage.getItem(LocalStorageFields.accessToken);
    }
}
