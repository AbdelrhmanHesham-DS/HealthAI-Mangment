import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface Appointment {
  id: string;
  date: string;
  time: string;
  doctorName: string;
  doctorSpecialty: string;
  status: string;
  reason: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientServicesService {
  private http = inject(HttpClient);

  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${API}/appointments`);
  }

  getAppointment(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${API}/appointments/${id}`);
  }

  cancelAppointment(id: string): Observable<any> {
    return this.http.put(`${API}/appointments/${id}/cancel`, {});
  }
}
