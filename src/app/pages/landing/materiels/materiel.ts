import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { ReservationService } from '../../crud/reservations/reservation.service';
import { AuthService } from '../../auth/auth.service';
import { Equipementservice } from '../../crud/equipements/equipement.service';
import { Laboratoireservice } from '../../crud/laboratoire/laboratoire.service';
import { Equipement } from '../../crud/equipements/equipement.model';

@Component({
    selector: 'materiel',
    standalone: true,
    imports: [CommonModule, FormsModule, NgxPaginationModule],
    providers: [Equipementservice, ReservationService, Laboratoireservice],
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
        contact: '',
    };

    isLoggedIn: boolean = false;

    // Variables for search and pagination
    searchTerm: string = '';
    selectedLaboratoire: string = '';
    currentPage: number = 1;
    itemsPerPage: number = 10;
    laboratoires: any[] = [];

    constructor(
        private equipementService: Equipementservice,
        private reservationService: ReservationService,
        private authService: AuthService,
        private laboratoireService: Laboratoireservice
    ) {}

    ngOnInit(): void {
        this.loadEquipements();
        this.loadLaboratoires();
        this.checkLoginStatus();
    }

    // Charge les équipements disponibles
    loadEquipements() {
        this.equipementService.getEquipements().subscribe((data) => {
            this.equipements = data;
        });
    }

    // Charge les laboratoires disponibles
    loadLaboratoires() {
        this.laboratoireService.getLaboratoires().subscribe((data) => {
            this.laboratoires = data.content;
        });
    }

    // Vérifie si l'utilisateur est connecté
    checkLoginStatus() {
        this.isLoggedIn = this.authService.isLoggedIn();
        console.log('Statut de connexion:', this.isLoggedIn);

        if (this.isLoggedIn) {
            const user = this.authService.getCurrentUser();
            console.log('Utilisateur récupéré:', user);

            if (user && user.id) {
                this.reservation = { // Crée une nouvelle copie de l'objet pour forcer la détection du changement
                    ...this.reservation,
                    user_id: user.id,
                    info_utilisateur: JSON.stringify({
                        firstname: user.firstname,
                        lastname: user.lastname,
                        email: user.email,
                        phone: user.phone,
                        address: user.address,
                    }),
                };

                console.log('ID utilisateur stocké:', this.reservation.user_id);
                console.log('Infos utilisateur stockées:', this.reservation.info_utilisateur);
            } else {
                console.warn("Utilisateur invalide ou ID manquant !");
            }
        }
    }

    // Filtre les équipements en fonction du terme de recherche et du laboratoire sélectionné
    get filteredEquipements() {
        return this.equipements.filter(equipement => {
            const laboratoireId = equipement.laboratoire?.id;
            console.log('Laboratoire ID:', laboratoireId); // Vérifiez l'ID du laboratoire
            console.log('Selected Laboratoire:', this.selectedLaboratoire); // Vérifiez la valeur sélectionnée

            const isLaboratoireMatch = this.selectedLaboratoire ? Number(laboratoireId) === Number(this.selectedLaboratoire) : true;
            console.log('Laboratoire Match:', isLaboratoireMatch); // Vérifiez si le match est vrai

            const isSearchMatch = this.searchTerm ? equipement.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) : true;

            return isLaboratoireMatch && isSearchMatch;
        });
    }




    // Change la page actuelle
    pageChanged(event: number): void {
        this.currentPage = event;
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
            contact: '',
        };
    }

    // Ferme le formulaire de réservation
    fermerReservation() {
        this.reservationDialog = false;
        this.reinitialiserFormulaire();
    }
}
