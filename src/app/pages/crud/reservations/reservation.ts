import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { forkJoin, map } from 'rxjs';
import { Equipement, Equipementservice } from '../equipements/equipement.service';
import { User, UserService } from '../user/user.service';
import { Reservation, ReservationService } from './reservation.service';

interface Column {
    field: string;
    header: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-reservation',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        DialogModule,
        TagModule,
        ConfirmDialogModule,
        DatePickerModule,
        IconFieldModule,
        InputIconModule,
    ],
    templateUrl: './reservation.component.html',
    
    providers: [MessageService, ReservationService, ConfirmationService, Equipementservice, UserService],
})
export class ReservationComponent implements OnInit {
    reservationDialog: boolean = false;

    reservations = signal<Reservation[]>([]);

    reservation!: Reservation;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    equipements: Equipement[] = []; // Liste des équipements
    users: User[] = []; // Liste des utilisateurs

    constructor(
        private reservationService: ReservationService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private equipementService: Equipementservice,
        private userService: UserService
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        // Charger les équipements et les utilisateurs au démarrage
        forkJoin({
            equipements: this.equipementService.getEquipements(),
            users: this.userService.getUsers(),
        }).subscribe({
            next: (data) => {
                this.equipements = data.equipements;
                this.users = data.users;
                this.loadReservationsWithDetails(); // Charger les réservations une fois les données disponibles
            },
            error: (err) => console.error('Erreur lors du chargement des données', err),
        });

        this.cols = [
            { field: 'equipementName', header: 'Équipement' },
            { field: 'userName', header: 'Utilisateur' },
            { field: 'startAt', header: 'Date Début' },
            { field: 'endAt', header: 'Date Fin' },
            { field: 'state', header: 'Statut' },
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    viewReservation(reservation: Reservation) {
        this.reservation = { ...reservation };
        this.reservationDialog = true;
    }

    validateReservation(reservation: Reservation) {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir valider cette réservation ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                reservation.state = 'confirmed';
                // Envoyer une requête PUT à l'API pour mettre à jour la réservation
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Réservation validée',
                    life: 3000,
                });
            },
        });
    }

    cancelReservation(reservation: Reservation) {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir annuler cette réservation ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                reservation.state = 'cancelled';
                // Envoyer une requête PUT à l'API pour mettre à jour la réservation
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Réservation annulée',
                    life: 3000,
                });
            },
        });
    }

    hideDialog() {
        this.reservationDialog = false;
    }

    loadReservationsWithDetails() {
        this.reservationService.getReservations().subscribe({
            next: (reservations) => {
                const reservationsWithDetails = reservations.map((reservation) => {
                    const equipement = this.equipements.find((e) => e._id === reservation.equipmentId);
                    const user = this.users.find((u) => u._id === reservation.userId);
    
                    return {
                        ...reservation,
                        equipementName: equipement ? equipement.name : 'Inconnu',
                        userName: user ? `${user.firstname} ${user.lastname}` : 'Inconnu', // Utilisez firstname et lastname
                    };
                });
    
                console.log('Réservations mappées:', reservationsWithDetails); // Log des réservations mappées
                this.reservations.set(reservationsWithDetails);
            },
            error: (err) => console.error('Erreur lors du chargement des réservations', err),
        });
    }
}