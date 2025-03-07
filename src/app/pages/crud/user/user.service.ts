import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { BackendURL } from '../../../const';
import { User } from './user.model';


@Injectable({
    providedIn: 'root',
})
export class UserService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private apiUrl = `${BackendURL}account/users`; 

    constructor(private http: HttpClient, private router: Router) {}

    getUsers(): Observable<User[]> {
        return this.http.get<{ content: User[] }>(`${BackendURL}users`).pipe(
            map(response => response.content) 
        );
    }

    getUserById(id: string): Observable<User> {
        return this.http.get<User>(`${BackendURL}user/${id}`);
    }

    getUsersByRole(role: string): Observable<User[]> {
        return this.http.get<User[]>(`${BackendURL}users/role/${role}`);
    }

    createUser(user: User): Observable<User> {
        return this.http.post<User>(`${BackendURL}users`, user);
    }

    updateUser(user: User): Observable<User> {
        return this.http.put<User>(`${BackendURL}users/${user.id}`, user);
    }

    deleteUser(id: string): Observable<void> {
        return this.http.delete<void>(`${BackendURL}users/${id}`);
    }

    // Connexion
    login(email: string, password: string): Observable<{ token: string; user: User }> {
        return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/account/login`, { email, password }).pipe(
            tap((response) => {
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user)); 
                this.currentUserSubject.next(response.user); 
            })
        );
    }

    // Déconnexion
    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null); 
        this.router.navigate(['/login']);
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
        return user?.role === 'responsable';
    }

    // Vérifie si l'utilisateur est un réservant
    isReservant(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'reservant';
    }
}

