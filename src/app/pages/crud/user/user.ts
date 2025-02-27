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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { UserService } from './user.service';
import { User } from './user.model';

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
    templateUrl: `./user.component.html`,
})
export class Userr implements OnInit {
    userDialog: boolean = false;
    users = signal<User[]>([]);
    user: User = {role: 'admin'};
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
            { field: 'lastname', header: 'Nom' },
            { field: 'firstname', header: 'Prenom' },
            { field: 'role', header: 'Role' },
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
        if (this.user.firstname?.trim() && this.user.lastname?.trim() && this.user.email?.trim() && this.user.password?.trim()) {
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
    roles = [
        { label: 'Admin', value: 'admin' },
        { label: 'Responsable', value: 'responsable' },
        { label: 'Reservant', value: 'reservant' },
    ];
}