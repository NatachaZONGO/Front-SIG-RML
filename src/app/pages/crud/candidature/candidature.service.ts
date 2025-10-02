import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { Candidature } from './candidature.model';
import { BackendURL } from '../../../const';

@Injectable({ providedIn: 'root' })
export class CandidatureService {
  private readonly baseUrl = `${BackendURL}candidatures`;

  constructor(private http: HttpClient) {}

  // Tous (optionnellement filtré par offre_id côté backend si tu veux)
  getAll(params?: { offre_id?: number | string }): Observable<Candidature[]> {
    let p = new HttpParams();
    if (params?.offre_id != null) p = p.set('offre_id', String(params.offre_id));
    return this.http.get<Candidature[]>(this.baseUrl, { params: p });
  }

  /** Création de candidature (utilisateur connecté : le backend récupère le candidat via le token) */
  create(fd: FormData): Observable<Candidature> {
    // Ne PAS fixer Content-Type ici (FormData), juste Accept
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.post<any>(this.baseUrl, fd, { headers }).pipe(
      map(resp => resp?.data ?? resp)
    );
  }

  /** Création de candidature côté invité (sans compte) */
  createGuest(fd: FormData): Observable<Candidature> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    // Adapte l'URL si ton backend diffère (ex: `${this.baseUrl}/apply` ou un autre endpoint)
    return this.http.post<any>(`${this.baseUrl}/guest`, fd, { headers }).pipe(
      map(resp => resp?.data ?? resp)
    );
  }

  // Par offre
  getByOffre(offreId: number): Observable<Candidature[]> {
    return this.http.get<any>(`${BackendURL}candidatures?offre_id=${offreId}`).pipe(
      map(response => response.data || response || [])
    );
  }

  // Détail (si besoin de recharger)
  getOne(id: number): Observable<Candidature> {
    return this.http.get<Candidature>(`${this.baseUrl}/${id}`);
  }

  // Pour le filtre dropdown
  // Alternative plus fiable
  getOffresLight(): Observable<{id:number; titre:string}[]> {
    return this.http.get<any>(`${BackendURL}offres`).pipe(
      map(response => {
        console.log('Réponse API offres:', response); // Debug
        
        // Extraire le tableau selon la structure de l'API
        let offres = [];
        if (Array.isArray(response)) {
          offres = response;
        } else if (response?.data?.data) {
          offres = response.data.data; // Structure Laravel paginée
        } else if (response?.data) {
          offres = response.data;
        } else {
          offres = [];
        }
        
        console.log('Offres extraites:', offres); // Debug
        
        // Mapper vers le format attendu
        return offres.map((offre: any) => ({
          id: offre.id,
          titre: offre.titre
        }));
      }),
      // Gérer les erreurs
      catchError(error => {
        console.error('Erreur API offres:', error);
        return of([]); // Retourner tableau vide en cas d'erreur
      })
    );
  }

  // Télécharger le CV
  downloadCV(candidatureId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${candidatureId}/cv`, {
      responseType: 'blob'
    });
  }

  // Dans candidature.service.ts
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  updateStatut(id: number, statut: string, motif?: string): Observable<any> {
    const body: { statut: string; motif_refus?: string } = { statut };
    if (motif) {
      body.motif_refus = motif;
    }
    return this.http.put(`${this.baseUrl}/${id}/statut`, body);
  }

  // ========== NOUVELLES MÉTHODES POUR LE SUIVI ==========

  /**
   * Recherche une candidature par son code de suivi
   */
  findByCode(code: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/suivi/${code}`).pipe(
      map((response: any) => {
        console.log('Réponse API findByCode:', response); // Debug
        
        if (response.success && response.data) {
          // Adapter la réponse du backend au format attendu par le frontend
          const data = response.data;
          return {
            id: data.id,
            code: data.code_suivi,
            fullName: `${data.candidat.prenom} ${data.candidat.nom}`,
            email: data.candidat.email || '',
            telephone: data.candidat.telephone || '',
            offreTitre: data.offre.titre,
            entreprise: data.offre.entreprise,
            lieu: data.offre.lieu,
            type_contrat: data.offre.type_contrat,
            statut: data.statut,
            message_statut: data.message_statut,
            created_at: data.date_candidature,
            updated_at: data.date_mise_a_jour,
            motivationText: data.lettre_motivation || null,
            cv_dl: data.cv_url,
            lm_dl: data.lm_url,
            // Données complètes
            offre: data.offre,
            candidat: data.candidat,
            dateExamen: data.date_examen || null,
            dateEntretien: data.date_entretien || null,
            dateDecision: data.date_decision || null
          };
        }
        throw new Error('Format de réponse invalide');
      }),
      catchError((error) => {
        console.error('Erreur lors de la recherche de candidature:', error);
        
        // Gérer les différents types d'erreurs
        if (error.status === 404) {
          throw {
            message: 'Aucune candidature trouvée avec ce code.',
            code: 'NOT_FOUND',
            status: 404
          };
        } else if (error.status === 400) {
          throw {
            message: 'Format de code invalide. Le code doit être au format CAND-ANNÉE-XXXXXX',
            code: 'INVALID_FORMAT',
            status: 400
          };
        } else if (error.status === 0) {
          throw {
            message: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
            code: 'NETWORK_ERROR',
            status: 0
          };
        } else {
          throw {
            message: error.error?.message || 'Une erreur est survenue. Veuillez réessayer.',
            code: 'SERVER_ERROR',
            status: error.status
          };
        }
      })
    );
  }

  /**
   * Renvoie l'email de confirmation avec le code de suivi
   */
  resendEmail(codesuivi: string): Observable<any> {
    const headers = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Accept': 'application/json' 
    });
    
    return this.http.post<any>(`${this.baseUrl}/renvoyer-email`, {
      code_suivi: codesuivi
    }, { headers }).pipe(
      map((response: any) => {
        console.log('Réponse renvoi email:', response); // Debug
        
        if (response.success) {
          return {
            success: true,
            message: response.message || 'Email envoyé avec succès'
          };
        }
        throw new Error(response.message || 'Erreur lors de l\'envoi de l\'email');
      }),
      catchError((error) => {
        console.error('Erreur lors du renvoi de l\'email:', error);
        throw {
          message: error.error?.message || 'Impossible d\'envoyer l\'email',
          code: 'EMAIL_ERROR',
          status: error.status
        };
      })
    );
  }

  /**
   * Télécharge le CV par l'ID de candidature
   */
  downloadCVById(candidatureId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${candidatureId}/download/cv`, {
      responseType: 'blob'
    }).pipe(
      catchError((error) => {
        console.error('Erreur téléchargement CV:', error);
        throw new Error('Impossible de télécharger le CV');
      })
    );
  }

  /**
   * Télécharge la lettre de motivation par l'ID de candidature
   */
  downloadLMById(candidatureId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${candidatureId}/download/lm`, {
      responseType: 'blob'
    }).pipe(
      catchError((error) => {
        console.error('Erreur téléchargement LM:', error);
        throw new Error('Impossible de télécharger la lettre de motivation');
      })
    );
  }
}