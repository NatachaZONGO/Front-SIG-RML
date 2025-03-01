import { Component, OnInit } from '@angular/core';
import { ChartOptions, ChartType, ChartData } from 'chart.js'; // Importation de ChartData
import { DashboardService } from './dashboard.service';
import { CommonModule } from '@angular/common';
import { BaseChartDirective} from 'ng2-charts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: []
})
export class DashboardComponent implements OnInit {
  // Bar Chart
  public barChartOptions: ChartOptions = {
    responsive: true,
  };
  public barChartLabels: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];
  // Correction ici : Utilisation de ChartData au lieu de ChartDataset
  public barChartData: ChartData<'bar'> = {
    labels: this.barChartLabels,
    datasets: [
      { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
      { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B' }
    ]
  };

  // Pie Chart
  public pieChartOptions: ChartOptions = {
    responsive: true,
  };
  public pieChartLabels: (string | string[])[] = [['Download', 'Sales'], ['In', 'Store', 'Sales'], 'Mail Sales'];
  // Correction ici aussi : Utilisation de ChartData pour Pie Chart
  public pieChartData: ChartData<'pie'> = {
    labels: this.pieChartLabels,
    datasets: [{ data: [300, 500, 100], label: 'Sales' }]
  };
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;
  public pieChartPlugins = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.dashboardService.getStatistics().subscribe(data => {
      // Mise à jour des données des graphiques avec les statistiques récupérées
      this.barChartData = data.barChartData;
      this.pieChartData = data.pieChartData;
    });
  }
}
