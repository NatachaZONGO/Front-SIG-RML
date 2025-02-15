import { layoutConfig } from './../../layout/service/layout.service';
import { Laboratoire, Laboratoireservice } from './../service/laboratoire.service';
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
import { DatePickerModule } from 'primeng/datepicker';

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
   
    ],
    template: `
        <p-toast />
        <p-confirmDialog />

        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Delete" icon="pi pi-trash" outlined (onClick)="deleteSelectedLaboratoires()" [disabled]="!selectedLaboratoires || !selectedLaboratoires.length" />
            </ng-template>

            <ng-template #end>
                <p-button label="Export" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="laboratoires()"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['name', 'intitule', 'description']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedLaboratoires"
            [rowHover]="true"
            dataKey="_id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestion des Laboratoire</h5>
                    <p-iconField>
                        <p-inputIcon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Recherche..." />
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
                    <th pSortableColumn="dateAjout" style="min-width:16rem">
                        Date Ajout <p-sortIcon field="createdAt" />
                    </th>
                    <th pSortableColumn="dateModification" style="min-width:16rem">
                        Date Modification <p-sortIcon field="updatedAt" />
                    </th>
                    <th style="min-width: 12rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-laboratoire>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="laboratoire" />
                    </td>
                    <td style="min-width: 16rem">{{ laboratoire.name }}</td>
                    <td style="min-width: 16rem">{{ laboratoire.description }}</td>
                    <td style="min-width: 16rem">{{ laboratoire.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    <td style="min-width: 16rem">{{ laboratoire.updatedAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>

                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editLaboratoire(laboratoire)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteLaboratoire(laboratoire)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="laboratoireDialog" [style]="{ width: '450px' }" header="Laboratoire Details" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="name" class="block font-bold mb-3">Nom</label>
                        <input type="text" pInputText id="name" [(ngModel)]="laboratoire.name" required autofocus />
                        <small class="text-red-500" *ngIf="submitted && !laboratoire.name">Le nom est obligatoire.</small>
                    </div>
                   
                    <div>
                        <label for="description" class="block font-bold mb-3">Description</label>
                        <input type="text" pInputText id="description" [(ngModel)]="laboratoire.description" required />
                        <small class="text-red-500" *ngIf="submitted && !laboratoire.description">La description est obligatoire.</small>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Annuler" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Enregistrer" icon="pi pi-check" (click)="saveLaboratoire()" />
            </ng-template>
        </p-dialog>
    `,
    providers: [MessageService, Laboratoireservice, ConfirmationService],
})
export class Laboratoiree implements OnInit {
    laboratoireDialog: boolean = false;
    laboratoires = signal<Laboratoire[]>([]);
    laboratoire: Laboratoire = {};
    selectedLaboratoires: Laboratoire[] = []; 
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    cols!: Column[];
    exportColumns!: ExportColumn[];
    calendarValue: any = null;

    constructor(
        private laboratoireService: Laboratoireservice,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadLaboratoires();
        this.cols = [
            { field: 'name', header: 'Nom' },
            { field: 'description', header: 'Description' },
            { field: 'createdAt', header: 'Date Ajout' },
            { field: 'updatedAt', header: 'Date Modification' },
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    loadLaboratoires() {
        this.laboratoireService.getLaboratoires().subscribe({
            next: (data) => this.laboratoires.set(data),
            error: (err) => console.error('Erreur lors du chargement des laboratoires', err),
        });
    }

    openNew() {
        this.laboratoire = {};
        this.submitted = false;
        this.laboratoireDialog = true;
    }

    editLaboratoire(laboratoire: Laboratoire) {
        this.laboratoire = { ...laboratoire };
        this.laboratoireDialog = true;
    }

    deleteSelectedLaboratoires() {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer les laboratoires sélectionnés ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedLaboratoires) {
                    this.selectedLaboratoires.forEach((laboratoire) => {
                        if (laboratoire._id) {
                            this.laboratoireService.deleteLaboratoire(laboratoire._id).subscribe({
                                next: () => {
                                    this.laboratoires.set(this.laboratoires().filter((val) => val._id !== laboratoire._id));
                                },
                                error: (err) => console.error('Erreur lors de la suppression du laboratoire', err),
                            });
                        }
                    });
                    this.selectedLaboratoires = [];
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Laboratoires supprimés', life: 3000 });
                }
            },
        });
    }

    deleteLaboratoire(laboratoire: Laboratoire) {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer ' + laboratoire.name + ' ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (laboratoire._id) {
                    this.laboratoireService.deleteLaboratoire(laboratoire._id).subscribe({
                        next: () => {
                            this.laboratoires.set(this.laboratoires().filter((val) => val._id !== laboratoire._id));
                            this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Laboratoire supprimé', life: 3000 });
                        },
                        error: (err) => console.error('Erreur lors de la suppression du laboratoire', err),
                    });
                }
            },
        });
    }

    saveLaboratoire() {
        this.submitted = true;
        if (this.laboratoire.name?.trim() && this.laboratoire.description?.trim()) {
            if (this.laboratoire._id) {
                // Mise à jour d'un UFR existant
                this.laboratoire.updatedAt = new Date(); // Met à jour la date de modification
                this.laboratoireService.updateLaboratoire(this.laboratoire).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'UFR modifié', life: 3000 });
                        this.loadLaboratoires();
                    },
                    error: (err) => console.error('Erreur lors de la mise à jour du laboratoire', err),
                });
            } else {
                // Création d'un nouvel UFR
                this.laboratoire.createdAt = new Date(); // Définit la date de création
                this.laboratoire.updatedAt = new Date(); // Définit la date de modification
                this.laboratoireService.createLaboratoire(this.laboratoire).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Laboratoire ajouté', life: 3000 });
                        this.loadLaboratoires();
                    },
                    error: (err) => console.error('Erreur lors de la création du laboratoire', err),
                });
            }
            this.laboratoireDialog = false;
            this.laboratoire = {};
        }
    }

    hideDialog() {
        this.laboratoireDialog = false;
        this.submitted = false;
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    exportCSV() {
        this.dt.exportCSV();
    }
}