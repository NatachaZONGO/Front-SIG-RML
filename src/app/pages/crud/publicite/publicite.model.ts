// publicite.model.ts
export interface Publicite {
  id?: number;
  titre?: string;
  description?: string;

  image?: string;
  image_url?: string;   // ⬅️ ajouté
  video?: string;
  video_url?: string;   // ⬅️ ajouté

  lien_externe?: string;
  type?: 'banniere'|'sidebar'|'footer';

  media_request?: 'image'|'video'|'both';
  dual_unlock_code?: string;

  statut?: 'brouillon'|'en_attente'|'active'|'expiree'|'rejetee';
  duree?: '3'|'7'|'14'|'30'|'60'|'90';
  prix?: number | string;

  date_debut?: string | Date;
  date_fin?: string | Date;

  vues?: number;
  clics?: number;
  motif_rejet?: string | null;

  entreprise_id?: number;
  entreprise?: any;

  imageFile?: File | null;
  videoFile?: File | null;
}