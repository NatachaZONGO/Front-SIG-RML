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
import { Ufr, Ufrservice } from '../service/ufr.service';
import { Laboratoire, Laboratoireservice } from '../service/laboratoire.service';

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
            [globalFilterFields]="['name', 'country.name', 'representative.name', 'status']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedLaboratoires"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestion des Laboratoires</h5>
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
            <ng-template #body let-laboratoire>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="laboratoire" />
                    </td>
                   
                    <td style="min-width: 16rem">{{ laboratoire.name }}</td>
                    <td style="min-width: 16rem">{{ laboratoire.description }}</td>
                    <td style="min-width: 16rem">{{ laboratoire.dateAjout }}</td>
                    <td style="min-width: 16rem">{{ laboratoire.dateModification }}</td>
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
                        <input type="text" pInputText id="name" [(ngModel)]="laboratoire.name" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !laboratoire.name">Le nom est obligatoire.</small>
                    </div>
                    <div>
                        <label for="description" class="block font-bold mb-3">description</label>
                        <input type="text" pInputText id="description" [(ngModel)]="laboratoire.description" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !laboratoire.description">La description est obligatoire.</small>
                    </div>
                    <div>
                        <div class="font-semibold text-xl">Date Ajout</div>
                        <p-datepicker [showIcon]="true" [showButtonBar]="true" [(ngModel)]="calendarValue"></p-datepicker>
                    </div>
                    <div>
                        <div class="font-semibold text-xl">Date Modification</div>
                        <p-datepicker [showIcon]="true" [showButtonBar]="true" [(ngModel)]="calendarValue"></p-datepicker>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Save" icon="pi pi-check" (click)="saveLaboratoire()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, Laboratoireservice, ConfirmationService]
})
export class Laboratoiree implements OnInit {
    laboratoireDialog: boolean = false;

    laboratoires = signal<Laboratoire[]>([]);

    laboratoire!: Laboratoire;

    selectedLaboratoires!: Laboratoire[] | null;

    submitted: boolean = false;

    statuses!: any[];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];
    calendarValue: any = null;

    constructor(
        private laboratoireService: Laboratoireservice,
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
        this.laboratoireService.getLaboratoires().then((data) => {
            this.laboratoires.set(data);
        });

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'description', header: 'description' },
            { field: 'dateAjout', header: 'dateAjout' },
            { field: 'dateModification', header: 'dateModification' },
            
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.laboratoire = {};
        this.submitted = false;
        this.laboratoireDialog = true;
    }

    editLaboratoire(laboratoire: Laboratoire) {
        this.laboratoire = { ...laboratoire};
        this.laboratoireDialog = true;
    }

    deleteSelectedLaboratoires() {
        this.confirmationService.confirm({
            message: 'Etes vous sur de vouloir supprimer ce Laboratoire?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.laboratoires.set(this.laboratoires().filter((val) => !this.selectedLaboratoires?.includes(val)));
                this.selectedLaboratoires = null;
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
        this.laboratoireDialog = false;
        this.submitted = false;
    }

    deleteLaboratoire(laboratoire: Laboratoire) {
        this.confirmationService.confirm({
            message: 'Etes-vous sûr de vouloir supprimer? ' + laboratoire.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.laboratoires.set(this.laboratoires().filter((val) => val.id !== laboratoire.id));
                this.laboratoire = {};
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Laboratoire supprimé',
                    life: 3000
                });
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.laboratoires().length; i++) {
            if (this.laboratoires()[i].id === id) {
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

   
    saveLaboratoire() {
        this.submitted = true;
        let _laboratoires = this.laboratoires();
        if (this.laboratoire.name?.trim()) {
            if (this.laboratoire.id) {
                _laboratoires[this.findIndexById(this.laboratoire.id)] = this.laboratoire;
                this.laboratoires.set([..._laboratoires]);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Utilisateur modifié',
                    life: 3000
                });
            } else {
                this.laboratoire.id = this.createId();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'UFR ajouté',
                    life: 3000
                });
                this.laboratoires.set([..._laboratoires, this.laboratoire]);
            }

            this.laboratoireDialog = false;
            this.laboratoire = {};
        }
    }
}
