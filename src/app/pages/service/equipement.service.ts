import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface InventoryStatus {
    label: string;
    value: string;
}

export interface Equipement {
    id?: string;
    name?: string;
    description?: string;
    estDisponible?: boolean;
    estMutualisable?: boolean;
    etat?: string;
    acquereur?: string;
    typeAcquisition?: string;
    dateAjout?: Date;
    dateModification?: Date; 
}

@Injectable()
export class Equipementservice {
    getEquipementsData() {
        return [
            {
            }
        ];
    }

    getEquipementsWithOrdersData() {
        return [
            {
                
               
            },
            
        ];
    }


    equipementNames: string[] = [
       
    ];
    equipementDescriptions: string[] = [
       
    ];
    equipementestDisponible: boolean[] = [

    ];
    equipementestMutualisable: boolean[] = [
       
    ];
    equipementEtat: string[] = [
       
    ];
    equipementAcquereur: string[] = [
       
    ];
    equipementTypeAcquisition: string[] = [
       
    ];

    equipementDateAjouts: Date[] = [
       
    ];

    equipementDateModifications: Date[] = [
       
    ];

    constructor(private http: HttpClient) {}

    getEquipementsMini() {
        return Promise.resolve(this.getEquipementsData().slice(0, 5));
    }

    getEquipementsSmall() {
        return Promise.resolve(this.getEquipementsData().slice(0, 10));
    }

    getEquipements() {
        return Promise.resolve(this.getEquipementsData());
    }

    getEquipementsWithOrdersSmall() {
        return Promise.resolve(this.getEquipementsWithOrdersData().slice(0, 10));
    }

    generateEquipement(): Equipement {
        const equipement: Equipement = {
            id: this.generateId(),
            name: this.generateName(),
            description: this.generateDescription(),
            estDisponible: this.generateEstDisponible(),
            estMutualisable: this.generateEstMutualisable(),
            etat: this.generateEtat(),
            acquereur: this.generateAcquereur(),
            typeAcquisition: this.generateTypeAcquisition(),
            dateAjout: this.generateDateAjout(),
            dateModification: this.generateDateModification()
        };
        return equipement;
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
        return this.equipementNames[Math.floor(Math.random() * Math.floor(30))];
    }
    generateDescription() {
        return this.equipementDescriptions[Math.floor(Math.random() * Math.floor(30))];
    }
    generateEstDisponible() {
        return this.equipementestDisponible[Math.floor(Math.random() * Math.floor(30))];
    }
    generateEstMutualisable() {
        return this.equipementestMutualisable[Math.floor(Math.random() * Math.floor(30))];
    }
    generateEtat() {
        return this.equipementEtat[Math.floor(Math.random() * Math.floor(30))];
    }
    generateAcquereur() {
        return this.equipementAcquereur[Math.floor(Math.random() * Math.floor(30))];
    }
    generateTypeAcquisition() {
        return this.equipementTypeAcquisition[Math.floor(Math.random() * Math.floor(30))];
    }
    generateDateAjout() {
        return this.equipementDateAjouts[Math.floor(Math.random() * Math.floor(30))];
    }
    generateDateModification() {
        return this.equipementDateModifications[Math.floor(Math.random() * Math.floor(30))];
    }

}
