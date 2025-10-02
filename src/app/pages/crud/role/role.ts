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
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Role } from './role.model';
import { RoleService } from './role.service';

interface Column { field: string; header: string; customExportHeader?: string; }
interface ExportColumn { title: string; dataKey: string; }

@Component({
  selector: 'app-role-crud',
  standalone: true,
  imports: [
    CommonModule, TableModule, FormsModule, ButtonModule, RippleModule,
    ToastModule, ToolbarModule, InputTextModule, TextareaModule, SelectModule,
    RadioButtonModule, InputNumberModule, DialogModule, TagModule,
    InputIconModule, IconFieldModule, ConfirmDialogModule
  ],
  templateUrl: `./role.component.html`,
  providers: [MessageService, RoleService, ConfirmationService],
})
export class RoleComponent implements OnInit {
  roleDialog = false;
  roles = signal<Role[]>([]);
  role: Role = {};
  selectedRoles: Role[] | null = null;
  submitted = false;

  @ViewChild('dt') dt!: Table;

  cols!: Column[];
  exportColumns!: ExportColumn[];

  constructor(
    private roleService: RoleService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadRoles();
    // IMPORTANT : utiliser les bons champs renvoyés par le back
    this.cols = [
      { field: 'nom', header: 'Nom' },
      { field: 'description', header: 'Description' },
    ];
    this.exportColumns = this.cols.map(col => ({ title: col.header, dataKey: col.field }));
  }

  loadRoles() {
  this.roleService.getRoles().subscribe({
    next: (roles: Role[]) => {
      console.log('Rôles chargés:', roles);
      this.roles.set(roles);
    },
    error: (err: HttpErrorResponse) => console.error('Erreur lors du chargement des rôles', err),
  });
}

  openNew() {
    this.role = {};
    this.submitted = false;
    this.roleDialog = true;
  }

  editRole(role: Role) {
    this.role = { ...role };
    this.roleDialog = true;
  }

  deleteSelectedRoles() {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer les rôles sélectionnés ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (this.selectedRoles?.length) {
          const toDelete = [...this.selectedRoles];
          toDelete.forEach(r => {
            if (r.id) {
              this.roleService.deleteRole(r.id).subscribe({
                next: () => {
                  this.roles.set(this.roles().filter(x => x.id !== r.id));
                },
                error: (err: HttpErrorResponse) => console.error('Erreur lors de la suppression du rôle', err),
              });
            }
          });
          this.selectedRoles = null;
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Rôles supprimés', life: 3000 });
        }
      },
    });
  }

  deleteRole(role: Role) {
  this.confirmationService.confirm({
    message: `Êtes-vous sûr de vouloir supprimer ${role.nom}?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      if (role.id) {
        this.roleService.deleteRole(role.id).subscribe({
          next: () => {
            this.roles.set(this.roles().filter(x => x.id !== role.id));
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Rôle supprimé', life: 3000 });
          },
          error: (err: HttpErrorResponse) => console.error('Erreur lors de la suppression du rôle', err),
        });
      }
    },
  });
}


  saveRole() {
    this.submitted = true;
    // IMPORTANT : utiliser 'nom' (pas 'intitule')
    if (this.role.nom?.trim() && this.role.description?.trim()) {
      if (this.role.id) {
        this.roleService.updateRole(this.role).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Rôle modifié', life: 3000 });
            this.loadRoles();
          },
          error: (err: HttpErrorResponse) => console.error('Erreur lors de la mise à jour du rôle', err),
        });
      } else {
        this.roleService.createRole(this.role).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Rôle ajouté', life: 3000 });
            this.loadRoles();
          },
          error: (err: HttpErrorResponse) => console.error('Erreur lors de la création du rôle', err),
        });
      }
      this.roleDialog = false;
      this.role = {};
    }
  }

  hideDialog() {
    this.roleDialog = false;
    this.submitted = false;
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  exportCSV() {
    this.dt.exportCSV();
  }
}
