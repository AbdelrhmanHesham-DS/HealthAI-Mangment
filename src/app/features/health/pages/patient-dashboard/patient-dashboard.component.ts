import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HealthNavbarComponent } from '../../components/health-navbar/health-navbar.component';
import { HealthAIPanelComponent } from '../../components/healthai-panel/healthai-panel.component';
import { HealthDataService } from '../../services/health-data.service';
import { AuthService } from '../../../../core/Auth/services/auth-service.service';
import { MedicalRecord, Notification } from '../../models/health.models';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, HealthNavbarComponent, HealthAIPanelComponent],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css'
})
export class PatientDashboardComponent implements OnInit {
  activeTab = signal<'appointments' | 'records' | 'notifications' | 'cases' | 'ai'>('appointments');
  records = signal<MedicalRecord[]>([]);
  notifications = signal<Notification[]>([]);
  cases = signal<any[]>([]);

  upcomingApts = computed(() =>
    this.dataService.appointments().filter(a => a.status === 'upcoming')
  );
  completedApts = computed(() =>
    this.dataService.appointments().filter(a => a.status === 'completed')
  );
  unreadNotifs = computed(() =>
    this.notifications().filter(n => !n.read)
  );

  constructor(public auth: AuthService, public dataService: HealthDataService) {}

  activeCall = signal<any>(null);

  ngOnInit() {
    this.dataService.getAppointments().subscribe();
    this.dataService.getMedicalRecords().subscribe(r => this.records.set(r));
    this.dataService.getNotifications().subscribe(n => {
      this.notifications.set(n);
      this.dataService.notifications.set(n);
    });
    this.dataService.getCases().subscribe({ next: c => this.cases.set(c), error: () => {} });
  }

  markRead(id: string) {
    this.dataService.markNotificationRead(id).subscribe(() => {
      this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
    });
  }

  notifIcon(type: string) {
    const map: Record<string, string> = { appointment: 'fa-calendar-check', message: 'fa-comment-medical', system: 'fa-circle-info', reminder: 'fa-bell' };
    return map[type] || 'fa-bell';
  }
  notifColor(type: string) {
    const map: Record<string, string> = { appointment: '#6366f1', message: '#10b981', system: '#06b6d4', reminder: '#f59e0b' };
    return map[type] || '#6366f1';
  }
  typeIcon(type: string) {
    return type === 'video' ? 'fa-video' : type === 'chat' ? 'fa-comment-medical' : 'fa-hospital';
  }
  getDoctorId(apt: any): string {
    if (!apt.doctorId) return '';
    if (typeof apt.doctorId === 'string') return apt.doctorId;
    return apt.doctorId._id || apt.doctorId.id || '';
  }

  deleteCase(id: string) {
    this.dataService.deleteCase(id).subscribe({
      next: () => this.cases.update(list => list.filter(c => c.id !== id)),
    });
  }

  urgencyColor(u?: string) {
    return u === 'emergency' ? '#ef4444' : u === 'high' ? '#f59e0b' : u === 'medium' ? '#6366f1' : '#10b981';
  }
  urgencyLabel(u?: string) {
    return u === 'emergency' ? '🚨 Emergency' : u === 'high' ? '⚠️ Urgent' : u === 'medium' ? '🟡 See Doctor Soon' : '🟢 Non-Urgent';
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
