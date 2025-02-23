import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BackendURL } from '../../../const';

export interface Laboratoire {
    _id?: string;
    name?: string;
    description?: string;
    updatedAt?: Date;
    createdAt?: Date; 
}

@Injectable({
    providedIn: 'root'
})
export class Laboratoireservice {
    private apiUrl = `${BackendURL}/laboratory`; 

    constructor(private http: HttpClient) {}

    getLaboratoires(): Observable<Laboratoire[]> {
            return this.http.get<{ content: Laboratoire[] }>(`${this.apiUrl}/all`).pipe(
                map(response => response.content) 
            );
        }

    createLaboratoire(laboratoire: Laboratoire): Observable<Laboratoire> {
        return this.http.post<Laboratoire>(`${this.apiUrl}/laboratory` , laboratoire);
    }

    updateLaboratoire(laboratoire: Laboratoire): Observable<Laboratoire> {
        return this.http.put<Laboratoire>(`${this.apiUrl}/laboratory/${laboratoire._id}`, laboratoire);
    }

    deleteLaboratoire(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/laboratory/${id}`);
    }
}