import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BackendURL } from '../../../const';


/*export interface Ufr {
    id?: string;
    name?: string;
    intitule?: string;
    description?: string;
    dateAjout?: Date;
    dateModification?: Date; 
}*/

export interface Ufr {
    _id?: string;
    name?: string;
    description?: string;
    createdAt?: Date; 
    updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class Ufrservice {
    private apiUrl = `${BackendURL}/ufr`; // Remplacez par l'URL de votre API

    constructor(private http: HttpClient) {}

    getUfrs(): Observable<Ufr[]> {
        return this.http.get<{ content: Ufr[] }>(`${this.apiUrl}/all`).pipe(
            map(response => response.content) // Extrait la propriété `content`
        );
    }

    getUfrById(id: string): Observable<Ufr> {
        return this.http.get<Ufr>(`${this.apiUrl}/${id}`);
    }

    createUfr(ufr: Ufr): Observable<Ufr> {
        return this.http.post<Ufr>(`${this.apiUrl}/ufr`, ufr);
    }
    
    updateUfr(ufr: Ufr): Observable<Ufr> {
        return this.http.put<Ufr>(`${this.apiUrl}/ufr/${ufr._id}`, ufr);
    }

    deleteUfr(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/ufr/${id}`);
    }
}