import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { BackendURL, LocalStorageFields } from '../../../const';
import { UserService } from '../user/user.service';
import { Equipementservice } from '../equipements/equipement.service';

export interface Reservation {
        id?: string;
        startAt: string; 
        endAt: string; 
        state: string; 
        reservedAt: string;
        userId: string; 
        equipmentId: string; 
        userName?: string; 
        equipementName?: string; 
        
}

@Injectable({
    providedIn: 'root',
})
export class ReservationService {
    private apiUrl = `${BackendURL}reservation`; 

    constructor(private http: HttpClient) {}

    getReservations(): Observable<Reservation[]> {
        const token = localStorage.getItem(LocalStorageFields.accessToken); // Récupère le token
        console.log("Token avant la requête de réservation (getReservations) :", token); // Log du token
    
        return this.http.get<{ content: Reservation[] }>(`${this.apiUrl}/all`).pipe(
            map((response) => {
                console.log("Réponse de l'API (getReservations) :", response); // Log de la réponse
                return response.content;
            }),
            catchError((err) => {
                console.error('Erreur lors de la récupération des réservations (getReservations) :', err);
                console.log("Token après l'erreur (getReservations) :", localStorage.getItem(LocalStorageFields.accessToken)); // Log du token après l'erreur
                return of([]);
            })
        );
    }
       
           // Récupère les réservations avec les noms des utilisateurs et des équipements
           getReservationsWithDetails(userService: UserService, equipementService: Equipementservice): Observable<Reservation[]> {
            const token = localStorage.getItem(LocalStorageFields.accessToken); // Récupère le token
            console.log("Token avant la requête de réservation (getReservationsWithDetails) :", token); // Log du token
        
            return this.http.get<{ content: Reservation[] }>(`${this.apiUrl}/all`).pipe(
                switchMap((response) => {
                    console.log("Réponse de l'API (getReservationsWithDetails) :", response); // Log de la réponse
        
                    // Pour chaque réservation, récupérez les détails de l'utilisateur et de l'équipement
                    const requests = response.content.map((reservation) => {
                        console.log("Token avant la sous-requête pour la réservation :", localStorage.getItem(LocalStorageFields.accessToken)); // Log du token avant chaque sous-requête
        
                        return forkJoin({
                            user: userService.getUserById(reservation.userId).pipe(
                                catchError((err) => {
                                    console.error('Erreur lors de la récupération de l\'utilisateur :', err);
                                    return of({ firstname: 'Utilisateur inconnu' }); // Retourne un utilisateur par défaut en cas d'erreur
                                })
                            ),
                            equipement: equipementService.getEquipementById(reservation.equipmentId).pipe(
                                catchError((err) => {
                                    console.error('Erreur lors de la récupération de l\'équipement :', err);
                                    return of({ name: 'Équipement inconnu' }); // Retourne un équipement par défaut en cas d'erreur
                                })
                            ),
                        }).pipe(
                            map(({ user, equipement }) => {
                                console.log("Token après la sous-requête pour la réservation :", localStorage.getItem(LocalStorageFields.accessToken)); // Log du token après chaque sous-requête
                                return {
                                    ...reservation,
                                    userName: user.firstname, // Ajoute le nom de l'utilisateur
                                    equipementName: equipement.name, // Ajoute le nom de l'équipement
                                };
                            })
                        );
                    });
        
                    // Combinez toutes les requêtes et retournez un Observable<Reservation[]>
                    return forkJoin(requests);
                }),
                catchError((err) => {
                    console.error('Erreur lors de la récupération des réservations (getReservationsWithDetails) :', err);
                    console.log("Token après l'erreur (getReservationsWithDetails) :", localStorage.getItem(LocalStorageFields.accessToken)); // Log du token après l'erreur
                    return of([]);
                })
            );
        }

        createReservation(reservation: Reservation): Observable<Reservation> {
            const token = localStorage.getItem(LocalStorageFields.accessToken); // Récupère le token
            console.log("Token avant la requête de création de réservation (createReservation) :", token); // Log du token
        
            return this.http.post<Reservation>(`${this.apiUrl}`, reservation).pipe(
                catchError((err) => {
                    console.error('Erreur lors de la création de la réservation (createReservation) :', err);
                    console.log("Token после ошибки (createReservation) :", localStorage.getItem(LocalStorageFields.accessToken)); // Log du token после ошибки
                    return throwError(() => err);
                })
            );
    } 
    
}
    
