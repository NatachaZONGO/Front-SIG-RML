import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { Candidature } from './candidature.model';
import { BackendURL } from '../../../Share/const';
import { AuthService } from '../../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class CandidatureService {
  private readonly baseUrl = `${BackendURL}candidatures`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ================== UTILS ==================

  /** Récupère le token depuis AuthService ou localStorage */
  private getToken(): string | null {
    const svc: any = this.authService as any;
    return (
      (typeof svc.getToken === 'function' ? svc.getToken() : undefined) ??
      svc.accessToken ??
      localStorage.getItem('access_token') ??
      localStorage.getItem('accessToken') ??
      null
    );
  }

  /** Construit les headers avec Authorization */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    const headers: any = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(headers);
  }

  // ================== LECTURE ==================

  /** Liste (option: filtre offre_id côté backend si tu veux). */
  getAll(params?: { offre_id?: number | string }): Observable<Candidature[]> {
    let p = new HttpParams();
    if (params?.offre_id != null) p = p.set('offre_id', String(params.offre_id));
    const headers = this.getAuthHeaders(); // <-- important
    return this.http.get<any>(this.baseUrl, { params: p, headers }).pipe(
      map(r => r?.data ?? r ?? []),
      catchError(() => of([]))
    );
  }

  /**
   * Candidatures du candidat connecté (token obligatoire)
   * → Le backend récupère le candidat via le token Sanctum
   */
  getMine(): Observable<any[]> {
    const headers = this.getAuthHeaders();

    if (!headers.get('Authorization')) {
      return throwError(() => ({
        status: 401,
        message: 'Utilisateur non authentifié (token manquant)'
      }));
    }

    return this.http.get<any>(`${this.baseUrl}/mes-candidatures`, { headers }).pipe(
      map(r => r?.data ?? r ?? []),
      catchError(e => {
        console.error('Erreur getMine:', e);
        return throwError(() => ({
          status: e.status || 500,
          message: e.error?.message || 'Erreur lors du chargement des candidatures'
        }));
      })
    );
  }

  /** Par offre */
 getByOffre(offreId: number): Observable<Candidature[]> {
    const headers = this.getAuthHeaders(); // <-- important
    return this.http.get<any>(`${BackendURL}candidatures?offre_id=${offreId}`, { headers }).pipe(
      map(response => response?.data ?? response ?? []),
      catchError(() => of([]))
    );
  }

  /** Détail */
  getOne(id: number): Observable<Candidature> {
    const headers = this.getAuthHeaders();
    return this.http.get<Candidature>(`${this.baseUrl}/${id}`, { headers });
  }

  /** Offres light pour dropdown */
  getOffresLight(): Observable<{ id: number; titre: string }[]> {
    return this.http.get<any>(`${BackendURL}offres`).pipe(
      map(response => {
        let offres: any[] = [];
        if (Array.isArray(response)) offres = response;
        else if (response?.data?.data) offres = response.data.data;
        else if (response?.data) offres = response.data;
        return (offres || []).map((o: any) => ({ id: o.id, titre: o.titre }));
      }),
      catchError(() => of([]))
    );
  }

  // ================== CRÉATION / MÀJ ==================

  /** Création (candidat connecté) */
  create(fd: FormData): Observable<Candidature> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.baseUrl, fd, { headers }).pipe(
      map(resp => resp?.data ?? resp),
      catchError(e => throwError(() => e))
    );
  }

  /** Création invité (sans compte) */
  createGuest(fd: FormData): Observable<Candidature> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.post<any>(`${this.baseUrl}/guest`, fd, { headers }).pipe(
      map(resp => resp?.data ?? resp),
      catchError(e => throwError(() => e))
    );
  }

  /** Màj statut */
  updateStatut(id: number, statut: string, motif?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body: { statut: string; motif_refus?: string } = { statut };
    if (motif) body.motif_refus = motif;
    return this.http.put(`${this.baseUrl}/${id}/statut`, body, { headers });
  }

  /** Suppression */
  delete(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.baseUrl}/${id}`, { headers });
  }

  // ================== SUIVI ==================

  findByCode(code: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/suivi/${code}`).pipe(
      map((response: any) => {
        if (response.success && response.data) {
          const d = response.data;
          return {
            id: d.id,
            code: d.code_suivi,
            fullName: `${d.candidat?.prenom ?? ''} ${d.candidat?.nom ?? ''}`.trim(),
            email: d.candidat?.email || '',
            telephone: d.candidat?.telephone || '',
            offreTitre: d.offre?.titre,
            entreprise: d.offre?.entreprise,
            lieu: d.offre?.lieu,
            type_contrat: d.offre?.type_contrat,
            statut: d.statut,
            message_statut: d.message_statut,
            created_at: d.date_candidature,
            updated_at: d.date_mise_a_jour,
          };
        }
        throw new Error('Format de réponse invalide');
      }),
      catchError((error) => throwError(() => ({
        message: error.error?.message || 'Erreur lors de la recherche de candidature',
        status: error.status
      })))
    );
  }

  resendEmail(codesuivi: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<any>(`${this.baseUrl}/renvoyer-email`, { code_suivi: codesuivi }, { headers }).pipe(
      map((resp) => {
        if (resp?.success) return { success: true, message: resp.message || 'Email envoyé avec succès' };
        throw new Error(resp?.message || 'Erreur lors de l’envoi de l’email');
      }),
      catchError((error) => throwError(() => ({
        message: error.error?.message || 'Impossible d\'envoyer l\'email',
        status: error.status
      })))
    );
  }

  downloadCVById(candidatureId: number): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.baseUrl}/${candidatureId}/download/cv`, { headers, responseType: 'blob' });
  }

  downloadLMById(candidatureId: number): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.baseUrl}/${candidatureId}/download/lm`, { headers, responseType: 'blob' });
  }

  /** Selon le rôle connecté */
  getCandidaturesByRole(): Observable<any> {
    const headers = this.getAuthHeaders();

    if ((this.authService as any)?.hasRole?.('Administrateur') || (this.authService as any)?.hasRole?.('admin')) {
      return this.http.get(`${this.baseUrl}`, { headers }).pipe(map((r: any) => r?.data ?? r ?? []));
    }
    if ((this.authService as any)?.hasRole?.('Candidat') || (this.authService as any)?.hasRole?.('candidat')) {
      return this.getMine();
    }
    if ((this.authService as any)?.hasRole?.('Recruteur') || (this.authService as any)?.hasRole?.('recruteur')) {
      return this.http.get(`${this.baseUrl}/recues`, { headers }).pipe(map((r: any) => r?.data ?? r ?? []));
    }

    return of({ success: false, data: [], message: 'Accès non autorisé' });
  }
}
