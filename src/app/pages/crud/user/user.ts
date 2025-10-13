import { Component, OnInit, signal, ViewChild, ChangeDetectorRef } from '@angular/core';
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

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { UserService } from './user.service';
import { User } from './user.model';
import { RoleService } from '../role/role.service'; // Ajustez le chemin selon votre structure
import { Role } from '../role/role.model'; // Ajustez le chemin selon votre structure
import { imageUrl } from '../../../Share/const';

type UiUser = User & { roleLabel?: string; roleId?: number }; // Changé en number

@Component({
  selector: 'app-user',
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
  providers: [MessageService, UserService, ConfirmationService, RoleService],
  templateUrl: './user.component.html',
})
export class UserComponent implements OnInit { // Corrigé le nom de la classe (était "Userr")
  userDialog = false;
  users = signal<UiUser[]>([]);
  user: Partial<UiUser> = { statut: 'actif' }; // Retiré role par défaut
  selectedUsers: UiUser[] = [];
  submitted = false;
  previewPhotoUrl?: string | null;
  userDetailsDialog = false;
  selectedUserForDetails: any = null;
  loading = signal(false);

  @ViewChild('dt') dt!: Table;

  statuts = [
    { label: 'Actif', value: 'actif' },
    { label: 'Inactif', value: 'inactif' }
  ];

  // Rôles chargés dynamiquement depuis l'API
  roles: { label: string; value: number }[] = []; // Changé en number
  
  // Options pour le filtre par rôle
  roleFilterOptions: { label: string; value: string | null }[] = [];
  selectedRoleFilter: string | null = null;

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdRef: ChangeDetectorRef,
    private roleService: RoleService
  ) {}

  ngOnInit() {
    this.loadRoles(); // Charger les rôles d'abord
    this.loadUsers();
  }

  /** Charger les rôles depuis l'API */
  loadRoles() {
    this.roleService.getRoles().subscribe({
      next: (roles: Role[]) => {
        console.log('Rôles chargés:', roles);
        // Convertir pour le dropdown PrimeNG avec conversion explicite
        this.roles = roles.map(role => ({
          label: role.nom || '',
          value: Number(role.id) || 0 // Conversion explicite en number
        }));
        
        // Créer les options pour le filtre par rôle
        this.roleFilterOptions = [
          { label: 'Tous les rôles', value: null },
          ...roles.map(role => ({
            label: role.nom || '',
            value: role.nom || ''
          }))
        ];
        
        console.log('Rôles formatés pour dropdown:', this.roles);
        console.log('Options de filtre:', this.roleFilterOptions);
        this.cdRef.detectChanges();
      },
      error: err => {
        console.error('Erreur lors du chargement des rôles:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les rôles',
          life: 3000
        });
      }
    });
  }

  /** Récupération users depuis l'API (réponse paginée Laravel) */
  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        console.log('Réponse complète de l\'API:', response);
        
        // Vérifier la structure de la réponse
        if (response && response.success && response.data && response.data.data) {
          const users: any[] = response.data.data;
          
          const mapped: UiUser[] = users.map((u: any) => ({
            ...u,
            // Extraire le premier rôle pour l'affichage
            roleLabel: Array.isArray(u.roles) && u.roles.length > 0 
              ? u.roles[0].nom 
              : 'Aucun rôle',
            // Stocker l'ID du rôle pour la modification (number)
            roleId: Array.isArray(u.roles) && u.roles.length > 0 
              ? u.roles[0].id 
              : undefined
          }));
          
          console.log('Utilisateurs mappés:', mapped);
          this.users.set(mapped);
          
          // Forcer la détection des changements
          this.cdRef.detectChanges();
        } else {
          console.error('Structure de réponse inattendue:', response);
        }
      },
      error: err => {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les utilisateurs',
          life: 3000
        });
      },
    });
  }

  openNew() {
    this.user = { statut: 'actif' }; // Pas de rôle par défaut
    this.previewPhotoUrl = undefined;
    this.submitted = false;
    this.userDialog = true;
  }

  editUser(user: UiUser) {
    this.user = { 
      ...user,
      roleId: user.roleId, // Utiliser l'ID du rôle pour le dropdown
      // IMPORTANT: Convertir la photo en string pour éviter les problèmes
      photo: typeof user.photo === 'string' ? user.photo : undefined
    };
    this.previewPhotoUrl = undefined;
    this.userDialog = true;
  }

  deleteSelectedUsers() {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer les utilisateurs sélectionnés ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const toDelete = [...this.selectedUsers];
        toDelete.forEach(u => {
          if (u.id) {
            this.userService.deleteUser(u.id).subscribe({
              next: () => this.users.set(this.users().filter(x => x.id !== u.id)),
              error: err => console.error('Erreur suppression utilisateur', err),
            });
          }
        });
        this.selectedUsers = [];
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Succès', 
          detail: 'Utilisateurs supprimés', 
          life: 3000 
        });
      },
    });
  }

  deleteUser(user: UiUser) {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer ${user.nom} ${user.prenom} ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (user.id) {
          this.userService.deleteUser(user.id).subscribe({
            next: () => {
              this.users.set(this.users().filter(x => x.id !== user.id));
              this.messageService.add({ 
                severity: 'success', 
                summary: 'Succès', 
                detail: 'Utilisateur supprimé', 
                life: 3000 
              });
            },
            error: err => {
              console.error('Erreur suppression utilisateur', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Impossible de supprimer l\'utilisateur',
                life: 3000
              });
            },
          });
        }
      },
    });
  }

  saveUser() {
    this.submitted = true;

    // Validation différente pour création vs modification
    const isCreation = !this.user.id;
    const isValidForCreation = this.user.nom?.trim() && this.user.prenom?.trim() && 
        this.user.email?.trim() && this.user.password?.trim() && this.user.roleId;
    const isValidForUpdate = this.user.nom?.trim() && this.user.prenom?.trim() && 
        this.user.email?.trim() && this.user.roleId;

    if ((isCreation && isValidForCreation) || (!isCreation && isValidForUpdate)) {
      
      console.log('Données utilisateur à sauvegarder:', this.user);
      console.log('Type de photo:', typeof this.user.photo);
      console.log('Photo est File:', this.user.photo instanceof File);
      
      const payload = {
        ...this.user,
        role_id: this.user.roleId // Envoyer role_id au backend
      };
      
      // Supprimer roleId du payload pour éviter la confusion
      delete (payload as any).roleId;
      
      // Pour la modification, ne pas envoyer le mot de passe s'il est vide
      if (!isCreation && !this.user.password?.trim()) {
        delete (payload as any).password;
      }
      
      console.log('Payload final:', payload);
      
      const req$ = this.user.id
        ? this.userService.updateUser(payload)
        : this.userService.createUser(payload);

      req$.subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: this.user.id ? 'Utilisateur mis à jour' : 'Utilisateur créé',
            life: 3000
          });
          this.loadUsers();
          this.userDialog = false;
          this.user = { statut: 'actif' };
          this.previewPhotoUrl = undefined;
        },
        error: err => {
          console.error('Erreur saveUser', err);
          console.error('Détails erreur:', err.error?.errors);
          
          if (err.error?.errors) {
            const errorMessages = Object.entries(err.error.errors)
              .map(([field, messages]: [string, any]) => 
                `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('\n');
            
            this.messageService.add({
              severity: 'error',
              summary: 'Erreurs de validation',
              detail: errorMessages,
              life: 5000
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de sauvegarder l\'utilisateur',
              life: 3000
            });
          }
        },
      });
    } else {
      console.error('Validation échouée:', {
        nom: this.user.nom,
        prenom: this.user.prenom,
        email: this.user.email,
        password: this.user.password,
        roleId: this.user.roleId,
        isCreation,
        isValidForCreation,
        isValidForUpdate
      });
    }
  }

  /** Nettoyer l'URL de prévisualisation lors de la fermeture du dialog */
  hideDialog() {
    this.userDialog = false;
    this.submitted = false;
    // Nettoyer l'URL de prévisualisation pour éviter les fuites mémoire
    if (this.previewPhotoUrl) {
      URL.revokeObjectURL(this.previewPhotoUrl);
      this.previewPhotoUrl = undefined;
    }
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  exportCSV() {
    this.dt.exportCSV();
  }

  /** Filtrer par rôle */
  onRoleFilterChange(event: any) {
    const selectedRole = event.value;
    console.log('Filtre par rôle sélectionné:', selectedRole);
    
    if (selectedRole === null || selectedRole === '') {
      // Afficher tous les utilisateurs
      this.dt.filter(null, 'roleLabel', 'equals');
    } else {
      // Filtrer par le rôle sélectionné
      this.dt.filter(selectedRole, 'roleLabel', 'equals');
    }
  }

  /** Export PDF simplifié avec jsPDF */
  exportPDF() {
    // Obtenir les données filtrées du tableau
    const filteredUsers = this.dt.filteredValue || this.users();
    
    if (filteredUsers.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Aucune donnée à exporter',
        life: 3000
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Titre
      doc.setFontSize(16);
      doc.text('Liste des Utilisateurs', 14, 15);
      
      // Date de génération
      doc.setFontSize(10);
      const now = new Date();
      doc.text(`Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`, 14, 25);

      // En-têtes du tableau
      const head = [['Nom', 'Prénom', 'Email', 'Téléphone', 'Rôle', 'Statut']];
      
      // Données du tableau
      const body = filteredUsers.map((user: UiUser) => [
        user.nom || '—',
        user.prenom || '—',
        user.email || '—',
        user.telephone || '—',
        user.roleLabel || '—',
        user.statut || '—'
      ]);

      // Générer le tableau
      autoTable(doc, {
        head,
        body,
        startY: 35,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [52, 152, 219], // Bleu
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245] // Gris clair alternatif
        }
      });

      // Télécharger le PDF
      doc.save(`utilisateurs_${new Date().getTime()}.pdf`);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'PDF exporté avec succès',
        life: 3000
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible d\'exporter le PDF',
        life: 5000
      });
    }
  }

  getImageUrl(photoPath: unknown): string {
    if (!photoPath) return '';
    
    if (typeof photoPath === 'string') {
      // Si c'est déjà une URL complète
      if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
        return photoPath;
      }
      // Sinon construire l'URL complète
      return `${imageUrl}/${photoPath}`;
    }
    
    if (photoPath instanceof File) {
      return this.previewPhotoUrl ?? '';
    }
    
    return '';
  }

  onImageError(event: any) {
    console.error('Erreur de chargement de l\'image:', event.target.src);
    // Remplacer par une image par défaut ou masquer
    event.target.style.display = 'none';
    // Optionnel: afficher un placeholder
    const placeholder = event.target.parentElement?.querySelector('.image-placeholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  onFileChange(event: any) {
    const file: File | undefined = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (file.type.startsWith('image/')) {
        (this.user as any).photo = file;
        this.previewPhotoUrl = URL.createObjectURL(file);
        console.log('Nouveau fichier sélectionné:', file.name, file.type);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Veuillez sélectionner un fichier image valide',
          life: 3000
        });
        // Reset l'input
        event.target.value = '';
      }
    } else {
      // Si l'input est vidé, nettoyer la prévisualisation
      // mais garder la photo existante si on est en modification
      if (this.previewPhotoUrl) {
        URL.revokeObjectURL(this.previewPhotoUrl);
        this.previewPhotoUrl = undefined;
      }
      
      // Si on était en train de modifier et qu'on supprime la sélection,
      // remettre la photo originale (string)
      if (this.user.id && typeof this.user.photo !== 'string') {
        // Récupérer la photo originale depuis la liste des users
        const originalUser = this.users().find(u => u.id === this.user.id);
        if (originalUser && typeof originalUser.photo === 'string') {
          this.user.photo = originalUser.photo;
        } else {
          // Pas de photo originale
          this.user.photo = undefined;
        }
      }
    }
  }


hideDetailsDialog(): void {
  this.userDetailsDialog = false;
  this.selectedUserForDetails = null;
}

// Actions depuis le dialog
editFromDetails(): void {
  if (this.selectedUserForDetails) {
    this.hideDetailsDialog();
    this.editUser(this.selectedUserForDetails);
  }
}

deleteFromDetails(): void {
  if (this.selectedUserForDetails) {
    this.hideDetailsDialog();
    this.deleteUser(this.selectedUserForDetails);
  }
}

// Actions rapides
sendEmail(user: any): void {
  if (user.email) {
    window.location.href = `mailto:${user.email}`;
  }
}

callUser(user: any): void {
  if (user.telephone) {
    window.location.href = `tel:${user.telephone}`;
  }
}

// Méthode pour activer/désactiver l'utilisateur
toggleUserStatus(user: any): void {
  const newStatus = user.statut === 'actif' ? 'inactif' : 'actif';
  
  this.confirmationService.confirm({
    message: `Êtes-vous sûr de vouloir ${newStatus === 'actif' ? 'activer' : 'désactiver'} cet utilisateur ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui',
    rejectLabel: 'Non',
    accept: () => {
      // Appel API pour changer le statut
      this.loading.set(true);
      
      // Remplacez ceci par votre appel API réel
      this.userService.updateUserStatus(user.id, newStatus).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: `Utilisateur ${newStatus === 'actif' ? 'activé' : 'désactivé'} avec succès`
          });
          this.loadUsers(); // Recharger la liste
          if (this.selectedUserForDetails) {
            this.selectedUserForDetails.statut = newStatus;
          }
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de modifier le statut'
          });
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    }
  });
}

// Méthode pour réinitialiser le mot de passe
resetPassword(user: any): void {
  this.confirmationService.confirm({
    message: `Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${user.prenom} ${user.nom} ?`,
    header: 'Réinitialisation du mot de passe',
    icon: 'pi pi-key',
    acceptLabel: 'Confirmer',
    rejectLabel: 'Annuler',
    accept: () => {
      this.loading.set(true);
      
      // Remplacez ceci par votre appel API réel
      this.userService.resetUserPassword(user.id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'info',
            summary: 'Mot de passe réinitialisé',
            detail: 'Un email de réinitialisation a été envoyé à l\'utilisateur'
          });
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de réinitialiser le mot de passe'
          });
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    }
  });
}

// Dans user.component.ts
viewUserDetails(user: User) {
  console.group('🔍 DÉTAILS USER SÉLECTIONNÉ');
  console.log('User complet:', user);
  console.log('last_login:', user.last_login);
  console.log('Type de last_login:', typeof user.last_login);
  console.log('created_at:', user.created_at);
  console.log('updated_at:', user.updated_at);
  console.groupEnd();
  
  this.selectedUserForDetails = user;
  this.userDetailsDialog = true;
}

// Ajoutez aussi cette méthode pour tester
testLastLogin() {
  console.log('=== TEST LAST LOGIN ===');
  const allUsers = this.users();
  console.log('Nombre d\'utilisateurs:', allUsers.length);
  
  allUsers.forEach((user, index) => {
    console.log(`User ${index + 1} (${user.nom}):`, {
      id: user.id,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  });
}
}