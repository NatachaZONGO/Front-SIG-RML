import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

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
    photo?: string; // Ajout de la propriété pour la photo
    laboratoire?: string; // Ajout de la propriété pour le laboratoire
    contacts?: string[]; // Ajout de la propriété pour les contacts
}

@Injectable({
    providedIn: 'root', // Assurez-vous que le service est fourni au niveau racine
})
export class Equipementservice {
    private apiUrl = 'http://localhost:3000/equipements'; // Remplacez par l'URL de votre API

    constructor(private http: HttpClient) {}

    // Méthode pour récupérer les équipements disponibles
   /* getEquipementsDisponibles(): Observable<Equipement[]> {
        return this.http.get<Equipement[]>(`${this.apiUrl}?estDisponible=true`);
    }*/

        getEquipementsDisponibles(): Observable<Equipement[]> {
            // Données statiques par défaut
            const equipementsDisponibles: Equipement[] = [
                {
                    id: '1',
                    name: 'Microscope',
                    description: 'Microscope électronique',
                    estDisponible: true,
                    estMutualisable: false,
                    etat: 'Neuf',
                    acquereur: 'Dr. Dupont',
                    typeAcquisition: 'Achat',
                    dateAjout: new Date('2023-10-01'),
                    dateModification: new Date('2023-10-05'),
                    photo: 'assets/images/microscope.jpg',
                    laboratoire: 'Laboratoire de Biologie',
                    contacts: ['Dr. Dupont (dupont@ujkz.bf)', 'Dr. Martin (martin@ujkz.bf)'],
                },
                {
                    id: '2',
                    name: 'Centrifugeuse',
                    description: 'Centrifugeuse haute vitesse',
                    estDisponible: true,
                    estMutualisable: true,
                    etat: 'En maintenance',
                    acquereur: 'Dr. Leroy',
                    typeAcquisition: 'Don',
                    dateAjout: new Date('2023-09-15'),
                    dateModification: new Date('2023-09-20'),
                    photo: 'assets/images/centrifugeuse.jpg',
                    laboratoire: 'Laboratoire de Chimie',
                    contacts: ['Dr. Leroy (leroy@ujkz.bf)'],
                },
            ];
    
            return of(equipementsDisponibles); // Retourne un Observable avec les données statiques
        }

    // Méthodes existantes pour la partie admin
    getEquipementsData() {
        return [
            // Exemple de données statiques (à remplacer par des données dynamiques si nécessaire)
            {
                id: '1',
                name: 'Microscope',
                description: 'Microscope électronique',
                estDisponible: true,
                estMutualisable: false,
                etat: 'Neuf',
                acquereur: 'Dr. Dupont',
                typeAcquisition: 'Achat',
                dateAjout: new Date('2023-10-01'),
                dateModification: new Date('2023-10-05'),
                photo: 'assets/images/microscope.jpg',
                laboratoire: 'Laboratoire de Biologie',
                contacts: ['Dr. Dupont (dupont@ujkz.bf)', 'Dr. Martin (martin@ujkz.bf)'],
            },
            {
                id: '2',
                name: 'Centrifugeuse',
                description: 'Centrifugeuse haute vitesse',
                estDisponible: true,
                estMutualisable: true,
                etat: 'En maintenance',
                acquereur: 'Dr. Leroy',
                typeAcquisition: 'Don',
                dateAjout: new Date('2023-09-15'),
                dateModification: new Date('2023-09-20'),
                photo: 'assets/images/centrifugeuse.jpg',
                laboratoire: 'Laboratoire de Chimie',
                contacts: ['Dr. Leroy (leroy@ujkz.bf)'],
            },
        ];
    }

     // Méthode pour récupérer tous les équipements
     getAllEquipements(): Observable<Equipement[]> {
        const equipements: Equipement[] = [
            {
                id: '1',
                name: 'Microscope',
                description: 'Microscope électronique',
                estDisponible: true,
                estMutualisable: false,
                etat: 'Neuf',
                acquereur: 'Dr. Dupont',
                typeAcquisition: 'Achat',
                dateAjout: new Date('2023-10-01'),
                dateModification: new Date('2023-10-05'),
                photo: 'assets/images/microscope.jpg',
                laboratoire: 'Laboratoire de Biologie',
                contacts: ['Dr. Dupont (dupont@ujkz.bf)', 'Dr. Martin (martin@ujkz.bf)'],
            },
            {
                id: '2',
                name: 'Centrifugeuse',
                description: 'Centrifugeuse haute vitesse',
                estDisponible: false, // Non disponible
                estMutualisable: true,
                etat: 'En maintenance',
                acquereur: 'Dr. Leroy',
                typeAcquisition: 'Don',
                dateAjout: new Date('2023-09-15'),
                dateModification: new Date('2023-09-20'),
                photo: 'assets/images/centrifugeuse.jpg',
                laboratoire: 'Laboratoire de Chimie',
                contacts: ['Dr. Leroy (leroy@ujkz.bf)'],
            },
        ];

        return of(equipements); // Retourne un Observable avec tous les équipements
    }
    
    getEquipementsWithOrdersData() {
        return [
            // Exemple de données statiques (à remplacer par des données dynamiques si nécessaire)
            {
                id: '1',
                name: 'Microscope',
                description: 'Microscope électronique',
                estDisponible: true,
                estMutualisable: false,
                etat: 'Neuf',
                acquereur: 'Dr. Dupont',
                typeAcquisition: 'Achat',
                dateAjout: new Date('2023-10-01'),
                dateModification: new Date('2023-10-05'),
                photo: 'assets/images/microscope.jpg',
                laboratoire: 'Laboratoire de Biologie',
                contacts: ['Dr. Dupont (dupont@ujkz.bf)', 'Dr. Martin (martin@ujkz.bf)'],
            },
        ];
    }

    equipementNames: string[] = [
        'Microscope',
        'Centrifugeuse',
        'Spectromètre',
        'Chromatographe',
        'Incubateur',
    ];

    equipementDescriptions: string[] = [
        'Microscope électronique',
        'Centrifugeuse haute vitesse',
        'Spectromètre de masse',
        'Chromatographe en phase gazeuse',
        'Incubateur CO2',
    ];

    equipementestDisponible: boolean[] = [true, false, true, true, false];

    equipementestMutualisable: boolean[] = [false, true, false, true, false];

    equipementEtat: string[] = ['Neuf', 'En maintenance', 'Usé', 'Neuf', 'En réparation'];

    equipementAcquereur: string[] = ['Dr. Dupont', 'Dr. Leroy', 'Dr. Martin', 'Dr. Dupont', 'Dr. Leroy'];

    equipementTypeAcquisition: string[] = ['Achat', 'Don', 'Achat', 'Don', 'Achat'];

    equipementDateAjouts: Date[] = [
        new Date('2023-10-01'),
        new Date('2023-09-15'),
        new Date('2023-08-20'),
        new Date('2023-07-10'),
        new Date('2023-06-05'),
    ];

    equipementDateModifications: Date[] = [
        new Date('2023-10-05'),
        new Date('2023-09-20'),
        new Date('2023-08-25'),
        new Date('2023-07-15'),
        new Date('2023-06-10'),
    ];

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
            dateModification: this.generateDateModification(),
            photo: 'assets/images/default.jpg', // Photo par défaut
            laboratoire: 'Laboratoire par défaut', // Laboratoire par défaut
            contacts: ['Contact par défaut'], // Contacts par défaut
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