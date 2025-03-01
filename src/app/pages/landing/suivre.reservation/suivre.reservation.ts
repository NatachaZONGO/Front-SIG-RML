import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Dialog, DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'suivrereservation',
  templateUrl: './suivre.reservation.html',
    standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    DialogModule,
    ]
})
export class SuivreReservationComponent {
  @Output() closeModal = new EventEmitter<void>(); // Événement pour fermer le modal
  @Output() showDetailsModal = new EventEmitter<string>(); // Événement pour afficher le modal des détails
  reservationDialog: boolean = true; // Afficher le modal par défaut
  reservationCode: string = ''; // Code de réservation saisi par l'utilisateur

  // Soumettre le formulaire
  onSubmit(): void {
    if (this.reservationCode) {
      this.showDetailsModal.emit(this.reservationCode); // Émettre l'événement avec le code
      this.reservationDialog = false; // Fermer le modal après soumission
    }
  }

  // Annuler et fermer le modal
  onCancel(): void {
    this.reservationDialog = false;
    this.closeModal.emit(); // Émettre l'événement pour fermer le modal
  }
}