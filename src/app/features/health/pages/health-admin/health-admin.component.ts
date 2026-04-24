import { Component, signal, OnInit, AfterViewInit, ViewChild, ElementRef, PLATFORM_ID, Inject, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HealthNavbarComponent } from '../../components/health-navbar/health-navbar.component';
import { HealthDataService } from '../../services/health-data.service';
import { AdminStats, Doctor, Appointment } from '../../models/health.models';
import { AuthService } from '../../../../core/Auth/services/auth-service.service';

@Component({
  selector: 'app-health-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HealthNavbarComponent],
  templateUrl: './health-admin.component.html',
  styleUrl: './health-admin.component.css'
})
export class HealthAdminComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  activeNav = signal('overview');
  stats     = signal<AdminStats | null>(null);
  doctors   = signal<Doctor[]>([]);
  patients  = signal<any[]>([]);
  allAppointments = signal<Appointment[]>([]);
  pendingDoctors  = signal<any[]>([]);
  reviews   = signal<any[]>([]);
  activityLogs = signal<any[]>([]);
  isSidebarOpen   = signal(true);
  
  // Analytics data
  revenueAnalytics = signal<any>(null);
  appointmentAnalytics = signal<any>(null);
  doctorAnalytics = signal<any[]>([]);
  patientAnalytics = signal<any>(null);
  
  // Edit modals
  editingUser = signal<any | null>(null);
  showEditModal = signal(false);
  editForm = signal<any>({});
  
  // Bulk selection
  selectedUsers = signal<string[]>([]);
  
  // Search & Filter
  searchQuery = signal('');
  filterSpecialty = signal('');
  filterStatus = signal('');
  
  // Notification modal
  showNotificationModal = signal(false);
  notificationForm = signal({ title: '', message: '', role: 'all', type: 'system' });
  
  // Activity logs modal
  showActivityLogsModal = signal(false);
  
  // Appointment modal
  showAppointmentModal = signal(false);
  editingAppointment = signal<any | null>(null);
  appointmentForm = signal<any>({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    type: 'video',
    reason: '',
    notes: '',
    fee: 0
  });
  
  // Admin info for self-booking
  adminId = computed(() => this.auth.currentUser?.id || '');

  navItems = [
    { id: 'overview',  icon: 'fa-chart-pie',      label: 'Overview' },
    { id: 'patients',  icon: 'fa-users',           label: 'Patients' },
    { id: 'doctors',   icon: 'fa-user-doctor',     label: 'Doctors' },
    { id: 'pending',   icon: 'fa-clock',           label: 'Pending Doctors' },
    { id: 'appointments', icon: 'fa-calendar-check', label: 'Appointments' },
    { id: 'reviews',   icon: 'fa-star',            label: 'Reviews' },
    { id: 'analytics', icon: 'fa-chart-line',      label: 'Analytics' },
    { id: 'notifications', icon: 'fa-bell',        label: 'Notifications' },
    { id: 'activity',  icon: 'fa-history',         label: 'Activity Logs' },
  ];

  activeLabel = computed(() => this.navItems.find(n => n.id === this.activeNav())?.label ?? '');
  
  filteredPatients = computed(() => {
    let list = this.patients();
    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      list = list.filter(p => 
        p.name?.toLowerCase().includes(q) || 
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
      );
    }
    return list;
  });
  
  filteredDoctors = computed(() => {
    let list = this.doctors();
    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      list = list.filter(d => 
        d.name?.toLowerCase().includes(q) || 
        d.specialty?.toLowerCase().includes(q)
      );
    }
    if (this.filterSpecialty()) {
      list = list.filter(d => d.specialty === this.filterSpecialty());
    }
    return list;
  });

  constructor(public dataService: HealthDataService, public auth: AuthService, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dataService.getAdminStats().subscribe(s => this.stats.set(s));
    this.dataService.getDoctors().subscribe(d => this.doctors.set(d));
    this.dataService.getAdminUsers('patient').subscribe(p => this.patients.set(p));
    this.dataService.getAllAppointments().subscribe(a => {
      this.allAppointments.set(a);
      this.dataService.appointments.set(a);
    });
    this.dataService.getPendingDoctors().subscribe(d => this.pendingDoctors.set(d));
    this.dataService.getAllReviews().subscribe(r => this.reviews.set(r));
    this.loadAnalytics();
  }
  
  loadAnalytics() {
    this.dataService.getRevenueAnalytics('month').subscribe(data => this.revenueAnalytics.set(data));
    this.dataService.getAppointmentAnalytics().subscribe(data => this.appointmentAnalytics.set(data));
    this.dataService.getDoctorAnalytics().subscribe(data => this.doctorAnalytics.set(data));
    this.dataService.getPatientAnalytics().subscribe(data => this.patientAnalytics.set(data));
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) setTimeout(() => this.renderChart(), 300);
  }

  setNav(id: string) {
    this.activeNav.set(id);
    if (id === 'analytics' && isPlatformBrowser(this.platformId)) setTimeout(() => this.renderChart(), 200);
    if (id === 'activity') this.loadActivityLogs();
  }
  
  loadActivityLogs() {
    this.dataService.getActivityLogs({ limit: 50 }).subscribe(data => {
      this.activityLogs.set(data.logs || []);
    });
  }

  approve(id: string) {
    this.dataService.approveDoctor(id).subscribe(() => {
      this.pendingDoctors.update(list => list.filter(d => d.id !== id));
      this.loadData();
    });
  }

  reject(id: string) {
    this.dataService.rejectDoctor(id).subscribe(() => {
      this.pendingDoctors.update(list => list.filter(d => d.id !== id));
    });
  }

  deleteUser(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.dataService.deleteUser(id).subscribe(() => {
      this.patients.update(list => list.filter(p => p.id !== id));
      this.doctors.update(list => list.filter(d => d.id !== id));
      this.loadData();
    });
  }

  deleteReview(id: string) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    this.dataService.deleteReview(id).subscribe(() => {
      this.reviews.update(list => list.filter(r => r.id !== id));
      this.loadData();
    });
  }

  openEditModal(user: any) {
    this.editingUser.set(user);
    const formData = { ...user };
    
    // Convert arrays to comma-separated strings for easier editing
    if (user.education && Array.isArray(user.education)) {
      formData.educationText = user.education.join(', ');
    }
    if (user.languages && Array.isArray(user.languages)) {
      formData.languagesText = user.languages.join(', ');
    }
    
    this.editForm.set(formData);
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.editingUser.set(null);
    this.editForm.set({});
  }

  saveUserEdit() {
    const userId = this.editingUser()?.id;
    if (!userId) return;

    const formData = { ...this.editForm() };
    
    // Convert comma-separated strings back to arrays
    if (formData.educationText) {
      formData.education = formData.educationText.split(',').map((s: string) => s.trim()).filter((s: string) => s);
      delete formData.educationText;
    }
    if (formData.languagesText) {
      formData.languages = formData.languagesText.split(',').map((s: string) => s.trim()).filter((s: string) => s);
      delete formData.languagesText;
    }
    
    // Remove password if empty
    if (!formData.password || formData.password.trim() === '') {
      delete formData.password;
    }

    this.dataService.updateAdminUser(userId, formData).subscribe({
      next: (updatedUser) => {
        if (updatedUser.role === 'patient') {
          this.patients.update(list => list.map(p => p.id === userId ? updatedUser : p));
        } else if (updatedUser.role === 'doctor') {
          this.doctors.update(list => list.map(d => d.id === userId ? updatedUser : d));
        }
        this.closeEditModal();
        this.loadData();
        alert('User updated successfully');
      },
      error: (err) => alert('Error updating user: ' + (err.error?.message || err.message))
    });
  }

  updateAppointmentStatus(id: string, status: string) {
    this.dataService.updateAppointmentStatus(id, status).subscribe(() => {
      this.allAppointments.update(list => 
        list.map(a => a.id === id ? { ...a, status: status as any } : a)
      );
      this.dataService.appointments.update(list => 
        list.map(a => a.id === id ? { ...a, status: status as any } : a)
      );
      this.loadData();
    });
  }
  
  // Appointment Management
  openAppointmentModal(appointment?: any) {
    if (appointment) {
      // Edit mode
      this.editingAppointment.set(appointment);
      this.appointmentForm.set({
        patientId: appointment.patientId?._id || appointment.patientId,
        doctorId: appointment.doctorId?._id || appointment.doctorId,
        date: appointment.date,
        time: appointment.time,
        type: appointment.type,
        reason: appointment.reason || '',
        notes: appointment.notes || '',
        fee: appointment.fee || 0
      });
    } else {
      // Create mode
      this.editingAppointment.set(null);
      this.appointmentForm.set({
        patientId: '',
        doctorId: '',
        date: '',
        time: '',
        type: 'video',
        reason: '',
        notes: '',
        fee: 0
      });
    }
    this.showAppointmentModal.set(true);
  }
  
  closeAppointmentModal() {
    this.showAppointmentModal.set(false);
    this.editingAppointment.set(null);
    this.appointmentForm.set({
      patientId: '',
      doctorId: '',
      date: '',
      time: '',
      type: 'video',
      reason: '',
      notes: '',
      fee: 0
    });
  }
  
  saveAppointment() {
    const form = this.appointmentForm();
    
    if (!form.patientId || !form.doctorId || !form.date || !form.time) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (this.editingAppointment()) {
      // Update existing appointment
      const id = this.editingAppointment().id;
      this.dataService.updateAppointment(id, form).subscribe({
        next: (updated) => {
          this.allAppointments.update(list => 
            list.map(a => a.id === id ? updated : a)
          );
          this.dataService.appointments.update(list => 
            list.map(a => a.id === id ? updated : a)
          );
          this.closeAppointmentModal();
          this.loadData();
          alert('Appointment updated successfully');
        },
        error: (err) => alert('Error updating appointment: ' + (err.error?.message || err.message))
      });
    } else {
      // Create new appointment
      this.dataService.createAppointment(form).subscribe({
        next: (newAppointment) => {
          this.allAppointments.update(list => [newAppointment, ...list]);
          this.dataService.appointments.update(list => [newAppointment, ...list]);
          this.closeAppointmentModal();
          this.loadData();
          alert('Appointment created successfully');
        },
        error: (err) => alert('Error creating appointment: ' + (err.error?.message || err.message))
      });
    }
  }
  
  deleteAppointmentConfirm(id: string) {
    if (!confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) return;
    
    this.dataService.deleteAppointment(id).subscribe({
      next: () => {
        this.allAppointments.update(list => list.filter(a => a.id !== id));
        this.dataService.appointments.update(list => list.filter(a => a.id !== id));
        this.loadData();
        alert('Appointment deleted successfully');
      },
      error: (err) => alert('Error deleting appointment: ' + (err.error?.message || err.message))
    });
  }
  
  // Bulk operations
  toggleUserSelection(id: string) {
    this.selectedUsers.update(list => 
      list.includes(id) ? list.filter(i => i !== id) : [...list, id]
    );
  }
  
  selectAllUsers(users: any[]) {
    this.selectedUsers.set(users.map(u => u.id));
  }
  
  clearSelection() {
    this.selectedUsers.set([]);
  }
  
  bulkApprove() {
    if (this.selectedUsers().length === 0) return;
    if (!confirm(`Approve ${this.selectedUsers().length} doctors?`)) return;
    
    this.dataService.bulkApproveDoctors(this.selectedUsers()).subscribe(() => {
      this.loadData();
      this.clearSelection();
    });
  }
  
  bulkReject() {
    if (this.selectedUsers().length === 0) return;
    if (!confirm(`Reject ${this.selectedUsers().length} doctors?`)) return;
    
    this.dataService.bulkRejectDoctors(this.selectedUsers()).subscribe(() => {
      this.loadData();
      this.clearSelection();
    });
  }
  
  bulkDelete() {
    if (this.selectedUsers().length === 0) return;
    if (!confirm(`Delete ${this.selectedUsers().length} users? This cannot be undone.`)) return;
    
    this.dataService.bulkDeleteUsers(this.selectedUsers()).subscribe(() => {
      this.loadData();
      this.clearSelection();
    });
  }
  
  // Notifications
  openNotificationModal() {
    this.showNotificationModal.set(true);
  }
  
  closeNotificationModal() {
    this.showNotificationModal.set(false);
    this.notificationForm.set({ title: '', message: '', role: 'all', type: 'system' });
  }
  
  sendBroadcast() {
    const form = this.notificationForm();
    if (!form.title || !form.message) {
      alert('Please fill in all fields');
      return;
    }
    
    const role = form.role === 'all' ? undefined : form.role;
    this.dataService.broadcastNotification(form.title, form.message, role, form.type).subscribe({
      next: () => {
        alert('Notification sent successfully');
        this.closeNotificationModal();
      },
      error: (err) => alert('Error sending notification: ' + err.message)
    });
  }
  
  // Export
  exportUsersCSV(role?: string) {
    window.open(this.dataService.exportUsers(role), '_blank');
  }
  
  exportAppointmentsCSV() {
    window.open(this.dataService.exportAppointments(), '_blank');
  }

  private async renderChart() {
    if (!this.chartCanvas) return;
    try {
      const { Chart, registerables } = await import('chart.js/auto');
      Chart.register(...registerables);
      const data = this.stats()?.chartData || [];
      new Chart(this.chartCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: data.map((_, i) => `Day ${i + 1}`),
          datasets: [{ label: 'Appointments', data, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)', borderWidth: 2.5, fill: true, tension: 0.4, pointBackgroundColor: '#6366f1', pointRadius: 4, pointHoverRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } } } } }
      });
    } catch {}
  }
}
