import { Routes } from '@angular/router';
import { Empty } from './empty/empty';
//import { ReservationComponent, OffreComponent } from './crud/offre/offre';
import { ConnexionComponent } from './auth/connexion/connexion.component';
import { RegisterComponent } from './auth/register/register.component';
//import { Ufrr } from './crud/entreprise/entreprise';
//import { Laboratoiree } from './crud/publicite/publicite';
import { authGuard } from './auth/auth.guard';
import { EntrepriseComponent } from './crud/entreprise/entreprise';
import { RoleComponent } from './crud/role/role';
import { PubliciteComponent } from './crud/publicite/publicite';
import { PaysComponent } from './crud/pays/pays';
import { CategorieComponent } from './crud/categorie/categorie';
import { ConseilComponent } from './crud/conseil/conseil';
import { NotificationComponent } from './crud/notification/notification';
import { OffreComponent } from './crud/offre/offre';
import { CandidaturesComponent } from './crud/candidature/candidature';
import { UserService } from './crud/user/user.service';
import { UserComponent } from './crud/user/user';
import { ProfilComponent } from './crud/profil/profil.component';
import { CanSeeDirective } from '../Share/can_see/can_see.directive';




export default [

  //{ path: 'resrvation-details', component: ReservationComponent },
  { path: 'connexion', component: ConnexionComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'entreprise', component: EntrepriseComponent },
  { path: 'role', component: RoleComponent },
  { path: 'pays', component: PaysComponent },
  { path: 'offre', component: OffreComponent , canSee: ['recruteur','administrateur'] },
  { path : 'categorie', component: CategorieComponent },
  { path: 'publicite', component: PubliciteComponent }, 
  { path: 'conseil', component: ConseilComponent },
  { path: 'notification', component: NotificationComponent },
  { path: 'candidature', component: CandidaturesComponent },
  { path: 'user', component: UserComponent}, 
  { path: 'profil', component: ProfilComponent},
  //{ path: 'ufr', component: Ufrr, canActivate: [authGuard], data: { roles: ['admin'] } }, // Seul l'admin peut accéder
   { path: 'empty', component: Empty },
  { path: '**', redirectTo: '/notfound' },
] as Routes;
;