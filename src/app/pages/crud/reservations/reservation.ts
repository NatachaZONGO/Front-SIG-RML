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
import { ReservationService } from './reservation.service';
import { Equipementservice } from '../equipements/equipement.service';
import { UserService } from '../user/user.service';
import { Reservation } from './resrvation.model';
import { Equipement } from '../equipements/equipement.model';
import { User } from '../user/user.model';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../auth/auth.service';
import { Laboratoireservice } from '../laboratoire/laboratoire.service';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';


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
        BadgeModule,
        TooltipModule,
    ],
    templateUrl: './reservation.component.html',
    
    providers: [MessageService, ReservationService, ConfirmationService, Equipementservice, UserService],
})
export class ReservationComponent implements OnInit {
    reservationDialog: boolean = false;

    reservations = signal<Reservation[]>([]);
    role: string = '';
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
        private userService: UserService,
        private authService: AuthService,
        private laboratoireService: Laboratoireservice,
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.role = this.authService.getUserRole() ?? '';
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
            { field: 'user_id', header: 'Utilisateur' },
            { field: 'date_debut', header: 'Date Début' },
            { field: 'date_fin', header: 'Date Fin' },

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

    validateReservation(reservation: any) {
        this.reservationService.changerStatutReservation(reservation.id).subscribe({
          next: (response) => {
            console.log("Réservation validée avec succès:", response);
            this.loadReservationsWithDetails();
          },
          error: (error) => {
            console.error("Erreur lors de la validation:", error);
          }
        });
    }
    
    cancelReservation(reservation: any) {
        this.reservationService.cancelReservation(reservation.id).subscribe({
            next: (response) => {
                console.log("Réservation annulée avec succès:", response);
                this.loadReservationsWithDetails();
            },
            error: (error) => {
                console.error("Erreur lors de l'annulation:", error);
            }
        });
    }
    

    hideDialog() {
        this.reservationDialog = false;
    }

    loadReservationsWithDetails() {
        const user = this.authService.getCurrentUser(); // Récupérer l'utilisateur connecté
        const role = this.authService.getUserRole(); // Récupérer le rôle de l'utilisateur
    
        console.log('Utilisateur connecté:', user); // Log l'utilisateur
        console.log('Rôle de l\'utilisateur:', role); // Log le rôle
    
        if (role === 'responsable') {
            // Si l'utilisateur est un responsable, récupérer les laboratoires dont il est responsable
            this.laboratoireService.getLaboratoires().subscribe({
                next: (data) => {
                    // Filtrer les laboratoires dont le responsable_id correspond à l'ID de l'utilisateur
                    const laboratoiresResponsable = data.content.filter(
                        (labo) => labo.responsable_id === user.id
                    );
    
                    if (laboratoiresResponsable.length > 0) {
                        // Récupérer les réservations du premier laboratoire (ou tous les laboratoires si nécessaire)
                        const laboratoireId = Number(laboratoiresResponsable[0].id);
                        console.log('Laboratoire ID:', laboratoireId); // Log l'ID du laboratoire
    
                        // Récupérer les réservations du laboratoire
                        this.reservationService.getReservationsByLaboratoire(laboratoireId).subscribe({
                            next: (reservations) => {
                                this.mapReservationsWithDetails(reservations);
                            },
                            error: (err) => console.error('Erreur lors de la récupération des réservations', err),
                        });
                    } else {
                        console.error('Aucun laboratoire trouvé pour ce responsable');
                    }
                },
                error: (err) => console.error('Erreur lors de la récupération des laboratoires', err),
            });
        } else if (role === 'reservant') {
            // Si l'utilisateur est un reservant, charger uniquement ses propres réservations
            const userId = user.id; // Récupérer l'ID de l'utilisateur
    
            if (!userId) {
                console.error('ID de l\'utilisateur non trouvé pour le reservant');
                return;
            }
    
            this.reservationService.getReservationsByUser(userId).subscribe({
                next: (reservations) => {
                    this.mapReservationsWithDetails(reservations);
                },
                error: (err) => console.error('Erreur lors du chargement des réservations par utilisateur', err),
            });
        } else if (role === 'admin') {
            // Si l'utilisateur est un admin, charger toutes les réservations
            this.reservationService.getReservations().subscribe({
                next: (reservations) => {
                    this.mapReservationsWithDetails(reservations);
                },
                error: (err) => console.error('Erreur lors du chargement des réservations', err),
            });
        }
    }
      mapReservationsWithDetails(reservations: Reservation[]) {
        const reservationsWithDetails = reservations.map((reservation) => {
          const equipement = this.equipements.find((e) => e.id === reservation.equipement_id);
          let userName = 'Inconnu';
      
          if (reservation.user_id) {
            const user = this.users.find((u) => u.id === reservation.user_id);
            userName = user ? `${user.firstname} ${user.lastname}` : 'Inconnu';
          } else if (reservation.info_utilisateur) {
            // Si l'utilisateur n'est pas connecté, extraire les informations de info_utilisateur
            const infoUtilisateur = JSON.parse(reservation.info_utilisateur);
            const firstName = infoUtilisateur.firstname || '';
            const lastName = infoUtilisateur.lastname || '';
            userName = firstName && lastName ? `${firstName} ${lastName}` : 'Inconnu';
          }
      
          return {
            ...reservation,
            equipementName: equipement ? equipement.nom : 'Inconnu',
            userName: userName,
          };
        });
      
        console.log('Réservations mappées:', reservationsWithDetails); // Log des réservations mappées
        this.reservations.set(reservationsWithDetails);
      }

      exportPDF() {
        const doc = new jsPDF();
    
        // Ajouter un titre au document PDF
        doc.text('Liste des Réservations', 14, 10);
    
        // Préparer les données pour le tableau PDF
        const headers = [['ID', 'Équipement', 'Nom','Prenom', 'Date de debut', 'Date de fin', 'Contact', 'Statut']];
        const data = this.reservations().map((reservation: Reservation) => [
            reservation.id ?? "",
            reservation.equipementName ?? "",
            reservation.nom ?? "",
            reservation.prenom ?? "",
            reservation.date_debut ?? "",
            reservation.date_fin ?? "",
            reservation.contact ?? "",
            reservation.status ?? ""
        ]);                
    
        // Générer le tableau dans le PDF
        autoTable(doc, {
            head: headers,
            body: data,
            startY: 20
        });
    
        // Sauvegarder le fichier PDF
        doc.save('reservations.pdf');
    }
    
    
}