export interface User {
    id?: string;
    firstname?: string; 
    lastname?: string;
    email?: string;
    phone?: number;
    password?: string;
    role: 'admin' | 'responsable' | 'reservant'; 
}