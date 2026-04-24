import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HealthNavbarComponent } from '../../components/health-navbar/health-navbar.component';
import { HealthDataService } from '../../services/health-data.service';
import { AuthService } from '../../../../core/Auth/services/auth-service.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HealthNavbarComponent],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.css'
})
export class DoctorDashboardComponent implements OnInit {
  activeNav = signal('overview');
  
  // Stats
  totalAppointments = signal(0);
  completedAppointments = signal(0);
  upcomingAppointments = signal(0);
  totalPatients = signal(0);
  averageRating = signal(0);
  totalReviews = signal(0);
  
  // Data
  appointments = signal<any[]>([]);
  patients = signal<any[]>([]);
  reviews = signal<any[]>([]);
  earnings = signal(0);
  
  // UI State
  isSidebarOpen = signal(true);
  searchQuery = signal('');
  filterStatus = signal('');
  
  // Modals
  showAppointmentModal = signal(false);
  showPatientModal = signal(false);
  showPrescriptionModal = signal(false);
  activeCall = signal<any>(null);
  
  // Forms
  appointmentForm = signal<any>({
    patientId: '',
    date: '',
    time: '',
    type: 'video',
    reason: '',
    notes: ''
  });
  
  prescriptionForm = signal<any>({
    patientId: '',
    appointmentId: '',
    medications: '',
    dosage: '',
    duration: '',
    instructions: ''
  });
  
  navItems = [
    { id: 'overview', icon: 'fa-chart-pie', label: 'Overview' },
    { id: 'appointments', icon: 'fa-calendar-check', label: 'Appointments' },
    { id: 'video-calls', icon: 'fa-video', label: 'Video Calls' },
    { id: 'patients', icon: 'fa-users', label: 'My Patients' },
    { id: 'prescriptions', icon: 'fa-prescription-bottle', label: 'Prescriptions' },
    { id: 'earnings', icon: 'fa-wallet', label: 'Earnings' },
    { id: 'reviews', icon: 'fa-star', label: 'Reviews' },
    { id: 'schedule', icon: 'fa-clock', label: 'Schedule' },
    { id: 'profile', icon: 'fa-user', label: 'Profile' }
  ];
  
  activeLabel = computed(() => this.navItems.find(n => n.id === this.activeNav())?.label ?? '');
  
  filteredAppointments = computed(() => {
    let list = this.appointments();
    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      list = list.filter(a => 
        a.patientName?.toLowerCase().includes(q) ||
        a.patientEmail?.toLowerCase().includes(q)
      );
    }
    if (this.filterStatus()) {
      list = list.filter(a => a.status === this.filterStatus());
    }
    return list;
  });

  videoCalls = computed(() => {
    return this.appointments().filter(a => a.type === 'video' && a.status === 'upcoming');
  });

  constructor(
    public dataService: HealthDataService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Load doctor's appointments
    this.dataService.getDoctorAppointments().subscribe(apts => {
      this.appointments.set(apts);
      this.totalAppointments.set(apts.length);
      this.completedAppointments.set(apts.filter(a => a.status === 'completed').length);
      this.upcomingAppointments.set(apts.filter(a => a.status === 'upcoming').length);
      
      // Calculate earnings
      const completed = apts.filter(a => a.status === 'completed');
      const total = completed.reduce((sum, a) => sum + (a.fee || 0), 0);
      this.earnings.set(total);
    });
    
    // Load doctor's patients
    this.dataService.getDoctorPatients().subscribe(patients => {
      this.patients.set(patients);
      this.totalPatients.set(patients.length);
    });
    
    // Load doctor's reviews
    this.dataService.getDoctorReviews().subscribe(reviews => {
      this.reviews.set(reviews);
      this.totalReviews.set(reviews.length);
      
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        this.averageRating.set(Math.round(avgRating * 10) / 10);
      }
    });
  }

  setNav(id: string) {
    this.activeNav.set(id);
  }

  // Appointment Management
  openAppointmentModal() {
    this.showAppointmentModal.set(true);
  }

  closeAppointmentModal() {
    this.showAppointmentModal.set(false);
    this.appointmentForm.set({
      patientId: '',
      date: '',
      time: '',
      type: 'video',
      reason: '',
      notes: ''
    });
  }

  saveAppointment() {
    const form = this.appointmentForm();
    if (!form.patientId || !form.date || !form.time) {
      alert('Please fill in all required fields');
      return;
    }

    this.dataService.createAppointment(form).subscribe({
      next: () => {
        alert('Appointment created successfully');
        this.closeAppointmentModal();
        this.loadData();
      },
      error: (err) => alert('Error creating appointment: ' + err.message)
    });
  }

  updateAppointmentStatus(appointmentId: string, status: string) {
    this.dataService.updateAppointmentStatus(appointmentId, status).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => alert('Error updating appointment: ' + err.message)
    });
  }

  // Prescription Management
  openPrescriptionModal(appointmentId: string, patientId: string) {
    this.prescriptionForm.set({
      patientId,
      appointmentId,
      medications: '',
      dosage: '',
      duration: '',
      instructions: ''
    });
    this.showPrescriptionModal.set(true);
  }

  closePrescriptionModal() {
    this.showPrescriptionModal.set(false);
  }

  savePrescription() {
    const form = this.prescriptionForm();
    if (!form.medications || !form.dosage || !form.duration) {
      alert('Please fill in all required fields');
      return;
    }

    this.dataService.createPrescription(form).subscribe({
      next: () => {
        alert('Prescription created successfully');
        this.closePrescriptionModal();
        this.loadData();
      },
      error: (err) => alert('Error creating prescription: ' + err.message)
    });
  }

  // Patient Management
  openPatientModal() {
    this.showPatientModal.set(true);
  }

  closePatientModal() {
    this.showPatientModal.set(false);
  }

  // Schedule Management
  updateSchedule(dayOfWeek: string, startTime: string, endTime: string) {
    this.dataService.updateDoctorSchedule({
      dayOfWeek,
      startTime,
      endTime
    }).subscribe({
      next: () => {
        alert('Schedule updated successfully');
        this.loadData();
      },
      error: (err) => alert('Error updating schedule: ' + err.message)
    });
  }

  // Review Management
  deleteReview(reviewId: string) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    this.dataService.deleteReview(reviewId).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => alert('Error deleting review: ' + err.message)
    });
  }

  // Export
  exportAppointments() {
    window.open(this.dataService.exportDoctorAppointments(), '_blank');
  }

  exportEarnings() {
    window.open(this.dataService.exportDoctorEarnings(), '_blank');
  }

  joinCall(apt: any) {
    this.activeCall.set({
      apt,
      url: `https://meet.jit.si/${apt.id}-${this.auth.currentUser?.id}`
    });
  }

  endCall() {
    this.activeCall.set(null);
  }
}
