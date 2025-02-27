import { CommonModule } from '@angular/common';
import { ReservationService } from './../../../crud/reservations/reservation.service';
import { Component, OnInit } from '@angular/core';
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
  providers: [ConfirmationService, ReservationService],
  imports: [
    ButtonModule,
    CommonModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    DialogModule,
    ConfirmDialogModule,
  ],
})
export class ReservationDetailsComponent implements OnInit {
  reservationDialog: boolean = false;
  reservation: any = {}; 
  utilisateur: any = {}; // Variable pour stocker les infos utilisateur

  constructor(
    private route: ActivatedRoute,
    private ReservationService: ReservationService
  ) {}

  ngOnInit(): void {
    // Récupérer le code de réservation depuis l'URL
    const reservationCode = this.route.snapshot.paramMap.get('code');

    if (reservationCode) {
      // Appeler le service pour récupérer les détails de la réservation
      this.ReservationService.getReservationDetails(reservationCode).subscribe({
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
  }
}
