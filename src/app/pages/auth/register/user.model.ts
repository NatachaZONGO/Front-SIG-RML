export interface RegisterUser {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    scope: 'admin' | 'responsable' | 'reservant';
    phone:number;
}

