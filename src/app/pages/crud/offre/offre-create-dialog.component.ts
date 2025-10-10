import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { OffreService } from './offre.service';
import { AuthService } from '../../auth/auth.service';
import { Offre, TypeOffre, TypeContrat } from './offre.model';

@Component({
  selector: 'app-offre-create-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    DialogModule, DropdownModule, CalendarModule, InputNumberModule, InputTextModule, EditorModule, ButtonModule, ToastModule
  ],
  template: `
  <p-toast></p-toast>

  <!-- Dialogue créer/modifier une offre -->
  <p-dialog
    [(visible)]="offreDialog"
    [style]="{ width: '700px' }"
    [header]="(offre && offre.id) ? 'Modifier une offre' : 'Créer une nouvelle offre'"
    [modal]="true"
    [closable]="!loading()">

    <ng-template #content>
      <form class="flex flex-col gap-4">
        <!-- Titre -->
        <div class="field">
          <label for="titre" class="block font-semibold mb-2 required">Titre *</label>
          <input
            type="text"
            pInputText
            id="titre"
            [(ngModel)]="offre.titre"
            name="titre"
            required
            autofocus
            class="w-full"
            [class.ng-invalid]="submitted && !offre.titre"
            [disabled]="loading()" />
          <small class="text-red-500" *ngIf="submitted && !offre.titre">Le titre est obligatoire.</small>
        </div>

        <!-- Type offre et Type contrat -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="field">
            <label for="type_offre" class="block font-semibold mb-2 required">Type d'offre *</label>
            <p-dropdown
              id="type_offre"
              [options]="typeOffreOptions"
              [(ngModel)]="offre.type_offre"
              name="type_offre"
              placeholder="Sélectionner un type"
              [showClear]="true"
              class="w-full"
              [class.ng-invalid]="submitted && !offre.type_offre"
              [disabled]="loading()">
            </p-dropdown>
            <small class="text-red-500" *ngIf="submitted && !offre.type_offre">Le type d'offre est obligatoire.</small>
          </div>

          <div class="field">
            <label for="type_contrat" class="block font-semibold mb-2 required">Type de contrat *</label>
            <p-dropdown
              id="type_contrat"
              [options]="typeContratOptions"
              [(ngModel)]="offre.type_contrat"
              name="type_contrat"
              placeholder="Sélectionner un contrat"
              [showClear]="true"
              class="w-full"
              [class.ng-invalid]="submitted && !offre.type_contrat"
              [disabled]="loading()">
            </p-dropdown>
            <small class="text-red-500" *ngIf="submitted && !offre.type_contrat">Le type de contrat est obligatoire.</small>
          </div>
        </div>

        <!-- Localisation et Salaire -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="field">
            <label for="localisation" class="block font-semibold mb-2">Localisation</label>
            <input
              type="text"
              pInputText
              id="localisation"
              [(ngModel)]="offre.localisation"
              name="localisation"
              class="w-full"
              [disabled]="loading()" />
          </div>

          <div class="field">
            <label for="salaire" class="block font-semibold mb-2">Salaire (FCFA)</label>
            <p-inputNumber
              id="salaire"
              [(ngModel)]="offre.salaire"
              name="salaire"
              mode="decimal"
              [minFractionDigits]="0"
              [maxFractionDigits]="0"
              suffix=" FCFA"
              class="w-full"
              [disabled]="loading()">
            </p-inputNumber>
          </div>
        </div>

        <!-- Expérience -->
        <div class="field">
          <label for="experience" class="block font-semibold mb-2">Expérience requise</label>
          <input
            type="text"
            pInputText
            id="experience"
            [(ngModel)]="offre.experience"
            name="experience"
            placeholder="Ex: 2-5 ans, Débutant accepté, Senior..."
            class="w-full"
            [disabled]="loading()" />
        </div>

        <!-- Catégorie et Date d'expiration -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="field">
            <label for="categorie_id" class="block font-semibold mb-2">Catégorie</label>
            <p-dropdown
              id="categorie_id"
              [options]="categories"
              [(ngModel)]="offre.categorie_id"
              name="categorie_id"
              optionLabel="nom"
              optionValue="id"
              placeholder="Sélectionner une catégorie"
              [showClear]="true"
              class="w-full"
              [disabled]="loading()">
            </p-dropdown>
          </div>

          <div class="field">
            <label for="date_expiration" class="block font-semibold mb-2 required">Date d'expiration *</label>
            <p-calendar
              id="date_expiration"
              [(ngModel)]="offre.date_expiration"
              name="date_expiration"
              dateFormat="dd/mm/yy"
              [showIcon]="true"
              class="w-full"
              [minDate]="minDate"
              [class.ng-invalid]="submitted && !offre.date_expiration"
              [disabled]="loading()">
            </p-calendar>
            <small class="text-red-500" *ngIf="submitted && !offre.date_expiration">La date d'expiration est obligatoire.</small>
          </div>
        </div>

        <!-- Description -->
        <div class="field">
          <label for="description" class="block font-semibold mb-2 required">Description *</label>
          <p-editor
            id="description"
            [(ngModel)]="offre.description"
            name="description"
            [style]="{ height: '320px' }"
            class="w-full"
            [class.ng-invalid]="submitted && !offre.description"
            [disabled]="loading()">
          </p-editor>
          <small class="text-red-500" *ngIf="submitted && !offre.description">La description est obligatoire.</small>
        </div>

        <!-- Statut -->
        <div class="field">
          <label for="statut" class="block font-semibold mb-2">Statut</label>
          <p-dropdown
            id="statut"
            [options]="statutOptions"
            [(ngModel)]="offre.statut"
            name="statut"
            placeholder="Sélectionner un statut"
            class="w-full"
            [disabled]="loading()">
          </p-dropdown>
        </div>
      </form>
    </ng-template>

    <ng-template #footer>
      <div class="flex justify-end gap-2">
        <p-button
          label="Annuler"
          icon="pi pi-times"
          severity="secondary"
          [outlined]="true"
          (onClick)="hideDialog()"
          [disabled]="loading()" />
        <p-button
          label="Enregistrer"
          icon="pi pi-check"
          (onClick)="saveOffre()"
          [loading]="loading()" />
      </div>
    </ng-template>
  </p-dialog>

  <style>
    .required::after { content: ' *'; color: red; }
    .field { margin-bottom: 1rem; }
  </style>
  `,
  providers: [MessageService]
})
export class OffreCreateDialogComponent {
  @Output() created = new EventEmitter<Offre>();

  // UI
  offreDialog = false;
  submitted = false;
  loading = signal<boolean>(false);

  // Data
  offre!: Offre;
  categories: any[] = [];
  minDate = new Date();

  // Dropdowns
  statutOptions = [
    { label: 'Brouillon', value: 'brouillon' },
    { label: 'En_attente_validation', value: 'en_attente_validation' },
    { label: 'Validée', value: 'validee' },
    { label: 'Rejetée', value: 'rejetee' },
    { label: 'Publiée', value: 'publiee' },
    { label: 'Fermée', value: 'fermee' },
    { label: 'Expirée', value: 'expiree' }
  ];
  typeOffreOptions: { label: string; value: TypeOffre }[] = [
    { label: 'Stage', value: 'stage' },
    { label: 'Emploi', value: 'emploi' },
  ];
  typeContratOptions: { label: string; value: TypeContrat }[] = [
    { label: 'CDI', value: 'CDI' },
    { label: 'CDD', value: 'CDD' },
    { label: 'Stage', value: 'stage' },
    { label: 'Freelance', value: 'freelance' },
    { label: 'Alternance', value: 'alternance' },
    { label: 'Contrat pro', value: 'contrat_pro' }
  ];

  constructor(
    private offreService: OffreService,
    private auth: AuthService,
    private messages: MessageService
  ) {}

  /** Ouvre le dialog en mode création, prérempli pour l’utilisateur courant */
  open(): void {
    const currentUser = this.auth.getCurrentUser();
    this.offre = {
      titre: '',
      description: '',
      experience: '',
      localisation: '',
      type_offre: null,
      type_contrat: null,
      statut: 'brouillon',
      date_publication: new Date(),
      date_expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      salaire: 0,
      recruteur_id: currentUser?.id || 1
    } as Offre;

    this.submitted = false;
    this.offreDialog = true;

    // charger catégories si nécessaire
    if (!this.categories?.length) {
      this.offreService.getCategories().subscribe({
        next: (cats) => this.categories = cats || [],
        error: () => this.categories = []
      });
    }
  }

  /** Optionnel : ouvrir en mode édition */
  openEdit(offre: Offre): void {
    this.offre = { ...offre };
    if (typeof this.offre.date_publication === 'string') {
      this.offre.date_publication = new Date(this.offre.date_publication);
    }
    if (typeof this.offre.date_expiration === 'string') {
      this.offre.date_expiration = new Date(this.offre.date_expiration);
    }
    this.submitted = false;
    this.offreDialog = true;

    if (!this.categories?.length) {
      this.offreService.getCategories().subscribe({
        next: (cats) => this.categories = cats || [],
        error: () => this.categories = []
      });
    }
  }

  hideDialog(): void {
    this.offreDialog = false;
    this.submitted = false;
  }

  saveOffre(): void {
    this.submitted = true;
    if (!this.offre?.titre?.trim() || !this.offre.type_offre || !this.offre.type_contrat) {
      this.messages.add({ severity: 'warn', summary: 'Champs requis', detail: 'Titre, Type d’offre et Type de contrat.' });
      return;
    }

    this.loading.set(true);
    this.offreService.createOffre(this.offre).subscribe({
      next: (created) => {
        this.messages.add({ severity: 'success', summary: 'Succès', detail: 'Offre créée avec succès' });
        this.created.emit(created);
        this.offreDialog = false;
        this.offre = {} as Offre;
      },
      error: (err) => {
        console.error(err);
        this.messages.add({ severity: 'error', summary: 'Erreur', detail: 'Création impossible' });
      },
      complete: () => this.loading.set(false)
    });
  }
}
