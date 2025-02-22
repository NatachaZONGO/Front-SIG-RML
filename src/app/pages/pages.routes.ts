import { Routes } from '@angular/router';
import { Empty } from './empty/empty';
import { Ufrr } from './crud/ufr';
import { Laboratoiree } from './crud/laboratoire';
import { Equipementt } from './crud/equipement';
import { ReservationComponent } from './crud/reservation';
import { Userr } from './crud/user';
import { ConnexionComponent } from './auth/connexion/connexion.component';
import { RegisterComponent } from './auth/register/register.component';


export default [

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
