import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Equipement, Equipementservice } from '../../service/equipement.service';

@Component({
    selector: 'materiel',
    standalone: true,
    imports: [CommonModule],
    providers: [Equipementservice],
    template: `
        <div id="features" class="py-6 px-6 lg:px-20 mt-8 mx-0 lg:mx-20">
            <div class="grid grid-cols-12 gap-4 justify-center">
                <div class="col-span-12 text-center mt-20 mb-6">
                    <div class="text-surface-900 dark:text-surface-0 font-normal mb-2 text-4xl">Équipements</div>
                    <span class="text-muted-color text-2xl">Liste des équipements disponibles et non disponibles</span>
                </div>

                <!-- Boucle pour afficher chaque équipement -->
                <div *ngFor="let equipement of equipements" class="col-span-12 md:col-span-6 lg:col-span-4 p-0 lg:pr-8 lg:pb-8 mt-6 lg:mt-0">
                    <div style="height: 400px; padding: 2px; border-radius: 10px; background: linear-gradient(90deg, rgba(253, 228, 165, 0.2), rgba(187, 199, 205, 0.2))">
                        <div class="p-4 bg-surface-0 dark:bg-surface-900 h-full" style="border-radius: 8px">
                            <!-- Photo de l'équipement -->
                            <img [src]="equipement.photo" alt="Photo de l'équipement" class="w-full h-32 object-cover mb-4 rounded-lg" />

                            <!-- Nom de l'équipement -->
                            <h5 class="mb-2 text-surface-900 dark:text-surface-0 font-bold text-xl">{{ equipement.name }}</h5>

                            <!-- État de l'équipement -->
                            <div class="flex items-center mb-2">
                                <span class="text-surface-600 dark:text-surface-200">État :</span>
                                <span class="ml-2 text-surface-900 dark:text-surface-0 font-semibold">{{ equipement.etat }}</span>
                            </div>

                            <!-- Disponibilité -->
                            <div class="flex items-center mb-2">
                                <span class="text-surface-600 dark:text-surface-200">Disponible :</span>
                                <span class="ml-2 text-surface-900 dark:text-surface-0 font-semibold">
                                    {{ equipement.estDisponible ? 'Oui' : 'Non' }}
                                </span>
                            </div>

                            <!-- Laboratoire -->
                            <div class="flex items-center mb-2">
                                <span class="text-surface-600 dark:text-surface-200">Laboratoire :</span>
                                <span class="ml-2 text-surface-900 dark:text-surface-0 font-semibold">{{ equipement.laboratoire }}</span>
                            </div>

                            <!-- Personnes à contacter -->
                            <div class="flex flex-col mb-4">
                                <span class="text-surface-600 dark:text-surface-200">Contacts :</span>
                                <ul class="list-disc list-inside">
                                    <li *ngFor="let contact of equipement.contacts" class="text-surface-900 dark:text-surface-0">{{ contact }}</li>
                                </ul>
                            </div>

                            <!-- Boutons Détails et Réserver -->
                            <div class="flex justify-between">
                                <button (click)="voirDetails(equipement)" class="bg-blue-500 text-white px-4 py-2 rounded-lg">
                                    Détails
                                </button>
                                <button (click)="reserverEquipement(equipement)" [disabled]="!equipement.estDisponible" class="bg-green-500 text-white px-4 py-2 rounded-lg">
                                    Réserver
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal pour afficher les détails -->
        <div *ngIf="equipementSelectionne" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg w-1/2">
                <h2 class="text-2xl font-bold mb-4">{{ equipementSelectionne.name }}</h2>
                <p><strong>Description :</strong> {{ equipementSelectionne.description }}</p>
                <p><strong>État :</strong> {{ equipementSelectionne.etat }}</p>
                <p><strong>Disponible :</strong> {{ equipementSelectionne.estDisponible ? 'Oui' : 'Non' }}</p>
                <p><strong>Laboratoire :</strong> {{ equipementSelectionne.laboratoire }}</p>
                <p><strong>Contacts :</strong></p>
                <ul>
                    <li *ngFor="let contact of equipementSelectionne.contacts">{{ contact }}</li>
                </ul>
                <button (click)="fermerDetails()" class="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg">
                    Fermer
                </button>
            </div>
        </div>
    `,
})
export class Materiel implements OnInit {
    equipements: Equipement[] = [];
    equipementSelectionne: Equipement | null = null; // Pour stocker l'équipement sélectionné

    constructor(private equipementService: Equipementservice) {}

    ngOnInit(): void {
        this.equipementService.getAllEquipements().subscribe((data) => {
            this.equipements = data;
        });
    }

    // Méthode pour afficher les détails d'un équipement
    voirDetails(equipement: Equipement) {
        this.equipementSelectionne = equipement;
    }

    // Méthode pour fermer le modal des détails
    fermerDetails() {
        this.equipementSelectionne = null;
    }

    // Méthode pour réserver un équipement
    reserverEquipement(equipement: Equipement) {
        if (equipement.estDisponible) {
            alert(`Vous avez réservé l'équipement : ${equipement.name}`);
            // Ajoutez ici la logique pour réserver l'équipement (par exemple, appeler une API)
        } else {
            alert('Cet équipement n\'est pas disponible pour réservation.');
        }
    }
}