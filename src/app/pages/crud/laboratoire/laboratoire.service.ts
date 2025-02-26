import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BackendURL } from '../../../const';
import { Laboratoire } from './laboratoire.model';



@Injectable({
    providedIn: 'root'
})
export class Laboratoireservice {
    private apiUrl = `${BackendURL}laboratoires`; 

    constructor(private http: HttpClient) {}

    getLaboratoires(): Observable<{ content: Laboratoire[] }> {
        return this.http.get<{ content: Laboratoire[] }>(this.apiUrl);
    }
    

    createLaboratoire(laboratoire: Laboratoire): Observable<Laboratoire> {
        return this.http.post<Laboratoire>(`${this.apiUrl}` , laboratoire);
    }

    updateLaboratoire(laboratoire: Laboratoire): Observable<Laboratoire> {
        return this.http.put<Laboratoire>(`${this.apiUrl}/${laboratoire.id}`, laboratoire);
    }

    deleteLaboratoire(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}