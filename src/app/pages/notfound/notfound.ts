import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

interface ErrorInfo {
    code: string;
    title: string;
    message: string;
    icon: string;
    iconColor: string;
}

@Component({
    selector: 'app-notfound',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule],
    template: `
        <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div class="w-full max-w-2xl">
                <!-- Card principale -->
                <div class="bg-white rounded-3xl shadow-xl overflow-hidden">
                    
                    <!-- En-tête avec logo -->
                    <div class="bg-blue-600 p-8 text-center">
                        <div class="flex justify-center mb-4">
                            <div class="bg-white rounded-full p-4 shadow-lg">
                                <img src="assets/images/LOGO.png" 
                                     alt="Logo AlerteEmploi" 
                                     class="w-20 h-20 object-contain"
                                     onerror="this.style.display='none'">
                            </div>
                        </div>
                        
                        <h1 class="text-3xl font-bold text-white mb-2">
                            AlerteEmploi<span class="text-orange-300">&</span>Offres
                        </h1>
                    </div>

                    <!-- Corps du message -->
                    <div class="p-12 text-center">
                        <!-- Icône d'erreur -->
                        <div class="mb-8">
                            <div [class]="'inline-flex items-center justify-center w-32 h-32 rounded-full mb-4 ' + errorInfo.iconColor">
                                <i [class]="'text-6xl ' + errorInfo.icon"></i>
                            </div>
                        </div>

                        <!-- Message -->
                        <div class="mb-8">
                            <h2 class="text-6xl font-bold text-gray-800 mb-4">{{ errorInfo.code }}</h2>
                            <h3 class="text-2xl font-bold text-gray-800 mb-4">{{ errorInfo.title }}</h3>
                            <p class="text-gray-600 text-lg">
                                {{ errorInfo.message }}
                            </p>
                        </div>

                        <!-- Actions -->
                        <div class="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                pButton
                                label="Retour"
                                icon="pi pi-arrow-left"
                                class="p-button-outlined"
                                (click)="goBack()">
                            </button>
                            <button
                                pButton
                                label="Accueil"
                                icon="pi pi-home"
                                routerLink="/landing">
                            </button>
                        </div>

                        <!-- Liens utiles -->
                        <div class="mt-12 pt-8 border-t border-gray-200">
                            <p class="text-gray-600 font-semibold mb-4">Liens utiles :</p>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <!-- Offres d'emploi -->
                                <a routerLink="/offres" 
                                   class="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group">
                                    <div class="bg-blue-100 rounded-full p-3 mb-3 group-hover:bg-blue-200 transition-colors">
                                        <i class="pi pi-briefcase text-2xl text-blue-600"></i>
                                    </div>
                                    <span class="font-semibold text-gray-800">Offres d'emploi</span>
                                    <span class="text-sm text-gray-500">Parcourir les offres</span>
                                </a>

                                <!-- Connexion -->
                                <a routerLink="/connexion" 
                                   class="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group">
                                    <div class="bg-green-100 rounded-full p-3 mb-3 group-hover:bg-green-200 transition-colors">
                                        <i class="pi pi-sign-in text-2xl text-green-600"></i>
                                    </div>
                                    <span class="font-semibold text-gray-800">Connexion</span>
                                    <span class="text-sm text-gray-500">Accéder à mon compte</span>
                                </a>

                                <!-- Inscription -->
                                <a routerLink="/register" 
                                   class="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group">
                                    <div class="bg-orange-100 rounded-full p-3 mb-3 group-hover:bg-orange-200 transition-colors">
                                        <i class="pi pi-user-plus text-2xl text-orange-600"></i>
                                    </div>
                                    <span class="font-semibold text-gray-800">Inscription</span>
                                    <span class="text-sm text-gray-500">Créer un compte</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="text-center mt-8 text-gray-600 text-sm">
                    <p>Besoin d'aide ? Contactez notre support</p>
                </div>
            </div>
        </div>

        <style>
            /* Boutons personnalisés */
            ::ng-deep .p-button {
                border-radius: 0.75rem !important;
                padding: 0.75rem 1.5rem !important;
                font-weight: 600 !important;
            }

            /* Animation au hover sur les cartes */
            a.group:hover {
                transform: translateY(-2px);
            }
        </style>
    `,
})
export class Notfound implements OnInit {
    errorInfo: ErrorInfo = {
        code: '404',
        title: 'Page introuvable',
        message: 'La page que vous recherchez n\'existe pas ou a été déplacée.',
        icon: 'pi pi-exclamation-triangle text-blue-600',
        iconColor: 'bg-blue-50'
    };

    private errorTypes: { [key: string]: ErrorInfo } = {
        '404': {
            code: '404',
            title: 'Page introuvable',
            message: 'La page que vous recherchez n\'existe pas ou a été déplacée.',
            icon: 'pi pi-exclamation-triangle text-blue-600',
            iconColor: 'bg-blue-50'
        },
        '403': {
            code: '403',
            title: 'Accès refusé',
            message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page. Cette page est réservée aux recruteurs et administrateurs.',
            icon: 'pi pi-lock text-red-600',
            iconColor: 'bg-red-50'
        },
        '401': {
            code: '401',
            title: 'Non autorisé',
            message: 'Vous devez être connecté pour accéder à cette page.',
            icon: 'pi pi-sign-in text-orange-600',
            iconColor: 'bg-orange-50'
        },
        '500': {
            code: '500',
            title: 'Erreur serveur',
            message: 'Une erreur s\'est produite sur le serveur. Veuillez réessayer plus tard.',
            icon: 'pi pi-times-circle text-red-600',
            iconColor: 'bg-red-50'
        }
    };

    constructor(
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        // Récupérer le code d'erreur depuis les query params ou la navigation state
        const navigation = this.router.getCurrentNavigation();
        const errorCode = navigation?.extras?.state?.['errorCode'] || 
                         this.route.snapshot.queryParams['code'] || 
                         '404';
        
        const requiredRole = navigation?.extras?.state?.['requiredRole'] || 
                            this.route.snapshot.queryParams['role'];
        
        this.errorInfo = this.errorTypes[errorCode] || this.errorTypes['404'];
        
        // Personnaliser le message si un rôle est spécifié
        if (errorCode === '403' && requiredRole) {
            this.errorInfo = {
                ...this.errorInfo,
                message: this.getCustomRoleMessage(requiredRole)
            };
        }
    }

    private getCustomRoleMessage(roles: string | string[]): string {
        const roleArray = Array.isArray(roles) ? roles : [roles];
        
        if (roleArray.length === 1) {
            return `Vous devez vous connecter en tant que ${roleArray[0]} pour accéder à cette page.`;
        } else {
            const lastRole = roleArray.pop();
            return `Vous devez vous connecter en tant que ${roleArray.join(', ')} ou ${lastRole} pour accéder à cette page.`;
        }
    }

    goBack(): void {
        window.history.back();
    }
}