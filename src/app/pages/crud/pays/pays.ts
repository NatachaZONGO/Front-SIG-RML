import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CalendarModule } from 'primeng/calendar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { Pays } from './pays.model';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PaysService } from './pays.service';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule } from 'primeng/fileupload';
import { imageUrl } from '../../../Share/const';


interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-pays',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        TextareaModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        CalendarModule,
        RadioButtonModule,
        TableModule,
        CheckboxModule,
        RadioButtonModule,
        FileUploadModule

    ],
    templateUrl: './pays.component.html',
    providers: [MessageService, PaysService, ConfirmationService],
})
export class PaysComponent implements OnInit {
    paysDialog: boolean = false;
    listePays: Pays[] = [];
    paysSelectionnes: Pays[] = [];
    currentPays: Pays = this.emptyPays();
    submitted: boolean = false;
    flagSource: 'upload' | 'url' = 'url';
    fichierUpload?: File;

    @ViewChild('dt') dt!: Table;

    colonnes!: Column[];
    exportColonnes!: ExportColumn[];

    constructor(
        private paysService: PaysService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.chargerPays();
        this.initColonnes();
    }

    initColonnes() {
        this.colonnes = [
            { field: 'nom', header: 'Nom' },
            { field: 'code', header: 'Code ISO' },
            { field: 'flagImage', header: 'Drapeau' },
            { field: 'isActive', header: 'Statut' }
        ];
        this.exportColonnes = this.colonnes.map(col => ({
            title: col.header,
            dataKey: col.field
        }));
    }

    chargerPays() {
    this.paysService.getPays().subscribe({
        next: (res) => {
            this.listePays = res.data; // TypeScript sait maintenant que 'data' existe
        },
        error: (err: HttpErrorResponse) => this.afficherErreur('Erreur de chargement')
    });
}


    emptyPays(): Pays {
        return { 
            nom: '', 
            code: '', 
            isActive: true,
            flagImage: undefined
        };
    }

    ouvrirNouveau() {
        this.currentPays = this.emptyPays();
        this.flagSource = 'url';
        this.submitted = false;
        this.paysDialog = true;
    }

    modifierPays(pays: Pays) {
        this.currentPays = { ...pays };
        this.flagSource = pays.flagImage?.startsWith('http') ? 'url' : 'upload';
        this.paysDialog = true;
    }

    onFileUpload(event: { files: File[] }): void {
    if (event.files && event.files.length > 0) {
        this.fichierUpload = event.files[0];
        // Crée une URL d'aperçu pour l'image
        this.currentPays.flagImage = URL.createObjectURL(this.fichierUpload);
    }
}

   private buildPayload(): FormData {
  const fd = new FormData();
  fd.append('nom', this.currentPays.nom);
  fd.append('code', (this.currentPays.code || this.currentPays.code || '').toUpperCase());
  if (this.currentPays.indicatif_tel) fd.append('indicatif_tel', this.currentPays.indicatif_tel);
  fd.append('isActive', (this.currentPays.isActive ?? this.currentPays.isActive ?? true) ? '1' : '0');

  if (this.flagSource === 'upload' && this.fichierUpload) {
    fd.append('flag', this.fichierUpload);         // ✅ fichier
  } else if (this.flagSource === 'url') {
    fd.append('flag', this.currentPays.flagImage || ''); // ✅ URL ou '' pour effacer
  }
  return fd;
}

sauvegarderPays() {
  this.submitted = true;
  if (!this.currentPays.nom?.trim() || !this.currentPays.code?.trim()) {
    this.afficherErreur('Le nom et le code sont obligatoires');
    return;
  }

  const fd = new FormData();
  fd.append('nom', this.currentPays.nom);
  fd.append('code_iso', this.currentPays.code.toUpperCase());
  if (this.currentPays.isActive !== undefined) {
    fd.append('is_active', this.currentPays.isActive ? '1' : '0');
  }
  if (this.currentPays.indicatif_tel) {
    fd.append('indicatif_tel', this.currentPays.indicatif_tel);
  }

  // --- Drapeau : fichier OU URL dans la même clé 'flag'
  if (this.flagSource === 'upload' && this.fichierUpload) {
    fd.append('flag', this.fichierUpload);
  } else if (this.flagSource === 'url' && this.currentPays.flagImage) {
    fd.append('flag', this.currentPays.flagImage);
  } else if (this.currentPays.flagImage === '') {
    fd.append('flag', ''); // effacer
  }

  let req$;
  if (this.currentPays.id) {
    fd.append('_method', 'PUT'); // spoof pour Laravel
    req$ = this.paysService.updatePays(String(this.currentPays.id), fd);
  } else {
    req$ = this.paysService.createPays(fd);
  }

  req$.subscribe({
    next: () => { this.afficherSucces('Pays sauvegardé'); this.chargerPays(); this.paysDialog = false; },
    error: () => this.afficherErreur('Erreur de sauvegarde')
  });
}




    supprimerPays(pays: Pays) {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer ${pays.nom} ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (pays.id) {
                    this.paysService.deletePays(pays.id).subscribe({
                        next: () => {
                            this.afficherSucces('Pays supprimé');
                            this.chargerPays();
                        },
                        error: () => this.afficherErreur('Erreur de suppression')
                    });
                }
            }
        });
    }


    supprimerPaysSelectionnes() {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer les pays sélectionnés ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const requetesSuppression = this.paysSelectionnes
                    .filter(p => p.id)
                    .map(p => this.paysService.deletePays(p.id!));

                forkJoin(requetesSuppression).subscribe({
                    next: () => {
                        this.afficherSucces('Pays supprimés');
                        this.chargerPays();
                        this.paysSelectionnes = [];
                    },
                    error: () => this.afficherErreur('Erreur lors de la suppression')
                });
            }
        });
    }

    private afficherSucces(message: string) {
        this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: message,
            life: 3000
        });
    }

    private afficherErreur(message: string) {
        this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: message,
            life: 3000
        });
    }

    fermerDialog() {
        this.paysDialog = false;
        this.submitted = false;
    }
 
    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    exporterCSV() {
        this.dt.exportCSV();
    }

    getStatusSeverity(isActive: boolean | undefined) {
        return isActive ? 'success' : 'danger';
    }

    getFlagUrl(val?: string) {
    if (!val) return '';
    return /^https?:\/\//i.test(val) ? val : `${imageUrl}${val}`;
    }

}