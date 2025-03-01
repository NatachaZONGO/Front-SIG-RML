import { CommonModule } from '@angular/common';
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
import { ConfirmationService } from 'primeng/api';

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
  ],
  providers: [ConfirmationService, ReservationService], // Fournissez les services ici
})
export class ReservationDetailsComponent implements OnInit {
  @Input() reservationCode: string = ''; // Code de réservation passé depuis le parent
  @Output() closeModal = new EventEmitter<void>(); // Événement pour fermer le modal
  reservationDialog: boolean = true; // Afficher le modal par défaut
  reservation: any = {}; // Détails de la réservation
  utilisateur: any = {}; // Informations de l'utilisateur

  constructor(
    private route: ActivatedRoute,
    private reservationService: ReservationService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    // Récupérer le code de réservation depuis l'URL ou l'input
    const code = this.reservationCode || this.route.snapshot.paramMap.get('code');

    if (code) {
      // Appeler le service pour récupérer les détails de la réservation
      this.reservationService.getReservationDetails(code).subscribe({
        next: (data) => {
          this.reservation = data.reservation; // Stocker les détails de la réservation

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
}