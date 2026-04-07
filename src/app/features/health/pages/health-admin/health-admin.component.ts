import { Component, signal, OnInit, AfterViewInit, ViewChild, ElementRef, PLATFORM_ID, Inject, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HealthNavbarComponent } from '../../components/health-navbar/health-navbar.component';
import { HealthDataService } from '../../services/health-data.service';
import { AdminStats, Doctor, Appointment } from '../../models/health.models';
import { AuthService } from '../../../../core/Auth/services/auth-service.service';

@Component({
  selector: 'app-health-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, HealthNavbarComponent],
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
  isSidebarOpen   = signal(true);

  navItems = [
    { id: 'overview',  icon: 'fa-chart-pie',      label: 'Overview' },
    { id: 'patients',  icon: 'fa-users',           label: 'Patients' },
    { id: 'doctors',   icon: 'fa-user-doctor',     label: 'Doctors' },
    { id: 'pending',   icon: 'fa-clock',           label: 'Pending Doctors' },
    { id: 'appointments', icon: 'fa-calendar-check', label: 'Appointments' },
    { id: 'analytics', icon: 'fa-chart-line',      label: 'Analytics' },
  ];

  activeLabel = computed(() => this.navItems.find(n => n.id === this.activeNav())?.label ?? '');

  constructor(public dataService: HealthDataService, public auth: AuthService, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    this.dataService.getAdminStats().subscribe(s => this.stats.set(s));
    this.dataService.getDoctors().subscribe(d => this.doctors.set(d));
    this.dataService.getAdminUsers('patient').subscribe(p => this.patients.set(p));
    this.dataService.getAllAppointments().subscribe(a => {
      this.allAppointments.set(a);
      this.dataService.appointments.set(a);
    });
    this.dataService.getPendingDoctors().subscribe(d => this.pendingDoctors.set(d));
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) setTimeout(() => this.renderChart(), 300);
  }

  setNav(id: string) {
    this.activeNav.set(id);
    if (id === 'analytics' && isPlatformBrowser(this.platformId)) setTimeout(() => this.renderChart(), 200);
  }

  approve(id: string) {
    this.dataService.approveDoctor(id).subscribe(() => {
      this.pendingDoctors.update(list => list.filter(d => d.id !== id));
      this.dataService.getAdminStats().subscribe(s => this.stats.set(s));
    });
  }

  reject(id: string) {
    this.dataService.rejectDoctor(id).subscribe(() => {
      this.pendingDoctors.update(list => list.filter(d => d.id !== id));
    });
  }

  deleteUser(id: string) {
    this.dataService.deleteUser(id).subscribe(() => {
      this.patients.update(list => list.filter(p => p.id !== id));
    });
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
