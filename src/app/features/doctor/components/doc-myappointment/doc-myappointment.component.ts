import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API = 'http://localhost:3000/api';

@Pipe({ name: 'apCount', standalone: true })
export class ApCountPipe implements PipeTransform {
  transform(apts: any[], status: string): number {
    return apts.filter(a => a.status === status).length;
  }
}

@Component({
  selector: 'app-doc-myappointment',
  standalone: true,
  imports: [CommonModule, FormsModule, ApCountPipe],
  templateUrl: './doc-myappointment.component.html',
  styleUrls: ['./doc-myappointment.component.css']
})
export class DocMyappointmentComponent implements OnInit {
  private http = inject(HttpClient);

  appointments: any[] = [];
  filteredAppointments: any[] = [];
  searchTerm = '';
  showDetailsModal = false;
  selectedAppointment: any = null;
  isLoading = true;

  ngOnInit() { this.loadAppointments(); }

  loadAppointments() {
    this.isLoading = true;
    this.http.get<any[]>(`${API}/appointments`).subscribe({
      next: apts => {
        this.appointments = apts;
        this.filteredAppointments = [...apts];
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  filterPatients() {
    const t = this.searchTerm.toLowerCase();
    this.filteredAppointments = this.appointments.filter(a =>
      (a.patientName || '').toLowerCase().includes(t) ||
      (a.reason || '').toLowerCase().includes(t)
    );
  }

  openDetailsModal(apt: any) { this.selectedAppointment = apt; this.showDetailsModal = true; }
  closeDetailsModal() { this.showDetailsModal = false; this.selectedAppointment = null; }

  updateStatus(apt: any, status: string) {
    this.http.put(`${API}/appointments/${apt.id}/status`, { status }).subscribe(() => {
      apt.status = status;
    });
  }
}
