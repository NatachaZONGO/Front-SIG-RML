import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BackendURL } from '../../../Share/const';
import { Conseil } from './conseil.model';

export interface ApiResponse<T> {
  content: T;
  success?: boolean;
  message?: string;
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
}

@Injectable({ providedIn: 'root' })
export class ConseilService {
  private readonly apiUrl = `${BackendURL}conseils`;

  private readonly httpOptions = {
    headers: new HttpHeaders({
      // IMPORTANT: force la réponse JSON côté Laravel
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }),
  };

  constructor(private http: HttpClient) {}

  /** Liste paginée → renvoie ApiResponse<Conseil[]> avec content = tableau mappé */
  getConseils(page?: number, size?: number): Observable<ApiResponse<Conseil[]>> {
    let params = new HttpParams();
    if (page != null) params = params.set('page', String(page));
    if (size != null) params = params.set('per_page', String(size)); // Laravel comprend per_page

    return this.http.get<any>(this.apiUrl, { params, headers: this.httpOptions.headers }).pipe(
      map((resp) => this.toApiResponse(resp)),
      catchError(this.handleError),
    );
  }

  /** Détail par ID */
  getConseilById(id: number): Observable<Conseil> {
    if (id == null) return throwError(() => new Error('ID conseil requis'));
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.httpOptions).pipe(
      map((c) => this.mapConseil(c?.data ?? c)), // tolère {data: {...}} ou {...}
      catchError(this.handleError),
    );
  }

  /** Création */
  createConseil(conseil: Conseil): Observable<Conseil> {
    const payload = this.serialize(conseil);
    return this.http.post<any>(this.apiUrl, payload, this.httpOptions).pipe(
      map((c) => this.mapConseil(c?.data ?? c)),
      catchError(this.handleError),
    );
  }

  /** Mise à jour */
  updateConseil(conseil: Conseil): Observable<Conseil> {
    if (conseil.id == null) return throwError(() => new Error('ID conseil requis pour la mise à jour'));
    const payload = this.serialize(conseil);
    return this.http.put<any>(`${this.apiUrl}/${conseil.id}`, payload, this.httpOptions).pipe(
      map((c) => this.mapConseil(c?.data ?? c)),
      catchError(this.handleError),
    );
  }

  /** Suppression */
  deleteConseil(id: number): Observable<void> {
    if (id == null) return throwError(() => new Error('ID conseil requis'));
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.httpOptions).pipe(
      catchError(this.handleError),
    );
  }

  // ----------------- Helpers -----------------

  /** Mappe un item brut → Conseil (valeurs par défaut si champs manquants) */
  private mapConseil(c: any): Conseil {
    if (!c) return {};
    return {
      id: c.id != null ? Number(c.id) : undefined,
      titre: c.titre ?? '',
      contenu: c.contenu ?? '',
      // Ces champs ne sont pas dans ta réponse actuelle, on met des défauts inoffensifs :
      categorie: c.categorie ?? 'general',
      type_conseil: c.type_conseil ?? 'article',
      niveau: c.niveau ?? 'debutant',
      statut: c.statut ?? (c.date_publication ? 'publie' : 'brouillon'),
      tags: c.tags ?? '',
      auteur: c.auteur ?? '',
      vues: c.vues ?? 0,
      date_publication: c.date_publication ?? null,
      date_creation: c.created_at ?? null,
      date_modification: c.updated_at ?? null,
    };
  }

  /** Transforme la réponse Laravel paginée → ApiResponse<Conseil[]> */
  private toApiResponse(resp: any): ApiResponse<Conseil[]> {
    const page = resp?.data; // pagination Laravel: { current_page, data, ... }
    const rawList: any[] =
      (Array.isArray(page?.data) && page.data) ||
      (Array.isArray(resp?.data) && resp.data) ||
      (Array.isArray(resp) && resp) ||
      [];

    const content = rawList.map((c) => this.mapConseil(c));
    return {
      content,
      success: resp?.success,
      message: resp?.message,
      totalElements: page?.total,
      totalPages: page?.last_page,
      size: page?.per_page,
      number: page?.current_page,
    };
  }

  /** Nettoyage minimal des données à envoyer (évite d’envoyer des champs inutiles) */
  private serialize(conseil: Conseil): any {
    const out: any = {};
    if (conseil.titre) out.titre = conseil.titre.trim();
    if (conseil.contenu) out.contenu = conseil.contenu.trim();
    if (conseil.categorie) out.categorie = conseil.categorie;
    if (conseil.type_conseil) out.type_conseil = conseil.type_conseil;
    if (conseil.niveau) out.niveau = conseil.niveau;
    if (conseil.statut) out.statut = conseil.statut;
    if (conseil.tags) out.tags = conseil.tags;
    if (conseil.auteur) out.auteur = conseil.auteur;
    if (conseil.date_publication) out.date_publication = conseil.date_publication;
    return out;
  }

  /** Gestion d’erreur simple et claire */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let msg = 'Une erreur est survenue';
    if (error.error instanceof ErrorEvent) {
      msg = `Erreur client: ${error.error.message}`;
    } else {
      msg = error.error?.message || error.message || `Erreur HTTP ${error.status}`;
    }
    console.error('Erreur API Conseil:', error);
    return throwError(() => new Error(msg));
  };
}
