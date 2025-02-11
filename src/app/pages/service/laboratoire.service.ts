import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface InventoryStatus {
    label: string;
    value: string;
}

export interface Laboratoire {
    id?: string;
    name?: string;
    description?: string;
    dateAjout?: Date;
    dateModification?: Date; 
}

@Injectable()
export class Laboratoireservice {
    getLaboratoiresData() {
        return [
            {
            }
        ];
    }

    getLaboratoiresWithOrdersData() {
        return [
            {
                
               
            },
            
        ];
    }


    laboratoireNames: string[] = [
       
    ];
    laboratoireIntitules: string[] = [
       
    ];
    laboratoireDescriptions: string[] = [
       
    ];

    laboratoireDateAjouts: Date[] = [
       
    ];

    laboratoireDateModifications: Date[] = [
       
    ];

    constructor(private http: HttpClient) {}

    getLaboratoiresMini() {
        return Promise.resolve(this.getLaboratoiresData().slice(0, 5));
    }

    getLaboratoiresSmall() {
        return Promise.resolve(this.getLaboratoiresData().slice(0, 10));
    }

    getLaboratoires() {
        return Promise.resolve(this.getLaboratoiresData());
    }

    getLaboratoiresWithOrdersSmall() {
        return Promise.resolve(this.getLaboratoiresWithOrdersData().slice(0, 10));
    }

    generateLaboratoire(): Laboratoire {
        const laboratoire: Laboratoire = {
            id: this.generateId(),
            name: this.generateName(),
            description: this.generateDescription(),
            dateAjout: this.generateDateAjout(),
            dateModification: this.generateDateModification()
        };
        return laboratoire;
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
        return this.laboratoireNames[Math.floor(Math.random() * Math.floor(30))];
    }
    generateIntitule() {
        return this.laboratoireIntitules[Math.floor(Math.random() * Math.floor(30))];
    }
    generateDescription() {
        return this.laboratoireDescriptions[Math.floor(Math.random() * Math.floor(30))];
    }
    generateDateAjout() {
        return this.laboratoireDateAjouts[Math.floor(Math.random() * Math.floor(30))];
    }
    generateDateModification() {
        return this.laboratoireDateModifications[Math.floor(Math.random() * Math.floor(30))];
    }

}
