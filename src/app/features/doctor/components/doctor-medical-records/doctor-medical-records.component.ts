import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

const API = 'http://localhost:3000/api';

@Component({
  selector: 'app-doctor-medical-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-medical-records.component.html',
  styleUrls: ['./doctor-medical-records.component.css']
})
export class DoctorMedicalRecordsComponent implements OnInit {
  private http = inject(HttpClient);

  searchTerm = '';
  isLoading = signal(true);
  records: any[] = [];
  editedRecordIndex: number | null = null;
  editedRecord: any = {};

  showAddForm = false;
  newRecord = { title: '', type: 'diagnosis', description: '', doctor: '', date: '', patientId: '' };

  recordTypes = ['diagnosis', 'prescription', 'lab', 'imaging', 'vaccination'];

  ngOnInit() {
    this.loadRecords();
  }

  loadRecords() {
    this.isLoading.set(true);
    this.http.get<any[]>(`${API}/records`).subscribe({
      next: r => { this.records = r; this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  get filteredRecords() {
    if (!this.searchTerm) return this.records;
    const term = this.searchTerm.toLowerCase();
    return this.records.filter(r =>
      (r.title || '').toLowerCase().includes(term) ||
      (r.doctor || '').toLowerCase().includes(term) ||
      (r.type || '').toLowerCase().includes(term)
    );
  }

  addRecord() {
    if (!this.newRecord.title || !this.newRecord.type || !this.newRecord.doctor || !this.newRecord.date) return;
    this.http.post<any>(`${API}/records`, this.newRecord).subscribe({
      next: r => {
        this.records.unshift(r);
        this.showAddForm = false;
        this.newRecord = { title: '', type: 'diagnosis', description: '', doctor: '', date: '', patientId: '' };
      },
    });
  }

  editRecord(index: number) {
    this.editedRecordIndex = index;
    this.editedRecord = { ...this.records[index] };
  }

  saveRecord(index: number) {
    const id = this.records[index].id;
    this.http.put<any>(`${API}/records/${id}`, this.editedRecord).subscribe({
      next: r => {
        this.records[index] = r;
        this.editedRecordIndex = null;
      },
    });
  }

  cancelEdit() {
    this.editedRecordIndex = null;
  }

  deleteRecord(index: number) {
    const id = this.records[index].id;
    this.http.delete(`${API}/records/${id}`).subscribe({
      next: () => this.records.splice(index, 1),
    });
  }
}
