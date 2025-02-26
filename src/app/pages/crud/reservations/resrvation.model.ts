export interface Reservation {
        id?: string;
        date_debut: string; 
        date_fin: string; 
        user_id: string; 
        equipement_id: string;  
        equipementName?: string; 
        motif: string;
        commentaire: string;
        info_utilisateur: string;
        nom: string;
        prenom: string;
        email: string;    
        contact: string;
        status?: string;
    
        
        
}
