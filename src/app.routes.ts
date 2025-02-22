import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Notfound } from './app/pages/notfound/notfound';
import { Landing } from './app/pages/landing/landing';
import { ConnexionComponent } from './app/pages/auth/connexion/connexion.component';
import { RegisterComponent } from './app/pages/auth/register/register.component';


export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
             
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes'),  },
        ]
    },
    {path: 'connexion', component: ConnexionComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'landing', component: Landing  },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' },

    
];
 