import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface InventoryStatus {
    label: string;
    value: string;
}

export interface User {
    id?: string;
    name?: string;
    prenom?: string;
    email?: string;
    password?: string; 
    inventoryStatus?: string;
    rating?: number;
}

@Injectable()
export class ProductService {
    getProductsData() {
        return [
            {
            }
        ];
    }

    getProductsWithOrdersData() {
        return [
            {
                
               
            },
            
        ];
    }


    userNames: string[] = [
       
    ];
    userPrenoms: string[] = [
       
    ];
    userMails: string[] = [
       
    ];

    constructor(private http: HttpClient) {}

    getProductsMini() {
        return Promise.resolve(this.getProductsData().slice(0, 5));
    }

    getProductsSmall() {
        return Promise.resolve(this.getProductsData().slice(0, 10));
    }

    getProducts() {
        return Promise.resolve(this.getProductsData());
    }

    getProductsWithOrdersSmall() {
        return Promise.resolve(this.getProductsWithOrdersData().slice(0, 10));
    }

    generatePrduct(): User {
        const product: User = {
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
        return this.userNames[Math.floor(Math.random() * Math.floor(30))];
    }
    generatePrenom() {
        return this.userPrenoms[Math.floor(Math.random() * Math.floor(30))];
    }
    generateEmail() {
        return this.userMails[Math.floor(Math.random() * Math.floor(30))];
    }
   
    generateRating() {
        return Math.floor(Math.random() * Math.floor(5) + 1);
    }
}
