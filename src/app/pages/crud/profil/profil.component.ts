import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DialogModule } from 'primeng/dialog';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';

import { AuthService } from '../../auth/auth.service';
import { UserService } from '../user/user.service';
import { User } from '../user/user.model';
import { Divider } from "primeng/divider";
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { imageUrl } from '../../../Share/const';
import { ProgressBar, ProgressBarModule } from "primeng/progressbar";
@Component({
  selector: 'app-profil',
  standalone: true,
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss'],
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
    FloatLabelModule,
    DialogModule,
    ConfirmPopupModule,
    PasswordModule,
    CheckboxModule,
    Divider,
    ConfirmPopupModule,
    ProgressSpinnerModule,
    ProgressBarModule
  
]
})
export class ProfilComponent implements OnInit {
  user: User | null = null;
  roles: Array<{ id?: number; nom: string }> = [];

  users = signal<User[]>([]);
  isLoading = signal(false);
  showFormulaire = signal(false);
  changePassword = signal(false);

  // ---- FormGroup typé
  userForm!: FormGroup<{
    id: FormControl<number | null>;
    nom: FormControl<string>;
    prenom: FormControl<string>;
    email: FormControl<string>;
    telephone: FormControl<string>;
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
  }>;

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private messages: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  // Getter pratique pour le template
  get f() {
    return this.userForm.controls;
  }

  /**
   * Initialise le formulaire (utilisé pour l’édition)
   */
  private initForm(): void {
    this.userForm = new FormGroup(
      {
        id: new FormControl<number | null>(null),
        nom: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        prenom: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        telephone: new FormControl<string>('', { nonNullable: true }),
        password: new FormControl<string>('', { nonNullable: true }),
        confirmPassword: new FormControl<string>('', { nonNullable: true })
      },
      { validators: ProfilComponent.passwordMatchValidator }
    );
  }

  /**
   * Charge le profil via /api/me (token dans l’intercepteur)
   * Ton backend renvoie :
   * {
   *   success: true,
   *   data: {
   *     user: {..., roles: [...]},
   *     roles: ["candidat", ...]
   *   }
   * }
   */
  private loadUserProfile(): void {
    this.isLoading.set(true);

    this.auth.getCurrentUserInfos().subscribe({
      next: (res: any) => {
        const userPayload = res?.data?.user ?? res?.user ?? null;
        const rolesPayload =
          res?.data?.roles ?? // ex: ["candidat"]
          userPayload?.roles ?? // ex: [{id, nom}]
          res?.roles ?? [];

        if (!userPayload) {
          throw new Error('Réponse /me invalide : user manquant');
        }

        this.user = {
          id: userPayload.id,
          nom: userPayload.nom ?? '',
          prenom: userPayload.prenom ?? '',
          email: userPayload.email ?? '',
          // si ton modèle User a telephone :
          telephone: userPayload.telephone ?? ''
        } as User;

        // normalise les rôles en [{id?, nom}]
        this.roles = Array.isArray(rolesPayload)
          ? rolesPayload.map((r: any) =>
              typeof r === 'string' ? ({ nom: r }) : ({ id: r?.id, nom: r?.nom })
            )
          : [];

        // Optionnel: synchro localStorage
        localStorage.setItem('utilisateur', JSON.stringify(this.user));
      },
      error: (err) => {
        console.error('Erreur profil:', err);
        this.messages.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de récupérer votre profil.',
          life: 5000
        });
      },
      complete: () => this.isLoading.set(false)
    });
  }

  /**
   * Ouvre le dialog et pré-remplit avec les données courantes
   */
  openDialog(user: User): void {
    this.userForm.reset({
      id: user.id ?? null,
      nom: user.nom ?? '',
      prenom: user.prenom ?? '',
      email: user.email ?? '',
      telephone: (user as any).telephone ?? '',
      password: '',
      confirmPassword: ''
    });
    this.onToggleChangePassword(false);
    this.showFormulaire.set(true);
  }

  /**
   * Sauvegarde (mise à jour) du profil utilisateur
   */
  async save(): Promise<void> {
    if (this.userForm.invalid) {
      Object.values(this.userForm.controls).forEach((c) => c.markAsTouched());
      return;
    }

    const data = this.userForm.getRawValue(); // valeurs typées

    // Si l’un des MDPS est renseigné, on vérifie la cohérence
    if ((data.password?.length || 0) > 0 || (data.confirmPassword?.length || 0) > 0) {
      if (data.password !== data.confirmPassword) {
        this.messages.add({
          severity: 'warn',
          summary: 'Mot de passe',
          detail: 'Les mots de passe ne correspondent pas.',
          life: 4000
        });
        return;
      }
    }

    if (data.id == null) {
      this.messages.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Identifiant utilisateur manquant.',
        life: 4000
      });
      return;
    }

    this.isLoading.set(true);

    try {
      // Adapte à ton endpoint réel
      await this.userService.updateUser({
        id: data.id,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        // envoie le téléphone si supporté côté API :
        telephone: data.telephone,
        // envoie le password si non vide :
        ...(data.password ? { password: data.password } : {})
      } as unknown as User);

      // Met à jour l’état local
      if (this.user) {
        this.user = {
          ...this.user,
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          telephone: data.telephone
        };
        localStorage.setItem('utilisateur', JSON.stringify(this.user));
      }

      this.messages.add({
        severity: 'success',
        summary: 'Profil',
        detail: 'Vos informations ont été mises à jour.',
        life: 3000
      });

      this.closeForm();
    } catch (err) {
      console.error(err);
      this.messages.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Mise à jour impossible.',
        life: 5000
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  closeForm(): void {
    this.userForm.reset();
    this.showFormulaire.set(false);
  }

  // (Optionnel) si tu gardes un tableau users() pour ailleurs
  private getUserIndexById(id: number): number {
    return this.users().findIndex((u) => u.id == id);
  }

  // --- Validateur de correspondance des mots de passe (form-level)
  private static passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value ?? '';
    const confirm = group.get('confirmPassword')?.value ?? '';
    if (!pass && !confirm) return null;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  // --- Toggle dynamique des validators pour les champs password
  onToggleChangePassword(checked: boolean): void {
    this.changePassword.set(checked);

    const pwd = this.userForm.get('password');
    const cfm = this.userForm.get('confirmPassword');

    if (checked) {
      pwd?.setValidators([Validators.required, Validators.minLength(8)]);
      cfm?.setValidators([Validators.required]);
    } else {
      pwd?.clearValidators();
      cfm?.clearValidators();
      pwd?.setValue('');
      cfm?.setValue('');
    }
    pwd?.updateValueAndValidity();
    cfm?.updateValueAndValidity();

    // recheck le validator global
    this.userForm.updateValueAndValidity();
  }

  // Gestion d’erreur de chargement de l’image
  /**
   * Obtenir l'URL complète de l'image
   */
  getImageUrl(photoPath: string | File | undefined): string {
    if (!photoPath) {
      return '';
    }
    
    // Si c'est un objet File (nouvelle image uploadée)
    if (photoPath instanceof File) {
      return URL.createObjectURL(photoPath);
    }
    
    // Si c'est un chemin string
    if (typeof photoPath === 'string') {
      // Si l'URL est déjà complète
      if (photoPath.startsWith('http')) {
        return photoPath;
      }
      // Utiliser la constante imageUrl existante
      return `${imageUrl}${photoPath}`;
    }
    
    return '';
  }

  /**
   * Gérer les erreurs de chargement d'image
   */
  onImageError(event: any): void {
    // Cacher l'image et le parent pourra afficher le placeholder
    event.target.style.display = 'none';
    // OU remplacer par une image par défaut si vous en avez une
    // event.target.src = 'assets/images/default-avatar.png';
  }

  /**
   * Gérer le changement de fichier (upload photo)
   */
  onFileChange(event: any): void {
    const file = event.target.files[0];
    
    if (file) {
      // Vérifier le type de fichier
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        this.messages.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Format de fichier non valide. Utilisez JPG, PNG ou GIF.'
        });
        return;
      }

      // Vérifier la taille (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.messages.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Le fichier est trop volumineux. Maximum 5MB.'
        });
        return;
      }

      // Stocker le fichier dans l'objet user
      if (this.user) {
        this.user.photo = file;
      }

      this.messages.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Photo sélectionnée avec succès.'
      });
    }
  }

  **
   * Charger le profil depuis l'API (données fraîches)
   */
  loadUserProfile(): void {
    this.userService.getProfile().subscribe({
      next: (data) => {
        this.user = data;
        
        // Debug
        console.log('User chargé:', this.user);
        console.log('Statut:', this.user.statut);
        console.log('Type du statut:', typeof this.user.statut);
        
        // Peupler le formulaire
        if (this.user) {
          this.userForm.patchValue({
            nom: this.user.nom,
            prenom: this.user.prenom,
            email: this.user.email,
            telephone: this.user.telephone
          });
          
          this.loadUserRoles();
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger le profil'
        });
      }
    });
  }

  /**
   * Charger les rôles de l'utilisateur
   */
  loadUserRoles(): void {
    // Si vous avez les rôles directement dans l'objet user
    if (this.user.roles) {
      this.roles = Array.isArray(this.user.roles) ? this.user.roles : [this.user.roles];
    } else if (this.user.role) {
      this.roles = [this.user.role];
    }
  }
}
