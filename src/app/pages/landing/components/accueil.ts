import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importez CommonModule
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
    selector: 'accueil',
    standalone: true, // Assurez-vous que standalone est activé
    imports: [CommonModule, ButtonModule, RippleModule], // Ajoutez CommonModule ici
    template: `
        <div
            id="hero"
            class="flex flex-col pt-6 px-6 lg:px-20 overflow-hidden"
            [ngStyle]="{
                'background': 'linear-gradient(0deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), url(' + backgroundImage + ') no-repeat center center / cover',
                'clip-path': 'ellipse(150% 87% at 93% 13%)'
            }"
        >
            <div class="mx-6 md:mx-20 mt-0 md:mt-6">
                <h1 class="text-6xl font-bold text-gray-900 leading-tight">
                    <span class="font-light block">Réservation de Matériel</span>
                    Université Joseph KI-ZERBO
                </h1>
                <p class="font-normal text-2xl leading-normal md:mt-4 text-gray-700">
                    Réservez facilement le matériel de laboratoire dont vous avez besoin pour vos recherches et travaux pratiques.
                </p>
                <button pButton pRipple [rounded]="true" type="button" label="Commencer" class="!text-xl mt-8 !px-4"></button>
            </div>
            <div class="flex justify-center md:justify-end">
                <img [src]="heroImage" alt="Hero Image" class="w-9/12 md:w-auto" />
            </div>
        </div>
    `
})
export class Accueil {
    backgroundImage = 'assets/images/laboratoire.jpg'; 
    heroImage = 'assets/images/presidence.webp';
}