import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, firstValueFrom, map, Observable, tap, throwError } from 'rxjs';
import { UserConnexion } from './connexion/userconnexion.model';
import { BackendURL, LocalStorageFields } from '../../const';
import { RegisterCandidat, RegisterRecruteur } from './register/user.model';


@Injectable({ providedIn: 'root' })
export class AuthService {
  accessToken?: string;
  /** On garde une liste de noms de rôles (ex: ["admin","recruteur"]) */
  private _rolesNames: string[] = [];

  /** Expose les rôles (si tu veux y accéder côté composants) */
  rolesNames(): string[] {
    return this._rolesNames;
  }

  private utilisateurConnecteSubject = new BehaviorSubject<any>(null);
  utilisateurConnecte$: Observable<any> = this.utilisateurConnecteSubject.asObservable();

  constructor(private http: HttpClient) {
    // Token
    this.accessToken = localStorage.getItem(LocalStorageFields.accessToken) ?? undefined;

    // Rôles — on privilégie un tableau, mais on accepte l'ancien stockage 'userRole'
    const rolesJson = localStorage.getItem(LocalStorageFields.roles_name);
    const singleRole = localStorage.getItem(LocalStorageFields.userRole);
    if (rolesJson) {
      try { this._rolesNames = JSON.parse(rolesJson) ?? []; }
      catch { this._rolesNames = []; }
    } else if (singleRole) {
      this._rolesNames = [singleRole];
      localStorage.setItem(LocalStorageFields.roles_name, JSON.stringify(this._rolesNames));
      localStorage.removeItem(LocalStorageFields.userRole); // on unifie
    }

    // User
    const utilisateur = localStorage.getItem('utilisateur');
    if (utilisateur) {
      try { this.utilisateurConnecteSubject.next(JSON.parse(utilisateur)); }
      catch { this.utilisateurConnecteSubject.next(null); }
    } else {
      this.utilisateurConnecteSubject.next(null);
    }
  }

  // ----------------------------- Inscription
 // --- REGISTER ---
  registerCandidat(payload: RegisterCandidat): Promise<any> {
    return firstValueFrom(
      this.http.post(`${BackendURL}register-candidat`, payload).pipe(
        tap((res: any) => this.persistAuthAfterRegister(res)),
        catchError(err => {
          console.error('registerCandidat error', err);
          return throwError(() => err);
        })
      )
    );
  }

  registerRecruteur(payload: RegisterRecruteur): Promise<any> {
    return firstValueFrom(
      this.http.post(`${BackendURL}register-recruteur`, payload).pipe(
        tap((res: any) => this.persistAuthAfterRegister(res)),
        catchError(err => {
          console.error('registerRecruteur error', err);
          return throwError(() => err);
        })
      )
    );
  }

  private persistAuthAfterRegister(res: any) {
    // Le backend renvoie: { success, message, data: { user, token, token_type } }
    const token = res?.data?.token;
    const user  = res?.data?.user;
    if (token) localStorage.setItem(LocalStorageFields.accessToken, token);
    if (user)  localStorage.setItem('utilisateur', JSON.stringify(user));
    this.accessToken = token;
  }
  connexion(userConnexion: UserConnexion): Promise<any> {
    return firstValueFrom(
      this.http
        .post<any>(`${BackendURL}login`, userConnexion, {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        })
        .pipe(
          tap((res) => {
            // ---- Extract token
            const token: string | undefined =
              res?.access_token ??
              res?.data?.token ??
              res?.token;

            if (!token) {
              console.error('Token manquant dans la réponse de connexion', res);
              throw new Error('Token manquant');
            }

            this.accessToken = token;
            localStorage.setItem(LocalStorageFields.accessToken, token);

            // ---- Extract user
            const user = res?.user ?? res?.data?.user ?? null;
            if (user) {
              localStorage.setItem('utilisateur', JSON.stringify(user));
              this.utilisateurConnecteSubject.next(user);
            } else {
              // on garde quand même le token, mais on loggue
              console.warn('Utilisateur manquant dans la réponse de connexion');
            }

            // ---- Extract roles -> tableau de noms
            let rolesNames: string[] = [];

            // cas 1: "roles" à part, comme [{nom: 'admin'}]
            if (Array.isArray(res?.roles)) {
              rolesNames = res.roles.map((r: any) => r?.nom ?? r?.name).filter(Boolean);
            }

            // cas 2: user.roles inclus
            if (!rolesNames.length && Array.isArray(user?.roles)) {
              rolesNames = user.roles.map((r: any) => r?.nom ?? r?.name).filter(Boolean);
            }

            // cas 3: un seul rôle string sur l'user (legacy)
            if (!rolesNames.length && typeof user?.role === 'string') {
              rolesNames = [user.role];
            }

            this._rolesNames = rolesNames;
            localStorage.setItem(LocalStorageFields.roles_name, JSON.stringify(this._rolesNames));

            // Nettoyage ancien champ s'il existe
            localStorage.removeItem(LocalStorageFields.userRole);

            console.log('Rôles en session:', this._rolesNames);
          }),
          catchError((error) => {
            console.error('Erreur lors de la connexion :', error);
            return throwError(() => new Error('Erreur lors de la connexion'));
          })
        )
    );
  }

  // ----------------------------- Déconnexion
  logout(): void {
    this.accessToken = undefined;
    this._rolesNames = [];
    localStorage.removeItem(LocalStorageFields.accessToken);
    localStorage.removeItem(LocalStorageFields.roles_name);
    localStorage.removeItem(LocalStorageFields.userRole); // nettoyage legacy
    localStorage.removeItem('utilisateur');
    this.utilisateurConnecteSubject.next(null);
  }

  // ----------------------------- Infos utilisateur
  getCurrentUserInfos(): Observable<{ user: any; roles: Array<{id?: number; nom: string}> }> {
  const token = localStorage.getItem(LocalStorageFields.accessToken);
  if (!token) return throwError(() => new Error('Aucun token trouvé'));

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  return this.http.get<any>(`${BackendURL}me`, { headers }).pipe(
    map((res) => {
      const data = res?.data ?? {};
      const rawUser = data.user ?? {};
      const rawRoles = data.roles ?? rawUser.roles ?? [];

      // Normalise user
      const user = {
        ...rawUser,
        nom: rawUser.nom ?? rawUser.lastname ?? rawUser.last_name ?? '',
        prenom: rawUser.prenom ?? rawUser.firstname ?? rawUser.first_name ?? '',
        email: rawUser.email ?? ''
      };

      // Normalise roles: strings -> {nom: string}, objets -> {id?, nom}
      const roles: Array<{id?: number; nom: string}> = Array.isArray(rawRoles)
        ? rawRoles.map((r: any) => {
            if (typeof r === 'string') return { nom: r };
            return { id: r?.id, nom: r?.nom ?? r?.name ?? '' };
          })
        : [];

      return { user, roles };
    })
  );
}

  // ----------------------------- Helpers
  getCurrentUserId(): number | null {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user?.id ?? null;
    } catch {
      return null;
    }
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user && user.id ? user : null;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(LocalStorageFields.accessToken);
  }

  /** Compat: renvoie le premier rôle si tu en as besoin */
  getUserRole(): string | undefined {
    return this._rolesNames[0];
  }

  getToken(): string | null {
    return localStorage.getItem(LocalStorageFields.accessToken);
  }

  // Raccourcis pour l’UI conditionnelle
  hasRole(role: string): boolean {
    return this._rolesNames.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((r) => this._rolesNames.includes(r));
  }

  // util
  isAuthenticated(): boolean {
    return !!(this.accessToken || localStorage.getItem(LocalStorageFields.accessToken));
  }
}
