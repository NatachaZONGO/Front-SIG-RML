export interface UserNotification {
  id: number;
  titre?: string;
  message?: string;
  type?: string; // ex: 'info', 'system', etc. (optionnel)
  statut?: 'brouillon' | 'programmee' | 'envoyee' | 'lue' | 'archivee' | 'echec';
  date_creation?: string;      // created_at côté API
  date_envoi?: string | null;  // optionnel
  pivot?: {                    // renvoyé par /mes : statut par utilisateur
    statut?: 'envoyee' | 'lue' | 'archivee';
    date_lecture?: string | null;
  };
}

// Réponse paginée standard
export interface ApiListResponse<T> {
  content: T;
  totalElements?: number;
  success?: boolean;
  message?: string;
}
