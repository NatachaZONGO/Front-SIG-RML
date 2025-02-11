import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

export interface Reservation {
    id?: string;
    equipement: string;
    user: string;
    dateDebut: string;
    dateFin: string;
    statut: string;
}

@Injectable({
    providedIn: 'root',
})
export class ReservationService {

    reservationEquipements: string[] = ['Équipement 1', 'Équipement 2', 'Équipement 3'];
    reservationUsers: string[] = ['Utilisateur 1', 'Utilisateur 2', 'Utilisateur 3'];
    reservationStatuts: string[] = ['En attente', 'Confirmée', 'Annulée'];

    constructor(private http: HttpClient) {}

    getReservations() {
        const reservations: Reservation[] = [
            { id: this.generateId(), equipement: 'Équipement 1', user: 'Utilisateur 1', dateDebut: '2023-10-01', dateFin: '2023-10-05', statut: 'En attente' },
            { id: this.generateId(), equipement: 'Équipement 2', user: 'Utilisateur 2', dateDebut: '2023-10-10', dateFin: '2023-10-15', statut: 'Confirmée' },
        ];
        return of(reservations).toPromise();
    }

    getReservationsMini() {
        return Promise.resolve(this.getReservations().then(data => data?.slice(0, 5)));
    }

    getReservationsSmall() {
        return Promise.resolve(this.getReservations().then(data => data?.slice(0, 10)));
    }

    generateReservation(): Reservation {
        return {
            id: this.generateId(),
            equipement: this.generateEquipement(),
            user: this.generateUser(),
            dateDebut: this.generateDateDebut(),
            dateFin: this.generateDateFin(),
            statut: this.generateStatut()
        };
    }

    generateId() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 5; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    generateEquipement() {
        return this.reservationEquipements[Math.floor(Math.random() * this.reservationEquipements.length)];
    }

    generateUser() {
        return this.reservationUsers[Math.floor(Math.random() * this.reservationUsers.length)];
    }

    generateDateDebut() {
        const start = new Date();
        start.setDate(start.getDate() + Math.floor(Math.random() * 30));
        return start.toISOString().split('T')[0];
    }

    generateDateFin() {
        const end = new Date();
        end.setDate(end.getDate() + Math.floor(Math.random() * 30) + 5);
        return end.toISOString().split('T')[0];
    }

    generateStatut() {
        return this.reservationStatuts[Math.floor(Math.random() * this.reservationStatuts.length)];
    }
}
