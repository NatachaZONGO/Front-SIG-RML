import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { appConfig } from './app.config';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    importProvidersFrom(BaseChartDirective),
    ...appConfig.providers
  ]
}).catch((err) => console.error(err));
