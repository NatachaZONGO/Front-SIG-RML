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
        ConfirmDialogModule
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Delete" icon="pi pi-trash" outlined (onClick)="deleteSelectedUsers()" [disabled]="!selectedProducts || !selectedProducts.length" />
            </ng-template>

            <ng-template #end>
                <p-button label="Export" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="users()"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['name', 'country.name', 'representative.name', 'status']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedProducts"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestion des utilisateurs</h5>
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
                    <th pSortableColumn="prenom" style="min-width:16rem">
                        Prenom
                        <p-sortIcon field="prenom" />
                    </th>
                    <th pSortableColumn="email" style="min-width:16rem">
                        Email
                        <p-sortIcon field="email" />
                    </th>
                    
                    <th style="min-width: 12rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-user>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="user" />
                    </td>
                   
                    <td style="min-width: 16rem">{{ user.name }}</td>
                    <td style="min-width: 16rem">{{ user.prenom }}</td>
                    <td style="min-width: 16rem">{{ user.email }}</td>
                    
                    
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editUser(user)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteUser(user)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="userDialog" [style]="{ width: '450px' }" header="User Details" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="name" class="block font-bold mb-3">Nom</label>
                        <input type="text" pInputText id="name" [(ngModel)]="user.name" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !user.name">Le nom est obligatoire.</small>
                    </div>
                    <div>
                        <label for="prenom" class="block font-bold mb-3">Prenom</label>
                        <input type="text" pInputText id="prenom" [(ngModel)]="user.prenom" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !user.prenom">Le prenom est obligatoire.</small>
                    </div>
                    <div>
                        <label for="email" class="block font-bold mb-3">Email</label>
                        <input type="text" pInputText id="name" [(ngModel)]="user.email" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !user.email">Le mail est obligatoire.</small>
                    </div>
                    <div>
                        <label for="password" class="block font-bold mb-3">Mot de passe</label>
                        <input type="text" pInputText id="password" [(ngModel)]="user.password" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !user.password">Le mot de passe est obligatoire.</small>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Save" icon="pi pi-check" (click)="saveUser()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ProductService, ConfirmationService]
})
export class Crud implements OnInit {
    userDialog: boolean = false;

    users = signal<User[]>([]);

    user!: User;

    selectedProducts!: User[] | null;

    submitted: boolean = false;

    statuses!: any[];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private productService: ProductService,
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
        this.productService.getProducts().then((data) => {
            this.users.set(data);
        });

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'prenom', header: 'Prenom' },
            { field: 'email', header: 'Email' },
            
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.user = {};
        this.submitted = false;
        this.userDialog = true;
    }

    editUser(user: User) {
        this.user = { ...user};
        this.userDialog = true;
    }

    deleteSelectedUsers() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected products?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.users.set(this.users().filter((val) => !this.selectedProducts?.includes(val)));
                this.selectedProducts = null;
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
        this.userDialog = false;
        this.submitted = false;
    }

    deleteUser(user: User) {
        this.confirmationService.confirm({
            message: 'Etes-vous sûr de vouloir supprimer? ' + user.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.users.set(this.users().filter((val) => val.id !== user.id));
                this.user = {};
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Utilisateur supprimé',
                    life: 3000
                });
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.users().length; i++) {
            if (this.users()[i].id === id) {
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

   
    saveUser() {
        this.submitted = true;
        let _users = this.users();
        if (this.user.name?.trim()) {
            if (this.user.id) {
                _users[this.findIndexById(this.user.id)] = this.user;
                this.users.set([..._users]);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Utilisateur modifié',
                    life: 3000
                });
            } else {
                this.user.id = this.createId();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Utilisateur ajouté',
                    life: 3000
                });
                this.users.set([..._users, this.user]);
            }

            this.userDialog = false;
            this.user = {};
        }
    }
}
