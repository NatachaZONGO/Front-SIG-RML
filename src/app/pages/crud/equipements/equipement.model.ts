import { Laboratoire } from "../laboratoire/laboratoire.model";

export interface Equipement {
    id?: string; 
    nom?: string;
    description?: string;
    estdisponible?: boolean|number;
    estmutualisable?: boolean|number;
    etat?: string;
    acquereur?: string;
    typeacquisition?: string;
    laboratoire_id?: string;
    laboratoire?: Laboratoire;
    image?: string;
}