import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BackendURL, LocalStorageFields, imageUrl } from '../../../Share/const'; // ✅ imageUrl ajouté
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

  // ✅ Headers JSON (pour GET, DELETE)
  private get httpOptions() {
    const token = localStorage.getItem(LocalStorageFields.accessToken) ?? '';
    return {
      headers: new HttpHeaders({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      })
    };
  }

  // ✅ Headers FormData (pour POST/PUT avec image — PAS de Content-Type)
  private get headersFormData() {
    const token = localStorage.getItem(LocalStorageFields.accessToken) ?? '';
    return new HttpHeaders({
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  constructor(private http: HttpClient) {}

  /** Liste paginée */
  getConseils(page?: number, size?: number): Observable<ApiResponse<Conseil[]>> {
    let params = new HttpParams();
    if (page != null) params = params.set('page', String(page));
    if (size != null) params = params.set('per_page', String(size));

    return this.http.get<any>(this.apiUrl, { params, headers: this.httpOptions.headers }).pipe(
      map((resp) => this.toApiResponse(resp)),
      catchError(this.handleError),
    );
  }

  /** Détail par ID */
  getConseilById(id: number): Observable<Conseil> {
    if (id == null) return throwError(() => new Error('ID conseil requis'));
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.httpOptions).pipe(
      map((c) => this.mapConseil(c?.data ?? c)),
      catchError(this.handleError),
    );
  }

  /** ✅ Création avec image optionnelle */
  createConseil(conseil: Conseil, imageFile?: File | null): Observable<Conseil> {
    const fd = this.buildFormData(conseil, imageFile);
    return this.http.post<any>(this.apiUrl, fd, { headers: this.headersFormData }).pipe(
      map((c) => this.mapConseil(c?.data ?? c)),
      catchError(this.handleError),
    );
  }

  /** ✅ Mise à jour avec image optionnelle */
  updateConseil(conseil: Conseil, imageFile?: File | null): Observable<Conseil> {
    if (conseil.id == null) return throwError(() => new Error('ID conseil requis pour la mise à jour'));
    const fd = this.buildFormData(conseil, imageFile);
    fd.append('_method', 'PUT'); // ✅ Laravel method spoofing
    return this.http.post<any>(`${this.apiUrl}/${conseil.id}`, fd, { headers: this.headersFormData }).pipe(
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

  /** ✅ Construction du FormData avec image optionnelle */
private buildFormData(conseil: Conseil, imageFile?: File | null): FormData {
  const fd = new FormData();
  fd.append('titre',        (conseil.titre        ?? '').trim());
  fd.append('contenu',      (conseil.contenu      ?? '').trim());
  fd.append('categorie',    conseil.categorie     ?? '');
  fd.append('type_conseil', conseil.type_conseil  ?? 'article');
  fd.append('niveau',       conseil.niveau        ?? 'debutant');
  fd.append('statut',       conseil.statut        ?? 'brouillon');
  fd.append('tags',         conseil.tags          ?? '');
  fd.append('auteur',       conseil.auteur        ?? '');

  // ✅ Format YYYY-MM-DD attendu par Laravel
  if (conseil.date_publication) {
    const date = new Date(conseil.date_publication);
    if (!isNaN(date.getTime())) {
      fd.append('date_publication', date.toISOString().split('T')[0]);
    }
  }

  if (imageFile) fd.append('image', imageFile);
  return fd;
}

/** ✅ Mappe un item brut → Conseil avec image */
  private mapConseil(c: any): Conseil {
    if (!c) return {};
    return {
      id:               c.id != null ? Number(c.id) : undefined,
      titre:            c.titre ?? '',
      contenu:          c.contenu ?? '',
      categorie:        c.categorie ?? 'general',
      type_conseil:     c.type_conseil ?? 'article',
      niveau:           c.niveau ?? 'debutant',
      statut:           c.statut ?? (c.date_publication ? 'publie' : 'brouillon'),
      tags:             c.tags ?? '',
      auteur:           c.auteur ?? '',
      vues:             c.vues ?? 0,
      date_publication: c.date_publication ?? null,
      date_creation:    c.created_at ?? null,
      date_modification:c.updated_at ?? null,
      image: c.image ? `${imageUrl}${c.image}` : null, // ✅ NOUVEAU
    };
  }

  /** Transforme la réponse Laravel paginée → ApiResponse<Conseil[]> */
  private toApiResponse(resp: any): ApiResponse<Conseil[]> {
    const page = resp?.data;
    const rawList: any[] =
      (Array.isArray(page?.data) && page.data) ||
      (Array.isArray(resp?.data) && resp.data) ||
      (Array.isArray(resp) && resp) ||
      [];

    const content = rawList.map((c) => this.mapConseil(c));
    return {
      content,
      success:       resp?.success,
      message:       resp?.message,
      totalElements: page?.total,
      totalPages:    page?.last_page,
      size:          page?.per_page,
      number:        page?.current_page,
    };
  }

  /** Gestion d'erreur */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
  let msg = 'Une erreur est survenue';
  if (error.error instanceof ErrorEvent) {
    msg = `Erreur client: ${error.error.message}`;
  } else {
    // ✅ Affiche les erreurs de validation Laravel
    if (error.status === 422 && error.error?.errors) {
      console.error('❌ Erreurs de validation:', error.error.errors);
      const firstError = Object.values(error.error.errors)[0] as string[];
      msg = firstError?.[0] || 'Erreur de validation';
    } else {
      msg = error.error?.message || error.message || `Erreur HTTP ${error.status}`;
    }
  }
  console.error('Erreur API Conseil:', error);
  return throwError(() => new Error(msg));
};
}