import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports:[
    CommonModule, 
    ButtonModule,
    FormsModule,
    ReactiveFormsModule,

],
 providers:[ConfirmationService]
})
export class RegisterComponent {
  formulaireInscription: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Initialisation du formulaire
    this.formulaireInscription = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      address: ['', Validators.required], 
    });
    { validator: this.passwordMatchValidator };
  }

  // Méthode pour soumettre le formulaire
  async register(): Promise<void> {
    if (this.formulaireInscription.valid) {
      const userData = this.formulaireInscription.value;

      try {
        // Appeler la méthode register du service AuthService
        await this.authService.register(userData, false); // false pour indiquer que c'est une inscription utilisateur
        console.log('Inscription réussie');
        this.router.navigate(['/connexion']); // Rediriger vers la page de connexion
      } catch (error) {
        console.error("Erreur lors de l'inscription", error);
        // Afficher un message d'erreur à l'utilisateur
      }
    }
  }

  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  navigateToConnexion() {
    this.router.navigate(['/connexion']);
  }
}