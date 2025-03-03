import { Routes } from '@angular/router';
import { Empty } from './empty/empty';
import { Equipementt } from './crud/equipements/equipement';
import { ReservationComponent } from './crud/reservations/reservation';
import { Userr } from './crud/user/user';
import { ConnexionComponent } from './auth/connexion/connexion.component';
import { RegisterComponent } from './auth/register/register.component';
import { Ufrr } from './crud/ufr/ufr';
import { Laboratoiree } from './crud/laboratoire/laboratoire';
import { authGuard } from './auth/auth.guard';


export default [
  { path: 'resrvation-details', component: ReservationComponent },
  { path: 'connexion', component: ConnexionComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'user', component: Userr, canActivate: [authGuard], data: { roles: ['admin'] } }, // Seul l'admin peut accéder
  { path: 'ufr', component: Ufrr, canActivate: [authGuard], data: { roles: ['admin'] } }, // Seul l'admin peut accéder
  { path: 'equipement', component: Equipementt, canActivate: [authGuard], data: { roles: ['responsable' ,'admin'] } }, // Seul l'admin peut accéder
  { path: 'laboratoire', component: Laboratoiree, canActivate: [authGuard], data: { roles: [, 'admin', 'responsable'] } }, // Seul le responsable peut accéder
  { path: 'reservation', component: ReservationComponent, canActivate: [authGuard], data: { roles: ['reservant', 'admin', 'responsable'] } }, // Seul le reservant peut accéder
  { path: 'empty', component: Empty },
  { path: '**', redirectTo: '/notfound' },
] as Routes;