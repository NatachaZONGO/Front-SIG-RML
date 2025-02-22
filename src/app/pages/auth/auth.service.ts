import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, Signal, signal } from '@angular/core';
import { BehaviorSubject, catchError, firstValueFrom, Observable, switchMap, tap, throwError } from 'rxjs';
import { UserConnexion } from './connexion/userconnexion.model';
import { BackendURL, LocalStorageFields } from '../../const';
import { RegisterUser } from './register/user.model';
import { User } from '../service/product.service';



@Injectable({
    providedIn: 'root'
})
export class AuthService {
    accessToken?: string;
    private _rolesNames = signal<string[]>([]);

    get rolesNames(): Signal<string[]>{
        return this._rolesNames;
    }

    // Utilisation d'un BehaviorSubject pour émettre l'état de l'utilisateur connecté
    private utilisateurConnecteSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    utilisateurConnecte$: Observable<any> = this.utilisateurConnecteSubject.asObservable();

    constructor(private http: HttpClient) {
        this.accessToken = localStorage.getItem(LocalStorageFields.accessToken) ?? undefined;
        const json_roles = localStorage.getItem(LocalStorageFields.userRole) ?? '[]';
        this._rolesNames.set(JSON.parse(json_roles) as string[]);
    
        const utilisateur = localStorage.getItem('utilisateur');
        if (utilisateur) {
            try {
                const user = JSON.parse(utilisateur);
                this.utilisateurConnecteSubject.next(user);
                console.log('Utilisateur récupéré du localStorage:', user);
            } catch (e) {
                console.error('Erreur lors du parsing de l\'utilisateur:', e);
            }
        } else {
            console.warn('Aucun utilisateur trouvé dans le localStorage');
            this.utilisateurConnecteSubject.next(null); // Émettre null si aucun utilisateur
        }
        
    }
       

    //-----------------------------Inscription-------------------------------------------
    register( registerData: RegisterUser): Promise<any> {
        let body = new HttpParams();    
        body.set ('nom',registerData.firstname); 
        body.set ('prenom', registerData.lastname);   
        body.set ('email', registerData.email);    
        body.set ('password', registerData.password);    
        body.set('scope', registerData.scope);
        body.set('phone', registerData.phone);
        const formData = {
            'nom': registerData.firstname,
            'prenom': registerData.lastname,
            'email':  registerData.email,
            'password':  registerData.password,
            'scope':  registerData.scope,
            'phone':  registerData.phone,
        };
        const headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
        return firstValueFrom(
            //this.http.post(this.registerURL, body.toString(), {headers})
            this.http.post(BackendURL+"/register", {'nom': registerData.firstname,
                'prenom': registerData.lastname,
                'email':  registerData.email,
                'password':  registerData.password,
                'scope':  registerData.scope,
                'phone':  registerData.phone,}, {
            })
        );  
    }


//-----------------------------Connexion-------------------------------------------
connexion(userConnexion: UserConnexion): Promise<any> {
    // Token par défaut pour autoriser la requête de connexion
    const defaultToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzM4ODYyMTQ4LCJleHAiOjE3Mzg4NjU3NDh9.E6dWE8N03HobkXtlKwrz5FgbBs6U7TycL5kt_GV8G1A'; // Remplacez par le token par défaut fourni par le backend

    return firstValueFrom(
        this.http.post<{ status: number, title: string, content: { token: string, user: any } }>(
            BackendURL + "account/login",
            userConnexion, // Corps de la requête
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${defaultToken}`, // Token par défaut pour autoriser la requête
                }),
            }
        ).pipe(
            tap((result) => {
                console.log("Réponse API:", result);

                if (result.content.token) {
                    // Stocke le nouveau token généré après la connexion
                    this.accessToken = result.content.token;
                    localStorage.setItem(LocalStorageFields.accessToken, this.accessToken);

                    // Stocke les informations de l'utilisateur
                    localStorage.setItem('utilisateur', JSON.stringify(result.content.user));
                    console.log("Utilisateur connecté :", result.content.user);

                    // Met à jour l'utilisateur connecté dans le BehaviorSubject
                    this.utilisateurConnecteSubject.next(result.content.user);

                    // Stocke le rôle de l'utilisateur
                    localStorage.setItem(LocalStorageFields.userRole, JSON.stringify(result.content.user.type));
                    console.log("Rôle utilisateur :", result.content.user.type);
                } else {
                    console.error("Token d'accès manquant dans la réponse de connexion");
                }
            }),
            catchError((error) => {
                console.error("Erreur lors de la connexion :", error);
                throw error; // Propager l'erreur pour la gérer dans le composant
            })
        )
    );
}



    logout() {
        this.accessToken = undefined;
        localStorage.removeItem(LocalStorageFields.accessToken);
        localStorage.removeItem(LocalStorageFields.userRole);
    }

   


    getCurrentUserInfos(): Observable<any> {
        const token = localStorage.getItem(LocalStorageFields.accessToken);
        if (!token) {
            console.error("Aucun token trouvé. L'utilisateur doit se reconnecter.");
            return throwError(() => new Error("Aucun token trouvé")); // Retourne une erreur claire
        }
    
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,  // ✅ Envoi du token correctement
            'Content-Type': 'application/json'
        });
    
        console.log("Token envoyé dans les headers:", token); // Debugging
        

    
        return this.http.get(`${BackendURL}/account/user`, { headers }).pipe(
            catchError(error => {
                console.error("Erreur lors de la récupération de l'utilisateur:", error);
                return throwError(() => new Error("Erreur API"));
            })
        );
        
    }
    
    
    
    getCurrentUserId(): number | null {
        const user = localStorage.getItem('utilisateur');
        if (user) {
          const parsedUser = JSON.parse(user);
          return parsedUser.id; // Assurez-vous que l'objet utilisateur a bien la propriété id
        }
        return null;
      }
}