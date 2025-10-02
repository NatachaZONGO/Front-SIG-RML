// register.models.ts
export type CompteType = 'candidat' | 'recruteur';

export interface RegisterBase {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterCandidat extends RegisterBase {
  sexe: 'Homme' | 'Femme';
  date_naissance: string;          // YYYY-MM-DD
  categorie_id: number;
  ville: string;
  niveau_etude: string;
  disponibilite: string;
  pays_id: number;
}

export interface RegisterRecruteur extends RegisterBase {
  nom_entreprise: string;
  secteur_activite: string;
  pays_id: number;
  description?: string | null;
  site_web?: string | null;
}
