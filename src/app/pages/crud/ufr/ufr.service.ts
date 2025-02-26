import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BackendURL } from '../../../const';
import { Ufr } from './ufr.model';


/*export interface Ufr {
    id?: string;
    name?: string;
    description?: string;
    dateAjout?: Date;
    dateModification?: Date; 
}*/


@Injectable({
  providedIn: 'root'
})
export class Ufrservice {
    private apiUrl = `${BackendURL}ufrs`; // Remplacez par l'URL de votre API

    constructor(private http: HttpClient) {}

    getUfrs(): Observable<{ content: Ufr[] }> {
        return this.http.get<{ content: Ufr[] }>(this.apiUrl);
    }

    getUfrById(id: string): Observable<Ufr> {
        return this.http.get<Ufr>(`${this.apiUrl}/${id}`);
    }

    createUfr(ufr: Ufr): Observable<Ufr> {
        return this.http.post<Ufr>(`${this.apiUrl}/ufr`, ufr);
    }
    
    updateUfr(ufr: Ufr): Observable<Ufr> {
        return this.http.put<Ufr>(`${this.apiUrl}/ufr/${ufr.id}`, ufr);
    }

    deleteUfr(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/ufr/${id}`);
    }
}