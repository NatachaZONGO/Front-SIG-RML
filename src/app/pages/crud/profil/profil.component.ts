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
    currentPassword: FormControl<string>;
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
        currentPassword: new FormControl<string>('', { nonNullable: true }),
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
      currentPassword: '',
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
      await this.userService.updateProfileDetails({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone
        // (photo en string possible si tu affiches un champ)
      }).toPromise();

      // 2) si changement de mot de passe
      if (this.changePassword()) {
        if (!data.currentPassword) {
          this.messages.add({ severity: 'warn', summary: 'Mot de passe', detail: 'Mot de passe actuel requis.' });
          this.isLoading.set(false);
          return;
        }
        if (!data.password || data.password !== data.confirmPassword) {
          this.messages.add({ severity: 'warn', summary: 'Mot de passe', detail: 'Les mots de passe ne correspondent pas.' });
          this.isLoading.set(false);
          return;
        }

        await this.userService.changePassword(
          data.currentPassword,
          data.password,
          data.confirmPassword
        ).toPromise();
      }

      // 3) recharger le profil (optionnel mais pratique)
      await this.userService.getProfile().toPromise().then((u: User | undefined) => {
          if (u) {
            this.user = u;
          }
        });

      this.messages.add({ severity: 'success', summary: 'Profil', detail: 'Vos informations ont été mises à jour.' });
      this.closeForm();
    } catch (err: any) {
      console.error(err);
      const detail = err?.error?.message || 'Mise à jour impossible.';
      this.messages.add({ severity: 'error', summary: 'Erreur', detail });
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
    const cur = this.userForm.get('currentPassword');
    const pwd = this.userForm.get('password');
    const cfm = this.userForm.get('confirmPassword');

    if (checked) {
      cur?.setValidators([Validators.required]);
      pwd?.setValidators([Validators.required, Validators.minLength(8)]);
      cfm?.setValidators([Validators.required]);
    } else {
      cur?.clearValidators();
      pwd?.clearValidators();
      cfm?.clearValidators();
      cur?.setValue('');
      pwd?.setValue('');
      cfm?.setValue('');
    }
    cur?.updateValueAndValidity();
    pwd?.updateValueAndValidity();
    cfm?.updateValueAndValidity();
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


  loadUserProfile(): void {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        if (this.user) {
          this.userForm.patchValue({
            id: this.user.id ?? null,
            nom: this.user.nom,
            prenom: this.user.prenom,
            email: this.user.email,
            telephone: this.user.telephone
          });
          this.loadUserRoles();
        }
      },
      error: (err) => {
        console.error('Erreur profil:', err);
        this.messages.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger le profil' });
      }
    });
  }

  /**
   * Charger les rôles de l'utilisateur
   */
  loadUserRoles(): void {
    // Si vous avez les rôles directement dans l'objet user
    if (this.user?.roles) {
      this.roles = Array.isArray(this.user.roles) ? this.user.roles : [this.user.roles];
    } else if (this.user?.role) {
      this.roles = [{ nom: this.user.role }];
    }
  }

  
}