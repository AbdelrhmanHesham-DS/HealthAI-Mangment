import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  type: 'diagnosis' | 'prescription' | 'lab' | 'imaging' | 'vaccination';
  title: string;
  doctor: string;
  description: string;
  attachments: string[];
  tags: string[];
}

@Injectable({ providedIn: 'root' })
export class MedicalRecordsService {
  private http = inject(HttpClient);

  getRecords(): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecord[]>(`${API}/records`);
  }

  getRecord(id: string): Observable<MedicalRecord> {
    return this.http.get<MedicalRecord>(`${API}/records/${id}`);
  }

  addRecord(record: Partial<MedicalRecord>): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(`${API}/records`, record);
  }

  updateRecord(id: string, record: Partial<MedicalRecord>): Observable<MedicalRecord> {
    return this.http.put<MedicalRecord>(`${API}/records/${id}`, record);
  }

  deleteRecord(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API}/records/${id}`);
  }
}
