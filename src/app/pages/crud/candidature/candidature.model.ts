export type CandidatureStatut = 'en_attente' | 'acceptee' | 'refusee';

export interface Candidature {
  id: number;
  offre_id: number;
  candidat_id: number;
  
  // Propriétés réelles de l'API
  lettre_motivation?: string;  // ← Nom correct de l'API
  cv?: string;                // ← Nom correct de l'API
  statut?: CandidatureStatut; // ← Statuts corrects
  created_at?: string;
  updated_at?: string;

  // Relations de l'API
  candidat?: {
    id: number;
    user_id: number;
    sexe?: string;
    date_naissance?: string;
    ville?: string;
    niveau_etude?: string;
    user?: {
      id?: number;
      nom?: string;
      prenom?: string;
      firstname?: string;
      lastname?: string;
      email?: string;
      telephone?: string;
      phone?: string;
    };
  };
  
  offre?: {
    id: number;
    titre: string;
    description?: string;
    localisation?: string;
    type_offre?: string;
    type_contrat?: string;
    salaire?: string;
  };

  // Propriétés calculées pour l'affichage (ajoutées par mapForView)
  fullName?: string;
  email?: string;
  telephone?: string;
  offreTitre?: string;
  motivation?: string;    // Copie de lettre_motivation
  cv_url?: string;       // URL construite à partir de cv
}