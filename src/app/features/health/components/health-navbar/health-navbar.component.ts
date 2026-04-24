import { Component, signal, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../../core/services/theme.service';
import { HealthDataService } from '../../services/health-data.service';
import { AuthService } from '../../../../core/Auth/services/auth-service.service';
import { RealtimeService } from '../../../../core/services/realtime.service';

@Component({
  selector: 'app-health-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './health-navbar.component.html',
  styleUrl: './health-navbar.component.css'
})
export class HealthNavbarComponent implements OnInit {
  isScrolled   = signal(false);
  isMobileOpen = signal(false);
  showUserMenu = signal(false);
  toastMsg     = signal<string | null>(null);

  navLinks = [
    { label: 'Home',           path: '/health' },
    { label: 'Find Doctors',   path: '/health/doctors' },
    { label: 'MediAI Chat',    path: '/chatbot/advanced' },
    { label: 'Hospitals',      path: '/health/hospitals' },
    { label: 'Health Tracker', path: '/health/health-tracker' },
    { label: 'Appointments',   path: '/health/appointments' },
  ];

  constructor(
    public theme: ThemeService,
    public dataService: HealthDataService,
    public auth: AuthService,
    private realtime: RealtimeService,
  ) {}

  ngOnInit() {
    // Connect socket when user is logged in
    if (this.auth.isAuthenticated()) {
      this.realtime.connect();
      // Show toast on incoming real-time notification
      this.realtime.notification$.subscribe(n => {
        this.toastMsg.set(n.title + ': ' + n.message);
        setTimeout(() => this.toastMsg.set(null), 5000);
      });
    }
  }

  @HostListener('window:scroll')
  onScroll() { this.isScrolled.set(window.scrollY > 20); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.closest('.hn-user-menu-wrap')) this.showUserMenu.set(false);
  }

  get unreadCount(): number {
    return this.dataService.notifications().filter(n => !n.read).length;
  }

  get userInitials(): string {
    const name = this.auth.currentUser?.name || '';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
