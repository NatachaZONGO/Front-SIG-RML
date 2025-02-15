import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Equipement {
    _id?: string; // Utilisation de _id pour correspondre à MongoDB
    name?: string;
    description?: string;
    estDisponible?: boolean;
    estMutualisable?: boolean;
    etat?: string;
    acquereur?: string;
    typeAcquisition?: string;
    dateAjout?: Date;
    dateModification?: Date;
    photo?: string;
    laboratoire?: string;
    contacts?: string[];
}

@Injectable({
    providedIn: 'root', // Le service est fourni au niveau racine
})
export class Equipementservice {
    private apiUrl = 'http://102.211.121.54:8080/node_ts/api/V0.1/equipements'; // URL de l'API

    constructor(private http: HttpClient) {}

    // Récupérer tous les équipements
    getEquipements(): Observable<Equipement[]> {
        return this.http.get<{ data: Equipement[] }>(this.apiUrl).pipe(
            map((response) => response.data), // Extrait le tableau `data` de la réponse
            catchError((err) => {
                console.error('Erreur lors de la récupération des équipements', err);
                return of([]); // Retourne un tableau vide en cas d'erreur
            })
        );
    }

    // Récupérer un équipement par son ID
    getEquipementById(id: string): Observable<Equipement> {
        return this.http.get<Equipement>(`${this.apiUrl}/${id}`).pipe(
            catchError((err) => {
                console.error('Erreur lors de la récupération de l\'équipement', err);
                throw err; // Relance l'erreur pour la gérer dans le composant
            })
        );
    }

    // Créer un nouvel équipement
    createEquipement(equipement: Equipement): Observable<Equipement> {
        return this.http.post<Equipement>(this.apiUrl, equipement).pipe(
            catchError((err) => {
                console.error('Erreur lors de la création de l\'équipement', err);
                throw err; // Relance l'erreur pour la gérer dans le composant
            })
        );
    }

    // Mettre à jour un équipement existant
    updateEquipement(equipement: Equipement): Observable<Equipement> {
        return this.http.put<Equipement>(`${this.apiUrl}/${equipement._id}`, equipement).pipe(
            catchError((err) => {
                console.error('Erreur lors de la mise à jour de l\'équipement', err);
                throw err; // Relance l'erreur pour la gérer dans le composant
            })
        );
    }

    // Supprimer un équipement
    deleteEquipement(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            catchError((err) => {
                console.error('Erreur lors de la suppression de l\'équipement', err);
                throw err; // Relance l'erreur pour la gérer dans le composant
            })
        );
    }

    // Récupérer les équipements disponibles
    getEquipementsDisponibles(): Observable<Equipement[]> {
        return this.http.get<{ data: Equipement[] }>(`${this.apiUrl}?estDisponible=true`).pipe(
            map((response) => response.data), // Extrait le tableau `data` de la réponse
            catchError((err) => {
                console.error('Erreur lors de la récupération des équipements disponibles', err);
                return of([]); // Retourne un tableau vide en cas d'erreur
            })
        );
    }
}