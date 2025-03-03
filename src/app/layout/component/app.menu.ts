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
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];
    constructor(private authService: AuthService, private router: Router) {}
    ngOnInit() {
        const role = this.authService.getUserRole();
      
        this.model = [
          {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }],
          },
          {
            label: 'Pages',
            icon: 'pi pi-fw pi-briefcase',
            routerLink: ['/pages'],
            items: [
              {
                label: 'Utilisateurs',
                icon: 'pi pi fw pi-users',
                routerLink: ['/pages/user'],
                visible: role === 'admin', 
              },
              {
                label: 'UFR',
                icon: 'pi pi-fw pi-book',
                routerLink: ['/pages/ufr'],
                visible: role === 'admin', 
              },
              {
                label: 'Laboratoire',
                icon: 'pi pi-fw pi-building',
                routerLink: ['/pages/laboratoire'],
                visible:  role === 'admin'
              },
              {
                label: 'Equipements',
                icon: 'pi pi-fw pi-cog',
                routerLink: ['/pages/equipement'],
                visible: role === 'admin'|| role === 'responsable'
              },
              {
                label: 'Reservations',
                icon: 'pi pi-fw pi-calendar',
                routerLink: ['/pages/reservation'],
                visible: role === 'reservant'|| role === 'admin'|| role === 'responsable'
            },
            { 
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
