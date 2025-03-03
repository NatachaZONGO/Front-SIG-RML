import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackendURL } from '../../const';

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    private apiUrl = `${BackendURL}statistiques`; 

    constructor(private http: HttpClient) {}

    getStats(): Observable<any> {
        return this.http.get<any>(this.apiUrl);
    }
}