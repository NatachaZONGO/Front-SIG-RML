import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { UserService } from '../service/user.service';


@Component({
    selector: 'app-login',
    standalone: true,
    providers: [UserService],
    imports: [ButtonModule, InputTextModule, PasswordModule, FormsModule],
    template: `
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Bienvenue!</div>
                            <span class="text-muted-color font-medium">Connectez-vous pour continuer</span>
                        </div>

                        <div>
                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email1" type="text" placeholder="Address email" class="w-full md:w-[30rem] mb-8" [(ngModel)]="email" />

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Mot de passe</label>
                            <p-password id="password1" [(ngModel)]="password" placeholder="Mot de passe" [toggleMask]="true" styleClass="mb-4" [feedback]="false"></p-password>

                            <p-button label="Connexion" styleClass="w-full" (onClick)="onLogin()"></p-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class Login {
    email: string = '';
    password: string = '';

    constructor(private userService: UserService, private router: Router) {}

    onLogin(): void {
        this.userService.login(this.email, this.password).subscribe({
            next: () => {
                this.router.navigate(['/accueil']); // Redirige vers la page d'accueil après connexion
            },
            error: (err) => {
                console.error('Erreur de connexion', err);
                alert('Email ou mot de passe incorrect');
            },
        });
    }
}