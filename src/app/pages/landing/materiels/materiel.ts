import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Equipement, Equipementservice } from '../../crud/equipements/equipement.service';
import { ReservationService } from '../../crud/reservations/reservation.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service'; // Service d'authentification

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

    // Données du formulaire de réservation
    reservation = {
        startAt: '',
        endAt: '',
        state: 'En cours', // État par défaut
        reservedAt: new Date().toISOString().split('T')[0], // Date actuelle
        userId: '', // ID de l'utilisateur (vide si non connecté)
        equipmentId: '', // ID de l'équipement à réserver
        nom: '', // Nom de l'utilisateur non connecté
        prenom: '', // Prénom de l'utilisateur non connecté
        email: '', // Email de l'utilisateur non connecté
        contact: '', // Contact de l'utilisateur non connecté
    };

    isLoggedIn: boolean = false; // Vérifie si l'utilisateur est connecté

    constructor(
        private equipementService: Equipementservice,
        private reservationService: ReservationService,
        private authService: AuthService // Service d'authentification
    ) {}

    ngOnInit(): void {
        this.loadEquipements();
        this.checkLoginStatus(); // Vérifie si l'utilisateur est connecté
    }

    // Charge les équipements disponibles
    loadEquipements() {
        this.equipementService.getEquipements().subscribe((data) => {
            this.equipements = data;
        });
    }

    // Vérifie si l'utilisateur est connecté
    checkLoginStatus() {
        this.isLoggedIn = this.authService.isLoggedIn(); // Méthode à implémenter dans AuthService
        if (this.isLoggedIn) {
            const user = this.authService.getCurrentUser(); // Récupère l'utilisateur connecté
            this.reservation.userId = user._id; // Définit l'ID de l'utilisateur
            this.reservation.nom = user.nom; // Remplit automatiquement le nom
            this.reservation.prenom = user.prenom; // Remplit automatiquement le prénom
            this.reservation.email = user.email; // Remplit automatiquement l'email
            this.reservation.contact = user.contact; // Remplit automatiquement le contact
        }
    }

    // Affiche les détails d'un équipement
    voirDetails(equipement: Equipement) {
        this.equipementSelectionne = equipement;
    }

    // Ferme le modal des détails
    fermerDetails() {
        this.equipementSelectionne = null;
    }

    // Ouvre le formulaire de réservation pour un équipement
    reserverEquipement(equipement: Equipement) {
        if (equipement.estDisponible) {
            this.equipementAReserver = equipement;
            this.reservation.equipmentId = equipement._id || ''; // Définit l'ID de l'équipement
            this.reservationDialog = true; // Affiche le formulaire de réservation
        } else {
            alert('Cet équipement n\'est pas disponible pour réservation.');
        }
    }

    // Soumet le formulaire de réservation
    soumettreReservation() {
        if (this.reservation.startAt && this.reservation.endAt && this.reservation.equipmentId) {
            if (!this.isLoggedIn && (!this.reservation.nom || !this.reservation.prenom || !this.reservation.email || !this.reservation.contact)) {
                alert('Veuillez remplir tous les champs pour les utilisateurs non connectés.');
                return;
            }

            this.reservationService.createReservation(this.reservation).subscribe({
                next: (response) => {
                    alert('Réservation réussie !');
                    this.reservationDialog = false; // Ferme le formulaire
                    this.reinitialiserFormulaire(); // Réinitialise le formulaire
                },
                error: (err) => {
                    console.error('Erreur lors de la réservation', err);
                    alert('Erreur lors de la réservation. Veuillez réessayer.');
                },
            });
        } else {
            alert('Veuillez remplir tous les champs du formulaire.');
        }
    }

    // Réinitialise le formulaire de réservation
    reinitialiserFormulaire() {
        this.reservation = {
            startAt: '',
            endAt: '',
            state: 'En cours',
            reservedAt: new Date().toISOString().split('T')[0],
            userId: '',
            equipmentId: '',
            nom: '',
            prenom: '',
            email: '',
            contact: '',
        };
    }

    // Ferme le formulaire de réservation
    fermerReservation() {
        this.reservationDialog = false;
        this.reinitialiserFormulaire();
    }
}