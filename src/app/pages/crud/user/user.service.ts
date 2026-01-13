import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap, catchError, throwError } from 'rxjs';
import { BackendURL } from '../../../Share/const';
import { User } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private api = BackendURL?.endsWith('/') ? BackendURL.slice(0, -1) : BackendURL;
  private usersUrl = `${this.api}/users`;
  private profileUrl = `${this.api}/profile`;

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
        const users = response?.data || response;
        console.log('👥 Users extraits:', users);
        
        if (Array.isArray(users) && users.length > 0) {
          console.log('🔍 Premier user détaillé:', users[0]);
        }
      })
    );
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<any>(`${this.usersUrl}/${id}`).pipe(
      tap(response => {
        console.log(`📄 User ${id} détaillé:`, response);
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

 updateUser(userData: any): Observable<any> {
  console.log('🔧 UserService.updateUser() appelé');
  console.log('  📦 Données reçues:', userData);
  
  if (!userData.id) {
    throw new Error('❌ ID utilisateur manquant');
  }
  const url = `${this.usersUrl}/${userData.id}`;
  console.log('  🌐 URL:', url);
  
  // ✅ Construire le payload (UN SEUL rôle)
  const payload = {
    statut: userData.statut,
    role_id: userData.role_id  // ✅ UN SEUL rôle (pas role_ids)
  };
  
  console.log('  📤 Payload envoyé:', payload);
  
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });
  
  return this.http.put(url, payload, { headers }).pipe(
    tap(response => {
      console.log('✅ Réponse du serveur:', response);
    })
  );
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

  // --------------------- PROFILE (endpoints du profil utilisateur) ---------------------

  /**
   * ✅ GET /api/profile - Récupérer le profil de l'utilisateur connecté
   */
  getProfile(): Observable<User> {
    console.log('📡 Appel getProfile()');
    return this.http.get<any>(`${this.profileUrl}`).pipe(
      tap(res => {
        console.log('👤 Réponse getProfile brute:', res);
      }),
      map(res => {
        // Extraction du user selon la structure de la réponse
        const user = res?.data?.user ?? res?.user ?? res?.data ?? res;
        console.log('✅ User extrait dans getProfile:', user);
        return user;
      }),
      tap(user => {
        // Sauvegarder dans localStorage et BehaviorSubject
        localStorage.setItem('utilisateur', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(err => {
        console.error('❌ Erreur getProfile:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ PUT /api/profile/details - Mettre à jour les infos de base
   */
  updateProfileDetails(payload: {
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
  }): Observable<any> {
    console.log('📡 Appel updateProfileDetails avec:', payload);
    return this.http.put(`${this.profileUrl}/details`, payload, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      tap(res => console.log('✅ Réponse updateProfileDetails:', res)),
      catchError(err => {
        console.error('❌ Erreur updateProfileDetails:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ POST /api/profile/photo - Uploader la photo de profil
   */
  uploadProfilePhoto(file: File): Observable<any> {
    console.log('📤 UserService.uploadProfilePhoto');
    console.log('  - Nom:', file.name);
    console.log('  - Taille:', (file.size / 1024).toFixed(2), 'KB');
    console.log('  - Type:', file.type);
    
    const formData = new FormData();
    formData.append('photo', file); // ← Nom du champ attendu par le backend
    
    const url = `${this.profileUrl}/photo`;
    console.log('📡 Upload vers:', url);
    
    return this.http.post(url, formData).pipe(
      tap(res => {
        console.log('✅ Réponse uploadProfilePhoto:', res);
      }),
      map(res => {
        // Extraire les données de la réponse
        return (res as any)?.data ?? res;
      }),
      catchError(err => {
        console.error('❌ Erreur uploadProfilePhoto:', err);
        console.error('  Status:', err.status);
        console.error('  Message:', err.error?.message || err.message);
        console.error('  Errors:', err.error?.errors);
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ PUT /api/profile/password - Changer le mot de passe
   */
  changePassword(
    current_password: string, 
    new_password: string, 
    new_password_confirmation: string
  ): Observable<any> {
    console.log('📡 Appel changePassword');
    return this.http.put(`${this.profileUrl}/password`, {
      current_password,
      new_password,
      new_password_confirmation
    }, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      tap(res => console.log('✅ Mot de passe changé:', res)),
      catchError(err => {
        console.error('❌ Erreur changePassword:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * PUT /api/profile/candidat - Mettre à jour le profil candidat
   */
  updateCandidatProfile(payload: {
    sexe?: 'Homme' | 'Femme';
    date_naissance?: string;
    categorie_id?: number;
    ville?: string;
    niveau_etude?: string;
    disponibilite?: string;
    pays_id?: number;
  }): Observable<any> {
    console.log('📡 Appel updateCandidatProfile avec:', payload);
    return this.http.put(`${this.profileUrl}/candidat`, payload, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      tap(res => console.log('✅ Réponse updateCandidatProfile:', res)),
      catchError(err => {
        console.error('❌ Erreur updateCandidatProfile:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * PUT /api/profile/entreprise - Mettre à jour le profil entreprise
   */
  updateEntrepriseProfile(payload: {
    nom_entreprise?: string;
    description?: string | null;
    site_web?: string | null;
    secteur_activite?: string;
    logo?: string | null;
    pays_id?: number;
  }): Observable<any> {
    console.log('📡 Appel updateEntrepriseProfile avec:', payload);
    return this.http.put(`${this.profileUrl}/entreprise`, payload, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      tap(res => console.log('✅ Réponse updateEntrepriseProfile:', res)),
      catchError(err => {
        console.error('❌ Erreur updateEntrepriseProfile:', err);
        return throwError(() => err);
      })
    );
  }

  // --------------------- Auth ---------------------
  
  login(email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http.post<any>(`${this.api}/auth/login`, { email, password }).pipe(
      tap(res => {
        console.log('🔐 Réponse login complète:', res);
        
        if (res.token && res.user) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('utilisateur', JSON.stringify(res.user));
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
    localStorage.removeItem('utilisateur');
    this.currentUserSubject.next(null);
    this.router.navigate(['/connexion']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('utilisateur');
    return user ? JSON.parse(user) : null;
  }

  isAdmin(): boolean { 
    return this.getCurrentUser()?.role === 'administrateur' || 
           this.getCurrentUser()?.role === 'admin'; 
  }
  
  isRecruteur(): boolean { 
    return this.getCurrentUser()?.role === 'recruteur'; 
  }
  
  isCandidat(): boolean { 
    return this.getCurrentUser()?.role === 'candidat'; 
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

  /**
   * Debug user pour tests
   */
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
}