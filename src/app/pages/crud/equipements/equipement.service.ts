import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BackendURL } from '../../../const';
import { Laboratoireservice } from '../laboratoire/laboratoire.service';
import { Equipement } from './equipement.model';




@Injectable({
    providedIn: 'root',
})
export class Equipementservice {
    private apiUrl = `${BackendURL}equipements`;


    constructor(private http: HttpClient, private Laboratoireservice: Laboratoireservice) {}

    // Récupérer tous les équipements
    getEquipements(): Observable<Equipement[]> {
        return this.http.get<{ content: Equipement[] }>(`${this.apiUrl}`).pipe(
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
    createEquipement(formData: FormData): Observable<Equipement> {
        return this.http.post<Equipement>(this.apiUrl, formData, { headers: {} }).pipe(
            catchError((err) => {
                console.error('Erreur lors de la création de l\'équipement', err);
                throw err;
            })
        );
    }

    updateEquipement(id: string, formData: FormData): Observable<Equipement> {
        return this.http.post<Equipement>(this.apiUrl + '/' + id, formData, { headers: {} }).pipe(
            catchError((err) => {
                console.error('Erreur lors de la mise à jour de l\'équipement', err);
                throw err;
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
            laboratoires: this.Laboratoireservice.getLaboratoires(), // Récupère tous les laboratoires
        }).pipe(
            map(({ equipements, laboratoires }) => {
                // Associe chaque équipement à son laboratoire
                return equipements.map((equipement) => {
                    const labo = laboratoires.content.find((l) => l.id === equipement.laboratoire_id); // Utilisez laboratoryId
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
