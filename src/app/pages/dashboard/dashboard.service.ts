import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://your-backend-url/api/statistics';

  constructor(private http: HttpClient) {}

  getStatistics(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        return {
          barChartData: response.barChartData,
          pieChartData: response.pieChartData
        };
      })
    );
  }
}
