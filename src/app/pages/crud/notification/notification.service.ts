// app/pages/notification/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { BackendURL } from '../../../const';
import { ApiListResponse, UserNotification } from './notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly base = `${BackendURL}notifications`;
  private unread$ = new BehaviorSubject<number>(0);

  /** flux compteur non-lus */
  notificationsNonLues$ = this.unread$.asObservable();

  constructor(private http: HttpClient) {}

  /** Liste des notifications de l’utilisateur (filtrables par statut pivot) */
  getMyNotifications(
    userId: number,
    statut?: 'envoyee' | 'lue' | 'archivee',
    size = 50
  ): Observable<UserNotification[]> {
    let params = new HttpParams().set('user_id', userId).set('size', size);
    if (statut) params = params.set('statut', statut);

    return this.http
      .get<ApiListResponse<UserNotification[]>>(`${this.base}/mes`, { params })
      .pipe(
        map(res => res?.content || []),
        catchError(this.handleError)
      );
  }

  /** Compteur de non-lues */
  refreshUnreadCount(userId: number): void {
    const params = new HttpParams().set('user_id', userId);
    this.http
      .get<{ count: number; success: boolean }>(`${this.base}/non-lues`, { params })
      .pipe(
        map(r => r?.count ?? 0),
        catchError(() => [0])
      )
      .subscribe(cnt => this.unread$.next(cnt));
  }

  /** Marquer une notif lue */
  markRead(notificationId: number, userId: number) {
    return this.http.patch(`${this.base}/${notificationId}/read`, { user_id: userId }).pipe(
      tap(() => this.refreshUnreadCount(userId)),
      catchError(this.handleError)
    );
  }

  /** Marquer une notif non lue */
  markUnread(notificationId: number, userId: number) {
    return this.http
      .patch(`${this.base}/${notificationId}/read`, { user_id: userId, unread: true })
      .pipe(
        tap(() => this.refreshUnreadCount(userId)),
        catchError(this.handleError)
      );
  }

  /** Tout marquer lu */
  markAllRead(userId: number) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http
      .patch(`${this.base}/mes/read-all`, { user_id: userId }, { headers })
      .pipe(
        tap(() => this.refreshUnreadCount(userId)),
        catchError(this.handleError)
      );
  }

  private handleError = (err: any) => {
    console.error('NotificationService error:', err);
    return throwError(() => new Error(err?.error?.message || 'Erreur de notification'));
  };
}
