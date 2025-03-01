import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TopbarWidget } from './components/topbarwidget.component';
import { Accueil } from "./components/accueil";
import { MaterielComponent } from './materiels/materiel';
import { SuivreReservationComponent } from './suivre.reservation/suivre.reservation';
import { ReservationDetailsComponent } from './suivre.reservation/reservation.details/reservation-details.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [
        RouterModule,
        TopbarWidget,
        RippleModule,
        StyleClassModule,
        ButtonModule,
        DividerModule,
        Accueil,
        MaterielComponent,
        SuivreReservationComponent,
        ReservationDetailsComponent,
        CommonModule,
    ],
    template: `
        <div class="bg-surface-0 dark:bg-surface-900">
            <div id="home" class="landing-wrapper overflow-hidden">
                <topbar-widget (openReservationModalEvent)="showReservationModal()" class="py-6 px-6 mx-0 md:mx-12 lg:mx-20 lg:px-20 flex items-center justify-between relative lg:static" />
                <accueil />
                <materiel />
            </div>
        </div>

        <!-- Modal pour suivre une réservation -->
        <suivrereservation
            *ngIf="showReservationModalFlag"
            (closeModal)="hideReservationModal()"
            (showDetailsModal)="showDetailsModal($event)"
        ></suivrereservation>

        <!-- Modal pour afficher les détails de la réservation -->
        <reservationdetails
            *ngIf="showDetailsModalFlag"
            [reservationCode]="reservationCode"
            (closeModal)="hideDetailsModal()"
        ></reservationdetails>
    `,
})
export class Landing {
    showReservationModalFlag: boolean = false; 
    showDetailsModalFlag: boolean = false; 
    reservationCode: string = ''; 
  
    // Afficher le premier modal
    showReservationModal(): void {
      this.showReservationModalFlag = true;
    }
  
    // Masquer le premier modal
    hideReservationModal(): void {
      this.showReservationModalFlag = false;
    }
  
    // Afficher le deuxième modal avec le code de réservation
    showDetailsModal(code: string): void {
      this.reservationCode = code;
      this.showDetailsModalFlag = true;
    }
  
    // Masquer le deuxième modal
    hideDetailsModal(): void {
      this.showDetailsModalFlag = false;
    }
  }