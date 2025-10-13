export interface User {
  id?: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  password?: string;
  role?: string; // Nom du rôle pour affichage
  roleId?: number; // ID du rôle (number pour correspondre à votre API)
  role_id?: number; // Pour l'envoi au backend (number aussi)
  statut?: 'actif' | 'inactif';
  photo?: string | File;
  last_login?: string;
  roles?: Array<{
    id: number; // Changé en number pour correspondre à votre API
    nom: string;
    description: string;
    created_at: string;
    updated_at: string;
    pivot: {
      user_id: number;
      role_id: number; // number aussi
    };
  }>;
  created_at?: string;
  updated_at?: string;
  email_verified_at?: string | null;
  candidat?: any;
  entreprise?: any;
}