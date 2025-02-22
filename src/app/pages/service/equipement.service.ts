import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Laboratoire, Laboratoireservice } from './laboratoire.service';
import { BackendURL } from '../../const';

export interface Equipement {
    _id?: string; 
    name?: string;
    description?: string;
    estDisponible?: boolean;
    estMutualisable?: boolean;
    etat?: string;
    acquereur?: string;
    typeAcquisition?: string;
    createAt?: Date;
    updateAt?: Date;
    photo?: string;
    laboratoryId?: string;
    laboratoire?: Laboratoire;
    contacts?: string[];
    image?: string;
}

@Injectable({
    providedIn: 'root', // Le service est fourni au niveau racine
})
export class Equipementservice {
    private apiUrl = `${BackendURL}/equipment`;
    

    constructor(private http: HttpClient, private laboratoireService: Laboratoireservice) {}

    // Récupérer tous les équipements
    getEquipements(): Observable<Equipement[]> {
        return this.http.get<{ content: Equipement[] }>(`${this.apiUrl}/all`).pipe(
            map((response) => response.content), 
            catchError((err) => {
                console.error('Erreur lors de la récupération des équipements', err);
                return of([]); 
            })
        );
    }

    // Récupérer un équipement par son ID
    getEquipementById(id: string): Observable<Equipement> {
        return this.http.get<Equipement>(`${this.apiUrl}/${id}`).pipe(
            catchError((err) => {
                console.error('Erreur lors de la récupération de l\'équipement', err);
                throw err; 
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


    // Récupérer tous les équipements avec les laboratoires associés
    getEquipementsWithLaboratoires(): Observable<Equipement[]> {
        return forkJoin({
            equipements: this.getEquipements(),
            laboratoires: this.laboratoireService.getLaboratoires(), // Récupère tous les laboratoires
        }).pipe(
            map(({ equipements, laboratoires }) => {
                // Associe chaque équipement à son laboratoire
                return equipements.map((equipement) => {
                    const labo = laboratoires.find((l) => l._id === equipement.laboratoryId); // Utilisez laboratoryId
                    return { ...equipement, laboratoire: labo }; // Ajoute le laboratoire à l'équipement
                });
            }),
            catchError((err) => {
                console.error('Erreur lors de la récupération des équipements avec laboratoires', err);
                return of([]);
            })
        );
    }

    getEquipementsByLaboratoire(laboratoryId: string): Observable<Equipement[]> {
        return this.http.get<{ content: Equipement[] }>(`${this.apiUrl}/equipment/labo/${laboratoryId}`).pipe(
            map((response) => response.content),
            catchError((err) => {
                console.error('Erreur lors de la récupération des équipements par laboratoire', err);
                return of([]);
            })
        );
    }
    
}