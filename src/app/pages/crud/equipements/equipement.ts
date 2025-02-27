import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { imageUrl } from '../../../const';
import { Equipementservice } from './equipement.service';
import { Equipement } from './equipement.model';
import { Laboratoireservice } from '../laboratoire/laboratoire.service';
import { Laboratoire } from '../laboratoire/laboratoire.model';


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
    selector: 'app-crud',
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
        DialogModule,
        TagModule,
        ConfirmDialogModule,
        DatePickerModule,
        ToggleButtonModule,
        ToggleSwitchModule,
        SelectModule,
        IconFieldModule,
        InputIconModule,
        DropdownModule,

    ],
    templateUrl: './equipement.component.html',
    providers: [MessageService, Equipementservice, ConfirmationService, Laboratoireservice],
})
export class Equipementt implements OnInit {
    equipementDialog: boolean = false;
    equipements = signal<Equipement[]>([]);
    equipement: Equipement = {};
    selectedEquipements: Equipement[] | null = [];
    submitted: boolean = false;
    
    laboratoires: Laboratoire[] = [];
   

    @ViewChild('dt') dt!: Table;

    cols!: Column[];
    exportColumns!: ExportColumn[];

    dropdownValues = [
         'Neuf' ,
        'En maintenance' ,
        'Hors service' ,
    ];

    constructor(
        private equipementService: Equipementservice,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private laboratoireService: Laboratoireservice,
    ) {}

    ngOnInit() {
        this.loadEquipementsWithLaboratoires();
        this.loadLaboratoires();
        this.cols = [
            { field: 'name', header: 'Nom' },
            { field: 'description', header: 'Description' },
            { field: 'estDisponible', header: 'Disponibilité' },
            { field: 'estMutualisable', header: 'Mutualisation' },
            { field: 'etat', header: 'État' },
            { field: 'acquereur', header: 'Acquéreur' },
            { field: 'typeAcquisition', header: 'Type d\'Acquisition' },
            { field: 'laboratoire.name', header: 'Laboratoire' }, 
            { field: 'dateAjout', header: 'Date d\'Ajout' },
            { field: 'dateModification', header: 'Date de Modification' },
            { field: 'image', header: 'Images' }, 
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));

    }

    loadLaboratoires() {
        this.laboratoireService.getLaboratoires().subscribe({
            next: (data) => {
                this.laboratoires = data.content;
            },
            error: (err) => console.error('Erreur lors du chargement des laboratoires', err),
        });
    }

    loadEquipements() {
        this.equipementService.getEquipements().subscribe({
            next: (data) => {
                console.log('Données reçues de l\'API :', data); // Log les données
                this.equipements.set(data);
            },
            error: (err) => console.error('Erreur lors du chargement des équipements', err),
        });
    }

    openNew() {
        this.equipement = {};
        this.submitted = false;
        this.equipementDialog = true;
    }

    editEquipement(equipement: Equipement) {
        this.equipement = { ...equipement };
        this.equipementDialog = true;
    }

    deleteSelectedEquipements() {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer les équipements sélectionnés ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedEquipements) {
                    this.selectedEquipements.forEach((equipement) => {
                        if (equipement.id) {
                            this.equipementService.deleteEquipement(equipement.id).subscribe({
                                next: () => {
                                    this.equipements.set(this.equipements().filter((val) => val.id !== equipement.id));
                                },
                                error: (err) => console.error('Erreur lors de la suppression de l\'équipement', err),
                            });
                        }
                    });
                    this.selectedEquipements = null;
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Équipements supprimés', life: 3000 });
                }
            },
        });
    }

    deleteEquipement(equipement: Equipement) {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer ' + equipement.nom + ' ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (equipement.id) {
                    this.equipementService.deleteEquipement(equipement.id).subscribe({
                        next: () => {
                            this.equipements.set(this.equipements().filter((val) => val.id !== equipement.id));
                            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Équipement supprimé', life: 3000 });
                        },
                        error: (err) => console.error('Erreur lors de la suppression de l\'équipement', err),
                    });
                }
            },
        });
    }

    saveEquipement() {
        this.submitted = true;
    
        // Vérification de la saisie
        if (!this.equipement.nom || !this.equipement.description || !this.equipement.laboratoire_id) {
            return;
        }
    
        const formData = new FormData();
        formData.append('nom', this.equipement.nom);
        formData.append('description', this.equipement.description);
        formData.append('estdisponible', this.equipement.estdisponible ? '1' : '0');
        formData.append('estmutualisable', this.equipement.estmutualisable ? '1' : '0');
        if (this.equipement.etat) {
            formData.append('etat', this.equipement.etat);
        }
        formData.append('acquereur', this.equipement.acquereur || '');
        if (this.equipement.typeacquisition) {
            formData.append('typeacquisition', this.equipement.typeacquisition);
        }
        formData.append('laboratoire_id', this.equipement.laboratoire_id);
    
        if (this.equipement.image) {
            formData.append('image', this.equipement.image); // Ajoute l'image uniquement si elle existe
        }
    
        if (this.equipement.id) {
            this.equipementService.updateEquipement(this.equipement.id, formData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Équipement mis à jour', life: 3000 });
                    this.loadEquipementsWithLaboratoires();
                },
                error: (err) => console.error('Erreur lors de la mise à jour', err),
            });
        } else {
            this.equipementService.createEquipement(formData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Équipement créé', life: 3000 });
                    this.loadEquipementsWithLaboratoires();
                },
                error: (err) => console.error('Erreur lors de la création', err),
            });
        }
    
        this.equipementDialog = false;
        this.equipement = {};
    }
    
    

    hideDialog() {
        this.equipementDialog = false;
        this.submitted = false;
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    getEquipements(): Observable<Equipement[]> {
        return this.equipementService.getEquipements().pipe(
            map((response) => response || []),
            catchError((err) => {
                console.error("Erreur lors de la récupération des équipements", err);
                return of([]);
            })
        );
    }
    
    loadEquipementsWithLaboratoires() {
        this.equipementService.getEquipementsWithLaboratoires().subscribe({
            next: (data) => {
                console.log('Données reçues de l\'API avec laboratoires :', data); // Log les données
                this.equipements.set(data);
            },
            error: (err) => console.error('Erreur lors du chargement des équipements avec laboratoires', err),
        });
    }

    onFileChange(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.equipement.image = file; // Stocke le fichier directement
        }
    }
    

      getImageUrl(imagePath: string): string {
        return `${imageUrl}/${imagePath}`;
    }

}