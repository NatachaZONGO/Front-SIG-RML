import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../pages/auth/auth.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul>`,
})
export class AppMenu {
    model: MenuItem[] = [];

    constructor(private authService: AuthService, private router: Router) {}

    ngOnInit() {
        const role = this.authService.getUserRole();

        this.model = [
            {
                label: 'Home',
                icon: 'pi pi-fw pi-home',
                routerLink: ['/dashboard'],
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] }, // Lien vers le tableau de bord
                ],
            },
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                routerLink: ['/pages'],
                items: [
                    {
                        label: 'Offres',
                        icon: 'pi pi-fw pi-tags',
                        routerLink: ['/pages/offre'],
                        //visible: role === 'admin',
                    },
                    {
                        label: 'Candidatures',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/pages/candidature'],
                        //visible: role === 'admin',
                    },
                    {
                        label: 'Entreprises',
                        icon: 'pi pi-fw pi-building',
                        routerLink: ['/pages/entreprise'],
                        //visible: role === 'admin',
                    },
                    {
                        label: 'Catégories',
                        icon: 'pi pi-fw pi-folder',
                        routerLink: ['/pages/categorie'],
                        //visible: role === 'admin',
                    },

                    {
                        label: 'Pays',
                        icon: 'pi pi-fw pi-globe',
                        routerLink: ['/pages/pays'],
                        //visible: role === 'admin',
                    },

                    {
                        label: 'Utilisateurs',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/pages/user'],
                        //visible: role === 'admin',
                    },
                    {
                        label: 'Roles',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/pages/role'],
                        //visible: role === 'admin',
                    },
                    {
                        label: 'Publicités',
                        icon: 'pi pi-fw pi-book',
                        routerLink: ['/pages/publicite'],
                        //visible: role === 'admin',
                    },
                    {
                        label: 'Conseils',
                        icon: 'pi pi-fw pi-building',
                        routerLink: ['/pages/conseil'],
                        //visible: role === 'admin',
                    },
                    {
                        label: 'Notifications',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/pages/notification'],
                        //visible: role === 'admin',
                    },
                    {
                        label: 'Mon CV',
                        icon: 'pi pi-fw pi-calendar',
                        routerLink: ['/pages/cv'],
                        //visible: role === 'reservant' || role === 'admin' || role === 'responsable',
                    },
                    {
                        label: 'Landing Page',
                        icon: 'pi pi-fw pi-globe',
                        routerLink: ['/landing'],
                    },
                    {
                        label: 'Profil',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/pages/profil'],
                        //visible: role === 'admin',
                    },
                    {
                        label: 'Authentication',
                        icon: 'pi pi-fw pi-user',
                        items: [
                            {
                                label: 'Connexion',
                                icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/connexion'],
                            },
                            {
                                label: 'Déconnexion',
                                icon: 'pi pi-fw pi-lock',
                                command: () => this.onLogout(),
                            },
                        ],
                    },
                ],
            },
        ];
    }

    onLogout() {
        this.authService.logout();
        this.router.navigate(['/connexion']);
    }
}