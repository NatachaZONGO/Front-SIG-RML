import { Component, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart'; 
import { TableModule } from 'primeng/table'; 
import { CommonModule } from '@angular/common';
import { DashboardService } from './dashboard.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, ChartModule, TableModule],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
    totalReservations: number = 0;
    totalEquipements: number = 0;
    totalUsers: number = 0;
    monthlyReservations: number = 0;
    upcomingReservations: any[] = [];
    prochainesReservations: number = 0;
    totalUFRs: number = 0;
    reservationsEnAttente: number = 0;
    mostUsedEquipments: any[] = []; 
    users_now: number = 0;

    equipementUsageChartData: any;
    equipementRiskChartData: any;
    chartOptions: any;

    constructor(private dashboardService: DashboardService) {}

    ngOnInit() {
        this.dashboardService.getStats().subscribe((data) => {
            console.log('Données reçues :', data); // Debugging

            this.totalReservations = data.total_reservations;
            this.totalEquipements = data.total_equipements;
            this.totalUsers = data.total_users;
            this.users_now = data.users_now;
            this.monthlyReservations = data.reservations_ce_mois;
            this.upcomingReservations = data.prochaines_reservations;
            this.prochainesReservations = data.prochaines_reservations;
            this.totalUFRs = data.total_ufrs;
            this.reservationsEnAttente = data.reservations_en_attente;

            

            // Formatage des équipements les plus utilisés
            this.mostUsedEquipments = data.equipements_utilises 
            ? data.equipements_utilises.map((item: any) => ({
                nom: item.equipement.nom,
                laboratoire: item.equipement.laboratoire.nom,
                nombreReservations: item.total_reservations,
            }))
            : []; // Si undefined, retourne un tableau vide
        

            this.equipementUsageChartData = {
                labels: ['Utilisés', 'Non Utilisés'],
                datasets: [
                    {
                        data: [data.equipements_utilises_percentage, 100 - data.equipements_utilises_percentage],
                        backgroundColor: ['#36A2EB', '#FF6384'],
                    },
                ],
            };

            this.equipementRiskChartData = {
                labels: ['À Risque', 'Sécurisés'],
                datasets: [
                    {
                        data: [data.equipements_susceptibles_pannes_percentage, 100 - data.equipements_susceptibles_pannes_percentage],
                        backgroundColor: ['#FF6384', '#36A2EB'],
                    },
                ],
            };

            this.chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
            };
        });
    }
}
