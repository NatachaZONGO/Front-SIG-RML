import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            },
           
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                routerLink: ['/pages'],
                items: [
                    {
                        label: 'Utilisateurs',
                        icon: 'pi pi fw pi-users',
                        routerLink: ['/pages/crud']
                    },
                    {
                        label: 'Rôles',
                        icon: 'pi pi-fw pi-id-card',
                        routerLink: ['/pages/role']
                    },
                    {
                        label: 'UFR',
                        icon: 'pi pi-fw pi-book',
                        routerLink: ['/pages/ufr']
                    },
                    {
                        label: 'Laboratoire',
                        icon: 'pi pi-fw pi-building',
                        routerLink: ['/pages/laboratoire']
                    },
                    {
                        label: 'Equipements',
                        icon: 'pi pi-fw pi-cog',
                        routerLink: ['/pages/equipement']
                    },
                    {
                        label: 'Reservations',
                        icon: 'pi pi-fw pi-calendar',
                        routerLink: ['/pages/reservation'] 
                    },
                    {
                        label: 'Site',
                        icon: 'pi pi-fw pi-globe',
                        routerLink: ['/landing']
                    },
                    {
                        label: 'Auth',
                        icon: 'pi pi-fw pi-user',
                        items: [
                            {
                                label: 'Login',
                                icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/auth/login']
                            },
                            {
                                label: 'Error',
                                icon: 'pi pi-fw pi-times-circle',
                                routerLink: ['/auth/error']
                            },
                            {
                                label: 'Access Denied',
                                icon: 'pi pi-fw pi-lock',
                                routerLink: ['/auth/access']
                            }
                        ]
                    },
                    {
                        label: 'Empty',
                        icon: 'pi pi-fw pi-circle-off',
                        routerLink: ['/pages/empty']
                    }
                ]
            },
            
        ];
    }
}
