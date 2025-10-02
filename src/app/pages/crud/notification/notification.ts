// app/pages/notification/notification.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';

import { AuthService } from '../../auth/auth.service';
import { UserNotification } from './notification.model';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ToastModule,
    InputTextModule, IconFieldModule, InputIconModule,
    ButtonModule, BadgeModule, TagModule
  ],
  providers: [MessageService],
  templateUrl: './notification.component.html'
})
export class NotificationComponent implements OnInit {

  search = '';
  filter: 'all'|'unread'|'read' = 'all';

  meId: number = 0;

  notifications = signal<UserNotification[]>([]);
  loading = signal(false);
  active?: UserNotification;

  constructor(
    private api: NotificationService,
    private toast: MessageService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.meId = this.auth.getCurrentUserId() ?? 0;
    this.loadList();
    if (this.meId) this.api.refreshUnreadCount(this.meId);
  }

  loadList(): void {
    if (!this.meId) return;
    this.loading.set(true);

    const statut = this.filter === 'unread' ? 'envoyee'
                 : this.filter === 'read'   ? 'lue'
                 : undefined;

    this.api.getMyNotifications(this.meId, statut).subscribe({
      next: list => {
        this.notifications.set(list.map(n => ({
          ...n,
          date_creation: n.date_creation || (n as any).created_at
        })));
      },
      error: err => this.toast.add({ severity:'error', summary:'Erreur', detail: String(err), life: 3500 }),
      complete: () => this.loading.set(false)
    });
  }

  items = computed(() => {
    const q = this.search.toLowerCase().trim();
    let list = this.notifications();
    if (q) {
      list = list.filter(n =>
        (n.titre || '').toLowerCase().includes(q) ||
        (n.message || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a,b) =>
      new Date(b.date_creation || 0).getTime() - new Date(a.date_creation || 0).getTime()
    );
  });

  /** Non lue = statut pivot 'envoyee' (back) */
  isUnread(n: UserNotification): boolean {
    return (n.pivot?.statut || n.statut) === 'envoyee';
  }

  /** Sélection + marquage auto en LU si nécessaire */
  select(n: UserNotification) {
    this.active = n;

    if (this.isUnread(n)) {
      this.api.markRead(n.id, this.meId).subscribe({
        next: () => {
          // patch local
          this.notifications.set(this.notifications().map(x =>
            x.id === n.id ? ({
              ...x,
              pivot: { ...(x.pivot||{}), statut:'lue', date_lecture: new Date().toISOString() }
            }) : x
          ));
        },
        error: () => {
          // On ne bloque pas l’ouverture si l’API échoue
          this.toast.add({ severity:'warn', summary:'Info', detail:'Impossible de marquer comme lue pour le moment.' });
        }
      });
    }
  }

  /** Tout marquer lu (bouton en haut de la liste) */
  markAllRead() {
    this.api.markAllRead(this.meId).subscribe({
      next: () => {
        this.notifications.set(this.notifications().map(x => ({
          ...x, pivot: { ...(x.pivot||{}), statut:'lue', date_lecture: new Date().toISOString() }
        })));
        this.toast.add({ severity:'success', summary:'OK', detail:'Toutes les notifications sont lues', life: 2200 });
      }
    });
  }

  statutSeverity(s?: string): 'success'|'info'|'warn'|'danger'|'secondary'|'contrast' {
    switch ((s||'').toLowerCase()) {
      case 'envoyee': return 'warn';
      case 'lue':     return 'success';
      case 'echec':   return 'danger';
      case 'programmee': return 'info';
      case 'brouillon':  return 'secondary';
      default: return 'contrast';
    }
  }

  /** Retourne la 1ère URL trouvée dans le message */
  getFirstUrl(n?: UserNotification): string | null {
    const txt = (n?.message || '').toString();
    const m = txt.match(/https?:\/\/[^\s]+/i);
    return m ? m[0] : null;
  }

  /** Message sans l’URL (optionnel, juste pour éviter le doublon visuel) */
  getMessageWithoutUrl(n?: UserNotification): string {
    const url = this.getFirstUrl(n);
    return url ? (n?.message || '').replace(url, '').trim() : (n?.message || '—');
  }
  goToOffers(): void {
    this.router.navigateByUrl('/offres'); // 👈 FORCE /offres
  }

}
