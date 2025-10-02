// src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, TableModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  // Cartes "stats"
  totalUsers = 0;
  usersOnline = 0;
  totalEntreprises = 0;

  totalOffres = 0;
  offresPubliees = 0;
  offresEnAttente = 0;      // en_attente_validation
  offresBrouillon = 0;

  totalCandidatures = 0;
  candidaturesEnCours = 0;  // en_attente / en_cours
  candidaturesAcceptees = 0;
  candidaturesRefusees = 0;

  // Listes
  recentOffres: any[] = [];
  topEntreprises: any[] = [];

  // Charts
  offersChartData: any;
  candidaturesChartData: any;
  chartOptions: any = { responsive: true, maintainAspectRatio: false };

  loading = true;

  constructor(private dashboard: DashboardService) {}

  ngOnInit() {
    this.dashboard.getStats().subscribe({
      next: (data) => {
        this.loading = false;

        // Compteurs
        this.totalUsers       = data.total_users ?? 0;
        this.usersOnline      = data.users_online ?? 0;
        this.totalEntreprises = data.total_entreprises ?? 0;

        this.totalOffres      = data.total_offres ?? 0;
        this.offresPubliees   = data.offres_publiees ?? 0;
        this.offresEnAttente  = data.offres_en_attente ?? 0;
        this.offresBrouillon  = data.offres_brouillon ?? 0;

        this.totalCandidatures      = data.total_candidatures ?? 0;
        this.candidaturesEnCours    = data.candidatures_en_cours ?? 0;
        this.candidaturesAcceptees  = data.candidatures_acceptees ?? 0;
        this.candidaturesRefusees   = data.candidatures_refusees ?? 0;

        // Listes
        this.recentOffres   = Array.isArray(data.recent_offres) ? data.recent_offres : [];
        this.topEntreprises = Array.isArray(data.top_entreprises) ? data.top_entreprises : [];

        // Charts
        this.offersChartData = {
          labels: ['Publiées', 'En attente', 'Brouillons'],
          datasets: [{
            data: [this.offresPubliees, this.offresEnAttente, this.offresBrouillon],
            backgroundColor: ['#22c55e', '#f59e0b', '#94a3b8'],
          }]
        };

        this.candidaturesChartData = {
          labels: ['En cours', 'Acceptées', 'Refusées'],
          datasets: [{
            data: [this.candidaturesEnCours, this.candidaturesAcceptees, this.candidaturesRefusees],
            backgroundColor: ['#3b82f6', '#16a34a', '#ef4444'],
          }]
        };
      },
      error: (e) => {
        console.error('Erreur stats dashboard:', e);
        this.loading = false;
      }
    });
  }
}
