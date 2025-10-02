import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BackendURL } from '../../../const';
import { Cateorie } from './categorie.model';


@Injectable({
  providedIn: 'root'
})
export class CategorieService {
    private apiUrl = `${BackendURL}categories/`; // URL de l'API pour les catégories

    constructor(private http: HttpClient) {}

    getCategories(): Observable<{ content: Cateorie[] }> {
        return this.http.get<{ content: Cateorie[] }>(this.apiUrl);
    }

    getCategorieById(id: string): Observable<Cateorie> {
        return this.http.get<Cateorie>(`${this.apiUrl}${id}`);
    }

    createCategorie(categorie: Cateorie): Observable<Cateorie> {
        return this.http.post<Cateorie>(`${this.apiUrl}`, categorie);
    }
    
    updateCategorie(categorie: Cateorie): Observable<Cateorie> {
        return this.http.put<Cateorie>(`${this.apiUrl}${categorie.id}`, categorie);
    }

    deleteCategorie(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}${id}`);
    }
}