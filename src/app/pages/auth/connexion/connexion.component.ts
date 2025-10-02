import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { UserConnexion } from './userconnexion.model';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-connexion',
  templateUrl: './connexion.component.html',
  standalone: true,
  providers: [MessageService],
  imports: [
    InputTextModule,
    FloatLabelModule,
    ButtonModule,
    CheckboxModule,
    ReactiveFormsModule,
    CommonModule,
    ToastModule,
  ]
})
export class ConnexionComponent implements OnInit {
  formulaireconnexion!: FormGroup;
  isLoading = false;
  showPasswordcon = false;
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: MessageService
  ) {}

  ngOnInit(): void {
    // Déjà connecté ? -> Dashboard
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    this.initForm();
    this.loadRememberedEmail();
  }

  private initForm(): void {
    this.formulaireconnexion = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberme: [false],
    });
  }

  private loadRememberedEmail(): void {
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      this.formulaireconnexion.patchValue({
        email: rememberedEmail,
        rememberme: true,
      });
    }
  }

  async connexion(): Promise<void> {
    if (this.formulaireconnexion.invalid) {
      this.markFormGroupTouched(this.formulaireconnexion);
      return;
    }

    this.isLoading = true;
    try {
      const creds: UserConnexion = {
        email: this.formulaireconnexion.value.email,
        password: this.formulaireconnexion.value.password,
      };

      // → AuthService.connexion() renvoie une Promise, pas un Observable
      await this.auth.connexion(creds);

      // Se souvenir de moi
      this.handleRememberMe();

      this.toast.add({
        severity: 'success',
        summary: 'Connexion réussie',
        detail: 'Bienvenue sur votre espace',
        life: 2500,
      });

      // Redirection unique
      this.router.navigateByUrl('/dashboard');
    } catch (error: any) {
      this.handleError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private handleRememberMe(): void {
    const rememberMe = this.formulaireconnexion.value.rememberme;
    const email = this.formulaireconnexion.value.email;

    if (rememberMe) localStorage.setItem('remembered_email', email);
    else localStorage.removeItem('remembered_email');
  }

  private handleError(error: any): void {
    console.error('Erreur de connexion:', error);

    let summary = 'Erreur de connexion';
    let detail = 'Veuillez réessayer plus tard';

    if (error?.status === 401) {
      summary = 'Identifiants incorrects';
      detail = 'Vérifiez votre email et votre mot de passe';
    } else if (error?.status === 403) {
      summary = 'Accès refusé';
      detail = error?.error?.message || 'Votre compte n’est pas encore validé';
    } else if (error?.status === 422) {
      summary = 'Données invalides';
      detail = this.formatValidationErrors(error?.error?.errors);
    } else if (error?.status === 0) {
      summary = 'Erreur réseau';
      detail = 'Impossible de contacter le serveur';
    }

    this.toast.add({ severity: 'error', summary, detail, life: 5000 });
  }

  private formatValidationErrors(errors: any): string {
    if (!errors) return '';
    return Object.values(errors).flat().join(', ');
  }

  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach((key) => {
      const ctrl = form.get(key);
      ctrl?.markAsTouched();
      if (ctrl instanceof FormGroup) this.markFormGroupTouched(ctrl);
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.formulaireconnexion.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.formulaireconnexion.get(fieldName);
    if (field?.hasError('required')) return 'Ce champ est requis';
    if (field?.hasError('email')) return 'Email invalide';
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }
    return '';
  }

  onForgotPassword(): void {
    this.router.navigateByUrl('/forgot-password');
  }

  navigateToRegister(): void {
    this.router.navigateByUrl('/register');
  }
}
