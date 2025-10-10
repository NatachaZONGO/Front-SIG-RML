import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { EditorModule } from 'primeng/editor';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';

import { AuthService } from '../../auth/auth.service';
import { Offre, TypeContrat, TypeOffre } from '../../crud/offre/offre.model';
import { OffreService } from '../../crud/offre/offre.service';
import { TopbarWidget } from "./topbarwidget.component";

@Component({
  selector: 'app-publish-offre-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, DropdownModule, CalendarModule, InputNumberModule, InputTextModule, EditorModule,
    ToastModule, ProgressBarModule,
    TopbarWidget
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <topbar-widget></topbar-widget>
    
    <div class="min-h-screen bg-gray-50 py-8 px-4">
      <div class="container mx-auto max-w-5xl">
        
        <!-- En-tête -->
        <div class="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          <div class="bg-gradient-to-r from-blue-600 to-blue-500 p-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-white mb-2 flex items-center">
                  <i class="pi pi-briefcase mr-3"></i>
                  Publier une offre d'emploi
                </h1>
                <p class="text-white/90">Renseignez les informations pour publier votre offre</p>
              </div>
              <div class="hidden md:block">
                <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <i class="pi pi-file-edit text-white text-5xl"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Barre de progression -->
          <div *ngIf="loading()" class="px-8 pt-4">
            <p-progressBar mode="indeterminate" styleClass="h-2"></p-progressBar>
          </div>
        </div>

        <!-- Formulaire -->
        <form (ngSubmit)="saveOffre()">
          <div class="bg-white rounded-3xl shadow-xl overflow-hidden p-8">
            
            <!-- Section 1: Informations principales -->
            <div class="mb-8">
              <div class="flex items-center mb-6">
                <div class="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shrink-0">
                  1
                </div>
                <h2 class="text-xl font-bold text-gray-800 ml-4">Informations principales</h2>
              </div>

              <div class="space-y-6">
                <!-- Titre -->
                <div class="space-y-2">
                  <label for="titre" class="block font-semibold text-gray-700">
                    Titre de l'offre <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <i class="pi pi-tag absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10"></i>
                    <input
                      type="text"
                      pInputText
                      id="titre"
                      [(ngModel)]="offre.titre"
                      name="titre"
                      required
                      [disabled]="loading()"
                      placeholder="Ex: Développeur Angular (H/F)"
                      class="w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                      [class.border-red-500]="submitted && !offre.titre" />
                  </div>
                  <small class="text-red-500 flex items-center" *ngIf="submitted && !offre.titre">
                    <i class="pi pi-exclamation-circle mr-2"></i> Le titre est obligatoire
                  </small>
                </div>

                <!-- Type offre & contrat -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label for="type_offre" class="block font-semibold text-gray-700">
                      Type d'offre <span class="text-red-500">*</span>
                    </label>
                    <p-dropdown
                      id="type_offre"
                      [options]="typeOffreOptions"
                      [(ngModel)]="offre.type_offre"
                      name="type_offre"
                      placeholder="Sélectionner"
                      [showClear]="true"
                      styleClass="w-full"
                      [disabled]="loading()">
                    </p-dropdown>
                    <small class="text-red-500 flex items-center" *ngIf="submitted && !offre.type_offre">
                      <i class="pi pi-exclamation-circle mr-2"></i> Le type d'offre est obligatoire
                    </small>
                  </div>

                  <div class="space-y-2">
                    <label for="type_contrat" class="block font-semibold text-gray-700">
                      Type de contrat <span class="text-red-500">*</span>
                    </label>
                    <p-dropdown
                      id="type_contrat"
                      [options]="typeContratOptions"
                      [(ngModel)]="offre.type_contrat"
                      name="type_contrat"
                      placeholder="Sélectionner"
                      [showClear]="true"
                      styleClass="w-full"
                      [disabled]="loading()">
                    </p-dropdown>
                    <small class="text-red-500 flex items-center" *ngIf="submitted && !offre.type_contrat">
                      <i class="pi pi-exclamation-circle mr-2"></i> Le type de contrat est obligatoire
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: Détails du poste -->
            <div class="mb-8">
              <div class="flex items-center mb-6">
                <div class="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shrink-0">
                  2
                </div>
                <h2 class="text-xl font-bold text-gray-800 ml-4">Détails du poste</h2>
              </div>

              <div class="space-y-6">
                <!-- Localisation & Salaire -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label for="localisation" class="block font-semibold text-gray-700">
                      Localisation
                    </label>
                    <div class="relative">
                      <i class="pi pi-map-marker absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10"></i>
                      <input
                        type="text"
                        pInputText
                        id="localisation"
                        [(ngModel)]="offre.localisation"
                        name="localisation"
                        [disabled]="loading()"
                        placeholder="Ex: Ouagadougou, Burkina Faso"
                        class="w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors" />
                    </div>
                  </div>

                  <div class="space-y-2">
                    <label for="salaire" class="block font-semibold text-gray-700">
                      Salaire (FCFA)
                    </label>
                    <p-inputNumber
                      id="salaire"
                      [(ngModel)]="offre.salaire"
                      name="salaire"
                      mode="decimal"
                      [minFractionDigits]="0"
                      [maxFractionDigits]="0"
                      suffix=" FCFA"
                      styleClass="w-full"
                      [disabled]="loading()">
                    </p-inputNumber>
                  </div>
                </div>

                <!-- Expérience -->
                <div class="space-y-2">
                  <label for="experience" class="block font-semibold text-gray-700">
                    Expérience requise
                  </label>
                  <div class="relative">
                    <i class="pi pi-chart-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10"></i>
                    <input
                      type="text"
                      pInputText
                      id="experience"
                      [(ngModel)]="offre.experience"
                      name="experience"
                      [disabled]="loading()"
                      placeholder="Ex: 2-5 ans, Débutant accepté, Senior..."
                      class="w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors" />
                  </div>
                </div>

                <!-- Catégorie & Date d'expiration -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label for="categorie_id" class="block font-semibold text-gray-700">
                      Catégorie
                    </label>
                    <p-dropdown
                      id="categorie_id"
                      [options]="categories"
                      [(ngModel)]="offre.categorie_id"
                      name="categorie_id"
                      optionLabel="nom"
                      optionValue="id"
                      placeholder="Sélectionner une catégorie"
                      [showClear]="true"
                      [filter]="true"
                      filterBy="nom"
                      styleClass="w-full"
                      [disabled]="loading()">
                    </p-dropdown>
                  </div>

                  <div class="space-y-2">
                    <label for="date_expiration" class="block font-semibold text-gray-700">
                      Date d'expiration <span class="text-red-500">*</span>
                    </label>
                    <p-calendar
                      id="date_expiration"
                      [(ngModel)]="offre.date_expiration"
                      name="date_expiration"
                      dateFormat="dd/mm/yy"
                      [showIcon]="true"
                      styleClass="w-full"
                      [minDate]="minDate"
                      [disabled]="loading()">
                    </p-calendar>
                    <small class="text-red-500 flex items-center" *ngIf="submitted && !offre.date_expiration">
                      <i class="pi pi-exclamation-circle mr-2"></i> La date d'expiration est obligatoire
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 3: Description -->
            <div class="mb-8">
              <div class="flex items-center mb-6">
                <div class="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shrink-0">
                  3
                </div>
                <h2 class="text-xl font-bold text-gray-800 ml-4">Description du poste</h2>
              </div>

              <div class="space-y-2">
                <label for="description" class="block font-semibold text-gray-700">
                  Description complète <span class="text-red-500">*</span>
                </label>
                <p-editor
                  id="description"
                  [(ngModel)]="offre.description"
                  name="description"
                  [style]="{ height: '320px' }"
                  styleClass="w-full"
                  [disabled]="loading()">
                </p-editor>
                <small class="text-red-500 flex items-center" *ngIf="submitted && !offre.description">
                  <i class="pi pi-exclamation-circle mr-2"></i> La description est obligatoire
                </small>
                <small class="text-gray-500 flex items-center">
                  <i class="pi pi-info-circle mr-2"></i> Décrivez les missions, compétences requises et avantages
                </small>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
              <button 
                pButton 
                type="button" 
                label="Annuler" 
                icon="pi pi-times"
                class="p-button-secondary p-button-outlined"
                [disabled]="loading()"
                (click)="cancel()">
              </button>
              <button 
                pButton 
                type="submit" 
                label="Publier l'offre" 
                icon="pi pi-check"
                class="bg-blue-600"
                [loading]="loading()">
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>

    <style>
      /* Styles PrimeNG */
      ::ng-deep .p-dropdown {
        border-radius: 0.75rem !important;
        border: 2px solid #e5e7eb !important;
      }

      ::ng-deep .p-dropdown:hover {
        border-color: #3b82f6 !important;
      }

      ::ng-deep .p-calendar input {
        border-radius: 0.75rem !important;
        border: 2px solid #e5e7eb !important;
        padding: 0.75rem !important;
      }

      ::ng-deep .p-inputtext {
        border-radius: 0.75rem !important;
      }

      ::ng-deep .p-inputnumber input {
        border-radius: 0.75rem !important;
        border: 2px solid #e5e7eb !important;
        padding: 0.75rem !important;
      }

      ::ng-deep .p-editor-container {
        border-radius: 0.75rem !important;
        border: 2px solid #e5e7eb !important;
      }

      ::ng-deep .p-editor-container:hover {
        border-color: #3b82f6 !important;
      }

      /* Boutons */
      ::ng-deep .p-button {
        border-radius: 0.75rem !important;
        padding: 0.75rem 1.5rem !important;
        font-weight: 600 !important;
      }

      ::ng-deep .p-progressbar {
        border-radius: 0.5rem !important;
      }
    </style>
  `
})
export class PublishOffreComponent implements OnInit {
  submitted = false;
  loading = signal(false);

  offre!: Offre;
  categories: any[] = [];
  minDate = new Date();

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
    public router: Router,
    private messages: MessageService
  ) {}

  ngOnInit(): void {
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) { 
      this.router.navigate(['/connexion'], { queryParams: { returnUrl: '/publier-offre' }}); 
      return; 
    }

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

    this.loadCategories();
  }

  private loadCategories(): void {
    this.offreService.getCategories().subscribe({
      next: (cats: any) => {
        this.categories = Array.isArray(cats) ? cats : (cats?.categories ?? cats?.content ?? []);
      },
      error: () => this.categories = []
    });
  }

  saveOffre(): void {
    this.submitted = true;

    if (!this.offre?.titre?.trim() || !this.offre.type_offre || !this.offre.type_contrat || !this.offre.description || !this.offre.date_expiration) {
      this.messages.add({ 
        severity: 'warn', 
        summary: 'Champs requis', 
        detail: 'Veuillez compléter tous les champs obligatoires' 
      });
      return;
    }

    this.loading.set(true);
    this.offreService.createOffre(this.offre).subscribe({
      next: (_created) => {
        this.messages.add({ 
          severity: 'success', 
          summary: 'Succès', 
          detail: 'Offre publiée avec succès' 
        });
        setTimeout(() => {
          this.router.navigateByUrl('/offres');
        }, 1500);
      },
      error: (err) => {
        console.error(err);
        this.messages.add({ 
          severity: 'error', 
          summary: 'Erreur', 
          detail: 'Impossible de publier l\'offre' 
        });
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigateByUrl('/offres');
  }
}