import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { BackendURL, LocalStorageFields } from '../../../const';
import { UserService } from '../user/user.service';
import { Equipementservice } from '../equipements/equipement.service';
import { Reservation } from './resrvation.model';
import { HttpHeaders } from '@angular/common/http';


@Injectable({
    providedIn: 'root',
})
export class ReservationService {
    private apiUrl = `${BackendURL}reservations`;


    constructor(private http: HttpClient) {}

    getReservations(): Observable<Reservation[]> {
        const token = localStorage.getItem(LocalStorageFields.accessToken); // Récupère le token
        console.log("Token avant la requête de réservation (getReservations) :", token); // Log du token

        return this.http.get<{ content: Reservation[] }>(`${this.apiUrl}`).pipe(
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
                            user: userService.getUserById(reservation.user_id).pipe(
                                catchError((err) => {
                                    console.error('Erreur lors de la récupération de l\'utilisateur :', err);
                                    return of({ firstname: 'Utilisateur inconnu' }); // Retourne un utilisateur par défaut en cas d'erreur
                                })
                            ),
                            equipement: equipementService.getEquipementById(reservation.equipement_id).pipe(
                                catchError((err) => {
                                    console.error('Erreur lors de la récupération de l\'équipement :', err);
                                    return of({ nom: 'Équipement inconnu' }); // Retourne un équipement par défaut en cas d'erreur
                                })
                            ),
                        }).pipe(
                            map(({ user, equipement }) => {
                                console.log("Token après la sous-requête pour la réservation :", localStorage.getItem(LocalStorageFields.accessToken)); // Log du token après chaque sous-requête
                                return {
                                    ...reservation,
                                    userName: user.firstname, // Ajoute le nom de l'utilisateur
                                    equipementName: equipement.nom, // Ajoute le nom de l'équipement
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
            // Récupère le token
            const token = localStorage.getItem(LocalStorageFields.accessToken);

            console.log("Token avant la requête de création de réservation :", token); // Log du token

            // Détermine l'URL en fonction de la présence du token
            const url = token ? `${this.apiUrl}` : `${this.apiUrl}/guest`;

            // Détermine les headers, en ajoutant le token si disponible
            let headers = new HttpHeaders({ 'Content-Type': 'application/json' });

            if (token) {
                headers = headers.set('Authorization', `Bearer ${token}`);
            }

            return this.http.post<Reservation>(url, reservation, { headers }).pipe(
                catchError((err) => {
                    console.error('Erreur lors de la création de la réservation :', err);
                    console.log("Token après erreur :", localStorage.getItem(LocalStorageFields.accessToken)); // Log du token après erreur
                    return throwError(() => err);
                })
            );
        }


        changerStatutReservation(id: string): Observable<Reservation> {
            const token = localStorage.getItem(LocalStorageFields.accessToken); // Récupère le token
            console.log("Token avant la requête de changement de statut de réservation :", token); // Log du token

            const headers = new HttpHeaders({
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            });

            return this.http.post<Reservation>(`${this.apiUrl}/valider/${id}`, {}, { headers }).pipe(
                catchError((err) => {
                    console.error('Erreur lors du changement de statut de la réservation :', err);
                    return throwError(() => err);
                })
            );
        }

        cancelReservation(id: string): Observable<Reservation> {
            const token = localStorage.getItem(LocalStorageFields.accessToken);
            const headers = new HttpHeaders({
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            });

            return this.http.post<Reservation>(`${this.apiUrl}/rejeter/${id}`, {}, { headers }).pipe(
                catchError((err) => {
                    console.error("Erreur lors de l'annulation de la réservation :", err);
                    return throwError(() => err);
                })
            );
        }
        getReservationDetails(code: string): Observable<any> {
            return this.http.get<any>(`${this.apiUrl}/code/${code}`);
          }
}

