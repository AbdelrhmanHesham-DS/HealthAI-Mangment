import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  specialtyKey: string;
  avatar: string;
  photo: string;
  rating: number;
  reviewCount: number;
  experience: number;
  city: string;
  location: string;
  address: string;
  languages: string[];
  bio: string;
  consultationFee: number;
  nextAvailable: string;
  verified: boolean;
  online: boolean;
  waitTime: string;
  insurances: string[];
  education: string[];
  clinicName: string;
  availability: any[];
}

export interface DoctorAvailability {
  doctorId: string;
  name: string;
  availability: any[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  patientName: string;
  patientAvatar: string;
  visitType: string;
  createdAt: string;
}

export interface DoctorProfile extends Doctor {
  reviews?: Review[];
}

@Injectable({
  providedIn: 'root'
})
export class PatientDoctorService {
  private http = inject(HttpClient);

  getDoctorList(filters?: any): Observable<Doctor[]> {
    let url = `${API}/doctors`;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.query) params.append('query', filters.query);
      if (filters.specialty) params.append('specialty', filters.specialty);
      if (filters.minRating) params.append('minRating', filters.minRating);
      if (filters.city) params.append('city', filters.city);
      const queryString = params.toString();
      if (queryString) url += '?' + queryString;
    }
    return this.http.get<Doctor[]>(url);
  }

  getDoctorProfile(doctorId: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${API}/doctors/${doctorId}`);
  }

  getDoctorAvailability(doctorId: string): Observable<DoctorAvailability> {
    return this.http.get<DoctorAvailability>(`${API}/doctors/${doctorId}/availability`);
  }

  getDoctorReviews(doctorId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${API}/doctors/${doctorId}/reviews`);
  }

  bookAppointment(appointmentData: any): Observable<any> {
    return this.http.post(`${API}/appointments`, appointmentData);
  }

  submitReview(reviewData: any): Observable<any> {
    return this.http.post(`${API}/reviews`, reviewData);
  }
}
