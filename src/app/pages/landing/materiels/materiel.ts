import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../crud/reservations/reservation.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Equipementservice } from '../../crud/equipements/equipement.service';
import { Equipement } from '../../crud/equipements/equipement.model';

@Component({
    selector: 'materiel',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [Equipementservice, ReservationService],
    templateUrl: './materiel.component.html',
})
export class MaterielComponent implements OnInit {
    equipements: Equipement[] = [];
    equipementSelectionne: Equipement | null = null;
    reservationDialog: boolean = false;
    equipementAReserver: Equipement | null = null;

    // Données du formulaire de réservation
    reservation = {
        date_debut: '',
        date_fin: '',
        user_id: '',
        equipement_id: '',
        info_utilisateur: '',
        motif: '',
        commentaire: '',
        nom: '',
        prenom: '',
        email: '',
        contact: '',
    };

    isLoggedIn: boolean = false;

    constructor(
        private equipementService: Equipementservice,
        private reservationService: ReservationService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.loadEquipements();
        this.checkLoginStatus();
    }

    // Charge les équipements disponibles
    loadEquipements() {
        this.equipementService.getEquipements().subscribe((data) => {
            this.equipements = data;
        });
    }

    // Vérifie si l'utilisateur est connecté
    checkLoginStatus() {
        this.isLoggedIn = this.authService.isLoggedIn();
        if (this.isLoggedIn) {
            const user = this.authService.getCurrentUser();
            this.reservation.user_id = user.id;
            this.reservation.info_utilisateur = JSON.stringify({
                firstname: user.nom,
                lastname: user.prenom,
                email: user.email,
                phone: user.contact,
                address: '',
            });
        }
    }

    // Affiche les détails d'un équipement
    voirDetails(equipement: Equipement) {
        this.equipementSelectionne = equipement;
    }

    // Ferme le modal des détails
    fermerDetails() {
        this.equipementSelectionne = null;
    }

    // Ouvre le formulaire de réservation pour un équipement
    reserverEquipement(equipement: Equipement) {
        if (equipement.estdisponible) {
            this.equipementAReserver = equipement;
            this.reservation.equipement_id = equipement.id || '';
            this.reservationDialog = true;
        } else {
            alert("Cet équipement n'est pas disponible pour réservation.");
        }
    }

    // Soumet le formulaire de réservation
    soumettreReservation() {
        if (
            this.reservation.date_debut &&
            this.reservation.date_fin &&
            this.reservation.equipement_id
        ) {
            if (!this.isLoggedIn) {
                if (!this.reservation.nom || !this.reservation.prenom || !this.reservation.email || !this.reservation.contact) {
                    alert("Veuillez remplir toutes les informations utilisateur.");
                    return;
                }
                // Transformer les informations utilisateur en JSON
                this.reservation.info_utilisateur = JSON.stringify({
                    firstname: this.reservation.nom,
                    lastname: this.reservation.prenom,
                    email: this.reservation.email,
                    phone: this.reservation.contact,
                    address: '',
                });
            }
    
            this.reservationService.createReservation(this.reservation).subscribe({
                next: (response) => {
                    alert("Réservation réussie !");
                    this.reservationDialog = false;
                    this.reinitialiserFormulaire();
                },
                error: (err) => {
                    console.error("Erreur lors de la réservation", err);
                    alert("Erreur lors de la réservation. Veuillez réessayer.");
                },
            });
        } else {
            alert("Veuillez remplir tous les champs du formulaire.");
        }
    }

    // Réinitialise le formulaire de réservation
    reinitialiserFormulaire() {
        this.reservation = {
            date_debut: '',
            date_fin: '',
            user_id: '',
            equipement_id: '',
            info_utilisateur: '',
            motif: '',
            commentaire: '',
            nom: '',
            prenom: '',
            email: '',
            contact: '',
        };
    }

    // Ferme le formulaire de réservation
    fermerReservation() {
        this.reservationDialog = false;
        this.reinitialiserFormulaire();
    }
}