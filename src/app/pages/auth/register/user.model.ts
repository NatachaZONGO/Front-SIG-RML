export interface RegisterUser {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    role: 'admin' | 'responsable' | 'reservant';
    phone:number;
    address: string;
}

