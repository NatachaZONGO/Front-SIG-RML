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
import { User, UserService } from '../service/user.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

interface Column {
    field: string;
    header: string;
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
        IconFieldModule,
        InputIconModule,
    ],
    providers: [MessageService, UserService, ConfirmationService],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Delete" icon="pi pi-trash" outlined (onClick)="deleteSelectedUsers()" [disabled]="!selectedUsers || !selectedUsers.length" />
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
            [globalFilterFields]="['name', 'prenom', 'email']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedUsers"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
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
                        Nom <p-sortIcon field="name" />
                    </th>
                    <th pSortableColumn="prenom" style="min-width:16rem">
                        Prenom <p-sortIcon field="prenom" />
                    </th>
                    <th pSortableColumn="email" style="min-width:16rem">
                        Email <p-sortIcon field="email" />
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

        <p-dialog [(visible)]="userDialog" [style]="{ width: '450px' }" header="Détails de l'utilisateur" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="name" class="block font-bold mb-3">Nom</label>
                        <input type="text" pInputText id="name" [(ngModel)]="user.name" required autofocus />
                        <small class="text-red-500" *ngIf="submitted && !user.name">Le nom est obligatoire.</small>
                    </div>
                    <div>
                        <label for="prenom" class="block font-bold mb-3">Prenom</label>
                        <input type="text" pInputText id="prenom" [(ngModel)]="user.prenom" required />
                        <small class="text-red-500" *ngIf="submitted && !user.prenom">Le prenom est obligatoire.</small>
                    </div>
                    <div>
                        <label for="email" class="block font-bold mb-3">Email</label>
                        <input type="text" pInputText id="email" [(ngModel)]="user.email" required />
                        <small class="text-red-500" *ngIf="submitted && !user.email">L'email est obligatoire.</small>
                    </div>
                    <div>
                        <label for="password" class="block font-bold mb-3">Mot de passe</label>
                        <input type="password" pInputText id="password" [(ngModel)]="user.password" required />
                        <small class="text-red-500" *ngIf="submitted && !user.password">Le mot de passe est obligatoire.</small>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Annuler" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Enregistrer" icon="pi pi-check" (click)="saveUser()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
})
export class Userr implements OnInit {
    userDialog: boolean = false;
    users = signal<User[]>([]);
    user: User = {role: 'admin'};
    selectedUsers: User[] | null = [];
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;
    cols!: Column[];
    exportColumns!: ExportColumn[];

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadUsers();
        this.cols = [
            { field: 'name', header: 'Nom' },
            { field: 'prenom', header: 'Prenom' },
            { field: 'email', header: 'Email' },
        ];
        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    loadUsers() {
        this.userService.getUsers().subscribe({
            next: (data) => this.users.set(data),
            error: (err) => console.error('Erreur lors du chargement des utilisateurs', err),
        });
    }

    openNew() {
        this.user = {role: 'admin'}; 
        this.submitted = false;
        this.userDialog = true;
    }

    editUser(user: User) {
        this.user = { ...user };
        this.userDialog = true;
    }

    deleteSelectedUsers() {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer les utilisateurs sélectionnés ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedUsers) {
                    this.selectedUsers.forEach((user) => {
                        if (user.id) {
                            this.userService.deleteUser(user.id).subscribe({
                                next: () => {
                                    this.users.set(this.users().filter((val) => val.id !== user.id));
                                },
                                error: (err) => console.error('Erreur lors de la suppression de l\'utilisateur', err),
                            });
                        }
                    });
                    this.selectedUsers = null;
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Utilisateurs supprimés', life: 3000 });
                }
            },
        });
    }

    deleteUser(user: User) {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer ' + user.name + ' ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (user.id) {
                    this.userService.deleteUser(user.id).subscribe({
                        next: () => {
                            this.users.set(this.users().filter((val) => val.id !== user.id));
                            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Utilisateur supprimé', life: 3000 });
                        },
                        error: (err) => console.error('Erreur lors de la suppression de l\'utilisateur', err),
                    });
                }
            },
        });
    }

    saveUser() {
        this.submitted = true;
        if (this.user.name?.trim() && this.user.prenom?.trim() && this.user.email?.trim() && this.user.password?.trim()) {
            if (this.user.id) {
                this.userService.updateUser(this.user).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Utilisateur mis à jour', life: 3000 });
                        this.loadUsers();
                    },
                    error: (err) => console.error('Erreur lors de la mise à jour de l\'utilisateur', err),
                });
            } else {
                this.userService.createUser(this.user).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Utilisateur créé', life: 3000 });
                        this.loadUsers();
                    },
                    error: (err) => console.error('Erreur lors de la création de l\'utilisateur', err),
                });
            }
            this.userDialog = false;
            this.user = {role: 'admin'};
        }
    }

    hideDialog() {
        this.userDialog = false;
        this.submitted = false;
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    exportCSV() {
        this.dt.exportCSV();
    }
}