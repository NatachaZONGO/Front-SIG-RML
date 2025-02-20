import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
    id?: string;
    name?: string;
    prenom?: string;
    email?: string;
    password?: string;
    role: 'admin' | 'chef_lab' | 'reservant'; 
}

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private apiUrl = 'http://102.211.121.54:8080/node_ts/api/V0.1'; // Remplace par l'URL de ton API

    constructor(private http: HttpClient, private router: Router) {}

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/user/all`);
    }

    getUserById(id: string): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/${id}`);
    }

    createUser(user: User): Observable<User> {
        return this.http.post<User>(this.apiUrl, user);
    }

    updateUser(user: User): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/${user.id}`, user);
    }

    deleteUser(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // Connexion
    login(email: string, password: string): Observable<{ token: string; user: User }> {
        return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/account/login`, { email, password }).pipe(
            tap((response) => {
                localStorage.setItem('token', response.token); // Stocke le token
                localStorage.setItem('user', JSON.stringify(response.user)); // Stocke les infos de l'utilisateur
                this.currentUserSubject.next(response.user); // Met à jour l'utilisateur courant
            })
        );
    }

    // Déconnexion
    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null); // Réinitialise l'utilisateur courant
        this.router.navigate(['/login']); // Redirige vers la page de connexion
    }

    // Vérifie si l'utilisateur est connecté
    isLoggedIn(): boolean {
        return !!localStorage.getItem('token');
    }

    // Récupère l'utilisateur courant
    getCurrentUser(): User | null {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    // Vérifie si l'utilisateur est un administrateur
    isAdmin(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'admin';
    }

    // Vérifie si l'utilisateur est un chef de laboratoire
    isChefLab(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'chef_lab';
    }

    // Vérifie si l'utilisateur est un réservant
    isReservant(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'reservant';
    }
}

