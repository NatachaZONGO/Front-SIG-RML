import { CommonModule, formatDate } from '@angular/common';
import { ReservationService } from './../../../crud/reservations/reservation.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { DatePickerModule } from 'primeng/datepicker';
import { InputIconModule } from 'primeng/inputicon';
import { BadgeModule } from 'primeng/badge';
import { CalendarModule } from 'primeng/calendar';


@Component({
  selector: 'reservationdetails',
  templateUrl: './reservation-details.component.html',
  standalone: true, // Ajoutez cette ligne si vous utilisez des composants autonomes
  imports: [
    ButtonModule,
    CommonModule,
    FormsModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    DialogModule,
    ConfirmDialogModule,
    DropdownModule,
    IconFieldModule,
    DatePickerModule,
    IconFieldModule,
    InputIconModule,
    BadgeModule,
    CalendarModule,
    
  ],
  providers: [ConfirmationService, ReservationService, MessageService], 
})
export class ReservationDetailsComponent implements OnInit {
  @Input() reservationCode: string = ''; 
  @Output() closeModal = new EventEmitter<void>(); 
  reservationDialog: boolean = true; 
  modificationDialog: boolean = false;
  reservation: any = {}; 
  utilisateur: any = {}; 

  constructor(
    private route: ActivatedRoute,
    private reservationService: ReservationService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService, 
  ) {}

  statuts: any[] = [ 
    { label: 'En attente', value: 'En attente' },
    { label: 'Confirmée', value: 'confirmee' },
    { label: 'Refusée', value: 'refusee' },
    { label: 'Annulée', value: 'annulee' },
  ];

  showDialog(reservation: any, utilisateur: any) {
    this.reservation = { ...reservation }; 
    this.utilisateur = { ...utilisateur }; 
    this.reservationDialog = true;
  }
  ngOnInit(): void {
    this.reservation.date_debut = new Date();  // Exemple d'initialisation
    this.reservation.date_fin = new Date();
    // Récupérer le code de réservation depuis l'URL ou l'input
    const code = this.reservationCode || this.route.snapshot.paramMap.get('code');

    if (code) {
      // Appeler le service pour récupérer les détails de la réservation
      this.reservationService.getReservationDetails(code).subscribe({
        next: (data) => {
          this.reservation = data.reservation; 
          if (this.reservation.date) {
            this.reservation.date = new Date(this.reservation.date);
          }

          // Vérifier et parser info_utilisateur
          if (this.reservation.info_utilisateur) {
            try {
              this.utilisateur = JSON.parse(this.reservation.info_utilisateur);
            } catch (error) {
              console.error('Erreur lors du parsing de info_utilisateur', error);
            }
          }

          this.reservationDialog = true; // Afficher le dialogue
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des détails', err);
        },
      });
    }
  }

  // Méthode pour fermer le dialogue
  hideDialog(): void {
    this.reservationDialog = false;
    this.closeModal.emit(); // Émettre l'événement pour fermer le modal
  }

  ouvrirModificationDialog() {
    this.modificationDialog = true;
  }
  fermerModificationDialog() {
    this.modificationDialog = false;
  }

  
  annulerReservation() {
    if (this.reservation.id) {
      this.reservationService.cancelReservation(this.reservation.id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'La réservation a été annulée avec succès.',
          });
          console.log('Réservation annulée avec succès');
          this.hideDialog(); 
          
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de l\'annulation de la réservation.',
          });
          console.error('Erreur lors de l\'annulation de la réservation :', err);
          
        },
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Avertissement',
        detail: 'ID de réservation manquant.',
      });
      console.error('ID de réservation manquant');
    }
  }


 // Modifier la réservation
 modifierReservation() {
  // Assurez-vous que les dates sont valides avant de les convertir
  if (this.reservation.date_debut instanceof Date && !isNaN(this.reservation.date_debut.getTime())) {
    console.log('Date début valide:', this.reservation.date_debut);
    // Effectuer la mise à jour de la réservation
    this.reservation.date_debut = this.reservation.date_debut.toISOString();
  } else {
    console.error('Date début invalide:', this.reservation.date_debut);
  }

  if (this.reservation.date_fin instanceof Date && !isNaN(this.reservation.date_fin.getTime())) {
    console.log('Date fin valide:', this.reservation.date_fin);
    this.reservation.date_fin = this.reservation.date_fin.toISOString();
  } else {
    console.error('Date fin invalide:', this.reservation.date_fin);
  }

  // Assurez-vous d'appeler votre service pour mettre à jour la réservation ici
  this.reservationService.updateReservation(this.reservation).subscribe({
    next: () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'La réservation a été modifiée avec succès.',
      });
    },
    error: (err) => {
      console.error('Erreur lors de la mise à jour de la réservation :', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors de la modification de la réservation.',
      });
    },
  });
}

}