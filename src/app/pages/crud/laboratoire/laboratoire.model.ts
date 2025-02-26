import { Ufr } from "../ufr/ufr.model";
import { User } from "../user/user.model";

export interface Laboratoire {
    id?: string;
    nom?: string;
    description?: string;
    ufr?: Ufr;
    responsable?: User;
    ufr_id?: string; 
    responsable_id?: string; 
}