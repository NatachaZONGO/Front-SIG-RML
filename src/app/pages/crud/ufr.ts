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
import { Ufr, Ufrservice } from '../service/ufr.service';
import { CalendarIcon } from 'primeng/icons';

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
                <p-button severity="secondary" label="Delete" icon="pi pi-trash" outlined (onClick)="deleteSelectedUfrs()" [disabled]="!selectedUfrs || !selectedUfrs.length" />
            </ng-template>

            <ng-template #end>
                <p-button label="Export" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="ufrs()"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['name', 'intitule', 'description']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedUfrs"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestion des UFR</h5>
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
                    <th pSortableColumn="intitule" style="min-width:16rem">
                        Intitulé <p-sortIcon field="intitule" />
                    </th>
                    <th pSortableColumn="description" style="min-width:16rem">
                        Description <p-sortIcon field="description" />
                    </th>
                    <th pSortableColumn="dateAjout" style="min-width:16rem">
                        Date Ajout <p-sortIcon field="dateAjout" />
                    </th>
                    <th pSortableColumn="dateModification" style="min-width:16rem">
                        Date Modification <p-sortIcon field="dateModification" />
                    </th>
                    <th style="min-width: 12rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-ufr>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="ufr" />
                    </td>
                    <td style="min-width: 16rem">{{ ufr.name }}</td>
                    <td style="min-width: 16rem">{{ ufr.intitule }}</td>
                    <td style="min-width: 16rem">{{ ufr.description }}</td>
                    <td style="min-width: 16rem">{{ ufr.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    <td style="min-width: 16rem">{{ ufr.updatedAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>

                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editUfr(ufr)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteUfr(ufr)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="ufrDialog" [style]="{ width: '450px' }" header="Ufr Details" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="name" class="block font-bold mb-3">Nom</label>
                        <input type="text" pInputText id="name" [(ngModel)]="ufr.name" required autofocus />
                        <small class="text-red-500" *ngIf="submitted && !ufr.name">Le nom est obligatoire.</small>
                    </div>
                   
                    <div>
                        <label for="description" class="block font-bold mb-3">Description</label>
                        <input type="text" pInputText id="description" [(ngModel)]="ufr.description" required />
                        <small class="text-red-500" *ngIf="submitted && !ufr.description">La description est obligatoire.</small>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Save" icon="pi pi-check" (click)="saveUfr()" />
            </ng-template>
        </p-dialog>
    `,
    providers: [MessageService, Ufrservice, ConfirmationService],
})
export class Ufrr implements OnInit {
    ufrDialog: boolean = false;
    ufrs = signal<Ufr[]>([]);
    ufr: Ufr = {};
    selectedUfrs: Ufr[] | null = null;
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    cols!: Column[];
    exportColumns!: ExportColumn[];
    calendarValue: any = null;

    constructor(
        private ufrService: Ufrservice,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadUfrs();
        this.cols = [
            { field: 'name', header: 'Nom' },
            { field: 'description', header: 'Description' },
            { field: 'createdAt', header: 'Date Ajout' },
            { field: 'updatedAt', header: 'Date Modification' },
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    loadUfrs() {
        this.ufrService.getUfrs().subscribe({
            next: (data) => this.ufrs.set(data),
            error: (err) => console.error('Erreur lors du chargement des UFRs', err),
        });
    }

    openNew() {
        this.ufr = {};
        this.submitted = false;
        this.ufrDialog = true;
    }

    editUfr(ufr: Ufr) {
        this.ufr = { ...ufr };
        this.ufrDialog = true;
    }

    deleteSelectedUfrs() {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer les UFRs sélectionnés ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedUfrs) {
                    this.selectedUfrs.forEach((ufr) => {
                        if (ufr._id) {
                            this.ufrService.deleteUfr(ufr._id).subscribe({
                                next: () => {
                                    this.ufrs.set(this.ufrs().filter((val) => val._id !== ufr._id));
                                },
                                error: (err) => console.error('Erreur lors de la suppression de l\'UFR', err),
                            });
                        }
                    });
                    this.selectedUfrs = null;
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'UFRs supprimés', life: 3000 });
                }
            },
        });
    }

    deleteUfr(ufr: Ufr) {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer ' + ufr.name + ' ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (ufr._id) {
                    this.ufrService.deleteUfr(ufr._id).subscribe({
                        next: () => {
                            this.ufrs.set(this.ufrs().filter((val) => val._id !== ufr._id));
                            this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'UFR supprimé', life: 3000 });
                        },
                        error: (err) => console.error('Erreur lors de la suppression de l\'UFR', err),
                    });
                }
            },
        });
    }

    saveUfr() {
        this.submitted = true;
        if (this.ufr.name?.trim() && this.ufr.description?.trim()) {
            if (this.ufr._id) {
                // Mise à jour d'un UFR existant
                this.ufr.updatedAt = new Date(); // Met à jour la date de modification
                this.ufrService.updateUfr(this.ufr).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'UFR modifié', life: 3000 });
                        this.loadUfrs();
                    },
                    error: (err) => console.error('Erreur lors de la mise à jour de l\'UFR', err),
                });
            } else {
                // Création d'un nouvel UFR
                this.ufr.createdAt = new Date(); // Définit la date de création
                this.ufr.updatedAt = new Date(); // Définit la date de modification
                this.ufrService.createUfr(this.ufr).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'UFR ajouté', life: 3000 });
                        this.loadUfrs();
                    },
                    error: (err) => console.error('Erreur lors de la création de l\'UFR', err),
                });
            }
            this.ufrDialog = false;
            this.ufr = {};
        }
    }

    hideDialog() {
        this.ufrDialog = false;
        this.submitted = false;
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    exportCSV() {
        this.dt.exportCSV();
    }
}