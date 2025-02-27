import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
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
    ]
})
export class SuivreReservationComponent {
  reservationCode: string = '';

  constructor(private router: Router) {}

  onSubmit(): void {
    if (this.reservationCode) {
      // Rediriger vers la page de détails de la réservation avec le code
      this.router.navigate(['/reservation-details', this.reservationCode]);
    }
  }

  onCancel(): void {
    this.reservationCode = ''; // Réinitialiser le champ
  }
}