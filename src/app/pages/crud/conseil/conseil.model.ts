export interface Conseil {
  id?: number;                 // <- number
  titre?: string;
  contenu?: string;
  categorie?: string;
  type_conseil?: string;
  niveau?: string;
  statut?: string;
  tags?: string;
  auteur?: string;
  vues?: number;
  date_publication?: Date | string | null;
  date_creation?: Date | string | null;
  date_modification?: Date | string | null;
}
