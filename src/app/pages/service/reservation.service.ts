import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Equipement, Equipementservice } from './equipement.service';
import { User } from './product.service';
import { UserService } from './user.service';

export interface Reservation {
        id?: string;
        startAt: string; 
        endAt: string; 
        state: string; 
        reservedAt: string;
        userId: string; // ID de l'utilisateur
        equipmentId: string; // ID de l'équipement
        userName?: string; // Nom de l'utilisateur (optionnel)
        equipementName?: string; // Nom de l'équipement (optionnel)
        
}

@Injectable({
    providedIn: 'root',
})
export class ReservationService {
    private apiUrl = 'http://102.211.121.54:8080/node_ts/api/V0.1'; // Remplace par l'URL de ton API

    constructor(private http: HttpClient) {}

    getReservations(): Observable<Reservation[]> {
               return this.http.get<{ content: Reservation[] }>(`${this.apiUrl}/reservation/all`).pipe(
                   map((response) => response.content), 
                   catchError((err) => {
                       console.error('Erreur lors de la récupération des reservations', err);
                       return of([]); 
                   })
               );
           }
       
           // Récupère les réservations avec les noms des utilisateurs et des équipements
    getReservationsWithDetails(userService: UserService, equipementService: Equipementservice): Observable<Reservation[]> {
        return this.http.get<{ content: Reservation[] }>(`${this.apiUrl}/reservation/all`).pipe(
            switchMap((response) => {
                // Pour chaque réservation, récupérez les détails de l'utilisateur et de l'équipement
                const requests = response.content.map((reservation) =>
                    forkJoin({
                        user: userService.getUserById(reservation.userId),
                        equipement: equipementService.getEquipementById(reservation.equipmentId),
                    }).pipe(
                        map(({ user, equipement }) => ({
                            ...reservation,
                            userName: user.name, // Ajoute le nom de l'utilisateur
                            equipementName: equipement.name, // Ajoute le nom de l'équipement
                        }))
                    )
                );

                // Combinez toutes les requêtes et retournez un Observable<Reservation[]>
                return forkJoin(requests);
            }),
            catchError((err) => {
                console.error('Erreur lors de la récupération des réservations', err);
                return of([]); // Retourne un tableau vide en cas d'erreur
            })
        );
    }
    }

    
