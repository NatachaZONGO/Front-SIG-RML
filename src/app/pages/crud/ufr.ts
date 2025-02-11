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
            [globalFilterFields]="['name', 'country.name', 'representative.name', 'status']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedUfrs"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestion des UFR</h5>
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
                    <th pSortableColumn="intitule" style="min-width:16rem">
                        intitule
                        <p-sortIcon field="intitule" />
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
            <ng-template #body let-ufr>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="ufr" />
                    </td>
                   
                    <td style="min-width: 16rem">{{ ufr.name }}</td>
                    <td style="min-width: 16rem">{{ ufr.intitule }}</td>
                    <td style="min-width: 16rem">{{ ufr.description }}</td>
                    <td style="min-width: 16rem">{{ ufr.dateAjout }}</td>
                    <td style="min-width: 16rem">{{ ufr.dateModification }}</td>
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
                        <input type="text" pInputText id="name" [(ngModel)]="ufr.name" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !ufr.name">Le nom est obligatoire.</small>
                    </div>
                    <div>
                        <label for="intitule" class="block font-bold mb-3">intitule</label>
                        <input type="text" pInputText id="intitule" [(ngModel)]="ufr.intitule" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !ufr.intitule">Le intitule est obligatoire.</small>
                    </div>
                    <div>
                        <label for="description" class="block font-bold mb-3">description</label>
                        <input type="text" pInputText id="description" [(ngModel)]="ufr.description" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !ufr.description">La description est obligatoire.</small>
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
                <p-button label="Save" icon="pi pi-check" (click)="saveUfr()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, Ufrservice, ConfirmationService]
})
export class Ufrr implements OnInit {
    ufrDialog: boolean = false;

    ufrs = signal<Ufr[]>([]);

    ufr!: Ufr;

    selectedUfrs!: Ufr[] | null;

    submitted: boolean = false;

    statuses!: any[];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];
    calendarValue: any = null;

    constructor(
        private ufrService: Ufrservice,
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
        this.ufrService.getUfrs().then((data) => {
            this.ufrs.set(data);
        });

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'intitule', header: 'intitule' },
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
        this.ufr = {};
        this.submitted = false;
        this.ufrDialog = true;
    }

    editUfr(ufr: Ufr) {
        this.ufr = { ...ufr};
        this.ufrDialog = true;
    }

    deleteSelectedUfrs() {
        this.confirmationService.confirm({
            message: 'Etes vous sur de vouloir supprimer cet UFR?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.ufrs.set(this.ufrs().filter((val) => !this.selectedUfrs?.includes(val)));
                this.selectedUfrs = null;
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
        this.ufrDialog = false;
        this.submitted = false;
    }

    deleteUfr(ufr: Ufr) {
        this.confirmationService.confirm({
            message: 'Etes-vous sûr de vouloir supprimer? ' + ufr.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.ufrs.set(this.ufrs().filter((val) => val.id !== ufr.id));
                this.ufr = {};
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'UFR supprimé',
                    life: 3000
                });
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.ufrs().length; i++) {
            if (this.ufrs()[i].id === id) {
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

   
    saveUfr() {
        this.submitted = true;
        let _ufrs = this.ufrs();
        if (this.ufr.name?.trim()) {
            if (this.ufr.id) {
                _ufrs[this.findIndexById(this.ufr.id)] = this.ufr;
                this.ufrs.set([..._ufrs]);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Utilisateur modifié',
                    life: 3000
                });
            } else {
                this.ufr.id = this.createId();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'UFR ajouté',
                    life: 3000
                });
                this.ufrs.set([..._ufrs, this.ufr]);
            }

            this.ufrDialog = false;
            this.ufr = {};
        }
    }
}
