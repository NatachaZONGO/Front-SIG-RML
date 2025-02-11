import { Routes } from '@angular/router';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { Ufrr } from './crud/ufr';
import { Laboratoiree } from './crud/laboratoire';
import { Equipementt } from './crud/equipement';
import { ReservationComponent } from './crud/reservation';

export default [
    { path: 'crud', component: Crud },
    { path: 'ufr', component: Ufrr },
    { path: 'equipement', component: Equipementt },
    { path: 'laboratoire', component: Laboratoiree},
    { path: 'reservation', component: ReservationComponent},
    { path: 'empty', component: Empty },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
