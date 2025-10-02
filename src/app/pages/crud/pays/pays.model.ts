export interface Pays {
  id?: number;
  nom: string;
  code: string;           // ← unique, pas code_iso
  indicatif_tel?: string;
  flagImage?: string;     // URL complète renvoyée par l’API
  isActive?: boolean;
}
