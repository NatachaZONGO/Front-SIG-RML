// role.service.ts - Corrigé pour votre structure d'API
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BackendURL } from '../../../Share/const';

export interface Role {
  id?: number; // Changé en number selon votre réponse API
  nom?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private apiUrl = `${BackendURL}roles`; // URL de l'API pour les rôles 

  constructor(private http: HttpClient) {}

  getRoles(): Observable<Role[]> {
    return this.http.get<{ success: boolean; data: Role[] }>(this.apiUrl).pipe(
      map(response => {
        console.log('Réponse API roles:', response);
        return response.data || [];
      })
    );
  }

  getRoleById(id: number): Observable<Role> {
    return this.http.get<{ success: boolean; data: Role }>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createRole(role: Role): Observable<Role> {
    return this.http.post<{ success: boolean; data: Role }>(`${this.apiUrl}`, role).pipe(
      map(response => response.data)
    );
  }

  updateRole(role: Role): Observable<Role> {
    return this.http.put<{ success: boolean; data: Role }>(`${this.apiUrl}/${role.id}`, role).pipe(
      map(response => response.data)
    );
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}