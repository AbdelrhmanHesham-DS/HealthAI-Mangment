import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AIFeaturesService {
  private apiUrl = 'http://localhost:5000/api/healthai';

  constructor(private http: HttpClient) {}

  // ========== SYMPTOM ANALYSIS ==========
  analyzeSymptoms(symptoms: string[], age?: number, gender?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/symptoms/analyze`, {
      symptoms,
      age,
      gender
    });
  }

  // ========== BLOOD TEST ANALYSIS ==========
  analyzeBloodTest(testResults: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/lab-results/analyze`, {
      test_results: testResults
    });
  }

  // ========== FIRST AID ==========
  getFirstAidGuidance(emergency: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/emergency/guidance`, {
      emergency
    });
  }

  // ========== DOCTOR ASSISTANT ==========
  getDoctorAssistance(task: string, patientData?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/doctor/recommend`, {
      patient_need: task,
      patient_data: patientData
    });
  }

  // ========== PRESCRIPTION ANALYSIS ==========
  analyzePrescription(medications: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/medications/review`, {
      medications
    });
  }

  // ========== HEALTH MONITORING ==========
  analyzeHealthMetrics(healthMetrics: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/health-metrics/analyze`, {
      health_metrics: healthMetrics
    });
  }

  // ========== APPOINTMENT ASSISTANT ==========
  getAppointmentAssistance(request: string, availableDoctors?: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/doctor/recommend`, {
      patient_need: request,
      available_doctors: availableDoctors
    });
  }

  // ========== GET AVAILABLE FEATURES ==========
  getAvailableFeatures(): Observable<any> {
    return this.http.get(`${this.apiUrl}/features`);
  }
}
