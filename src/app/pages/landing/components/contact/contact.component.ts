import { Component, NgZone } from '@angular/core'; // ✅ Ajouter NgZone
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TopbarWidget } from '../topbarwidget.component';
import { FooterWidget } from '../footerwidget';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    ButtonModule, RippleModule, InputTextModule,
    TextareaModule, SelectModule, ToastModule,
    TopbarWidget, FooterWidget
  ],
  providers: [MessageService],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {

  sending = false;
  submitted = false;

  sujetOptions = [
    { label: 'Candidature / Emploi',   value: 'candidature' },
    { label: 'Publication d\'offre',    value: 'offre' },
    { label: 'Publicité & Partenariat', value: 'publicite' },
    { label: 'Problème technique',      value: 'technique' },
    { label: 'Autre',                   value: 'autre' },
  ];

  form = {
    nom:       '',
    email:     '',
    telephone: '',
    sujet:     '',
    message:   '',
  };

  constructor(
    private messageService: MessageService,
    private ngZone: NgZone, // ✅ AJOUTER
    public router: Router
  ) {}

  send(f: NgForm): void {
    this.submitted = true;
    if (f.invalid) return;

    this.sending = true;

    const ACCESS_KEY = '4370bbfa-2e65-433b-ac2a-3d3745b2aa0a';

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: ACCESS_KEY,
        subject:    `[Alerte Emploi] Nouveau message - ${this.form.sujet}`,
        from_name:  this.form.nom,
        email:      this.form.email,
        telephone:  this.form.telephone || 'Non renseigné',
        sujet:      this.form.sujet,
        message:    this.form.message,
      })
    })
    .then(res => res.json())
    .then(data => {
      // ✅ NgZone pour que Angular détecte les changements
      this.ngZone.run(() => {
        this.sending = false;
        if (data.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Message envoyé !',
            detail: 'Nous vous répondrons dans les plus brefs délais.',
            life: 5000
          });
          f.resetForm();
          this.submitted = false;
          this.form = { nom: '', email: '', telephone: '', sujet: '', message: '' };
        } else {
          throw new Error(data.message);
        }
      });
    })
    .catch(error => {
      // ✅ NgZone pour que Angular détecte les changements
      this.ngZone.run(() => {
        console.error('Erreur envoi:', error);
        this.sending = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible d\'envoyer le message. Réessayez plus tard.',
          life: 5000
        });
      });
    });
  }
}