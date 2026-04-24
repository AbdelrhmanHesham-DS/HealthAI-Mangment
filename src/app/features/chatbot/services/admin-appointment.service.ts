import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  photo: string;
  rating: number;
  consultationFee: number;
  availability: any[];
  clinicName: string;
  address: string;
}

export interface AdminAppointmentRequest {
  doctorId: string;
  date: string;
  time: string;
  slotId?: string;
  type?: string;
  reason?: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: string;
  fee: number;
  clinicName?: string;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAppointmentService {
  private http = inject(HttpClient);

  getDoctorList(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${API}/doctors`);
  }

  getDoctorAvailability(doctorId: string): Observable<any> {
    return this.http.get<any>(`${API}/doctors/${doctorId}/availability`);
  }

  bookAdminAppointment(appointmentData: AdminAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${API}/appointments/admin`, appointmentData);
  }
}
