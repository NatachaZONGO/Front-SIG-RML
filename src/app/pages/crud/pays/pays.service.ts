// pays.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendURL } from '../../../Share/const';
import { Pays } from './pays.model';

@Injectable({
  providedIn: 'root'
})
export class PaysService {
    private apiUrl = `${BackendURL}pays`; 

    constructor(private http: HttpClient) {}

    getPays() {
    return this.http.get<{ success: boolean; data: Pays[] }>(this.apiUrl);
   }
    getPaysById(id: string): Observable<Pays> {
        return this.http.get<Pays>(`${this.apiUrl}/${id}`);
    }

    createPays(fd: FormData) {
        return this.http.post<{success:boolean; data:Pays}>(this.apiUrl, fd);
    }
    
    updatePays(id: string, fd: FormData) {
        return this.http.post<{success:boolean; data:Pays}>(`${this.apiUrl}/${id}`, fd); // spoof
    }

    deletePays(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}