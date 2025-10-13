import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { BackendURL } from '../../../Share/const';
import { User } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  /** Exemple: BackendURL = 'http://127.0.0.1:8000/api/' */
  private api  = BackendURL?.endsWith('/') ? BackendURL.slice(0, -1) : BackendURL;
  private usersUrl   = `${this.api}/users`;     // admin: CRUD utilisateurs
  private profileUrl = `${this.api}/profile`;   // show/details/password/...

  constructor(private http: HttpClient, private router: Router) {}

  // --------------------- ADMIN USERS ---------------------
  getUsers(params?: Record<string, any>): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        const v = (params as any)[k];
        if (v !== undefined && v !== null) httpParams = httpParams.set(k, v);
      });
    }
    return this.http.get<any>(this.usersUrl, { params: httpParams }).pipe(
      tap(response => {
        console.log('📦 Réponse brute getUsers:', response);
        
        // Vérifier la structure de la réponse
        const users = response?.data || response;
        console.log('👥 Users extraits:', users);
        
        // Vérifier le premier utilisateur en détail
        if (Array.isArray(users) && users.length > 0) {
          console.log('🔍 Premier user détaillé:', users[0]);
          console.log('🕐 last_login du premier user:', users[0].last_login);
          console.log('📅 created_at du premier user:', users[0].created_at);
          console.log('🔄 updated_at du premier user:', users[0].updated_at);
        }
      })
    );
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<any>(`${this.usersUrl}/${id}`).pipe(
      tap(response => {
        console.log(`📄 User ${id} détaillé:`, response);
        console.log(`🕐 last_login:`, response?.data?.last_login || response?.last_login);
      }),
      map(response => response.data || response)
    );
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.getUsers({ role }).pipe(
      map(response => response?.data?.data ?? [])
    );
  }

  createUser(user: Partial<User>): Observable<any> {
    const body = this.asBody(user, false);
    const options = body instanceof FormData ? {} : { headers: { 'Content-Type': 'application/json' } };
    return this.http.post(this.usersUrl, body, options);
  }

  updateUser(user: Partial<User>): Observable<any> {
    if (!user.id) throw new Error('updateUser: id manquant');

    const hasFile = user.photo instanceof File;
    if (hasFile) {
      const fd = new FormData();
      if (user.nom) fd.append('nom', user.nom.trim());
      if (user.prenom) fd.append('prenom', user.prenom.trim());
      if (user.email) fd.append('email', user.email.trim());
      if (user.telephone) fd.append('telephone', String(user.telephone).trim());
      if (user.password?.trim()) fd.append('password', user.password.trim());
      if (user.role_id) fd.append('role_id', String(user.role_id));
      if (user.statut) fd.append('statut', user.statut);
      fd.append('photo', user.photo as File);
      fd.append('_method', 'PUT');
      return this.http.post(`${this.usersUrl}/${user.id}`, fd);
    } else {
      const payload = this.asBody(user, true);
      return this.http.put(`${this.usersUrl}/${user.id}`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.usersUrl}/${id}`);
  }

  updateUserStatus(userId: number, status: string): Observable<any> {
    return this.http.put(`${this.usersUrl}/${userId}/status`, { statut: status });
  }

  resetUserPassword(userId: number): Observable<any> {
    return this.http.post(`${this.usersUrl}/${userId}/reset-password`, {});
  }

  // --------------------- PROFILE (nouveaux endpoints) ---------------------

  /** GET /api/profile  -> { success, data: { user: {...} } } */
  getProfile(): Observable<User> {
    return this.http.get<any>(`${this.profileUrl}`).pipe(
      tap(res => {
        console.log('👤 Réponse getProfile brute:', res);
        console.log('🕐 last_login dans getProfile:', res?.data?.user?.last_login || res?.user?.last_login || res?.last_login);
      }),
      map(res => {
        const user = res?.data?.user ?? res?.user ?? res;
        console.log('✅ User extrait dans getProfile:', user);
        return user;
      }),
      tap(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  /** PUT /api/profile/details  -> met à jour nom/prenom/email/telephone (et éventuellement photo si string) */
  updateProfileDetails(payload: {
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    photo?: string | null;
  }): Observable<any> {
    return this.http.put(`${this.profileUrl}/details`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /** PUT /api/profile/password  -> { current_password, new_password, new_password_confirmation } */
  changePassword(current_password: string, new_password: string, new_password_confirmation: string): Observable<any> {
    return this.http.put(`${this.profileUrl}/password`, {
      current_password,
      new_password,
      new_password_confirmation
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /** PUT /api/profile/candidat */
  updateCandidatProfile(payload: {
    sexe?: 'Homme'|'Femme';
    date_naissance?: string;
    categorie_id?: number;
    ville?: string;
    niveau_etude?: string;
    disponibilite?: string;
    pays_id?: number;
  }): Observable<any> {
    return this.http.put(`${this.profileUrl}/candidat`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /** PUT /api/profile/entreprise */
  updateEntrepriseProfile(payload: {
    nom_entreprise?: string;
    description?: string | null;
    site_web?: string | null;
    secteur_activite?: string;
    logo?: string | null;
    pays_id?: number;
  }): Observable<any> {
    return this.http.put(`${this.profileUrl}/entreprise`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // --------------------- Auth local (token en LS) ---------------------
  login(email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http.post<any>(`${this.api}/auth/login`, { email, password }).pipe(
      tap(res => {
        console.log('🔐 Réponse login complète:', res);
        console.log('👤 User dans login:', res.user);
        console.log('🕐 last_login au login:', res.user?.last_login);
        
        if (res.token && res.user) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }
      }),
      map(res => ({
        token: res.token,
        user: res.user
      }))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAdmin(): boolean { return this.getCurrentUser()?.role === 'admin'; }
  isChefLab(): boolean { return this.getCurrentUser()?.role === 'responsable'; }
  isReservant(): boolean { return this.getCurrentUser()?.role === 'reservant'; }

  // ✅ Méthode de debug pour tester
  debugUser(userId: number): void {
    this.getUserById(userId).subscribe({
      next: (user) => {
        console.group('🐛 DEBUG USER COMPLET');
        console.log('User:', user);
        console.log('last_login:', user.last_login);
        console.log('Type de last_login:', typeof user.last_login);
        console.log('created_at:', user.created_at);
        console.log('updated_at:', user.updated_at);
        console.groupEnd();
      },
      error: (err) => {
        console.error('❌ Erreur debug user:', err);
      }
    });
  }

  // --------------------- Helpers ---------------------
  private asBody(user: Partial<User>, isUpdate: boolean): FormData | any {
    const hasFile = user.photo instanceof File;

    if (hasFile) {
      const fd = new FormData();
      if (user.nom) fd.append('nom', user.nom.trim());
      if (user.prenom) fd.append('prenom', user.prenom.trim());
      if (user.email) fd.append('email', user.email.trim());
      if (user.telephone) fd.append('telephone', String(user.telephone).trim());
      if (!isUpdate && user.password) fd.append('password', user.password.trim());
      else if (isUpdate && user.password?.trim()) fd.append('password', user.password.trim());
      if (user.role_id) fd.append('role_id', String(user.role_id));
      if (user.statut) fd.append('statut', user.statut);
      fd.append('photo', user.photo as File);
      return fd;
    }

    const payload: any = {
      nom: user.nom?.trim(),
      prenom: user.prenom?.trim(),
      email: user.email?.trim(),
      telephone: user.telephone?.trim(),
      statut: user.statut,
      role_id: user.role_id
    };

    if (!isUpdate && user.password) payload.password = user.password.trim();
    else if (isUpdate && user.password?.trim()) payload.password = user.password.trim();

    if (typeof user.photo === 'string' && user.photo.trim()) payload.photo = user.photo.trim();

    return payload;
  }
}