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
import { Reservation, ReservationService } from '../service/reservation.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { forkJoin, map } from 'rxjs';
import { Equipement, Equipementservice } from '../service/equipement.service';
import { User, UserService } from '../service/user.service';

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
    template: `
    <p-toolbar styleClass="mb-6">
        <ng-template #end>
            <p-button label="Exporter" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
        </ng-template>
    </p-toolbar>

    <p-table
        #dt
        [value]="reservations()"
        [rows]="10"
        [columns]="cols"
        [paginator]="true"
        [globalFilterFields]="['equipement', 'user', 'dateDebut', 'dateFin', 'statut']"
        [tableStyle]="{ 'min-width': '75rem' }"
        [rowHover]="true"
        dataKey="id"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} reservations"
        [showCurrentPageReport]="true"
        [rowsPerPageOptions]="[10, 20, 30]"
    >
        <ng-template #caption>
            <div class="flex items-center justify-between">
                <h5 class="m-0">Gestion des Réservations</h5>
                <p-iconfield>
                    <p-inputicon styleClass="pi pi-search" />
                    <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Recherche..." />
                </p-iconfield>
            </div>
        </ng-template>
        <ng-template #header>
            <tr>
                <th pSortableColumn="equipement" style="min-width:16rem">
                    Équipement
                    <p-sortIcon field="equipement" />
                </th>
                <th pSortableColumn="user" style="min-width:16rem">
                    Reservant
                    <p-sortIcon field="user" />
                </th>
                <th pSortableColumn="dateDebut" style="min-width:16rem">
                    Date Début
                    <p-sortIcon field="dateDebut" />
                </th>
                <th pSortableColumn="dateFin" style="min-width:16rem">
                    Date Fin
                    <p-sortIcon field="dateFin" />
                </th>
                <th pSortableColumn="statut" style="min-width:16rem">
                    Statut
                    <p-sortIcon field="statut" />
                </th>
                <th style="min-width: 12rem">Actions</th>
            </tr>
        </ng-template>
        <ng-template #body let-reservation>
            <tr>
                <td style="min-width: 16rem">{{ reservation.equipementName }}</td>
                <td style="min-width: 16rem">{{ reservation.userName }}</td>
                <td style="min-width: 16rem">{{ reservation.startAt | date:'dd/MM/yyyy' }}</td>
                <td style="min-width: 16rem">{{ reservation.endAt | date:'dd/MM/yyyy' }}</td>
                <td style="min-width: 16rem">{{ reservation.state }}</td>
                <td>
                    <p-button icon="pi pi-check" class="mr-2" [rounded]="true" [outlined]="true" (click)="validateReservation(reservation)" [disabled]="reservation.state !== 'pending'" />
                    <p-button icon="pi pi-times" severity="danger" class="mr-2" [rounded]="true" [outlined]="true" (click)="cancelReservation(reservation)" [disabled]="reservation.state !== 'pending'" />
                    <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" (click)="viewReservation(reservation)" />
                </td>
            </tr>
        </ng-template>
    </p-table>

    <p-dialog [(visible)]="reservationDialog" [style]="{ width: '450px' }" header="Détails de la Réservation" [modal]="true">
        <ng-template #content>
            <div class="flex flex-col gap-6">
                <div>
                    <label for="equipement" class="block font-bold mb-3">Équipement</label>
                    <input type="text" pInputText id="equipement" [(ngModel)]="reservation.equipementName" readonly />
                </div>
                <div>
                    <label for="user" class="block font-bold mb-3">Utilisateur</label>
                    <input type="text" pInputText id="user" [(ngModel)]="reservation.userName" readonly />
                </div>
                <div>
                    <label for="dateDebut" class="block font-bold mb-3">Date Début</label>
                    <p-datepicker [showIcon]="true" [showButtonBar]="true" [(ngModel)]="reservation.startAt" readonly />
                </div>
                <div>
                    <label for="dateFin" class="block font-bold mb-3">Date Fin</label>
                    <p-datepicker [showIcon]="true" [showButtonBar]="true" [(ngModel)]="reservation.endAt" readonly />
                </div>
                <div>
                    <label for="statut" class="block font-bold mb-3">Statut</label>
                    <input type="text" pInputText id="statut" [(ngModel)]="reservation.state" readonly />
                </div>
            </div>
        </ng-template>

        <ng-template #footer>
            <p-button label="Fermer" icon="pi pi-times" text (click)="hideDialog()" />
        </ng-template>
    </p-dialog>

    <p-confirmdialog [style]="{ width: '450px' }" />
`,
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