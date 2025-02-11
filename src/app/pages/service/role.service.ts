import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface InventoryStatus {
    label: string;
    value: string;
}

export interface Role {
    id?: string;
    name?: string;
    prenom?: string;
    email?: string;
    password?: string; 
    inventoryStatus?: string;
    rating?: number;
}

@Injectable()
export class RoleService {
    getRolesData() {
        return [
            {
            }
        ];
    }

    getRolesWithOrdersData() {
        return [
            {
                
               
            },
            
        ];
    }


    roleNames: string[] = [
       
    ];
    rolePrenoms: string[] = [
       
    ];
    roleMails: string[] = [
       
    ];

    constructor(private http: HttpClient) {}

    getRolesMini() {
        return Promise.resolve(this.getRolesData().slice(0, 5));
    }

    getRolesSmall() {
        return Promise.resolve(this.getRolesData().slice(0, 10));
    }

    getRoles() {
        return Promise.resolve(this.getRolesData());
    }

    getRolesWithOrdersSmall() {
        return Promise.resolve(this.getRolesWithOrdersData().slice(0, 10));
    }

    generateRole(): Role {
        const product: Role = {
            id: this.generateId(),
            name: this.generateName(),
            prenom: this.generatePrenom(),
            email: this.generateEmail(),
            rating: this.generateRating()
        };
        return product;
    }

    generateId() {
        let text = '';
        let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < 5; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    generateName() {
        return this.roleNames[Math.floor(Math.random() * Math.floor(30))];
    }
    generatePrenom() {
        return this.rolePrenoms[Math.floor(Math.random() * Math.floor(30))];
    }
    generateEmail() {
        return this.roleMails[Math.floor(Math.random() * Math.floor(30))];
    }
   
    generateRating() {
        return Math.floor(Math.random() * Math.floor(5) + 1);
    }
}
