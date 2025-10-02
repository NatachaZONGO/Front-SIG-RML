import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { BackendURL } from '../../../const';
import { User } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  /** Exemple: BackendURL = 'http://127.0.0.1:8000/api/' (avec slash final) */
  private api = BackendURL?.endsWith('/') ? BackendURL.slice(0, -1) : BackendURL;
  private usersUrl = `${this.api}/users`;
  private authUrl  = `${this.api}/auth`;   // login/logout/me, etc.

  constructor(private http: HttpClient, private router: Router) {}

  /** 
   * Récupération paginée Laravel: { success, data: { data: [...] } }
   * CORRECTION: Retourner la réponse complète au lieu de mapper directement
   */
  getUsers(params?: Record<string, any>): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        const v = (params as any)[k];
        if (v !== undefined && v !== null) httpParams = httpParams.set(k, v);
      });
    }

    // Retourner la réponse complète pour que le composant puisse accéder à response.data.data
    return this.http.get<any>(this.usersUrl, { params: httpParams });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<any>(`${this.usersUrl}/${id}`).pipe(
      map(response => response.data || response) // Gérer si la réponse est wrappée
    );
  }

  /** Si tu exposes un filtre par rôle côté backend, préfère un query param: GET /users?role=... */
  getUsersByRole(role: string): Observable<User[]> {
    return this.getUsers({ role }).pipe(
      map(response => response?.data?.data ?? [])
    );
  }

  /** Création (gère file upload => FormData) */
  createUser(user: Partial<User>): Observable<any> {
    const body = this.asBody(user, false);
    
    // Si c'est FormData, laisser le navigateur définir le Content-Type
    const options = body instanceof FormData ? {} : {
      headers: { 'Content-Type': 'application/json' }
    };
    
    return this.http.post(this.usersUrl, body, options);
  }

  /** Mise à jour (id numérique) */
  updateUser(user: Partial<User>): Observable<any> {
    if (!user.id) throw new Error('updateUser: id manquant');
    
    const hasFile = user.photo instanceof File;
    console.log('updateUser - hasFile:', hasFile);
    
    if (hasFile) {
      // Pour les mises à jour avec fichier, Laravel a besoin de POST avec _method=PUT
      const fd = new FormData();
      if (user.nom) fd.append('nom', user.nom.trim());
      if (user.prenom) fd.append('prenom', user.prenom.trim());
      if (user.email) fd.append('email', user.email.trim());
      if (user.telephone) fd.append('telephone', String(user.telephone).trim());
      if (user.password?.trim()) fd.append('password', user.password.trim());
      if (user.role_id) fd.append('role_id', String(user.role_id));
      if (user.statut) fd.append('statut', user.statut);
      fd.append('photo', user.photo as File);
      fd.append('_method', 'PUT'); // Indiquer à Laravel que c'est un PUT
      
      console.log('Mise à jour avec fichier - utilisation POST + _method=PUT');
      
      // Laisser le navigateur définir automatiquement le Content-Type pour FormData
      return this.http.post(`${this.usersUrl}/${user.id}`, fd);
    } else {
      // Pour les mises à jour sans fichier, utiliser PUT classique
      const payload = this.asBody(user, true);
      console.log('Mise à jour sans fichier - utilisation PUT');
      return this.http.put(`${this.usersUrl}/${user.id}`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /** Suppression (id numérique) */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.usersUrl}/${id}`);
  }

  // ---------- Auth ----------
  /** Ton backend: POST /api/auth/login (pas /users/account/login) */
  login(email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.authUrl}/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      })
    );
  }

  logout(): void {
    // Si tu as un endpoint backend: this.http.post(`${this.authUrl}/logout`, {}).subscribe({ complete: ... })
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

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }
  isChefLab(): boolean {
    return this.getCurrentUser()?.role === 'responsable';
  }
  isReservant(): boolean {
    return this.getCurrentUser()?.role === 'reservant';
  }

  // ---------- Helpers ----------
  /**
   * Construit le payload:
   * - si photo est un File => FormData
   * - sinon => JSON
   * - password envoyé seulement en création
   */
  private asBody(user: Partial<User>, isUpdate: boolean): FormData | any {
    const hasFile = user.photo instanceof File;

    console.log('asBody - données utilisateur:', user);
    console.log('asBody - isUpdate:', isUpdate);
    console.log('asBody - hasFile:', hasFile);

    // IMPORTANT: Si il y a un fichier, on doit utiliser FormData
    // Sinon votre backend Laravel ne peut pas traiter le fichier
    if (hasFile) {
      const fd = new FormData();
      if (user.nom) fd.append('nom', user.nom.trim());
      if (user.prenom) fd.append('prenom', user.prenom.trim());
      if (user.email) fd.append('email', user.email.trim());
      if (user.telephone) fd.append('telephone', String(user.telephone).trim());
      
      // Mot de passe : seulement en création ou si fourni en modification
      if (!isUpdate && user.password) {
        fd.append('password', user.password.trim());
      } else if (isUpdate && user.password?.trim()) {
        fd.append('password', user.password.trim());
      }
      
      if (user.role_id) fd.append('role_id', String(user.role_id));
      if (user.statut) fd.append('statut', user.statut);
      
      // Ajouter le fichier image
      fd.append('photo', user.photo as File);
      
      // Debug FormData
      console.log('FormData créé avec fichier photo:');
      fd.forEach((value, key) => {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      });
      
      return fd;
    }

    // Payload JSON (sans fichier) - NE PAS inclure photo si c'est undefined
    const payload: any = {
      nom: user.nom?.trim(),
      prenom: user.prenom?.trim(),
      email: user.email?.trim(),
      telephone: user.telephone?.trim(),
      statut: user.statut,
      role_id: user.role_id
    };
    
    // Mot de passe : seulement en création ou si fourni en modification
    if (!isUpdate && user.password) {
      payload.password = user.password.trim();
    } else if (isUpdate && user.password?.trim()) {
      payload.password = user.password.trim();
    }
    
    // Photo : seulement si c'est une string (chemin existant)
    // NE PAS inclure photo si elle est undefined/null
    if (typeof user.photo === 'string' && user.photo.trim()) {
      payload.photo = user.photo.trim();
    }

    console.log('Payload JSON créé (sans photo file):', payload);
    return payload;
  }
}