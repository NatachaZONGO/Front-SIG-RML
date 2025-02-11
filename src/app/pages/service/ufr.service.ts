import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface InventoryStatus {
    label: string;
    value: string;
}

export interface Ufr {
    id?: string;
    name?: string;
    intitule?: string;
    description?: string;
    dateAjout?: Date;
    dateModification?: Date; 
}

@Injectable()
export class Ufrservice {
    getUfrsData() {
        return [
            {
            }
        ];
    }

    getUfrsWithOrdersData() {
        return [
            {
                
               
            },
            
        ];
    }


    ufrNames: string[] = [
       
    ];
    ufrIntitules: string[] = [
       
    ];
    ufrDescriptions: string[] = [
       
    ];

    ufrDateAjouts: Date[] = [
       
    ];

    ufrDateModifications: Date[] = [
       
    ];

    constructor(private http: HttpClient) {}

    getUfrsMini() {
        return Promise.resolve(this.getUfrsData().slice(0, 5));
    }

    getUfrsSmall() {
        return Promise.resolve(this.getUfrsData().slice(0, 10));
    }

    getUfrs() {
        return Promise.resolve(this.getUfrsData());
    }

    getUfrsWithOrdersSmall() {
        return Promise.resolve(this.getUfrsWithOrdersData().slice(0, 10));
    }

    generateUfr(): Ufr {
        const ufr: Ufr = {
            id: this.generateId(),
            name: this.generateName(),
            intitule: this.generateIntitule(),
            description: this.generateDescription(),
            dateAjout: this.generateDateAjout(),
            dateModification: this.generateDateModification()
        };
        return ufr;
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
        return this.ufrNames[Math.floor(Math.random() * Math.floor(30))];
    }
    generateIntitule() {
        return this.ufrIntitules[Math.floor(Math.random() * Math.floor(30))];
    }
    generateDescription() {
        return this.ufrDescriptions[Math.floor(Math.random() * Math.floor(30))];
    }
    generateDateAjout() {
        return this.ufrDateAjouts[Math.floor(Math.random() * Math.floor(30))];
    }
    generateDateModification() {
        return this.ufrDateModifications[Math.floor(Math.random() * Math.floor(30))];
    }

}
