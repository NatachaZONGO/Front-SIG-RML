import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Notfound } from './app/pages/notfound/notfound';
import { Landing } from './app/pages/landing/landing';
import { ConnexionComponent } from './app/pages/auth/connexion/connexion.component';
import { RegisterComponent } from './app/pages/auth/register/register.component';
//import { ReservationDetailsComponent } from './app/pages/landing/suivre.reservation/reservation.details/reservation-details.component';
import { DashboardComponent } from './app/pages/dashboard/dashboard';
import { of } from 'rxjs';
import { OffreComponent } from './app/pages/crud/offre/offre';
import { OffresListComponent } from './app/pages/landing/components/offres_list/offres-list.component';
import { SuiviCandidatureComponent } from './app/pages/crud/candidature/suivre_candidature';


export const appRoutes: Routes = [
  { path: '', component: Landing }, // La racine pointe directement vers Landing

  {
    path: '',
    component: AppLayout,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
      { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
    ],
  },

  { path: 'connexion', component: ConnexionComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'landing', component: Landing },
  { path: 'offres', component: OffresListComponent },
  { path: 'suivre-candidature', component: SuiviCandidatureComponent },
  { path: 'notfound', component: Notfound },
  { path: '**', redirectTo: '/notfound' },
];

