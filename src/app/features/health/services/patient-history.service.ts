import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface HealthMetric {
  _id: string;
  type: string;
  value: number;
  value2?: number;
  unit: string;
  recordedAt: Date;
  rangeStatus?: string;
  rangeMessage?: string;
}

export interface PatientHistoryResponse {
  totalRecords: number;
  data: {
    bloodLevels: HealthMetric[];
    sugarLevels: HealthMetric[];
    otherMetrics: HealthMetric[];
    medicalHistory: any[];
  };
}

export interface TrendData {
  metricType: string;
  period: string;
  dataPoints: number;
  trend: string;
  trendStrength: number;
  averageValue: number;
  minValue: number;
  maxValue: number;
  recentAverage: number;
  previousAverage: number;
  changePercent: number;
  clinicalSignificance: string;
  alert?: {
    level: string;
    message: string;
    recommendation: string;
  };
}

export interface PatientTrendsResponse {
  trends: TrendData[];
  correlations: any[];
}

export interface PatientSummaryResponse {
  latestMetrics: { [key: string]: HealthMetric };
  riskScore: number;
  areasOfConcern: Array<{
    metric: string;
    value: number;
    severity: string;
    message: string;
  }>;
  anomalies: Array<{
    metric: string;
    currentValue: number;
    previousValue: number;
    changePercent: string;
    message: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class PatientHistoryService {
  private apiUrl = `${environment.apiUrl}/metrics`;

  constructor(private http: HttpClient) {}

  /**
   * Get comprehensive patient history with filtering
   */
  getPatientHistory(
    patientId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      metricType?: string;
    }
  ): Observable<PatientHistoryResponse> {
    let params = new HttpParams();
    
    if (filters?.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters?.metricType) {
      params = params.set('metricType', filters.metricType);
    }

    return this.http.get<PatientHistoryResponse>(
      `${this.apiUrl}/patient/${patientId}/history`,
      { params }
    );
  }

  /**
   * Get trend analysis for patient metrics
   */
  getPatientTrends(
    patientId: string,
    metricTypes?: string[],
    months: number = 6
  ): Observable<PatientTrendsResponse> {
    let params = new HttpParams().set('months', months.toString());
    
    if (metricTypes && metricTypes.length > 0) {
      params = params.set('metricTypes', metricTypes.join(','));
    }

    return this.http.get<PatientTrendsResponse>(
      `${this.apiUrl}/patient/${patientId}/trends`,
      { params }
    );
  }

  /**
   * Get patient summary with risk assessment
   */
  getPatientSummary(patientId: string): Observable<PatientSummaryResponse> {
    return this.http.get<PatientSummaryResponse>(
      `${this.apiUrl}/patient/${patientId}/summary`
    );
  }
}
