import { Component, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, forkJoin, of } from 'rxjs';
import { takeUntil, finalize, catchError, map } from 'rxjs/operators';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CalendarModule } from 'primeng/calendar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmationService, MessageService } from 'primeng/api';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { OffreService } from './offre.service';
import { AuthService } from '../../auth/auth.service';
import { Offre, TypeOffre, TypeContrat } from './offre.model';
import { EditorModule } from 'primeng/editor';
import { CanSeeDirective } from '../../../Share/can_see/can_see.directive';
import { BackendURL } from '../../../Share/const';
import { HttpClient } from '@angular/common/http';
import { EntrepriseService } from '../entreprise/entreprise.service'; // ✅ AJOUTÉ
import { Router } from '@angular/router';

interface Column {
  field: string;
  header: string;
}
interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'app-offre',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    DialogModule,
    TagModule,
    ConfirmDialogModule,
    CalendarModule,
    IconFieldModule,
    InputIconModule,
    DropdownModule,
    TextareaModule,
    InputNumberModule,
    TooltipModule,
    ProgressBarModule,
    ReactiveFormsModule,
    EditorModule,
    CanSeeDirective,
  ],
  templateUrl: './offre.component.html',
  providers: [MessageService, ConfirmationService, OffreService]
})
export class OffreComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly ALLOW_ALL = true;
  
  // UI state
  offreDialog = false;
  rejetDialog = false;
  submitted = false;
  detailsDialog = false;
  featureDialogVisible = false;
  selectedOffres: Offre[] = [];
  selectedOffreForDetails?: Offre;
  
  // ✅ MODIFIÉ : Entreprise gérée par le CM
  selectedEntrepriseCM: any = null;
  
  // Signals
  offres = signal<Offre[]>([]);
  loading = signal<boolean>(false);

  // Data
  offre!: Offre;
  categories: any[] = [];
  role = '';
  motifRejet = '';

  minDate = new Date();
  
  // Table
  @ViewChild('dt') dt!: Table;
  cols!: Column[];
  exportColumns!: ExportColumn[];

  // Vedette (feature) UI
  featureForm = {
    sponsored_level: 1 as number,
    mode: 'duration' as 'duration' | 'until',
    duration_days: 30 as number,
    featured_until: null as Date | null
  };
  selectedOffreForFeature?: Offre;

  // Dropdown options (typées)
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
    { label: 'stage', value: 'stage' },
    { label: 'emploi', value: 'emploi' },
    { label: 'appel_offre', value: 'appel_offre' }
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
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private authService: AuthService,
    private http: HttpClient,
    private entrepriseService: EntrepriseService,
    private router: Router,  
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getUserRole() ?? '';
    
    if (this.role.toLowerCase() === 'community_manager') {
      this.subscribeToEntrepriseChanges();
    }

    this.cols = [
      { field: 'titre', header: 'Titre' },
      { field: 'entrepriseName', header: 'Entreprise' },
      { field: 'type_offre', header: 'Type Offre' },
      { field: 'type_contrat', header: 'Type Contrat' },
      { field: 'localisation', header: 'Localisation' },
      { field: 'salaire', header: 'Salaire' },
      { field: 'date_publication', header: 'Date Publication' },
      { field: 'date_expiration', header: 'Date Expiration' },
      { field: 'statut', header: 'Statut' }
    ];
    this.exportColumns = this.cols.map(c => ({ title: c.header, dataKey: c.field }));

    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ AJOUTÉ : Charger l'entreprise sélectionnée depuis localStorage
  private subscribeToEntrepriseChanges(): void {
    console.log('👂 Écoute des changements d\'entreprise...');
    
    this.entrepriseService.selectedEntreprise$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (entreprise) => {
          console.log('🔔 Notification entreprise reçue:', entreprise);
          
          if (entreprise) {
            console.log('✅ Nouvelle entreprise détectée:', entreprise.nom_entreprise);
            this.selectedEntrepriseCM = entreprise;
            
            // ✅ Recharger automatiquement les offres
            console.log('🔄 Rechargement des offres...');
            this.loadOffres();
          } else {
            console.log('⚠️ Aucune entreprise sélectionnée');
            this.selectedEntrepriseCM = null;
            this.offres.set([]);
          }
        },
        error: (err) => {
          console.error('❌ Erreur subscription entreprise:', err);
        }
      });
  }

  // ✅ SIMPLIFIÉ : Plus besoin de charger les entreprises
  loadInitialData(): void {
    this.loading.set(true);
    
    forkJoin({
      categories: this.offreService.getCategories()
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: res => {
          this.categories = (res as any)?.categories ?? (res as any)?.content ?? [];
          console.log('✅ Catégories chargées:', this.categories.length);
          
          // ✅ Pour les non-CM, charger les offres directement
          if (this.role.toLowerCase() !== 'community_manager') {
            this.loadOffres();
          } else {
            console.log('⏳ CM détecté, attente de la sélection d\'entreprise...');
          }
        },
        error: err => {
          console.error('❌ Erreur chargement catégories:', err);
          if (this.role.toLowerCase() !== 'community_manager') {
            this.loadOffres();
          }
        }
      });
  }

 loadOffres(): void {
    this.loading.set(true);

    const rawRole = this.authService.getUserRole();
    const role = rawRole?.toLowerCase()?.trim();
    
    console.log('📋 loadOffres() appelé');
    console.log('  - Rôle:', role);
    
    let entrepriseId: number | undefined = undefined;
    
    if (role === 'community_manager') {
      if (!this.selectedEntrepriseCM) {
        console.log('⚠️ CM sans entreprise sélectionnée, annulation du chargement');
        this.loading.set(false);
        this.offres.set([]);
        
        // ✅ Afficher un message à l'utilisateur
        this.messageService.add({
          severity: 'info',
          summary: 'Aucune entreprise sélectionnée',
          detail: 'Veuillez sélectionner une entreprise à gérer depuis la page "Entreprises"',
          life: 4000
        });
        return;
      }
      
      entrepriseId = this.selectedEntrepriseCM.id;
      console.log('🏢 Filtrage par entreprise:', {
        id: entrepriseId,
        nom: this.selectedEntrepriseCM.nom_entreprise
      });
    }
    
    const source$ = 
      role === 'recruteur'
        ? this.offreService.getMesOffres()
        : role === 'community_manager'
        ? this.offreService.getCommunityManagerOffres(entrepriseId)
        : this.offreService.getAdminOffres();

    console.log('📡 Endpoint utilisé:', 
      role === 'recruteur' ? 'mes-offres' : 
      role === 'community_manager' ? `community/offres?entreprise_id=${entrepriseId}` : 
      'offres (admin)'
    );

    source$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (respOrArray: any) => {
          console.log('📦 Réponse brute du serveur:', respOrArray);
          
          const rawList: any[] = Array.isArray(respOrArray)
            ? respOrArray
            : (respOrArray?.data?.data ?? respOrArray?.data ?? respOrArray?.content ?? []);

          console.log('✅ Nombre d\'offres récupérées:', rawList.length);
          
          if (role === 'community_manager' && this.selectedEntrepriseCM) {
            console.log(`🎯 Offres filtrées pour ${this.selectedEntrepriseCM.nom_entreprise}`);
          }

          const now = new Date().getTime();

          const list = rawList.map((o: any) => {
            const toDate = (v: any) => {
              if (!v) return null;
              if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
              const d = new Date(v);
              return isNaN(d.getTime()) ? null : d;
            };

            const exp = toDate(o.date_expiration);
            const pub = toDate(o.date_publication);
            const fu  = toDate(o.featured_until);

            const isExpired = exp ? exp.getTime() < now : false;
            const isActive  = o.statut === 'publiee' && !isExpired;

            const level = Number(o.sponsored_level ?? 0);
            const isFeaturedActive = level > 0 && (!fu || fu.getTime() > now);

            const featuredBadgeLabel =
              isFeaturedActive
                ? (level === 3 ? 'Vedette ★★★'
                  : level === 2 ? 'Vedette ★★'
                  : 'Vedette ★')
                : undefined;

            return {
              ...o,
              entrepriseName: o.entreprise?.nom_entreprise ?? 'Non renseignée',
              recruteurName: o.recruteur
                ? `${o.recruteur.firstname ?? ''} ${o.recruteur.lastname ?? ''}`.trim() || 'Non renseigné'
                : 'Non renseigné',
              categorieName: o.categorie?.nom ?? 'Non classée',
              validateurName: o.validateur
                ? `${o.validateur.firstname ?? ''} ${o.validateur.lastname ?? ''}`.trim() || undefined
                : undefined,
              date_publication: pub ?? o.date_publication,
              date_expiration: exp ?? o.date_expiration,
              isExpired,
              isActive,
              sponsored_level: level,
              featured_until: fu ?? o.featured_until,
              isFeaturedActive,
              featuredBadgeLabel,
            };
          });

          const sorted = [...list].sort((a, b) => {
            if (a.isFeaturedActive && !b.isFeaturedActive) return -1;
            if (!a.isFeaturedActive && b.isFeaturedActive) return 1;
            const la = Number(a.sponsored_level ?? 0);
            const lb = Number(b.sponsored_level ?? 0);
            if (la !== lb) return lb - la;
            const da = a.created_at ? new Date(a.created_at).getTime() : 0;
            const db = b.created_at ? new Date(b.created_at).getTime() : 0;
            return db - da;
          });

          this.offres.set(sorted as Offre[]);
          console.log('🎯 Offres finales affichées:', sorted.length);
        },
        error: (err) => {
          console.error('❌ Erreur chargement offres:', err);
          this.showErrorMessage('Erreur lors du chargement des offres');
          this.offres.set([]);
        }
      });
  }

  changerEntreprise(): void {
    this.router.navigate(['/dashboard/entreprises']);
  }

  // ---------- Table/filter ----------
  onGlobalFilter(table: Table, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  // ✅ MODIFIÉ : Ouvrir le dialog de création
  /** ✅ CORRIGÉ : Ouvrir le dialog de création */
openNew(): void {
  const currentUser = this.authService.getCurrentUser();
  const role = (this.role || '').toLowerCase().trim();
  
  console.log('📝 Création offre - Rôle:', role);
  console.log('  - User actuel:', currentUser);
  
  // ✅ BASE COMMUNE (tous les rôles)
  const baseOffre = {
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
    categorie_id: undefined
  };
  
  if (role === 'administrateur') {
    // ✅ ADMIN : Ne définit NI recruteur_id NI entreprise_id
    this.offre = {
      ...baseOffre
      // PAS de recruteur_id
      // PAS d'entreprise_id
    } as any;
    
    console.log('✅ Admin : Offre sans entreprise ni recruteur');
    
  } else if (role === 'recruteur') {
    // ✅ RECRUTEUR : Son propre ID
    this.offre = {
      ...baseOffre,
      recruteur_id: currentUser?.id || null
    } as any;
    
    console.log('✅ Recruteur : recruteur_id =', currentUser?.id);
    
  } else if (role === 'community_manager') {
    // ✅ CM : Doit avoir une entreprise sélectionnée
    if (!this.selectedEntrepriseCM) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aucune entreprise sélectionnée',
        detail: 'Veuillez d\'abord gérer une entreprise depuis la page "Entreprises"',
        life: 3000
      });
      return;
    }
    
    this.offre = {
      ...baseOffre,
      entreprise_id: this.selectedEntrepriseCM.id
      // PAS de recruteur_id (le backend le déduira)
    } as any;
    
    console.log('✅ CM : entreprise_id =', this.selectedEntrepriseCM.id);
    
  } else {
    // ✅ Rôle inconnu
    this.offre = {
      ...baseOffre
    } as any;
  }

  this.submitted = false;
  this.offreDialog = true;
}

  editOffre(offre: Offre): void {
    this.offre = { ...offre };
    if (typeof this.offre.date_publication === 'string') {
      this.offre.date_publication = new Date(this.offre.date_publication);
    }
    if (typeof this.offre.date_expiration === 'string') {
      this.offre.date_expiration = new Date(this.offre.date_expiration);
    }
    this.submitted = false;
    this.offreDialog = true;
  }

  hideDialog(): void {
    this.offreDialog = false;
    this.submitted = false;
  }

  // ✅ MODIFIÉ : Sauvegarder l'offre
 // ✅ MODIFIÉ : Sauvegarder l'offre
/** ✅ CORRIGÉ : Sauvegarder l'offre */
saveOffre(): void {
  this.submitted = true;

  // Validation minimale
  if (!this.offre?.titre?.trim() || !this.offre.type_offre || !this.offre.type_contrat) {
    this.showWarnMessage('Veuillez remplir les champs obligatoires');
    return;
  }

  const role = (this.role || '').toLowerCase().trim();
  
  console.log('📤 Sauvegarde offre');
  console.log('  - Rôle:', role);
  console.log('  - Offre brute:', { ...this.offre });

  // ✅ CONSTRUCTION DU PAYLOAD PROPRE
  const payload: any = {
    titre: this.offre.titre,
    description: this.offre.description,
    experience: this.offre.experience,
    localisation: this.offre.localisation,
    type_offre: this.offre.type_offre,
    type_contrat: this.offre.type_contrat,
    statut: this.offre.statut,
    date_publication: this.offre.date_publication,
    date_expiration: this.offre.date_expiration,
    salaire: this.offre.salaire,
    categorie_id: this.offre.categorie_id
  };

  // ✅ Ajouter l'ID si modification
  if (this.offre.id) {
    payload.id = this.offre.id;
  }

  // ✅ AJOUT CONDITIONNEL DES IDs (seulement si définis)
  if (this.offre.recruteur_id !== undefined && this.offre.recruteur_id !== null) {
    payload.recruteur_id = this.offre.recruteur_id;
  }

  if (this.offre.entreprise_id !== undefined && this.offre.entreprise_id !== null) {
    payload.entreprise_id = this.offre.entreprise_id;
  }

  console.log('📤 Payload final:', payload);

  this.loading.set(true);

  const req$ = payload.id
    ? this.offreService.updateOffre(payload.id, payload)
    : this.offreService.createOffre(payload);

  req$
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    )
    .subscribe({
      next: (response) => {
        console.log('✅ Offre sauvegardée:', response);
        this.showSuccessMessage(payload.id ? 'Offre mise à jour' : 'Offre créée');
        this.loadOffres();
        this.offreDialog = false;
        this.offre = {} as any;
      },
      error: err => {
        console.error('❌ Erreur saveOffre:', err);
        console.error('Détails:', err.error);
        this.showErrorMessage(err.error?.message || 'Erreur lors de la sauvegarde');
      }
    });
}


  // ✅ AJOUTÉ : Helper pour obtenir l'URL de l'image
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    return `${BackendURL.replace('/api/', '')}/storage/${imagePath}`;
  }

  // ✅ AJOUTÉ : Helper pour le statut d'entreprise
  getStatusSeverity(statut: string): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (statut) {
      case 'valide': return 'success';
      case 'en attente': return 'warn';
      case 'refuse': return 'danger';
      default: return 'secondary';
    }
  }

  // ---------- Delete ----------
  deleteOffre(offre: Offre): void {
    if (!offre?.id) return;

    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer l'offre « ${offre.titre} » ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.loading.set(true);
        this.offreService.deleteOffre(offre.id!)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading.set(false))
          )
          .subscribe({
            next: () => {
              this.showSuccessMessage('Offre supprimée avec succès');
              this.loadOffres();
            },
            error: err => {
              console.error('Erreur suppression:', err);
              this.showErrorMessage('Erreur lors de la suppression de l\'offre');
            }
          });
      }
    });
  }

  getTruncatedHTML(description: string): string {
    if (!description) return '';
    const plainText = this.getPlainText(description);
    if (plainText.length <= 50) return description;
    
    const truncated = plainText.substring(0, 50) + '...';
    return `<span>${truncated}</span>`;
  }

  getPlainText(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  deleteSelectedOffres(): void {
    if (!this.selectedOffres || this.selectedOffres.length === 0) return;

    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer ${this.selectedOffres.length} offre(s) sélectionnée(s) ?`,
      header: 'Confirmation de suppression multiple',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.loading.set(true);
        
        const deletePromises = this.selectedOffres.map(offre => 
          this.offreService.deleteOffre(offre.id!)
        );

        Promise.all(deletePromises)
          .then(() => {
            this.showSuccessMessage(`${this.selectedOffres.length} offre(s) supprimée(s) avec succès`);
            this.selectedOffres = [];
            this.loadOffres();
          })
          .catch(err => {
            console.error('Erreur suppression multiple:', err);
            this.showErrorMessage('Erreur lors de la suppression des offres');
          })
          .finally(() => {
            this.loading.set(false);
          });
      }
    });
  }

  // ---------- Workflow ----------
  soumettreValidation(offre: Offre): void {
    if (!offre?.id) return;
    this.loading.set(true);
    this.offreService.soumettreValidation(offre.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage('Offre soumise à validation');
          this.loadOffres();
        },
        error: err => {
          console.error('Erreur soumettreValidation:', err);
          this.showErrorMessage('Erreur lors de la soumission');
        }
      });
  }

  validerOffre(offre: Offre): void {
    if (!offre?.id) return;
    this.loading.set(true);
    this.offreService.validerOffre(offre.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage('Offre validée');
          this.loadOffres();
        },
        error: err => {
          console.error('Erreur validerOffre:', err);
          this.showErrorMessage('Erreur lors de la validation');
        }
      });
  }

  ouvrirDialogRejet(offre: Offre): void {
    this.offre = { ...offre };
    this.motifRejet = '';
    this.rejetDialog = true;
  }

  rejeterOffre(): void {
    if (!this.offre?.id || !this.motifRejet.trim()) return;
    this.loading.set(true);
    this.offreService.rejeterOffre(this.offre.id, this.motifRejet)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage('Offre rejetée');
          this.loadOffres();
          this.rejetDialog = false;
        },
        error: err => {
          console.error('Erreur rejeterOffre:', err);
          this.showErrorMessage('Erreur lors du rejet');
        }
      });
  }

  publierOffre(offre: Offre): void {
    if (!offre?.id) return;
    this.loading.set(true);
    this.offreService.publierOffre(offre.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage('Offre publiée');
          this.loadOffres();
        },
        error: err => {
          console.error('Erreur publierOffre:', err);
          this.showErrorMessage('Erreur lors de la publication');
        }
      });
  }

  fermerOffre(offre: Offre): void {
    if (!offre?.id) return;
    this.loading.set(true);
    this.offreService.fermerOffre(offre.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage('Offre fermée');
          this.loadOffres();
        },
        error: err => {
          console.error('Erreur fermerOffre:', err);
          this.showErrorMessage('Erreur lors de la fermeture');
        }
      });
  }

  openFeatureDialog(offre: Offre): void {
    this.selectedOffreForFeature = offre;
    this.featureForm = { sponsored_level: 1, mode: 'duration', duration_days: 30, featured_until: null };
    this.featureDialogVisible = true;
  }

  submitFeature(): void {
    if (!this.selectedOffreForFeature?.id) return;

    const body: any = { sponsored_level: this.featureForm.sponsored_level };
    if (this.featureForm.mode === 'duration') {
      body.duration_days = Math.max(1, Number(this.featureForm.duration_days || 30));
    } else if (this.featureForm.featured_until instanceof Date) {
      const d = this.featureForm.featured_until;
      const pad = (n: number) => String(n).padStart(2, '0');
      body.featured_until = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 23:59:59`;
    }

    this.loading.set(true);
    this.offreService.featureOffre(this.selectedOffreForFeature.id, body)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.showSuccessMessage('Offre passée en vedette');
          this.featureDialogVisible = false;
          this.loadOffres();
        },
        error: (e) => {
          console.error(e);
          this.showErrorMessage('Impossible de passer en vedette');
        }
      });
  }

  unfeature(offre: Offre): void {
    if (!offre?.id) return;
    this.loading.set(true);
    this.offreService.unfeatureOffre(offre.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.showSuccessMessage('Mise en vedette retirée');
          this.loadOffres();
        },
        error: (e) => {
          console.error(e);
          this.showErrorMessage('Impossible de retirer la vedette');
        }
      });
  }

  getFeatureSeverity(level?: number | null): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const n = Number(level ?? 0);
    if (n >= 3) return 'danger';
    if (n === 2) return 'warn';
    if (n === 1) return 'info';
    return 'secondary';
  }
  
  getFeatureLabel(level?: number | null): string {
    const n = Number(level ?? 0);
    return n > 0 ? `Vedette L${n}` : '—';
  }

  viewDetails(offre: Offre): void {
    this.selectedOffreForDetails = { ...offre };
    this.detailsDialog = true;
  }

  hideDetailsDialog(): void {
    this.detailsDialog = false;
    this.selectedOffreForDetails = undefined;
  }

  editFromDetails(): void {
    if (this.selectedOffreForDetails) {
      this.hideDetailsDialog();
      this.editOffre(this.selectedOffreForDetails);
    }
  }

  validerFromDetails(): void {
    if (this.selectedOffreForDetails) {
      this.hideDetailsDialog();
      this.validerOffre(this.selectedOffreForDetails);
    }
  }

  // ---------- Helpers ----------
  getSeverity(statut: string) {
    switch (statut) {
      case 'publiee': return 'success';
      case 'validee': return 'info';
      case 'en_attente_validation': return 'warn';
      case 'rejetee': return 'danger';
      case 'fermee': return 'secondary';
      case 'expiree': return 'contrast';
      case 'brouillon': return 'secondary';
      default: return 'secondary';
    }
  }

  getContratSeverity(typeContrat: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (typeContrat?.toLowerCase()) {
      case 'cdi': return 'success';
      case 'cdd': return 'warn';
      case 'stage': return 'info';
      case 'freelance': return 'secondary';
      case 'alternance': return 'secondary';
      case 'contrat_pro': return 'contrast';
      default: return 'secondary';
    }
  }

  getStatutSeverity(statut: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (statut) {
      case 'publiee': return 'success';
      case 'validee': return 'info';
      case 'en_attente_validation': return 'warn';
      case 'rejetee': return 'danger';
      case 'fermee': return 'secondary';
      case 'expiree': return 'contrast';
      case 'brouillon': return 'secondary';
      default: return 'secondary';
    }
  }

  private showSuccessMessage(detail: string) {
    this.messageService.add({ severity: 'success', summary: 'Succès', detail, life: 3000 });
  }
  
  private showErrorMessage(detail: string) {
    this.messageService.add({ severity: 'error', summary: 'Erreur', detail, life: 5000 });
  }
  
  private showWarnMessage(detail: string) {
    this.messageService.add({ severity: 'warn', summary: 'Attention', detail, life: 4000 });
  }

  // ---------- Exports ----------
  getExportLabel(format: string): string {
    const selectedCount = this.selectedOffres?.length || 0;
    if (selectedCount > 0) {
      return `Exporter ${format} (${selectedCount} sélectionnée${selectedCount > 1 ? 's' : ''})`;
    }
    return `Exporter ${format}`;
  }

  private getDataToExport(): Offre[] {
    return this.selectedOffres && this.selectedOffres.length > 0 
      ? this.selectedOffres 
      : this.offres();
  }

  exportCSV(): void {
    const dataToExport = this.getDataToExport();
    const selectedCount = this.selectedOffres?.length || 0;
    
    if (selectedCount > 0) {
      this.confirmationService.confirm({
        message: `Voulez-vous exporter seulement les ${selectedCount} offre(s) sélectionnée(s) ?`,
        header: 'Confirmation d\'export',
        icon: 'pi pi-question-circle',
        acceptLabel: 'Sélection uniquement',
        rejectLabel: 'Toutes les offres',
        accept: () => {
          this.executeCSVExport(this.selectedOffres);
        },
        reject: () => {
          this.executeCSVExport(this.offres());
        }
      });
    } else {
      this.executeCSVExport(this.offres());
    }
  }

  exportPDF(): void {
    const selectedCount = this.selectedOffres?.length || 0;
    
    if (selectedCount > 0) {
      this.confirmationService.confirm({
        message: `Voulez-vous exporter seulement les ${selectedCount} offre(s) sélectionnée(s) ?`,
        header: 'Confirmation d\'export',
        icon: 'pi pi-question-circle',
        acceptLabel: 'Sélection uniquement',
        rejectLabel: 'Toutes les offres',
        accept: () => {
          this.executePDFExport(this.selectedOffres);
        },
        reject: () => {
          this.executePDFExport(this.offres());
        }
      });
    } else {
      this.executePDFExport(this.offres());
    }
  }

  private executeCSVExport(data: Offre[]): void {
    if (!data || data.length === 0) {
      this.showWarnMessage('Aucune donnée à exporter');
      return;
    }

    const csvData = data.map((offre: any) => ({
      'ID': offre.id?.toString() || '',
      'Titre': offre.titre || '',
      'Entreprise': offre.entreprise?.nom_entreprise || '',
      'Type Offre': offre.type_offre || '',
      'Type Contrat': offre.type_contrat || '',
      'Localisation': offre.localisation || '',
      'Salaire': offre.salaire?.toString() || '0',
      'Expérience': offre.experience || '',
      'Date Publication': offre.date_publication ? new Date(offre.date_publication).toLocaleDateString('fr-FR') : '',
      'Date Expiration': offre.date_expiration ? new Date(offre.date_expiration).toLocaleDateString('fr-FR') : '',
      'Statut': offre.statut || '',
      'Créée le': offre.created_at ? new Date(offre.created_at).toLocaleDateString('fr-FR') : ''
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const fileName = this.selectedOffres?.length > 0 
      ? `offres_selection_${this.selectedOffres.length}.csv`
      : 'offres_toutes.csv';
    
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showSuccessMessage(`${data.length} offre(s) exportée(s) en CSV`);
  }

  private executePDFExport(data: Offre[]): void {
    if (!data || data.length === 0) {
      this.showWarnMessage('Aucune donnée à exporter');
      return;
    }

    const doc = new jsPDF();
    
    const title = this.selectedOffres?.length > 0 
      ? `Offres sélectionnées (${data.length})`
      : `Liste des offres (${data.length})`;
    
    doc.text(title, 14, 10);

    const headers = [['ID', 'Titre', 'Entreprise', 'Type Offre', 'Localisation', 'Salaire', 'Date Publication', 'Statut']];
    const pdfData = data.map((o: any) => [
      o.id?.toString() || '',
      o.titre || '',
      o.entreprise?.nom_entreprise || '',
      o.type_offre || '',
      o.localisation || '',
      (o.salaire || 0).toString() + ' FCFA',
      o.date_publication ? new Date(o.date_publication).toLocaleDateString('fr-FR') : '',
      o.statut || ''
    ]);

    autoTable(doc, { 
      head: headers, 
      body: pdfData, 
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] }
    });

    const fileName = this.selectedOffres?.length > 0 
      ? `offres_selection_${this.selectedOffres.length}.pdf`
      : 'offres_toutes.pdf';
    
    doc.save(fileName);
    
    this.showSuccessMessage(`${data.length} offre(s) exportée(s) en PDF`);
  }

  private get currentUserId(): number | undefined {
    return this.authService.getCurrentUser()?.id;
  }

  setExpirationDays(days: number): void {
    const date = new Date();
    date.setDate(date.getDate() + days);
    this.offre.date_expiration = date;
  }

  saveAsDraft(): void {
    this.offre.statut = 'brouillon';
    this.saveOffre();
  }

  canEdit(_offre: Offre): boolean { return this.ALLOW_ALL; }
  canDelete(_offre: Offre): boolean { return this.ALLOW_ALL; }
  canSubmitValidation(_offre: Offre): boolean { return this.ALLOW_ALL; }
  canValidate(_offre: Offre): boolean { return this.ALLOW_ALL; }
  canPublish(_offre: Offre): boolean { return this.ALLOW_ALL; }
  canClose(_offre: Offre): boolean { return this.ALLOW_ALL; }
}