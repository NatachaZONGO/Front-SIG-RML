import { Routes } from '@angular/router';
import { Empty } from './empty/empty';
import { Equipementt } from './crud/equipements/equipement';
import { ReservationComponent } from './crud/reservations/reservation';
import { Userr } from './crud/user/user';
import { ConnexionComponent } from './auth/connexion/connexion.component';
import { RegisterComponent } from './auth/register/register.component';
import { Ufrr } from './crud/ufr/ufr';
import { Laboratoiree } from './crud/laboratoire/laboratoire';


export default [
    {path:'resrvation-details', component: ReservationComponent},
    {path: 'connexion', component: ConnexionComponent},
    {path:'register', component: RegisterComponent},
    { path: 'user', component: Userr },
    { path: 'ufr', component: Ufrr },
    { path: 'equipement', component: Equipementt },
    { path: 'laboratoire', component: Laboratoiree},
    { path: 'reservation', component: ReservationComponent},
    { path: 'empty', component: Empty },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
