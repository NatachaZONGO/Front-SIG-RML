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
import { DropdownModule } from 'primeng/dropdown';

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
        DropdownModule
    ],
    providers: [MessageService, UserService, ConfirmationService],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nouveau" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Supprimer" icon="pi pi-trash" outlined (onClick)="deleteSelectedUsers()" [disabled]="!selectedUsers || !selectedUsers.length" />
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
                    <th pSortableColumn="role" style="min-width:16rem">
                        Role <p-sortIcon field="role" />
                    </th>
                    <th pSortableColumn="phone" style="min-width:16rem">
                        Telephone <p-sortIcon field="phone" />
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
                        <p-tableCheckbox [value]="user.id" />
                    </td>
                    <td style="min-width: 16rem">{{ user.firstname }}</td>
                    <td style="min-width: 16rem">{{ user.lastname }}</td>
                    <td style="min-width: 16rem">{{ user.role }}</td>
                    <td style="min-width: 16rem">{{ user.phone }}</td>
                    <td style="min-width: 16rem">{{ user.email }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editUser(user)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteUser(user)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="userDialog" [style]="{ width: '600px' }" header="Ajouter un utilisateur" [modal]="true">
    <ng-template #content>
        <div class="flex flex-col gap-4">
            <div class="flex gap-4">
                <div class="flex-1">
                    <label for="name" class="block font-bold mb-2">Nom</label>
                    <input type="text" pInputText id="name" [(ngModel)]="user.firstname" required class="w-full" />
                    <small class="text-red-500" *ngIf="submitted && !user.firstname">Le nom est obligatoire.</small>
                </div>
                <div class="flex-1">
                    <label for="prenom" class="block font-bold mb-2">Prénom</label>
                    <input type="text" pInputText id="prenom" [(ngModel)]="user.lastname" required class="w-full" />
                    <small class="text-red-500" *ngIf="submitted && !user.lastname">Le prénom est obligatoire.</small>
                </div>
            </div>

            <div>
                <label for="role" class="block font-bold mb-2">Rôle</label>
                <p-dropdown id="role" [(ngModel)]="user.scope" [options]="roles" optionLabel="label" optionValue="value" placeholder="Sélectionnez un rôle" required [style]="{ 'width': '100%' }"></p-dropdown>
                <small class="text-red-500" *ngIf="submitted && !user.scope">Le rôle est obligatoire.</small>
            </div>

            <div class="flex gap-4">
                <div class="flex-1">
                    <label for="phone" class="block font-bold mb-2">Téléphone</label>
                    <input type="text" pInputText id="phone" [(ngModel)]="user.phone" required class="w-full" />
                    <small class="text-red-500" *ngIf="submitted && !user.phone">Le téléphone est obligatoire.</small>
                </div>
                <div class="flex-1">
                    <label for="email" class="block font-bold mb-2">Email</label>
                    <input type="text" pInputText id="email" [(ngModel)]="user.email" required class="w-full" />
                    <small class="text-red-500" *ngIf="submitted && !user.email">L'email est obligatoire.</small>
                </div>
            </div>

            <!-- Mot de passe -->
            <div>
                <label for="password" class="block font-bold mb-2">Mot de passe</label>
                <input type="password" pInputText id="password" [(ngModel)]="user.password" required class="w-full" />
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
    user: User = {scope: 'admin'};
    selectedUsers: User[] = [];
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
            { field: 'scope', header: 'Role' },
            { field: 'phone', header: 'Telephone' },
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
        this.user = {scope: 'admin'}; 
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
                        if (user._id) {
                            this.userService.deleteUser(user._id).subscribe({
                                next: () => {
                                    this.users.set(this.users().filter((val) => val._id !== user._id));
                                },
                                error: (err) => console.error('Erreur lors de la suppression de l\'utilisateur', err),
                            });
                        }
                    });
                    this.selectedUsers = [];
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Utilisateurs supprimés', life: 3000 });
                }
            },
        });
    }

    deleteUser(user: User) {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer ' + user.firstname + ' ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (user._id) {
                    this.userService.deleteUser(user._id).subscribe({
                        next: () => {
                            this.users.set(this.users().filter((val) => val._id !== user._id));
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
        if (this.user.firstname?.trim() && this.user.lastname?.trim() && this.user.email?.trim() && this.user.password?.trim()) {
            if (this.user._id) {
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
            this.user = {scope: 'admin'};
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
    roles = [
        { label: 'Admin', value: 'admin' },
        { label: 'Responsable', value: 'responsable' },
        { label: 'Reservant', value: 'reservant' },
    ];
}