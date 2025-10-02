import { Component, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EntrepriseService } from './entreprise.service';
import { Entreprise, CreateEntrepriseRequest, UpdateEntrepriseRequest } from './entreprise.model';
import { FileUploadModule } from 'primeng/fileupload';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { PRIME_NG_CONFIG, PrimeNG } from 'primeng/config';
import { DropdownModule } from 'primeng/dropdown';
import { imageUrl } from '../../../const';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-entreprise',
  templateUrl: './entreprise.component.html',
  standalone: true,
  imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        DialogModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        ProgressBarModule,
        TooltipModule,
        RadioButtonModule,
        FileUploadModule,
        TagModule,
        DropdownModule,

    ],
  providers: [ConfirmationService, MessageService]

})
export class EntrepriseComponent implements OnInit {
  // Signaux pour la réactivité
  entreprises = signal<Entreprise[]>([]);
  
  // État du composant
  entrepriseDialog = false;
  validationDialog = false;
  rejectionDialog = false;
  submitted = false;
  selectedEntreprises: Entreprise[] = [];
  currentEntreprise: Entreprise | null = null;
  rejectionMotif = '';
  
  // Données pour les formulaires
  entreprise: Entreprise = this.getEmptyEntreprise();
  selectedFile: File | null = null;
  previewLogoUrl: string | null = null;
  
  // Options pour les dropdowns
  statuts = [
    { label: 'En attente', value: 'en attente' },
    { label: 'Validé', value: 'valide' },
    { label: 'Refusé', value: 'refuse' }
  ];
  
  secteursActivite = [
    { label: 'Primaire', value: 'primaire' },
    { label: 'Secondaire', value: 'secondaire' },
    { label: 'Tertiaire', value: 'tertiaire' },
    { label: 'Quaternaire', value: 'quaternaire' }
  ];
  
  statusFilterOptions = [
    { label: 'Tous les statuts', value: '' },
    { label: 'En attente', value: 'en attente' },
    { label: 'Validé', value: 'valide' },
    { label: 'Refusé', value: 'refuse' }
  ];

   hasMotif(val: unknown): boolean {
  const s = (val ?? '').toString().trim().toLowerCase();
  return !!s && s !== 'null' && s !== 'undefined';
}

sanitizeMotif(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined;
  const s = String(val).trim();
  // on renvoie UNDEFINED (pas null) pour rester compatible avec l’interface
  return s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' ? undefined : s;
}

  
  pays: any[] = [];
  users: any[] = [];
  selectedStatusFilter = '';
  
  // Pagination
  totalRecords = 0;
  currentPage = 1;
  rowsPerPage = 15;
  
  constructor(
    private entrepriseService: EntrepriseService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}
  
  ngOnInit() {
    this.loadEntreprises();
    this.loadPays();
    this.loadUsers();
  }
  

  get dialogHeader(): string {
    return this.entreprise?.id ? 'Modifier l\'entreprise' : 'Nouvelle entreprise';
  }
  loadEntreprises() {
    this.entrepriseService.getEntreprises({
      page: this.currentPage,
      per_page: this.rowsPerPage,
      status: this.selectedStatusFilter || undefined
    }).subscribe({
      next: (response) => {
  if (response.success && response.data) {
  const items = (response.data.data || []).map(e => ({
    ...e,
    motif_rejet: this.sanitizeMotif((e as any).motif_rejet)
  }));
  this.entreprises.set(items); // plus d'erreur TS
  this.totalRecords = response.data.total;
}
},

      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des entreprises'
        });
      }
    });
  }
  
  loadPays() {
  this.entrepriseService.getPays().subscribe({
    next: (response) => {
      if (response) {
        this.pays = response.map(p => ({ label: p.nom, value: p.id }));
      }
    },
    error: (error) => {
      console.error('Erreur lors du chargement des pays:', error);
    }
  });
}
  
  loadUsers() {
  this.entrepriseService.getUsers().subscribe({
    next: (response) => {
      if (response) {
        this.users = response.map(u => ({ 
          label: `${u.nom} ${u.prenom} (${u.email})`, 
          value: u.id 
        }));
      }
    },
    error: (error) => {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  });
}
  
  openNew() {
    this.entreprise = this.getEmptyEntreprise();
    this.selectedFile = null;
    this.previewLogoUrl = null;
    this.submitted = false;
    this.entrepriseDialog = true;
  }
  
  editEntreprise(entreprise: Entreprise) {
    this.entreprise = { ...entreprise };
    this.selectedFile = null;
    this.previewLogoUrl = null;
    this.submitted = false;
    this.entrepriseDialog = true;
  }
  
  deleteEntreprise(entreprise: Entreprise) {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer l'entreprise "${entreprise.nom_entreprise}" ?`,
      header: 'Confirmer',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (entreprise.id) {
          this.entrepriseService.deleteEntreprise(entreprise.id).subscribe({
            next: (response) => {
              if (response.success) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Succès',
                  detail: 'Entreprise supprimée avec succès'
                });
                this.loadEntreprises();
              }
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Erreur lors de la suppression'
              });
            }
          });
        }
      }
    });
  }
  
  deleteSelectedEntreprises() {
  if (!this.selectedEntreprises?.length) return;

  this.confirmationService.confirm({
    message: 'Êtes-vous sûr de vouloir supprimer les entreprises sélectionnées ?',
    header: 'Confirmer',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      const calls = this.selectedEntreprises
        .filter(e => e.id)
        .map(e => this.entrepriseService.deleteEntreprise(e.id!));

      forkJoin(calls).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Entreprises supprimées avec succès' });
          this.loadEntreprises();
          this.selectedEntreprises = [];
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la suppression' });
        }
      });
    }
  });
}
  
  
 saveEntreprise() {
    this.submitted = true;

    // Validation minimale
    if (!this.entreprise.nom_entreprise?.trim() || !this.entreprise.secteur_activite?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Champs requis',
        detail: 'Nom de l’entreprise et secteur d’activité sont obligatoires.'
      });
      return;
    }

    // Construire le payload attendu par le backend
    const base: any = { ...this.entreprise };

    // Logo : pour l’instant on envoie une URL (le backend valide "logo" comme string)
    // Si un fichier a été choisi, on ignore (tant que l’API n’accepte pas un upload direct)
    if (this.selectedFile) {
      this.messageService.add({
        severity: 'info',
        summary: 'Logo',
      });
    }

    // Choix du flux : update si id présent, sinon create
    if (this.entreprise.id) {
      this.entrepriseService.updateEntreprise(this.entreprise.id, base).subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Entreprise mise à jour avec succès'
            });
            this.loadEntreprises();
            this.hideDialog();
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la mise à jour'
          });
        }
      });
    } else {
      // Création : l’API exige user_id
      if (!this.entreprise.user_id) {
        this.messageService.add({
          severity: 'error',
          summary: 'Utilisateur requis',
          detail: 'Veuillez sélectionner un utilisateur propriétaire.'
        });
        return;
      }

      this.entrepriseService.createEntreprise(base).subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Entreprise créée avec succès'
            });
            this.loadEntreprises();
            this.hideDialog();
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la création'
          });
        }
      });
    }
  }

  
  
  hideDialog() {
    this.entrepriseDialog = false;
    this.submitted = false;
    this.selectedFile = null;
    this.previewLogoUrl = null;
  }
  
onFileChange(event: any) {
  const file = event.target.files?.[0];
  if (file) {
    this.selectedFile = file;
    this.previewLogoUrl = URL.createObjectURL(file);
    this.entreprise.logoFile = file;   // ✅ on n’écrase plus .logo (string)
  }
}


    

  getImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  // Si c’est une URL complète, on l’utilise telle quelle
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  // Sinon on préfixe par le storage Laravel
  return `${imageUrl}${imagePath}`;
}

  
  
  onStatusFilterChange(event: any) {
    this.selectedStatusFilter = event.value;
    this.currentPage = 1;
    this.loadEntreprises();
  }
  
  onGlobalFilter(table: any, event: any) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
  
  onPageChange(event: any) {
  // event.first = index du 1er enregistrement (0, 15, 30, …)
  // event.rows  = nombre de lignes par page
  const first = event.first ?? 0;
  const rows  = event.rows  ?? this.rowsPerPage;
  this.currentPage = Math.floor(first / rows) + 1;
  this.rowsPerPage = rows;
  this.loadEntreprises();
}
  
  // Actions de validation
  openValidationDialog(e: Entreprise) {
  this.currentEntreprise = e;
  this.validationDialog = true;
}

openRejectionDialog(e: Entreprise) {
  this.currentEntreprise = e;
  this.rejectionMotif = '';
  this.rejectionDialog = true;
}
  validateEntreprise() {
  if (!this.currentEntreprise?.id) return;
  this.entrepriseService.validateEntreprise(this.currentEntreprise.id).subscribe({
    next: (res) => {
      this.messageService.add({ severity:'success', summary:'Succès', detail: res.message || 'Entreprise validée.' });
      this.loadEntreprises();
      this.validationDialog = false;
    },
    error: (error) => {
      const msg = error?.error?.message || 'Erreur lors de la validation';
      this.messageService.add({ severity:'error', summary:'Erreur', detail: msg });
    }
  });
}

rejectEntreprise() {
  if (!this.currentEntreprise?.id || !this.rejectionMotif.trim()) return;
  this.entrepriseService.rejectEntreprise(this.currentEntreprise.id, this.rejectionMotif.trim()).subscribe({
    next: (res) => {
      this.messageService.add({ severity:'success', summary:'Succès', detail: res.message || 'Entreprise rejetée.' });
      this.loadEntreprises();
      this.rejectionDialog = false;
    },
    error: (error) => {
      const msg = error?.error?.message || 'Erreur lors du rejet';
      this.messageService.add({ severity:'error', summary:'Erreur', detail: msg });
    }
  });
}

revaliderDepuisRefuse(entreprise: Entreprise) {
  if (!entreprise.id) return;
  this.entrepriseService.revalidateEntreprise(entreprise.id).subscribe({
    next: (res) => {
      this.messageService.add({ severity:'success', summary:'Succès', detail: res.message || 'Entreprise revalidée.' });
      this.loadEntreprises();
    },
    error: (error) => {
      const msg = error?.error?.message || 'Erreur lors de la revalidation';
      this.messageService.add({ severity:'error', summary:'Erreur', detail: msg });
    }
  });
}


  
  exportCSV() {
  const rows = this.entreprises();
  if (!rows.length) return;

  // Sélectionne les colonnes à exporter
  const headers = ['ID','Nom','Secteur','Email','Téléphone','Site web','Statut','Pays','Motif rejet'];
  const data = rows.map(e => ([
    e.id ?? '',
    e.nom_entreprise ?? '',
    e.secteur_activite ?? '',
    e.email ?? '',
    e.telephone ?? '',
    e.site_web ?? '',
    e.statut ?? '',
    e.pays?.nom ?? '',
    (this.hasMotif(e.motif_rejet) ? String(e.motif_rejet) : '')
  ]));

  // CSV simple avec ; pour Excel FR
  const escape = (v: string) => {
    const s = (v ?? '').toString().replace(/"/g, '""');
    return `"${s}"`;
  };
  const csv = [
    headers.map(escape).join(';'),
    ...data.map(r => r.map(x => escape(String(x))).join(';'))
  ].join('\r\n');

  // Ajoute BOM pour caractères accentués sous Excel
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `entreprises_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
  
  exportPDF() {
  const rows = this.entreprises();
  if (!rows.length) return;

  const htmlRows = rows.map(e => `
    <tr>
      <td>${e.id ?? ''}</td>
      <td>${e.nom_entreprise ?? ''}</td>
      <td>${e.secteur_activite ?? ''}</td>
      <td>${e.email ?? ''}</td>
      <td>${e.telephone ?? ''}</td>
      <td>${e.site_web ?? ''}</td>
      <td>${e.statut ?? ''}</td>
      <td>${e.pays?.nom ?? ''}</td>
      <td>${this.hasMotif(e.motif_rejet) ? String(e.motif_rejet) : ''}</td>
    </tr>
  `).join('');

  const w = window.open('', '_blank', 'width=1024,height=768');
  if (!w) return;

  w.document.write(`
    <html lang="fr"><head>
      <meta charset="utf-8" />
      <title>Export Entreprises</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; }
        h1 { font-size: 18px; margin: 0 0 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
        th { background: #f5f5f5; text-align: left; }
      </style>
    </head><body>
      <h1>Export des entreprises</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Nom</th><th>Secteur</th><th>Email</th>
            <th>Téléphone</th><th>Site web</th><th>Statut</th><th>Pays</th><th>Motif rejet</th>
          </tr>
        </thead>
        <tbody>${htmlRows}</tbody>
      </table>
      <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); }<\/script>
    </body></html>
  `);
  w.document.close();
}

  
  private getEmptyEntreprise(): Entreprise {
    return {
      nom_entreprise: '',
      description: '',
      site_web: '',
      telephone: '',
      email: '',
      secteur_activite: '',
      logo: '',
      pays_id: undefined,
      user_id: undefined,
      statut: 'en attente'
    };
  }
  
  getStatusSeverity(statut: string) {
  switch (statut) {
    case 'valide': return 'success';
    case 'refuse': return 'danger';
    case 'en attente': return 'warn';
    default: return 'info';
  }
}




}