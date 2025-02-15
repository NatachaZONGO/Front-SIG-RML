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
import { Equipement, Equipementservice } from '../service/equipement.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';

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
    template: `
        <p-toast />
        <p-confirmDialog />

        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nouveau" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Supprimer" icon="pi pi-trash" outlined (onClick)="deleteSelectedEquipements()" [disabled]="!selectedEquipements || !selectedEquipements.length" />
            </ng-template>

            <ng-template #end>
                <p-button label="Exporter" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="equipements()"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['name', 'description', 'etat', 'acquereur', 'typeAcquisition']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedEquipements"
            [rowHover]="true"
            dataKey="_id"
            currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} entrées"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestion des Équipements</h5>
                    <p-iconField>
                        <p-inputIcon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Rechercher..." />
                    </p-iconField>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th style="width: 3rem">
                        <p-tableHeaderCheckbox />
                    </th>
                    <th pSortableColumn="name" style="min-width:16rem">
                        Nom <p-sortIcon field="name" />
                    </th>
                    <th pSortableColumn="description" style="min-width:16rem">
                        Description <p-sortIcon field="description" />
                    </th>
                    <th pSortableColumn="estDisponible" style="min-width:16rem">
                        Disponibilité <p-sortIcon field="estDisponible" />
                    </th>
                    <th pSortableColumn="estMutualisable" style="min-width:16rem">
                        Mutualisation <p-sortIcon field="estMutualisable" />
                    </th>
                    <th pSortableColumn="etat" style="min-width:16rem">
                        État <p-sortIcon field="etat" />
                    </th>
                    <th pSortableColumn="acquereur" style="min-width:16rem">
                        Acquéreur <p-sortIcon field="acquereur" />
                    </th>
                    <th pSortableColumn="typeAcquisition" style="min-width:16rem">
                        Type d'Acquisition <p-sortIcon field="typeAcquisition" />
                    </th>
                    <th pSortableColumn="dateAjout" style="min-width:16rem">
                        Date d'Ajout <p-sortIcon field="dateAjout" />
                    </th>
                    <th pSortableColumn="dateModification" style="min-width:16rem">
                        Date de Modification <p-sortIcon field="dateModification" />
                    </th>
                    <th style="min-width: 12rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-equipement>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="equipement" />
                    </td>
                    <td style="min-width: 16rem">{{ equipement.name }}</td>
                    <td style="min-width: 16rem">{{ equipement.description }}</td>
                    <td style="min-width: 16rem">{{ equipement.estDisponible ? 'Oui' : 'Non' }}</td>
                    <td style="min-width: 16rem">{{ equipement.estMutualisable ? 'Oui' : 'Non' }}</td>
                    <td style="min-width: 16rem">{{ equipement.etat }}</td>
                    <td style="min-width: 16rem">{{ equipement.acquereur }}</td>
                    <td style="min-width: 16rem">{{ equipement.typeAcquisition }}</td>
                    <td style="min-width: 16rem">{{ equipement.dateAjout | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    <td style="min-width: 16rem">{{ equipement.dateModification | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editEquipement(equipement)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteEquipement(equipement)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="equipementDialog" [style]="{ width: '800px' }" header="Détails de l'Équipement" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="name" class="block font-bold mb-3">Nom</label>
                        <input type="text" pInputText id="name" [(ngModel)]="equipement.name" required autofocus />
                        <small class="text-red-500" *ngIf="submitted && !equipement.name">Le nom est obligatoire.</small>
                    </div>
                    <div>
                        <label for="description" class="block font-bold mb-3">Description</label>
                        <textarea pInputTextarea id="description" [(ngModel)]="equipement.description" required></textarea>
                        <small class="text-red-500" *ngIf="submitted && !equipement.description">La description est obligatoire.</small>
                    </div>
                    <div class="flex justify-between gap-4">
                        <div class="flex items-center gap-2 w-1/2">
                            <label class="font-semibold text-lg">Disponibilité :</label>
                            <p-toggleswitch [(ngModel)]="equipement.estDisponible"></p-toggleswitch>
                            <span class="font-bold" [ngClass]="{'text-green-500': equipement.estDisponible, 'text-red-500': !equipement.estDisponible}">
                                {{ equipement.estDisponible ? 'Oui' : 'Non' }}
                            </span>
                        </div>
                        <div class="flex items-center gap-2 w-1/2">
                            <label class="font-semibold text-lg">Mutualisation :</label>
                            <p-toggleswitch [(ngModel)]="equipement.estMutualisable"></p-toggleswitch>
                            <span class="font-bold" [ngClass]="{'text-green-500': equipement.estMutualisable, 'text-red-500': !equipement.estMutualisable}">
                                {{ equipement.estMutualisable ? 'Oui' : 'Non' }}
                            </span>
                        </div>
                    </div>
                    <div>
                        <label for="etat" class="block font-bold mb-3">État</label>
                        <p-dropdown [(ngModel)]="equipement.etat" [options]="dropdownValues" optionLabel="name" placeholder="Sélectionner un état"></p-dropdown>
                        <small class="text-red-500" *ngIf="submitted && !equipement.etat">L'état est obligatoire.</small>
                    </div>
                    <div class="flex justify-between gap-4">
                        <div class="w-1/2">
                            <label for="acquereur" class="block font-bold mb-3">Acquéreur</label>
                            <input type="text" pInputText id="acquereur" [(ngModel)]="equipement.acquereur" required />
                        </div>
                        <div class="w-1/2">
                            <label for="typeAcquisition" class="block font-bold mb-3">Type d'Acquisition</label>
                            <input type="text" pInputText id="typeAcquisition" [(ngModel)]="equipement.typeAcquisition" required />
                        </div>
                    </div>
                    <div class="flex justify-between gap-4">
                        <div class="w-1/2">
                            <label class="font-semibold text-lg">Date d'Ajout</label>
                            <p-datepicker [showIcon]="true" [showButtonBar]="true" [(ngModel)]="equipement.dateAjout"></p-datepicker>
                        </div>
                        <div class="w-1/2">
                            <label class="font-semibold text-lg">Date de Modification</label>
                            <p-datepicker [showIcon]="true" [showButtonBar]="true" [(ngModel)]="equipement.dateModification"></p-datepicker>
                        </div>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Annuler" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Enregistrer" icon="pi pi-check" (click)="saveEquipement()" />
            </ng-template>
        </p-dialog>
    `,
    providers: [MessageService, Equipementservice, ConfirmationService],
})
export class Equipementt implements OnInit {
    equipementDialog: boolean = false;
    equipements = signal<Equipement[]>([]);
    equipement: Equipement = {};
    selectedEquipements: Equipement[] | null = [];
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    cols!: Column[];
    exportColumns!: ExportColumn[];

    dropdownValues = [
        { name: 'Disponible' },
        { name: 'En maintenance' },
        { name: 'Hors service' },
    ];

    constructor(
        private equipementService: Equipementservice,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadEquipements();
        this.cols = [
            { field: 'name', header: 'Nom' },
            { field: 'description', header: 'Description' },
            { field: 'estDisponible', header: 'Disponibilité' },
            { field: 'estMutualisable', header: 'Mutualisation' },
            { field: 'etat', header: 'État' },
            { field: 'acquereur', header: 'Acquéreur' },
            { field: 'typeAcquisition', header: 'Type d\'Acquisition' },
            { field: 'dateAjout', header: 'Date d\'Ajout' },
            { field: 'dateModification', header: 'Date de Modification' },
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
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
        this.equipement = { dateAjout: new Date(), dateModification: new Date() };
        this.submitted = false;
        this.equipementDialog = true;
    }

    editEquipement(equipement: Equipement) {
        this.equipement = { ...equipement, dateModification: new Date() };
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
                        if (equipement._id) {
                            this.equipementService.deleteEquipement(equipement._id).subscribe({
                                next: () => {
                                    this.equipements.set(this.equipements().filter((val) => val._id !== equipement._id));
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
            message: 'Êtes-vous sûr de vouloir supprimer ' + equipement.name + ' ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (equipement._id) {
                    this.equipementService.deleteEquipement(equipement._id).subscribe({
                        next: () => {
                            this.equipements.set(this.equipements().filter((val) => val._id !== equipement._id));
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
        if (this.equipement.name?.trim() && this.equipement.description?.trim()) {
            if (this.equipement._id) {
                // Mise à jour d'un équipement existant
                this.equipementService.updateEquipement(this.equipement).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Équipement mis à jour', life: 3000 });
                        this.loadEquipements();
                    },
                    error: (err) => console.error('Erreur lors de la mise à jour de l\'équipement', err),
                });
            } else {
                // Création d'un nouvel équipement
                this.equipementService.createEquipement(this.equipement).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Équipement créé', life: 3000 });
                        this.loadEquipements();
                    },
                    error: (err) => console.error('Erreur lors de la création de l\'équipement', err),
                });
            }
            this.equipementDialog = false;
            this.equipement = {};
        }
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
}