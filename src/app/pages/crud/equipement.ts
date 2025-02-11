
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { User, ProductService } from '../service/product.service';
import { DatePickerModule } from 'primeng/datepicker';
import { Equipement, Equipementservice } from '../service/equipement.service';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';


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
        RatingModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        RadioButtonModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        DatePickerModule,
        ToggleButtonModule,
        ToggleSwitchModule

    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Delete" icon="pi pi-trash" outlined (onClick)="deleteSelectedEquipements()" [disabled]="!selectedEquipements || !selectedEquipements.length" />
            </ng-template>

            <ng-template #end>
                <p-button label="Export" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="equipements()"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['name', 'country.name', 'representative.name', 'status']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedEquipements"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestion des Equipement</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Recherche..." />
                    </p-iconfield>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th style="width: 3rem">
                        <p-tableHeaderCheckbox />
                    </th>
                   
                    <th pSortableColumn="name" style="min-width:16rem">
                        Nom
                        <p-sortIcon field="name" />
                    </th>
                    <th pSortableColumn="description" style="min-width:16rem">
                        Description
                        <p-sortIcon field="description" />
                    </th>
                    <th pSortableColumn="estDisponible" style="min-width:16rem">
                        Disponibilite
                        <p-sortIcon field="estDisponible" />
                    </th>
                    <th pSortableColumn="estMutualisable" style="min-width:16rem">
                        Mutualisation
                        <p-sortIcon field="estMutualisable" />
                    </th>
                    <th pSortableColumn="etat" style="min-width:16rem">
                        Etat
                        <p-sortIcon field="etat" />
                    </th>
                    <th pSortableColumn="acquereur" style="min-width:16rem">
                        Acquereur
                        <p-sortIcon field="acquereur" />
                    </th>
                    <th pSortableColumn="typeAcquisition" style="min-width:16rem">
                        Type Acquisition
                        <p-sortIcon field="typeAcquisition" />
                    </th>
                    <th pSortableColumn="dateAjout" style="min-width:16rem">
                        Date Ajout
                        <p-sortIcon field="dateAjout" />
                    </th>
                    <th pSortableColumn="dateModification" style="min-width:16rem">
                        Date Modification
                        <p-sortIcon field="dateModification" />
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
                    <td style="min-width: 16rem">{{ equipement.estDisponible === true ? 'Oui' : 'Non' }}</td>
                    <td style="min-width: 16rem">{{ equipement.estMutualisable === true ? 'Oui' : 'Non' }}</td>
                    <td style="min-width: 16rem">{{ equipement.etat }}</td>
                    <td style="min-width: 16rem">{{ equipement.acquereur }}</td>
                    <td style="min-width: 16rem">{{ equipement.typeAcquisition }}</td>
                    <td style="min-width: 16rem">{{ equipement.dateAjout }}</td>
                    <td style="min-width: 16rem">{{ equipement.dateModification }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editEquipement(equipement)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteEquipement(equipement)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="equipementDialog" [style]="{ width: '800px' }" header="Equipement Details" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="name" class="block font-bold mb-3">Nom</label>
                        <input type="text" pInputText id="name" [(ngModel)]="equipement.name" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !equipement.name">Le nom est obligatoire.</small>
                    </div>
                   
                    <div>
                        <label for="description" class="block font-bold mb-2">Description</label>
                        <textarea pInputTextarea id="description" [(ngModel)]="equipement.description" rows="4" class="w-full" required></textarea>
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

                    <!-- État (Select) -->
                    <div>
                        <label for="etat" class="block font-bold mb-3">État</label>
                        <p-select [(ngModel)]="equipement.etat" [options]="dropdownValues" optionLabel="name" optionValue="name" placeholder="Sélectionner"></p-select>
                        <small class="text-red-500" *ngIf="submitted && !equipement.etat">L'état est obligatoire.</small>
                    </div>


                <div class="flex justify-between gap-4">
                    <div class="w-1/2">
                        <label for="acquereur" class="block font-bold mb-2">Acquéreur</label>
                        <input type="text" pInputText id="acquereur" [(ngModel)]="equipement.acquereur" required class="w-full" />
                        <small class="text-red-500" *ngIf="submitted && !equipement.acquereur">L'acquéreur est obligatoire.</small>
                    </div>

                    <div class="w-1/2">
                        <label for="typeAcquisition" class="block font-bold mb-2">Type d'Acquisition</label>
                        <input type="text" pInputText id="typeAcquisition" [(ngModel)]="equipement.typeAcquisition" required class="w-full" />
                        <small class="text-red-500" *ngIf="submitted && !equipement.typeAcquisition">Le type d'acquisition est obligatoire.</small>
                    </div>
                </div>
                <div class="flex justify-between gap-4">
                    <div class="w-1/2">
                        <label class="font-semibold text-lg">Date d'Ajout</label>
                        <p-datepicker [showIcon]="true" [showButtonBar]="true" [(ngModel)]="equipement.dateAjout" class="w-full"></p-datepicker>
                    </div>

                    <div class="w-1/2">
                        <label class="font-semibold text-lg">Date de Modification</label>
                        <p-datepicker [showIcon]="true" [showButtonBar]="true" [(ngModel)]="equipement.dateModification" class="w-full"></p-datepicker>
                    </div>
                </div>

            </div>
        </ng-template>

            <ng-template #footer>
                <p-button label="Annuler" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Enregistrer" icon="pi pi-check" (click)="saveEquipement()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, Equipementservice, ConfirmationService]
})
export class Equipementt implements OnInit {
    equipementDialog: boolean = false;

    equipements = signal<Equipement[]>([]);

    equipement!: Equipement;

    selectedEquipements!: Equipement[] | null;

    submitted: boolean = false;

    statuses!: any[];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];
    calendarValue: any = null;

    dropdownValues = [
        { name: 'Disponible' },
        { name: 'En maintenance' },
        { name: 'Hors service' },
    ];

    dropdownValue: any = null;

    constructor(
        private equipementService: Equipementservice,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadDemoData();
    }

    loadDemoData() {
        this.equipementService.getEquipements().then((data) => {
            this.equipements.set(data);
        });

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'description', header: 'description' },
            { field: 'estDisponible', header: 'estDisponible' },
            { field: 'estMutualisable', header: 'estMutualisable' },
            { field: 'etat', header: 'etat' },
            { field: 'acquereur', header: 'acquereur' },
            { field: 'typeAcquisition', header: 'typeAcquisition' },
            { field: 'dateAjout', header: 'dateAjout' },
            { field: 'dateModification', header: 'dateModification' },
            
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.equipement = {};
        this.submitted = false;
        this.equipementDialog = true;
    }

    editEquipement(equipement: Equipement) {
        this.equipement = { ...equipement};
        this.equipementDialog = true;
    }

    deleteSelectedEquipements() {
        this.confirmationService.confirm({
            message: 'Etes vous sur de vouloir supprimer cet Equipement?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.equipements.set(this.equipements().filter((val) => !this.selectedEquipements?.includes(val)));
                this.selectedEquipements = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Utilisateur supprimé',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.equipementDialog = false;
        this.submitted = false;
    }

    deleteEquipement(equipement: Equipement) {
        this.confirmationService.confirm({
            message: 'Etes-vous sûr de vouloir supprimer? ' + equipement.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.equipements.set(this.equipements().filter((val) => val.id !== equipement.id));
                this.equipement = {};
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'equipement supprimé',
                    life: 3000
                });
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.equipements().length; i++) {
            if (this.equipements()[i].id === id) {
                index = i;
                break;
            }
        }

        return index;
    }

    createId(): string {
        let id = '';
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < 5; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

   
    saveEquipement() {
        this.submitted = true;
        let _equipements = this.equipements();
        if (this.equipement.name?.trim()) {
            if (this.equipement.id) {
                _equipements[this.findIndexById(this.equipement.id)] = this.equipement;
                this.equipements.set([..._equipements]);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Utilisateur modifié',
                    life: 3000
                });
            } else {
                this.equipement.id = this.createId();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'equipement ajouté',
                    life: 3000
                });
                this.equipements.set([..._equipements, this.equipement]);
            }

            this.equipementDialog = false;
            this.equipement = {};
        }
    }
}
