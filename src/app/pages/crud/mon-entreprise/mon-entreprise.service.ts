// mon-entreprise.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BackendURL } from '../../../Share/const';
import { AuthService } from '../../auth/auth.service';
import { Entreprise } from '../entreprise/entreprise.model';

interface EntrepriseStats {
  total_offres: number;
  offres_actives: number;
  offres_brouillon: number;
  total_publicites: number;
  publicites_actives: number;
  candidatures_recues: number;
}

@Injectable({
  providedIn: 'root'
})
export class MonEntrepriseService {
  private apiUrl = `${BackendURL}mon-entreprise`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Récupérer les informations de mon entreprise
  getMonEntreprise(): Observable<Entreprise> {
    console.log('📡 Appel getMonEntreprise()');
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('📦 Réponse getMonEntreprise:', res);
        return res?.data || res;
      })
    );
  }

  // Récupérer les statistiques de mon entreprise
  getStatistiques(): Observable<EntrepriseStats> {
    console.log('📡 Appel getStatistiques()');
    return this.http.get<any>(`${this.apiUrl}/stats`, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('📦 Réponse stats:', res);
        return res?.data || res;
      })
    );
  }

  // Mettre à jour mon entreprise
  updateMonEntreprise(data: Partial<Entreprise>): Observable<Entreprise> {
    return this.http.put<any>(this.apiUrl, data, { headers: this.getHeaders() }).pipe(
      map(res => res?.data || res)
    );
  }

  // Upload logo
  uploadLogo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('logo', file);
    
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
    
    return this.http.post(`${this.apiUrl}/logo`, formData, { headers });
  }
}