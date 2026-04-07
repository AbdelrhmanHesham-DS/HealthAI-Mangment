import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

const API = 'http://localhost:3000/api';

@Component({
  selector: 'app-doc-patient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doc-patient.component.html',
  styleUrl: './doc-patient.component.css'
})
export class DocPatientComponent implements OnInit {
  private http = inject(HttpClient);

  searchTerm = '';
  selectedPatient: any = null;
  isLoading = signal(true);

  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' = 'info';

  // Unique patients derived from appointments
  patients: any[] = [];
  filteredPatients: any[] = [];

  ngOnInit() {
    this.http.get<any[]>(`${API}/appointments`).subscribe({
      next: apts => {
        // Deduplicate patients by patientId
        const seen = new Set<string>();
        this.patients = apts
          .filter(a => {
            const pid = a.patientId?._id || a.patientId;
            if (seen.has(pid)) return false;
            seen.add(pid);
            return true;
          })
          .map(a => ({
            id: a.patientId?._id || a.patientId,
            name: a.patientName || a.patientId?.name || 'Unknown',
            email: a.patientId?.email || '',
            phone: a.patientId?.phone || '',
            lastVisit: a.date,
            reason: a.reason,
          }));
        this.filteredPatients = [...this.patients];
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  filterPatients() {
    const term = this.searchTerm.toLowerCase();
    this.filteredPatients = this.patients.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.email || '').toLowerCase().includes(term)
    );
  }

  viewPatient(patient: any) {
    this.selectedPatient = patient;
  }

  closePatient() {
    this.selectedPatient = null;
  }

  displayAlert(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 4000);
  }
}
